from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_rename_pricingplan_themepackage_themeorder'),
    ]

    operations = [
        migrations.AddField(
            model_name='themepackage',
            name='theme_type',
            field=models.CharField(
                choices=[
                    ('birthday', 'Birthday'),
                    ('wedding', 'Wedding'),
                    ('event', 'Event'),
                    ('business', 'Business'),
                    ('boutique', 'Boutique'),
                    ('ecommerce', 'Ecommerce'),
                ],
                default='birthday',
                max_length=20,
            ),
        ),
    ]
