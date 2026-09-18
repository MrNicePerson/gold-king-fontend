// frontend/src/pages/Admin_Dashboard/Prices.jsx
// Admin's dedicated page for viewing live prices and setting their own markup/difference
import { useState, useEffect, useCallback } from 'react';
import * as adminAPI from '../../services/adminApi';
import { useLivePrices } from '../../hooks/useLivePrices';
import { useTheme } from '../../contexts/ThemeContext';

// ─── Helpers ──────────────────────────────────────────────
const fmt = (n, digits = 0) =>
  n != null && !isNaN(Number(n))
    ? Number(n).toLocaleString('en-PK', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : '—';

const sanitiseDiff = (raw) => {
  let v = raw.replace(/[^0-9.\-]/g, '');
  if (v.indexOf('-') > 0) v = v.replace(/-/g, '');
  else if ((v.match(/-/g) || []).length > 1) v = '-' + v.replace(/-/g, '');
  const parts = v.split('.');
  if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
  return v;
};

const CURRENCY_META = {
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  SAR: { name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  AED: { name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺' },
  GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  CHF: { name: 'Swiss Franc', symbol: '₣', flag: '🇨🇭' },
};

// ─── FIX: getRawCurrencies helper (matches super admin) ───
const getRawCurrencies = (livePricesData) => {
  if (!livePricesData?.currencies) return {};
  if (livePricesData.currencies.live) return livePricesData.currencies.live;
  return livePricesData.currencies;
};

// ─── Icons ────────────────────────────────────────────────
const IconRefresh = ({ spin }) => (
  <svg className={`w-4 h-4 ${spin ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconGold = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v10M9.5 9.5 12 7l2.5 2.5M9.5 14.5 12 17l2.5-2.5" />
  </svg>
);

const IconSilver = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
  </svg>
);

const IconCurrency = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const IconAlert = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const IconInfo = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── Toast (themed) ───────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  const isError = type === 'error';
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold max-w-[calc(100vw-3rem)]"
      style={{ background: isError ? '#ef4444' : '#10b981', color: 'white' }}
    >
      {isError ? <IconAlert /> : <IconCheck />}
      <span className="flex-1 min-w-0 break-words">{msg}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100 text-lg leading-none shrink-0">×</button>
    </div>
  );
}

// ─── Spinner (themed) ─────────────────────────────────────
function PageSpinner() {
  const { theme } = useTheme();
  return (
    <div className="flex items-center justify-center min-h-96 gap-4">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${theme.primary}30` }} />
        <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: theme.primary }} />
      </div>
      <span className="text-sm font-medium" style={{ color: theme.textMuted }}>Loading live prices…</span>
    </div>
  );
}

// ─── Live price card (themed) ─────────────────────────────
function PriceCard({ label, pkrTola, usdOz, subLabel, icon, iconColor }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
      style={{
        background: isLightTheme ? theme.cardBg : theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: isLightTheme ? '0 1px 8px rgba(0,0,0,0.06)' : '0 2px 12px rgba(0,0,0,0.25)',
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>{label}</p>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${iconColor}18`, color: iconColor, border: `1px solid ${iconColor}25` }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium mb-0.5" style={{ color: theme.textMuted }}>PKR per tola</p>
        <p className="text-2xl font-bold leading-tight" style={{ color: theme.textPrimary }}>
          {pkrTola != null ? `PKR ${fmt(pkrTola)}` : '—'}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>1 tola = 11.664 g</p>
      </div>
      <div className="pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
        <p className="text-xs font-medium mb-0.5" style={{ color: theme.textMuted }}>USD per troy oz</p>
        <p className="text-lg font-bold" style={{ color: theme.textPrimary }}>
          {usdOz != null ? `$${fmt(usdOz, 2)}` : '—'}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>1 troy oz = 31.103 g</p>
      </div>
      {subLabel && (
        <span
          className="self-start text-[11px] font-semibold px-2.5 py-1 rounded-lg"
          style={{ background: `${theme.primary}12`, color: theme.primary, border: `1px solid ${theme.primary}25` }}
        >
          {subLabel}
        </span>
      )}
    </div>
  );
}

// ─── Diff input with live preview (themed) ────────────────
function DiffField({ label, value, onChange, livePrice, error, accentColor = 'amber' }) {
  const { theme, isLightTheme } = useTheme();
  const numVal = parseFloat(value) || 0;
  const preview = livePrice != null ? livePrice + numVal : null;
  const isNonZero = value !== '' && numVal !== 0;
  const accent = accentColor === 'blue' ? '#3b82f6' : theme.primary;
  const bg = isLightTheme ? '#ffffff' : '#1a1a1a';

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(sanitiseDiff(String((parseFloat(value) || 0) - 100)))}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition shrink-0"
          style={{ background: isLightTheme ? '#ffffff' : '#111111', border: `1px solid ${theme.border}`, color: theme.textMuted }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#ef444415'; e.currentTarget.style.borderColor = '#ef444430'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = isLightTheme ? '#ffffff' : '#111111'; e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textMuted; }}
        >
          −100
        </button>
        <div
          className="relative flex items-center rounded-xl border-2 transition-colors flex-1 min-w-0"
          style={{ background: bg, borderColor: error ? '#ef4444' : isNonZero ? accent : theme.border }}
        >
          <span className="absolute left-3 text-xs font-bold select-none pointer-events-none" style={{ color: theme.textMuted }}>PKR</span>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(sanitiseDiff(e.target.value))}
            placeholder="0"
            className="w-full pl-12 pr-4 py-3 bg-transparent text-base font-bold focus:outline-none rounded-xl placeholder:opacity-40"
            style={{ color: theme.textPrimary }}
          />
          {isNonZero && (
            <span
              className="absolute right-3 text-xs font-bold px-2 py-0.5 rounded-full shrink-0 hidden sm:inline-flex"
              style={{
                background: numVal > 0 ? '#10b98118' : '#ef444418',
                color: numVal > 0 ? '#10b981' : '#ef4444',
                border: `1px solid ${numVal > 0 ? '#10b98130' : '#ef444430'}`,
              }}
            >
              {numVal > 0 ? `+${fmt(numVal)}` : fmt(numVal)}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(sanitiseDiff(String((parseFloat(value) || 0) + 100)))}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition shrink-0"
          style={{ background: isLightTheme ? '#ffffff' : '#111111', border: `1px solid ${theme.border}`, color: theme.textMuted }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#10b98115'; e.currentTarget.style.borderColor = '#10b98130'; e.currentTarget.style.color = '#10b981'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = isLightTheme ? '#ffffff' : '#111111'; e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.textMuted; }}
        >
          +100
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1"><IconAlert />{error}</p>
      )}
      <div
        className="rounded-xl px-4 py-3 space-y-1.5 text-xs"
        style={{
          background: isLightTheme ? `${theme.primary}06` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${theme.border}`,
        }}
      >
        <div className="flex justify-between">
          <span style={{ color: theme.textMuted }}>Live market</span>
          <span className="font-semibold" style={{ color: theme.textPrimary }}>{livePrice != null ? `PKR ${fmt(livePrice)}` : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: theme.textMuted }}>Difference</span>
          <span
            className={`font-semibold ${numVal > 0 ? 'text-emerald-600' : numVal < 0 ? 'text-red-500' : ''}`}
            style={{ color: numVal === 0 ? theme.textMuted : undefined }}
          >
            {value === '' || numVal === 0 ? 'PKR 0' : `${numVal > 0 ? '+' : ''}PKR ${fmt(numVal)}`}
          </span>
        </div>
        <div className="pt-1.5 flex justify-between" style={{ borderTop: `1px solid ${theme.border}` }}>
          <span className="font-bold" style={{ color: theme.textPrimary }}>Final price</span>
          <span className={`font-bold text-sm ${isNonZero ? 'font-bold' : ''}`} style={{ color: isNonZero ? accent : theme.textPrimary }}>
            {preview != null ? `PKR ${fmt(preview)}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper (themed) ─────────────────────────────
function SectionCard({ icon, iconBg, title, description, children }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <section
      className="rounded-2xl p-4 sm:p-6"
      style={{
        background: isLightTheme ? theme.cardBg : theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: isLightTheme ? '0 1px 8px rgba(0,0,0,0.06)' : '0 2px 12px rgba(0,0,0,0.25)',
      }}
    >
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg, border: `1px solid ${theme.border}` }}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color: theme.textPrimary }}>{title}</h2>
          <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

// ─── Buy / Sell Tab Toggle (themed) ──────────────────────
function PriceTypeTabs({ active, onChange }) {
  const { theme } = useTheme();
  return (
    <div
      className="inline-flex rounded-xl p-1 gap-1 w-full sm:w-auto"
      style={{
        background: theme.type === 'light' ? '#f9fafb' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${theme.border}`,
      }}
    >
      <button
        type="button"
        onClick={() => onChange('sell')}
        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${active === 'sell' ? 'bg-amber-500 text-white shadow-sm' : ''}`}
        style={active !== 'sell' ? { color: theme.textMuted } : {}}
      >
        Sell{' '}
        <span className="ml-1 font-normal normal-case tracking-normal text-[10px] opacity-70 hidden sm:inline">
          (customer buys)
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange('buy')}
        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${active === 'buy' ? 'bg-blue-500 text-white shadow-sm' : ''}`}
        style={active !== 'buy' ? { color: theme.textMuted } : {}}
      >
        Buy{' '}
        <span className="ml-1 font-normal normal-case tracking-normal text-[10px] opacity-70 hidden sm:inline">
          (customer sells)
        </span>
      </button>
    </div>
  );
}

// ─── Currency Table Row (themed) ──────────────────────────
function CurrencyTableRow({ code, meta, liveRate, goldPKR_24k, inputVal, accentColor, error, saving, onInputChange, onSave, rateLabel }) {
  const { theme, isLightTheme } = useTheme();
  const numInput = parseFloat(inputVal) || 0;
  const previewRate = liveRate != null ? liveRate + numInput : null;
  const goldInCurr = goldPKR_24k != null && previewRate ? goldPKR_24k / previewRate : null;
  const isNonZero = numInput !== 0;
  const accent = accentColor === 'blue' ? '#3b82f6' : theme.primary;
  const rowBg = isLightTheme ? '#ffffff' : '#111111';

  return (
    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{meta.flag}</span>
          <div>
            <p className="font-bold" style={{ color: theme.textPrimary }}>{code}</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>{meta.name}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="font-mono font-semibold" style={{ color: theme.textPrimary }}>
          {liveRate != null ? `PKR ${fmt(liveRate, 2)}` : '—'}
        </p>
        <p className="text-xs" style={{ color: theme.textMuted }}>1 {code} = PKR</p>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1">
          <div
            className="relative flex items-center rounded-xl border-2 transition-colors w-40"
            style={{ background: rowBg, borderColor: error ? '#ef4444' : isNonZero ? accent : theme.border }}
          >
            <span className="absolute left-3 text-xs font-semibold select-none pointer-events-none" style={{ color: theme.textMuted }}>PKR</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={inputVal}
              onChange={(e) => onInputChange(sanitiseDiff(e.target.value))}
              className="w-full pl-11 pr-3 py-2.5 bg-transparent text-sm font-bold focus:outline-none rounded-xl placeholder:opacity-40"
              style={{ color: theme.textPrimary }}
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1"><IconAlert />{error}</p>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="font-mono font-bold" style={{ color: isNonZero ? accent : theme.textPrimary }}>
          {previewRate != null ? `PKR ${fmt(previewRate, 2)}` : '—'}
        </p>
        {isNonZero && (
          <p className="text-xs font-semibold mt-0.5" style={{ color: numInput > 0 ? '#10b981' : '#ef4444' }}>
            {numInput > 0 ? '+' : ''}PKR {fmt(numInput, 2)}
          </p>
        )}
      </td>
      <td className="px-5 py-4">
        <p className="font-semibold" style={{ color: theme.textPrimary }}>
          {goldInCurr != null ? `${meta.symbol}${fmt(goldInCurr, 2)}` : '—'}
        </p>
        <p className="text-xs" style={{ color: theme.textMuted }}>at {rateLabel} rate</p>
      </td>
      <td className="px-5 py-4">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
          style={{ background: accent }}
        >
          {saving ? 'Saving…' : 'Update'}
        </button>
      </td>
    </tr>
  );
}

// ─── Main ─────────────────────────────────────────────────
export default function AdminPrices() {
  const { theme, isLightTheme } = useTheme();

  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [secondsAgo, setSecondsAgo] = useState(0);

  // ── FIX: separate "saved diffs" state from live SSE prices ────────────────
  const [savedDiffs, setSavedDiffs] = useState({
    diff_24k: 0, diff_2385k: 0,
    buy_diff_24k: 0, buy_diff_2385k: 0,
    diff_silver: 0, buy_diff_silver: 0,
  });

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  
const handleToastClose = useCallback(
  () => setToast({ msg: '', type: 'success' }),
  []
);

  const {
    prices: ssePrices,
    connected: sseConnected,
    lastUpdated: sseLastUpdated,
    error: sseError,
  } = useLivePrices('admin');

  // ── Gold forms ─────────────────────────────────────────────────────────────
  const [goldSellForm, setGoldSellForm] = useState({ diff_24k: '', diff_2385k: '' });
  const [goldSellErrors, setGoldSellErrors] = useState({});
  const [goldSellSaving, setGoldSellSaving] = useState(false);

  const [goldBuyForm, setGoldBuyForm] = useState({ buy_diff_24k: '', buy_diff_2385k: '' });
  const [goldBuyErrors, setGoldBuyErrors] = useState({});
  const [goldBuySaving, setGoldBuySaving] = useState(false);

  const [goldTab, setGoldTab] = useState('sell');

  // ── Silver forms ───────────────────────────────────────────────────────────
  const [silverSellInput, setSilverSellInput] = useState('');
  const [silverSellError, setSilverSellError] = useState('');
  const [silverSellSaving, setSilverSellSaving] = useState(false);

  const [silverBuyInput, setSilverBuyInput] = useState('');
  const [silverBuyError, setSilverBuyError] = useState('');
  const [silverBuySaving, setSilverBuySaving] = useState(false);

  const [silverTab, setSilverTab] = useState('sell');

  // ── Currency forms ─────────────────────────────────────────────────────────
  const [currencySellForm, setCurrencySellForm] = useState({});
  const [currencySellErrors, setCurrencySellErrors] = useState({});
  const [currencySellSaving, setCurrencySellSaving] = useState({});
  const [currencySellUpdateAllSaving, setCurrencySellUpdateAllSaving] = useState(false);
  const [currencySellResetAllSaving, setCurrencySellResetAllSaving] = useState(false);

  const [currencyBuyForm, setCurrencyBuyForm] = useState({});
  const [currencyBuyErrors, setCurrencyBuyErrors] = useState({});
  const [currencyBuySaving, setCurrencyBuySaving] = useState({});
  const [currencyBuyUpdateAllSaving, setCurrencyBuyUpdateAllSaving] = useState(false);
  const [currencyBuyResetAllSaving, setCurrencyBuyResetAllSaving] = useState(false);

  const [currencyTab, setCurrencyTab] = useState('sell');

  // Countdown timer
  useEffect(() => {
    if (!sseLastUpdated) return;
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - sseLastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [sseLastUpdated]);

  // ── Seed forms from REST data ──────────────────────────────────────────────
  const seedFormsFromData = useCallback((d) => {
    const gold = d.livePrices?.gold;
    const silver = d.livePrices?.silver;
    const currencies = d.livePrices?.currencies ?? {};

    setGoldSellForm({
      diff_24k: gold?.diff_24k != null && gold.diff_24k !== 0 ? gold.diff_24k.toString() : '',
      diff_2385k: gold?.diff_2385k != null && gold.diff_2385k !== 0 ? gold.diff_2385k.toString() : '',
    });
    setGoldBuyForm({
      buy_diff_24k: gold?.buy_diff_24k != null && gold.buy_diff_24k !== 0 ? gold.buy_diff_24k.toString() : '',
      buy_diff_2385k: gold?.buy_diff_2385k != null && gold.buy_diff_2385k !== 0 ? gold.buy_diff_2385k.toString() : '',
    });
    setSilverSellInput(silver?.diff_silver != null && silver.diff_silver !== 0 ? silver.diff_silver.toString() : '');
    setSilverBuyInput(silver?.buy_diff_silver != null && silver.buy_diff_silver !== 0 ? silver.buy_diff_silver.toString() : '');

    const initSell = {};
    const initBuy = {};
    Object.keys(CURRENCY_META).forEach((code) => {
      const sellDiff = currencies[code]?.adminDiff;
      const buyDiff = currencies[code]?.adminBuyDiff;
      initSell[code] = sellDiff != null && sellDiff !== 0 ? sellDiff.toString() : '';
      initBuy[code] = buyDiff != null && buyDiff !== 0 ? buyDiff.toString() : '';
    });
    setCurrencySellForm(initSell);
    setCurrencyBuyForm(initBuy);

    setSavedDiffs({
      diff_24k: gold?.diff_24k ?? 0,
      diff_2385k: gold?.diff_2385k ?? 0,
      buy_diff_24k: gold?.buy_diff_24k ?? 0,
      buy_diff_2385k: gold?.buy_diff_2385k ?? 0,
      diff_silver: silver?.diff_silver ?? 0,
      buy_diff_silver: silver?.buy_diff_silver ?? 0,
    });
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isRefresh = false) => {
    setPageError('');
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await adminAPI.getDashboard();
      const d = res.data;
      setPrices(d);
      seedFormsFromData(d);
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to load prices.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [seedFormsFromData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Save gold SELL ─────────────────────────────────────────────────────────
  const handleGoldSellSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (goldSellForm.diff_24k !== '' && isNaN(Number(goldSellForm.diff_24k))) errs.diff_24k = 'Enter a valid number';
    if (goldSellForm.diff_2385k !== '' && isNaN(Number(goldSellForm.diff_2385k))) errs.diff_2385k = 'Enter a valid number';
    setGoldSellErrors(errs);
    if (Object.keys(errs).length) return;
    setGoldSellSaving(true);
    try {
      const diff_24k = Number(goldSellForm.diff_24k || 0);
      const diff_2385k = Number(goldSellForm.diff_2385k || 0);
      await adminAPI.updatePriceDifference({ diff_24k, diff_2385k });
      setSavedDiffs((prev) => ({ ...prev, diff_24k, diff_2385k }));
      showToast('Gold sell prices saved successfully.');
      fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save gold sell prices.', 'error');
    } finally {
      setGoldSellSaving(false);
    }
  };

  // ── Reset gold SELL ────────────────────────────────────────────────────────
  const handleGoldSellReset = async () => {
    setGoldSellForm({ diff_24k: '', diff_2385k: '' });
    setGoldSellErrors({});
    setGoldSellSaving(true);
    try {
      await adminAPI.updatePriceDifference({ diff_24k: 0, diff_2385k: 0 });
      setSavedDiffs((prev) => ({ ...prev, diff_24k: 0, diff_2385k: 0 }));
      showToast('Gold sell prices reset to 0.');
      fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset gold sell prices.', 'error');
    } finally {
      setGoldSellSaving(false);
    }
  };

  // ── Save gold BUY ──────────────────────────────────────────────────────────
  const handleGoldBuySave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (goldBuyForm.buy_diff_24k !== '' && isNaN(Number(goldBuyForm.buy_diff_24k))) errs.buy_diff_24k = 'Enter a valid number';
    if (goldBuyForm.buy_diff_2385k !== '' && isNaN(Number(goldBuyForm.buy_diff_2385k))) errs.buy_diff_2385k = 'Enter a valid number';
    setGoldBuyErrors(errs);
    if (Object.keys(errs).length) return;
    setGoldBuySaving(true);
    try {
      const buy_diff_24k = Number(goldBuyForm.buy_diff_24k || 0);
      const buy_diff_2385k = Number(goldBuyForm.buy_diff_2385k || 0);
      await adminAPI.updatePriceDifference({ buy_diff_24k, buy_diff_2385k });
      setSavedDiffs((prev) => ({ ...prev, buy_diff_24k, buy_diff_2385k }));
      showToast('Gold buy prices saved successfully.');
      fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save gold buy prices.', 'error');
    } finally {
      setGoldBuySaving(false);
    }
  };

  // ── Reset gold BUY ─────────────────────────────────────────────────────────
  const handleGoldBuyReset = async () => {
    setGoldBuyForm({ buy_diff_24k: '', buy_diff_2385k: '' });
    setGoldBuyErrors({});
    setGoldBuySaving(true);
    try {
      await adminAPI.updatePriceDifference({ buy_diff_24k: 0, buy_diff_2385k: 0 });
      setSavedDiffs((prev) => ({ ...prev, buy_diff_24k: 0, buy_diff_2385k: 0 }));
      showToast('Gold buy prices reset to 0.');
      fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset gold buy prices.', 'error');
    } finally {
      setGoldBuySaving(false);
    }
  };

  // ── Save silver SELL ───────────────────────────────────────────────────────
  const handleSilverSellSave = async (e) => {
    e.preventDefault();
    if (silverSellInput !== '' && isNaN(Number(silverSellInput))) { setSilverSellError('Enter a valid number'); return; }
    setSilverSellError('');
    setSilverSellSaving(true);
    try {
      const diff_silver = Number(silverSellInput || 0);
      await adminAPI.updatePriceDifference({ diff_silver });
      setSavedDiffs((prev) => ({ ...prev, diff_silver }));
      showToast('Silver sell price saved successfully.');
      fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save silver sell price.', 'error');
    } finally {
      setSilverSellSaving(false);
    }
  };

  // ── Reset silver SELL ──────────────────────────────────────────────────────
  const handleSilverSellReset = async () => {
    setSilverSellInput('');
    setSilverSellError('');
    setSilverSellSaving(true);
    try {
      await adminAPI.updatePriceDifference({ diff_silver: 0 });
      setSavedDiffs((prev) => ({ ...prev, diff_silver: 0 }));
      showToast('Silver sell price reset to 0.');
      fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset silver sell price.', 'error');
    } finally {
      setSilverSellSaving(false);
    }
  };

  // ── Save silver BUY ────────────────────────────────────────────────────────
  const handleSilverBuySave = async (e) => {
    e.preventDefault();
    if (silverBuyInput !== '' && isNaN(Number(silverBuyInput))) { setSilverBuyError('Enter a valid number'); return; }
    setSilverBuyError('');
    setSilverBuySaving(true);
    try {
      const buy_diff_silver = Number(silverBuyInput || 0);
      await adminAPI.updatePriceDifference({ buy_diff_silver });
      setSavedDiffs((prev) => ({ ...prev, buy_diff_silver }));
      showToast('Silver buy price saved successfully.');
      fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save silver buy price.', 'error');
    } finally {
      setSilverBuySaving(false);
    }
  };

  // ── Reset silver BUY ───────────────────────────────────────────────────────
  const handleSilverBuyReset = async () => {
    setSilverBuyInput('');
    setSilverBuyError('');
    setSilverBuySaving(true);
    try {
      await adminAPI.updatePriceDifference({ buy_diff_silver: 0 });
      setSavedDiffs((prev) => ({ ...prev, buy_diff_silver: 0 }));
      showToast('Silver buy price reset to 0.');
      fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset silver buy price.', 'error');
    } finally {
      setSilverBuySaving(false);
    }
  };

  // ── Currency SELL ──────────────────────────────────────────────────────────
  const handleCurrencySellSave = async (code) => {
    const raw = currencySellForm[code] ?? '';
    if (raw !== '' && isNaN(Number(raw))) { setCurrencySellErrors((e) => ({ ...e, [code]: 'Enter a valid number' })); return; }
    setCurrencySellErrors((e) => ({ ...e, [code]: '' }));
    setCurrencySellSaving((s) => ({ ...s, [code]: true }));
    try {
      await adminAPI.updatePriceDifference({ currencyDiff: { [code]: Number(raw || 0) } });
      showToast(`${code} sell difference saved.`);
      fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to update ${code} sell difference.`, 'error');
    } finally {
      setCurrencySellSaving((s) => ({ ...s, [code]: false }));
    }
  };

  const handleCurrencySellUpdateAll = async () => {
    setCurrencySellUpdateAllSaving(true);
    let hasError = false;
    try {
      const errors = {}, updates = [];
      Object.keys(CURRENCY_META).forEach((code) => {
        const raw = currencySellForm[code] ?? '';
        if (raw !== '' && isNaN(Number(raw))) { errors[code] = 'Enter a valid number'; hasError = true; }
        else updates.push({ code, difference: Number(raw || 0) });
      });
      if (hasError) { setCurrencySellErrors(errors); showToast('Please fix invalid values before updating all.', 'error'); setCurrencySellUpdateAllSaving(false); return; }
      setCurrencySellErrors({});
      const results = [];
      for (const { code, difference } of updates) {
        try { await adminAPI.updatePriceDifference({ currencyDiff: { [code]: difference } }); results.push({ code, success: true }); }
        catch (err) { results.push({ code, success: false }); }
      }
      const failures = results.filter((r) => !r.success);
      if (failures.length) showToast(`Updated ${results.length - failures.length}/${updates.length} currencies. ${failures.length} failed.`, 'error');
      else showToast('All currency sell rates updated successfully.');
      await fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update all sell rates.', 'error');
    } finally {
      setCurrencySellUpdateAllSaving(false);
    }
  };

  const handleCurrencySellResetAll = async () => {
    setCurrencySellResetAllSaving(true);
    try {
      const resetForm = {};
      Object.keys(CURRENCY_META).forEach((code) => { resetForm[code] = ''; });
      setCurrencySellForm(resetForm);
      setCurrencySellErrors({});
      const results = [];
      for (const code of Object.keys(CURRENCY_META)) {
        try { await adminAPI.updatePriceDifference({ currencyDiff: { [code]: 0 } }); results.push({ code, success: true }); }
        catch (err) { results.push({ code, success: false }); }
      }
      const failures = results.filter((r) => !r.success);
      if (failures.length) showToast(`Reset ${results.length - failures.length}/${results.length} currencies. ${failures.length} failed.`, 'error');
      else showToast('All currency sell rates reset to 0.');
      await fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset all sell rates.', 'error');
    } finally {
      setCurrencySellResetAllSaving(false);
    }
  };

  // ── Currency BUY ───────────────────────────────────────────────────────────
  const handleCurrencyBuySave = async (code) => {
    const raw = currencyBuyForm[code] ?? '';
    if (raw !== '' && isNaN(Number(raw))) { setCurrencyBuyErrors((e) => ({ ...e, [code]: 'Enter a valid number' })); return; }
    setCurrencyBuyErrors((e) => ({ ...e, [code]: '' }));
    setCurrencyBuySaving((s) => ({ ...s, [code]: true }));
    try {
      await adminAPI.updatePriceDifference({ currencyBuyDiff: { [code]: Number(raw || 0) } });
      showToast(`${code} buy difference saved.`);
      fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || `Failed to update ${code} buy difference.`, 'error');
    } finally {
      setCurrencyBuySaving((s) => ({ ...s, [code]: false }));
    }
  };

  const handleCurrencyBuyUpdateAll = async () => {
    setCurrencyBuyUpdateAllSaving(true);
    let hasError = false;
    try {
      const errors = {}, updates = [];
      Object.keys(CURRENCY_META).forEach((code) => {
        const raw = currencyBuyForm[code] ?? '';
        if (raw !== '' && isNaN(Number(raw))) { errors[code] = 'Enter a valid number'; hasError = true; }
        else updates.push({ code, buy_difference: Number(raw || 0) });
      });
      if (hasError) { setCurrencyBuyErrors(errors); showToast('Please fix invalid values before updating all.', 'error'); setCurrencyBuyUpdateAllSaving(false); return; }
      setCurrencyBuyErrors({});
      const results = [];
      for (const { code, buy_difference } of updates) {
        try { await adminAPI.updatePriceDifference({ currencyBuyDiff: { [code]: buy_difference } }); results.push({ code, success: true }); }
        catch (err) { results.push({ code, success: false }); }
      }
      const failures = results.filter((r) => !r.success);
      if (failures.length) showToast(`Updated ${results.length - failures.length}/${updates.length} currencies. ${failures.length} failed.`, 'error');
      else showToast('All currency buy rates updated successfully.');
      await fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update all buy rates.', 'error');
    } finally {
      setCurrencyBuyUpdateAllSaving(false);
    }
  };

  const handleCurrencyBuyResetAll = async () => {
    setCurrencyBuyResetAllSaving(true);
    try {
      const resetForm = {};
      Object.keys(CURRENCY_META).forEach((code) => { resetForm[code] = ''; });
      setCurrencyBuyForm(resetForm);
      setCurrencyBuyErrors({});
      const results = [];
      for (const code of Object.keys(CURRENCY_META)) {
        try { await adminAPI.updatePriceDifference({ currencyBuyDiff: { [code]: 0 } }); results.push({ code, success: true }); }
        catch (err) { results.push({ code, success: false }); }
      }
      const failures = results.filter((r) => !r.success);
      if (failures.length) showToast(`Reset ${results.length - failures.length}/${results.length} currencies. ${failures.length} failed.`, 'error');
      else showToast('All currency buy rates reset to 0.');
      await fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset all buy rates.', 'error');
    } finally {
      setCurrencyBuyResetAllSaving(false);
    }
  };

  // ── Render guards ──────────────────────────────────────────────────────────
  if (loading) return <PageSpinner />;

  if (pageError)
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#ef444415', color: '#ef4444' }}>
          <IconAlert />
        </div>
        <div>
          <p className="font-bold text-lg" style={{ color: theme.textPrimary }}>Could not load prices</p>
          <p className="text-sm mt-1 max-w-sm" style={{ color: theme.textMuted }}>{pageError}</p>
        </div>
        <button
          onClick={() => fetchData()}
          className="px-5 py-2.5 text-white text-sm font-bold rounded-xl transition"
          style={{ background: theme.primary }}
        >
          Try Again
        </button>
      </div>
    );

  // ── Derived display values ─────────────────────────────────────────────────
  const livePricesData = sseConnected && ssePrices ? ssePrices : prices?.livePrices;
  const gold = livePricesData?.gold;
  const silver = livePricesData?.silver;
  const rawCurrencies = getRawCurrencies(livePricesData);

  const lastUpdatedDisplay = (() => {
    if (sseConnected && sseLastUpdated) return sseLastUpdated.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
    if (prices?.livePrices?.lastUpdated) return new Date(prices.livePrices.lastUpdated).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
    return null;
  })();

  const goldBase24 = gold?.basePricePerTola_24k;
  const goldBase2385 = gold?.basePricePerTola_2385k;
  const silverBase = silver?.basePricePerTola;
  const goldUSD_oz = gold?.priceUSD;
  const silverUSD_oz = silver?.priceUSD;

  const adj_diff_24k = savedDiffs.diff_24k;
  const adj_diff_2385k = savedDiffs.diff_2385k;
  const adj_diff_silver = savedDiffs.diff_silver;
  const adj_buy_diff_24k = savedDiffs.buy_diff_24k;
  const adj_buy_diff_2385k = savedDiffs.buy_diff_2385k;
  const adj_buy_diff_silver = savedDiffs.buy_diff_silver;

  const myPrice_24k = goldBase24 != null ? goldBase24 + adj_diff_24k : null;
  const myPrice_2385k = goldBase2385 != null ? goldBase2385 + adj_diff_2385k : null;
  const myPrice_silver = silverBase != null ? silverBase + adj_diff_silver : null;
  const myBuyPrice_24k = goldBase24 != null ? goldBase24 + adj_buy_diff_24k : null;
  const myBuyPrice_2385k = goldBase2385 != null ? goldBase2385 + adj_buy_diff_2385k : null;
  const myBuyPrice_silver = silverBase != null ? silverBase + adj_buy_diff_silver : null;

  const currencyRows = Object.entries(CURRENCY_META).map(([code, meta]) => ({
    code, meta,
    liveRate: rawCurrencies[code]?.liveRate ?? rawCurrencies[code]?.rate ?? null,
  }));

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-3 sm:px-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>Price Management</h1>
          <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>Live rates · Set sell & buy markups · Currency adjustments</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={sseConnected
              ? { background: '#10b98115', color: '#10b981', border: '1px solid #10b98125' }
              : { background: '#ef444415', color: '#ef4444', border: '1px solid #ef444425' }}
          >
            <span
              className={`w-2 h-2 rounded-full ${sseConnected ? 'animate-pulse' : ''}`}
              style={{ background: sseConnected ? '#10b981' : '#ef4444' }}
            />
            {sseConnected ? 'Live' : 'Offline'}
          </span>

          {sseConnected && sseLastUpdated && (
            <span className="text-xs hidden sm:block" style={{ color: theme.textMuted }}>
              Next update in{' '}
              <span className="font-semibold font-mono" style={{ color: theme.primary }}>
                {Math.max(0, 30 - secondsAgo)}s
              </span>
            </span>
          )}

          {lastUpdatedDisplay && (
            <p className="text-xs hidden sm:block" style={{ color: theme.textMuted }}>
              Last update:{' '}
              <span className="font-semibold" style={{ color: theme.textPrimary }}>{lastUpdatedDisplay}</span>
            </p>
          )}

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            style={{
              background: isLightTheme ? '#ffffff' : '#1a1a1a',
              border: `1px solid ${theme.border}`,
              color: theme.textPrimary,
            }}
          >
            <IconRefresh spin={refreshing} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* SSE error banner */}
      {sseError && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold"
          style={{ background: '#ef444415', border: '1px solid #ef444430', color: '#ef4444' }}
        >
          <IconAlert />
          Live feed error: {sseError}
          <span className="font-normal ml-1 opacity-70">— prices shown may be delayed.</span>
        </div>
      )}

      {/* ── 1. Live market prices ── */}
      <section>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: theme.textMuted }}>
          Live Market Prices
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <PriceCard
            label="Gold 24 Karat"
            pkrTola={goldBase24}
            usdOz={goldUSD_oz}
            subLabel="Pure 24K"
            icon={<IconGold />}
            iconColor="#f59e0b"
          />
          <PriceCard
            label="Gold 23.85 Karat"
            pkrTola={goldBase2385}
            usdOz={goldUSD_oz != null ? goldUSD_oz * (23.85 / 24) : null}
            subLabel="Hallmark 23.85K"
            icon={<IconGold />}
            iconColor="#d97706"
          />
          <PriceCard
            label="Silver 999"
            pkrTola={silverBase}
            usdOz={silverUSD_oz}
            subLabel="Fine Silver"
            icon={<IconSilver />}
            iconColor="#64748b"
          />
        </div>
      </section>

      {/* ── 2. Current saved shop prices (SELL + BUY) ── */}
      {(myPrice_24k != null || myBuyPrice_24k != null) && (
        <section>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: theme.textMuted }}>
            Your Current Shop Prices (Saved)
          </p>

          <p className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: theme.primary }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: theme.primary }} />
            Sell Prices — Customer Buys
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {[
              { label: '24K — Sell Price', price: myPrice_24k, diff: adj_diff_24k, live: goldBase24 },
              { label: '23.85K — Sell Price', price: myPrice_2385k, diff: adj_diff_2385k, live: goldBase2385 },
              { label: 'Silver 999 — Sell Price', price: myPrice_silver, diff: adj_diff_silver, live: silverBase },
            ].map(({ label, price, diff, live: lv }) => (
              <div
                key={label}
                className="rounded-2xl p-5"
                style={{ background: isLightTheme ? theme.cardBg : theme.bg, border: `1px solid ${theme.border}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: theme.primary }}>{label}</p>
                <p className="text-3xl font-bold" style={{ color: theme.textPrimary }}>{price != null ? `PKR ${fmt(price)}` : '—'}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <span style={{ color: theme.textMuted }}>
                    Live: <span className="font-semibold" style={{ color: theme.textPrimary }}>PKR {fmt(lv)}</span>
                  </span>
                  <span
                    className={`font-semibold ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : ''}`}
                    style={{ color: diff === 0 ? theme.textMuted : undefined }}
                  >
                    {diff === 0 ? 'No markup' : `Markup: ${diff > 0 ? '+' : ''}PKR ${fmt(diff)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: '#3b82f6' }}>
            <span className="w-2 h-2 rounded-full inline-block bg-blue-500" />
            Buy Prices — Customer Sells to Shop
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: '24K — Buy Price', price: myBuyPrice_24k, diff: adj_buy_diff_24k, live: goldBase24 },
              { label: '23.85K — Buy Price', price: myBuyPrice_2385k, diff: adj_buy_diff_2385k, live: goldBase2385 },
              { label: 'Silver 999 — Buy Price', price: myBuyPrice_silver, diff: adj_buy_diff_silver, live: silverBase },
            ].map(({ label, price, diff, live: lv }) => (
              <div
                key={label}
                className="rounded-2xl p-5"
                style={{ background: isLightTheme ? theme.cardBg : theme.bg, border: `1px solid ${theme.border}` }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#3b82f6' }}>{label}</p>
                <p className="text-3xl font-bold" style={{ color: theme.textPrimary }}>{price != null ? `PKR ${fmt(price)}` : '—'}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <span style={{ color: theme.textMuted }}>
                    Live: <span className="font-semibold" style={{ color: theme.textPrimary }}>PKR {fmt(lv)}</span>
                  </span>
                  <span
                    className={`font-semibold ${diff < 0 ? 'text-red-500' : diff > 0 ? 'text-emerald-600' : ''}`}
                    style={{ color: diff === 0 ? theme.textMuted : undefined }}
                  >
                    {diff === 0 ? 'No difference' : `Diff: ${diff > 0 ? '+' : ''}PKR ${fmt(diff)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Set Gold Price Markup ── */}
      <SectionCard
        icon={<span style={{ color: '#f59e0b' }}><IconGold /></span>}
        iconBg={isLightTheme ? '#fef3c7' : '#2d2d2d'}
        title="Set Gold Price Markup"
        description="Set the sell price (what customers pay to buy gold) and the buy price (what shop pays when customers sell gold)."
      >
        <div className="mb-6">
          <PriceTypeTabs active={goldTab} onChange={setGoldTab} />
        </div>

        {goldTab === 'sell' && (
          <>
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-xs font-medium"
              style={{ background: `${theme.primary}12`, border: `1px solid ${theme.primary}25`, color: theme.primary }}
            >
              <IconInfo />
              Sell price = what the customer pays when buying gold from you. Saving notifies all active shop admins.
            </div>
            <form onSubmit={handleGoldSellSave}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DiffField label="24K Sell Difference (PKR / tola)" value={goldSellForm.diff_24k} onChange={(v) => setGoldSellForm((f) => ({ ...f, diff_24k: v }))} livePrice={goldBase24} error={goldSellErrors.diff_24k} accentColor="amber" />
                <DiffField label="23.85K Sell Difference (PKR / tola)" value={goldSellForm.diff_2385k} onChange={(v) => setGoldSellForm((f) => ({ ...f, diff_2385k: v }))} livePrice={goldBase2385} error={goldSellErrors.diff_2385k} accentColor="amber" />
              </div>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={goldSellSaving}
                  className="flex-1 sm:flex-none px-7 py-3 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition"
                  style={{ background: theme.primary }}
                >
                  {goldSellSaving ? 'Saving…' : 'Save Gold Sell Prices'}
                </button>
                <button
                  type="button"
                  onClick={handleGoldSellReset}
                  disabled={goldSellSaving}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  style={{ border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted }}
                >
                  Reset to 0
                </button>
              </div>
            </form>
          </>
        )}

        {goldTab === 'buy' && (
          <>
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-xs font-medium"
              style={{ background: '#3b82f612', border: '1px solid #3b82f625', color: '#3b82f6' }}
            >
              <IconInfo />
              Buy price = what your shop pays when a customer sells gold to you. Usually a negative difference (below market). Saving notifies all active shop admins.
            </div>
            <form onSubmit={handleGoldBuySave}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DiffField label="24K Buy Difference (PKR / tola)" value={goldBuyForm.buy_diff_24k} onChange={(v) => setGoldBuyForm((f) => ({ ...f, buy_diff_24k: v }))} livePrice={goldBase24} error={goldBuyErrors.buy_diff_24k} accentColor="blue" />
                <DiffField label="23.85K Buy Difference (PKR / tola)" value={goldBuyForm.buy_diff_2385k} onChange={(v) => setGoldBuyForm((f) => ({ ...f, buy_diff_2385k: v }))} livePrice={goldBase2385} error={goldBuyErrors.buy_diff_2385k} accentColor="blue" />
              </div>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={goldBuySaving}
                  className="flex-1 sm:flex-none px-7 py-3 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition"
                  style={{ background: '#3b82f6' }}
                >
                  {goldBuySaving ? 'Saving…' : 'Save Gold Buy Prices'}
                </button>
                <button
                  type="button"
                  onClick={handleGoldBuyReset}
                  disabled={goldBuySaving}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  style={{ border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted }}
                >
                  Reset to 0
                </button>
              </div>
            </form>
          </>
        )}
      </SectionCard>

      {/* ── 4. Set Silver Price Markup ── */}
      <SectionCard
        icon={<span style={{ color: '#64748b' }}><IconSilver /></span>}
        iconBg={isLightTheme ? '#f1f5f9' : '#2d2d2d'}
        title="Set Silver Price Markup"
        description="Set the sell price (what customers pay to buy silver) and the buy price (what shop pays when customers sell silver)."
      >
        <div className="mb-6">
          <PriceTypeTabs active={silverTab} onChange={setSilverTab} />
        </div>

        {silverTab === 'sell' && (
          <>
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-xs font-medium"
              style={{ background: `${theme.primary}12`, border: `1px solid ${theme.primary}25`, color: theme.primary }}
            >
              <IconInfo />
              Sell price = what the customer pays when buying silver from you. Saving notifies all active shop admins.
            </div>
            <form onSubmit={handleSilverSellSave}>
              <div className="grid grid-cols-1 gap-5">
                <DiffField label="Silver Sell Difference (PKR / tola)" value={silverSellInput} onChange={(v) => { setSilverSellInput(v); if (silverSellError) setSilverSellError(''); }} livePrice={silverBase} error={silverSellError} accentColor="amber" />
              </div>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={silverSellSaving}
                  className="flex-1 sm:flex-none px-7 py-3 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition"
                  style={{ background: '#475569' }}
                >
                  {silverSellSaving ? 'Saving…' : 'Save Silver Sell Price'}
                </button>
                <button
                  type="button"
                  onClick={handleSilverSellReset}
                  disabled={silverSellSaving}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  style={{ border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted }}
                >
                  Reset to 0
                </button>
              </div>
            </form>
          </>
        )}

        {silverTab === 'buy' && (
          <>
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-xs font-medium"
              style={{ background: '#3b82f612', border: '1px solid #3b82f625', color: '#3b82f6' }}
            >
              <IconInfo />
              Buy price = what your shop pays when a customer sells silver to you. Usually a negative difference (below market). Saving notifies all active shop admins.
            </div>
            <form onSubmit={handleSilverBuySave}>
              <div className="grid grid-cols-1 gap-5">
                <DiffField label="Silver Buy Difference (PKR / tola)" value={silverBuyInput} onChange={(v) => { setSilverBuyInput(v); if (silverBuyError) setSilverBuyError(''); }} livePrice={silverBase} error={silverBuyError} accentColor="blue" />
              </div>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={silverBuySaving}
                  className="flex-1 sm:flex-none px-7 py-3 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition"
                  style={{ background: '#3b82f6' }}
                >
                  {silverBuySaving ? 'Saving…' : 'Save Silver Buy Price'}
                </button>
                <button
                  type="button"
                  onClick={handleSilverBuyReset}
                  disabled={silverBuySaving}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  style={{ border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted }}
                >
                  Reset to 0
                </button>
              </div>
            </form>
          </>
        )}
      </SectionCard>

      {/* ── 5. Currency Exchange Rates ── */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{
          background: isLightTheme ? theme.cardBg : theme.bg,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div className="p-4 sm:p-6 border-b" style={{ borderColor: theme.border }}>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#3b82f618', border: '1px solid #3b82f625', color: '#3b82f6' }}
              >
                <IconCurrency />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: theme.textPrimary }}>Currency Exchange Rates</h2>
                <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>Live interbank rates · Set sell & buy differences separately.</p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <PriceTypeTabs active={currencyTab} onChange={setCurrencyTab} />
            </div>
          </div>
        </div>

        {/* ── Currency SELL tab ── */}
        {currencyTab === 'sell' && (
          <>
            <div
              className="px-4 sm:px-6 py-3 border-b text-xs font-medium flex items-center gap-1.5"
              style={{ background: `${theme.primary}08`, borderColor: theme.border, color: theme.primary }}
            >
              <IconInfo />
              Sell rate = the rate at which customers buy foreign currency from you (customer pays this rate).
            </div>
            <div
              className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-end gap-3"
              style={{ borderBottom: `1px solid ${theme.border}` }}
            >
              <button
                type="button"
                onClick={handleCurrencySellResetAll}
                disabled={currencySellUpdateAllSaving || currencySellResetAllSaving}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                style={{ border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted }}
              >
                {currencySellResetAllSaving ? 'Resetting…' : 'Reset All to 0'}
              </button>
              <button
                type="button"
                onClick={handleCurrencySellUpdateAll}
                disabled={currencySellUpdateAllSaving || currencySellResetAllSaving}
                className="flex-1 sm:flex-none px-6 py-2 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition"
                style={{ background: theme.primary }}
              >
                {currencySellUpdateAllSaving ? 'Updating…' : 'Update All Sell Rates'}
              </button>
            </div>
            {/* Single scrollable table — same as SuperAdmin */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {['Currency', 'Live Rate (PKR)', 'Sell Difference', 'Your Sell Rate (PKR)', 'Gold 24K / tola', 'Action'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest"
                        style={{ color: theme.textMuted }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currencyRows.map(({ code, meta, liveRate }) => (
                    <CurrencyTableRow
                      key={code}
                      code={code}
                      meta={meta}
                      liveRate={liveRate}
                      goldPKR_24k={goldBase24}
                      inputVal={currencySellForm[code] ?? ''}
                      accentColor="amber"
                      error={currencySellErrors[code]}
                      saving={currencySellSaving[code]}
                      onInputChange={(v) => { setCurrencySellForm((f) => ({ ...f, [code]: v })); if (currencySellErrors[code]) setCurrencySellErrors((e) => ({ ...e, [code]: '' })); }}
                      onSave={() => handleCurrencySellSave(code)}
                      rateLabel="sell"
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Currency BUY tab ── */}
        {currencyTab === 'buy' && (
          <>
            <div
              className="px-4 sm:px-6 py-3 border-b text-xs font-medium flex items-center gap-1.5"
              style={{ background: '#3b82f608', borderColor: theme.border, color: '#3b82f6' }}
            >
              <IconInfo />
              Buy rate = the rate at which your shop buys foreign currency from customers (shop pays this rate to customer). Usually lower than the sell rate.
            </div>
            <div
              className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-end gap-3"
              style={{ borderBottom: `1px solid ${theme.border}` }}
            >
              <button
                type="button"
                onClick={handleCurrencyBuyResetAll}
                disabled={currencyBuyUpdateAllSaving || currencyBuyResetAllSaving}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                style={{ border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted }}
              >
                {currencyBuyResetAllSaving ? 'Resetting…' : 'Reset All to 0'}
              </button>
              <button
                type="button"
                onClick={handleCurrencyBuyUpdateAll}
                disabled={currencyBuyUpdateAllSaving || currencyBuyResetAllSaving}
                className="flex-1 sm:flex-none px-6 py-2 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition"
                style={{ background: '#3b82f6' }}
              >
                {currencyBuyUpdateAllSaving ? 'Updating…' : 'Update All Buy Rates'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {['Currency', 'Live Rate (PKR)', 'Buy Difference', 'Your Buy Rate (PKR)', 'Gold 24K / tola', 'Action'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest"
                        style={{ color: theme.textMuted }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currencyRows.map(({ code, meta, liveRate }) => (
                    <CurrencyTableRow
                      key={code}
                      code={code}
                      meta={meta}
                      liveRate={liveRate}
                      goldPKR_24k={goldBase24}
                      inputVal={currencyBuyForm[code] ?? ''}
                      accentColor="blue"
                      error={currencyBuyErrors[code]}
                      saving={currencyBuySaving[code]}
                      onInputChange={(v) => { setCurrencyBuyForm((f) => ({ ...f, [code]: v })); if (currencyBuyErrors[code]) setCurrencyBuyErrors((e) => ({ ...e, [code]: '' })); }}
                      onSave={() => handleCurrencyBuySave(code)}
                      rateLabel="buy"
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* ── 6. Gold & Silver in all currencies ── */}
      {(goldBase24 != null || silverBase != null) && (
        <section>
          {goldBase24 != null && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: theme.textMuted }}>
                Gold 24K in All Currencies (per tola)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {Object.entries(CURRENCY_META).map(([code, meta]) => {
                  const liveRate = rawCurrencies[code]?.liveRate ?? rawCurrencies[code]?.rate;
                  if (liveRate == null) return null;
                  return (
                    <div
                      key={code}
                      className="rounded-2xl p-4 text-center transition hover:-translate-y-0.5"
                      style={{ background: isLightTheme ? theme.cardBg : theme.bg, border: `1px solid ${theme.border}` }}
                    >
                      <p className="text-2xl mb-1 leading-none">{meta.flag}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>{code}</p>
                      <p className="text-lg font-bold mt-1.5" style={{ color: theme.textPrimary }}>{meta.symbol}{fmt(goldBase24 / liveRate, 2)}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>per tola</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {goldBase2385 != null && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: theme.textMuted }}>
                Gold 23.85K in All Currencies (per tola)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {Object.entries(CURRENCY_META).map(([code, meta]) => {
                  const liveRate = rawCurrencies[code]?.liveRate ?? rawCurrencies[code]?.rate;
                  if (liveRate == null) return null;
                  return (
                    <div
                      key={code}
                      className="rounded-2xl p-4 text-center transition hover:-translate-y-0.5"
                      style={{ background: isLightTheme ? theme.cardBg : theme.bg, border: `1px solid ${theme.border}` }}
                    >
                      <p className="text-2xl mb-1 leading-none">{meta.flag}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>{code}</p>
                      <p className="text-lg font-bold mt-1.5" style={{ color: theme.textPrimary }}>{meta.symbol}{fmt(goldBase2385 / liveRate, 2)}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>per tola</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {silverBase != null && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: theme.textMuted }}>
                Silver 999 in All Currencies (per tola)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(CURRENCY_META).map(([code, meta]) => {
                  const liveRate = rawCurrencies[code]?.liveRate ?? rawCurrencies[code]?.rate;
                  if (liveRate == null) return null;
                  return (
                    <div
                      key={code}
                      className="rounded-2xl p-4 text-center transition hover:-translate-y-0.5"
                      style={{ background: isLightTheme ? theme.cardBg : theme.bg, border: `1px solid ${theme.border}` }}
                    >
                      <p className="text-2xl mb-1 leading-none">{meta.flag}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>{code}</p>
                      <p className="text-lg font-bold mt-1.5" style={{ color: theme.textPrimary }}>{meta.symbol}{fmt(silverBase / liveRate, 2)}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>per tola</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

     <Toast msg={toast.msg} type={toast.type} onClose={handleToastClose} />
    </div>
  );
}