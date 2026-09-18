// pages/Super_Admin_Dashboard/AdminManagement.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import * as saAPI from "../../services/superAdminApi";
import { useTheme } from "../../contexts/ThemeContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, digits = 0) =>
  n != null && !isNaN(Number(n))
    ? Number(n).toLocaleString("en-PK", { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : "—";

const initials = (name) =>
  name ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "?";

const AVATAR_PALETTES = [
  { from: "#F59E0B", to: "#D97706" },
  { from: "#3B82F6", to: "#2563EB" },
  { from: "#10B981", to: "#059669" },
  { from: "#EC4899", to: "#DB2777" },
  { from: "#8B5CF6", to: "#7C3AED" },
  { from: "#EF4444", to: "#DC2626" },
  { from: "#06B6D4", to: "#0891B2" },
  { from: "#84CC16", to: "#65A30D" },
];

const avatarPalette = (name) =>
  AVATAR_PALETTES[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTES.length];

const CURRENCY_META = {
  USD: { flag: "🇺🇸", symbol: "$", name: "US Dollar" },
  SAR: { flag: "🇸🇦", symbol: "﷼", name: "Saudi Riyal" },
  AED: { flag: "🇦🇪", symbol: "د.إ", name: "UAE Dirham" },
  EUR: { flag: "🇪🇺", symbol: "€", name: "Euro" },
  GBP: { flag: "🇬🇧", symbol: "£", name: "British Pound" },
};

// Tola weight standards a shop can operate on
const TOLA_WEIGHT_OPTIONS = [
  { val: "11.664", label: "11.664g" },
  { val: "12.150", label: "12.150g" },
];

const validatePhone = (v) => {
  if (!v) return "Phone number is required";
  const d = v.replace(/\D/g, "");
  if (!d) return "Phone number is required";
  if (d.startsWith("92") && d.length !== 12) return "Enter 12 digits with 92 prefix";
  if (d.startsWith("0") && d.length !== 11) return "Enter 11 digits starting with 0";
  if (!d.startsWith("92") && !d.startsWith("0") && d.length !== 10) return "Enter complete number";
  return "";
};

const validateWhatsApp = (v) => {
  if (!v) return "";
  const d = v.replace(/\D/g, "");
  if (d.length < 10) return "Enter complete 10-digit number";
  if (d.length > 10) return "Maximum 10 digits";
  return "";
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ path, size = 16, className = "", style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d={path} />
  </svg>
);

const I = {
  plus: "M12 5v14M5 12h14",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  shop: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10",
  close: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  city: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10M15 2h4a1 1 0 011 1v4",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM17 11V7a5 5 0 00-10 0v4",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z",
  sort: "M3 6h18M7 12h10M11 18h2",
  sortAZ: "M3 6h10M3 12h7M3 18h4M17 4v16M14 7l3-3 3 3",
  sortZA: "M3 6h10M3 12h7M3 18h4M17 20V4M14 17l3 3 3-3",
  chevL: "M15 18l-6-6 6-6",
  chevR: "M9 18l6-6-6-6",
  bars: "M4 6h16M4 12h16M4 18h16",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  chart: "M18 20V10M12 20V4M6 20v-6",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  scale: "M12 3v18M5 8l-4 8a5 5 0 008 0zM19 8l-4 8a5 5 0 008 0zM5 8h14",
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[100] flex flex-col gap-2.5 max-w-sm sm:ml-auto pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className={`pointer-events-auto flex items-start gap-3.5 px-5 py-4 rounded-2xl shadow-2xl text-sm font-semibold animate-slideUp
            ${t.type === "error" ? "bg-red-600 text-white" : t.type === "warning" ? "bg-amber-500 text-white" : "bg-gray-900 text-white"}`}>
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5
            ${t.type === "error" ? "bg-red-500" : t.type === "warning" ? "bg-amber-400" : "bg-emerald-600"}`}>
            <Icon path={t.type === "error" ? I.alert : I.check} size={13} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold leading-snug">{t.title}</p>
            {t.msg && <p className="text-xs mt-0.5 opacity-80 leading-snug">{t.msg}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100 transition shrink-0 mt-0.5">
            <Icon path={I.close} size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((title, msg = "", type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, title, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);
  const remove = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);
  return { toasts, add, remove };
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, confirmLabel, variant, onConfirm, onCancel, loading }) {
  const { theme, isLightTheme } = useTheme();
  if (!open) return null;
  const isDestructive = variant === "danger";
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-full max-w-xs overflow-hidden animate-slideUp rounded-2xl shadow-2xl"
        style={{ background: isLightTheme ? theme.cardBg : theme.bg, border: `1px solid ${theme.border}` }}
      >
        <div className={`h-1 w-full ${isDestructive ? "bg-gradient-to-r from-red-500 to-rose-400" : "bg-gradient-to-r from-emerald-500 to-teal-400"}`} />
        <div className="p-5 space-y-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto"
            style={{
              background: isDestructive ? '#ef444415' : '#10b98115',
              border: `1px solid ${isDestructive ? '#ef444430' : '#10b98130'}`,
              color: isDestructive ? '#ef4444' : '#10b981',
            }}
          >
            <Icon path={I.alert} size={20} />
          </div>
          <div className="text-center space-y-1.5">
            <p className="font-black text-base leading-tight" style={{ color: theme.textPrimary }}>{title}</p>
            <p className="text-xs leading-relaxed" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>{message}</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{ border: `2px solid ${theme.border}`, color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80`, background: "transparent" }}>
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black text-white transition-all disabled:opacity-60 shadow-sm
                ${isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
              {loading ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Please wait…
                </span>
              ) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Form field components ────────────────────────────────────────────────────
function FieldLabel({ children, required, theme, isLightTheme }) {
  return (
    <label className="text-[10px] font-black uppercase tracking-[0.18em] flex items-center gap-1"
      style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}90` }}>
      {children}
      {required && <span className="text-red-400 text-xs">*</span>}
    </label>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
      <Icon path={I.alert} size={11} />
      {error}
    </p>
  );
}

function Field({ label, required, error, hint, icon, children, theme, isLightTheme }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel required={required} theme={theme} isLightTheme={isLightTheme}>{label}</FieldLabel>
      <div
        className="relative flex items-center rounded-xl border-2 transition-all duration-200 min-h-[46px]"
        style={{
          background: isLightTheme ? theme.cardBg : theme.bg,
          borderColor: error ? "#ef4444" : theme.border,
        }}
      >
        {icon && (
          <span className="absolute left-3.5 pointer-events-none shrink-0" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
            <Icon path={icon} size={15} />
          </span>
        )}
        <div className={`w-full ${icon ? "pl-10" : ""}`}>{children}</div>
      </div>
      {error ? <FieldError error={error} /> : hint && <p className="text-[11px] leading-relaxed" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>{hint}</p>}
    </div>
  );
}

function TextInput({ label, icon, error, hint, required, theme, isLightTheme, className = "", ...props }) {
  return (
    <Field label={label} icon={icon} error={error} hint={hint} required={required} theme={theme} isLightTheme={isLightTheme}>
      <input {...props}
        className={`w-full py-3 pr-4 bg-transparent text-sm font-semibold focus:outline-none rounded-xl ${className}`}
        style={{ color: theme.textPrimary }}
      />
    </Field>
  );
}

function PasswordInput({ label, value, onChange, error, placeholder, required, theme, isLightTheme }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel required={required} theme={theme} isLightTheme={isLightTheme}>{label}</FieldLabel>
      <div className="relative flex items-center rounded-xl border-2 transition-all duration-200"
        style={{
          background: isLightTheme ? theme.cardBg : theme.bg,
          borderColor: error ? "#ef4444" : theme.border,
        }}>
        <span className="absolute left-3.5 pointer-events-none" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
          <Icon path={I.lock} size={15} />
        </span>
        <input type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder}
          className="w-full pl-10 pr-11 py-3 bg-transparent text-sm font-semibold focus:outline-none rounded-xl"
          style={{ color: theme.textPrimary }} />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 transition p-1" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
          <Icon path={show ? I.eyeOff : I.eye} size={15} />
        </button>
      </div>
      {error && <FieldError error={error} />}
    </div>
  );
}

function PhoneField({ label, value, onChange, error, required, theme, isLightTheme }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!value) { setDisplay(""); return; }
    const d = value.replace(/\D/g, "");
    if (d.startsWith("92")) setDisplay("+92 " + d.slice(2).replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3"));
    else setDisplay(d.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3"));
  }, [value]);

  const handle = (e) => {
    const raw = e.target.value;
    let digits = raw.replace(/\D/g, "");
    digits = digits.slice(0, 11);
    setDisplay(raw.replace(/[^\d\s+]/g, ""));
    onChange(digits);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel required={required} theme={theme} isLightTheme={isLightTheme}>{label}</FieldLabel>
      <div className="relative flex items-center rounded-xl border-2 transition-all duration-200"
        style={{
          background: isLightTheme ? theme.cardBg : theme.bg,
          borderColor: error ? "#ef4444" : theme.border,
        }}>
        <span className="absolute left-3.5 pointer-events-none" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
          <Icon path={I.phone} size={15} />
        </span>
        <input type="text" inputMode="tel" value={display} onChange={handle}
          onBlur={() => { const d = (display || "").replace(/\D/g, ""); if (d.startsWith("92")) setDisplay("+92 " + d.slice(2)); }}
          onFocus={() => setDisplay((display || "").replace(/\D/g, ""))}
          placeholder="03XX XXXXXXX" maxLength={13}
          className="w-full pl-10 pr-4 py-3 bg-transparent text-sm font-semibold focus:outline-none rounded-xl"
          style={{ color: theme.textPrimary }} />
      </div>
      {error ? <FieldError error={error} /> : <p className="text-[11px]" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>Format: 03XX XXXXXXX</p>}
    </div>
  );
}

function WhatsAppField({ label, value, onChange, error, required, theme, isLightTheme }) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!value) { setDisplay(""); return; }
    const d = value.replace(/\D/g, "").slice(0, 10);
    setDisplay(d.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3"));
  }, [value]);

  const handle = (e) => {
    let d = e.target.value.replace(/\D/g, "").slice(0, 10);
    setDisplay(d);
    onChange(d);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel required={required} theme={theme} isLightTheme={isLightTheme}>{label}</FieldLabel>
      <div className="relative flex items-center rounded-xl border-2 transition-all duration-200"
        style={{
          background: isLightTheme ? theme.cardBg : theme.bg,
          borderColor: error ? "#ef4444" : theme.border,
        }}>
        <span className="absolute left-3.5 pointer-events-none" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
          <Icon path={I.phone} size={15} />
        </span>
        <span className="pl-10 text-sm font-black select-none pointer-events-none whitespace-nowrap" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>+92</span>
        <input type="text" inputMode="numeric" value={display} onChange={handle}
          onBlur={() => { if (display) { const d = display.replace(/\D/g, ""); setDisplay(d.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")); } }}
          onFocus={() => setDisplay(display.replace(/\D/g, ""))}
          placeholder="3XX XXXXXXX" maxLength={13}
          className="w-full pl-1.5 pr-4 py-3 bg-transparent text-sm font-semibold focus:outline-none rounded-xl"
          style={{ color: theme.textPrimary }} />
      </div>
      {error ? <FieldError error={error} /> : <p className="text-[11px]" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>+92 prefix auto-added · Enter 10 digits</p>}
    </div>
  );
}

// ─── Tola Weight radio field ─────────────────────────────────────────────────
function TolaWeightField({ label, value, onChange, required, theme, isLightTheme }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel required={required} theme={theme} isLightTheme={isLightTheme}>{label}</FieldLabel>
      <div className="flex gap-2" style={{ height: "46px" }}>
        {TOLA_WEIGHT_OPTIONS.map(({ val, label: optLabel }) => (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className="flex-1 rounded-xl border-2 text-xs font-black transition-all duration-200"
            style={value === val
              ? { borderColor: theme.primary, background: `${theme.primary}15`, color: theme.primary }
              : { borderColor: theme.border, color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70`, background: "transparent" }
            }
          >
            <span className="flex items-center justify-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: value === val ? theme.primary : (isLightTheme ? theme.textMuted : `${theme.textPrimary}50`) }}>
                {value === val && <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.primary }} />}
              </span>
              {optLabel}
            </span>
          </button>
        ))}
      </div>
      <p className="text-[11px]" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
        Tola weight standard used for this shop's gold calculations.
      </p>
    </div>
  );
}

function SectionDivider({ children, dotColor, theme, isLightTheme }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />
      <p
        className="text-[10px] font-black uppercase tracking-[0.22em] whitespace-nowrap"
        style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}90` }}
      >
        {children}
      </p>
      <div className="flex-1 h-px" style={{ background: theme.border }} />
    </div>
  );
}

// ─── Admin Avatar ─────────────────────────────────────────────────────────────
function Avatar({ admin, size = 48 }) {
  const p = avatarPalette(admin.name);
  return admin.shopLogo ? (
    <img src={admin.shopLogo} alt={admin.shopName}
      className="rounded-2xl object-cover shrink-0"
      style={{ width: size, height: size, border: "1px solid rgba(0,0,0,0.08)" }} />
  ) : (
    <div className="rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}>
      <span className="text-white font-black" style={{ fontSize: size * 0.29 }}>{initials(admin.name)}</span>
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ active, small, theme, isLightTheme }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-black rounded-xl ${small ? "text-[9px] px-2 py-1" : "text-[10px] px-2.5 py-1.5"}`}
      style={active
        ? { background: '#10b98115', color: '#10b981', border: '1px solid #10b98125' }
        : { background: '#ef444415', color: '#ef4444', border: '1px solid #ef444425' }
      }
    >
      <span className={`rounded-full ${small ? "w-1.5 h-1.5" : "w-2 h-2"} ${active ? "animate-pulse" : ""}`}
        style={{ background: active ? '#10b981' : '#ef4444' }} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ─── CREATE / EDIT MODAL ──────────────────────────────────────────────────────
const EMPTY = {
  name: "", password: "", shopName: "",
  phoneNumber: "", whatsappNumber: "", address: "", city: "", isActive: true,
  tolaWeight: "11.664",
};

function AdminFormModal({ open, admin, onClose, onSaved, toast }) {
  const { theme, isLightTheme } = useTheme();
  const isEdit = !!admin;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setTouched({});
    setForm(isEdit && admin ? {
      name: admin.name ?? "", password: "",
      shopName: admin.shopName ?? "", phoneNumber: admin.phoneNumber ?? "",
      whatsappNumber: admin.whatsappNumber ?? "", address: admin.address ?? "",
      city: admin.city ?? "", isActive: admin.isActive ?? true,
      tolaWeight: admin.tolaWeight != null ? String(admin.tolaWeight) : "11.664",
    } : EMPTY);
  }, [open, admin?._id]);

  const validateOne = (k, v) => {
    const s = typeof v === "string" ? v.trim() : v;
    if (k === "name") { if (!s) return "Full name is required"; if (String(v).trim().length < 2) return "Minimum 2 characters"; }
    if (k === "password") { if (!isEdit && !v) return "Password is required"; if (v && String(v).length < 8) return "Minimum 8 characters"; }
    if (k === "shopName") { if (!s) return "Shop name is required"; if (String(v).trim().length < 2) return "Minimum 2 characters"; }
    if (k === "phoneNumber") return validatePhone(v);
    if (k === "whatsappNumber") return validateWhatsApp(v);
    return "";
  };

  const set = (k) => (e) => {
    const val = e && e.target !== undefined ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setForm(f => ({ ...f, [k]: val }));
    setTouched(t => ({ ...t, [k]: true }));
    const err = validateOne(k, val);
    setErrors(e => ({ ...e, [k]: err }));
  };

  const blur = (k) => () => {
    setTouched(t => ({ ...t, [k]: true }));
    const err = validateOne(k, form[k]);
    setErrors(e => ({ ...e, [k]: err }));
  };

  const validate = () => {
    const all = {};
    Object.keys(EMPTY).forEach(k => {
      if (k === "isActive" || k === "tolaWeight") return;
      if (k === "password" && isEdit && !form.password) return;
      const err = validateOne(k, form[k]);
      if (err) all[k] = err;
    });
    setErrors(all);
    setTouched(Object.fromEntries(Object.keys(EMPTY).map(k => [k, true])));
    return !Object.keys(all).length;
  };

  const submit = async () => {
    if (!validate()) {
      toast.add("Validation failed", "Please fix all errors before saving.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        shopName: form.shopName.trim(),
        phoneNumber: form.phoneNumber || undefined,
        whatsappNumber: form.whatsappNumber || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        isActive: form.isActive,
        tolaWeight: Number(form.tolaWeight),
      };
      if (!isEdit) payload.password = form.password;
      else if (form.password) payload.password = form.password;
      if (isEdit) {
        await saAPI.updateAdmin(admin._id, payload);
        toast.add("Changes saved", `${form.shopName} has been updated successfully.`);
      } else {
        await saAPI.createAdmin(payload);
        toast.add("Admin created", `${form.shopName} has been added to the network.`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.add("Save failed", err.response?.data?.message || "Something went wrong. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const e = errors;
  // Dashboard-consistent modal bg
  const modalBg = isLightTheme ? theme.cardBg : theme.bg;

  return (
    <div className="fixed inset-0 z-[50] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg flex flex-col shadow-2xl overflow-hidden animate-slideUp"
        style={{
          background: modalBg,
          border: `1px solid ${theme.border}`,
          maxHeight: "92dvh",
          borderRadius: "16px 16px 0 0",
          boxShadow: isLightTheme
            ? `0 4px 24px ${theme.primary}10, 0 1px 4px rgba(0,0,0,0.06)`
            : `0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 ${theme.primary}15`,
        }}
      >
        {/* Gradient top strip — matches Dashboard hero card accent */}
        <div
          className="h-0.5 w-full shrink-0"
          style={{ background: isEdit ? theme.gradient : 'linear-gradient(90deg, #10b981, #059669)' }}
        />

        {/* Mobile handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-0.5 shrink-0">
          <div className="w-8 h-1 rounded-full" style={{ background: theme.border }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: isEdit ? `${theme.primary}18` : '#10b98118',
                color: isEdit ? theme.primary : '#10b981',
                border: `1px solid ${isEdit ? `${theme.primary}30` : '#10b98130'}`,
              }}
            >
              <Icon path={isEdit ? I.edit : I.plus} size={15} />
            </div>
            <div>
              <h2 className="text-sm font-black leading-tight" style={{ color: theme.textPrimary }}>
                {isEdit ? "Edit Shop Admin" : "Create Shop Admin"}
              </h2>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>
                {isEdit ? `Editing ${admin?.shopName}` : "Add a new shop to the network"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition"
            style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}
            onMouseEnter={ev => ev.currentTarget.style.background = `${theme.border}`}
            onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}
          >
            <Icon path={I.close} size={14} />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          <div className="px-5 py-5 space-y-5">

            {/* Account Details */}
            <div>
              <SectionDivider dotColor={theme.primary} theme={theme} isLightTheme={isLightTheme}>Account Details</SectionDivider>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextInput label="Full Name" value={form.name} onChange={set("name")} onBlur={blur("name")}
                  placeholder="Ahmed Khan" required error={touched.name ? e.name : ""} className="pl-3"
                  theme={theme} isLightTheme={isLightTheme} />
                <PhoneField label="Phone Number (login & shop)" value={form.phoneNumber}
                  onChange={set("phoneNumber")} required onBlur={blur("phoneNumber")}
                  error={touched.phoneNumber ? e.phoneNumber : ""} theme={theme} isLightTheme={isLightTheme} />
                {!isEdit && (
                  <PasswordInput label="Password"
                    value={form.password} onChange={set("password")}
                    placeholder="Minimum 8 characters"
                    required error={touched.password ? e.password : ""}
                    theme={theme} isLightTheme={isLightTheme} />
                )}

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <FieldLabel theme={theme} isLightTheme={isLightTheme}>Account Status</FieldLabel>
                  <div className="flex gap-2" style={{ height: "46px" }}>
                    {[
                      { val: true, label: "Active", activeStyle: { borderColor: "#10b981", background: '#10b98115', color: '#10b981' } },
                      { val: false, label: "Inactive", activeStyle: { borderColor: "#ef4444", background: '#ef444415', color: '#ef4444' } },
                    ].map(({ val, label, activeStyle }) => (
                      <button key={String(val)} type="button" onClick={() => setForm(f => ({ ...f, isActive: val }))}
                        className="flex-1 rounded-xl border-2 text-xs font-black transition-all duration-200"
                        style={form.isActive === val
                          ? activeStyle
                          : { borderColor: theme.border, color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70`, background: "transparent" }
                        }>
                        <span className="flex items-center justify-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full"
                            style={{ background: form.isActive === val ? (val ? "#10b981" : "#ef4444") : (isLightTheme ? theme.textMuted : `${theme.textPrimary}50`) }} />
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Shop Details */}
            <div>
              <SectionDivider dotColor="#3b82f6" theme={theme} isLightTheme={isLightTheme}>Shop Details</SectionDivider>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextInput label="Shop Name" icon={I.shop} value={form.shopName}
                  onChange={set("shopName")} onBlur={blur("shopName")}
                  placeholder="Gold Palace Karachi" required error={touched.shopName ? e.shopName : ""}
                  theme={theme} isLightTheme={isLightTheme} />
                <TextInput label="City" icon={I.city} value={form.city} onChange={set("city")}
                  placeholder="Karachi" theme={theme} isLightTheme={isLightTheme} />
                {/* Phone number is captured above (login & shop) — removed duplicate field */}
                <WhatsAppField label="WhatsApp Number" value={form.whatsappNumber}
                  onChange={set("whatsappNumber")} error={touched.whatsappNumber ? e.whatsappNumber : ""}
                  theme={theme} isLightTheme={isLightTheme} />
                <TolaWeightField label="Tola Weight" value={form.tolaWeight}
                  onChange={(v) => setForm(f => ({ ...f, tolaWeight: v }))} required
                  theme={theme} isLightTheme={isLightTheme} />
                <div className="sm:col-span-2">
                  <TextInput label="Address" icon={I.mapPin} value={form.address} onChange={set("address")}
                    placeholder="Shop #12, Gold Market, Saddar, Karachi"
                    theme={theme} isLightTheme={isLightTheme} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3.5 shrink-0"
          style={{ borderTop: `1px solid ${theme.border}`, background: modalBg }}
        >
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ border: `2px solid ${theme.border}`, color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80`, background: "transparent" }}>
              Cancel
            </button>
            <button type="button" onClick={submit} disabled={saving}
              className="px-5 py-2 rounded-lg text-xs font-black text-white transition-all disabled:opacity-60 shadow-sm flex items-center gap-1.5"
              style={{ background: isEdit ? theme.gradient : 'linear-gradient(90deg, #10b981, #059669)', boxShadow: `0 4px 16px ${isEdit ? theme.primary : '#10b981'}40` }}>
              {saving ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (isEdit ? "Save Changes" : "Create Admin")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW MODAL ───────────────────────────────────────────────────────────────
function ViewModal({ open, admin, onClose, onEdit, onToggle, onDelete, toggling, deleting, toast }) {
  const { theme, isLightTheme } = useTheme();
  const [prices, setPrices] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    if (!open || !admin) return;
    setLoadingPrices(true);
    saAPI.getDashboard()
      .then(res => setPrices(res.data?.livePrices || res.data))
      .catch(() => toast.add("Prices unavailable", "Could not load live prices.", "warning"))
      .finally(() => setLoadingPrices(false));
  }, [open, admin?._id]);

  if (!open || !admin) return null;

  const gold = prices?.gold;
  const silver = prices?.silver;
  const currencies = prices?.currencies?.adjusted ?? prices?.currencies ?? {};
  const base2385 = gold?.base2385PerTolaPKR ?? (gold?.basePricePerTolaPKR != null ? Math.round(gold.basePricePerTolaPKR * 23.85 / 24) : null);

  const sellPrices = [
    { label: "24K Gold", live: gold?.basePricePerTolaPKR, diff: admin.diff_24k ?? 0, final: gold?.basePricePerTolaPKR != null ? gold.basePricePerTolaPKR + (admin.diff_24k ?? 0) : null },
    { label: "23.85K Gold", live: base2385, diff: admin.diff_2385k ?? 0, final: base2385 != null ? base2385 + (admin.diff_2385k ?? 0) : null },
    { label: "Silver 999", live: silver?.basePricePerTolaPKR, diff: admin.diff_silver ?? 0, final: silver?.basePricePerTolaPKR != null ? silver.basePricePerTolaPKR + (admin.diff_silver ?? 0) : null },
  ];
  const buyPrices = [
    { label: "24K Gold", live: gold?.basePricePerTolaPKR, diff: admin.buy_diff_24k ?? 0, final: gold?.basePricePerTolaPKR != null ? gold.basePricePerTolaPKR + (admin.buy_diff_24k ?? 0) : null },
    { label: "23.85K Gold", live: base2385, diff: admin.buy_diff_2385k ?? 0, final: base2385 != null ? base2385 + (admin.buy_diff_2385k ?? 0) : null },
    { label: "Silver 999", live: silver?.basePricePerTolaPKR, diff: admin.buy_diff_silver ?? 0, final: silver?.basePricePerTolaPKR != null ? silver.basePricePerTolaPKR + (admin.buy_diff_silver ?? 0) : null },
  ];

  const modalBg = isLightTheme ? theme.cardBg : theme.bg;
  const subBg = isLightTheme ? `${theme.primary}06` : 'rgba(255,255,255,0.03)';
  const buySubBg = isLightTheme ? '#3b82f608' : 'rgba(59,130,246,0.05)';

  const diffStyle = (v) => ({
    color: v > 0 ? '#10b981' : v < 0 ? '#ef4444' : isLightTheme ? theme.textMuted : `${theme.textPrimary}75`,
    fontWeight: 700,
  });

  return (
    <div className="fixed inset-0 z-[50] flex items-end sm:items-center justify-center p-0 sm:p-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg flex flex-col shadow-2xl overflow-hidden animate-slideUp"
        style={{
          background: modalBg,
          border: `1px solid ${theme.border}`,
          maxHeight: "85dvh",
          borderRadius: "16px 16px 0 0",
          boxShadow: isLightTheme
            ? `0 4px 24px ${theme.primary}10, 0 1px 4px rgba(0,0,0,0.06)`
            : `0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 ${theme.primary}15`,
        }}
      >
        {/* Gradient strip */}
        <div
          className="h-0.5 w-full shrink-0"
          style={{ background: admin.isActive ? theme.gradient : 'linear-gradient(90deg, #ef4444, #f87171)' }}
        />

        <div className="sm:hidden flex justify-center pt-2.5 pb-0.5 shrink-0">
          <div className="w-8 h-1 rounded-full" style={{ background: theme.border }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar admin={admin} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black truncate" style={{ color: theme.textPrimary }}>{admin.shopName}</h2>
                <StatusBadge active={admin.isActive} theme={theme} isLightTheme={isLightTheme} />
              </div>
              <p className="text-[11px] mt-0.5 font-semibold" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>{admin.name}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition shrink-0 ml-2"
            style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
            <Icon path={I.close} size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          <div className="px-5 py-5 space-y-6">

            {/* Added By Super Admin */}
            {admin.createdBy && (
              <div>
                <SectionDivider dotColor="#8b5cf6" theme={theme} isLightTheme={isLightTheme}>Added By</SectionDivider>
                <div
                  className="rounded-xl p-3.5 flex items-center gap-3"
                  style={{ background: '#8b5cf612', border: '1px solid #8b5cf625' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: '#8b5cf618',
                      border: '1px solid #8b5cf630',
                      color: '#8b5cf6',
                    }}
                  >
                    <Icon path={I.users} size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>Super Admin</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: theme.textPrimary }}>{admin.createdBy.name || "Unknown"}</p>
                    <p className="text-xs mt-0.5 break-all" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>{admin.createdBy.phoneNumber || admin.createdBy.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Contact */}
            <div>
              <SectionDivider dotColor={isLightTheme ? theme.textMuted : `${theme.textPrimary}60`} theme={theme} isLightTheme={isLightTheme}>Contact Information</SectionDivider>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: I.phone, label: "Phone", val: admin.phoneNumber },
                  { icon: I.phone, label: "WhatsApp", val: admin.whatsappNumber ? "+92 " + admin.whatsappNumber : null },
                  { icon: I.city, label: "City", val: admin.city },
                  { icon: I.mapPin, label: "Address", val: admin.address },
                  { icon: I.scale, label: "Tola Weight", val: admin.tolaWeight ? `${admin.tolaWeight}g` : null },
                ].filter(r => r.val).map((row) => (
                  <div
                    key={row.label}
                    className="rounded-xl p-3 flex items-start gap-2.5"
                    style={{ background: isLightTheme ? `${theme.primary}06` : 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border}` }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: `${theme.primary}18`,
                        border: `1px solid ${theme.primary}25`,
                        color: theme.primary,
                      }}
                    >
                      <Icon path={row.icon} size={11} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>{row.label}</p>
                      <p className="text-xs font-semibold mt-0.5 break-all" style={{ color: theme.textPrimary }}>{row.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prices */}
            {loadingPrices ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${theme.primary}20` }} />
                  <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: theme.primary }} />
                </div>
                <p className="text-[11px] font-semibold" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>Loading live prices…</p>
              </div>
            ) : (
              <>
                {/* Sell prices */}
                <div>
                  <SectionDivider dotColor={theme.primary} theme={theme} isLightTheme={isLightTheme}>Sell Prices — Customer Buys</SectionDivider>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {sellPrices.map(({ label, live, diff, final }) => (
                      <div
                        key={label}
                        className="rounded-2xl p-4"
                        style={{ background: subBg, border: `1px solid ${theme.primary}20` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.primary }}>{label}</p>
                          <span
                            className="text-[8px] font-black px-1.5 py-0.5 rounded-lg"
                            style={{ background: `${theme.primary}18`, color: theme.primary }}
                          >SELL</span>
                        </div>
                        <div>
                          <p className="text-lg font-black leading-none font-mono" style={{ color: theme.textPrimary }}>
                            {final != null ? `PKR ${fmt(final)}` : "—"}
                          </p>
                          <p className="text-[9px] mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>per tola</p>
                        </div>
                        <div className="pt-2 mt-2 space-y-1" style={{ borderTop: `1px solid ${theme.primary}20` }}>
                          <div className="flex justify-between text-[10px]">
                            <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>Live rate</span>
                            <span className="font-bold font-mono" style={{ color: theme.textPrimary }}>{live != null ? `PKR ${fmt(live)}` : "—"}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>Markup</span>
                            <span className="font-black font-mono" style={diffStyle(diff)}>
                              {diff > 0 ? "+" : ""}{fmt(diff)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buy prices */}
                <div>
                  <SectionDivider dotColor="#3b82f6" theme={theme} isLightTheme={isLightTheme}>Buy Prices — Customer Sells</SectionDivider>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {buyPrices.map(({ label, live, diff, final }) => (
                      <div
                        key={label}
                        className="rounded-2xl p-4"
                        style={{ background: buySubBg, border: '1px solid #3b82f620' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#3b82f6' }}>{label}</p>
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-lg" style={{ background: '#3b82f618', color: '#3b82f6' }}>BUY</span>
                        </div>
                        <div>
                          <p className="text-lg font-black leading-none font-mono" style={{ color: theme.textPrimary }}>
                            {final != null ? `PKR ${fmt(final)}` : "—"}
                          </p>
                          <p className="text-[9px] mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>per tola</p>
                        </div>
                        <div className="pt-2 mt-2 space-y-1" style={{ borderTop: '1px solid #3b82f620' }}>
                          <div className="flex justify-between text-[10px]">
                            <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>Live rate</span>
                            <span className="font-bold font-mono" style={{ color: theme.textPrimary }}>{live != null ? `PKR ${fmt(live)}` : "—"}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>Diff</span>
                            <span className="font-black font-mono" style={diffStyle(diff)}>
                              {diff > 0 ? "+" : ""}{fmt(diff)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Currency rates */}
                {Object.keys(CURRENCY_META).length > 0 && (
                  <div>
                    <SectionDivider dotColor="#8b5cf6" theme={theme} isLightTheme={isLightTheme}>
                      Currency Exchange Rates
                    </SectionDivider>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          title: "Sell Rates",
                          accentColor: theme.primary,
                          bg: subBg,
                          border: `${theme.primary}20`,
                          getDiff: (code) => Number(admin.currencyDiff?.[code] ?? 0),
                        },
                        {
                          title: "Buy Rates",
                          accentColor: '#3b82f6',
                          bg: buySubBg,
                          border: '#3b82f620',
                          getDiff: (code) => Number(admin.currencyBuyDiff?.[code] ?? 0),
                        },
                      ].map(({ title, accentColor, bg, border, getDiff }) => (
                        <div key={title} className="rounded-2xl p-3.5"
                          style={{ background: bg, border: `1px solid ${border}` }}>
                          <p className="text-[9px] font-black uppercase tracking-widest mb-2.5 flex items-center gap-1.5"
                            style={{ color: accentColor }}>
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: accentColor }} />
                            {title} (Admin's Own Diff)
                          </p>
                          <div className="space-y-2.5">
                            {Object.entries(CURRENCY_META).map(([code, meta]) => {
                              const diff = getDiff(code);
                              return (
                                <div key={code} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{meta.flag}</span>
                                    <div>
                                      <p className="text-[11px] font-black" style={{ color: theme.textPrimary }}>{code}</p>
                                      <p className="text-[9px]" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}65` }}>{meta.name}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[11px] font-black font-mono" style={{ color: theme.textPrimary }}>
                                      {diff > 0 ? `+${diff}` : diff === 0 ? "No diff" : diff} PKR
                                    </p>
                                    <p className="text-[9px]" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}65` }}>
                                      vs live rate
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance */}
                {(admin.totalSales != null || admin.totalPurchases != null) && (
                  <div>
                    <SectionDivider dotColor="#10b981" theme={theme} isLightTheme={isLightTheme}>Performance Overview</SectionDivider>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { label: "Total Sales", value: `PKR ${fmt(admin.totalSales)}`, accentColor: '#3b82f6' },
                        { label: "Total Purchases", value: `PKR ${fmt(admin.totalPurchases)}`, accentColor: '#8b5cf6' },
                        { label: "Sales Orders", value: fmt(admin.salesCount), accentColor: '#10b981' },
                        { label: "Purchase Orders", value: fmt(admin.purchasesCount), accentColor: '#f59e0b' },
                      ].map(({ label, value, accentColor }) => (
                        <div
                          key={label}
                          className="rounded-xl p-3 text-center"
                          style={{
                            background: `${accentColor}12`,
                            border: `1px solid ${accentColor}25`,
                          }}
                        >
                          <p className="text-sm font-black leading-tight" style={{ color: accentColor }}>{value}</p>
                          <p className="text-[9px] font-bold uppercase tracking-wider mt-1 leading-tight" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="px-5 py-4 shrink-0"
          style={{ borderTop: `1px solid ${theme.border}`, background: modalBg }}
        >
          <div className="flex gap-2">
            <button onClick={() => onToggle(admin)} disabled={toggling}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
              style={admin.isActive
                ? { background: '#ef444415', color: '#ef4444', border: '1px solid #ef444425' }
                : { background: '#10b98115', color: '#10b981', border: '1px solid #10b98125' }
              }>
              {toggling ? <span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : null}
              {admin.isActive ? "Deactivate" : "Activate"}
            </button>
            <button
              onClick={() => { onClose(); onEdit(admin); }}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              style={{ background: `${theme.primary}18`, color: theme.primary, border: `1px solid ${theme.primary}25` }}
            >
              <Icon path={I.edit} size={12} /> Edit
            </button>
            <button onClick={() => onDelete(admin)} disabled={deleting}
              className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
              style={{ background: '#ef4444', color: '#ffffff', border: '1px solid #ef444440' }}>
              {deleting ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon path={I.trash} size={12} />}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN CARD ───────────────────────────────────────────────────────────────
function AdminCard({ admin, onView, onEdit, onToggle, onDelete, toggling, deleting }) {
  const { theme, isLightTheme } = useTheme();

  const sellDiffs = [
    { label: "24K", val: admin.diff_24k ?? 0 },
    { label: "23.85K", val: admin.diff_2385k ?? 0 },
    { label: "Ag", val: admin.diff_silver ?? 0 },
  ];
  const buyDiffs = [
    { label: "24K", val: admin.buy_diff_24k ?? 0 },
    { label: "23.85K", val: admin.buy_diff_2385k ?? 0 },
    { label: "Ag", val: admin.buy_diff_silver ?? 0 },
  ];

  const cardBg = isLightTheme ? theme.cardBg : theme.bg;

  return (
    <div
      className="rounded-2xl transition-all duration-300 hover:-translate-y-0.5 overflow-hidden flex flex-col group"
      style={{
        background: cardBg,
        border: `1px solid ${theme.border}`,
        boxShadow: isLightTheme
          ? `0 4px 24px ${theme.primary}10, 0 1px 4px rgba(0,0,0,0.06)`
          : `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 ${theme.primary}15`,
      }}
    >
      {/* Gradient accent strip — matches Dashboard hero cards */}
      <div
        className="h-0.5 w-full"
        style={{ background: admin.isActive ? theme.gradient : 'linear-gradient(90deg, #ef4444, #f87171)' }}
      />

      {/* Subtle dot pattern — matches Dashboard */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "20px 20px",
          color: theme.primary,
        }}
      />

      <div className="relative p-4 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar admin={admin} size={44} />
            <div className="min-w-0">
              <p className="font-black text-sm leading-tight truncate" style={{ color: theme.textPrimary }}>{admin.shopName}</p>
              <p className="text-[11px] font-medium truncate mt-0.5" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>{admin.name}</p>
            </div>
          </div>
          <StatusBadge active={admin.isActive} small theme={theme} isLightTheme={isLightTheme} />
        </div>

        {/* Contact */}
        <div className="space-y-1.5">
          {[
            { icon: I.city, val: admin.city },
            { icon: I.phone, val: admin.phoneNumber },
            { icon: I.scale, val: admin.tolaWeight ? `${admin.tolaWeight}g / tola` : null },
          ].filter(r => r.val).map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>
              <Icon path={r.icon} size={12} className="shrink-0" style={{ color: isLightTheme ? theme.border : `${theme.textPrimary}40` }} />
              <span className="truncate font-medium">{r.val}</span>
            </div>
          ))}
        </div>

        {/* Added By Super Admin - on card */}
        {admin.createdBy && (
          <div
            className="rounded-lg px-2.5 py-2 text-center"
            style={{
              background: '#8b5cf610',
              border: '1px solid #8b5cf620',
            }}
          >
            <p
              className="text-[8px] leading-tight font-bold uppercase tracking-widest"
              style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}
            >
              Added By
            </p>
            <p
              className="text-xs font-bold mt-1"
              style={{ color: '#8b5cf6' }}
            >
              {admin.createdBy.name || "Super Admin"}
            </p>
          </div>
        )}

        {/* Diff badges — theme-aware, matches Dashboard CollapsibleShopCard */}
        <div className="space-y-1.5">
          {/* Sell diffs */}
          <div className="grid grid-cols-3 gap-1.5">
            {sellDiffs.map(({ label, val }) => (
              <div
                key={`s${label}`}
                className="rounded-xl px-2 py-2 text-center"
                style={{
                  background: val > 0 ? '#10b98118' : val < 0 ? '#ef444418' : `${theme.primary}10`,
                  border: `1px solid ${val > 0 ? '#10b98130' : val < 0 ? '#ef444430' : theme.border}`,
                }}
              >
                <p
                  className="text-[9px] leading-tight font-bold"
                  style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}
                >
                  {label} Sell
                </p>
                <p
                  className="text-xs font-black mt-0.5 font-mono"
                  style={{ color: val > 0 ? '#10b981' : val < 0 ? '#ef4444' : isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}
                >
                  {val > 0 ? "+" : ""}{fmt(val)}
                </p>
              </div>
            ))}
          </div>
          {/* Buy diffs */}
          <div className="grid grid-cols-3 gap-1.5">
            {buyDiffs.map(({ label, val }) => (
              <div
                key={`b${label}`}
                className="rounded-xl px-2 py-2 text-center"
                style={{
                  background: val < 0 ? '#ef444418' : val > 0 ? '#3b82f618' : `${theme.primary}10`,
                  border: `1px solid ${val < 0 ? '#ef444430' : val > 0 ? '#3b82f630' : theme.border}`,
                }}
              >
                <p
                  className="text-[9px] leading-tight font-bold"
                  style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}
                >
                  {label} Buy
                </p>
                <p
                  className="text-xs font-black mt-0.5 font-mono"
                  style={{ color: val < 0 ? '#ef4444' : val > 0 ? '#3b82f6' : isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}
                >
                  {val > 0 ? "+" : ""}{fmt(val)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 mt-auto pt-1">
          <button
            onClick={() => onView(admin)}
            className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
            style={{
              background: isLightTheme ? `${theme.primary}08` : `${theme.primary}15`,
              color: isLightTheme ? theme.textMuted : `${theme.textPrimary}90`,
              border: `1px solid ${theme.border}`,
            }}
            onMouseEnter={e => e.currentTarget.style.background = `${theme.primary}18`}
            onMouseLeave={e => e.currentTarget.style.background = isLightTheme ? `${theme.primary}08` : `${theme.primary}15`}
          >
            <Icon path={I.eye} size={12} /> View
          </button>
          <button
            onClick={() => onEdit(admin)}
            className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1"
            style={{
              background: `${theme.primary}18`,
              color: theme.primary,
              border: `1px solid ${theme.primary}30`,
            }}
            onMouseEnter={e => e.currentTarget.style.background = `${theme.primary}28`}
            onMouseLeave={e => e.currentTarget.style.background = `${theme.primary}18`}
          >
            <Icon path={I.edit} size={12} /> Edit
          </button>
          <button
            onClick={() => onToggle(admin)}
            disabled={toggling === (admin._id ?? admin.id)}
            className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center disabled:opacity-50"
            style={admin.isActive
              ? { background: '#ef444418', color: '#ef4444', border: '1px solid #ef444430' }
              : { background: '#10b98118', color: '#10b981', border: '1px solid #10b98130' }
            }
          >
            {toggling === (admin._id ?? admin.id) ? "…" : admin.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => onDelete(admin)}
            disabled={deleting === (admin._id ?? admin.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shrink-0"
            style={{ background: '#ef4444', color: '#ffffff' }}
            onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
          >
            <Icon path={I.trash} size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGINATION ───────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, pageSize, setPageSize, setCurrentPage, totalItems }) {
  const { theme } = useTheme();
  const pageSizes = [20, 30, 50];
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 pt-2">
      {/* Info + page size */}
      <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
        <p className="text-xs font-semibold" style={{ color: theme.textMuted }}>
          Showing <span className="font-black" style={{ color: theme.textPrimary }}>{from}–{to}</span> of <span className="font-black" style={{ color: theme.textPrimary }}>{totalItems}</span> admins
        </p>
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold" style={{ color: theme.textMuted }}>Per page:</p>
          <div className="flex gap-1">
            {pageSizes.map(s => (
              <button key={s} onClick={() => { setPageSize(s); setCurrentPage(1); }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                style={pageSize === s
                  ? { background: theme.primary, color: "#ffffff" }
                  : { background: theme.border, color: theme.textMuted }
                }>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 flex-wrap justify-center">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderColor: theme.border, color: theme.textMuted }}>
            <Icon path={I.chevL} size={14} />
          </button>
          {pages.map((p, i) => (
            p === "..." ? (
              <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs" style={{ color: theme.textMuted }}>…</span>
            ) : (
              <button key={p} onClick={() => setCurrentPage(p)}
                className="w-8 h-8 rounded-xl text-xs font-black transition-all"
                style={currentPage === p
                  ? { background: theme.primary, color: "#ffffff" }
                  : { border: `2px solid ${theme.border}`, color: theme.textMuted }
                }>
                {p}
              </button>
            )
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderColor: theme.border, color: theme.textMuted }}>
            <Icon path={I.chevR} size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminManagement() {
  const { theme, isLightTheme } = useTheme();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("none");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef(null);

  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [viewAdmin, setViewAdmin] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, type: "", admin: null });
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const toast = useToast();

  useEffect(() => {
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchAdmins = useCallback(async (isRefresh = false) => {
    setLoadError("");
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await saAPI.getAdmins();
      setAdmins(res.data?.admins ?? res.data ?? []);
    } catch (err) {
      setLoadError(err.response?.data?.message || "Failed to load admins.");
      toast.add("Load failed", err.response?.data?.message || "Could not load admin list.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const filtered = admins.filter(a => {
    const matchFilter = filter === "all" || (filter === "active" && a.isActive) || (filter === "inactive" && !a.isActive);
    const q = search.toLowerCase().trim();
    const matchSearch = !q || [a.shopName, a.name, a.email, a.city].some(v => v?.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "none") return 0;
    const aVal = a.diff_24k ?? 0;
    const bVal = b.diff_24k ?? 0;
    return sortBy === "price_high" ? bVal - aVal : aVal - bVal;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [search, filter, sortBy, pageSize]);

  const handleToggle = async (admin) => {
    setToggling(admin._id ?? admin.id);
    try {
      await saAPI.toggleAdminStatus(admin._id ?? admin.id);
      toast.add("Status updated", `${admin.shopName} ${admin.isActive ? "deactivated" : "activated"} successfully.`);
      await fetchAdmins(true);
      if (viewAdmin?._id === admin._id) setViewAdmin(d => d ? { ...d, isActive: !d.isActive } : d);
    } catch (err) {
      toast.add("Toggle failed", err.response?.data?.message || "Could not update status.", "error");
    } finally {
      setToggling(null);
      setConfirm({ open: false, type: "", admin: null });
    }
  };

  const handleDelete = async () => {
    const admin = confirm.admin;
    if (!admin) return;
    setDeleting(admin._id ?? admin.id);
    try {
      await saAPI.deleteAdmin(admin._id ?? admin.id);
      toast.add("Admin deleted", `${admin.shopName} has been permanently removed.`);
      if (viewOpen && viewAdmin?._id === admin._id) setViewOpen(false);
      await fetchAdmins(true);
    } catch (err) {
      toast.add("Delete failed", err.response?.data?.message || "Could not delete admin.", "error");
    } finally {
      setDeleting(null);
      setConfirm({ open: false, type: "", admin: null });
    }
  };

  const total = admins.length;
  const active = admins.filter(a => a.isActive).length;
  const inactive = total - active;

  const sortLabels = { none: "Default Order", price_high: "Price: High → Low", price_low: "Price: Low → High" };
  const sortIcons = { none: I.sort, price_high: I.sortZA, price_low: I.sortAZ };

  const pageBg = isLightTheme ? (theme.pageBg ?? '#f2f1ed') : (theme.bg ?? '#0c0c0c');
  const cardBg = isLightTheme ? theme.cardBg : theme.bg;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${theme.primary}20` }} />
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: theme.primary }} />
          <div className="absolute inset-3 rounded-full border" style={{ borderColor: `${theme.primary}30` }} />
        </div>
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>Loading shop admins…</p>
      </div>
    </div>
  );

  if (loadError) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center"
        style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430' }}
      >
        <Icon path={I.alert} size={30} />
      </div>
      <div>
        <p className="font-black text-2xl" style={{ color: theme.textPrimary }}>Failed to load admins</p>
        <p className="text-sm mt-2 max-w-sm leading-relaxed" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }}>{loadError}</p>
      </div>
      <button
        onClick={() => fetchAdmins()}
        className="px-7 py-3.5 text-white text-sm font-black rounded-2xl transition-all shadow-sm flex items-center gap-2"
        style={{ background: theme.gradient, boxShadow: `0 4px 16px ${theme.primary}40` }}
      >
        <Icon path={I.refresh} size={15} /> Try Again
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideUp { animation: slideUp 0.22s cubic-bezier(.16,1,.3,1) forwards; }
      `}</style>

      <div className="space-y-6 pb-20 max-w-screen-2xl mx-auto px-0">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: theme.textPrimary }}>
              Admin Management
            </h1>
            <p className="text-sm mt-1" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>
              Manage all shop admins across the network
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchAdmins(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                border: `1px solid ${theme.border}`,
                background: isLightTheme ? cardBg : theme.bg,
                color: theme.textPrimary,
                boxShadow: isLightTheme ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Icon path={I.refresh} size={15} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
            <button
              onClick={() => { setEditAdmin(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-black shadow-sm transition-all"
              style={{ background: theme.gradient, boxShadow: `0 4px 16px ${theme.primary}40` }}
            >
              <Icon path={I.plus} size={15} />
              <span>New Admin</span>
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Shops", value: total, accentColor: theme.primary },
            { label: "Active", value: active, accentColor: '#10b981' },
            { label: "Inactive", value: inactive, accentColor: '#ef4444' },
          ].map(({ label, value, accentColor }) => (
            <div
              key={label}
              className="rounded-2xl px-3 sm:px-5 py-4 sm:py-5 text-center transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: isLightTheme ? cardBg : theme.bg,
                border: `1px solid ${theme.border}`,
                boxShadow: isLightTheme ? '0 1px 8px rgba(0,0,0,0.06)' : `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 ${accentColor}15`,
              }}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
              </div>
              <p className="text-2xl sm:text-4xl font-black leading-none" style={{ color: accentColor }}>{value}</p>
              <p
                className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest mt-1.5"
                style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}90` }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Search, Filter, Sort ── */}
        <div className="space-y-3">
          {/* Search + sort */}
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}>
                <Icon path={I.search} size={15} />
              </span>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search shop, admin, email or city…"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none transition-all"
                style={{
                  background: isLightTheme ? cardBg : theme.bg,
                  borderColor: theme.border,
                  color: theme.textPrimary,
                  boxShadow: isLightTheme ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              />
            </div>

            {/* Sort dropdown */}
            <div ref={sortRef} className="relative shrink-0">
              <button
                onClick={() => setShowSortMenu(s => !s)}
                className="flex items-center gap-2 px-3 sm:px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap"
                style={{
                  border: `1px solid ${sortBy !== "none" ? theme.primary : theme.border}`,
                  background: sortBy !== "none" ? `${theme.primary}18` : (isLightTheme ? cardBg : theme.bg),
                  color: sortBy !== "none" ? theme.primary : (isLightTheme ? theme.textMuted : `${theme.textPrimary}80`),
                  boxShadow: isLightTheme ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <Icon path={sortIcons[sortBy]} size={15} />
                <span className="hidden sm:inline">{sortBy === "none" ? "Sort" : sortLabels[sortBy]}</span>
              </button>
              {showSortMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-2xl shadow-xl z-20 overflow-hidden animate-slideUp"
                  style={{
                    background: isLightTheme ? cardBg : theme.bg,
                    border: `1px solid ${theme.border}`,
                    boxShadow: isLightTheme ? '0 4px 24px rgba(0,0,0,0.1)' : '0 4px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  {Object.entries(sortLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-left transition-colors"
                      style={{
                        background: sortBy === key ? `${theme.primary}18` : "transparent",
                        color: sortBy === key ? theme.primary : theme.textPrimary,
                      }}
                      onMouseEnter={e => { if (sortBy !== key) e.currentTarget.style.background = `${theme.primary}08`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = sortBy === key ? `${theme.primary}18` : "transparent"; }}
                    >
                      <Icon path={sortIcons[key]} size={15} style={{ color: sortBy === key ? theme.primary : (isLightTheme ? theme.textMuted : `${theme.textPrimary}70`) }} />
                      {label}
                      {sortBy === key && <span className="ml-auto"><Icon path={I.check} size={13} style={{ color: theme.primary }} /></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status filters */}
          <div className="flex gap-2">
            {[
              { key: "all", label: "All Shops", count: total },
              { key: "active", label: "Active", count: active },
              { key: "inactive", label: "Inactive", count: inactive },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 sm:px-5 rounded-2xl text-xs sm:text-sm font-black transition-all"
                style={filter === key
                  ? { background: theme.gradient, color: "#ffffff", border: `1px solid ${theme.primary}`, boxShadow: `0 4px 12px ${theme.primary}30` }
                  : { background: isLightTheme ? cardBg : theme.bg, border: `1px solid ${theme.border}`, color: isLightTheme ? theme.textMuted : `${theme.textPrimary}80` }
                }
              >
                {label}
                <span
                  className="text-[10px] font-black px-1.5 py-0.5 rounded-lg"
                  style={filter === key
                    ? { background: "rgba(255,255,255,0.2)", color: "#ffffff" }
                    : { background: `${theme.primary}15`, color: theme.primary }
                  }
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Active filter indicator */}
          {(search || filter !== "all" || sortBy !== "none") && (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[11px] font-semibold" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>Active filters:</p>
              {search && (
                <span
                  className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl"
                  style={{ background: '#3b82f618', color: '#3b82f6', border: '1px solid #3b82f625' }}
                >
                  "{search}"
                  <button onClick={() => setSearch("")} className="hover:opacity-70 transition"><Icon path={I.close} size={10} /></button>
                </span>
              )}
              {filter !== "all" && (
                <span
                  className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl capitalize"
                  style={{ background: `${theme.primary}18`, color: theme.primary, border: `1px solid ${theme.primary}30` }}
                >
                  {filter}
                  <button onClick={() => setFilter("all")}><Icon path={I.close} size={10} /></button>
                </span>
              )}
              {sortBy !== "none" && (
                <span
                  className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl"
                  style={{ background: '#8b5cf618', color: '#8b5cf6', border: '1px solid #8b5cf625' }}
                >
                  {sortLabels[sortBy]}
                  <button onClick={() => setSortBy("none")} className="hover:opacity-70 transition"><Icon path={I.close} size={10} /></button>
                </span>
              )}
              <button
                onClick={() => { setSearch(""); setFilter("all"); setSortBy("none"); }}
                className="text-[11px] font-bold underline ml-1 transition-colors"
                style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}70` }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Grid ── */}
        {paginated.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{
                background: isLightTheme ? cardBg : theme.bg,
                border: `1px solid ${theme.border}`,
                color: isLightTheme ? theme.border : `${theme.textPrimary}30`,
              }}
            >
              <Icon path={I.shop} size={40} />
            </div>
            <p className="font-black text-xl" style={{ color: theme.textPrimary }}>
              {search || filter !== "all" ? "No admins match your filters" : "No shop admins yet"}
            </p>
            <p className="text-sm mt-2 max-w-sm mx-auto" style={{ color: isLightTheme ? theme.textMuted : `${theme.textPrimary}75` }}>
              {search || filter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Click 'New Admin' to add your first shop to the network"}
            </p>
            {(search || filter !== "all") && (
              <button
                onClick={() => { setSearch(""); setFilter("all"); setSortBy("none"); }}
                className="mt-5 px-5 py-2.5 text-white text-sm font-black rounded-2xl hover:opacity-90 transition-all shadow-sm"
                style={{ background: theme.gradient, boxShadow: `0 4px 16px ${theme.primary}40` }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {paginated.map(admin => (
              <AdminCard
                key={admin._id ?? admin.id}
                admin={admin}
                onView={a => { setViewAdmin(a); setViewOpen(true); }}
                onEdit={a => { setEditAdmin(a); setModalOpen(true); }}
                onToggle={a => setConfirm({ open: true, type: "toggle", admin: a })}
                onDelete={a => setConfirm({ open: true, type: "delete", admin: a })}
                toggling={toggling}
                deleting={deleting}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {sorted.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: isLightTheme ? cardBg : theme.bg,
              border: `1px solid ${theme.border}`,
              boxShadow: isLightTheme ? '0 1px 8px rgba(0,0,0,0.06)' : '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            <Pagination
              currentPage={safePage} totalPages={totalPages} pageSize={pageSize}
              setPageSize={setPageSize} setCurrentPage={setCurrentPage} totalItems={sorted.length}
            />
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AdminFormModal
        open={modalOpen}
        admin={editAdmin}
        onClose={() => { setModalOpen(false); setEditAdmin(null); }}
        onSaved={() => fetchAdmins(true)}
        toast={toast}
      />

      <ViewModal
        open={viewOpen}
        admin={viewAdmin}
        onClose={() => setViewOpen(false)}
        onEdit={a => { setViewOpen(false); setEditAdmin(a); setModalOpen(true); }}
        onToggle={a => setConfirm({ open: true, type: "toggle", admin: a })}
        onDelete={a => { setViewOpen(false); setConfirm({ open: true, type: "delete", admin: a }); }}
        toggling={toggling === viewAdmin?._id}
        deleting={deleting === viewAdmin?._id}
        toast={toast}
      />

      <ConfirmDialog
        open={confirm.open}
        title={confirm.type === "delete" ? "Delete Shop Admin?" : confirm.admin?.isActive ? "Deactivate Admin?" : "Activate Admin?"}
        message={confirm.type === "delete"
          ? `This will permanently delete "${confirm.admin?.shopName}" and all associated data. This action cannot be undone.`
          : confirm.admin?.isActive
            ? `"${confirm.admin?.shopName}" will lose access immediately. You can reactivate anytime.`
            : `"${confirm.admin?.shopName}" will regain full system access.`}
        confirmLabel={confirm.type === "delete" ? "Delete Permanently" : confirm.admin?.isActive ? "Deactivate" : "Activate"}
        variant={confirm.type === "delete" || confirm.admin?.isActive ? "danger" : "success"}
        onConfirm={confirm.type === "delete" ? handleDelete : () => handleToggle(confirm.admin)}
        onCancel={() => setConfirm({ open: false, type: "", admin: null })}
        loading={confirm.type === "delete" ? !!deleting : !!toggling}
      />

      <Toast toasts={toast.toasts} removeToast={toast.remove} />
    </>
  );
}