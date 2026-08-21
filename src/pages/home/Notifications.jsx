// pages/home/Notifications.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../../services/customerApi';
import Navbar from '../../components/HomePage/Navbar';
import Footer from '../../components/HomePage/Footer';
import { useTheme } from '../../contexts/ThemeContext';

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-PK', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

// ─── Confirmation Modal Component ─────────────────────────────────────────────
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", danger = false }) => {
  const { theme } = useTheme();
  const p = theme.primary;
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div 
        className="relative max-w-md w-full rounded-2xl shadow-xl animate-in fade-in zoom-in duration-200"
        style={{ background: 'var(--gk-card)', border: `1px solid var(--gk-border)` }}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--gk-text)' }}>{title}</h3>
          <p className="text-sm" style={{ color: 'var(--gk-muted)' }}>{message}</p>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-80"
            style={{ background: 'var(--gk-hover)', color: 'var(--gk-muted)' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{ background: danger ? '#ef4444' : p }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Toast Notification Component ─────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  const { theme } = useTheme();
  
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';
  
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div 
        className="px-5 py-3 rounded-xl shadow-lg flex items-center gap-2"
        style={{ background: bgColor, color: 'white' }}
      >
        <span>{type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

export default function CustomerNotifications() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const p = theme.primary;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Modal states
  const [markAllModal, setMarkAllModal] = useState(false);
  const [deleteAllModal, setDeleteAllModal] = useState(false);
  const [deleteSelectedModal, setDeleteSelectedModal] = useState(false);
  const [deleteSingleModal, setDeleteSingleModal] = useState({ isOpen: false, id: null });
  
  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data?.notifications || []);
      setUnread(res.data?.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications');
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnread((prev) => Math.max(0, prev - 1));
      showToast('Notification marked as read', 'success');
    } catch (err) {
      console.error('Failed to mark as read');
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    setMarkAllModal(false);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.error('Failed to mark all as read');
      showToast('Failed to mark all as read', 'error');
    }
  };

  const handleDeleteNotification = async (id) => {
    setDeleteSingleModal({ isOpen: false, id: null });
    try {
      await deleteNotification(id);
      const deletedNotif = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (deletedNotif && !deletedNotif.isRead) {
        setUnread((prev) => Math.max(0, prev - 1));
      }
      showToast('Notification deleted', 'success');
    } catch (err) {
      console.error('Failed to delete notification');
      showToast('Failed to delete notification', 'error');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) return;
    setDeleteSelectedModal(false);
    setDeleting(true);
    try {
      for (const id of selectedNotifications) {
        await deleteNotification(id);
      }
      const remainingNotifs = notifications.filter(
        (n) => !selectedNotifications.includes(n._id)
      );
      const deletedUnreadCount = notifications.filter(
        (n) => selectedNotifications.includes(n._id) && !n.isRead
      ).length;
      setNotifications(remainingNotifs);
      setUnread((prev) => Math.max(0, prev - deletedUnreadCount));
      setSelectedNotifications([]);
      setSelectMode(false);
      showToast(`${selectedNotifications.length} notification(s) deleted`, 'success');
    } catch (err) {
      console.error('Failed to delete selected notifications');
      showToast('Failed to delete selected notifications', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleteAllModal(false);
    try {
      await deleteAllNotifications();
      setNotifications([]);
      setUnread(0);
      setSelectedNotifications([]);
      setSelectMode(false);
      showToast('All notifications deleted', 'success');
    } catch (err) {
      console.error('Failed to delete all notifications');
      showToast('Failed to delete all notifications', 'error');
    }
  };

  const toggleSelectNotification = (id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '🛒';
      case 'customer_registration':
        return '👤';
      case 'customer_flagged':
        return '⚠️';
      case 'customer_unflagged':
        return '✅';
      case 'customer_trusted':
        return '⭐';
      case 'customer_untrusted':
        return '📋';
      case 'price_update':
        return '📊';
      default:
        return '🔔';
    }
  };

  const getNotificationStyle = (type, isRead) => {
    if (isRead) {
      return {
        background: `color-mix(in srgb, var(--gk-card) 50%, transparent)`,
        borderColor: 'var(--gk-border)',
      };
    }
    const tints = {
      order: { bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.2)' },
      customer_trusted: {
        bg: 'rgba(251,191,36,0.1)',
        border: 'rgba(251,191,36,0.2)',
      },
      customer_flagged: {
        bg: 'rgba(239,68,68,0.1)',
        border: 'rgba(239,68,68,0.2)',
      },
      default: {
        bg: 'rgba(251,191,36,0.1)',
        border: 'rgba(251,191,36,0.2)',
      },
    };
    const tint = tints[type] || tints.default;
    return { background: tint.bg, borderColor: tint.border };
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'var(--gk-bg)' }}
      >
        <Navbar />
        <div className="flex flex-col gap-4 items-center mt-20">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: `${p}20`, borderTopColor: p }}
          />
          <p
            className="text-sm font-medium tracking-wider uppercase"
            style={{ color: 'var(--gk-muted)' }}
          >
            Loading notifications…
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--gk-bg)', color: 'var(--gk-text)' }}
    >
      <Navbar />
      <div className="h-16" />

      {/* Sticky sub‑header */}
      <div
        className="sticky top-16 z-30 flex items-center px-4 sm:px-6 h-12 backdrop-blur-xl border-b"
        style={{
          background: 'var(--gk-bg-scrolled)',
          borderColor: 'var(--gk-border)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: 'var(--gk-muted)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div
          className="flex-1 h-px mx-3"
          style={{ background: `linear-gradient(90deg, transparent, ${p}15, transparent)` }}
        />
        <span className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: `${p}70` }}>
          Notifications
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16 sm:pb-20">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold" style={{ color: 'var(--gk-text)' }}>
              Notifications
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--gk-muted)' }}>
              {unread} unread {unread === 1 ? 'notification' : 'notifications'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectMode ? (
              <>
                <button
                  onClick={() => {
                    setSelectMode(false);
                    setSelectedNotifications([]);
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                  style={{ color: 'var(--gk-muted)', borderColor: 'var(--gk-border)' }}
                >
                  Cancel
                </button>
                {selectedNotifications.length > 0 && (
                  <button
                    onClick={() => setDeleteSelectedModal(true)}
                    disabled={deleting}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      borderColor: 'rgba(239,68,68,0.3)',
                      color: '#f87171',
                    }}
                  >
                    {deleting ? 'Deleting...' : `Delete (${selectedNotifications.length})`}
                  </button>
                )}
              </>
            ) : (
              <>
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={() => setSelectMode(true)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                      style={{ color: 'var(--gk-muted)', borderColor: 'var(--gk-border)' }}
                    >
                      Select
                    </button>
                    {unread > 0 && (
                      <button
                        onClick={() => setMarkAllModal(true)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                        style={{ color: p, borderColor: `${p}40` }}
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteAllModal(true)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                      style={{ color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                    >
                      Delete all
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div
            className="text-center py-20 rounded-2xl border border-dashed"
            style={{
              background: `color-mix(in srgb, var(--gk-card) 30%, transparent)`,
              borderColor: 'var(--gk-border)',
            }}
          >
            <div className="text-5xl mb-4">🔔</div>
            <p style={{ color: 'var(--gk-muted)' }}>No notifications yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--gk-muted)' }}>
              When you receive notifications, they'll appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const cardStyle = getNotificationStyle(notification.type, notification.isRead);
              return (
                <div
                  key={notification._id}
                  className="relative p-4 rounded-2xl border transition-all duration-200 group cursor-pointer"
                  style={{ background: cardStyle.background, borderColor: cardStyle.borderColor }}
                  onClick={() => selectMode && toggleSelectNotification(notification._id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Select checkbox */}
                    {selectMode && (
                      <div className="shrink-0 pt-1">
                        <div
                          className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                          style={
                            selectedNotifications.includes(notification._id)
                              ? { background: p, borderColor: p, color: 'var(--gk-logo-text)' }
                              : { background: 'transparent', borderColor: 'var(--gk-border)' }
                          }
                        >
                          {selectedNotifications.includes(notification._id) && (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Icon */}
                    <div className="shrink-0 text-2xl">{getNotificationIcon(notification.type)}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3
                            className="font-semibold text-sm"
                            style={{ color: notification.isRead ? 'var(--gk-muted)' : 'var(--gk-text)' }}
                          >
                            {notification.title}
                          </h3>
                          <p
                            className="text-sm mt-1"
                            style={{ color: notification.isRead ? 'var(--gk-muted)' : 'var(--gk-muted)' }}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs mt-2" style={{ color: 'var(--gk-muted)' }}>
                            {fmtDateTime(notification.createdAt)}
                          </p>
                        </div>

                        {!selectMode && (
                          <div className="flex gap-1 shrink-0">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkRead(notification._id);
                                }}
                                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                                style={{ color: p }}
                                title="Mark as read"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteSingleModal({ isOpen: true, id: notification._id });
                              }}
                              className="p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 hover:bg-white/10"
                              style={{ color: '#f87171' }}
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && !selectMode && (
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={markAllModal}
        onClose={() => setMarkAllModal(false)}
        onConfirm={handleMarkAllRead}
        title="Mark All as Read"
        message="Are you sure you want to mark all notifications as read? This action cannot be undone."
        confirmText="Mark All Read"
        danger={false}
      />

      <ConfirmationModal
        isOpen={deleteAllModal}
        onClose={() => setDeleteAllModal(false)}
        onConfirm={handleDeleteAll}
        title="Delete All Notifications"
        message="Are you sure you want to delete ALL notifications? This action cannot be undone and you will lose all your notification history."
        confirmText="Delete All"
        danger={true}
      />

      <ConfirmationModal
        isOpen={deleteSelectedModal}
        onClose={() => setDeleteSelectedModal(false)}
        onConfirm={handleDeleteSelected}
        title="Delete Selected Notifications"
        message={`Are you sure you want to delete ${selectedNotifications.length} selected notification(s)? This action cannot be undone.`}
        confirmText={`Delete (${selectedNotifications.length})`}
        danger={true}
      />

      <ConfirmationModal
        isOpen={deleteSingleModal.isOpen}
        onClose={() => setDeleteSingleModal({ isOpen: false, id: null })}
        onConfirm={() => handleDeleteNotification(deleteSingleModal.id)}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmText="Delete"
        danger={true}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}