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
      localStorage.removeItem('beyond5_access_token');
      localStorage.removeItem('beyond5_user');
      window.location.href = '/login';
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
  createBooking: (bookingData) => api.post('/bookings', bookingData),
};

// --- PRACTITIONER SERVICES ---
export const practitionerService = {
  uploadDocuments: (formData) => api.post('/practitioners/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' } // Secure multipart handling
  }),
  updateProfile: (profileData) => api.put('/practitioners/profile', profileData),
};

// --- ADMIN SERVICES ---
export const adminService = {
  getVerificationQueue: () => api.get('/admin/practitioners/pending'),
  verifyPractitioner: (id, status) => api.put(`/admin/practitioners/${id}/verify`, { status }),
  getMarketMetrics: () => api.get('/admin/metrics'),
};

// --- AUTH SERVICES ---
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export default api;
