"""
Admin views with Firebase authentication
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import BasePermission
from django.core.exceptions import ValidationError

# Try to import boto3 exceptions for better error handling
try:
    from botocore.exceptions import ClientError as BotoClientError
except ImportError:
    BotoClientError = None
from .models import (
    PortfolioItem, Testimonial, ThemePackage,
    ThemeCategory, Theme, ContactSubmission, SiteSettings
)
from .serializers import (
    PortfolioItemSerializer, TestimonialSerializer, ThemePackageSerializer,
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
        try:
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
            
            # Convert string booleans to actual booleans (FormData sends strings)
            if 'featured' in data:
                featured_value = data.get('featured')
                if isinstance(featured_value, str):
                    data['featured'] = featured_value.lower() in ('true', '1', 'yes', 'on')
                elif featured_value is None or featured_value == '':
                    data.pop('featured', None)
            
            # Convert empty strings to None for optional fields that allow null
            if 'website_url' in data and data['website_url'] == '':
                data['website_url'] = None
            
            serializer = self.get_serializer(instance, data=data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            if getattr(instance, '_prefetched_objects_cache', None):
                instance._prefetched_objects_cache = {}
            
            return Response(serializer.data)
            
        except Exception as e:
            # Log the error for debugging
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Error updating portfolio item: {str(e)}\n{traceback.format_exc()}")
            
            # Check for specific S3/boto3 errors
            error_type = type(e).__name__
            error_message = str(e)
            
            # Handle boto3 ClientError (from botocore.exceptions)
            if BotoClientError and isinstance(e, BotoClientError):
                return Response(
                    {
                        'error': 'Failed to upload image to S3 storage.',
                        'details': f'S3 error: {error_message}. Please check S3 bucket configuration, permissions, and credentials.'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Handle Django ClientError or any error with "ClientError" in the message
            if 'ClientError' in error_type or 'ClientError' in error_message:
                return Response(
                    {
                        'error': 'Storage error occurred.',
                        'details': f'{error_message}. Please check S3 configuration if USE_S3 is enabled.'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Handle other AWS/S3 related errors
            if any(keyword in error_message.lower() for keyword in ['aws', 's3', 'boto', 'bucket', 'access denied', 'nosuchbucket', 'invalidaccesskeyid']):
                return Response(
                    {
                        'error': 'S3 storage error.',
                        'details': 'Please verify your S3 configuration and credentials in Railway environment variables.'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Handle Django validation errors
            from django.core.exceptions import ValidationError
            if isinstance(e, ValidationError):
                return Response(
                    {
                        'error': 'Validation error.',
                        'details': str(e)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generic error - return JSON instead of letting Django return HTML
            return Response(
                {
                    'error': 'Failed to save portfolio item.',
                    'details': error_message
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminTestimonialViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing testimonials"""
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [FirebasePermission]
    
    def create(self, request, *args, **kwargs):
        """Override create to handle file uploads with proper error handling"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            from django.conf import settings
            logger.info(f"Creating testimonial - USE_S3: {getattr(settings, 'USE_S3', False)}")
            
            # Create a mutable copy of request.data if it's a QueryDict
            if hasattr(request.data, 'copy'):
                data = request.data.copy()
            else:
                data = dict(request.data)
            
            # Convert string booleans to actual booleans (FormData sends strings)
            if 'featured' in data:
                featured_value = data.get('featured')
                if isinstance(featured_value, str):
                    data['featured'] = featured_value.lower() in ('true', '1', 'yes', 'on')
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            
            logger.info(f"Testimonial validated, saving... Client image present: {bool(request.data.get('client_image'))}")
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            instance = serializer.instance
            if instance and instance.client_image:
                logger.info(f"Testimonial created successfully. Client image: {instance.client_image.name}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            import traceback
            logger.error(f"Error creating testimonial: {str(e)}\n{traceback.format_exc()}")
            
            error_message = str(e)
            if BotoClientError and isinstance(e, BotoClientError):
                return Response(
                    {
                        'error': 'Failed to upload image to S3 storage.',
                        'details': f'S3 error: {error_message}'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(
                {
                    'error': 'Failed to create testimonial.',
                    'details': error_message
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
        
        # Convert string booleans to actual booleans (FormData sends strings)
        if 'featured' in data:
            featured_value = data.get('featured')
            if isinstance(featured_value, str):
                data['featured'] = featured_value.lower() in ('true', '1', 'yes', 'on')
            elif featured_value is None or featured_value == '':
                data.pop('featured', None)
        
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
    
    def create(self, request, *args, **kwargs):
        """Override create to handle file uploads with proper error handling"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            from django.conf import settings
            logger.info(f"Creating theme - USE_S3: {getattr(settings, 'USE_S3', False)}")
            
            # Create a mutable copy of request.data if it's a QueryDict
            if hasattr(request.data, 'copy'):
                data = request.data.copy()
            else:
                data = dict(request.data)
            
            # Convert string booleans to actual booleans (FormData sends strings)
            if 'featured' in data:
                featured_value = data.get('featured')
                if isinstance(featured_value, str):
                    data['featured'] = featured_value.lower() in ('true', '1', 'yes', 'on')
            
            # Handle features JSON string
            if 'features' in data and isinstance(data.get('features'), str):
                try:
                    import json
                    features_json = json.loads(data['features'])
                    if isinstance(features_json, list):
                        data['features'] = features_json
                except (json.JSONDecodeError, ValueError):
                    # If JSON parsing fails, treat as empty list
                    data['features'] = []
            
            # Convert empty strings to None for optional fields
            if 'demo_url' in data and data['demo_url'] == '':
                data['demo_url'] = None
            if 'category' in data and data['category'] == '':
                data.pop('category', None)
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            
            logger.info(f"Theme validated, saving... Preview image present: {bool(request.data.get('preview_image'))}")
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            instance = serializer.instance
            if instance and instance.preview_image:
                logger.info(f"Theme created successfully. Preview image: {instance.preview_image.name}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            import traceback
            logger.error(f"Error creating theme: {str(e)}\n{traceback.format_exc()}")
            
            error_message = str(e)
            if BotoClientError and isinstance(e, BotoClientError):
                return Response(
                    {
                        'error': 'Failed to upload file to S3 storage.',
                        'details': f'S3 error: {error_message}'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Handle Django validation errors
            from django.core.exceptions import ValidationError
            if isinstance(e, ValidationError):
                return Response(
                    {
                        'error': 'Validation error.',
                        'details': str(e)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response(
                {
                    'error': 'Failed to create theme.',
                    'details': error_message
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Override update to handle partial updates with file uploads"""
        try:
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
            
            # Convert string booleans to actual booleans (FormData sends strings)
            if 'featured' in data:
                featured_value = data.get('featured')
                if isinstance(featured_value, str):
                    data['featured'] = featured_value.lower() in ('true', '1', 'yes', 'on')
                elif featured_value is None or featured_value == '':
                    data.pop('featured', None)
            
            # Handle features JSON string
            if 'features' in data and isinstance(data.get('features'), str):
                try:
                    import json
                    features_json = json.loads(data['features'])
                    if isinstance(features_json, list):
                        data['features'] = features_json
                except (json.JSONDecodeError, ValueError):
                    # If JSON parsing fails, treat as empty list
                    data['features'] = []
            
            # Convert empty strings to None for optional fields
            if 'demo_url' in data and data['demo_url'] == '':
                data['demo_url'] = None
            if 'category' in data and data['category'] == '':
                data.pop('category', None)
            
            serializer = self.get_serializer(instance, data=data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            if getattr(instance, '_prefetched_objects_cache', None):
                instance._prefetched_objects_cache = {}
            
            return Response(serializer.data)
            
        except Exception as e:
            # Log the error for debugging
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Error updating theme: {str(e)}\n{traceback.format_exc()}")
            
            # Check for specific S3/boto3 errors
            error_type = type(e).__name__
            error_message = str(e)
            
            # Handle boto3 ClientError (from botocore.exceptions)
            if BotoClientError and isinstance(e, BotoClientError):
                return Response(
                    {
                        'error': 'Failed to upload file to S3 storage.',
                        'details': f'S3 error: {error_message}. Please check S3 bucket configuration, permissions, and credentials.'
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Handle Django validation errors
            from django.core.exceptions import ValidationError
            if isinstance(e, ValidationError):
                return Response(
                    {
                        'error': 'Validation error.',
                        'details': str(e)
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generic error - return JSON instead of letting Django return HTML
            return Response(
                {
                    'error': 'Failed to save theme.',
                    'details': error_message
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminThemePackageViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing website theme packages"""
    queryset = ThemePackage.objects.all()
    serializer_class = ThemePackageSerializer
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
