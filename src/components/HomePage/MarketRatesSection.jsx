// components/HomePage/MarketRatesSection.jsx
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedNumber from './fx/AnimatedNumber';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPKR = (n) =>
  n != null ? `PKR ${Number(n).toLocaleString('en-PK', { maximumFractionDigits: 0 })}` : '—';

const formatUSD = (n) =>
  n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

const CURRENCY_NAMES = {
  USD: 'US Dollar', SAR: 'Saudi Riyal', AED: 'UAE Dirham',
  GBP: 'British Pound', EUR: 'Euro', CHF: 'Swiss Franc',
  CAD: 'Canadian Dollar', AUD: 'Australian Dollar', JPY: 'Japanese Yen',
};
const CURRENCY_FLAGS = {
  USD: '🇺🇸', SAR: '🇸🇦', AED: '🇦🇪', GBP: '🇬🇧',
  EUR: '🇪🇺', CHF: '🇨🇭', CAD: '🇨🇦', AUD: '🇦🇺', JPY: '🇯🇵',
};
const CURRENCY_ORDER = ['USD', 'SAR', 'AED', 'GBP', 'EUR', 'CHF', 'CAD', 'AUD'];

// ─── InView hook ─────────────────────────────────────────────────────────────
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Shimmer ─────────────────────────────────────────────────────────────────
const Shimmer = ({ theme }) => (
  <div
    className="h-10 w-full rounded-lg animate-pulse"
    style={{ background: theme.shimmerVia }}
  />
);

// ─── RateRow ─────────────────────────────────────────────────────────────────
const RateRow = ({ label, value, numericValue, prefix = '', suffix = '', decimals = 0, accentColor, mutedColor, borderColor, inView, delay }) => (
  <div
    className="flex items-center justify-between py-2.5 border-b last:border-b-0 transition-all duration-500"
    style={{
      borderColor,
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateX(0)' : 'translateX(-10px)',
      transitionDelay: `${delay}ms`,
    }}
  >
    <span className="text-sm tracking-wide" style={{ color: mutedColor }}>{label}</span>
    <span className="font-mono font-bold text-sm" style={{ color: accentColor }}>
      {numericValue != null && inView ? (
        <AnimatedNumber value={numericValue} prefix={prefix} suffix={suffix} decimals={decimals} duration={1.4} />
      ) : (
        value
      )}
    </span>
  </div>
);

// ─── Panel ───────────────────────────────────────────────────────────────────
const Panel = ({ theme, children, accentColor, inView, delay }) => {
  const isDark = theme.type === 'dark';
  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: theme.cardBg,
        border: `1px solid ${isDark ? theme.border : 'rgba(0,0,0,0.12)'}`,
        boxShadow: isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.07)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms, box-shadow 0.2s ease`,
      }}
    >
      {/* top accent stripe */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-0.5 rounded-b"
        style={{ background: theme.gradient, opacity: isDark ? 0.65 : 1 }}
      />
      {children}
    </div>
  );
};

// ─── PanelHeader ─────────────────────────────────────────────────────────────
const PanelHeader = ({ icon, eyebrow, title, accentColor, mutedColor, iconBg }) => (
  <div className="flex items-center gap-3 mb-5">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
      style={{ background: iconBg, color: accentColor }}
    >
      {icon}
    </div>
    <div>
      <p className="text-[11px] tracking-[0.14em] uppercase font-semibold mb-0.5" style={{ color: mutedColor }}>
        {eyebrow}
      </p>
      <h3 className="font-bold text-[17px] leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif', color: accentColor }}>
        {title}
      </h3>
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const MarketRatesSection = ({ marketPrices }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [sectionRef, inView] = useInView(0.1);

  const isDark = theme.type === 'dark';
  const isLoading = !marketPrices;

  const currencies = CURRENCY_ORDER
    .filter((c) => marketPrices?.currencies?.[c])
    .map((code) => ({
      code,
      rate: marketPrices.currencies[code].rate,
      name: CURRENCY_NAMES[code] || code,
      flag: CURRENCY_FLAGS[code] || '💱',
    }));

  const silverAccent = isDark ? '#c4cdd6' : '#374151';
  const fxAccent = isDark ? '#4dd6b0' : '#0a7c5c';

  const goldIconBg = isDark ? `${theme.primary}25` : `${theme.primary}20`;
  const silverIconBg = isDark ? 'rgba(196,205,214,0.15)' : 'rgba(55,65,81,0.08)';
  const fxIconBg = isDark ? 'rgba(77,214,176,0.15)' : 'rgba(10,124,92,0.08)';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        @keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.65)}}
        .mrs-live-dot{animation:pulseDot 2s ease-in-out infinite}
      `}</style>

      <section
        ref={sectionRef}
        className="w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300"
        style={{ background: theme.bg }}
      >
        <div className="max-w-6xl mx-auto">

          {/* ── Header ── */}
          <div
            className="flex items-center gap-4 mb-10 sm:mb-14 transition-all duration-500"
            style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(-14px)' }}
          >
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${theme.primary}50)` }} />
            <div className="text-center flex-shrink-0">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <span
                  className="mrs-live-dot inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: theme.primary }}
                />
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: theme.primary }}>
                  {t('prices.marketRates')}
                </p>
              </div>
              <h2
                className="text-3xl sm:text-4xl font-black tracking-tight leading-none"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', color: theme.textPrimary }}
              >
                {t('hero.liveMarket')}
              </h2>
            </div>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${theme.primary}50)` }} />
          </div>

          {/* ── Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-start">

            {/* Gold */}
            <Panel theme={theme} accentColor={theme.primary} inView={inView} delay={80}>
              <PanelHeader
                icon="⚜"
                eyebrow={t('prices.preciousMetal', { defaultValue: 'Precious Metal' })}
                title={t('prices.gold24k')}
                accentColor={theme.primary}
                mutedColor={theme.textMuted}
                iconBg={goldIconBg}
              />
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  <Shimmer theme={theme} />
                  <Shimmer theme={theme} />
                  <Shimmer theme={theme} />
                </div>
              ) : (
                <div>
                  <RateRow label={t('prices.gold24kTola')} numericValue={marketPrices?.gold?.per_tola_PKR_24k} prefix="PKR " accentColor={theme.primary} mutedColor={theme.textMuted} borderColor={theme.border} inView={inView} delay={180} />
                  <RateRow label={t('prices.gold2385kTola')} numericValue={marketPrices?.gold?.per_tola_PKR_2385k} prefix="PKR " accentColor={theme.primary} mutedColor={theme.textMuted} borderColor={theme.border} inView={inView} delay={240} />
                  <RateRow label={t('prices.international', { defaultValue: 'International' })} numericValue={marketPrices?.gold?.per_oz_USD} prefix="$" decimals={2} suffix=" / oz" accentColor={theme.primary} mutedColor={theme.textMuted} borderColor="transparent" inView={inView} delay={300} />
                </div>
              )}
              <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${theme.primary}20 0%, transparent 70%)` }} />
            </Panel>

            {/* Silver */}
            <Panel theme={theme} accentColor={silverAccent} inView={inView} delay={200}>
              <PanelHeader
                icon="◈"
                eyebrow={t('prices.preciousMetal', { defaultValue: 'Precious Metal' })}
                title={t('prices.silver')}
                accentColor={silverAccent}
                mutedColor={theme.textMuted}
                iconBg={silverIconBg}
              />
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  <Shimmer theme={theme} />
                  <Shimmer theme={theme} />
                </div>
              ) : (
                <div>
                  <RateRow label={t('prices.silverTola')} numericValue={marketPrices?.silver?.per_tola_PKR} prefix="PKR " accentColor={silverAccent} mutedColor={theme.textMuted} borderColor={theme.border} inView={inView} delay={300} />
                  <RateRow label={t('prices.international', { defaultValue: 'International' })} numericValue={marketPrices?.silver?.per_oz_USD} prefix="$" decimals={2} suffix=" / oz" accentColor={silverAccent} mutedColor={theme.textMuted} borderColor="transparent" inView={inView} delay={360} />
                </div>
              )}
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${silverAccent}18 0%, transparent 70%)` }} />
            </Panel>

            {/* Currencies */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Panel theme={theme} accentColor={fxAccent} inView={inView} delay={320}>
                <PanelHeader
                  icon="₿"
                  eyebrow={t('ticker.liveCurrencies')}
                  title={t('ticker.currencies', { defaultValue: 'Currencies' })}
                  accentColor={fxAccent}
                  mutedColor={theme.textMuted}
                  iconBg={fxIconBg}
                />
                {isLoading ? (
                  <div className="flex flex-col gap-2.5">
                    {[1, 2, 3, 4, 5].map((i) => <Shimmer key={i} theme={theme} />)}
                  </div>
                ) : currencies.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: theme.textMuted }}>{t('common.loading')}</p>
                ) : (
                  <div>
                    {currencies.map(({ code, rate, name, flag }, i) => (
                      <div
                        key={code}
                        className="flex items-center justify-between py-2 -mx-1.5 px-1.5 rounded-lg transition-colors duration-200 cursor-default"
                        style={{
                          borderBottom: i < currencies.length - 1 ? `1px solid ${theme.border}` : 'none',
                          opacity: inView ? 1 : 0,
                          transform: inView ? 'translateX(0)' : 'translateX(10px)',
                          transition: `opacity 0.45s ease ${420 + i * 55}ms, transform 0.45s ease ${420 + i * 55}ms`,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = `${theme.primary}12`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg leading-none flex-shrink-0">{flag}</span>
                          <div>
                            <p className="text-sm font-bold leading-tight" style={{ color: theme.textPrimary }}>{code}</p>
                            <p className="text-[11px] leading-tight" style={{ color: theme.textMuted }}>{name}</p>
                          </div>
                        </div>
                        <p className="font-mono font-bold text-sm" style={{ color: fxAccent }}>
                          <AnimatedNumber value={rate} prefix="PKR " decimals={2} duration={1.2} />
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>
          </div>

          {/* ── Footer ── */}
          <p
            className="text-center text-[11px] tracking-wide mt-6 sm:mt-8 transition-opacity duration-700"
            style={{
              color: theme.textMuted,
              opacity: inView ? 0.65 : 0,
              transitionDelay: '800ms',
            }}
          >
            {t('market.notice', { defaultValue: 'Rates are indicative and updated throughout the trading day. Not financial advice.' })}
          </p>
        </div>
      </section>
    </>
  );
};

export default MarketRatesSection;