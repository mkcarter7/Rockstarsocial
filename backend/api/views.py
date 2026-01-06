from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    PortfolioItem, Testimonial, PricingPlan,
    ThemeCategory, Theme, ContactSubmission
)
from .serializers import (
    PortfolioItemSerializer, TestimonialSerializer, PricingPlanSerializer,
    ThemeCategorySerializer, ThemeSerializer, ContactSubmissionSerializer
)


class PortfolioItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PortfolioItem.objects.all()
    serializer_class = PortfolioItemSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_items = self.queryset.filter(featured=True)
        serializer = self.get_serializer(featured_items, many=True)
        return Response(serializer.data)


class TestimonialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_testimonials = self.queryset.filter(featured=True)
        serializer = self.get_serializer(featured_testimonials, many=True)
        return Response(serializer.data)


class PricingPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PricingPlan.objects.all()
    serializer_class = PricingPlanSerializer


class ThemeCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ThemeCategory.objects.all()
    serializer_class = ThemeCategorySerializer


class ThemeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    
    def get_queryset(self):
        queryset = Theme.objects.all()
        theme_type = self.request.query_params.get('type', None)
        category = self.request.query_params.get('category', None)
        
        if theme_type:
            queryset = queryset.filter(theme_type=theme_type)
        if category:
            queryset = queryset.filter(category__slug=category)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured_themes = self.queryset.filter(featured=True)
        serializer = self.get_serializer(featured_themes, many=True)
        return Response(serializer.data)


class ContactSubmissionViewSet(viewsets.ModelViewSet):
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {'message': 'Thank you for your message! We will get back to you soon.'},
            status=status.HTTP_201_CREATED,
            headers=headers
        )
