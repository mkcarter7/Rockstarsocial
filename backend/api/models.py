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
        ('baby_shower', 'Baby Shower'),
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
    secondary_color = models.CharField(max_length=7, default='#ffffff', blank=True)
    banner_image = models.ImageField(upload_to='birthday/banners/', blank=True, null=True)
    party_time = models.TimeField(null=True, blank=True)
    location_name = models.CharField(max_length=200, blank=True)
    location_address = models.TextField(blank=True)
    gift_registry_url = models.URLField(blank=True)
    venmo_handle = models.CharField(max_length=100, blank=True)
    cashapp_handle = models.CharField(max_length=100, blank=True)
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
    delete_token = models.UUIDField(default=uuid.uuid4, editable=False)

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
    party = models.ForeignKey(BirthdayParty, on_delete=models.SET_NULL, null=True, blank=True, related_name='access_tokens')
    wedding_event = models.ForeignKey('WeddingEvent', on_delete=models.SET_NULL, null=True, blank=True, related_name='access_tokens')
    baby_shower_event = models.ForeignKey('BabyShowerEvent', on_delete=models.SET_NULL, null=True, blank=True, related_name='access_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    token_type = models.CharField(max_length=20, choices=TOKEN_TYPES)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        if self.party:
            label = self.party.slug
        elif self.wedding_event:
            label = self.wedding_event.slug
        elif self.baby_shower_event:
            label = self.baby_shower_event.slug
        else:
            label = 'no event'
        return f"{self.token_type} token for {label}"


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


# ─── Wedding models ────────────────────────────────────────────────────────────

class WeddingEvent(models.Model):
    slug = models.SlugField(unique=True, max_length=100)
    couple_name = models.CharField(max_length=200)
    wedding_date = models.DateField()
    welcome_message = models.TextField(blank=True)
    host_email = models.EmailField()
    host_name = models.CharField(max_length=200, blank=True)
    theme_color = models.CharField(max_length=7, default='#c9a96e')
    secondary_color = models.CharField(max_length=7, default='#fdfaf7', blank=True)
    banner_image = models.ImageField(upload_to='wedding/banners/', blank=True, null=True)
    party_time = models.TimeField(null=True, blank=True)
    location_name = models.CharField(max_length=200, blank=True)
    location_address = models.TextField(blank=True)
    gift_registry_url = models.URLField(blank=True)
    venmo_handle = models.CharField(max_length=100, blank=True)
    cashapp_handle = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=False)
    stripe_session_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    host_account = models.ForeignKey(
        'HostAccount', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='wedding_events',
    )

    class Meta:
        ordering = ['-created_at']

    @property
    def expires_at(self):
        from datetime import timedelta
        return self.wedding_date + timedelta(days=365)

    @property
    def is_expired(self):
        from datetime import date
        return date.today() > self.expires_at

    def __str__(self):
        return f"{self.couple_name}'s Wedding ({self.slug})"


class WeddingPhoto(models.Model):
    event = models.ForeignKey(WeddingEvent, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='wedding/photos/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_by_name = models.CharField(max_length=100, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    delete_token = models.UUIDField(default=uuid.uuid4, editable=False)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Photo for {self.event.slug}"


class WeddingGuestBookEntry(models.Model):
    event = models.ForeignKey(WeddingEvent, on_delete=models.CASCADE, related_name='guestbook_entries')
    author_name = models.CharField(max_length=100)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author_name} on {self.event.slug}"


class WeddingRSVP(models.Model):
    STATUS_CHOICES = [('yes', 'Yes'), ('no', 'No'), ('maybe', 'Maybe')]
    event = models.ForeignKey(WeddingEvent, on_delete=models.CASCADE, related_name='rsvps')
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    guest_count = models.IntegerField(default=1)
    message = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.status} ({self.event.slug})"


class WeddingStoryEntry(models.Model):
    event = models.ForeignKey(WeddingEvent, on_delete=models.CASCADE, related_name='story_entries')
    date_label = models.CharField(max_length=100)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.date_label}: {self.title[:50]} ({self.event.slug})"


class WeddingGiftItem(models.Model):
    event = models.ForeignKey(WeddingEvent, on_delete=models.CASCADE, related_name='gift_items')
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
        return f"{self.title} ({self.event.slug})"


class WeddingPartyMember(models.Model):
    event = models.ForeignKey(WeddingEvent, on_delete=models.CASCADE, related_name='party_members')
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    photo = models.ImageField(upload_to='wedding/party/', blank=True, null=True)
    bio = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.name} ({self.role}) — {self.event.slug}"


class WeddingScheduleItem(models.Model):
    event = models.ForeignKey(WeddingEvent, on_delete=models.CASCADE, related_name='schedule_items')
    name = models.CharField(max_length=200)
    event_date = models.DateField(blank=True, null=True)
    event_time = models.TimeField(blank=True, null=True)
    location_name = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'event_date', 'event_time']

    def __str__(self):
        return f"{self.name} — {self.event.slug}"


class WeddingFAQItem(models.Model):
    event = models.ForeignKey(WeddingEvent, on_delete=models.CASCADE, related_name='faq_items')
    question = models.CharField(max_length=300)
    answer = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"FAQ: {self.question[:60]} — {self.event.slug}"


class WeddingSongRequest(models.Model):
    event = models.ForeignKey(WeddingEvent, on_delete=models.CASCADE, related_name='song_requests')
    song_title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200, blank=True)
    requested_by = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'"{self.song_title}" by {self.artist or "unknown"} — {self.event.slug}'


# ─── Baby Shower models ────────────────────────────────────────────────────────

class BabyShowerEvent(models.Model):
    slug = models.SlugField(unique=True, max_length=100)
    parent_names = models.CharField(max_length=200)
    shower_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    welcome_message = models.TextField(blank=True)
    host_email = models.EmailField()
    host_name = models.CharField(max_length=200, blank=True)
    theme_color = models.CharField(max_length=7, default='#c17c5a')
    secondary_color = models.CharField(max_length=7, default='#faf6f0', blank=True)
    banner_image = models.ImageField(upload_to='babyshower/banners/', blank=True, null=True)
    party_time = models.TimeField(null=True, blank=True)
    location_name = models.CharField(max_length=200, blank=True)
    location_address = models.TextField(blank=True)
    gift_registry_url = models.URLField(blank=True)
    registry_links = models.JSONField(default=list, blank=True)
    venmo_handle = models.CharField(max_length=100, blank=True)
    cashapp_handle = models.CharField(max_length=100, blank=True)
    livestream_url = models.URLField(blank=True)
    pinterest_board_url = models.URLField(blank=True)
    host_notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=False)
    stripe_session_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    overall_budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    host_account = models.ForeignKey(
        'HostAccount', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='baby_shower_events',
    )

    class Meta:
        ordering = ['-created_at']

    @property
    def expires_at(self):
        from datetime import timedelta
        return self.shower_date + timedelta(days=180)

    @property
    def is_expired(self):
        from datetime import date
        return date.today() > self.expires_at

    def __str__(self):
        return f"{self.parent_names}'s Baby Shower ({self.slug})"


class BabyShowerPhoto(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='babyshower/photos/')
    caption = models.CharField(max_length=200, blank=True)
    uploaded_by_name = models.CharField(max_length=100, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    delete_token = models.UUIDField(default=uuid.uuid4, editable=False)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Photo for {self.event.slug}"


class BabyShowerGuestBookEntry(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='guestbook_entries')
    author_name = models.CharField(max_length=100)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author_name} on {self.event.slug}"


class BabyShowerRSVP(models.Model):
    STATUS_CHOICES = [('yes', 'Yes'), ('no', 'No'), ('maybe', 'Maybe')]
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='rsvps')
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    guest_count = models.IntegerField(default=1)
    message = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.status} ({self.event.slug})"


class BabyShowerStoryEntry(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='story_entries')
    date_label = models.CharField(max_length=100)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.date_label}: {self.title[:50]} ({self.event.slug})"


class BabyShowerGiftItem(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='gift_items')
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
        return f"{self.title} ({self.event.slug})"


class BabyShowerFAQItem(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='faq_items')
    question = models.CharField(max_length=300)
    answer = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"FAQ: {self.question[:60]} — {self.event.slug}"


class BabyShowerBudgetItem(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='budget_items')
    category = models.CharField(max_length=200)
    estimated_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    actual_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Budget: {self.category} — {self.event.slug}"


class BabyShowerScheduleItem(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='schedule_items')
    time_label = models.CharField(max_length=50, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Schedule: {self.title} — {self.event.slug}"


class BabyShowerChecklistItem(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='checklist_items')
    timeframe = models.CharField(max_length=100)
    text = models.CharField(max_length=300)
    is_completed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Checklist: {self.text[:60]} — {self.event.slug}"


class BabyShowerTriviaQuestion(models.Model):
    ANSWER_CHOICES = [('a', 'A'), ('b', 'B'), ('c', 'C'), ('d', 'D')]
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='trivia_questions')
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
        return f"Q: {self.question[:50]} ({self.event.slug})"


class BabyShowerTriviaScore(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='trivia_scores')
    player_name = models.CharField(max_length=100)
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', '-created_at']

    def __str__(self):
        return f"{self.player_name} - {self.score} pts ({self.event.slug})"


class BabyShowerNameSuggestion(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='name_suggestions')
    suggested_name = models.CharField(max_length=100)
    suggested_by = models.CharField(max_length=100, blank=True)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'"{self.suggested_name}" suggested by {self.suggested_by or "guest"} — {self.event.slug}'


class BabyShowerDelegation(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='delegations')
    person_name = models.CharField(max_length=200)
    task = models.CharField(max_length=300)
    notes = models.TextField(blank=True)
    is_confirmed = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.person_name} — {self.task} ({self.event.slug})"


class BabyShowerVendor(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='vendors')
    role = models.CharField(max_length=100)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    notes = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.role}: {self.name} ({self.event.slug})"


class BabyShowerThankYou(models.Model):
    event = models.ForeignKey(BabyShowerEvent, on_delete=models.CASCADE, related_name='thank_yous')
    giver_name = models.CharField(max_length=200)
    gift_description = models.CharField(max_length=300, blank=True)
    thank_you_sent = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        return f"Thank you to {self.giver_name} ({self.event.slug})"


class SlugRedirect(models.Model):
    old_slug = models.SlugField(unique=True, max_length=100)
    new_slug = models.SlugField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.old_slug} → {self.new_slug}'
