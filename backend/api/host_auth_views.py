"""
Host authentication views — magic link login for party hosts.
"""
import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from django.contrib.auth.hashers import check_password
from .models import BirthdayParty, HostAccessToken, HostAccount

logger = logging.getLogger(__name__)


def _verify_host_session(request, slug):
    """
    Validate X-Host-Token header against the given party slug.
    Returns (party, None) on success or (None, Response) on failure.
    """
    token_str = request.headers.get('X-Host-Token', '').strip()
    if not token_str:
        return None, Response({'error': 'Host token required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        token_obj = HostAccessToken.objects.select_related('party').get(
            token=token_str,
            token_type='session',
        )
    except (HostAccessToken.DoesNotExist, ValueError):
        return None, Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

    if token_obj.expires_at < timezone.now():
        return None, Response({'error': 'Token expired'}, status=status.HTTP_401_UNAUTHORIZED)

    if token_obj.party.slug != slug:
        return None, Response({'error': 'Token does not match this party'}, status=status.HTTP_403_FORBIDDEN)

    return token_obj.party, None


def verify_host_session_by_token_str(token_str, slug=None):
    """
    Validate a session token string directly (used in birthday_views.py).
    Returns (party, error_dict) — error_dict is None on success.
    slug is optional; if provided the token must belong to that party.
    """
    if not token_str:
        return None, {'error': 'session_token required'}

    try:
        token_obj = HostAccessToken.objects.select_related('party').get(
            token=token_str,
            token_type='session',
        )
    except (HostAccessToken.DoesNotExist, ValueError):
        return None, {'error': 'Invalid token'}

    if token_obj.expires_at < timezone.now():
        return None, {'error': 'Token expired'}

    if slug and token_obj.party.slug != slug:
        return None, {'error': 'Token does not match this party'}

    return token_obj.party, None


@api_view(['POST'])
@permission_classes([AllowAny])
def request_magic_link(request):
    """
    POST /api/host/request-access/
    Body: { email }
    Sends a magic login link to the host. Always returns 200 to avoid
    leaking whether a party exists for a given email.
    """
    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'email is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        party = BirthdayParty.objects.filter(
            host_email__iexact=email, is_active=True
        ).latest('created_at')
    except BirthdayParty.DoesNotExist:
        return Response({'message': 'If a party exists for this email, a link has been sent.'})

    token = HostAccessToken.objects.create(
        party=party,
        token_type='magic_link',
        expires_at=timezone.now() + timedelta(hours=24),
    )

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    magic_link = f"{frontend_url}/host/verify?token={token.token}"

    try:
        send_mail(
            subject=f"Your party management link — {party.birthday_person_name}'s Birthday",
            message=(
                f"Hi {party.host_name or 'there'},\n\n"
                f"Here is your link to manage {party.birthday_person_name}'s birthday party page:\n\n"
                f"{magic_link}\n\n"
                f"This link expires in 24 hours and can only be used once.\n\n"
                f"— RockStar Social"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send magic link email to {email}: {e}")
        return Response(
            {'error': 'Failed to send email. Please check your email address or contact support.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({'message': 'If a party exists for this email, a link has been sent.'})


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_magic_link(request):
    """
    GET /api/host/verify-token/?token=xxx
    Validates a magic link token, marks it used, and creates a 30-day session token.
    Returns { session_token, party_slug }.
    """
    token_str = request.query_params.get('token', '').strip()
    if not token_str:
        return Response({'error': 'token is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token_obj = HostAccessToken.objects.select_related('party').get(
            token=token_str,
            token_type='magic_link',
        )
    except (HostAccessToken.DoesNotExist, ValueError):
        return Response({'error': 'Invalid or expired link'}, status=status.HTTP_400_BAD_REQUEST)

    if token_obj.used:
        return Response(
            {'error': 'This link has already been used. Request a new one.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if token_obj.expires_at < timezone.now():
        return Response(
            {'error': 'This link has expired. Request a new one.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    token_obj.used = True
    token_obj.save(update_fields=['used'])

    session_token = HostAccessToken.objects.create(
        party=token_obj.party,
        token_type='session',
        expires_at=timezone.now() + timedelta(days=30),
    )

    return Response({
        'session_token': str(session_token.token),
        'party_slug': token_obj.party.slug,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def host_login(request):
    """
    POST /api/host/login/
    Body: { email, password }
    Validates credentials and returns a 30-day session token.
    """
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')

    if not email or not password:
        return Response({'error': 'email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        account = HostAccount.objects.get(email=email)
    except HostAccount.DoesNotExist:
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

    if not check_password(password, account.password):
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

    # Most recent active party via FK; fall back to host_email match for pre-account parties
    party = (
        account.parties.filter(is_active=True).order_by('-created_at').first()
        or BirthdayParty.objects.filter(host_email=email, is_active=True).order_by('-created_at').first()
    )
    if not party:
        return Response({'error': 'No active party found for this account.'}, status=status.HTTP_404_NOT_FOUND)

    all_parties = list(
        account.parties.filter(is_active=True).order_by('-created_at')
        .values('slug', 'birthday_person_name', 'party_date')
    )

    session_token = HostAccessToken.objects.create(
        party=party,
        token_type='session',
        expires_at=timezone.now() + timedelta(days=30),
    )

    return Response({
        'session_token': str(session_token.token),
        'party_slug': party.slug,
        'all_parties': all_parties,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def switch_party(request):
    """
    POST /api/host/switch-party/
    Body: { email, password, party_slug }
    Returns a new 30-day session token scoped to a different party on the same account.
    """
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    party_slug = request.data.get('party_slug', '').strip()

    if not all([email, password, party_slug]):
        return Response({'error': 'email, password, and party_slug are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        account = HostAccount.objects.get(email=email)
    except HostAccount.DoesNotExist:
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

    if not check_password(password, account.password):
        return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        party = account.parties.get(slug=party_slug, is_active=True)
    except BirthdayParty.DoesNotExist:
        return Response({'error': 'Party not found on this account'}, status=status.HTTP_404_NOT_FOUND)

    session_token = HostAccessToken.objects.create(
        party=party,
        token_type='session',
        expires_at=timezone.now() + timedelta(days=30),
    )

    return Response({
        'session_token': str(session_token.token),
        'party_slug': party.slug,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def change_password(request):
    """
    POST /api/host/change-password/
    Header: X-Host-Token: <session_token>
    Body: { "new_password": "..." }
    Lets an authenticated host set a new password on their account.
    """
    from django.contrib.auth.hashers import make_password as _make_password
    token_str = request.headers.get('X-Host-Token', '').strip()
    party, err = verify_host_session_by_token_str(token_str)
    if err:
        return Response(err, status=status.HTTP_401_UNAUTHORIZED)

    new_password = request.data.get('new_password', '').strip()
    if not new_password or len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        account = HostAccount.objects.get(email__iexact=party.host_email)
    except HostAccount.DoesNotExist:
        return Response({'error': 'No account found for this party'}, status=status.HTTP_404_NOT_FOUND)

    account.password = _make_password(new_password)
    account.save(update_fields=['password'])
    return Response({'message': 'Password updated successfully'})


@api_view(['GET'])
@permission_classes([AllowAny])
def host_party_stats(request, slug):
    """
    GET /api/host/party/<slug>/
    Header: X-Host-Token: <session_token>
    Returns party info and stats for the host dashboard.
    """
    party, err = _verify_host_session(request, slug)
    if err:
        return err

    return Response({
        'slug': party.slug,
        'birthday_person_name': party.birthday_person_name,
        'party_date': party.party_date.isoformat(),
        'host_name': party.host_name,
        'rsvp_count': party.rsvps.filter(status='yes').count(),
        'guestbook_count': party.guestbook_entries.count(),
        'photo_count': party.photos.count(),
    })
