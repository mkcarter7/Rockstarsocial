"""
Stripe payment views for theme purchases
"""
import stripe
# Force import checkout module to ensure it's loaded
# Try multiple ways to access the checkout module
stripe_checkout = None
try:
    # Method 1: Try direct import
    import stripe.checkout as stripe_checkout
except (ImportError, AttributeError):
    pass

if stripe_checkout is None:
    try:
        # Method 2: Try accessing via getattr
        stripe_checkout = getattr(stripe, 'checkout', None)
    except:
        pass

if stripe_checkout is None:
    try:
        # Method 3: Try importing the Session class directly
        from stripe.checkout import Session as CheckoutSession
        # Create a mock module-like object
        class CheckoutModule:
            Session = CheckoutSession
        stripe_checkout = CheckoutModule()
    except (ImportError, AttributeError):
        pass

import json
import logging
import os
from decimal import Decimal
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Theme, ThemePurchase, ThemePackage, ThemeOrder, BirthdayParty, HostAccount
from django.contrib.auth.hashers import make_password, check_password

logger = logging.getLogger(__name__)

# Initialize Stripe
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')

# Diagnostic logging at module load
logger.info(f"Stripe module loaded: {stripe}, file: {getattr(stripe, '__file__', 'unknown')}")
logger.info(f"stripe.checkout at module load: {getattr(stripe, 'checkout', 'NOT_FOUND')}")
logger.info(f"stripe_checkout (explicitly imported): {stripe_checkout}")

# Set Stripe API key
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')

# Verify Stripe is configured
if not stripe.api_key:
    logger.warning("STRIPE_SECRET_KEY is not set. Stripe functionality will not work.")

# Verify checkout module is available - check again after setting API key
if stripe_checkout is None:
    stripe_checkout = getattr(stripe, 'checkout', None)
    logger.warning(f"After setting API key, stripe_checkout: {stripe_checkout}")

if stripe_checkout is None:
    logger.error("Failed to import stripe.checkout module - this will cause errors!")
elif not hasattr(stripe_checkout, 'Session'):
    logger.error("stripe.checkout.Session is not available")


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
    
    # Verify stripe.checkout is available - use explicitly imported module if stripe.checkout is None
    checkout_module = getattr(stripe, 'checkout', None)
    logger.info(f"stripe.checkout type: {type(checkout_module)}, value: {checkout_module}")
    logger.info(f"stripe_checkout (explicitly imported) type: {type(stripe_checkout)}, value: {stripe_checkout}")
    
    # Use explicitly imported checkout module if stripe.checkout is None
    if checkout_module is None:
        logger.warning("stripe.checkout is None, using explicitly imported stripe_checkout module")
        checkout_module = stripe_checkout
    
    if checkout_module is None:
        logger.error("Both stripe.checkout and explicitly imported stripe_checkout are None.")
        return Response(
            {'error': 'Stripe checkout is not available. Please ensure the stripe package is properly installed.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    if not hasattr(checkout_module, 'Session'):
        logger.error(f"checkout_module.Session is not available. Module: {checkout_module}")
        return Response(
            {'error': 'Stripe checkout Session is not available.'},
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
        
        # Check for duplicate purchases - prevent same customer from buying same theme multiple times
        existing_purchase = ThemePurchase.objects.filter(
            theme=theme,
            customer_email=customer_email,
            status='completed'
        ).first()
        
        if existing_purchase:
            return Response(
                {
                    'error': 'You have already purchased this theme',
                    'existing_purchase': True,
                    'download_file': existing_purchase.theme.download_file.url if existing_purchase.theme.download_file else None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert price to cents for Stripe using Decimal for precision
        price_decimal = Decimal(str(theme.price))
        amount_cents = int(price_decimal * 100)
        
        # Get the frontend URL for success/cancel redirects
        frontend_url = os.environ.get('FRONTEND_URL', 'https://1rockstarsocial.com')
        
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
        
        # Safely truncate description at word boundary
        description = theme.description
        if len(description) > 500:
            description = description[:497].rsplit(' ', 1)[0] + '...'
        
        # Create Stripe Checkout Session
        line_item = {
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': theme.name,
                    'description': description,
                },
                'unit_amount': amount_cents,
            },
            'quantity': 1,
        }
        
        if image_url:
            line_item['price_data']['product_data']['images'] = [image_url]
        
        # Create Stripe Checkout Session - use checkout_module which may be explicitly imported
        logger.info(f"Creating Stripe checkout session for theme {theme.id}")
        try:
            # Use checkout_module which is either stripe.checkout or explicitly imported stripe_checkout
            session = checkout_module.Session.create(
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
        except AttributeError as e:
            logger.error(f"AttributeError creating Stripe session: {str(e)}")
            return Response(
                {'error': 'Stripe checkout service is not available. Please contact support.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Only create purchase record after successful Stripe session creation
        # Use transaction to ensure atomicity
        try:
            with transaction.atomic():
                purchase = ThemePurchase.objects.create(
                    theme=theme,
                    customer_email=customer_email,
                    customer_name=customer_name,
                    stripe_session_id=session.id,
                    amount_paid=theme.price,
                    status='pending'
                )
                logger.info(f"Created pending purchase {purchase.id} for session {session.id}")
        except Exception as db_error:
            logger.error(f"Failed to create purchase record: {str(db_error)}")
            # Try to expire the Stripe session since we couldn't record it
            try:
                checkout_module.Session.expire(session.id)
            except:
                pass
            raise
        
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
        logger.error(f"Error creating checkout session: {str(e)}", exc_info=True)
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
    
    if not STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET is not configured")
        return HttpResponse(status=500)
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        logger.error(f"Invalid payload in Stripe webhook: {str(e)}")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        logger.error(f"Invalid signature in Stripe webhook: {str(e)}")
        return HttpResponse(status=400)
    
    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        if 'id' not in session:
            logger.error("Session ID missing from webhook event")
            return HttpResponse(status=400)

        metadata = session.get('metadata', {})
        purchase_type = metadata.get('type', 'theme')

        if purchase_type == 'birthday':
            # Activate the BirthdayParty
            try:
                with transaction.atomic():
                    party = BirthdayParty.objects.select_for_update().get(
                        stripe_session_id=session['id']
                    )
                    if not party.is_active:
                        party.is_active = True
                        party.save()
                        logger.info(f"Birthday party activated: {party.slug}")
                        from .birthday_views import _send_welcome_email
                        _send_welcome_email(party)
            except BirthdayParty.DoesNotExist:
                logger.error(f"BirthdayParty not found for session {session['id']}")
                return HttpResponse(status=404)
            except Exception as e:
                logger.error(f"Error activating birthday party: {str(e)}", exc_info=True)
                return HttpResponse(status=500)
        elif purchase_type == 'theme_order':
            # Complete a website theme package order
            try:
                with transaction.atomic():
                    order = ThemeOrder.objects.select_for_update().get(
                        stripe_session_id=session['id']
                    )
                    if order.status != 'completed':
                        order.status = 'completed'
                        order.save()
                        logger.info(f"ThemeOrder completed: {order.id} for {order.customer_email}")
            except ThemeOrder.DoesNotExist:
                logger.error(f"ThemeOrder not found for session {session['id']}")
                return HttpResponse(status=404)
            except Exception as e:
                logger.error(f"Error completing theme order: {str(e)}", exc_info=True)
                return HttpResponse(status=500)
        else:
            # Theme purchase
            try:
                with transaction.atomic():
                    purchase = ThemePurchase.objects.select_for_update().get(
                        stripe_session_id=session['id']
                    )

                    if purchase.status == 'completed':
                        logger.warning(f"Purchase {purchase.id} already completed, skipping")
                        return HttpResponse(status=200)

                    purchase.status = 'completed'
                    purchase.stripe_payment_intent_id = session.get('payment_intent')
                    purchase.save()
                    logger.info(f"Theme purchase completed: {purchase.theme.id} by {purchase.customer_email}")

            except ThemePurchase.DoesNotExist:
                logger.error(f"ThemePurchase not found for session {session['id']}")
                return HttpResponse(status=404)
            except Exception as e:
                logger.error(f"Error processing theme webhook: {str(e)}", exc_info=True)
                return HttpResponse(status=500)

    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        
        if 'id' not in payment_intent:
            logger.error("Payment intent ID missing from webhook event")
            return HttpResponse(status=400)
        
        # Find purchase by payment intent ID
        try:
            with transaction.atomic():
                purchase = ThemePurchase.objects.select_for_update().get(
                    stripe_payment_intent_id=payment_intent['id']
                )
                purchase.status = 'failed'
                purchase.save()
                logger.info(f"Payment failed for purchase {purchase.id}")
        except ThemePurchase.DoesNotExist:
            logger.error(f"Purchase not found for payment intent {payment_intent['id']}")
            # This might be okay - payment could fail before we associate it
            return HttpResponse(status=200)
        except Exception as e:
            logger.error(f"Error processing payment failure: {str(e)}", exc_info=True)
            return HttpResponse(status=500)
    
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
        
        response_data = {
            'status': purchase.status,
            'theme_id': purchase.theme.id,
            'theme_name': purchase.theme.name,
        }
        
        # Only provide download link if purchase is completed
        if purchase.status == 'completed' and purchase.theme.download_file:
            response_data['download_file'] = purchase.theme.download_file.url
        else:
            response_data['download_file'] = None
        
        return Response(response_data)
        
    except ThemePurchase.DoesNotExist:
        return Response(
            {'error': 'Purchase not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error checking purchase status: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to check purchase status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def create_birthday_checkout(request):
    """Create a Stripe Checkout session for a birthday app purchase."""
    if not stripe.api_key:
        return Response({'error': 'Stripe is not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    checkout_module = getattr(stripe, 'checkout', None) or stripe_checkout
    if not checkout_module:
        return Response({'error': 'Stripe checkout not available'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    slug = request.data.get('slug', '').strip().lower()
    birthday_person_name = request.data.get('birthday_person_name', '').strip()
    party_date = request.data.get('party_date', '')
    host_email = request.data.get('host_email', '').strip()
    host_name = request.data.get('host_name', '').strip()
    theme_id = request.data.get('theme_id')
    password = request.data.get('password', '').strip()

    if not all([slug, birthday_person_name, party_date, host_email]):
        return Response(
            {'error': 'slug, birthday_person_name, party_date, and host_email are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not password or len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

    host_account, created = HostAccount.objects.get_or_create(
        email=host_email.lower(),
        defaults={'password': make_password(password)},
    )
    if not created and not check_password(password, host_account.password):
        return Response(
            {'error': 'An account already exists for this email. Please use your existing password.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if BirthdayParty.objects.filter(slug=slug).exists():
        return Response({'error': 'That URL is already taken. Please choose a different one.'}, status=status.HTTP_400_BAD_REQUEST)

    # Use the ThemePackage price if a theme_id was passed, otherwise fall back to env var
    if theme_id:
        try:
            theme_package = ThemePackage.objects.get(id=theme_id)
            price_cents = int(Decimal(str(theme_package.price)) * 100)
        except ThemePackage.DoesNotExist:
            return Response({'error': 'Theme not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        price_cents = int(os.environ.get('BIRTHDAY_APP_PRICE', '2900'))

    frontend_url = os.environ.get('FRONTEND_URL', 'https://1rockstarsocial.com')

    try:
        session = checkout_module.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f"Birthday Party Page — {birthday_person_name}",
                        'description': f"Your custom birthday party page at 1rockstarsocial.com/{slug}",
                    },
                    'unit_amount': price_cents,
                },
                'quantity': 1,
            }],
            mode='payment',
            customer_email=host_email,
            success_url=f'{frontend_url}/birthday/setup?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{frontend_url}/birthday/purchase',
            metadata={
                'type': 'birthday',
                'slug': slug,
                'birthday_person_name': birthday_person_name,
                'party_date': party_date,
                'host_email': host_email,
                'host_name': host_name,
            },
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating birthday checkout: {str(e)}")
        return Response({'error': f'Payment error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Reserve the slug by creating an inactive party
    try:
        from datetime import datetime
        BirthdayParty.objects.create(
            slug=slug,
            birthday_person_name=birthday_person_name,
            party_date=datetime.strptime(party_date, '%Y-%m-%d').date(),
            host_email=host_email.lower(),
            host_name=host_name,
            stripe_session_id=session.id,
            is_active=False,
            host_account=host_account,
        )
    except Exception as e:
        logger.error(f"Failed to create pending birthday party: {str(e)}")
        try:
            checkout_module.Session.expire(session.id)
        except Exception:
            pass
        return Response({'error': 'Failed to reserve party slot'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'checkout_url': session.url, 'session_id': session.id})


@api_view(['POST'])
@permission_classes([AllowAny])
def create_theme_checkout(request):
    """Create a Stripe Checkout session for a website theme package purchase."""
    if not stripe.api_key:
        return Response({'error': 'Stripe is not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    checkout_module = getattr(stripe, 'checkout', None) or stripe_checkout
    if not checkout_module:
        return Response({'error': 'Stripe checkout not available'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    theme_id = request.data.get('theme_id')
    customer_email = request.data.get('customer_email', '').strip()

    if not theme_id or not customer_email:
        return Response(
            {'error': 'theme_id and customer_email are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        theme = ThemePackage.objects.get(id=theme_id)
    except ThemePackage.DoesNotExist:
        return Response({'error': 'Theme not found'}, status=status.HTTP_404_NOT_FOUND)

    price_cents = int(Decimal(str(theme.price)) * 100)
    frontend_url = os.environ.get('FRONTEND_URL', 'https://1rockstarsocial.com')

    description = theme.description
    if len(description) > 500:
        description = description[:497].rsplit(' ', 1)[0] + '...'

    try:
        session = checkout_module.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': theme.name,
                        'description': description,
                    },
                    'unit_amount': price_cents,
                },
                'quantity': 1,
            }],
            mode='payment',
            customer_email=customer_email,
            success_url=f'{frontend_url}/theme-setup?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{frontend_url}/themes',
            metadata={
                'type': 'theme_order',
                'theme_id': str(theme.id),
                'customer_email': customer_email,
            },
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating theme checkout: {str(e)}")
        return Response({'error': f'Payment error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        ThemeOrder.objects.create(
            theme=theme,
            customer_email=customer_email,
            stripe_session_id=session.id,
            status='pending',
        )
    except Exception as e:
        logger.error(f"Failed to create ThemeOrder: {str(e)}")
        try:
            checkout_module.Session.expire(session.id)
        except Exception:
            pass
        return Response({'error': 'Failed to reserve order'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'checkout_url': session.url, 'session_id': session.id})
