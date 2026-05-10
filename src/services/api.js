import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
const API_BASE_URL = configuredApiUrl.replace('http://localhost:5000', 'http://127.0.0.1:5000');

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
    const message = error.response?.data?.message || 'Something went wrong';

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
  getAvailableSlots: (practitionerId, date) =>
    api.get('/bookings/availability', { params: { practitionerId, date } }),
};

// --- PRACTITIONER SERVICES ---
export const practitionerService = {
  getProfile: () => api.get('/practitioners/profile'),
  uploadDocuments: (formData) => api.post('/practitioners/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' } // Secure multipart handling
  }),
  updateProfile: (profileData) => api.put('/practitioners/profile', profileData),
};

// --- ADMIN SERVICES ---
export const adminService = {
  getPractitioners: (params) => api.get('/admin/practitioners', { params }),
  getSinglePractitioner: (id) => api.get(`/admin/practitioners/${id}`),
  getVerificationQueue: () => api.get('/admin/practitioners', { params: { status: 'pending' } }),
  approvePractitioner: (id) => api.patch(`/admin/practitioners/${id}/approve`),
  rejectPractitioner: (id, reason) => api.patch(`/admin/practitioners/${id}/reject`, { reason }),
  getMarketMetrics: () => api.get('/admin/metrics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  createAdmin: (data) => api.post('/admin/users/admin', data),
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

// --- REVIEW SERVICES ---
export const reviewService = {
  createReview: (reviewData) => api.post('/reviews', reviewData),
  getPractitionerReviews: (practitionerId) => api.get(`/reviews/practitioner/${practitionerId}`),
};

export default api;
