// components/HomePage/HeroSection.jsx

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import Navbar from "./Navbar";
import { publicAPI } from "../../services/publicApi";
import { useLivePrices } from "../../hooks/useLivePrices";
import { useAuth } from "../../contexts/AuthContext";
import {
  formatNumberByLanguage,
  formatDateByLanguage,
  formatTimeByLanguage,
} from "../../utils/formatUtils";

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatPKR = (num, decimals = 0, lang = "en") =>
  num != null
    ? `PKR ${formatNumberByLanguage(num, lang)}`
    : "—";

const formatNumber = (num, decimals = 0, lang = "en") =>
  num != null
    ? formatNumberByLanguage(
      decimals === 0 ? Math.round(Number(num)) : num,
      lang
    )
    : "—";

const formatUSD = (num) =>
  num != null
    ? `$${Number(num).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })}`
    : "—";

const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return r
    ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(
      r[3],
      16
    )}`
    : "201, 168, 76";
};

// Safely add Super Admin difference to live market price
const addDifference = (livePrice, difference = 0) => {
  if (livePrice == null) return null;

  const live = Number(livePrice);
  const diff = Number(difference ?? 0);

  if (!Number.isFinite(live)) return null;

  return live + (Number.isFinite(diff) ? diff : 0);
};

// ─── Live direction tracking (up / down / flat) ────────────────────────────
//
// Compares each new value against the previous one it received and reports
// whether the price just went up or down, so the UI can flash green/red +
// show a ▲ / ▼ arrow — exactly like the client's reference app. The color
// persists until the next change (it doesn't fade back on its own).
//
const DIRECTION_META = {
  up: { color: "#16a34a", arrow: "▲" }, // green
  down: { color: "#dc2626", arrow: "▼" }, // red
};

const usePriceDirection = (value, timeoutMs = 1200) => {
  const prevValueRef = useRef(null);
  const [direction, setDirection] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return;
    }

    const numericValue = Number(value);

    if (
      prevValueRef.current !== null &&
      numericValue !== prevValueRef.current
    ) {
      const newDir = numericValue > prevValueRef.current ? "up" : "down";
      setDirection(newDir);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setDirection(null);
      }, timeoutMs);
    }

    prevValueRef.current = numericValue;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, timeoutMs]);

  return direction;
};

// ─── Price Card ─────────────────────────────────────────────────────────────

const PriceCard = ({
  label,
  numericValue,
  livePrice,
  liveDirection,
  sellPrice,
  sellDirection,
  buyPrice,
  buyDirection,
  prefix = "PKR",
  decimals = 0,
  sub,
  accent,
  isLightTheme,
  className = "",
}) => {
  const { t, i18n } = useTranslation();
  const rgb = hexToRgb(accent);

  const valueColor = isLightTheme ? "#000" : accent;

  const labelColor = isLightTheme
    ? "#6b7280"
    : `rgba(${rgb}, 0.85)`;

  const subColor = isLightTheme
    ? "#9ca3af"
    : `rgba(${rgb}, 0.65)`;

  // Resolves the color/arrow for a given direction, falling back to the
  // card's normal value color when there's no up/down change yet.
  const directionStyle = (direction, fallbackColor) => ({
    color: DIRECTION_META[direction]?.color || fallbackColor,
  });

  const DirectionArrow = ({ direction }) =>
    direction ? (
      <span
        className="text-[0.6em] leading-none ml-1 inline-block"
        style={{ color: DIRECTION_META[direction].color }}
      >
        {DIRECTION_META[direction].arrow}
      </span>
    ) : null;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border h-full ${className}`}
      style={{
        borderColor: isLightTheme
          ? `${accent}50`
          : `${accent}40`,

        background: isLightTheme
          ? `linear-gradient(
              135deg,
              rgba(${rgb},0.12) 0%,
              rgba(255,255,255,0.95) 100%
            )`
          : `linear-gradient(
              135deg,
              rgba(${rgb},0.18) 0%,
              rgba(8,6,3,0.92) 100%
            )`,
      }}
    >
      {/* TOP LINE */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(
            to right,
            transparent,
            ${accent}80,
            transparent
          )`,
        }}
      />

      <div className="relative p-4 sm:p-5 h-full flex flex-col justify-between">

        {/* ==================================================
            CARD TITLE
        ================================================== */}
        <p
          className="text-[10px] sm:text-xs tracking-[0.3em] uppercase font-bold mb-2 text-center"
          style={{
            color: labelColor,
          }}
        >
          {label}
        </p>


        {/* ==================================================
            LIVE PRICE
        ================================================== */}
        {livePrice !== undefined && livePrice !== null && (
          <div className="flex flex-col items-center justify-center mb-4">

            <p
              className="text-[9px] sm:text-[12px] md:text-[14px] tracking-[0.25em] uppercase font-semibold mb-0.5"
              style={{
                color: subColor,
              }}
            >
              {t('hero.liveMarket')}
            </p>

            <p
              className="text-lg sm:text-xl md:text-2xl font-black leading-tight text-center flex items-center justify-center"
              style={directionStyle(liveDirection, valueColor)}
            >
              <span>{formatUSD(livePrice)}</span>
              <span className="text-[0.55em] font-semibold tracking-normal ml-1">
                / oz
              </span>
              <DirectionArrow direction={liveDirection} />
            </p>

          </div>
        )}


        {/* ==================================================
            BUY / SELL
        ================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full">

          {/* BUY */}
          <div
            className="rounded-lg p-2.5 sm:p-3 flex flex-col items-center justify-center border"
            style={{
              borderColor: `${accent}60`,
              background: `rgba(${rgb},0.08)`,
            }}
          >
            <p
              className="text-sm sm:text-sm md:text-lg font-bold tracking-[0.15em] uppercase mb-1.5"
              style={{
                color: labelColor,
              }}
            >
              {t('prices.buy')}
            </p>

            <p
              className="text-sm sm:text-base lg:text-lg font-black leading-tight text-center flex items-center justify-center"
              style={directionStyle(buyDirection, valueColor)}
            >
              <span>{formatNumber(buyPrice ?? numericValue, decimals, i18n.language)}</span>
              <DirectionArrow direction={buyDirection} />
            </p>

            {prefix && (
              <p
                className="text-[11px] mt-1 text-center"
                style={{
                  color: subColor,
                }}
              >
                {prefix}
              </p>
            )}
          </div>


          {/* SELL */}
          <div
            className="rounded-lg p-2.5 sm:p-3 flex flex-col items-center justify-center border"
            style={{
              borderColor: `${accent}60`,
              background: `rgba(${rgb},0.04)`,
            }}
          >
            <p
              className="text-sm sm:text-sm md:text-lg font-bold tracking-[0.12em] uppercase mb-1.5"
              style={{
                color: labelColor,
              }}
            >
              {t('prices.sell')}
            </p>

            <p
              className="text-sm sm:text-base lg:text-lg font-black leading-tight text-center flex items-center justify-center"
              style={directionStyle(sellDirection, valueColor)}
            >
              <span>{formatNumber(sellPrice ?? numericValue, decimals, i18n.language)}</span>
              <DirectionArrow direction={sellDirection} />
            </p>

            {prefix && (
              <p
                className="text-[11px] mt-1 text-center"
                style={{
                  color: subColor,
                }}
              >
                {prefix}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Background Grid ────────────────────────────────────────────────────────

const GridTexture = ({ primary }) => (
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      backgroundImage: `
        repeating-linear-gradient(
          0deg,
          ${primary}08 0px,
          ${primary}08 1px,
          transparent 1px,
          transparent 60px
        ),
        repeating-linear-gradient(
          90deg,
          ${primary}08 0px,
          ${primary}08 1px,
          transparent 1px,
          transparent 60px
        )
      `,
    }}
  />
);

// ─── Hero Section ──────────────────────────────────────────────────────────

const HeroSection = () => {
  const { t, i18n } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  const {
    prices,
    connected,
    lastUpdated,
    error,
  } = useLivePrices("public");

  const [superAdminDiffs, setSuperAdminDiffs] = useState(null);
  const [superAdminDiffLoading, setSuperAdminDiffLoading] =
    useState(true);
  const [superAdminDiffError, setSuperAdminDiffError] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const { theme, isLightTheme } = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchSuperAdminDifferences = async () => {
      try {
        setSuperAdminDiffLoading(true);
        setSuperAdminDiffError(null);

        const response =
          await publicAPI.getSuperAdminPriceDifferences();

        if (cancelled) return;

        if (
          response.data?.success &&
          response.data?.data
        ) {
          setSuperAdminDiffs(response.data.data);
        } else {
          throw new Error(
            response.data?.message ||
            "Failed to load Super Admin price differences"
          );
        }
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load Super Admin price differences:",
          err
        );

        setSuperAdminDiffError(
          err.response?.data?.message ||
          err.message ||
          "Failed to load Super Admin price differences"
        );
      } finally {
        if (!cancelled) {
          setSuperAdminDiffLoading(false);
        }
      }
    };

    fetchSuperAdminDifferences();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (prices) {
      setLoading(false);
    }
  }, [prices]);

  const timeStr = formatTimeByLanguage(currentTime, i18n.language);
  const dateStr = formatDateByLanguage(currentTime, i18n.language, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const gold24kTola =
    prices?.gold?.per_tola_PKR_24k;

  const liveGold24k =
    prices?.gold?.priceUSD;

  const liveGold2385k =
    prices?.gold?.per_tola_PKR_2385k;

  const silverTola =
    prices?.silver?.per_tola_PKR;

  const liveSilver =
    prices?.silver?.priceUSD;

  const goldSell = addDifference(
    gold24kTola,
    superAdminDiffs?.gold24k?.sellDifference
  );

  const goldBuy = addDifference(
    gold24kTola,
    superAdminDiffs?.gold24k?.buyDifference
  );

  const gold2385Sell = addDifference(
    liveGold2385k,
    superAdminDiffs?.gold2385k?.sellDifference
  );

  const gold2385Buy = addDifference(
    liveGold2385k,
    superAdminDiffs?.gold2385k?.buyDifference
  );

  const silverSell = addDifference(
    silverTola,
    superAdminDiffs?.silver?.sellDifference
  );

  const silverBuy = addDifference(
    silverTola,
    superAdminDiffs?.silver?.buyDifference
  );

  const goldUSD = prices?.gold?.priceUSD;
  const silverUSD = prices?.silver?.priceUSD;
  const usdRate = prices?.currencies?.USD?.rate;

  const goldLiveDirection = usePriceDirection(liveGold24k);
  const gold2385LiveDirection = usePriceDirection(liveGold2385k);
  const silverLiveDirection = usePriceDirection(liveSilver);

  const goldBuyDirection = usePriceDirection(goldBuy);
  const goldSellDirection = usePriceDirection(goldSell);

  const gold2385BuyDirection = usePriceDirection(gold2385Buy);
  const gold2385SellDirection = usePriceDirection(gold2385Sell);

  const silverBuyDirection = usePriceDirection(silverBuy);
  const silverSellDirection = usePriceDirection(silverSell);

  const headingColor = isLightTheme
    ? theme.primary === "#1a1a1a"
      ? "#1a1a1a"
      : theme.primaryDark || theme.primary
    : theme.primary;

  const mutedColor = theme.textMuted;
  const sectionBg = theme.bg;
  const rgb = hexToRgb(theme.primary);

  if (loading) {
    return (
      <section
        className="relative min-h-screen flex flex-col justify-center overflow-hidden"
        style={{ background: sectionBg }}
      >
        <GridTexture primary={theme.primary} />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-28 pb-20 w-full">
          <div className="flex justify-center items-center h-96">
            <p
              className="text-sm font-medium"
              style={{ color: mutedColor }}
            >
              {t('common.loading')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative min-h-screenv -mt-0 flex flex-col justify-center overflow-hidden"
      style={{ background: sectionBg }}
    >
      <GridTexture primary={theme.primary} />

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(
            circle,
            rgba(${rgb},0.12) 0%,
            transparent 65%
          )`,
        }}
      />

      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(
            to right,
            transparent,
            ${theme.primary},
            transparent
          )`,
          opacity: 0.5,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pb-8 w-full text-center">
        <div className="flex flex-col items-center gap-8 lg:gap-12">

          {/* HEADER */}
          <div
            className="w-full rounded-2xl border-2 p-3 sm:p-4"
            style={{ borderColor: theme.border }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">

              {/* Logo */}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <h1
                  className="leading-none tracking-tighter font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                  style={{
                    fontFamily:
                      '"Playfair Display", Georgia, serif',
                    color: headingColor,
                    letterSpacing: "-0.03em",
                  }}
                >
                  GOLD
                  <span style={{ color: theme.primary }}>
                    KING
                  </span>
                </h1>

                <p
                  className="text-[10px] sm:text-xs tracking-[0.25em] uppercase font-medium mt-3"
                  style={{ color: mutedColor }}
                >
                  {t('hero.subtitle')}
                </p>
              </div>

              {/* Clock */}
              <div className="w-full md:justify-self-end">
                <div
                  className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 p-3 sm:p-4 rounded-2xl border w-full"
                  style={{
                    borderColor: `${theme.primary}30`,
                    background: isLightTheme
                      ? "rgba(255,255,255,0.6)"
                      : "rgba(0,0,0,0.4)",
                  }}
                >
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="relative flex w-2.5 h-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>

                    <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-emerald-500">
                      {t('hero.liveMarket')}
                    </span>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-0">
                    <span
                      className="font-mono text-sm sm:text-base md:text-lg font-bold tracking-wider tabular-nums leading-tight"
                      style={{ color: headingColor }}
                    >
                      {timeStr}
                    </span>

                    <span
                      className="text-[9px] sm:text-[10px] font-medium tracking-wide uppercase opacity-70 leading-tight ml-2 md:ml-0"
                      style={{ color: mutedColor }}
                    >
                      {dateStr}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* PRICE SECTION */}
          <div className="flex flex-col w-full max-w-5xl mx-auto">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 md:gap-8 mb-8 w-full">

              <div className="flex items-center justify-center gap-3 sm:gap-4 w-full md:w-auto min-w-0">

                <div
                  className="h-px w-8 sm:w-12 flex-shrink-0"
                  style={{
                    background: theme.primary,
                    opacity: 0.5,
                  }}
                />

                <p
                  className="text-xs sm:text-sm md:text-base tracking-[0.2em] sm:tracking-[0.3em] uppercase font-light text-center whitespace-nowrap"
                  style={{ color: mutedColor }}
                >
                  {t('hero.liveGoldSilver')}
                </p>

                <div
                  className="h-px w-8 sm:w-12 flex-shrink-0"
                  style={{
                    background: theme.primary,
                    opacity: 0.5,
                  }}
                />

              </div>

              <div className="flex items-center justify-center md:justify-end gap-3 w-full md:w-auto flex-shrink-0">

                <div className="flex-shrink-0">
                  <Navbar embedInline />
                </div>

                <button
                  onClick={() => {
                    if (user) {
                      logout();
                      window.location.href = "/";
                    } else {
                      window.location.href = "/login";
                    }
                  }}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-[10px] text-xs sm:text-[13px] font-bold text-white transition-all duration-200 flex-shrink-0 whitespace-nowrap"
                  style={{
                    background: isLightTheme
                      ? theme.primary
                      : "#374151",
                  }}
                >
                  {user ? t('navbar.logout') : t('navbar.login')}
                </button>

              </div>

            </div>

            <div className="flex flex-col-reverse md:flex-row md:items-stretch gap-3 sm:gap-4 mb-6 w-full">

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 flex-1 w-full">

                <PriceCard
                  label={t('prices.gold24k')}
                  livePrice={liveGold24k}
                  liveDirection={goldLiveDirection}
                  sellPrice={goldSell}
                  sellDirection={goldSellDirection}
                  buyPrice={goldBuy}
                  buyDirection={goldBuyDirection}
                  prefix="PKR"
                  sub={`${formatUSD(goldUSD)} / oz`}
                  accent="#FFB000"
                  isLightTheme={isLightTheme}
                />

                <PriceCard
                  label={t('prices.gold2385k')}
                  sellPrice={gold2385Sell}
                  sellDirection={gold2385SellDirection}
                  buyPrice={gold2385Buy}
                  buyDirection={gold2385BuyDirection}
                  prefix="PKR"
                  sub="23.85 Karat"
                  accent="#E8A33D"
                  isLightTheme={isLightTheme}
                />

                <PriceCard
                  label={t('prices.silver')}
                  livePrice={liveSilver}
                  liveDirection={silverLiveDirection}
                  sellPrice={silverSell}
                  sellDirection={silverSellDirection}
                  buyPrice={silverBuy}
                  buyDirection={silverBuyDirection}
                  prefix="PKR"
                  sub={`${formatUSD(silverUSD)} / oz`}
                  accent="#B8C4CE"
                  isLightTheme={isLightTheme}
                />

              </div>

            </div>

            {superAdminDiffError && (
              <div className="mb-4 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 w-full">

                <span className="text-amber-400 text-xs flex-shrink-0">
                  ⚠
                </span>

                <p className="text-amber-400/80 text-xs text-center">
                  {t('errors.superAdminDiffUnavailable', { defaultValue: 'Super Admin price adjustment unavailable. Showing live market prices.' })}
                </p>

              </div>
            )}

            {connected && !error && (
              <div className="flex items-center justify-center gap-2 w-full">

                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>

                <span className="text-xs text-emerald-600 font-medium">
                  {t('prices.live')}
                </span>

              </div>
            )}


            {/* ==========================================================
                GENERAL ERROR
            =========================================================== */}
            {error && (
              <div className="mb-4 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 w-full">

                <span className="text-amber-400 text-xs flex-shrink-0">
                  ⚠
                </span>

                <p className="text-amber-400/80 text-xs text-center break-words">
                  {error}
                </p>

              </div>
            )}

          </div>


        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: `linear-gradient(
            to top,
            ${theme.bg},
            transparent
          )`,
        }}
      />
    </section>
  );
};

export default HeroSection;