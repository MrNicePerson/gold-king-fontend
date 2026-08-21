// frontend/src/pages/Admin_Dashboard/Notifications.jsx
import { useState, useEffect, useCallback } from "react";
import * as adminAPI from "../../services/adminApi";
import { useTheme } from "../../contexts/ThemeContext";

// ─── Icons ────────────────────────────────────────────────────────────────
const Ico = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS = {
  refresh:    "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  bell:       "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  check:      "M5 13l4 4L19 7",
  checkAll:   "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  alert:      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  filter:     "M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z",
  close:      "M6 18L18 6M6 6l12 12",
  dot:        "M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
  inbox:      "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4",
  trash:      "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  price:      "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  order:      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  customer:   "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  flagged:    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  registration: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
};

const TYPE_CONFIG = {
  price_update:       { label: "Price Update",       lightBg: "bg-amber-50",   darkBg: "bg-amber-950/40",   textLight: "text-amber-700",   textDark: "text-amber-300",   borderLight: "border-amber-200",   borderDark: "border-amber-800",   icon: ICONS.price },
  order:              { label: "Order",              lightBg: "bg-blue-50",    darkBg: "bg-blue-950/40",    textLight: "text-blue-700",    textDark: "text-blue-300",    borderLight: "border-blue-200",    borderDark: "border-blue-800",    icon: ICONS.order },
  customer_approval:  { label: "Customer",           lightBg: "bg-violet-50",  darkBg: "bg-violet-950/40",  textLight: "text-violet-700",  textDark: "text-violet-300",  borderLight: "border-violet-200",  borderDark: "border-violet-800",  icon: ICONS.customer },
  customer_registration: { label: "Registration",    lightBg: "bg-teal-50",    darkBg: "bg-teal-950/40",    textLight: "text-teal-700",    textDark: "text-teal-300",    borderLight: "border-teal-200",    borderDark: "border-teal-800",    icon: ICONS.registration },
  customer_trusted:   { label: "Trusted",            lightBg: "bg-emerald-50", darkBg: "bg-emerald-950/40", textLight: "text-emerald-700", textDark: "text-emerald-300", borderLight: "border-emerald-200", borderDark: "border-emerald-800", icon: ICONS.checkAll },
  customer_untrusted: { label: "Untrusted",          lightBg: "bg-orange-50",  darkBg: "bg-orange-950/40",  textLight: "text-orange-700",  textDark: "text-orange-300",  borderLight: "border-orange-200",  borderDark: "border-orange-800",  icon: ICONS.alert },
  customer_flagged:   { label: "Flagged",            lightBg: "bg-red-50",     darkBg: "bg-red-950/40",     textLight: "text-red-700",     textDark: "text-red-300",     borderLight: "border-red-200",     borderDark: "border-red-800",     icon: ICONS.flagged },
  customer_unflagged: { label: "Unflagged",          lightBg: "bg-green-50",   darkBg: "bg-green-950/40",   textLight: "text-green-700",   textDark: "text-green-300",   borderLight: "border-green-200",   borderDark: "border-green-800",   icon: ICONS.check },
  default:            { label: "Notification",       lightBg: "bg-gray-50",    darkBg: "bg-gray-800",       textLight: "text-gray-700",    textDark: "text-gray-300",    borderLight: "border-gray-200",    borderDark: "border-gray-700",    icon: ICONS.bell },
};

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PK", { month: "short", day: "numeric" });
}

function fullDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

function Toast({ msg, type, onClose }) {
  const { isLightTheme } = useTheme();
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div
      className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold sm:max-w-sm"
      style={{
        background: isLightTheme ? (type === "error" ? "#dc2626" : "#059669") : (type === "error" ? "#991b1b" : "#065f46"),
        color: "white",
      }}
    >
      <Ico d={type === "error" ? ICONS.alert : ICONS.check} className="w-4 h-4 shrink-0" />
      <span className="flex-1 break-words">{msg}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 text-lg leading-none ml-1">×</button>
    </div>
  );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading, icon = "trash" }) {
  const { isLightTheme } = useTheme();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative rounded-2xl shadow-2xl w-full max-w-[calc(100vw-2rem)] sm:max-w-sm p-5 sm:p-6 space-y-4"
        style={{ background: isLightTheme ? "#ffffff" : "#1a1a1a" }}
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto">
          <Ico d={ICONS[icon] || ICONS.trash} className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
        </div>
        <div className="text-center">
          <p className="font-bold text-base sm:text-lg" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>{title}</p>
          <p className="text-xs sm:text-sm mt-1" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>{message}</p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border rounded-xl text-sm font-semibold transition"
            style={{
              borderColor: isLightTheme ? "#e5e7eb" : "#374151",
              color: isLightTheme ? "#4b5563" : "#d1d5db",
              background: "transparent",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-60"
          >
            {loading ? "Processing…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationCard({ notif, selected, onSelect, onMarkRead, onDelete, isDeleting }) {
  const { isLightTheme } = useTheme();
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.default;
  const isUnread = !notif.isRead;

  const bgUnread = isLightTheme 
    ? "bg-gradient-to-r from-amber-50/70 to-transparent" 
    : "bg-gradient-to-r from-amber-950/40 to-transparent";
  const borderUnread = isLightTheme ? "border-l-4 border-l-amber-400" : "border-l-4 border-l-amber-600";
  const cardBg = isLightTheme ? "bg-white" : "bg-gray-900/90";
  const cardBorder = isLightTheme ? "border border-gray-100" : "border border-gray-800";

  return (
    <div className={`group relative rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-lg ${isUnread ? `${bgUnread} ${borderUnread}` : `${cardBg} ${cardBorder}`}`}>
      <div className={`flex items-start gap-2 sm:gap-4 p-3 sm:p-5 ${isUnread ? "pl-2 sm:pl-4" : ""}`}>
        {/* Checkbox */}
        <div className="pt-0.5">
          <button
            onClick={() => onSelect(notif._id)}
            className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0"
            style={{
              borderColor: selected ? "#10b981" : isLightTheme ? "#d1d5db" : "#4b5563",
              background: selected ? "#10b981" : "transparent",
            }}
          >
            {selected && <Ico d={ICONS.check} className="w-3 h-3 text-white" />}
          </button>
        </div>

        {/* Icon */}
        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${isLightTheme ? cfg.lightBg : cfg.darkBg} ${isLightTheme ? cfg.borderLight : cfg.borderDark} border shadow-sm`}>
          <Ico d={cfg.icon} className={`w-4 h-4 sm:w-6 sm:h-6 ${isLightTheme ? cfg.textLight : cfg.textDark}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-1 mb-1">
            <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
              <p className={`text-xs sm:text-base font-black break-words ${isUnread ? (isLightTheme ? "text-gray-900" : "text-white") : (isLightTheme ? "text-gray-700" : "text-gray-300")}`}>
                {notif.title}
              </p>
              <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-[8px] sm:text-[10px] font-bold whitespace-nowrap ${isLightTheme ? cfg.lightBg : cfg.darkBg} ${isLightTheme ? cfg.textLight : cfg.textDark} ${isLightTheme ? cfg.borderLight : cfg.borderDark} border`}>
                <Ico d={cfg.icon} className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                {cfg.label}
              </span>
              {isUnread && (
                <span 
                  className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-[8px] sm:text-[10px] font-bold whitespace-nowrap"
                  style={{
                    background: isLightTheme ? '#f59e0b' : '#d97706',
                    color: 'white',
                  }}
                >
                  <Ico d={ICONS.dot} className="w-1.5 h-1.5" />
                  New
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <span className="text-[9px] sm:text-xs text-gray-400 font-medium whitespace-nowrap">
                {timeAgo(notif.createdAt)}
              </span>
              {isUnread && (
                <button
                  onClick={() => onMarkRead(notif._id)}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: "#10b981",
                    color: "white",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#059669"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#10b981"; }}
                  title="Mark as read"
                >
                  <Ico d={ICONS.check} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              )}
              <button
                onClick={() => onDelete(notif)}
                disabled={isDeleting === notif._id}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "#ef4444",
                  color: "white",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#dc2626"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#ef4444"; }}
                title="Delete notification"
              >
                {isDeleting === notif._id ? (
                  <span className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Ico d={ICONS.trash} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
              </button>
            </div>
          </div>
          <p className={`text-[11px] sm:text-sm leading-relaxed break-words ${isUnread ? (isLightTheme ? "text-gray-700" : "text-gray-300") : (isLightTheme ? "text-gray-500" : "text-gray-400")}`}>
            {notif.message}
          </p>
          <p className="text-[9px] sm:text-xs text-gray-400 mt-1.5 flex items-center gap-1">
            <Ico d={ICONS.dot} className="w-1 h-1" />
            {fullDate(notif.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminNotifications() {
  const { isLightTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [markAllReadConfirm, setMarkAllReadConfirm] = useState(false);
  const [markSelectedConfirm, setMarkSelectedConfirm] = useState(false);
  const [deleteSelectedConfirm, setDeleteSelectedConfirm] = useState(false);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleteSingleConfirm, setDeleteSingleConfirm] = useState({ open: false, notification: null });
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const showToast = (msg, type = "success") => setToast({ msg, type });

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    setError("");
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await adminAPI.getNotifications();
      const d = res.data ?? res;
      setNotifications(d.notifications ?? []);
      setUnreadCount(d.unreadCount ?? 0);
      setTotalCount(d.totalCount || d.notifications?.length || 0);  // ← ADD THIS LINE
      setSelectedIds(new Set());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications.");
      showToast("Failed to load notifications", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(n => n._id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleMarkSelectedRead = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(ids.map(id => adminAPI.markNotificationRead(id)));
      setNotifications(prev =>
        prev.map(n => (selectedIds.has(n._id) ? { ...n, isRead: true } : n))
      );
      const newlyReadCount = ids.filter(id => !notifications.find(n => n._id === id)?.isRead).length;
      setUnreadCount(prev => Math.max(0, prev - newlyReadCount));
      setSelectedIds(new Set());
      showToast(`${ids.length} notification(s) marked as read`);
    } catch (err) {
      showToast("Failed to mark selected as read", "error");
    } finally {
      setBulkLoading(false);
      setMarkSelectedConfirm(false);
    }
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(ids.map(id => adminAPI.deleteNotification(id)));
      const remaining = notifications.filter(n => !selectedIds.has(n._id));
      setNotifications(remaining);
      const deletedUnreadCount = ids.filter(id => !notifications.find(n => n._id === id)?.isRead).length;
      setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
      setSelectedIds(new Set());
      showToast(`${ids.length} notification(s) deleted`);
    } catch (err) {
      showToast("Failed to delete selected notifications", "error");
    } finally {
      setBulkLoading(false);
      setDeleteSelectedConfirm(false);
    }
  };

  const handleDeleteAll = async () => {
    const ids = notifications.map(n => n._id);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(ids.map(id => adminAPI.deleteNotification(id)));
      setNotifications([]);
      setUnreadCount(0);
      setSelectedIds(new Set());
      showToast("All notifications deleted");
    } catch (err) {
      showToast("Failed to delete all notifications", "error");
    } finally {
      setBulkLoading(false);
      setDeleteAllConfirm(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setBulkLoading(true);
    try {
      await adminAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast("All notifications marked as read");
    } catch (err) {
      showToast("Failed to mark all as read", "error");
    } finally {
      setBulkLoading(false);
      setMarkAllReadConfirm(false);
    }
  };

  const handleMarkRead = async (id) => {
    setMarkingId(id);
    try {
      await adminAPI.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      showToast("Notification marked as read");
    } catch (err) {
      showToast("Failed to mark as read", "error");
    } finally {
      setMarkingId(null);
    }
  };

  const handleDeleteSingle = async () => {
    const notif = deleteSingleConfirm.notification;
    if (!notif) return;
    setDeletingId(notif._id);
    try {
      await adminAPI.deleteNotification(notif._id);
      setNotifications(prev => prev.filter(n => n._id !== notif._id));
      if (!notif.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
      showToast("Notification deleted");
    } catch (err) {
      showToast("Failed to delete notification", "error");
    } finally {
      setDeletingId(null);
      setDeleteSingleConfirm({ open: false, notification: null });
    }
  };

  const filtered = notifications.filter((n) => {
    const matchRead =
      filter === "all" ||
      (filter === "unread" && !n.isRead) ||
      (filter === "read" && n.isRead);
    const matchType = !typeFilter || n.type === typeFilter;
    return matchRead && matchType;
  });

  const types = [...new Set(notifications.map((n) => n.type).filter(Boolean))];
  const selectedCount = selectedIds.size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12">
            <div className="absolute inset-0 rounded-full border-2 border-amber-100 dark:border-amber-900" />
            <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 animate-spin" />
          </div>
          <p className="text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-semibold tracking-widest uppercase">Loading notifications…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400">
          <Ico d={ICONS.alert} className="w-6 h-6 sm:w-7 sm:h-7" />
        </div>
        <div>
          <p className="font-black text-base sm:text-lg text-gray-900 dark:text-white">Failed to load notifications</p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 break-words">{error}</p>
        </div>
        <button onClick={() => fetchNotifications()} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
              <Ico d={ICONS.bell} className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-red-500 text-white text-[8px] sm:text-[11px] font-black flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-900">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 
              className="text-lg sm:text-2xl font-black tracking-tight"
              style={{ color: isLightTheme ? '#1f2937' : '#ffffff' }}
            >
              Notifications
            </h1>
            <p 
              className="text-[10px] sm:text-sm mt-0.5"
              style={{ color: isLightTheme ? '#6b7280' : '#9ca3af' }}
            >
              Manage and organize your alerts
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Ico d={ICONS.refresh} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => setMarkAllReadConfirm(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <Ico d={ICONS.checkAll} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Mark All Read</span>
              <span className="sm:hidden">Mark All</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => setDeleteAllConfirm(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              <Ico d={ICONS.trash} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Delete All</span>
              <span className="sm:hidden">All</span>
            </button>
          )}
        </div>
      </div>

     {/* Stats Cards */}
<div className="grid grid-cols-3 gap-1.5 sm:gap-4">
  {[
    { key: "all", label: "Total", count: totalCount, icon: ICONS.bell, colorLight: "text-amber-600", colorDark: "text-amber-400", bgLight: "bg-amber-50", bgDark: "bg-amber-950/40", borderLight: "border-amber-200", borderDark: "border-amber-800" },
    { key: "unread", label: "Unread", count: unreadCount, icon: ICONS.alert, colorLight: "text-blue-600", colorDark: "text-blue-400", bgLight: "bg-blue-50", bgDark: "bg-blue-950/40", borderLight: "border-blue-200", borderDark: "border-blue-800" },
    { key: "read", label: "Read", count: Math.max(0, totalCount - unreadCount), icon: ICONS.check, colorLight: "text-emerald-600", colorDark: "text-emerald-400", bgLight: "bg-emerald-50", bgDark: "bg-emerald-950/40", borderLight: "border-emerald-200", borderDark: "border-emerald-800" },
  ].map(({ key, label, count, icon, colorLight, colorDark, bgLight, bgDark, borderLight, borderDark }) => {
          const isActive = filter === key;
          return (
            <button
              key={key}
              onClick={() => { setFilter(key); clearSelection(); }}
              className={`rounded-xl sm:rounded-2xl border p-1.5 sm:p-4 text-center transition-all hover:shadow-md min-w-0 ${
                isActive 
                  ? (isLightTheme ? `${bgLight} ${borderLight}` : `${bgDark} ${borderDark}`)
                  : (isLightTheme ? "bg-white border-gray-200" : "bg-gray-900/80 border-gray-800")
              }`}
            >
              <Ico d={icon} className={`w-3.5 h-3.5 sm:w-6 sm:h-6 mx-auto mb-0.5 sm:mb-2 ${
                isActive 
                  ? (isLightTheme ? colorLight : colorDark) 
                  : (isLightTheme ? "text-gray-400" : "text-gray-500")
              }`} />
              <p className={`text-sm sm:text-3xl font-black ${
                isActive 
                  ? (isLightTheme ? colorLight : colorDark) 
                  : (isLightTheme ? "text-gray-800" : "text-white")
              }`}>
                {count}
              </p>
              <p className="text-[7px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5 sm:mt-1">
                {label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Action Bar */}
      {selectedCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {selectedCount} selected
            </p>
            <button
              onClick={clearSelection}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setMarkSelectedConfirm(true)}
              disabled={bulkLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold transition"
            >
              <Ico d={ICONS.checkAll} className="w-4 h-4" />
              Mark Selected Read
            </button>
            <button
              onClick={() => setDeleteSelectedConfirm(true)}
              disabled={bulkLoading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold transition"
            >
              <Ico d={ICONS.trash} className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Type Filters */}
      {types.length > 0 && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setTypeFilter("")}
            className={`px-2 sm:px-4 py-1 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold transition-all whitespace-nowrap ${
              !typeFilter
                ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            All
          </button>
          {types.map((type) => {
            const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.default;
            const isActive = typeFilter === type;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(isActive ? "" : type)}
                className={`inline-flex items-center gap-1 px-2 sm:px-4 py-1 sm:py-2 rounded-xl text-[10px] sm:text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? `${isLightTheme ? cfg.lightBg : cfg.darkBg} ${isLightTheme ? cfg.textLight : cfg.textDark} border ${isLightTheme ? cfg.borderLight : cfg.borderDark} shadow-sm`
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <Ico d={cfg.icon} className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className={`text-center py-12 sm:py-20 rounded-xl sm:rounded-2xl border ${isLightTheme ? "bg-white border-gray-100" : "bg-gray-900 border-gray-800"} shadow-sm`}>
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Ico d={ICONS.inbox} className="w-7 h-7 sm:w-10 sm:h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="font-bold text-gray-600 dark:text-gray-400 text-base sm:text-lg">No notifications</p>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-xs sm:max-w-sm mx-auto px-3">
            {filter !== "all" || typeFilter
              ? "Try changing your filters to see more notifications"
              : "You're all caught up! New notifications will appear here"}
          </p>
          {(filter !== "all" || typeFilter) && (
            <button
              onClick={() => { setFilter("all"); setTypeFilter(""); clearSelection(); }}
              className="mt-4 sm:mt-6 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
            >
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-2 flex items-center justify-center" style={{ borderColor: isLightTheme ? "#d1d5db" : "#4b5563", background: selectedIds.size === filtered.length ? "#10b981" : "transparent" }}>
                {selectedIds.size === filtered.length && <Ico d={ICONS.check} className="w-2 h-2 sm:w-3 sm:h-3 text-white" />}
              </div>
              {selectedIds.size === filtered.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {filtered.map((notif, index) => (
              <div key={notif._id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
                <NotificationCard
                  notif={notif}
                  selected={selectedIds.has(notif._id)}
                  onSelect={toggleSelect}
                  onMarkRead={handleMarkRead}
                  onDelete={(n) => setDeleteSingleConfirm({ open: true, notification: n })}
                  isDeleting={deletingId}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {filtered.length > 0 && (
        <div className="text-center pt-2 sm:pt-4">
          <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
            Showing {filtered.length} of {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <ConfirmDialog
        open={markAllReadConfirm}
        title="Mark All as Read"
        message={`Are you sure you want to mark all ${unreadCount} unread notifications as read?`}
        onConfirm={handleMarkAllRead}
        onCancel={() => setMarkAllReadConfirm(false)}
        loading={bulkLoading}
        icon="checkAll"
      />
      <ConfirmDialog
        open={markSelectedConfirm}
        title="Mark Selected as Read"
        message={`Mark ${selectedCount} selected notification(s) as read?`}
        onConfirm={handleMarkSelectedRead}
        onCancel={() => setMarkSelectedConfirm(false)}
        loading={bulkLoading}
        icon="checkAll"
      />
      <ConfirmDialog
        open={deleteSelectedConfirm}
        title="Delete Selected"
        message={`Delete ${selectedCount} selected notification(s)? This action cannot be undone.`}
        onConfirm={handleDeleteSelected}
        onCancel={() => setDeleteSelectedConfirm(false)}
        loading={bulkLoading}
        icon="trash"
      />
      <ConfirmDialog
        open={deleteAllConfirm}
        title="Delete All Notifications"
        message={`Delete all ${notifications.length} notifications? This action cannot be undone.`}
        onConfirm={handleDeleteAll}
        onCancel={() => setDeleteAllConfirm(false)}
        loading={bulkLoading}
        icon="trash"
      />
      <ConfirmDialog
        open={deleteSingleConfirm.open}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        onConfirm={handleDeleteSingle}
        onCancel={() => setDeleteSingleConfirm({ open: false, notification: null })}
        loading={deletingId !== null}
        icon="trash"
      />

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}