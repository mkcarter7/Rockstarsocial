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
    
    def update(self, request, *args, **kwargs):
        """Override update to handle partial updates with file uploads"""
        partial = True  # Always use partial update for file uploads
        instance = self.get_object()
        
        # Create a mutable copy of request.data if it's a QueryDict
        if hasattr(request.data, 'copy'):
            data = request.data.copy()
        else:
            data = dict(request.data)
        
        # If no image is provided in the request, don't include it in the update
        # This preserves the existing image
        if 'image' not in data or data.get('image') is None or data.get('image') == '':
            data.pop('image', None)
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
        
        return Response(serializer.data)


class AdminTestimonialViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing testimonials"""
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [FirebasePermission]
    
    def update(self, request, *args, **kwargs):
        """Override update to handle partial updates with file uploads"""
        partial = True  # Always use partial update for file uploads
        instance = self.get_object()
        
        # Create a mutable copy of request.data if it's a QueryDict
        if hasattr(request.data, 'copy'):
            data = request.data.copy()
        else:
            data = dict(request.data)
        
        # If no client_image is provided in the request, don't include it in the update
        # This preserves the existing image
        if 'client_image' not in data or data.get('client_image') is None or data.get('client_image') == '':
            data.pop('client_image', None)
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
        
        return Response(serializer.data)


class AdminThemeViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing themes"""
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = [FirebasePermission]
    
    def update(self, request, *args, **kwargs):
        """Override update to handle partial updates with file uploads"""
        partial = True  # Always use partial update for file uploads
        instance = self.get_object()
        
        # Create a mutable copy of request.data if it's a QueryDict
        if hasattr(request.data, 'copy'):
            data = request.data.copy()
        else:
            data = dict(request.data)
        
        # If no preview_image or download_file is provided, don't include them in the update
        # This preserves the existing files
        if 'preview_image' not in data or data.get('preview_image') is None or data.get('preview_image') == '':
            data.pop('preview_image', None)
        if 'download_file' not in data or data.get('download_file') is None or data.get('download_file') == '':
            data.pop('download_file', None)
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}
        
        return Response(serializer.data)


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
