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
from .stripe_views import create_checkout_session, stripe_webhook, check_purchase_status, create_birthday_checkout
from .birthday_views import (
    check_slug, party_detail, party_setup,
    party_photos, delete_photo, party_guestbook,
    party_rsvp, party_trivia, submit_trivia,
    trivia_leaderboard, admin_birthday_parties,
)

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
    path('stripe/create-birthday-checkout/', create_birthday_checkout, name='create-birthday-checkout'),
    path('stripe/webhook/', stripe_webhook, name='stripe-webhook'),
    path('stripe/check-purchase-status/', check_purchase_status, name='check-purchase-status'),
    # Birthday app endpoints
    path('birthday/check-slug/', check_slug, name='birthday-check-slug'),
    path('birthday/setup/', party_setup, name='birthday-setup'),
    path('birthday/<slug:slug>/', party_detail, name='birthday-detail'),
    path('birthday/<slug:slug>/photos/', party_photos, name='birthday-photos'),
    path('birthday/<slug:slug>/photos/<int:photo_id>/', delete_photo, name='birthday-delete-photo'),
    path('birthday/<slug:slug>/guestbook/', party_guestbook, name='birthday-guestbook'),
    path('birthday/<slug:slug>/rsvp/', party_rsvp, name='birthday-rsvp'),
    path('birthday/<slug:slug>/trivia/', party_trivia, name='birthday-trivia'),
    path('birthday/<slug:slug>/trivia/submit/', submit_trivia, name='birthday-trivia-submit'),
    path('birthday/<slug:slug>/trivia/leaderboard/', trivia_leaderboard, name='birthday-leaderboard'),
    path('admin/birthday-parties/', admin_birthday_parties, name='admin-birthday-parties'),
]
