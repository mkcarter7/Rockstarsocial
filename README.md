# RockStar Social - Web Design Business Website

A modern, responsive business website built with Django (backend) and React (frontend) for showcasing web design services, portfolio, testimonials, pricing plans, and premium themes.

## Features

- **Portfolio Showcase**: Display your completed web design projects
- **Testimonials**: Client reviews and ratings
- **Pricing Plans**: Flexible pricing options for your services
- **Theme Shop**: Shopify and website themes available for purchase
- **Contact Form**: Easy way for clients to reach out
- **About Page**: Information about your business
- **Fully Responsive**: Mobile-friendly design across all devices

## Tech Stack

### Backend
- Django 4.2.7
- Django REST Framework
- SQLite (development)
- CORS headers for API access

### Frontend
- React 18.2.0
- React Router DOM
- Axios for API calls
- Modern CSS with responsive design

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Create a superuser (optional, for admin access):
```bash
python manage.py createsuperuser
```

7. Start the development server:
```bash
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```
REACT_APP_API_URL=http://localhost:8000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Admin Panel

Access the Django admin panel at `http://localhost:8000/admin` to:
- Add/edit portfolio items
- Manage testimonials
- Create pricing plans
- Add themes and categories
- View contact form submissions

## Project Structure

```
RockStarSocial/
├── backend/
│   ├── api/              # Django app with models, views, serializers
│   ├── rockstarsocial/   # Django project settings
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/          # API service functions
│   │   ├── components/   # Reusable components (Navbar, Footer)
│   │   ├── pages/        # Page components
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## API Endpoints

- `GET /api/portfolio/` - List all portfolio items
- `GET /api/portfolio/featured/` - Get featured portfolio items
- `GET /api/testimonials/` - List all testimonials
- `GET /api/testimonials/featured/` - Get featured testimonials
- `GET /api/pricing/` - List all pricing plans
- `GET /api/themes/` - List all themes (supports ?type=shopify&category=slug filters)
- `GET /api/themes/featured/` - Get featured themes
- `GET /api/theme-categories/` - List all theme categories
- `POST /api/contact/` - Submit contact form

## Customization

### Adding Content
Use the Django admin panel to add:
- Portfolio items with images and descriptions
- Client testimonials with ratings
- Pricing plans with features
- Themes (Shopify or Website) with categories
- Theme categories

### Styling
All CSS files are in their respective component/page directories. The main styles are in:
- `frontend/src/App.css` - Global styles and utilities
- `frontend/src/index.css` - Base styles

### Theme Purchase Integration
The theme purchase functionality currently shows an alert. To integrate a real payment system:
1. Add a payment gateway (Stripe, PayPal, etc.)
2. Update the `handlePurchase` function in `frontend/src/pages/Themes.js`
3. Add payment processing in the backend

## Production Deployment

### Backend
1. Set `DEBUG = False` in `settings.py`
2. Update `ALLOWED_HOSTS` with your domain
3. Change `SECRET_KEY` to a secure random value
4. Use a production database (PostgreSQL recommended)
5. Set up static file serving
6. Configure CORS for your frontend domain

### Frontend
1. Build the production bundle:
```bash
npm run build
```
2. Serve the `build` directory with a web server (nginx, Apache, etc.)
3. Update API URL in environment variables

## License

This project is for your business use.

## Support

For questions or issues, please contact your development team.


