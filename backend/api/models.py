import uuid
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


class ThemePackage(models.Model):
    """Website theme packages available for purchase"""
    THEME_TYPES = [
        ('birthday', 'Birthday'),
        ('wedding', 'Wedding'),
        ('event', 'Event'),
        ('business', 'Business'),
        ('boutique', 'Boutique'),
        ('ecommerce', 'Ecommerce'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField()
    theme_type = models.CharField(max_length=20, choices=THEME_TYPES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    features = models.JSONField(default=list)
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
        ('birthday', 'Birthday'),
        ('wedding', 'Wedding'),
        ('event', 'Event'),
        ('business', 'Business'),
        ('boutique', 'Boutique'),
        ('ecommerce', 'Ecommerce'),
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


class ThemePurchase(models.Model):
    """Model to track theme purchases"""
    theme = models.ForeignKey(Theme, on_delete=models.CASCADE, related_name='purchases')
    customer_email = models.EmailField()
    customer_name = models.CharField(max_length=200, blank=True)
    stripe_session_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
        ],
        default='pending'
    )
    download_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.customer_email} - {self.theme.name} ({self.status})"


class ThemeOrder(models.Model):
    """Tracks a customer's website theme package purchase and setup"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    theme             = models.ForeignKey(ThemePackage, on_delete=models.PROTECT, related_name='orders')
    customer_email    = models.EmailField()
    stripe_session_id = models.CharField(max_length=255, unique=True)
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    slug              = models.SlugField(max_length=100, blank=True)
    business_name     = models.CharField(max_length=200, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.customer_email} - {self.theme.name} ({self.status})"


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


class HostAccount(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=256)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


class BirthdayParty(models.Model):
    slug = models.SlugField(unique=True, max_length=100)
    birthday_person_name = models.CharField(max_length=200)
    party_date = models.DateField()
    welcome_message = models.TextField(blank=True)
    host_email = models.EmailField()
    host_name = models.CharField(max_length=200, blank=True)
    theme_color = models.CharField(max_length=7, default='#ff6b9d')
    banner_image = models.ImageField(upload_to='birthday/banners/', blank=True, null=True)
    party_time = models.TimeField(null=True, blank=True)
    location_name = models.CharField(max_length=200, blank=True)
    location_address = models.TextField(blank=True)
    is_active = models.BooleanField(default=False)
    stripe_session_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    host_account = models.ForeignKey(
        'HostAccount', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='parties',
    )

    class Meta:
        ordering = ['-created_at']

    @property
    def expires_at(self):
        from datetime import timedelta
        return self.party_date + timedelta(days=60)

    @property
    def is_expired(self):
        from datetime import date
        return date.today() > self.expires_at

    def __str__(self):
        return f"{self.birthday_person_name}'s Party ({self.slug})"


class PartyPhoto(models.Model):
    party = models.ForeignKey(BirthdayParty, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='birthday/photos/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_by_name = models.CharField(max_length=100, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Photo for {self.party.slug}"


class GuestBookEntry(models.Model):
    party = models.ForeignKey(BirthdayParty, on_delete=models.CASCADE, related_name='guestbook_entries')
    author_name = models.CharField(max_length=100)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author_name} on {self.party.slug}"


class PartyRSVP(models.Model):
    STATUS_CHOICES = [
        ('yes', 'Yes'),
        ('no', 'No'),
        ('maybe', 'Maybe'),
    ]
    party = models.ForeignKey(BirthdayParty, on_delete=models.CASCADE, related_name='rsvps')
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    guest_count = models.IntegerField(default=1)
    message = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.status} ({self.party.slug})"


class TriviaQuestion(models.Model):
    ANSWER_CHOICES = [('a', 'A'), ('b', 'B'), ('c', 'C'), ('d', 'D')]
    party = models.ForeignKey(BirthdayParty, on_delete=models.CASCADE, related_name='trivia_questions')
    question = models.CharField(max_length=300)
    option_a = models.CharField(max_length=200)
    option_b = models.CharField(max_length=200)
    option_c = models.CharField(max_length=200)
    option_d = models.CharField(max_length=200)
    correct_answer = models.CharField(max_length=1, choices=ANSWER_CHOICES)
    points = models.IntegerField(default=10)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"Q: {self.question[:50]} ({self.party.slug})"


class TriviaScore(models.Model):
    party = models.ForeignKey(BirthdayParty, on_delete=models.CASCADE, related_name='trivia_scores')
    player_name = models.CharField(max_length=100)
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', '-created_at']

    def __str__(self):
        return f"{self.player_name} - {self.score} pts ({self.party.slug})"


class GiftItem(models.Model):
    party = models.ForeignKey(BirthdayParty, on_delete=models.CASCADE, related_name='gift_items')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    link_url = models.URLField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    claimed_by = models.CharField(max_length=100, blank=True)
    claimed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.title} ({self.party.slug})"


class HostAccessToken(models.Model):
    TOKEN_TYPES = [('magic_link', 'Magic Link'), ('session', 'Session')]
    party = models.ForeignKey(BirthdayParty, on_delete=models.CASCADE, related_name='access_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    token_type = models.CharField(max_length=20, choices=TOKEN_TYPES)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.token_type} token for {self.party.slug}"


class SiteSettings(models.Model):
    """Model for site-wide settings like colors"""
    # Use singleton pattern - only one settings object
    primary_color = models.CharField(max_length=7, default='#fab3c2', help_text='Primary brand color (hex)')
    secondary_color = models.CharField(max_length=7, default='#f89fb5', help_text='Secondary color (hex)')
    text_color = models.CharField(max_length=7, default='#000000', help_text='Main text color (hex)')
    background_color = models.CharField(max_length=7, default='#ffffff', help_text='Background color (hex)')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Site Settings'
        verbose_name_plural = 'Site Settings'
    
    def save(self, *args, **kwargs):
        # Ensure only one settings object exists
        self.pk = 1
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        # Prevent deletion
        pass
    
    @classmethod
    def load(cls):
        """Get or create the singleton settings object"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
    
    def __str__(self):
        return 'Site Settings'
