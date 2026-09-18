import api from './api';

// No need for API_URL or axios import since you're using the configured api instance
// The base URL is already configured in your api.js file

// ─── Registration (public) ──────────────────────────────────
export const registerCustomer = (data) =>
  api.post('/customer/register', data);

// ─── Shops ─────────────────────────────────────────────────
export const getAllShops     = ()   => api.get('/customer/shops');
export const getShopById    = (id) => api.get(`/customer/shops/${id}`);
export const getShopWhatsApp = (id) => api.get(`/customer/shops/${id}/whatsapp`);

// ─── Orders ────────────────────────────────────────────────
export const placeOrder  = (data)        => api.post('/customer/orders', data);
export const getMyOrders = (params = {}) => api.get('/customer/orders', { params });
export const getOrderById = (id)         => api.get(`/customer/orders/${id}`);

// ─── Profile ───────────────────────────────────────────────
export const getProfile    = ()   => api.get('/customer/profile');
export const updateProfile = (data) => api.put('/customer/profile', data);

// ─── Notifications ─────────────────────────────────────────
export const getNotifications = () => api.get('/customer/notifications');
export const getUnreadCount = () => api.get('/customer/notifications/unread-count');
export const markNotificationRead = (id) => api.put(`/customer/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/customer/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/customer/notifications/${id}`);
export const deleteAllNotifications = () => api.delete('/customer/notifications');
export const deleteSelectedNotifications = (notificationIds) => 
  api.post('/customer/notifications/delete-selected', { notificationIds });

// ─── Shop Registration ─────────────────────────────────────
export const registerWithShop = (shopId, data) =>
  api.post(`/customer/register-with-shop/${shopId}`, data);

export const checkShopRegistration = (shopId) =>
  api.get(`/customer/check-registration/${shopId}`);