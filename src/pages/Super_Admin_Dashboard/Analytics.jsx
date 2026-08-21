// pages/Super_Admin_Dashboard/Analytics.jsx
// Production-ready — My Shop tab (SA's own shop) + System tab (whole platform)
// Backend: superAdminController.js getAnalytics + getDashboard + getMyShopAnalytics

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import * as saAPI from "../../services/superAdminApi";
import { useLivePrices } from "../../hooks/useLivePrices";
import { useTheme } from "../../contexts/ThemeContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_COLORS = {
  completed:  "#10B981",
  pending:    "#F59E0B",
  cancelled:  "#EF4444",
  rejected:   "#EF4444",
  processing: "#6366F1",
  approved:   "#8B5CF6",
};

const CURRENCY_META = {
  USD: { flag: "🇺🇸", symbol: "$",   name: "US Dollar"     },
  SAR: { flag: "🇸🇦", symbol: "﷼",   name: "Saudi Riyal"   },
  AED: { flag: "🇦🇪", symbol: "د.إ", name: "UAE Dirham"    },
  EUR: { flag: "🇪🇺", symbol: "€",   name: "Euro"          },
  GBP: { flag: "🇬🇧", symbol: "£",   name: "British Pound" },
  CHF: { flag: "🇨🇭", symbol: "₣",   name: "Swiss Franc"   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n, digits = 0) =>
  n != null && !isNaN(Number(n))
    ? Number(n).toLocaleString("en-PK", { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : "—";

const fmtCompact = (n) => {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
};

const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) : "0");

// ─── Icons ────────────────────────────────────────────────────────────────────

const Ico = ({ d, className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS = {
  refresh:   "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  shops:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  users:     "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  orders:    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  revenue:   "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  gold:      "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  silver:    "M12 2C8 8 5 12 5 15.5a7 7 0 0014 0C19 12 16 8 12 2z",
  currency:  "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  trend:     "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  alert:     "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  check:     "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  down:      "M17 13l-5 5m0 0l-5-5m5 5V6",
  up:        "M7 11l5-5m0 0l5 5m-5-5v12",
  calendar:  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  cancel:    "M6 18L18 6M6 6l12 12",
  flag:      "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
  star:      "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  activity:  "M22 12h-4l-3 9L9 3l-3 9H2",
  globe:     "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  scale:     "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  lightning: "M13 10V3L4 14h7v7l9-11h-7z",
  clock:     "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  eye:       "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  info:      "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  shop2:     "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  system:    "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2",
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function PageSpinner() {
  const { theme, isLightTheme } = useTheme();
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: isLightTheme ? (theme.pageBg ?? "#f9fafb") : (theme.bg ?? "#0c0c0c") }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-amber-100" />
          <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 animate-spin" />
          <div className="absolute inset-3 rounded-full border border-amber-200/50" />
        </div>
        <p className="text-sm font-medium tracking-widest uppercase" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
          Loading analytics…
        </p>
      </div>
    </div>
  );
}

function Panel({ children, className = "" }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <div
      className={`rounded-3xl border shadow-sm ${className}`}
      style={{
        background: isLightTheme ? (theme.cardBg ?? "#ffffff") : (theme.cardBg ?? "#1a1a1a"),
        borderColor: isLightTheme ? (theme.border ?? "#f3f4f6") : (theme.border ?? "#2a2a2a"),
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children, dot = "amber" }) {
  const { isLightTheme } = useTheme();
  const dotColors = {
    amber:   "bg-amber-400",
    blue:    "bg-blue-400",
    emerald: "bg-emerald-400",
    violet:  "bg-violet-400",
    slate:   "bg-slate-400",
    rose:    "bg-rose-400",
    red:     "bg-red-400",
    orange:  "bg-orange-400",
  };
  return (
    <p
      className="text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
      style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}
    >
      <span className={`w-2 h-2 rounded-full ${dotColors[dot] ?? dotColors.amber} inline-block`} />
      {children}
    </p>
  );
}

function ChartTooltip({ active, payload, label, prefix = "", suffix = "" }) {
  const { theme, isLightTheme } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-2xl px-4 py-3 shadow-lg text-xs border"
      style={{
        background: isLightTheme ? (theme.cardBg ?? "#ffffff") : "#1f1f1f",
        borderColor: isLightTheme ? (theme.border ?? "#e5e7eb") : "#374151",
        color: isLightTheme ? "#111827" : "#e5e7eb",
      }}
    >
      <p className="mb-2 font-semibold" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 font-bold">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {prefix}{fmt(p.value)}{suffix}
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, delay = 0, trend, badge }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <div
      className="rounded-2xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: isLightTheme ? (theme.cardBg ?? "#ffffff") : (theme.cardBg ?? "#1a1a1a"),
        borderColor: isLightTheme ? (theme.border ?? "#f3f4f6") : (theme.border ?? "#2a2a2a"),
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center p-2 ${color}`}>
          <Ico d={icon} className="w-4 h-4" />
        </div>
        {trend != null && (
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg
            ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
            <Ico d={trend >= 0 ? ICONS.up : ICONS.down} className="w-2.5 h-2.5" />
            {Math.abs(trend)}%
          </span>
        )}
        {badge && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
            style={{ background: isLightTheme ? "#f3f4f6" : "#2a2a2a", color: isLightTheme ? "#6b7280" : "#9ca3af" }}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>
        {value}
      </p>
      <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
        {label}
      </p>
      {sub && <p className="text-xs mt-0.5" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>{sub}</p>}
    </div>
  );
}

function RevCard({ label, total, count, buyRev, sellRev, accent = "amber" }) {
  const { isLightTheme } = useTheme();
  const accents = {
    amber:   { bg: "from-amber-50 to-yellow-50",   border: "border-amber-200",  val: "text-amber-700",   sub: "text-amber-500"   },
    emerald: { bg: "from-emerald-50 to-green-50",  border: "border-emerald-200",val: "text-emerald-700", sub: "text-emerald-500" },
    blue:    { bg: "from-blue-50 to-sky-50",        border: "border-blue-200",   val: "text-blue-700",    sub: "text-blue-500"    },
  };
  // dark overrides
  const darkAccents = {
    amber:   { bg: "rgba(217,119,6,0.1)",    border: "rgba(217,119,6,0.3)",   val: "#fbbf24", sub: "#f59e0b", label: "#9ca3af", count: "#6b7280" },
    emerald: { bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.3)",  val: "#34d399", sub: "#10b981", label: "#9ca3af", count: "#6b7280" },
    blue:    { bg: "rgba(59,130,246,0.1)",   border: "rgba(59,130,246,0.3)",  val: "#93c5fd", sub: "#3b82f6", label: "#9ca3af", count: "#6b7280" },
  };
  const a = accents[accent] ?? accents.amber;
  const d = darkAccents[accent] ?? darkAccents.amber;

  if (!isLightTheme) {
    return (
      <div
        className="rounded-2xl p-4 sm:p-5"
        style={{ background: d.bg, border: `1px solid ${d.border}` }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: d.label }}>{label}</p>
        <p className="text-2xl sm:text-3xl font-black leading-none" style={{ color: d.val }}>PKR {fmtCompact(total)}</p>
        <p className="text-xs mt-1" style={{ color: d.count }}>{count} completed orders</p>
        <div className="mt-3 pt-3 grid grid-cols-2 gap-2" style={{ borderTop: `1px solid ${d.border}` }}>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: d.count }}>Sell Rev</p>
            <p className="text-sm font-bold" style={{ color: "#d1d5db" }}>PKR {fmtCompact(sellRev)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: d.count }}>Buy Rev</p>
            <p className="text-sm font-bold" style={{ color: "#d1d5db" }}>PKR {fmtCompact(buyRev)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${a.bg} border ${a.border} rounded-2xl p-4 sm:p-5`}>
      <p className={`text-xs font-bold uppercase tracking-widest ${a.sub} mb-3`}>{label}</p>
      <p className={`text-2xl sm:text-3xl font-black ${a.val} leading-none`}>PKR {fmtCompact(total)}</p>
      <p className="text-xs text-gray-400 mt-1">{count} completed orders</p>
      <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sell Rev</p>
          <p className="text-sm font-bold text-gray-700">PKR {fmtCompact(sellRev)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Buy Rev</p>
          <p className="text-sm font-bold text-gray-700">PKR {fmtCompact(buyRev)}</p>
        </div>
      </div>
    </div>
  );
}

function OrderPeriodCard({ label, completed, pending, approved, cancelled = 0, rejected = 0, processing = 0 }) {
  const { theme, isLightTheme } = useTheme();
  const total = completed + pending + approved + cancelled + rejected + processing;
  const rows = [
    { label: "Completed",  val: completed,  color: "bg-emerald-400" },
    { label: "Approved",   val: approved,   color: "bg-violet-400"  },
    { label: "Pending",    val: pending,    color: "bg-amber-400"   },
    { label: "Rejected",   val: rejected,   color: "bg-red-400"     },
    { label: "Cancelled",  val: cancelled,  color: "bg-rose-400"    },
    { label: "Processing", val: processing, color: "bg-blue-400"    },
  ].filter(r => r.val > 0 || r.label === "Completed" || r.label === "Pending");

  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{
        background: isLightTheme ? (theme.cardBg ?? "#ffffff") : (theme.cardBg ?? "#1a1a1a"),
        borderColor: isLightTheme ? (theme.border ?? "#f3f4f6") : (theme.border ?? "#2a2a2a"),
      }}
    >
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
        {label}
      </p>
      <p className="text-2xl font-black" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>{fmt(total)}</p>
      <p className="text-xs mb-3" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>total orders</p>
      <div className="space-y-1.5">
        {rows.map(({ label: l, val, color }) => (
          <div key={l} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>{l}</span>
            </div>
            <span className="font-bold" style={{ color: isLightTheme ? "#1f2937" : "#d1d5db" }}>{fmt(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriceRow({ record, index }) {
  const { theme, isLightTheme } = useTheme();
  const date = new Date(record.createdAt);
  return (
    <div
      className="flex items-center gap-4 py-3"
      style={index > 0 ? { borderTop: `1px solid ${isLightTheme ? (theme.border ?? "#f3f4f6") : "#2a2a2a"}` } : {}}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: isLightTheme ? "#fffbeb" : "rgba(217,119,6,0.15)", color: isLightTheme ? "#d97706" : "#fbbf24" }}
      >
        <Ico d={ICONS.gold} className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>
            24K Sell: PKR {fmt(record.adjustedPrice_24k)}
          </span>
          <span style={{ color: isLightTheme ? "#d1d5db" : "#374151" }}>·</span>
          <span className="text-xs" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
            23.85K Sell: PKR {fmt(record.adjustedPrice_2385k)}
          </span>
        </div>
        {(record.adjustedBuyPrice_24k != null || record.adjustedBuyPrice_2385k != null) && (
          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {record.adjustedBuyPrice_24k != null && (
              <span className="text-xs font-black" style={{ color: isLightTheme ? "#1d4ed8" : "#93c5fd" }}>
                24K Buy: PKR {fmt(record.adjustedBuyPrice_24k)}
              </span>
            )}
            {record.adjustedBuyPrice_2385k != null && (
              <>
                <span style={{ color: isLightTheme ? "#d1d5db" : "#374151" }}>·</span>
                <span className="text-xs" style={{ color: isLightTheme ? "#3b82f6" : "#60a5fa" }}>
                  23.85K Buy: PKR {fmt(record.adjustedBuyPrice_2385k)}
                </span>
              </>
            )}
          </div>
        )}
        <p className="text-[10px] mt-0.5" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
          Base {fmt(record.basePricePerTolaPKR)} · Sell Diff 24K: {(record.diff_24k ?? 0) >= 0 ? "+" : ""}{fmt(record.diff_24k ?? 0)} · Buy Diff 24K: {(record.buy_diff_24k ?? 0) >= 0 ? "+" : ""}{fmt(record.buy_diff_24k ?? 0)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px]" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
          {date.toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
        </p>
        <p className="text-[10px]" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
          {date.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function ShopRow({ shop, maxSales, index }) {
  const { theme, isLightTheme } = useTheme();
  const salesPct = maxSales > 0 ? (shop.totalSales / maxSales) * 100 : 0;
  return (
    <div
      className="flex items-center gap-4 py-3"
      style={index > 0 ? { borderTop: `1px solid ${isLightTheme ? (theme.border ?? "#f3f4f6") : "#2a2a2a"}` } : {}}
    >
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
        style={{ background: isLightTheme ? "#fffbeb" : "rgba(217,119,6,0.15)", color: isLightTheme ? "#d97706" : "#fbbf24" }}
      >
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-black truncate" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>{shop.shopName}</p>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
            style={shop.isActive
              ? { background: isLightTheme ? "#dcfce7" : "rgba(16,185,129,0.15)", color: isLightTheme ? "#166534" : "#34d399" }
              : { background: isLightTheme ? "#f3f4f6" : "#2a2a2a", color: isLightTheme ? "#9ca3af" : "#6b7280" }
            }
          >
            {shop.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div
          className="mt-1.5 h-1.5 rounded-full overflow-hidden"
          style={{ background: isLightTheme ? "#f3f4f6" : "#2a2a2a" }}
        >
          <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${salesPct}%` }} />
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-black text-amber-500">PKR {fmtCompact(shop.totalSales ?? 0)}</p>
        <p className="text-[10px]" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
          {shop.salesCount ?? 0} sales · {shop.purchasesCount ?? 0} purchases
        </p>
      </div>
    </div>
  );
}

function PriceTile({ label, base, adjusted, diff, type = "sell", accent = "amber" }) {
  const { isLightTheme } = useTheme();
  const positive = (diff ?? 0) >= 0;

  const lightAccents = {
    amber: { bg: "from-amber-50 to-yellow-100", border: "border-yellow-200", tag: "bg-amber-100/80 text-amber-700" },
    slate: { bg: "from-slate-50 to-gray-100",   border: "border-slate-200",  tag: "bg-slate-100 text-slate-600"   },
    blue:  { bg: "from-blue-50 to-sky-100",      border: "border-blue-200",   tag: "bg-blue-100/80 text-blue-700"  },
  };
  const darkAccents = {
    amber: { bg: "rgba(217,119,6,0.12)",  border: "rgba(217,119,6,0.3)",  tagBg: "rgba(217,119,6,0.2)",  tagColor: "#fbbf24" },
    slate: { bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)",tagBg: "rgba(100,116,139,0.2)",tagColor: "#94a3b8" },
    blue:  { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", tagBg: "rgba(59,130,246,0.2)", tagColor: "#93c5fd" },
  };
  const a = lightAccents[accent] ?? lightAccents.amber;
  const d = darkAccents[accent] ?? darkAccents.amber;

  if (!isLightTheme) {
    return (
      <div
        className="relative rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
        style={{ background: d.bg, border: `1px solid ${d.border}` }}
      >
        <div className="relative p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9ca3af" }}>{label}</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: d.tagBg, color: d.tagColor }}>
              {type === "sell" ? "SELL" : "BUY"}
            </span>
          </div>
          <p className="text-2xl font-black leading-none" style={{ color: "#e5e7eb" }}>PKR {fmt(adjusted ?? base)}</p>
          <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>per tola</p>
          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${d.border}` }}>
            <span className="text-xs" style={{ color: "#9ca3af" }}>Base: PKR {fmt(base)}</span>
            {diff != null && (
              <span className={`text-xs font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>
                {positive ? "+" : ""}{fmt(diff)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className={`absolute inset-0 bg-gradient-to-br ${a.bg}`} />
      <div className={`absolute inset-0 rounded-3xl border ${a.border}`} />
      <div className="relative p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</p>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${a.tag}`}>
            {type === "sell" ? "SELL" : "BUY"}
          </span>
        </div>
        <p className="text-2xl font-black text-gray-900 leading-none">PKR {fmt(adjusted ?? base)}</p>
        <p className="text-xs text-gray-400 mt-1">per tola</p>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/5">
          <span className="text-xs text-gray-400">Base: PKR {fmt(base)}</span>
          {diff != null && (
            <span className={`text-xs font-bold ${positive ? "text-emerald-600" : "text-red-500"}`}>
              {positive ? "+" : ""}{fmt(diff)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── System Health Score ──────────────────────────────────────────────────────

function SystemHealthScore({ orders, revenue, users }) {
  const { theme, isLightTheme } = useTheme();
  const completionRate = orders.total > 0 ? (orders.completed / orders.total) * 100 : 0;
  const activeAdminRate = users.totalAdmins > 0 ? (users.activeAdmins / users.totalAdmins) * 100 : 0;
  const approvedCustomerRate = users.totalCustomers > 0 ? (users.approvedCustomers / users.totalCustomers) * 100 : 0;
  const cancelRate = orders.total > 0 ? ((orders.cancelled + (orders.rejected ?? 0)) / orders.total) * 100 : 0;

  const score = Math.round(
    (completionRate * 0.4) +
    (activeAdminRate * 0.3) +
    (approvedCustomerRate * 0.2) +
    (Math.max(0, 100 - cancelRate) * 0.1)
  );

  const color = score >= 75 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
  const label = score >= 75 ? "Healthy" : score >= 50 ? "Moderate" : "Needs Attention";

  const metrics = [
    { name: "Order Completion",     val: completionRate.toFixed(1),              color: "#10B981" },
    { name: "Active Shops",         val: activeAdminRate.toFixed(1),             color: "#6366F1" },
    { name: "Approved Customers",   val: approvedCustomerRate.toFixed(1),        color: "#3B82F6" },
    { name: "Cancel-Free Rate",     val: Math.max(0, 100 - cancelRate).toFixed(1), color: "#F59E0B" },
  ];

  return (
    <Panel className="overflow-hidden">
      <div
        className="px-4 sm:px-6 py-5 border-b"
        style={{ borderColor: isLightTheme ? (theme.border ?? "#f3f4f6") : "#2a2a2a" }}
      >
        <h3 className="text-sm font-bold" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>System Health Score</h3>
        <p className="text-xs mt-0.5" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>Overall platform performance index</p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="relative shrink-0">
            <svg width={120} height={120} viewBox="0 0 120 120">
              <circle cx={60} cy={60} r={52} fill="none" stroke={isLightTheme ? "#F3F4F6" : "#2a2a2a"} strokeWidth={8} />
              <circle
                cx={60} cy={60} r={52} fill="none"
                stroke={color} strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 326.73} 326.73`}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-black" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>{score}</p>
              <p className="text-[10px] font-bold" style={{ color }}>{label}</p>
            </div>
          </div>
          <div className="flex-1 w-full space-y-3">
            {metrics.map(({ name, val, color: c }) => (
              <div key={name}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>{name}</span>
                  <span className="text-xs font-bold" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>{val}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isLightTheme ? "#f3f4f6" : "#2a2a2a" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val}%`, background: c }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ─── Order Funnel ─────────────────────────────────────────────────────────────

function OrderFunnel({ orders }) {
  const { theme, isLightTheme } = useTheme();
  const total = orders.total ?? 0;
  const stages = [
    { label: "All Orders", val: total,               color: "#6366F1", pctOf: total },
    { label: "Approved",   val: orders.approved ?? 0, color: "#8B5CF6", pctOf: total },
    { label: "Completed",  val: orders.completed ?? 0,color: "#10B981", pctOf: total },
  ];

  return (
    <Panel className="overflow-hidden">
      <div
        className="px-4 sm:px-6 py-5 border-b"
        style={{ borderColor: isLightTheme ? (theme.border ?? "#f3f4f6") : "#2a2a2a" }}
      >
        <h3 className="text-sm font-bold" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>Order Funnel</h3>
        <p className="text-xs mt-0.5" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>Conversion through order lifecycle</p>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        {stages.map(({ label, val, color, pctOf }, i) => {
          const width = pctOf > 0 ? (val / pctOf) * 100 : 0;
          return (
            <div key={label}>
              <div className="flex justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs font-semibold" style={{ color: isLightTheme ? "#374151" : "#d1d5db" }}>{label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>{fmt(val)}</span>
                  <span className="text-[10px] w-10 text-right" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>{pct(val, pctOf)}%</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: isLightTheme ? "#f3f4f6" : "#2a2a2a" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${width}%`, background: color }} />
              </div>
              {i < stages.length - 1 && (
                <p className="text-[10px] mt-1 ml-4" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
                  → {stages[i + 1] ? pct(stages[i + 1].val, val) : "0"}% proceed to next stage
                </p>
              )}
            </div>
          );
        })}

        <div className="mt-4 pt-4 grid grid-cols-2 gap-3" style={{ borderTop: `1px solid ${isLightTheme ? (theme.border ?? "#f3f4f6") : "#2a2a2a"}` }}>
          {[
            { label: "Cancelled",  val: orders.cancelled ?? 0,  lightBg: "bg-red-50",    darkBg: "rgba(239,68,68,0.1)",    lightColor: "text-red-500",  darkColor: "#f87171"  },
            { label: "Rejected",   val: orders.rejected ?? 0,   lightBg: "bg-rose-50",   darkBg: "rgba(244,63,94,0.1)",    lightColor: "text-rose-500", darkColor: "#fda4af"  },
            { label: "Processing", val: orders.processing ?? 0, lightBg: "bg-blue-50",   darkBg: "rgba(59,130,246,0.1)",   lightColor: "text-blue-500", darkColor: "#93c5fd"  },
            { label: "Pending",    val: orders.pending ?? 0,    lightBg: "bg-amber-50",  darkBg: "rgba(245,158,11,0.1)",   lightColor: "text-amber-600",darkColor: "#fbbf24"  },
          ].map(({ label, val, lightBg, darkBg, lightColor, darkColor }) => (
            <div
              key={label}
              className={`${isLightTheme ? lightBg : ""} rounded-xl p-3`}
              style={!isLightTheme ? { background: darkBg } : {}}
            >
              <p className={`text-lg font-black ${isLightTheme ? lightColor : ""}`} style={!isLightTheme ? { color: darkColor } : {}}>{fmt(val)}</p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ─── Revenue Split Card ───────────────────────────────────────────────────────

function RevenueSplitCard({ sellRevenue, buyRevenue }) {
  const { theme, isLightTheme } = useTheme();
  const total = (sellRevenue ?? 0) + (buyRevenue ?? 0);
  const sellPct = total > 0 ? ((sellRevenue / total) * 100).toFixed(1) : "0";
  const buyPct  = total > 0 ? ((buyRevenue  / total) * 100).toFixed(1) : "0";

  return (
    <Panel className="overflow-hidden">
      <div
        className="px-4 sm:px-6 py-5 border-b"
        style={{ borderColor: isLightTheme ? (theme.border ?? "#f3f4f6") : "#2a2a2a" }}
      >
        <h3 className="text-sm font-bold" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>Revenue Split</h3>
        <p className="text-xs mt-0.5" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>Sell vs Buy revenue breakdown</p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-3 rounded-l-full bg-amber-500 transition-all duration-700" style={{ width: `${sellPct}%`, minWidth: "4px" }} />
          <div className="h-3 rounded-r-full bg-blue-500 transition-all duration-700" style={{ width: `${buyPct}%`, minWidth: "4px" }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="text-center p-3 sm:p-4 rounded-2xl border"
            style={{
              background: isLightTheme ? "#fffbeb" : "rgba(245,158,11,0.1)",
              borderColor: isLightTheme ? "#fde68a" : "rgba(245,158,11,0.3)",
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: isLightTheme ? "#d97706" : "#f59e0b" }}>Sell Revenue</p>
            <p className="text-lg sm:text-xl font-black" style={{ color: isLightTheme ? "#b45309" : "#fbbf24" }}>PKR {fmtCompact(sellRevenue ?? 0)}</p>
            <p className="text-xs mt-1" style={{ color: isLightTheme ? "#d97706" : "#f59e0b" }}>{sellPct}% of total</p>
            <p className="text-[10px] mt-0.5" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>Customer buys gold</p>
          </div>
          <div
            className="text-center p-3 sm:p-4 rounded-2xl border"
            style={{
              background: isLightTheme ? "#eff6ff" : "rgba(59,130,246,0.1)",
              borderColor: isLightTheme ? "#bfdbfe" : "rgba(59,130,246,0.3)",
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: isLightTheme ? "#2563eb" : "#60a5fa" }}>Buy Revenue</p>
            <p className="text-lg sm:text-xl font-black" style={{ color: isLightTheme ? "#1e40af" : "#93c5fd" }}>PKR {fmtCompact(buyRevenue ?? 0)}</p>
            <p className="text-xs mt-1" style={{ color: isLightTheme ? "#2563eb" : "#60a5fa" }}>{buyPct}% of total</p>
            <p className="text-[10px] mt-0.5" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>Customer sells gold</p>
          </div>
        </div>
        <div
          className="mt-4 pt-4 text-center"
          style={{ borderTop: `1px solid ${isLightTheme ? (theme.border ?? "#f3f4f6") : "#2a2a2a"}` }}
        >
          <p className="text-xs" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>Total All-time Revenue</p>
          <p className="text-2xl font-black mt-1" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>PKR {fmtCompact(total)}</p>
        </div>
      </div>
    </Panel>
  );
}

// ─── My Shop Weekly Bar Chart ─────────────────────────────────────────────────

function WeeklyBarChart({ data }) {
  const { isLightTheme } = useTheme();
  if (!data?.length || data.every(d => d.totalOrders === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-sm" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
        No completed orders this week
      </div>
    );
  }
  const gridColor = isLightTheme ? "#F3F4F6" : "#2a2a2a";
  const tickColor = isLightTheme ? "#9CA3AF" : "#6b7280";
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="day" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtCompact} tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const sales = payload.find(p => p.dataKey === "sales")?.value || 0;
            const buys  = payload.find(p => p.dataKey === "buys")?.value  || 0;
            const sc    = payload.find(p => p.dataKey === "salesCount")?.value || 0;
            const bc    = payload.find(p => p.dataKey === "buysCount")?.value  || 0;
            return (
              <div
                className="rounded-2xl px-4 py-3 shadow-lg text-xs border"
                style={{
                  background: isLightTheme ? "#ffffff" : "#1f1f1f",
                  borderColor: isLightTheme ? "#e5e7eb" : "#374151",
                  color: isLightTheme ? "#111827" : "#e5e7eb",
                }}
              >
                <p className="mb-2 font-semibold" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>{label}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>Sales:</span>
                    <span className="font-bold text-emerald-500">PKR {fmt(sales)}</span>
                    <span style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>({sc} orders)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>Buys:</span>
                    <span className="font-bold text-amber-500">PKR {fmt(buys)}</span>
                    <span style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>({bc} orders)</span>
                  </div>
                </div>
              </div>
            );
          }}
        />
        <Bar dataKey="sales" name="Sales (Customer Buys)" fill="#10B981" radius={[4,4,0,0]} />
        <Bar dataKey="buys"  name="Buys (Customer Sells)" fill="#F59E0B" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── My Shop Daily Area Chart ─────────────────────────────────────────────────

function DailyLineChart({ data }) {
  const { isLightTheme } = useTheme();
  if (!data?.length || data.every(d => d.totalOrders === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-sm" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
        No completed orders in the last 30 days
      </div>
    );
  }
  const formatted = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("en-PK", { month: "short", day: "numeric" }),
  }));
  const gridColor = isLightTheme ? "#F3F4F6" : "#2a2a2a";
  const tickColor = isLightTheme ? "#9CA3AF" : "#6b7280";
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={formatted} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="saSalesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="saBuysGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="displayDate"
          tick={{ fill: tickColor, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={Math.max(0, Math.floor(formatted.length / 7) - 1)}
        />
        <YAxis tickFormatter={fmtCompact} tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const sales = payload.find(p => p.dataKey === "sales")?.value || 0;
            const buys  = payload.find(p => p.dataKey === "buys")?.value  || 0;
            const sc    = payload.find(p => p.dataKey === "salesCount")?.value || 0;
            const bc    = payload.find(p => p.dataKey === "buysCount")?.value  || 0;
            return (
              <div
                className="rounded-2xl px-4 py-3 shadow-lg text-xs border"
                style={{
                  background: isLightTheme ? "#ffffff" : "#1f1f1f",
                  borderColor: isLightTheme ? "#e5e7eb" : "#374151",
                  color: isLightTheme ? "#111827" : "#e5e7eb",
                }}
              >
                <p className="mb-2 font-semibold" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>{label}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>Sales:</span>
                    <span className="font-bold text-emerald-500">PKR {fmt(sales)}</span>
                    <span style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>({sc})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>Buys:</span>
                    <span className="font-bold text-amber-500">PKR {fmt(buys)}</span>
                    <span style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>({bc})</span>
                  </div>
                </div>
              </div>
            );
          }}
        />
        <Area type="monotone" dataKey="sales" name="Sales" stroke="#10B981" strokeWidth={2} fill="url(#saSalesGrad)" />
        <Area type="monotone" dataKey="buys"  name="Buys"  stroke="#F59E0B" strokeWidth={2} fill="url(#saBuysGrad)"  />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Recent Orders Table ──────────────────────────────────────────────────────

function RecentOrdersTable({ orders }) {
  const { theme, isLightTheme } = useTheme();
  if (!orders?.length) return null;
  const borderColor = isLightTheme ? (theme.border ?? "#f3f4f6") : "#2a2a2a";
  const textPrimary = isLightTheme ? "#111827" : "#e5e7eb";
  const textMuted   = isLightTheme ? "#6b7280"  : "#9ca3af";
  const headerBg    = isLightTheme ? "#f9fafb"  : "#1f1f1f";
  return (
    <Panel className="overflow-hidden">
      <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
        <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Recent Orders — My Shop</h3>
        <p className="text-xs mt-0.5" style={{ color: textMuted }}>Latest 10 transactions from your shop</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead style={{ background: headerBg, borderBottom: `1px solid ${borderColor}` }}>
            <tr>
              {["Customer","Type","Metal","Amount","Status","Date"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: textMuted }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 10).map((order, idx) => (
              <tr
                key={order._id}
                className="transition-colors"
                style={{ borderTop: `1px solid ${borderColor}`, background: idx % 2 === 0 ? "transparent" : (isLightTheme ? "rgba(249,250,251,0.5)" : "rgba(31,31,31,0.5)") }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: textPrimary }}>{order.customerId?.name || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${
                    order.orderType === "buy" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
                  style={!isLightTheme ? {
                    background: order.orderType === "buy" ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)",
                    color: order.orderType === "buy" ? "#34d399" : "#fda4af",
                  } : {}}>
                    {order.orderType?.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${
                    order.metalType === "gold" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}
                  style={!isLightTheme ? {
                    background: order.metalType === "gold" ? "rgba(245,158,11,0.15)" : "rgba(100,116,139,0.15)",
                    color: order.metalType === "gold" ? "#fbbf24" : "#94a3b8",
                  } : {}}>
                    {order.metalType?.toUpperCase()} {order.carat}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold" style={{ color: isLightTheme ? "#d97706" : "#fbbf24" }}>
                  PKR {fmt(order.finalizedAmount || order.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold"
                    style={isLightTheme ? {
                      background: order.status === "completed" ? "#ecfdf5" : order.status === "approved" ? "#ede9fe" : order.status === "pending" ? "#fffbeb" : "#fef2f2",
                      color: order.status === "completed" ? "#065f46" : order.status === "approved" ? "#5b21b6" : order.status === "pending" ? "#92400e" : "#991b1b",
                    } : {
                      background: order.status === "completed" ? "rgba(16,185,129,0.15)" : order.status === "approved" ? "rgba(139,92,246,0.15)" : order.status === "pending" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                      color: order.status === "completed" ? "#34d399" : order.status === "approved" ? "#c4b5fd" : order.status === "pending" ? "#fbbf24" : "#fca5a5",
                    }}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      order.status === "completed" ? "bg-emerald-500" :
                      order.status === "approved"  ? "bg-violet-500"  :
                      order.status === "pending"   ? "bg-yellow-500"  : "bg-red-500"
                    }`} />
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: textMuted }}>
                  {new Date(order.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ─── Tab scope badge ──────────────────────────────────────────────────────────

function ScopeBadge({ scope }) {
  const { isLightTheme } = useTheme();
  if (scope === "myshop") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border"
        style={{
          background: isLightTheme ? "#dbeafe" : "rgba(59,130,246,0.15)",
          color: isLightTheme ? "#1e40af" : "#93c5fd",
          borderColor: isLightTheme ? "#bfdbfe" : "rgba(59,130,246,0.3)",
        }}
      >
        <Ico d={ICONS.shop2} className="w-3 h-3" />
        My Shop Only
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border"
      style={{
        background: isLightTheme ? "#dcfce7" : "rgba(16,185,129,0.15)",
        color: isLightTheme ? "#166534" : "#34d399",
        borderColor: isLightTheme ? "#bbf7d0" : "rgba(16,185,129,0.3)",
      }}
    >
      <Ico d={ICONS.globe} className="w-3 h-3" />
      All Shops
    </span>
  );
}

// ─── Main Analytics Component ─────────────────────────────────────────────────

export default function Analytics() {
  const { theme, isLightTheme } = useTheme();

  const [analytics,        setAnalytics]        = useState(null);
  const [dashboard,        setDashboard]        = useState(null);
  const [myShopAnalytics,  setMyShopAnalytics]  = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [error,            setError]            = useState("");
  const [lastUpdated,      setLastUpdated]      = useState(null);
  const [secondsAgo,       setSecondsAgo]       = useState(0);
  const [activeTab,        setActiveTab]        = useState("myshop");
  const intervalRef = useRef(null);

  const {
    prices:      ssePrices,
    connected:   sseConnected,
    lastUpdated: sseLastUpdated,
    error:       sseError,
  } = useLivePrices('superAdmin');

  const loadAll = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const [aRes, dRes, msRes] = await Promise.allSettled([
        saAPI.getAnalytics(),
        saAPI.getDashboard(),
        saAPI.getMyShopAnalytics(),
      ]);
      if (aRes.status  === "fulfilled") setAnalytics(aRes.value?.data ?? aRes.value);
      if (dRes.status  === "fulfilled") setDashboard(dRes.value?.data ?? dRes.value);
      if (msRes.status === "fulfilled") setMyShopAnalytics(msRes.value?.data ?? msRes.value);
      if (aRes.status === "rejected" && dRes.status === "rejected" && msRes.status === "rejected") {
        setError("Failed to load analytics. Please check your connection.");
      }
      setLastUpdated(new Date());
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Unexpected error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    intervalRef.current = setInterval(() => loadAll(true), 5 * 60 * 1000);
    return () => clearInterval(intervalRef.current);
  }, [loadAll]);

  useEffect(() => {
    if (!sseLastUpdated) return;
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - sseLastUpdated.getTime()) / 1000));
    }, 1_000);
    return () => clearInterval(timer);
  }, [sseLastUpdated]);

  // ── Derived prices ────────────────────────────────────────────────────────
  const livePrices     = sseConnected && ssePrices ? ssePrices : dashboard?.livePrices;
  const liveGold       = livePrices?.gold;
  const liveSilver     = livePrices?.silver;
  const liveCurrencies = livePrices?.currencies?.adjusted ?? livePrices?.currencies ?? {};

  // ── Derived system analytics ──────────────────────────────────────────────
  const orders         = analytics?.orders    ?? {};
  const revenue        = analytics?.revenue   ?? {};
  const users          = analytics?.users     ?? {};
  const shops          = analytics?.shopPerformance ?? [];
  const priceHistory   = analytics?.priceHistory    ?? [];
  const metalBreakdown = analytics?.metalBreakdown  ?? [];

  const maxSales = Math.max(...shops.map(s => s.totalSales ?? 0), 1);

  const revenueChartData = (analytics?.monthlyTrend ?? []).map((m) => ({
    month:   MONTH_NAMES[(m._id?.month ?? 1) - 1],
    revenue: m.revenue ?? 0,
    orders:  m.count   ?? 0,
  }));

  const orderChartData = (analytics?.orderTrend ?? []).map((m) => ({
    month:     MONTH_NAMES[(m._id?.month ?? 1) - 1],
    total:     m.total     ?? 0,
    completed: m.completed ?? 0,
    pending:   m.pending   ?? 0,
    approved:  m.approved  ?? 0,
  }));

  const totalOrders = orders.total ?? 0;
  const orderStatusData = analytics ? [
    { name: "Completed",  value: orders.completed  ?? 0, color: STATUS_COLORS.completed  },
    { name: "Pending",    value: orders.pending    ?? 0, color: STATUS_COLORS.pending    },
    { name: "Approved",   value: orders.approved   ?? 0, color: STATUS_COLORS.approved   },
    { name: "Processing", value: orders.processing ?? 0, color: STATUS_COLORS.processing },
    { name: "Cancelled",  value: orders.cancelled  ?? 0, color: STATUS_COLORS.cancelled  },
    { name: "Rejected",   value: orders.rejected   ?? 0, color: "#F43F5E"               },
  ].filter(d => d.value > 0) : [];

  // ── Derived MY SHOP analytics ─────────────────────────────────────────────
  const msOrders    = myShopAnalytics?.orders    ?? {};
  const msRevenue   = myShopAnalytics?.revenue   ?? {};
  const msCustomers = myShopAnalytics?.customers ?? {};
  const shopName    = myShopAnalytics?.shopInfo?.shopName || dashboard?.shops?.find(s => s.isActive)?.shopName || "GoldChain HQ";

  const msTotalOrders     = msOrders.total     ?? 0;
  const msCompletedOrders = msOrders.completed ?? 0;
  const msPendingOrders   = msOrders.pending   ?? 0;
  const msApprovedOrders  = msOrders.approved  ?? 0;
  const msRejectedOrders  = msOrders.rejected  ?? 0;

  const msTotalRevenue   = msRevenue.totalSales     ?? 0;
  const msTotalPurchases = msRevenue.totalPurchases ?? 0;
  const msSellRevenue    = msRevenue.sellRevenue    ?? 0;
  const msBuyRevenue     = msRevenue.buyRevenue     ?? 0;
  const msSalesCount     = msRevenue.salesCount     ?? 0;
  const msPurchasesCount = msRevenue.purchasesCount ?? 0;
  const msAvgSale        = msSalesCount > 0 ? msSellRevenue / msSalesCount : 0;

  const msTotalCustomers   = msCustomers.total   ?? 0;
  const msTrustedCustomers = msCustomers.trusted ?? 0;
  const msFlaggedCustomers = msCustomers.flagged ?? 0;

  const msMonthlyData = (myShopAnalytics?.monthlyTrend ?? []).map(m => ({
    month:   MONTH_NAMES[(m._id?.month ?? 1) - 1],
    revenue: m.revenue ?? 0,
    orders:  m.count   ?? 0,
  }));

  const msOrderStatusData = myShopAnalytics ? [
    { name: "Completed", value: msCompletedOrders, color: STATUS_COLORS.completed },
    { name: "Approved",  value: msApprovedOrders,  color: STATUS_COLORS.approved  },
    { name: "Pending",   value: msPendingOrders,   color: STATUS_COLORS.pending   },
    { name: "Rejected",  value: msRejectedOrders,  color: STATUS_COLORS.rejected  },
  ].filter(d => d.value > 0) : [];

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const pageBg      = isLightTheme ? (theme.pageBg ?? "#f9fafb") : (theme.bg ?? "#0c0c0c");
  const cardBg      = isLightTheme ? (theme.cardBg ?? "#ffffff") : (theme.cardBg ?? "#1a1a1a");
  const borderColor = isLightTheme ? (theme.border ?? "#f3f4f6") : (theme.border ?? "#2a2a2a");
  const textPrimary = isLightTheme ? (theme.textPrimary ?? "#111827") : (theme.textPrimary ?? "#e5e7eb");
  const textMuted   = isLightTheme ? (theme.textMuted ?? "#6b7280") : (theme.textMuted ?? "#9ca3af");
  const gridColor   = isLightTheme ? "#F3F4F6" : "#2a2a2a";
  const tickColor   = isLightTheme ? "#9CA3AF" : "#6b7280";

  // ── Guards ────────────────────────────────────────────────────────────────
  if (loading) return <PageSpinner />;

  if (error && !analytics && !dashboard && !myShopAnalytics) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: pageBg }}>
        <div className="max-w-md w-full text-center space-y-4">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto"
            style={{ background: isLightTheme ? "#fef2f2" : "rgba(239,68,68,0.15)", color: isLightTheme ? "#ef4444" : "#fca5a5" }}
          >
            <Ico d={ICONS.alert} className="w-7 h-7" />
          </div>
          <p className="text-xl font-bold" style={{ color: textPrimary }}>Analytics unavailable</p>
          <p className="text-sm" style={{ color: textMuted }}>{error}</p>
          <button onClick={() => loadAll()} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-2xl transition">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "myshop",   label: "My Shop",     icon: ICONS.shop2   },
    { id: "overview", label: "System",      icon: ICONS.system  },
    { id: "revenue",  label: "Revenue",     icon: ICONS.revenue },
    { id: "orders",   label: "Orders",      icon: ICONS.orders  },
    { id: "shops",    label: "Shops",       icon: ICONS.shops   },
    { id: "users",    label: "Users",       icon: ICONS.users   },
    { id: "prices",   label: "Live Prices", icon: ICONS.gold    },
  ];

  // Donut tooltip helper (theme-aware)
  const DonutTooltip = (totalVal) => ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="rounded-xl px-3 py-2 text-xs shadow-md border"
        style={{ background: cardBg, borderColor, color: textPrimary }}
      >
        <p className="font-bold">{payload[0].name}</p>
        <p style={{ color: textMuted }}>{payload[0].value} orders ({pct(payload[0].value, totalVal)}%)</p>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: textPrimary }}>Analytics</h1>
              {activeTab === "myshop" && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border"
                  style={{
                    background: isLightTheme ? "#dbeafe" : "rgba(59,130,246,0.15)",
                    color: isLightTheme ? "#1e40af" : "#93c5fd",
                    borderColor: isLightTheme ? "#bfdbfe" : "rgba(59,130,246,0.3)",
                  }}
                >
                  <Ico d={ICONS.shop2} className="w-3.5 h-3.5" />
                  {shopName}
                </span>
              )}
              {activeTab === "overview" && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border"
                  style={{
                    background: isLightTheme ? "#dcfce7" : "rgba(16,185,129,0.15)",
                    color: isLightTheme ? "#166534" : "#34d399",
                    borderColor: isLightTheme ? "#bbf7d0" : "rgba(16,185,129,0.3)",
                  }}
                >
                  <Ico d={ICONS.globe} className="w-3.5 h-3.5" />
                  All {users.totalAdmins ?? 0} Shops
                </span>
              )}
            </div>
            <p className="text-sm mt-1" style={{ color: textMuted }}>
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}`
                : "Live data"} · Prices refresh every 30 seconds
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={sseConnected
                ? { background: isLightTheme ? "#dcfce7" : "rgba(16,185,129,0.15)", color: isLightTheme ? "#166534" : "#34d399" }
                : { background: isLightTheme ? "#fef2f2" : "rgba(239,68,68,0.15)", color: isLightTheme ? "#991b1b" : "#fca5a5" }
              }
            >
              <span className={`w-2 h-2 rounded-full ${sseConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
              {sseConnected ? "Live" : "Offline"}
            </span>
            {sseConnected && sseLastUpdated && (
              <span className="text-xs hidden md:block" style={{ color: textMuted }}>
                Next in <span className="font-semibold text-amber-500 font-mono">{Math.max(0, 30 - secondsAgo)}s</span>
              </span>
            )}
            {lastUpdated && (
              <p className="text-xs hidden md:block" style={{ color: textMuted }}>
                Updated: <span className="font-semibold" style={{ color: isLightTheme ? "#4b5563" : "#d1d5db" }}>
                  {lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </p>
            )}
            <button
              onClick={() => loadAll(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl border text-sm font-semibold shadow-sm transition disabled:opacity-50"
              style={{ background: cardBg, borderColor, color: textPrimary }}
            >
              <Ico d={ICONS.refresh} className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {sseError && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold border"
            style={{
              background: isLightTheme ? "#fef2f2" : "rgba(239,68,68,0.1)",
              borderColor: isLightTheme ? "#fecaca" : "rgba(239,68,68,0.3)",
              color: isLightTheme ? "#991b1b" : "#fca5a5",
            }}
          >
            <Ico d={ICONS.alert} className="w-4 h-4 shrink-0" />
            Live feed error: {sseError}
            <span className="font-normal ml-1" style={{ color: isLightTheme ? "#b91c1c" : "#f87171" }}>— prices shown may be delayed.</span>
          </div>
        )}

        {/* ── Tab navigation ── */}
        <div
          className="flex items-center gap-1 p-1 rounded-2xl w-full overflow-x-auto"
          style={{ background: isLightTheme ? "#f3f4f6" : "#1f1f1f" }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center"
              style={activeTab === tab.id
                ? {
                    background: tab.id === "myshop"
                      ? "#2563eb"
                      : tab.id === "overview"
                      ? "#059669"
                      : cardBg,
                    color: (tab.id === "myshop" || tab.id === "overview") ? "#ffffff" : textPrimary,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }
                : { background: "transparent", color: textMuted }
              }
            >
              <Ico d={tab.icon} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/*  TAB: MY SHOP                                      */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === "myshop" && (
          <>
            {/* Scope indicator */}
            <div
              className="flex items-start sm:items-center gap-3 px-4 py-3 rounded-2xl border"
              style={{
                background: isLightTheme ? "#eff6ff" : "rgba(59,130,246,0.08)",
                borderColor: isLightTheme ? "#bfdbfe" : "rgba(59,130,246,0.3)",
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: isLightTheme ? "#dbeafe" : "rgba(59,130,246,0.2)", color: isLightTheme ? "#1d4ed8" : "#93c5fd" }}
              >
                <Ico d={ICONS.shop2} className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: isLightTheme ? "#1e3a8a" : "#bfdbfe" }}>
                  {shopName} — My Shop Analytics
                </p>
                <p className="text-xs" style={{ color: isLightTheme ? "#1d4ed8" : "#93c5fd" }}>
                  Showing only your own shop's orders, customers, and revenue. Switch to <strong>System</strong> tab for platform-wide data.
                </p>
              </div>
            </div>

            {/* KPI stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total Revenue"  value={`PKR ${fmtCompact(msTotalRevenue)}`}  sub={`Avg PKR ${fmtCompact(msAvgSale)}/sale`}             icon={ICONS.revenue} color="bg-amber-50 text-amber-600"   delay={0}   />
              <StatCard label="Total Orders"   value={fmt(msTotalOrders)}                   sub={`${pct(msCompletedOrders, msTotalOrders)}% completion`} icon={ICONS.orders}  color="bg-violet-50 text-violet-600" delay={50}  />
              <StatCard label="Completed"      value={fmt(msCompletedOrders)}               sub={`${pct(msCompletedOrders, msTotalOrders)}% of all`}     icon={ICONS.check}   color="bg-emerald-50 text-emerald-600" delay={100} />
              <StatCard label="Customers"      value={fmt(msTotalCustomers)}                sub={`${msTrustedCustomers} trusted · ${msFlaggedCustomers} flagged`} icon={ICONS.users} color="bg-blue-50 text-blue-600" delay={150} />
            </div>

            {/* Revenue breakdown */}
            <div>
              <SectionLabel dot="amber">Revenue Breakdown — My Shop (Completed Orders Only)</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <RevCard label="Today's Revenue"      total={msRevenue.daily?.total ?? 0}   count={msRevenue.daily?.count ?? 0}   buyRev={msRevenue.daily?.buyRevenue ?? 0}   sellRev={msRevenue.daily?.sellRevenue ?? 0}   accent="amber"   />
                <RevCard label="This Week's Revenue"  total={msRevenue.weekly?.total ?? 0}  count={msRevenue.weekly?.count ?? 0}  buyRev={msRevenue.weekly?.buyRevenue ?? 0}  sellRev={msRevenue.weekly?.sellRevenue ?? 0}  accent="emerald" />
                <RevCard label="This Month's Revenue" total={msRevenue.monthly?.total ?? 0} count={msRevenue.monthly?.count ?? 0} buyRev={msRevenue.monthly?.buyRevenue ?? 0} sellRev={msRevenue.monthly?.sellRevenue ?? 0} accent="blue"    />
              </div>
            </div>

            {/* Order period breakdown */}
            <div>
              <SectionLabel dot="violet">Order Activity by Period — My Shop</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <OrderPeriodCard label="Today"      completed={msOrders.daily?.completed ?? 0}   approved={msOrders.daily?.approved ?? 0}   pending={msOrders.daily?.pending ?? 0}   rejected={msOrders.daily?.rejected ?? 0}   cancelled={msOrders.daily?.cancelled ?? 0}   />
                <OrderPeriodCard label="This Week"  completed={msOrders.weekly?.completed ?? 0}  approved={msOrders.weekly?.approved ?? 0}  pending={msOrders.weekly?.pending ?? 0}  rejected={msOrders.weekly?.rejected ?? 0}  cancelled={msOrders.weekly?.cancelled ?? 0}  />
                <OrderPeriodCard label="This Month" completed={msOrders.monthly?.completed ?? 0} approved={msOrders.monthly?.approved ?? 0} pending={msOrders.monthly?.pending ?? 0} rejected={msOrders.monthly?.rejected ?? 0} cancelled={msOrders.monthly?.cancelled ?? 0} />
              </div>
            </div>

            {/* All-time order status mini-cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { label: "Completed",  value: msCompletedOrders,                   color: "bg-emerald-50 text-emerald-600" },
                { label: "Approved",   value: msApprovedOrders,                    color: "bg-violet-50 text-violet-600"   },
                { label: "Pending",    value: msPendingOrders,                     color: "bg-amber-50 text-amber-600"     },
                { label: "Rejected",   value: msRejectedOrders,                    color: "bg-red-50 text-red-500"         },
                { label: "Sales Rev",  value: `PKR ${fmtCompact(msSellRevenue)}`,  color: "bg-orange-50 text-orange-600"   },
                { label: "Buy Rev",    value: `PKR ${fmtCompact(msBuyRevenue)}`,   color: "bg-blue-50 text-blue-600"       },
              ].map(({ label, value, color }, i) => (
                <StatCard key={label} label={label} value={value} icon={ICONS.orders} color={color} delay={i * 30} />
              ))}
            </div>

            {/* Revenue trend + Order volume charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <Panel className="overflow-hidden">
                <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                  <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Revenue Trend — My Shop</h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>Completed orders · Last {msMonthlyData.length} months · PKR</p>
                </div>
                <div className="p-4 sm:p-5">
                  {msMonthlyData.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-sm" style={{ color: textMuted }}>No monthly data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={msMonthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="msRevGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={fmtCompact} tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip prefix="PKR " />} />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#F59E0B" strokeWidth={2}
                          fill="url(#msRevGrad)" dot={{ r: 3, fill: "#F59E0B" }} activeDot={{ r: 5, fill: "#FBBF24" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Panel>

              <Panel className="overflow-hidden">
                <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                  <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Order Volume — My Shop</h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>All statuses · Last {msMonthlyData.length} months</p>
                </div>
                <div className="p-4 sm:p-5">
                  {msMonthlyData.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-sm" style={{ color: textMuted }}>No monthly data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={msMonthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip suffix=" orders" />} />
                        <Bar dataKey="orders" name="Orders" fill="#6366F1" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Panel>
            </div>

            {/* Weekly overview */}
            <Panel className="overflow-hidden">
              <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Weekly Overview — My Shop</h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>Sales vs Buys for the last 7 days (completed orders)</p>
              </div>
              <div className="p-4 sm:p-5">
                <WeeklyBarChart data={myShopAnalytics?.weeklyData || []} />
              </div>
            </Panel>

            {/* Daily trend */}
            <Panel className="overflow-hidden">
              <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Daily Trend — My Shop</h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>Sales vs Buys for the last 30 days (completed orders)</p>
              </div>
              <div className="p-4 sm:p-5">
                <DailyLineChart data={myShopAnalytics?.dailyData || []} />
              </div>
            </Panel>

            {/* Order status donut + Customer insights */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <Panel className="overflow-hidden">
                <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                  <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Order Status — My Shop</h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>All-time distribution</p>
                </div>
                <div className="p-4 sm:p-5">
                  {msOrderStatusData.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-sm" style={{ color: textMuted }}>No order data</div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      <div className="relative shrink-0">
                        <ResponsiveContainer width={180} height={180}>
                          <PieChart>
                            <Pie data={msOrderStatusData} cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                              paddingAngle={3} dataKey="value" strokeWidth={0}>
                              {msOrderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip content={DonutTooltip(msTotalOrders)} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-xl font-black" style={{ color: textPrimary }}>{fmt(msTotalOrders)}</p>
                          <p className="text-[10px] uppercase tracking-wider" style={{ color: textMuted }}>Total</p>
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-2.5">
                        {msOrderStatusData.map(d => (
                          <div key={d.name} className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                            <span className="text-xs flex-1" style={{ color: textMuted }}>{d.name}</span>
                            <span className="text-xs font-black" style={{ color: textPrimary }}>{fmt(d.value)}</span>
                            <span className="text-[10px] w-10 text-right" style={{ color: textMuted }}>{pct(d.value, msTotalOrders)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel className="overflow-hidden">
                <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                  <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Customer Insights — My Shop</h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>Your shop's customer base</p>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
                    {[
                      { label: "Total Customers", value: fmt(msTotalCustomers),   lightColor: "bg-blue-50   border-blue-100",   icon: ICONS.users, iconLight: "text-blue-600",    iconBg: "bg-blue-100"    },
                      { label: "Trusted",         value: fmt(msTrustedCustomers), lightColor: "bg-emerald-50 border-emerald-100",icon: ICONS.star,  iconLight: "text-emerald-600", iconBg: "bg-emerald-100" },
                      { label: "Flagged",         value: fmt(msFlaggedCustomers), lightColor: "bg-rose-50   border-rose-100",   icon: ICONS.flag,  iconLight: "text-rose-600",    iconBg: "bg-rose-100"    },
                      { label: "Sales Count",     value: fmt(msSalesCount),       lightColor: "bg-amber-50  border-amber-100",  icon: ICONS.up,    iconLight: "text-amber-600",   iconBg: "bg-amber-100"   },
                    ].map(({ label, value, lightColor, icon, iconLight, iconBg }) => (
                      <div
                        key={label}
                        className={`rounded-xl p-3 sm:p-4 text-center border ${isLightTheme ? lightColor : ""}`}
                        style={!isLightTheme ? { background: "#1f1f1f", borderColor: "#2a2a2a" } : {}}
                      >
                        <div className={`w-8 h-8 rounded-lg ${isLightTheme ? iconBg : ""} flex items-center justify-center mx-auto mb-2`}
                          style={!isLightTheme ? { background: "#2a2a2a" } : {}}>
                          <Ico d={icon} className={`w-4 h-4 ${isLightTheme ? iconLight : ""}`} style={!isLightTheme ? { color: "#9ca3af" } : {}} />
                        </div>
                        <p className="text-xl sm:text-2xl font-black" style={{ color: textPrimary }}>{value}</p>
                        <p className="text-xs" style={{ color: textMuted }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Trusted Customers", val: msTrustedCustomers, total: msTotalCustomers, color: "#10B981" },
                      { label: "Flagged Customers",  val: msFlaggedCustomers, total: msTotalCustomers, color: "#EF4444" },
                      { label: "Completion Rate",    val: msCompletedOrders,  total: msTotalOrders,    color: "#8B5CF6" },
                    ].map(({ label, val, total, color }) => {
                      const p = total > 0 ? (val / total) * 100 : 0;
                      return (
                        <div key={label}>
                          <div className="flex justify-between mb-1.5">
                            <span className="text-xs font-semibold" style={{ color: textMuted }}>{label}</span>
                            <span className="text-xs font-black" style={{ color: textPrimary }}>
                              {fmt(val)} <span className="font-normal" style={{ color: textMuted }}>/ {fmt(total)}</span>
                            </span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: isLightTheme ? "#f3f4f6" : "#2a2a2a" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Panel>
            </div>

            {/* Sales vs Purchases performance */}
            <div>
              <SectionLabel dot="emerald">Sales &amp; Purchase Performance — My Shop</SectionLabel>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div
                  className="rounded-2xl border p-5 sm:p-6"
                  style={isLightTheme
                    ? { background: "linear-gradient(135deg,#fffbeb,#fef3c7)", borderColor: "#fde68a" }
                    : { background: "rgba(217,119,6,0.08)", borderColor: "rgba(217,119,6,0.3)" }
                  }
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: isLightTheme ? "rgba(255,255,255,0.8)" : "rgba(217,119,6,0.2)", color: isLightTheme ? "#d97706" : "#fbbf24" }}
                    >
                      <Ico d={ICONS.up} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest" style={{ color: isLightTheme ? "#d97706" : "#f59e0b" }}>Sales Performance</p>
                      <p className="text-xl sm:text-2xl font-black" style={{ color: textPrimary }}>PKR {fmtCompact(msSellRevenue)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs" style={{ color: textMuted }}>Transactions</p>
                      <p className="text-lg sm:text-xl font-bold" style={{ color: textPrimary }}>{msSalesCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: textMuted }}>Average Sale</p>
                      <p className="text-lg sm:text-xl font-bold" style={{ color: textPrimary }}>PKR {fmt(msAvgSale)}</p>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-2xl border p-5 sm:p-6"
                  style={isLightTheme
                    ? { background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", borderColor: "#ddd6fe" }
                    : { background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.3)" }
                  }
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: isLightTheme ? "rgba(255,255,255,0.8)" : "rgba(139,92,246,0.2)", color: isLightTheme ? "#7c3aed" : "#c4b5fd" }}
                    >
                      <Ico d={ICONS.down} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest" style={{ color: isLightTheme ? "#7c3aed" : "#c4b5fd" }}>Purchase Performance</p>
                      <p className="text-xl sm:text-2xl font-black" style={{ color: textPrimary }}>PKR {fmtCompact(msBuyRevenue)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs" style={{ color: textMuted }}>Transactions</p>
                      <p className="text-lg sm:text-xl font-bold" style={{ color: textPrimary }}>{msPurchasesCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: textMuted }}>Avg Purchase</p>
                      <p className="text-lg sm:text-xl font-bold" style={{ color: textPrimary }}>
                        PKR {fmt(msPurchasesCount > 0 ? msTotalPurchases / msPurchasesCount : 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* My Shop system summary */}
            <Panel className="overflow-hidden">
              <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Shop Summary — {shopName}</h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>All-time totals for your shop only</p>
              </div>
              <div className="px-4 sm:px-6 pb-2">
                {[
                  { label: "Total Revenue (All-time)", val: `PKR ${fmt(msTotalRevenue)}`,   icon: ICONS.revenue, color: "text-amber-500"   },
                  { label: "Total Sales Revenue",      val: `PKR ${fmt(msSellRevenue)}`,    icon: ICONS.trend,   color: "text-emerald-500" },
                  { label: "Total Purchase Revenue",   val: `PKR ${fmt(msTotalPurchases)}`, icon: ICONS.trend,   color: "text-blue-500"    },
                  { label: "Average Sale Value",       val: `PKR ${fmt(msAvgSale)}`,        icon: ICONS.orders,  color: "text-violet-500"  },
                  { label: "Completion Rate",          val: `${pct(msCompletedOrders, msTotalOrders)}%`, icon: ICONS.check, color: "text-emerald-500" },
                  { label: "Total Customers",          val: fmt(msTotalCustomers),          icon: ICONS.users,   color: "text-slate-500"   },
                  { label: "Trusted Customers",        val: fmt(msTrustedCustomers),        icon: ICONS.star,    color: "text-emerald-500" },
                  { label: "Flagged Customers",        val: fmt(msFlaggedCustomers),        icon: ICONS.flag,    color: "text-rose-500"    },
                  { label: "Total Orders",             val: fmt(msTotalOrders),             icon: ICONS.orders,  color: "text-gray-500"    },
                  { label: "Pending Orders",           val: fmt(msPendingOrders),           icon: ICONS.alert,   color: "text-amber-500"   },
                ].map(({ label, val, icon, color }, i) => (
                  <div key={label} className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t" : ""}`} style={i > 0 ? { borderColor } : {}}>
                    <span className={color}><Ico d={icon} className="w-4 h-4" /></span>
                    <span className="text-xs flex-1" style={{ color: textMuted }}>{label}</span>
                    <span className="text-xs font-black" style={{ color: textPrimary }}>{val}</span>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Recent orders */}
            <RecentOrdersTable orders={myShopAnalytics?.recentOrders} />
          </>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/*  TAB: SYSTEM (was OVERVIEW)                        */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <>
            {/* Scope indicator */}
            <div
              className="flex items-start sm:items-center gap-3 px-4 py-3 rounded-2xl border"
              style={{
                background: isLightTheme ? "#f0fdf4" : "rgba(16,185,129,0.08)",
                borderColor: isLightTheme ? "#bbf7d0" : "rgba(16,185,129,0.3)",
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: isLightTheme ? "#dcfce7" : "rgba(16,185,129,0.2)", color: isLightTheme ? "#16a34a" : "#34d399" }}
              >
                <Ico d={ICONS.globe} className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: isLightTheme ? "#14532d" : "#bbf7d0" }}>System-Wide Analytics — All Shops</p>
                <p className="text-xs" style={{ color: isLightTheme ? "#16a34a" : "#34d399" }}>
                  Aggregated across all {users.totalAdmins ?? 0} shops including your own. For your shop only, use the <strong>My Shop</strong> tab.
                </p>
              </div>
            </div>

            {/* KPI stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total Revenue"  value={`PKR ${fmtCompact(revenue.total ?? 0)}`}              sub={`Avg PKR ${fmtCompact(revenue.avgPerOrder ?? 0)}/order`} icon={ICONS.revenue} color="bg-amber-50 text-amber-600"   delay={0}   />
              <StatCard label="Total Orders"   value={fmt(totalOrders)}                                      sub={`${pct(orders.completed ?? 0, totalOrders)}% completion`} icon={ICONS.orders}  color="bg-violet-50 text-violet-600" delay={50}  />
              <StatCard label="Shop Admins"    value={`${users.activeAdmins ?? 0}/${users.totalAdmins ?? 0}`} sub={`${users.inactiveAdmins ?? 0} inactive`}               icon={ICONS.shops}   color="bg-blue-50 text-blue-600"     delay={100} />
              <StatCard label="Customers"      value={fmt(users.totalCustomers ?? 0)}                        sub={`${users.approvedCustomers ?? 0} approved`}               icon={ICONS.users}   color="bg-emerald-50 text-emerald-600" delay={150} />
            </div>

            {/* Quick-glance all-time order status row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { label: "Completed",  value: orders.completed  ?? 0, color: "bg-emerald-50 text-emerald-600", icon: ICONS.check    },
                { label: "Pending",    value: orders.pending    ?? 0, color: "bg-amber-50 text-amber-600",     icon: ICONS.clock    },
                { label: "Approved",   value: orders.approved   ?? 0, color: "bg-violet-50 text-violet-600",   icon: ICONS.check    },
                { label: "Processing", value: orders.processing ?? 0, color: "bg-blue-50 text-blue-600",       icon: ICONS.activity },
                { label: "Cancelled",  value: orders.cancelled  ?? 0, color: "bg-red-50 text-red-500",         icon: ICONS.cancel   },
                { label: "Rejected",   value: orders.rejected   ?? 0, color: "bg-rose-50 text-rose-500",       icon: ICONS.cancel   },
              ].map(({ label, value, color, icon }, i) => (
                <StatCard key={label} label={label} value={fmt(value)} icon={icon} color={color} delay={i * 30} />
              ))}
            </div>

            {/* System health + Order funnel */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <SystemHealthScore orders={orders} revenue={revenue} users={users} />
              <OrderFunnel orders={orders} />
            </div>

            {/* Revenue trend + Order volume */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <Panel className="overflow-hidden">
                <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                  <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Revenue Trend — All Shops</h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>Completed orders only · Last {revenueChartData.length} months · PKR</p>
                </div>
                <div className="p-4 sm:p-5">
                  {revenueChartData.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-sm" style={{ color: textMuted }}>No monthly data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={fmtCompact} tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip prefix="PKR " />} />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2}
                          fill="url(#revGrad)" dot={{ r: 3, fill: "#10B981" }} activeDot={{ r: 5, fill: "#34D399" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Panel>

              <Panel className="overflow-hidden">
                <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                  <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Order Volume — All Shops</h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>All statuses · Last {orderChartData.length} months</p>
                </div>
                <div className="p-4 sm:p-5">
                  {orderChartData.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-sm" style={{ color: textMuted }}>No monthly data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={orderChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip suffix=" orders" />} />
                        <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[0,0,0,0]} stackId="a" />
                        <Bar dataKey="approved"  name="Approved"  fill="#8B5CF6" radius={[0,0,0,0]} stackId="a" />
                        <Bar dataKey="pending"   name="Pending"   fill="#F59E0B" radius={[3,3,0,0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Panel>
            </div>

            {/* Donut + Shop leaderboard */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <Panel className="overflow-hidden">
                <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                  <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Order Status Breakdown — All Shops</h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>All-time distribution</p>
                </div>
                <div className="p-4 sm:p-5">
                  {orderStatusData.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-sm" style={{ color: textMuted }}>No order data</div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      <div className="relative shrink-0">
                        <ResponsiveContainer width={180} height={180}>
                          <PieChart>
                            <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                              paddingAngle={3} dataKey="value" strokeWidth={0}>
                              {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip content={DonutTooltip(totalOrders)} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-xl font-black" style={{ color: textPrimary }}>{fmt(totalOrders)}</p>
                          <p className="text-[10px] uppercase tracking-wider" style={{ color: textMuted }}>Total</p>
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-2.5">
                        {orderStatusData.map((d) => (
                          <div key={d.name} className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                            <span className="text-xs flex-1" style={{ color: textMuted }}>{d.name}</span>
                            <span className="text-xs font-black" style={{ color: textPrimary }}>{fmt(d.value)}</span>
                            <span className="text-[10px] w-10 text-right" style={{ color: textMuted }}>{pct(d.value, totalOrders)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel className="overflow-hidden">
                <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                  <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Shop Performance — All Shops</h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>Ranked by total sales revenue</p>
                </div>
                <div className="px-4 sm:px-6 pb-5">
                  {shops.length === 0 ? (
                    <div className="py-10 text-center text-sm" style={{ color: textMuted }}>No shop data</div>
                  ) : (
                    shops
                      .sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0))
                      .slice(0, 6)
                      .map((shop, i) => <ShopRow key={shop._id ?? i} shop={shop} maxSales={maxSales} index={i} />)
                  )}
                </div>
              </Panel>
            </div>

            {/* Metal breakdown */}
            <Panel className="overflow-hidden">
              <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Metal Type Breakdown — All Shops</h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>Completed orders by metal</p>
              </div>
              <div className="px-4 sm:px-6 pb-5">
                {metalBreakdown.length === 0 ? (
                  <div className="py-10 text-center text-sm" style={{ color: textMuted }}>No completed orders yet</div>
                ) : (
                  metalBreakdown.map((m, i) => {
                    const totalRev   = metalBreakdown.reduce((s, x) => s + (x.revenue ?? 0), 0);
                    const pctVal     = totalRev > 0 ? ((m.revenue / totalRev) * 100).toFixed(1) : "0";
                    const colors     = { gold: "#F59E0B", silver: "#94A3B8", currency: "#6366F1" };
                    const bgColorsL  = { gold: "bg-amber-50", silver: "bg-slate-50", currency: "bg-violet-50" };
                    const bgColorsD  = { gold: "rgba(245,158,11,0.15)", silver: "rgba(100,116,139,0.15)", currency: "rgba(99,102,241,0.15)" };
                    const textColorsL = { gold: "text-amber-700", silver: "text-slate-600", currency: "text-violet-700" };
                    const textColorsD = { gold: "#fbbf24", silver: "#94a3b8", currency: "#a5b4fc" };
                    return (
                      <div key={m._id ?? i} className={`py-4 ${i > 0 ? "border-t" : ""}`} style={i > 0 ? { borderColor } : {}}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-7 h-7 rounded-lg ${isLightTheme ? (bgColorsL[m._id] ?? "bg-gray-50") : ""} flex items-center justify-center`}
                              style={!isLightTheme ? { background: bgColorsD[m._id] ?? "rgba(107,114,128,0.15)" } : {}}
                            >
                              <span className="text-sm capitalize font-black" style={{ color: colors[m._id] ?? "#6B7280" }}>
                                {(m._id ?? "?")[0].toUpperCase()}
                              </span>
                            </span>
                            <span
                              className={`text-xs font-bold capitalize ${isLightTheme ? (textColorsL[m._id] ?? "text-gray-700") : ""}`}
                              style={!isLightTheme ? { color: textColorsD[m._id] ?? "#d1d5db" } : {}}
                            >
                              {m._id ?? "Unknown"}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black" style={{ color: textPrimary }}>PKR {fmtCompact(m.revenue ?? 0)}</p>
                            <p className="text-[10px]" style={{ color: textMuted }}>{m.count} orders · {pctVal}%</p>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isLightTheme ? "#f3f4f6" : "#2a2a2a" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pctVal}%`, background: colors[m._id] ?? "#9CA3AF" }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Panel>
          </>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/*  TAB: REVENUE                                      */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === "revenue" && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <ScopeBadge scope="system" />
              <p className="text-xs" style={{ color: textMuted }}>Revenue figures below are system-wide (all shops combined)</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <RevenueSplitCard sellRevenue={revenue.sellRevenue} buyRevenue={revenue.buyRevenue} />
              <Panel className="overflow-hidden">
                <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                  <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Revenue Summary — All Shops</h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>All-time platform revenue</p>
                </div>
                <div className="px-4 sm:px-6 pb-2">
                  {[
                    { label: "Total Revenue (All-time)", val: `PKR ${fmt(revenue.total ?? 0)}`,       icon: ICONS.revenue, color: "text-amber-500"   },
                    { label: "Sell Revenue",             val: `PKR ${fmt(revenue.sellRevenue ?? 0)}`, icon: ICONS.up,      color: "text-emerald-500" },
                    { label: "Buy Revenue",              val: `PKR ${fmt(revenue.buyRevenue ?? 0)}`,  icon: ICONS.down,    color: "text-blue-500"    },
                    { label: "Average Order Value",      val: `PKR ${fmt(revenue.avgPerOrder ?? 0)}`, icon: ICONS.scale,   color: "text-violet-500"  },
                    { label: "Completed Orders",         val: fmt(orders.completed ?? 0),            icon: ICONS.check,   color: "text-emerald-500" },
                    { label: "Completion Rate",          val: `${pct(orders.completed ?? 0, totalOrders)}%`, icon: ICONS.trend, color: "text-amber-500" },
                  ].map(({ label, val, icon, color }, i) => (
                    <div key={label} className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t" : ""}`} style={i > 0 ? { borderColor } : {}}>
                      <span className={color}><Ico d={icon} className="w-4 h-4" /></span>
                      <span className="text-xs flex-1" style={{ color: textMuted }}>{label}</span>
                      <span className="text-xs font-black" style={{ color: textPrimary }}>{val}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            {/* My shop revenue comparison */}
            <Panel className="overflow-hidden">
              <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>My Shop vs System Revenue</h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>How your shop contributes to the platform total</p>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: "System Total",
                    val: revenue.total ?? 0,
                    sub: "All shops combined",
                    lightStyle: { background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderColor: "#bbf7d0" },
                    darkStyle:  { background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)" },
                    textColor: isLightTheme ? "#166534" : "#34d399",
                  },
                  {
                    label: shopName,
                    val: msTotalRevenue,
                    sub: "Your shop only",
                    lightStyle: { background: "linear-gradient(135deg,#eff6ff,#dbeafe)", borderColor: "#bfdbfe" },
                    darkStyle:  { background: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.3)" },
                    textColor: isLightTheme ? "#1e40af" : "#93c5fd",
                  },
                  {
                    label: "Your Share",
                    val: null,
                    display: `${pct(msTotalRevenue, revenue.total ?? 0)}%`,
                    sub: "of system revenue",
                    lightStyle: { background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", borderColor: "#ddd6fe" },
                    darkStyle:  { background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.3)" },
                    textColor: isLightTheme ? "#5b21b6" : "#c4b5fd",
                  },
                ].map(({ label, val, display, sub, lightStyle, darkStyle, textColor }) => (
                  <div key={label} className="rounded-2xl p-5 border" style={isLightTheme ? lightStyle : darkStyle}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: textMuted }}>{label}</p>
                    <p className="text-xl sm:text-2xl font-black leading-none" style={{ color: textColor }}>
                      {display ?? `PKR ${fmtCompact(val)}`}
                    </p>
                    <p className="text-xs mt-1" style={{ color: textMuted }}>{sub}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <div>
              <SectionLabel dot="amber">Revenue by Period (Completed Orders — All Shops)</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <RevCard label="Today's Revenue"       total={revenue.daily?.total ?? 0}   count={revenue.daily?.count ?? 0}   buyRev={revenue.daily?.buyRevenue ?? 0}   sellRev={revenue.daily?.sellRevenue ?? 0}   accent="amber"   />
                <RevCard label="This Week's Revenue"   total={revenue.weekly?.total ?? 0}  count={revenue.weekly?.count ?? 0}  buyRev={revenue.weekly?.buyRevenue ?? 0}  sellRev={revenue.weekly?.sellRevenue ?? 0}  accent="emerald" />
                <RevCard label="This Month's Revenue"  total={revenue.monthly?.total ?? 0} count={revenue.monthly?.count ?? 0} buyRev={revenue.monthly?.buyRevenue ?? 0} sellRev={revenue.monthly?.sellRevenue ?? 0} accent="blue"    />
              </div>
            </div>

            <Panel className="overflow-hidden">
              <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Revenue Trend (Last 6 Months) — All Shops</h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>Completed orders only · PKR</p>
              </div>
              <div className="p-4 sm:p-5">
                {revenueChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm" style={{ color: textMuted }}>No monthly data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={revenueChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={fmtCompact} tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip prefix="PKR " />} />
                      <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2.5}
                        fill="url(#revGrad2)" dot={{ r: 4, fill: "#10B981" }} activeDot={{ r: 6, fill: "#34D399" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Panel>

            <Panel className="overflow-hidden">
              <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Shop Revenue Leaderboard</h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>All shops ranked by sales revenue</p>
              </div>
              <div className="px-4 sm:px-6 pb-5">
                {shops.length === 0 ? (
                  <div className="py-10 text-center text-sm" style={{ color: textMuted }}>No shop data</div>
                ) : (
                  shops
                    .sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0))
                    .map((shop, i) => (
                      <div key={shop._id ?? i} className={`flex items-center gap-4 py-3 ${i > 0 ? "border-t" : ""}`} style={i > 0 ? { borderColor } : {}}>
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
                          style={{ background: isLightTheme ? "#fffbeb" : "rgba(245,158,11,0.15)", color: isLightTheme ? "#d97706" : "#fbbf24" }}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-black truncate" style={{ color: textPrimary }}>{shop.shopName}</p>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                              style={shop.isActive
                                ? { background: isLightTheme ? "#dcfce7" : "rgba(16,185,129,0.15)", color: isLightTheme ? "#166534" : "#34d399" }
                                : { background: isLightTheme ? "#f3f4f6" : "#2a2a2a", color: isLightTheme ? "#9ca3af" : "#6b7280" }
                              }
                            >
                              {shop.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: isLightTheme ? "#f3f4f6" : "#2a2a2a" }}>
                            <div className="h-full rounded-full bg-amber-500 transition-all duration-700"
                              style={{ width: `${maxSales > 0 ? (shop.totalSales / maxSales) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-0.5">
                          <p className="text-xs font-black text-amber-500">PKR {fmtCompact(shop.totalSales ?? 0)}</p>
                          <p className="text-[10px] text-blue-400">Buy: PKR {fmtCompact(shop.totalPurchases ?? 0)}</p>
                          <p className="text-[10px]" style={{ color: textMuted }}>{shop.salesCount ?? 0} sales · {shop.purchasesCount ?? 0} purchases</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </Panel>
          </>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/*  TAB: ORDERS                                       */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <ScopeBadge scope="system" />
              <p className="text-xs" style={{ color: textMuted }}>All order counts below are system-wide across all shops</p>
            </div>

            <div>
              <SectionLabel dot="violet">Order Activity by Period — All Shops</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <OrderPeriodCard label="Today"      completed={orders.daily?.completed ?? 0}   pending={orders.daily?.pending ?? 0}   approved={orders.daily?.approved ?? 0}   cancelled={orders.daily?.cancelled ?? 0}   rejected={orders.daily?.rejected ?? 0}   processing={orders.daily?.processing ?? 0}   />
                <OrderPeriodCard label="This Week"  completed={orders.weekly?.completed ?? 0}  pending={orders.weekly?.pending ?? 0}  approved={orders.weekly?.approved ?? 0}  cancelled={orders.weekly?.cancelled ?? 0}  rejected={orders.weekly?.rejected ?? 0}  processing={orders.weekly?.processing ?? 0}  />
                <OrderPeriodCard label="This Month" completed={orders.monthly?.completed ?? 0} pending={orders.monthly?.pending ?? 0} approved={orders.monthly?.approved ?? 0} cancelled={orders.monthly?.cancelled ?? 0} rejected={orders.monthly?.rejected ?? 0} processing={orders.monthly?.processing ?? 0} />
              </div>
            </div>

            <div>
              <SectionLabel dot="slate">All-time Order Counts — All Shops</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {[
                  { label: "Completed",  value: orders.completed  ?? 0, color: "bg-emerald-50 text-emerald-600", icon: ICONS.check    },
                  { label: "Approved",   value: orders.approved   ?? 0, color: "bg-violet-50 text-violet-600",   icon: ICONS.check    },
                  { label: "Pending",    value: orders.pending    ?? 0, color: "bg-amber-50 text-amber-600",     icon: ICONS.clock    },
                  { label: "Processing", value: orders.processing ?? 0, color: "bg-blue-50 text-blue-600",       icon: ICONS.activity },
                  { label: "Cancelled",  value: orders.cancelled  ?? 0, color: "bg-red-50 text-red-500",         icon: ICONS.cancel   },
                  { label: "Rejected",   value: orders.rejected   ?? 0, color: "bg-rose-50 text-rose-500",       icon: ICONS.cancel   },
                ].map(({ label, value, color, icon }, i) => (
                  <StatCard key={label} label={label} value={fmt(value)} icon={icon} color={color} delay={i * 30} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <OrderFunnel orders={orders} />
              <Panel className="overflow-hidden">
                <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                  <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Order Status Distribution — All Shops</h3>
                  <p className="text-xs mt-0.5" style={{ color: textMuted }}>All-time · Including rejected &amp; cancelled</p>
                </div>
                <div className="p-4 sm:p-5">
                  {orderStatusData.length === 0 ? (
                    <div className="h-52 flex items-center justify-center text-sm" style={{ color: textMuted }}>No order data</div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      <div className="relative shrink-0">
                        <ResponsiveContainer width={180} height={180}>
                          <PieChart>
                            <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                              paddingAngle={3} dataKey="value" strokeWidth={0}>
                              {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip content={DonutTooltip(totalOrders)} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <p className="text-xl font-black" style={{ color: textPrimary }}>{fmt(totalOrders)}</p>
                          <p className="text-[10px] uppercase tracking-wider" style={{ color: textMuted }}>Total</p>
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-2.5">
                        {orderStatusData.map((d) => (
                          <div key={d.name} className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                            <span className="text-xs flex-1" style={{ color: textMuted }}>{d.name}</span>
                            <span className="text-xs font-black" style={{ color: textPrimary }}>{fmt(d.value)}</span>
                            <span className="text-[10px] w-10 text-right" style={{ color: textMuted }}>{pct(d.value, totalOrders)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            </div>

            <Panel className="overflow-hidden">
              <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Order Volume Trend — All Shops</h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>All statuses · Last {orderChartData.length} months</p>
              </div>
              <div className="p-4 sm:p-5">
                {orderChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm" style={{ color: textMuted }}>No monthly data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={orderChartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="month" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip suffix=" orders" />} />
                      <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[0,0,0,0]} stackId="a" />
                      <Bar dataKey="approved"  name="Approved"  fill="#8B5CF6" radius={[0,0,0,0]} stackId="a" />
                      <Bar dataKey="pending"   name="Pending"   fill="#F59E0B" radius={[3,3,0,0]} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Panel>

            <Panel className="overflow-hidden">
              <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Metal Type Breakdown — All Shops</h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>Completed orders by metal type</p>
              </div>
              <div className="px-4 sm:px-6 pb-5">
                {metalBreakdown.length === 0 ? (
                  <div className="py-10 text-center text-sm" style={{ color: textMuted }}>No completed orders yet</div>
                ) : (
                  metalBreakdown.map((m, i) => {
                    const totalRev   = metalBreakdown.reduce((s, x) => s + (x.revenue ?? 0), 0);
                    const pctVal     = totalRev > 0 ? ((m.revenue / totalRev) * 100).toFixed(1) : "0";
                    const colors     = { gold: "#F59E0B", silver: "#94A3B8", currency: "#6366F1" };
                    const bgColorsL  = { gold: "bg-amber-50", silver: "bg-slate-50", currency: "bg-violet-50" };
                    const bgColorsD  = { gold: "rgba(245,158,11,0.15)", silver: "rgba(100,116,139,0.15)", currency: "rgba(99,102,241,0.15)" };
                    const textColorsL = { gold: "text-amber-700", silver: "text-slate-600", currency: "text-violet-700" };
                    const textColorsD = { gold: "#fbbf24", silver: "#94a3b8", currency: "#a5b4fc" };
                    return (
                      <div key={m._id ?? i} className={`py-4 ${i > 0 ? "border-t" : ""}`} style={i > 0 ? { borderColor } : {}}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-7 h-7 rounded-lg ${isLightTheme ? (bgColorsL[m._id] ?? "bg-gray-50") : ""} flex items-center justify-center`}
                              style={!isLightTheme ? { background: bgColorsD[m._id] ?? "rgba(107,114,128,0.15)" } : {}}
                            >
                              <span className="text-sm capitalize font-black" style={{ color: colors[m._id] ?? "#6B7280" }}>
                                {(m._id ?? "?")[0].toUpperCase()}
                              </span>
                            </span>
                            <span
                              className={`text-xs font-bold capitalize ${isLightTheme ? (textColorsL[m._id] ?? "text-gray-700") : ""}`}
                              style={!isLightTheme ? { color: textColorsD[m._id] ?? "#d1d5db" } : {}}
                            >
                              {m._id ?? "Unknown"}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black" style={{ color: textPrimary }}>PKR {fmtCompact(m.revenue ?? 0)}</p>
                            <p className="text-[10px]" style={{ color: textMuted }}>{m.count} orders · {pctVal}%</p>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isLightTheme ? "#f3f4f6" : "#2a2a2a" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pctVal}%`, background: colors[m._id] ?? "#9CA3AF" }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Panel>
          </>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/*  TAB: SHOPS                                        */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === "shops" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total Shops"    value={fmt(users.totalAdmins    ?? 0)} sub="All registered"    icon={ICONS.shops}   color="bg-blue-50 text-blue-600"       delay={0}   />
              <StatCard label="Active Shops"   value={fmt(users.activeAdmins   ?? 0)} sub="Currently active"  icon={ICONS.check}   color="bg-emerald-50 text-emerald-600" delay={50}  />
              <StatCard label="Inactive Shops" value={fmt(users.inactiveAdmins ?? 0)} sub="Disabled"          icon={ICONS.alert}   color="bg-red-50 text-red-500"         delay={100} />
              <StatCard label="Avg Rev/Shop"   value={`PKR ${fmtCompact(users.totalAdmins > 0 ? (revenue.total ?? 0) / users.totalAdmins : 0)}`} sub="All-time average" icon={ICONS.revenue} color="bg-amber-50 text-amber-600" delay={150} />
            </div>

            <Panel className="overflow-hidden">
              <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Shop Activity Status</h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>Active vs inactive shop admins</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-3 rounded-l-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${users.totalAdmins > 0 ? (users.activeAdmins / users.totalAdmins) * 100 : 0}%`, minWidth: "4px" }} />
                  <div className="h-3 rounded-r-full bg-red-400 transition-all duration-700"
                    style={{ width: `${users.totalAdmins > 0 ? (users.inactiveAdmins / users.totalAdmins) * 100 : 0}%`, minWidth: "4px" }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="text-center p-4 rounded-2xl border"
                    style={{
                      background: isLightTheme ? "#f0fdf4" : "rgba(16,185,129,0.1)",
                      borderColor: isLightTheme ? "#bbf7d0" : "rgba(16,185,129,0.3)",
                    }}
                  >
                    <p className="text-2xl font-black" style={{ color: isLightTheme ? "#166534" : "#34d399" }}>{fmt(users.activeAdmins ?? 0)}</p>
                    <p className="text-xs font-bold mt-1" style={{ color: isLightTheme ? "#16a34a" : "#34d399" }}>Active Shops</p>
                    <p className="text-[10px]" style={{ color: textMuted }}>{pct(users.activeAdmins ?? 0, users.totalAdmins ?? 0)}%</p>
                  </div>
                  <div
                    className="text-center p-4 rounded-2xl border"
                    style={{
                      background: isLightTheme ? "#fef2f2" : "rgba(239,68,68,0.1)",
                      borderColor: isLightTheme ? "#fecaca" : "rgba(239,68,68,0.3)",
                    }}
                  >
                    <p className="text-2xl font-black" style={{ color: isLightTheme ? "#991b1b" : "#f87171" }}>{fmt(users.inactiveAdmins ?? 0)}</p>
                    <p className="text-xs font-bold mt-1" style={{ color: isLightTheme ? "#dc2626" : "#fca5a5" }}>Inactive Shops</p>
                    <p className="text-[10px]" style={{ color: textMuted }}>{pct(users.inactiveAdmins ?? 0, users.totalAdmins ?? 0)}%</p>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel className="overflow-hidden">
              <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>All Shops Performance</h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>Complete breakdown of every shop</p>
              </div>
              {shops.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: textMuted }}>No shop data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead style={{ background: isLightTheme ? "#f9fafb" : "#1f1f1f", borderBottom: `1px solid ${borderColor}` }}>
                      <tr>
                        {["#","Shop Name","Status","Sales Rev","Buy Rev","Sales","Purchases"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: textMuted }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shops
                        .sort((a, b) => (b.totalSales ?? 0) - (a.totalSales ?? 0))
                        .map((shop, i) => (
                          <tr
                            key={shop._id ?? i}
                            className="transition-colors"
                            style={{ borderTop: `1px solid ${borderColor}`, background: i % 2 === 0 ? "transparent" : (isLightTheme ? "rgba(249,250,251,0.5)" : "rgba(31,31,31,0.5)") }}
                          >
                            <td className="px-4 py-3 text-xs font-bold" style={{ color: textMuted }}>{i + 1}</td>
                            <td className="px-4 py-3 font-bold" style={{ color: textPrimary }}>{shop.shopName}</td>
                            <td className="px-4 py-3">
                              <span
                                className="inline-flex px-2 py-0.5 rounded-lg text-xs font-bold"
                                style={shop.isActive
                                  ? { background: isLightTheme ? "#dcfce7" : "rgba(16,185,129,0.15)", color: isLightTheme ? "#166534" : "#34d399" }
                                  : { background: isLightTheme ? "#f3f4f6" : "#2a2a2a", color: isLightTheme ? "#6b7280" : "#9ca3af" }
                                }
                              >
                                {shop.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold text-amber-500">PKR {fmtCompact(shop.totalSales ?? 0)}</td>
                            <td className="px-4 py-3 font-bold text-blue-400">PKR {fmtCompact(shop.totalPurchases ?? 0)}</td>
                            <td className="px-4 py-3 font-semibold" style={{ color: textPrimary }}>{fmt(shop.salesCount ?? 0)}</td>
                            <td className="px-4 py-3 font-semibold" style={{ color: textPrimary }}>{fmt(shop.purchasesCount ?? 0)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          </>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/*  TAB: USERS                                        */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <ScopeBadge scope="system" />
              <p className="text-xs" style={{ color: textMuted }}>User counts are system-wide across all shops</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total Customers"    value={fmt(users.totalCustomers    ?? 0)} sub="Registered on platform"      icon={ICONS.users} color="bg-blue-50 text-blue-600"       delay={0}   />
              <StatCard label="Approved Customers" value={fmt(users.approvedCustomers ?? 0)} sub="Can place orders"            icon={ICONS.check} color="bg-emerald-50 text-emerald-600" delay={50}  />
              <StatCard label="Pending Customers"  value={fmt(users.pendingCustomers  ?? 0)} sub="Awaiting approval"           icon={ICONS.clock} color="bg-amber-50 text-amber-600"     delay={100} />
              <StatCard label="Total Admins"       value={fmt(users.totalAdmins       ?? 0)} sub={`${users.activeAdmins ?? 0} active`} icon={ICONS.shops} color="bg-violet-50 text-violet-600" delay={150} />
            </div>

            <Panel className="overflow-hidden">
              <div className="px-4 sm:px-6 py-5 border-b" style={{ borderColor }}>
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>User Activity Breakdown</h3>
                <p className="text-xs mt-0.5" style={{ color: textMuted }}>Admin &amp; Customer status ratios</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { label: "Active Admins",      val: users.activeAdmins     ?? 0, total: users.totalAdmins    ?? 0, color: "#10B981" },
                    { label: "Inactive Admins",    val: users.inactiveAdmins   ?? 0, total: users.totalAdmins    ?? 0, color: "#EF4444" },
                    { label: "Approved Customers", val: users.approvedCustomers?? 0, total: users.totalCustomers ?? 0, color: "#6366F1" },
                    { label: "Pending Customers",  val: users.pendingCustomers ?? 0, total: users.totalCustomers ?? 0, color: "#F59E0B" },
                  ].map(({ label, val, total, color }) => {
                    const p = total > 0 ? (val / total) * 100 : 0;
                    return (
                      <div key={label}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs font-semibold" style={{ color: textMuted }}>{label}</span>
                          <span className="text-xs font-black" style={{ color: textPrimary }}>
                            {fmt(val)} <span className="font-normal" style={{ color: textMuted }}>/ {fmt(total)}</span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: isLightTheme ? "#f3f4f6" : "#2a2a2a" }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Panel>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {[
                {
                  title: "Customer Approval Rate",
                  val: `${pct(users.approvedCustomers ?? 0, users.totalCustomers ?? 0)}%`,
                  sub: `${fmt(users.approvedCustomers ?? 0)} of ${fmt(users.totalCustomers ?? 0)} customers approved`,
                  lightStyle: { background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", borderColor: "#bbf7d0" },
                  darkStyle:  { background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.3)" },
                  textColor: isLightTheme ? "#166534" : "#34d399",
                },
                {
                  title: "Shop Activation Rate",
                  val: `${pct(users.activeAdmins ?? 0, users.totalAdmins ?? 0)}%`,
                  sub: `${fmt(users.activeAdmins ?? 0)} of ${fmt(users.totalAdmins ?? 0)} shops are active`,
                  lightStyle: { background: "linear-gradient(135deg,#eff6ff,#dbeafe)", borderColor: "#bfdbfe" },
                  darkStyle:  { background: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.3)" },
                  textColor: isLightTheme ? "#1e40af" : "#93c5fd",
                },
                {
                  title: "Customers per Shop",
                  val: users.totalAdmins > 0 ? Math.round((users.totalCustomers ?? 0) / users.totalAdmins).toString() : "0",
                  sub: "Average customers per shop",
                  lightStyle: { background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", borderColor: "#ddd6fe" },
                  darkStyle:  { background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.3)" },
                  textColor: isLightTheme ? "#5b21b6" : "#c4b5fd",
                },
              ].map(({ title, val, sub, lightStyle, darkStyle, textColor }) => (
                <div key={title} className="rounded-2xl p-5 border" style={isLightTheme ? lightStyle : darkStyle}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: textMuted }}>{title}</p>
                  <p className="text-3xl sm:text-4xl font-black leading-none" style={{ color: textColor }}>{val}</p>
                  <p className="text-xs mt-2" style={{ color: textMuted }}>{sub}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/*  TAB: LIVE PRICES                                  */}
        {/* ══════════════════════════════════════════════════ */}
        {activeTab === "prices" && (
          <>
            {(liveGold || liveSilver) ? (
              <>
                <div>
                  <SectionLabel dot="amber">Sell Prices — Customer Buys from Shop</SectionLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-5">
                    {liveGold && (
                      <>
                        <PriceTile label="Gold 24K"    base={liveGold.basePricePerTolaPKR} adjusted={liveGold.myPrice_24k}   diff={liveGold.diff_24k}   type="sell" accent="amber" />
                        <PriceTile label="Gold 23.85K" base={liveGold.base2385PerTolaPKR}  adjusted={liveGold.myPrice_2385k} diff={liveGold.diff_2385k} type="sell" accent="amber" />
                      </>
                    )}
                    {liveSilver && (
                      <PriceTile label="Silver 999" base={liveSilver.basePricePerTolaPKR} adjusted={liveSilver.myPrice} diff={liveSilver.diff_silver} type="sell" accent="slate" />
                    )}
                  </div>
                </div>

                <div>
                  <SectionLabel dot="blue">Buy Prices — Customer Sells to Shop</SectionLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mb-5">
                    {liveGold && (
                      <>
                        <PriceTile label="Gold 24K"    base={liveGold.basePricePerTolaPKR} adjusted={liveGold.myBuyPrice_24k}   diff={liveGold.buy_diff_24k}   type="buy" accent="blue" />
                        <PriceTile label="Gold 23.85K" base={liveGold.base2385PerTolaPKR}  adjusted={liveGold.myBuyPrice_2385k}  diff={liveGold.buy_diff_2385k}  type="buy" accent="blue" />
                      </>
                    )}
                    {liveSilver && (
                      <PriceTile label="Silver 999" base={liveSilver.basePricePerTolaPKR} adjusted={liveSilver.myBuyPrice} diff={liveSilver.buy_diff_silver} type="buy" accent="blue" />
                    )}
                  </div>
                </div>

                {Object.keys(liveCurrencies).length > 0 && (
                  <div>
                    <SectionLabel dot="violet">Currency Rates — Sell &amp; Buy (PKR per 1 unit)</SectionLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {Object.entries(liveCurrencies).map(([code, cur]) => {
                        const meta = CURRENCY_META[code];
                        return (
                          <div
                            key={code}
                            className="rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border"
                            style={{ background: cardBg, borderColor }}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xl">{meta?.flag ?? "🌐"}</span>
                              <div>
                                <p className="text-xs font-black" style={{ color: textPrimary }}>{code}</p>
                                <p className="text-[10px]" style={{ color: textMuted }}>{meta?.name}</p>
                              </div>
                            </div>
                            <div className="text-[9px] mb-1" style={{ color: textMuted }}>Live: PKR {(cur.rate ?? 0).toFixed(2)}</div>
                            <div className="grid grid-cols-2 gap-2 pt-2" style={{ borderTop: `1px solid ${borderColor}` }}>
                              <div>
                                <p className="text-[9px] font-bold text-amber-500 uppercase">Sell</p>
                                <p className="text-xs font-black" style={{ color: isLightTheme ? "#b45309" : "#fbbf24" }}>{(cur.adjustedRate ?? cur.rate ?? 0).toFixed(2)}</p>
                                {(cur.difference ?? 0) !== 0 && (
                                  <p className={`text-[10px] font-bold ${(cur.difference ?? 0) > 0 ? "text-emerald-500" : "text-red-400"}`}>
                                    {(cur.difference ?? 0) > 0 ? "+" : ""}{(cur.difference ?? 0).toFixed(2)}
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className="text-[9px] font-bold text-blue-400 uppercase">Buy</p>
                                <p className="text-xs font-black" style={{ color: isLightTheme ? "#1e40af" : "#93c5fd" }}>{(cur.buyRate ?? cur.rate ?? 0).toFixed(2)}</p>
                                {(cur.buy_difference ?? 0) !== 0 && (
                                  <p className={`text-[10px] font-bold ${(cur.buy_difference ?? 0) > 0 ? "text-emerald-500" : "text-red-400"}`}>
                                    {(cur.buy_difference ?? 0) > 0 ? "+" : ""}{(cur.buy_difference ?? 0).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {priceHistory.length > 0 && (
                  <Panel className="overflow-hidden">
                    <div className="px-4 sm:px-6 py-5 border-b flex items-center justify-between" style={{ borderColor }}>
                      <div>
                        <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Gold Price History</h3>
                        <p className="text-xs mt-0.5" style={{ color: textMuted }}>Last {priceHistory.length} updates · Sell &amp; Buy prices</p>
                      </div>
                    </div>
                    {priceHistory.length >= 2 && (
                      <div className="px-4 sm:px-6 pt-5">
                        <ResponsiveContainer width="100%" height={80}>
                          <LineChart
                            data={[...priceHistory].reverse().map((r, i) => ({
                              i,
                              sell: r.adjustedPrice_24k,
                              buy:  r.adjustedBuyPrice_24k ?? r.adjustedPrice_24k,
                            }))}
                            margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                          >
                            <Line type="monotone" dataKey="sell" stroke="#F59E0B" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="buy"  stroke="#3B82F6" strokeWidth={2} dot={false} strokeDasharray="4 3" />
                            <Tooltip content={({ active, payload }) =>
                              active && payload?.length ? (
                                <div className="rounded-xl px-3 py-1.5 text-xs shadow-md border" style={{ background: cardBg, borderColor, color: textPrimary }}>
                                  {payload.map((p, i) => (
                                    <span key={i} className={`font-bold ${p.dataKey === "sell" ? "text-amber-500" : "text-blue-400"}`}>
                                      {p.dataKey === "sell" ? "Sell" : "Buy"}: PKR {fmt(p.value)}
                                      {i < payload.length - 1 ? " · " : ""}
                                    </span>
                                  ))}
                                </div>
                              ) : null
                            } />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="flex items-center justify-center gap-6 mt-2 mb-4">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-3 h-0.5 bg-amber-500 rounded" />
                            <span style={{ color: textMuted }}>Sell 24K</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-3 h-0.5 bg-blue-400 rounded" />
                            <span style={{ color: textMuted }}>Buy 24K</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="px-4 sm:px-6 pb-5 divide-y" style={{ '--tw-divide-color': borderColor }}>
                      {priceHistory.map((record, i) => <PriceRow key={record._id ?? i} record={record} index={i} />)}
                    </div>
                  </Panel>
                )}
              </>
            ) : (
              <div className="text-center py-20" style={{ color: textMuted }}>
                <Ico d={ICONS.gold} className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Live prices unavailable. Check SSE connection.</p>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/*  SYSTEM SUMMARY — always visible at bottom         */}
        {/* ══════════════════════════════════════════════════ */}
        <Panel className="overflow-hidden">
          <div className="px-4 sm:px-6 py-5 border-b flex items-center justify-between" style={{ borderColor }}>
            <div>
              <h3 className="text-sm font-bold" style={{ color: textPrimary }}>System Summary</h3>
              <p className="text-xs mt-0.5" style={{ color: textMuted }}>All-time platform totals at a glance</p>
            </div>
            <ScopeBadge scope="system" />
          </div>
          <div className="px-4 sm:px-6 pb-2">
            {[
              { label: "Total Revenue (All-time)",   val: `PKR ${fmt(revenue.total ?? 0)}`,         icon: ICONS.revenue,  color: "text-amber-500"   },
              { label: "Sell Revenue (All Shops)",   val: `PKR ${fmt(revenue.sellRevenue ?? 0)}`,   icon: ICONS.trend,    color: "text-emerald-500" },
              { label: "Buy Revenue (All Shops)",    val: `PKR ${fmt(revenue.buyRevenue ?? 0)}`,    icon: ICONS.trend,    color: "text-blue-400"    },
              { label: "My Shop Revenue",            val: `PKR ${fmt(msTotalRevenue)}`,             icon: ICONS.shop2,    color: "text-violet-500"  },
              { label: "Average Order Value",        val: `PKR ${fmt(revenue.avgPerOrder ?? 0)}`,   icon: ICONS.orders,   color: "text-violet-500"  },
              { label: "Total Orders (All Shops)",   val: fmt(totalOrders),                         icon: ICONS.orders,   color: "text-gray-400"    },
              { label: "Completed Orders",           val: fmt(orders.completed ?? 0),               icon: ICONS.check,    color: "text-emerald-500" },
              { label: "Rejected Orders",            val: fmt(orders.rejected ?? 0),                icon: ICONS.cancel,   color: "text-rose-400"    },
              { label: "Cancelled Orders",           val: fmt(orders.cancelled ?? 0),               icon: ICONS.cancel,   color: "text-red-400"     },
              { label: "Completion Rate (Platform)", val: `${pct(orders.completed ?? 0, totalOrders)}%`, icon: ICONS.check, color: "text-emerald-500" },
              { label: "Total Shop Admins",          val: fmt(users.totalAdmins ?? 0),              icon: ICONS.shops,    color: "text-blue-400"    },
              { label: "Active Shop Admins",         val: fmt(users.activeAdmins ?? 0),             icon: ICONS.shops,    color: "text-emerald-500" },
              { label: "Total Customers",            val: fmt(users.totalCustomers ?? 0),           icon: ICONS.users,    color: "text-slate-400"   },
              { label: "Approved Customers",         val: fmt(users.approvedCustomers ?? 0),        icon: ICONS.check,    color: "text-emerald-500" },
              { label: "Price Updates (Gold)",       val: fmt(priceHistory.length),                 icon: ICONS.gold,     color: "text-amber-500"   },
              { label: "Currencies Tracked",         val: fmt(Object.keys(liveCurrencies).length),  icon: ICONS.currency, color: "text-violet-500"  },
              { label: "Metals Traded",              val: fmt(metalBreakdown.length),               icon: ICONS.globe,    color: "text-slate-400"   },
            ].map(({ label, val, icon, color }, i) => (
              <div key={label} className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t" : ""}`} style={i > 0 ? { borderColor } : {}}>
                <span className={color}><Ico d={icon} className="w-4 h-4" /></span>
                <span className="text-xs flex-1" style={{ color: textMuted }}>{label}</span>
                <span className="text-xs font-black" style={{ color: textPrimary }}>{val}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* ── Footer ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t" style={{ borderColor }}>
          <p className="text-xs" style={{ color: textMuted }}>
            Revenue counts completed orders only · All prices are live via SSE every 30 seconds · All amounts in PKR
          </p>
          {lastUpdated && (
            <p className="text-xs hidden sm:block" style={{ color: textMuted }}>
              Last refresh: <span className="font-semibold" style={{ color: isLightTheme ? "#4b5563" : "#d1d5db" }}>
                {lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}