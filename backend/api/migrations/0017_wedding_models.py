from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0016_nullable_party_on_host_access_token'),
    ]

    operations = [
        migrations.CreateModel(
            name='WeddingEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('slug', models.SlugField(max_length=100, unique=True)),
                ('couple_name', models.CharField(max_length=200)),
                ('wedding_date', models.DateField()),
                ('welcome_message', models.TextField(blank=True)),
                ('host_email', models.EmailField(max_length=254)),
                ('host_name', models.CharField(blank=True, max_length=200)),
                ('theme_color', models.CharField(default='#c9a96e', max_length=7)),
                ('secondary_color', models.CharField(blank=True, default='#fdfaf7', max_length=7)),
                ('banner_image', models.ImageField(blank=True, null=True, upload_to='wedding/banners/')),
                ('party_time', models.TimeField(blank=True, null=True)),
                ('location_name', models.CharField(blank=True, max_length=200)),
                ('location_address', models.TextField(blank=True)),
                ('gift_registry_url', models.URLField(blank=True)),
                ('is_active', models.BooleanField(default=False)),
                ('stripe_session_id', models.CharField(blank=True, max_length=255, null=True, unique=True)),
                ('amount_paid', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('host_account', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='wedding_events',
                    to='api.hostaccount',
                )),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='WeddingPhoto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='wedding/photos/')),
                ('caption', models.CharField(blank=True, max_length=200)),
                ('uploaded_by_name', models.CharField(blank=True, max_length=100)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('event', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='photos',
                    to='api.weddingevent',
                )),
            ],
            options={'ordering': ['-uploaded_at']},
        ),
        migrations.CreateModel(
            name='WeddingGuestBookEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('author_name', models.CharField(max_length=100)),
                ('message', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('event', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='guestbook_entries',
                    to='api.weddingevent',
                )),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='WeddingRSVP',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('status', models.CharField(
                    choices=[('yes', 'Yes'), ('no', 'No'), ('maybe', 'Maybe')],
                    max_length=10,
                )),
                ('guest_count', models.IntegerField(default=1)),
                ('message', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('event', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='rsvps',
                    to='api.weddingevent',
                )),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='WeddingStoryEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date_label', models.CharField(max_length=100)),
                ('title', models.CharField(max_length=300)),
                ('description', models.TextField(blank=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('event', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='story_entries',
                    to='api.weddingevent',
                )),
            ],
            options={'ordering': ['order', 'created_at']},
        ),
        migrations.CreateModel(
            name='WeddingGiftItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('link_url', models.URLField(blank=True)),
                ('price', models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ('claimed_by', models.CharField(blank=True, max_length=100)),
                ('claimed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('event', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='gift_items',
                    to='api.weddingevent',
                )),
            ],
            options={'ordering': ['order', 'created_at']},
        ),
        migrations.AddField(
            model_name='hostaccesstoken',
            name='wedding_event',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='access_tokens',
                to='api.weddingevent',
            ),
        ),
    ]
