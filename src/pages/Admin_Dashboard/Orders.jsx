// pages/Admin_Dashboard/Orders.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as adminAPI from '../../services/adminApi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FaArrowDown } from 'react-icons/fa';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n != null ? Number(n).toLocaleString('en-PK') : '—');
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// ─── Constants (base only – theme overrides applied inline) ───────────────────
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
  { key: 'active',    label: 'Active',    statuses: ['pending', 'approved'],  icon: '⏳', accent: '#F59E0B' },
  { key: 'completed', label: 'Completed', statuses: ['completed'],            icon: '✅', accent: '#10B981' },
  { key: 'rejected',  label: 'Rejected',  statuses: ['rejected'],             icon: '✕',  accent: '#EF4444' },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'],            icon: '⊗',  accent: '#6B7280' },
];

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100];

// ─── Theme-aware helper functions ─────────────────────────────────────────────

/** Returns a style object for a Chip (Buy/Sell/Gold/Silver/Currency) */
function useChipStyle(type, variant, isLight) {
  const light = {
    buy:      { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
    sell:     { background: '#fff1f2', color: '#9f1239', border: '1px solid #fecdd3' },
    gold:     { background: '#fffbeb', color: '#78350f', border: '1px solid #fde68a' },
    silver:   { background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1' },
    currency: { background: '#eff6ff', color: '#1e3a8a', border: '1px solid #bfdbfe' },
  };
  const dark = {
    buy:      { background: 'rgba(5,150,105,0.15)', color: '#6ee7b7', border: '1px solid rgba(5,150,105,0.3)' },
    sell:     { background: 'rgba(190,18,60,0.15)',  color: '#fda4af', border: '1px solid rgba(190,18,60,0.3)' },
    gold:     { background: 'rgba(217,119,6,0.15)',  color: '#fcd34d', border: '1px solid rgba(217,119,6,0.3)' },
    silver:   { background: 'rgba(100,116,139,0.15)',color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' },
    currency: { background: 'rgba(29,78,216,0.15)',  color: '#93c5fd', border: '1px solid rgba(29,78,216,0.3)' },
  };
  const map = isLight ? light : dark;
  return map[type] || map.buy;
}

/** Returns a style object for a StatusBadge */
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
function ToastContainer({ toasts, removeToast }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl max-w-sm backdrop-blur-sm border
            ${t.type === 'error'   ? 'bg-red-900/95 border-red-700/50 text-white' :
              t.type === 'warning' ? 'bg-amber-900/95 border-amber-700/50 text-white' :
              'bg-gray-900/95 border-gray-700/50 text-white'}`}
          style={{ 
            animation: 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
            background: isLightTheme 
              ? (t.type === 'error' ? '#fef2f2' : t.type === 'warning' ? '#fffbeb' : theme.cardBg)
              : undefined,
            border: isLightTheme
              ? `1px solid ${t.type === 'error' ? '#fecaca' : t.type === 'warning' ? '#fde68a' : theme.border}`
              : undefined,
            color: isLightTheme ? theme.textPrimary : undefined,
          }}
        >
          <span className="text-lg mt-0.5 shrink-0">
            {t.type === 'error' ? '⚠️' : t.type === 'warning' ? '⚡' : '✓'}
          </span>
          <div className="flex-1 min-w-0">
            {t.title && <p className="font-bold text-sm" style={isLightTheme ? { color: theme.textPrimary } : {}}>{t.title}</p>}
            <p className={`text-sm ${t.title ? 'text-white/75 mt-0.5' : 'font-medium'}`} style={isLightTheme ? { color: theme.textMuted } : {}}>{t.msg}</p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="text-white/50 hover:text-white transition-colors text-lg leading-none shrink-0 mt-0.5"
            style={isLightTheme ? { color: theme.textMuted } : {}}
          >×</button>
        </div>
      ))}
    </div>
  );
}

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

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 'sm', className = '' }) {
  const s = size === 'lg' ? 'w-8 h-8' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <svg className={`animate-spin ${s} ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ─── Badges (theme‑aware) ─────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const { isLightTheme } = useTheme();
  const s = useStatusStyle(status, isLightTheme);
  const dot = STATUS[status]?.dot || '#F59E0B';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide whitespace-nowrap border"
      style={{ background: s.background, color: s.color, borderColor: s.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: dot }} />
      {STATUS[status]?.label || status}
    </span>
  );
}

function Chip({ children, type, variant }) {
  const { isLightTheme } = useTheme();
  const style = useChipStyle(type, variant, isLightTheme);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={style}
    >
      {children}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }) {
  const initials = name ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '?';
  const s = size === 'lg' ? 'w-14 h-14 text-base' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div className={`${s} rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: isLightTheme ? theme.textMuted : '#9CA3AF' }}>
      {children}
    </p>
  );
}

// ─── Overlay ─────────────────────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  const { theme } = useTheme();
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

// ─── Live Price Info Modal (unchanged) ───────────────────────────────────────
function LivePriceInfoModal({ onClose, onConfirm }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <Overlay onClose={onClose}>
      <div className="rounded-t-3xl sm:rounded-2xl w-full sm:w-[420px] shadow-2xl overflow-hidden" style={{ background: isLightTheme ? '#ffffff' : '#1a1a1a' }}>
        <div className="px-6 pt-6 pb-5 border-b" style={{ 
          background: isLightTheme ? 'linear-gradient(135deg, #fffbeb, #fff7ed)' : '#1f1a10',
          borderColor: isLightTheme ? '#fde68a' : '#3d2e0a'
        }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold shrink-0" style={!isLightTheme ? { background: '#3d2e0a', color: '#fbbf24' } : {}}>↻</div>
              <div>
                <h3 className="text-lg font-black" style={{ color: isLightTheme ? '#111827' : '#e5e7eb' }}>Fetch Current Price</h3>
                <p className="text-xs font-medium mt-0.5" style={{ color: isLightTheme ? '#92400E' : '#fbbf24' }}>Live market price with markup</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/70 hover:bg-white flex items-center justify-center text-gray-500 transition-colors text-sm shrink-0" style={!isLightTheme ? { background: '#2a2a2a', color: '#9ca3af' } : {}}>✕</button>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4" style={{ background: isLightTheme ? '#ffffff' : '#1a1a1a' }}>
          <div className="space-y-3">
            {[
              { icon: '📡', title: 'Live Market Rate', desc: 'Fetches the current gold/silver/currency rate from your live price feed at the moment you click.' },
              { icon: '⚡', title: 'Your Markup Applied', desc: 'Your configured price differences (markups) are automatically included — the amount shown is the final rate your shop charges.' },
              { icon: '✏️', title: 'Editable After Fill', desc: 'This pre-fills the Base Amount field. You can still manually adjust it, add extra charges, or apply a discount before confirming.' },
              { icon: '⚠️', title: 'Different from Order Price', desc: 'This may differ from the original order price if market rates have changed since the customer placed the order.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-lg mt-0.5 shrink-0">{icon}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: isLightTheme ? '#1f2937' : '#e5e7eb' }}>{title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: isLightTheme ? '#6b7280' : '#9ca3af' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-colors"
              style={{ 
                borderColor: isLightTheme ? '#e5e7eb' : '#374151', 
                color: isLightTheme ? '#4b5563' : '#d1d5db', 
                background: isLightTheme ? '#ffffff' : '#1f1f1f'
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 transition-colors"
            >
              Yes, Fetch Price
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

// ─── Status Change Modal (unchanged) ─────────────────────────────────────────
function StatusModal({ open, order, newStatus, loading, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [extraCharges, setExtraCharges] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');
  const [showPriceInfo, setShowPriceInfo] = useState(false);
  const { token } = useAuth();
  const { theme, isLightTheme } = useTheme();

  useEffect(() => {
    if (open && order) {
      setBaseAmount(order.totalAmount != null ? String(order.totalAmount) : '');
      setExtraCharges('');
      setDiscount('');
      setReason('');
      setPaymentReceived(true);
      setPriceError('');
      setShowPriceInfo(false);
    }
  }, [open, order]);

  if (!open) return null;

  const base  = parseFloat(baseAmount)   || 0;
  const extra = parseFloat(extraCharges) || 0;
  const disc  = parseFloat(discount)     || 0;
  const finalTotal = Math.round((base + extra - disc) * 100) / 100;

  const doFetchCurrentPrice = async () => {
    if (!token) return;
    setPriceLoading(true);
    setPriceError('');
    try {
      const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');
      const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const live = data.livePrices;
      let unitPrice = 0;
      if (order.metalType === 'gold') {
        unitPrice = order.carat === '24k' ? live.gold.myPrice_24k : live.gold.myPrice_2385k;
      } else if (order.metalType === 'silver') {
        unitPrice = order.orderType === 'sell' ? live.silver.myBuyPrice : live.silver.myPrice;
      } else if (order.metalType === 'currency') {
        unitPrice = order.orderType === 'sell'
          ? live.currencies[order.unit]?.buyRate || 0
          : live.currencies[order.unit]?.adjustedRate || 0;
      }
      if (unitPrice > 0) {
        const total = order.metalType === 'currency'
          ? (order.quantity || 0) * unitPrice
          : (order.quantityInTola || 0) * unitPrice;
        setBaseAmount(total.toFixed(2));
        setExtraCharges('');
        setDiscount('');
      } else {
        setPriceError('Could not determine unit price for this order.');
      }
    } catch {
      setPriceError('Could not fetch live price. Please try again.');
    } finally {
      setPriceLoading(false);
    }
  };

  const handleConfirm = () => {
    if ((newStatus === 'rejected' || newStatus === 'cancelled') && !reason.trim()) {
      alert('Please provide a reason.');
      return;
    }
    if (newStatus === 'completed') {
      if (base <= 0)        { alert('Please enter a valid base amount.'); return; }
      if (finalTotal <= 0)  { alert('Final total must be positive.'); return; }
      onConfirm({ completionBaseAmount: base, extraCharges: extra, discount: disc, finalizedAmount: finalTotal, paymentReceived });
      return;
    }
    if (newStatus === 'rejected' || newStatus === 'cancelled') {
      onConfirm(reason.trim());
      return;
    }
    onConfirm();
  };

  const configs = {
    approved:  { title: 'Approve Order',       icon: '✓', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700', btnClass: 'bg-emerald-600 hover:bg-emerald-700', btnLabel: 'Approve Order',  showReason: false, showAmount: false },
    rejected:  { title: 'Reject Order',         icon: '✕', iconBg: 'bg-red-100',     iconColor: 'text-red-700',     btnClass: 'bg-red-600 hover:bg-red-700',         btnLabel: 'Reject Order',   showReason: true,  showAmount: false },
    completed: { title: 'Complete Transaction', icon: '⬡', iconBg: 'bg-amber-100',   iconColor: 'text-amber-700',   btnClass: 'bg-amber-600 hover:bg-amber-700',     btnLabel: 'Mark Complete',  showReason: false, showAmount: true  },
    cancelled: { title: 'Cancel Order',         icon: '⊗', iconBg: 'bg-gray-100',    iconColor: 'text-gray-600',    btnClass: 'bg-gray-700 hover:bg-gray-800',       btnLabel: 'Cancel Order',   showReason: true,  showAmount: false },
  };
  const cfg = configs[newStatus] || configs.approved;

  const modalBg = isLightTheme ? '#ffffff' : '#1a1a1a';
  const headerBg = isLightTheme ? 'rgba(255,255,255,0.95)' : 'rgba(26,26,26,0.95)';
  const borderColor = isLightTheme ? '#f3f4f6' : '#2a2a2a';
  const inputBg = isLightTheme ? '#ffffff' : '#1f1f1f';
  const inputBorder = isLightTheme ? '#e5e7eb' : '#374151';
  const textPrimary = isLightTheme ? '#111827' : '#e5e7eb';
  const textMuted = isLightTheme ? '#6b7280' : '#9ca3af';
  const sectionBg = isLightTheme ? '#f9fafb' : '#1f1f1f';

  return (
    <>
      <Overlay onClose={onClose}>
        <div className="rounded-t-3xl sm:rounded-2xl w-full sm:w-[520px] max-h-[92vh] overflow-y-auto shadow-2xl" style={{ background: modalBg }}>
          {/* Header */}
          <div className="sticky top-0 z-10 px-4 sm:px-6 pt-5 pb-4 border-b" style={{ background: headerBg, backdropFilter: 'blur(8px)', borderColor: borderColor }}>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-11 h-11 rounded-2xl ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center text-lg font-bold shrink-0`} style={!isLightTheme ? { background: '#2a2a2a' } : {}}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold" style={{ color: textPrimary }}>{cfg.title}</h3>
                {order && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: textMuted }}>
                    <span className="font-mono font-bold" style={{ color: isLightTheme ? '#4b5563' : '#d1d5db' }}>#{order._id?.slice(-10)}</span>
                    {' · '}{order.customerId?.name || '—'}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0" style={{ background: isLightTheme ? '#f3f4f6' : '#2a2a2a', color: textMuted }}>✕</button>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-5 space-y-5" style={{ background: modalBg }}>
            {/* Reason */}
            {cfg.showReason && (
              <div>
                <SectionLabel>{newStatus === 'cancelled' ? 'Cancellation Reason' : 'Rejection Reason'}</SectionLabel>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={`Enter ${newStatus === 'cancelled' ? 'cancellation' : 'rejection'} reason…`}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none resize-none transition-all"
                  style={{ background: inputBg, borderColor: inputBorder, color: textPrimary }}
                />
              </div>
            )}

            {/* Completion Fields */}
            {cfg.showAmount && (
              <>
                {/* Fetch price button */}
                <button
                  onClick={() => setShowPriceInfo(true)}
                  disabled={priceLoading}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-amber-50 disabled:opacity-60 transition-colors"
                  style={!isLightTheme ? { background: '#1f1a10', color: '#fbbf24', borderColor: '#3d2e0a' } : {}}
                >
                  {priceLoading ? <Spinner className="text-amber-600" /> : <span>↻</span>}
                  {priceLoading ? 'Fetching live price…' : 'Auto-fill with Current Shop Price'}
                </button>
                {priceError && <p className="text-red-500 text-xs text-center -mt-2">{priceError}</p>}

                {/* Original Order Price Reference */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5" style={!isLightTheme ? { background: '#0f1729', borderColor: '#1e3a5f' } : {}}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-2" style={!isLightTheme ? { color: '#60a5fa' } : {}}>Original Order Price (at time of order)</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: isLightTheme ? '#1e40af' : '#93c5fd' }}>Order Amount</span>
                    <span className="text-xl font-black" style={{ color: isLightTheme ? '#1e3a8a' : '#bfdbfe' }}>PKR {fmt(order?.totalAmount)}</span>
                  </div>
                  {order?.finalPricePerTolaPKR && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs" style={{ color: isLightTheme ? '#2563eb' : '#60a5fa' }}>Unit price / Tola (at order)</span>
                      <span className="text-sm font-bold" style={{ color: isLightTheme ? '#1d4ed8' : '#93c5fd' }}>PKR {fmt(order.finalPricePerTolaPKR)}</span>
                    </div>
                  )}
                  {order?.dollarRatePKR && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs" style={{ color: isLightTheme ? '#2563eb' : '#60a5fa' }}>USD Rate (at order)</span>
                      <span className="text-sm font-bold" style={{ color: isLightTheme ? '#1d4ed8' : '#93c5fd' }}>PKR {fmt(order.dollarRatePKR)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <SectionLabel>Base Amount (PKR)</SectionLabel>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={baseAmount}
                    onChange={e => setBaseAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border text-sm font-mono focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
                    style={{ background: inputBg, borderColor: inputBorder, color: textPrimary }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Extra Charges', val: extraCharges, set: setExtraCharges, prefix: '+', color: 'text-emerald-600' },
                    { label: 'Discount',      val: discount,     set: setDiscount,     prefix: '−', color: 'text-red-500' },
                  ].map(({ label, val, set, prefix, color }) => (
                    <div key={label}>
                      <SectionLabel>{label}</SectionLabel>
                      <div className="relative">
                        <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${color}`}>{prefix}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={val}
                          onChange={e => set(e.target.value)}
                          placeholder="0"
                          className="w-full pl-8 pr-3 py-3 rounded-xl border text-sm font-mono focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
                          style={{ background: inputBg, borderColor: inputBorder, color: textPrimary }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Breakdown */}
                <div className="rounded-2xl p-4" style={{ background: isLightTheme ? 'linear-gradient(135deg, #fffbeb, #fff7ed)' : '#1f1a10', border: isLightTheme ? '1px solid #fde68a' : '1px solid #3d2e0a' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: isLightTheme ? '#92400E' : '#fbbf24' }}>Amount Breakdown</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: textMuted }}>Base Amount</span>
                      <span className="font-semibold" style={{ color: textPrimary }}>PKR {fmt(base)}</span>
                    </div>
                    <div className={`flex justify-between text-sm transition-opacity ${extra === 0 ? 'opacity-40' : ''}`}>
                      <span style={{ color: textMuted }}>+ Extra Charges</span>
                      <span className="font-semibold text-emerald-700" style={!isLightTheme ? { color: '#34d399' } : {}}>PKR {fmt(extra)}</span>
                    </div>
                    <div className={`flex justify-between text-sm transition-opacity ${disc === 0 ? 'opacity-40' : ''}`}>
                      <span style={{ color: textMuted }}>− Discount</span>
                      <span className="font-semibold text-red-600" style={!isLightTheme ? { color: '#f87171' } : {}}>PKR {fmt(disc)}</span>
                    </div>
                    <div className="pt-3 mt-1 flex justify-between items-center" style={{ borderTop: isLightTheme ? '1px solid #fde68a' : '1px solid #3d2e0a' }}>
                      <span className="text-sm font-bold" style={{ color: isLightTheme ? '#78350f' : '#fbbf24' }}>Final Total</span>
                      <span className="text-2xl font-black" style={{ color: isLightTheme ? '#92400e' : '#f59e0b' }}>PKR {fmt(finalTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment toggle */}
                <div>
                  <SectionLabel>Payment Status</SectionLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: true,  label: '✅ Payment Received', active: 'bg-emerald-600 border-emerald-600 text-white shadow-sm' },
                      { val: false, label: '⏳ Payment Pending',  active: 'bg-amber-500 border-amber-500 text-white shadow-sm' },
                    ].map(({ val, label, active }) => (
                      <button
                        key={String(val)}
                        onClick={() => setPaymentReceived(val)}
                        className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                          paymentReceived === val ? active : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                        }`}
                        style={paymentReceived !== val ? { 
                          borderColor: inputBorder, 
                          color: textMuted, 
                          background: inputBg 
                        } : {}}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Notification note */}
            <div className="flex items-start gap-3 rounded-xl p-3" style={{ background: isLightTheme ? '#eff6ff' : '#0f1729', border: isLightTheme ? '1px solid #bfdbfe' : '1px solid #1e3a5f' }}>
              <span className="text-base mt-0.5">📱</span>
              <p className="text-xs leading-relaxed" style={{ color: isLightTheme ? '#1d4ed8' : '#93c5fd' }}>
                Customer will be notified via in-app notification and a WhatsApp message will be opened.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-colors"
                style={{ 
                  borderColor: isLightTheme ? '#e5e7eb' : '#374151', 
                  color: isLightTheme ? '#4b5563' : '#d1d5db', 
                  background: isLightTheme ? '#ffffff' : '#1f1f1f'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${cfg.btnClass}`}
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2"><Spinner className="text-white" /> Processing…</span>
                  : cfg.btnLabel}
              </button>
            </div>
          </div>
        </div>
      </Overlay>

      {showPriceInfo && (
        <LivePriceInfoModal
          onClose={() => setShowPriceInfo(false)}
          onConfirm={() => { setShowPriceInfo(false); doFetchCurrentPrice(); }}
        />
      )}
    </>
  );
}

// ─── Order Detail Modal (theme‑aware, easy‑to‑read quantities) ───────────────────────────────────────
function OrderDetailModal({ order, processing, onClose, onStatusChange }) {
  const [showStatus, setShowStatus] = useState(false);
  const [selStatus, setSelStatus]   = useState(null);
  const { theme, isLightTheme } = useTheme();

  if (!order) return null;

  const customer = order.customerId;

  const triggerStatus = (s) => { setSelStatus(s); setShowStatus(true); };
  const handleStatusConfirm = async (data) => {
    await onStatusChange(order, selStatus, data);
    setShowStatus(false);
    setSelStatus(null);
  };

  const isCompleted  = order.status === 'completed' && order.finalizedAmount != null;
  const displayAmt   = isCompleted ? order.finalizedAmount : order.totalAmount;

  const modalBg = isLightTheme ? '#ffffff' : '#1a1a1a';
  const borderColor = isLightTheme ? '#f3f4f6' : '#2a2a2a';
  const textPrimary = isLightTheme ? '#111827' : '#e5e7eb';
  const textMuted = isLightTheme ? '#6b7280' : '#9ca3af';
  const sectionBg = isLightTheme ? '#f9fafb' : '#1f1f1f';

  return (
    <>
      <Overlay onClose={onClose}>
        <div className="rounded-t-3xl sm:rounded-2xl w-full sm:w-[580px] max-h-[92vh] overflow-hidden flex flex-col shadow-2xl" style={{ background: modalBg }}>
          {/* Header */}
          <div className="shrink-0 px-4 sm:px-6 pt-5 pb-4 border-b" style={{ borderColor: borderColor }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {order.orderType && (
                  <Chip type={order.orderType} variant="orderType">{ORDER_TYPE[order.orderType]?.label}</Chip>
                )}
                {order.metalType && (
                  <Chip type={order.metalType} variant="metal">
                    {METAL[order.metalType]?.icon} {METAL[order.metalType]?.label}
                    {order.carat && order.metalType !== 'currency' && (
                      <span className="opacity-60 ml-0.5">{order.carat}</span>
                    )}
                  </Chip>
                )}
                <StatusBadge status={order.status} />
              </div>
              <button onClick={onClose} className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-sm transition-colors" style={{ background: isLightTheme ? '#f3f4f6' : '#2a2a2a', color: textMuted }}>✕</button>
            </div>

            {/* Order ID */}
            <div className="mt-3 mb-2">
              <p className="text-xs font-medium mb-0.5" style={{ color: textMuted }}>Order ID</p>
              <p className="font-mono text-base font-black tracking-wider" style={{ color: isLightTheme ? '#374151' : '#d1d5db' }}>#{order._id?.slice(-14)}</p>
            </div>

            {/* Amount hero */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: textMuted }}>
                  {isCompleted ? 'Final Amount' : 'Order Amount'}
                </p>
                <p className={`text-3xl font-black mt-0.5 ${isCompleted ? 'text-emerald-700' : ''}`} style={{ color: isCompleted ? (isLightTheme ? '#047857' : '#34d399') : textPrimary }}>
                  PKR {fmt(displayAmt)}
                </p>
                {isCompleted && order.totalAmount !== order.finalizedAmount && (
                  <p className="text-sm font-semibold mt-0.5" style={{ color: textMuted }}>
                    Quoted: PKR {fmt(order.totalAmount)}
                  </p>
                )}
              </div>
              {order.receiptNumber && (
                <div className="text-right">
                  <p className="text-xs" style={{ color: textMuted }}>Receipt</p>
                  <p className="font-mono text-sm font-bold" style={{ color: isLightTheme ? '#374151' : '#d1d5db' }}>{order.receiptNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6" style={{ background: modalBg }}>
            {/* Customer */}
            <div>
              <SectionLabel>Customer</SectionLabel>
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: sectionBg }}>
                <Avatar name={customer?.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: textPrimary }}>{customer?.name || '—'}</p>
                  <p className="text-xs truncate" style={{ color: textMuted }}>{customer?.email || '—'}</p>
                  {customer?.phoneNumber && (
                    <p className="text-xs mt-0.5" style={{ color: textMuted }}>📞 {customer.phoneNumber}</p>
                  )}
                </div>
                {customer?.isTrusted && (
                  <Chip type="buy" variant="orderType">✓ Trusted</Chip>
                )}
              </div>
            </div>

            {/* Order Info */}
            <div>
              <SectionLabel>Order Details</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3.5" style={{ background: sectionBg }}>
                  <p className="text-xs font-medium" style={{ color: textMuted }}>Quantity</p>
                  {order.metalType !== 'currency' && order.quantityDisplay ? (
                    <>
                      <p className="text-base font-bold mt-1" style={{ color: textPrimary }}>
                        {order.quantityDisplay}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: textMuted }}>
                        {Number(order.quantityInTola).toFixed(3)} tola · {Number(order.quantityInGram).toFixed(2)} g
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-base font-bold mt-1" style={{ color: textPrimary }}>
                        {order.quantity} {order.unit}
                      </p>
                    </>
                  )}
                </div>
                <div className="rounded-xl p-3.5" style={{ background: sectionBg }}>
                  <p className="text-xs font-medium" style={{ color: textMuted }}>Unit Price / Tola</p>
                  <p className="text-base font-bold text-amber-700 mt-1" style={!isLightTheme ? { color: '#fbbf24' } : {}}>PKR {fmt(order.finalPricePerTolaPKR)}</p>
                  {order.adminDiffPKR !== undefined && (
                    <p className={`text-[10px] mt-0.5 ${order.adminDiffPKR > 0 ? 'text-emerald-600' : order.adminDiffPKR < 0 ? 'text-red-500' : ''}`} style={{ color: order.adminDiffPKR > 0 ? (isLightTheme ? '#059669' : '#34d399') : order.adminDiffPKR < 0 ? (isLightTheme ? '#ef4444' : '#f87171') : textMuted }}>
                      Markup: {order.adminDiffPKR > 0 ? '+' : ''}{fmt(order.adminDiffPKR)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Breakdown (non-currency) */}
            {order.metalType !== 'currency' && (
              <div>
                <SectionLabel>Pricing Breakdown (At Time of Order)</SectionLabel>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: isLightTheme ? '#f3f4f6' : '#2a2a2a' }}>
                  {[
                    { label: 'Market Price (USD/oz)', value: `$${fmt(order.marketPriceUSD)}` },
                    { label: 'USD Rate (PKR)',         value: `PKR ${fmt(order.dollarRatePKR)}` },
                    { label: 'Base / Tola',            value: `PKR ${fmt(order.basePricePerTolaPKR)}` },
                    { label: 'Markup Applied',         value: `${order.adminDiffPKR > 0 ? '+' : ''}${fmt(order.adminDiffPKR)}`, accent: order.adminDiffPKR > 0 ? 'text-emerald-700' : order.adminDiffPKR < 0 ? 'text-red-600' : '' },
                    { label: 'Final / Tola',           value: `PKR ${fmt(order.finalPricePerTolaPKR)}`, bold: true },
                    { label: 'Total Amount (Original)',value: `PKR ${fmt(order.totalAmount)}`, bold: true, highlight: true },
                  ].map(({ label, value, accent, bold, highlight }, i) => (
                    <div
                      key={label}
                      className={`flex justify-between items-center px-4 py-2.5 text-sm
                        ${highlight ? 'border-t-2' : (i % 2 === 0 ? '' : '')}
                        ${bold && !highlight ? 'font-bold border-t' : ''}`}
                      style={{ 
                        background: highlight 
                          ? (isLightTheme ? '#fffbeb' : '#1f1a10') 
                          : (i % 2 === 0 ? sectionBg : modalBg),
                        borderColor: highlight 
                          ? (isLightTheme ? '#fde68a' : '#3d2e0a') 
                          : borderColor,
                        color: highlight ? (isLightTheme ? '#92400e' : '#fbbf24') : undefined
                      }}
                    >
                      <span className={highlight ? 'font-bold' : ''} style={{ color: highlight ? (isLightTheme ? '#92400e' : '#fbbf24') : textMuted }}>{label}</span>
                      <span className={accent || (highlight ? 'font-black text-base' : bold ? 'text-amber-700' : '')} style={{ 
                        color: accent 
                          ? undefined 
                          : highlight 
                            ? (isLightTheme ? '#92400e' : '#f59e0b') 
                            : bold 
                              ? (isLightTheme ? '#b45309' : '#fbbf24') 
                              : textPrimary 
                      }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Currency order original pricing */}
            {order.metalType === 'currency' && (
              <div>
                <SectionLabel>Original Order Pricing</SectionLabel>
                <div className="rounded-xl p-4" style={{ background: isLightTheme ? '#eff6ff' : '#0f1729', border: isLightTheme ? '1px solid #bfdbfe' : '1px solid #1e3a5f' }}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: isLightTheme ? '#1d4ed8' : '#93c5fd' }}>Currency / Unit</span>
                    <span className="font-bold" style={{ color: isLightTheme ? '#1e3a8a' : '#bfdbfe' }}>{order.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: isLightTheme ? '#1d4ed8' : '#93c5fd' }}>Quantity</span>
                    <span className="font-bold" style={{ color: isLightTheme ? '#1e3a8a' : '#bfdbfe' }}>{fmt(order.quantity)} {order.unit}</span>
                  </div>
                  {order.finalPricePerTolaPKR && (
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: isLightTheme ? '#1d4ed8' : '#93c5fd' }}>Rate (at order)</span>
                      <span className="font-bold" style={{ color: isLightTheme ? '#1e3a8a' : '#bfdbfe' }}>PKR {fmt(order.finalPricePerTolaPKR)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 mt-2" style={{ borderTop: isLightTheme ? '1px solid #bfdbfe' : '1px solid #1e3a5f' }}>
                    <span className="font-bold" style={{ color: isLightTheme ? '#1e3a8a' : '#bfdbfe' }}>Total (Original)</span>
                    <span className="text-xl font-black" style={{ color: isLightTheme ? '#1e3a8a' : '#bfdbfe' }}>PKR {fmt(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Completion Summary */}
            {order.status === 'completed' && order.finalizedAmount != null && (
              <div>
                <SectionLabel>Completion Summary</SectionLabel>
                <div className="rounded-2xl p-4 space-y-2" style={{ background: isLightTheme ? '#ecfdf5' : '#0a1a14', border: isLightTheme ? '1px solid #a7f3d0' : '1px solid #064e3b' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: textMuted }}>Base Amount</span>
                    <span className="font-semibold" style={{ color: textPrimary }}>PKR {fmt(order.completionBaseAmount ?? order.totalAmount)}</span>
                  </div>
                  {order.extraCharges > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: textMuted }}>+ Extra Charges</span>
                      <span className="font-semibold" style={{ color: isLightTheme ? '#047857' : '#34d399' }}>PKR {fmt(order.extraCharges)}</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: textMuted }}>− Discount</span>
                      <span className="font-semibold" style={{ color: isLightTheme ? '#dc2626' : '#f87171' }}>PKR {fmt(order.discount)}</span>
                    </div>
                  )}
                  <div className="pt-3 flex justify-between" style={{ borderTop: isLightTheme ? '1px solid #a7f3d0' : '1px solid #064e3b' }}>
                    <span className="font-bold" style={{ color: isLightTheme ? '#065f46' : '#6ee7b7' }}>Final Amount</span>
                    <span className="text-xl font-black" style={{ color: isLightTheme ? '#065f46' : '#34d399' }}>PKR {fmt(order.finalizedAmount)}</span>
                  </div>
                  <p className="text-xs font-medium mt-1" style={{ color: textPrimary }}>
                    {order.paymentStatus === 'paid' ? '✅ Payment received' : '⏳ Payment pending'}
                  </p>
                </div>
              </div>
            )}

            {/* Rejection / Cancellation */}
            {(order.status === 'rejected' || order.status === 'cancelled') && order.rejectionReason && (
              <div>
                <SectionLabel>{order.status === 'rejected' ? 'Rejection Reason' : 'Cancellation Reason'}</SectionLabel>
                <div className="rounded-xl p-4 text-sm" style={{ 
                  background: order.status === 'rejected' 
                    ? (isLightTheme ? '#fef2f2' : '#1a0f0f') 
                    : (isLightTheme ? '#f9fafb' : '#1f1f1f'),
                  border: order.status === 'rejected'
                    ? (isLightTheme ? '1px solid #fecaca' : '1px solid #7f1d1d')
                    : (isLightTheme ? '1px solid #e5e7eb' : '1px solid #374151'),
                  color: order.status === 'rejected'
                    ? (isLightTheme ? '#991b1b' : '#fca5a5')
                    : (isLightTheme ? '#374151' : '#d1d5db')
                }}>
                  {order.rejectionReason}
                </div>
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <div>
                <SectionLabel>Customer Notes</SectionLabel>
                <div className="rounded-xl p-4 text-sm" style={{ background: isLightTheme ? '#eff6ff' : '#0f1729', border: isLightTheme ? '1px solid #bfdbfe' : '1px solid #1e3a5f', color: isLightTheme ? '#1e40af' : '#93c5fd' }}>{order.notes}</div>
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
                ].filter(Boolean).map(({ icon, label, time }, i) => (
                  <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center -ml-2 mt-0.5 shrink-0 text-[8px]" style={{ background: modalBg, borderColor: isLightTheme ? '#d1d5db' : '#4b5563' }}>
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

            {/* Actions */}
            {order.status === 'pending' && (
              <div className="grid grid-cols-2 gap-3 pt-2" style={{ borderTop: `1px solid ${borderColor}` }}>
                <button
                  onClick={() => triggerStatus('approved')}
                  disabled={processing}
                  className="py-3 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {processing ? <Spinner className="text-white" /> : '✓'} Approve
                </button>
                <button
                  onClick={() => triggerStatus('rejected')}
                  disabled={processing}
                  className="py-3 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  ✕ Reject
                </button>
              </div>
            )}
            {order.status === 'approved' && (
              <div className="space-y-2.5 pt-2" style={{ borderTop: `1px solid ${borderColor}` }}>
                <button
                  onClick={() => triggerStatus('completed')}
                  disabled={processing}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {processing ? <Spinner className="text-white" /> : '⬡'} Complete Transaction
                </button>
                <button
                  onClick={() => triggerStatus('cancelled')}
                  disabled={processing}
                  className="w-full py-3 rounded-xl font-bold text-sm border-2 transition-colors"
                  style={{ 
                    borderColor: isLightTheme ? '#e5e7eb' : '#374151', 
                    color: isLightTheme ? '#4b5563' : '#d1d5db',
                    background: 'transparent'
                  }}
                >
                  ⊗ Cancel Order
                </button>
              </div>
            )}
          </div>
        </div>
      </Overlay>

      <StatusModal
        open={showStatus}
        order={order}
        newStatus={selStatus}
        loading={processing}
        onClose={() => { setShowStatus(false); setSelStatus(null); }}
        onConfirm={handleStatusConfirm}
      />
    </>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ hasFilters, onClear, tabLabel }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <div className="text-center py-16 sm:py-20 rounded-2xl border" style={{ background: isLightTheme ? '#ffffff' : '#1a1a1a', borderColor: isLightTheme ? '#f3f4f6' : '#2a2a2a' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl" style={{ background: isLightTheme ? '#f3f4f6' : '#2a2a2a' }}>📦</div>
      <p className="text-lg font-bold" style={{ color: isLightTheme ? '#1f2937' : '#e5e7eb' }}>No {tabLabel} orders</p>
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

// ─── Pagination (always shows selector, scrollable page numbers if many) ─────
function Pagination({ page, totalPages, pageSize, onPageChange, onPageSizeChange, totalItems, showing }) {
  const { theme, isLightTheme } = useTheme();
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

  const inputBg = isLightTheme ? '#ffffff' : '#1f1f1f';
  const borderColor = isLightTheme ? '#e5e7eb' : '#374151';
  const textPrimary = isLightTheme ? '#374151' : '#d1d5db';
  const textMuted = isLightTheme ? '#6b7280' : '#9ca3af';

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
            borderColor: borderColor, 
            color: textPrimary,
            backgroundImage: selectArrow,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 6px center',
            paddingRight: '28px'
          }}
        >
          {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>per page · <span className="font-semibold" style={{ color: textPrimary }}>{showing}</span> of <span className="font-semibold" style={{ color: textPrimary }}>{totalItems}</span> orders</span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="w-8 h-8 rounded-lg border text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ 
              background: inputBg, 
              borderColor: borderColor, 
              color: isLightTheme ? '#4b5563' : '#9ca3af'
            }}
          >
            ‹
          </button>
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs" style={{ color: textMuted }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                  p === page
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                    : ''
                }`}
                style={p !== page ? { 
                  background: inputBg, 
                  borderColor: borderColor, 
                  border: '1px solid',
                  color: isLightTheme ? '#4b5563' : '#9ca3af'
                } : {}}
              >
                {p}
              </button>
            )
          )}
          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="w-8 h-8 rounded-lg border text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ 
              background: inputBg, 
              borderColor: borderColor, 
              color: isLightTheme ? '#4b5563' : '#9ca3af'
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Filter Row (theme‑aware, with arrow on selects) ────────────────────────
function FilterRow({ search, setSearch, typeFilter, setTypeFilter, metalFilter, setMetalFilter, onClear, hasFilters }) {
  const searchRef = useRef(null);
  const { theme, isLightTheme } = useTheme();
  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
  };

  const inputBg = isLightTheme ? '#ffffff' : '#1f1f1f';
  const borderColor = isLightTheme ? '#e5e7eb' : '#374151';
  const textColor = isLightTheme ? '#374151' : '#d1d5db';

  return (
    <div className="flex flex-wrap gap-2 items-center mb-5">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: isLightTheme ? '#9ca3af' : '#6b7280' }}>⌕</span>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Name, phone, receipt…"
          className="w-full pl-9 pr-8 py-2.5 rounded-xl border text-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
          style={{ background: inputBg, borderColor: borderColor, color: textColor }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg leading-none" style={{ color: isLightTheme ? '#9ca3af' : '#6b7280' }}>×</button>
        )}
      </div>

      {/* Type */}
      <select
        value={typeFilter}
        onChange={e => setTypeFilter(e.target.value)}
        className="py-2.5 px-3 pr-8 rounded-xl border text-sm font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all appearance-none cursor-pointer"
        style={{ ...selectStyle, background: inputBg, borderColor: borderColor, color: textColor }}
      >
        <option value="">All Types</option>
        <option value="buy">↑ Buy</option>
        <option value="sell">↓ Sell</option>
      </select>

      {/* Metal */}
      <select
        value={metalFilter}
        onChange={e => setMetalFilter(e.target.value)}
        className="py-2.5 px-3 pr-8 rounded-xl border text-sm font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all appearance-none cursor-pointer"
        style={{ ...selectStyle, background: inputBg, borderColor: borderColor, color: textColor }}
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
          style={{ 
            background: inputBg, 
            borderColor: borderColor, 
            color: isLightTheme ? '#6b7280' : '#9ca3af'
          }}
        >
          × Clear
        </button>
      )}
    </div>
  );
}

// ─── Orders Table (always visible, scrollable, easy quantity) ──────────────
function OrdersTable({ orders, onSelect, showOriginalPrice = true }) {
  const { theme, isLightTheme } = useTheme();
  const tableBg = isLightTheme ? '#ffffff' : '#1a1a1a';
  const borderColor = isLightTheme ? '#f3f4f6' : '#2a2a2a';
  const textPrimary = isLightTheme ? '#111827' : '#e5e7eb';
  const textMuted = isLightTheme ? '#6b7280' : '#9ca3af';
  const headerBg = isLightTheme ? '#f9fafb' : '#1f1f1f';
  const hoverBg = isLightTheme ? 'rgba(249,250,251,0.8)' : 'rgba(31,31,31,0.8)';

  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ background: tableBg, borderColor: borderColor }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead>
            <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
              {['Order / ID', 'Customer', 'Quantity', 'Original Amount', 'Final Amount', 'Status', 'Date', ''].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: isLightTheme ? '#9ca3af' : '#6b7280', background: headerBg }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: isLightTheme ? '#f9fafb' : '#1f1f1f' }}>
            {orders.map(order => {
              const isCompleted = order.status === 'completed' && order.finalizedAmount != null;
              const displayAmt  = isCompleted ? order.finalizedAmount : order.totalAmount;
              return (
                <tr
                  key={order._id}
                  onClick={() => onSelect(order)}
                  className="cursor-pointer transition-colors"
                  onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Order Type + ID */}
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {order.orderType && (
                        <Chip type={order.orderType} variant="orderType">{ORDER_TYPE[order.orderType]?.label}</Chip>
                      )}
                      {order.metalType && (
                        <Chip type={order.metalType} variant="metal">
                          {METAL[order.metalType]?.icon} {METAL[order.metalType]?.label}
                          {order.carat && order.metalType !== 'currency' && (
                            <span className="opacity-60 ml-0.5">{order.carat}</span>
                          )}
                        </Chip>
                      )}
                    </div>
                    {order._id && (
                      <p className="text-[12px] font-mono font-bold tracking-wide" style={{ color: isLightTheme ? '#6b7280' : '#9ca3af' }}>
                        #{order._id.slice(-12)}
                      </p>
                    )}
                    {order.receiptNumber && (
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: isLightTheme ? '#4b5563' : '#9ca3af' }}>
                        Rcpt: {order.receiptNumber.slice(-8)}
                      </p>
                    )}
                  </td>
                  {/* Customer */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={order.customerId?.name} size="sm" />
                      <div>
                        <p className="font-bold whitespace-nowrap" style={{ color: textPrimary }}>{order.customerId?.name || '—'}</p>
                        <p className="text-xs" style={{ color: textMuted }}>{order.customerId?.phoneNumber || '—'}</p>
                      </div>
                    </div>
                  </td>
                  {/* Quantity */}
                  <td className="px-4 py-4">
                    {order.metalType !== 'currency' && order.quantityDisplay ? (
                      <>
                        <p className="font-semibold" style={{ color: isLightTheme ? '#1f2937' : '#e5e7eb' }}>
                          {order.quantityDisplay}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                          {Number(order.quantityInTola).toFixed(3)} tola · {Number(order.quantityInGram).toFixed(2)} g
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold" style={{ color: isLightTheme ? '#1f2937' : '#e5e7eb' }}>
                          {order.quantity} {order.unit}
                        </p>
                      </>
                    )}
                  </td>
                  {/* Original Amount */}
                  <td className="px-4 py-4">
                    <p className="font-bold text-base" style={{ color: isLightTheme ? '#374151' : '#d1d5db' }}>PKR {fmt(order.totalAmount)}</p>
                    {order.finalPricePerTolaPKR && order.metalType !== 'currency' && (
                      <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>
                        {fmt(order.finalPricePerTolaPKR)}/tola
                      </p>
                    )}
                  </td>
                  {/* Final Amount */}
                  <td className="px-4 py-4">
                    {isCompleted ? (
                      <>
                        <p className="font-black text-base" style={{ color: isLightTheme ? '#047857' : '#34d399' }}>PKR {fmt(displayAmt)}</p>
                        {order.totalAmount !== order.finalizedAmount && (
                          <p className="text-[10px]" style={{ color: textMuted }}>orig. {fmt(order.totalAmount)}</p>
                        )}
                        {(order.extraCharges > 0 || order.discount > 0) && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {order.extraCharges > 0 && <Chip type="buy" variant="orderType">+{fmt(order.extraCharges)}</Chip>}
                            {order.discount > 0      && <Chip type="sell" variant="orderType">-{fmt(order.discount)}</Chip>}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-xs italic" style={{ color: textMuted }}>—</span>
                    )}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-4">
                    <StatusBadge status={order.status} />
                    {order.status === 'completed' && (
                      <p className="text-[10px] mt-1.5" style={{ color: textMuted }}>
                        {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                      </p>
                    )}
                  </td>
                  {/* Date */}
                  <td className="px-4 py-4 text-xs whitespace-nowrap" style={{ color: textMuted }}>{fmtDate(order.createdAt)}</td>
                  {/* View */}
                  <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onSelect(order)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors"
                      style={{ 
                        borderColor: isLightTheme ? '#e5e7eb' : '#374151', 
                        color: isLightTheme ? '#4b5563' : '#9ca3af',
                        background: 'transparent'
                      }}
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

// ─── Tab Panel ─────────────────────────────────────────────────
function TabPanel({ orders, tabLabel, onSelect, onStatusChange, processing }) {
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [metalFilter, setMetalFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [pageSize, setPageSize]     = useState(20);

  useEffect(() => { setPage(1); }, [search, typeFilter, metalFilter]);

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase().trim();
    const matchSearch = !q || (
      o.customerId?.name?.toLowerCase().includes(q) ||
      o.customerId?.phoneNumber?.includes(q) ||
      o.receiptNumber?.toLowerCase().includes(q) ||
      o._id?.toLowerCase().includes(q)
    );
    const matchType  = !typeFilter  || o.orderType  === typeFilter;
    const matchMetal = !metalFilter || o.metalType  === metalFilter;
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [processing, setProcessing]   = useState(false);
  const [activeTab, setActiveTab]     = useState('active');
  const { toasts, addToast, removeToast } = useToast();
  const { theme, isLightTheme } = useTheme();

  const fetchOrders = useCallback(async (isRefresh = false) => {
    setError('');
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await adminAPI.getOrders({});
      setOrders(res.data?.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (order, newStatus, data = null) => {
    setProcessing(true);
    try {
      let response;
      if (newStatus === 'approved') {
        response = await adminAPI.approveOrder(order._id);
      } else if (newStatus === 'rejected') {
        response = await adminAPI.rejectOrder(order._id, { reason: data });
      } else if (newStatus === 'completed') {
        response = await adminAPI.completeOrder(order._id, {
          paymentReceived: data.paymentReceived,
          finalizedAmount: data.finalizedAmount,
          extraCharges: data.extraCharges,
          discount: data.discount,
          completionBaseAmount: data.completionBaseAmount,
        });
      } else if (newStatus === 'cancelled') {
        response = await adminAPI.rejectOrder(order._id, { reason: data });
      }
      addToast(
        `Order #${order._id.slice(-6)} marked as ${newStatus}`,
        newStatus === 'rejected' || newStatus === 'cancelled' ? 'warning' : 'success',
        'Status Updated'
      );
      await fetchOrders(true);
      setSelectedOrder(null);
      if (response?.data?.whatsappLink) window.open(response.data.whatsappLink, '_blank');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update order status', 'error', 'Update Failed');
    } finally {
      setProcessing(false);
    }
  };

  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach(t => {
      counts[t.key] = orders.filter(o => t.statuses.includes(o.status)).length;
    });
    return counts;
  }, [orders]);

  const tabOrders = useMemo(() => {
    const map = {};
    TABS.forEach(t => {
      map[t.key] = orders.filter(o => t.statuses.includes(o.status));
    });
    return map;
  }, [orders]);

  const currentTab = TABS.find(t => t.key === activeTab);

  const pageBg = isLightTheme ? (theme.pageBg ?? '#f2f1ed') : (theme.bg ?? '#0c0c0c');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" style={{ background: pageBg }}>
        <Spinner size="lg" className="text-amber-500" />
        <p className="text-sm font-medium" style={{ color: isLightTheme ? '#9ca3af' : '#6b7280' }}>Loading your orders…</p>
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
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: theme.textPrimary }}>My Orders</h1>
              <p className="text-sm mt-1" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>
                Orders placed through your shop ·{' '}
                <span className="font-semibold" style={{ color: isLightTheme ? '#4b5563' : '#d1d5db' }}>{orders.length} total</span>
              </p>
            </div>
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold disabled:opacity-50 shadow-sm transition-colors"
              style={{ 
                background: isLightTheme ? '#ffffff' : '#1a1a1a', 
                borderColor: theme.border, 
                color: isLightTheme ? '#374151' : '#d1d5db'
              }}
            >
              {refreshing ? <Spinner className="text-amber-500" /> : <span>↻</span>}
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl border text-sm font-medium mb-6" style={{ background: isLightTheme ? '#fef2f2' : '#1a0f0f', borderColor: isLightTheme ? '#fecaca' : '#7f1d1d', color: isLightTheme ? '#991b1b' : '#fca5a5' }}>
              <span className="text-lg">⚠</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => fetchOrders()} className="font-bold text-xs hover:underline" style={{ color: isLightTheme ? '#b91c1c' : '#fca5a5' }}>Retry</button>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            {/* Desktop tabs */}
            <div className="hidden sm:flex gap-2 p-1.5 rounded-2xl" style={{ background: isLightTheme ? '#f3f4f6' : '#1f1f1f' }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isActive ? 'shadow-sm' : ''
                    }`}
                    style={{ 
                      background: isActive ? (isLightTheme ? '#ffffff' : '#2a2a2a') : 'transparent',
                      color: isActive ? (isLightTheme ? '#111827' : '#e5e7eb') : (isLightTheme ? '#6b7280' : '#9ca3af')
                    }}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span
                      className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black transition-colors ${
                        isActive ? 'text-white' : ''
                      }`}
                      style={isActive ? { background: tab.accent } : { background: isLightTheme ? '#e5e7eb' : '#374151', color: isLightTheme ? '#4b5563' : '#9ca3af' }}
                    >
                      {tabCounts[tab.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile tabs */}
            <div className="sm:hidden grid grid-cols-2 gap-2">
              {TABS.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                      isActive ? 'border-transparent shadow-sm text-white' : ''
                    }`}
                    style={isActive 
                      ? { background: tab.accent, borderColor: tab.accent } 
                      : { background: isLightTheme ? '#ffffff' : '#1a1a1a', borderColor: isLightTheme ? '#e5e7eb' : '#374151', color: isLightTheme ? '#4b5563' : '#9ca3af' }
                    }
                  >
                    <span className="flex items-center gap-2">
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                        isActive ? 'bg-white/25 text-white' : ''
                      }`}
                      style={!isActive ? { background: isLightTheme ? '#f3f4f6' : '#2a2a2a', color: isLightTheme ? '#4b5563' : '#9ca3af' } : {}}
                    >
                      {tabCounts[tab.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active tab content */}
          {currentTab && (
            <TabPanel
              key={activeTab}
              orders={tabOrders[activeTab] || []}
              tabLabel={currentTab.label}
              onSelect={setSelectedOrder}
              onStatusChange={handleStatusChange}
              processing={processing}
            />
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          processing={processing}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}