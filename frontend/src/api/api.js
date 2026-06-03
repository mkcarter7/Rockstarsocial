import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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

// Themes (website theme packages — formerly pricing plans)
export const getThemes = () => api.get('/themes/');

// Downloadable theme files (used by Home featured section)
export const getFeaturedThemes = () => api.get('/theme-files/featured/');

// Contact
export const submitContact = (data) => api.post('/contact/', data);

// Stripe — downloadable theme file purchases (existing flow, kept as-is)
export const createCheckoutSession = (data) => api.post('/stripe/create-checkout-session/', data);
export const checkPurchaseStatus = (sessionId) => api.get(`/stripe/check-purchase-status/?session_id=${sessionId}`);
export const createBirthdayCheckout = (data) => api.post('/stripe/create-birthday-checkout/', data);

// Stripe — website theme package purchase + setup flow
export const createThemeCheckout = (data) => api.post('/stripe/create-theme-checkout/', data);
export const getThemeSetup = (sessionId) => api.get(`/theme-setup/?session_id=${sessionId}`);
export const saveThemeSetup = (data) => api.post('/theme-setup/', data);

// Birthday app
export const checkBirthdaySlug = (slug) => api.get(`/birthday/check-slug/?slug=${slug}`);
export const getBirthdayParty = (slug) => api.get(`/birthday/${slug}/`);
export const getBirthdaySetup = (sessionId, sessionToken = null) =>
  sessionToken
    ? api.get(`/birthday/setup/?session_token=${sessionToken}`)
    : api.get(`/birthday/setup/?session_id=${sessionId}`);
export const saveBirthdaySetup = (data) => api.post('/birthday/setup/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getBirthdayPhotos = (slug) => api.get(`/birthday/${slug}/photos/`);
export const uploadBirthdayPhoto = (slug, formData) => api.post(`/birthday/${slug}/photos/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteBirthdayPhoto = (slug, photoId, sessionId) => api.delete(`/birthday/${slug}/photos/${photoId}/?session_id=${sessionId}`);
export const getBirthdayGuestbook = (slug) => api.get(`/birthday/${slug}/guestbook/`);
export const addGuestbookEntry = (slug, data) => api.post(`/birthday/${slug}/guestbook/`, data);
export const getBirthdayRSVP = (slug) => api.get(`/birthday/${slug}/rsvp/`);
export const submitBirthdayRSVP = (slug, data) => api.post(`/birthday/${slug}/rsvp/`, data);
export const getBirthdayTrivia = (slug) => api.get(`/birthday/${slug}/trivia/`);
export const addTriviaQuestion = (slug, data) => api.post(`/birthday/${slug}/trivia/`, data);
export const submitTriviaAnswers = (slug, data) => api.post(`/birthday/${slug}/trivia/submit/`, data);
export const getTriviaLeaderboard = (slug) => api.get(`/birthday/${slug}/trivia/leaderboard/`);
export const getBirthdayGifts = (slug, sessionToken = null) =>
  sessionToken
    ? api.get(`/birthday/${slug}/gifts/?session_token=${sessionToken}`)
    : api.get(`/birthday/${slug}/gifts/`);
export const addGiftItem = (slug, data) => api.post(`/birthday/${slug}/gifts/`, data);
export const claimGiftItem = (slug, giftId, claimerName) =>
  api.post(`/birthday/${slug}/gifts/${giftId}/claim/`, { claimer_name: claimerName });
export const unclaimGiftItem = (slug, giftId, sessionToken) =>
  api.post(`/birthday/${slug}/gifts/${giftId}/`, { session_token: sessionToken });
export const deleteGiftItem = (slug, giftId, sessionToken) =>
  api.delete(`/birthday/${slug}/gifts/${giftId}/?session_token=${sessionToken}`);
export const saveGiftRegistryUrl = (url, sessionToken) =>
  api.post('/birthday/setup/', { session_token: sessionToken, gift_registry_url: url });

// Admin — Event pages (all types: birthday, wedding, etc.)
export const getAdminEventPages = (token) => api.get('/admin/event-pages/', { headers: { Authorization: `Bearer ${token}` } });
export const deleteAdminEventPage = (eventType, id, token) => api.delete(`/admin/event-pages/${eventType}/${id}/`, { headers: { Authorization: `Bearer ${token}` } });

// Host auth
export const hostLogin = (email, password) => api.post('/host/login/', { email, password });
export const requestHostAccess = (email) => api.post('/host/request-access/', { email });
export const verifyHostToken = (token) => api.get(`/host/verify-token/?token=${token}`);
export const getHostPartyStats = (slug, hostToken) =>
  api.get(`/host/party/${slug}/`, { headers: { 'X-Host-Token': hostToken } });

export const changeHostPassword = (newPassword, hostToken) =>
  api.post('/host/change-password/', { new_password: newPassword }, { headers: { 'X-Host-Token': hostToken } });

export const getAdminHostAccounts = (token) =>
  api.get('/admin/host-accounts/', { headers: { Authorization: `Bearer ${token}` } });

export const adminResetHostPassword = (accountId, newPassword, token) =>
  api.post(`/admin/host-accounts/${accountId}/reset-password/`, { new_password: newPassword }, { headers: { Authorization: `Bearer ${token}` } });

export const adminDeleteHostAccount = (accountId, token) =>
  api.delete(`/admin/host-accounts/${accountId}/delete/`, { headers: { Authorization: `Bearer ${token}` } });

export default api;
