// frontend/src/services/adminApi.js
import api from './api';

// ─── Dashboard ─────────────────────────────────────────────
export const getDashboard = () => api.get('/admin/dashboard');

// ─── Price Management ─────────────────────────────────────
export const updatePriceDifference = (data) => api.put('/admin/price-difference', data);

// ─── Shop Settings ────────────────────────────────────────
export const updateShopSettings = (formData) =>
  api.put('/admin/settings', formData);

// ─── Customer Management ──────────────────────────────────
export const getPendingCustomers = () => api.get('/admin/customers/pending');
export const getAllCustomers = (params) => api.get('/admin/customers', { params });
export const addCustomer = (data) => api.post('/admin/customers', data);
export const approveCustomer = (id) => api.put(`/admin/customers/${id}/approve`);
export const rejectCustomer = (id, data) => api.put(`/admin/customers/${id}/reject`, data);
export const trustCustomer = (id) => api.put(`/admin/customers/${id}/trust`);
export const untrustCustomer = (id) => api.put(`/admin/customers/${id}/untrust`);
export const flagCustomer = (id, data) => api.put(`/admin/customers/${id}/flag`, data);
export const unflagCustomer = (id) => api.put(`/admin/customers/${id}/unflag`);
export const deleteCustomer = (id) => api.delete(`/admin/customers/${id}`);

// ─── Order Management ─────────────────────────────────────
export const getOrders = (params) => api.get('/admin/orders', { params });
export const approveOrder = (id) => api.put(`/admin/orders/${id}/approve`);
export const rejectOrder = (id, data) => api.put(`/admin/orders/${id}/reject`, data);
export const completeOrder = (id, data) => 
  api.put(`/admin/orders/${id}/complete`, {
    paymentReceived: data.paymentReceived,
    finalizedAmount: data.finalizedAmount,
    extraCharges: data.extraCharges,
    discount: data.discount,
    completionBaseAmount: data.completionBaseAmount
  });
export const getOrderReceipt = (id) => api.get(`/admin/orders/${id}/receipt`);
export const deleteOrder = (id) => api.delete(`/admin/orders/${id}`);

// ─── Picture Management ───────────────────────────────────
export const uploadPicture = (formData) =>
  api.post('/admin/pictures', formData);
export const updatePicture = (id, data) => api.put(`/admin/pictures/${id}`, data); 
export const getPictures = () => api.get('/admin/pictures');
export const getSharedPictures = () => api.get('/admin/pictures/shared');
export const deletePicture = (id) => api.delete(`/admin/pictures/${id}`);

// ─── Analytics ────────────────────────────────────────────
export const getAnalytics = () => api.get('/admin/analytics');

// ─── Notifications ────────────────────────────────────────
export const getNotifications = () => api.get('/admin/notifications');
export const markNotificationRead = (id) => api.put(`/admin/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/admin/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/admin/notifications/${id}`);

// ─── WhatsApp ─────────────────────────────────────────────
export const getWhatsAppLink = (data) => api.post('/admin/whatsapp-link', data);

// ─── Shop Registrations ───────────────────────────────────
export const getShopRegistrations = (params) => api.get('/admin/registrations', { params });
export const approveShopRegistration = (id) => api.put(`/admin/registrations/${id}/approve`);
export const rejectShopRegistration = (id, data) => api.put(`/admin/registrations/${id}/reject`, data);

// ─── Live Price Stream (SSE) for Admin ──────────────────────────────
export const createAdminLivePriceStream = () => {
  const base = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('goldchain_token');
  return new EventSource(`${base}/admin/prices/stream?token=${token}`);
};