// services/superAdminApi.js
import api from './api';

// ─── Dashboard ────────────────────────────────────
export const getDashboard = () =>
  api.get('/super-admin/dashboard');

// ─── Price Management ─────────────────────────────
export const getAllPrices = () =>
  api.get('/super-admin/all-prices');

export const updatePriceDifference = (data) =>
  api.put('/super-admin/price-difference', data);

export const updateSilverPriceDifference = (data) =>
  api.put('/super-admin/silver-price-difference', data);

export const updateCurrency = (currency, data) =>
  api.put(`/super-admin/currency/${currency}`, data);

// ─── Admin Management ─────────────────────────────
export const createAdmin = (data) =>
  api.post('/super-admin/admins', data);

export const getAdmins = () =>
  api.get('/super-admin/admins');

export const getAdminById = (id) =>
  api.get(`/super-admin/admins/${id}`);

export const updateAdmin = (id, data) =>
  api.put(`/super-admin/admins/${id}`, data);

export const deleteAdmin = (id) =>
  api.delete(`/super-admin/admins/${id}`);

export const toggleAdminStatus = (id) =>
  api.patch(`/super-admin/admins/${id}/toggle-status`);

// ─── Analytics ────────────────────────────────────
export const getAnalytics = () =>
  api.get('/super-admin/analytics');


export const getMyShopAnalytics = () =>
  api.get('/super-admin/analytics/my-shop');

// ─── Orders ───────────────────────────────────────
export const getAllOrders = (params) =>
  api.get('/super-admin/orders', { params });

export const getCustomerDetails = (id) => api.get(`/super-admin/customers/${id}/details`);

export const getCustomerOrders = (id, params) => api.get(`/super-admin/customers/${id}/orders`, { params });

export const updateOrderStatus = (id, data) =>
  api.patch(`/super-admin/orders/${id}/status`, data);

// ─── Customers ────────────────────────────────────

// All customers system-wide (every registered customer, each once)
// Order counts aggregated across ALL shops they've traded with
export const getCustomers = (params) =>
  api.get('/super-admin/customers', { params });

// My customers — only those who placed at least one order with the SA's own shop
// Buy/sell counts are for SA shop only; each customer appears once
export const getMyCustomers = (params) =>
  api.get('/super-admin/customers/my', { params });

export const updateCustomerStatus = (id, data) =>
  api.patch(`/super-admin/customers/${id}/status`, data);

// ─── Pictures ─────────────────────────────────────
export const uploadPicture = (formData) =>
  api.post('/super-admin/pictures', formData);

export const getPictures = () =>
  api.get('/super-admin/pictures');

export const deletePicture = (id) =>
  api.delete(`/super-admin/pictures/${id}`);

export const updatePicture = (id, formData) =>
  api.put(`/super-admin/pictures/${id}`, formData);

// ─── Notifications ────────────────────────────────
export const getNotifications = () =>
  api.get('/super-admin/notifications');

export const markNotificationRead = (id) =>
  api.put(`/super-admin/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.put('/super-admin/notifications/read-all');

export const deleteNotification = (id) =>
  api.delete(`/super-admin/notifications/${id}`);

// ─── Profile ──────────────────────────────────────
export const updateSAProfile = (formData) =>
  api.put('/super-admin/profile', formData);

// ─── My Orders (SA's own shop orders) ────────────
export const getMyOrders = (params) =>
  api.get('/super-admin/orders/my', { params });

// ─── Delete Order ─────────────────────────────────
export const deleteOrder = (id) =>
  api.delete(`/super-admin/orders/${id}`);

// ─── Super Admin's Own Shop Customer Trust/Flag ───────────────
export const trustCustomerForSA = (id) =>
  api.put(`/super-admin/customers/${id}/trust`);

export const untrustCustomerForSA = (id) => api.put(`/super-admin/customers/${id}/untrust`);

export const flagCustomerForSA = (id, data) =>
  api.put(`/super-admin/customers/${id}/flag`, data);

export const getMyShopRegistrations = (params) => api.get('/super-admin/registrations', { params });
export const approveMyShopRegistration = (id) => api.put(`/super-admin/registrations/${id}/approve`);
export const rejectMyShopRegistration = (id, data) => api.put(`/super-admin/registrations/${id}/reject`, data);
export const unflagCustomerForSA = (id) => api.put(`/super-admin/customers/${id}/unflag`);

// ─── Live Price Stream (SSE) ──────────────────────────────

export const createLivePriceStream = () => {
  const base = import.meta.env.VITE_API_URL || '/api';

  // Get token from localStorage
  const token = localStorage.getItem('goldchain_token');

  // Pass token in query string
  return new EventSource(
    `${base}/super-admin/prices/stream?token=${token}`
  );
};