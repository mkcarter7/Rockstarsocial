from datetime import date, time
from django.core.management.base import BaseCommand
from api.models import (
    WeddingEvent,
    WeddingStoryEntry,
    WeddingScheduleItem,
    WeddingFAQItem,
    WeddingPartyMember,
    BabyShowerEvent,
    BabyShowerStoryEntry,
    BabyShowerFAQItem,
    BabyShowerTriviaQuestion,
)


class Command(BaseCommand):
    help = 'Seed demo WeddingEvent and BabyShowerEvent records'

    def handle(self, *args, **options):
        self._seed_wedding()
        self._seed_baby_shower()
        self.stdout.write(self.style.SUCCESS('\nDone — demo events seeded.'))

    def _seed_wedding(self):
        event, created = WeddingEvent.objects.get_or_create(
            slug='sarah-and-james',
            defaults={
                'couple_name': 'Sarah & James',
                'wedding_date': date(2026, 9, 12),
                'party_time': time(16, 0),
                'welcome_message': "We're so excited to celebrate our big day with you! Join us as we begin our forever.",
                'host_name': 'Sarah & James',
                'host_email': 'demo@1rockstarsocial.com',
                'location_name': 'The Grand Estate',
                'location_address': '1234 Rose Garden Lane, Charleston, SC',
                'theme_color': '#c9a96e',
                'secondary_color': '#fdfaf7',
                'is_active': True,
            },
        )
        label = 'Created' if created else 'Already exists'
        self.stdout.write(f'  {label}: WeddingEvent sarah-and-james')

        if created:
            story_entries = [
                ('Where It All Began', 'Fall 2021', "We met at a mutual friend's dinner party in 2021. What started as a conversation over pasta turned into a friendship, then something much more."),
                ('The Proposal', 'June 2024', "James got down on one knee at Folly Beach on a quiet Tuesday evening. The sun was setting and the answer was easy."),
                ('Planning Our Forever', 'Now', "After months of planning, we can't wait to share this day with you all. Thank you for being part of our story."),
            ]
            for order, (title, date_label, description) in enumerate(story_entries, start=1):
                WeddingStoryEntry.objects.create(
                    event=event,
                    title=title,
                    date_label=date_label,
                    description=description,
                    order=order,
                )

            schedule_items = [
                ('Ceremony', date(2026, 9, 12), time(16, 0), 'The Grand Estate Chapel', 'Please be seated 15 minutes early.'),
                ('Cocktail Hour', date(2026, 9, 12), time(17, 0), 'Garden Terrace', "Enjoy drinks and hors d'oeuvres while we take photos."),
                ('Reception & Dancing', date(2026, 9, 12), time(18, 30), 'Grand Ballroom', 'Dinner, dancing, and toasts all night long!'),
            ]
            for order, (name, event_date, event_time, location_name, description) in enumerate(schedule_items, start=1):
                WeddingScheduleItem.objects.create(
                    event=event,
                    name=name,
                    event_date=event_date,
                    event_time=event_time,
                    location_name=location_name,
                    description=description,
                    order=order,
                )

            faq_items = [
                ('Is there parking available?', 'Yes, free valet parking is available on-site for all guests.'),
                ('What is the dress code?', 'Semi-formal / cocktail attire. The venue is outdoors for the ceremony, so keep that in mind!'),
                ('Are children welcome?', 'We love your little ones, but we have planned an adults-only evening so everyone can celebrate freely.'),
            ]
            for order, (question, answer) in enumerate(faq_items, start=1):
                WeddingFAQItem.objects.create(
                    event=event,
                    question=question,
                    answer=answer,
                    order=order,
                )

            party_members = [
                ('Emily Clarke', 'Maid of Honor', 1),
                ('Marcus Reid', 'Best Man', 2),
            ]
            for name, role, order in party_members:
                WeddingPartyMember.objects.create(
                    event=event,
                    name=name,
                    role=role,
                    order=order,
                )

    def _seed_baby_shower(self):
        event, created = BabyShowerEvent.objects.get_or_create(
            slug='demo-baby-shower',
            defaults={
                'parent_names': 'Olivia & Noah',
                'shower_date': date(2026, 8, 15),
                'due_date': date(2026, 9, 30),
                'welcome_message': "Baby Johnson is almost here! We're so grateful to share this special time with our favorite people.",
                'host_name': 'Olivia & Noah',
                'host_email': 'demo@1rockstarsocial.com',
                'location_name': 'The Johnson Home',
                'location_address': '789 Magnolia Drive, Nashville, TN',
                'theme_color': '#c17c5a',
                'secondary_color': '#faf6f0',
                'is_active': True,
            },
        )
        label = 'Created' if created else 'Already exists'
        self.stdout.write(f'  {label}: BabyShowerEvent demo-baby-shower')

        if created:
            story_entries = [
                ('The Big Surprise', 'December 2025', 'We found out we were expecting on a quiet Sunday morning. Two pink lines changed everything in the best possible way.'),
                ('Getting Ready', 'Now', "The nursery is painted, the tiny outfits are washed, and we count down the days. We can't wait to meet you!"),
            ]
            for order, (title, date_label, description) in enumerate(story_entries, start=1):
                BabyShowerStoryEntry.objects.create(
                    event=event,
                    title=title,
                    date_label=date_label,
                    description=description,
                    order=order,
                )

            faq_items = [
                ('Is there a gift registry?', 'Yes! You can find our registry links in the Gifts tab above.'),
                ("What's the baby's name?", "We're keeping it a surprise until the big day — stay tuned!"),
                ('Can I bring a plus-one?', "Please RSVP with your guest's name so we can plan seating and food accordingly."),
            ]
            for order, (question, answer) in enumerate(faq_items, start=1):
                BabyShowerFAQItem.objects.create(
                    event=event,
                    question=question,
                    answer=answer,
                    order=order,
                )

            trivia_questions = [
                (
                    'How many diapers does a newborn use per day on average?',
                    '5', '8', '12', '15',
                    'c', 10,
                ),
                (
                    'What fruit is roughly the size of a baby at 20 weeks?',
                    'Avocado', 'Banana', 'Mango', 'Cantaloupe',
                    'b', 10,
                ),
                (
                    "What is the soft spot on a baby's head called?",
                    'Cranium', 'Fontanelle', 'Suture', 'Calvaria',
                    'b', 10,
                ),
            ]
            for question, opt_a, opt_b, opt_c, opt_d, correct_answer, points in trivia_questions:
                BabyShowerTriviaQuestion.objects.create(
                    event=event,
                    question=question,
                    option_a=opt_a,
                    option_b=opt_b,
                    option_c=opt_c,
                    option_d=opt_d,
                    correct_answer=correct_answer,
                    points=points,
                )
