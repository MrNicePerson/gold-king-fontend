// frontend/src/pages/Super_Admin_Dashboard/AllCustomers.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
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

const AVATAR_PALETTE = [
  ['#C9B037', '#8B7520'], ['#1a7a5c', '#0f4d39'],
  ['#2563EB', '#1e40af'], ['#DC2626', '#991b1b'],
  ['#7C3AED', '#5b21b6'], ['#D97706', '#92400e'],
  ['#0891B2', '#0e7490'], ['#BE185D', '#9d174d'],
];
const avatarGrad = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];

// ─── Theme tokens ──────────────────────────────────────────────────────────────
function useThemeTokens() {
  const { theme, isLightTheme } = useTheme();
  const t = {
    page:    isLightTheme ? (theme.pageBg ?? '#f2f1ed') : (theme.bg ?? '#0c0c0c'),
    card:    isLightTheme ? '#ffffff' : '#1a1a1a',
    section: isLightTheme ? '#f9fafb' : '#1f1f1f',
    border:  isLightTheme ? '#f3f4f6' : '#2a2a2a',
    border2: isLightTheme ? '#e5e7eb' : '#374151',
    text:    isLightTheme ? '#111827' : '#e5e7eb',
    text2:   isLightTheme ? '#374151' : '#d1d5db',
    muted:   isLightTheme ? '#9ca3af' : '#6b7280',
    muted2:  isLightTheme ? '#6b7280' : '#9ca3af',
    input:   isLightTheme ? '#ffffff' : '#1f1f1f',
    hover:   isLightTheme ? 'rgba(249,250,251,0.8)' : 'rgba(255,255,255,0.04)',
    accent:  isLightTheme ? '#111827' : '#e5e7eb',
    accentBg: isLightTheme ? '#111827' : '#374151',
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
  hash:      'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
  history:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  xCircle:   'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  checkCirc: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  user:      'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  filter:    'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
  chevLeft:  'M15 19l-7-7 7-7',
  chevRight: 'M9 5l7 7-7 7',
  arrowLeft: 'M10 19l-7-7m0 0l7-7m-7 7h18',
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
function useFlagStatusStyle(isFlagged, isTrusted, isLight) {
  if (isFlagged) return isLight
    ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
    : { bg: 'rgba(220,38,38,0.15)', color: '#fca5a5', border: 'rgba(220,38,38,0.3)' };
  if (isTrusted) return isLight
    ? { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' }
    : { bg: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: 'rgba(59,130,246,0.3)' };
  return isLight
    ? { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' }
    : { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' };
}

function StatusBadge({ isFlagged, isTrusted }) {
  const { isLightTheme } = useTheme();
  const s = useFlagStatusStyle(isFlagged, isTrusted, isLightTheme);
  const style = { background: s.bg, color: s.color, borderColor: s.border };
  if (isFlagged)
    return <span style={style} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"><I p={IC.flag} className="w-2.5 h-2.5" />Flagged</span>;
  if (isTrusted)
    return <span style={style} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"><I p={IC.shield} className="w-2.5 h-2.5" />Trusted</span>;
  return <span style={style} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border"><I p={IC.checkCirc} className="w-2.5 h-2.5" />Active</span>;
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
  return map[status] || (isLight ? { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' } : { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', border: 'rgba(107,114,128,0.3)' });
}

function OrderStatusBadge({ status }) {
  const { isLightTheme } = useTheme();
  const s = useOrderStatusStyle(status, isLightTheme);
  const label = { pending: 'Pending', approved: 'Approved', completed: 'Completed', rejected: 'Rejected' }[status] || status;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border" style={{ background: s.bg, color: s.color, borderColor: s.border }}>
      {label}
    </span>
  );
}

// ─── Customer Detail View (Separate Page/Tab) ──────────────────────────────────
function CustomerDetailView({ customer, onBack }) {
  const { isLightTheme, t } = useThemeTokens();
  const [activeTab, setActiveTab] = useState('orders');
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState({ status: 'all', type: 'all', search: '' });
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPages, setOrderPages] = useState(1);
  const [orderLimit, setOrderLimit] = useState(20);

  // Fetch customer details
  useEffect(() => {
    if (!customer) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const response = await saAPI.getCustomerDetails(customer._id);
        setCustomerDetails(response.data?.customer);
      } catch (error) {
        console.error('Failed to fetch customer details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [customer]);

  // Fetch customer orders with pagination
  const fetchOrders = useCallback(async () => {
    if (!customer) return;
    setOrdersLoading(true);
    try {
      const params = {
        page: orderPage,
        limit: orderLimit,
        status: orderFilter.status,
        orderType: orderFilter.type,
        search: orderFilter.search,
      };
      const response = await saAPI.getCustomerOrders(customer._id, params);
      setOrders(response.data?.orders || []);
      setOrderTotal(response.data?.total || 0);
      setOrderPages(response.data?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  }, [customer, orderPage, orderLimit, orderFilter]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  // Reset pagination when filters change
  useEffect(() => {
    setOrderPage(1);
  }, [orderFilter]);

  const getOrderIcon = (orderType) => orderType === 'buy' ? '↓' : '↑';
  const getOrderColor = (orderType) => orderType === 'buy' ? '#3B82F6' : '#D97706';

  const shopStatuses = customerDetails?.shopStatuses || [];

  if (!customer) return null;

  const selectStyle = {
    background: t.input, borderColor: t.border2, color: t.text2,
    backgroundImage: t.selectArrow, backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 6px center', paddingRight: '24px',
  };

  return (
    <div className="min-h-screen" style={{ background: t.page }}>
      {/* Header */}
      <div className="border-b" style={{ background: t.card, borderColor: t.border }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 mb-4 transition"
            style={{ color: t.muted2 }}
          >
            <I p={IC.arrowLeft} className="w-4 h-4" />
            <span className="text-sm font-semibold">Back to All Customers</span>
          </button>

          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <Avatar name={customer.name} size={48} radius={14} />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold truncate" style={{ color: t.text }}>{customer.name}</h1>
              <p className="text-xs sm:text-sm truncate" style={{ color: t.muted }}>{customer.email}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <StatusBadge isFlagged={customer.isFlagged} isTrusted={customer.isTrusted} />
                {customer.phoneNumber && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: t.section, color: t.muted2 }}>
                    <I p={IC.phone} className="w-2.5 h-2.5" /> {customer.phoneNumber}
                  </span>
                )}
                {customer.city && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: t.section, color: t.muted2 }}>
                    <I p={IC.location} className="w-2.5 h-2.5" /> {customer.city}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b sticky top-0 z-10" style={{ background: t.card, borderColor: t.border }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex gap-4 sm:gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('orders')}
              className="px-1 sm:px-2 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2"
              style={activeTab === 'orders' ? { color: t.text, borderColor: t.accentBg } : { color: t.muted, borderColor: 'transparent' }}
            >
              📋 Orders ({customerDetails?.orderStats?.total || 0})
            </button>
            <button
              onClick={() => setActiveTab('shops')}
              className="px-1 sm:px-2 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2"
              style={activeTab === 'shops' ? { color: t.text, borderColor: t.accentBg } : { color: t.muted, borderColor: 'transparent' }}
            >
              🏪 Shops ({shopStatuses.length})
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className="px-1 sm:px-2 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2"
              style={activeTab === 'details' ? { color: t.text, borderColor: t.accentBg } : { color: t.muted, borderColor: 'transparent' }}
            >
              👤 Details
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {loading && activeTab !== 'orders' ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: t.border2, borderTopColor: t.text }} />
          </div>
        ) : (
          <>
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div>
                {/* Order Filters */}
                <div className="rounded-xl border p-4 mb-5" style={{ background: t.card, borderColor: t.border }}>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold" style={{ color: t.muted2 }}>Status:</span>
                      <div className="flex gap-1 flex-wrap">
                        {['all', 'pending', 'approved', 'completed', 'rejected'].map(s => (
                          <button
                            key={s}
                            onClick={() => setOrderFilter(prev => ({ ...prev, status: s }))}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all"
                            style={orderFilter.status === s ? { background: t.accentBg, color: '#fff' } : { background: t.section, color: t.muted2 }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: t.muted2 }}>Type:</span>
                      <div className="flex gap-1">
                        {['all', 'buy', 'sell'].map(ty => (
                          <button
                            key={ty}
                            onClick={() => setOrderFilter(prev => ({ ...prev, type: ty }))}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold capitalize transition-all"
                            style={orderFilter.type === ty ? { background: t.accentBg, color: '#fff' } : { background: t.section, color: t.muted2 }}
                          >
                            {ty === 'all' ? 'All' : ty}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 relative min-w-[180px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.muted }}>
                        <I p={IC.search} className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        value={orderFilter.search}
                        onChange={(e) => setOrderFilter(prev => ({ ...prev, search: e.target.value }))}
                        placeholder="Search by receipt #, metal type..."
                        className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none transition-colors"
                        style={{ background: t.input, borderColor: t.border2, color: t.text2 }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: t.muted2 }}>Show:</span>
                      <select
                        value={orderLimit}
                        onChange={(e) => { setOrderLimit(Number(e.target.value)); setOrderPage(1); }}
                        className="px-2 py-1 text-sm border rounded-lg appearance-none outline-none"
                        style={selectStyle}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Orders List */}
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: t.border2, borderTopColor: t.text }} />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="rounded-xl border text-center py-12" style={{ background: t.card, borderColor: t.border }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: t.section }}>
                      <I p={IC.history} className="w-8 h-8" style={{ color: t.muted }} />
                    </div>
                    <p style={{ color: t.muted2 }}>No orders found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order._id} className="rounded-xl border p-4 hover:shadow-md transition-shadow" style={{ background: t.card, borderColor: t.border }}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ background: t.section, color: getOrderColor(order.orderType) }}>
                              {getOrderIcon(order.orderType)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold" style={{ color: t.text }}>
                                  {order.orderType === 'buy' ? 'Buy Order' : 'Sell Order'}
                                </span>
                                <OrderStatusBadge status={order.status} />
                              </div>
                              <p className="text-xs mt-1" style={{ color: t.muted2 }}>
                                {order.metalType} {order.carat && `· ${order.carat}`} · {order.quantity} {order.unit}
                              </p>
                              {order.receiptNumber && (
                                <p className="text-xs font-mono mt-1" style={{ color: '#D97706' }}>Receipt: #{order.receiptNumber}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base sm:text-lg font-extrabold" style={{ color: t.text }}>PKR {fmt(order.finalizedAmount || order.totalAmount)}</p>
                            <p className="text-xs" style={{ color: t.muted }}>{fmtDateTime(order.createdAt)}</p>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 sm:gap-4 text-xs" style={{ borderColor: t.border, color: t.muted2 }}>
                          <span className="flex items-center gap-1">
                            <I p={IC.shop} className="w-3 h-3" />
                            Shop: {order.adminId?.shopName || order.adminId?.name || 'N/A'}
                          </span>
                          {order.paymentMethod && (
                            <span>Payment: {order.paymentMethod}</span>
                          )}
                          {order.approvedAt && (
                            <span>Approved: {fmtDate(order.approvedAt)}</span>
                          )}
                          {order.completedAt && (
                            <span>Completed: {fmtDate(order.completedAt)}</span>
                          )}
                          {order.rejectionReason && (
                            <span className="text-red-500">Rejected: {order.rejectionReason}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {orderPages > 1 && (
                  <div className="mt-5 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: t.border }}>
                    <p className="text-xs" style={{ color: t.muted }}>
                      Showing {((orderPage - 1) * orderLimit) + 1} to {Math.min(orderPage * orderLimit, orderTotal)} of {orderTotal} orders
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                        disabled={orderPage <= 1}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition"
                        style={{ background: t.input, borderColor: t.border2, color: t.text2 }}
                      >
                        <I p={IC.chevLeft} className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 text-sm" style={{ color: t.muted2 }}>
                        Page {orderPage} of {orderPages}
                      </span>
                      <button
                        onClick={() => setOrderPage(p => Math.min(orderPages, p + 1))}
                        disabled={orderPage >= orderPages}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition"
                        style={{ background: t.input, borderColor: t.border2, color: t.text2 }}
                      >
                        <I p={IC.chevRight} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SHOPS TAB */}
            {activeTab === 'shops' && (
              <div>
                {shopStatuses.length === 0 ? (
                  <div className="rounded-xl border text-center py-12" style={{ background: t.card, borderColor: t.border }}>
                    <I p={IC.shop} className="w-12 h-12 mx-auto mb-3" style={{ color: t.border2 }} />
                    <p style={{ color: t.muted2 }}>No shops associated with this customer</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {shopStatuses.map((rel, idx) => {
                      const shop = customerDetails?.shops?.find(s => s._id === rel.shopId) || {};
                      return (
                        <div key={idx} className="rounded-xl border p-4 hover:shadow-md transition-shadow" style={{ background: t.card, borderColor: t.border }}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <I p={IC.shop} className="w-5 h-5" style={{ color: t.muted }} />
                                <p className="font-bold" style={{ color: t.text }}>{shop.shopName || 'Unknown Shop'}</p>
                              </div>
                              {shop.phoneNumber && (
                                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: t.muted2 }}>
                                  <I p={IC.phone} className="w-3 h-3" /> {shop.phoneNumber}
                                </p>
                              )}
                              {shop.city && (
                                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: t.muted }}>
                                  <I p={IC.location} className="w-3 h-3" /> {shop.city}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {rel.isTrusted && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{ background: isLightTheme ? '#eff6ff' : 'rgba(59,130,246,0.15)', color: isLightTheme ? '#1d4ed8' : '#93c5fd', borderColor: isLightTheme ? '#bfdbfe' : 'rgba(59,130,246,0.3)' }}>
                                  <I p={IC.shield} className="w-2.5 h-2.5" /> Trusted
                                </span>
                              )}
                              {rel.isFlagged && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{ background: isLightTheme ? '#fef2f2' : 'rgba(220,38,38,0.15)', color: isLightTheme ? '#dc2626' : '#fca5a5', borderColor: isLightTheme ? '#fecaca' : 'rgba(220,38,38,0.3)' }}>
                                  <I p={IC.flag} className="w-2.5 h-2.5" /> Flagged
                                </span>
                              )}
                            </div>
                          </div>
                          {rel.isFlagged && rel.flagReason && (
                            <div className="mt-3 pt-2 border-t" style={{ borderColor: t.border }}>
                              <p className="text-xs text-red-500">Reason: {rel.flagReason}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* DETAILS TAB */}
            {activeTab === 'details' && customerDetails && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Stats Card */}
                <div className="rounded-xl p-5 border" style={{
                  background: isLightTheme ? 'linear-gradient(135deg, #fffbeb, #fefce8)' : 'linear-gradient(135deg, rgba(217,119,6,0.08), rgba(217,119,6,0.03))',
                  borderColor: isLightTheme ? '#fde68a' : 'rgba(217,119,6,0.25)'
                }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider mb-4" style={{ color: '#D97706' }}>Activity Summary</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {[
                      { label: 'Total Orders', value: customerDetails.orderStats?.total || 0 },
                      { label: 'Pending', value: customerDetails.orderStats?.pending || 0 },
                      { label: 'Approved', value: customerDetails.orderStats?.approved || 0 },
                      { label: 'Completed', value: customerDetails.orderStats?.completed || 0 },
                      { label: 'Rejected', value: customerDetails.orderStats?.rejected || 0 },
                      { label: 'Bought', value: customerDetails.orderStats?.buyOrders || 0 },
                      { label: 'Sold', value: customerDetails.orderStats?.sellOrders || 0 },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl py-2 text-center" style={{ background: t.card }}>
                        <p className="text-lg sm:text-xl font-extrabold" style={{ color: t.text }}>{value}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: t.muted }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  {(customerDetails.orderStats?.totalSpent > 0) && (
                    <div className="mt-4 pt-3 border-t text-center" style={{ borderColor: isLightTheme ? '#fde68a' : 'rgba(217,119,6,0.25)' }}>
                      <p className="text-base font-extrabold" style={{ color: '#D97706' }}>PKR {fmt(customerDetails.orderStats?.totalSpent)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: t.muted }}>Total Volume</p>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="rounded-xl border p-5" style={{ background: t.card, borderColor: t.border }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider mb-4" style={{ color: t.muted }}>Contact Information</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <I p={IC.mail} className="w-4 h-4 mt-0.5" style={{ color: t.muted }} />
                      <div>
                        <p className="text-[10px] font-bold uppercase" style={{ color: t.muted }}>Email</p>
                        <p className="text-sm" style={{ color: t.text2 }}>{customerDetails.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <I p={IC.phone} className="w-4 h-4 mt-0.5" style={{ color: t.muted }} />
                      <div>
                        <p className="text-[10px] font-bold uppercase" style={{ color: t.muted }}>Phone</p>
                        <p className="text-sm" style={{ color: t.text2 }}>{customerDetails.phoneNumber || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <I p={IC.phone} className="w-4 h-4 mt-0.5" style={{ color: t.muted }} />
                      <div>
                        <p className="text-[10px] font-bold uppercase" style={{ color: t.muted }}>WhatsApp</p>
                        <p className="text-sm" style={{ color: t.text2 }}>{customerDetails.whatsappNumber || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <I p={IC.location} className="w-4 h-4 mt-0.5" style={{ color: t.muted }} />
                      <div>
                        <p className="text-[10px] font-bold uppercase" style={{ color: t.muted }}>City</p>
                        <p className="text-sm" style={{ color: t.text2 }}>{customerDetails.city || '—'}</p>
                      </div>
                    </div>
                    {customerDetails.address && (
                      <div className="flex items-start gap-3 pt-2 border-t" style={{ borderColor: t.border }}>
                        <I p={IC.location} className="w-4 h-4 mt-0.5" style={{ color: t.muted }} />
                        <div>
                          <p className="text-[10px] font-bold uppercase" style={{ color: t.muted }}>Address</p>
                          <p className="text-sm" style={{ color: t.text2 }}>{customerDetails.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Flag Reason */}
                {customerDetails.isFlagged && customerDetails.flagReason && (
                  <div className="lg:col-span-2 rounded-xl border p-4" style={{ background: isLightTheme ? '#fef2f2' : 'rgba(220,38,38,0.1)', borderColor: isLightTheme ? '#fecaca' : 'rgba(220,38,38,0.3)' }}>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider mb-1 text-red-500">Flag Reason</p>
                    <p className="text-sm text-red-500">{customerDetails.flagReason}</p>
                  </div>
                )}

                {/* Account Info */}
                <div className="rounded-xl border p-5" style={{ background: t.card, borderColor: t.border }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider mb-4" style={{ color: t.muted }}>Account Details</p>
                  <div className="flex items-start gap-3">
                    <I p={IC.calendar} className="w-4 h-4 mt-0.5" style={{ color: t.muted }} />
                    <div>
                      <p className="text-[10px] font-bold uppercase" style={{ color: t.muted }}>Registered</p>
                      <p className="text-sm" style={{ color: t.text2 }}>{fmtDateTime(customerDetails.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Customer Row (Desktop) ────────────────────────────────────────────────────
function CustomerRow({ customer, onView }) {
  const { t } = useThemeTokens();
  return (
    <tr
      className="border-b transition-colors cursor-pointer"
      style={{ borderColor: t.border }}
      onClick={() => onView(customer)}
      onMouseEnter={e => e.currentTarget.style.background = t.hover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={customer.name} size={36} radius={10} />
          <div>
            <p className="font-bold text-sm" style={{ color: t.text }}>{customer.name}</p>
            <p className="text-[11px] truncate max-w-[200px]" style={{ color: t.muted }}>{customer.email}</p>
            <div className="flex gap-1 mt-0.5 flex-wrap">
              <StatusBadge isFlagged={customer.isFlagged} isTrusted={customer.isTrusted} />
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm" style={{ color: t.text2 }}>{customer.phoneNumber || '—'}</td>
      <td className="px-4 py-3 text-sm" style={{ color: t.text2 }}>{customer.city || '—'}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#3B82F6' }}>↓</span>
          <span className="font-bold text-sm" style={{ color: '#3B82F6' }}>{customer.buyOrders || 0}</span>
          <span style={{ color: t.border2 }}>·</span>
          <span className="text-xs" style={{ color: '#D97706' }}>↑</span>
          <span className="font-bold text-sm" style={{ color: '#D97706' }}>{customer.sellOrders || 0}</span>
        </div>
      </td>
      <td className="px-4 py-3"><span className="font-bold text-sm" style={{ color: t.text }}>{customer.totalOrders || 0}</span></td>
      <td className="px-4 py-3">
        {customer.shopCount > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{ background: isLightTheme(t) ? '#faf5ff' : 'rgba(124,58,237,0.15)', color: isLightTheme(t) ? '#7c3aed' : '#c4b5fd', borderColor: isLightTheme(t) ? '#e9d5ff' : 'rgba(124,58,237,0.3)' }}>
            {customer.shopCount} shop{customer.shopCount !== 1 ? 's' : ''}
          </span>
        ) : <span style={{ color: t.border2 }}>—</span>}
      </td>
      <td className="px-4 py-3">
        {customer.totalSpent > 0
          ? <p className="text-sm font-bold" style={{ color: '#D97706' }}>PKR {fmt(customer.totalSpent)}</p>
          : <span style={{ color: t.border2 }}>—</span>}
      </td>
      <td className="px-4 py-3 text-xs" style={{ color: t.muted }}>{fmtDate(customer.createdAt)}</td>
      <td className="px-4 py-3">
        <button
          onClick={(e) => { e.stopPropagation(); onView(customer); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all"
          style={{ background: t.section, color: t.muted2, borderColor: t.border2 }}
        >
          <I p={IC.eye} className="w-3.5 h-3.5" /> View
        </button>
      </td>
    </tr>
  );
}
// helper used above (kept tiny + local to avoid extra hook calls inside JSX)
function isLightTheme(t) { return t.page === '#f2f1ed' || t.card === '#ffffff'; }

// ─── Customer Card (Mobile) ────────────────────────────────────────────────────
function CustomerCard({ customer, onView }) {
  const { isLightTheme: isLight, t } = useThemeTokens();
  return (
    <div className="rounded-xl p-4 mb-2.5 shadow-sm border" style={{ background: t.card, borderColor: t.border }}>
      <div className="flex gap-3 mb-3">
        <Avatar name={customer.name} size={44} radius={12} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold truncate" style={{ color: t.text }}>{customer.name}</p>
          <p className="text-[11px] truncate" style={{ color: t.muted }}>{customer.email}</p>
          <p className="text-[11px]" style={{ color: t.muted }}>{customer.phoneNumber}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            <StatusBadge isFlagged={customer.isFlagged} isTrusted={customer.isTrusted} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3 rounded-lg p-2.5" style={{ background: t.section }}>
        <div className="text-center">
          <p className="text-lg font-extrabold" style={{ color: t.text }}>{customer.totalOrders || 0}</p>
          <p className="text-[9px] font-bold uppercase" style={{ color: t.muted }}>Total</p>
        </div>
        <div className="text-center border-x" style={{ borderColor: t.border2 }}>
          <p className="text-lg font-extrabold" style={{ color: '#3B82F6' }}>{customer.buyOrders || 0}</p>
          <p className="text-[9px] font-bold uppercase" style={{ color: t.muted }}>Bought</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-extrabold" style={{ color: '#D97706' }}>{customer.sellOrders || 0}</p>
          <p className="text-[9px] font-bold uppercase" style={{ color: t.muted }}>Sold</p>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div>
          {customer.totalSpent > 0 && <p className="text-xs font-bold" style={{ color: '#D97706' }}>PKR {fmt(customer.totalSpent)}</p>}
          {customer.shopCount > 0 && <p className="text-[10px]" style={{ color: t.muted }}>{customer.shopCount} shops</p>}
        </div>
        <button
          onClick={() => onView(customer)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all"
          style={{ background: t.section, color: t.muted2, borderColor: t.border2 }}
        >
          <I p={IC.eye} className="w-3.5 h-3.5" /> View
        </button>
      </div>
    </div>
  );
}

// ─── Pagination Component ──────────────────────────────────────────────────────
function Pagination({ page, pages, total, limit, onChangePage, onLimitChange }) {
  const { t } = useThemeTokens();

  const buildPages = () => {
    if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
    const result = [1];
    if (page > 3) result.push('...');
    const start = Math.max(2, page - 1);
    const end = Math.min(pages - 1, page + 1);
    for (let i = start; i <= end; i++) result.push(i);
    if (page < pages - 2) result.push('...');
    result.push(pages);
    return result;
  };

  return (
    <div className="px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: t.border, background: t.section }}>
      <div className="flex items-center gap-3 flex-wrap justify-center text-center sm:text-left">
        <p className="text-xs" style={{ color: t.muted }}>
          Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} customers
        </p>
        <select
          value={limit}
          onChange={(e) => { onLimitChange(Number(e.target.value)); }}
          className="px-2 py-1 text-xs border rounded-lg appearance-none outline-none"
          style={{
            background: t.input, borderColor: t.border2, color: t.text2,
            backgroundImage: t.selectArrow, backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 6px center', paddingRight: '24px',
          }}
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={30}>30 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onChangePage(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition"
          style={{ background: t.input, borderColor: t.border2, color: t.text2 }}
        >
          <I p={IC.chevLeft} className="w-4 h-4" />
        </button>
        {buildPages().map((p, i) => (
          p === '...' ? (
            <span key={`dot-${i}`} className="w-8 h-8 flex items-center justify-center" style={{ color: t.muted }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChangePage(p)}
              className="w-8 h-8 rounded-lg text-xs font-bold transition border"
              style={p === page ? { background: t.accentBg, color: '#fff', borderColor: t.accentBg } : { background: t.input, borderColor: t.border2, color: t.text2 }}
            >
              {p}
            </button>
          )
        ))}
        <button
          onClick={() => onChangePage(page + 1)}
          disabled={page >= pages}
          className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition"
          style={{ background: t.input, borderColor: t.border2, color: t.text2 }}
        >
          <I p={IC.chevRight} className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AllCustomers() {
  const { isLightTheme: isLight, t } = useThemeTokens();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterFlagged, setFilterFlagged] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  // Fetch customers
  const fetchCustomers = useCallback(async (isRefresh = false, currentPage = page, currentLimit = limit) => {
    setError('');
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: currentLimit,
        ...(filterFlagged === 'flagged' && { isFlagged: 'true' }),
      };
      const response = await saAPI.getCustomers(params);
      const data = response.data || response;
      setCustomers(data.customers || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, filterFlagged]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pages) return;
    setPage(newPage);
    fetchCustomers(false, newPage, limit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    fetchCustomers(false, 1, newLimit);
  };

  const handleFilterChange = (val) => {
    setFilterFlagged(val);
    setPage(1);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailView(true);
  };

  const handleBackToList = () => {
    setShowDetailView(false);
    setSelectedCustomer(null);
  };

  // Filter customers by search
  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phoneNumber?.includes(q) ||
      c.city?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const counts = {
    total: total,
    flagged: customers.filter(c => c.isFlagged).length,
    active: customers.filter(c => !c.isFlagged).length,
  };

  // Show detail view if a customer is selected
  if (showDetailView && selectedCustomer) {
    return <CustomerDetailView customer={selectedCustomer} onBack={handleBackToList} />;
  }

  // Loading state
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]" style={{ background: t.page }}>
      <div className="text-center">
        <div className="w-12 h-12 border-[3px] rounded-full animate-spin mx-auto mb-4" style={{ borderColor: t.border2, borderTopColor: t.text }} />
        <p className="text-sm" style={{ color: t.muted }}>Loading customers...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6" style={{ background: t.page }}>
      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-red-500" style={{ background: isLight ? '#fef2f2' : 'rgba(220,38,38,0.15)' }}>
        <I p={IC.alert} className="w-7 h-7" />
      </div>
      <div>
        <p className="font-extrabold text-lg mb-1.5" style={{ color: t.text }}>Failed to load customers</p>
        <p className="text-sm" style={{ color: t.muted }}>{error}</p>
      </div>
      <button onClick={() => fetchCustomers(true)} className="px-4 py-2 text-white text-sm font-bold rounded-xl transition" style={{ background: t.accentBg }}>
        Try Again
      </button>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-4 pb-12" style={{ background: t.page }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: t.text }}>All Customers</h1>
          <p className="text-sm mt-0.5" style={{ color: t.muted }}>
            Every registered customer across all shops — <span className="font-bold" style={{ color: t.muted2 }}>{fmt(total)}</span> total
          </p>
        </div>
        <button
          onClick={() => fetchCustomers(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition disabled:opacity-50 shrink-0 self-start"
          style={{ background: t.card, borderColor: t.border2, color: t.text2 }}
        >
          <I p={IC.refresh} className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        {[
          { label: 'Total Customers', value: counts.total, color: t.text, bg: t.section },
          { label: 'Active', value: counts.active, color: '#059669', bg: isLight ? '#ecfdf5' : 'rgba(16,185,129,0.1)' },
          { label: 'Flagged', value: counts.flagged, color: '#dc2626', bg: isLight ? '#fef2f2' : 'rgba(220,38,38,0.1)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="rounded-2xl p-3 sm:p-4 text-center" style={{ background: bg }}>
            <p className="text-xl sm:text-2xl font-extrabold" style={{ color }}>{value}</p>
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: t.muted }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.muted }}>
            <I p={IC.search} className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, city..."
            className="w-full py-2.5 pl-9 pr-4 border rounded-xl text-sm outline-none transition"
            style={{ background: t.card, borderColor: t.border2, color: t.text }}
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All Customers' },
            { value: 'flagged', label: 'Flagged Only' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleFilterChange(value)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition flex-1 sm:flex-none whitespace-nowrap border"
              style={filterFlagged === value ? { background: t.accentBg, color: '#fff', borderColor: t.accentBg } : { background: t.card, borderColor: t.border2, color: t.muted2 }}
            >
              {label}
            </button>
          ))}
        </div>
        {(search || filterFlagged !== 'all') && (
          <button
            onClick={() => { setSearch(''); handleFilterChange('all'); }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition"
            style={{ background: t.card, borderColor: t.border2, color: t.muted }}
          >
            <I p={IC.close} className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="rounded-2xl text-center py-16 border" style={{ background: t.card, borderColor: t.border }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: t.section }}>
            <I p={IC.user} className="w-8 h-8" style={{ color: t.muted }} />
          </div>
          <p className="font-bold" style={{ color: t.muted2 }}>
            {search || filterFlagged !== 'all' ? 'No customers match your filters' : 'No customers yet'}
          </p>
          <p className="text-sm mt-1" style={{ color: t.muted }}>
            {search || filterFlagged !== 'all' ? 'Try adjusting your search or filters' : 'Customers will appear here once they register'}
          </p>
        </div>
      ) : isMobile ? (
        <div>
          {filteredCustomers.map(c => (
            <CustomerCard key={c._id} customer={c} onView={handleViewCustomer} />
          ))}
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: t.border }}>
            <Pagination
              page={page}
              pages={pages}
              total={total}
              limit={limit}
              onChangePage={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border" style={{ background: t.card, borderColor: t.border }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b" style={{ borderColor: t.border, background: t.section }}>
                  {['Customer', 'Phone', 'City', 'Buy/Sell', 'Orders', 'Shops', 'Volume', 'Joined', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap" style={{ color: t.muted }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <CustomerRow key={c._id} customer={c} onView={handleViewCustomer} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pages={pages}
            total={total}
            limit={limit}
            onChangePage={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      )}

      {/* Toast */}
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: 'success' })} />
    </div>
  );
}