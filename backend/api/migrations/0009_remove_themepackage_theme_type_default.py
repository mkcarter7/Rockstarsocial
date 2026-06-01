from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_host_access_token'),
    ]

    operations = [
        migrations.AlterField(
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
                max_length=20,
            ),
        ),
    ]
