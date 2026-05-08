import api from './api';

export const adminApi = {
  getPractitioners: ({ status = 'pending', page = 1, limit = 100 } = {}) => (
    api.get('/admin/practitioners', { params: { status, page, limit } })
  ),
  approvePractitioner: (id) => api.patch(`/admin/practitioners/${id}/approve`),
  rejectPractitioner: (id, reason) => api.patch(`/admin/practitioners/${id}/reject`, { reason }),
  getMarketMetrics: () => api.get('/admin/metrics'),
};

export default adminApi;
