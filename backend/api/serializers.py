from rest_framework import serializers
from .models import (
    PortfolioItem, Testimonial, PricingPlan,
    ThemeCategory, Theme, ContactSubmission
)


class PortfolioItemSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = PortfolioItem
        fields = '__all__'
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Add full URL to image if it exists
        if representation.get('image'):
            request = self.context.get('request')
            if request:
                representation['image'] = request.build_absolute_uri(representation['image'])
            else:
                # Fallback for when request context is not available
                representation['image'] = f"http://localhost:8000/media/{representation['image']}"
        return representation


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = '__all__'


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
    
    class Meta:
        model = Theme
        fields = '__all__'


class ContactSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = '__all__'
        read_only_fields = ['created_at', 'read']
