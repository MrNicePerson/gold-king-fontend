// frontend/src/pages/Super_Admin_Dashboard/MyCustomers.jsx
// Tailwind + Theme-aware · Fully responsive · Pagination · WhatsApp notifications included

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as saAPI from '../../services/superAdminApi';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n, digits = 0) =>
  n != null && !isNaN(Number(n))
    ? Number(n).toLocaleString('en-PK', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : '—';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const initials = (name) =>
  name ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '?';

const generateShopCustomerNumber = (customerId, shopId, index) => {
  const shopSuffix = shopId ? String(shopId).slice(-4).toUpperCase() : '0000';
  const seq = String(index + 1).padStart(4, '0');
  return `SC-${shopSuffix}-${seq}`;
};

const AVATAR_PALETTE = [
  ['#C9B037', '#8B7520'], ['#1a7a5c', '#0f4d39'],
  ['#2563EB', '#1e40af'], ['#DC2626', '#991b1b'],
  ['#7C3AED', '#5b21b6'], ['#D97706', '#92400e'],
  ['#0891B2', '#0e7490'], ['#BE185D', '#9d174d'],
];
const avatarGrad = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

// ─── Theme tokens ──────────────────────────────────────────────────────────────
function useThemeTokens() {
  const { theme, isLightTheme } = useTheme();
  const t = {
    page:    isLightTheme ? (theme.pageBg ?? '#f2f1ed') : (theme.bg ?? '#0c0c0c'),
    card:    isLightTheme ? '#ffffff' : '#1a1a1a',
    section: isLightTheme ? '#fafaf7' : '#1f1f1f',
    border:  isLightTheme ? '#e8e4dc' : '#2a2a2a',
    text:    isLightTheme ? '#0f0e0c' : '#e5e7eb',
    text2:   isLightTheme ? '#3d3a34' : '#d1d5db',
    muted:   isLightTheme ? '#7a7670' : '#9ca3af',
    input:   isLightTheme ? '#ffffff' : '#1f1f1f',
    hover:   isLightTheme ? 'rgba(250,250,247,0.8)' : 'rgba(255,255,255,0.04)',
    accent:  '#c9a227',
    accentDark: '#8b6914',
    selectArrow: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239CA3AF' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  };
  return { theme, isLightTheme, t };
}

// ─── SVG Icon ──────────────────────────────────────────────────────────────────
const I = ({ p, className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={p} />
  </svg>
);

const IC = {
  refresh:   'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  search:    'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  close:     'M6 18L18 6M6 6l12 12',
  alert:     'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  phone:     'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  mail:      'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  location:  'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  flag:      'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
  shield:    'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  eye:       'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  check:     'M5 13l4 4L19 7',
  calendar:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  shop:      'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  trash:     'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  history:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  xCircle:   'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  checkCirc: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  user:      'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  hash:      'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
};

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40, radius = 12 }) {
  const [from, to] = avatarGrad(name);
  return (
    <div
      className="flex items-center justify-center font-extrabold text-white tracking-wide"
      style={{
        width: size, height: size, borderRadius: radius, flexShrink: 0,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        fontSize: size < 36 ? 11 : 15,
      }}
    >
      {initials(name)}
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[60] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold sm:max-w-sm animate-[fadeUp_.2s_ease] ${type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-700 text-white'}`}>
      <I p={type === 'error' ? IC.xCircle : IC.checkCirc} className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="opacity-70 text-lg leading-none bg-transparent border-none text-white cursor-pointer">×</button>
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function useCustomerStatusStyle(customer, isLight) {
  if (customer.isFlagged) return isLight
    ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
    : { bg: 'rgba(220,38,38,0.15)', color: '#fca5a5', border: 'rgba(220,38,38,0.3)' };
  if (customer.isTrusted) return isLight
    ? { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
    : { bg: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: 'rgba(59,130,246,0.3)' };
  return isLight
    ? { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' }
    : { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' };
}

function StatusBadge({ customer }) {
  const { isLightTheme } = useTheme();
  const s = useCustomerStatusStyle(customer, isLightTheme);
  const style = { background: s.bg, color: s.color, borderColor: s.border };
  if (customer.isFlagged)
    return <span style={style} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"><I p={IC.flag} className="w-2.5 h-2.5" />Flagged</span>;
  if (customer.isTrusted)
    return <span style={style} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"><I p={IC.shield} className="w-2.5 h-2.5" />Trusted</span>;
  return <span style={style} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"><I p={IC.checkCirc} className="w-2.5 h-2.5" />Approved</span>;
}

// ─── Order Status Badge ────────────────────────────────────────────────────────
function useOrderStatusStyle(status, isLight) {
  const light = {
    pending:   { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
    approved:  { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
    completed: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
    rejected:  { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  };
  const dark = {
    pending:   { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    approved:  { bg: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: 'rgba(59,130,246,0.3)' },
    completed: { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
    rejected:  { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'rgba(239,68,68,0.3)' },
  };
  const map = isLight ? light : dark;
  return map[status] || map.pending;
}

function OrderStatusBadge({ status }) {
  const { isLightTheme } = useTheme();
  const s = useOrderStatusStyle(status, isLightTheme);
  const map = {
    pending:   ['M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', 'Pending'],
    approved:  [IC.checkCirc, 'Approved'],
    completed: [IC.check,     'Completed'],
    rejected:  [IC.xCircle,   'Rejected'],
  };
  const [icon, label] = map[status] || [IC.history, status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      <I p={icon} className="w-2.5 h-2.5" />{label}
    </span>
  );
}

// ─── Confirm Action Modal ──────────────────────────────────────────────────────
const ACTION_CONFIG = {
  trust: {
    icon: IC.shield,
    light: { color: '#185FA5', bg: '#E6F1FB' }, dark: { color: '#93c5fd', bg: 'rgba(24,95,165,0.15)' },
    label: 'Mark as trusted',
    note: 'Orders from this customer will be auto-approved. You can remove this status anytime.',
    confirmLabel: 'Mark as Trusted',
  },
  untrust: {
    icon: IC.close,
    light: { color: '#5F5E5A', bg: '#F1EFE8' }, dark: { color: '#d1d5db', bg: 'rgba(255,255,255,0.06)' },
    label: 'Remove trusted status',
    note: "This customer's orders will require manual approval again.",
    confirmLabel: 'Remove Status',
  },
  flag: {
    icon: IC.flag,
    light: { color: '#A32D2D', bg: '#FCEBEB' }, dark: { color: '#fca5a5', bg: 'rgba(163,45,45,0.15)' },
    label: 'Flag as scam',
    note: 'This customer will be blocked from placing any orders at your shop.',
    confirmLabel: 'Flag Customer',
  },
  unflag: {
    icon: IC.checkCirc,
    light: { color: '#3B6D11', bg: '#EAF3DE' }, dark: { color: '#86efac', bg: 'rgba(59,109,17,0.15)' },
    label: 'Remove flag',
    note: 'This customer will be able to place orders again.',
    confirmLabel: 'Remove Flag',
  },
  approve: {
    icon: IC.check,
    light: { color: '#3B6D11', bg: '#EAF3DE' }, dark: { color: '#86efac', bg: 'rgba(59,109,17,0.15)' },
    label: 'Approve registration',
    note: 'This customer will be able to place orders at your shop.',
    confirmLabel: 'Approve',
  },
  reject: {
    icon: IC.close,
    light: { color: '#A32D2D', bg: '#FCEBEB' }, dark: { color: '#fca5a5', bg: 'rgba(163,45,45,0.15)' },
    label: 'Reject registration',
    note: 'This customer will not be able to place orders at your shop.',
    confirmLabel: 'Reject',
  },
};

function ConfirmModal({ open, onClose, onConfirm, actionType, customer, loading }) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const { isLightTheme, t } = useThemeTokens();

  useEffect(() => { if (!open) { setReason(''); setErr(''); } }, [open]);

  if (!open || !customer) return null;

  const cfg = ACTION_CONFIG[actionType] || ACTION_CONFIG.trust;
  const c = isLightTheme ? cfg.light : cfg.dark;
  const needsReason = actionType === 'flag' || actionType === 'reject';
  const flagPresets = ['Suspicious activity', 'Payment issues', 'Fake identity', 'Scam attempt', 'Order fraud'];

  const handleConfirm = () => {
    if (actionType === 'flag' && !reason.trim()) { setErr('Please provide a reason'); return; }
    onConfirm(reason.trim());
  };

  const name  = customer.name || '—';
  const phone = customer.whatsappNumber || customer.phoneNumber || '';

  return (
    <div className="fixed inset-0 z-[50] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative rounded-t-[20px] sm:rounded-[20px] shadow-2xl w-full sm:max-w-[400px] p-5 sm:p-6 animate-[fadeUp_.15s_ease]" style={{ background: t.card }}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}>
            <I p={cfg.icon} className="w-5 h-5" style={{ color: c.color }} />
          </div>
          <div>
            <p className="text-[15px] font-bold capitalize" style={{ color: t.text }}>{cfg.label}</p>
            <p className="text-xs" style={{ color: t.muted }}>Review before confirming</p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-full flex items-center justify-center transition-all border-none bg-transparent cursor-pointer" style={{ color: t.muted }}>
            <I p={IC.close} className="w-4 h-4" />
          </button>
        </div>

        {/* Customer pill */}
        <div className="rounded-[12px] px-4 py-3 mb-4 flex items-center gap-3 border" style={{ background: t.section, borderColor: t.border }}>
          <Avatar name={name} size={36} radius={18} />
          <div>
            <p className="text-sm font-bold" style={{ color: t.text }}>{name}</p>
            {phone && <p className="text-[11px]" style={{ color: t.muted }}>{phone}</p>}
          </div>
        </div>

        {/* Info note */}
        <div
          className="rounded-r-[10px] px-4 py-3 mb-4"
          style={{ background: c.bg, borderLeft: `3px solid ${c.color}` }}
        >
          <p className="text-[13px] leading-relaxed" style={{ color: c.color }}>{cfg.note}</p>
        </div>

        {/* Reason input for flag / reject */}
        {needsReason && (
          <div className="mb-4">
            {actionType === 'flag' && (
              <div className="flex gap-1.5 flex-wrap mb-2">
                {flagPresets.map(p => (
                  <button
                    key={p}
                    onClick={() => { setReason(p); setErr(''); }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer border transition-all"
                    style={{
                      background: reason === p ? c.color : t.section,
                      color: reason === p ? 'white' : t.muted,
                      borderColor: reason === p ? c.color : t.border,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={reason}
              onChange={e => { setReason(e.target.value); setErr(''); }}
              placeholder={actionType === 'flag' ? 'Or write a custom reason…' : 'Reason for rejection (optional)…'}
              rows={2}
              className="w-full px-3.5 py-2.5 resize-none border rounded-[10px] text-sm outline-none focus:border-[#c9a227] transition-colors"
              style={{ background: t.input, borderColor: t.border, color: t.text }}
            />
            {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[10px] text-sm font-semibold cursor-pointer border transition-all"
            style={{ borderColor: t.border, color: t.text2, background: 'transparent' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-[10px] text-sm font-semibold cursor-pointer text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: isLightTheme ? c.color : c.color, filter: !isLightTheme ? 'brightness(0.9)' : 'none', backgroundColor: isLightTheme ? c.color : '#374151', border: !isLightTheme ? `1px solid ${c.color}` : 'none' }}
          >
            {loading ? 'Processing…' : cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WhatsApp Toast ────────────────────────────────────────────────────────────
const WA_MESSAGES = {
  approve: (n, s) => `🎉 *${s} — Registration Approved*\n\nDear ${n},\n\nYour registration has been approved! ✅\n\nYou can now view live gold & silver prices and place buy/sell orders.\n\nThank you for choosing us!`,
  reject:  (n, s) => `📋 *${s} — Registration Update*\n\nDear ${n},\n\nUnfortunately, your registration has been declined. ❌\n\nPlease contact the shop for more details.`,
  trust:   (n, s) => `⭐ *${s} — Trusted Customer*\n\nDear ${n},\n\nYou have been marked as a Trusted Customer! 🛡️\n\nYour orders will now be auto-approved. Thank you for your continued trust. 🙏`,
  untrust: (n, s) => `📋 *${s} — Account Update*\n\nDear ${n},\n\nYour Trusted Customer status has been removed.\n\nYour orders will now require manual approval. Contact us for any questions.`,
  flag:    (n, s) => `🚫 *${s} — Account Restricted*\n\nDear ${n},\n\nYour account has been flagged and you cannot place new orders at this time.\n\nIf you believe this is a mistake, please contact us directly.`,
  unflag:  (n, s) => `✅ *${s} — Account Restored*\n\nDear ${n},\n\nYour account restriction has been removed. You can now place orders again. Thank you for your cooperation! 🙏`,
};

const WA_TOAST_TEXT = {
  approve: { title: 'Registration approved',    sub: 'Customer can now place orders' },
  reject:  { title: 'Registration rejected',    sub: 'Customer has been declined' },
  trust:   { title: 'Customer marked trusted',  sub: 'Orders will be auto-approved' },
  untrust: { title: 'Trusted status removed',   sub: 'Orders need manual approval' },
  flag:    { title: 'Customer flagged',         sub: 'They cannot place orders' },
  unflag:  { title: 'Flag removed',             sub: 'They can place orders again' },
};

function WhatsAppToast({ show, customerName, customerPhone, actionType, shopName, onClose }) {
  const { t } = useThemeTokens();
  useEffect(() => {
    if (!show) return;
    const tm = setTimeout(onClose, 7000);
    return () => clearTimeout(tm);
  }, [show, onClose]);

  if (!show) return null;

  const isSuccess = ['approve', 'trust', 'unflag'].includes(actionType);
  const iconPath  = isSuccess ? IC.checkCirc : IC.xCircle;
  const iconColor = isSuccess ? '#3B6D11' : '#A32D2D';
  const iconBg    = isSuccess ? '#EAF3DE'  : '#FCEBEB';

  const phone = customerPhone?.replace(/\D/g, '');
  const msgFn = WA_MESSAGES[actionType] || WA_MESSAGES.approve;
  const link  = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(msgFn(customerName, shopName || 'Your Shop'))}`
    : null;

  const { title, sub } = WA_TOAST_TEXT[actionType] || { title: 'Action completed', sub: '' };

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[60] animate-[fadeUp_.2s_ease] sm:max-w-[420px]">
      <div className="border rounded-2xl shadow-2xl flex items-center gap-3 px-4 py-3.5" style={{ background: t.card, borderColor: t.border }}>
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <I p={iconPath} className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: t.text }}>{title}</p>
          <p className="text-[11px]" style={{ color: t.muted }}>{sub}</p>
        </div>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-bold text-white transition-all flex-shrink-0 no-underline"
            style={{ background: '#25D366' }}
            onClick={onClose}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.447-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.614-.916-2.21-.242-.58-.487-.5-.669-.51-.173-.01-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.476 0 1.46 1.062 2.87 1.21 3.07.148.199 2.09 3.19 5.06 4.47.707.305 1.258.487 1.688.624.708.223 1.352.191 1.862.116.568-.083 1.752-.717 2.00-1.41.248-.693.248-1.287.173-1.41-.074-.124-.272-.198-.57-.347z" />
            </svg>
            Notify
          </a>
        )}
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer flex-shrink-0"
          style={{ color: t.muted }}
        >
          <I p={IC.close} className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ open, onClose, onConfirm, customer, loading }) {
  const { t } = useThemeTokens();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[50] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative rounded-t-[20px] sm:rounded-[20px] shadow-2xl w-full sm:max-w-[420px] p-7 text-center animate-[fadeUp_.2s_ease]" style={{ background: t.card }}>
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-600" style={!t.isLight ? { background: 'rgba(220,38,38,0.15)' } : {}}>
          <I p={IC.trash} className="w-6 h-6" />
        </div>
        <p className="font-extrabold text-lg mb-2" style={{ color: t.text }}>Delete Customer?</p>
        <p className="text-sm mb-6" style={{ color: t.muted }}>
          This will permanently delete <strong style={{ color: t.text2 }}>{customer?.name}</strong> and cannot be undone.
        </p>
        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-[10px] text-xs font-bold cursor-pointer border transition-all" style={{ borderColor: t.border, color: t.text2, background: 'transparent' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-[10px] text-xs font-bold cursor-pointer bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Deleting…' : 'Delete Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Order History Panel ───────────────────────────────────────────────────────
function OrderHistoryPanel({ customerId }) {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const { t } = useThemeTokens();

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    saAPI.getMyOrders({ limit: 500 })
      .then(res => {
        const all = (res.data?.orders || []).filter(o =>
          o.customerId?._id === customerId || o.customerId === customerId
        );
        setOrders(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  const filtered = filter === 'all' ? orders : orders.filter(o =>
    filter === 'buy'  ? o.orderType === 'buy'  :
    filter === 'sell' ? o.orderType === 'sell' :
    o.status === filter
  );

  const completedOrders = orders.filter(o => o.status === 'completed');
  const completedVol    = completedOrders.reduce((s, o) => s + (o.finalizedAmount || o.totalAmount || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-7 h-7 rounded-full border-2 animate-spin" style={{ borderColor: t.border, borderTopColor: t.accent }} />
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Total',     val: orders.length,              color: t.text },
          { label: 'Completed', val: completedOrders.length,     color: '#10B981' },
          { label: 'Volume',    val: `PKR ${fmt(completedVol)}`,  color: t.accentDark, small: true },
        ].map(({ label, val, color, small }) => (
          <div key={label} className="rounded-[10px] p-2.5 text-center border" style={{ background: t.section, borderColor: t.border }}>
            <p className={`font-extrabold leading-tight ${small ? 'text-[10px]' : 'text-xl'}`} style={{ color }}>{val}</p>
            <p className="text-[9px] font-bold uppercase tracking-[.08em] mt-0.5" style={{ color: t.muted }}>{label}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-1 flex-wrap mb-3">
        {['all', 'buy', 'sell', 'pending', 'approved', 'completed', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer capitalize transition-all border"
            style={filter === f ? { background: t.accent, color: '#fff', borderColor: t.accent } : { background: t.section, color: t.muted, borderColor: t.border }}>
            {f}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ color: t.muted }}>No orders found</div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {filtered.map(o => (
            <div key={o._id} className="p-3.5 rounded-xl border" style={{ borderColor: t.border, background: t.card }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-[.06em]" style={{ color: t.muted }}>
                      {o.orderType === 'buy' ? '↓ Buy' : '↑ Sell'} · {o.metalType || 'Gold'} {o.carat && `· ${o.carat}`}
                    </span>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold" style={{ color: t.text }}>PKR {fmt(o.finalizedAmount || o.totalAmount || 0)}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{fmtDate(o.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-3 text-[11px] flex-wrap" style={{ color: t.muted }}>
                {o.quantity      && <span>{o.quantity} {o.unit || 'tola'}</span>}
                {o.receiptNumber && <span className="font-mono" style={{ color: t.accentDark }}>#{o.receiptNumber}</span>}
                {o.rejectionReason && <span className="text-red-500">Rejected: {o.rejectionReason}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Customer Drawer ───────────────────────────────────────────────────────────
function CustomerDrawer({ customer, open, onClose, onAction, processing, deleting }) {
  const [activeSection,   setActiveSection]   = useState('details');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { isLightTheme, t } = useThemeTokens();

  useEffect(() => {
    if (!open) { setActiveSection('details'); setShowDeleteModal(false); }
  }, [open]);

  if (!open || !customer) return null;

  const InfoRow = ({ icon, label, value, color }) =>
    value ? (
      <div className="flex items-start gap-2.5 py-2.5 border-b last:border-0" style={{ borderColor: t.border }}>
        {icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: t.section, color: t.muted }}>
            <I p={icon} className="w-3.5 h-3.5" />
          </div>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.08em] mb-0.5" style={{ color: t.muted }}>{label}</p>
          <p className="text-sm font-semibold break-words" style={{ color: color || t.text }}>{value}</p>
        </div>
      </div>
    ) : null;

  const goldGradient = isLightTheme
    ? 'linear-gradient(135deg, #FBF5DC, #FFF9EC)'
    : 'linear-gradient(135deg, rgba(201,162,39,0.12), rgba(201,162,39,0.04))';
  const goldBorder = isLightTheme ? '#E8C862' : 'rgba(201,162,39,0.3)';

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end">
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[4px]" onClick={onClose} />
        <div className="relative h-full w-full max-w-full sm:max-w-[480px] flex flex-col shadow-2xl overflow-hidden animate-[slideIn_.2s_ease]" style={{ background: t.card }}>

          {/* Drawer header */}
          <div className="px-4 sm:px-6 pt-5 border-b flex-shrink-0" style={{ borderColor: t.border }}>
            <div className="flex justify-between items-start mb-4 gap-2">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <Avatar name={customer.name} size={52} radius={14} />
                <div className="min-w-0">
                  <p className="text-[16px] sm:text-[18px] font-extrabold leading-tight truncate" style={{ color: t.text }}>{customer.name}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: t.muted }}>{customer.email}</p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    <StatusBadge customer={customer} />
                    {customer.shopCustomerNumber && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border font-mono" style={{ background: isLightTheme ? '#fffbeb' : 'rgba(245,158,11,0.15)', color: t.accentDark, borderColor: isLightTheme ? '#fde68a' : 'rgba(245,158,11,0.3)' }}>
                        <I p={IC.hash} className="w-2.5 h-2.5" />{customer.shopCustomerNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => setShowDeleteModal(true)} disabled={deleting}
                  className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center border-none bg-transparent cursor-pointer hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50" style={{ color: t.muted }}>
                  <I p={IC.trash} className="w-4 h-4" />
                </button>
                <button onClick={onClose}
                  className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center border-none cursor-pointer" style={{ background: t.section, color: t.muted }}>
                  <I p={IC.close} className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex overflow-x-auto">
              {['details', 'actions', 'history'].map(t2 => (
                <button key={t2} onClick={() => setActiveSection(t2)}
                  className="px-4 py-2.5 text-xs font-bold capitalize bg-none border-none cursor-pointer transition-all -mb-px whitespace-nowrap"
                  style={activeSection === t2 ? { color: t.accentDark, borderBottom: `2px solid ${t.accent}` } : { color: t.muted, borderBottom: '2px solid transparent' }}>
                  {t2 === 'history' ? '📋 History' : t2 === 'actions' ? '⚡ Actions' : '👤 Details'}
                </button>
              ))}
            </div>
          </div>

          {/* Drawer body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">

            {/* Details tab */}
            {activeSection === 'details' && (
              <div>
                <div className="rounded-2xl p-4 mb-5 border" style={{ background: goldGradient, borderColor: goldBorder }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.12em] mb-3" style={{ color: t.accentDark }}>Order Activity</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { n: customer.totalOrders ?? 0, l: 'Total',  color: t.text },
                      { n: customer.buyOrders   ?? 0, l: 'Bought', color: '#3B82F6' },
                      { n: customer.sellOrders  ?? 0, l: 'Sold',   color: t.accentDark },
                    ].map(({ n, l, color }) => (
                      <div key={l} className="text-center">
                        <p className="text-[24px] sm:text-[28px] font-extrabold leading-none" style={{ color }}>{n}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[.08em] mt-1" style={{ color: t.muted }}>{l}</p>
                      </div>
                    ))}
                  </div>
                  {customer.totalSpent > 0 && (
                    <div className="mt-3.5 pt-3 border-t text-center" style={{ borderColor: goldBorder }}>
                      <p className="text-base font-extrabold" style={{ color: t.accentDark }}>PKR {fmt(customer.totalSpent)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-[.08em] mt-0.5" style={{ color: t.muted }}>Total Volume</p>
                    </div>
                  )}
                  {customer.lastOrder && (
                    <p className="text-[11px] text-center mt-2" style={{ color: t.muted }}>Last order: {fmtDate(customer.lastOrder)}</p>
                  )}
                </div>
                {customer.isFlagged && customer.flagReason && (
                  <div className="rounded-xl px-4 py-3 mb-4 border" style={{ background: isLightTheme ? '#fef2f2' : 'rgba(220,38,38,0.1)', borderColor: isLightTheme ? '#fecaca' : 'rgba(220,38,38,0.3)' }}>
                    <p className="text-[11px] font-extrabold text-red-500 mb-1">⚠ Flag Reason</p>
                    <p className="text-sm text-red-500">{customer.flagReason}</p>
                  </div>
                )}
                <p className="text-[10px] font-extrabold uppercase tracking-[.12em] mb-2" style={{ color: t.muted }}>Contact Information</p>
                <div className="mb-5">
                  <InfoRow icon={IC.mail}     label="Email"     value={customer.email} />
                  <InfoRow icon={IC.phone}    label="Phone"     value={customer.phoneNumber} />
                  <InfoRow icon={IC.phone}    label="WhatsApp"  value={customer.whatsappNumber} />
                  <InfoRow icon={IC.location} label="City"      value={customer.city} />
                  <InfoRow icon={IC.location} label="Address"   value={customer.address} />
                </div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.12em] mb-2" style={{ color: t.muted }}>Account Details</p>
                <div>
                  <InfoRow icon={IC.hash}     label="Shop Customer No." value={customer.shopCustomerNumber} color={t.accentDark} />
                  <InfoRow icon={IC.calendar} label="Registered"        value={fmtDateTime(customer.createdAt)} />
                  <InfoRow
                    label="Status"
                    value={customer.isFlagged ? 'Flagged — cannot place orders' : customer.isTrusted ? 'Trusted' : 'Approved — orders need manual approval'}
                    color={customer.isFlagged ? '#ef4444' : customer.isTrusted ? '#3B82F6' : '#10B981'}
                  />
                </div>
              </div>
            )}

            {/* Actions tab */}
            {activeSection === 'actions' && (
              <div>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: t.muted }}>
                  Manage this customer's trust and access. These settings only affect how this customer interacts with your shop.
                </p>

                {/* Trust */}
                <div className="rounded-2xl p-4 mb-3 border" style={{ background: isLightTheme ? '#eff6ff' : 'rgba(59,130,246,0.08)', borderColor: isLightTheme ? '#bfdbfe' : 'rgba(59,130,246,0.25)' }}>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-9 h-9 rounded-[10px] bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <I p={IC.shield} className="w-4 h-4 text-white" />
                    </div>
                    <div><p className="font-bold text-sm" style={{ color: isLightTheme ? '#1d4ed8' : '#93c5fd' }}>Trusted Customer</p></div>
                    {customer.isTrusted && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ml-auto" style={{ background: isLightTheme ? '#eff6ff' : 'rgba(59,130,246,0.15)', color: isLightTheme ? '#1d4ed8' : '#93c5fd', borderColor: isLightTheme ? '#bfdbfe' : 'rgba(59,130,246,0.3)' }}>Active</span>}
                  </div>
                  {!customer.isTrusted ? (
                    <button
                      onClick={() => onAction('trust', customer)}
                      disabled={processing}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] text-xs font-bold cursor-pointer bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      <I p={IC.shield} className="w-3.5 h-3.5" /> {processing ? 'Processing…' : 'Mark as Trusted'}
                    </button>
                  ) : (
                    <button
                      onClick={() => onAction('untrust', customer)}
                      disabled={processing}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] text-xs font-bold cursor-pointer border transition-all disabled:opacity-50"
                      style={{ borderColor: t.border, color: t.text2, background: 'transparent' }}
                    >
                      <I p={IC.close} className="w-3.5 h-3.5" /> {processing ? 'Processing…' : 'Remove Trusted Status'}
                    </button>
                  )}
                </div>

                {/* Flag */}
                <div className="rounded-2xl p-4 mb-5 border" style={{ background: isLightTheme ? '#fef2f2' : 'rgba(220,38,38,0.08)', borderColor: isLightTheme ? '#fecaca' : 'rgba(220,38,38,0.25)' }}>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-9 h-9 rounded-[10px] bg-red-600 flex items-center justify-center flex-shrink-0">
                      <I p={IC.flag} className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: isLightTheme ? '#dc2626' : '#fca5a5' }}>Flag as Scam</p>
                      <p className="text-[11px]" style={{ color: isLightTheme ? '#f87171' : '#fca5a5aa' }}>Blocks all orders from this customer</p>
                    </div>
                    {customer.isFlagged && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ml-auto" style={{ background: isLightTheme ? '#fef2f2' : 'rgba(220,38,38,0.15)', color: isLightTheme ? '#dc2626' : '#fca5a5', borderColor: isLightTheme ? '#fecaca' : 'rgba(220,38,38,0.3)' }}>Active</span>}
                  </div>
                  {customer.isFlagged && customer.flagReason && (
                    <div className="rounded-lg px-3 py-2 mb-2.5 border" style={{ background: t.card, borderColor: isLightTheme ? '#fecaca' : 'rgba(220,38,38,0.3)' }}>
                      <p className="text-[11px] font-bold mb-0.5" style={{ color: isLightTheme ? '#dc2626' : '#fca5a5' }}>Current reason:</p>
                      <p className="text-xs" style={{ color: t.text2 }}>{customer.flagReason}</p>
                    </div>
                  )}
                  {!customer.isFlagged ? (
                    <button
                      onClick={() => onAction('flag', customer)}
                      disabled={processing}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] text-xs font-bold cursor-pointer bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      <I p={IC.flag} className="w-3.5 h-3.5" /> {processing ? 'Processing…' : 'Flag as Scam'}
                    </button>
                  ) : (
                    <button
                      onClick={() => onAction('unflag', customer)}
                      disabled={processing}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] text-xs font-bold cursor-pointer border transition-all disabled:opacity-50"
                      style={{ borderColor: '#dc2626', color: '#10B981', background: 'transparent' }}
                    >
                      <I p={IC.checkCirc} className="w-3.5 h-3.5" /> {processing ? 'Processing…' : 'Remove Flag'}
                    </button>
                  )}
                </div>

                {/* Danger zone */}
                <div className="border-t pt-4" style={{ borderColor: t.border }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.12em] mb-2" style={{ color: t.muted }}>Danger Zone</p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={deleting}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] text-xs font-bold cursor-pointer border transition-all disabled:opacity-50"
                    style={{ borderColor: isLightTheme ? '#fecaca' : 'rgba(220,38,38,0.3)', color: isLightTheme ? '#dc2626' : '#fca5a5', background: 'transparent' }}
                  >
                    <I p={IC.trash} className="w-3.5 h-3.5" /> {deleting ? 'Deleting…' : 'Delete Customer'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'history' && <OrderHistoryPanel customerId={customer._id} />}
          </div>
        </div>
      </div>

      <DeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => { await onAction('delete', customer); setShowDeleteModal(false); }}
        customer={customer}
        loading={deleting}
      />
    </>
  );
}

// ─── Registration Row ──────────────────────────────────────────────────────────
function RegistrationRow({ reg, onAction, processing, isMobile }) {
  const { isLightTheme, t } = useThemeTokens();
  const statusStyle =
    reg.status === 'pending'  ? (isLightTheme ? { bg: '#fffbeb', color: '#92400e', border: '#fde68a' } : { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' }) :
    reg.status === 'approved' ? (isLightTheme ? { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' } : { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' }) :
                                 (isLightTheme ? { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' } : { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'rgba(239,68,68,0.3)' });

  const regAsCustomer = {
    _id:            reg._id,
    name:           reg.name || reg.customerId?.name,
    phoneNumber:    reg.phoneNumber || reg.customerId?.phoneNumber,
    whatsappNumber: reg.whatsappNumber || reg.customerId?.whatsappNumber,
  };

  if (isMobile) {
    return (
      <div className="rounded-xl p-4 mb-2.5 border" style={{ background: t.card, borderColor: t.border }}>
        <div className="flex justify-between items-start mb-2.5 gap-2">
          <div className="flex gap-2.5 min-w-0">
            <Avatar name={reg.name} size={40} radius={10} />
            <div className="min-w-0">
              <p className="text-sm font-extrabold truncate" style={{ color: t.text }}>{reg.name}</p>
              <p className="text-[11px] truncate" style={{ color: t.muted }}>{reg.email}</p>
              <p className="text-[11px]" style={{ color: t.muted }}>{reg.phoneNumber}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0" style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.border }}>{reg.status}</span>
        </div>
        {reg.city && <p className="text-[11px] mb-2" style={{ color: t.muted }}>📍 {reg.city}</p>}
        <p className={`text-[10px] ${reg.status === 'pending' ? 'mb-3' : ''}`} style={{ color: t.muted }}>Registered: {fmtDate(reg.createdAt)}</p>
        {reg.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => onAction('approve', regAsCustomer)}
              disabled={processing}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-bold cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              <I p={IC.check} className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => onAction('reject', regAsCustomer)}
              disabled={processing}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-bold cursor-pointer bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50"
            >
              <I p={IC.close} className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}
        {reg.status === 'rejected' && reg.rejectionReason && (
          <p className="text-[11px] text-red-500 mt-1.5">Reason: {reg.rejectionReason}</p>
        )}
      </div>
    );
  }

  return (
    <tr className="border-b transition-colors" style={{ borderColor: t.border }}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={reg.name} size={36} radius={10} />
          <div>
            <p className="font-bold text-sm" style={{ color: t.text }}>{reg.name}</p>
            <p className="text-[11px]" style={{ color: t.muted }}>{reg.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm" style={{ color: t.text2 }}>{reg.phoneNumber}</p>
        {reg.whatsappNumber && <p className="text-[11px]" style={{ color: t.muted }}>{reg.whatsappNumber}</p>}
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: t.text2 }}>{reg.city || '—'}</td>
      <td className="px-4 py-3 text-xs" style={{ color: t.muted }}>{fmtDate(reg.createdAt)}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.border }}>{reg.status}</span>
      </td>
      <td className="px-4 py-3">
        {reg.status === 'pending' && (
          <div className="flex gap-1.5">
            <button
              onClick={() => onAction('approve', regAsCustomer)}
              disabled={processing}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-xs font-bold cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              <I p={IC.check} className="w-3 h-3" /> Approve
            </button>
            <button
              onClick={() => onAction('reject', regAsCustomer)}
              disabled={processing}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-xs font-bold cursor-pointer bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50"
            >
              <I p={IC.close} className="w-3 h-3" /> Reject
            </button>
          </div>
        )}
        {reg.status === 'rejected' && reg.rejectionReason && (
          <p className="text-[11px] text-red-500">{reg.rejectionReason}</p>
        )}
      </td>
    </tr>
  );
}

// ─── Customer Row (desktop table) ──────────────────────────────────────────────
function CustomerRow({ customer, onView }) {
  const { t } = useThemeTokens();
  return (
    <tr className="border-b transition-colors" style={{ borderColor: t.border }}
      onMouseEnter={e => e.currentTarget.style.background = t.hover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={customer.name} size={36} radius={10} />
          <div>
            <p className="font-bold text-sm" style={{ color: t.text }}>{customer.name}</p>
            <p className="text-[11px]" style={{ color: t.muted }}>{customer.email}</p>
            <div className="flex gap-1 mt-0.5 flex-wrap">
              <StatusBadge customer={customer} />
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border font-mono" style={{ background: t.section, color: t.accentDark, borderColor: t.border }}>
          <I p={IC.hash} className="w-2.5 h-2.5" />{customer.shopCustomerNumber || '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm" style={{ color: t.text2 }}>{customer.phoneNumber || '—'}</p>
        {customer.city && <p className="text-[11px]" style={{ color: t.muted }}>{customer.city}</p>}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-[11px]" style={{ color: '#3B82F6' }}>↓</span>
          <span className="font-extrabold text-sm" style={{ color: '#3B82F6' }}>{customer.buyOrders}</span>
          <span className="mx-0.5" style={{ color: t.border }}>·</span>
          <span className="text-[11px]" style={{ color: t.accentDark }}>↑</span>
          <span className="font-extrabold text-sm" style={{ color: t.accentDark }}>{customer.sellOrders}</span>
        </div>
      </td>
      <td className="px-4 py-3"><span className="font-extrabold text-sm" style={{ color: t.text }}>{customer.totalOrders}</span></td>
      <td className="px-4 py-3">
        {customer.totalSpent > 0
          ? <p className="text-sm font-bold" style={{ color: t.accentDark }}>PKR {fmt(customer.totalSpent)}</p>
          : <span style={{ color: t.border }}>—</span>}
      </td>
      <td className="px-4 py-3 text-xs" style={{ color: t.muted }}>{fmtDate(customer.lastOrder)}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => onView(customer)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[11px] font-bold cursor-pointer border transition-all"
          style={{ borderColor: t.border, color: t.text2, background: 'transparent' }}
        >
          <I p={IC.eye} className="w-3.5 h-3.5" /> View
        </button>
      </td>
    </tr>
  );
}

// ─── Customer Card (mobile) ────────────────────────────────────────────────────
function CustomerCard({ customer, onView }) {
  const { t } = useThemeTokens();
  return (
    <div className="rounded-xl p-4 mb-2.5 border" style={{ background: t.card, borderColor: t.border }}>
      <div className="flex gap-3 mb-3">
        <Avatar name={customer.name} size={44} radius={12} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: t.text }}>{customer.name}</p>
          <p className="text-[11px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: t.muted }}>{customer.email}</p>
          <p className="text-[11px]" style={{ color: t.muted }}>{customer.phoneNumber}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            <StatusBadge customer={customer} />
            {customer.shopCustomerNumber && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border font-mono" style={{ background: t.section, color: t.accentDark, borderColor: t.border }}>
                <I p={IC.hash} className="w-2.5 h-2.5" />{customer.shopCustomerNumber}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3 rounded-[10px] p-2.5" style={{ background: t.section }}>
        <div className="text-center">
          <p className="text-[18px] font-extrabold" style={{ color: t.text }}>{customer.totalOrders}</p>
          <p className="text-[9px] font-bold uppercase" style={{ color: t.muted }}>Total</p>
        </div>
        <div className="text-center border-x" style={{ borderColor: t.border }}>
          <p className="text-[18px] font-extrabold" style={{ color: '#3B82F6' }}>{customer.buyOrders}</p>
          <p className="text-[9px] font-bold uppercase" style={{ color: t.muted }}>Bought</p>
        </div>
        <div className="text-center">
          <p className="text-[18px] font-extrabold" style={{ color: t.accentDark }}>{customer.sellOrders}</p>
          <p className="text-[9px] font-bold uppercase" style={{ color: t.muted }}>Sold</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div>
          {customer.totalSpent > 0 && <p className="text-xs font-bold" style={{ color: t.accentDark }}>PKR {fmt(customer.totalSpent)}</p>}
          {customer.lastOrder && <p className="text-[10px]" style={{ color: t.muted }}>{fmtDate(customer.lastOrder)}</p>}
        </div>
        <button
          onClick={() => onView(customer)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-[11px] font-bold cursor-pointer border transition-all"
          style={{ borderColor: t.border, color: t.text2, background: 'transparent' }}
        >
          <I p={IC.eye} className="w-3.5 h-3.5" /> View
        </button>
      </div>
    </div>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, pageSize, onPageChange, onPageSizeChange, totalItems, showing }) {
  const { t } = useThemeTokens();
  if (totalItems === 0) return null;

  const pages = [];
  const delta = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
      <div className="flex items-center gap-2 text-xs flex-wrap justify-center" style={{ color: t.muted }}>
        <span>Show</span>
        <select
          value={pageSize}
          onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1); }}
          className="px-2 py-1.5 rounded-lg border text-xs font-semibold focus:border-[#c9a227] outline-none appearance-none"
          style={{
            background: t.input, borderColor: t.border, color: t.text2,
            backgroundImage: t.selectArrow,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 6px center',
            paddingRight: '28px',
          }}
        >
          {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>per page · <span className="font-semibold" style={{ color: t.text2 }}>{showing}</span> of <span className="font-semibold" style={{ color: t.text2 }}>{totalItems}</span></span>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="w-8 h-8 rounded-lg border text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: t.input, borderColor: t.border, color: t.text2 }}
          >
            ‹
          </button>
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs" style={{ color: t.muted }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className="w-8 h-8 rounded-lg text-xs font-bold transition-colors border"
                style={p === page
                  ? { background: t.accent, borderColor: t.accent, color: '#fff' }
                  : { background: t.input, borderColor: t.border, color: t.text2 }}
              >
                {p}
              </button>
            )
          )}
          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="w-8 h-8 rounded-lg border text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: t.input, borderColor: t.border, color: t.text2 }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function MyCustomers() {
  const { theme, isLightTheme, t } = useThemeTokens();

  const [customers,  setCustomers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  const [activeTab,     setActiveTab]     = useState('customers');
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('all');

  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [processing,     setProcessing]     = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [toast,          setToast]          = useState({ msg: '', type: 'success' });

  const [confirmModal, setConfirmModal] = useState({ open: false, actionType: '', customer: null });
  const [waToast, setWaToast] = useState({ show: false, customerName: '', customerPhone: '', actionType: '', shopName: '' });

  const [shopInfo, setShopInfo] = useState({ shopName: 'GoldChain HQ', whatsappNumber: '' });

  const [registrations, setRegistrations] = useState([]);
  const [regLoading,    setRegLoading]    = useState(false);
  const [regCounts,     setRegCounts]     = useState({ pending: 0, approved: 0, rejected: 0 });
  const [regFilter,     setRegFilter]     = useState('pending');
  const [regSearch,     setRegSearch]     = useState('');

  // Pagination
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [regPage, setRegPage]         = useState(1);
  const [regPageSize, setRegPageSize] = useState(20);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const showToast   = useCallback((msg, type = 'success') => setToast({ msg, type }), []);
  const showWaToast = useCallback((customerName, customerPhone, actionType) => {
    setWaToast({ show: true, customerName, customerPhone, actionType, shopName: shopInfo.shopName });
  }, [shopInfo.shopName]);

  // ── Fetch shop info ─────────────────────────────────────────────────────────
  const fetchShopInfo = useCallback(async () => {
    try {
      const response = await saAPI.getDashboard();
      if (response.data?.shopInfo) {
        setShopInfo({
          shopName: response.data.shopInfo.shopName || 'GoldChain HQ',
          whatsappNumber: response.data.shopInfo.whatsappNumber || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch shop info:', error);
    }
  }, []);

  // ── Build customers ─────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async (isRefresh = false) => {
    setError('');
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const regRes = await saAPI.getMyShopRegistrations({ status: 'approved', limit: 500 });
      const approvedRegistrations = regRes.data?.registrations || [];

      // ONLY fetch COMPLETED orders for revenue calculation
      const completedRes = await saAPI.getMyOrders({ status: 'completed', limit: 500 });

      const allOrders = [
        ...(completedRes.data?.orders || []),
      ];

      const customerMap = new Map();
      let seq = 0;

      approvedRegistrations.forEach((reg) => {
        const cust = reg.customerId;
        if (!cust || !cust._id) return;
        const id = cust._id;
        if (customerMap.has(id)) return;
        const sid = reg.shopId?._id?.toString() || reg.shopId?.toString() || '';
        const matchRels = (cust.shopRelations || []).filter(
          r => r.adminId?._id?.toString() === sid || r.adminId?.toString() === sid
        );
        const matchRel = matchRels[matchRels.length - 1] || {};
        customerMap.set(id, {
          _id: id,
          name: reg.name || cust.name || '—',
          email: reg.email || cust.email || '',
          phoneNumber: reg.phoneNumber || cust.phoneNumber || '',
          whatsappNumber: reg.whatsappNumber || cust.whatsappNumber || '',
          isTrusted: matchRel?.isTrusted || false,
          isFlagged: matchRel?.isFlagged || false,
          flagReason: matchRel?.flagReason || null,
          createdAt: reg.createdAt || cust.createdAt || null,
          address: reg.address || cust.address || '',
          city: reg.city || cust.city || '',
          shopCustomerNumber: generateShopCustomerNumber(id, sid, seq++),
          totalOrders: 0, buyOrders: 0, sellOrders: 0, totalSpent: 0, lastOrder: null,
        });
      });

      allOrders.forEach((order) => {
        const cust = order.customerId;
        if (!cust || !cust._id) return;
        const id = cust._id;

        if (!customerMap.has(id)) {
          const adminIdStr = order.adminId?._id?.toString() || order.adminId?.toString() || '';
          const shopRels = (cust.shopRelations || []).filter(
            r => r.adminId?._id?.toString() === adminIdStr || r.adminId?.toString() === adminIdStr
          );
          const shopRel = shopRels[shopRels.length - 1] || {};
          customerMap.set(id, {
            _id: id,
            name: cust.name || '—',
            email: cust.email || '',
            phoneNumber: cust.phoneNumber || '',
            whatsappNumber: cust.whatsappNumber || '',
            isTrusted: shopRel?.isTrusted || false,
            isFlagged: shopRel?.isFlagged || false,
            flagReason: shopRel?.flagReason || null,
            createdAt: cust.createdAt || null,
            address: cust.address || '',
            city: cust.city || '',
            shopCustomerNumber: generateShopCustomerNumber(id, adminIdStr, seq++),
            totalOrders: 0, buyOrders: 0, sellOrders: 0, totalSpent: 0, lastOrder: null,
          });
        }

        const entry = customerMap.get(id);
        entry.totalOrders += 1;
        if (order.orderType === 'buy') entry.buyOrders += 1;
        if (order.orderType === 'sell') entry.sellOrders += 1;
        entry.totalSpent += order.finalizedAmount || order.totalAmount || 0;
        const od = order.createdAt ? new Date(order.createdAt) : null;
        if (od && (!entry.lastOrder || od > new Date(entry.lastOrder))) {
          entry.lastOrder = order.createdAt;
        }
      });

      setCustomers(Array.from(customerMap.values()).sort((a, b) => b.totalOrders - a.totalOrders));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShopInfo();
    fetchCustomers();
  }, [fetchShopInfo, fetchCustomers]);

  // ── Registrations ───────────────────────────────────────────────────────────
  const fetchRegistrations = useCallback(async () => {
    setRegLoading(true);
    try {
      const res = await saAPI.getMyShopRegistrations({ status: regFilter === 'all' ? '' : regFilter, limit: 100 });
      setRegistrations(res.data?.registrations || []);
      setRegCounts(res.data?.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch { showToast('Failed to load registrations', 'error'); }
    finally { setRegLoading(false); }
  }, [regFilter, showToast]);

  const fetchRegCounts = useCallback(async () => {
    try {
      const res = await saAPI.getMyShopRegistrations({ status: 'pending', limit: 1 });
      setRegCounts(res.data?.counts || { pending: 0, approved: 0, rejected: 0 });
    } catch {}
  }, []);

  useEffect(() => { if (activeTab === 'registrations') fetchRegistrations(); }, [activeTab, regFilter, fetchRegistrations]);
  useEffect(() => { fetchRegCounts(); }, [fetchRegCounts]);

  // Reset pagination when filters change
  useEffect(() => { setPage(1); }, [search, filterStatus]);
  useEffect(() => { setRegPage(1); }, [regSearch, regFilter]);

  // ── Open confirm modal ──────────────────────────────────────────────────────
  const handleAction = useCallback((actionType, customer) => {
    if (actionType === 'delete') { handleDelete(customer._id); return; }
    setConfirmModal({ open: true, actionType, customer });
  }, []); // eslint-disable-line

  // ── Execute confirmed action ────────────────────────────────────────────────
  const handleConfirmAction = async (reason) => {
    const { actionType, customer } = confirmModal;
    setProcessing(true);
    try {
      const name  = customer.name || '—';
      const phone = customer.whatsappNumber || customer.phoneNumber || '';

      if (actionType === 'trust') {
        await saAPI.trustCustomerForSA(customer._id);
        updateCustomer(customer._id, { isTrusted: true, isFlagged: false, flagReason: null });
      } else if (actionType === 'untrust') {
        await saAPI.untrustCustomerForSA(customer._id);
        updateCustomer(customer._id, { isTrusted: false });
      } else if (actionType === 'flag') {
        await saAPI.flagCustomerForSA(customer._id, { reason });
        updateCustomer(customer._id, { isFlagged: true, isTrusted: false, flagReason: reason });
      } else if (actionType === 'unflag') {
        await saAPI.unflagCustomerForSA(customer._id);
        updateCustomer(customer._id, { isFlagged: false, flagReason: null });
      } else if (actionType === 'approve') {
        await saAPI.approveMyShopRegistration(customer._id);
        fetchRegistrations();
        fetchCustomers(true);
      } else if (actionType === 'reject') {
        await saAPI.rejectMyShopRegistration(customer._id, { reason });
        fetchRegistrations();
      }

      setConfirmModal({ open: false, actionType: '', customer: null });
      showWaToast(name, phone, actionType);
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // ── Optimistic customer update ──────────────────────────────────────────────
  const updateCustomer = (id, patch) => {
    setCustomers(prev => prev.map(c => c._id === id ? { ...c, ...patch } : c));
    setDrawerCustomer(prev => prev?._id === id ? { ...prev, ...patch } : prev);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (customerId) => {
    setDeleting(true);
    try {
      await saAPI.deleteCustomer(customerId);
      showToast('Customer deleted');
      setCustomers(prev => prev.filter(c => c._id !== customerId));
      setDrawerOpen(false);
      setDrawerCustomer(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete customer', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => customers.filter((c) => {
    if (filterStatus === 'trusted'  && !c.isTrusted)                   return false;
    if (filterStatus === 'flagged'  && !c.isFlagged)                   return false;
    if (filterStatus === 'approved' && (c.isTrusted || c.isFlagged))   return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q)               ||
      c.email?.toLowerCase().includes(q)              ||
      c.phoneNumber?.includes(q)                      ||
      c.city?.toLowerCase().includes(q)               ||
      c.shopCustomerNumber?.toLowerCase().includes(q)
    );
  }), [customers, filterStatus, search]);

  // ── Pagination derived (customers) ──────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedCustomers = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    customers.length,
    trusted:  customers.filter(c => c.isTrusted).length,
    flagged:  customers.filter(c => c.isFlagged).length,
    approved: customers.filter(c => !c.isTrusted && !c.isFlagged).length,
    totalVol: customers.reduce((s, c) => s + (c.totalSpent || 0), 0),
  }), [customers]);

  // ── Filtered registrations ──────────────────────────────────────────────────
  const filteredRegistrations = useMemo(() => {
    if (!regSearch.trim()) return registrations;
    const q = regSearch.toLowerCase();
    return registrations.filter(r =>
      r.name?.toLowerCase().includes(q)     ||
      r.email?.toLowerCase().includes(q)    ||
      r.phoneNumber?.includes(q)            ||
      r.whatsappNumber?.includes(q)         ||
      r.city?.toLowerCase().includes(q)     ||
      (r.customerId?._id || r.customerId || '').toString().toLowerCase().includes(q)
    );
  }, [registrations, regSearch]);

  // ── Pagination derived (registrations) ──────────────────────────────────────
  const regTotalPages = Math.max(1, Math.ceil(filteredRegistrations.length / regPageSize));
  const safeRegPage = Math.min(regPage, regTotalPages);
  const paginatedRegistrations = useMemo(
    () => filteredRegistrations.slice((safeRegPage - 1) * regPageSize, safeRegPage * regPageSize),
    [filteredRegistrations, safeRegPage, regPageSize]
  );

  // ── Loading / error ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]" style={{ fontFamily: 'Sora, sans-serif', background: t.page }}>
      <div className="text-center">
        <div className="w-12 h-12 border-[3px] rounded-full animate-spin mx-auto mb-4" style={{ borderColor: t.border, borderTopColor: t.accent }} />
        <p className="text-sm" style={{ color: t.muted }}>Loading customers…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6" style={{ fontFamily: 'Sora, sans-serif', background: t.page }}>
      <div className="w-[60px] h-[60px] rounded-[18px] flex items-center justify-center text-red-500" style={{ background: isLightTheme ? '#fef2f2' : 'rgba(220,38,38,0.15)' }}>
        <I p={IC.xCircle} className="w-7 h-7" />
      </div>
      <div>
        <p className="font-extrabold text-lg mb-1.5" style={{ color: t.text }}>Failed to load customers</p>
        <p className="text-sm" style={{ color: t.muted }}>{error}</p>
      </div>
      <button onClick={() => fetchCustomers()} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[10px] text-xs font-bold cursor-pointer text-white transition-all" style={{ background: t.accent }}>Try Again</button>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={`max-w-[1200px] mx-auto px-3 sm:px-4 ${isMobile ? 'pb-20' : 'pb-12'}`} style={{ fontFamily: 'Sora, sans-serif', background: t.page }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeUp  { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6 pt-2">
        <div>
          <h1 className={`${isMobile ? 'text-[22px]' : 'text-[28px]'} font-extrabold m-0 leading-tight`} style={{ color: t.text }}>My Customers</h1>
          <p className="text-sm mt-1" style={{ color: t.muted }}>
            {activeTab === 'customers'
              ? `${stats.total} customer${stats.total !== 1 ? 's' : ''} · PKR ${fmt(stats.totalVol)} total volume`
              : `Registration requests · ${regCounts.pending} pending`}
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[10px] text-xs font-bold cursor-pointer border transition-all disabled:opacity-50 flex-shrink-0 self-start"
          style={{ borderColor: t.border, color: t.text2, background: 'transparent' }}
          onClick={() => activeTab === 'customers' ? fetchCustomers(true) : fetchRegistrations()}
          disabled={refreshing || regLoading}
        >
          <I p={IC.refresh} className={`w-4 h-4 ${(refreshing || regLoading) ? 'animate-spin' : ''}`} />
          {(refreshing || regLoading) ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit mb-6 overflow-x-auto max-w-full" style={{ background: t.section }}>
        <button
          onClick={() => setActiveTab('customers')}
          className="px-3 sm:px-[18px] py-2 rounded-[10px] text-sm font-semibold cursor-pointer border-none transition-all whitespace-nowrap"
          style={activeTab === 'customers' ? { background: t.card, color: t.text, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' } : { background: 'transparent', color: t.muted }}
        >
          👥 Customers ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab('registrations')}
          className="flex items-center gap-1.5 px-3 sm:px-[18px] py-2 rounded-[10px] text-sm font-semibold cursor-pointer border-none transition-all whitespace-nowrap"
          style={activeTab === 'registrations' ? { background: t.card, color: t.text, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' } : { background: 'transparent', color: t.muted }}
        >
          📋 Registrations
          <span className="w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center" style={regCounts.pending > 0 ? { background: t.accent, color: '#fff' } : { background: t.border, color: t.muted }}>
            {regCounts.pending}
          </span>
        </button>
      </div>

      {/* ── CUSTOMERS TAB ── */}
      {activeTab === 'customers' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            {[
              { label: 'Total Customers', val: stats.total,                   color: t.accentDark, bar: '#c9a227' },
              { label: 'Trusted',         val: stats.trusted,                 color: '#3B82F6',     bar: '#3B82F6' },
              { label: 'Approved',        val: stats.approved,                color: '#10B981',     bar: '#10B981' },
              { label: 'Flagged',         val: stats.flagged,                 color: '#EF4444',     bar: '#EF4444' },
              { label: 'Total Volume',    val: `PKR ${fmt(stats.totalVol)}`,  color: '#D97706',     bar: '#F59E0B', small: true },
            ].map(({ label, val, color, bar, small }) => (
              <div key={label} className="rounded-2xl p-4 sm:p-5 relative overflow-hidden border" style={{ background: t.card, borderColor: t.border }}>
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: bar }} />
                <p className={`font-extrabold leading-tight ${small ? 'text-sm' : 'text-[22px] sm:text-[28px]'}`} style={{ color }}>{val}</p>
                <p className="text-[10px] font-bold uppercase tracking-[.08em] mt-1.5" style={{ color: t.muted }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.muted }}>
                <I p={IC.search} className="w-4 h-4" />
              </span>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email, phone, city or customer no…"
                className="w-full py-2.5 pl-9 pr-3.5 border rounded-[10px] text-sm outline-none focus:border-[#c9a227] transition-colors"
                style={{ background: t.input, borderColor: t.border, color: t.text }}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { key: 'all',      label: 'All' },
                { key: 'trusted',  label: '🛡 Trusted' },
                { key: 'approved', label: '✓ Approved' },
                { key: 'flagged',  label: '⚑ Flagged' },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setFilterStatus(key)}
                  className="px-3.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer border transition-all"
                  style={filterStatus === key ? { background: t.accent, color: '#fff', borderColor: t.accent } : { background: t.card, color: t.muted, borderColor: t.border }}>
                  {label}
                </button>
              ))}
              {(search || filterStatus !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setFilterStatus('all'); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-bold cursor-pointer border transition-all"
                  style={{ borderColor: t.border, color: t.text2, background: 'transparent' }}
                >
                  <I p={IC.close} className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl text-center px-6 py-16 border" style={{ background: t.card, borderColor: t.border }}>
              <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4" style={{ background: t.section, color: t.border }}>
                <I p={IC.user} className="w-8 h-8" />
              </div>
              <p className="font-bold text-[15px] mb-1.5" style={{ color: t.text2 }}>
                {search || filterStatus !== 'all' ? 'No customers match your filters' : 'No customers yet'}
              </p>
              <p className="text-sm" style={{ color: t.muted }}>
                {search || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Customers appear here after their registration is approved'}
              </p>
            </div>
          ) : (
            <>
              {isMobile ? (
                <div>
                  {paginatedCustomers.map(c => (
                    <CustomerCard key={c._id} customer={c} onView={c => { setDrawerCustomer(c); setDrawerOpen(true); }} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden border" style={{ background: t.card, borderColor: t.border }}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[900px]">
                      <thead>
                        <tr className="border-b-2" style={{ borderColor: t.border }}>
                          {['Customer', 'Shop No.', 'Contact', 'Orders (Buy·Sell)', 'Total', 'Volume', 'Last Order', ''].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[.1em] whitespace-nowrap" style={{ color: t.muted, background: t.section }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCustomers.map(c => (
                          <CustomerRow key={c._id} customer={c} onView={c => { setDrawerCustomer(c); setDrawerOpen(true); }} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <Pagination
                page={safePage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                totalItems={filtered.length}
                showing={paginatedCustomers.length}
              />
            </>
          )}
        </>
      )}

      {/* ── REGISTRATIONS TAB ── */}
      {activeTab === 'registrations' && (
        <>
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[
              { label: 'Pending',  val: regCounts.pending,  color: '#D97706', bar: '#F59E0B' },
              { label: 'Approved', val: regCounts.approved, color: '#10B981', bar: '#10B981' },
              { label: 'Rejected', val: regCounts.rejected, color: '#EF4444', bar: '#EF4444' },
            ].map(({ label, val, color, bar }) => (
              <div key={label} className="rounded-2xl p-4 sm:p-5 relative overflow-hidden text-center border" style={{ background: t.card, borderColor: t.border }}>
                <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: bar }} />
                <p className="text-[22px] sm:text-[28px] font-extrabold" style={{ color }}>{val}</p>
                <p className="text-[10px] font-bold uppercase tracking-[.08em] mt-1.5" style={{ color: t.muted }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-1.5 flex-wrap mb-4">
            {['pending', 'approved', 'rejected'].map(s => (
              <button key={s} onClick={() => setRegFilter(s)}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer capitalize border transition-all"
                style={regFilter === s ? { background: t.accent, color: '#fff', borderColor: t.accent } : { background: t.card, color: t.muted, borderColor: t.border }}>
                {s} ({regCounts[s] || 0})
              </button>
            ))}
          </div>

          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.muted }}>
              <I p={IC.search} className="w-4 h-4" />
            </span>
            <input
              type="text" value={regSearch} onChange={e => setRegSearch(e.target.value)}
              placeholder="Search by name, email, phone, city or customer ID…"
              className="w-full py-2.5 pl-9 pr-9 border rounded-[10px] text-sm outline-none focus:border-[#c9a227] transition-colors"
              style={{ background: t.input, borderColor: t.border, color: t.text }}
            />
            {regSearch && (
              <button onClick={() => setRegSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: t.muted }}>
                <I p={IC.close} className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {regFilter === 'pending' && regCounts.pending > 0 && (
            <div className="rounded-xl px-4 py-3 mb-4 flex gap-2.5 items-start border" style={{ background: isLightTheme ? '#fffbeb' : 'rgba(245,158,11,0.1)', borderColor: isLightTheme ? '#fde68a' : 'rgba(245,158,11,0.3)' }}>
              <I p={IC.alert} className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
              <div>
                <p className="text-xs font-bold" style={{ color: '#D97706' }}>{regCounts.pending} registration{regCounts.pending !== 1 ? 's' : ''} waiting for your approval</p>
                <p className="text-[11px] mt-0.5" style={{ color: isLightTheme ? '#92400e' : '#fbbf24' }}>Once approved, customers can place orders. You can also mark them trusted.</p>
              </div>
            </div>
          )}

          {regLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-9 h-9 border-2 rounded-full animate-spin" style={{ borderColor: t.border, borderTopColor: t.accent }} />
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="rounded-2xl text-center px-6 py-16 border" style={{ background: t.card, borderColor: t.border }}>
              <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4" style={{ background: t.section, color: t.border }}>
                <I p={IC.shop} className="w-8 h-8" />
              </div>
              <p className="font-bold text-[15px] mb-1.5" style={{ color: t.text2 }}>{regSearch ? 'No results match your search' : `No ${regFilter} registrations`}</p>
              <p className="text-sm" style={{ color: t.muted }}>{regSearch ? 'Try adjusting your search' : 'Registration requests will appear here'}</p>
            </div>
          ) : (
            <>
              {isMobile ? (
                <div>
                  {paginatedRegistrations.map(reg => (
                    <RegistrationRow key={reg._id} reg={reg} onAction={handleAction} processing={processing} isMobile={isMobile} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden border" style={{ background: t.card, borderColor: t.border }}>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse min-w-[760px]">
                      <thead>
                        <tr className="border-b-2" style={{ borderColor: t.border }}>
                          {['Customer', 'Contact', 'City', 'Date', 'Status', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[.1em]" style={{ color: t.muted, background: t.section }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRegistrations.map(reg => (
                          <RegistrationRow key={reg._id} reg={reg} onAction={handleAction} processing={processing} isMobile={isMobile} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <Pagination
                page={safeRegPage}
                totalPages={regTotalPages}
                pageSize={regPageSize}
                onPageChange={setRegPage}
                onPageSizeChange={setRegPageSize}
                totalItems={filteredRegistrations.length}
                showing={paginatedRegistrations.length}
              />
            </>
          )}
        </>
      )}

      {/* Customer Drawer */}
      <CustomerDrawer
        open={drawerOpen}
        customer={drawerCustomer}
        onClose={() => { setDrawerOpen(false); setDrawerCustomer(null); }}
        onAction={handleAction}
        processing={processing}
        deleting={deleting}
      />

      {/* Unified Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, actionType: '', customer: null })}
        onConfirm={handleConfirmAction}
        actionType={confirmModal.actionType}
        customer={confirmModal.customer}
        loading={processing}
      />

      {/* WhatsApp Toast */}
      <WhatsAppToast
        show={waToast.show}
        customerName={waToast.customerName}
        customerPhone={waToast.customerPhone}
        actionType={waToast.actionType}
        shopName={waToast.shopName}
        onClose={() => setWaToast(s => ({ ...s, show: false }))}
      />

      {/* Error/Success Toast */}
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />
    </div>
  );
}