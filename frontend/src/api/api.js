import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add error interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Silently handle errors - don't throw or log to console in a way that shows to users
    // Components will handle errors appropriately
    return Promise.reject(error);
  }
);

// Portfolio
export const getPortfolioItems = () => api.get('/portfolio/');
export const getFeaturedPortfolio = () => api.get('/portfolio/featured/');

// Testimonials
export const getTestimonials = () => api.get('/testimonials/');
export const getFeaturedTestimonials = () => api.get('/testimonials/featured/');

// Pricing
export const getPricingPlans = () => api.get('/pricing/');

// Themes
export const getThemes = (params) => api.get('/themes/', { params });
export const getFeaturedThemes = () => api.get('/themes/featured/');
export const getThemeCategories = () => api.get('/theme-categories/');

// Contact
export const submitContact = (data) => api.post('/contact/', data);

// Stripe
export const createCheckoutSession = (data) => api.post('/stripe/create-checkout-session/', data);
export const checkPurchaseStatus = (sessionId) => api.get(`/stripe/check-purchase-status/?session_id=${sessionId}`);

export default api;
