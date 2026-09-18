// pages/super-admin/price-management.jsx
import { useState, useEffect, useCallback } from "react";
import * as saAPI from "../../services/superAdminApi";
import { useLivePrices } from "../../hooks/useLivePrices";
import { useTheme } from "../../contexts/ThemeContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n, digits = 0) =>
  n != null && !isNaN(n)
    ? Number(n).toLocaleString("en-PK", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—";

const sanitiseDiff = (raw) => {
  let v = raw.replace(/[^0-9.\-]/g, "");
  if (v.indexOf("-") > 0) v = v.replace(/-/g, "");
  else if ((v.match(/-/g) || []).length > 1) v = "-" + v.replace(/-/g, "");
  const parts = v.split(".");
  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
  return v;
};

const CURRENCY_META = {
  USD: { name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  SAR: { name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦" },
  AED: { name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
  EUR: { name: "Euro", symbol: "€", flag: "🇪🇺" },
  GBP: { name: "British Pound", symbol: "£", flag: "🇬🇧" },
  CHF: { name: "Swiss Franc", symbol: "₣", flag: "🇨🇭" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconRefresh = ({ spin }) => (
  <svg
    className={`w-4 h-4 ${spin ? "animate-spin" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const IconGold = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <circle cx="12" cy="12" r="9" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 7v10M9.5 9.5 12 7l2.5 2.5M9.5 14.5 12 17l2.5-2.5"
    />
  </svg>
);

const IconSilver = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 10V7"
    />
  </svg>
);

const IconCurrency = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const IconCheck = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const IconAlert = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const IconInfo = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// ─── Toast (themed) ───────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  const { theme } = useTheme();
  useEffect(() => {
    if (!msg) return;
   const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  const isError = type === "error";
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold max-w-[calc(100vw-3rem)]"
      style={{ background: isError ? "#ef4444" : "#10b981", color: "white" }}
    >
      {isError ? <IconAlert /> : <IconCheck />}
      <span className="flex-1 min-w-0 break-words">{msg}</span>
      <button
        onClick={onClose}
        className="ml-1 opacity-70 hover:opacity-100 text-lg leading-none shrink-0"
      >
        ×
      </button>
    </div>
  );
}

// ─── Spinner (themed) ─────────────────────────────────────────────────────────

function PageSpinner() {
  const { theme, isLightTheme } = useTheme();
  return (
    <div className="flex items-center justify-center min-h-96 gap-4">
      <div className="relative w-10 h-10">
        <div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: `${theme.primary}30` }}
        />
        <div
          className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: theme.primary }}
        />
      </div>
      <span className="text-sm font-medium" style={{ color: theme.textMuted }}>
        Loading live prices…
      </span>
    </div>
  );
}

// ─── Live price card (themed) ─────────────────────────────────────────────────

function PriceCard({ label, pkrTola, usdOz, subLabel, icon, iconColor }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
      style={{
        background: isLightTheme ? theme.cardBg : theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: isLightTheme
          ? "0 1px 8px rgba(0,0,0,0.06)"
          : "0 2px 12px rgba(0,0,0,0.25)",
      }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{ color: theme.textMuted }}
        >
          {label}
        </p>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{
            background: `${iconColor}18`,
            color: iconColor,
            border: `1px solid ${iconColor}25`,
          }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p
          className="text-xs font-medium mb-0.5"
          style={{ color: theme.textMuted }}
        >
          PKR per tola
        </p>
        <p
          className="text-2xl font-bold leading-tight"
          style={{ color: theme.textPrimary }}
        >
          {pkrTola != null ? `PKR ${fmt(pkrTola)}` : "—"}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>
          1 tola = 11.664 g
        </p>
      </div>
      <div className="pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
        <p
          className="text-xs font-medium mb-0.5"
          style={{ color: theme.textMuted }}
        >
          USD per troy oz
        </p>
        <p className="text-lg font-bold" style={{ color: theme.textPrimary }}>
          {usdOz != null ? `$${fmt(usdOz, 2)}` : "—"}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>
          1 troy oz = 31.103 g
        </p>
      </div>
      {subLabel && (
        <span
          className="self-start text-[11px] font-semibold px-2.5 py-1 rounded-lg"
          style={{
            background: `${theme.primary}12`,
            color: theme.primary,
            border: `1px solid ${theme.primary}25`,
          }}
        >
          {subLabel}
        </span>
      )}
    </div>
  );
}

// ─── Diff input with live preview (themed) ────────────────────────────────────

function DiffField({ label, value, onChange, livePrice, error, accentColor }) {
  const { theme, isLightTheme } = useTheme();
  const numVal = parseFloat(value) || 0;
  const preview = livePrice != null ? livePrice + numVal : null;
  const isNonZero = value !== "" && numVal !== 0;
  const accent = accentColor === "blue" ? "#3b82f6" : theme.primary;
  const bg = isLightTheme ? "#ffffff" : "#1a1a1a";

  return (
    <div className="flex flex-col gap-2 w-full">
      <label
        className="text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ color: theme.textMuted }}
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            onChange(sanitiseDiff(String((parseFloat(value) || 0) - 100)))
          }
          className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition shrink-0"
          style={{
            background: isLightTheme ? "#ffffff" : "#111111",
            border: `1px solid ${theme.border}`,
            color: theme.textMuted,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#ef444415";
            e.currentTarget.style.borderColor = "#ef444430";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isLightTheme
              ? "#ffffff"
              : "#111111";
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.color = theme.textMuted;
          }}
        >
          −100
        </button>

        <div
          className="relative flex items-center rounded-xl border-2 transition-colors flex-1 min-w-0"
          style={{
            background: bg,
            borderColor: error ? "#ef4444" : isNonZero ? accent : theme.border,
          }}
        >
          <span
            className="absolute left-3 text-xs font-bold select-none pointer-events-none"
            style={{ color: theme.textMuted }}
          >
            PKR
          </span>
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
                background: numVal > 0 ? "#10b98118" : "#ef444418",
                color: numVal > 0 ? "#10b981" : "#ef4444",
                border: `1px solid ${numVal > 0 ? "#10b98130" : "#ef444430"}`,
              }}
            >
              {numVal > 0 ? `+${fmt(numVal)}` : fmt(numVal)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            onChange(sanitiseDiff(String((parseFloat(value) || 0) + 100)))
          }
          className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition shrink-0"
          style={{
            background: isLightTheme ? "#ffffff" : "#111111",
            border: `1px solid ${theme.border}`,
            color: theme.textMuted,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#10b98115";
            e.currentTarget.style.borderColor = "#10b98130";
            e.currentTarget.style.color = "#10b981";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isLightTheme
              ? "#ffffff"
              : "#111111";
            e.currentTarget.style.borderColor = theme.border;
            e.currentTarget.style.color = theme.textMuted;
          }}
        >
          +100
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <IconAlert />
          {error}
        </p>
      )}
      <div
        className="rounded-xl px-4 py-3 space-y-1.5 text-xs"
        style={{
          background: isLightTheme
            ? `${theme.primary}06`
            : "rgba(255,255,255,0.03)",
          border: `1px solid ${theme.border}`,
        }}
      >
        <div className="flex justify-between">
          <span style={{ color: theme.textMuted }}>Live market</span>
          <span className="font-semibold" style={{ color: theme.textPrimary }}>
            {livePrice != null ? `PKR ${fmt(livePrice)}` : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: theme.textMuted }}>Difference</span>
          <span
            className={`font-semibold ${numVal > 0 ? "text-emerald-600" : numVal < 0 ? "text-red-500" : ""}`}
            style={{ color: numVal === 0 ? theme.textMuted : undefined }}
          >
            {value === "" || numVal === 0
              ? "PKR 0"
              : `${numVal > 0 ? "+" : ""}PKR ${fmt(numVal)}`}
          </span>
        </div>
        <div
          className="pt-1.5 flex justify-between"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <span className="font-bold" style={{ color: theme.textPrimary }}>
            Final price
          </span>
          <span
            className={`font-bold text-sm ${isNonZero ? "font-bold" : ""}`}
            style={{ color: isNonZero ? accent : theme.textPrimary }}
          >
            {preview != null ? `PKR ${fmt(preview)}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Section wrapper (themed) ─────────────────────────────────────────────────

function SectionCard({ icon, iconBg, title, description, children }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <section
      className="rounded-2xl p-4 sm:p-6"
      style={{
        background: isLightTheme ? theme.cardBg : theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: isLightTheme
          ? "0 1px 8px rgba(0,0,0,0.06)"
          : "0 2px 12px rgba(0,0,0,0.25)",
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
          <h2
            className="text-base font-bold"
            style={{ color: theme.textPrimary }}
          >
            {title}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

// ─── Buy / Sell Tab Toggle (themed) ───────────────────────────────────────────

function PriceTypeTabs({ active, onChange }) {
  const { theme } = useTheme();
  return (
    <div
      className="inline-flex rounded-xl p-1 gap-1 w-full sm:w-auto"
      style={{
        background:
          theme.type === "light" ? "#f9fafb" : "rgba(255,255,255,0.05)",
        border: `1px solid ${theme.border}`,
      }}
    >
      <button
        type="button"
        onClick={() => onChange("sell")}
        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${active === "sell" ? "bg-amber-500 text-white shadow-sm" : ""}`}
        style={active !== "sell" ? { color: theme.textMuted } : {}}
      >
        Sell{" "}
        <span className="ml-1 font-normal normal-case tracking-normal text-[10px] opacity-70 hidden sm:inline">
          (customer buys)
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange("buy")}
        className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${active === "buy" ? "bg-blue-500 text-white shadow-sm" : ""}`}
        style={active !== "buy" ? { color: theme.textMuted } : {}}
      >
        Buy{" "}
        <span className="ml-1 font-normal normal-case tracking-normal text-[10px] opacity-70 hidden sm:inline">
          (customer sells)
        </span>
      </button>
    </div>
  );
}

// ─── Currency Table Row (shared, themed) ──────────────────────────────────────

function CurrencyTableRow({
  code,
  meta,
  liveRate,
  goldPKR_24k,
  inputVal,
  accentColor,
  error,
  saving,
  onInputChange,
  onSave,
  rateLabel,
}) {
  const { theme, isLightTheme } = useTheme();
  const numInput = parseFloat(inputVal) || 0;
  const previewRate = liveRate != null ? liveRate + numInput : null;
  const goldInCurr =
    goldPKR_24k != null && previewRate ? goldPKR_24k / previewRate : null;
  const isNonZero = numInput !== 0;
  const accent = accentColor === "blue" ? "#3b82f6" : theme.primary;
  const rowBg = isLightTheme ? "#ffffff" : "#111111";

  return (
    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{meta.flag}</span>
          <div>
            <p className="font-bold" style={{ color: theme.textPrimary }}>
              {code}
            </p>
            <p className="text-xs" style={{ color: theme.textMuted }}>
              {meta.name}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <p
          className="font-mono font-semibold"
          style={{ color: theme.textPrimary }}
        >
          {liveRate != null ? `PKR ${fmt(liveRate, 2)}` : "—"}
        </p>
        <p className="text-xs" style={{ color: theme.textMuted }}>
          1 {code} = PKR
        </p>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-col gap-1">
          <div
            className="relative flex items-center rounded-xl border-2 transition-colors w-40"
            style={{
              background: rowBg,
              borderColor: error
                ? "#ef4444"
                : isNonZero
                  ? accent
                  : theme.border,
            }}
          >
            <span
              className="absolute left-3 text-xs font-semibold select-none pointer-events-none"
              style={{ color: theme.textMuted }}
            >
              PKR
            </span>
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
            <p className="text-xs text-red-500 flex items-center gap-1">
              <IconAlert />
              {error}
            </p>
          )}
        </div>
      </td>
      <td className="px-5 py-4">
        <p
          className={`font-mono font-bold ${isNonZero ? "font-bold" : ""}`}
          style={{ color: isNonZero ? accent : theme.textPrimary }}
        >
          {previewRate != null ? `PKR ${fmt(previewRate, 2)}` : "—"}
        </p>
        {isNonZero && (
          <p
            className="text-xs font-semibold mt-0.5"
            style={{ color: numInput > 0 ? "#10b981" : "#ef4444" }}
          >
            {numInput > 0 ? "+" : ""}PKR {fmt(numInput, 2)}
          </p>
        )}
      </td>
      <td className="px-5 py-4">
        <p className="font-semibold" style={{ color: theme.textPrimary }}>
          {goldInCurr != null ? `${meta.symbol}${fmt(goldInCurr, 2)}` : "—"}
        </p>
        <p className="text-xs" style={{ color: theme.textMuted }}>
          at {rateLabel} rate
        </p>
      </td>
      <td className="px-5 py-4">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
          style={{ background: accent }}
        >
          {saving ? "Saving…" : "Update"}
        </button>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PriceManagement() {
  const { theme, isLightTheme } = useTheme();
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Gold sell form
  const [goldSellForm, setGoldSellForm] = useState({
    diff_24k: "",
    diff_2385k: "",
  });
  const [goldSellErrors, setGoldSellErrors] = useState({});
  const [goldSellSaving, setGoldSellSaving] = useState(false);
  // Gold buy form
  const [goldBuyForm, setGoldBuyForm] = useState({
    buy_diff_24k: "",
    buy_diff_2385k: "",
  });
  const [goldBuyErrors, setGoldBuyErrors] = useState({});
  const [goldBuySaving, setGoldBuySaving] = useState(false);
  const [goldTab, setGoldTab] = useState("sell");

  // Silver sell
  const [silverSellInput, setSilverSellInput] = useState("");
  const [silverSellError, setSilverSellError] = useState("");
  const [silverSellSaving, setSilverSellSaving] = useState(false);
  // Silver buy
  const [silverBuyInput, setSilverBuyInput] = useState("");
  const [silverBuyError, setSilverBuyError] = useState("");
  const [silverBuySaving, setSilverBuySaving] = useState(false);
  const [silverTab, setSilverTab] = useState("sell");

  // Currency sell
  const [currencySellForm, setCurrencySellForm] = useState({});
  const [currencySellErrors, setCurrencySellErrors] = useState({});
  const [currencySellSaving, setCurrencySellSaving] = useState({});
  const [currencySellUpdateAllSaving, setCurrencySellUpdateAllSaving] =
    useState(false);
  const [currencySellResetAllSaving, setCurrencySellResetAllSaving] =
    useState(false);
  // Currency buy
  const [currencyBuyForm, setCurrencyBuyForm] = useState({});
  const [currencyBuyErrors, setCurrencyBuyErrors] = useState({});
  const [currencyBuySaving, setCurrencyBuySaving] = useState({});
  const [currencyBuyUpdateAllSaving, setCurrencyBuyUpdateAllSaving] =
    useState(false);
  const [currencyBuyResetAllSaving, setCurrencyBuyResetAllSaving] =
    useState(false);

  const [currencyTab, setCurrencyTab] = useState("sell");
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const {
    prices: ssePrices,
    connected: sseConnected,
    lastUpdated: sseLastUpdated,
    error: sseError,
  } = useLivePrices("superAdmin");
  const showToast = (msg, type = "success") => setToast({ msg, type });

  
const handleToastClose = useCallback(
  () => setToast({ msg: "", type: "success" }),
  []
);

  // Fetch prices
  const fetchPrices = useCallback(async (isRefresh = false) => {
    setPageError("");
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await saAPI.getAllPrices();
      const { adjusted } = res.data;
      setPrices(res.data);
      // Gold sell
      setGoldSellForm({
        diff_24k:
          (adjusted?.gold?.diff_24k ?? 0) !== 0
            ? String(adjusted.gold.diff_24k)
            : "",
        diff_2385k:
          (adjusted?.gold?.diff_2385k ?? 0) !== 0
            ? String(adjusted.gold.diff_2385k)
            : "",
      });
      // Gold buy
      setGoldBuyForm({
        buy_diff_24k:
          (adjusted?.gold?.buy_diff_24k ?? 0) !== 0
            ? String(adjusted.gold.buy_diff_24k)
            : "",
        buy_diff_2385k:
          (adjusted?.gold?.buy_diff_2385k ?? 0) !== 0
            ? String(adjusted.gold.buy_diff_2385k)
            : "",
      });
      // Silver
      setSilverSellInput(
        (adjusted?.silver?.diff_silver ?? 0) !== 0
          ? String(adjusted.silver.diff_silver)
          : "",
      );
      setSilverBuyInput(
        (adjusted?.silver?.buy_diff_silver ?? 0) !== 0
          ? String(adjusted.silver.buy_diff_silver)
          : "",
      );
      // Currency
      const initSell = {},
        initBuy = {};
      Object.keys(CURRENCY_META).forEach((code) => {
        initSell[code] =
          (adjusted?.currencies?.[code]?.difference ?? 0) !== 0
            ? String(adjusted.currencies[code].difference)
            : "";
        initBuy[code] =
          (adjusted?.currencies?.[code]?.buy_difference ?? 0) !== 0
            ? String(adjusted.currencies[code].buy_difference)
            : "";
      });
      setCurrencySellForm(initSell);
      setCurrencyBuyForm(initBuy);
    } catch (err) {
      setPageError(
        err.response?.data?.message ||
          "Failed to load prices. Is the backend running?",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);
  useEffect(() => {
    if (!sseLastUpdated) return;
    const timer = setInterval(
      () =>
        setSecondsAgo(
          Math.floor((Date.now() - sseLastUpdated.getTime()) / 1000),
        ),
      1000,
    );
    return () => clearInterval(timer);
  }, [sseLastUpdated]);

  // Handlers (same logic as original, kept for brevity – all API calls work)
  const handleGoldSellUpdate = async (e) => {
    e.preventDefault();
    const errs = {};
    if (goldSellForm.diff_24k !== "" && isNaN(Number(goldSellForm.diff_24k)))
      errs.diff_24k = "Enter a valid number";
    if (
      goldSellForm.diff_2385k !== "" &&
      isNaN(Number(goldSellForm.diff_2385k))
    )
      errs.diff_2385k = "Enter a valid number";
    setGoldSellErrors(errs);
    if (Object.keys(errs).length) return;
    setGoldSellSaving(true);
    try {
      await saAPI.updatePriceDifference({
        diff_24k: Number(goldSellForm.diff_24k || 0),
        diff_2385k: Number(goldSellForm.diff_2385k || 0),
      });
      showToast("Gold sell prices saved. All shop admins notified.");
      fetchPrices(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save gold sell prices.",
        "error",
      );
    } finally {
      setGoldSellSaving(false);
    }
  };
  const handleGoldBuyUpdate = async (e) => {
    e.preventDefault();
    const errs = {};
    if (
      goldBuyForm.buy_diff_24k !== "" &&
      isNaN(Number(goldBuyForm.buy_diff_24k))
    )
      errs.buy_diff_24k = "Enter a valid number";
    if (
      goldBuyForm.buy_diff_2385k !== "" &&
      isNaN(Number(goldBuyForm.buy_diff_2385k))
    )
      errs.buy_diff_2385k = "Enter a valid number";
    setGoldBuyErrors(errs);
    if (Object.keys(errs).length) return;
    setGoldBuySaving(true);
    try {
      await saAPI.updatePriceDifference({
        buy_diff_24k: Number(goldBuyForm.buy_diff_24k || 0),
        buy_diff_2385k: Number(goldBuyForm.buy_diff_2385k || 0),
      });
      showToast("Gold buy prices saved. All shop admins notified.");
      fetchPrices(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save gold buy prices.",
        "error",
      );
    } finally {
      setGoldBuySaving(false);
    }
  };
  const handleSilverSellUpdate = async (e) => {
    e.preventDefault();
    if (silverSellInput !== "" && isNaN(Number(silverSellInput))) {
      setSilverSellError("Enter a valid number");
      return;
    }
    setSilverSellError("");
    setSilverSellSaving(true);
    try {
      await saAPI.updateSilverPriceDifference({
        diff_silver: Number(silverSellInput || 0),
      });
      showToast("Silver sell price saved. All shop admins notified.");
      fetchPrices(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save silver sell price.",
        "error",
      );
    } finally {
      setSilverSellSaving(false);
    }
  };
  const handleSilverBuyUpdate = async (e) => {
    e.preventDefault();
    if (silverBuyInput !== "" && isNaN(Number(silverBuyInput))) {
      setSilverBuyError("Enter a valid number");
      return;
    }
    setSilverBuyError("");
    setSilverBuySaving(true);
    try {
      await saAPI.updateSilverPriceDifference({
        buy_diff_silver: Number(silverBuyInput || 0),
      });
      showToast("Silver buy price saved. All shop admins notified.");
      fetchPrices(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to save silver buy price.",
        "error",
      );
    } finally {
      setSilverBuySaving(false);
    }
  };
  const handleCurrencySellUpdate = async (code) => {
    const raw = currencySellForm[code] ?? "";
    if (raw !== "" && isNaN(Number(raw))) {
      setCurrencySellErrors((e) => ({ ...e, [code]: "Enter a valid number" }));
      return;
    }
    setCurrencySellErrors((e) => ({ ...e, [code]: "" }));
    setCurrencySellSaving((s) => ({ ...s, [code]: true }));
    try {
      await saAPI.updateCurrency(code, { difference: Number(raw || 0) });
      showToast(`${code} sell rate updated.`);
      fetchPrices(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || `Failed to update ${code}.`,
        "error",
      );
    } finally {
      setCurrencySellSaving((s) => ({ ...s, [code]: false }));
    }
  };
  const handleCurrencySellUpdateAll = async () => {
    setCurrencySellUpdateAllSaving(true);
    let hasError = false;
    try {
      const errors = {},
        updates = [];
      Object.keys(CURRENCY_META).forEach((code) => {
        const raw = currencySellForm[code] ?? "";
        if (raw !== "" && isNaN(Number(raw))) {
          errors[code] = "Enter a valid number";
          hasError = true;
        } else updates.push({ code, difference: Number(raw || 0) });
      });
      if (hasError) {
        setCurrencySellErrors(errors);
        showToast("Please fix invalid values before updating all.", "error");
        setCurrencySellUpdateAllSaving(false);
        return;
      }
      setCurrencySellErrors({});
      const results = [];
      for (const { code, difference } of updates) {
        try {
          await saAPI.updateCurrency(code, { difference });
          results.push({ code, success: true });
        } catch (err) {
          results.push({ code, success: false });
        }
      }
      const failures = results.filter((r) => !r.success);
      if (failures.length)
        showToast(
          `Updated ${results.length - failures.length}/${updates.length} currencies. ${failures.length} failed.`,
          "error",
        );
      else showToast("All currency sell rates updated successfully.");
      await fetchPrices(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update all sell rates.",
        "error",
      );
    } finally {
      setCurrencySellUpdateAllSaving(false);
    }
  };
  const handleCurrencySellResetAll = async () => {
    setCurrencySellResetAllSaving(true);
    try {
      const resetForm = {};
      Object.keys(CURRENCY_META).forEach((code) => {
        resetForm[code] = "";
      });
      setCurrencySellForm(resetForm);
      setCurrencySellErrors({});
      const results = [];
      for (const code of Object.keys(CURRENCY_META)) {
        try {
          await saAPI.updateCurrency(code, { difference: 0 });
          results.push({ code, success: true });
        } catch (err) {
          results.push({ code, success: false });
        }
      }
      const failures = results.filter((r) => !r.success);
      if (failures.length)
        showToast(
          `Reset ${results.length - failures.length}/${results.length} currencies. ${failures.length} failed.`,
          "error",
        );
      else showToast("All currency sell rates reset to 0.");
      await fetchPrices(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to reset all sell rates.",
        "error",
      );
    } finally {
      setCurrencySellResetAllSaving(false);
    }
  };
  const handleCurrencyBuyUpdate = async (code) => {
    const raw = currencyBuyForm[code] ?? "";
    if (raw !== "" && isNaN(Number(raw))) {
      setCurrencyBuyErrors((e) => ({ ...e, [code]: "Enter a valid number" }));
      return;
    }
    setCurrencyBuyErrors((e) => ({ ...e, [code]: "" }));
    setCurrencyBuySaving((s) => ({ ...s, [code]: true }));
    try {
      await saAPI.updateCurrency(code, { buy_difference: Number(raw || 0) });
      showToast(`${code} buy rate updated.`);
      fetchPrices(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || `Failed to update ${code} buy rate.`,
        "error",
      );
    } finally {
      setCurrencyBuySaving((s) => ({ ...s, [code]: false }));
    }
  };
  const handleCurrencyBuyUpdateAll = async () => {
    setCurrencyBuyUpdateAllSaving(true);
    let hasError = false;
    try {
      const errors = {},
        updates = [];
      Object.keys(CURRENCY_META).forEach((code) => {
        const raw = currencyBuyForm[code] ?? "";
        if (raw !== "" && isNaN(Number(raw))) {
          errors[code] = "Enter a valid number";
          hasError = true;
        } else updates.push({ code, buy_difference: Number(raw || 0) });
      });
      if (hasError) {
        setCurrencyBuyErrors(errors);
        showToast("Please fix invalid values before updating all.", "error");
        setCurrencyBuyUpdateAllSaving(false);
        return;
      }
      setCurrencyBuyErrors({});
      const results = [];
      for (const { code, buy_difference } of updates) {
        try {
          await saAPI.updateCurrency(code, { buy_difference });
          results.push({ code, success: true });
        } catch (err) {
          results.push({ code, success: false });
        }
      }
      const failures = results.filter((r) => !r.success);
      if (failures.length)
        showToast(
          `Updated ${results.length - failures.length}/${updates.length} currencies. ${failures.length} failed.`,
          "error",
        );
      else showToast("All currency buy rates updated successfully.");
      await fetchPrices(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to update all buy rates.",
        "error",
      );
    } finally {
      setCurrencyBuyUpdateAllSaving(false);
    }
  };
  const handleCurrencyBuyResetAll = async () => {
    setCurrencyBuyResetAllSaving(true);
    try {
      const resetForm = {};
      Object.keys(CURRENCY_META).forEach((code) => {
        resetForm[code] = "";
      });
      setCurrencyBuyForm(resetForm);
      setCurrencyBuyErrors({});
      const results = [];
      for (const code of Object.keys(CURRENCY_META)) {
        try {
          await saAPI.updateCurrency(code, { buy_difference: 0 });
          results.push({ code, success: true });
        } catch (err) {
          results.push({ code, success: false });
        }
      }
      const failures = results.filter((r) => !r.success);
      if (failures.length)
        showToast(
          `Reset ${results.length - failures.length}/${results.length} currencies. ${failures.length} failed.`,
          "error",
        );
      else showToast("All currency buy rates reset to 0.");
      await fetchPrices(true);
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to reset all buy rates.",
        "error",
      );
    } finally {
      setCurrencyBuyResetAllSaving(false);
    }
  };

  // Derived data
  const live = sseConnected && ssePrices ? ssePrices : prices?.live;
  const adjusted = prices?.adjusted;
  const goldUSD_oz = live?.gold?.priceUSD;
  const goldPKR_24k =
    live?.gold?.basePricePerTolaPKR ?? live?.gold?.pricePerTolaPKR;
  const goldPKR_2385k =
    live?.gold?.base2385PerTolaPKR ??
    live?.gold?.price2385PerTolaPKR ??
    (goldPKR_24k != null ? Math.round(goldPKR_24k * (23.85 / 24)) : null);
  const gold2385_usd_oz = goldUSD_oz != null ? goldUSD_oz * (23.85 / 24) : null;
  const silverUSD_oz = live?.silver?.priceUSD;
  const silverPKR =
    live?.silver?.basePricePerTolaPKR ?? live?.silver?.pricePerTolaPKR;
  const adj_diff_24k = adjusted?.gold?.diff_24k ?? 0;
  const adj_diff_2385k = adjusted?.gold?.diff_2385k ?? 0;
  const adj_diff_silver = adjusted?.silver?.diff_silver ?? 0;
  const adj_buy_diff_24k = adjusted?.gold?.buy_diff_24k ?? 0;
  const adj_buy_diff_2385k = adjusted?.gold?.buy_diff_2385k ?? 0;
  const adj_buy_diff_silver = adjusted?.silver?.buy_diff_silver ?? 0;
  const adjSellPrice_24k =
    goldPKR_24k != null ? goldPKR_24k + adj_diff_24k : null;
  const adjSellPrice_2385k =
    goldPKR_2385k != null ? goldPKR_2385k + adj_diff_2385k : null;
  const adjSellPrice_silver =
    silverPKR != null ? silverPKR + adj_diff_silver : null;
  const adjBuyPrice_24k =
    goldPKR_24k != null ? goldPKR_24k + adj_buy_diff_24k : null;
  const adjBuyPrice_2385k =
    goldPKR_2385k != null ? goldPKR_2385k + adj_buy_diff_2385k : null;
  const adjBuyPrice_silver =
    silverPKR != null ? silverPKR + adj_buy_diff_silver : null;

  const getRawCurrencies = (liveData) => {
    if (!liveData?.currencies) return {};
    if (liveData.currencies.live) return liveData.currencies.live;
    return liveData.currencies;
  };
  const rawCurrencies = getRawCurrencies(live);
  const currencyRows = Object.entries(CURRENCY_META).map(([code, meta]) => ({
    code,
    meta,
    liveRate: rawCurrencies[code]?.rate ?? null,
  }));

  const lastUpdated = (() => {
    if (sseConnected && sseLastUpdated)
      return sseLastUpdated.toLocaleString("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    if (live?.timestamp)
      return new Date(live.timestamp).toLocaleString("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    return null;
  })();

  if (loading) return <PageSpinner />;
  if (pageError)
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-center px-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "#ef444415", color: "#ef4444" }}
        >
          <IconAlert />
        </div>
        <div>
          <p className="font-bold text-lg" style={{ color: theme.textPrimary }}>
            Could not load prices
          </p>
          <p
            className="text-sm mt-1 max-w-sm"
            style={{ color: theme.textMuted }}
          >
            {pageError}
          </p>
        </div>
        <button
          onClick={() => fetchPrices()}
          className="px-5 py-2.5 text-white text-sm font-bold rounded-xl transition"
          style={{ background: theme.primary }}
        >
          Try Again
        </button>
      </div>
    );

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-3 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: theme.textPrimary }}
          >
            Price Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>
            Live rates · Set sell & buy markups · Currency adjustments
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={
              sseConnected
                ? {
                    background: "#10b98115",
                    color: "#10b981",
                    border: "1px solid #10b98125",
                  }
                : {
                    background: "#ef444415",
                    color: "#ef4444",
                    border: "1px solid #ef444425",
                  }
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${sseConnected ? "animate-pulse" : ""}`}
              style={{ background: sseConnected ? "#10b981" : "#ef4444" }}
            />
            {sseConnected ? "Live" : "Offline"}
          </span>
          {sseConnected && sseLastUpdated && (
            <span
              className="text-xs hidden sm:block"
              style={{ color: theme.textMuted }}
            >
              Next update in{" "}
              <span
                className="font-semibold font-mono"
                style={{ color: theme.primary }}
              >
                {Math.max(0, 30 - secondsAgo)}s
              </span>
            </span>
          )}
          {lastUpdated && (
            <p
              className="text-xs hidden sm:block"
              style={{ color: theme.textMuted }}
            >
              Last update:{" "}
              <span
                className="font-semibold"
                style={{ color: theme.textPrimary }}
              >
                {lastUpdated}
              </span>
            </p>
          )}
          <button
            onClick={() => fetchPrices(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            style={{
              background: isLightTheme ? "#ffffff" : "#1a1a1a",
              border: `1px solid ${theme.border}`,
              color: theme.textPrimary,
            }}
          >
            <IconRefresh spin={refreshing} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* SSE error banner */}
      {sseError && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold"
          style={{
            background: "#ef444415",
            border: "1px solid #ef444430",
            color: "#ef4444",
          }}
        >
          <IconAlert />
          Live feed error: {sseError}
          <span className="font-normal ml-1 opacity-70">
            {" "}
            — prices shown are from last successful fetch and may be delayed.
          </span>
        </div>
      )}

      {/* Live Market Prices */}
      <section>
        <p
          className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
          style={{ color: theme.textMuted }}
        >
          Live Market Prices
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <PriceCard
            label="Gold 24 Karat"
            pkrTola={goldPKR_24k}
            usdOz={goldUSD_oz}
            subLabel="Pure 24K"
            icon={<IconGold />}
            iconColor="#f59e0b"
          />
          <PriceCard
            label="Gold 23.85 Karat"
            pkrTola={goldPKR_2385k}
            usdOz={gold2385_usd_oz}
            subLabel="Hallmark 23.85K"
            icon={<IconGold />}
            iconColor="#d97706"
          />
          <PriceCard
            label="Silver 999"
            pkrTola={silverPKR}
            usdOz={silverUSD_oz}
            subLabel="Fine Silver"
            icon={<IconSilver />}
            iconColor="#64748b"
          />
        </div>
      </section>

      {/* Current Saved Shop Prices */}
      {(adjSellPrice_24k != null || adjBuyPrice_24k != null) && (
        <section>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: theme.textMuted }}
          >
            Your Current Shop Prices (Saved)
          </p>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5"
            style={{ color: theme.primary }}
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ background: theme.primary }}
            />
            Sell Prices — Customer Buys
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {[
              {
                label: "24K — Sell Price",
                price: adjSellPrice_24k,
                diff: adj_diff_24k,
                live: goldPKR_24k,
              },
              {
                label: "23.85K — Sell Price",
                price: adjSellPrice_2385k,
                diff: adj_diff_2385k,
                live: goldPKR_2385k,
              },
              {
                label: "Silver 999 — Sell Price",
                price: adjSellPrice_silver,
                diff: adj_diff_silver,
                live: silverPKR,
              },
            ].map(({ label, price, diff, live: lv }) => (
              <div
                key={label}
                className="rounded-2xl p-5"
                style={{
                  background: isLightTheme ? theme.cardBg : theme.bg,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: theme.primary }}
                >
                  {label}
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  {price != null ? `PKR ${fmt(price)}` : "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <span style={{ color: theme.textMuted }}>
                    Live:{" "}
                    <span
                      className="font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      PKR {fmt(lv)}
                    </span>
                  </span>
                  <span
                    className={`font-semibold ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : ""}`}
                    style={{ color: diff === 0 ? theme.textMuted : undefined }}
                  >
                    {diff === 0
                      ? "No markup"
                      : `Markup: ${diff > 0 ? "+" : ""}PKR ${fmt(diff)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5"
            style={{ color: "#3b82f6" }}
          >
            <span className="w-2 h-2 rounded-full inline-block bg-blue-500" />
            Buy Prices — Customer Sells to Shop
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "24K — Buy Price",
                price: adjBuyPrice_24k,
                diff: adj_buy_diff_24k,
                live: goldPKR_24k,
              },
              {
                label: "23.85K — Buy Price",
                price: adjBuyPrice_2385k,
                diff: adj_buy_diff_2385k,
                live: goldPKR_2385k,
              },
              {
                label: "Silver 999 — Buy Price",
                price: adjBuyPrice_silver,
                diff: adj_buy_diff_silver,
                live: silverPKR,
              },
            ].map(({ label, price, diff, live: lv }) => (
              <div
                key={label}
                className="rounded-2xl p-5"
                style={{
                  background: isLightTheme ? theme.cardBg : theme.bg,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: "#3b82f6" }}
                >
                  {label}
                </p>
                <p
                  className="text-3xl font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  {price != null ? `PKR ${fmt(price)}` : "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                  <span style={{ color: theme.textMuted }}>
                    Live:{" "}
                    <span
                      className="font-semibold"
                      style={{ color: theme.textPrimary }}
                    >
                      PKR {fmt(lv)}
                    </span>
                  </span>
                  <span
                    className={`font-semibold ${diff < 0 ? "text-red-500" : diff > 0 ? "text-emerald-600" : ""}`}
                    style={{ color: diff === 0 ? theme.textMuted : undefined }}
                  >
                    {diff === 0
                      ? "No difference"
                      : `Diff: ${diff > 0 ? "+" : ""}PKR ${fmt(diff)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Set Gold Price Markup */}
      <SectionCard
        icon={
          <span style={{ color: "#f59e0b" }}>
            <IconGold />
          </span>
        }
        iconBg={isLightTheme ? "#fef3c7" : "#2d2d2d"}
        title="Set Gold Price Markup"
        description="Set the sell price (what customers pay to buy gold) and the buy price (what shop pays when customers sell gold)."
      >
        <div className="mb-6">
          <PriceTypeTabs active={goldTab} onChange={setGoldTab} />
        </div>
        {goldTab === "sell" && (
          <>
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-xs font-medium"
              style={{
                background: `${theme.primary}12`,
                border: `1px solid ${theme.primary}25`,
                color: theme.primary,
              }}
            >
              <IconInfo />
              Sell price = what the customer pays when buying gold from you.
              Saving notifies all active shop admins.
            </div>
            <form onSubmit={handleGoldSellUpdate}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DiffField
                  label="24K Sell Difference (PKR / tola)"
                  value={goldSellForm.diff_24k}
                  onChange={(v) =>
                    setGoldSellForm((f) => ({ ...f, diff_24k: v }))
                  }
                  livePrice={goldPKR_24k}
                  error={goldSellErrors.diff_24k}
                  accentColor="amber"
                />
                <DiffField
                  label="23.85K Sell Difference (PKR / tola)"
                  value={goldSellForm.diff_2385k}
                  onChange={(v) =>
                    setGoldSellForm((f) => ({ ...f, diff_2385k: v }))
                  }
                  livePrice={goldPKR_2385k}
                  error={goldSellErrors.diff_2385k}
                  accentColor="amber"
                />
              </div>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={goldSellSaving}
                  className="flex-1 sm:flex-none px-7 py-3 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition"
                  style={{ background: theme.primary }}
                >
                  {goldSellSaving ? "Saving…" : "Save Gold Sell Prices"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setGoldSellForm({ diff_24k: "", diff_2385k: "" });
                    setGoldSellErrors({});
                    setGoldSellSaving(true);
                    try {
                      await saAPI.updatePriceDifference({
                        diff_24k: 0,
                        diff_2385k: 0,
                      });
                      showToast(
                        "Gold sell prices reset to 0. All shop admins notified.",
                      );
                      fetchPrices(true);
                    } catch (err) {
                      showToast(
                        err.response?.data?.message ||
                          "Failed to reset gold sell prices.",
                        "error",
                      );
                    } finally {
                      setGoldSellSaving(false);
                    }
                  }}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-semibold transition"
                  style={{
                    border: `1px solid ${theme.border}`,
                    background: "transparent",
                    color: theme.textMuted,
                  }}
                >
                  Reset to 0
                </button>
              </div>
            </form>
          </>
        )}
        {goldTab === "buy" && (
          <>
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-xs font-medium"
              style={{
                background: "#3b82f612",
                border: "1px solid #3b82f625",
                color: "#3b82f6",
              }}
            >
              <IconInfo />
              Buy price = what your shop pays when a customer sells gold to you.
              Usually a negative difference (below market). Saving notifies all
              active shop admins.
            </div>
            <form onSubmit={handleGoldBuyUpdate}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DiffField
                  label="24K Buy Difference (PKR / tola)"
                  value={goldBuyForm.buy_diff_24k}
                  onChange={(v) =>
                    setGoldBuyForm((f) => ({ ...f, buy_diff_24k: v }))
                  }
                  livePrice={goldPKR_24k}
                  error={goldBuyErrors.buy_diff_24k}
                  accentColor="blue"
                />
                <DiffField
                  label="23.85K Buy Difference (PKR / tola)"
                  value={goldBuyForm.buy_diff_2385k}
                  onChange={(v) =>
                    setGoldBuyForm((f) => ({ ...f, buy_diff_2385k: v }))
                  }
                  livePrice={goldPKR_2385k}
                  error={goldBuyErrors.buy_diff_2385k}
                  accentColor="blue"
                />
              </div>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={goldBuySaving}
                  className="flex-1 sm:flex-none px-7 py-3 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition"
                  style={{ background: "#3b82f6" }}
                >
                  {goldBuySaving ? "Saving…" : "Save Gold Buy Prices"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setGoldBuyForm({ buy_diff_24k: "", buy_diff_2385k: "" });
                    setGoldBuyErrors({});
                    setGoldBuySaving(true);
                    try {
                      await saAPI.updatePriceDifference({
                        buy_diff_24k: 0,
                        buy_diff_2385k: 0,
                      });
                      showToast(
                        "Gold buy prices reset to 0. All shop admins notified.",
                      );
                      fetchPrices(true);
                    } catch (err) {
                      showToast(
                        err.response?.data?.message ||
                          "Failed to reset gold buy prices.",
                        "error",
                      );
                    } finally {
                      setGoldBuySaving(false);
                    }
                  }}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-semibold transition"
                  style={{
                    border: `1px solid ${theme.border}`,
                    background: "transparent",
                    color: theme.textMuted,
                  }}
                >
                  Reset to 0
                </button>
              </div>
            </form>
          </>
        )}
      </SectionCard>

      {/* Set Silver Price Markup */}
      <SectionCard
        icon={
          <span style={{ color: "#64748b" }}>
            <IconSilver />
          </span>
        }
        iconBg={isLightTheme ? "#f1f5f9" : "#2d2d2d"}
        title="Set Silver Price Markup"
        description="Set the sell price (what customers pay to buy silver) and the buy price (what shop pays when customers sell silver)."
      >
        <div className="mb-6">
          <PriceTypeTabs active={silverTab} onChange={setSilverTab} />
        </div>
        {silverTab === "sell" && (
          <>
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-xs font-medium"
              style={{
                background: `${theme.primary}12`,
                border: `1px solid ${theme.primary}25`,
                color: theme.primary,
              }}
            >
              <IconInfo />
              Sell price = what the customer pays when buying silver from you.
              Saving notifies all active shop admins.
            </div>
            <form onSubmit={handleSilverSellUpdate}>
              <div className="grid grid-cols-1 gap-5">
                <DiffField
                  label="Silver Sell Difference (PKR / tola)"
                  value={silverSellInput}
                  onChange={(v) => {
                    setSilverSellInput(v);
                    if (silverSellError) setSilverSellError("");
                  }}
                  livePrice={silverPKR}
                  error={silverSellError}
                  accentColor="amber"
                />
              </div>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={silverSellSaving}
                  className="flex-1 sm:flex-none px-7 py-3 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition"
                  style={{ background: "#475569" }}
                >
                  {silverSellSaving ? "Saving…" : "Save Silver Sell Price"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setSilverSellInput("");
                    setSilverSellError("");
                    setSilverSellSaving(true);
                    try {
                      await saAPI.updateSilverPriceDifference({
                        diff_silver: 0,
                      });
                      showToast(
                        "Silver sell price reset to 0. All shop admins notified.",
                      );
                      fetchPrices(true);
                    } catch (err) {
                      showToast(
                        err.response?.data?.message ||
                          "Failed to reset silver sell price.",
                        "error",
                      );
                    } finally {
                      setSilverSellSaving(false);
                    }
                  }}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-semibold transition"
                  style={{
                    border: `1px solid ${theme.border}`,
                    background: "transparent",
                    color: theme.textMuted,
                  }}
                >
                  Reset to 0
                </button>
              </div>
            </form>
          </>
        )}
        {silverTab === "buy" && (
          <>
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-xs font-medium"
              style={{
                background: "#3b82f612",
                border: "1px solid #3b82f625",
                color: "#3b82f6",
              }}
            >
              <IconInfo />
              Buy price = what your shop pays when a customer sells silver to
              you. Usually a negative difference (below market). Saving notifies
              all active shop admins.
            </div>
            <form onSubmit={handleSilverBuyUpdate}>
              <div className="grid grid-cols-1 gap-5">
                <DiffField
                  label="Silver Buy Difference (PKR / tola)"
                  value={silverBuyInput}
                  onChange={(v) => {
                    setSilverBuyInput(v);
                    if (silverBuyError) setSilverBuyError("");
                  }}
                  livePrice={silverPKR}
                  error={silverBuyError}
                  accentColor="blue"
                />
              </div>
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <button
                  type="submit"
                  disabled={silverBuySaving}
                  className="flex-1 sm:flex-none px-7 py-3 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-sm transition"
                  style={{ background: "#3b82f6" }}
                >
                  {silverBuySaving ? "Saving…" : "Save Silver Buy Price"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setSilverBuyInput("");
                    setSilverBuyError("");
                    setSilverBuySaving(true);
                    try {
                      await saAPI.updateSilverPriceDifference({
                        buy_diff_silver: 0,
                      });
                      showToast(
                        "Silver buy price reset to 0. All shop admins notified.",
                      );
                      fetchPrices(true);
                    } catch (err) {
                      showToast(
                        err.response?.data?.message ||
                          "Failed to reset silver buy price.",
                        "error",
                      );
                    } finally {
                      setSilverBuySaving(false);
                    }
                  }}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-semibold transition"
                  style={{
                    border: `1px solid ${theme.border}`,
                    background: "transparent",
                    color: theme.textMuted,
                  }}
                >
                  Reset to 0
                </button>
              </div>
            </form>
          </>
        )}
      </SectionCard>

      {/* Currency Exchange Rates - Fully scrollable table on all screens */}
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
                style={{
                  background: "#3b82f618",
                  border: "1px solid #3b82f625",
                  color: "#3b82f6",
                }}
              >
                <IconCurrency />
              </div>
              <div>
                <h2
                  className="text-base font-bold"
                  style={{ color: theme.textPrimary }}
                >
                  Currency Exchange Rates
                </h2>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: theme.textMuted }}
                >
                  Live interbank rates · Set sell & buy differences separately.
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <PriceTypeTabs active={currencyTab} onChange={setCurrencyTab} />
            </div>
          </div>
        </div>

        {currencyTab === "sell" && (
          <>
            <div
              className="px-4 sm:px-6 py-3 border-b text-xs font-medium flex items-center gap-1.5"
              style={{
                background: `${theme.primary}08`,
                borderColor: theme.border,
                color: theme.primary,
              }}
            >
              <IconInfo />
              Sell rate = the rate at which customers buy foreign currency from
              you (customer pays this rate).
            </div>
            <div
              className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-end gap-3"
              style={{ borderBottom: `1px solid ${theme.border}` }}
            >
              <button
                type="button"
                onClick={handleCurrencySellResetAll}
                disabled={
                  currencySellUpdateAllSaving || currencySellResetAllSaving
                }
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                style={{
                  border: `1px solid ${theme.border}`,
                  background: "transparent",
                  color: theme.textMuted,
                }}
              >
                {currencySellResetAllSaving ? "Resetting…" : "Reset All to 0"}
              </button>
              <button
                type="button"
                onClick={handleCurrencySellUpdateAll}
                disabled={
                  currencySellUpdateAllSaving || currencySellResetAllSaving
                }
                className="flex-1 sm:flex-none px-6 py-2 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition"
                style={{ background: theme.primary }}
              >
                {currencySellUpdateAllSaving
                  ? "Updating…"
                  : "Update All Sell Rates"}
              </button>
            </div>
            {/* Scrollable table container - horizontal scroll on any screen */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: "800px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {[
                      "Currency",
                      "Live Rate (PKR)",
                      "Sell Difference",
                      "Your Sell Rate (PKR)",
                      "Gold 24K / tola",
                      "Action",
                    ].map((h) => (
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
                      goldPKR_24k={goldPKR_24k}
                      inputVal={currencySellForm[code] ?? ""}
                      accentColor="amber"
                      error={currencySellErrors[code]}
                      saving={currencySellSaving[code]}
                      onInputChange={(v) => {
                        setCurrencySellForm((f) => ({ ...f, [code]: v }));
                        if (currencySellErrors[code])
                          setCurrencySellErrors((e) => ({ ...e, [code]: "" }));
                      }}
                      onSave={() => handleCurrencySellUpdate(code)}
                      rateLabel="sell"
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {currencyTab === "buy" && (
          <>
            <div
              className="px-4 sm:px-6 py-3 border-b text-xs font-medium flex items-center gap-1.5"
              style={{
                background: "#3b82f608",
                borderColor: theme.border,
                color: "#3b82f6",
              }}
            >
              <IconInfo />
              Buy rate = the rate at which your shop buys foreign currency from
              customers (shop pays this rate to customer). Usually lower than
              the sell rate.
            </div>
            <div
              className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-end gap-3"
              style={{ borderBottom: `1px solid ${theme.border}` }}
            >
              <button
                type="button"
                onClick={handleCurrencyBuyResetAll}
                disabled={
                  currencyBuyUpdateAllSaving || currencyBuyResetAllSaving
                }
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                style={{
                  border: `1px solid ${theme.border}`,
                  background: "transparent",
                  color: theme.textMuted,
                }}
              >
                {currencyBuyResetAllSaving ? "Resetting…" : "Reset All to 0"}
              </button>
              <button
                type="button"
                onClick={handleCurrencyBuyUpdateAll}
                disabled={
                  currencyBuyUpdateAllSaving || currencyBuyResetAllSaving
                }
                className="flex-1 sm:flex-none px-6 py-2 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition"
                style={{ background: "#3b82f6" }}
              >
                {currencyBuyUpdateAllSaving
                  ? "Updating…"
                  : "Update All Buy Rates"}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: "800px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {[
                      "Currency",
                      "Live Rate (PKR)",
                      "Buy Difference",
                      "Your Buy Rate (PKR)",
                      "Gold 24K / tola",
                      "Action",
                    ].map((h) => (
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
                      goldPKR_24k={goldPKR_24k}
                      inputVal={currencyBuyForm[code] ?? ""}
                      accentColor="blue"
                      error={currencyBuyErrors[code]}
                      saving={currencyBuySaving[code]}
                      onInputChange={(v) => {
                        setCurrencyBuyForm((f) => ({ ...f, [code]: v }));
                        if (currencyBuyErrors[code])
                          setCurrencyBuyErrors((e) => ({ ...e, [code]: "" }));
                      }}
                      onSave={() => handleCurrencyBuyUpdate(code)}
                      rateLabel="buy"
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Gold / Silver in All Currencies (grid remains responsive) */}
      {(goldPKR_24k != null || silverPKR != null) && (
        <section>
          {goldPKR_24k != null && (
            <>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
                style={{ color: theme.textMuted }}
              >
                Gold 24K in All Currencies (per tola)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {Object.entries(CURRENCY_META).map(([code, meta]) => {
                  const liveRate = rawCurrencies[code]?.rate;
                  if (liveRate == null) return null;
                  return (
                    <div
                      key={code}
                      className="rounded-2xl p-4 text-center transition hover:-translate-y-0.5"
                      style={{
                        background: isLightTheme ? theme.cardBg : theme.bg,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <p className="text-2xl mb-1 leading-none">{meta.flag}</p>
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: theme.textMuted }}
                      >
                        {code}
                      </p>
                      <p
                        className="text-lg font-bold mt-1.5"
                        style={{ color: theme.textPrimary }}
                      >
                        {meta.symbol}
                        {fmt(goldPKR_24k / liveRate, 2)}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: theme.textMuted }}
                      >
                        per tola
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {goldPKR_2385k != null && (
            <>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
                style={{ color: theme.textMuted }}
              >
                Gold 23.85K in All Currencies (per tola)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {Object.entries(CURRENCY_META).map(([code, meta]) => {
                  const liveRate = rawCurrencies[code]?.rate;
                  if (liveRate == null) return null;
                  return (
                    <div
                      key={code}
                      className="rounded-2xl p-4 text-center transition hover:-translate-y-0.5"
                      style={{
                        background: isLightTheme ? theme.cardBg : theme.bg,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <p className="text-2xl mb-1 leading-none">{meta.flag}</p>
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: theme.textMuted }}
                      >
                        {code}
                      </p>
                      <p
                        className="text-lg font-bold mt-1.5"
                        style={{ color: theme.textPrimary }}
                      >
                        {meta.symbol}
                        {fmt(goldPKR_2385k / liveRate, 2)}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: theme.textMuted }}
                      >
                        per tola
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {silverPKR != null && (
            <>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
                style={{ color: theme.textMuted }}
              >
                Silver 999 in All Currencies (per tola)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(CURRENCY_META).map(([code, meta]) => {
                  const liveRate = rawCurrencies[code]?.rate;
                  if (liveRate == null) return null;
                  return (
                    <div
                      key={code}
                      className="rounded-2xl p-4 text-center transition hover:-translate-y-0.5"
                      style={{
                        background: isLightTheme ? theme.cardBg : theme.bg,
                        border: `1px solid ${theme.border}`,
                      }}
                    >
                      <p className="text-2xl mb-1 leading-none">{meta.flag}</p>
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: theme.textMuted }}
                      >
                        {code}
                      </p>
                      <p
                        className="text-lg font-bold mt-1.5"
                        style={{ color: theme.textPrimary }}
                      >
                        {meta.symbol}
                        {fmt(silverPKR / liveRate, 2)}
                      </p>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: theme.textMuted }}
                      >
                        per tola
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

    <Toast
  msg={toast.msg}
  type={toast.type}
  onClose={handleToastClose}
/>
    </div>
  );
}