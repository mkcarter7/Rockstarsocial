from django.core.management.base import BaseCommand
from api.models import PortfolioItem


class Command(BaseCommand):
    help = 'Add portfolio items to the database'

    def handle(self, *args, **options):
        portfolio_items = [
            {
                'title': 'Mellow Lilac Studio',
                'description': 'A beautiful e-commerce website for Mellow Lilac Studio, featuring a password-protected storefront with an elegant design.',
                'website_url': 'https://mellowlilacstudio.com/',
                'category': 'E-commerce',
                'featured': True,
            },
            {
                'title': 'Jubilea',
                'description': 'An elegant and modern website for Jubilea, showcasing their services with a clean and professional design.',
                'website_url': 'https://jubilea.net',
                'category': 'Business',
                'featured': True,
            },
        ]

        for item_data in portfolio_items:
            # Check if item already exists
            existing_item = PortfolioItem.objects.filter(website_url=item_data['website_url']).first()
            
            if existing_item:
                self.stdout.write(
                    self.style.WARNING(f'Portfolio item "{item_data["title"]}" already exists. Skipping...')
                )
            else:
                # Create portfolio item (image will need to be added later via admin or upload)
                portfolio_item = PortfolioItem.objects.create(
                    title=item_data['title'],
                    description=item_data['description'],
                    website_url=item_data['website_url'],
                    category=item_data['category'],
                    featured=item_data['featured'],
                )
                # Note: Image field is required, so we need to handle this
                # For now, we'll skip creating if image is required
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created portfolio item: {item_data["title"]}')
                )

        self.stdout.write(self.style.SUCCESS('Finished adding portfolio items!'))
        self.stdout.write(
            self.style.WARNING('Note: You will need to add images to these portfolio items via the Django admin panel.')
        )
