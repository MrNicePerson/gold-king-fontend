import { useState, useEffect, useCallback } from "react";
import * as saAPI from "../../services/superAdminApi";
import * as adminAPI from "../../services/adminApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n, digits = 0) =>
  n != null && !isNaN(Number(n))
    ? Number(n).toLocaleString("en-PK", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PK", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const initials = (name) =>
  name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

const AVATAR_COLORS = [
  "from-violet-400 to-purple-500",
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-rose-400 to-pink-500",
  "from-amber-400 to-yellow-500",
  "from-orange-400 to-red-500",
];
const avatarColor = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

// ─── Icon helper ──────────────────────────────────────────────────────────────

const Ico = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS = {
  refresh:  "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  search:   "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
  close:    "M6 18L18 6M6 6l12 12",
  alert:    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  user:     "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  phone:    "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  mail:     "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  city:     "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  flag:     "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
  shield:   "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  shop:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  eye:      "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  chevLeft: "M15 19l-7-7 7-7",
  chevRight:"M9 5l7 7-7 7",
  orders:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  money:    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  check:    "M5 13l4 4L19 7",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  whatsapp: "M8.29 20.251c1.493.436 3.082.535 4.623.273 4.587-.767 8.065-4.725 8.083-9.378a9.17 9.17 0 00-9.17-9.146c-5.059 0-9.17 4.112-9.17 9.17 0 1.622.424 3.14 1.164 4.452L2 22l2.428-.892a9.168 9.168 0 003.862.143z",
  plus:     "M12 4.5v15m7.5-7.5h-15",
};

// ─── Toast Component ──────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold max-w-sm
      ${type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}`}>
      <Ico d={type === "error" ? ICONS.alert : ICONS.check} className="w-4 h-4 shrink-0" />
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 text-lg leading-none ml-1">×</button>
    </div>
  );
}

// ─── Add Customer Modal ────────────────────────────────────────────────────────

function AddCustomerModal({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    whatsappNumber: "",
    address: "",
    city: "",
    password: "",
    confirmPassword: "",
    isTrusted: false,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (formData.phoneNumber.replace(/\D/g, "").length !== 11) newErrors.phoneNumber = "Phone must be 11 digits";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phoneNumber: "",
      whatsappNumber: "",
      address: "",
      city: "",
      password: "",
      confirmPassword: "",
      isTrusted: false,
    });
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      await adminAPI.addCustomer({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        whatsappNumber: formData.whatsappNumber.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        password: formData.password,
        isTrusted: formData.isTrusted,
      });
      onSuccess(`${formData.name.trim()} was added successfully.`);
      resetForm();
      onClose();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Failed to add customer" });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { resetForm(); onClose(); }} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-3xl">
          <h2 className="text-xl font-black text-gray-900">Add Customer</h2>
          <button onClick={() => { resetForm(); onClose(); }} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition">
            <Ico d={ICONS.close} className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 font-semibold">{errors.submit}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter customer name"
              className={`w-full px-4 py-2.5 rounded-xl border-2 focus:outline-none transition ${
                errors.name ? "border-red-400" : "border-gray-200 focus:border-amber-400"
              }`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="customer@example.com"
              className={`w-full px-4 py-2.5 rounded-xl border-2 focus:outline-none transition ${
                errors.email ? "border-red-400" : "border-gray-200 focus:border-amber-400"
              }`}
            />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number *</label>
            <div className="relative">
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="03001234567"
                className={`w-full px-4 py-2.5 rounded-xl border-2 focus:outline-none transition pr-12 ${
                  errors.phoneNumber ? "border-red-400" : "border-gray-200 focus:border-amber-400"
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold"
                style={{ color: formData.phoneNumber.replace(/\D/g, "").length === 11 ? "#10b981" : "#d1d5db" }}>
                {formData.phoneNumber.replace(/\D/g, "").length}/11
              </span>
            </div>
            {errors.phoneNumber && <p className="text-xs text-red-600 mt-1">{errors.phoneNumber}</p>}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">WhatsApp Number</label>
            <input
              type="tel"
              name="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={handleChange}
              placeholder="03001234567 (optional)"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Karachi"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address (optional)"
              rows="2"
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-amber-400 transition resize-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              className={`w-full px-4 py-2.5 rounded-xl border-2 focus:outline-none transition ${
                errors.password ? "border-red-400" : "border-gray-200 focus:border-amber-400"
              }`}
            />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              className={`w-full px-4 py-2.5 rounded-xl border-2 focus:outline-none transition ${
                errors.confirmPassword ? "border-red-400" : "border-gray-200 focus:border-amber-400"
              }`}
            />
            {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Trusted Checkbox */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
            <input
              type="checkbox"
              name="isTrusted"
              checked={formData.isTrusted}
              onChange={handleChange}
              id="isTrusted"
              className="w-5 h-5 rounded accent-amber-500 cursor-pointer"
            />
            <label htmlFor="isTrusted" className="text-sm font-semibold text-blue-700 cursor-pointer flex-1">
              Mark as Trusted Customer (auto-approve future orders)
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full mt-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <Ico d={ICONS.check} className="w-4 h-4" />
                Add Customer
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Customer detail drawer ───────────────────────────────────────────────────

function CustomerDrawer({ customer, open, onClose }) {
  const [localCustomer, setLocalCustomer] = useState(customer);

  useEffect(() => { setLocalCustomer(customer); }, [customer]);

  if (!open || !localCustomer) return null;

  const Row = ({ icon, label, value, accent }) =>
    value != null && value !== "" ? (
      <div className="flex items-start gap-3 py-2.5 border-b border-gray-50">
        {icon && (
          <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 mt-0.5">
            <Ico d={icon} className="w-3 h-3" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
          <p className={`text-sm font-semibold mt-0.5 wrap-break-word ${accent ?? "text-gray-800"}`}>{value}</p>
        </div>
      </div>
    ) : null;

  const Section = ({ title, children }) => (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{title}</p>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white h-full w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <p className="font-black text-gray-900">Customer Details</p>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition">
            <Ico d={ICONS.close} className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${avatarColor(localCustomer.name)} flex items-center justify-center shrink-0`}>
              <span className="text-white font-black text-xl">{initials(localCustomer.name)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black text-gray-900 truncate">{localCustomer.name}</p>
              <p className="text-sm text-gray-500 truncate">{localCustomer.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {localCustomer.isTrusted && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                    <Ico d={ICONS.shield} className="w-3 h-3" /> Trusted
                  </span>
                )}
                {localCustomer.isFlagged && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
                    <Ico d={ICONS.flag} className="w-3 h-3" /> Flagged
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Flagged warning */}
          {localCustomer.isFlagged && localCustomer.flagReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-xs font-black text-red-700 mb-0.5">Flag Reason</p>
              <p className="text-sm text-red-600">{localCustomer.flagReason}</p>
            </div>
          )}

          <Section title="Contact">
            <Row icon={ICONS.mail}  label="Email"    value={localCustomer.email} />
            <Row icon={ICONS.phone} label="Phone"    value={localCustomer.phoneNumber} />
            <Row icon={ICONS.phone} label="WhatsApp" value={localCustomer.whatsappNumber} />
            <Row icon={ICONS.city}  label="City"     value={localCustomer.city} />
            <Row icon={ICONS.city}  label="Address"  value={localCustomer.address} />
          </Section>

          <Section title="Account">
            <Row label="Trusted"        value={localCustomer.isTrusted ? "Yes — orders auto-approved" : "No"} accent={localCustomer.isTrusted ? "text-blue-600" : "text-gray-500"} />
            <Row label="Flagged"        value={localCustomer.isFlagged ? "Yes" : "No"} accent={localCustomer.isFlagged ? "text-red-600" : "text-gray-500"} />
            <Row icon={ICONS.calendar} label="Registered"      value={fmtDateTime(localCustomer.createdAt)} />
          </Section>

          <Section title="Activity">
            <Row icon={ICONS.orders} label="Total Orders" value={localCustomer.totalOrders != null ? fmt(localCustomer.totalOrders) : null} />
            <Row icon={ICONS.money}  label="Total Spent"  value={localCustomer.totalSpent  != null ? `PKR ${fmt(localCustomer.totalSpent)}` : null} />
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─── Customer card (mobile) ───────────────────────────────────────────────────

function CustomerCard({ customer, onView }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${avatarColor(customer.name)} flex items-center justify-center shrink-0`}>
          <span className="text-white font-black text-sm">{initials(customer.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-black text-gray-900 truncate">{customer.name}</p>
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{customer.email}</p>
          <p className="text-xs text-gray-400">{customer.phoneNumber}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {customer.isTrusted && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
            <Ico d={ICONS.shield} className="w-3 h-3" /> Trusted
          </span>
        )}
        {customer.isFlagged && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
            <Ico d={ICONS.flag} className="w-3 h-3" /> Flagged
          </span>
        )}
        {customer.city && (
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Ico d={ICONS.city} className="w-3 h-3" /> {customer.city}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex gap-3 text-xs text-gray-400">
          <span>{customer.totalOrders ?? 0} orders</span>
          {customer.totalSpent > 0 && <span>PKR {fmt(customer.totalSpent)}</span>}
        </div>
        <button
          onClick={() => onView(customer)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-amber-50 hover:text-amber-700 text-gray-500 text-xs font-bold transition"
        >
          <Ico d={ICONS.eye} className="w-3.5 h-3.5" /> View
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Customers() {
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState("");

  const [isFlagged, setIsFlagged] = useState("");
  const [search,    setSearch]    = useState("");

  const [page,  setPage]  = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const LIMIT = 20;

  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);

  const [toast, setToast] = useState({ msg: "", type: "success" });
  const showToast = (msg, type = "success") => setToast({ msg, type });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async (isRefresh = false, pg = page) => {
    setError("");
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const params = { page: pg, limit: LIMIT };
      if (isFlagged === "true") params.isFlagged = "true";
      const res = await saAPI.getCustomers(params);
      const d = res.data ?? res;
      setCustomers(d.customers ?? []);
      setTotal(d.total ?? 0);
      setPages(d.pages ?? 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load customers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, isFlagged]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleFilter = (key, val) => {
    setPage(1);
    if (key === "isFlagged") setIsFlagged(val);
  };

  const changePage = (p) => {
    setPage(p);
    fetchCustomers(false, p);
  };

  // ── Add customer success handler ───────────────────────────────────────────
  const handleAddSuccess = (message) => {
    showToast(message || "Customer added successfully.", "success");
    // Reload page 1 so the newly added customer shows up
    if (page === 1) {
      fetchCustomers(true, 1);
    } else {
      setPage(1);
      fetchCustomers(true, 1);
    }
  };

  // ── Client-side search (within current page results) ──────────────────────
  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phoneNumber?.includes(q) ||
      c.whatsappNumber?.includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  });

  // ── Stats (from current page — indicative) ─────────────────────────────────
  const counts = {
    total:    total,
    flagged:  customers.filter((c) => c.isFlagged).length,
    trusted:  customers.filter((c) => c.isTrusted).length,
  };

  // ── Loading / error guards ─────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-amber-100" />
          <div className="absolute inset-0 rounded-full border-2 border-t-amber-500 animate-spin" />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-400">
          <Ico d={ICONS.alert} className="w-7 h-7" />
        </div>
        <div>
          <p className="font-black text-gray-900 text-lg">Failed to load customers</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
        <button onClick={() => fetchCustomers()} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition">
          Try Again
        </button>
      </div>
    );

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">All customers across every shop — {fmt(total)} total</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fetchCustomers(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 shadow-sm transition disabled:opacity-50"
          >
            <Ico d={ICONS.refresh} className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-sm font-bold text-white shadow-sm transition"
          >
            <Ico d={ICONS.plus} className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { key: "total",   label: "Total",     count: counts.total,   color: "text-gray-900",   bg: "bg-white border-gray-100" },
          { key: "trusted", label: "Trusted",   count: counts.trusted, color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
          { key: "flag",    label: "Flagged",   count: counts.flagged, color: "text-red-700",    bg: "bg-red-50 border-red-200", active: isFlagged === "true" },
        ].map(({ key, label, count, color, bg, active }) => (
          <button
            key={key}
            onClick={() => {
              if (key === "flag") handleFilter("isFlagged", isFlagged === "true" ? "" : "true");
            }}
            className={`rounded-2xl border px-4 py-3 text-center transition hover:shadow-sm cursor-pointer
              ${active ? bg + " shadow-sm" : "bg-white border-gray-100 hover:border-gray-200"}`}
          >
            <p className={`text-2xl font-black ${active ? color : "text-gray-900"}`}>{count}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* ── Search + filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Ico d={ICONS.search} className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, city…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition placeholder-gray-300"
          />
        </div>
        <select
          value={isFlagged}
          onChange={(e) => handleFilter("isFlagged", e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
        >
          <option value="">All Customers</option>
          <option value="true">Flagged Only</option>
        </select>
        {(isFlagged || search) && (
          <button
            onClick={() => { setIsFlagged(""); setSearch(""); setPage(1); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
          >
            <Ico d={ICONS.close} className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-200 p-4">
            <Ico d={ICONS.user} className="w-full h-full" />
          </div>
          <p className="font-bold text-gray-600">
            {search || isFlagged ? "No customers match your filters" : "No customers yet"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {search || isFlagged ? "Try adjusting your filters" : "Customers will appear here once they register"}
          </p>
          {!search && !isFlagged && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition"
            >
              <Ico d={ICONS.plus} className="w-4 h-4" /> Add Customer
            </button>
          )}
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((c) => (
            <CustomerCard
              key={c._id}
              customer={c}
              onView={(x) => { setDrawerCustomer(x); setDrawerOpen(true); }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Customer", "Contact", "Flags", "Activity", "Registered", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/60 transition-colors border-b border-gray-50">
                    {/* Customer */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${avatarColor(c.name)} flex items-center justify-center shrink-0`}>
                          <span className="text-white font-black text-xs">{initials(c.name)}</span>
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm">{c.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-40">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700 font-medium">{c.phoneNumber ?? "—"}</p>
                      {c.city && <p className="text-xs text-gray-400">{c.city}</p>}
                    </td>
                    {/* Flags */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        {c.isTrusted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                            <Ico d={ICONS.shield} className="w-3 h-3" /> Trusted
                          </span>
                        )}
                        {c.isFlagged && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-50 text-red-700 border border-red-200 whitespace-nowrap">
                            <Ico d={ICONS.flag} className="w-3 h-3" /> Flagged
                          </span>
                        )}
                        {!c.isTrusted && !c.isFlagged && (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                    {/* Activity */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-gray-900">{c.totalOrders ?? 0} orders</p>
                      {c.totalSpent > 0 && (
                        <p className="text-xs text-amber-600 font-semibold">PKR {fmt(c.totalSpent)}</p>
                      )}
                    </td>
                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                      {fmtDate(c.createdAt)}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => { setDrawerCustomer(c); setDrawerOpen(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-amber-50 hover:text-amber-700 text-gray-500 text-xs font-bold transition"
                      >
                        <Ico d={ICONS.eye} className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">Page {page} of {pages} · {fmt(total)} customers</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changePage(page - 1)}
                  disabled={page <= 1}
                  className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <Ico d={ICONS.chevLeft} className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                  const pg = Math.max(1, Math.min(pages - 4, page - 2)) + i;
                  return (
                    <button
                      key={pg}
                      onClick={() => changePage(pg)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition
                        ${pg === page ? "bg-amber-500 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => changePage(page + 1)}
                  disabled={page >= pages}
                  className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  <Ico d={ICONS.chevRight} className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile pagination */}
      {isMobile && pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => changePage(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 disabled:opacity-40 transition"
          >
            <Ico d={ICONS.chevLeft} className="w-4 h-4" /> Prev
          </button>
          <span className="text-xs text-gray-400">Page {page} of {pages}</span>
          <button
            onClick={() => changePage(page + 1)}
            disabled={page >= pages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 disabled:opacity-40 transition"
          >
            Next <Ico d={ICONS.chevRight} className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Showing count */}
      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Showing {filtered.length} of {total} customer{total !== 1 ? "s" : ""}
        </p>
      )}

      {/* Add Customer Modal */}
      <AddCustomerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Drawer */}
      <CustomerDrawer
        open={drawerOpen}
        customer={drawerCustomer}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Toast */}
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />
    </div>
  );
}