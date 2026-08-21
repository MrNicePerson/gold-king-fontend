// frontend/src/pages/Admin_Dashboard/Analytics.jsx
// Production-ready — mirrors Super Admin Analytics layout
// Themed with useTheme (matches Dashboard.jsx pattern) + responsive fixes

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import * as adminAPI from "../../services/adminApi";
import { useLivePrices } from "../../hooks/useLivePrices";
import { useTheme } from "../../contexts/ThemeContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_COLORS = {
  completed:  "#10B981",
  approved:   "#8B5CF6",
  pending:    "#F59E0B",
  rejected:   "#EF4444",
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
  refresh:  "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  users:    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  orders:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  revenue:  "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  gold:     "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  alert:    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  check:    "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  up:       "M7 11l5-5m0 0l5 5m-5-5v12",
  down:     "M17 13l-5 5m0 0l-5-5m5 5V6",
  star:     "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  flag:     "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
  shop:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  trend:    "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
};

// ─── Page Spinner ─────────────────────────────────────────────────────────────

function PageSpinner() {
  const { theme } = useTheme();
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "transparent" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${theme.primary}20` }} />
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: theme.primary }} />
          <div className="absolute inset-3 rounded-full border" style={{ borderColor: `${theme.primary}30` }} />
        </div>
        <p className="text-sm font-medium tracking-widest uppercase" style={{ color: theme.textMuted }}>
          Loading analytics…
        </p>
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function Panel({ children, className = "" }) {
  const { theme, isLightTheme } = useTheme();
  return (
    <div
      className={`rounded-3xl overflow-hidden ${className}`}
      style={{
        background: isLightTheme ? theme.cardBg : theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: isLightTheme ? "0 1px 8px rgba(0,0,0,0.06)" : "0 4px 20px rgba(0,0,0,0.25)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children, dot = "amber" }) {
  const { theme, isLightTheme } = useTheme();
  const dotColors = {
    amber:   "#F59E0B",
    blue:    "#3B82F6",
    emerald: "#10B981",
    violet:  "#8B5CF6",
    slate:   "#64748B",
    rose:    "#F43F5E",
  };
  // Use theme.primary for "amber" dot so it respects the active theme
  const dotColor = dot === "amber" ? theme.primary : (dotColors[dot] ?? theme.primary);
  return (
    <p
      className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
      style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}90` }}
    >
      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: dotColor }} />
      {children}
    </p>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, prefix = "", suffix = "" }) {
  const { theme, isLightTheme } = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-2xl px-4 py-3 shadow-lg text-xs"
      style={{
        background: isLightTheme ? theme.cardBg : theme.bg,
        border: `1px solid ${theme.border}`,
        color: theme.textPrimary,
      }}
    >
      <p className="mb-2 font-semibold" style={{ color: theme.textMuted }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 font-bold" style={{ color: theme.textPrimary }}>
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {prefix}{fmt(p.value)}{suffix}
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color, accentColor, delay = 0, trend }) {
  const { theme, isLightTheme } = useTheme();
  // Support both old `color` string (bg-* text-* tailwind) and new `accentColor` hex
  // If accentColor is passed, use theme-aware inline styles; otherwise fall back to tailwind color classes
  const useInlineStyle = !!accentColor;

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: isLightTheme ? theme.cardBg : theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: isLightTheme ? "0 1px 8px rgba(0,0,0,0.06)" : "0 2px 12px rgba(0,0,0,0.25)",
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        {useInlineStyle ? (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center p-2 shrink-0"
            style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}25` }}
          >
            <Ico d={icon} className="w-4 h-4" />
          </div>
        ) : (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center p-2 shrink-0 ${color}`}>
            <Ico d={icon} className="w-4 h-4" />
          </div>
        )}
        {trend != null && (
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg
            ${trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
            <Ico d={trend >= 0 ? ICONS.up : ICONS.down} className="w-2.5 h-2.5" />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: theme.textPrimary }}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}90` }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>{sub}</p>}
    </div>
  );
}

// ─── Revenue Period Card ──────────────────────────────────────────────────────

function RevCard({ label, total, count, buyRev, sellRev, accent = "amber" }) {
  const { theme, isLightTheme } = useTheme();

  // Theme-aware accent configs
  const accentMap = {
    amber: {
      border: `${theme.primary}40`,
      val: theme.primary,
      sub: isLightTheme ? theme.textMuted : `${theme.primary}cc`,
      bg: isLightTheme
        ? `linear-gradient(135deg, ${theme.primary}08, ${theme.primary}04)`
        : `linear-gradient(135deg, ${theme.primary}12, ${theme.primary}06)`,
    },
    emerald: {
      border: "#10b98140",
      val: "#10b981",
      sub: isLightTheme ? "#059669" : "#10b981cc",
      bg: isLightTheme
        ? "linear-gradient(135deg, #10b98108, #10b98104)"
        : "linear-gradient(135deg, #10b98112, #10b98106)",
    },
    blue: {
      border: "#3b82f640",
      val: "#3b82f6",
      sub: isLightTheme ? "#2563eb" : "#3b82f6cc",
      bg: isLightTheme
        ? "linear-gradient(135deg, #3b82f608, #3b82f604)"
        : "linear-gradient(135deg, #3b82f612, #3b82f606)",
    },
  };
  const a = accentMap[accent] ?? accentMap.amber;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: a.bg,
        border: `1px solid ${a.border}`,
      }}
    >
      <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: a.sub }}>{label}</p>
      <p className="text-3xl font-black leading-none" style={{ color: a.val }}>
        PKR {fmtCompact(total)}
      </p>
      <p className="text-xs mt-1" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>{count} completed orders</p>
      <div className="mt-3 pt-3 grid grid-cols-2 gap-2" style={{ borderTop: `1px solid ${a.border}` }}>
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}65` }}>Sell Rev</p>
          <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>PKR {fmtCompact(sellRev)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}65` }}>Buy Rev</p>
          <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>PKR {fmtCompact(buyRev)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Order Period Card ────────────────────────────────────────────────────────

function OrderPeriodCard({ label, completed, pending, approved, rejected = 0, cancelled = 0 }) {
  const { theme, isLightTheme } = useTheme();
  const total = completed + pending + approved + rejected + cancelled;
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: isLightTheme ? theme.cardBg : theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: isLightTheme ? "0 1px 6px rgba(0,0,0,0.05)" : "0 2px 10px rgba(0,0,0,0.2)",
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}90` }}>{label}</p>
      <p className="text-2xl font-black" style={{ color: theme.textPrimary }}>{fmt(total)}</p>
      <p className="text-xs mb-3" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>total orders</p>
      <div className="space-y-1.5">
        {[
          { label: "Completed", val: completed, color: "#10B981" },
          { label: "Approved",  val: approved,  color: "#8B5CF6" },
          { label: "Pending",   val: pending,   color: "#F59E0B" },
          { label: "Rejected",  val: rejected,  color: "#EF4444" },
          { label: "Cancelled", val: cancelled, color: "#F43F5E" },
        ].map(({ label: l, val, color }) => (
          <div key={l} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>{l}</span>
            </div>
            <span className="font-bold" style={{ color: theme.textPrimary }}>{fmt(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Weekly Bar Chart ─────────────────────────────────────────────────────────

function WeeklyBarChart({ data }) {
  const { theme, isLightTheme } = useTheme();
  if (!data?.length || data.every(d => d.totalOrders === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-sm" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}60` }}>
        No completed orders this week
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isLightTheme ? "#F3F4F6" : `${theme.border}`} />
        <XAxis dataKey="day" tick={{ fill: isLightTheme ? "#9CA3AF" : `${theme.textPrimary}60`, fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmtCompact} tick={{ fill: isLightTheme ? "#9CA3AF" : `${theme.textPrimary}60`, fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const sales = payload.find(p => p.dataKey === "sales")?.value || 0;
            const buys  = payload.find(p => p.dataKey === "buys")?.value  || 0;
            const sc    = payload.find(p => p.dataKey === "salesCount")?.value || 0;
            const bc    = payload.find(p => p.dataKey === "buysCount")?.value  || 0;
            return (
              <div
                className="rounded-2xl px-4 py-3 shadow-lg text-xs"
                style={{ background: isLightTheme ? theme.cardBg : theme.bg, border: `1px solid ${theme.border}` }}
              >
                <p className="mb-2 font-semibold" style={{ color: theme.textMuted }}>{label}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>Sales:</span>
                    <span className="font-bold text-emerald-600">PKR {fmt(sales)}</span>
                    <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}60` }}>({sc} orders)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>Buys:</span>
                    <span className="font-bold text-amber-600">PKR {fmt(buys)}</span>
                    <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}60` }}>({bc} orders)</span>
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

// ─── Daily Area Chart ─────────────────────────────────────────────────────────

function DailyLineChart({ data }) {
  const { theme, isLightTheme } = useTheme();
  if (!data?.length || data.every(d => d.totalOrders === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-sm" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}60` }}>
        No completed orders in the last 30 days
      </div>
    );
  }
  const formatted = data.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("en-PK", { month: "short", day: "numeric" }),
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={formatted} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="adminSalesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="adminBuysGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={isLightTheme ? "#F3F4F6" : `${theme.border}`} />
        <XAxis
          dataKey="displayDate"
          tick={{ fill: isLightTheme ? "#9CA3AF" : `${theme.textPrimary}60`, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={Math.max(0, Math.floor(formatted.length / 7) - 1)}
        />
        <YAxis tickFormatter={fmtCompact} tick={{ fill: isLightTheme ? "#9CA3AF" : `${theme.textPrimary}60`, fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const sales = payload.find(p => p.dataKey === "sales")?.value || 0;
            const buys  = payload.find(p => p.dataKey === "buys")?.value  || 0;
            const sc    = payload.find(p => p.dataKey === "salesCount")?.value || 0;
            const bc    = payload.find(p => p.dataKey === "buysCount")?.value  || 0;
            return (
              <div
                className="rounded-2xl px-4 py-3 shadow-lg text-xs"
                style={{ background: isLightTheme ? theme.cardBg : theme.bg, border: `1px solid ${theme.border}` }}
              >
                <p className="mb-2 font-semibold" style={{ color: theme.textMuted }}>{label}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>Sales:</span>
                    <span className="font-bold text-emerald-600">PKR {fmt(sales)}</span>
                    <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}60` }}>({sc})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>Buys:</span>
                    <span className="font-bold text-amber-600">PKR {fmt(buys)}</span>
                    <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}60` }}>({bc})</span>
                  </div>
                </div>
              </div>
            );
          }}
        />
        <Area type="monotone" dataKey="sales" name="Sales" stroke="#10B981" strokeWidth={2} fill="url(#adminSalesGrad)" />
        <Area type="monotone" dataKey="buys"  name="Buys"  stroke="#F59E0B" strokeWidth={2} fill="url(#adminBuysGrad)"  />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Recent Orders Table ──────────────────────────────────────────────────────

function RecentOrdersTable({ orders }) {
  const { theme, isLightTheme } = useTheme();
  if (!orders?.length) return null;
  return (
    <Panel className="overflow-hidden">
      <div className="px-4 sm:px-6 py-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <h3 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Recent Orders</h3>
        <p className="text-xs mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>Latest 10 transactions</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: 600 }}>
          <thead style={{ background: isLightTheme ? "#F9FAFB" : `${theme.primary}08`, borderBottom: `1px solid ${theme.border}` }}>
            <tr>
              {["Customer","Type","Metal","Amount","Status","Date"].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest"
                  style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}
                >
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
                style={{
                  borderBottom: `1px solid ${theme.border}`,
                  background: idx % 2 === 0
                    ? (isLightTheme ? theme.cardBg : theme.bg)
                    : (isLightTheme ? `${theme.primary}04` : "rgba(255,255,255,0.02)"),
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${theme.primary}08`}
                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0
                  ? (isLightTheme ? theme.cardBg : theme.bg)
                  : (isLightTheme ? `${theme.primary}04` : "rgba(255,255,255,0.02)")}
              >
                <td className="px-4 py-3 font-medium" style={{ color: theme.textPrimary }}>{order.customerId?.name || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${
                    order.orderType === "buy" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {order.orderType?.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${
                    order.metalType === "gold" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {order.metalType?.toUpperCase()} {order.carat}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold" style={{ color: theme.primary }}>
                  PKR {fmt(order.finalizedAmount || order.totalAmount)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                    order.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    order.status === "approved"  ? "bg-violet-100 text-violet-700"  :
                    order.status === "pending"   ? "bg-yellow-100 text-yellow-700"  :
                                                   "bg-red-100 text-red-600"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      order.status === "completed" ? "bg-emerald-500" :
                      order.status === "approved"  ? "bg-violet-500"  :
                      order.status === "pending"   ? "bg-yellow-500"  : "bg-red-500"
                    }`} />
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}65` }}>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const { theme, isLightTheme } = useTheme();
  const [analytics,   setAnalytics]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo,  setSecondsAgo]  = useState(0);
  const intervalRef = useRef(null);

  const { connected: sseConnected, lastUpdated: sseLastUpdated, error: sseError } = useLivePrices("admin");

  // Countdown timer
  useEffect(() => {
    if (!sseLastUpdated) return;
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - sseLastUpdated.getTime()) / 1000));
    }, 1_000);
    return () => clearInterval(timer);
  }, [sseLastUpdated]);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await adminAPI.getAnalytics();
      setAnalytics(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    intervalRef.current = setInterval(() => fetchAnalytics(true), 5 * 60 * 1_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchAnalytics]);

  // ── Theme-derived tokens ───────────────────────────────────────────────────
  const pageBg = isLightTheme ? (theme.pageBg ?? "#f2f1ed") : (theme.bg ?? "#0c0c0c");
  const cardBg = isLightTheme ? (theme.cardBg ?? "#ffffff") : "#111111";

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (loading) return <PageSpinner />;

  if (error && !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: pageBg }}>
        <div className="max-w-md w-full text-center space-y-4">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto"
            style={{ background: "#ef444415", color: "#ef4444", border: "1px solid #ef444430" }}
          >
            <Ico d={ICONS.alert} className="w-7 h-7" />
          </div>
          <p className="text-xl font-bold" style={{ color: theme.textPrimary }}>Analytics unavailable</p>
          <p className="text-sm" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>{error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="px-6 py-3 font-bold text-sm rounded-2xl transition text-white"
            style={{ background: theme.gradient, boxShadow: `0 4px 16px ${theme.primary}40` }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const orders    = analytics?.orders    ?? {};
  const revenue   = analytics?.revenue   ?? {};
  const customers = analytics?.customers ?? {};

  const totalOrders     = orders.total     ?? 0;
  const completedOrders = orders.completed ?? 0;
  const pendingOrders   = orders.pending   ?? 0;
  const approvedOrders  = orders.approved  ?? 0;
  const rejectedOrders  = orders.rejected  ?? 0;

  const totalRevenue   = revenue.totalSales      ?? 0;
  const totalPurchases = revenue.totalPurchases  ?? 0;
  const sellRevenue    = revenue.sellRevenue     ?? 0;
  const buyRevenue     = revenue.buyRevenue      ?? 0;
  const salesCount     = revenue.salesCount      ?? 0;
  const purchasesCount = revenue.purchasesCount  ?? 0;
  const avgSale        = salesCount > 0 ? sellRevenue / salesCount : 0;

  const totalCustomers   = customers.total   ?? 0;
  const trustedCustomers = customers.trusted ?? 0;
  const flaggedCustomers = customers.flagged ?? 0;

  const shopName = analytics?.shopInfo?.shopName || "Your Shop";

  // Monthly trend chart
  const monthlyData = (analytics?.monthlyTrend ?? []).map(m => ({
    month:   MONTH_NAMES[(m._id?.month ?? 1) - 1],
    revenue: m.revenue ?? 0,
    orders:  m.count   ?? 0,
  }));

  // Order status donut
  const orderStatusData = analytics ? [
    { name: "Completed", value: completedOrders, color: STATUS_COLORS.completed },
    { name: "Approved",  value: approvedOrders,  color: STATUS_COLORS.approved  },
    { name: "Pending",   value: pendingOrders,   color: STATUS_COLORS.pending   },
    { name: "Rejected",  value: rejectedOrders,  color: STATUS_COLORS.rejected  },
  ].filter(d => d.value > 0) : [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: theme.textPrimary }}>Analytics</h1>
            <p className="text-sm mt-1" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>
              {shopName}
              {lastUpdated
                ? ` · Analytics updated ${lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}`
                : " · Live data"}
              {" "}· All prices are live and updated every 30 seconds
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* SSE status */}
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
              style={sseConnected
                ? { background: "#10b98115", color: "#10b981", border: "1px solid #10b98125" }
                : { background: "#ef444415", color: "#ef4444", border: "1px solid #ef444425" }
              }
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${sseConnected ? "animate-pulse" : ""}`}
                style={{ background: sseConnected ? "#10b981" : "#ef4444" }} />
              {sseConnected ? "Live" : "Offline"}
            </span>

            {/* Countdown */}
            {sseConnected && sseLastUpdated && (
              <span className="text-xs hidden md:block" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>
                Next update in{" "}
                <span className="font-semibold font-mono" style={{ color: theme.primary }}>
                  {Math.max(0, 30 - secondsAgo)}s
                </span>
              </span>
            )}

            {lastUpdated && (
              <p className="text-xs hidden md:block" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>
                Updated:{" "}
                <span className="font-semibold" style={{ color: theme.textPrimary }}>
                  {lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </p>
            )}

            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                background: isLightTheme ? cardBg : "#1a1a1a",
                border: `1px solid ${theme.border}`,
                color: theme.textPrimary,
                boxShadow: isLightTheme ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Ico d={ICONS.refresh} className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* SSE error banner */}
        {sseError && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold"
            style={{ background: "#ef444410", border: "1px solid #ef444430", color: "#ef4444" }}
          >
            <Ico d={ICONS.alert} className="w-4 h-4 shrink-0" />
            Live feed error: {sseError}
            <span className="font-normal ml-1" style={{ color: "#ef4444aa" }}>— analytics data may be delayed.</span>
          </div>
        )}

        {/* ── KPI stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total Revenue"
            value={`PKR ${fmtCompact(totalRevenue)}`}
            sub={`Avg PKR ${fmtCompact(avgSale)}/sale`}
            icon={ICONS.revenue}
            accentColor={theme.primary}
            delay={0}
          />
          <StatCard
            label="Total Orders"
            value={fmt(totalOrders)}
            sub={`${pct(completedOrders, totalOrders)}% completion rate`}
            icon={ICONS.orders}
            accentColor="#8B5CF6"
            delay={50}
          />
          <StatCard
            label="Completed"
            value={fmt(completedOrders)}
            sub={`${pct(completedOrders, totalOrders)}% of all orders`}
            icon={ICONS.check}
            accentColor="#10B981"
            delay={100}
          />
          <StatCard
            label="Customers"
            value={fmt(totalCustomers)}
            sub={`${trustedCustomers} trusted · ${flaggedCustomers} flagged`}
            icon={ICONS.users}
            accentColor="#3B82F6"
            delay={150}
          />
        </div>

        {/* ── Revenue breakdown: Daily / Weekly / Monthly ── */}
        <div>
          <SectionLabel dot="amber">Revenue Breakdown (Completed Orders Only)</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RevCard
              label="Today's Revenue"
              total={revenue.daily?.total ?? 0}
              count={revenue.daily?.count ?? 0}
              buyRev={revenue.daily?.buyRevenue ?? 0}
              sellRev={revenue.daily?.sellRevenue ?? 0}
              accent="amber"
            />
            <RevCard
              label="This Week's Revenue"
              total={revenue.weekly?.total ?? 0}
              count={revenue.weekly?.count ?? 0}
              buyRev={revenue.weekly?.buyRevenue ?? 0}
              sellRev={revenue.weekly?.sellRevenue ?? 0}
              accent="emerald"
            />
            <RevCard
              label="This Month's Revenue"
              total={revenue.monthly?.total ?? 0}
              count={revenue.monthly?.count ?? 0}
              buyRev={revenue.monthly?.buyRevenue ?? 0}
              sellRev={revenue.monthly?.sellRevenue ?? 0}
              accent="blue"
            />
          </div>
        </div>

        {/* ── Order period breakdown ── */}
        <div>
          <SectionLabel dot="violet">Order Activity by Period</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <OrderPeriodCard
              label="Today"
              completed={orders.daily?.completed ?? 0}
              approved={orders.daily?.approved   ?? 0}
              pending={orders.daily?.pending     ?? 0}
              rejected={orders.daily?.rejected   ?? 0}
              cancelled={orders.daily?.cancelled ?? 0}
            />
            <OrderPeriodCard
              label="This Week"
              completed={orders.weekly?.completed ?? 0}
              approved={orders.weekly?.approved   ?? 0}
              pending={orders.weekly?.pending     ?? 0}
              rejected={orders.weekly?.rejected   ?? 0}
              cancelled={orders.weekly?.cancelled ?? 0}
            />
            <OrderPeriodCard
              label="This Month"
              completed={orders.monthly?.completed ?? 0}
              approved={orders.monthly?.approved   ?? 0}
              pending={orders.monthly?.pending     ?? 0}
              rejected={orders.monthly?.rejected   ?? 0}
              cancelled={orders.monthly?.cancelled ?? 0}
            />
          </div>
        </div>

        {/* ── All-time order status mini-cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { label: "Completed",  value: fmt(completedOrders),              accentColor: "#10B981" },
            { label: "Approved",   value: fmt(approvedOrders),               accentColor: "#8B5CF6" },
            { label: "Pending",    value: fmt(pendingOrders),                accentColor: "#F59E0B" },
            { label: "Rejected",   value: fmt(rejectedOrders),               accentColor: "#EF4444" },
            { label: "Sales Rev",  value: `PKR ${fmtCompact(sellRevenue)}`,  accentColor: "#F97316" },
            { label: "Buy Rev",    value: `PKR ${fmtCompact(buyRevenue)}`,   accentColor: "#3B82F6" },
          ].map(({ label, value, accentColor }, i) => (
            <StatCard key={label} label={label} value={value} icon={ICONS.orders} accentColor={accentColor} delay={i * 30} />
          ))}
        </div>

        {/* ── Revenue trend + Order volume charts ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <Panel>
            <div className="px-4 sm:px-6 py-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <h3 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Revenue Trend</h3>
              <p className="text-xs mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
                Completed orders · Last {monthlyData.length} months · PKR
              </p>
            </div>
            <div className="p-4 sm:p-5">
              {monthlyData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}60` }}>
                  No monthly data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={theme.primary} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={theme.primary} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLightTheme ? "#F3F4F6" : `${theme.border}`} />
                    <XAxis dataKey="month" tick={{ fill: isLightTheme ? "#9CA3AF" : `${theme.textPrimary}60`, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtCompact} tick={{ fill: isLightTheme ? "#9CA3AF" : `${theme.textPrimary}60`, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip prefix="PKR " />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke={theme.primary} strokeWidth={2}
                      fill="url(#revGrad)" dot={{ r: 3, fill: theme.primary }} activeDot={{ r: 5, fill: theme.primary }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>

          <Panel>
            <div className="px-4 sm:px-6 py-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <h3 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Order Volume</h3>
              <p className="text-xs mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
                All statuses · Last {monthlyData.length} months
              </p>
            </div>
            <div className="p-4 sm:p-5">
              {monthlyData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}60` }}>
                  No monthly data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLightTheme ? "#F3F4F6" : `${theme.border}`} />
                    <XAxis dataKey="month" tick={{ fill: isLightTheme ? "#9CA3AF" : `${theme.textPrimary}60`, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: isLightTheme ? "#9CA3AF" : `${theme.textPrimary}60`, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip suffix=" orders" />} />
                    <Bar dataKey="orders" name="Orders" fill="#6366F1" radius={[4,4,0,0]}>
                      {monthlyData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={i === monthlyData.length - 1 ? "#818CF8" : "#6366F1"}
                          opacity={0.8 + (i / monthlyData.length) * 0.2}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Panel>
        </div>

        {/* ── Weekly Sales vs Buys ── */}
        <Panel>
          <div className="px-4 sm:px-6 py-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <h3 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Weekly Overview</h3>
            <p className="text-xs mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
              Sales vs Buys for the last 7 days (completed orders)
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <WeeklyBarChart data={analytics?.weeklyData || []} />
          </div>
        </Panel>

        {/* ── Daily Trend (30 days) ── */}
        <Panel>
          <div className="px-4 sm:px-6 py-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <h3 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Daily Trend</h3>
            <p className="text-xs mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
              Sales vs Buys for the last 30 days (completed orders)
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <DailyLineChart data={analytics?.dailyData || []} />
          </div>
        </Panel>

        {/* ── Order status donut + Customer insights ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Donut */}
          <Panel>
            <div className="px-4 sm:px-6 py-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <h3 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Order Status Breakdown</h3>
              <p className="text-xs mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>All-time distribution</p>
            </div>
            <div className="p-4 sm:p-5">
              {orderStatusData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}60` }}>
                  No order data
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="relative shrink-0">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                          paddingAngle={3} dataKey="value" strokeWidth={0}>
                          {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip content={({ active, payload }) =>
                          active && payload?.length ? (
                            <div
                              className="rounded-xl px-3 py-2 text-xs shadow-md"
                              style={{ background: isLightTheme ? theme.cardBg : theme.bg, border: `1px solid ${theme.border}` }}
                            >
                              <p className="font-bold" style={{ color: theme.textPrimary }}>{payload[0].name}</p>
                              <p style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>
                                {payload[0].value} orders ({pct(payload[0].value, totalOrders)}%)
                              </p>
                            </div>
                          ) : null
                        } />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-xl font-black" style={{ color: theme.textPrimary }}>{fmt(totalOrders)}</p>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>Total</p>
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-2.5">
                    {orderStatusData.map(d => (
                      <div key={d.name} className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-xs flex-1" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>{d.name}</span>
                        <span className="text-xs font-black" style={{ color: theme.textPrimary }}>{fmt(d.value)}</span>
                        <span className="text-[10px] w-10 text-right" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}60` }}>
                          {pct(d.value, totalOrders)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* Customer insights */}
          <Panel>
            <div className="px-4 sm:px-6 py-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <h3 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Customer Insights</h3>
              <p className="text-xs mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>Your customer base breakdown</p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
                {[
                  { label: "Total Customers", value: fmt(totalCustomers),   accentColor: "#3B82F6", icon: ICONS.users },
                  { label: "Trusted",         value: fmt(trustedCustomers), accentColor: "#10B981", icon: ICONS.star  },
                  { label: "Flagged",         value: fmt(flaggedCustomers), accentColor: "#F43F5E", icon: ICONS.flag  },
                  { label: "Sales Count",     value: fmt(salesCount),       accentColor: theme.primary, icon: ICONS.up },
                ].map(({ label, value, accentColor, icon }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 sm:p-4 text-center"
                    style={{
                      background: isLightTheme ? `${accentColor}08` : `${accentColor}12`,
                      border: `1px solid ${accentColor}30`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
                      style={{ background: `${accentColor}20`, color: accentColor }}
                    >
                      <Ico d={icon} className="w-4 h-4" />
                    </div>
                    <p className="text-xl sm:text-2xl font-black" style={{ color: theme.textPrimary }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* User activity bars */}
              <div className="space-y-4">
                {[
                  { label: "Trusted Customers",  val: trustedCustomers, total: totalCustomers, color: "#10B981" },
                  { label: "Flagged Customers",   val: flaggedCustomers, total: totalCustomers, color: "#EF4444" },
                  { label: "Completion Rate",     val: completedOrders,  total: totalOrders,   color: "#8B5CF6" },
                ].map(({ label, val, total, color }) => {
                  const p = total > 0 ? (val / total) * 100 : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-semibold" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>{label}</span>
                        <span className="text-xs font-black" style={{ color: theme.textPrimary }}>
                          {fmt(val)} <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}60`, fontWeight: 400 }}>/ {fmt(total)}</span>
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ background: isLightTheme ? "#F3F4F6" : `${theme.border}` }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${p}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>
        </div>

        {/* ── Sales vs Purchases performance cards ── */}
        <div>
          <SectionLabel dot="emerald">Sales &amp; Purchase Performance</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div
              className="rounded-2xl p-5 sm:p-6"
              style={{
                background: isLightTheme
                  ? `linear-gradient(135deg, ${theme.primary}08, ${theme.primary}04)`
                  : `linear-gradient(135deg, ${theme.primary}15, ${theme.primary}08)`,
                border: `1px solid ${theme.primary}30`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: isLightTheme ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.1)", color: theme.primary }}
                >
                  <Ico d={ICONS.up} className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: theme.primary }}>Sales Performance</p>
                  <p className="text-xl sm:text-2xl font-black" style={{ color: theme.textPrimary }}>PKR {fmtCompact(sellRevenue)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>Transactions</p>
                  <p className="text-xl font-bold" style={{ color: theme.textPrimary }}>{salesCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>Average Sale</p>
                  <p className="text-xl font-bold" style={{ color: theme.textPrimary }}>PKR {fmt(avgSale)}</p>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl p-5 sm:p-6"
              style={{
                background: isLightTheme
                  ? "linear-gradient(135deg, #8b5cf608, #6366f104)"
                  : "linear-gradient(135deg, #8b5cf615, #6366f108)",
                border: "1px solid #8b5cf630",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: isLightTheme ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.1)", color: "#8b5cf6" }}
                >
                  <Ico d={ICONS.down} className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#8b5cf6" }}>Purchase Performance</p>
                  <p className="text-xl sm:text-2xl font-black" style={{ color: theme.textPrimary }}>PKR {fmtCompact(buyRevenue)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>Transactions</p>
                  <p className="text-xl font-bold" style={{ color: theme.textPrimary }}>{purchasesCount}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>Average Purchase</p>
                  <p className="text-xl font-bold" style={{ color: theme.textPrimary }}>
                    PKR {fmt(purchasesCount > 0 ? totalPurchases / purchasesCount : 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── System summary ── */}
        <Panel>
          <div className="px-4 sm:px-6 py-5" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <h3 className="text-sm font-bold" style={{ color: theme.textPrimary }}>System Summary</h3>
            <p className="text-xs mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
              All-time totals for {shopName}
            </p>
          </div>
          <div className="px-4 sm:px-6 pb-2">
            {[
              { label: "Total Revenue (All-time)",   val: `PKR ${fmt(totalRevenue)}`,   icon: ICONS.revenue,  accentColor: theme.primary  },
              { label: "Total Sales Revenue",        val: `PKR ${fmt(sellRevenue)}`,    icon: ICONS.trend,    accentColor: "#10B981"       },
              { label: "Total Purchase Revenue",     val: `PKR ${fmt(totalPurchases)}`, icon: ICONS.trend,    accentColor: "#3B82F6"       },
              { label: "Average Sale Value",         val: `PKR ${fmt(avgSale)}`,         icon: ICONS.orders,   accentColor: "#8B5CF6"       },
              { label: "Completion Rate",            val: `${pct(completedOrders, totalOrders)}%`, icon: ICONS.check, accentColor: "#10B981" },
              { label: "Total Customers",            val: fmt(totalCustomers),           icon: ICONS.users,    accentColor: "#64748B"       },
              { label: "Trusted Customers",          val: fmt(trustedCustomers),         icon: ICONS.star,     accentColor: "#10B981"       },
              { label: "Flagged Customers",          val: fmt(flaggedCustomers),         icon: ICONS.flag,     accentColor: "#F43F5E"       },
              { label: "Total Orders",               val: fmt(totalOrders),              icon: ICONS.orders,   accentColor: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` },
              { label: "Pending Orders",             val: fmt(pendingOrders),            icon: ICONS.alert,    accentColor: "#F59E0B"       },
            ].map(({ label, val, icon, accentColor }, i) => (
              <div
                key={label}
                className="flex items-center gap-3 py-3"
                style={{ borderTop: i > 0 ? `1px solid ${theme.border}` : "none" }}
              >
                <span style={{ color: accentColor }}>
                  <Ico d={icon} className="w-4 h-4" />
                </span>
                <span className="text-xs flex-1" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>{label}</span>
                <span className="text-xs font-black" style={{ color: theme.textPrimary }}>{val}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* ── Recent Orders ── */}
        <RecentOrdersTable orders={analytics?.recentOrders} />

        {/* ── Footer ── */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <p className="text-xs" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
            Revenue counts completed orders only · All prices are live and updated every 30 seconds · All amounts in PKR
          </p>
          {lastUpdated && (
            <p className="text-xs hidden sm:block" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
              Last refresh:{" "}
              <span className="font-semibold" style={{ color: theme.textPrimary }}>
                {lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}