import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { publicAPI } from '../../services/publicApi';
import { placeOrder, getProfile } from '../../services/customerApi';
import Navbar from '../../components/HomePage/Navbar';
import Footer from '../../components/HomePage/Footer';

// ─── Constants ────────────────────────────────────────────────────────────────
const TOLA_GRAMS  = 11.664;
const MASHA_GRAMS = TOLA_GRAMS / 12;
const RATTI_GRAMS = TOLA_GRAMS / 96;
const SUBMIT_COOLDOWN_MS = 3000;

const UNITS = [
  { value: 'tola',  label: 'Tola',  grams: TOLA_GRAMS,  abbr: 'T'  },
  { value: 'masha', label: 'Masha', grams: MASHA_GRAMS,  abbr: 'M'  },
  { value: 'ratti', label: 'Ratti', grams: RATTI_GRAMS,  abbr: 'Ra' },
  { value: 'gram',  label: 'Gram',  grams: 1,            abbr: 'g'  },
];

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar',     flag: '🇺🇸', symbol: '$'    },
  { value: 'SAR', label: 'Saudi Riyal',   flag: '🇸🇦', symbol: '﷼'   },
  { value: 'AED', label: 'UAE Dirham',    flag: '🇦🇪', symbol: 'د.إ' },
  { value: 'EUR', label: 'Euro',          flag: '🇪🇺', symbol: '€'   },
  { value: 'GBP', label: 'British Pound', flag: '🇬🇧', symbol: '£'   },
  { value: 'CHF', label: 'Swiss Franc',   flag: '🇨🇭', symbol: '₣'   },
];

const PAYMENT_METHODS = [
  { value: 'cash',   label: 'Cash',          icon: '💵' },
  { value: 'bank',   label: 'Bank Transfer',  icon: '🏦' },
  { value: 'online', label: 'Online',         icon: '📱' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toGrams = (qty, unit) => {
  const m = UNITS.find(u => u.value === unit)?.grams ?? 1;
  return parseFloat((qty * m).toFixed(6));
};

const decomposeGrams = (grams) => {
  if (!grams || grams <= 0) return { tola: 0, masha: 0, ratti: 0, gram: 0 };
  const totalRatti = grams / RATTI_GRAMS;
  const tola       = Math.floor(totalRatti / 96);
  const remaining  = totalRatti - tola * 96;
  const masha      = Math.floor(remaining / 8);
  const ratti      = Math.min(Math.max(0, Math.round(remaining - masha * 8)), 7);
  return { tola, masha, ratti, gram: parseFloat(grams.toFixed(4)) };
};

const formatPKR = (n, showDecimals = true) => {
  if (n == null || isNaN(n)) return 'PKR —';
  if (showDecimals) {
    return 'PKR ' + Number(n).toLocaleString('en-PK', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
  return 'PKR ' + Math.round(n).toLocaleString('en-PK');
};

const buildQuantityDisplay = (tola, masha, ratti, grams) => {
  const parts = [];
  if (tola  > 0) parts.push(`${tola}T`);
  if (masha > 0) parts.push(`${masha}M`);
  if (ratti > 0) parts.push(`${ratti}Ra`);
  if (!parts.length) parts.push('0T');
  return `${parts.join(' ')} (${grams.toFixed(4)} g)`;
};

const validatePhone = (phone) => {
  const d = phone.replace(/\D/g, '');
  if (!d.length)           return { isValid: false, message: 'Phone number is required' };
  if (d.length !== 11)     return { isValid: false, message: 'Must be 11 digits (e.g., 03001234567)' };
  if (!d.startsWith('03')) return { isValid: false, message: 'Must start with 03' };
  return { isValid: true, message: '' };
};

// ─── Theme style builder ───────────────────────────────────────────────────────
const useOrderStyles = (theme, isBuy, isLight) => {
  return useMemo(() => {
    const accent = isBuy ? theme.primary : (isLight ? theme.primaryDark : theme.primaryLight);
    return {
      accent,
      accentMuted:        `${accent}20`,
      accentBorder:       `${accent}40`,
      pageBg:             theme.bg,
      cardBg:             isLight ? theme.cardBg : `${theme.cardBg}dd`,
      cardBorder:         theme.border,
      textPrimary:        theme.textPrimary,
      textMuted:          theme.textMuted,
      inputBg:            isLight ? '#ffffff' : `${theme.bg}bb`,
      inputBorder:        theme.border,
      inputFocusBorder:   theme.primary,
      chipSelected:       `${accent}18`,
      chipSelectedBorder: `${accent}60`,
      chipSelectedText:   accent,
      chipBase:           isLight ? '#f0f0f0' : `${theme.cardBg}cc`,
      chipBaseBorder:     theme.border,
      chipBaseText:       theme.textPrimary,
      submitBg:           theme.primary,
      submitText:         isLight ? '#ffffff' : theme.logoText,
      glowColor:          theme.primary,
    };
  }, [theme, isBuy, isLight]);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children, required, styles }) {
  return (
    <label style={{ color: styles.textPrimary }}
      className="block text-sm font-semibold tracking-wide uppercase mb-2">
      {children}
      {required && <span style={{ color: styles.accent }} className="ml-1">*</span>}
    </label>
  );
}

function StyledInput({ icon, error, styles, className = '', ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={className}>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none"
            style={{ color: styles.accent }}>
            {icon}
          </span>
        )}
        <input
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            background:  styles.inputBg,
            borderColor: error ? '#ef4444' : focused ? styles.inputFocusBorder : styles.inputBorder,
            color:       styles.textPrimary,
            boxShadow:   focused ? `0 0 0 3px ${styles.inputFocusBorder}25` : 'none',
          }}
          className={`w-full border rounded-xl text-base font-medium placeholder-stone-400
            transition-all duration-200 outline-none
            ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3`}
          {...props}
        />
      </div>
      {error && <p className="text-red-400 text-sm mt-1.5 ml-1 font-medium">{error}</p>}
    </div>
  );
}

function Section({ title, icon, children, styles }) {
  return (
    <div style={{ background: styles.cardBg, borderColor: styles.cardBorder }}
      className="border rounded-2xl overflow-hidden shadow-sm">
      <div style={{ borderBottomColor: styles.cardBorder, background: styles.accentMuted }}
        className="px-5 py-4 border-b flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span style={{ color: styles.textPrimary }}
          className="text-sm font-bold tracking-widest uppercase">{title}</span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function Chip({ selected, onClick, styles, children, className = '' }) {
  const base = selected
    ? { background: styles.chipSelected, borderColor: styles.chipSelectedBorder, color: styles.chipSelectedText }
    : { background: styles.chipBase,     borderColor: styles.chipBaseBorder,     color: styles.chipBaseText };
  return (
    <button type="button" onClick={onClick} style={base}
      className={`relative px-3.5 py-3 rounded-xl border text-sm font-semibold
        transition-all duration-150 text-left ${className}`}>
      {children}
      {selected && (
        <span style={{ background: styles.accent }}
          className="absolute top-2 right-2 w-2 h-2 rounded-full" />
      )}
    </button>
  );
}

function TraditionalInput({ value, onChange, styles }) {
  const [rawTola, setRawTola] = useState('');
  const [rawMasha, setRawMasha] = useState('');
  const [rawRatti, setRawRatti] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (value === 0) { setRawTola(''); setRawMasha(''); setRawRatti(''); }
  }, [value]);

  const handleField = (field, input) => {
    let t = rawTola, m = rawMasha, r = rawRatti;
    
    if (field === 'tola') {
      const cleaned = input.replace(/\D/g, '');
      t = cleaned;
      setRawTola(t);
    }
    
    if (field === 'masha') {
      let cleaned = input.replace(/\D/g, '');
      let num = parseInt(cleaned) || 0;
      // ✅ FIX: Enforce max 11 Masha (12 Masha = 1 Tola)
      num = Math.min(num, 11);
      m = num.toString();
      setRawMasha(m);
    }
    
    if (field === 'ratti') {
      let cleaned = input.replace(/\D/g, '');
      let num = parseInt(cleaned) || 0;
      // ✅ FIX: Enforce max 7 Ratti (8 Ratti = 1 Masha)
      num = Math.min(num, 7);
      r = num.toString();
      setRawRatti(r);
    }
    
    // ✅ FIX: Proper calculation - no rounding until final step
    const totalRatti = ((parseInt(t) || 0) * 96) + ((parseInt(m) || 0) * 8) + (parseInt(r) || 0);
    const grams = parseFloat((totalRatti * RATTI_GRAMS).toFixed(6));
    onChange(grams);
  };

  const fieldStyle = (f) => ({
    background: styles.inputBg,
    borderColor: focusedField === f ? styles.inputFocusBorder : styles.inputBorder,
    color: styles.accent,
    boxShadow: focusedField === f ? `0 0 0 3px ${styles.inputFocusBorder}25` : 'none',
  });

  const gramDisplay = (value || 0).toFixed(4);
  
  // Get individual values for display
  const totalRatti = value / RATTI_GRAMS;
  const tolaFromVal = Math.floor(totalRatti / 96);
  const remainingRatti = totalRatti % 96;
  const mashaFromVal = Math.floor(remainingRatti / 8);
  const rattiFromVal = Math.round(remainingRatti % 8);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { field: 'tola', raw: rawTola, label: 'Tola', sub: `${TOLA_GRAMS}g each`, placeholder: '0', max: null },
          { field: 'masha', raw: rawMasha, label: 'Masha', sub: '12 per tola (0-11)', placeholder: '0', max: 11 },
          { field: 'ratti', raw: rawRatti, label: 'Ratti', sub: '8 per masha (0-7)', placeholder: '0', max: 7 },
        ].map(({ field, raw, label, sub, placeholder, max }) => (
          <div key={field}>
            <p style={{ color: styles.textPrimary }}
              className="text-sm font-bold tracking-wide uppercase mb-2 text-center">{label}</p>
            <input
              type="text" inputMode="numeric"
              value={raw} placeholder={placeholder}
              onFocus={e => { e.target.select(); setFocusedField(field); }}
              onBlur={() => setFocusedField(null)}
              onChange={e => handleField(field, e.target.value)}
              style={fieldStyle(field)}
              className="w-full border rounded-xl text-center text-3xl font-bold py-3 outline-none transition-all"
            />
            <p style={{ color: styles.textMuted }}
              className="text-xs text-center mt-1.5">{sub}</p>
            {max && parseInt(raw) > max && (
              <p className="text-xs text-center mt-0.5 text-red-400">Max {max}</p>
            )}
          </div>
        ))}
      </div>

      {/* ✅ FIX: Show current values from grams */}
      <div style={{ background: `${styles.accent}12`, borderColor: `${styles.accent}30` }}
        className="flex items-center justify-between px-4 py-3 rounded-xl border">
        <span style={{ color: styles.textPrimary }}
          className="text-sm font-bold tracking-widest uppercase">Total Breakdown</span>
        <div className="text-right">
          <span style={{ color: styles.accent }} className="text-base font-bold font-mono">
            {tolaFromVal > 0 && `${tolaFromVal}T `}
            {mashaFromVal > 0 && `${mashaFromVal}M `}
            {rattiFromVal > 0 && `${rattiFromVal}Ra `}
            {tolaFromVal === 0 && mashaFromVal === 0 && rattiFromVal === 0 && '0T'}
          </span>
          <span style={{ color: styles.textMuted }} className="text-xs block">{gramDisplay} g</span>
        </div>
      </div>

      {/* Quick add */}
      <div>
        <p style={{ color: styles.textMuted }}
          className="text-xs font-bold tracking-wider uppercase mb-2">Quick add (Tola)</p>
        <div className="flex gap-2 flex-wrap">
          {[0.5, 1, 2, 5, 10, 20, 50].map(n => (
            <button key={n} type="button"
              style={{ background: `${styles.accent}12`, borderColor: `${styles.accent}35`, color: styles.accent }}
              className="text-sm font-bold px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
              onClick={() => {
                const curTola = parseInt(rawTola) || 0;
                const newTola = curTola + n;
                setRawTola(String(newTola));
                const totalRatti = (newTola * 96) + ((parseInt(rawMasha) || 0) * 8) + (parseInt(rawRatti) || 0);
                onChange(parseFloat((totalRatti * RATTI_GRAMS).toFixed(6)));
              }}>+{n}T</button>
          ))}
          <button type="button"
            style={{ borderColor: styles.cardBorder, color: styles.textMuted }}
            className="text-sm font-bold px-3 py-1.5 rounded-lg border transition-all hover:opacity-80"
            onClick={() => { setRawTola(''); setRawMasha(''); setRawRatti(''); onChange(0); }}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceSummary({ calculation, styles, isCurrency, selectedCurrency, simpleQuantity, orderType }) {
  if (!calculation) {
    return (
      <div style={{ background: `${styles.accent}08`, borderColor: `${styles.accent}25` }}
        className="border rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">🧮</div>
        <p style={{ color: styles.textMuted }} className="text-base font-medium">
          Enter quantity to see price estimate
        </p>
      </div>
    );
  }

  const parts = !isCurrency ? decomposeGrams(calculation.grams) : null;

  return (
    <div style={{ borderColor: `${styles.accent}35` }} className="border rounded-2xl overflow-hidden">
      {/* Header */}
      <div style={{ background: `${styles.accent}15`, borderBottomColor: `${styles.accent}30` }}
        className="px-4 py-3.5 border-b flex items-center gap-2.5">
        <span className="text-base">💰</span>
        <span style={{ color: styles.accent }} className="text-sm font-bold tracking-widest uppercase">
          Price Estimate
        </span>
      </div>

      {/* Rates */}
      <div style={{ background: styles.cardBg }} className="p-4 space-y-3">
        {isCurrency ? (
          <>
            <Row label="Rate" styles={styles}>
              {selectedCurrency?.symbol}1 = {formatPKR(calculation.rate)}
            </Row>
            <Row label="Amount" styles={styles}>
              {selectedCurrency?.symbol}{parseFloat(simpleQuantity).toLocaleString('en', { minimumFractionDigits: 2 })}
            </Row>
          </>
        ) : (
          <>
            <Row label="Per Tola"  styles={styles}>{formatPKR(calculation.pricePerTola)}</Row>
            <Row label="Per Gram"  styles={styles}>{formatPKR(calculation.pricePerTola / TOLA_GRAMS)}</Row>
            <Row label="Per Masha" styles={styles}>{formatPKR(calculation.pricePerTola / 12)}</Row>
            <Row label="Per Ratti" styles={styles}>{formatPKR(calculation.pricePerTola / 96)}</Row>

            <div style={{ borderTopColor: styles.cardBorder }} className="border-t pt-3">
              <p style={{ color: styles.textPrimary }}
                className="text-xs font-bold tracking-widest uppercase mb-2.5">Breakdown</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Tola',  value: parts.tola  },
                  { label: 'Masha', value: parts.masha },
                  { label: 'Ratti', value: parts.ratti },
                  { label: 'Gram',  value: parseFloat(calculation.grams.toFixed(3)) },
                ].map(({ label, value }) => (
                  <div key={label}
                    style={{ background: `${styles.accent}10`, borderColor: `${styles.accent}25` }}
                    className="rounded-lg p-2.5 text-center border">
                    <p style={{ color: styles.textMuted }}
                      className="text-xs uppercase tracking-wide mb-1 font-semibold">{label}</p>
                    <p style={{ color: styles.accent }} className="text-lg font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Total */}
      <div style={{ background: `${styles.accent}12`, borderColor: `${styles.accent}30`,
        margin: '0 1rem 1rem', borderRadius: '0.75rem', border: '1px solid' }}
        className="px-4 py-4">
        <p style={{ color: styles.textMuted }}
          className="text-xs font-bold tracking-widest uppercase mb-1.5">Estimated Total</p>
        <p style={{ color: styles.accent }} className="text-4xl font-bold tracking-tight">
          {formatPKR(calculation.total)}
        </p>
        <p style={{ color: styles.textMuted }}
          className="text-xs mt-2 font-medium">Final price confirmed at time of payment</p>
      </div>
    </div>
  );
}

function Row({ label, children, styles }) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ color: styles.textMuted }} className="text-sm font-medium">{label}</span>
      <span style={{ color: styles.textPrimary }} className="text-sm font-bold font-mono">{children}</span>
    </div>
  );
}

function Toast({ toasts, onRemove }) {
  useEffect(() => {
    const timers = toasts.map(t => {
      const id = setTimeout(() => onRemove(t.id), 3500);
      return { id: t.id, timer: id };
    });
    return () => timers.forEach(({ timer }) => clearTimeout(timer));
  }, [toasts, onRemove]);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold shadow-xl border backdrop-blur-md pointer-events-auto
            ${t.type === 'error'   ? 'bg-red-950/95 border-red-500/30 text-red-200'       : ''}
            ${t.type === 'success' ? 'bg-teal-950/95 border-teal-500/30 text-teal-200'     : ''}
            ${t.type === 'info'    ? 'bg-stone-900/95 border-amber-500/30 text-amber-200'  : ''}`}>
          <span className="text-base">{t.type === 'error' ? '⚠️' : t.type === 'success' ? '✅' : 'ℹ️'}</span>
          <span className="flex-1 min-w-0">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PlaceOrderPage() {
  const { id: shopId }  = useParams();
  const [searchParams]  = useSearchParams();
  const orderType       = searchParams.get('type') || 'buy';
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const { theme, isLightTheme } = useTheme();

  const isBuy = orderType === 'buy';

  const [shop,        setShop]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState(false);
  const [successMsg,  setSuccessMsg]  = useState('');
  const [toasts,      setToasts]      = useState([]);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const lastSubmitRef = useRef(0);
  const toastIdRef    = useRef(0);

  // Contact
  const [name,          setName]          = useState('');
  const [phone,         setPhone]         = useState('');
  const [whatsapp,      setWhatsapp]      = useState('');
  const [email,         setEmail]         = useState('');
  const [city,          setCity]          = useState('');
  const [address,       setAddress]       = useState('');
  const [phoneError,    setPhoneError]    = useState('');
  const [whatsappError, setWhatsappError] = useState('');

  // Order
  const [metalType,     setMetalType]     = useState('gold');
  const [carat,         setCarat]         = useState('24k');
  const [currencyType,  setCurrencyType]  = useState('USD');
  const [quantityGrams, setQuantityGrams] = useState(0);
  const [simpleQty,     setSimpleQty]     = useState('');
  const [unit,          setUnit]          = useState('tola');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes,         setNotes]         = useState('');
  const [inputMode,     setInputMode]     = useState('traditional');

  const isCurrency = metalType === 'currency';
  const styles     = useOrderStyles(theme, isBuy, isLightTheme);

  // Toasts
  const showToast  = useCallback((message, type = 'error') => {
    const id = ++toastIdRef.current;
    setToasts(p => [...p, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);

  // Load shop
  useEffect(() => {
    let mounted = true;
    window.scrollTo(0, 0);
    setLoading(true);
    publicAPI.getShopDetail(shopId)
      .then(r  => { if (mounted) { setShop(r.data.shop); setLoading(false); } })
      .catch(e => { if (mounted) { setError(e.response?.data?.message || 'Shop not found'); setLoading(false); } });
    return () => { mounted = false; };
  }, [shopId]);

  // Load profile
  useEffect(() => {
    let mounted = true;
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    if (user.role === 'customer') {
      getProfile()
        .then(r => {
          if (mounted) {
            const c = r.data?.customer;
            if (c) {
              setName(c.name || ''); setPhone(c.phoneNumber || '');
              setWhatsapp(c.whatsappNumber || ''); setEmail(c.email || '');
              setCity(c.city || ''); setAddress(c.address || '');
            }
          }
        })
        .catch(() => { if (mounted) { setPhone(user.phoneNumber || ''); setWhatsapp(user.whatsappNumber || ''); } });
    } else {
      setPhone(user.phoneNumber || '');
      setWhatsapp(user.whatsappNumber || '');
    }
    return () => { mounted = false; };
  }, [user]);

  // Calculation
  const calculation = useMemo(() => {
    if (!shop) return null;
    if (isCurrency) {
      const amount = parseFloat(simpleQty);
      if (!amount || amount <= 0) return null;
      const cd = shop.currencies?.[currencyType];
      if (!cd) return null;
      const rate = isBuy ? cd.sellRate : cd.buyRate;
      if (!rate || rate <= 0) return null;
      return { rate, amount, total: Math.round(amount * rate * 100) / 100, isCurrency: true };
    }
    const grams = inputMode === 'traditional'
      ? quantityGrams
      : toGrams(parseFloat(simpleQty) || 0, unit);
    if (!grams || grams <= 0) return null;
    let pricePerTola;
    if (metalType === 'gold') {
      pricePerTola = isBuy
        ? (carat === '24k' ? shop.prices?.sell_24k   : shop.prices?.sell_2385k)
        : (carat === '24k' ? shop.prices?.buy_24k    : shop.prices?.buy_2385k);
    } else {
      pricePerTola = isBuy ? shop.prices?.sell_silver : shop.prices?.buy_silver;
    }
    if (!pricePerTola || pricePerTola <= 0) return null;
    const total = Math.round((grams / TOLA_GRAMS) * pricePerTola * 100) / 100;
    return { pricePerTola, grams, qtyInTola: grams / TOLA_GRAMS, total, isCurrency: false };
  }, [shop, isCurrency, simpleQty, currencyType, isBuy, inputMode, quantityGrams, unit, metalType, carat]);

  const handlePhoneChange = (val, setter, errSetter) => {
    const d = val.replace(/\D/g, '').slice(0, 11);
    setter(d);
    const v = validatePhone(d);
    errSetter(v.isValid ? '' : v.message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastSubmitRef.current < SUBMIT_COOLDOWN_MS) {
      showToast(`Wait ${Math.ceil((SUBMIT_COOLDOWN_MS - (now - lastSubmitRef.current)) / 1000)}s before resubmitting`, 'info');
      return;
    }
    if (!name.trim())                        { showToast('Please enter your full name', 'error'); return; }
    const pv = validatePhone(phone);
    if (!pv.isValid)                         { showToast(pv.message, 'error'); return; }
    if (whatsapp && !validatePhone(whatsapp).isValid) { showToast('Invalid WhatsApp number', 'error'); return; }
    if (!calculation)                        { showToast('Please enter a valid quantity', 'error'); return; }
    lastSubmitRef.current = Date.now();

    setSubmitting(true);
    try {
      const grams = isCurrency ? 0 : calculation.grams;
      const bd    = !isCurrency ? decomposeGrams(grams) : { tola: 0, masha: 0, ratti: 0 };
      const qd    = isCurrency
        ? `${simpleQty} ${currencyType}`
        : buildQuantityDisplay(bd.tola, bd.masha, bd.ratti, grams);
      const rawQty  = isCurrency ? calculation.amount : (inputMode === 'traditional' ? grams : parseFloat(simpleQty) || 0);
      const rawUnit = isCurrency ? currencyType        : (inputMode === 'traditional' ? 'gram' : unit);

      const r = await placeOrder({
        adminId: shopId, orderType, metalType,
        carat: metalType !== 'gold' ? '24k' : carat,
        quantity: rawQty, unit: rawUnit,
        quantityInGrams: grams, quantityInTola: bd.tola,
        quantityInMasha: bd.masha, quantityInRatti: bd.ratti,
        quantityDisplay: qd, inputMode, paymentMethod,
        notes: notes.trim() || null, totalAmount: calculation.total,
        customerName: name.trim(), customerPhone: phone.trim(),
        customerWhatsapp: whatsapp.trim() || phone.trim(),
        customerEmail: email.trim(),
        customerAddress: address.trim() || null,
        customerCity: city.trim() || null,
      });
      setSuccess(true);
      setSuccessMsg(r.data?.message || `Request sent to ${shop?.shopName}`);
      window.scrollTo(0, 0);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.value === currencyType);

  const PageWrap = ({ children }) => (
    <div style={{ background: theme.bg, color: theme.textPrimary }}
      className="min-h-screen flex flex-col font-sans">
      <Navbar />{children}
    </div>
  );

  if (loading) return (
    <PageWrap>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div style={{ borderColor: `${styles.accent}30`, borderTopColor: styles.accent }}
          className="w-10 h-10 border-2 rounded-full animate-spin" />
        <p style={{ color: styles.textMuted }} className="text-base font-medium tracking-widest uppercase">
          Loading shop details…
        </p>
      </div>
    </PageWrap>
  );

  if (error) return (
    <PageWrap>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-900/20 border border-red-500/20 flex items-center justify-center text-3xl">⚠️</div>
        <h2 style={{ color: theme.textPrimary }} className="text-2xl font-serif font-bold">Shop Not Found</h2>
        <p style={{ color: styles.textMuted }} className="text-base max-w-md">{error}</p>
        <button onClick={() => navigate(-1)}
          style={{ background: styles.accent, color: styles.submitText }}
          className="mt-3 px-6 py-3 rounded-xl font-bold text-base transition-opacity hover:opacity-90">
          ← Go Back
        </button>
      </div>
    </PageWrap>
  );

  if (success) return (
    <PageWrap>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="relative w-24 h-24 mb-2">
          <div style={{ borderColor: `${styles.accent}30` }}
            className="absolute inset-0 rounded-full border-2 animate-ping opacity-20" />
          <div style={{ background: `${styles.accent}15`, borderColor: `${styles.accent}40` }}
            className="absolute inset-2 rounded-full border-2 flex items-center justify-center text-4xl">✓</div>
        </div>
        <h2 style={{ color: theme.textPrimary }} className="text-3xl font-serif font-bold">Request Sent!</h2>
        <p style={{ color: styles.textMuted }} className="text-base max-w-sm leading-relaxed">{successMsg}</p>
        <p style={{ color: styles.textMuted }} className="text-sm max-w-xs opacity-70">
          {shop?.shopName} will review your request and contact you shortly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-5 w-full max-w-xs">
          <button onClick={() => navigate('/')}
            style={{ background: styles.accent, color: styles.submitText }}
            className="flex-1 px-5 py-3 rounded-xl font-bold text-base transition-opacity hover:opacity-90">
            Back to Home
          </button>
          <button onClick={() => navigate('/my-orders')}
            style={{ borderColor: styles.cardBorder, color: styles.textMuted }}
            className="flex-1 px-5 py-3 rounded-xl font-semibold text-base border transition-opacity hover:opacity-80">
            View Orders
          </button>
        </div>
      </div>
      <Footer />
    </PageWrap>
  );

  // ── Main Form ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: theme.bg, color: theme.textPrimary }} className="min-h-screen font-sans">
      <Navbar />
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div style={{ background: styles.glowColor }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-[130px] opacity-[0.06]" />
      </div>

      {/* ── Page header ── */}
      <div style={{ borderBottomColor: styles.cardBorder }} className="pt-20 pb-6 px-4 border-b">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate(-1)}
            style={{ color: styles.textMuted }}
            className="flex items-center gap-2 text-sm font-semibold mb-5 transition-opacity hover:opacity-80">
            ← Back
          </button>
          <div className="flex items-start sm:items-center gap-4">
            <div style={{ background: `${styles.accent}15`, borderColor: `${styles.accent}40`, color: styles.accent }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-lg font-bold border-2 shrink-0 overflow-hidden">
              {shop?.shopLogo
                ? <img src={shop.shopLogo} alt={shop.shopName} className="w-full h-full object-cover" />
                : shop?.shopName?.charAt(0) || 'S'}
            </div>
            <div className="min-w-0">
              <div style={{ background: `${styles.accent}15`, borderColor: `${styles.accent}40`, color: styles.accent }}
                className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full border mb-1.5">
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {isBuy ? 'Purchase Order' : 'Sale Order'}
              </div>
              <h1 style={{ color: theme.textPrimary }} className="text-xl sm:text-2xl font-serif font-bold leading-tight">
                {isBuy ? 'Buy from ' : 'Sell to '}
                <span style={{ color: styles.accent }}>{shop?.shopName}</span>
              </h1>
              {(shop?.city || shop?.phoneNumber) && (
                <p style={{ color: styles.textMuted }} className="text-sm mt-1 font-medium">
                  {[shop.city, shop.phoneNumber].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky summary bar ── */}
      {calculation && (
        <div style={{ background: styles.cardBg, borderBottomColor: styles.cardBorder }}
          className="lg:hidden sticky top-0 z-30 border-b px-4 py-3 flex items-center justify-between">
          <div>
            <p style={{ color: styles.textMuted }} className="text-xs uppercase tracking-widest font-bold">Est. Total</p>
            <p style={{ color: styles.accent }} className="text-xl font-bold leading-tight">
              {formatPKR(calculation.total)}
            </p>
          </div>
          <button type="button"
            style={{ background: `${styles.accent}18`, color: styles.accent, borderColor: `${styles.accent}35` }}
            onClick={() => setSummaryOpen(v => !v)}
            className="text-sm font-bold px-4 py-2 rounded-lg border">
            {summaryOpen ? 'Hide ▲' : 'Details ▼'}
          </button>
        </div>
      )}

      {/* ── Mobile summary drawer ── */}
      {summaryOpen && calculation && (
        <div style={{ background: styles.cardBg, borderBottomColor: styles.cardBorder }}
          className="lg:hidden border-b px-4 py-5">
          <PriceSummary
            calculation={calculation} styles={styles}
            isCurrency={isCurrency} selectedCurrency={selectedCurrency}
            simpleQuantity={simpleQty} orderType={orderType}
          />
        </div>
      )}

      {/* ── Layout ── */}
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── Left column ── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* Contact */}
              <Section title="Contact Details" icon="👤" styles={styles}>
                <div className="space-y-4">
                  <div>
                    <FieldLabel required styles={styles}>Full Name</FieldLabel>
                    <StyledInput icon="✦" styles={styles}
                      value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your full name" required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel required styles={styles}>Phone Number</FieldLabel>
                      <StyledInput icon="📞" type="tel" styles={styles}
                        value={phone} maxLength={11}
                        onChange={e => handlePhoneChange(e.target.value, setPhone, setPhoneError)}
                        onBlur={() => phone && !validatePhone(phone).isValid && setPhoneError('Must be 11 digits starting with 03')}
                        placeholder="03001234567" error={phoneError} required />
                    </div>
                    <div>
                      <FieldLabel styles={styles}>WhatsApp (Optional)</FieldLabel>
                      <StyledInput icon="💬" type="tel" styles={styles}
                        value={whatsapp} maxLength={11}
                        onChange={e => handlePhoneChange(e.target.value, setWhatsapp, setWhatsappError)}
                        onBlur={() => whatsapp && !validatePhone(whatsapp).isValid && setWhatsappError('Must be 11 digits starting with 03')}
                        placeholder="03001234567" error={whatsappError} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel styles={styles}>Email</FieldLabel>
                      <StyledInput icon="✉️" type="email" styles={styles}
                        value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="email@example.com" readOnly={!!user?.email} />
                    </div>
                    <div>
                      <FieldLabel styles={styles}>City</FieldLabel>
                      <StyledInput icon="📍" styles={styles}
                        value={city} onChange={e => setCity(e.target.value)}
                        placeholder="Your city" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel styles={styles}>Address (Optional)</FieldLabel>
                    <StyledInput icon="🏠" styles={styles}
                      value={address} onChange={e => setAddress(e.target.value)}
                      placeholder="Street address" />
                  </div>
                </div>
              </Section>

              {/* Order Details */}
              <Section title="Order Details" icon="🛒" styles={styles}>
                <div className="space-y-5">

                  {/* Item type */}
                  <div>
                    <FieldLabel styles={styles}>Item Type</FieldLabel>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { value: 'gold',     emoji: '🪙', label: 'Gold'     },
                        { value: 'silver',   emoji: '🥈', label: 'Silver'   },
                        { value: 'currency', emoji: '💱', label: 'Currency' },
                      ].map(({ value, emoji, label }) => (
                        <Chip key={value} styles={styles} selected={metalType === value}
                          onClick={() => { setMetalType(value); setQuantityGrams(0); setSimpleQty(''); }}>
                          <span className="text-2xl block mb-1">{emoji}</span>
                          <span className="text-sm font-semibold block">{label}</span>
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* Gold purity */}
                  {metalType === 'gold' && (
                    <div>
                      <FieldLabel styles={styles}>Purity</FieldLabel>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { value: '24k',    label: '24 Karat',    sub: '99.9% Pure' },
                          { value: '23.85k', label: '23.85 Karat', sub: '99.4% Pure' },
                        ].map(({ value, label, sub }) => (
                          <Chip key={value} styles={styles} selected={carat === value} onClick={() => setCarat(value)}>
                            <span style={{ color: styles.textMuted }} className="text-xs font-mono font-bold">Au</span>
                            <span className="text-base font-bold block mt-0.5">{label}</span>
                            <span style={{ color: styles.textMuted }} className="text-xs font-medium">{sub}</span>
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Currency picker */}
                  {isCurrency && (
                    <div>
                      <FieldLabel styles={styles}>Select Currency</FieldLabel>
                      {CURRENCIES.filter(c => shop?.currencies?.[c.value]).length === 0 ? (
                        <p style={{ color: styles.textMuted }} className="text-base text-center py-5">
                          No currency rates available.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {CURRENCIES.filter(c => shop?.currencies?.[c.value]).map(({ value, label, flag, symbol }) => {
                            const rate = isBuy ? shop.currencies[value].sellRate : shop.currencies[value].buyRate;
                            return (
                              <Chip key={value} styles={styles} selected={currencyType === value}
                                onClick={() => { setCurrencyType(value); setSimpleQty(''); }}
                                className="w-full">
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl">{flag}</span>
                                    <div>
                                      <p className="text-sm font-bold">{label}</p>
                                      <p style={{ color: styles.textMuted }} className="text-xs font-medium">{value}</p>
                                    </div>
                                  </div>
                                  {rate && (
                                    <span style={{ color: styles.accent }}
                                      className="text-sm font-mono font-bold">
                                      {symbol}1 = {formatPKR(rate)}
                                    </span>
                                  )}
                                </div>
                              </Chip>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quantity */}
                  {!isCurrency && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <FieldLabel styles={styles}>Quantity</FieldLabel>
                        <div style={{ background: `${styles.accent}10`, borderColor: styles.cardBorder }}
                          className="flex gap-1 rounded-lg p-1 border">
                          {[
                            { value: 'traditional', label: 'T · M · R' },
                            { value: 'simple',       label: 'Simple'    },
                          ].map(({ value, label }) => (
                            <button key={value} type="button"
                              onClick={() => { setInputMode(value); setQuantityGrams(0); setSimpleQty(''); }}
                              style={inputMode === value
                                ? { background: `${styles.accent}25`, color: styles.accent }
                                : { color: styles.textMuted }}
                              className="text-xs font-bold px-3 py-2 rounded-md transition-all">
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {inputMode === 'traditional' ? (
                        <TraditionalInput value={quantityGrams} onChange={setQuantityGrams} styles={styles} />
                      ) : (
                        <>
                          <div className="flex gap-2.5">
                            <input
                              type="text" inputMode="decimal"
                              value={simpleQty}
                              onChange={e => { const v = e.target.value; if (v===''||/^\d*\.?\d{0,4}$/.test(v)) setSimpleQty(v); }}
                              placeholder="0.000"
                              style={{ background: styles.inputBg, borderColor: styles.inputBorder, color: styles.accent }}
                              className="flex-1 border rounded-xl text-4xl font-bold tracking-tight pl-5 pr-4 py-4 outline-none transition-all min-w-0"
                            />
                            <div style={{ borderColor: styles.cardBorder }}
                              className="flex flex-col border rounded-xl overflow-hidden shrink-0">
                              {UNITS.map(u => (
                                <button key={u.value} type="button"
                                  onClick={() => setUnit(u.value)}
                                  style={unit === u.value
                                    ? { background: `${styles.accent}18`, color: styles.accent }
                                    : { background: styles.cardBg, color: styles.textMuted }}
                                  className="flex-1 px-4 text-sm font-bold border-b last:border-0 transition-all"
                                  style={{
                                    ...(unit === u.value
                                      ? { background: `${styles.accent}18`, color: styles.accent }
                                      : { background: styles.cardBg, color: styles.textMuted }),
                                    borderBottomColor: styles.cardBorder,
                                  }}>
                                  {u.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {simpleQty && parseFloat(simpleQty) > 0 && (
                            <div className="mt-3 grid grid-cols-4 gap-2">
                              {(() => {
                                const g = toGrams(parseFloat(simpleQty)||0, unit);
                                const d = decomposeGrams(g);
                                return [
                                  { label: 'Tola',  value: d.tola  },
                                  { label: 'Masha', value: d.masha },
                                  { label: 'Ratti', value: d.ratti },
                                  { label: 'Gram',  value: parseFloat(g.toFixed(3)) },
                                ].map(({ label, value }) => (
                                  <div key={label}
                                    style={{ background: `${styles.accent}10`, borderColor: `${styles.accent}25` }}
                                    className="rounded-lg p-2.5 text-center border">
                                    <p style={{ color: styles.textMuted }}
                                      className="text-xs uppercase tracking-wide mb-1 font-semibold">{label}</p>
                                    <p style={{ color: styles.accent }} className="text-lg font-bold">{value}</p>
                                  </div>
                                ));
                              })()}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Currency amount */}
                  {isCurrency && shop?.currencies?.[currencyType] && (
                    <div>
                      <FieldLabel styles={styles}>Amount in {currencyType}</FieldLabel>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                          {selectedCurrency?.flag}
                        </span>
                        <input
                          type="text" inputMode="decimal"
                          value={simpleQty}
                          onChange={e => { const v = e.target.value; if (v===''||/^\d*\.?\d{0,2}$/.test(v)) setSimpleQty(v); }}
                          placeholder="0.00"
                          style={{ background: styles.inputBg, borderColor: styles.inputBorder, color: styles.accent }}
                          className="w-full border rounded-xl text-4xl font-bold pl-12 pr-5 py-4 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Payment method */}
                  <div>
                    <FieldLabel styles={styles}>Payment Method</FieldLabel>
                    <div className="grid grid-cols-3 gap-2.5">
                      {PAYMENT_METHODS.map(({ value, label, icon }) => (
                        <Chip key={value} styles={styles} selected={paymentMethod === value}
                          onClick={() => setPaymentMethod(value)}>
                          <span className="text-2xl block mb-1">{icon}</span>
                          <span className="text-sm font-semibold block">{label}</span>
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <FieldLabel styles={styles}>Special Instructions</FieldLabel>
                    <textarea
                      value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Any special requests or additional information…"
                      rows={3}
                      style={{
                        background: styles.inputBg,
                        borderColor: styles.inputBorder,
                        color: theme.textPrimary,
                      }}
                      className="w-full border rounded-xl text-base font-medium placeholder-stone-400 px-4 py-3 outline-none resize-none transition-all"
                    />
                  </div>
                </div>
              </Section>

              {/* Mobile submit */}
              <div className="lg:hidden space-y-3">
                <button type="submit"
                  disabled={!calculation || submitting}
                  style={calculation && !submitting
                    ? { background: styles.submitBg, color: styles.submitText }
                    : { background: styles.chipBase, color: styles.textMuted, opacity: 0.6 }}
                  className="w-full py-4 rounded-2xl font-bold text-base tracking-wide flex items-center justify-center gap-2.5 transition-all duration-200 disabled:cursor-not-allowed">
                  {submitting ? (
                    <>
                      <div style={{ borderColor: `${styles.submitText}40`, borderTopColor: styles.submitText }}
                        className="w-5 h-5 border-2 rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>📤 Submit {isBuy ? 'Purchase' : 'Sale'} Request</>
                  )}
                </button>
                <p style={{ color: styles.textMuted }}
                  className="text-center text-sm font-medium flex items-center justify-center gap-2 opacity-70">
                  🔒 Prices confirmed at time of payment
                </p>
              </div>
            </div>

            {/* ── Right sticky sidebar (desktop) ── */}
            <div className="hidden lg:block w-80 shrink-0 sticky top-24 space-y-4">
              <PriceSummary
                calculation={calculation} styles={styles}
                isCurrency={isCurrency} selectedCurrency={selectedCurrency}
                simpleQuantity={simpleQty} orderType={orderType}
              />

              <button type="submit"
                disabled={!calculation || submitting}
                style={calculation && !submitting
                  ? { background: styles.submitBg, color: styles.submitText }
                  : { background: styles.chipBase, color: styles.textMuted, opacity: 0.6 }}
                className="w-full py-4 rounded-2xl font-bold text-base tracking-wide flex items-center justify-center gap-2.5 transition-all duration-200 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.99]">
                {submitting ? (
                  <>
                    <div style={{ borderColor: `${styles.submitText}40`, borderTopColor: styles.submitText }}
                      className="w-5 h-5 border-2 rounded-full animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>📤 Submit {isBuy ? 'Purchase' : 'Sale'} Request</>
                )}
              </button>

              <p style={{ color: styles.textMuted }}
                className="text-center text-sm font-medium flex items-center justify-center gap-2 opacity-70">
                🔒 Prices confirmed at time of payment
              </p>

              {/* Live rates */}
              {shop?.prices && !isCurrency && (
                <div style={{ background: styles.cardBg, borderColor: styles.cardBorder }}
                  className="border rounded-xl p-5">
                  <p style={{ color: styles.textPrimary }}
                    className="text-sm font-bold tracking-widest uppercase mb-4">Current Rates</p>
                  <div className="space-y-3">
                    {shop.prices.sell_24k && (
                      <div className="flex justify-between items-center">
                        <span style={{ color: styles.textMuted }} className="text-sm font-medium">Gold 24k</span>
                        <span style={{ color: theme.textPrimary }}
                          className="text-sm font-mono font-bold">{formatPKR(shop.prices.sell_24k)}/T</span>
                      </div>
                    )}
                    {shop.prices.sell_2385k && (
                      <div className="flex justify-between items-center">
                        <span style={{ color: styles.textMuted }} className="text-sm font-medium">Gold 23.85k</span>
                        <span style={{ color: theme.textPrimary }}
                          className="text-sm font-mono font-bold">{formatPKR(shop.prices.sell_2385k)}/T</span>
                      </div>
                    )}
                    {shop.prices.sell_silver && (
                      <div className="flex justify-between items-center">
                        <span style={{ color: styles.textMuted }} className="text-sm font-medium">Silver 999</span>
                        <span style={{ color: theme.textPrimary }}
                          className="text-sm font-mono font-bold">{formatPKR(shop.prices.sell_silver)}/T</span>
                      </div>
                    )}
                    <div style={{ borderTopColor: styles.cardBorder }} className="border-t pt-3 mt-1">
                      <div className="flex justify-between items-center">
                        <span style={{ color: styles.textMuted }} className="text-xs font-medium">Last updated</span>
                        <span style={{ color: styles.textMuted }} className="text-xs font-medium">
                          {new Date().toLocaleTimeString('en-PK')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}