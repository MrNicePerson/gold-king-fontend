// frontend/src/pages/Super_Admin_Dashboard/Media.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import * as saAPI from "../../services/superAdminApi";
import { useTheme } from "../../contexts/ThemeContext";

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

// ─── Icon helper ──────────────────────────────────────────────────────────────

const Ico = ({ d, className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const ICONS = {
  refresh:  "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  upload:   "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  trash:    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  image:    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  close:    "M6 18L18 6M6 6l12 12",
  alert:    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  check:    "M5 13l4 4L19 7",
  eye:      "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  home:     "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  users:    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  edit:     "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  weight:   "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  tag:      "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
};

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  const { isLightTheme } = useTheme();
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold max-w-sm"
      style={{
        background: isLightTheme ? (type === "error" ? "#dc2626" : "#059669") : (type === "error" ? "#991b1b" : "#065f46"),
        color: "white",
      }}
    >
      <Ico d={type === "error" ? ICONS.alert : ICONS.check} className="w-4 h-4 shrink-0" />
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 text-lg leading-none ml-1">×</button>
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ open, onConfirm, onCancel, loading }) {
  const { isLightTheme } = useTheme();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4"
        style={{ background: isLightTheme ? "#ffffff" : "#1a1a1a" }}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <Ico d={ICONS.trash} className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-center">
          <p className="font-bold text-lg" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>Delete Picture?</p>
          <p className="text-sm mt-1" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>This picture will be removed. This cannot be undone.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border rounded-xl text-sm font-semibold transition"
            style={{
              borderColor: isLightTheme ? "#e5e7eb" : "#374151",
              color: isLightTheme ? "#4b5563" : "#d1d5db",
              background: "transparent",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-60"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Image lightbox ───────────────────────────────────────────────────────────

function Lightbox({ picture, onClose }) {
  if (!picture) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white transition"
        >
          <Ico d={ICONS.close} className="w-6 h-6" />
        </button>
        <img
          src={picture.imageUrl}
          alt={picture.title ?? "Picture"}
          className="w-full max-h-[80vh] object-contain rounded-2xl"
        />
        {(picture.title || picture.description) && (
          <div className="mt-3 text-center">
            {picture.title && <p className="text-white font-bold">{picture.title}</p>}
            {picture.description && <p className="text-white/70 text-sm mt-0.5">{picture.description}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Picture Form (shared by Upload & Edit) ───────────────────────────────────

function PictureForm({
  initial = {},
  onSubmit,
  loading,
  mode = "upload",
  onCancel,
}) {
  const { isLightTheme } = useTheme();
  const [title, setTitle] = useState(initial.title || "");
  const [description, setDescription] = useState(initial.description || "");
  const [type, setType] = useState(initial.type || "gold");
  const [weight, setWeight] = useState(initial.weight != null ? String(initial.weight) : "");
  const [weightUnit, setWeightUnit] = useState(initial.weightUnit || "gram");
  const [price, setPrice] = useState(initial.price != null ? String(initial.price) : "");
  const [showOnHomePage, setShowOnHomePage] = useState(initial.showOnHomePage !== false);
  const [showToAdmins, setShowToAdmins] = useState(initial.showToAdmins !== false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef();

  const isEdit = mode === "edit";
  const existingImage = initial.imageUrl;

  useEffect(() => {
    if (existingImage && !file) {
      setPreview(existingImage);
    }
  }, [existingImage, file]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErrors((er) => ({ ...er, file: "Please select an image file." }));
      return;
    }
    setFile(f);
    setErrors((er) => ({ ...er, file: "" }));
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const validate = () => {
    const errs = {};
    if (!isEdit && !file && !existingImage) errs.file = "Please select an image.";
    if (weight !== "" && isNaN(Number(weight))) errs.weight = "Must be a number";
    if (price !== "" && isNaN(Number(price))) errs.price = "Must be a number";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const fd = new FormData();
    if (file) fd.append("image", file);
    if (title.trim()) fd.append("title", title.trim());
    if (description.trim()) fd.append("description", description.trim());
    fd.append("type", type);
    if (weight !== "") fd.append("weight", weight);
    fd.append("weightUnit", weightUnit);
    if (price !== "") fd.append("price", price);
    fd.append("showOnHomePage", String(showOnHomePage));
    fd.append("showToAdmins", String(showToAdmins));
    onSubmit(fd);
  };

  const inputStyle = {
    background: isLightTheme ? "#ffffff" : "#1f1f1f",
    borderColor: isLightTheme ? "#e5e7eb" : "#374151",
    color: isLightTheme ? "#111827" : "#e5e7eb",
  };

  return (
    <div
      className="rounded-3xl shadow-2xl w-full max-h-[85vh] overflow-y-auto relative"
      style={{ background: isLightTheme ? "#ffffff" : "#1a1a1a" }}
    >
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b"
        style={{ background: isLightTheme ? "#ffffff" : "#1a1a1a", borderColor: isLightTheme ? "#f3f4f6" : "#2a2a2a" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: isLightTheme ? "#fef3c7" : "#3d2e0a",
              color: isLightTheme ? "#b45309" : "#fbbf24",
            }}
          >
            <Ico d={ICONS.edit} className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>
              {isEdit ? "Edit Picture" : "Upload Picture"}
            </h2>
            <p className="text-xs" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
              {isEdit ? "Update details or replace image" : "Add to your media library"}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:bg-black/5"
          style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}
        >
          <Ico d={ICONS.close} className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
        {/* Image drop zone */}
        <div>
          <label
            className="text-xs font-bold uppercase tracking-widest mb-2 block"
            style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}
          >
            Image {!isEdit && <span className="text-red-400">*</span>}
          </label>
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden border" style={{ borderColor: isLightTheme ? "#e5e7eb" : "#374151" }}>
              <img src={preview} alt="Preview" className="w-full h-48 sm:h-52 object-cover" />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition"
              >
                <Ico d={ICONS.close} className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-36 sm:h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition ${
                errors.file ? "border-red-400" : "hover:border-amber-400"
              }`}
              style={{
                borderColor: errors.file ? undefined : isLightTheme ? "#e5e7eb" : "#374151",
                background: isLightTheme ? "#f9fafb" : "#1f1f1f",
              }}
            >
              <Ico d={ICONS.image} className="w-8 h-8 text-gray-300" />
              <p className="text-sm font-semibold" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
                {isEdit ? "Click to replace image" : "Click to select an image"}
              </p>
              <p className="text-xs" style={{ color: isLightTheme ? "#d1d5db" : "#4b5563" }}>
                JPG, PNG, WEBP supported
              </p>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          {errors.file && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <Ico d={ICONS.alert} className="w-3 h-3" />{errors.file}
            </p>
          )}
        </div>

        {/* Title + Description */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
              Title <span className="text-gray-300">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 22K Gold Necklace"
              className="w-full px-4 py-2.5 rounded-xl border-2 focus:border-amber-400 text-sm font-semibold focus:outline-none transition placeholder-gray-300"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
              Description <span className="text-gray-300">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this item…"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border-2 focus:border-amber-400 text-sm font-semibold focus:outline-none transition placeholder-gray-300 resize-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Type + Weight + Unit + Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
              Type
            </label>
            <div className="flex gap-2">
              {["gold", "silver"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-black capitalize transition ${
                    type === t
                      ? t === "gold"
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-slate-400 bg-slate-50 text-slate-700"
                      : "border-gray-200 text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
              Weight <span className="text-gray-300">(opt)</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-semibold focus:outline-none transition placeholder-gray-300 ${
                errors.weight ? "border-red-400" : "border-gray-200 focus:border-amber-400"
              }`}
              style={inputStyle}
            />
            {errors.weight && <p className="text-xs text-red-500 mt-1">{errors.weight}</p>}
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
              Unit
            </label>
            <select
              value={weightUnit}
              onChange={(e) => setWeightUnit(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-2 text-sm font-semibold focus:outline-none transition appearance-none cursor-pointer"
              style={inputStyle}
            >
              <option value="gram">Grams (g)</option>
              <option value="tola">Tola (11.664g)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
              Price (PKR) <span className="text-gray-300">(opt)</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm font-semibold focus:outline-none transition placeholder-gray-300 ${
                errors.price ? "border-red-400" : "border-gray-200 focus:border-amber-400"
              }`}
              style={inputStyle}
            />
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
          </div>
        </div>

        {/* Visibility toggles */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
            Visibility
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            {[
              { key: "showOnHomePage", label: "Show on Home Page", icon: ICONS.home, desc: "Visible to all public visitors" },
              { key: "showToAdmins", label: "Show to Admins", icon: ICONS.users, desc: "Visible to shop admins" },
            ].map(({ key, label, icon, desc }) => (
              <button
                key={key}
                type="button"
                onClick={() => (key === "showOnHomePage" ? setShowOnHomePage(!showOnHomePage) : setShowToAdmins(!showToAdmins))}
                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition ${
                  (key === "showOnHomePage" ? showOnHomePage : showToAdmins)
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                style={{
                  background: (key === "showOnHomePage" ? showOnHomePage : showToAdmins) ? undefined : isLightTheme ? "#ffffff" : "#1f1f1f",
                  borderColor: (key === "showOnHomePage" ? showOnHomePage : showToAdmins) ? undefined : isLightTheme ? "#e5e7eb" : "#374151",
                }}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    (key === "showOnHomePage" ? showOnHomePage : showToAdmins)
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Ico d={icon} className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-xs font-black ${(key === "showOnHomePage" ? showOnHomePage : showToAdmins) ? "text-emerald-700" : "text-gray-600"}`}>
                    {label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                </div>
                <div
                  className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    (key === "showOnHomePage" ? showOnHomePage : showToAdmins) ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
                  }`}
                >
                  {(key === "showOnHomePage" ? showOnHomePage : showToAdmins) && <Ico d={ICONS.check} className="w-3 h-3 text-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer - no sticky */}
        <div
          className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 mt-4 border-t"
          style={{ borderColor: isLightTheme ? "#f3f4f6" : "#2a2a2a" }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 border rounded-xl text-sm font-semibold transition"
            style={{
              borderColor: isLightTheme ? "#e5e7eb" : "#374151",
              color: isLightTheme ? "#4b5563" : "#d1d5db",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-7 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-black text-sm rounded-xl shadow-sm transition"
          >
            {loading ? (isEdit ? "Saving…" : "Uploading…") : isEdit ? "Save Changes" : "Upload Picture"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Picture Card (with Edit/Delete) ──────────────────────────────────────────

function PictureCard({ picture, onDelete, onPreview, onEdit }) {
  const { isLightTheme } = useTheme();

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group"
      style={{
        background: isLightTheme ? "#ffffff" : "#1a1a1a",
        border: `1px solid ${isLightTheme ? "#f3f4f6" : "#2a2a2a"}`,
      }}
    >
      {/* Image */}
      <div
        className="relative h-48 cursor-pointer overflow-hidden"
        onClick={() => onPreview(picture)}
        style={{ background: isLightTheme ? "#f9fafb" : "#1f1f1f" }}
      >
        <img
          src={picture.imageUrl}
          alt={picture.title ?? "Picture"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span
          className={`absolute top-2 left-2 px-2.5 py-1 rounded-xl text-[10px] font-black border ${
            picture.type === "gold"
              ? "bg-amber-50/90 text-amber-700 border-amber-200"
              : "bg-slate-50/90 text-slate-700 border-slate-200"
          }`}
        >
          {picture.type === "gold" ? "Gold" : "Silver"}
        </span>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center text-gray-700">
            <Ico d={ICONS.eye} className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="mb-3">
          <p
            className="text-sm font-black truncate"
            style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}
          >
            {picture.title ?? <span className="text-gray-400 font-medium">No title</span>}
          </p>
          {picture.description && (
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
              {picture.description}
            </p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs mb-3 flex-wrap" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
          {picture.weight != null && (
            <span className="flex items-center gap-1">
              <Ico d={ICONS.weight} className="w-3 h-3" /> {picture.weight}
              {picture.weightUnit ? ` ${picture.weightUnit === "gram" ? "g" : "tola"}` : ""}
            </span>
          )}
          {picture.price != null && (
            <span className="flex items-center gap-1 font-semibold" style={{ color: isLightTheme ? "#b45309" : "#fbbf24" }}>
              <Ico d={ICONS.tag} className="w-3 h-3" /> PKR {fmt(picture.price)}
            </span>
          )}
          <span>{fmtDate(picture.createdAt)}</span>
        </div>

        {/* Visibility chips */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
              picture.showOnHomePage
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-50 text-gray-400 border-gray-200"
            }`}
          >
            <Ico d={ICONS.home} className="w-2.5 h-2.5" />
            {picture.showOnHomePage ? "Home" : "Hidden"}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
              picture.showToAdmins
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-gray-50 text-gray-400 border-gray-200"
            }`}
          >
            <Ico d={ICONS.users} className="w-2.5 h-2.5" />
            {picture.showToAdmins ? "Admins" : "Hidden"}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(picture)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition"
            style={{
              background: isLightTheme ? "#fef3c7" : "#3d2e0a",
              borderColor: isLightTheme ? "#fde68a" : "#4d380a",
              color: isLightTheme ? "#92400e" : "#fbbf24",
            }}
          >
            <Ico d={ICONS.edit} className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => onDelete(picture)}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition"
            style={{
              background: isLightTheme ? "#fef2f2" : "#3b1a1a",
              borderColor: isLightTheme ? "#fecaca" : "#7f1d1d",
              color: isLightTheme ? "#dc2626" : "#fca5a5",
            }}
          >
            <Ico d={ICONS.trash} className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Media() {
  const [pictures, setPictures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editPicture, setEditPicture] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, picture: null });
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [typeFilter, setTypeFilter] = useState("");
  const [visFilter, setVisFilter] = useState("");

  const [toast, setToast] = useState({ msg: "", type: "success" });
  const showToast = (msg, type = "success") => setToast({ msg, type });

  const { isLightTheme } = useTheme();

  // Lock body scroll when any modal is open (prevents background movement)
  useEffect(() => {
    if (uploadOpen || editPicture || lightbox || confirm.open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [uploadOpen, editPicture, lightbox, confirm.open]);

  const fetchPictures = useCallback(async (isRefresh = false) => {
    setError("");
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await saAPI.getPictures();
      const d = res.data ?? res;
      setPictures(d.pictures ?? []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load pictures.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPictures(); }, [fetchPictures]);

  const handleUpload = async (formData) => {
    setSaving(true);
    try {
      await saAPI.uploadPicture(formData);
      showToast("Picture uploaded successfully.");
      fetchPictures(true);
      setUploadOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Upload failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (formData) => {
    if (!editPicture) return;
    setSaving(true);
    try {
      await saAPI.updatePicture(editPicture._id, formData);
      showToast("Picture updated.");
      fetchPictures(true);
      setEditPicture(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const picture = confirm.picture;
    setDeleting(true);
    try {
      await saAPI.deletePicture(picture._id);
      showToast("Picture deleted.");
      setPictures((prev) => prev.filter((p) => p._id !== picture._id));
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete picture.", "error");
    } finally {
      setDeleting(false);
      setConfirm({ open: false, picture: null });
    }
  };

  const filtered = pictures.filter((p) => {
    const matchType = !typeFilter || p.type === typeFilter;
    const matchVis =
      !visFilter ||
      (visFilter === "home" && p.showOnHomePage) ||
      (visFilter === "admins" && p.showToAdmins) ||
      (visFilter === "hidden" && !p.showOnHomePage && !p.showToAdmins);
    return matchType && matchVis;
  });

  const counts = {
    total: pictures.length,
    gold: pictures.filter((p) => p.type === "gold").length,
    silver: pictures.filter((p) => p.type === "silver").length,
    home: pictures.filter((p) => p.showOnHomePage).length,
    admins: pictures.filter((p) => p.showToAdmins).length,
  };

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
          <p className="font-black text-lg" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>
            Failed to load media
          </p>
          <p className="text-sm mt-1" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
            {error}
          </p>
        </div>
        <button
          onClick={() => fetchPictures()}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition"
        >
          Try Again
        </button>
      </div>
    );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: isLightTheme ? "#111827" : "#e5e7eb" }}>
            Media Library
          </h1>
          <p className="text-sm mt-0.5" style={{ color: isLightTheme ? "#6b7280" : "#9ca3af" }}>
            {counts.total} picture{counts.total !== 1 ? "s" : ""} uploaded by you
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPictures(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold shadow-sm transition disabled:opacity-50"
            style={{
              background: isLightTheme ? "#ffffff" : "#1a1a1a",
              borderColor: isLightTheme ? "#e5e7eb" : "#374151",
              color: isLightTheme ? "#374151" : "#d1d5db",
            }}
          >
            <Ico d={ICONS.refresh} className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black shadow-sm transition"
          >
            <Ico d={ICONS.upload} className="w-4 h-4" />
            Upload Picture
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", count: counts.total, color: isLightTheme ? "#111827" : "#e5e7eb", bg: isLightTheme ? "#ffffff" : "#1a1a1a", border: isLightTheme ? "#e5e7eb" : "#374151" },
          { label: "Gold", count: counts.gold, color: "#b45309", bg: isLightTheme ? "#fffbeb" : "#3d2e0a", border: isLightTheme ? "#fde68a" : "#4d380a" },
          { label: "Silver", count: counts.silver, color: "#334155", bg: isLightTheme ? "#f8fafc" : "#1e293b", border: isLightTheme ? "#cbd5e1" : "#475569" },
          { label: "On Home", count: counts.home, color: "#047857", bg: isLightTheme ? "#ecfdf5" : "#0a1a14", border: isLightTheme ? "#a7f3d0" : "#064e3b" },
        ].map(({ label, count, color, bg, border }) => (
          <div
            key={label}
            className="rounded-2xl px-4 py-3 text-center"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <p className="text-2xl font-black" style={{ color }}>{count}</p>
            <p className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { val: "", label: "All Types" },
          { val: "gold", label: "Gold" },
          { val: "silver", label: "Silver" },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setTypeFilter(val)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              typeFilter === val
                ? "bg-amber-500 text-white border-amber-500"
                : ""
            }`}
            style={
              typeFilter !== val
                ? { background: isLightTheme ? "#ffffff" : "#1a1a1a", borderColor: isLightTheme ? "#e5e7eb" : "#374151", color: isLightTheme ? "#6b7280" : "#9ca3af" }
                : {}
            }
          >
            {label}
          </button>
        ))}
        <div className="w-px bg-gray-200 mx-1 self-stretch" style={{ background: isLightTheme ? "#e5e7eb" : "#374151" }} />
        {[
          { val: "", label: "All Visibility" },
          { val: "home", label: "On Home Page" },
          { val: "admins", label: "Shown to Admins" },
          { val: "hidden", label: "Fully Hidden" },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setVisFilter(val)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              visFilter === val
                ? "bg-gray-900 text-white border-gray-900"
                : ""
            }`}
            style={
              visFilter !== val
                ? { background: isLightTheme ? "#ffffff" : "#1a1a1a", borderColor: isLightTheme ? "#e5e7eb" : "#374151", color: isLightTheme ? "#6b7280" : "#9ca3af" }
                : {}
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl border"
          style={{
            background: isLightTheme ? "#ffffff" : "#1a1a1a",
            borderColor: isLightTheme ? "#f3f4f6" : "#2a2a2a",
          }}
        >
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: isLightTheme ? "#f9fafb" : "#1f1f1f" }}>
            <Ico d={ICONS.image} className="w-8 h-8" style={{ color: isLightTheme ? "#d1d5db" : "#4b5563" }} />
          </div>
          <p className="font-bold" style={{ color: isLightTheme ? "#4b5563" : "#d1d5db" }}>
            {typeFilter || visFilter ? "No pictures match your filters" : "No pictures uploaded yet"}
          </p>
          <p className="text-sm mt-1" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
            {typeFilter || visFilter
              ? "Try changing the filters above"
              : "Click 'Upload Picture' to add your first image"}
          </p>
          {!typeFilter && !visFilter && (
            <button
              onClick={() => setUploadOpen(true)}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition mx-auto"
            >
              <Ico d={ICONS.upload} className="w-4 h-4" /> Upload Picture
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((picture) => (
            <PictureCard
              key={picture._id}
              picture={picture}
              onDelete={(p) => setConfirm({ open: true, picture: p })}
              onPreview={(p) => setLightbox(p)}
              onEdit={(p) => setEditPicture(p)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-center" style={{ color: isLightTheme ? "#9ca3af" : "#6b7280" }}>
          Showing {filtered.length} of {counts.total} picture{counts.total !== 1 ? "s" : ""}
        </p>
      )}

      {/* Modals - fixed backdrop, no background shift */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setUploadOpen(false)} />
          <div className="relative w-full max-w-xl mx-auto my-8">
            <PictureForm
              mode="upload"
              loading={saving}
              onCancel={() => setUploadOpen(false)}
              onSubmit={handleUpload}
            />
          </div>
        </div>
      )}

      {editPicture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditPicture(null)} />
          <div className="relative w-full max-w-xl mx-auto my-8">
            <PictureForm
              mode="edit"
              initial={editPicture}
              loading={saving}
              onCancel={() => setEditPicture(null)}
              onSubmit={handleEdit}
            />
          </div>
        </div>
      )}

      <Lightbox picture={lightbox} onClose={() => setLightbox(null)} />

      <ConfirmDialog
        open={confirm.open}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, picture: null })}
        loading={deleting}
      />

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />
    </div>
  );
}