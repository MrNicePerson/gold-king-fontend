// pages/home/MyOrders.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMyOrders } from '../../services/customerApi';
import Navbar from '../../components/HomePage/Navbar';
import { useTheme } from '../../contexts/ThemeContext';
import { formatNumberByLanguage, formatDateByLanguage, formatTimeByLanguage } from '../../utils/formatUtils';

// ── Constants ─────────────────────────────────────────────
const TOLA_IN_GRAMS = 11.664;

// ── Helper Functions ──────────────────────────────────────
const fmt = (n, lang = 'en') => (
  n != null ? formatNumberByLanguage(n, lang) : '—'
);
const fmtDate = (d, lang = 'en') => {
  if (!d) return '—';
  return formatDateByLanguage(d, lang);
};
const fmtDateTime = (d, lang = 'en') => {
  if (!d) return '—';
  return `${formatDateByLanguage(d, lang)} ${formatTimeByLanguage(d, lang)}`;
};

// ── FIXED: always decompose from grams ───────────────────
// 1 tola = 12 masha = 96 ratti
// So 1 tola = 96 ratti, 1 masha = 8 ratti
const decomposeGrams = (grams) => {
  if (!grams || grams <= 0) {
    return { tola: 0, masha: 0, ratti: 0, grams: 0, totalTola: 0 };
  }
  const totalTola = grams / TOLA_IN_GRAMS;
  // Convert to total rattis and decompose — round to avoid floating point drift
  const totalRatti = Math.round(totalTola * 96);
  const tola  = Math.floor(totalRatti / 96);
  const rem1  = totalRatti % 96;
  const masha = Math.floor(rem1 / 8);
  const ratti = rem1 % 8;
  return {
    tola,
    masha,
    ratti,
    grams:     Number(grams.toFixed(4)),
    totalTola: Number(totalTola.toFixed(6)),
  };
};

// ── FIXED: always drive breakdown from grams ──────────────
// quantityInTola from the DB is the TOTAL tola (e.g. 2.375),
// NOT the whole-tola integer. So we must decompose from grams
// to get the correct Tola / Masha / Ratti split.
// Only use the explicit DB fields (quantityInTola/Masha/Ratti)
// when ALL THREE are present AND they round-trip correctly —
// in that case the DB already did the decomposition for us.
const getQuantityBreakdown = (order) => {
  // Currency orders — no tola decomposition needed
  if (order.metalType === 'currency') {
    return { tola: 0, masha: 0, ratti: 0, grams: 0, totalTola: 0 };
  }

  // Best source: quantityInGram — decompose fresh every time
  if (order.quantityInGram && order.quantityInGram > 0) {
    return decomposeGrams(order.quantityInGram);
  }

  // Fallback: derive grams from quantityInTola (total tola float)
  if (order.quantityInTola && order.quantityInTola > 0) {
    return decomposeGrams(order.quantityInTola * TOLA_IN_GRAMS);
  }

  // Last resort: derive from raw quantity + unit
  if (order.quantity && order.unit) {
    let grams = 0;
    if      (order.unit === 'tola')  grams = order.quantity * TOLA_IN_GRAMS;
    else if (order.unit === 'masha') grams = order.quantity * (TOLA_IN_GRAMS / 12);
    else if (order.unit === 'ratti') grams = order.quantity * (TOLA_IN_GRAMS / 96);
    else if (order.unit === 'gram')  grams = order.quantity;
    else                              grams = order.quantity;
    return decomposeGrams(grams);
  }

  return { tola: 0, masha: 0, ratti: 0, grams: 0, totalTola: 0 };
};

// ── SuperAdmin-style quantity display helpers ─────────────
const getTraditionalLabel = (order) => {
  if (order.metalType === 'currency') return `${order.quantity} ${order.unit}`;
  if (order.quantityDisplay) return order.quantityDisplay;
  const b = getQuantityBreakdown(order);
  const parts = [];
  if (b.tola  > 0) parts.push(`${b.tola}  ${b.tola  === 1 ? 'Tola'  : 'Tolas'}`);
  if (b.masha > 0) parts.push(`${b.masha} ${b.masha === 1 ? 'Masha' : 'Mashas'}`);
  if (b.ratti > 0) parts.push(`${b.ratti} ${b.ratti === 1 ? 'Ratti' : 'Rattis'}`);
  if (parts.length === 0) parts.push('0 Tola');
  return parts.join(' + ');
};

const getSubLabel = (order) => {
  if (order.metalType === 'currency') return null;
  const b = getQuantityBreakdown(order);
  return `${Number(b.totalTola).toFixed(3)} tola · ${Number(b.grams).toFixed(2)} g`;
};

// ── Sub-components ─────────────────────────────────────────

const Badge = ({ label, icon, color, bg, border, size = 'text-[11px]' }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${size} font-bold ${color} ${bg} ${border}`}>
    {icon && <span className="text-[11px]">{icon}</span>}
    {label}
  </span>
);

const TraditionalUnitsDisplay = ({ order, theme }) => {
  const isCurrency = order.metalType === 'currency';
  if (isCurrency) return null;
  const breakdown = getQuantityBreakdown(order);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 p-4 rounded-xl" style={{ background: `color-mix(in srgb, var(--gk-card) 50%, transparent)`, border: `1px solid color-mix(in srgb, var(--gk-border) 40%, transparent)` }}>
      {[
        { label: '⚖️ Tola',  value: breakdown.tola,              unit: breakdown.tola  === 1 ? 'Whole Tola'              : 'Whole Tolas',          extra: breakdown.totalTola !== breakdown.tola ? `Total: ${breakdown.totalTola.toFixed(4)} Tolas` : null },
        { label: '📿 Masha', value: breakdown.masha,             unit: breakdown.masha === 1 ? 'Masha'                   : 'Mashas (1/12 Tola)',   extra: `= ${(breakdown.masha / 12).toFixed(4)} Tolas` },
        { label: '✨ Ratti', value: breakdown.ratti,             unit: breakdown.ratti === 1 ? 'Ratti'                   : 'Rattis (1/96 Tola)',   extra: `= ${(breakdown.ratti / 96).toFixed(4)} Tolas` },
        { label: '⚖️ Grams', value: breakdown.grams.toFixed(3), unit: 'Metric Weight',                                                            extra: `= ${(breakdown.grams / TOLA_IN_GRAMS).toFixed(4)} Tolas` },
      ].map((card, idx) => (
        <div key={idx} className="text-center p-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--gk-bg) 50%, transparent)' }}>
          <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--gk-muted)' }}>{card.label}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--gk-primary)' }}>{card.value}</p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--gk-muted)' }}>{card.unit}</p>
          {card.extra && <p className="text-[10px] mt-1" style={{ color: 'var(--gk-muted)' }}>{card.extra}</p>}
        </div>
      ))}
    </div>
  );
};

function OrderDetailModal({ order, onClose, theme }) {
  if (!order) return null;
  const shop = order.adminId && typeof order.adminId === 'object' ? order.adminId : {};
  const isCurrency = order.metalType === 'currency';
  const breakdown = !isCurrency ? getQuantityBreakdown(order) : null;
  const p = theme.primary;

  const primaryLabel = getTraditionalLabel(order);
  const subLabel     = getSubLabel(order);

  const statusConfig = {
    pending:   { label: 'Pending',   icon: '⏳', color: 'text-amber-400', bg: 'bg-amber-500/10',  border: 'border-amber-500/25'  },
    approved:  { label: 'Approved',  icon: '✓',  color: 'text-blue-400',  bg: 'bg-blue-500/10',   border: 'border-blue-500/25'   },
    completed: { label: 'Completed', icon: '✅', color: 'text-green-400', bg: 'bg-green-500/10',  border: 'border-green-500/25'  },
    rejected:  { label: 'Rejected',  icon: '❌', color: 'text-red-400',   bg: 'bg-red-500/10',    border: 'border-red-500/25'    },
  };
  const status = statusConfig[order.status] || statusConfig.pending;

  const typeConfig = {
    buy:  { label: 'Buy',  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/25'  },
    sell: { label: 'Sell', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  };
  const type = typeConfig[order.orderType] || typeConfig.buy;

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.classList.add('overflow-hidden');
    return () => { document.removeEventListener('keydown', handler); document.body.classList.remove('overflow-hidden'); };
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Order Details"
        className="fixed inset-x-0 bottom-0 z-50 max-w-2xl mx-auto rounded-t-2xl border-t border-x shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--gk-bg)', borderColor: 'var(--gk-border)' }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--gk-border)' }} />
        </div>

        <div className="sticky top-0 z-10 border-b px-5 py-3 flex items-center justify-between" style={{ background: 'var(--gk-bg)', borderColor: 'var(--gk-border)' }}>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge label={type.label} color={type.color} bg={type.bg} border={type.border} />
            <Badge label={status.label} icon={status.icon} color={status.color} bg={status.bg} border={status.border} />
            {order.metalType && (
              <Badge
                label={`${order.metalType === 'gold' ? '🪙' : order.metalType === 'silver' ? '🥈' : '💱'} ${order.metalType}${order.carat && order.metalType !== 'currency' ? ` · ${order.carat}` : ''}`}
                color="text-amber-400" bg="bg-amber-500/10" border="border-amber-500/25"
              />
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border transition-colors" style={{ borderColor: 'var(--gk-border)', background: 'var(--gk-card)', color: 'var(--gk-muted)' }}>✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Total Hero */}
          <div className="rounded-xl p-5 text-center" style={{ background: `linear-gradient(135deg, ${p}10, transparent)`, border: `1px solid ${p}20` }}>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--gk-muted)' }}>
              {order.status === 'completed' && order.finalizedAmount ? 'Final Amount' : 'Estimated Total'}
            </p>
            <p className="font-serif text-3xl md:text-4xl font-bold" style={{ color: p }}>
              PKR {fmt(order.status === 'completed' && order.finalizedAmount ? order.finalizedAmount : order.totalAmount)}
            </p>
            <div className="inline-flex flex-col items-center gap-0.5 mt-3 px-4 py-2 rounded-full" style={{ background: 'color-mix(in srgb, var(--gk-card) 80%, transparent)', border: '1px solid var(--gk-border)' }}>
              <span className="text-sm font-semibold" style={{ color: p }}>⚖️ {primaryLabel}</span>
              {subLabel && (
                <span className="text-[11px]" style={{ color: 'var(--gk-muted)' }}>{subLabel}</span>
              )}
            </div>
          </div>

          {/* Receipt */}
          {order.receiptNumber && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'color-mix(in srgb, var(--gk-card) 50%, transparent)', border: '1px solid var(--gk-border)' }}>
              <span className="text-lg" style={{ color: p }}>🧾</span>
              <div>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--gk-muted)' }}>Receipt Number</p>
                <p className="font-mono text-sm font-bold tracking-wide" style={{ color: p }}>{order.receiptNumber}</p>
              </div>
            </div>
          )}

          {/* Completion Summary */}
          {order.status === 'completed' && order.finalizedAmount != null && (
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: 'var(--gk-muted)' }}>Completion Summary</p>
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)' }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--gk-muted)' }}>Original Order Total</span>
                  <span className="font-semibold" style={{ color: 'var(--gk-text)' }}>PKR {fmt(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--gk-muted)' }}>Base Amount</span>
                  <span className="font-semibold" style={{ color: 'var(--gk-text)' }}>PKR {fmt(order.completionBaseAmount ?? order.totalAmount)}</span>
                </div>
                {order.extraCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--gk-muted)' }}>+ Extra Charges</span>
                    <span className="font-semibold text-green-400">PKR {fmt(order.extraCharges)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--gk-muted)' }}>− Discount</span>
                    <span className="font-semibold text-red-400">PKR {fmt(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base border-t pt-2" style={{ borderColor: 'rgba(74,222,128,0.2)' }}>
                  <span className="font-bold" style={{ color: 'var(--gk-text)' }}>Final Amount</span>
                  <span className="font-bold text-green-400">PKR {fmt(order.finalizedAmount)}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: order.paymentStatus === 'paid' ? '#4ade80' : '#fbbf24' }}>
                  {order.paymentStatus === 'paid' ? '✅ Payment Received' : '⏳ Payment Pending'}
                </p>
              </div>
            </div>
          )}

          {/* Shop */}
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: 'var(--gk-muted)' }}>Shop Details</p>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'color-mix(in srgb, var(--gk-card) 50%, transparent)', border: '1px solid var(--gk-border)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center font-serif text-xl font-bold" style={{ background: `${p}10`, border: `1px solid ${p}30`, color: p }}>
                {(shop?.shopName || 'G').charAt(0)}
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--gk-text)' }}>{shop?.shopName || 'Shop'}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--gk-muted)' }}>{shop?.phoneNumber || shop?.address || 'Contact not available'}</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: 'var(--gk-muted)' }}>Order Details</p>
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'color-mix(in srgb, var(--gk-card) 50%, transparent)', border: '1px solid var(--gk-border)' }}>
              {/* Quantity row */}
              <div className="py-2 border-b" style={{ borderColor: 'var(--gk-border)' }}>
                <div className="flex justify-between items-start">
                  <span className="text-sm" style={{ color: 'var(--gk-muted)' }}>Quantity</span>
                  <div className="text-right">
                    <p className="font-semibold text-sm" style={{ color: 'var(--gk-text)' }}>{primaryLabel}</p>
                    {subLabel && (
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--gk-muted)' }}>{subLabel}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Traditional units grid */}
              {!isCurrency && breakdown && <TraditionalUnitsDisplay order={order} theme={theme} />}

              <div className="space-y-2">
                {!isCurrency && (
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--gk-border)' }}>
                    <span className="text-sm" style={{ color: 'var(--gk-muted)' }}>Rate per Tola</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--gk-text)' }}>PKR {fmt(order.finalPricePerTolaPKR)}</span>
                  </div>
                )}
                {!isCurrency && order.finalPricePerTolaPKR && (
                  <>
                    <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--gk-border)' }}>
                      <span className="text-sm" style={{ color: 'var(--gk-muted)' }}>Rate per Gram</span>
                      <span className="font-semibold text-sm" style={{ color: 'var(--gk-text)' }}>PKR {fmt(order.finalPricePerTolaPKR / TOLA_IN_GRAMS)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--gk-border)' }}>
                      <span className="text-sm" style={{ color: 'var(--gk-muted)' }}>Rate per Masha</span>
                      <span className="font-semibold text-sm" style={{ color: 'var(--gk-text)' }}>PKR {fmt(order.finalPricePerTolaPKR / 12)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--gk-border)' }}>
                      <span className="text-sm" style={{ color: 'var(--gk-muted)' }}>Rate per Ratti</span>
                      <span className="font-semibold text-sm" style={{ color: 'var(--gk-text)' }}>PKR {fmt(order.finalPricePerTolaPKR / 96)}</span>
                    </div>
                  </>
                )}
                {order.paymentMethod && (
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--gk-border)' }}>
                    <span className="text-sm" style={{ color: 'var(--gk-muted)' }}>Payment Method</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--gk-text)' }}>{order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)}</span>
                  </div>
                )}
                {order.notes && (
                  <div className="flex justify-between py-2">
                    <span className="text-sm" style={{ color: 'var(--gk-muted)' }}>Special Instructions</span>
                    <span className="text-sm text-right max-w-[60%]" style={{ color: 'var(--gk-muted)' }}>{order.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          {order.status === 'rejected' && order.rejectionReason && (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-[10px] font-bold tracking-wider uppercase text-red-400 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-300">{order.rejectionReason}</p>
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: 'var(--gk-muted)' }}>Order Timeline</p>
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'color-mix(in srgb, var(--gk-card) 50%, transparent)', border: '1px solid var(--gk-border)' }}>
              {order.createdAt && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--gk-border) 50%, transparent)', color: 'var(--gk-muted)' }}>📅</div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--gk-muted)' }}>Order Created</p>
                    <p className="text-sm" style={{ color: 'var(--gk-text)' }}>{fmtDateTime(order.createdAt)}</p>
                  </div>
                </div>
              )}
              {order.approvedAt && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-blue-400" style={{ background: 'rgba(96,165,250,0.2)' }}>✓</div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--gk-muted)' }}>Order Approved</p>
                    <p className="text-sm" style={{ color: 'var(--gk-text)' }}>{fmtDateTime(order.approvedAt)}</p>
                  </div>
                </div>
              )}
              {order.paymentTime && (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-green-400" style={{ background: 'rgba(74,222,128,0.2)' }}>💰</div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--gk-muted)' }}>Transaction Completed</p>
                    <p className="text-sm" style={{ color: 'var(--gk-text)' }}>{fmtDateTime(order.paymentTime)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {order.inputMode && (
            <div className="text-center text-xs p-3 rounded-lg" style={{ background: 'color-mix(in srgb, var(--gk-card) 30%, transparent)', color: 'var(--gk-muted)' }}>
              📝 Quantity entered using <strong style={{ color: 'var(--gk-primary)' }}>{order.inputMode === 'traditional' ? 'Tola · Masha · Ratti' : 'Simple'}</strong> measurement system
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function OrderCard({ order, onClick, theme }) {
  const metalEmoji = { gold: '🪙', silver: '🥈', currency: '💱' };
  const [hover, setHover] = useState(false);
  const isCurrency = order.metalType === 'currency';
  const p = theme.primary;

  const primaryLabel = getTraditionalLabel(order);
  const subLabel     = getSubLabel(order);

  const statusConfig = {
    pending:   { label: 'Pending',   icon: '⏳', color: 'text-amber-400', bg: 'bg-amber-500/10',  border: 'border-amber-500/25'  },
    approved:  { label: 'Approved',  icon: '✓',  color: 'text-blue-400',  bg: 'bg-blue-500/10',   border: 'border-blue-500/25'   },
    completed: { label: 'Completed', icon: '✅', color: 'text-green-400', bg: 'bg-green-500/10',  border: 'border-green-500/25'  },
    rejected:  { label: 'Rejected',  icon: '❌', color: 'text-red-400',   bg: 'bg-red-500/10',    border: 'border-red-500/25'    },
  };
  const status = statusConfig[order.status] || statusConfig.pending;

  const typeConfig = {
    buy:  { label: 'Buy',  color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/25'  },
    sell: { label: 'Sell', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  };
  const type = typeConfig[order.orderType] || typeConfig.buy;

  const statusGradientColors = {
    pending:   '#fbbf24',
    approved:  '#60a5fa',
    completed: '#4ade80',
    rejected:  '#f87171',
  };

  const displayAmount = order.status === 'completed' && order.finalizedAmount != null
    ? order.finalizedAmount
    : order.totalAmount;
  const amountLabel = order.status === 'completed' && order.finalizedAmount != null
    ? 'Completed Amount'
    : 'Total';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="rounded-xl p-4 cursor-pointer transition-all duration-200 border"
      style={{
        background: hover ? `color-mix(in srgb, ${p} 5%, var(--gk-card))` : 'var(--gk-card)',
        borderColor: hover ? `${p}30` : 'var(--gk-border)',
      }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge label={type.label} color={type.color} bg={type.bg} border={type.border} />
          <span className="text-base">{metalEmoji[order.metalType] || '📦'}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--gk-muted)' }}>
            {order.metalType?.charAt(0).toUpperCase() + order.metalType?.slice(1)}
            {order.carat && order.metalType !== 'currency' && (
              <span className="text-xs ml-1" style={{ color: 'var(--gk-muted)' }}>· {order.carat}</span>
            )}
          </span>
        </div>
        <Badge label={status.label} icon={status.icon} color={status.color} bg={status.bg} border={status.border} />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex-1">
          <p className="font-semibold text-sm mb-0.5" style={{ color: p }}>
            {!isCurrency && <span className="mr-1">⚖️</span>}
            {primaryLabel}
          </p>
          {subLabel && (
            <p className="text-xs mb-1" style={{ color: 'var(--gk-muted)' }}>{subLabel}</p>
          )}
          {order.adminId?.shopName && (
            <p className="text-xs mb-1" style={{ color: 'var(--gk-muted)' }}>🏪 {order.adminId.shopName}</p>
          )}
          <p className="text-xs" style={{ color: 'var(--gk-muted)' }}>📅 {fmtDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--gk-muted)' }}>
            {amountLabel}
          </p>
          <p className="font-serif text-xl font-bold" style={{ color: p }}>
            PKR {fmt(displayAmount)}
          </p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-xs" style={{ color: 'var(--gk-muted)' }}>View Details</span>
            <span className="text-xs" style={{ color: 'var(--gk-muted)' }}>›</span>
          </div>
        </div>
      </div>

      <div className={`h-0.5 rounded-full mt-3 transition-all duration-200 ${hover ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: `linear-gradient(90deg, ${statusGradientColors[order.status] || '#888'}60, transparent)` }} />
    </div>
  );
}

function StatCard({ label, count, color, active, onClick, theme }) {
  const p = theme.primary;
  return (
    <button
      onClick={onClick}
      className="p-3 rounded-xl text-center transition-all duration-200 flex-1"
      style={{
        background: active ? `${p}10` : 'var(--gk-card)',
        border: active ? `1px solid ${p}40` : '1px solid var(--gk-border)',
        color: active ? p : 'var(--gk-muted)',
      }}
    >
      <p className={`font-serif text-3xl font-bold ${active ? '' : 'opacity-70'}`}>{count}</p>
      <p className="text-[10px] font-bold tracking-wider uppercase mt-1">{label}</p>
    </button>
  );
}

function EmptyState({ filter, onClear, onBrowse, theme }) {
  return (
    <div className="text-center py-14 px-6 rounded-xl border border-dashed" style={{ borderColor: 'var(--gk-border)', background: 'color-mix(in srgb, var(--gk-bg) 30%, transparent)' }}>
      <div className="text-5xl mb-4">{filter ? '🔍' : '🛍️'}</div>
      <p className="font-serif text-2xl font-bold mb-2" style={{ color: 'var(--gk-muted)' }}>
        {filter ? `No ${filter} orders` : 'No orders yet'}
      </p>
      <p className="text-sm max-w-xs mx-auto mb-6" style={{ color: 'var(--gk-muted)' }}>
        {filter ? `You don't have any ${filter} orders right now.` : 'Browse shops to place your first gold or silver order.'}
      </p>
      {filter ? (
        <button onClick={onClear} className="px-5 py-2 rounded-lg border text-sm font-semibold transition-colors" style={{ borderColor: 'var(--gk-border)', color: 'var(--gk-muted)' }}>
          Clear Filter
        </button>
      ) : (
        <button onClick={onBrowse} className="px-6 py-2.5 rounded-xl font-bold text-sm" style={{ background: 'var(--gk-gradient)', color: 'var(--gk-logo-text)' }}>
          Browse Shops
        </button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function MyOrders() {
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const p = theme.primary;

  const fetchOrders = useCallback(async (isRefresh = false) => {
    setError('');
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await getMyOrders(params);
      setOrders(res.data?.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const counts = useMemo(() => ({
    all:       orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    approved:  orders.filter(o => o.status === 'approved').length,
    completed: orders.filter(o => o.status === 'completed').length,
    rejected:  orders.filter(o => o.status === 'rejected').length,
  }), [orders]);

  const totalValue = useMemo(() => (
    orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (Number(o.finalizedAmount || o.totalAmount) || 0), 0)
  ), [orders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gk-bg)' }}>
        <Navbar />
        <div className="flex flex-col gap-4 items-center">
          <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: `${p}20`, borderTopColor: p }} />
          <p className="text-sm tracking-wider uppercase" style={{ color: 'var(--gk-muted)' }}>Loading orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gk-bg)', color: 'var(--gk-text)' }}>
      <Navbar />
      <div className="h-16" />

      {/* Sub-header bar */}
      <div className="sticky top-16 z-30 flex items-center justify-between px-4 sm:px-6 h-12 backdrop-blur-xl border-b" style={{ background: 'var(--gk-bg-scrolled)', borderColor: 'var(--gk-border)' }}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
          style={{ color: 'var(--gk-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = p}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--gk-muted)'}
        >
          ← Home
        </button>
        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--gk-muted)' }}>My Orders</span>
        <button
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-50"
          style={{ borderColor: 'var(--gk-border)', color: 'var(--gk-muted)' }}
        >
          <span className={refreshing ? 'animate-spin' : ''}>⟳</span>
          Refresh
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-7 pb-20">
        {/* Header */}
        <div className="mb-7 pb-5 border-b" style={{ borderColor: 'var(--gk-border)' }}>
          <p className="text-[10px] font-bold tracking-wider uppercase mb-1" style={{ color: 'var(--gk-muted)' }}>Transaction History</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">
            <span style={{ background: 'var(--gk-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>My Orders</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--gk-muted)' }}>
            {counts.all} order{counts.all !== 1 ? 's' : ''} · PKR {fmt(totalValue)} completed value
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { key: 'pending',   label: 'Pending'   },
            { key: 'approved',  label: 'Approved'  },
            { key: 'completed', label: 'Completed' },
            { key: 'rejected',  label: 'Rejected'  },
          ].map(({ key, label }) => (
            <StatCard
              key={key}
              label={label}
              count={counts[key]}
              active={statusFilter === key}
              onClick={() => setStatusFilter(prev => prev === key ? '' : key)}
              theme={theme}
            />
          ))}
        </div>

        {/* Filter Chip */}
        {statusFilter && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs" style={{ color: 'var(--gk-muted)' }}>Filtering by:</span>
            <button
              onClick={() => setStatusFilter('')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold"
              style={{ background: `${p}10`, borderColor: `${p}30`, color: p }}
            >
              {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              <span>✕</span>
            </button>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <EmptyState filter={statusFilter} onClear={() => setStatusFilter('')} onBrowse={() => navigate('/')} theme={theme} />
        ) : (
          <div className="space-y-2">
            {orders.map((order, i) => (
              <div key={order._id || i} className="animate-fadeIn" style={{ animationDelay: `${i * 0.04}s` }}>
                <OrderCard order={order} onClick={() => setSelectedOrder(order)} theme={theme} />
              </div>
            ))}
          </div>
        )}

        {/* Footer Stats */}
        {orders.length > 0 && (
          <div className="mt-7 p-4 rounded-xl border flex items-center justify-between flex-wrap gap-3" style={{ background: 'color-mix(in srgb, var(--gk-card) 50%, transparent)', borderColor: 'var(--gk-border)' }}>
            <div>
              <p className="text-[9px] font-bold tracking-wider uppercase mb-0.5" style={{ color: 'var(--gk-muted)' }}>Total Completed Value</p>
              <p className="font-serif text-xl font-bold" style={{ color: p }}>PKR {fmt(totalValue)}</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="font-serif text-xl font-bold text-green-400">{orders.filter(o => o.orderType === 'buy').length}</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--gk-muted)' }}>Buy Orders</p>
              </div>
              <div className="text-center">
                <p className="font-serif text-xl font-bold text-orange-400">{orders.filter(o => o.orderType === 'sell').length}</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--gk-muted)' }}>Sell Orders</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} theme={theme} />
      )}
    </div>
  );
}