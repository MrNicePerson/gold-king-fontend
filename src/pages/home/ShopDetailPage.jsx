// pages/ShopDetailPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { publicAPI } from '../../services/publicApi';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLivePrices } from '../../hooks/useLivePrices';
import PrivacyAgreementModal from '../../components/HomePage/PrivacyAgreementModal';
import { registerWithShop, checkShopRegistration } from '../../services/customerApi';
import Navbar from '../../components/HomePage/Navbar';
import { formatNumberByLanguage } from '../../utils/formatUtils';

// ── Constants ─────────────────────────────────────────────────────────────────
const CURRENCY_ORDER = ['USD', 'SAR', 'AED', 'GBP', 'EUR', 'CHF'];
const CURRENCY_FLAGS = { USD: '🇺🇸', SAR: '🇸🇦', AED: '🇦🇪', GBP: '🇬🇧', EUR: '🇪🇺', CHF: '🇨🇭' };
const CURRENCY_NAMES = { USD: 'US Dollar', SAR: 'Saudi Riyal', AED: 'UAE Dirham', GBP: 'British Pound', EUR: 'Euro', CHF: 'Swiss Franc' };
const PRICE_TABS = [
  { key: 'gold', label: 'Gold', icon: '🥇' },
  { key: 'silver', label: 'Silver', icon: '🥈' },
  { key: 'currency', label: 'Currency', icon: '💱' },
];

const fmt = (n, lang = 'en') => n != null ? formatNumberByLanguage(n, lang) : '—';

// ── Live price calculation (weight × live market rate) ─────────────────────
//
// The WhatsApp inquiry used to send the shop's stored `pic.price`. Per the
// client's request, it should instead send a price computed live: the
// current market rate (per tola) multiplied by the item's actual weight —
// converting gram/tola/masha to tola first, since market rates are quoted
// per tola.
const GRAMS_PER_TOLA = 11.6638;   // 1 tola = 11.6638 grams
const MASHA_PER_TOLA = 12;        // 1 tola = 12 masha

// Converts any supported weight unit into tola.
const toTola = (weight, unit) => {
    const w = Number(weight) || 0;
    switch ((unit || '').toLowerCase()) {
        case 'tola':
            return w;
        case 'masha':
            return w / MASHA_PER_TOLA;
        case 'gram':
        case 'g':
        default:
            return w / GRAMS_PER_TOLA;
    }
};

// Picks the right live per-tola rate for an item based on its type
// (gold/silver) and, for gold, its purity/karat if the item has one
// (falls back to 24K when no purity is specified).
const getLiveRatePerTola = (pic, marketPrices) => {
    if (!marketPrices) return null;

    if (pic?.type === 'silver') {
        return marketPrices.silver?.per_tola_PKR ?? null;
    }

    const purity = String(pic?.purity ?? pic?.karat ?? '');
    if (purity.includes('23.85') || purity.includes('2385')) {
        return marketPrices.gold?.per_tola_PKR_2385k ?? null;
    }

    return marketPrices.gold?.per_tola_PKR_24k ?? null;
};

// Live price for a gallery item = live rate/tola × item weight in tola.
const computeLiveItemPrice = (pic, marketPrices) => {
    const ratePerTola = getLiveRatePerTola(pic, marketPrices);
    if (ratePerTola == null) return null;

    const tolas = toTola(pic?.weight, pic?.weightUnit);
    if (!tolas) return null;

    return Math.round(ratePerTola * tolas);
};

// ── Validation ────────────────────────────────────────────────────────────────
const validateRegForm = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Full name is required';
  else if (form.name.trim().length < 3) errors.name = 'Name must be at least 3 characters';
  if (!form.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
  else if (!/^(0|\+92)\d{10}$/.test(form.phoneNumber.replace(/[-\s]/g, '')))
    errors.phoneNumber = 'Enter a valid Pakistani number (03XX-XXXXXXX)';
  // Email removed from registration
  return errors;
};

// ── Image Lightbox ────────────────────────────────────────────────────────────
const ImageLightbox = ({ images, initialIndex, onClose, theme }) => {
  const [idx, setIdx] = useState(initialIndex);
  const total = images.length;
  const p = theme.primary;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % total);
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + total) % total);
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = 'unset';
    };
  }, [total, onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.98)' }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl transition-all duration-200"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
      >
        ×
      </button>

      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx(i => (i - 1 + total) % total); }}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl transition-all duration-200"
            style={{ background: `${p}25`, border: `1px solid ${p}50`, color: p }}
          >
            ‹
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx(i => (i + 1) % total); }}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-2xl sm:text-3xl transition-all duration-200"
            style={{ background: `${p}25`, border: `1px solid ${p}50`, color: p }}
          >
            ›
          </button>
        </>
      )}

      <img
        src={images[idx]?.imageUrl || images[idx]}
        alt=""
        className="max-h-[80vh] max-w-[85vw] sm:max-h-[86vh] sm:max-w-[88vw] object-contain rounded-xl"
        onClick={e => e.stopPropagation()}
      />

      {total > 1 && (
        <p className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {idx + 1} / {total}
        </p>
      )}
    </div>
  );
};

// ── Registration Form ──────────────────────────────────────────────────────────
function RegistrationForm({ shop, user, onSuccess, onCancel, theme, showToast }) {
  const p = theme.primary;
  const [form, setForm] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    whatsappNumber: user?.whatsappNumber || user?.phoneNumber || '',
    address: user?.address || '',
    city: user?.city || '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPolicy, setShowPolicy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (touched[field]) {
      const errs = validateRegForm({ ...form, [field]: value });
      setErrors(e => ({ ...e, [field]: errs[field] }));
    }
  };

  const handleBlur = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
    const errs = validateRegForm(form);
    setErrors(e => ({ ...e, [field]: errs[field] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, phoneNumber: true });
    const errs = validateRegForm(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) setShowPolicy(true);
  };

  const handlePolicyAccept = async () => {
    setShowPolicy(false);
    setSubmitting(true);
    setServerError('');
    try {
      await registerWithShop(shop.id, { ...form, policyAgreed: true });
      onSuccess('pending');
      showToast('Registration request sent successfully!', 'success');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = {
    background: theme.isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
    color: theme.textPrimary,
    border: `1px solid ${p}25`,
    transition: 'all 0.2s',
  };
  const inputError = { ...inputBase, borderColor: '#ef444480' };
  // CHANGED: label now 11px (was 10px), opacity removed so it's fully visible via textMuted
  const labelStyle = { color: theme.textMuted, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', display: 'block' };

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{ background: theme.cardBg, border: `1px solid ${p}20` }}
      >
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p}50, transparent)` }} />

        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
              style={{ background: `${p}15`, border: `1px solid ${p}30` }}>
              📝
            </div>
            <div>
              {/* CHANGED: text-base sm:text-lg → text-lg sm:text-xl */}
              <h3 className="text-lg sm:text-xl font-bold" style={{ color: theme.textPrimary, fontFamily: '"Playfair Display", serif' }}>
                Register with {shop.shopName}
              </h3>
              {/* CHANGED: text-xs → text-sm */}
              <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>Fill in your details to begin trading</p>
            </div>
          </div>

          {serverError && (
            <div className="mb-4 p-3 rounded-lg flex items-start gap-2 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label style={labelStyle}>Full Name <span style={{ color: p }}>*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  // CHANGED: text-sm → text-base
                  className="w-full px-3 py-2.5 rounded-lg text-base focus:outline-none"
                  style={errors.name && touched.name ? inputError : inputBase}
                  placeholder="Your full name"
                />
                {/* CHANGED: text-xs → text-sm */}
                {errors.name && touched.name && <p className="text-sm mt-1" style={{ color: '#f87171' }}>{errors.name}</p>}
              </div>

              <div>
                <label style={labelStyle}>Phone <span style={{ color: p }}>*</span></label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={e => handleChange('phoneNumber', e.target.value)}
                  onBlur={() => handleBlur('phoneNumber')}
                  className="w-full px-3 py-2.5 rounded-lg text-base focus:outline-none"
                  style={errors.phoneNumber && touched.phoneNumber ? inputError : inputBase}
                  placeholder="03XX-XXXXXXX"
                />
                {errors.phoneNumber && touched.phoneNumber && <p className="text-sm mt-1" style={{ color: '#f87171' }}>{errors.phoneNumber}</p>}
              </div>

              <div>
                <label style={labelStyle}>WhatsApp</label>
                <input
                  type="tel"
                  value={form.whatsappNumber}
                  onChange={e => handleChange('whatsappNumber', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-base focus:outline-none"
                  style={inputBase}
                  placeholder="03XX-XXXXXXX"
                />
              </div>



              <div>
                <label style={labelStyle}>City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-base focus:outline-none"
                  style={inputBase}
                  placeholder="Your city"
                />
              </div>

              <div>
                <label style={labelStyle}>Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-base focus:outline-none"
                  style={inputBase}
                  placeholder="Street address"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5 sm:mt-6">
              <button
                type="button"
                onClick={onCancel}
                // CHANGED: text-sm → text-base
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-base transition-all duration-200"
                style={{ border: `1px solid ${p}30`, color: theme.textMuted, background: 'transparent' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: theme.gradient, color: theme.logoText, boxShadow: `0 4px 15px ${p}30` }}
              >
                {submitting ? 'Submitting...' : 'Send Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <PrivacyAgreementModal
        open={showPolicy}
        onAccept={handlePolicyAccept}
        onCancel={() => setShowPolicy(false)}
        shopName={shop.shopName}
        isRegistration={true}
      />
    </>
  );
}

// ── Registration Status Block ─────────────────────────────────────────────────
const RegStatusBlock = ({ status, shopName, rejectionReason, theme }) => {
  const p = theme.primary;
  const configs = {
    pending: {
      bg: `${p}08`,
      border: `${p}25`,
      icon: '⏳',
      title: 'Registration Pending',
      color: p,
      message: `Your registration request is waiting for approval from ${shopName}.`,
      instruction: 'Once approved, you will be able to buy and sell. You will receive a notification when your registration is confirmed.',
      button: null,
    },
    rejected: {
      bg: 'rgba(239,68,68,0.05)',
      border: 'rgba(239,68,68,0.2)',
      icon: '✕',
      title: 'Registration Declined',
      color: '#f87171',
      message: rejectionReason || 'Your registration was not approved by the shop.',
      instruction: 'Please contact the shop directly for more information or to resolve any issues.',
      button: 'Contact Shop',
    },
    approved: {
      bg: 'rgba(106,171,156,0.05)',
      border: 'rgba(106,171,156,0.2)',
      icon: '✓',
      title: 'Registration Approved',
      color: '#6aab9c',
      message: `You are now registered with ${shopName}!`,
      instruction: 'You can now buy and sell gold, silver, and currency with this shop.',
      button: null,
    },
    flagged: {
      bg: 'rgba(239,68,68,0.05)',
      border: 'rgba(239,68,68,0.2)',
      icon: '⚠️',
      title: 'Account Restricted',
      color: '#f87171',
      message: 'Your account has been restricted by this shop.',
      instruction: 'Please contact the shop directly to resolve this issue.',
      button: 'Contact Shop',
    },
  };
  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <div className="rounded-xl p-4" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          {/* CHANGED: text-sm → text-base */}
          <h4 className="font-bold text-base mb-1" style={{ color: cfg.color }}>{cfg.title}</h4>
          {/* CHANGED: text-xs → text-sm */}
          <p className="text-sm mb-2" style={{ color: theme.textMuted }}>{cfg.message}</p>
          <p className="text-sm" style={{ color: theme.textMuted }}>{cfg.instruction}</p>
          {cfg.button && (
            <button
              className="mt-3 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{ background: `${p}15`, border: `1px solid ${p}30`, color: p }}
            >
              {cfg.button}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Guidance Banner ───────────────────────────────────────────────────────────
const GuidanceBanner = ({ shopName, theme }) => {
  const p = theme.primary;
  return (
    <div className="rounded-xl p-4 mb-5 sm:mb-6" style={{ background: `${p}10`, border: `1px solid ${p}25` }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
          style={{ background: `${p}20`, border: `1px solid ${p}35` }}>
          📋
        </div>
        <div className="flex-1 min-w-0">
          {/* CHANGED: text-sm → text-base */}
          <h4 className="text-base font-bold mb-1" style={{ color: p }}>First Time Visiting {shopName}?</h4>
          {/* CHANGED: text-xs → text-sm */}
          <p className="text-sm mb-2" style={{ color: theme.textMuted }}>
            To ensure secure and verified transactions, {shopName} requires customers to register before trading.
          </p>
          <div className="space-y-1.5 mb-3">
            {[
              'Fill out the registration form with your details',
              `Submit your registration request to ${shopName}`,
              'Wait for shop approval (usually within 24 hours)',
              'Once approved, you can start buying and selling',
            ].map((step, i) => (
              // CHANGED: text-xs → text-sm
              <div key={i} className="flex items-center gap-2 text-sm" style={{ color: theme.textMuted }}>
                <span style={{ color: p }}>{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <div className="p-2 rounded-lg" style={{ background: `${p}08`, border: `1px solid ${p}15` }}>
            {/* CHANGED: text-[11px] → text-xs */}
            <p className="text-xs" style={{ color: theme.textMuted }}>
              💡 <span className="font-semibold">Note:</span> Registration is required only once. After approval, you can trade directly with this shop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const ShopDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const { prices: livePrices } = useLivePrices('public');
  const p = theme.primary;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('gold');
  const [regStatus, setRegStatus] = useState(null);
  // const [regChecked, setRegChecked] = useState(false);
  const [toast, setToast] = useState(null);   // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

const getWhatsAppTarget = () => {
    if (data?.shop?.whatsappLink) {
        const link = String(data.shop.whatsappLink).trim();

        // Remove existing ?text=... if the link already contains it
        return link.replace(/[?].*$/, '');
    }

    const number = String(
        data?.shop?.whatsappNumber ||
        data?.shop?.phoneNumber ||
        ''
    ).replace(/\D/g, '');

    return number ? `https://wa.me/${number}` : null;
};


const buildWhatsAppMessage = ({
    intent = 'buy',
    itemName = '',
    itemCode = '',
    purity = '',
    itemWeight,
    itemWeightUnit,
    category = '',
    price = null,
}) => {
    const shopName =
        data?.shop?.shopName ||
        'Shop';

    const weight = itemWeight
        ? `${itemWeight} ${itemWeightUnit || 'gram'}`
        : 'N/A';

    const amount =
        price !== null && price !== undefined
            ? `PKR ${Number(price).toLocaleString()}`
            : 'Not Available';

    const actionText = intent === 'sell' ? 'selling' : 'buying';

    return [
        `👋 Hello ${shopName},`,
        '',
        `I am interested in ${actionText} the following product:`,
        '',
        `✨ *${itemName || 'Product'}*`,
        '',
        `🏷️ Code: ${itemCode || 'N/A'}`,
        `💎 Purity: ${purity || 'N/A'}`,
        `⚖️ Weight: ${weight}`,
        `📂 Category: ${category || 'N/A'}`,
        `💰 Price: ${amount}`,
        '',
        `📋 Please Share availability and further details.`,
        `🙏 Thank You!`,
    ].join('\n');
};


const openWhatsAppInquiry = ({
    intent = 'buy',
    itemName,
    itemCode,
    purity,
    itemWeight,
    itemWeightUnit,
    category,
    price,
}) => {
    const target = getWhatsAppTarget();

    if (!target) {
        showToast(
            'WhatsApp contact is not available for this shop.',
            'error'
        );
        return;
    }

    const message = buildWhatsAppMessage({
        intent,
        itemName,
        itemCode,
        purity,
        itemWeight,
        itemWeightUnit,
        category,
        price,
    });

    const encodedMessage = encodeURIComponent(message);

    const url = `${target}?text=${encodedMessage}`;

    window.open(
        url,
        '_blank',
        'noopener,noreferrer'
    );
};


// ── WhatsApp message + emoji encoding ───────────────────────────────────────
//
// IMPORTANT: do NOT build the emoji with String.fromCodePoint() and just drop
// them into the message string. That produced the "�" (replacement
// character) you saw in WhatsApp — the surrogate-pair emoji characters were
// getting corrupted somewhere between the browser and the wa.me deep link.
//
// The fix (same one already proven in this file's very first draft, see the
// old comment "we keep them encoded so they cannot become �"): build the
// message with plain-text placeholders, percent-encode the WHOLE message
// with encodeURIComponent as normal, then swap each placeholder for its
// already-known-good hard-coded UTF-8 percent-escape. That guarantees the
// exact same bytes WhatsApp expects, regardless of how the JS engine or
// device handles surrogate pairs.
// const WHATSAPP_ICONS = {
//     hello: '%F0%9F%91%8B',      // 👋
//     product: '%E2%9C%A8',       // ✨
//     code: '%F0%9F%8F%B7%EF%B8%8F', // 🏷️
//     purity: '%F0%9F%92%8E',     // 💎
//     weight: '%E2%9A%96%EF%B8%8F', // ⚖️
//     category: '%F0%9F%93%82',   // 📂
//     price: '%F0%9F%92%B0',      // 💰
//     details: '%F0%9F%93%8B',    // 📋
//     thank: '%F0%9F%99%8F',      // 🙏
// };

// const buildWhatsAppMessage = ({
//     itemName = '',
//     itemCode = '',
//     purity = '',
//     itemWeight,
//     itemWeightUnit,
//     category = '',
//     price = null,
// }) => {
//     const shopName =
//         data?.shop?.shopName ||
//         'Shop';

//     const weight = itemWeight
//         ? `${itemWeight} ${itemWeightUnit || 'gram'}`
//         : 'N/A';

//     const amount =
//         price != null
//             ? `PKR ${Number(price).toLocaleString()}`
//             : 'Not Available';

//     // Plain-text placeholders — safe to run through encodeURIComponent.
//     const message = [
//         `__HELLO__ Hello ${shopName},`,
//         ``,
//         `I am interested in the following product:`,
//         ``,
//         `__PRODUCT__ *${itemName || 'Product'}*`,
//         ``,
//         `__CODE__ Code: ${itemCode || 'N/A'}`,
//         `__PURITY__ Purity: ${purity || 'N/A'}`,
//         `__WEIGHT__ Weight: ${weight}`,
//         `__CATEGORY__ Category: ${category || 'N/A'}`,
//         `__PRICE__ Price: ${amount}`,
//         ``,
//         `__DETAILS__ Please Share availability and further details.`,
//         `__THANK__ Thank You!`,
//     ].join('\n');

//     // Percent-encode the message first, THEN swap in the hard-coded emoji
//     // byte sequences (placeholders survive encodeURIComponent unchanged
//     // since underscores/letters aren't touched by it).
//     let encodedMessage = encodeURIComponent(message);

//     encodedMessage = encodedMessage
//         .replace(/__HELLO__/g, WHATSAPP_ICONS.hello)
//         .replace(/__PRODUCT__/g, WHATSAPP_ICONS.product)
//         .replace(/__CODE__/g, WHATSAPP_ICONS.code)
//         .replace(/__PURITY__/g, WHATSAPP_ICONS.purity)
//         .replace(/__WEIGHT__/g, WHATSAPP_ICONS.weight)
//         .replace(/__CATEGORY__/g, WHATSAPP_ICONS.category)
//         .replace(/__PRICE__/g, WHATSAPP_ICONS.price)
//         .replace(/__DETAILS__/g, WHATSAPP_ICONS.details)
//         .replace(/__THANK__/g, WHATSAPP_ICONS.thank);

//     return encodedMessage;
// };


// const openWhatsAppInquiry = ({
//     itemName,
//     itemCode,
//     purity,
//     itemWeight,
//     itemWeightUnit,
//     category,
//     price,
// }) => {
//     const target = getWhatsAppTarget();

//     if (!target) {
//         showToast(
//             'WhatsApp contact is not available for this shop.',
//             'error'
//         );
//         return;
//     }

//     // buildWhatsAppMessage now returns an ALREADY percent-encoded string
//     // (it has to, so the hard-coded emoji escapes aren't double-encoded).
//     const encodedMessage = buildWhatsAppMessage({
//         itemName,
//         itemCode,
//         purity,
//         itemWeight,
//         itemWeightUnit,
//         category,
//         price,
//     });

//     const separator = target.includes('?') ? '&' : '?';

//     const url = `${target}${separator}text=${encodedMessage}`;

//     window.open(url, '_blank', 'noopener,noreferrer');
// };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const fetchShop = useCallback(async () => {
    try {
      setLoading(true);
      const res = await publicAPI.getShopDetail(id);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shop details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchShop(); }, [fetchShop]);

  // Initial check for registration status whenever user/token/id change
  useEffect(() => {
    if (!user || !token || !id) return;
    let mounted = true;
    const checkOnce = async () => {
      try {
        const res = await checkShopRegistration(id);
        const d = res.data;
        if (!mounted) return;
        if (d?.isFlagged) setRegStatus('flagged');
        else if (d?.registered) setRegStatus(d.status);
        else setRegStatus(null);
      } catch {
        if (mounted) setRegStatus(null);
      }
    };
    checkOnce();
    return () => { mounted = false; };
  }, [user, token, id]);

  // Poll while registration is pending to pick up approval/rejection
  useEffect(() => {
    if (!user || !token || !id) return;
    if (regStatus !== 'pending') return;
    let stopped = false;
    const interval = setInterval(async () => {
      try {
        const res = await checkShopRegistration(id);
        const d = res.data;
        if (stopped) return;
        if (d?.isFlagged) { setRegStatus('flagged'); clearInterval(interval); }
        else if (d?.registered && d.status !== 'pending') {
          setRegStatus(d.status);
          // refresh shop data and notify user
          try { await fetchShop(); } catch (e) { /* ignore */ }
          showToast(`Registration ${d.status}. You can now trade with ${data?.shop?.shopName || 'this shop'}.`, 'success');
          clearInterval(interval);
        }
      } catch (err) {
        // ignore temporary errors
      }
    }, 8000);
    return () => { stopped = true; clearInterval(interval); };
  }, [user, token, id, regStatus, fetchShop, data]);

  // show toast on status transition from pending -> approved
  const prevRegRef = useRef(null);
  useEffect(() => {
    if (prevRegRef.current === 'pending' && regStatus === 'approved') {
      showToast(`Registration approved. You can now buy and sell with ${data?.shop?.shopName || 'this shop'}.`, 'success');
      // refresh shop info
      fetchShop().catch(() => { });
    }
    prevRegRef.current = regStatus;
  }, [regStatus, data, fetchShop]);

  const handleBuySellClick = (type) => {
    if (!token || !user) {
      navigate('/login', { state: { from: `/shop/${id}` } });
      return;
    }
    if (regStatus !== 'approved') {
      const regForm = document.getElementById('registration-form');
      if (regForm) regForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    navigate(`/shop/${id}/order?type=${type}`);
  };

  const isOwnShop = user && (user.id === id || user._id === id);
  const isCustomer = user?.role === 'customer';
  const isApproved = regStatus === 'approved';
  const needsReg = !isOwnShop && token && !regStatus;
  const isPending = regStatus === 'pending';
  const isRejected = regStatus === 'rejected';
  const isFlagged = regStatus === 'flagged';
  const rejectionReason = data?.shop?.rejectionReason || null;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen transition-colors duration-300" style={{ background: theme.bg }}>
        <Navbar />
        <div className="h-16" />
        <div className="h-10" style={{ borderBottom: `1px solid ${p}12`, background: theme.bgScrolled }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 sm:h-64 rounded-2xl animate-pulse"
                style={{ background: theme.cardBg, border: `1px solid ${p}10` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen transition-colors duration-300" style={{ background: theme.bg }}>
        <Navbar />
        <div className="h-16" />
        <div className="h-10" style={{ borderBottom: `1px solid ${p}12`, background: theme.bgScrolled }} />
        <div className="flex items-center justify-center px-4 py-20">
          <div className="text-center">
            <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: theme.textPrimary, fontFamily: '"Playfair Display", serif' }}>Shop Not Found</h2>
            <p className="text-sm mb-6 max-w-md" style={{ color: theme.textMuted }}>{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 hover:opacity-90"
              style={{ background: theme.gradient, color: theme.logoText }}
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { shop, pictures = [], marketPrices } = data;
  const currentMarketPrices = livePrices
    ? {
        ...marketPrices,
        gold: {
          ...marketPrices?.gold,
          per_tola_PKR_24k: livePrices.gold?.per_tola_PKR_24k,
          per_tola_PKR_2385k: livePrices.gold?.per_tola_PKR_2385k,
        },
        silver: {
          ...marketPrices?.silver,
          per_tola_PKR: livePrices.silver?.per_tola_PKR,
        },
      }
    : marketPrices;
  const availableCurrencies = CURRENCY_ORDER.filter(c => shop?.currencies?.[c]);

  const getWhatsAppNumber = (link) => {
    if (!link) return null;
    const match = link.match(/wa\.me\/(\d+)/) || link.match(/whatsapp\.com\/phone\/(\d+)/) || link.match(/(\d{10,15})/);
    return match ? match[1] : null;
  };
  const whatsappNumber = getWhatsAppNumber(shop.whatsappLink);

  // ── Shared style helpers ───────────────────────────────────────────────────
  const cardStyle = {
    background: theme.cardBg,
    border: `1px solid ${p}20`,
  };

  const sellStyle = {
    background: `${p}10`,
    border: `1px solid ${p}20`,
  };
  const buyStyle = {
    background: 'rgba(106,171,156,0.08)',
    border: '1px solid rgba(106,171,156,0.2)',
  };

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: theme.bg }}>

      <Navbar />
      <div className="h-16" />

      {/* ── Back button sub-bar ── */}
      <div
        className="sticky top-16 z-40 flex items-center px-4 sm:px-6 h-10 backdrop-blur-xl"
        style={{ borderBottom: `1px solid ${p}12`, background: theme.bgScrolled }}
      >
        <button
          onClick={() => navigate(-1)}
          // CHANGED: text-xs → text-sm
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-80"
          style={{ color: theme.textMuted }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex-1 h-px mx-3" style={{ background: `linear-gradient(90deg, transparent, ${p}15, transparent)` }} />
        {/* CHANGED: text-[10px] → text-xs, tracking reduced slightly */}
        <span className="text-xs tracking-[0.15em] uppercase font-semibold" style={{ color: `${p}70` }}>Shop Details</span>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-16 sm:pb-20">

        {/* ── Shop Header Card ──────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden relative mb-5 sm:mb-6" style={cardStyle}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p}50, transparent)` }} />

          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Logo */}
              <div className="flex-shrink-0 flex sm:block items-center gap-4">
                {shop.shopLogo ? (
                  <img
                    src={shop.shopLogo}
                    alt={shop.shopName}
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl object-cover"
                    style={{ border: `2px solid ${p}30` }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${p}20, ${p}08)`, border: `2px solid ${p}30`, color: p, fontFamily: '"Playfair Display", serif' }}
                  >
                    {shop.shopName?.charAt(0) || 'G'}
                  </div>
                )}

                {/* Mobile: name next to logo */}
                <div className="sm:hidden flex-1 min-w-0">
                  <h1 className="text-xl font-black leading-tight" style={{ color: theme.textPrimary, fontFamily: '"Playfair Display", serif' }}>
                    {shop.shopName}
                  </h1>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {/* CHANGED: text-[10px] → text-xs */}
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold tracking-wider" style={{ background: `${p}15`, border: `1px solid ${p}30`, color: p }}>VERIFIED</span>
                    {isOwnShop && <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(106,171,156,0.1)', border: '1px solid rgba(106,171,156,0.2)', color: '#6aab9c' }}>YOUR SHOP</span>}
                    {isApproved && <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(106,171,156,0.1)', border: '1px solid rgba(106,171,156,0.2)', color: '#6aab9c' }}>REGISTERED</span>}
                  </div>
                </div>
              </div>

              {/* Shop Info */}
              <div className="flex-1 min-w-0">
                {/* Desktop title */}
                <div className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                  <h1 className="text-2xl md:text-3xl font-black" style={{ color: theme.textPrimary, fontFamily: '"Playfair Display", serif' }}>
                    {shop.shopName}
                  </h1>
                  {/* CHANGED: text-[10px] → text-xs */}
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold tracking-wider" style={{ background: `${p}15`, border: `1px solid ${p}30`, color: p }}>VERIFIED</span>
                  {isOwnShop && <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(106,171,156,0.1)', border: '1px solid rgba(106,171,156,0.2)', color: '#6aab9c' }}>YOUR SHOP</span>}
                  {isApproved && <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(106,171,156,0.1)', border: '1px solid rgba(106,171,156,0.2)', color: '#6aab9c' }}>REGISTERED</span>}
                </div>

                {/* Location */}
                <div className="flex flex-wrap gap-3 sm:gap-4 mb-3 sm:mb-4">
                  {shop.city && (
                    // CHANGED: text-xs → text-sm
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: theme.textMuted }}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {shop.city}
                    </div>
                  )}
                  {shop.address && (
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: theme.textMuted }}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="truncate max-w-[180px] sm:max-w-none">{shop.address}</span>
                    </div>
                  )}
                </div>

                {/* Contact buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {shop.whatsappLink && (
                    <div className="flex flex-col gap-1">
                      <a
                        href={shop.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        // CHANGED: text-xs → text-sm
                        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-all duration-200 shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        </svg>
                        WhatsApp
                      </a>
                      {/* CHANGED: text-[11px] → text-xs */}
                      {whatsappNumber && <span className="text-xs px-2" style={{ color: theme.textMuted }}>{whatsappNumber}</span>}
                    </div>
                  )}
                  {shop.phoneNumber && (
                    <div className="flex flex-col gap-1">
                      <a
                        href={`tel:${shop.phoneNumber}`}
                        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-80 transition-all duration-200"
                        style={{ border: `1px solid ${p}40`, background: `${p}08`, color: p }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Call
                      </a>
                      <span className="text-xs px-2" style={{ color: theme.textMuted }}>{shop.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trade Actions */}
            {!isOwnShop && !isPending && !isRejected && !isFlagged && (
              <div className="mt-5 sm:mt-6 pt-5 sm:pt-6" style={{ borderTop: `1px solid ${p}12` }}>
                {!isApproved ? (
                  <div className="p-3 sm:p-4 rounded-xl" style={{ background: `${p}08`, border: `1px solid ${p}20` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-base sm:text-lg flex-shrink-0" style={{ background: `${p}15` }}>
                        🔒
                      </div>
                      <div>
                        {/* CHANGED: text-sm → text-base */}
                        <h4 className="text-base font-bold" style={{ color: p }}>Registration Required</h4>
                        {/* CHANGED: text-xs → text-sm */}
                        <p className="text-sm" style={{ color: theme.textMuted }}>Please complete registration to buy or sell</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {/* CHANGED: text-sm → text-base */}
                      <button disabled className="py-2.5 sm:py-3 rounded-xl font-bold text-base cursor-not-allowed" style={{ background: 'rgba(106,171,156,0.1)', color: 'rgba(255,255,255,0.3)' }}>
                        🛒 I Want to Buy
                      </button>
                      <button disabled className="py-2.5 sm:py-3 rounded-xl font-bold text-base cursor-not-allowed" style={{ background: `${p}15`, color: 'rgba(255,255,255,0.3)' }}>
                        💰 I Want to Sell
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      onClick={() => handleBuySellClick('buy')}
                      className="py-2.5 sm:py-3 rounded-xl font-bold text-base text-white hover:opacity-90 transition-all duration-200 shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #6aab9c, #3d8073)' }}
                    >
                      🛒 I Want to Buy
                    </button>
                    <button
                      onClick={() => handleBuySellClick('sell')}
                      className="py-2.5 sm:py-3 rounded-xl font-bold text-base hover:opacity-90 transition-all duration-200 shadow-lg"
                      style={{ background: theme.gradient, color: theme.logoText }}
                    >
                      💰 I Want to Sell
                    </button>
                  </div>
                )}
              </div>
            )}

            {(isPending || isRejected || isFlagged) && (
              <div className="mt-5 sm:mt-6 pt-5 sm:pt-6" style={{ borderTop: `1px solid ${p}12` }}>
                <RegStatusBlock status={regStatus} shopName={shop.shopName} rejectionReason={rejectionReason} theme={theme} />
              </div>
            )}

            {isOwnShop && (
              // CHANGED: text-xs → text-sm
              <div className="mt-4 p-3 rounded-lg text-sm text-center" style={{ background: 'rgba(106,171,156,0.05)', border: '1px solid rgba(106,171,156,0.1)', color: '#6aab9c' }}>
                This is your own shop — you cannot place orders here.
              </div>
            )}
          </div>
        </div>

        {/* ── Price + Registration Grid ─────────────────────────────────────── */}
        <div className={`grid ${needsReg ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-5 sm:gap-6 mb-5 sm:mb-6`}>

          {/* Price Card */}
          <div className="rounded-2xl overflow-hidden relative" style={cardStyle}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p}50, transparent)` }} />

            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
                  style={{ background: `${p}15`, border: `1px solid ${p}30` }}>
                  📊
                </div>
                <div>
                  {/* CHANGED: text-base sm:text-lg → text-lg sm:text-xl */}
                  <h3 className="text-lg sm:text-xl font-bold" style={{ color: theme.textPrimary, fontFamily: '"Playfair Display", serif' }}>Live Price Rates</h3>
                  {/* CHANGED: text-xs → text-sm */}
                  <p className="text-sm" style={{ color: theme.textMuted }}>Per tola (11.664g) · Updated live</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl mb-5 sm:mb-6" style={{ background: `${p}08` }}>
                {PRICE_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    // CHANGED: text-xs sm:text-sm → text-sm sm:text-base
                    className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200"
                    style={activeTab === tab.key
                      ? { background: `${p}20`, color: p, border: `1px solid ${p}40` }
                      : { color: theme.textMuted, border: '1px solid transparent' }
                    }
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Price Content */}
              <div className="space-y-2 sm:space-y-3">
                {activeTab === 'gold' && (
                  <>
                    {[
                      { label: '24K Gold', sell: shop.prices?.sell_24k, buy: shop.prices?.buy_24k },
                      { label: '23.85K Gold', sell: shop.prices?.sell_2385k, buy: shop.prices?.buy_2385k },
                    ].map(row => (
                      <div key={row.label} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-lg"
                        style={{ background: `${p}06`, border: `1px solid ${p}10` }}>
                        <div className="sm:flex-1 font-semibold text-sm sm:text-[18px]" style={{ color: theme.textMuted }}>
                          {row.label}
                        </div>

                        <div className="flex-1 flex flex-col items-center sm:items-center gap-1 rounded-lg p-1.5 sm:p-2" style={buyStyle}>
                          <div className="text-[12px] font-bold tracking-wider uppercase" style={{ color: 'rgba(106,171,156,0.8)' }}>Buy</div>
                          <div className="font-mono font-bold text-sm sm:text-[18px]" style={{ color: '#6aab9c' }}>PKR {fmt(row.buy)}</div>
                        </div>

                        <div className="flex-1 flex flex-col items-center gap-1 rounded-lg p-1.5 sm:p-2" style={sellStyle}>
                          <div className="text-[12px] font-bold tracking-wider uppercase" style={{ color: p }}>Sell</div>
                          <div className="font-mono font-bold text-sm sm:text-[18px]" style={{ color: p }}>PKR {fmt(row.sell)}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {activeTab === 'silver' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-evenly gap-2 sm:gap-3 items-center p-2.5 sm:p-3 rounded-lg"
                    style={{ background: `${p}06`, border: `1px solid ${p}10` }}>
                    <div className="text-left font-semibold text-sm sm:text-[18px] w-full" style={{ color: theme.textMuted }}>
                      Silver 999
                    </div>
                    <div className="text-center p-2 sm:p-4 rounded-lg w-full" style={buyStyle}>
                      <div className="text-[12px] font-bold tracking-wider uppercase mb-0.5" style={{ color: 'rgba(106,171,156,0.8)' }}>Buy</div>
                      <div className="font-mono font-bold text-sm sm:text-[18px]" style={{ color: '#6aab9c' }}>PKR {fmt(shop.prices?.buy_silver)}</div>
                    </div>
                    <div className="text-center p-2 sm:p-4 rounded-lg w-full" style={sellStyle}>
                      <div className="text-[12px] font-bold tracking-wider uppercase mb-0.5" style={{ color: p }}>Sell</div>
                      <div className="font-mono font-bold text-sm sm:text-[18px]" style={{ color: p }}>PKR {fmt(shop.prices?.sell_silver)}</div>
                    </div>

                  </div>
                )}

                {activeTab === 'currency' && (
                  availableCurrencies.length > 0 ? (
                    <div className="rounded-xl overflow-hidden w-full" style={{ border: `1px solid ${p}18` }}>
                      {/* Scroll hint — only shown on small screens */}
                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 sm:hidden"
                        style={{ background: `${p}08`, borderBottom: `1px solid ${p}10` }}
                      >
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: p }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 4v8m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        <span className="text-[12px] font-medium" style={{ color: p }}>Scroll sideways to see all columns</span>
                      </div>

                      {/* Scrollable wrapper */}
                      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                        <table className="border-collapse" style={{ minWidth: '480px', width: '100%' }}>
                          <thead>
                            <tr style={{ background: `${p}14`, borderBottom: `2px solid ${p}22` }}>
                              <th
                                className="text-left px-4 sm:px-5 py-3 text-xs font-bold tracking-widest uppercase whitespace-nowrap"
                                style={{ color: theme.textMuted, minWidth: '140px' }}
                              >
                                Currency
                              </th>
                              <th
                                className="text-center px-4 sm:px-5 py-3 text-xs font-bold tracking-widest uppercase whitespace-nowrap"
                                style={{ color: p, minWidth: '110px' }}
                              >
                                Sell Rate
                              </th>
                              <th
                                className="text-center px-4 sm:px-5 py-3 text-xs font-bold tracking-widest uppercase whitespace-nowrap"
                                style={{ color: '#6aab9c', minWidth: '110px' }}
                              >
                                Buy Rate
                              </th>
                              <th
                                className="text-center px-4 sm:px-5 py-3 text-xs font-bold tracking-widest uppercase whitespace-nowrap"
                                style={{ color: theme.textMuted, minWidth: '110px' }}
                              >
                                Live Rate
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {availableCurrencies.map((code, idx) => {
                              const info = shop.currencies[code];
                              const isEven = idx % 2 === 0;
                              const isLast = idx === availableCurrencies.length - 1;
                              return (
                                <tr
                                  key={code}
                                  style={{
                                    background: isEven ? `${p}05` : 'transparent',
                                    borderBottom: isLast ? 'none' : `1px solid ${p}10`,
                                  }}
                                >
                                  {/* Currency */}
                                  <td className="px-4 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-xl flex-shrink-0 leading-none">{CURRENCY_FLAGS[code]}</span>
                                      <div>
                                        <div className="font-bold text-sm sm:text-base leading-tight" style={{ color: theme.textPrimary }}>
                                          {code}
                                        </div>
                                        <div className="text-xs leading-tight" style={{ color: theme.textMuted }}>
                                          {CURRENCY_NAMES[code]}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Sell rate */}
                                  <td className="px-4 sm:px-5 py-3 sm:py-4 text-center whitespace-nowrap">
                                    <span
                                      className="inline-flex flex-col items-center px-3 py-1.5 rounded-lg font-mono font-bold text-sm sm:text-base leading-tight"
                                      style={{ background: `${p}12`, border: `1px solid ${p}25`, color: p }}
                                    >
                                      {info?.sellRate != null ? Number(info.sellRate).toFixed(2) : '—'}
                                      <span className="text-[10px] font-semibold tracking-wider" style={{ color: p, opacity: 0.7 }}>PKR</span>
                                    </span>
                                  </td>

                                  {/* Buy rate */}
                                  <td className="px-4 sm:px-5 py-3 sm:py-4 text-center whitespace-nowrap">
                                    <span
                                      className="inline-flex flex-col items-center px-3 py-1.5 rounded-lg font-mono font-bold text-sm sm:text-base leading-tight"
                                      style={{ background: 'rgba(106,171,156,0.10)', border: '1px solid rgba(106,171,156,0.25)', color: '#6aab9c' }}
                                    >
                                      {info?.buyRate != null ? Number(info.buyRate).toFixed(2) : '—'}
                                      <span className="text-[10px] font-semibold tracking-wider" style={{ color: '#6aab9c', opacity: 0.7 }}>PKR</span>
                                    </span>
                                  </td>

                                  {/* Live / interbank */}
                                  <td className="px-4 sm:px-5 py-3 sm:py-4 text-center whitespace-nowrap">
                                    <div className="font-mono font-semibold text-sm sm:text-base" style={{ color: theme.textMuted }}>
                                      {info?.rate != null ? Number(info.rate).toFixed(2) : '—'}
                                    </div>
                                    <div className="text-[10px] mt-0.5 font-medium" style={{ color: theme.textMuted, opacity: 0.6 }}>
                                      interbank
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8 text-base" style={{ color: theme.textMuted }}>No currency rates available</div>
                  )
                )}
              </div>

              {/* Market Reference */}
              {currentMarketPrices && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5 sm:mt-6 pt-5 sm:pt-6"
                  style={{ borderTop: `1px solid ${p}10` }}>
                  {[
                    { label: 'Gold / oz', value: `$${Number(currentMarketPrices.gold?.per_oz_USD).toFixed(2)}` },
                    { label: '24K / Tola', value: `PKR ${fmt(currentMarketPrices.gold?.per_tola_PKR_24k)}` },
                    { label: '23.85K / Tola', value: `PKR ${fmt(currentMarketPrices.gold?.per_tola_PKR_2385k)}` },
                    { label: 'Silver / Tola', value: `PKR ${fmt(currentMarketPrices.silver?.per_tola_PKR)}` },
                  ].map(item => (
                    <div key={item.label} className="text-center p-2 rounded-lg" style={{ background: `${p}06` }}>
                      {/* CHANGED: text-[9px] → text-[11px]; value text-xs → text-sm */}
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.textMuted }}>
                        {item.label}
                      </div>
                      <div className="font-mono font-bold text-sm" style={{ color: theme.textPrimary }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Registration Section */}
          {needsReg && (
            <div id="registration-form">
              <GuidanceBanner shopName={shop.shopName} theme={theme} />
              <RegistrationForm
                shop={shop}
                user={user}
                onSuccess={(s) => setRegStatus(s)}
                onCancel={() => navigate(-1)}
                theme={theme}
                showToast={showToast}
              />
            </div>
          )}
        </div>

        {/* ── Gallery ───────────────────────────────────────────────────────── */}
        {/* ── Gallery ───────────────────────────────────────────────────────── */}
        {pictures.length > 0 && (
          <div className="rounded-2xl overflow-hidden relative mb-5 sm:mb-6" style={cardStyle}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${p}50, transparent)` }} />

            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
                  style={{ background: `${p}15`, border: `1px solid ${p}30` }}>
                  🖼️
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold" style={{ color: theme.textPrimary, fontFamily: '"Playfair Display", serif' }}>Shop Gallery</h3>
                  <p className="text-sm" style={{ color: theme.textMuted }}>{pictures.length} image{pictures.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {pictures.map((pic, i) => (
                  <div
                    key={pic._id || i}
                    className="rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg"
                    style={{ border: `1px solid ${p}15`, background: `${p}05` }}
                  >
                    {/* Image */}
                    <button
                      onClick={() => setLightboxIndex(i)}
                      className="relative w-full aspect-square overflow-hidden cursor-pointer group"
                    >
                      <img
                        src={pic.imageUrl || pic}
                        alt={pic.title || `Image ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                      {/* Type badge */}
                      {pic.type && (
                        <span
                          className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                          style={{
                            background: pic.type === 'gold' ? 'rgba(251,191,36,0.2)' : 'rgba(148,163,184,0.2)',
                            border: `1px solid ${pic.type === 'gold' ? 'rgba(251,191,36,0.4)' : 'rgba(148,163,184,0.4)'}`,
                            color: pic.type === 'gold' ? '#fbbf24' : '#94a3b8',
                          }}
                        >
                          {pic.type === 'gold' ? '⬡ Gold' : pic.type === 'silver' ? '◆ Silver' : 'Other'}
                        </span>
                      )}
                    </button>

                    {/* Details */}
                    <div className="p-3 space-y-1.5">
                      {pic.title && (
                        <p className="font-bold text-sm truncate" style={{ color: theme.textPrimary }}>
                          {pic.title}
                        </p>
                      )}
                      {pic.description && (
                        <p className="text-xs line-clamp-2" style={{ color: theme.textMuted }}>
                          {pic.description}
                        </p>
                      )}

                      {/* Weight & Unit */}
                      {pic.weight != null && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: theme.textMuted }}>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                          <span className="font-semibold">{pic.weight}</span>
                          <span>{pic.weightUnit === 'tola' ? 'Tola' : 'g'}</span>
                        </div>
                      )}

                      {/* Price */}
                      {(computeLiveItemPrice(pic, currentMarketPrices) ?? pic.price) != null && (
                        <p className="font-bold text-sm" style={{ color: p }}>
                          PKR {fmt(computeLiveItemPrice(pic, currentMarketPrices) ?? pic.price)}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => openWhatsAppInquiry({
                            intent: 'buy',
                            itemName: pic.title || `Item ${i + 1}`,
                            itemCode: pic.code,
                            purity: pic.purity,
                            category: pic.type,
                            itemWeightUnit: pic.weightUnit || 'gram',
                            itemWeight: pic.weight || '0',
                            // Live price = current market rate × item weight,
                            // not the shop's stored pic.price.
                            price: computeLiveItemPrice(pic, currentMarketPrices) ?? pic.price,
                          })}
                          className="py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                          style={{ background: `${p}16`, border: `1px solid ${p}25`, color: p }}
                        >
                          Buy via WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => openWhatsAppInquiry({
                            intent: 'sell',
                            itemName: pic.title || `Item ${i + 1}`,
                            itemCode: pic.code,
                            purity: pic.purity,
                            category: pic.type,
                            itemWeightUnit: pic.weightUnit || 'gram',
                            itemWeight: pic.weight || '0',
                            // Live price = current market rate × item weight,
                            // not the shop's stored pic.price.
                            price: computeLiveItemPrice(pic, currentMarketPrices) ?? pic.price,
                          })}
                          className="py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                          style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${p}20`, color: theme.textPrimary }}
                        >
                          Sell via WhatsApp
                        </button>
                      </div>

                      {/* Date */}
                      {pic.createdAt && (
                        <p className="text-[10px] mt-2" style={{ color: theme.textMuted }}>
                          {new Date(pic.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Policy Notice ─────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl" style={{ background: `${p}05`, border: `1px solid ${p}12` }}>
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: `${p}70` }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {/* CHANGED: text-xs → text-sm */}
          <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
            Price is locked at the time of payment. If payment is not received promptly, the market rate at the time of your visit applies.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed top-20 right-4 z-[9999] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in text-sm font-semibold"
          style={{
            background: toast.type === 'success' ? 'rgba(106,171,156,0.95)' : 'rgba(239,68,68,0.95)',
            color: '#fff',
            border: `1px solid ${toast.type === 'success' ? '#6aab9c' : '#ef4444'}`,
          }}
        >
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/70 hover:text-white">✕</button>
        </div>
      )}

      {/* Modals */}
      {lightboxIndex !== null && (
        <ImageLightbox images={pictures} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} theme={theme} />
      )}
    </div>
  );
};

export default ShopDetailPage;