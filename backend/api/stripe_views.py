"""
Stripe payment views for theme purchases
"""
try:
    import stripe
    # Verify Stripe package is properly installed
    if not hasattr(stripe, 'checkout') or stripe.checkout is None:
        raise ImportError("Stripe package is not properly installed. stripe.checkout is None.")
except ImportError as e:
    stripe = None
    import logging
    logging.getLogger(__name__).error(f"Failed to import Stripe: {e}")
import json
import logging
import os
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Theme, ThemePurchase

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# Verify Stripe is configured
if not stripe.api_key:
    logger.warning("STRIPE_SECRET_KEY is not set. Stripe functionality will not work.")


@api_view(['POST'])
@permission_classes([AllowAny])
def create_checkout_session(request):
    """Create a Stripe Checkout session for a theme purchase"""
    # Log Stripe configuration status
    api_key_set = bool(stripe.api_key)
    api_key_preview = f"{stripe.api_key[:10]}..." if stripe.api_key else "None"
    logger.info(f"Stripe API key status: Set={api_key_set}, Preview={api_key_preview}")
    
    if not stripe.api_key:
        logger.error("STRIPE_SECRET_KEY is not set or empty")
        return Response(
            {'error': 'Stripe is not configured. STRIPE_SECRET_KEY is missing.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    try:
        theme_id = request.data.get('theme_id')
        customer_email = request.data.get('customer_email')
        customer_name = request.data.get('customer_name', '')
        
        if not theme_id or not customer_email:
            return Response(
                {'error': 'theme_id and customer_email are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the theme
        try:
            theme = Theme.objects.get(id=theme_id)
        except Theme.DoesNotExist:
            return Response(
                {'error': 'Theme not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Convert price to cents for Stripe
        amount_cents = int(float(theme.price) * 100)
        
        # Get the frontend URL for success/cancel redirects
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        
        # Get full image URL for Stripe
        image_url = None
        if theme.preview_image:
            if hasattr(theme.preview_image, 'url'):
                # Build absolute URL
                if request:
                    image_url = request.build_absolute_uri(theme.preview_image.url)
                else:
                    # Fallback
                    from django.conf import settings
                    if hasattr(settings, 'MEDIA_URL') and settings.MEDIA_URL.startswith('http'):
                        image_url = f"{settings.MEDIA_URL.rstrip('/')}/{theme.preview_image.name}"
                    else:
                        image_url = f"http://localhost:8000{theme.preview_image.url}"
        
        # Create Stripe Checkout Session
        line_item = {
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': theme.name,
                    'description': theme.description[:500],  # Limit description length
                },
                'unit_amount': amount_cents,
            },
            'quantity': 1,
        }
        
        if image_url:
            line_item['price_data']['product_data']['images'] = [image_url]
        
        # Debug: Check stripe module structure
        logger.info(f"stripe module type: {type(stripe)}")
        logger.info(f"stripe version: {getattr(stripe, '__version__', 'unknown')}")
        logger.info(f"hasattr(stripe, 'checkout'): {hasattr(stripe, 'checkout')}")
        if hasattr(stripe, 'checkout'):
            logger.info(f"stripe.checkout type: {type(stripe.checkout)}")
        
        # Check if checkout is None and try to access it differently
        if stripe.checkout is None:
            logger.error("stripe.checkout is None - Stripe package may not be installed correctly")
            return Response(
                {'error': 'Stripe package error. Please check backend logs.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Try to create session
        logger.info("Attempting to create Stripe checkout session...")
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[line_item],
            mode='payment',
            customer_email=customer_email,
            success_url=f'{frontend_url}/purchase/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{frontend_url}/purchase/cancel',
            metadata={
                'theme_id': str(theme.id),
                'customer_email': customer_email,
                'customer_name': customer_name,
            },
        )
        
        # Create a pending purchase record
        purchase = ThemePurchase.objects.create(
            theme=theme,
            customer_email=customer_email,
            customer_name=customer_name,
            stripe_session_id=session.id,
            amount_paid=theme.price,
            status='pending'
        )
        
        return Response({
            'session_id': session.id,
            'checkout_url': session.url,
        })
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {str(e)}")
        return Response(
            {'error': f'Payment processing error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        return Response(
            {'error': 'Failed to create checkout session'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """Handle Stripe webhook events"""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        # Invalid payload
        logger.error("Invalid payload in Stripe webhook")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        logger.error("Invalid signature in Stripe webhook")
        return HttpResponse(status=400)
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Update the purchase status
        try:
            purchase = ThemePurchase.objects.get(stripe_session_id=session['id'])
            purchase.status = 'completed'
            purchase.stripe_payment_intent_id = session.get('payment_intent')
            purchase.save()
            
            logger.info(f"Purchase completed for theme {purchase.theme.id} by {purchase.customer_email}")
            
            # TODO: Send download link email to customer
            # You can implement email sending here using Django's email functionality
            
        except ThemePurchase.DoesNotExist:
            logger.error(f"Purchase not found for session {session['id']}")
    
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        
        # Find purchase by payment intent ID
        try:
            purchase = ThemePurchase.objects.get(stripe_payment_intent_id=payment_intent['id'])
            purchase.status = 'failed'
            purchase.save()
            logger.info(f"Payment failed for purchase {purchase.id}")
        except ThemePurchase.DoesNotExist:
            logger.error(f"Purchase not found for payment intent {payment_intent['id']}")
    
    return HttpResponse(status=200)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_purchase_status(request):
    """Check the status of a purchase by session ID"""
    session_id = request.query_params.get('session_id')
    
    if not session_id:
        return Response(
            {'error': 'session_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        purchase = ThemePurchase.objects.get(stripe_session_id=session_id)
        return Response({
            'status': purchase.status,
            'theme_id': purchase.theme.id,
            'theme_name': purchase.theme.name,
            'download_file': purchase.theme.download_file.url if purchase.theme.download_file else None,
        })
    except ThemePurchase.DoesNotExist:
        return Response(
            {'error': 'Purchase not found'},
            status=status.HTTP_404_NOT_FOUND
        )
