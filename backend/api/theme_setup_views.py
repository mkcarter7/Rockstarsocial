import re
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import ThemeOrder

SLUG_PATTERN = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def theme_setup_view(request):
    if request.method == 'GET':
        return _get_theme_setup(request)
    return _save_theme_setup(request)


def _get_theme_setup(request):
    session_id = request.query_params.get('session_id')
    if not session_id:
        return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = ThemeOrder.objects.select_related('theme').get(stripe_session_id=session_id)
    except ThemeOrder.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.status != 'completed':
        return Response(
            {'error': 'Payment not yet confirmed. Please wait a moment and refresh.'},
            status=status.HTTP_402_PAYMENT_REQUIRED
        )

    return Response({
        'theme_name': order.theme.name,
        'theme_type': order.theme.theme_type,
        'customer_email': order.customer_email,
        'slug': order.slug,
        'business_name': order.business_name,
    })


def _save_theme_setup(request):
    session_id = request.data.get('session_id')
    slug = (request.data.get('slug') or '').strip().lower()
    business_name = (request.data.get('business_name') or '').strip()

    if not session_id:
        return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not slug:
        return Response({'error': 'A custom path (slug) is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not SLUG_PATTERN.match(slug):
        return Response(
            {'error': 'Slug must contain only lowercase letters, numbers, and hyphens'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        order = ThemeOrder.objects.get(stripe_session_id=session_id)
    except ThemeOrder.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.status != 'completed':
        return Response({'error': 'Payment not confirmed'}, status=status.HTTP_402_PAYMENT_REQUIRED)

    # Check slug uniqueness (allow the same order to keep its existing slug)
    taken = ThemeOrder.objects.filter(slug=slug).exclude(pk=order.pk).exists()
    if taken:
        return Response(
            {'error': 'That path is already taken. Please choose a different one.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    order.slug = slug
    order.business_name = business_name
    order.save()

    return Response({
        'slug': order.slug,
        'business_name': order.business_name,
        'site_url': f'1rockstarsocial.com/{order.theme.theme_type}/{order.slug}',
    })
