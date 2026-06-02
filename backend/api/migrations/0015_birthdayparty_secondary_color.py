from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_birthdayparty_gift_registry_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='birthdayparty',
            name='secondary_color',
            field=models.CharField(blank=True, default='#ffffff', max_length=7),
        ),
    ]
