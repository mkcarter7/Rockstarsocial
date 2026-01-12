"""
Admin views with Firebase authentication
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import BasePermission
from .models import (
    PortfolioItem, Testimonial, PricingPlan,
    ThemeCategory, Theme, ContactSubmission, SiteSettings
)
from .serializers import (
    PortfolioItemSerializer, TestimonialSerializer, PricingPlanSerializer,
    ThemeCategorySerializer, ThemeSerializer, ContactSubmissionSerializer,
    SiteSettingsSerializer
)
from .firebase_auth import get_firebase_user, verify_firebase_token


class FirebasePermission(BasePermission):
    """Permission class that checks Firebase authentication"""
    def has_permission(self, request, view):
        user = get_firebase_user(request)
        if user:
            request.firebase_user = user
            return True
        return False


class AdminPortfolioViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing portfolio items"""
    queryset = PortfolioItem.objects.all()
    serializer_class = PortfolioItemSerializer
    permission_classes = [FirebasePermission]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AdminTestimonialViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing testimonials"""
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [FirebasePermission]


class AdminThemeViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing themes"""
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = [FirebasePermission]


class AdminThemeCategoryViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing theme categories"""
    queryset = ThemeCategory.objects.all()
    serializer_class = ThemeCategorySerializer
    permission_classes = [FirebasePermission]


class AdminContactSubmissionViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing contact submissions"""
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
    permission_classes = [FirebasePermission]
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a submission as read"""
        submission = self.get_object()
        submission.read = True
        submission.save()
        serializer = self.get_serializer(submission)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        """Mark a submission as unread"""
        submission = self.get_object()
        submission.read = False
        submission.save()
        serializer = self.get_serializer(submission)
        return Response(serializer.data)


class SiteSettingsView(APIView):
    """View for getting and updating site settings"""
    
    def get(self, request):
        """Get current site settings (public endpoint)"""
        settings = SiteSettings.load()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        """Update site settings (requires Firebase auth)"""
        # Check Firebase authentication for PUT requests
        user = get_firebase_user(request)
        if not user:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        settings = SiteSettings.load()
        serializer = SiteSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyTokenView(APIView):
    """Verify Firebase token endpoint"""
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token required'}, status=status.HTTP_400_BAD_REQUEST)
        
        decoded_token = verify_firebase_token(token)
        if decoded_token:
            return Response({
                'valid': True,
                'uid': decoded_token.get('uid'),
                'email': decoded_token.get('email')
            })
        else:
            return Response({'valid': False}, status=status.HTTP_401_UNAUTHORIZED)
