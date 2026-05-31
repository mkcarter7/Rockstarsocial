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
from .models import (
    BirthdayParty, PartyPhoto, GuestBookEntry,
    PartyRSVP, TriviaQuestion, TriviaScore
)

logger = logging.getLogger(__name__)


def _get_party_or_404(slug):
    """Return party if active and not expired, else None with error dict."""
    try:
        party = BirthdayParty.objects.get(slug=slug)
    except BirthdayParty.DoesNotExist:
        return None, {'error': 'Party not found'}

    if party.is_expired:
        party.delete()
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
        'banner_image': banner_url,
        'expires_at': party.expires_at.isoformat(),
        'rsvp_count': party.rsvps.filter(status='yes').count(),
    }


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
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            party = BirthdayParty.objects.get(stripe_session_id=session_id)
        except BirthdayParty.DoesNotExist:
            return Response({'error': 'Party not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'slug': party.slug,
            'birthday_person_name': party.birthday_person_name,
            'party_date': party.party_date.isoformat(),
            'host_name': party.host_name,
            'is_active': party.is_active,
            'theme_color': party.theme_color,
            'welcome_message': party.welcome_message,
            'party_time': party.party_time.strftime('%H:%M') if party.party_time else '',
            'location_name': party.location_name,
            'location_address': party.location_address,
        })

    # POST — save setup
    session_id = request.data.get('session_id')
    if not session_id:
        return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        party = BirthdayParty.objects.get(stripe_session_id=session_id)
    except BirthdayParty.DoesNotExist:
        return Response({'error': 'Party not found'}, status=status.HTTP_404_NOT_FOUND)

    if 'theme_color' in request.data:
        party.theme_color = request.data['theme_color']
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

    # Activate the party when the host completes setup — payment is confirmed
    # because only Stripe's success redirect carries a valid session_id.
    party.is_active = True
    party.save()
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
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_photo(request, slug, photo_id):
    """Host-only delete. Verified via session_id query param."""
    session_id = request.query_params.get('session_id')
    try:
        party = BirthdayParty.objects.get(slug=slug, stripe_session_id=session_id)
    except BirthdayParty.DoesNotExist:
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    try:
        photo = PartyPhoto.objects.get(id=photo_id, party=party)
        photo.delete()
        return Response({'message': 'Photo deleted'})
    except PartyPhoto.DoesNotExist:
        return Response({'error': 'Photo not found'}, status=status.HTTP_404_NOT_FOUND)


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

    # POST — host adds a question (verified via session_id)
    session_id = request.data.get('session_id')
    if not session_id or party.stripe_session_id != session_id:
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
    return {
        'id': p.id,
        'event_type': event_type,
        'slug': p.slug,
        'name': p.birthday_person_name,
        'party_date': p.party_date.isoformat(),
        'host_email': p.host_email,
        'is_active': p.is_active,
        'is_expired': p.is_expired,
        'expires_at': p.expires_at.isoformat(),
        'created_at': p.created_at.isoformat(),
    }


# Event type registry — add new models here as they are created
EVENT_TYPE_MODELS = {
    'birthday': BirthdayParty,
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
        page = Model.objects.get(id=page_id)
    except Model.DoesNotExist:
        return Response({'error': 'Event page not found'}, status=status.HTTP_404_NOT_FOUND)

    page.delete()
    return Response({'message': 'Event page deleted'}, status=status.HTTP_200_OK)


@api_view(['GET'])
def admin_birthday_parties(request):
    """Legacy alias — kept for backwards compatibility."""
    return admin_event_pages(request)


# ─── Cleanup management command helper ────────────────────────────────────────

def cleanup_expired_parties():
    """Delete all expired parties. Call from a management command or scheduled task."""
    deleted = 0
    for party in BirthdayParty.objects.filter(is_active=True):
        if party.is_expired:
            party.delete()
            deleted += 1
    # Also clean up abandoned checkouts older than 24 hours
    from django.utils import timezone
    cutoff = timezone.now() - timedelta(hours=24)
    abandoned = BirthdayParty.objects.filter(is_active=False, created_at__lt=cutoff)
    abandoned_count = abandoned.count()
    abandoned.delete()
    return deleted, abandoned_count
