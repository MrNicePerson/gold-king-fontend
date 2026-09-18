// components/HomePage/ShopCard.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Tilt from 'react-parallax-tilt';
import { useTheme } from '../../contexts/ThemeContext';
import UnitToggle from '../ui/UnitToggle';
import { calculateTolaPrice, TOLA_11664 } from '../../utils/goldUnitUtils';
import { formatNumberByLanguage } from '../../utils/formatUtils';

const REVERT_DELAY_MS = 10000; // 10 seconds — how long the "other gram" view stays before reverting to DB default

const CURRENCY_ORDER = ['USD', 'SAR', 'AED', 'GBP', 'EUR', 'CHF'];
const CURRENCY_FLAGS = { USD: '🇺🇸', SAR: '🇸🇦', AED: '🇦🇪', GBP: '🇬🇧', EUR: '🇪🇺', CHF: '🇨🇭' };
const CURRENCY_NAMES = { USD: 'US Dollar', SAR: 'Saudi Riyal', AED: 'UAE Dirham', GBP: 'British Pound', EUR: 'Euro', CHF: 'Swiss Franc' };

const TABS = [
  { key: 'gold', label: '🥇 Gold' },
  { key: 'silver', label: '🥈 Silver' },
  { key: 'currency', label: '💱 Currency' },
];

const fmt = (n) =>
  n != null ? Number(n).toLocaleString('en-PK', { maximumFractionDigits: 0 }) : '—';

// ── PriceRow ──────────────────────────────────────────────────────────────────
const PriceRow = ({ label, sell, buy, theme }) => {
  const { t } = useTranslation();
  const p = theme.primary;
  const isDark = theme.type === 'dark';
  return (
    <div
      className="grid gap-2 items-center px-3 py-3 rounded-xl mb-2"
      style={{
        gridTemplateColumns: '1fr 1fr 1fr',
        background: isDark ? 'rgba(255,255,255,0.025)' : `${p}06`,
        border: `1px solid ${theme.border}`,
      }}
    >
      <span className="text-sm font-bold truncate" style={{ color: isDark ? '#a08840' : theme.textMuted }}>{label}</span>

      <div
        className="text-center rounded-lg py-1.5 px-1"
        style={{ background: `${p}10`, border: `1px solid ${p}22` }}
      >
        <div className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: `${p}80` }}>{t('prices.sell')}</div>
        <div className="font-mono font-bold text-sm leading-none" style={{ color: isDark ? '#d4b05a' : theme.primary }}>{sell}</div>
      </div>

      <div
        className="text-center rounded-lg py-1.5 px-1"
        style={{ background: isDark ? 'rgba(106,171,156,0.08)' : 'rgba(10,124,92,0.06)', border: isDark ? '1px solid rgba(106,171,156,0.15)' : '1px solid rgba(10,124,92,0.15)' }}
      >
        <div className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: isDark ? 'rgba(106,171,156,0.55)' : 'rgba(10,124,92,0.55)' }}>{t('prices.buy')}</div>
        <div className="font-mono font-bold text-sm leading-none" style={{ color: isDark ? '#6aab9c' : '#0a7c5c' }}>{buy}</div>
      </div>
    </div>
  );
};

// ── ContactRow ────────────────────────────────────────────────────────────────
const ContactRow = ({ icon, label, value, href, valueColor, theme }) => {
  const p = theme.primary;
  const isDark = theme.type === 'dark';
  return (
    <a
      href={href}
      onClick={(e) => e.stopPropagation()}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl flex-1 min-w-0 transition-all duration-200 no-underline group"
      style={{
        background: isDark ? 'rgba(255,255,255,0.02)' : `${p}06`,
        border: `1px solid ${theme.border}`,
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${p}10`; e.currentTarget.style.borderColor = `${p}40`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : `${p}06`; e.currentTarget.style.borderColor = theme.border; }}
    >
      <div
        className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
        style={{ background: `${p}12`, border: `1px solid ${p}25` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: theme.textMuted }}>
          {label}
        </div>
        <div className="text-sm font-semibold truncate" style={{ color: valueColor }}>
          {value}
        </div>
      </div>
    </a>
  );
};

// ── ShopCard ──────────────────────────────────────────────────────────────────
const ShopCard = ({ shop, index }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('gold');

  const isDark = theme.type === 'dark';
  const p = theme.primary;

  const TABS = [
    { key: 'gold', label: `🥇 ${t('prices.gold24k')}` },
    { key: 'silver', label: `🥈 ${t('prices.silver')}` },
    { key: 'currency', label: `💱 ${t('ticker.currencies', { defaultValue: 'Currency' })}` },
  ];

  const fmtByLang = (n) =>
    n != null ? formatNumberByLanguage(n, i18n.language) : '—';

  const dbTolaWeight = Number(shop.tolaWeight) > 0 ? Number(shop.tolaWeight) : TOLA_11664;
  const [localUnit, setLocalUnit] = useState(dbTolaWeight);
  const revertTimerRef = useRef(null);

  useEffect(() => {
    setLocalUnit(dbTolaWeight);
  }, [dbTolaWeight]);

  useEffect(() => {
    return () => {
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
    };
  }, []);

  const handleUnitChange = (unit) => {
    setLocalUnit(unit);
    if (revertTimerRef.current) clearTimeout(revertTimerRef.current);

    if (unit !== dbTolaWeight) {
      revertTimerRef.current = setTimeout(() => {
        setLocalUnit(dbTolaWeight);
        revertTimerRef.current = null;
      }, REVERT_DELAY_MS);
    }
  };

  const availableCurrencies = CURRENCY_ORDER.filter((c) => shop.currencies?.[c]);

  const whatsappDisplay =
    shop.whatsappNumber ||
    shop.whatsappLink?.replace(/\D/g, '').slice(-10).replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3') ||
    null;

  const adjustGoldPrice = (price) => calculateTolaPrice(price, dbTolaWeight, localUnit);

  const handleCardClick = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return;
    navigate(`/shop/${shop.id}`);
  };

  return (
    <Tilt
      tiltMaxAngleX={7}
      tiltMaxAngleY={7}
      perspective={1200}
      transitionSpeed={1200}
      scale={1.015}
      glareEnable
      glareMaxOpacity={isDark ? 0.12 : 0.06}
      glareColor={p}
      glarePosition="all"
      glareBorderRadius="16px"
      tiltReverse
      className="h-full"
    >
      <div
        data-cursor-hover
        onClick={handleCardClick}
        className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col h-full"
        style={{
          background: isDark
            ? 'linear-gradient(160deg, #0f0c07 0%, #080603 100%)'
            : theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: isDark
            ? '0 4px 24px rgba(0,0,0,0.5)'
            : '0 2px 16px rgba(0,0,0,0.07)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${p}55`;
          e.currentTarget.style.boxShadow = isDark
            ? `0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px ${p}12`
            : `0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px ${p}20`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.border;
          e.currentTarget.style.boxShadow = isDark
            ? '0 4px 24px rgba(0,0,0,0.5)'
            : '0 2px 16px rgba(0,0,0,0.07)';
        }}
      >
        <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${p}70, transparent)` }} />

        <div className="p-4 sm:p-5 flex flex-col flex-1">

          {/* ── Shop Header ── */}
          <div className="flex gap-3 items-start mb-4">
            {shop.shopLogo ? (
              <img
                src={shop.shopLogo} alt={shop.shopName}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                style={{ border: `2px solid ${p}35` }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl font-black"
                style={{
                  background: `linear-gradient(135deg, ${p}25, ${p}0a)`,
                  border: `2px solid ${p}30`,
                  color: p,
                  fontFamily: '"Playfair Display", serif',
                }}
              >
                {shop.shopName?.charAt(0) || 'G'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className="text-base sm:text-lg font-bold leading-snug line-clamp-2"
                  style={{ color: theme.textPrimary, fontFamily: '"Playfair Display", Georgia, serif' }}
                >
                  {shop.shopName}
                </h3>
                <span
                  className="flex-shrink-0 text-[10px] font-bold tracking-wider px-2 py-1 rounded-full whitespace-nowrap"
                  style={{ background: `${p}12`, color: p, border: `1px solid ${p}30` }}
                >
                  ✓ {t('shop.verified', { defaultValue: 'Verified' })}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1.5" style={{ color: theme.textMuted }}>
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-xs truncate">{shop.city || shop.address || 'Pakistan'}</span>
              </div>
            </div>
          </div>

          {/* ── Contact ── */}
          {(shop.phoneNumber || whatsappDisplay || shop.whatsappLink) && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {shop.phoneNumber && (
                <ContactRow
                  href={`tel:${shop.phoneNumber}`}
                  icon={
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={p} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.0 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  }
                  label={t('shop.phone')}
                  value={shop.phoneNumber}
                  valueColor={p}
                  theme={theme}
                />
              )}
              {(shop.whatsappNumber || shop.whatsappLink) && (
                <ContactRow
                  href={shop.whatsappLink || `https://wa.me/${(shop.whatsappNumber || '').replace(/\D/g, '')}`}
                  icon={
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#25d366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  }
                  label={t('shop.whatsapp')}
                  value={shop.whatsappNumber || whatsappDisplay || t('shop.whatsapp')}
                  valueColor="#25d366"
                  theme={theme}
                />
              )}
            </div>
          )}

          {/* ── Unit toggle ── */}
          <div className="mb-2">
            <UnitToggle selectedUnit={localUnit} onChange={handleUnitChange} />
            <p className="mt-2 text-[11px] font-semibold leading-tight" style={{ color: p }}>
              {t('prices.perTola')} ({localUnit.toFixed(3)} {t('common.g')})
            </p>
          </div>

          {/* ── Tabs ── */}
          <div
            className="flex gap-1 p-1 rounded-xl mb-3"
            style={{ background: isDark ? 'rgba(255,255,255,0.03)' : `${p}08` }}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={(e) => { e.stopPropagation(); setActiveTab(tab.key); }}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200"
                  style={{
                    background: active ? `${p}22` : 'transparent',
                    color: active ? p : theme.textMuted,
                    border: `1px solid ${active ? `${p}40` : 'transparent'}`,
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Tab Content ── */}
          <div className="flex-1 min-h-[100px]">
            {activeTab === 'gold' && (
              <>
                <PriceRow label={t('prices.gold24k')} sell={`PKR ${fmtByLang(adjustGoldPrice(shop.prices?.sell_24k))}`} buy={`PKR ${fmtByLang(adjustGoldPrice(shop.prices?.buy_24k))}`} theme={theme} />
                <PriceRow label={t('prices.gold2385k')} sell={`PKR ${fmtByLang(adjustGoldPrice(shop.prices?.sell_2385k))}`} buy={`PKR ${fmtByLang(adjustGoldPrice(shop.prices?.buy_2385k))}`} theme={theme} />
              </>
            )}

            {activeTab === 'silver' && (
              <PriceRow label={t('prices.silver')} sell={`PKR ${fmtByLang(shop.prices?.sell_silver)}`} buy={`PKR ${fmtByLang(shop.prices?.buy_silver)}`} theme={theme} />
            )}

            {activeTab === 'currency' && (
              availableCurrencies.length > 0 ? (
                <div>
                  {/* Header row */}
                  <div className="grid gap-2 px-3 pb-1.5" style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}>
                    <div />
                    <div className="text-center text-[9px] font-bold tracking-widest uppercase" style={{ color: `${p}80` }}>{t('prices.sell')}</div>
                    <div className="text-center text-[9px] font-bold tracking-widest uppercase" style={{ color: isDark ? 'rgba(106,171,156,0.6)' : 'rgba(10,124,92,0.6)' }}>{t('prices.buy')}</div>
                  </div>
                  {availableCurrencies.map((code) => {
                    const info = shop.currencies[code];
                    return (
                      <div
                        key={code}
                        className="grid gap-2 items-center px-3 py-2.5 rounded-xl mb-2"
                        style={{
                          gridTemplateColumns: '1.2fr 1fr 1fr',
                          background: isDark ? 'rgba(255,255,255,0.02)' : `${p}05`,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{CURRENCY_FLAGS[code]}</span>
                          <div>
                            <div className="text-sm font-bold leading-none" style={{ color: isDark ? '#a08840' : theme.primary }}>{code}</div>
                            <div className="text-[10px] leading-tight" style={{ color: theme.textMuted }}>{CURRENCY_NAMES[code]}</div>
                          </div>
                        </div>
                        <div className="text-center font-mono font-bold text-sm" style={{ color: isDark ? '#d4b05a' : theme.primary }}>
                          {info?.sellRate != null ? formatNumberByLanguage(info.sellRate, i18n.language) : '—'}
                        </div>
                        <div className="text-center font-mono font-bold text-sm" style={{ color: isDark ? '#6aab9c' : '#0a7c5c' }}>
                          {info?.buyRate != null ? formatNumberByLanguage(info.buyRate, i18n.language) : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-sm" style={{ color: theme.textMuted }}>
                  {t('shop.noCurrencyRates', { defaultValue: 'No currency rates available' })}
                </div>
              )
            )}
          </div>

          {/* ── Divider ── */}
          <div className="h-px my-4" style={{ background: theme.border }} />

          {/* ── CTA ── */}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/shop/${shop.id}`); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200"
            style={{
              background: `${p}08`,
              border: `1px solid ${p}28`,
              color: theme.textMuted,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${p}15`;
              e.currentTarget.style.borderColor = `${p}55`;
              e.currentTarget.style.color = p;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${p}08`;
              e.currentTarget.style.borderColor = `${p}28`;
              e.currentTarget.style.color = theme.textMuted;
            }}
          >
            {t('shop.viewShop')}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

        </div>
      </div>
    </Tilt>
  );
};

export default ShopCard;