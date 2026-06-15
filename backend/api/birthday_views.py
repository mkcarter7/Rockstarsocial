"""
Birthday app API views
"""
import logging
import os
from datetime import date, timedelta
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password
from .models import (
    BirthdayParty, WeddingEvent, BabyShowerEvent, HostAccount, PartyPhoto, GuestBookEntry,
    PartyRSVP, TriviaQuestion, TriviaScore, GiftItem, SlugRedirect
)
from .host_auth_views import verify_host_session_by_token_str
from .theme_setup_views import SLUG_PATTERN

logger = logging.getLogger(__name__)


def _delete_party_and_maybe_account(party):
    """Delete a party, then delete its HostAccount if it owns no other parties."""
    host_account = party.host_account
    party.delete()
    if host_account is not None and not host_account.parties.exists():
        host_account.delete()


def _get_party_or_404(slug):
    """Return party if active and not expired, else None with error dict."""
    try:
        party = BirthdayParty.objects.select_related('host_account').get(slug=slug)
    except BirthdayParty.DoesNotExist:
        return None, {'error': 'Party not found'}

    if party.is_expired:
        _delete_party_and_maybe_account(party)
        return None, {'error': 'This party has expired'}

    if not party.is_active:
        return None, {'error': 'This party is not yet active'}

    return party, None


def _serialize_party(party, request=None):
    banner_url = None
    if party.banner_image:
        if request:
            banner_url = request.build_absolute_uri(party.banner_image.url)
        else:
            banner_url = party.banner_image.url

    return {
        'slug': party.slug,
        'birthday_person_name': party.birthday_person_name,
        'party_date': party.party_date.isoformat(),
        'party_time': party.party_time.strftime('%H:%M') if party.party_time else None,
        'location_name': party.location_name,
        'location_address': party.location_address,
        'welcome_message': party.welcome_message,
        'host_name': party.host_name,
        'theme_color': party.theme_color,
        'secondary_color': party.secondary_color,
        'banner_image': banner_url,
        'expires_at': party.expires_at.isoformat(),
        'rsvp_count': party.rsvps.filter(status='yes').count(),
        'gift_registry_url': party.gift_registry_url,
        'venmo_handle': party.venmo_handle,
        'cashapp_handle': party.cashapp_handle,
    }


def _send_welcome_email(party):
    """Send welcome email after party setup is first completed."""
    from django.core.mail import send_mail
    from django.conf import settings
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    try:
        send_mail(
            subject=f"🎉 Your party page is live — {party.birthday_person_name}'s Birthday",
            message=(
                f"Hi {party.host_name or 'there'},\n\n"
                f"Your birthday party page is now live!\n\n"
                f"🎂 Party page: {frontend_url}/{party.slug}\n\n"
                f"Share this link with your guests so they can RSVP, sign the guestbook, "
                f"upload photos, and play trivia.\n\n"
                f"To manage your party page anytime (edit colors, welcome message, or add trivia), visit:\n"
                f"{frontend_url}/host/login\n\n"
                f"Just enter this email address ({party.host_email}) to receive a login link.\n\n"
                f"Enjoy the party!\n— RockStar Social"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[party.host_email],
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Failed to send welcome email to {party.host_email}: {e}")


# ─── Public party endpoints ───────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def check_slug(request):
    """Check if a slug is available. GET /api/birthday/check-slug/?slug=kate-smith"""
    slug = request.query_params.get('slug', '').strip().lower()
    if not slug:
        return Response({'error': 'slug is required'}, status=status.HTTP_400_BAD_REQUEST)

    taken = BirthdayParty.objects.filter(slug=slug).exists()
    return Response({'available': not taken, 'slug': slug})


@api_view(['GET'])
@permission_classes([AllowAny])
def party_detail(request, slug):
    """Get public party data. GET /api/birthday/<slug>/"""
    party, err = _get_party_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)
    return Response(_serialize_party(party, request))


# ─── Setup (post-purchase) ────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def party_setup(request):
    """
    GET  /api/birthday/setup/?session_id=xxx  — fetch pending party for setup page
    POST /api/birthday/setup/                 — save customization
    """
    if request.method == 'GET':
        session_id = request.query_params.get('session_id')
        session_token = request.query_params.get('session_token')

        if session_token:
            party, err = verify_host_session_by_token_str(session_token)
            if err:
                return Response(err, status=status.HTTP_401_UNAUTHORIZED)
        elif session_id:
            try:
                party = BirthdayParty.objects.get(stripe_session_id=session_id)
            except BirthdayParty.DoesNotExist:
                return Response({'error': 'Party not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'session_id or session_token is required'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'slug': party.slug,
            'birthday_person_name': party.birthday_person_name,
            'party_date': party.party_date.isoformat(),
            'host_name': party.host_name,
            'is_active': party.is_active,
            'theme_color': party.theme_color,
            'secondary_color': party.secondary_color,
            'welcome_message': party.welcome_message,
            'party_time': party.party_time.strftime('%H:%M') if party.party_time else '',
            'location_name': party.location_name,
            'location_address': party.location_address,
            'gift_registry_url': party.gift_registry_url,
            'venmo_handle': party.venmo_handle,
            'cashapp_handle': party.cashapp_handle,
            'banner_image': request.build_absolute_uri(party.banner_image.url) if party.banner_image else None,
        })

    # POST — save setup
    session_id = request.data.get('session_id')
    session_token = request.data.get('session_token')

    if session_token:
        party, err = verify_host_session_by_token_str(session_token)
        if err:
            return Response(err, status=status.HTTP_401_UNAUTHORIZED)
    elif session_id:
        try:
            party = BirthdayParty.objects.get(stripe_session_id=session_id)
        except BirthdayParty.DoesNotExist:
            return Response({'error': 'Party not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({'error': 'session_id or session_token is required'}, status=status.HTTP_400_BAD_REQUEST)

    was_active = party.is_active

    if 'theme_color' in request.data:
        party.theme_color = request.data['theme_color']
    if 'secondary_color' in request.data:
        party.secondary_color = request.data['secondary_color']
    if 'welcome_message' in request.data:
        party.welcome_message = request.data['welcome_message']
    if 'banner_image' in request.FILES:
        party.banner_image = request.FILES['banner_image']
    if 'party_time' in request.data:
        party.party_time = request.data['party_time'] or None
    if 'location_name' in request.data:
        party.location_name = request.data['location_name']
    if 'location_address' in request.data:
        party.location_address = request.data['location_address']
    if 'gift_registry_url' in request.data:
        party.gift_registry_url = request.data['gift_registry_url'].strip()
    if 'venmo_handle' in request.data:
        party.venmo_handle = request.data['venmo_handle'].strip().lstrip('@')
    if 'cashapp_handle' in request.data:
        party.cashapp_handle = request.data['cashapp_handle'].strip().lstrip('$')

    if session_id:
        # First-time Stripe setup — activate the party
        party.is_active = True

    party.save()

    # Send welcome email the first time the party is activated via setup.
    # Guards against double-email: if the webhook already fired and set is_active=True,
    # was_active will be True here and we skip this call.
    if session_id and not was_active:
        _send_welcome_email(party)

    return Response({'slug': party.slug, 'message': 'Party updated'})


# ─── Photos ───────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def party_photos(request, slug):
    party, err = _get_party_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        photos = party.photos.all()
        data = []
        for p in photos:
            url = request.build_absolute_uri(p.image.url) if request else p.image.url
            data.append({
                'id': p.id,
                'image': url,
                'caption': p.caption,
                'uploaded_by_name': p.uploaded_by_name,
                'uploaded_at': p.uploaded_at.isoformat(),
            })
        return Response(data)

    # POST — upload photo
    if 'image' not in request.FILES:
        return Response({'error': 'image is required'}, status=status.HTTP_400_BAD_REQUEST)

    photo = PartyPhoto.objects.create(
        party=party,
        image=request.FILES['image'],
        caption=request.data.get('caption', ''),
        uploaded_by_name=request.data.get('uploaded_by_name', 'Guest'),
    )
    url = request.build_absolute_uri(photo.image.url)
    return Response({
        'id': photo.id,
        'image': url,
        'caption': photo.caption,
        'uploaded_by_name': photo.uploaded_by_name,
        'uploaded_at': photo.uploaded_at.isoformat(),
        'delete_token': str(photo.delete_token),
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_photo(request, slug, photo_id):
    # Method 1: uploader delete_token (stored in their browser at upload time)
    delete_token = request.query_params.get('delete_token')
    if delete_token:
        try:
            photo = PartyPhoto.objects.get(id=photo_id, party__slug=slug, delete_token=delete_token)
            photo.delete()
            return Response({'message': 'Photo deleted'})
        except PartyPhoto.DoesNotExist:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    # Method 2: host session_token
    session_token = request.query_params.get('session_token')
    if session_token:
        from .host_auth_views import verify_host_session_by_token_str
        event, err = verify_host_session_by_token_str(session_token, slug)
        if not err:
            try:
                photo = PartyPhoto.objects.get(id=photo_id, party=event)
                photo.delete()
                return Response({'message': 'Photo deleted'})
            except PartyPhoto.DoesNotExist:
                return Response({'error': 'Photo not found'}, status=status.HTTP_404_NOT_FOUND)

    # Method 3: Firebase admin
    from .firebase_auth import get_firebase_user
    if get_firebase_user(request):
        try:
            photo = PartyPhoto.objects.get(id=photo_id, party__slug=slug)
            photo.delete()
            return Response({'message': 'Photo deleted'})
        except PartyPhoto.DoesNotExist:
            return Response({'error': 'Photo not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)


# ─── Guest book ───────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def party_guestbook(request, slug):
    party, err = _get_party_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        entries = party.guestbook_entries.all()
        return Response([{
            'id': e.id,
            'author_name': e.author_name,
            'message': e.message,
            'created_at': e.created_at.isoformat(),
        } for e in entries])

    # POST
    author_name = request.data.get('author_name', '').strip()
    message = request.data.get('message', '').strip()
    if not author_name or not message:
        return Response({'error': 'author_name and message are required'}, status=status.HTTP_400_BAD_REQUEST)

    entry = GuestBookEntry.objects.create(party=party, author_name=author_name, message=message)
    return Response({
        'id': entry.id,
        'author_name': entry.author_name,
        'message': entry.message,
        'created_at': entry.created_at.isoformat(),
    }, status=status.HTTP_201_CREATED)


# ─── RSVP ─────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def party_rsvp(request, slug):
    party, err = _get_party_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        rsvps = party.rsvps.all()
        return Response({
            'total': rsvps.count(),
            'yes': rsvps.filter(status='yes').count(),
            'no': rsvps.filter(status='no').count(),
            'maybe': rsvps.filter(status='maybe').count(),
            'entries': [{
                'id': r.id,
                'name': r.name,
                'status': r.status,
                'guest_count': r.guest_count,
                'message': r.message,
            } for r in rsvps],
        })

    # POST
    name = request.data.get('name', '').strip()
    rsvp_status = request.data.get('status', '')
    if not name or rsvp_status not in ('yes', 'no', 'maybe'):
        return Response({'error': 'name and valid status (yes/no/maybe) are required'}, status=status.HTTP_400_BAD_REQUEST)

    rsvp = PartyRSVP.objects.create(
        party=party,
        name=name,
        email=request.data.get('email', ''),
        status=rsvp_status,
        guest_count=int(request.data.get('guest_count', 1)),
        message=request.data.get('message', ''),
    )
    return Response({
        'id': rsvp.id,
        'name': rsvp.name,
        'status': rsvp.status,
        'guest_count': rsvp.guest_count,
    }, status=status.HTTP_201_CREATED)


# ─── Trivia ───────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([AllowAny])
def party_trivia(request, slug):
    party, err = _get_party_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        questions = party.trivia_questions.all()
        return Response([{
            'id': q.id,
            'question': q.question,
            'option_a': q.option_a,
            'option_b': q.option_b,
            'option_c': q.option_c,
            'option_d': q.option_d,
            'points': q.points,
        } for q in questions])

    # POST — host adds a question (verified via session_id or session_token)
    session_id = request.data.get('session_id')
    session_token = request.data.get('session_token')
    if session_token:
        _, err = verify_host_session_by_token_str(session_token, slug)
        if err:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    elif not session_id or party.stripe_session_id != session_id:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    required = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']
    for field in required:
        if not request.data.get(field):
            return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)

    if request.data['correct_answer'] not in ('a', 'b', 'c', 'd'):
        return Response({'error': 'correct_answer must be a, b, c, or d'}, status=status.HTTP_400_BAD_REQUEST)

    q = TriviaQuestion.objects.create(
        party=party,
        question=request.data['question'],
        option_a=request.data['option_a'],
        option_b=request.data['option_b'],
        option_c=request.data['option_c'],
        option_d=request.data['option_d'],
        correct_answer=request.data['correct_answer'],
        points=int(request.data.get('points', 10)),
    )
    return Response({'id': q.id, 'question': q.question}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_trivia(request, slug):
    """Submit trivia answers and record score."""
    party, err = _get_party_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    player_name = request.data.get('player_name', '').strip()
    answers = request.data.get('answers', {})  # {question_id: 'a'/'b'/'c'/'d'}
    if not player_name:
        return Response({'error': 'player_name is required'}, status=status.HTTP_400_BAD_REQUEST)

    questions = party.trivia_questions.all()
    total_score = 0
    results = []
    for q in questions:
        given = answers.get(str(q.id), '')
        correct = given == q.correct_answer
        if correct:
            total_score += q.points
        results.append({
            'question_id': q.id,
            'correct': correct,
            'correct_answer': q.correct_answer,
            'points_earned': q.points if correct else 0,
        })

    TriviaScore.objects.create(party=party, player_name=player_name, score=total_score)
    return Response({'player_name': player_name, 'score': total_score, 'results': results})


@api_view(['GET'])
@permission_classes([AllowAny])
def trivia_leaderboard(request, slug):
    party, err = _get_party_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    scores = party.trivia_scores.all()[:10]
    return Response([{
        'rank': i + 1,
        'player_name': s.player_name,
        'score': s.score,
    } for i, s in enumerate(scores)])


# ─── Admin ────────────────────────────────────────────────────────────────────

def _serialize_event_page(p, event_type):
    is_wedding = isinstance(p, WeddingEvent)
    is_baby_shower = isinstance(p, BabyShowerEvent)
    if is_wedding:
        name = p.couple_name
        party_date = p.wedding_date
    elif is_baby_shower:
        name = p.parent_names
        party_date = p.shower_date
    else:
        name = p.birthday_person_name
        party_date = p.party_date
    return {
        'id': p.id,
        'event_type': event_type,
        'slug': p.slug,
        'name': name,
        'party_date': party_date.isoformat(),
        'host_email': p.host_email,
        'is_active': p.is_active,
        'is_expired': p.is_expired,
        'expires_at': p.expires_at.isoformat(),
        'created_at': p.created_at.isoformat(),
    }


# Event type registry — add new event models here as they are created
EVENT_TYPE_MODELS = {
    'birthday': BirthdayParty,
    'wedding': WeddingEvent,
    'baby_shower': BabyShowerEvent,
}


@api_view(['GET'])
def admin_event_pages(request):
    """Firebase-protected list of all event pages across all types."""
    from .firebase_auth import get_firebase_user
    if not get_firebase_user(request):
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    results = []
    for event_type, Model in EVENT_TYPE_MODELS.items():
        label = event_type.capitalize()
        for p in Model.objects.all().order_by('-created_at'):
            results.append(_serialize_event_page(p, label))

    results.sort(key=lambda x: x['created_at'], reverse=True)
    return Response(results)


@api_view(['DELETE'])
def admin_delete_event_page(request, event_type, page_id):
    """Firebase-protected delete an event page by type and ID."""
    from .firebase_auth import get_firebase_user
    if not get_firebase_user(request):
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    Model = EVENT_TYPE_MODELS.get(event_type.lower())
    if not Model:
        return Response({'error': f'Unknown event type: {event_type}'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        page = Model.objects.select_related('host_account').get(id=page_id)
    except Model.DoesNotExist:
        return Response({'error': 'Event page not found'}, status=status.HTTP_404_NOT_FOUND)

    if Model is BirthdayParty:
        _delete_party_and_maybe_account(page)
    elif Model is WeddingEvent:
        from .wedding_views import _delete_wedding_and_maybe_account
        _delete_wedding_and_maybe_account(page)
    elif Model is BabyShowerEvent:
        from .baby_shower_views import _delete_baby_shower_and_maybe_account
        _delete_baby_shower_and_maybe_account(page)
    else:
        page.delete()
    return Response({'message': 'Event page deleted'}, status=status.HTTP_200_OK)


@api_view(['GET'])
def admin_birthday_parties(request):
    """Legacy alias — kept for backwards compatibility."""
    return admin_event_pages(request)


def _random_password():
    import secrets, string
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))


@api_view(['POST'])
def admin_create_event_page(request):
    """Firebase-protected: create a birthday, wedding, or baby shower page without Stripe."""
    from .firebase_auth import get_firebase_user
    if not get_firebase_user(request):
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    event_type = request.data.get('event_type', '').strip()
    slug = request.data.get('slug', '').strip().lower()
    host_email = request.data.get('host_email', '').strip().lower()
    host_name = request.data.get('host_name', '').strip()
    host_password = request.data.get('host_password', '').strip() or _random_password()
    send_email = request.data.get('send_welcome_email', False)

    if not slug or not host_email:
        return Response({'error': 'slug and host_email are required'}, status=status.HTTP_400_BAD_REQUEST)

    from django.contrib.auth.hashers import make_password as _make_password
    host_account, _ = HostAccount.objects.get_or_create(
        email=host_email,
        defaults={'password': _make_password(host_password)},
    )

    from datetime import datetime as _dt

    if event_type == 'birthday':
        birthday_person_name = request.data.get('birthday_person_name', '').strip()
        party_date = request.data.get('party_date', '')
        if not birthday_person_name or not party_date:
            return Response({'error': 'birthday_person_name and party_date are required'}, status=status.HTTP_400_BAD_REQUEST)
        if BirthdayParty.objects.filter(slug=slug).exists():
            return Response({'error': 'That URL is already taken'}, status=status.HTTP_400_BAD_REQUEST)
        event = BirthdayParty.objects.create(
            slug=slug,
            birthday_person_name=birthday_person_name,
            party_date=_dt.strptime(party_date, '%Y-%m-%d').date(),
            host_email=host_email,
            host_name=host_name,
            is_active=True,
            host_account=host_account,
        )
        if send_email:
            _send_welcome_email(event)

    elif event_type == 'wedding':
        couple_name = request.data.get('couple_name', '').strip()
        wedding_date = request.data.get('wedding_date', '')
        if not couple_name or not wedding_date:
            return Response({'error': 'couple_name and wedding_date are required'}, status=status.HTTP_400_BAD_REQUEST)
        if WeddingEvent.objects.filter(slug=slug).exists():
            return Response({'error': 'That URL is already taken'}, status=status.HTTP_400_BAD_REQUEST)
        from .models import WeddingEvent as _WE
        event = _WE.objects.create(
            slug=slug,
            couple_name=couple_name,
            wedding_date=_dt.strptime(wedding_date, '%Y-%m-%d').date(),
            host_email=host_email,
            host_name=host_name,
            is_active=True,
            host_account=host_account,
        )
        if send_email:
            from .wedding_views import _send_welcome_email as _wedding_email
            _wedding_email(event)

    elif event_type == 'baby_shower':
        parent_names = request.data.get('parent_names', '').strip()
        shower_date = request.data.get('shower_date', '')
        if not parent_names or not shower_date:
            return Response({'error': 'parent_names and shower_date are required'}, status=status.HTTP_400_BAD_REQUEST)
        if BabyShowerEvent.objects.filter(slug=slug).exists():
            return Response({'error': 'That URL is already taken'}, status=status.HTTP_400_BAD_REQUEST)
        from .models import BabyShowerEvent as _BSE
        event = _BSE.objects.create(
            slug=slug,
            parent_names=parent_names,
            shower_date=_dt.strptime(shower_date, '%Y-%m-%d').date(),
            host_email=host_email,
            host_name=host_name,
            is_active=True,
            host_account=host_account,
        )
        if send_email:
            from .baby_shower_views import _send_welcome_email as _bs_email
            _bs_email(event)

    else:
        return Response({'error': 'event_type must be birthday, wedding, or baby_shower'}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'slug': event.slug, 'message': f'{event_type} page created'}, status=status.HTTP_201_CREATED)


# ─── Cleanup management command helper ────────────────────────────────────────

def cleanup_expired_parties():
    """Delete all expired parties. Call from a management command or scheduled task."""
    deleted = 0
    for party in BirthdayParty.objects.filter(is_active=True).select_related('host_account'):
        if party.is_expired:
            _delete_party_and_maybe_account(party)
            deleted += 1
    # Also clean up abandoned checkouts older than 24 hours
    from django.utils import timezone
    cutoff = timezone.now() - timedelta(hours=24)
    abandoned = list(BirthdayParty.objects.filter(is_active=False, created_at__lt=cutoff).select_related('host_account'))
    abandoned_count = len(abandoned)
    for party in abandoned:
        _delete_party_and_maybe_account(party)
    return deleted, abandoned_count


# ─── Admin: host account management ──────────────────────────────────────────

@api_view(['GET'])
def admin_host_accounts(request):
    """Firebase-protected: list all host accounts with their parties."""
    from .firebase_auth import get_firebase_user
    if not get_firebase_user(request):
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    accounts = HostAccount.objects.prefetch_related(
        'parties', 'wedding_events', 'baby_shower_events'
    ).order_by('-created_at')
    data = []
    for account in accounts:
        birthday_parties = list(
            account.parties.values('id', 'slug', 'birthday_person_name', 'party_date', 'is_active', 'created_at')
        )
        for p in birthday_parties:
            p['event_type'] = 'birthday'
            p['display_name'] = p.pop('birthday_person_name', '') + "'s Birthday"

        wedding_events = list(
            account.wedding_events.values('id', 'slug', 'couple_name', 'wedding_date', 'is_active', 'created_at')
        )
        for w in wedding_events:
            w['event_type'] = 'wedding'
            w['display_name'] = w.pop('couple_name', '') + "'s Wedding"
            w['party_date'] = w.pop('wedding_date', None)

        baby_shower_events = list(
            account.baby_shower_events.values('id', 'slug', 'parent_names', 'shower_date', 'is_active', 'created_at')
        )
        for b in baby_shower_events:
            b['event_type'] = 'baby_shower'
            b['display_name'] = b.pop('parent_names', '') + "'s Baby Shower"
            b['party_date'] = b.pop('shower_date', None)

        all_events = birthday_parties + wedding_events + baby_shower_events
        all_events.sort(key=lambda e: e.get('created_at') or '', reverse=True)
        for e in all_events:
            e.pop('created_at', None)

        data.append({
            'id': account.id,
            'email': account.email,
            'created_at': account.created_at.isoformat(),
            'party_count': len(all_events),
            'parties': all_events,
            'orphaned': False,
        })

    # Append orphaned rows: host_email on events with no linked HostAccount
    known_emails = {entry['email'] for entry in data}
    orphaned_emails = set()
    for Model in [BirthdayParty, WeddingEvent, BabyShowerEvent]:
        orphaned_emails.update(
            Model.objects.filter(is_active=True, host_account__isnull=True)
            .values_list('host_email', flat=True)
        )
    orphaned_emails -= known_emails

    for email in sorted(orphaned_emails):
        orphaned_events = []
        for Model, type_label, name_field, date_field in [
            (BirthdayParty, 'birthday', 'birthday_person_name', 'party_date'),
            (WeddingEvent, 'wedding', 'couple_name', 'wedding_date'),
            (BabyShowerEvent, 'baby_shower', 'parent_names', 'shower_date'),
        ]:
            for e in Model.objects.filter(
                host_email__iexact=email, host_account__isnull=True, is_active=True
            ).values('slug', name_field, date_field, 'is_active'):
                orphaned_events.append({
                    'slug': e['slug'],
                    'event_type': type_label,
                    'display_name': (e.get(name_field) or '') + (
                        "'s Birthday" if type_label == 'birthday'
                        else "'s Wedding" if type_label == 'wedding'
                        else "'s Baby Shower"
                    ),
                    'party_date': str(e.get(date_field) or ''),
                    'is_active': e['is_active'],
                })
        data.append({
            'id': None,
            'email': email,
            'created_at': None,
            'party_count': len(orphaned_events),
            'parties': orphaned_events,
            'orphaned': True,
        })

    return Response(data)


@api_view(['POST'])
def admin_reset_host_password(request, account_id):
    """Firebase-protected: set a new password for a host account."""
    from .firebase_auth import get_firebase_user
    if not get_firebase_user(request):
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    new_password = request.data.get('new_password', '').strip()
    if not new_password or len(new_password) < 8:
        return Response({'error': 'new_password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        account = HostAccount.objects.get(id=account_id)
    except HostAccount.DoesNotExist:
        return Response({'error': 'Host account not found'}, status=status.HTTP_404_NOT_FOUND)

    account.password = make_password(new_password)
    account.save(update_fields=['password'])
    return Response({'message': f'Password reset for {account.email}'})


@api_view(['DELETE'])
def admin_delete_host_account(request, account_id):
    """Admin-only: delete a host account (parties are kept but unlinked)."""
    from .firebase_auth import get_firebase_user
    if not get_firebase_user(request):
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        account = HostAccount.objects.get(id=account_id)
    except HostAccount.DoesNotExist:
        return Response({'error': 'Host account not found'}, status=status.HTTP_404_NOT_FOUND)

    email = account.email
    account.delete()
    return Response({'message': f'Account {email} deleted'})


@api_view(['POST'])
def admin_send_magic_link(request, account_id):
    """Admin-only: send a magic login link directly to a host account."""
    from .firebase_auth import get_firebase_user
    from django.core.mail import send_mail
    from django.conf import settings
    from datetime import timedelta
    from django.utils import timezone
    from .models import HostAccessToken

    if not get_firebase_user(request):
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        account = HostAccount.objects.get(id=account_id)
    except HostAccount.DoesNotExist:
        return Response({'error': 'Host account not found'}, status=status.HTTP_404_NOT_FOUND)

    # Pick most recently created active event across all types
    candidates = (
        list(account.parties.filter(is_active=True)) +
        list(account.wedding_events.filter(is_active=True)) +
        list(account.baby_shower_events.filter(is_active=True))
    )
    if not candidates:
        # Fall back to most recent regardless of is_active
        candidates = list(account.parties.order_by('-created_at')[:1])
    default_event = max(candidates, key=lambda e: e.created_at) if candidates else None

    party = default_event if isinstance(default_event, BirthdayParty) else None
    wedding_evt = default_event if isinstance(default_event, WeddingEvent) else None
    baby_shower_evt = default_event if isinstance(default_event, BabyShowerEvent) else None

    token = HostAccessToken.objects.create(
        party=party,
        wedding_event=wedding_evt,
        baby_shower_event=baby_shower_evt,
        token_type='magic_link',
        expires_at=timezone.now() + timedelta(hours=24),
    )

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    magic_link = f"{frontend_url}/host/verify?token={token.token}"

    if party:
        subject = f"Your party management link — {party.birthday_person_name}'s Birthday"
        body = (
            f"Hi {party.host_name or 'there'},\n\n"
            f"Here is your link to manage {party.birthday_person_name}'s birthday party page:\n\n"
            f"{magic_link}\n\n"
            f"This link expires in 24 hours and can only be used once.\n\n"
            f"— RockStar Social"
        )
    elif wedding_evt:
        subject = f"Your wedding page management link — {wedding_evt.couple_name}"
        body = (
            f"Hi {wedding_evt.host_name or 'there'},\n\n"
            f"Here is your link to manage {wedding_evt.couple_name}'s wedding page:\n\n"
            f"{magic_link}\n\n"
            f"This link expires in 24 hours and can only be used once.\n\n"
            f"— RockStar Social"
        )
    elif baby_shower_evt:
        subject = f"Your baby shower page management link — {baby_shower_evt.parent_names}"
        body = (
            f"Hi {baby_shower_evt.host_name or 'there'},\n\n"
            f"Here is your link to manage {baby_shower_evt.parent_names}'s baby shower page:\n\n"
            f"{magic_link}\n\n"
            f"This link expires in 24 hours and can only be used once.\n\n"
            f"— RockStar Social"
        )
    else:
        subject = "Your RockStar Social login link"
        body = (
            f"Hi there,\n\n"
            f"Here is your link to access your RockStar Social account:\n\n"
            f"{magic_link}\n\n"
            f"This link expires in 24 hours and can only be used once.\n\n"
            f"— RockStar Social"
        )

    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[account.email],
        fail_silently=False,
    )

    return Response({'message': f'Login link sent to {account.email}'})


@api_view(['POST'])
def admin_send_magic_link_by_email(request):
    """Firebase-protected: send a magic login link to any host email (including orphaned events)."""
    from .firebase_auth import get_firebase_user
    from django.core.mail import send_mail
    from django.conf import settings
    from datetime import timedelta
    from django.utils import timezone
    from .models import HostAccessToken

    if not get_firebase_user(request):
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    email = request.data.get('email', '').strip().lower()
    if not email:
        return Response({'error': 'email is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Find the most recently created active event across all types for this email
    account = None
    try:
        account = HostAccount.objects.get(email__iexact=email)
    except HostAccount.DoesNotExist:
        pass

    candidates = []
    if account:
        candidates += list(account.parties.filter(is_active=True))
        candidates += list(account.wedding_events.filter(is_active=True))
        candidates += list(account.baby_shower_events.filter(is_active=True))

    if not candidates:
        for Model in [BirthdayParty, WeddingEvent, BabyShowerEvent]:
            try:
                candidates.append(Model.objects.filter(
                    host_email__iexact=email, is_active=True
                ).latest('created_at'))
            except Model.DoesNotExist:
                pass

    if not candidates:
        return Response(
            {'error': f'No active events found for {email}'},
            status=status.HTTP_404_NOT_FOUND,
        )

    default_event = max(candidates, key=lambda e: e.created_at)
    party = default_event if isinstance(default_event, BirthdayParty) else None
    wedding_evt = default_event if isinstance(default_event, WeddingEvent) else None
    baby_shower_evt = default_event if isinstance(default_event, BabyShowerEvent) else None

    token = HostAccessToken.objects.create(
        party=party,
        wedding_event=wedding_evt,
        baby_shower_event=baby_shower_evt,
        token_type='magic_link',
        expires_at=timezone.now() + timedelta(hours=24),
    )

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    magic_link = f"{frontend_url}/host/verify?token={token.token}"

    if party:
        subject = f"Your party management link — {party.birthday_person_name}'s Birthday"
        body = (
            f"Hi {party.host_name or 'there'},\n\n"
            f"Here is your link to manage {party.birthday_person_name}'s birthday party page:\n\n"
            f"{magic_link}\n\n"
            f"This link expires in 24 hours and can only be used once.\n\n"
            f"— RockStar Social"
        )
    elif wedding_evt:
        subject = f"Your wedding page management link — {wedding_evt.couple_name}"
        body = (
            f"Hi {wedding_evt.host_name or 'there'},\n\n"
            f"Here is your link to manage {wedding_evt.couple_name}'s wedding page:\n\n"
            f"{magic_link}\n\n"
            f"This link expires in 24 hours and can only be used once.\n\n"
            f"— RockStar Social"
        )
    elif baby_shower_evt:
        subject = f"Your baby shower page management link — {baby_shower_evt.parent_names}"
        body = (
            f"Hi {baby_shower_evt.host_name or 'there'},\n\n"
            f"Here is your link to manage {baby_shower_evt.parent_names}'s baby shower page:\n\n"
            f"{magic_link}\n\n"
            f"This link expires in 24 hours and can only be used once.\n\n"
            f"— RockStar Social"
        )
    else:
        subject = "Your RockStar Social login link"
        body = (
            f"Hi there,\n\n"
            f"Here is your link to access your RockStar Social account:\n\n"
            f"{magic_link}\n\n"
            f"This link expires in 24 hours and can only be used once.\n\n"
            f"— RockStar Social"
        )

    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )

    return Response({'message': f'Login link sent to {email}'})


# ─── Gift Registry ─────────────────────────────────────────────────────────────

def _serialize_gift(gift, is_host=False):
    return {
        'id': gift.id,
        'title': gift.title,
        'description': gift.description,
        'link_url': gift.link_url,
        'price': str(gift.price) if gift.price is not None else None,
        'claimed': bool(gift.claimed_by),
        'claimed_by': gift.claimed_by if is_host else None,
        'claimed_at': gift.claimed_at.isoformat() if gift.claimed_at else None,
        'order': gift.order,
        'created_at': gift.created_at.isoformat(),
    }


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def party_gifts(request, slug):
    party, err = _get_party_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        session_token = request.query_params.get('session_token', '')
        is_host = False
        if session_token:
            _, token_err = verify_host_session_by_token_str(session_token, slug)
            is_host = (token_err is None)
        return Response([_serialize_gift(g, is_host=is_host) for g in party.gift_items.all()])

    # POST — host only
    session_token = request.data.get('session_token', '')
    _, token_err = verify_host_session_by_token_str(session_token, slug)
    if token_err:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    title = request.data.get('title', '').strip()
    if not title:
        return Response({'error': 'title is required'}, status=status.HTTP_400_BAD_REQUEST)

    price = request.data.get('price')
    if price not in (None, ''):
        try:
            price = float(price)
            if price < 0:
                return Response({'error': 'price must be a positive number'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'price must be a valid number'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        price = None

    gift = GiftItem.objects.create(
        party=party,
        title=title,
        description=request.data.get('description', '').strip(),
        link_url=request.data.get('link_url', '').strip(),
        price=price,
        order=party.gift_items.count(),
    )
    return Response(_serialize_gift(gift, is_host=True), status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def claim_gift(request, slug, gift_id):
    party, err = _get_party_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)
    try:
        gift = GiftItem.objects.get(id=gift_id, party=party)
    except GiftItem.DoesNotExist:
        return Response({'error': 'Gift not found'}, status=status.HTTP_404_NOT_FOUND)
    if gift.claimed_by:
        return Response({'error': 'This gift has already been claimed'}, status=status.HTTP_400_BAD_REQUEST)
    claimer_name = request.data.get('claimer_name', '').strip()
    if not claimer_name:
        return Response({'error': 'claimer_name is required'}, status=status.HTTP_400_BAD_REQUEST)
    from django.utils import timezone as tz
    gift.claimed_by = claimer_name
    gift.claimed_at = tz.now()
    gift.save(update_fields=['claimed_by', 'claimed_at'])
    return Response(_serialize_gift(gift, is_host=False))


@api_view(['POST', 'DELETE'])
@permission_classes([AllowAny])
def manage_gift(request, slug, gift_id):
    party, err = _get_party_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)
    session_token = (
        request.query_params.get('session_token', '')
        if request.method == 'DELETE'
        else request.data.get('session_token', '')
    )
    _, token_err = verify_host_session_by_token_str(session_token, slug)
    if token_err:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    try:
        gift = GiftItem.objects.get(id=gift_id, party=party)
    except GiftItem.DoesNotExist:
        return Response({'error': 'Gift not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'DELETE':
        gift.delete()
        return Response({'message': 'Gift deleted'})
    # POST — unclaim
    gift.claimed_by = ''
    gift.claimed_at = None
    gift.save(update_fields=['claimed_by', 'claimed_at'])
    return Response(_serialize_gift(gift, is_host=True))


@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_birthday_slug(request, slug):
    token_str = request.headers.get('X-Host-Token', '').strip()
    party, err = verify_host_session_by_token_str(token_str, slug=slug)
    if err:
        return Response(err, status=status.HTTP_401_UNAUTHORIZED)

    new_slug = request.data.get('new_slug', '').strip().lower()
    if not new_slug:
        return Response({'error': 'new_slug is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not SLUG_PATTERN.match(new_slug):
        return Response({'error': 'Slug must contain only lowercase letters, numbers, and hyphens.'}, status=status.HTTP_400_BAD_REQUEST)
    if BirthdayParty.objects.filter(slug=new_slug).exclude(pk=party.pk).exists():
        return Response({'error': 'That URL is already taken. Please choose a different one.'}, status=status.HTTP_400_BAD_REQUEST)

    old_slug = party.slug
    SlugRedirect.objects.filter(new_slug=old_slug).update(new_slug=new_slug)
    SlugRedirect.objects.update_or_create(old_slug=old_slug, defaults={'new_slug': new_slug})
    party.slug = new_slug
    party.save(update_fields=['slug'])
    return Response({'slug': new_slug})


@api_view(['GET'])
@permission_classes([AllowAny])
def check_slug_redirect(request):
    slug = request.query_params.get('slug', '').strip()
    if not slug:
        return Response({'error': 'slug is required'}, status=status.HTTP_400_BAD_REQUEST)
    redirect = SlugRedirect.objects.filter(old_slug=slug).first()
    if redirect:
        return Response({'redirect_to': redirect.new_slug})
    return Response({'error': 'No redirect found'}, status=status.HTTP_404_NOT_FOUND)
