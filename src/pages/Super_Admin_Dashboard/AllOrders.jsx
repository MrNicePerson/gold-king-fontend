// pages/SuperAdmin_Dashboard/AllOrders.jsx
// System-wide orders (all shops) – Super Admin view
// Status updates only allowed for orders belonging to Super Admin's own shop.
// Full theme support, mobile-responsive cards + table, pagination matching MyOrders.jsx

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as superAdminAPI from '../../services/superAdminApi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n != null ? Number(n).toLocaleString('en-PK') : '—');
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/**
 * Resolve shop display name from an order.
 */
function getShopName(order) {
  const shop = order.adminId;
  if (!shop) return 'Unknown Shop';
  if (shop.shopName && shop.shopName.trim()) return shop.shopName.trim();
  if (order.adminModel === 'SuperAdmin' && shop.name && shop.name.trim()) return shop.name.trim();
  if (shop.name && shop.name.trim()) return shop.name.trim();
  if (shop._id) return `Shop …${shop._id.toString().slice(-6)}`;
  return 'Unknown Shop';
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS = {
  pending:   { label: 'Pending',   dot: '#F59E0B' },
  approved:  { label: 'Approved',  dot: '#3B82F6' },
  completed: { label: 'Completed', dot: '#10B981' },
  rejected:  { label: 'Rejected',  dot: '#EF4444' },
  cancelled: { label: 'Cancelled', dot: '#6B7280' },
};

const ORDER_TYPE = {
  buy:  { label: 'Buy'  },
  sell: { label: 'Sell' },
};

const METAL = {
  gold:     { label: 'Gold',     icon: '⬡' },
  silver:   { label: 'Silver',   icon: '◆' },
  currency: { label: 'Currency', icon: '₨' },
};

const TABS = [
  { key: 'all',       label: 'All Orders',  statuses: null,                    icon: '📋', accent: '#6B7280' },
  { key: 'active',    label: 'Active',      statuses: ['pending', 'approved'], icon: '⏳', accent: '#F59E0B' },
  { key: 'completed', label: 'Completed',   statuses: ['completed'],           icon: '✅', accent: '#10B981' },
  { key: 'rejected',  label: 'Rejected',    statuses: ['rejected'],            icon: '✕',  accent: '#EF4444' },
  { key: 'cancelled', label: 'Cancelled',   statuses: ['cancelled'],           icon: '⊗',  accent: '#6B7280' },
];

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100];

// ─── Theme-aware helpers ───────────────────────────────────────────────────────
function useChipStyle(type, isLight) {
  const light = {
    buy:      { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
    sell:     { background: '#fff1f2', color: '#9f1239', border: '1px solid #fecdd3' },
    gold:     { background: '#fffbeb', color: '#78350f', border: '1px solid #fde68a' },
    silver:   { background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1' },
    currency: { background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe' },
  };
  const dark = {
    buy:      { background: 'rgba(5,150,105,0.15)',  color: '#6ee7b7', border: '1px solid rgba(5,150,105,0.3)' },
    sell:     { background: 'rgba(190,18,60,0.15)',  color: '#fda4af', border: '1px solid rgba(190,18,60,0.3)' },
    gold:     { background: 'rgba(217,119,6,0.15)',  color: '#fcd34d', border: '1px solid rgba(217,119,6,0.3)' },
    silver:   { background: 'rgba(100,116,139,0.15)',color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' },
    currency: { background: 'rgba(29,78,216,0.15)',  color: '#93c5fd', border: '1px solid rgba(29,78,216,0.3)' },
  };
  return (isLight ? light : dark)[type] || (isLight ? light : dark).buy;
}

function useStatusStyle(status, isLight) {
  const light = {
    pending:   { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' },
    approved:  { background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' },
    completed: { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
    rejected:  { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
    cancelled: { background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' },
  };
  const dark = {
    pending:   { background: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' },
    approved:  { background: 'rgba(59,130,246,0.15)',  color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' },
    completed: { background: 'rgba(16,185,129,0.15)',  color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' },
    rejected:  { background: 'rgba(239,68,68,0.15)',   color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' },
    cancelled: { background: 'rgba(107,114,128,0.15)', color: '#d1d5db', border: '1px solid rgba(107,114,128,0.3)' },
  };
  return (isLight ? light : dark)[status] || light.pending;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = 'success', title = '') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type, title }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 5000);
  }, []);
  const removeToast = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, addToast, removeToast };
}

function ToastContainer({ toasts, removeToast }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl max-w-sm backdrop-blur-sm border"
          style={{
            animation: 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
            background: isLightTheme
              ? (t.type === 'error' ? '#fef2f2' : t.type === 'warning' ? '#fffbeb' : theme.cardBg)
              : (t.type === 'error' ? 'rgba(127,29,29,0.97)' : t.type === 'warning' ? 'rgba(78,52,0,0.97)' : 'rgba(17,24,39,0.97)'),
            borderColor: isLightTheme
              ? (t.type === 'error' ? '#fecaca' : t.type === 'warning' ? '#fde68a' : theme.border)
              : (t.type === 'error' ? '#7f1d1d' : t.type === 'warning' ? '#3d2e0a' : '#374151'),
            color: isLightTheme ? theme.textPrimary : '#f9fafb',
          }}
        >
          <span className="text-lg mt-0.5 shrink-0">
            {t.type === 'error' ? '⚠️' : t.type === 'warning' ? '⚡' : '✓'}
          </span>
          <div className="flex-1 min-w-0">
            {t.title && <p className="font-bold text-sm">{t.title}</p>}
            <p className="text-sm opacity-80 mt-0.5">{t.msg}</p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="opacity-50 hover:opacity-100 transition-opacity text-lg leading-none shrink-0"
          >×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────
function Spinner({ size = 'sm', className = '' }) {
  const s = size === 'lg' ? 'w-8 h-8' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <svg className={`animate-spin ${s} ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function StatusBadge({ status }) {
  const { isLightTheme } = useTheme();
  const s = useStatusStyle(status, isLightTheme);
  const dot = STATUS[status]?.dot || '#F59E0B';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap"
      style={{ background: s.background, color: s.color, border: s.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: dot }} />
      {STATUS[status]?.label || status}
    </span>
  );
}

function Chip({ children, type }) {
  const { isLightTheme } = useTheme();
  const style = useChipStyle(type, isLightTheme);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={style}
    >
      {children}
    </span>
  );
}

function Avatar({ name, size = 'md' }) {
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  const s = size === 'lg' ? 'w-14 h-14 text-base' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${s} rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

function SectionLabel({ children }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: isLightTheme ? theme.textMuted : '#9CA3AF' }}>
      {children}
    </p>
  );
}

function Overlay({ children, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:w-auto"
        style={{ animation: 'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {children}
      </div>
    </div>
  );
}

function ScopeBadge() {
  const { isLightTheme } = useTheme();
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full"
      style={{
        background: isLightTheme ? '#f3e8ff' : 'rgba(139,92,246,0.15)',
        color: isLightTheme ? '#7e22ce' : '#c4b5fd',
        border: isLightTheme ? '1px solid #e9d5ff' : '1px solid rgba(139,92,246,0.3)',
      }}
    >
      🏪 All Shops
    </span>
  );
}

// ─── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({ order, currentUserId, onClose }) {
  const { theme, isLightTheme } = useTheme();
  if (!order) return null;

  const isOwnShop = order.adminId?._id === currentUserId;
  const customer = order.customerId || {};
  const shop = order.adminId || {};
  const shopName = getShopName(order);

  const hasCompletion = order.status === 'completed' && order.finalizedAmount != null;
  const baseAmount = order.completionBaseAmount ?? order.totalAmount;
  const extra = order.extraCharges || 0;
  const disc = order.discount || 0;
  const finalAmt = order.finalizedAmount;

  const modalBg     = isLightTheme ? '#ffffff' : '#1a1a1a';
  const borderColor = isLightTheme ? '#f3f4f6' : '#2a2a2a';
  const textPrimary = isLightTheme ? '#111827' : '#e5e7eb';
  const textMuted   = isLightTheme ? '#6b7280'  : '#9ca3af';
  const sectionBg   = isLightTheme ? '#f9fafb'  : '#1f1f1f';

  return (
    <Overlay onClose={onClose}>
      <div
        className="rounded-t-3xl sm:rounded-2xl w-full sm:w-[580px] max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
        style={{ background: modalBg }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-4 sm:px-6 pt-5 pb-4 border-b"
          style={{ borderColor }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {order.orderType && (
                <Chip type={order.orderType}>{ORDER_TYPE[order.orderType]?.label}</Chip>
              )}
              {order.metalType && (
                <Chip type={order.metalType}>
                  {METAL[order.metalType]?.icon} {METAL[order.metalType]?.label}
                  {order.carat && order.metalType !== 'currency' && (
                    <span className="opacity-60 ml-0.5">{order.carat}</span>
                  )}
                </Chip>
              )}
              <StatusBadge status={order.status} />
              {!isOwnShop && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: sectionBg, color: textMuted, border: `1px solid ${borderColor}` }}
                >
                  👁 Read-only
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm transition-colors"
              style={{ background: sectionBg, color: textMuted }}
            >✕</button>
          </div>

          <div className="mt-3 mb-2">
            <p className="text-xs font-medium mb-0.5" style={{ color: textMuted }}>Order ID</p>
            <p className="font-mono text-base font-black tracking-wider" style={{ color: isLightTheme ? '#374151' : '#d1d5db' }}>
              #{order._id?.slice(-14)}
            </p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: textMuted }}>
                {hasCompletion ? 'Final Amount' : 'Order Amount'}
              </p>
              <p
                className="text-3xl font-black mt-0.5"
                style={{ color: hasCompletion ? (isLightTheme ? '#047857' : '#34d399') : textPrimary }}
              >
                PKR {fmt(hasCompletion ? finalAmt : order.totalAmount)}
              </p>
              {hasCompletion && order.totalAmount !== order.finalizedAmount && (
                <p className="text-sm font-semibold mt-0.5" style={{ color: textMuted }}>
                  Quoted: PKR {fmt(order.totalAmount)}
                </p>
              )}
            </div>
            {order.receiptNumber && (
              <div className="text-right">
                <p className="text-xs" style={{ color: textMuted }}>Receipt</p>
                <p className="font-mono text-sm font-bold" style={{ color: isLightTheme ? '#374151' : '#d1d5db' }}>
                  {order.receiptNumber}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6" style={{ background: modalBg }}>

          {/* Shop */}
          <div>
            <SectionLabel>Shop</SectionLabel>
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{
                background: isLightTheme ? '#fffbeb' : '#1f1a10',
                border: isLightTheme ? '1px solid #fde68a' : '1px solid #3d2e0a',
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
                style={{ background: isLightTheme ? '#fef3c7' : '#3d2e0a' }}
              >
                🏪
              </div>
              <div>
                <p className="font-bold" style={{ color: isLightTheme ? '#78350f' : '#fcd34d' }}>{shopName}</p>
                <p className="text-xs" style={{ color: isLightTheme ? '#92400e' : '#fbbf24' }}>
                  {shop.phoneNumber || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div>
            <SectionLabel>Customer</SectionLabel>
            <div className="rounded-xl p-4 space-y-3" style={{ background: sectionBg }}>
              <div className="flex items-center gap-3">
                <Avatar name={customer.name} size="sm" />
                <div>
                  <p className="font-bold" style={{ color: textPrimary }}>{customer.name || '—'}</p>
                  <p className="text-xs" style={{ color: textMuted }}>{customer.email || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs" style={{ color: textMuted }}>Phone</p>
                  <p className="font-medium" style={{ color: textPrimary }}>{customer.phoneNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: textMuted }}>WhatsApp</p>
                  <p className="font-medium" style={{ color: textPrimary }}>{customer.whatsappNumber || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs" style={{ color: textMuted }}>Address</p>
                  <p className="font-medium" style={{ color: textPrimary }}>{customer.address || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs" style={{ color: textMuted }}>City</p>
                  <p className="font-medium" style={{ color: textPrimary }}>{customer.city || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div>
            <SectionLabel>Order Details</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3.5" style={{ background: sectionBg }}>
                <p className="text-xs" style={{ color: textMuted }}>Quantity</p>
                {order.metalType !== 'currency' && order.quantityDisplay ? (
                  <>
                    <p className="font-bold mt-1" style={{ color: textPrimary }}>
                      {order.quantityDisplay}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                      {Number(order.quantityInTola).toFixed(3)} tola · {Number(order.quantityInGram).toFixed(2)} g
                    </p>
                  </>
                ) : (
                  <p className="font-bold mt-1" style={{ color: textPrimary }}>
                    {order.quantity} {order.unit}
                  </p>
                )}
              </div>
              <div className="rounded-xl p-3.5" style={{ background: sectionBg }}>
                <p className="text-xs" style={{ color: textMuted }}>Unit Price / Tola</p>
                <p className="font-bold text-amber-600 mt-1" style={!isLightTheme ? { color: '#fbbf24' } : {}}>
                  PKR {fmt(order.finalPricePerTolaPKR)}
                </p>
                {order.adminDiffPKR !== undefined && (
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: order.adminDiffPKR > 0 ? (isLightTheme ? '#059669' : '#34d399') : order.adminDiffPKR < 0 ? (isLightTheme ? '#ef4444' : '#f87171') : textMuted }}
                  >
                    Markup: {order.adminDiffPKR > 0 ? '+' : ''}{fmt(order.adminDiffPKR)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Breakdown – metal */}
          {order.metalType !== 'currency' && (
            <div>
              <SectionLabel>Pricing Breakdown (at order)</SectionLabel>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor }}>
                {[
                  { label: 'Market Price (USD/oz)', value: `$${fmt(order.marketPriceUSD)}` },
                  { label: 'USD Rate (PKR)',         value: `PKR ${fmt(order.dollarRatePKR)}` },
                  { label: 'Base / Tola',            value: `PKR ${fmt(order.basePricePerTolaPKR)}` },
                  { label: 'Markup Applied',         value: `${order.adminDiffPKR > 0 ? '+' : ''}${fmt(order.adminDiffPKR)}`, accent: order.adminDiffPKR > 0 ? (isLightTheme ? '#059669' : '#34d399') : order.adminDiffPKR < 0 ? (isLightTheme ? '#ef4444' : '#f87171') : undefined },
                  { label: 'Final / Tola',           value: `PKR ${fmt(order.finalPricePerTolaPKR)}`, bold: true },
                  { label: 'Total Amount',           value: `PKR ${fmt(order.totalAmount)}`, bold: true, highlight: true },
                ].map(({ label, value, accent, bold, highlight }, i) => (
                  <div
                    key={label}
                    className="flex justify-between items-center px-4 py-2.5 text-sm"
                    style={{
                      background: highlight
                        ? (isLightTheme ? '#fffbeb' : '#1f1a10')
                        : i % 2 === 0 ? sectionBg : modalBg,
                      borderTop: highlight ? `2px solid ${isLightTheme ? '#fde68a' : '#3d2e0a'}` : bold ? `1px solid ${borderColor}` : undefined,
                    }}
                  >
                    <span style={{ color: highlight ? (isLightTheme ? '#92400e' : '#fbbf24') : textMuted, fontWeight: highlight || bold ? 700 : 400 }}>
                      {label}
                    </span>
                    <span style={{ color: accent || (highlight ? (isLightTheme ? '#92400e' : '#f59e0b') : bold ? (isLightTheme ? '#b45309' : '#fbbf24') : textPrimary), fontWeight: highlight ? 900 : bold ? 700 : 400, fontSize: highlight ? '1rem' : undefined }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Currency order pricing */}
          {order.metalType === 'currency' && (
            <div>
              <SectionLabel>Order Pricing</SectionLabel>
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: isLightTheme ? '#eff6ff' : '#0f1729', border: isLightTheme ? '1px solid #bfdbfe' : '1px solid #1e3a5f' }}
              >
                {[
                  { label: 'Currency / Unit', value: order.unit },
                  { label: 'Quantity',        value: fmt(order.quantity) },
                  { label: 'Rate (PKR)',      value: `PKR ${fmt(order.finalPricePerTolaPKR)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span style={{ color: isLightTheme ? '#1d4ed8' : '#93c5fd' }}>{label}</span>
                    <span className="font-bold" style={{ color: isLightTheme ? '#1e3a8a' : '#bfdbfe' }}>{value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2" style={{ borderTop: isLightTheme ? '1px solid #bfdbfe' : '1px solid #1e3a5f' }}>
                  <span className="font-bold" style={{ color: isLightTheme ? '#1e3a8a' : '#bfdbfe' }}>Total</span>
                  <span className="text-xl font-black" style={{ color: isLightTheme ? '#1e3a8a' : '#bfdbfe' }}>PKR {fmt(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Completion Summary */}
          {hasCompletion && (
            <div>
              <SectionLabel>Completion Summary</SectionLabel>
              <div
                className="rounded-2xl p-4 space-y-2"
                style={{ background: isLightTheme ? '#ecfdf5' : '#0a1a14', border: isLightTheme ? '1px solid #a7f3d0' : '1px solid #064e3b' }}
              >
                <div className="flex justify-between text-sm">
                  <span style={{ color: textMuted }}>Base Amount</span>
                  <span className="font-semibold" style={{ color: textPrimary }}>PKR {fmt(baseAmount)}</span>
                </div>
                {extra > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: textMuted }}>+ Extra Charges</span>
                    <span className="font-semibold" style={{ color: isLightTheme ? '#047857' : '#34d399' }}>PKR {fmt(extra)}</span>
                  </div>
                )}
                {disc > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: textMuted }}>− Discount</span>
                    <span className="font-semibold" style={{ color: isLightTheme ? '#dc2626' : '#f87171' }}>PKR {fmt(disc)}</span>
                  </div>
                )}
                <div className="pt-3 flex justify-between" style={{ borderTop: isLightTheme ? '1px solid #a7f3d0' : '1px solid #064e3b' }}>
                  <span className="font-bold" style={{ color: isLightTheme ? '#065f46' : '#6ee7b7' }}>Final Amount</span>
                  <span className="text-xl font-black" style={{ color: isLightTheme ? '#065f46' : '#34d399' }}>PKR {fmt(finalAmt)}</span>
                </div>
                <p className="text-xs font-medium">
                  {order.paymentStatus === 'paid' ? '✅ Payment received' : '⏳ Payment pending'}
                </p>
              </div>
            </div>
          )}

          {/* Rejection / Cancellation reason */}
          {(order.status === 'rejected' || order.status === 'cancelled') && order.rejectionReason && (
            <div>
              <SectionLabel>{order.status === 'rejected' ? 'Rejection Reason' : 'Cancellation Reason'}</SectionLabel>
              <div
                className="rounded-xl p-4 text-sm"
                style={{
                  background: order.status === 'rejected' ? (isLightTheme ? '#fef2f2' : '#1a0f0f') : sectionBg,
                  border: order.status === 'rejected' ? (isLightTheme ? '1px solid #fecaca' : '1px solid #7f1d1d') : `1px solid ${borderColor}`,
                  color: order.status === 'rejected' ? (isLightTheme ? '#991b1b' : '#fca5a5') : textPrimary,
                }}
              >
                {order.rejectionReason}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div>
              <SectionLabel>Customer Notes</SectionLabel>
              <div
                className="rounded-xl p-4 text-sm"
                style={{ background: isLightTheme ? '#eff6ff' : '#0f1729', border: isLightTheme ? '1px solid #bfdbfe' : '1px solid #1e3a5f', color: isLightTheme ? '#1e40af' : '#93c5fd' }}
              >
                {order.notes}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <SectionLabel>Timeline</SectionLabel>
            <div className="relative pl-5">
              <div className="absolute left-2 top-2 bottom-2 w-px" style={{ background: isLightTheme ? '#e5e7eb' : '#374151' }} />
              {[
                { icon: '📋', label: 'Order Placed',   time: order.createdAt },
                order.approvedAt  && { icon: '✅', label: 'Approved',  time: order.approvedAt },
                order.paymentTime && { icon: '💳', label: 'Completed', time: order.paymentTime },
              ].filter(Boolean).map(({ label, time }, i) => (
                <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center -ml-2 mt-0.5 shrink-0"
                    style={{ background: modalBg, borderColor: isLightTheme ? '#d1d5db' : '#4b5563' }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: isLightTheme ? '#9ca3af' : '#6b7280' }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: isLightTheme ? '#374151' : '#d1d5db' }}>{label}</p>
                    <p className="text-xs" style={{ color: textMuted }}>{fmtDateTime(time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!isOwnShop && (
            <div className="pt-4 text-center" style={{ borderTop: `1px solid ${borderColor}` }}>
              <p className="text-xs flex items-center justify-center gap-2" style={{ color: textMuted }}>
                👁 This order belongs to another shop. Status cannot be changed here.
              </p>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, pageSize, onPageChange, onPageSizeChange, totalItems, showing }) {
  const { isLightTheme } = useTheme();
  if (totalItems === 0) return null;

  const pages = [];
  const delta = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  const inputBg     = isLightTheme ? '#ffffff' : '#1f1f1f';
  const borderColor = isLightTheme ? '#e5e7eb' : '#374151';
  const textPrimary = isLightTheme ? '#374151' : '#d1d5db';
  const textMuted   = isLightTheme ? '#6b7280'  : '#9ca3af';
  const selectArrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <div className="flex items-center gap-2 text-xs" style={{ color: textMuted }}>
        <span>Show</span>
        <select
          value={pageSize}
          onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
          className="px-2 py-1.5 rounded-lg border text-xs font-semibold focus:border-amber-400 outline-none appearance-none"
          style={{
            background: inputBg,
            borderColor,
            color: textPrimary,
            backgroundImage: selectArrow,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 6px center',
            paddingRight: '28px',
          }}
        >
          {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>
          per page ·{' '}
          <span className="font-semibold" style={{ color: textPrimary }}>{showing}</span>
          {' '}of{' '}
          <span className="font-semibold" style={{ color: textPrimary }}>{totalItems}</span>
          {' '}orders
        </span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="w-8 h-8 rounded-lg border text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: inputBg, borderColor, color: textMuted }}
          >‹</button>
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs" style={{ color: textMuted }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className="w-8 h-8 rounded-lg text-xs font-bold transition-colors"
                style={p === page
                  ? { background: '#f59e0b', borderColor: '#f59e0b', border: '1px solid', color: '#ffffff' }
                  : { background: inputBg, borderColor, border: '1px solid', color: textMuted }
                }
              >{p}</button>
            )
          )}
          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="w-8 h-8 rounded-lg border text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: inputBg, borderColor, color: textMuted }}
          >›</button>
        </div>
      )}
    </div>
  );
}

// ─── Filter Row ────────────────────────────────────────────────────────────────
function FilterRow({ search, setSearch, typeFilter, setTypeFilter, metalFilter, setMetalFilter, onClear, hasFilters }) {
  const { isLightTheme } = useTheme();
  const inputBg     = isLightTheme ? '#ffffff' : '#1f1f1f';
  const borderColor = isLightTheme ? '#e5e7eb' : '#374151';
  const textColor   = isLightTheme ? '#374151' : '#d1d5db';
  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
  };

  return (
    <div className="flex flex-wrap gap-2 items-center mb-5">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: isLightTheme ? '#9ca3af' : '#6b7280' }}>⌕</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Customer, shop, receipt, ID…"
          className="w-full pl-9 pr-8 py-2.5 rounded-xl border text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
          style={{ background: inputBg, borderColor, color: textColor }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg leading-none"
            style={{ color: isLightTheme ? '#9ca3af' : '#6b7280' }}
          >×</button>
        )}
      </div>

      <select
        value={typeFilter}
        onChange={e => setTypeFilter(e.target.value)}
        className="py-2.5 px-3 pr-8 rounded-xl border text-sm font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all appearance-none cursor-pointer"
        style={{ ...selectStyle, background: inputBg, borderColor, color: textColor }}
      >
        <option value="">All Types</option>
        <option value="buy">↑ Buy</option>
        <option value="sell">↓ Sell</option>
      </select>

      <select
        value={metalFilter}
        onChange={e => setMetalFilter(e.target.value)}
        className="py-2.5 px-3 pr-8 rounded-xl border text-sm font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all appearance-none cursor-pointer"
        style={{ ...selectStyle, background: inputBg, borderColor, color: textColor }}
      >
        <option value="">All Metals</option>
        <option value="gold">⬡ Gold</option>
        <option value="silver">◆ Silver</option>
        <option value="currency">₨ Currency</option>
      </select>

      {hasFilters && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-colors"
          style={{ background: inputBg, borderColor, color: isLightTheme ? '#6b7280' : '#9ca3af' }}
        >
          × Clear
        </button>
      )}
    </div>
  );
}

// ─── Orders Table (desktop) ────────────────────────────────────────────────────
function OrdersTable({ orders, onSelect }) {
  const { isLightTheme } = useTheme();
  const tableBg     = isLightTheme ? '#ffffff' : '#1a1a1a';
  const borderColor = isLightTheme ? '#f3f4f6' : '#2a2a2a';
  const textPrimary = isLightTheme ? '#111827' : '#e5e7eb';
  const textMuted   = isLightTheme ? '#6b7280'  : '#9ca3af';
  const headerBg    = isLightTheme ? '#f9fafb'  : '#1f1f1f';
  const hoverBg     = isLightTheme ? 'rgba(249,250,251,0.8)' : 'rgba(31,31,31,0.8)';

  return (
    <div className="hidden md:block rounded-2xl border overflow-hidden shadow-sm" style={{ background: tableBg, borderColor }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
              {['Order / ID', 'Customer', 'Shop', 'Quantity', 'Amount', 'Status', 'Date', ''].map(h => (
                <th
                  key={h}
                  className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: textMuted, background: headerBg }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const isCompleted = order.status === 'completed' && order.finalizedAmount != null;
              const shopDisplayName = getShopName(order);
              return (
                <tr
                  key={order._id}
                  onClick={() => onSelect(order)}
                  className="cursor-pointer transition-colors"
                  style={{ borderTop: `1px solid ${borderColor}` }}
                  onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {order.orderType && <Chip type={order.orderType}>{ORDER_TYPE[order.orderType]?.label}</Chip>}
                      {order.metalType && (
                        <Chip type={order.metalType}>
                          {METAL[order.metalType]?.icon} {METAL[order.metalType]?.label}
                          {order.carat && order.metalType !== 'currency' && <span className="opacity-60 ml-0.5">{order.carat}</span>}
                        </Chip>
                      )}
                    </div>
                    <p className="text-[12px] font-mono font-bold tracking-wide" style={{ color: textMuted }}>
                      #{order._id?.slice(-12)}
                    </p>
                    {order.receiptNumber && (
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: isLightTheme ? '#9ca3af' : '#4b5563' }}>
                        Rcpt: {order.receiptNumber.slice(-8)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={order.customerId?.name} size="sm" />
                      <div>
                        <p className="font-bold whitespace-nowrap" style={{ color: textPrimary }}>{order.customerId?.name || '—'}</p>
                        <p className="text-xs" style={{ color: textMuted }}>{order.customerId?.phoneNumber || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm" style={{ color: textMuted }}>🏪</span>
                      <span className="font-semibold text-sm" style={{ color: textPrimary }}>{shopDisplayName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {order.metalType !== 'currency' && order.quantityDisplay ? (
                      <>
                        <p className="font-semibold" style={{ color: textPrimary }}>
                          {order.quantityDisplay}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                          {Number(order.quantityInTola).toFixed(3)} tola · {Number(order.quantityInGram).toFixed(2)} g
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold" style={{ color: textPrimary }}>
                        {order.quantity} {order.unit}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {isCompleted ? (
                      <>
                        <p className="font-black text-base" style={{ color: isLightTheme ? '#047857' : '#34d399' }}>
                          PKR {fmt(order.finalizedAmount)}
                        </p>
                        {order.totalAmount !== order.finalizedAmount && (
                          <p className="text-[10px]" style={{ color: textMuted }}>orig. PKR {fmt(order.totalAmount)}</p>
                        )}
                      </>
                    ) : (
                      <p className="font-bold text-base" style={{ color: isLightTheme ? '#b45309' : '#fbbf24' }}>
                        PKR {fmt(order.totalAmount)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-4 text-xs whitespace-nowrap" style={{ color: textMuted }}>
                    {fmtDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onSelect(order)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors"
                      style={{ borderColor: isLightTheme ? '#e5e7eb' : '#374151', color: textMuted, background: 'transparent' }}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Mobile Cards ──────────────────────────────────────────────────────────────
function MobileCards({ orders, onSelect }) {
  const { isLightTheme } = useTheme();
  const cardBg      = isLightTheme ? '#ffffff' : '#1a1a1a';
  const borderColor = isLightTheme ? '#f3f4f6' : '#2a2a2a';
  const textPrimary = isLightTheme ? '#111827' : '#e5e7eb';
  const textMuted   = isLightTheme ? '#6b7280'  : '#9ca3af';
  const divider     = isLightTheme ? '#f3f4f6'  : '#2a2a2a';

  return (
    <div className="md:hidden space-y-3">
      {orders.map(order => {
        const isCompleted = order.status === 'completed' && order.finalizedAmount != null;
        const displayAmt = isCompleted ? order.finalizedAmount : order.totalAmount;
        const shopDisplayName = getShopName(order);
        return (
          <div
            key={order._id}
            onClick={() => onSelect(order)}
            className="rounded-2xl border p-4 cursor-pointer active:scale-[0.98] transition-transform shadow-sm"
            style={{ background: cardBg, borderColor }}
          >
            {/* Top row: chips + status */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex flex-wrap gap-1.5">
                {order.orderType && <Chip type={order.orderType}>{ORDER_TYPE[order.orderType]?.label}</Chip>}
                {order.metalType && (
                  <Chip type={order.metalType}>
                    {METAL[order.metalType]?.icon} {METAL[order.metalType]?.label}
                    {order.carat && order.metalType !== 'currency' && <span className="opacity-60 ml-0.5">{order.carat}</span>}
                  </Chip>
                )}
              </div>
              <StatusBadge status={order.status} />
            </div>

            {/* Order ID */}
            <p className="text-[12px] font-mono font-bold tracking-wide mb-2" style={{ color: textMuted }}>
              #{order._id?.slice(-12)}
            </p>

            {/* Customer + Amount */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar name={order.customerId?.name} size="sm" />
                <div>
                  <p className="font-bold text-sm" style={{ color: textPrimary }}>{order.customerId?.name || '—'}</p>
                  {order.metalType !== 'currency' && order.quantityDisplay ? (
                    <>
                      <p className="text-xs font-medium" style={{ color: textPrimary }}>{order.quantityDisplay}</p>
                      <p className="text-[10px]" style={{ color: textMuted }}>
                        {Number(order.quantityInTola).toFixed(3)} tola · {Number(order.quantityInGram).toFixed(2)} g
                      </p>
                    </>
                  ) : (
                    <p className="text-xs" style={{ color: textMuted }}>{order.quantity} {order.unit}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p
                  className="font-black text-lg"
                  style={{ color: isCompleted ? (isLightTheme ? '#047857' : '#34d399') : (isLightTheme ? '#b45309' : '#fbbf24') }}
                >
                  PKR {fmt(displayAmt)}
                </p>
                {isCompleted && order.totalAmount !== order.finalizedAmount && (
                  <p className="text-[11px]" style={{ color: textMuted }}>orig. PKR {fmt(order.totalAmount)}</p>
                )}
                <p className="text-xs" style={{ color: textMuted }}>{fmtDate(order.createdAt)}</p>
              </div>
            </div>

            {/* Shop row */}
            <div className="mt-2 pt-2 flex justify-between text-xs" style={{ borderTop: `1px solid ${divider}` }}>
              <span style={{ color: textMuted }}>Shop</span>
              <span className="font-semibold" style={{ color: textPrimary }}>{shopDisplayName}</span>
            </div>

            {order.receiptNumber && (
              <p className="text-[10px] font-mono mt-1.5" style={{ color: isLightTheme ? '#9ca3af' : '#4b5563' }}>
                Receipt: #{order.receiptNumber.slice(-10)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onClear, tabLabel }) {
  const { isLightTheme } = useTheme();
  return (
    <div
      className="text-center py-16 sm:py-20 rounded-2xl border"
      style={{ background: isLightTheme ? '#ffffff' : '#1a1a1a', borderColor: isLightTheme ? '#f3f4f6' : '#2a2a2a' }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl"
        style={{ background: isLightTheme ? '#f3f4f6' : '#2a2a2a' }}
      >
        📦
      </div>
      <p className="text-lg font-bold" style={{ color: isLightTheme ? '#1f2937' : '#e5e7eb' }}>
        No {tabLabel.toLowerCase()} orders
      </p>
      <p className="text-sm mt-2 max-w-xs mx-auto" style={{ color: isLightTheme ? '#9ca3af' : '#6b7280' }}>
        {hasFilters ? 'Try adjusting your search or filters.' : `No ${tabLabel.toLowerCase()} orders yet.`}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-5 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors"
          style={{ background: isLightTheme ? '#111827' : '#374151' }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

// ─── Tab Panel ─────────────────────────────────────────────────────────────────
function TabPanel({ orders, tabLabel, onSelect }) {
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [metalFilter, setMetalFilter] = useState('');
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(20);

  useEffect(() => { setPage(1); }, [search, typeFilter, metalFilter]);

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase().trim();
    const shopName = getShopName(o).toLowerCase();
    const matchSearch = !q || (
      o.customerId?.name?.toLowerCase().includes(q) ||
      o.customerId?.phoneNumber?.includes(q) ||
      shopName.includes(q) ||
      o.receiptNumber?.toLowerCase().includes(q) ||
      o._id?.toLowerCase().includes(q)
    );
    const matchType  = !typeFilter  || o.orderType === typeFilter;
    const matchMetal = !metalFilter || o.metalType === metalFilter;
    return matchSearch && matchType && matchMetal;
  }), [orders, search, typeFilter, metalFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = !!(search || typeFilter || metalFilter);
  const clearFilters = () => { setSearch(''); setTypeFilter(''); setMetalFilter(''); };

  return (
    <div>
      <FilterRow
        search={search} setSearch={setSearch}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
        metalFilter={metalFilter} setMetalFilter={setMetalFilter}
        hasFilters={hasFilters} onClear={clearFilters}
      />

      {paginated.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onClear={clearFilters} tabLabel={tabLabel} />
      ) : (
        <>
          <OrdersTable orders={paginated} onSelect={onSelect} />
          <MobileCards orders={paginated} onSelect={onSelect} />
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            totalItems={filtered.length}
            showing={paginated.length}
          />
        </>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AllOrders() {
  const [allOrders, setAllOrders]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab]   = useState('all');
  const { user } = useAuth();
  const { theme, isLightTheme } = useTheme();
  const { toasts, addToast, removeToast } = useToast();

  const fetchOrders = useCallback(async (isRefresh = false) => {
    setError('');
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await superAdminAPI.getAllOrders({});
      setAllOrders(res.data?.orders || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load orders';
      setError(msg);
      addToast(msg, 'error', 'Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const tabOrders = useMemo(() => {
    const map = {};
    TABS.forEach(tab => {
      map[tab.key] = tab.statuses === null
        ? allOrders
        : allOrders.filter(o => tab.statuses.includes(o.status));
    });
    return map;
  }, [allOrders]);

  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach(tab => { counts[tab.key] = tabOrders[tab.key].length; });
    return counts;
  }, [tabOrders]);

  const currentTab = TABS.find(t => t.key === activeTab);

  const totalRevenue = allOrders
    .filter(o => o.status === 'completed')
    .reduce((s, o) => s + (o.finalizedAmount || o.totalAmount || 0), 0);

  const pageBg = isLightTheme ? (theme.pageBg ?? '#f2f1ed') : (theme.bg ?? '#0c0c0c');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" style={{ background: pageBg }}>
        <Spinner size="lg" className="text-amber-500" />
        <p className="text-sm font-medium" style={{ color: isLightTheme ? '#9ca3af' : '#6b7280' }}>
          Loading system orders…
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 640px) {
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(100%); }
            to   { opacity: 1; transform: translateY(0); }
          }
        }
      `}</style>

      <div className="min-h-screen" style={{ background: pageBg }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pb-20">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 pt-2">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                  style={{ color: theme.textPrimary }}
                >
                  All System Orders
                </h1>
                <ScopeBadge />
              </div>
              <p className="text-sm mt-1" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>
                Every order across all shops ·{' '}
                <span className="font-semibold" style={{ color: isLightTheme ? '#4b5563' : '#d1d5db' }}>
                  {allOrders.length} total
                </span>
                {' '}· PKR {fmt(totalRevenue)} revenue
              </p>
            </div>
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold disabled:opacity-50 shadow-sm transition-colors"
              style={{
                background: isLightTheme ? '#ffffff' : '#1a1a1a',
                borderColor: theme.border,
                color: isLightTheme ? '#374151' : '#d1d5db',
              }}
            >
              {refreshing ? <Spinner className="text-amber-500" /> : <span>↻</span>}
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="flex items-center gap-3 p-4 rounded-2xl border text-sm font-medium mb-6"
              style={{
                background: isLightTheme ? '#fef2f2' : '#1a0f0f',
                borderColor: isLightTheme ? '#fecaca' : '#7f1d1d',
                color: isLightTheme ? '#991b1b' : '#fca5a5',
              }}
            >
              <span className="text-lg">⚠</span>
              <span className="flex-1">{error}</span>
              <button
                onClick={() => fetchOrders()}
                className="font-bold text-xs hover:underline"
                style={{ color: isLightTheme ? '#b91c1c' : '#fca5a5' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            {/* Desktop */}
            <div
              className="hidden sm:flex gap-2 p-1.5 rounded-2xl"
              style={{ background: isLightTheme ? '#f3f4f6' : '#1f1f1f' }}
            >
              {TABS.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
                    style={{
                      background: isActive ? (isLightTheme ? '#ffffff' : '#2a2a2a') : 'transparent',
                      color: isActive
                        ? (isLightTheme ? '#111827' : '#e5e7eb')
                        : (isLightTheme ? '#6b7280' : '#9ca3af'),
                      boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : undefined,
                    }}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span
                      className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-black"
                      style={isActive
                        ? { background: tab.accent, color: '#ffffff' }
                        : { background: isLightTheme ? '#e5e7eb' : '#374151', color: isLightTheme ? '#4b5563' : '#9ca3af' }
                      }
                    >
                      {tabCounts[tab.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile */}
            <div className="sm:hidden grid grid-cols-2 gap-2">
              {TABS.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all"
                    style={isActive
                      ? { background: tab.accent, borderColor: tab.accent, color: '#ffffff' }
                      : {
                          background: isLightTheme ? '#ffffff' : '#1a1a1a',
                          borderColor: isLightTheme ? '#e5e7eb' : '#374151',
                          color: isLightTheme ? '#4b5563' : '#9ca3af',
                        }
                    }
                  >
                    <span className="flex items-center gap-2">
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-black"
                      style={isActive
                        ? { background: 'rgba(255,255,255,0.25)', color: '#ffffff' }
                        : { background: isLightTheme ? '#f3f4f6' : '#2a2a2a', color: isLightTheme ? '#4b5563' : '#9ca3af' }
                      }
                    >
                      {tabCounts[tab.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          {currentTab && (
            <TabPanel
              key={activeTab}
              orders={tabOrders[activeTab]}
              tabLabel={currentTab.label}
              onSelect={setSelectedOrder}
            />
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          currentUserId={user?.id}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}