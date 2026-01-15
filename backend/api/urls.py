from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PortfolioItemViewSet, TestimonialViewSet, PricingPlanViewSet,
    ThemeCategoryViewSet, ThemeViewSet, ContactSubmissionViewSet
)
from .admin_views import (
    AdminPortfolioViewSet, AdminTestimonialViewSet, AdminPricingPlanViewSet,
    AdminThemeViewSet, AdminThemeCategoryViewSet, AdminContactSubmissionViewSet,
    VerifyTokenView, SiteSettingsView
)
from .stripe_views import create_checkout_session, stripe_webhook, check_purchase_status

router = DefaultRouter()
router.register(r'portfolio', PortfolioItemViewSet, basename='portfolio')
router.register(r'testimonials', TestimonialViewSet, basename='testimonials')
router.register(r'pricing', PricingPlanViewSet, basename='pricing')
router.register(r'theme-categories', ThemeCategoryViewSet, basename='theme-categories')
router.register(r'themes', ThemeViewSet, basename='themes')
router.register(r'contact', ContactSubmissionViewSet, basename='contact')

# Admin router (with Firebase authentication)
admin_router = DefaultRouter()
admin_router.register(r'admin/portfolio', AdminPortfolioViewSet, basename='admin-portfolio')
admin_router.register(r'admin/testimonials', AdminTestimonialViewSet, basename='admin-testimonials')
admin_router.register(r'admin/pricing', AdminPricingPlanViewSet, basename='admin-pricing')
admin_router.register(r'admin/themes', AdminThemeViewSet, basename='admin-themes')
admin_router.register(r'admin/theme-categories', AdminThemeCategoryViewSet, basename='admin-theme-categories')
admin_router.register(r'admin/contact-submissions', AdminContactSubmissionViewSet, basename='admin-contact-submissions')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(admin_router.urls)),
    path('admin/verify-token/', VerifyTokenView.as_view(), name='verify-token'),
    path('admin/site-settings/', SiteSettingsView.as_view(), name='site-settings'),
    # Public endpoint to get site settings (for frontend)
    path('site-settings/', SiteSettingsView.as_view(), name='public-site-settings'),
    # Stripe endpoints
    path('stripe/create-checkout-session/', create_checkout_session, name='create-checkout-session'),
    path('stripe/webhook/', stripe_webhook, name='stripe-webhook'),
    path('stripe/check-purchase-status/', check_purchase_status, name='check-purchase-status'),
]
