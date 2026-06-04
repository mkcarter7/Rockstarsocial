from django.core.management.base import BaseCommand
from api.models import ThemePackage


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


class Command(BaseCommand):
    help = 'Seed ThemePackage records for Birthday and Wedding products'

    def handle(self, *args, **options):
        created_count = 0
        for data in THEMES:
            obj, created = ThemePackage.objects.get_or_create(
                theme_type=data['theme_type'],
                defaults={
                    'name': data['name'],
                    'price': data['price'],
                    'description': data['description'],
                    'features': data['features'],
                    'popular': data['popular'],
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  Created: {obj.name}"))
                created_count += 1
            else:
                self.stdout.write(f"  Already exists: {obj.name}")

        if created_count:
            self.stdout.write(self.style.SUCCESS(f"\nDone — {created_count} theme(s) created."))
        else:
            self.stdout.write("\nDone — no changes (themes already exist).")
