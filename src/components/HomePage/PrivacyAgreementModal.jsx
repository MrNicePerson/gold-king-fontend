import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";

// ─── Icons ─────────────────────────────────────────────────────────────────────
const IconWave = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IconClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconCheckCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconInfo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconTrend = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconCheck = ({ color }) => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Utility ───────────────────────────────────────────────────────────────────
function hex2rgba(hex, a) {
  // Handles both "#rrggbb" and "rgba(...)" pass-throughs (border values in some themes)
  if (!hex || !hex.startsWith("#")) return hex ?? "transparent";
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ─── TermRow ───────────────────────────────────────────────────────────────────
function TermRow({ icon, title, body, t }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      role="listitem"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-start gap-3 p-3 rounded-xl transition-colors duration-150 cursor-default select-none"
      style={{
        border: `1px solid ${hov ? hex2rgba(t.primary, 0.2) : "transparent"}`,
        background: hov ? hex2rgba(t.primary, 0.055) : "transparent",
      }}
    >
      <div
        className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{
          background: hex2rgba(t.primary, 0.1),
          border: `1px solid ${hex2rgba(t.primary, 0.22)}`,
          color: t.primary,
        }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="m-0 mb-0.5 text-[13px] font-semibold tracking-wide leading-snug"
          style={{ color: t.textPrimary }}
        >
          {title}
        </p>
        <p
          className="m-0 text-[12.5px] leading-relaxed"
          style={{ color: t.textMuted }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────
export default function PrivacyAgreementModal({
  open,
  onAccept,
  onCancel,
  shopName,
  isRegistration = false,
}) {
  const { t } = useTranslation();
  const { theme, isLightTheme } = useTheme();

  const tTokens = {
    primary:     theme.primary,
    primaryDark: theme.primaryDark,
    primaryLight: theme.primaryLight,
    gradient:    theme.gradient,
    logoText:    theme.logoText,
    cardBg:      theme.cardBg,
    border:      theme.border,
    textPrimary: theme.textPrimary,
    textMuted:   theme.textMuted,
  };
  const isLight = isLightTheme;

  const urduBg     = hex2rgba(tTokens.primary, isLight ? 0.055 : 0.1);
  const urduBorder = hex2rgba(tTokens.primary, isLight ? 0.25  : 0.22);
  const pillBg     = hex2rgba(tTokens.primary, isLight ? 0.1   : 0.18);
  const pillBorder = hex2rgba(tTokens.primary, 0.32);
  const pillText   = isLight ? tTokens.primaryDark : tTokens.primaryLight;

  const [checked,  setChecked]  = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [visible,  setVisible]  = useState(false);
  const scrollRef      = useRef(null);
  const firstFocusRef  = useRef(null);
  const acceptBtnRef   = useRef(null);

  const registrationTerms = [
    { icon: <IconWave />,        title: t("privacyModal.indicativePricing", { defaultValue: "Indicative Pricing" }),       body: t("privacyModal.indicativePricingBody", { defaultValue: "Prices reflect live market rates at that moment and are for reference only — not a guaranteed rate." }) },
    { icon: <IconClock />,       title: t("privacyModal.rateConfirmedPayment", { defaultValue: "Rate Confirmed at Payment" }), body: t("privacyModal.rateConfirmedPaymentBody", { defaultValue: "The final transaction rate is set at the moment of payment, not when you submit this form." }) },
    { icon: <IconLock />,        title: t("privacyModal.dataConfidentiality", { defaultValue: "Data Confidentiality" }),      body: t("privacyModal.dataConfidentialityBody", { defaultValue: "Your details are used strictly for trading and communication — never shared with third parties." }) },
    { icon: <IconCheckCircle />, title: t("privacyModal.approvalRequired", { defaultValue: "Approval Required" }),         body: t("privacyModal.approvalRequiredBody", { defaultValue: "The shop reviews all registrations. You may place orders only after your account is approved." }) },
    { icon: <IconInfo />,        title: t("privacyModal.accountManagement", { defaultValue: "Account Management" }),        body: t("privacyModal.accountManagementBody", { defaultValue: "The shop reserves the right to approve, reject, or restrict accounts based on verification history." }) },
  ];

  const orderTerms = [
    { icon: <IconWave />,  title: t("privacyModal.indicativePriceOnly", { defaultValue: "Indicative Price Only" }),  body: t("privacyModal.indicativePriceOnlyBody", { defaultValue: "The price displayed is based on current market rates and is not a guaranteed final price." }) },
    { icon: <IconClock />, title: t("privacyModal.rateLockedPayment", { defaultValue: "Rate Locked at Payment" }), body: t("privacyModal.rateLockedPaymentBody", { defaultValue: "Your final rate is determined at the time of payment. Delayed payments use the rate at that moment." }) },
    { icon: <IconTrend />, title: t("privacyModal.marketFluctuations", { defaultValue: "Market Fluctuations" }),    body: t("privacyModal.marketFluctuationsBody", { defaultValue: "Gold, silver, and currency values change continuously. The shop may adjust prices with live market conditions." }) },
  ];

  const terms = isRegistration ? registrationTerms : orderTerms;

  const URDU_LINES = [
    "آرڈر فارم میں دکھائی گئی قیمت صرف اشاراتی ہے۔",
    "حتمی قیمت ادائیگی کے وقت طے کی جائے گی۔",
    "آپ کی ذاتی معلومات محفوظ رکھی جائیں گی اور صرف لین دین کے لیے استعمال ہوں گی۔",
    "شاپ انتظامیہ آپ کی رجسٹریشن منظور یا مسترد کر سکتی ہے۔",
  ];

  useEffect(() => {
    if (open) {
      setChecked(false);
      setMounted(true);
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setVisible(true);
          setTimeout(() => firstFocusRef.current?.focus(), 50);
        })
      );
      document.body.style.overflow = "hidden";
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") { onCancel?.(); return; }
      if (e.key !== "Tab") return;
      const modal = scrollRef.current?.closest("[data-modal]");
      if (!modal) return;
      const focusable = [...modal.querySelectorAll(
        'button, [role="checkbox"], [tabindex="0"]'
      )].filter((el) => !el.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    },
    [onCancel]
  );

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes _pam_bd_in  { from{opacity:0} to{opacity:1} }
        @keyframes _pam_bd_out { from{opacity:1} to{opacity:0} }
        @keyframes _pam_in  { from{opacity:0;transform:scale(0.96) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes _pam_out { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(0.96) translateY(6px)} }
        ._pam_bd    { animation:${visible ? "_pam_bd_in .22s ease forwards" : "_pam_bd_out .28s ease forwards"} }
        ._pam_sheet { animation:${visible ? "_pam_in .3s cubic-bezier(.34,1.2,.64,1) forwards" : "_pam_out .24s ease forwards"} }
        ._pam_scroll::-webkit-scrollbar       { width:3px }
        ._pam_scroll::-webkit-scrollbar-track { background:transparent }
        ._pam_scroll::-webkit-scrollbar-thumb { border-radius:3px; background:${hex2rgba(tTokens.primary, 0.25)} }
        ._pam_close:focus-visible,
        ._pam_cancel:focus-visible,
        ._pam_accept:focus-visible,
        ._pam_cb:focus-visible { outline:2px solid ${tTokens.primary}; outline-offset:2px; }
      `}</style>

      {/* ── Overlay ── */}
      <div
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pam-title"
        data-modal="true"
      >
        {/* Backdrop */}
        <div
          className="_pam_bd absolute inset-0 cursor-pointer"
          onClick={onCancel}
          style={{
            background: isLight ? "rgba(15,23,42,0.45)" : "rgba(0,0,0,0.82)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
          }}
        />

        {/* ── Sheet ── */}
        <div
          className="_pam_sheet relative w-full sm:max-w-[500px] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl border overflow-hidden"
          style={{
            background: tTokens.cardBg,
            borderColor: tTokens.border,
            maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - 1rem)",
          }}
        >
          <div
            className="flex-shrink-0 w-9 h-[3px] mx-auto mt-3 rounded-full sm:hidden opacity-30"
            style={{ background: tTokens.textMuted }}
          />
          <div
            className="flex-shrink-0 h-[2px] hidden sm:block mx-5 mt-4 rounded-full"
            style={{ background: tTokens.gradient }}
          />

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overscroll-contain _pam_scroll px-4 sm:px-5 pt-4 pb-2"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{
                    background: hex2rgba(tTokens.primary, 0.1),
                    border: `1px solid ${hex2rgba(tTokens.primary, 0.22)}`,
                  }}
                  aria-hidden="true"
                >
                  {isRegistration ? "📋" : "🤝"}
                </div>
                <div className="min-w-0">
                  <h2
                    id="pam-title"
                    className="m-0 text-[15px] sm:text-base font-bold leading-snug tracking-tight"
                    style={{ color: tTokens.textPrimary }}
                  >
                    {isRegistration ? t("privacyModal.registrationAgreement", { defaultValue: "Registration Agreement" }) : t("privacyModal.priceAgreement", { defaultValue: "Price Agreement" })}
                  </h2>
                  <p
                    className="mt-0.5 text-[11.5px] leading-snug"
                    style={{ color: tTokens.textMuted }}
                  >
                    {isRegistration
                      ? `${t("privacyModal.reviewBeforeRegistering", { defaultValue: "Review before registering with" })} ${shopName || ""}`
                      : `${t("privacyModal.reviewBeforeOrder", { defaultValue: "Review before placing your order with" })} ${shopName || ""}`}
                  </p>
                </div>
              </div>

              {/* Close */}
              <button
                ref={firstFocusRef}
                onClick={onCancel}
                className="_pam_close flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer active:scale-95"
                aria-label="Close"
                style={{
                  border: `1px solid ${tTokens.border}`,
                  background: hex2rgba(tTokens.primary, 0.05),
                  color: tTokens.textMuted,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background    = hex2rgba(tTokens.primary, 0.1);
                  e.currentTarget.style.borderColor   = hex2rgba(tTokens.primary, 0.3);
                  e.currentTarget.style.color         = tTokens.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background    = hex2rgba(tTokens.primary, 0.05);
                  e.currentTarget.style.borderColor   = tTokens.border;
                  e.currentTarget.style.color         = tTokens.textMuted;
                }}
              >
                <IconX />
              </button>
            </div>

            {/* Urdu notice (registration only) */}
            {isRegistration && (
              <div
                dir="rtl"
                className="mb-4 p-3 sm:p-4 rounded-xl text-right"
                style={{ background: urduBg, border: `1px solid ${urduBorder}` }}
              >
                <div
                  className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-full"
                  style={{ background: pillBg, border: `1px solid ${pillBorder}` }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: tTokens.primary }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-[12px] font-semibold tracking-wide"
                    style={{ fontFamily: "'Scheherazade New', serif", color: pillText }}
                  >
                    {t("privacyModal.termsTitle", { defaultValue: "شرائط و ضوابط" })}
                  </span>
                </div>
                <div lang="ur">
                  {URDU_LINES.map((line, i) => (
                    <p
                      key={i}
                      className="m-0 text-sm sm:text-[15px] font-semibold leading-[1.85] sm:leading-[2.1] tracking-wide"
                      style={{ fontFamily: "'Scheherazade New', serif", color: tTokens.textPrimary }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Terms list */}
            <div role="list" className="flex flex-col gap-0.5 mb-4">
              {terms.map((item, i) => (
                <TermRow key={i} icon={item.icon} title={item.title} body={item.body} t={tTokens} />
              ))}
            </div>

            {/* Divider */}
            <div className="h-px mb-4" style={{ background: tTokens.border }} />

            {/* Checkbox */}
            <div
              role="checkbox"
              aria-checked={checked}
              tabIndex={0}
              onClick={() => setChecked((v) => !v)}
              onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setChecked((v) => !v)}
              className="_pam_cb flex gap-3 items-start cursor-pointer p-3 rounded-xl transition-colors duration-200 outline-none mb-4 active:scale-[0.99]"
              style={{
                border: `1px solid ${checked ? hex2rgba(tTokens.primary, 0.35) : tTokens.border}`,
                background: checked ? hex2rgba(tTokens.primary, 0.07) : hex2rgba(tTokens.primary, 0.03),
              }}
            >
              <div
                className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150"
                style={{
                  border: `2px solid ${checked ? tTokens.primary : (isLight ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.22)")}`,
                  background: checked ? tTokens.primary : "transparent",
                  boxShadow: checked ? `0 0 0 3px ${hex2rgba(tTokens.primary, 0.15)}` : "none",
                }}
              >
                {checked && <IconCheck color={tTokens.logoText} />}
              </div>

              <div className="flex-1 min-w-0">
                {isRegistration && (
                  <p
                    dir="rtl"
                    lang="ur"
                    className="m-0 mb-1 text-sm sm:text-[15px] font-bold leading-[1.9] tracking-wide text-right"
                    style={{ fontFamily: "'Scheherazade New', serif", color: tTokens.textPrimary }}
                  >
                    میں تمام شرائط سے متفق ہوں۔
                  </p>
                )}
                <p className="m-0 text-[12.5px] leading-relaxed" style={{ color: tTokens.textMuted }}>
                  {isRegistration
                    ? t("privacyModal.agreeCheckboxReg", { defaultValue: "I have read and agree to all terms above, including the price policy and data confidentiality terms." })
                    : t("privacyModal.agreeCheckboxOrder", { defaultValue: "I understand the final price will be determined at the time of payment based on live market rates." })}
                </p>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className="flex-shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-t"
            style={{ background: tTokens.cardBg, borderColor: tTokens.border }}
          >
            <div className="flex gap-2.5">
              {/* Cancel */}
              <button
                onClick={onCancel}
                className="_pam_cancel flex-1 py-2.5 sm:py-3 px-3 rounded-xl text-[13px] font-semibold cursor-pointer transition-colors duration-150 tracking-wide active:scale-95"
                style={{
                  background: "transparent",
                  border: `1px solid ${tTokens.border}`,
                  color: tTokens.textMuted,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background  = hex2rgba(tTokens.primary, 0.07);
                  e.currentTarget.style.borderColor = hex2rgba(tTokens.primary, 0.28);
                  e.currentTarget.style.color       = tTokens.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background  = "transparent";
                  e.currentTarget.style.borderColor = tTokens.border;
                  e.currentTarget.style.color       = tTokens.textMuted;
                }}
              >
                {t("common.cancel")}
              </button>

              {/* Accept */}
              <button
                ref={acceptBtnRef}
                onClick={() => checked && onAccept?.()}
                disabled={!checked}
                className="_pam_accept flex-[2] py-2.5 sm:py-3 px-3 rounded-xl text-[13px] font-bold transition-all duration-200 tracking-wide active:scale-95"
                aria-disabled={!checked}
                style={{
                  background: checked ? tTokens.gradient : hex2rgba(tTokens.primary, 0.07),
                  color:      checked ? tTokens.logoText  : tTokens.textMuted,
                  border:     checked ? "none"      : `1px solid ${tTokens.border}`,
                  boxShadow:  checked ? `0 3px 12px ${hex2rgba(tTokens.primary, 0.3)}` : "none",
                  cursor:     checked ? "pointer"   : "not-allowed",
                  opacity:    checked ? 1            : 0.65,
                }}
              >
                {checked
                  ? (isRegistration ? t("privacyModal.agreeRegister", { defaultValue: "✓ Agree & Register" }) : t("privacyModal.agreeContinue", { defaultValue: "✓ Agree & Continue" }))
                  : t("privacyModal.confirmAbove", { defaultValue: "Please confirm above" })}
              </button>
            </div>

            <div className="h-[env(safe-area-inset-bottom,0px)] sm:hidden" />
          </div>
        </div>
      </div>
    </>
  );
}