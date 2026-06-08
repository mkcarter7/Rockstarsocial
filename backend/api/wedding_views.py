"""
Wedding app API views
"""
import logging
from datetime import date, timedelta
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import (
    WeddingEvent, WeddingPhoto, WeddingGuestBookEntry,
    WeddingRSVP, WeddingStoryEntry, WeddingGiftItem,
    WeddingPartyMember, WeddingScheduleItem, WeddingFAQItem, WeddingSongRequest,
)
from .host_auth_views import verify_host_session_by_token_str

logger = logging.getLogger(__name__)


def _delete_wedding_and_maybe_account(event):
    """Delete a wedding event, then delete its HostAccount if it owns no other events."""
    host_account = event.host_account
    event.delete()
    if host_account is not None:
        has_birthday = host_account.parties.exists()
        has_wedding = host_account.wedding_events.exists()
        if not has_birthday and not has_wedding:
            host_account.delete()


def _get_event_or_404(slug):
    """Return event if active and not expired, else None with error dict."""
    try:
        event = WeddingEvent.objects.select_related('host_account').get(slug=slug)
    except WeddingEvent.DoesNotExist:
        return None, {'error': 'Wedding not found'}

    if event.is_expired:
        _delete_wedding_and_maybe_account(event)
        return None, {'error': 'This wedding has expired'}

    if not event.is_active:
        return None, {'error': 'This wedding is not yet active'}

    return event, None


def _serialize_event(event, request=None):
    banner_url = None
    if event.banner_image:
        banner_url = request.build_absolute_uri(event.banner_image.url) if request else event.banner_image.url

    return {
        'slug': event.slug,
        'couple_name': event.couple_name,
        'wedding_date': event.wedding_date.isoformat(),
        'party_date': event.wedding_date.isoformat(),  # alias for frontend countdown compat
        'party_time': event.party_time.strftime('%H:%M') if event.party_time else None,
        'location_name': event.location_name,
        'location_address': event.location_address,
        'welcome_message': event.welcome_message,
        'host_name': event.host_name,
        'theme_color': event.theme_color,
        'secondary_color': event.secondary_color,
        'banner_image': banner_url,
        'expires_at': event.expires_at.isoformat(),
        'rsvp_count': event.rsvps.filter(status='yes').count(),
        'gift_registry_url': event.gift_registry_url,
        'venmo_handle': event.venmo_handle,
        'cashapp_handle': event.cashapp_handle,
        'party_type': 'wedding',
    }


def _send_welcome_email(event):
    """Send welcome email after wedding page is activated."""
    from django.core.mail import send_mail
    from django.conf import settings
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    try:
        send_mail(
            subject=f"Your wedding page is live — {event.couple_name}",
            message=(
                f"Hi {event.host_name or 'there'},\n\n"
                f"Your wedding page is now live!\n\n"
                f"Wedding page: {frontend_url}/{event.slug}\n\n"
                f"Share this link with your guests so they can RSVP, sign the guestbook, "
                f"upload photos, and read your story.\n\n"
                f"To manage your wedding page anytime (edit colors, welcome message, or add story moments), visit:\n"
                f"{frontend_url}/host/login\n\n"
                f"Just enter this email address ({event.host_email}) to receive a login link.\n\n"
                f"Wishing you a beautiful wedding day!\n— RockStar Social"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[event.host_email],
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Failed to send wedding welcome email to {event.host_email}: {e}")


# ─── Public endpoints ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def check_slug(request):
    """GET /api/wedding/check-slug/?slug=sarah-and-james"""
    slug = request.query_params.get('slug', '').strip().lower()
    if not slug:
        return Response({'error': 'slug is required'}, status=status.HTTP_400_BAD_REQUEST)
    taken = WeddingEvent.objects.filter(slug=slug).exists()
    return Response({'available': not taken, 'slug': slug})


@api_view(['GET'])
@permission_classes([AllowAny])
def event_detail(request, slug):
    """GET /api/wedding/<slug>/"""
    event, err = _get_event_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)
    return Response(_serialize_event(event, request))


# ─── Setup (post-purchase) ────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def event_setup(request):
    """
    GET  /api/wedding/setup/?session_id=xxx   — fetch pending event for setup page
    POST /api/wedding/setup/                  — save customization
    """
    if request.method == 'GET':
        session_id = request.query_params.get('session_id')
        session_token = request.query_params.get('session_token')

        if session_token:
            event, err = verify_host_session_by_token_str(session_token)
            if err:
                return Response(err, status=status.HTTP_401_UNAUTHORIZED)
            if not isinstance(event, WeddingEvent):
                # Token belongs to a birthday party, not a wedding
                return Response({'error': 'Session token does not match a wedding event'}, status=status.HTTP_401_UNAUTHORIZED)
        elif session_id:
            try:
                event = WeddingEvent.objects.get(stripe_session_id=session_id)
            except WeddingEvent.DoesNotExist:
                return Response({'error': 'Wedding not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'session_id or session_token is required'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'slug': event.slug,
            'couple_name': event.couple_name,
            'wedding_date': event.wedding_date.isoformat(),
            'host_name': event.host_name,
            'is_active': event.is_active,
            'theme_color': event.theme_color,
            'secondary_color': event.secondary_color,
            'welcome_message': event.welcome_message,
            'party_time': event.party_time.strftime('%H:%M') if event.party_time else '',
            'location_name': event.location_name,
            'location_address': event.location_address,
            'gift_registry_url': event.gift_registry_url,
            'venmo_handle': event.venmo_handle,
            'cashapp_handle': event.cashapp_handle,
            'banner_image': request.build_absolute_uri(event.banner_image.url) if event.banner_image else None,
        })

    # POST — save setup
    session_id = request.data.get('session_id')
    session_token = request.data.get('session_token')

    if session_token:
        event, err = verify_host_session_by_token_str(session_token)
        if err:
            return Response(err, status=status.HTTP_401_UNAUTHORIZED)
        if not isinstance(event, WeddingEvent):
            return Response({'error': 'Session token does not match a wedding event'}, status=status.HTTP_401_UNAUTHORIZED)
    elif session_id:
        try:
            event = WeddingEvent.objects.get(stripe_session_id=session_id)
        except WeddingEvent.DoesNotExist:
            return Response({'error': 'Wedding not found'}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({'error': 'session_id or session_token is required'}, status=status.HTTP_400_BAD_REQUEST)

    was_active = event.is_active

    if 'theme_color' in request.data:
        event.theme_color = request.data['theme_color']
    if 'secondary_color' in request.data:
        event.secondary_color = request.data['secondary_color']
    if 'welcome_message' in request.data:
        event.welcome_message = request.data['welcome_message']
    if 'banner_image' in request.FILES:
        event.banner_image = request.FILES['banner_image']
    if 'party_time' in request.data:
        event.party_time = request.data['party_time'] or None
    if 'location_name' in request.data:
        event.location_name = request.data['location_name']
    if 'location_address' in request.data:
        event.location_address = request.data['location_address']
    if 'gift_registry_url' in request.data:
        event.gift_registry_url = request.data['gift_registry_url'].strip()
    if 'venmo_handle' in request.data:
        event.venmo_handle = request.data['venmo_handle'].strip().lstrip('@')
    if 'cashapp_handle' in request.data:
        event.cashapp_handle = request.data['cashapp_handle'].strip().lstrip('$')

    if session_id:
        event.is_active = True

    event.save()

    if session_id and not was_active:
        _send_welcome_email(event)

    return Response({'slug': event.slug, 'message': 'Wedding updated'})


# ─── Photos ───────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def event_photos(request, slug):
    event, err = _get_event_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        data = []
        for p in event.photos.all():
            url = request.build_absolute_uri(p.image.url) if request else p.image.url
            data.append({
                'id': p.id,
                'image': url,
                'caption': p.caption,
                'uploaded_by_name': p.uploaded_by_name,
                'uploaded_at': p.uploaded_at.isoformat(),
            })
        return Response(data)

    if 'image' not in request.FILES:
        return Response({'error': 'image is required'}, status=status.HTTP_400_BAD_REQUEST)

    photo = WeddingPhoto.objects.create(
        event=event,
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
    }, status=status.HTTP_201_CREATED)


# ─── Guest book ───────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def event_guestbook(request, slug):
    event, err = _get_event_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response([{
            'id': e.id,
            'author_name': e.author_name,
            'message': e.message,
            'created_at': e.created_at.isoformat(),
        } for e in event.guestbook_entries.all()])

    author_name = request.data.get('author_name', '').strip()
    message = request.data.get('message', '').strip()
    if not author_name or not message:
        return Response({'error': 'author_name and message are required'}, status=status.HTTP_400_BAD_REQUEST)

    entry = WeddingGuestBookEntry.objects.create(event=event, author_name=author_name, message=message)
    return Response({
        'id': entry.id,
        'author_name': entry.author_name,
        'message': entry.message,
        'created_at': entry.created_at.isoformat(),
    }, status=status.HTTP_201_CREATED)


# ─── RSVP ─────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def event_rsvp(request, slug):
    event, err = _get_event_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        rsvps = event.rsvps.all()
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

    name = request.data.get('name', '').strip()
    rsvp_status = request.data.get('status', '')
    if not name or rsvp_status not in ('yes', 'no', 'maybe'):
        return Response({'error': 'name and valid status (yes/no/maybe) are required'}, status=status.HTTP_400_BAD_REQUEST)

    rsvp = WeddingRSVP.objects.create(
        event=event,
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


# ─── Our Story ────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def event_story(request, slug):
    """
    GET  /api/wedding/<slug>/story/ — public list of story entries
    POST /api/wedding/<slug>/story/ — host-only: add a story entry
    """
    event, err = _get_event_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response([{
            'id': e.id,
            'date_label': e.date_label,
            'title': e.title,
            'description': e.description,
            'order': e.order,
        } for e in event.story_entries.all()])

    # POST — host only
    session_id = request.data.get('session_id')
    session_token = request.data.get('session_token')
    if session_token:
        _, token_err = verify_host_session_by_token_str(session_token, slug)
        if token_err:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    elif not session_id or event.stripe_session_id != session_id:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    date_label = request.data.get('date_label', '').strip()
    title = request.data.get('title', '').strip()
    if not date_label or not title:
        return Response({'error': 'date_label and title are required'}, status=status.HTTP_400_BAD_REQUEST)

    entry = WeddingStoryEntry.objects.create(
        event=event,
        date_label=date_label,
        title=title,
        description=request.data.get('description', '').strip(),
        order=event.story_entries.count(),
    )
    return Response({
        'id': entry.id,
        'date_label': entry.date_label,
        'title': entry.title,
        'description': entry.description,
        'order': entry.order,
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_story_entry(request, slug, entry_id):
    """DELETE /api/wedding/<slug>/story/<entry_id>/?session_token=xxx — host only"""
    session_token = request.query_params.get('session_token', '')
    _, token_err = verify_host_session_by_token_str(session_token, slug)
    if token_err:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    try:
        event = WeddingEvent.objects.get(slug=slug)
        entry = WeddingStoryEntry.objects.get(id=entry_id, event=event)
        entry.delete()
        return Response({'message': 'Story entry deleted'})
    except (WeddingEvent.DoesNotExist, WeddingStoryEntry.DoesNotExist):
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


# ─── Gift Registry ────────────────────────────────────────────────────────────

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
def event_gifts(request, slug):
    event, err = _get_event_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        session_token = request.query_params.get('session_token', '')
        is_host = False
        if session_token:
            _, token_err = verify_host_session_by_token_str(session_token, slug)
            is_host = (token_err is None)
        return Response([_serialize_gift(g, is_host=is_host) for g in event.gift_items.all()])

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

    gift = WeddingGiftItem.objects.create(
        event=event,
        title=title,
        description=request.data.get('description', '').strip(),
        link_url=request.data.get('link_url', '').strip(),
        price=price,
        order=event.gift_items.count(),
    )
    return Response(_serialize_gift(gift, is_host=True), status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def claim_gift(request, slug, gift_id):
    event, err = _get_event_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)
    try:
        gift = WeddingGiftItem.objects.get(id=gift_id, event=event)
    except WeddingGiftItem.DoesNotExist:
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
    event, err = _get_event_or_404(slug)
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
        gift = WeddingGiftItem.objects.get(id=gift_id, event=event)
    except WeddingGiftItem.DoesNotExist:
        return Response({'error': 'Gift not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'DELETE':
        gift.delete()
        return Response({'message': 'Gift deleted'})
    # POST — unclaim
    gift.claimed_by = ''
    gift.claimed_at = None
    gift.save(update_fields=['claimed_by', 'claimed_at'])
    return Response(_serialize_gift(gift, is_host=True))


# ─── Wedding Party Members ───────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def event_party_members(request, slug):
    event, err = _get_event_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        data = []
        for m in event.party_members.all():
            photo_url = request.build_absolute_uri(m.photo.url) if m.photo else None
            data.append({
                'id': m.id, 'name': m.name, 'role': m.role,
                'photo': photo_url, 'bio': m.bio, 'order': m.order,
            })
        return Response(data)

    session_token = request.data.get('session_token', '')
    _, token_err = verify_host_session_by_token_str(session_token, slug)
    if token_err:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    name = request.data.get('name', '').strip()
    role = request.data.get('role', '').strip()
    if not name or not role:
        return Response({'error': 'name and role are required'}, status=status.HTTP_400_BAD_REQUEST)

    member = WeddingPartyMember.objects.create(
        event=event, name=name, role=role,
        bio=request.data.get('bio', '').strip(),
        order=event.party_members.count(),
    )
    if 'photo' in request.FILES:
        member.photo = request.FILES['photo']
        member.save(update_fields=['photo'])

    photo_url = request.build_absolute_uri(member.photo.url) if member.photo else None
    return Response({
        'id': member.id, 'name': member.name, 'role': member.role,
        'photo': photo_url, 'bio': member.bio, 'order': member.order,
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def manage_party_member(request, slug, member_id):
    session_token = request.query_params.get('session_token', '')
    _, token_err = verify_host_session_by_token_str(session_token, slug)
    if token_err:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    try:
        event = WeddingEvent.objects.get(slug=slug)
        member = WeddingPartyMember.objects.get(id=member_id, event=event)
        member.delete()
        return Response({'message': 'Member deleted'})
    except (WeddingEvent.DoesNotExist, WeddingPartyMember.DoesNotExist):
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


# ─── Schedule ─────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def event_schedule(request, slug):
    event, err = _get_event_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response([{
            'id': s.id, 'name': s.name,
            'event_date': s.event_date.isoformat() if s.event_date else None,
            'event_time': s.event_time.strftime('%H:%M') if s.event_time else None,
            'location_name': s.location_name, 'description': s.description, 'order': s.order,
        } for s in event.schedule_items.all()])

    session_token = request.data.get('session_token', '')
    _, token_err = verify_host_session_by_token_str(session_token, slug)
    if token_err:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    name = request.data.get('name', '').strip()
    if not name:
        return Response({'error': 'name is required'}, status=status.HTTP_400_BAD_REQUEST)

    item = WeddingScheduleItem.objects.create(
        event=event, name=name,
        event_date=request.data.get('event_date') or None,
        event_time=request.data.get('event_time') or None,
        location_name=request.data.get('location_name', '').strip(),
        description=request.data.get('description', '').strip(),
        order=event.schedule_items.count(),
    )
    return Response({
        'id': item.id, 'name': item.name,
        'event_date': item.event_date.isoformat() if item.event_date else None,
        'event_time': item.event_time.strftime('%H:%M') if item.event_time else None,
        'location_name': item.location_name, 'description': item.description, 'order': item.order,
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def manage_schedule_item(request, slug, item_id):
    session_token = request.query_params.get('session_token', '')
    _, token_err = verify_host_session_by_token_str(session_token, slug)
    if token_err:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    try:
        event = WeddingEvent.objects.get(slug=slug)
        item = WeddingScheduleItem.objects.get(id=item_id, event=event)
        item.delete()
        return Response({'message': 'Schedule item deleted'})
    except (WeddingEvent.DoesNotExist, WeddingScheduleItem.DoesNotExist):
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


# ─── FAQ ──────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def event_faq(request, slug):
    event, err = _get_event_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response([{
            'id': f.id, 'question': f.question, 'answer': f.answer, 'order': f.order,
        } for f in event.faq_items.all()])

    session_token = request.data.get('session_token', '')
    _, token_err = verify_host_session_by_token_str(session_token, slug)
    if token_err:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    question = request.data.get('question', '').strip()
    answer = request.data.get('answer', '').strip()
    if not question or not answer:
        return Response({'error': 'question and answer are required'}, status=status.HTTP_400_BAD_REQUEST)

    item = WeddingFAQItem.objects.create(
        event=event, question=question, answer=answer,
        order=event.faq_items.count(),
    )
    return Response({
        'id': item.id, 'question': item.question, 'answer': item.answer, 'order': item.order,
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def manage_faq_item(request, slug, item_id):
    session_token = request.query_params.get('session_token', '')
    _, token_err = verify_host_session_by_token_str(session_token, slug)
    if token_err:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    try:
        event = WeddingEvent.objects.get(slug=slug)
        item = WeddingFAQItem.objects.get(id=item_id, event=event)
        item.delete()
        return Response({'message': 'FAQ item deleted'})
    except (WeddingEvent.DoesNotExist, WeddingFAQItem.DoesNotExist):
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


# ─── Song Requests ────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def event_song_requests(request, slug):
    event, err = _get_event_or_404(slug)
    if err:
        return Response(err, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response([{
            'id': r.id, 'song_title': r.song_title, 'artist': r.artist,
            'requested_by': r.requested_by, 'created_at': r.created_at.isoformat(),
        } for r in event.song_requests.all()])

    song_title = request.data.get('song_title', '').strip()
    if not song_title:
        return Response({'error': 'song_title is required'}, status=status.HTTP_400_BAD_REQUEST)

    req = WeddingSongRequest.objects.create(
        event=event,
        song_title=song_title,
        artist=request.data.get('artist', '').strip(),
        requested_by=request.data.get('requested_by', '').strip(),
    )
    return Response({
        'id': req.id, 'song_title': req.song_title, 'artist': req.artist,
        'requested_by': req.requested_by, 'created_at': req.created_at.isoformat(),
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def manage_song_request(request, slug, req_id):
    session_token = request.query_params.get('session_token', '')
    _, token_err = verify_host_session_by_token_str(session_token, slug)
    if token_err:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
    try:
        event = WeddingEvent.objects.get(slug=slug)
        req = WeddingSongRequest.objects.get(id=req_id, event=event)
        req.delete()
        return Response({'message': 'Song request deleted'})
    except (WeddingEvent.DoesNotExist, WeddingSongRequest.DoesNotExist):
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


# ─── Cleanup helper ───────────────────────────────────────────────────────────

def cleanup_expired_weddings():
    deleted = 0
    for event in WeddingEvent.objects.filter(is_active=True).select_related('host_account'):
        if event.is_expired:
            _delete_wedding_and_maybe_account(event)
            deleted += 1
    from django.utils import timezone
    cutoff = timezone.now() - __import__('datetime').timedelta(hours=24)
    abandoned = list(WeddingEvent.objects.filter(is_active=False, created_at__lt=cutoff).select_related('host_account'))
    for event in abandoned:
        _delete_wedding_and_maybe_account(event)
    return deleted, len(abandoned)
