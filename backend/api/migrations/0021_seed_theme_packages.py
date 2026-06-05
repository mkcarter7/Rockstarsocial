from django.db import migrations

THEMES = [
    {
        'name': 'Birthday Party',
        'theme_type': 'birthday',
        'price': '29.00',
        'description': 'Give your loved one their own personal birthday party page — complete with photos, guest book, RSVP, and a fun trivia game about the birthday star.',
        'features': [
            'Custom URL for your birthday page',
            'Photo gallery for guests',
            'Guest book messages',
            'RSVP tracking',
            'Trivia game with leaderboard',
            'Live countdown timer',
            'Active for 60 days after the event',
        ],
        'popular': True,
    },
    {
        'name': 'Baby Shower',
        'theme_type': 'baby_shower',
        'price': '39.00',
        'description': 'Give your guests a dedicated baby shower page — complete with photos, a guest book, RSVP, a journey timeline, gift registry, trivia game, FAQ, and baby name suggestions.',
        'features': [
            'Custom URL for your baby shower page',
            'Photo gallery for guests',
            'Guest book messages',
            'RSVP tracking',
            'Our Journey timeline',
            'Gift registry',
            'Trivia game with leaderboard',
            'FAQ section',
            'Baby name suggestions',
            'Venmo & Cash App gifting',
            'Live countdown to the shower',
            'Active for 6 months after the event',
        ],
        'popular': False,
    },
    {
        'name': 'Wedding',
        'theme_type': 'wedding',
        'price': '49.00',
        'description': 'Give your guests a dedicated wedding page — complete with photos, a guest book, RSVP, a beautiful timeline, wedding party profiles, event schedule, FAQ, and song requests.',
        'features': [
            'Custom URL for your wedding page',
            'Photo gallery for guests',
            'Guest book messages',
            'RSVP tracking',
            'Our Story timeline',
            'Wedding party profiles',
            'Event schedule',
            'FAQ section',
            'Song requests',
            'Venmo & Cash App gifting',
            'Live countdown to the wedding',
            'Active for 1 year after the event',
        ],
        'popular': False,
    },
]


def seed_theme_packages(apps, schema_editor):
    ThemePackage = apps.get_model('api', 'ThemePackage')
    for data in THEMES:
        ThemePackage.objects.get_or_create(
            theme_type=data['theme_type'],
            defaults={
                'name': data['name'],
                'price': data['price'],
                'description': data['description'],
                'features': data['features'],
                'popular': data['popular'],
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0020_baby_shower_models'),
    ]

    operations = [
        migrations.RunPython(seed_theme_packages, migrations.RunPython.noop),
    ]
