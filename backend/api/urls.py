from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PortfolioItemViewSet, TestimonialViewSet, PricingPlanViewSet,
    ThemeCategoryViewSet, ThemeViewSet, ContactSubmissionViewSet
)

router = DefaultRouter()
router.register(r'portfolio', PortfolioItemViewSet, basename='portfolio')
router.register(r'testimonials', TestimonialViewSet, basename='testimonials')
router.register(r'pricing', PricingPlanViewSet, basename='pricing')
router.register(r'theme-categories', ThemeCategoryViewSet, basename='theme-categories')
router.register(r'themes', ThemeViewSet, basename='themes')
router.register(r'contact', ContactSubmissionViewSet, basename='contact')

urlpatterns = [
    path('', include(router.urls)),
]
