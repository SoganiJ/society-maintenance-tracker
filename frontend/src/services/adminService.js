import api from './api';

export const adminService = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard-stats').then((res) => res.data),

  // Residents
  getResidents: (params) => {
    const cleaned = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    return api.get('/admin/residents', { params: cleaned }).then((res) => res.data);
  },

  getResident: (id) => api.get(`/admin/residents/${id}`).then((res) => res.data),

  updateResident: (id, data) =>
    api.patch(`/admin/residents/${id}`, data).then((res) => res.data),

  // CSV export — returns a blob for download
  exportComplaints: (params) => {
    const cleaned = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    return api
      .get('/admin/complaints/export', { params: cleaned, responseType: 'blob' })
      .then((res) => res.data);
  },

  // Settings
  getSettings: () => api.get('/admin/settings').then((res) => res.data),

  updateSettings: (data) => api.patch('/admin/settings', data).then((res) => res.data),

  // Workers
  getWorkers: () => api.get('/admin/workers').then((res) => res.data),
  createWorker: (data) => api.post('/admin/workers', data).then((res) => res.data),
  deleteWorker: (id) => api.delete(`/admin/workers/${id}`).then((res) => res.data),

  // Agent
  consultAgent: (id) => api.get(`/admin/agent/consult/${id}`).then((res) => res.data),
};
