import api from './api';

export const noticeService = {
  list: (params) => {
    const cleaned = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    return api.get('/notices', { params: cleaned }).then((res) => res.data);
  },

  getById: (id) => api.get(`/notices/${id}`).then((res) => res.data),

  create: (data) => api.post('/notices', data).then((res) => res.data),

  update: (id, data) => api.patch(`/notices/${id}`, data).then((res) => res.data),

  remove: (id) => api.delete(`/notices/${id}`).then((res) => res.data),
};
