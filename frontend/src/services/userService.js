import api from './api';

export const userService = {
  updateProfile: (formData) => api.patch('/users/profile', formData, {
    // Let axios set the content type correctly with boundaries for FormData
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data),

  updatePassword: (data) => api.patch('/users/password', data).then(res => res.data),
};
