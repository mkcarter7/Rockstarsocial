# Generated manually for ThemePurchase model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_sitesettings'),
    ]

    operations = [
        migrations.CreateModel(
            name='ThemePurchase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('customer_email', models.EmailField(max_length=254)),
                ('customer_name', models.CharField(blank=True, max_length=200)),
                ('stripe_session_id', models.CharField(blank=True, max_length=255, null=True, unique=True)),
                ('stripe_payment_intent_id', models.CharField(blank=True, max_length=255, null=True)),
                ('amount_paid', models.DecimalField(decimal_places=2, max_digits=10)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('completed', 'Completed'), ('failed', 'Failed'), ('refunded', 'Refunded')], default='pending', max_length=20)),
                ('download_sent', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('theme', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='purchases', to='api.theme')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]

