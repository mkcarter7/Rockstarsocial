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

// Wedding app
export const checkWeddingSlug = (slug) => api.get(`/wedding/check-slug/?slug=${slug}`);
export const getWeddingParty = (slug) => api.get(`/wedding/${slug}/`);
export const getWeddingSetup = (sessionId, sessionToken = null) =>
  sessionToken
    ? api.get(`/wedding/setup/?session_token=${sessionToken}`)
    : api.get(`/wedding/setup/?session_id=${sessionId}`);
export const saveWeddingSetup = (data) => api.post('/wedding/setup/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getWeddingPhotos = (slug) => api.get(`/wedding/${slug}/photos/`);
export const uploadWeddingPhoto = (slug, formData) => api.post(`/wedding/${slug}/photos/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getWeddingGuestbook = (slug) => api.get(`/wedding/${slug}/guestbook/`);
export const addWeddingGuestbookEntry = (slug, data) => api.post(`/wedding/${slug}/guestbook/`, data);
export const getWeddingRSVP = (slug) => api.get(`/wedding/${slug}/rsvp/`);
export const submitWeddingRSVP = (slug, data) => api.post(`/wedding/${slug}/rsvp/`, data);
export const getWeddingStory = (slug) => api.get(`/wedding/${slug}/story/`);
export const addStoryEntry = (slug, data) => api.post(`/wedding/${slug}/story/`, data);
export const deleteStoryEntry = (slug, entryId, sessionToken) =>
  api.delete(`/wedding/${slug}/story/${entryId}/?session_token=${sessionToken}`);
export const getWeddingGifts = (slug, sessionToken = null) =>
  sessionToken
    ? api.get(`/wedding/${slug}/gifts/?session_token=${sessionToken}`)
    : api.get(`/wedding/${slug}/gifts/`);
export const addWeddingGiftItem = (slug, data) => api.post(`/wedding/${slug}/gifts/`, data);
export const claimWeddingGiftItem = (slug, giftId, claimerName) =>
  api.post(`/wedding/${slug}/gifts/${giftId}/claim/`, { claimer_name: claimerName });
export const unclaimWeddingGiftItem = (slug, giftId, sessionToken) =>
  api.post(`/wedding/${slug}/gifts/${giftId}/`, { session_token: sessionToken });
export const deleteWeddingGiftItem = (slug, giftId, sessionToken) =>
  api.delete(`/wedding/${slug}/gifts/${giftId}/?session_token=${sessionToken}`);
export const createWeddingCheckout = (data) => api.post('/stripe/create-wedding-checkout/', data);
export const getWeddingPartyMembers = (slug) => api.get(`/wedding/${slug}/party-members/`);
export const addWeddingPartyMember = (slug, formData) => api.post(`/wedding/${slug}/party-members/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteWeddingPartyMember = (slug, id, token) => api.delete(`/wedding/${slug}/party-members/${id}/?session_token=${token}`);
export const getWeddingSchedule = (slug) => api.get(`/wedding/${slug}/schedule/`);
export const addWeddingScheduleItem = (slug, data) => api.post(`/wedding/${slug}/schedule/`, data);
export const deleteWeddingScheduleItem = (slug, id, token) => api.delete(`/wedding/${slug}/schedule/${id}/?session_token=${token}`);
export const getWeddingFAQ = (slug) => api.get(`/wedding/${slug}/faq/`);
export const addWeddingFAQItem = (slug, data) => api.post(`/wedding/${slug}/faq/`, data);
export const deleteWeddingFAQItem = (slug, id, token) => api.delete(`/wedding/${slug}/faq/${id}/?session_token=${token}`);
export const getWeddingSongRequests = (slug) => api.get(`/wedding/${slug}/song-requests/`);
export const submitSongRequest = (slug, data) => api.post(`/wedding/${slug}/song-requests/`, data);
export const deleteWeddingSongRequest = (slug, id, token) => api.delete(`/wedding/${slug}/song-requests/${id}/?session_token=${token}`);

// Baby shower app
export const checkBabyShowerSlug = (slug) => api.get(`/baby-shower/check-slug/?slug=${slug}`);
export const getBabyShower = (slug) => api.get(`/baby-shower/${slug}/`);
export const getBabyShowerSetup = (sessionId, sessionToken = null) =>
  sessionToken
    ? api.get(`/baby-shower/setup/?session_token=${sessionToken}`)
    : api.get(`/baby-shower/setup/?session_id=${sessionId}`);
export const saveBabyShowerSetup = (data) => api.post('/baby-shower/setup/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const createBabyShowerCheckout = (data) => api.post('/stripe/create-baby-shower-checkout/', data);
export const getBabyShowerPhotos = (slug) => api.get(`/baby-shower/${slug}/photos/`);
export const uploadBabyShowerPhoto = (slug, formData) => api.post(`/baby-shower/${slug}/photos/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getBabyShowerGuestbook = (slug) => api.get(`/baby-shower/${slug}/guestbook/`);
export const addBabyShowerGuestbookEntry = (slug, data) => api.post(`/baby-shower/${slug}/guestbook/`, data);
export const getBabyShowerRSVP = (slug) => api.get(`/baby-shower/${slug}/rsvp/`);
export const submitBabyShowerRSVP = (slug, data) => api.post(`/baby-shower/${slug}/rsvp/`, data);
export const getBabyShowerStory = (slug) => api.get(`/baby-shower/${slug}/story/`);
export const addBabyShowerStoryEntry = (slug, data) => api.post(`/baby-shower/${slug}/story/`, data);
export const deleteBabyShowerStoryEntry = (slug, entryId, sessionToken) =>
  api.delete(`/baby-shower/${slug}/story/${entryId}/?session_token=${sessionToken}`);
export const getBabyShowerGifts = (slug, sessionToken = null) =>
  sessionToken
    ? api.get(`/baby-shower/${slug}/gifts/?session_token=${sessionToken}`)
    : api.get(`/baby-shower/${slug}/gifts/`);
export const addBabyShowerGiftItem = (slug, data) => api.post(`/baby-shower/${slug}/gifts/`, data);
export const claimBabyShowerGiftItem = (slug, giftId, claimerName) =>
  api.post(`/baby-shower/${slug}/gifts/${giftId}/claim/`, { claimer_name: claimerName });
export const unclaimBabyShowerGiftItem = (slug, giftId, sessionToken) =>
  api.post(`/baby-shower/${slug}/gifts/${giftId}/`, { session_token: sessionToken });
export const deleteBabyShowerGiftItem = (slug, giftId, sessionToken) =>
  api.delete(`/baby-shower/${slug}/gifts/${giftId}/?session_token=${sessionToken}`);
export const getBabyShowerFAQ = (slug) => api.get(`/baby-shower/${slug}/faq/`);
export const addBabyShowerFAQItem = (slug, data) => api.post(`/baby-shower/${slug}/faq/`, data);
export const deleteBabyShowerFAQItem = (slug, id, token) => api.delete(`/baby-shower/${slug}/faq/${id}/?session_token=${token}`);
export const getBabyShowerTrivia = (slug) => api.get(`/baby-shower/${slug}/trivia/`);
export const addBabyShowerTriviaQuestion = (slug, data) => api.post(`/baby-shower/${slug}/trivia/`, data);
export const submitBabyShowerTrivia = (slug, data) => api.post(`/baby-shower/${slug}/trivia/submit/`, data);
export const getBabyShowerTriviaLeaderboard = (slug) => api.get(`/baby-shower/${slug}/trivia/leaderboard/`);
export const getBabyShowerNames = (slug) => api.get(`/baby-shower/${slug}/names/`);
export const addBabyShowerName = (slug, data) => api.post(`/baby-shower/${slug}/names/`, data);
export const deleteBabyShowerName = (slug, id, token) => api.delete(`/baby-shower/${slug}/names/${id}/?session_token=${token}`);
export const getBabyShowerBudget = (slug, sessionToken) => api.get(`/baby-shower/${slug}/budget/?session_token=${sessionToken}`);
export const addBabyShowerBudgetItem = (slug, data) => api.post(`/baby-shower/${slug}/budget/`, data);
export const updateBabyShowerBudgetItem = (slug, id, data) => api.patch(`/baby-shower/${slug}/budget/${id}/`, data);
export const deleteBabyShowerBudgetItem = (slug, id, token) => api.delete(`/baby-shower/${slug}/budget/${id}/?session_token=${token}`);
export const updateBabyShowerOverallBudget = (slug, overallBudget, token) => api.patch(`/baby-shower/${slug}/budget/`, { overall_budget: overallBudget, session_token: token });
export const getBabyShowerSchedule = (slug) => api.get(`/baby-shower/${slug}/schedule/`);
export const addBabyShowerScheduleItem = (slug, data) => api.post(`/baby-shower/${slug}/schedule/`, data);
export const deleteBabyShowerScheduleItem = (slug, id, token) => api.delete(`/baby-shower/${slug}/schedule/${id}/?session_token=${token}`);
export const getBabyShowerChecklist = (slug, sessionToken) => api.get(`/baby-shower/${slug}/checklist/?session_token=${sessionToken}`);
export const addBabyShowerChecklistItem = (slug, data) => api.post(`/baby-shower/${slug}/checklist/`, data);
export const updateBabyShowerChecklistItem = (slug, id, data) => api.patch(`/baby-shower/${slug}/checklist/${id}/`, data);
export const deleteBabyShowerChecklistItem = (slug, id, token) => api.delete(`/baby-shower/${slug}/checklist/${id}/?session_token=${token}`);

// Admin — Event pages (all types: birthday, wedding, etc.)
export const getAdminEventPages = (token) => api.get('/admin/event-pages/', { headers: { Authorization: `Bearer ${token}` } });
export const deleteAdminEventPage = (eventType, id, token) => api.delete(`/admin/event-pages/${eventType}/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
export const adminCreateEventPage = (data, token) => api.post('/admin/event-pages/create/', data, { headers: { Authorization: `Bearer ${token}` } });

// Host auth
export const hostLogin = (email, password) => api.post('/host/login/', { email, password });
export const requestHostAccess = (email) => api.post('/host/request-access/', { email });
export const verifyHostToken = (token) => api.get(`/host/verify-token/?token=${token}`);
export const getHostPartyStats = (slug, hostToken) =>
  api.get(`/host/party/${slug}/`, { headers: { 'X-Host-Token': hostToken } });

export const changeHostPassword = (newPassword, hostToken) =>
  api.post('/host/change-password/', { new_password: newPassword }, { headers: { 'X-Host-Token': hostToken } });

export const switchHostParty = (partySlug, hostToken) =>
  api.post('/host/switch-party/', { party_slug: partySlug }, { headers: { 'X-Host-Token': hostToken } });

export const getAdminHostAccounts = (token) =>
  api.get('/admin/host-accounts/', { headers: { Authorization: `Bearer ${token}` } });

export const adminResetHostPassword = (accountId, newPassword, token) =>
  api.post(`/admin/host-accounts/${accountId}/reset-password/`, { new_password: newPassword }, { headers: { Authorization: `Bearer ${token}` } });

export const adminDeleteHostAccount = (accountId, token) =>
  api.delete(`/admin/host-accounts/${accountId}/delete/`, { headers: { Authorization: `Bearer ${token}` } });

export const adminSendMagicLink = (accountId, token) =>
  api.post(`/admin/host-accounts/${accountId}/send-magic-link/`, {}, { headers: { Authorization: `Bearer ${token}` } });

export const adminSendMagicLinkByEmail = (email, token) =>
  api.post('/admin/host-accounts/send-magic-link-by-email/', { email }, { headers: { Authorization: `Bearer ${token}` } });

// Slug change
export const updateBirthdaySlug = (slug, newSlug, hostToken) =>
  api.patch(`/birthday/${slug}/update-slug/`, { new_slug: newSlug }, { headers: { 'X-Host-Token': hostToken } });
export const updateWeddingSlug = (slug, newSlug, hostToken) =>
  api.patch(`/wedding/${slug}/update-slug/`, { new_slug: newSlug }, { headers: { 'X-Host-Token': hostToken } });
export const updateBabyShowerSlug = (slug, newSlug, hostToken) =>
  api.patch(`/baby-shower/${slug}/update-slug/`, { new_slug: newSlug }, { headers: { 'X-Host-Token': hostToken } });
export const checkSlugRedirect = (slug) => api.get(`/slug-redirect/?slug=${slug}`);

export default api;
