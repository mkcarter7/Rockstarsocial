from rest_framework import serializers
from django.conf import settings
from .models import (
    PortfolioItem, Testimonial, PricingPlan,
    ThemeCategory, Theme, ThemePurchase, ContactSubmission, SiteSettings
)


def get_full_image_url(image_field_value, request=None):
    """Helper function to get full URL for image fields (handles S3 and local storage)"""
    if not image_field_value:
        return image_field_value
    
    # If image already has http/https (S3 URL), use it as-is
    if isinstance(image_field_value, str) and image_field_value.startswith(('http://', 'https://')):
        return image_field_value
    
    # Otherwise, build absolute URI
    if request:
        return request.build_absolute_uri(image_field_value)
    else:
        # Fallback for when request context is not available
        if hasattr(settings, 'MEDIA_URL') and settings.MEDIA_URL.startswith('http'):
            # S3 is configured
            return f"{settings.MEDIA_URL.rstrip('/')}/{image_field_value.lstrip('/')}"
        else:
            # Local storage fallback
            return f"http://localhost:8000/media/{image_field_value}"


class PortfolioItemSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = PortfolioItem
        fields = '__all__'
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if representation.get('image'):
            representation['image'] = get_full_image_url(representation['image'], request)
        return representation


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = '__all__'
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if representation.get('client_image'):
            representation['client_image'] = get_full_image_url(representation['client_image'], request)
        return representation


class PricingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingPlan
        fields = '__all__'


class ThemeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ThemeCategory
        fields = '__all__'


class ThemeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    theme_type_display = serializers.CharField(source='get_theme_type_display', read_only=True)
    
    class Meta:
        model = Theme
        fields = '__all__'
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if representation.get('preview_image'):
            representation['preview_image'] = get_full_image_url(representation['preview_image'], request)
        if representation.get('download_file'):
            representation['download_file'] = get_full_image_url(representation['download_file'], request)
        return representation


class ContactSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = '__all__'
        read_only_fields = ['created_at', 'read']


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = '__all__'
        read_only_fields = ['updated_at']
