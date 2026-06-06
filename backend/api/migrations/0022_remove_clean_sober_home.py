from django.db import migrations


def remove_clean_sober_home(apps, schema_editor):
    PortfolioItem = apps.get_model('api', 'PortfolioItem')
    PortfolioItem.objects.filter(title='Clean and Sober Home').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0021_seed_theme_packages'),
    ]

    operations = [
        migrations.RunPython(remove_clean_sober_home, migrations.RunPython.noop),
    ]
