from django.db import migrations
from decimal import Decimal


def set_birthday_price(apps, schema_editor):
    ThemePackage = apps.get_model('api', 'ThemePackage')
    ThemePackage.objects.filter(theme_type='birthday').update(price=Decimal('29.00'))


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_hostaccount_birthdayparty_host_account'),
    ]

    operations = [
        migrations.RunPython(set_birthday_price, migrations.RunPython.noop),
    ]
