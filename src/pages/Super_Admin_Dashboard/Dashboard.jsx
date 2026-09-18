// pages/Super_Admin_Dashboard/Dashboard.jsx
import { useState, useEffect, useCallback } from "react";
import * as saAPI from "../../services/superAdminApi";
import { useLivePrices } from "../../hooks/useLivePrices";
import { useTheme } from "../../contexts/ThemeContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n, digits = 0) =>
  n != null && !isNaN(Number(n))
    ? Number(n).toLocaleString("en-PK", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—";

const fmtUSD = (n) =>
  n != null
    ? `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconGold = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-full h-full">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v10M9.5 9.5 12 7l2.5 2.5M9.5 14.5 12 17l2.5-2.5" />
  </svg>
);
const IconSilver = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 10V7" />
  </svg>
);
const IconShop = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
  </svg>
);
const IconCurrency = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconTrend = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);
const IconRefresh = ({ spin }) => (
  <svg className={`w-4 h-4 ${spin ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const IconAlert = () => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IconChevronDown = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────

function PageSpinner() {
  const { theme } = useTheme();
  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      style={{ background: "transparent" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: `${theme.primary}20` }}
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: theme.primary }}
          />
          <div
            className="absolute inset-3 rounded-full border"
            style={{ borderColor: `${theme.primary}30` }}
          />
        </div>
        <p
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: theme.textMuted }}
        >
          Loading dashboard…
        </p>
      </div>
    </div>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedValue({ value, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState("—");
  useEffect(() => {
    if (value == null || isNaN(Number(value))) { setDisplay("—"); return; }
    const target = Number(value);
    const duration = 900, steps = 40, stepTime = duration / steps;
    let current = 0;
    const increment = target / steps;
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setDisplay(Math.round(current).toLocaleString("en-PK"));
      if (current >= target) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{display}{suffix}</span>;
}

// ─── Price Hero Card (SELL) ───────────────────────────────────────────────────

function PriceHeroCardSell({ label, myPrice, basePrice, diff, usdOz, icon, delay = 0 }) {
  const { theme, isLightTheme } = useTheme();
  const hasDiff = diff != null && diff !== 0;
  const isLight = isLightTheme;

  return (
    <div
      className="relative rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-1"
      style={{
        background: isLight ? theme.cardBg : `${theme.bg}`,
        border: `1px solid ${theme.border}`,
        boxShadow: isLight
          ? `0 4px 24px ${theme.primary}10, 0 1px 4px rgba(0,0,0,0.06)`
          : `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 ${theme.primary}15`,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Gradient accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: theme.gradient }}
      />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "20px 20px",
          color: theme.primary,
        }}
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
              style={{ color: isLight ? theme.textMuted : `${theme.textPrimary}99` }}
            >
              {label}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                style={{
                  background: `${theme.primary}18`,
                  color: theme.primary,
                  border: `1px solid ${theme.primary}30`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.primary }} />
                Sell
              </span>
              {usdOz != null && (
                <p className="text-[11px] font-medium" style={{ color: isLight ? theme.textMuted : `${theme.textPrimary}80` }}>
                  {fmtUSD(usdOz)}/oz live
                </p>
              )}
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center p-2.5 shrink-0"
            style={{
              background: `${theme.primary}18`,
              color: theme.primary,
              border: `1px solid ${theme.primary}25`,
            }}
          >
            {icon}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[11px] font-medium mb-1" style={{ color: isLight ? theme.textMuted : `${theme.textPrimary}80` }}>
            Your sell price
          </p>
          <p
            className="text-2xl sm:text-3xl font-black leading-none tracking-tight"
            style={{ color: theme.textPrimary }}
          >
            PKR <AnimatedValue value={myPrice} />
          </p>
          <p className="text-[11px] mt-1" style={{ color: isLight ? theme.textMuted : `${theme.textPrimary}70` }}>per tola (11.664 g)</p>
        </div>

        <div
          className="pt-4 flex items-center justify-between flex-wrap gap-2"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <div>
            <p className="text-[10px]" style={{ color: isLight ? theme.textMuted : `${theme.textPrimary}70` }}>Live base</p>
            <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>PKR {fmt(basePrice)}</p>
          </div>
          {hasDiff ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl"
              style={diff > 0
                ? { background: '#10b98118', color: '#10b981', border: '1px solid #10b98125' }
                : { background: '#ef444418', color: '#ef4444', border: '1px solid #ef444425' }
              }
            >
              {diff > 0 ? "+" : ""}PKR {fmt(diff)} markup
            </span>
          ) : (
            <span
              className="text-xs px-2.5 py-1.5 rounded-xl font-medium"
              style={{ background: theme.border, color: isLight ? theme.textMuted : `${theme.textPrimary}80` }}
            >
              No markup
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Price Hero Card (BUY) ────────────────────────────────────────────────────

function PriceHeroCardBuy({ label, myPrice, basePrice, diff, usdOz, icon, delay = 0 }) {
  const { theme, isLightTheme } = useTheme();
  const diffValue = diff != null && !isNaN(Number(diff)) ? Number(diff) : 0;
  const hasDiff = diffValue !== 0;
  const isLight = isLightTheme;

  const buyAccent = '#3b82f6';

  return (
    <div
      className="relative rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-1"
      style={{
        background: isLight ? theme.cardBg : theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: isLight
          ? `0 4px 24px ${buyAccent}08, 0 1px 4px rgba(0,0,0,0.06)`
          : `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 ${buyAccent}15`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }} />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: isLight ? theme.textMuted : `${theme.textPrimary}99` }}>
              {label}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                style={{ background: '#3b82f618', color: buyAccent, border: '1px solid #3b82f625' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: buyAccent }} />
                Buy
              </span>
              {usdOz != null && (
                <p className="text-[11px] font-medium" style={{ color: isLight ? theme.textMuted : `${theme.textPrimary}80` }}>{fmtUSD(usdOz)}/oz live</p>
              )}
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center p-2.5 shrink-0"
            style={{ background: '#3b82f618', color: buyAccent, border: '1px solid #3b82f625' }}
          >
            {icon}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-[11px] font-medium mb-1" style={{ color: isLight ? theme.textMuted : `${theme.textPrimary}80` }}>Your buy price</p>
          <p className="text-2xl sm:text-3xl font-black leading-none tracking-tight" style={{ color: theme.textPrimary }}>
            PKR <AnimatedValue value={myPrice} />
          </p>
          <p className="text-[11px] mt-1" style={{ color: isLight ? theme.textMuted : `${theme.textPrimary}70` }}>per tola (11.664 g)</p>
        </div>

        <div className="pt-4 flex items-center justify-between flex-wrap gap-2" style={{ borderTop: `1px solid ${theme.border}` }}>
          <div>
            <p className="text-[10px]" style={{ color: isLight ? theme.textMuted : `${theme.textPrimary}70` }}>Live base</p>
            <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>PKR {fmt(basePrice)}</p>
          </div>
          {hasDiff ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl"
              style={diffValue < 0
                ? { background: '#ef444418', color: '#ef4444', border: '1px solid #ef444425' }
                : { background: '#10b98118', color: '#10b981', border: '1px solid #10b98125' }
              }
            >
              {diffValue > 0 ? "+" : ""}PKR {fmt(diffValue)} diff
            </span>
          ) : (
            <span
              className="text-xs px-2.5 py-1.5 rounded-xl font-medium"
              style={{ background: theme.border, color: isLight ? theme.textMuted : `${theme.textPrimary}80` }}
            >
              No difference
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, accentColor, delay = 0 }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: isLightTheme ? theme.cardBg : theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: isLightTheme
          ? '0 1px 8px rgba(0,0,0,0.06)'
          : '0 2px 12px rgba(0,0,0,0.25)',
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center p-2"
          style={{
            background: `${accentColor}18`,
            color: accentColor,
            border: `1px solid ${accentColor}25`,
          }}
        >
          {icon}
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: theme.textPrimary }}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}90` }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>{sub}</p>}
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ dotColor, children }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2"
      style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}90` }}
    >
      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: dotColor }} />
      {children}
    </p>
  );
}

// ─── Currency Rates Panel ─────────────────────────────────────────────────────

function CurrencyPanel({ title, subtitle, accentColor, currencies, CURRENCY_META, getRateFn, getDiffFn, goldPriceFn }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: isLightTheme ? theme.cardBg : theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: isLightTheme ? '0 1px 8px rgba(0,0,0,0.06)' : '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center p-2 shrink-0"
          style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}25` }}
        >
          <IconCurrency />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: theme.textPrimary }}>{title}</h3>
          <p className="text-[11px]" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>{subtitle}</p>
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: theme.border }}>
        {Object.entries(currencies).length > 0 ? (
          Object.entries(currencies).map(([code]) => {
            const meta = CURRENCY_META[code];
            const rate = getRateFn(code);
            const diff = getDiffFn(code);
            const goldInCurr = goldPriceFn && rate ? goldPriceFn() / rate : null;
            return (
              <div
                key={code}
                className="flex items-center justify-between px-5 py-3 transition-colors"
                onMouseEnter={e => e.currentTarget.style.background = `${accentColor}08`}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg leading-none">{meta?.flag ?? "🌐"}</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>{code}</p>
                    <p className="text-[11px]" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>{meta?.name ?? code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono" style={{ color: theme.textPrimary }}>
                    PKR {rate != null ? fmt(rate, 2) : "—"}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5 flex-wrap">
                    {goldInCurr != null && (
                      <p className="text-[10px]" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}65` }}>
                        Gold: {meta?.symbol}{fmt(goldInCurr, 2)}/tola
                      </p>
                    )}
                    {diff !== 0 && (
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: diff > 0 ? '#10b981' : '#ef4444' }}
                      >
                        ({diff > 0 ? "+" : ""}{fmt(diff, 2)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>No currency data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Gold/Silver in FX mini cards ─────────────────────────────────────────────

function FxMiniCard({ code, meta, inFX, borderColor }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <div
      className="rounded-2xl p-3 sm:p-4 text-center transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: isLightTheme ? theme.cardBg : theme.bg,
        border: `1px solid ${borderColor ?? theme.border}`,
        boxShadow: isLightTheme ? '0 1px 6px rgba(0,0,0,0.05)' : '0 2px 10px rgba(0,0,0,0.2)',
      }}
    >
      <p className="text-xl leading-none mb-2">{meta?.flag ?? "🌐"}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}85` }}>{code}</p>
      <p className="text-sm font-black mt-1.5" style={{ color: theme.textPrimary }}>
        {meta?.symbol}{inFX != null ? fmt(inFX, 2) : "—"}
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}65` }}>per tola</p>
    </div>
  );
}

// ─── Collapsible Shop Card ────────────────────────────────────────────────────

function CollapsibleShopCard({
  shop, final24k, final2385k, finalSilver, base2385,
  gold, silver, currencies, CURRENCY_META, getCurrencyRate, getCurrencyDiff,
}) {
  const { theme, isLightTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // FIX: use shop._id throughout (not shop.id)
  const shopId = shop._id ?? shop.id;

  const buyPrice24k     = gold?.basePricePerTolaPKR  != null ? gold.basePricePerTolaPKR  + (shop.buy_diff_24k    ?? 0) : null;
  const buyPrice2385k   = base2385                   != null ? base2385                   + (shop.buy_diff_2385k  ?? 0) : null;
  const buyPriceSilver  = silver?.basePricePerTolaPKR != null ? silver.basePricePerTolaPKR + (shop.buy_diff_silver ?? 0) : null;

  const cardBg   = isLightTheme ? theme.cardBg : theme.bg;
  const subBg    = isLightTheme ? `${theme.primary}06` : 'rgba(255,255,255,0.03)';
  const buySubBg = isLightTheme ? '#3b82f608' : 'rgba(59,130,246,0.05)';

  const diffStyle = (v) => ({
    color: v > 0 ? '#10b981' : v < 0 ? '#ef4444' : isLightTheme ? theme.textMuted : `${theme.textPrimary}75`,
    fontWeight: 600,
  });

  // Formatted ID — show last 6 chars of the ID string
  const displayId = shopId?.toString().slice(-6)?.toUpperCase() ?? "—";

  return (
    <div style={{ borderBottom: `1px solid ${theme.border}` }}>
      {/* Header row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-3 sm:gap-4 text-left transition-colors"
        style={{ background: 'transparent' }}
        onMouseEnter={e => e.currentTarget.style.background = `${theme.primary}06`}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {shop.shopLogo ? (
            <img
              src={shop.shopLogo}
              alt={shop.shopName}
              className="w-10 h-10 rounded-xl object-cover shrink-0"
              style={{ border: `1px solid ${theme.border}` }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${theme.primary}20`, border: `1px solid ${theme.primary}30` }}
            >
              <span className="font-black text-sm" style={{ color: theme.primary }}>
                {shop.shopName?.charAt(0)?.toUpperCase() ?? "S"}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate" style={{ color: theme.textPrimary }}>{shop.shopName}</p>
            <div className="flex items-center gap-3 mt-0.5">
              {/* FIX: displayId now correctly uses shop._id */}
              <span
                className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md"
                style={{
                  color: isLightTheme ? theme.textMuted : `${theme.textPrimary}85`,
                  background: isLightTheme ? `${theme.primary}08` : `${theme.primary}15`,
                  border: `1px solid ${theme.primary}20`,
                }}
              >
                #{displayId}
              </span>
              {!isExpanded && (
                <div className="hidden sm:flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1">
                  {[
                    { label: "24K",    s: final24k,    b: buyPrice24k },
                    { label: "23.85K", s: final2385k,  b: buyPrice2385k },
                    { label: "Silver", s: finalSilver, b: buyPriceSilver },
                  ].map(({ label, s, b }) => (
                    <div key={label} className="flex items-center gap-1">
                      <span className="font-medium" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>{label}</span>
                      <span className="font-medium" style={{ color: theme.primary }}>S:</span>
                      <span className="font-semibold" style={{ color: theme.textPrimary }}>PKR {fmt(s)}</span>
                      <span style={{ color: theme.border }}>|</span>
                      <span className="font-medium" style={{ color: '#3b82f6' }}>B:</span>
                      <span className="font-semibold" style={{ color: theme.textPrimary }}>PKR {fmt(b)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span
            className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] font-bold"
            style={shop.isActive
              ? { background: '#10b98115', color: '#10b981', border: '1px solid #10b98125' }
              : { background: '#ef444415', color: '#ef4444', border: '1px solid #ef444425' }
            }
          >
            {shop.isActive && <IconCheck />}
            {shop.isActive ? "Active" : "Inactive"}
          </span>
          <div
            className="transition-transform duration-300"
            style={{
              color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80`,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <IconChevronDown />
          </div>
        </div>
      </button>

      {/* Expanded details */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isExpanded ? '9999px' : '0', opacity: isExpanded ? 1 : 0 }}
      >
        <div className="px-4 sm:px-6 pb-5 space-y-4">

          {/* SELL prices */}
          <div>
            <SectionLabel dotColor={theme.primary}>Sell Prices (Customer Buys from Shop)</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: '24K',    label: '24K Gold',    price: final24k,    base: gold?.basePricePerTolaPKR,    diff: shop.diff_24k,    subBgLocal: subBg,    borderLocal: `${theme.primary}20` },
                { key: '2385K',  label: '23.85K Gold', price: final2385k,  base: base2385,                     diff: shop.diff_2385k,  subBgLocal: subBg,    borderLocal: `${theme.primary}20` },
                { key: 'silver', label: 'Silver 999',  price: finalSilver, base: silver?.basePricePerTolaPKR,  diff: shop.diff_silver, subBgLocal: isLightTheme ? '#f1f5f908' : 'rgba(255,255,255,0.03)', borderLocal: theme.border },
              ].map(({ key, label, price, base, diff: d, subBgLocal, borderLocal }) => (
                <div
                  key={key}
                  className="rounded-2xl p-4"
                  style={{ background: subBgLocal, border: `1px solid ${borderLocal}` }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: theme.primary }}>{label}</p>
                  <p className="text-xl font-black" style={{ color: theme.textPrimary }}>PKR {fmt(price)}</p>
                  <p className="text-[10px] mb-2" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>Sell price / tola</p>
                  <div className="pt-2 space-y-1" style={{ borderTop: `1px solid ${borderLocal}` }}>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>Live rate</span>
                      <span className="font-semibold" style={{ color: theme.textPrimary }}>PKR {fmt(base)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>Markup</span>
                      <span style={diffStyle(d ?? 0)}>{(d ?? 0) > 0 ? "+" : ""}PKR {fmt(d ?? 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BUY prices */}
          <div>
            <SectionLabel dotColor="#3b82f6">Buy Prices (Customer Sells to Shop)</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: '24K',    label: '24K Gold',    price: buyPrice24k,    base: gold?.basePricePerTolaPKR,    diff: shop.buy_diff_24k    ?? 0 },
                { key: '2385K',  label: '23.85K Gold', price: buyPrice2385k,  base: base2385,                     diff: shop.buy_diff_2385k  ?? 0 },
                { key: 'silver', label: 'Silver 999',  price: buyPriceSilver, base: silver?.basePricePerTolaPKR,  diff: shop.buy_diff_silver ?? 0 },
              ].map(({ key, label, price, base, diff: d }) => (
                <div
                  key={key}
                  className="rounded-2xl p-4"
                  style={{ background: buySubBg, border: '1px solid #3b82f620' }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#3b82f6' }}>{label}</p>
                  <p className="text-xl font-black" style={{ color: theme.textPrimary }}>PKR {fmt(price)}</p>
                  <p className="text-[10px] mb-2" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>Buy price / tola</p>
                  <div className="pt-2 space-y-1" style={{ borderTop: '1px solid #3b82f620' }}>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>Live rate</span>
                      <span className="font-semibold" style={{ color: theme.textPrimary }}>PKR {fmt(base)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>Difference</span>
                      <span style={diffStyle(d)}>{d > 0 ? "+" : ""}PKR {fmt(d)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Currency rates for this shop */}
          {Object.keys(currencies).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { type: 'sell', label: 'Currency Sell Rates', accentColor: theme.primary, bg: subBg, border: `${theme.primary}20` },
                { type: 'buy',  label: 'Currency Buy Rates',  accentColor: '#3b82f6',     bg: buySubBg, border: '#3b82f620' },
              ].map(({ type, label, accentColor, bg, border }) => (
                <div key={type} className="rounded-2xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: accentColor }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accentColor }} />
                    {label}
                  </p>
                  <div className="space-y-2">
                    {Object.entries(currencies).map(([code, info]) => {
                      const meta = CURRENCY_META[code];
                      const rate = type === 'sell' ? (info?.adjustedRate ?? info?.rate ?? null) : (info?.buyRate ?? null);
                      const diff = type === 'sell' ? (info?.difference ?? 0) : (info?.buy_difference ?? 0);
                      return (
                        <div key={code} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{meta?.flag ?? "🌐"}</span>
                            <span className="font-bold" style={{ color: theme.textPrimary }}>{code}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold" style={{ color: theme.textPrimary }}>
                              {rate != null ? `PKR ${fmt(rate, 2)}` : "—"}
                            </span>
                            {diff !== 0 && (
                              <span className="ml-2 text-[10px] font-bold" style={{ color: diff > 0 ? '#10b981' : '#ef4444' }}>
                                ({diff > 0 ? "+" : ""}{fmt(diff, 2)})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Analytics quick view */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Sales',      value: shop.totalSales      != null ? `PKR ${fmt(shop.totalSales)}`      : "—" },
              { label: 'Total Purchases',  value: shop.totalPurchases  != null ? `PKR ${fmt(shop.totalPurchases)}`  : "—" },
              { label: 'Sales Orders',     value: shop.salesCount      ?? "—" },
              { label: 'Purchase Orders',  value: shop.purchasesCount  ?? "—" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl p-3 text-center"
                style={{ background: isLightTheme ? theme.border : 'rgba(255,255,255,0.06)', border: `1px solid ${theme.border}` }}
              >
                <p className="text-base font-black" style={{ color: theme.textPrimary }}>{value}</p>
                <p
                  className="text-[9px] font-bold uppercase tracking-widest mt-0.5"
                  style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { theme, isLightTheme } = useTheme();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");

  const {
    prices:      ssePrices,
    connected:   sseConnected,
    lastUpdated: sseLastUpdated,
  } = useLivePrices('superAdmin');

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    setError("");
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await saAPI.getDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard. Is the backend running?");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const [secondsAgo, setSecondsAgo] = useState(0);
  useEffect(() => {
    if (!sseLastUpdated) return;
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - sseLastUpdated.getTime()) / 1000));
    }, 1_000);
    return () => clearInterval(timer);
  }, [sseLastUpdated]);

  // ── Theme-derived surface tokens ─────────────────────────────────────────
  const pageBg   = isLightTheme ? (theme.pageBg ?? '#f2f1ed') : (theme.bg ?? '#0c0c0c');
  const cardBg   = isLightTheme ? (theme.cardBg ?? '#ffffff') : '#111111';

  if (loading) return <PageSpinner />;

  if (error)
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto"
            style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}
          >
            <IconAlert />
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: theme.textPrimary }}>Dashboard unavailable</p>
            <p className="text-sm mt-2" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>{error}</p>
          </div>
          <button
            onClick={() => fetchDashboard()}
            className="px-6 py-3 font-bold text-sm rounded-2xl transition-all text-white"
            style={{ background: theme.gradient, boxShadow: `0 4px 16px ${theme.primary}40` }}
          >
            Try Again
          </button>
        </div>
      </div>
    );

  if (!data) return null;

  // ── Data ────────────────────────────────────────────────────────────────
  const livePrices   = sseConnected && ssePrices ? ssePrices : data?.livePrices;
  const shops        = data?.shops ?? [];
  const gold         = livePrices?.gold;
  const silver       = livePrices?.silver;
  const currencies   = livePrices?.currencies?.adjusted ?? livePrices?.currencies ?? {};
  const activeShops  = shops.filter(s => s.isActive).length;
  const inactiveShops = shops.length - activeShops;

  const lastUpdated = (() => {
    if (sseConnected && sseLastUpdated)
      return sseLastUpdated.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
    if (data?.livePrices?.lastUpdated)
      return new Date(data.livePrices.lastUpdated).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
    return null;
  })();

  const CURRENCY_META = {
    USD: { flag: "🇺🇸", symbol: "$",  name: "US Dollar"     },
    SAR: { flag: "🇸🇦", symbol: "﷼", name: "Saudi Riyal"   },
    AED: { flag: "🇦🇪", symbol: "د.إ", name: "UAE Dirham"   },
    EUR: { flag: "🇪🇺", symbol: "€",  name: "Euro"          },
    GBP: { flag: "🇬🇧", symbol: "£",  name: "British Pound" },
    CHF: { flag: "🇨🇭", symbol: "₣",  name: "Swiss Franc"   },
  };

  const getCurrencyRate = (code, type = "sell") => {
    const info = currencies[code];
    if (!info) return null;
    return type === "sell" ? (info.adjustedRate ?? info.rate ?? null) : (info.buyRate ?? null);
  };
  const getCurrencyDiff = (code, type = "sell") => {
    const info = currencies[code];
    if (!info) return 0;
    return type === "sell" ? (info.difference ?? 0) : (info.buy_difference ?? 0);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: theme.textPrimary }}>
              Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>
              Live market overview · Your shop prices (sell &amp; buy) · All in one place
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={sseConnected
                ? { background: '#10b98115', color: '#10b981', border: '1px solid #10b98125' }
                : { background: '#ef444415', color: '#ef4444', border: '1px solid #ef444425' }
              }
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${sseConnected ? 'animate-pulse' : ''}`}
                style={{ background: sseConnected ? '#10b981' : '#ef4444' }}
              />
              {sseConnected ? "Live" : "Offline"}
            </span>

            {lastUpdated && (
              <p className="text-xs hidden md:block" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>
                Updated: <span className="font-semibold" style={{ color: theme.textPrimary }}>{lastUpdated}</span>
              </p>
            )}

            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                background: isLightTheme ? cardBg : '#1a1a1a',
                border: `1px solid ${theme.border}`,
                color: theme.textPrimary,
                boxShadow: isLightTheme ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <IconRefresh spin={refreshing} />
              <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* ── Quick stats row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Shops"   value={shops.length ?? "—"} sub={`${activeShops} active · ${inactiveShops} inactive`} icon={<IconShop />}     accentColor={theme.primary}  delay={0}   />
          <StatCard label="Active Shops"  value={activeShops}          sub="Currently serving customers"                         icon={<IconTrend />}    accentColor="#10b981"        delay={50}  />
          <StatCard label="Gold USD/oz"   value={gold?.priceUSD != null ? fmtUSD(gold.priceUSD) : "—"}   sub="Live spot price" icon={<IconGold />}     accentColor="#f59e0b"        delay={100} />
          <StatCard label="Silver USD/oz" value={silver?.priceUSD != null ? fmtUSD(silver.priceUSD) : "—"} sub="Live spot price" icon={<IconSilver />} accentColor="#64748b"        delay={150} />
        </div>

        {/* ── SELL Price hero cards ────────────────────────────────────────── */}
        <div>
          <SectionLabel dotColor={theme.primary}>Your Shop Sell Prices (Customer Buys)</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            <PriceHeroCardSell
              label="Gold 24 Karat"
              myPrice={gold?.myPrice_24k}
              basePrice={gold?.basePricePerTolaPKR}
              diff={gold?.diff_24k}
              usdOz={gold?.priceUSD}
              icon={<IconGold />}
              delay={0}
            />
            <PriceHeroCardSell
              label="Gold 23.85 Karat"
              myPrice={gold?.myPrice_2385k}
              basePrice={gold?.base2385PerTolaPKR ?? (gold?.basePricePerTolaPKR != null ? Math.round(gold.basePricePerTolaPKR * (23.85 / 24)) : null)}
              diff={gold?.diff_2385k}
              usdOz={gold?.priceUSD != null ? gold.priceUSD * (23.85 / 24) : null}
              icon={<IconGold />}
              delay={80}
            />
            <PriceHeroCardSell
              label="Silver 999"
              myPrice={silver?.myPrice ?? silver?.basePricePerTolaPKR}
              basePrice={silver?.basePricePerTolaPKR}
              diff={silver?.diff_silver}
              usdOz={silver?.priceUSD}
              icon={<IconSilver />}
              delay={160}
            />
          </div>
        </div>

        {/* ── BUY Price hero cards ─────────────────────────────────────────── */}
        <div>
          <SectionLabel dotColor="#3b82f6">Your Shop Buy Prices (Customer Sells to You)</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            <PriceHeroCardBuy
              label="Gold 24 Karat"
              myPrice={gold?.myBuyPrice_24k}
              basePrice={gold?.basePricePerTolaPKR}
              diff={gold?.buy_diff_24k}
              usdOz={gold?.priceUSD}
              icon={<IconGold />}
              delay={0}
            />
            <PriceHeroCardBuy
              label="Gold 23.85 Karat"
              myPrice={gold?.myBuyPrice_2385k}
              basePrice={gold?.base2385PerTolaPKR ?? (gold?.basePricePerTolaPKR != null ? Math.round(gold.basePricePerTolaPKR * (23.85 / 24)) : null)}
              diff={gold?.buy_diff_2385k}
              usdOz={gold?.priceUSD != null ? gold.priceUSD * (23.85 / 24) : null}
              icon={<IconGold />}
              delay={80}
            />
            <PriceHeroCardBuy
              label="Silver 999"
              myPrice={silver?.myBuyPrice ?? silver?.basePricePerTolaPKR}
              basePrice={silver?.basePricePerTolaPKR}
              diff={silver?.buy_diff_silver}
              usdOz={silver?.priceUSD}
              icon={<IconSilver />}
              delay={160}
            />
          </div>
        </div>

        {/* ── Currency rate panels ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <CurrencyPanel
            title="Currency Sell Rates"
            subtitle="Customer buys foreign currency"
            accentColor={theme.primary}
            currencies={currencies}
            CURRENCY_META={CURRENCY_META}
            getRateFn={(code) => getCurrencyRate(code, "sell")}
            getDiffFn={(code) => getCurrencyDiff(code, "sell")}
            goldPriceFn={gold?.myPrice_24k ? () => gold.myPrice_24k : null}
          />
          <CurrencyPanel
            title="Currency Buy Rates"
            subtitle="Customer sells foreign currency to you"
            accentColor="#3b82f6"
            currencies={currencies}
            CURRENCY_META={CURRENCY_META}
            getRateFn={(code) => getCurrencyRate(code, "buy")}
            getDiffFn={(code) => getCurrencyDiff(code, "buy")}
            goldPriceFn={gold?.myBuyPrice_24k ? () => gold.myBuyPrice_24k : null}
          />
        </div>

        {/* ── Gold 24K in all currencies ──────────────────────────────────── */}
        {gold?.basePricePerTolaPKR != null && Object.keys(currencies).length > 0 && (
          <div>
            <SectionLabel dotColor="#f59e0b">Gold 24K — Live Market Price in All Currencies (per tola)</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(currencies).map(([code, info]) => {
                const rate = info?.rate ?? null;
                const inFX = rate && gold.basePricePerTolaPKR ? gold.basePricePerTolaPKR / rate : null;
                return <FxMiniCard key={code} code={code} meta={CURRENCY_META[code]} inFX={inFX} borderColor={`${theme.primary}25`} />;
              })}
            </div>
          </div>
        )}

        {/* ── Gold 23.85K in all currencies ───────────────────────────────── */}
        {gold?.basePricePerTolaPKR != null && Object.keys(currencies).length > 0 && (
          <div>
            <SectionLabel dotColor="#f59e0b">Gold 23.85K — Live Market Price in All Currencies (per tola)</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(currencies).map(([code, info]) => {
                const rate = info?.rate ?? null;
                const base2385 = gold?.base2385PerTolaPKR ?? (gold.basePricePerTolaPKR != null ? Math.round(gold.basePricePerTolaPKR * (23.85 / 24)) : null);
                const inFX = rate && base2385 ? base2385 / rate : null;
                return <FxMiniCard key={code} code={code} meta={CURRENCY_META[code]} inFX={inFX} borderColor="#f59e0b25" />;
              })}
            </div>
          </div>
        )}

        {/* ── Silver in all currencies ─────────────────────────────────────── */}
        {silver?.basePricePerTolaPKR != null && Object.keys(currencies).length > 0 && (
          <div>
            <SectionLabel dotColor="#64748b">Silver 999 — Live Market Price in All Currencies (per tola)</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(currencies).map(([code, info]) => {
                const rate = info?.rate ?? null;
                const inFX = rate && silver.basePricePerTolaPKR ? silver.basePricePerTolaPKR / rate : null;
                return <FxMiniCard key={code} code={code} meta={CURRENCY_META[code]} inFX={inFX} borderColor={`${theme.border}`} />;
              })}
            </div>
          </div>
        )}

        {/* ── Shops overview ───────────────────────────────────────────────── */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: isLightTheme ? cardBg : '#111111',
            border: `1px solid ${theme.border}`,
            boxShadow: isLightTheme ? '0 1px 8px rgba(0,0,0,0.06)' : '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          <div
            className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between flex-wrap gap-3"
            style={{ borderBottom: `1px solid ${theme.border}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center p-2 shrink-0"
                style={{ background: `${theme.primary}18`, color: theme.primary, border: `1px solid ${theme.primary}25` }}
              >
                <IconShop />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Shops Overview</h3>
                <p className="text-[11px]" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>
                  {shops.length} shops registered · Click to expand details
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-semibold" style={{ color: '#10b981' }}>
                <span className="w-2 h-2 rounded-full bg-current" />{activeShops} active
              </span>
              {inactiveShops > 0 && (
                <span className="flex items-center gap-1 font-semibold" style={{ color: '#ef4444' }}>
                  <span className="w-2 h-2 rounded-full bg-current" />{inactiveShops} off
                </span>
              )}
            </div>
          </div>

          <div>
            {shops.length > 0 ? (
              shops.map((shop) => {
                // FIX: use shop._id as the React key (was shop.id — caused the warning)
                const shopKey = shop._id ?? shop.id;
                const final24k    = gold?.basePricePerTolaPKR  != null ? gold.basePricePerTolaPKR  + (shop.diff_24k    ?? 0) : null;
                const base2385    = gold?.base2385PerTolaPKR   ?? (gold?.basePricePerTolaPKR != null ? Math.round(gold.basePricePerTolaPKR * (23.85 / 24)) : null);
                const final2385k  = base2385 != null ? base2385 + (shop.diff_2385k  ?? 0) : null;
                const finalSilver = silver?.basePricePerTolaPKR != null ? silver.basePricePerTolaPKR + (shop.diff_silver ?? 0) : null;
                return (
                  <CollapsibleShopCard
                    key={shopKey}
                    shop={shop}
                    final24k={final24k}
                    final2385k={final2385k}
                    finalSilver={finalSilver}
                    base2385={base2385}
                    gold={gold}
                    silver={silver}
                    currencies={currencies}
                    CURRENCY_META={CURRENCY_META}
                    getCurrencyRate={getCurrencyRate}
                    getCurrencyDiff={getCurrencyDiff}
                  />
                );
              })
            ) : (
              <div className="px-6 py-12 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 p-3"
                  style={{ background: `${theme.primary}10`, color: isLightTheme ? theme.textMuted : `${theme.textPrimary}60` }}
                >
                  <IconShop />
                </div>
                <p className="text-sm font-medium" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>No shops created yet</p>
                <p className="text-xs mt-1" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}55` }}>Create your first shop admin to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer timestamp ─────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between pt-3 flex-wrap gap-2"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <p className="text-xs" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
            All prices are live and updated every 30 seconds. Adjust markups in{" "}
            <span className="font-semibold" style={{ color: theme.textPrimary }}>Price Management</span>.
          </p>
          <div className="hidden sm:flex items-center gap-3">
            {sseConnected && sseLastUpdated && (
              <span className="text-xs" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
                Next update in{" "}
                <span className="font-semibold font-mono" style={{ color: theme.primary }}>
                  {Math.max(0, 30 - secondsAgo)}s
                </span>
              </span>
            )}
            {lastUpdated && (
              <p className="text-xs" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
                Last refresh:{" "}
                <span className="font-semibold" style={{ color: theme.textPrimary }}>{lastUpdated}</span>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}