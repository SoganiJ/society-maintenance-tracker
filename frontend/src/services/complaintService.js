import api from './api';

export const complaintService = {
  list: (params) => {
    const cleaned = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    return api.get('/complaints', { params: cleaned }).then((res) => res.data);
  },
  getStats: () => api.get('/complaints/stats').then((res) => res.data),
  getById: (id) => api.get(`/complaints/${id}`).then((res) => res.data),

  create: (formData) =>
    api
      .post('/complaints', formData)
      .then((res) => res.data),

  updateStatus: (id, status, note) =>
    api.patch(`/complaints/${id}/status`, { status, note }).then((res) => res.data),

  assign: (id, payload) => api.patch(`/complaints/${id}/assign`, payload).then((res) => res.data),

  assignComplaint: (id, priority, assignedTo) => {
    const payload = {};
    if (priority) payload.priority = priority;
    if (assignedTo) payload.assignedTo = assignedTo;
    return api.patch(`/complaints/${id}/assign`, payload).then((res) => res.data);
  },

  toggleOverdue: (id) => api.patch(`/complaints/${id}/overdue`).then((res) => res.data),

  remove: (id) => api.delete(`/complaints/${id}`).then((res) => res.data),
  
  suggestCategory: (payload) => api.post('/complaints/ai-suggest', payload).then((res) => res.data),

  summarizeDescription: (payload) => api.post('/complaints/ai-summarize', payload).then((res) => res.data),
};
