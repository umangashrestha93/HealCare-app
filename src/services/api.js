import axios from 'axios';

const DEFAULT_API_URL = 'http://127.0.0.1:5001/api';
const normalizeApiUrl = (url) => {
  const trimmed = (url || DEFAULT_API_URL).replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10s timeout for mobile-first stability
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('beyond5_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message
      || (error.code === 'ERR_NETWORK'
        ? `Unable to reach the backend at ${API_BASE_URL}. Please make sure the API server is running.`
        : 'Something went wrong');

    // Auto-logout on 401 Unauthorized
    if (error.response?.status === 401) {
      // Avoid redirecting if the error occurred during a login attempt
      // This prevents falling back to the RoleOption screen on wrong password
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      
      if (!isLoginRequest) {
        localStorage.removeItem('beyond5_access_token');
        localStorage.removeItem('beyond5_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(message);
  }
);

/**
 * Role-Based Service Functions
 */

// --- CLIENT SERVICES ---
export const clientService = {
  getPractitioners: (filters) => api.get('/practitioners', { params: filters }),
  getPractitionerDetails: (id) => api.get(`/practitioners/${id}`),
};

// --- BOOKING SERVICES ---
export const bookingService = {
  getBookings: () => api.get('/bookings'),
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  cancelBooking: (id) => api.delete(`/bookings/${id}`),
  getTelehealthRoom: (roomId) => api.get(`/bookings/telehealth/${roomId}`),
  getAvailableSlots: (practitionerId, date) =>
    api.get('/bookings/availability', { params: { practitionerId, date } }),
};

// --- MEDICARE OFFER SERVICES ---
export const medicareService = {
  getOffer: () => api.get('/medicare/offer'),
  verifyCard: (cardData) => api.post('/medicare/verify', cardData),
};

// --- PAYMENT SERVICES ---
export const paymentService = {
  getMethods: () => api.get('/payments/methods'),
  getBookingPayment: (bookingId) => api.get(`/payments/booking/${bookingId}`),
  createCheckout: (data) => api.post('/payments/checkout', data),
  confirmReturn: (data) => api.post('/payments/confirm', data),
  cancelPayment: (data) => api.post('/payments/cancel', data),
};

// --- PRACTITIONER SERVICES ---
export const practitionerService = {
  getProfile: () => api.get('/practitioners/profile'),
  uploadDocuments: (formData) => api.post('/practitioners/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' } // Secure multipart handling
  }),
  updateProfile: (profileData) => api.put('/practitioners/profile', profileData),
};

// --- ENQUIRY SERVICES ---
export const enquiryService = {
  create: async (enquiryData) => {
    try {
      return await api.post('/enquiries', enquiryData);
    } catch (err) {
      if (typeof err === 'string' && (err.includes('404') || err === 'Something went wrong')) {
        return api.post('/client-enquiries', enquiryData);
      }
      throw err;
    }
  },
  getMine: () => api.get('/enquiries'),
  getAll: () => api.get('/enquiries/admin'),
};

// --- ADMIN SERVICES ---
export const adminService = {
  getPractitioners: (params) => api.get('/admin/practitioners', { params }),
  getSinglePractitioner: (id) => api.get(`/admin/practitioners/${id}`),
  getVerificationQueue: () => api.get('/admin/practitioners', { params: { status: 'pending' } }),
  approvePractitioner: (id) => api.patch(`/admin/practitioners/${id}/approve`),
  rejectPractitioner: (id, reason) => api.patch(`/admin/practitioners/${id}/reject`, { reason }),
  addComplianceNote: (id, data) => api.post(`/admin/practitioners/${id}/notes`, data),
  getMarketMetrics: () => api.get('/admin/metrics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  createAdmin: (data) => api.post('/admin/users/admin', data),
  getAdmins: (params) => api.get('/admin/admins', { params }),
  createAdminProfile: (data) => api.post('/admin/admins', data),
  updateAdminProfile: (id, data) => api.put(`/admin/admins/${id}`, data),
  deleteAdminProfile: (id) => api.delete(`/admin/admins/${id}`),
  getComplianceLogs: (params) => api.get('/admin/compliance-logs', { params }),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
};

// --- AUTH SERVICES ---
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getUserById: (id) => api.get(`/auth/user/${id}`),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// --- CHAT SERVICES ---
export const chatService = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (userId) => api.get(`/chat/${userId}`),
  sendMessage: (receiverId, content) => api.post('/chat', { receiverId, content }),
};

// --- RECOMMENDATION SERVICES ---
export const recommendationService = {
  getPractitioners: (params) => api.get('/recommendations/practitioners', { params }),
};

// --- APP ASSISTANT SERVICES ---
export const assistantService = {
  chat: (message) => api.post('/assistant/chat', { message }),
};

// --- AI HEALTHCARE ASSISTANT SERVICES ---
export const aiService = {
  getConversation: (conversationId) => api.get('/ai/conversation', { params: { conversationId } }),
  createConversation: () => api.post('/ai/conversation'),
  chat: ({ message, conversationId }) => api.post('/ai/chat', { message, conversationId }),
};

// --- REVIEW SERVICES ---
export const reviewService = {
  createReview: (reviewData) => api.post('/reviews', reviewData),
  getPractitionerReviews: (practitionerId) => api.get(`/reviews/practitioner/${practitionerId}`),
};

export default api;
