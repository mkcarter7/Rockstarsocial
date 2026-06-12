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
from .stripe_views import create_checkout_session, stripe_webhook, check_purchase_status, create_birthday_checkout, create_theme_checkout, create_wedding_checkout, create_baby_shower_checkout
from .theme_setup_views import theme_setup_view
from .birthday_views import (
    check_slug, party_detail, party_setup,
    party_photos, delete_photo, party_guestbook,
    party_rsvp, party_trivia, submit_trivia,
    trivia_leaderboard, admin_birthday_parties,
    admin_event_pages, admin_delete_event_page, admin_create_event_page,
    admin_host_accounts, admin_reset_host_password, admin_delete_host_account, admin_send_magic_link,
    admin_send_magic_link_by_email,
    party_gifts, claim_gift, manage_gift,
    update_birthday_slug, check_slug_redirect,
)
from .host_auth_views import request_magic_link, verify_magic_link, host_party_stats, host_login, switch_party, change_password
from .baby_shower_views import (
    check_slug as bs_check_slug,
    event_detail as bs_event_detail,
    event_setup as bs_event_setup,
    event_photos as bs_event_photos,
    event_guestbook as bs_event_guestbook,
    event_rsvp as bs_event_rsvp,
    event_story as bs_event_story,
    delete_story_entry as bs_delete_story_entry,
    event_gifts as bs_event_gifts,
    claim_gift as bs_claim_gift,
    manage_gift as bs_manage_gift,
    event_faq as bs_event_faq,
    manage_faq_item as bs_manage_faq_item,
    event_trivia as bs_event_trivia,
    submit_trivia as bs_submit_trivia,
    trivia_leaderboard as bs_trivia_leaderboard,
    event_name_suggestions as bs_event_name_suggestions,
    delete_name_suggestion as bs_delete_name_suggestion,
    update_baby_shower_slug,
    event_budget as bs_event_budget,
    manage_budget_item as bs_manage_budget_item,
    event_schedule as bs_event_schedule,
    manage_schedule_item as bs_manage_schedule_item,
    event_checklist as bs_event_checklist,
    manage_checklist_item as bs_manage_checklist_item,
    update_event_fields as bs_update_event_fields,
    event_delegations as bs_event_delegations,
    manage_delegation_item as bs_manage_delegation_item,
    event_vendors as bs_event_vendors,
    manage_vendor_item as bs_manage_vendor_item,
    event_thank_yous as bs_event_thank_yous,
    manage_thank_you_item as bs_manage_thank_you_item,
)
from .wedding_views import (
    check_slug as wedding_check_slug,
    event_detail, event_setup,
    event_photos, event_guestbook, event_rsvp,
    event_story, delete_story_entry,
    event_gifts, claim_gift as wedding_claim_gift, manage_gift as wedding_manage_gift,
    event_party_members, manage_party_member,
    event_schedule, manage_schedule_item,
    event_faq, manage_faq_item,
    event_song_requests, manage_song_request,
    update_wedding_slug,
)

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
    path('stripe/create-wedding-checkout/', create_wedding_checkout, name='create-wedding-checkout'),
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
    path('birthday/<slug:slug>/gifts/', party_gifts, name='birthday-gifts'),
    path('birthday/<slug:slug>/gifts/<int:gift_id>/claim/', claim_gift, name='birthday-gift-claim'),
    path('birthday/<slug:slug>/gifts/<int:gift_id>/', manage_gift, name='birthday-gift-manage'),
    path('birthday/<slug:slug>/update-slug/', update_birthday_slug, name='birthday-update-slug'),
    # Wedding app endpoints
    path('wedding/check-slug/', wedding_check_slug, name='wedding-check-slug'),
    path('wedding/setup/', event_setup, name='wedding-setup'),
    path('wedding/<slug:slug>/', event_detail, name='wedding-detail'),
    path('wedding/<slug:slug>/photos/', event_photos, name='wedding-photos'),
    path('wedding/<slug:slug>/guestbook/', event_guestbook, name='wedding-guestbook'),
    path('wedding/<slug:slug>/rsvp/', event_rsvp, name='wedding-rsvp'),
    path('wedding/<slug:slug>/story/', event_story, name='wedding-story'),
    path('wedding/<slug:slug>/story/<int:entry_id>/', delete_story_entry, name='wedding-story-delete'),
    path('wedding/<slug:slug>/gifts/', event_gifts, name='wedding-gifts'),
    path('wedding/<slug:slug>/gifts/<int:gift_id>/claim/', wedding_claim_gift, name='wedding-gift-claim'),
    path('wedding/<slug:slug>/gifts/<int:gift_id>/', wedding_manage_gift, name='wedding-gift-manage'),
    path('wedding/<slug:slug>/party-members/', event_party_members, name='wedding-party-members'),
    path('wedding/<slug:slug>/party-members/<int:member_id>/', manage_party_member, name='wedding-party-member-manage'),
    path('wedding/<slug:slug>/schedule/', event_schedule, name='wedding-schedule'),
    path('wedding/<slug:slug>/schedule/<int:item_id>/', manage_schedule_item, name='wedding-schedule-manage'),
    path('wedding/<slug:slug>/faq/', event_faq, name='wedding-faq'),
    path('wedding/<slug:slug>/faq/<int:item_id>/', manage_faq_item, name='wedding-faq-manage'),
    path('wedding/<slug:slug>/song-requests/', event_song_requests, name='wedding-song-requests'),
    path('wedding/<slug:slug>/song-requests/<int:req_id>/', manage_song_request, name='wedding-song-request-manage'),
    path('wedding/<slug:slug>/update-slug/', update_wedding_slug, name='wedding-update-slug'),
    # Baby shower app endpoints
    path('stripe/create-baby-shower-checkout/', create_baby_shower_checkout, name='create-baby-shower-checkout'),
    path('baby-shower/check-slug/', bs_check_slug, name='baby-shower-check-slug'),
    path('baby-shower/setup/', bs_event_setup, name='baby-shower-setup'),
    path('baby-shower/<slug:slug>/', bs_event_detail, name='baby-shower-detail'),
    path('baby-shower/<slug:slug>/photos/', bs_event_photos, name='baby-shower-photos'),
    path('baby-shower/<slug:slug>/guestbook/', bs_event_guestbook, name='baby-shower-guestbook'),
    path('baby-shower/<slug:slug>/rsvp/', bs_event_rsvp, name='baby-shower-rsvp'),
    path('baby-shower/<slug:slug>/story/', bs_event_story, name='baby-shower-story'),
    path('baby-shower/<slug:slug>/story/<int:entry_id>/', bs_delete_story_entry, name='baby-shower-story-delete'),
    path('baby-shower/<slug:slug>/gifts/', bs_event_gifts, name='baby-shower-gifts'),
    path('baby-shower/<slug:slug>/gifts/<int:gift_id>/claim/', bs_claim_gift, name='baby-shower-gift-claim'),
    path('baby-shower/<slug:slug>/gifts/<int:gift_id>/', bs_manage_gift, name='baby-shower-gift-manage'),
    path('baby-shower/<slug:slug>/faq/', bs_event_faq, name='baby-shower-faq'),
    path('baby-shower/<slug:slug>/faq/<int:item_id>/', bs_manage_faq_item, name='baby-shower-faq-manage'),
    path('baby-shower/<slug:slug>/trivia/', bs_event_trivia, name='baby-shower-trivia'),
    path('baby-shower/<slug:slug>/trivia/submit/', bs_submit_trivia, name='baby-shower-trivia-submit'),
    path('baby-shower/<slug:slug>/trivia/leaderboard/', bs_trivia_leaderboard, name='baby-shower-trivia-leaderboard'),
    path('baby-shower/<slug:slug>/names/', bs_event_name_suggestions, name='baby-shower-names'),
    path('baby-shower/<slug:slug>/names/<int:suggestion_id>/', bs_delete_name_suggestion, name='baby-shower-names-delete'),
    path('baby-shower/<slug:slug>/budget/', bs_event_budget, name='baby-shower-budget'),
    path('baby-shower/<slug:slug>/budget/<int:item_id>/', bs_manage_budget_item, name='baby-shower-budget-manage'),
    path('baby-shower/<slug:slug>/schedule/', bs_event_schedule, name='baby-shower-schedule'),
    path('baby-shower/<slug:slug>/schedule/<int:item_id>/', bs_manage_schedule_item, name='baby-shower-schedule-manage'),
    path('baby-shower/<slug:slug>/checklist/', bs_event_checklist, name='baby-shower-checklist'),
    path('baby-shower/<slug:slug>/checklist/<int:item_id>/', bs_manage_checklist_item, name='baby-shower-checklist-manage'),
    path('baby-shower/<slug:slug>/update-slug/', update_baby_shower_slug, name='baby-shower-update-slug'),
    path('baby-shower/<slug:slug>/update/', bs_update_event_fields, name='baby-shower-update-fields'),
    path('baby-shower/<slug:slug>/delegations/', bs_event_delegations, name='baby-shower-delegations'),
    path('baby-shower/<slug:slug>/delegations/<int:item_id>/', bs_manage_delegation_item, name='baby-shower-delegation-manage'),
    path('baby-shower/<slug:slug>/vendors/', bs_event_vendors, name='baby-shower-vendors'),
    path('baby-shower/<slug:slug>/vendors/<int:item_id>/', bs_manage_vendor_item, name='baby-shower-vendor-manage'),
    path('baby-shower/<slug:slug>/thank-yous/', bs_event_thank_yous, name='baby-shower-thank-yous'),
    path('baby-shower/<slug:slug>/thank-yous/<int:item_id>/', bs_manage_thank_you_item, name='baby-shower-thank-you-manage'),
    path('slug-redirect/', check_slug_redirect, name='slug-redirect'),
    path('admin/birthday-parties/', admin_birthday_parties, name='admin-birthday-parties'),
    path('admin/event-pages/create/', admin_create_event_page, name='admin-create-event-page'),
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
    path('admin/host-accounts/<int:account_id>/delete/', admin_delete_host_account, name='admin-delete-host-account'),
    path('admin/host-accounts/<int:account_id>/send-magic-link/', admin_send_magic_link, name='admin-send-magic-link'),
    path('admin/host-accounts/send-magic-link-by-email/', admin_send_magic_link_by_email, name='admin-send-magic-link-by-email'),
]
