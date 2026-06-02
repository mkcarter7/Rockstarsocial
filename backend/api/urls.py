from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PortfolioItemViewSet, TestimonialViewSet, ThemePackageViewSet,
    ThemeCategoryViewSet, ThemeViewSet, ContactSubmissionViewSet
)
from .admin_views import (
    AdminPortfolioViewSet, AdminTestimonialViewSet, AdminThemePackageViewSet,
    AdminThemeViewSet, AdminThemeCategoryViewSet, AdminContactSubmissionViewSet,
    VerifyTokenView, SiteSettingsView
)
from .stripe_views import create_checkout_session, stripe_webhook, check_purchase_status, create_birthday_checkout, create_theme_checkout
from .theme_setup_views import theme_setup_view
from .birthday_views import (
    check_slug, party_detail, party_setup,
    party_photos, delete_photo, party_guestbook,
    party_rsvp, party_trivia, submit_trivia,
    trivia_leaderboard, admin_birthday_parties,
    admin_event_pages, admin_delete_event_page,
    admin_host_accounts, admin_reset_host_password,
)
from .host_auth_views import request_magic_link, verify_magic_link, host_party_stats, host_login, switch_party, change_password

router = DefaultRouter()
router.register(r'portfolio', PortfolioItemViewSet, basename='portfolio')
router.register(r'testimonials', TestimonialViewSet, basename='testimonials')
router.register(r'themes', ThemePackageViewSet, basename='themes')
router.register(r'theme-categories', ThemeCategoryViewSet, basename='theme-categories')
router.register(r'theme-files', ThemeViewSet, basename='theme-files')
router.register(r'contact', ContactSubmissionViewSet, basename='contact')

# Admin router (with Firebase authentication)
admin_router = DefaultRouter()
admin_router.register(r'admin/portfolio', AdminPortfolioViewSet, basename='admin-portfolio')
admin_router.register(r'admin/testimonials', AdminTestimonialViewSet, basename='admin-testimonials')
admin_router.register(r'admin/themes', AdminThemePackageViewSet, basename='admin-themes')
admin_router.register(r'admin/theme-files', AdminThemeViewSet, basename='admin-theme-files')
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
    path('stripe/create-theme-checkout/', create_theme_checkout, name='create-theme-checkout'),
    path('stripe/webhook/', stripe_webhook, name='stripe-webhook'),
    path('stripe/check-purchase-status/', check_purchase_status, name='check-purchase-status'),
    # Theme setup
    path('theme-setup/', theme_setup_view, name='theme-setup'),
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
    path('admin/event-pages/', admin_event_pages, name='admin-event-pages'),
    path('admin/event-pages/<str:event_type>/<int:page_id>/', admin_delete_event_page, name='admin-delete-event-page'),
    # Host auth
    path('host/login/', host_login, name='host-login'),
    path('host/switch-party/', switch_party, name='host-switch-party'),
    path('host/change-password/', change_password, name='host-change-password'),
    path('host/forgot-password/', request_magic_link, name='host-forgot-password'),
    path('host/request-access/', request_magic_link, name='host-request-access'),
    path('host/verify-token/', verify_magic_link, name='host-verify-token'),
    path('host/party/<slug:slug>/', host_party_stats, name='host-party-stats'),
    # Admin: host account management
    path('admin/host-accounts/', admin_host_accounts, name='admin-host-accounts'),
    path('admin/host-accounts/<int:account_id>/reset-password/', admin_reset_host_password, name='admin-reset-host-password'),
]
