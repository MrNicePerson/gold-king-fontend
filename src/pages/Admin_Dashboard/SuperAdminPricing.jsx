// src/pages/Admin_Dashboard/SuperAdminPricing.jsx
import { useState, useEffect, useCallback } from "react";
import { useLivePrices } from "../../hooks/useLivePrices";
import * as adminApi from "../../services/adminApi";
import * as saApi from "../../services/superAdminApi";
import { useTheme } from "../../contexts/ThemeContext";

// ─── Formatters ───────────────────────────────────────────────────────────────
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

// ─── Currency Metadata ────────────────────────────────────────────────────────
const CURRENCY_META = {
  USD: { flag: "🇺🇸", symbol: "$", name: "US Dollar" },
  SAR: { flag: "🇸🇦", symbol: "﷼", name: "Saudi Riyal" },
  AED: { flag: "🇦🇪", symbol: "د.إ", name: "UAE Dirham" },
  EUR: { flag: "🇪🇺", symbol: "€", name: "Euro" },
  GBP: { flag: "🇬🇧", symbol: "£", name: "British Pound" },
  CHF: { flag: "🇨🇭", symbol: "₣", name: "Swiss Franc" },
};

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

const IconCurrency = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconTrendUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const IconRefresh = ({ spin }) => (
  <svg className={`w-4 h-4 ${spin ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ─── Loading Spinner (themed) ─────────────────────────────────────────────────
const PageSpinner = () => {
  const { theme } = useTheme();
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${theme.primary}30` }} />
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: theme.primary }} />
        </div>
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: theme.textMuted }}>
          Loading pricing reference…
        </p>
      </div>
    </div>
  );
};

// ─── Price Card Component (themed) ────────────────────────────────────────────
const PriceCard = ({ title, saPrice, yourPrice, livePrice, markup, isSell = true, icon, usdPrice }) => {
  const { theme, isLightTheme } = useTheme();
  const difference = yourPrice != null && saPrice != null ? yourPrice - saPrice : null;
  const isAbove = difference > 0;
  const isBelow = difference < 0;

  const accentColor = isSell ? "#f59e0b" : "#3b82f6";
  const accentBg = isSell ? "#fef3c7" : "#dbeafe";
  const accentBorder = isSell ? "#fde68a" : "#bfdbfe";
  const badgeBg = isSell ? "#fef3c7" : "#dbeafe";
  const badgeText = isSell ? "#92400e" : "#1e40af";

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: isLightTheme ? accentBg : theme.bg,
        border: `1px solid ${isLightTheme ? accentBorder : theme.border}`,
        boxShadow: isLightTheme ? "0 4px 16px rgba(0,0,0,0.08)" : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "24px 24px" }}
      />

      <div className="relative p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl p-1.5" style={{ background: accentBg, color: accentColor }}>
              {icon}
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: theme.textMuted }}>{title}</p>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: badgeBg, color: badgeText }}
              >
                {isSell ? "SELL" : "BUY"}
              </span>
            </div>
          </div>
          {usdPrice && (
            <p className="text-xs" style={{ color: theme.textMuted }}>{fmtUSD(usdPrice)}/oz</p>
          )}
        </div>

        {/* SA Price */}
        <div className="mb-3">
          <p className="text-xs font-medium" style={{ color: theme.textMuted }}>Super Admin Price</p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: theme.textPrimary }}>
            PKR <span style={{ color: accentColor }}>{saPrice != null ? fmt(saPrice) : "—"}</span>
          </p>
          <p className="text-[10px]" style={{ color: theme.textMuted }}>per tola (11.664g)</p>
        </div>

        {/* Live Base & Markup */}
        <div className="flex justify-between items-center py-2" style={{ borderTop: `1px solid ${theme.border}` }}>
          <span className="text-xs" style={{ color: theme.textMuted }}>Live Base:</span>
          <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>PKR {fmt(livePrice)}</span>
        </div>
        <div className="flex justify-between items-center py-2" style={{ borderTop: `1px solid ${theme.border}` }}>
          <span className="text-xs" style={{ color: theme.textMuted }}>SA Markup:</span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-lg"
            style={{
              background: markup > 0 ? "#d1fae5" : markup < 0 ? "#fee2e2" : isLightTheme ? "#f3f4f6" : "#222",
              color: markup > 0 ? "#065f46" : markup < 0 ? "#991b1b" : theme.textMuted,
            }}
          >
            {markup > 0 ? "+" : ""}{fmt(markup)}
          </span>
        </div>

        {/* Your Price Comparison */}
        {yourPrice != null && (
          <div
            className="mt-3 p-3 rounded-xl"
            style={{
              background: isAbove ? "#d1fae520" : isBelow ? "#fee2e220" : isLightTheme ? "#f3f4f6" : "#1a1a1a",
              border: `1px solid ${isAbove ? "#10b98130" : isBelow ? "#ef444430" : theme.border}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: theme.textMuted }}>Your Price:</span>
              <span className="text-base sm:text-lg font-bold" style={{ color: theme.textPrimary }}>PKR {fmt(yourPrice)}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs" style={{ color: theme.textMuted }}>vs Super Admin:</span>
              <span
                className="text-xs font-bold"
                style={{ color: isAbove ? "#10b981" : isBelow ? "#ef4444" : theme.textMuted }}
              >
                {isAbove
                  ? `↑ PKR ${fmt(Math.abs(difference))} above`
                  : isBelow
                  ? `↓ PKR ${fmt(Math.abs(difference))} below`
                  : "✓ Match"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Currency Card Component (themed) ────────────────────────────────────────
const CurrencyCard = ({ title, currencies, adminCurrencies, type = "sell" }) => {
  const { theme, isLightTheme } = useTheme();
  const isSell = type === "sell";
  const accentColor = isSell ? "#f59e0b" : "#3b82f6";
  const headerBg = isSell ? "#fef3c720" : "#dbeafe20";
  const headerText = isSell ? "#92400e" : "#1e40af";

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: isLightTheme ? (isSell ? "#fffbeb" : "#eff6ff") : theme.bg,
        border: `1px solid ${isLightTheme ? (isSell ? "#fde68a" : "#bfdbfe") : theme.border}`,
        boxShadow: isLightTheme ? "0 4px 16px rgba(0,0,0,0.06)" : "0 4px 16px rgba(0,0,0,0.25)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 sm:px-5 py-3"
        style={{
          background: isLightTheme ? (isSell ? "#fef3c7" : "#dbeafe") : `${accentColor}15`,
          borderBottom: `1px solid ${isLightTheme ? (isSell ? "#fde68a" : "#bfdbfe") : theme.border}`,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5" style={{ color: accentColor }}><IconCurrency /></div>
          <p className="text-sm font-bold" style={{ color: isLightTheme ? headerText : theme.textPrimary }}>{title}</p>
        </div>
      </div>

      {/* Rows */}
      <div>
        {Object.entries(currencies).map(([code, info], idx) => {
          const meta = CURRENCY_META[code];
          const liveRate = info?.liveRate ?? info?.rate;
          const saRate = isSell ? info?.adjustedRate : info?.buyRate;
          const saDiff = isSell ? (info?.difference ?? 0) : (info?.buy_difference ?? 0);
          const yourRate = adminCurrencies[code]
            ? (isSell ? adminCurrencies[code]?.adjustedRate : adminCurrencies[code]?.buyRate)
            : null;
          const rateDiff = yourRate != null && saRate != null ? yourRate - saRate : null;
          const diffAmount = rateDiff !== null ? Math.abs(rateDiff).toFixed(2) : null;

          return (
            <div
              key={code}
              className="px-4 sm:px-5 py-3 transition-colors"
              style={{
                borderTop: idx === 0 ? "none" : `1px solid ${theme.border}`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="text-xl sm:text-2xl shrink-0">{meta?.flag || "🌐"}</span>
                  <div className="min-w-0">
                    <p className="font-bold truncate" style={{ color: theme.textPrimary }}>{code}</p>
                    <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>{meta?.name}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base sm:text-lg font-black" style={{ color: theme.textPrimary }}>
                    PKR {fmt(saRate, 2)}
                  </p>
                  <p className="text-[10px]" style={{ color: theme.textMuted }}>Live: PKR {fmt(liveRate, 2)}</p>
                  {saDiff !== 0 && (
                    <p
                      className="text-[10px] font-bold"
                      style={{ color: isSell ? (saDiff > 0 ? "#10b981" : "#ef4444") : (saDiff < 0 ? "#ef4444" : "#10b981") }}
                    >
                      {saDiff > 0 ? "+" : ""}{fmt(saDiff, 2)} {isSell ? "markup" : "diff"}
                    </p>
                  )}
                </div>
              </div>

              {yourRate != null && (
                <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs" style={{ color: theme.textMuted }}>Your rate:</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                        PKR {fmt(yourRate, 2)}
                      </span>
                      {rateDiff !== 0 && (
                        <span
                          className="ml-2 text-[10px] font-bold"
                          style={{ color: rateDiff > 0 ? "#10b981" : "#ef4444" }}
                        >
                          ({rateDiff > 0 ? "+" : ""}{fmt(rateDiff, 2)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SELL messages */}
                  {isSell && rateDiff !== null && rateDiff < 0 && (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-lg" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
                      <span className="text-sm shrink-0">⚠️</span>
                      <span className="text-xs font-medium" style={{ color: "#991b1b" }}>
                        Your sell rate is {diffAmount} PKR lower than SA
                      </span>
                    </div>
                  )}
                  {isSell && rateDiff !== null && rateDiff > 0 && (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-lg" style={{ background: "#d1fae5", border: "1px solid #6ee7b7" }}>
                      <span className="text-sm shrink-0">✨</span>
                      <span className="text-xs font-medium" style={{ color: "#065f46" }}>
                        Your sell rate is {diffAmount} PKR higher than SA
                      </span>
                    </div>
                  )}

                  {/* BUY messages */}
                  {!isSell && rateDiff !== null && rateDiff > 0 && (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-lg" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
                      <span className="text-sm shrink-0">⚠️</span>
                      <span className="text-xs font-medium" style={{ color: "#991b1b" }}>
                        Your buy rate is {diffAmount} PKR higher than SA (you're paying more)
                      </span>
                    </div>
                  )}
                  {!isSell && rateDiff !== null && rateDiff < 0 && (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-lg" style={{ background: "#d1fae5", border: "1px solid #6ee7b7" }}>
                      <span className="text-sm shrink-0">✅</span>
                      <span className="text-xs font-medium" style={{ color: "#065f46" }}>
                        Your buy rate is {diffAmount} PKR lower than SA (better for profit)
                      </span>
                    </div>
                  )}

                  {/* Match */}
                  {rateDiff !== null && rateDiff === 0 && (
                    <div
                      className="mt-2 flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: isLightTheme ? "#f3f4f6" : "#1a1a1a", border: `1px solid ${theme.border}` }}
                    >
                      <span className="text-sm shrink-0">✓</span>
                      <span className="text-xs font-medium" style={{ color: theme.textMuted }}>
                        Your rate matches SA exactly
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Stat Card (themed) ───────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon, iconBg, iconColor }) => {
  const { theme, isLightTheme } = useTheme();
  return (
    <div
      className="rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: isLightTheme ? theme.cardBg : theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: isLightTheme ? "0 1px 8px rgba(0,0,0,0.06)" : "0 2px 12px rgba(0,0,0,0.25)",
      }}
    >
      <div
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 p-2"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <p className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: theme.textPrimary }}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: theme.textMuted }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{sub}</p>}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SuperAdminPricing() {
  const { theme, isLightTheme } = useTheme();

  const [saData, setSaData] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const { prices: ssePrices, connected: sseConnected, lastUpdated: sseLastUpdated } = useLivePrices("admin");
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!sseLastUpdated) return;
    const t = setInterval(() => setSecondsAgo(Math.floor((Date.now() - sseLastUpdated.getTime()) / 1000)), 1000);
    return () => clearInterval(t);
  }, [sseLastUpdated]);

  const fetchAll = useCallback(async (isRefresh = false) => {
    setError("");
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [saResponse, adminResponse] = await Promise.allSettled([
        saApi.getDashboard(),
        adminApi.getDashboard(),
      ]);

      if (saResponse.status === "fulfilled" && saResponse.value?.data) {
        setSaData(saResponse.value.data);
      } else {
        setError("Could not load Super Admin pricing");
      }

      if (adminResponse.status === "fulfilled" && adminResponse.value?.data) {
        setAdminData(adminResponse.value.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load pricing data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <PageSpinner />;

  const liveBase = (sseConnected && ssePrices) ? ssePrices : saData?.livePrices;

  const goldBase = liveBase?.gold?.basePricePerTolaPKR ?? liveBase?.gold?.basePricePerTola_24k ?? null;
  const base2385 = liveBase?.gold?.base2385PerTolaPKR ?? (goldBase ? Math.round(goldBase * (23.85 / 24) * 100) / 100 : null);

  const silverBase = liveBase?.silver?.basePricePerTolaPKR
    ?? liveBase?.silver?.pricePerTolaPKR
    ?? liveBase?.silver?.basePricePerTola
    ?? liveBase?.silver?.myPrice
    ?? null;

  const goldUSD = liveBase?.gold?.priceUSD ?? null;
  const silverUSD = liveBase?.silver?.priceUSD ?? null;

  console.log("Silver data from API:", liveBase?.silver);
  console.log("Silver base price:", silverBase);

  const saGold = saData?.livePrices?.gold;
  const saSilver = saData?.livePrices?.silver;
  const saCurrencies = saData?.livePrices?.currencies ?? {};

  const adminGold = adminData?.livePrices?.gold;
  const adminSilver = adminData?.livePrices?.silver;
  const adminCurrencies = adminData?.livePrices?.currencies ?? {};

  const saSellPrices = {
    gold24k: goldBase != null && saGold ? goldBase + (saGold.diff_24k ?? 0) : saGold?.myPrice_24k,
    gold2385k: base2385 != null && saGold ? base2385 + (saGold.diff_2385k ?? 0) : saGold?.myPrice_2385k,
    silver: silverBase != null && saSilver ? silverBase + (saSilver.diff_silver ?? 0) : saSilver?.myPrice,
  };

  const saBuyPrices = {
    gold24k: goldBase != null && saGold ? goldBase + (saGold.buy_diff_24k ?? 0) : saGold?.myBuyPrice_24k,
    gold2385k: base2385 != null && saGold ? base2385 + (saGold.buy_diff_2385k ?? 0) : saGold?.myBuyPrice_2385k,
    silver: silverBase != null && saSilver ? silverBase + (saSilver.buy_diff_silver ?? 0) : saSilver?.myBuyPrice,
  };

  const yourSellPrices = {
    gold24k: adminGold?.myPrice_24k,
    gold2385k: adminGold?.myPrice_2385k,
    silver: adminSilver?.myPrice,
  };

  const yourBuyPrices = {
    gold24k: adminGold?.myBuyPrice_24k,
    gold2385k: adminGold?.myBuyPrice_2385k,
    silver: adminSilver?.myBuyPrice,
  };

  const hasSaData = saData !== null;
  const lastUpdateTime = sseLastUpdated?.toLocaleString("en-PK", { timeStyle: "short", dateStyle: "short" });

  return (
    <div className="min-h-screen" style={{ background: isLightTheme ? theme.pageBg : theme.pageBg }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight" style={{ color: theme.textPrimary }}>
              Super Admin Pricing Reference
            </h1>
            <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
              Live sell & buy prices — benchmark for your markups
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={sseConnected
                ? { background: "#10b98115", color: "#10b981", border: "1px solid #10b98125" }
                : { background: isLightTheme ? "#f3f4f6" : "#1a1a1a", color: theme.textMuted, border: `1px solid ${theme.border}` }}
            >
              <span className={`w-2 h-2 rounded-full ${sseConnected ? "animate-pulse" : ""}`}
                style={{ background: sseConnected ? "#10b981" : theme.textMuted }} />
              {sseConnected ? "Live" : "Snapshot"}
            </span>
            {sseConnected && (
              <span className="text-xs hidden sm:block" style={{ color: theme.textMuted }}>
                Next update in{" "}
                <span className="font-semibold font-mono" style={{ color: theme.primary }}>
                  {Math.max(0, 30 - secondsAgo)}s
                </span>
              </span>
            )}
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
              style={{
                background: isLightTheme ? "#ffffff" : "#1a1a1a",
                border: `1px solid ${theme.border}`,
                color: theme.textPrimary,
              }}
            >
              <IconRefresh spin={refreshing} />
              <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* ── Warning Banner ── */}
        {!hasSaData && error && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 sm:px-5 py-4"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <div className="w-5 h-5 shrink-0" style={{ color: "#f59e0b" }}><IconTrendUp /></div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#92400e" }}>Limited Data Available</p>
              <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>
                {error}. Showing your own shop prices as reference.
              </p>
            </div>
          </div>
        )}

        {/* ── Info Banner ── */}
        {hasSaData && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 sm:px-5 py-4"
            style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
          >
            <div className="w-5 h-5 shrink-0" style={{ color: "#3b82f6" }}><IconTrendUp /></div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#1e40af" }}>Super Admin Reference Pricing</p>
              <p className="text-xs mt-0.5" style={{ color: "#1d4ed8" }}>
                Use these as a benchmark for your own pricing. Your prices are shown in green/red for comparison.
              </p>
            </div>
          </div>
        )}

        {/* ── Live Market Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Live Gold 24K"
            value={goldBase != null ? `PKR ${fmt(goldBase)}` : "—"}
            sub={fmtUSD(goldUSD)}
            icon={<IconGold />}
            iconBg="#fef3c7"
            iconColor="#d97706"
          />
          <StatCard
            label="Live Gold 23.85K"
            value={base2385 != null ? `PKR ${fmt(base2385)}` : "—"}
            sub="Base market rate"
            icon={<IconGold />}
            iconBg="#ffedd5"
            iconColor="#ea580c"
          />
          <StatCard
            label="Live Silver 999"
            value={silverBase != null ? `PKR ${fmt(silverBase)}` : "—"}
            sub={fmtUSD(silverUSD)}
            icon={<IconSilver />}
            iconBg="#f1f5f9"
            iconColor="#475569"
          />
          <StatCard
            label="SA Sell Markup 24K"
            value={
              saGold?.diff_24k != null
                ? saGold.diff_24k === 0
                  ? "No markup"
                  : `${saGold.diff_24k > 0 ? "+" : ""}PKR ${fmt(saGold.diff_24k)}`
                : "—"
            }
            sub="Super Admin's markup"
            icon={<IconTrendUp />}
            iconBg="#d1fae5"
            iconColor="#059669"
          />
        </div>

        {/* ── SELL Prices Section ── */}
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
              SA Sell Prices — What Customers Pay
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <PriceCard
              title="24K Gold"
              saPrice={saSellPrices.gold24k}
              yourPrice={yourSellPrices.gold24k}
              livePrice={goldBase}
              markup={saGold?.diff_24k ?? 0}
              isSell={true}
              icon={<IconGold />}
              usdPrice={goldUSD}
            />
            <PriceCard
              title="23.85K Gold"
              saPrice={saSellPrices.gold2385k}
              yourPrice={yourSellPrices.gold2385k}
              livePrice={base2385}
              markup={saGold?.diff_2385k ?? 0}
              isSell={true}
              icon={<IconGold />}
              usdPrice={goldUSD ? goldUSD * (23.85 / 24) : null}
            />
            <PriceCard
              title="Silver 999"
              saPrice={saSellPrices.silver}
              yourPrice={yourSellPrices.silver}
              livePrice={silverBase}
              markup={saSilver?.diff_silver ?? 0}
              isSell={true}
              icon={<IconSilver />}
              usdPrice={silverUSD}
            />
          </div>
        </div>

        {/* ── BUY Prices Section ── */}
        <div>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
              SA Buy Prices — What SA Pays Customers
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <PriceCard
              title="24K Gold"
              saPrice={saBuyPrices.gold24k}
              yourPrice={yourBuyPrices.gold24k}
              livePrice={goldBase}
              markup={saGold?.buy_diff_24k ?? 0}
              isSell={false}
              icon={<IconGold />}
              usdPrice={goldUSD}
            />
            <PriceCard
              title="23.85K Gold"
              saPrice={saBuyPrices.gold2385k}
              yourPrice={yourBuyPrices.gold2385k}
              livePrice={base2385}
              markup={saGold?.buy_diff_2385k ?? 0}
              isSell={false}
              icon={<IconGold />}
              usdPrice={goldUSD ? goldUSD * (23.85 / 24) : null}
            />
            <PriceCard
              title="Silver 999"
              saPrice={saBuyPrices.silver}
              yourPrice={yourBuyPrices.silver}
              livePrice={silverBase}
              markup={saSilver?.buy_diff_silver ?? 0}
              isSell={false}
              icon={<IconSilver />}
              usdPrice={silverUSD}
            />
          </div>
        </div>

        {/* ── Currency Rates ── */}
        {hasSaData && Object.keys(saCurrencies).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#a855f7" }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
                SA Currency Rates
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <CurrencyCard
                title="Sell Rates (Customer Buys Currency)"
                currencies={saCurrencies}
                adminCurrencies={adminCurrencies}
                type="sell"
              />
              <CurrencyCard
                title="Buy Rates (SA Buys Currency)"
                currencies={saCurrencies}
                adminCurrencies={adminCurrencies}
                type="buy"
              />
            </div>
          </div>
        )}

        {/* ── Gold in Foreign Currencies ── */}
        {hasSaData && saSellPrices.gold24k != null && Object.keys(saCurrencies).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.textMuted }}>
                SA 24K Gold Price in Foreign Currencies
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(saCurrencies).map(([code, info]) => {
                const meta = CURRENCY_META[code];
                const rate = info?.adjustedRate ?? info?.rate;
                const priceInFx = rate ? saSellPrices.gold24k / rate : null;
                return (
                  <div
                    key={code}
                    className="rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: isLightTheme ? theme.cardBg : theme.bg,
                      border: `1px solid ${theme.border}`,
                      boxShadow: isLightTheme ? "0 1px 8px rgba(0,0,0,0.06)" : "0 2px 12px rgba(0,0,0,0.2)",
                    }}
                  >
                    <p className="text-2xl mb-1.5 leading-none">{meta?.flag || "🌐"}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>{code}</p>
                    <p className="text-base font-black mt-1.5" style={{ color: theme.textPrimary }}>
                      {meta?.symbol}{priceInFx != null ? fmt(priceInFx, 2) : "—"}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>per tola</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-2"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <p className="text-xs" style={{ color: theme.textMuted }}>
            Prices refresh every 30s via SSE. Use Refresh to get latest SA diffs.
          </p>
          {lastUpdateTime && (
            <p className="text-xs" style={{ color: theme.textMuted }}>
              Last updated: <span className="font-semibold" style={{ color: theme.textPrimary }}>{lastUpdateTime}</span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}