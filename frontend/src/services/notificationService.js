import api from './api';

export const notificationService = {
  getNotifications: (page = 1, limit = 15) =>
    api.get('/notifications', { params: { page, limit } }).then((res) => res.data),

  getUnreadCount: () => api.get('/notifications/unread-count').then((res) => res.data),

  markAsRead: (id) => api.patch(`/notifications/${id}/read`).then((res) => res.data),

  markAllAsRead: () => api.patch('/notifications/mark-all-read').then((res) => res.data),
};
