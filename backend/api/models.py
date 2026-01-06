from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class PortfolioItem(models.Model):
    """Model for portfolio/showcase items"""
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(upload_to='portfolio/', blank=True, null=True)
    website_url = models.URLField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True)
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class Testimonial(models.Model):
    """Model for client testimonials"""
    client_name = models.CharField(max_length=200)
    client_title = models.CharField(max_length=200, blank=True)
    company = models.CharField(max_length=200, blank=True)
    testimonial_text = models.TextField()
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=5
    )
    client_image = models.ImageField(upload_to='testimonials/', blank=True, null=True)
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.client_name} - {self.company}"


class PricingPlan(models.Model):
    """Model for pricing plans"""
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    features = models.JSONField(default=list)  # List of feature strings
    popular = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['price']
    
    def __str__(self):
        return self.name


class ThemeCategory(models.Model):
    """Model for theme categories"""
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name


class Theme(models.Model):
    """Model for themes (Shopify and website themes)"""
    THEME_TYPES = [
        ('shopify', 'Shopify Theme'),
        ('website', 'Website Theme'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    theme_type = models.CharField(max_length=20, choices=THEME_TYPES)
    category = models.ForeignKey(ThemeCategory, on_delete=models.SET_NULL, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    preview_image = models.ImageField(upload_to='themes/')
    demo_url = models.URLField(blank=True, null=True)
    download_file = models.FileField(upload_to='theme_files/', blank=True, null=True)
    features = models.JSONField(default=list)
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_theme_type_display()})"


class ContactSubmission(models.Model):
    """Model for contact form submissions"""
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.subject}"
