// services/authApi.js
import api from './api';

export const authAPI = {
  login:          (data)         => api.post('/auth/login', data),
  getMe:          ()             => api.get('/auth/me'),
  changePassword: (data)         => api.put('/auth/change-password', data),
  forgotPassword: (data)         => api.post('/auth/forgot-password', data),
  resetPassword:  (token, data)  => api.post(`/auth/reset-password/${token}`, data),
  logout: () => {return api.post('/auth/logout');},
};