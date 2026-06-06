from django.db import migrations


def remove_recovery_website_theme(apps, schema_editor):
    Theme = apps.get_model('api', 'Theme')
    Theme.objects.filter(name='Recovery Website').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_remove_clean_sober_home'),
    ]

    operations = [
        migrations.RunPython(remove_recovery_website_theme, migrations.RunPython.noop),
    ]
