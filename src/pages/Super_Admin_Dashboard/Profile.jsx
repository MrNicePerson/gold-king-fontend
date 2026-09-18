// frontend/src/pages/Super_Admin_Dashboard/Profile.jsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import * as saAPI from "../../services/superAdminApi";
import api from "../../services/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (name) =>
  name ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "SA";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = ({ d, className = "w-5 h-5", style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ICONS = {
  user:     "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  mail:     "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  lock:     "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  address:  "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  phone:    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z M11.999 2C6.477 2 2 6.484 2 12.017c0 1.99.52 3.855 1.428 5.462L2 22l4.67-1.407A9.916 9.916 0 0012 22c5.523 0 10-4.484 10-10.017C22 6.48 17.522 2 12 2z",
  shop:     "M19 21H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v11a2 2 0 01-2 2z M3 8h18M9 4v4M15 4v4",
  city:     "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  eye:      "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  eyeOff:   "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21",
  check:    "M5 13l4 4L19 7",
  alert:    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  edit:     "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  shield:   "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  key:      "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
  info:     "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  id:       "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  camera:   "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z",
};

// ─── Toast Queue ──────────────────────────────────────────────────────────────
function Toast({ toasts, onClose }) {
  return (
    <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-50 flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 360 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold w-full ml-auto"
          style={{
            background: t.type === "error" ? "#dc2626" : t.type === "warning" ? "#d97706" : "#059669",
            color: "white",
          }}
        >
          <Ico d={t.type === "error" || t.type === "warning" ? ICONS.alert : ICONS.check} className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-sm">{t.msg}</span>
          <button onClick={() => onClose(t.id)} className="opacity-60 hover:opacity-100 text-lg leading-none ml-1 shrink-0">×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, icon, error, hint, children, required, theme, isLightTheme }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
        {label}{required && <span style={{ color: theme.primary }}>*</span>}
      </label>
      <div
        className={`relative flex items-center rounded-2xl border-2 transition-all duration-200 ${
          error
            ? "border-red-400 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
            : isLightTheme
            ? "border-gray-200 focus-within:border-amber-400 focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.12)]"
            : "border-gray-700 focus-within:border-amber-500 focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.12)]"
        }`}
        style={{ background: isLightTheme ? "#ffffff" : "#1f1f1f" }}
      >
        {icon && (
          <span className="absolute left-4 pointer-events-none" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
            <Ico d={icon} className="w-4 h-4" />
          </span>
        )}
        <div className={`w-full ${icon ? "pl-11" : ""}`}>{children}</div>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <Ico d={ICONS.alert} className="w-3 h-3 shrink-0" />{error}
        </p>
      )}
      {hint && !error && (
        <p className="text-[11px] flex items-start gap-1.5" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
          <Ico d={ICONS.info} className="w-3 h-3 mt-0.5 shrink-0" />{hint}
        </p>
      )}
    </div>
  );
}

// ─── Input variants ────────────────────────────────────────────────────────────
function TextInput({ label, icon, error, hint, required, theme, isLightTheme, ...props }) {
  return (
    <Field label={label} icon={icon} error={error} hint={hint} required={required} theme={theme} isLightTheme={isLightTheme}>
      <input {...props} className="w-full py-3 pr-4 bg-transparent text-sm font-semibold focus:outline-none rounded-2xl"
        style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }} />
    </Field>
  );
}

function PhoneInput({ label, icon, error, hint, value, onChange, theme, isLightTheme, ...props }) {
  const handleChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9+\-\s()]/g, "");
    if (cleaned.replace(/\D/g, "").length > 11) return;
    onChange({ target: { value: cleaned } });
  };
  const digits = (value || "").replace(/\D/g, "").length;
  return (
    <Field label={label} icon={icon} error={error} hint={hint} theme={theme} isLightTheme={isLightTheme}>
      <input {...props} value={value} onChange={handleChange}
        className="w-full py-3 pr-16 bg-transparent text-sm font-semibold focus:outline-none rounded-2xl"
        style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }} />
      <span className="absolute right-4 text-[10px] font-bold font-mono tabular-nums pointer-events-none"
        style={{ color: digits === 11 ? "#10b981" : isLightTheme ? "#d1d5db" : "#4b5563" }}>
        {digits}/11
      </span>
    </Field>
  );
}

function TextArea({ label, icon, error, hint, rows = 2, theme, isLightTheme, ...props }) {
  return (
    <Field label={label} icon={icon} error={error} hint={hint} theme={theme} isLightTheme={isLightTheme}>
      <textarea {...props} rows={rows}
        className="w-full py-3 pr-4 bg-transparent text-sm font-semibold focus:outline-none rounded-2xl resize-none"
        style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }} />
    </Field>
  );
}

function PasswordInput({ label, error, hint, value, onChange, theme, isLightTheme, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} icon={ICONS.lock} error={error} hint={hint} theme={theme} isLightTheme={isLightTheme}>
      <input {...props} value={value} onChange={onChange} type={show ? "text" : "password"}
        className="w-full py-3 pr-12 bg-transparent text-sm font-semibold focus:outline-none rounded-2xl"
        style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }} />
      <button type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
        className="absolute right-4 opacity-60 hover:opacity-100 transition-opacity"
        style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}
        aria-label={show ? "Hide password" : "Show password"}>
        <Ico d={show ? ICONS.eyeOff : ICONS.eye} className="w-4 h-4" />
      </button>
    </Field>
  );
}

// ─── Card shell ────────────────────────────────────────────────────────────────
function Card({ children, className = "", style = {} }) {
  const { isLightTheme } = useTheme();
  return (
    <div
      className={`rounded-3xl overflow-hidden ${className}`}
      style={{
        background: isLightTheme ? "#ffffff" : "#1a1a1a",
        border: `1px solid ${isLightTheme ? "#f0f0f0" : "#262626"}`,
        boxShadow: isLightTheme ? "0 1px 12px rgba(0,0,0,0.06)" : "0 1px 12px rgba(0,0,0,0.3)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon, iconBg, iconColor, title, subtitle, badge, theme }) {
  const { isLightTheme } = useTheme();
  return (
    <div className="px-5 py-4 flex items-center gap-3.5"
      style={{ borderBottom: `1px solid ${isLightTheme ? "#f0f0f0" : "#262626"}` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: iconColor }}>
        <Ico d={icon} className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm font-black" style={{ color: isLightTheme ? "#111827" : "#f1f1f1" }}>{title}</h2>
          {badge && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider"
              style={{ background: `${theme.primary}18`, color: theme.primary }}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: isLightTheme ? "#9ca3af" : "#666" }}>{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider({ label, isLightTheme }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px" style={{ background: isLightTheme ? "#f0f0f0" : "#262626" }} />
      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: isLightTheme ? "#d1d5db" : "#444" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: isLightTheme ? "#f0f0f0" : "#262626" }} />
    </div>
  );
}

// ─── Password Strength ────────────────────────────────────────────────────────
function PasswordStrength({ password, confirmPassword, isLightTheme }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { max: 1, label: "Too weak", color: "#ef4444" },
    { max: 2, label: "Fair",     color: "#f59e0b" },
    { max: 3, label: "Good",     color: "#3b82f6" },
    { max: 5, label: "Strong",   color: "#10b981" },
  ];
  const level = levels.find((l) => score <= l.max) || levels[3];
  const reqs = [
    { label: "8+ characters",      met: password.length >= 8 },
    { label: "Uppercase letter",   met: /[A-Z]/.test(password) },
    { label: "Number",             met: /[0-9]/.test(password) },
    { label: "Special character",  met: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <div className="space-y-2.5 p-4 rounded-2xl" style={{ background: isLightTheme ? "#f8fafc" : "#141414", border: `1px solid ${isLightTheme ? "#e5e7eb" : "#262626"}` }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: isLightTheme ? "#9ca3af" : "#555" }}>Strength</span>
        <span className="text-xs font-black" style={{ color: level.color }}>{level.label}</span>
      </div>
      <div className="flex gap-1">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: score >= i ? level.color : isLightTheme ? "#e5e7eb" : "#2a2a2a" }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
        {reqs.map(({ label, met }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
              style={{ background: met ? "#10b981" : isLightTheme ? "#e5e7eb" : "#2a2a2a" }}>
              {met && <Ico d={ICONS.check} className="w-2 h-2" style={{ color: "white" }} />}
            </div>
            <span className="text-[11px] font-medium" style={{ color: met ? "#10b981" : isLightTheme ? "#9ca3af" : "#555" }}>{label}</span>
          </div>
        ))}
      </div>
      {confirmPassword && (
        <div className="flex items-center gap-2 mt-1 pt-2.5" style={{ borderTop: `1px solid ${isLightTheme ? "#e5e7eb" : "#262626"}` }}>
          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: password === confirmPassword ? "#10b981" : "#ef4444" }}>
            <Ico d={password === confirmPassword ? ICONS.check : ICONS.alert} className="w-2 h-2" style={{ color: "white" }} />
          </div>
          <span className="text-[11px] font-semibold"
            style={{ color: password === confirmPassword ? "#10b981" : "#ef4444" }}>
            {password === confirmPassword ? "Passwords match" : "Passwords do not match"}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Submit Button ─────────────────────────────────────────────────────────────
function SubmitBtn({ saving, success, successLabel, idleLabel, idleIcon, gradient, color }) {
  return (
    <button type="submit" disabled={saving}
      className="flex items-center gap-2 px-6 py-2.5 text-white font-black text-sm rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50"
      style={{ background: gradient || color || "#f59e0b" }}>
      {saving ? (
        <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
      ) : success ? (
        <><Ico d={ICONS.check} className="w-4 h-4" />{successLabel}</>
      ) : (
        <><Ico d={idleIcon} className="w-4 h-4" />{idleLabel}</>
      )}
    </button>
  );
}

// ─── Sidebar stat pill ─────────────────────────────────────────────────────────
function StatPill({ icon, label, value, accent, isLightTheme }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-2xl"
      style={{ background: isLightTheme ? "#f9fafb" : "#141414", border: `1px solid ${isLightTheme ? "#f0f0f0" : "#262626"}` }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accent}18`, color: accent }}>
        <Ico d={icon} className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: isLightTheme ? "#9ca3af" : "#555" }}>{label}</p>
        <p className="text-sm font-black truncate" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>{value || "—"}</p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, setUser } = useAuth();
  const { theme, isLightTheme } = useTheme();

  // toast queue
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const showToast = (msg, type = "success") => {
    const id = ++toastId.current;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  };

  // logo state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [shopLogo, setShopLogo] = useState(null);
  const fileInputRef = useRef(null);

  // profile form
  const [pf, setPf] = useState({ name: "", shopName: "", phoneNumber: "", whatsappNumber: "", address: "", city: "" });
  const [pfErr, setPfErr] = useState({});
  const [pfSaving, setPfSaving] = useState(false);
  const [pfOk, setPfOk] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await saAPI.getProfile?.();
        const d = res?.data ?? user;
        if (d) {
          setPf({ name: d.name ?? "", shopName: d.shopName ?? "", phoneNumber: d.phoneNumber ?? "", whatsappNumber: d.whatsappNumber ?? "", address: d.address ?? "", city: d.city ?? "" });
          setShopLogo(d.shopLogo || d.profilePicture || null);
        }
      } catch {
        if (user) setPf({ name: user.name ?? "", shopName: user.shopName ?? "", phoneNumber: user.phoneNumber ?? "", whatsappNumber: user.whatsappNumber ?? "", address: user.address ?? "", city: user.city ?? "" });
      }
    };
    load();
  }, [user]);

  const setPfField = (k) => (e) => { setPf((f) => ({ ...f, [k]: e.target.value })); setPfErr((er) => ({ ...er, [k]: "" })); };

  const handleLogoChange = (e) => 
    {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };


  const handleDeleteLogo = async () => {
    if (!shopLogo && !logoPreview) return;
    if (!window.confirm("Are you sure you want to remove the shop logo?")) return;
    
    // If there's a preview but no saved logo, just clear the preview
    if (logoPreview && !shopLogo) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    
    setPfSaving(true);
    try {
      const formData = new FormData();
      formData.append("removeLogo", "true");
      formData.append("name", pf.name.trim());
      if (pf.shopName.trim()) formData.append("shopName", pf.shopName.trim());
      if (pf.phoneNumber.trim()) formData.append("phoneNumber", pf.phoneNumber.trim());
      if (pf.whatsappNumber.trim()) formData.append("whatsappNumber", pf.whatsappNumber.trim());
      if (pf.address.trim()) formData.append("address", pf.address.trim());
      if (pf.city.trim()) formData.append("city", pf.city.trim());

      const res = await saAPI.updateSAProfile(formData);
      const updated = res.data?.user ?? res.data;
      if (setUser && updated) setUser((p) => ({ ...p, ...updated }));
      setShopLogo(null);
      setLogoFile(null);
      setLogoPreview(null);
      showToast("Logo removed successfully.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove logo.", "error");
    } finally {
      setPfSaving(false);
    }
  };

  

  const validatePf = () => {
    const e = {};
    if (!pf.name.trim()) e.name = "Full name is required";
    else if (pf.name.trim().length < 2) e.name = "At least 2 characters";
    if (pf.phoneNumber && pf.phoneNumber.replace(/\D/g, "").length > 11) e.phoneNumber = "Max 11 digits";
    if (pf.whatsappNumber && pf.whatsappNumber.replace(/\D/g, "").length > 11) e.whatsappNumber = "Max 11 digits";
    setPfErr(e);
    return !Object.keys(e).length;
  };

  const handleProfileSave = async (ev) => {
    ev.preventDefault();
    if (!validatePf()) { showToast("Fix errors before saving.", "error"); return; }
    setPfSaving(true); setPfOk(false);
    try {
      const formData = new FormData();
      formData.append("name", pf.name.trim());
      if (pf.shopName.trim()) formData.append("shopName", pf.shopName.trim());
      if (pf.phoneNumber.trim()) formData.append("phoneNumber", pf.phoneNumber.trim());
      if (pf.whatsappNumber.trim()) formData.append("whatsappNumber", pf.whatsappNumber.trim());
      if (pf.address.trim()) formData.append("address", pf.address.trim());
      if (pf.city.trim()) formData.append("city", pf.city.trim());
      if (logoFile) formData.append("logo", logoFile);

      const res = await saAPI.updateSAProfile(formData);
      const updated = res.data?.user ?? res.data;
      if (setUser && updated) setUser((p) => ({ ...p, ...updated }));
      setPfOk(true); showToast("Profile updated successfully.");
      setLogoFile(null);
      setLogoPreview(null);
      // Refetch to get updated logo URL
      const refreshRes = await saAPI.getProfile?.();
      if (refreshRes?.data) {
        setShopLogo(refreshRes.data.shopLogo || refreshRes.data.profilePicture || null);
      }
      setTimeout(() => setPfOk(false), 3000);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile.", "error");
    } finally { setPfSaving(false); }
  };

  // password form
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwErr, setPwErr] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwOk, setPwOk] = useState(false);

  const setPwField = (k) => (e) => { setPw((f) => ({ ...f, [k]: e.target.value })); setPwErr((er) => ({ ...er, [k]: "" })); };

  const validatePw = () => {
    const e = {};
    if (!pw.currentPassword) e.currentPassword = "Current password is required";
    if (!pw.newPassword) e.newPassword = "New password is required";
    else if (pw.newPassword.length < 8) e.newPassword = "Minimum 8 characters";
    if (!pw.confirmPassword) e.confirmPassword = "Please confirm new password";
    else if (pw.newPassword !== pw.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (pw.currentPassword && pw.newPassword && pw.currentPassword === pw.newPassword) e.newPassword = "Must differ from current";
    setPwErr(e);
    return !Object.keys(e).length;
  };

  const handlePwSave = async (ev) => {
    ev.preventDefault();
    if (!validatePw()) { showToast("Fix password errors.", "error"); return; }
    setPwSaving(true); setPwOk(false);
    try {
      await api.put("/auth/change-password", { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPwOk(true); setPw({ currentPassword: "", newPassword: "", confirmPassword: "" }); setPwErr({});
      showToast("Password changed successfully.");
      setTimeout(() => setPwOk(false), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to change password.";
      if (msg.toLowerCase().includes("current")) { setPwErr({ currentPassword: "Incorrect password" }); showToast("Incorrect current password.", "error"); }
      else showToast(msg, "error");
    } finally { setPwSaving(false); }
  };

  // theme tokens
  const pageBg  = isLightTheme ? (theme.pageBg ?? "#f2f1ed") : (theme.bg ?? "#0c0c0c");
  const cardBg  = isLightTheme ? "#ffffff" : "#1a1a1a";
  const border  = isLightTheme ? "#f0f0f0" : "#262626";
  const muted   = isLightTheme ? "#9ca3af" : "#666";
  const textPri = isLightTheme ? "#111827" : "#f1f1f1";
  const goldBg  = isLightTheme ? "#fef3c7" : "#3d2e0a";
  const goldClr = isLightTheme ? "#b45309" : "#fbbf24";
  const slateBg = isLightTheme ? "#f1f5f9" : "#1e293b";
  const slateClr= isLightTheme ? "#475569" : "#94a3b8";
  const blueBg  = isLightTheme ? "#eff6ff" : "#172554";
  const blueClr = isLightTheme ? "#1d4ed8" : "#93c5fd";

  // shared input props injected
  const ip = { theme, isLightTheme };

  const getJoinDate = () => {
    if (user?.createdAt) {
      return new Date(user.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
    }
    const userId = user?.id || user?._id;
    if (userId && typeof userId === 'string' && userId.length >= 12) {
      const timestamp = parseInt(userId.substring(0, 8), 16) * 1000;
      if (!isNaN(timestamp)) {
        return new Date(timestamp).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
      }
    }
    return "—";
  };
  const joinedDate = getJoinDate();
  const shortId = `#${(user?.id ?? user?._id ?? "").toString().slice(-6).toUpperCase() || "—"}`;

  return (
    <div className="min-h-screen pb-20" style={{ background: pageBg }}>
      {/* ── Page header strip ─────────────────────────────────────────────── */}
      <div style={{ background: isLightTheme ? "#ffffff" : "#111111", borderBottom: `1px solid ${border}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight" style={{ color: textPri }}>Account Settings</h1>
            <p className="text-xs mt-0.5" style={{ color: muted }}>Manage your identity, contacts, and security</p>
          </div>
          {/* Live identity pill */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {shopLogo ? (
              <img src={shopLogo} alt="Logo" className="w-9 h-9 rounded-2xl object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm text-white"
                style={{ background: theme.gradient ?? `linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)` }}>
                {initials(pf.name || user?.name)}
              </div>
            )}
            <div>
              <p className="text-sm font-black" style={{ color: textPri }}>{pf.name || user?.name || "Super Admin"}</p>
              <p className="text-[11px]" style={{ color: muted }}>{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

          {/* ══ LEFT SIDEBAR ══════════════════════════════════════════════════ */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-5 lg:sticky lg:top-6">

            {/* Identity Card */}
            <Card>
              {/* Gold gradient top bar */}
              <div className="h-1" style={{ background: theme.gradient ?? `linear-gradient(90deg, ${theme.primary}, #eab308)` }} />

              {/* Cover / avatar zone */}
              <div className="relative">
                {/* Subtle dot bg */}
                <div className="absolute inset-0 pointer-events-none rounded-t-3xl overflow-hidden"
                  style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "22px 22px", color: theme.primary, opacity: 0.04 }} />
                <div className="relative flex flex-col items-center pt-8 pb-6 px-6">
                  {/* Avatar */}
                  <div className="relative mb-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-3xl object-cover shadow-lg" />
                    ) : shopLogo ? (
                      <img src={shopLogo} alt="Shop Logo" className="w-20 h-20 rounded-3xl object-cover shadow-lg" />
                    ) : (
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-lg"
                        style={{ background: theme.gradient ?? `linear-gradient(135deg, ${theme.primary}, #eab308)` }}>
                        {initials(pf.name || user?.name)}
                      </div>
                    )}
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg flex items-center justify-center shadow-sm"
                      style={{ background: theme.primary, border: `2px solid ${cardBg}` }}>
                      <Ico d={ICONS.shield} className="w-3 h-3" style={{ color: "white" }} />
                    </div>
                  </div>
                  <h2 className="text-base font-black text-center truncate w-full" style={{ color: textPri }}>
                    {pf.name || user?.name || "Super Admin"}
                  </h2>
                  <p className="text-xs text-center truncate w-full mt-0.5" style={{ color: muted }}>{user?.email}</p>
                  {/* Role badge */}
                  <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl"
                    style={{ background: goldBg, border: `1px solid ${goldClr}30` }}>
                    <Ico d={ICONS.shield} className="w-3.5 h-3.5" style={{ color: goldClr }} />
                    <span className="text-[11px] font-black" style={{ color: goldClr }}>Super Administrator</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="px-4 pb-5 space-y-2" style={{ borderTop: `1px solid ${border}` }}>
                <p className="text-[9px] font-black uppercase tracking-widest pt-4 pb-1" style={{ color: muted }}>Account Details</p>
                <StatPill icon={ICONS.calendar} label="Member since" value={joinedDate} accent={theme.primary} isLightTheme={isLightTheme} />
                <StatPill icon={ICONS.id} label="Account ID" value={shortId} accent="#6366f1" isLightTheme={isLightTheme} />
                {pf.city && <StatPill icon={ICONS.city} label="City" value={pf.city} accent="#0ea5e9" isLightTheme={isLightTheme} />}
                {pf.shopName && <StatPill icon={ICONS.shop} label="Shop" value={pf.shopName} accent={theme.primary} isLightTheme={isLightTheme} />}
                {pf.phoneNumber && <StatPill icon={ICONS.phone} label="Phone" value={pf.phoneNumber} accent="#10b981" isLightTheme={isLightTheme} />}
              </div>
            </Card>

            {/* Security status card */}
            <Card>
              <div className="p-4 space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: muted }}>Security Status</p>
                {[
                  { label: "Email verified",     ok: true,  icon: ICONS.mail },
                  { label: "Password set",        ok: true,  icon: ICONS.lock },
                  { label: "2FA",                 ok: false, icon: ICONS.shield },
                ].map(({ label, ok, icon }) => (
                  <div key={label} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                    style={{ background: ok ? (isLightTheme ? "#f0fdf4" : "#052e16") : (isLightTheme ? "#fafafa" : "#141414"), border: `1px solid ${ok ? "#10b98120" : border}` }}>
                    <Ico d={ok ? ICONS.check : icon} className="w-4 h-4 shrink-0"
                      style={{ color: ok ? "#10b981" : muted }} />
                    <span className="text-xs font-semibold flex-1" style={{ color: ok ? (isLightTheme ? "#166534" : "#4ade80") : muted }}>{label}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg"
                      style={{ background: ok ? "#10b98118" : border, color: ok ? "#10b981" : muted }}>
                      {ok ? "Active" : "Off"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick tips */}
            <div className="rounded-2xl p-4" style={{ background: `${theme.primary}0d`, border: `1px solid ${theme.primary}20` }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: theme.primary }}>Tips</p>
              {[
                "Phone numbers are capped at 11 digits.",
                "Email address cannot be changed here.",
                "Use a strong unique password.",
              ].map((t, i) => (
                <p key={i} className="text-[11px] leading-relaxed flex items-start gap-2 mt-1.5" style={{ color: isLightTheme ? "#6b7280" : "#888" }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: theme.primary }} />{t}
                </p>
              ))}
            </div>
          </div>

          {/* ══ RIGHT MAIN COLUMN ════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* ── Profile Information ──────────────────────────────────────── */}
            <Card>
              <CardHeader icon={ICONS.user} iconBg={goldBg} iconColor={goldClr} title="Profile Information" subtitle="Your personal and business details" badge="Editable" theme={theme} />
              <form onSubmit={handleProfileSave} className="p-5 space-y-4">

              {/* Logo Upload */}
<div>
  <label className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
    Shop Logo
  </label>
  <div className="flex items-center gap-4">
    {logoPreview ? (
      <img src={logoPreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border-2" style={{ borderColor: border }} />
    ) : shopLogo ? (
      <img src={shopLogo} alt="Logo" className="w-16 h-16 rounded-xl object-cover border-2" style={{ borderColor: border }} />
    ) : (
      <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: isLightTheme ? "#f3f4f6" : "#1f1f1f", border: `2px solid ${border}` }}>
        <Ico d={ICONS.camera} className="w-6 h-6" style={{ color: muted }} />
      </div>
    )}
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2.5 rounded-xl text-xs font-bold transition-colors"
        style={{ background: isLightTheme ? "#f3f4f6" : "#1f1f1f", color: isLightTheme ? "#374151" : "#d1d5db", border: `1px solid ${border}` }}
      >
        {shopLogo || logoPreview ? "Change Logo" : "Upload Logo"}
      </button>
      {(shopLogo || logoPreview) && (
        <button
          type="button"
          onClick={handleDeleteLogo}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-colors"
          style={{ background: isLightTheme ? "#fef2f2" : "#3b1a1a", color: "#ef4444", border: `1px solid ${isLightTheme ? "#fecaca" : "#7f1d1d"}` }}
        >
          Remove Logo
        </button>
      )}
    </div>
    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
  </div>
</div>

                {/* Name + Shop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextInput label="Full Name" icon={ICONS.user} value={pf.name} onChange={setPfField("name")} placeholder="Your full name" error={pfErr.name} required {...ip} />
                  <TextInput label="Shop / Business Name" icon={ICONS.shop} value={pf.shopName} onChange={setPfField("shopName")} placeholder="e.g. GoldChain HQ" hint="Shown on receipts" {...ip} />
                </div>

                <Divider label="Contact" isLightTheme={isLightTheme} />

                {/* Email readonly */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: muted }}>Email Address</label>
                  <div className="relative flex items-center rounded-2xl border-2" style={{ background: isLightTheme ? "#f9fafb" : "#161616", borderColor: border }}>
                    <span className="absolute left-4" style={{ color: muted }}><Ico d={ICONS.mail} className="w-4 h-4" /></span>
                    <input type="email" value={user?.email ?? ""} disabled
                      className="w-full pl-11 pr-24 py-3 bg-transparent text-sm font-semibold cursor-not-allowed rounded-2xl focus:outline-none"
                      style={{ color: muted }} />
                    <span className="absolute right-4 text-[10px] font-black uppercase tracking-wider" style={{ color: isLightTheme ? "#d1d5db" : "#444" }}>Read-only</span>
                  </div>
                  <p className="text-[11px] flex items-start gap-1.5" style={{ color: muted }}>
                    <Ico d={ICONS.info} className="w-3 h-3 mt-0.5 shrink-0" />Contact support to change your email.
                  </p>
                </div>

                {/* Phone + WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PhoneInput label="Phone Number" icon={ICONS.phone} value={pf.phoneNumber} onChange={setPfField("phoneNumber")} placeholder="+92 3XX XXXXXXX" error={pfErr.phoneNumber} inputMode="tel" {...ip} />
                  <PhoneInput label="WhatsApp Number" icon={ICONS.whatsapp} value={pf.whatsappNumber} onChange={setPfField("whatsappNumber")} placeholder="+92 3XX XXXXXXX" error={pfErr.whatsappNumber} hint="Used for notifications" inputMode="tel" {...ip} />
                </div>

                <Divider label="Location" isLightTheme={isLightTheme} />

                {/* Address + City */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <TextArea label="Address" icon={ICONS.address} value={pf.address} onChange={setPfField("address")} placeholder="Street, area, landmark…" rows={2} {...ip} />
                  </div>
                  <TextInput label="City" icon={ICONS.city} value={pf.city} onChange={setPfField("city")} placeholder="Karachi…" {...ip} />
                </div>

                {/* Save */}
                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <SubmitBtn saving={pfSaving} success={pfOk} successLabel="Saved!" idleLabel="Save Changes" idleIcon={ICONS.edit} gradient={theme.gradient} />
                  {pfOk && (
                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#10b981" }}>
                      <Ico d={ICONS.check} className="w-3.5 h-3.5" />Profile updated
                    </span>
                  )}
                </div>
              </form>
            </Card>

            {/* ── Change Password ──────────────────────────────────────────── */}
            <Card>
              <CardHeader icon={ICONS.key} iconBg={slateBg} iconColor={slateClr} title="Change Password" subtitle="Update your login credentials" theme={theme} />
              <form onSubmit={handlePwSave} className="p-5 space-y-4">
                <PasswordInput label="Current Password" value={pw.currentPassword} onChange={setPwField("currentPassword")} placeholder="Your current password" error={pwErr.currentPassword} autoComplete="current-password" {...ip} />

                <Divider label="New Password" isLightTheme={isLightTheme} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <PasswordInput label="New Password" value={pw.newPassword} onChange={setPwField("newPassword")} placeholder="Min 8 characters" error={pwErr.newPassword} autoComplete="new-password" {...ip} />
                  <PasswordInput label="Confirm Password" value={pw.confirmPassword} onChange={setPwField("confirmPassword")} placeholder="Re-enter new password" error={pwErr.confirmPassword} autoComplete="new-password" {...ip} />
                </div>

                <PasswordStrength password={pw.newPassword} confirmPassword={pw.confirmPassword} isLightTheme={isLightTheme} />

                {/* Save */}
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <SubmitBtn saving={pwSaving} success={pwOk} successLabel="Password changed!" idleLabel="Change Password" idleIcon={ICONS.lock} color="#1e293b" />
                  {pwOk && (
                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: "#10b981" }}>
                      <Ico d={ICONS.check} className="w-3.5 h-3.5" />Password updated
                    </span>
                  )}
                </div>
              </form>
            </Card>

            {/* ── Account Info (read-only table) ───────────────────────────── */}
            <Card>
              <CardHeader icon={ICONS.info} iconBg={blueBg} iconColor={blueClr} title="Account Info" subtitle="System information — read only" theme={theme} />
              <div className="px-5 py-2 divide-y" style={{ borderColor: border }}>
                {[
                  { label: "Role",       value: "Super Administrator", highlight: true },
                  { label: "Email",      value: user?.email ?? "—" },
                  { label: "Account ID", value: user?.id ?? user?._id ?? "—", mono: true },
                  { label: "Status",     value: "Active",              green: true },
                  { label: "Joined",     value: joinedDate },
                ].map(({ label, value, highlight, mono, green }) => (
                  <div key={label} className="flex items-center justify-between py-3 gap-4">
                    <span className="text-xs font-semibold shrink-0" style={{ color: muted }}>{label}</span>
                    <span className={`text-sm font-bold text-right break-all ${mono ? "font-mono text-xs" : ""}`}
                      style={{ color: highlight ? theme.primary : green ? "#10b981" : textPri }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Footer note */}
            <p className="text-[11px] text-center pb-1" style={{ color: isLightTheme ? "#d1d5db" : "#444" }}>
              Profile changes save immediately · Password changes require current password verification
            </p>
          </div>
        </div>
      </div>

      <Toast toasts={toasts} onClose={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}