from django.contrib import admin
from .models import (
    PortfolioItem, Testimonial, PricingPlan, 
    ThemeCategory, Theme, ContactSubmission
)


@admin.register(PortfolioItem)
class PortfolioItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'featured', 'created_at']
    list_filter = ['featured', 'category', 'created_at']
    search_fields = ['title', 'description']


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ['client_name', 'company', 'rating', 'featured', 'created_at']
    list_filter = ['featured', 'rating', 'created_at']
    search_fields = ['client_name', 'company', 'testimonial_text']


@admin.register(PricingPlan)
class PricingPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'popular', 'created_at']
    list_filter = ['popular', 'created_at']


@admin.register(ThemeCategory)
class ThemeCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ['name', 'theme_type', 'category', 'price', 'featured', 'created_at']
    list_filter = ['theme_type', 'category', 'featured', 'created_at']
    search_fields = ['name', 'description']


@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subject', 'read', 'created_at']
    list_filter = ['read', 'created_at']
    search_fields = ['name', 'email', 'subject', 'message']
    readonly_fields = ['created_at']
