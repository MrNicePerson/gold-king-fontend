// pages/auth/RegisterPage.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { registerCustomer } from "../../services/customerApi";
import { useTheme } from "../../contexts/ThemeContext";

import {
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineHome,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from "react-icons/hi";

import { FaSpinner } from "react-icons/fa";

// ============================================================
// Toast Component
// ============================================================

let _toastId = 0;

function Toast({ toasts, removeToast }) {
  const { theme } = useTheme();

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl animate-slide-in-right"
          style={{
            background: `linear-gradient(135deg, ${theme.cardBg}dd, ${theme.bg})`,
            border: `1px solid ${theme.primary}40`,
            color: t.type === "error" ? "#f87171" : theme.primary,
          }}
        >
          <span className="shrink-0 mt-0.5">
            {t.type === "error" ? (
              <HiOutlineExclamationCircle className="w-4 h-4" />
            ) : (
              <HiOutlineCheckCircle className="w-4 h-4" />
            )}
          </span>

          <span className="flex-1 leading-snug">{t.message}</span>

          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Toast Hook
// ============================================================

function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "error", duration = 4000) => {
    const id = ++_toastId;

    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type,
      },
    ]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
  };
}

// ============================================================
// Animated Background
// ============================================================

const AnimatedBackground = ({ theme }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    let animationId;
    let particles = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      const particleCount = 60;

      particles = [];

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.2 + 0.05,
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        ctx.beginPath();

        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);

        ctx.fillStyle = theme.primary;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();

        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0) {
          particle.x = canvas.width;
        }

        if (particle.x > canvas.width) {
          particle.x = 0;
        }

        if (particle.y < 0) {
          particle.y = canvas.height;
        }

        if (particle.y > canvas.height) {
          particle.y = 0;
        }
      });

      ctx.globalAlpha = 1;

      animationId = requestAnimationFrame(drawParticles);
    };

    resizeCanvas();
    createParticles();
    drawParticles();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }

      window.removeEventListener("resize", resizeCanvas);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.3 }}
    />
  );
};

// ============================================================
// Floating Orbs
// ============================================================

const FloatingOrbs = ({ theme }) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute top-20 left-10 w-64 h-64 rounded-full animate-float-slow"
        style={{
          background: `radial-gradient(circle, ${theme.primary}10, transparent)`,
          filter: "blur(50px)",
        }}
      />

      <div
        className="absolute bottom-20 right-10 w-80 h-80 rounded-full animate-float-delayed"
        style={{
          background: `radial-gradient(circle, ${
            theme.primaryLight || theme.primary
          }08, transparent)`,
          filter: "blur(60px)",
        }}
      />

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full animate-pulse-slow"
        style={{
          background: `radial-gradient(circle, ${theme.primary}05, transparent)`,
          filter: "blur(70px)",
        }}
      />
    </div>
  );
};

// ============================================================
// Input Field Component
// ============================================================

const InputField = ({
  label,
  icon: Icon,
  error,
  children,
  required,
  value,
  onBlur,
  onFocus,
  focused,
  touched,
}) => {
  const { theme } = useTheme();

  const showError = touched && error;
  const isValid = touched && !error && value;

  return (
    <div className="space-y-1.5">
      <label
        className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
        style={{
          color: focused ? theme.primary : "#6b6040",
        }}
      >
        {Icon && <Icon className="w-3 h-3" />}

        {label}

        {required && <span className="text-[#c9a84c] text-xs">*</span>}
      </label>

      <div className="relative">
        {children}

        {isValid && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-scale-in pointer-events-none">
            <HiOutlineCheckCircle
              className="w-5 h-5"
              style={{
                color: "#10b981",
              }}
            />
          </div>
        )}

        <div
          className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-300 ${
            focused ? "opacity-100" : "opacity-0"
          }`}
          style={{
            boxShadow: `0 0 0 3px ${theme.primary}20`,
          }}
        />
      </div>

      {showError && (
        <div className="flex items-center gap-1.5 mt-1 animate-slide-up">
          <HiOutlineExclamationCircle className="w-3.5 h-3.5 text-red-500" />

          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Register Page
// ============================================================

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { toasts, addToast, removeToast } = useToast();

  const { theme, isLightTheme } = useTheme();

  // ----------------------------------------------------------
  // Form State
  // ----------------------------------------------------------

  const [form, setForm] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    whatsappNumber: "",
    email: "",
    address: "",
    city: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [sameAsPhone, setSameAsPhone] = useState(true);

  const [focused, setFocused] = useState("");

  const [whatsappDigits, setWhatsappDigits] = useState("");

  // ----------------------------------------------------------
  // Password Visibility State
  // ----------------------------------------------------------

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ----------------------------------------------------------
  // Generic Input
  // ----------------------------------------------------------

  const set = (key) => (e) => {
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));

    setErrors((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  // ----------------------------------------------------------
  // Blur
  // ----------------------------------------------------------

  const handleBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    setFocused("");
  };

  // ----------------------------------------------------------
  // Phone
  // ----------------------------------------------------------

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);

    setForm((prev) => ({
      ...prev,
      phoneNumber: digits,
      ...(sameAsPhone
        ? {
            whatsappNumber: digits,
          }
        : {}),
    }));

    setErrors((prev) => ({
      ...prev,
      phoneNumber: "",
    }));
  };

  // ----------------------------------------------------------
  // WhatsApp
  // ----------------------------------------------------------

  const handleWhatsappChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);

    setWhatsappDigits(digits);

    setForm((prev) => ({
      ...prev,
      whatsappNumber: "+92" + digits,
    }));

    setErrors((prev) => ({
      ...prev,
      whatsappNumber: "",
    }));
  };

  // ----------------------------------------------------------
  // Validation
  // ----------------------------------------------------------

  const validate = () => {
    const e = {};

    const name = form.name.trim();

    if (!name) {
      e.name = t("auth.nameRequired", {
        defaultValue: "Full name is required",
      });
    } else if (name.length < 2) {
      e.name = t("auth.nameMinLength", {
        defaultValue: "Name must be at least 2 characters",
      });
    } else if (name.length > 100) {
      e.name = t("auth.nameMaxLength", {
        defaultValue: "Name must be 100 characters or fewer",
      });
    }

    const email = form.email.trim();

    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        e.email = t("auth.validEmail", {
          defaultValue: "Enter a valid email address",
        });
      }
    }

    if (!form.password) {
      e.password = t("auth.passwordRequired", {
        defaultValue: "Password is required",
      });
    } else if (form.password.length < 8) {
      e.password = t("auth.passwordMinLength", {
        defaultValue: "Password must be at least 8 characters",
      });
    }

    if (!form.confirmPassword) {
      e.confirmPassword = t("auth.confirmPasswordRequired", {
        defaultValue: "Please confirm your password",
      });
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = t("auth.passwordsMatch", {
        defaultValue: "Passwords do not match",
      });
    }

    const phone = form.phoneNumber;

    if (!phone) {
      e.phoneNumber = t("auth.mobileRequired", {
        defaultValue: "Phone number is required",
      });
    }

    return e;
  };

  // ----------------------------------------------------------
  // Submit
  // ----------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allFields = [
      "name",
      "password",
      "confirmPassword",
      "phoneNumber",
      "email",
    ];

    if (!sameAsPhone) {
      allFields.push("whatsappNumber");
    }

    setTouched(Object.fromEntries(allFields.map((field) => [field, true])));

    const errs = validate();

    if (Object.keys(errs).length) {
      setErrors(errs);

      addToast(Object.values(errs)[0], "error");

      return;
    }

    setLoading(true);

    try {
      await registerCustomer({
        name: form.name.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber,

        whatsappNumber: sameAsPhone ? form.phoneNumber : form.whatsappNumber,

        email: form.email.trim() || undefined,

        address: form.address.trim() || undefined,

        city: form.city.trim() || undefined,
      });

      setSuccess(true);

      addToast("Registration successful! Redirecting to login...", "success");

      setTimeout(() => {
        navigate("/login", {
          state: {
            message: "Account created successfully! Please log in.",
          },
        });
      }, 1500);
    } catch (err) {
      const data = err.response?.data;

      if (data?.errors?.length) {
        const fieldErrs = {};

        data.errors.forEach(({ field, message }) => {
          const key =
            field === "phoneNumber"
              ? "phoneNumber"
              : field === "password"
                ? "password"
                : field === "name"
                  ? "name"
                  : field === "city"
                    ? "city"
                    : field === "whatsappNumber"
                      ? "whatsappNumber"
                      : field === "email"
                        ? "email"
                        : null;

          if (key) {
            fieldErrs[key] = message;
          }
        });

        if (Object.keys(fieldErrs).length) {
          setErrors(fieldErrs);

          addToast(Object.values(fieldErrs)[0], "error");

          return;
        }
      }

      addToast(
        data?.message || "Registration failed. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // Input Style
  // ----------------------------------------------------------

  const getInputStyle = (field, hasError) => ({
    background: isLightTheme ? "#f8f8f8" : "rgba(30,30,40,0.8)",

    border: `1px solid ${
      hasError ? "#ef4444" : focused === field ? theme.primary : theme.border
    }`,

    color: theme.textPrimary,
  });

  const gradientStyle = {
    background: theme.gradient,
  };

  const logoTextStyle = {
    color: theme.logoText,
  };

  // ==========================================================
  // Success Screen
  // ==========================================================

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.bg}, ${theme.cardBg})`,
        }}
      >
        <FloatingOrbs theme={theme} />

        <div className="relative z-10 text-center max-w-md animate-fade-in-up">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center animate-scale-in"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}20, ${theme.primary}05)`,
              border: `1px solid ${theme.primary}30`,
            }}
          >
            <HiOutlineCheckCircle
              className="w-10 h-10"
              style={{
                color: theme.primary,
              }}
            />
          </div>

          <h2
            className="text-3xl font-bold mb-3"
            style={{
              color: theme.textPrimary,
              fontFamily: '"Playfair Display", serif',
            }}
          >
            Welcome to GoldChain!
          </h2>

          <p
            className="leading-relaxed mb-8"
            style={{
              color: theme.textMuted,
            }}
          >
            Your account has been created successfully. You're now ready to
            explore premium gold shops.
          </p>

          <div
            className="w-8 h-8 mx-auto border-2 rounded-full animate-spin"
            style={{
              borderTopColor: theme.primary,
              borderRightColor: "transparent",
              borderBottomColor: "transparent",
              borderLeftColor: "transparent",
            }}
          />
        </div>
      </div>
    );
  }

  const showError = (field) => touched[field] && errors[field];

  // ==========================================================
  // Main UI
  // ==========================================================

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground theme={theme} />
      <FloatingOrbs theme={theme} />

      <div
        className="fixed inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.bg}, ${theme.cardBg})`,
        }}
      />

      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ================================================== */}
        {/* Navigation */}
        {/* ================================================== */}

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 backdrop-blur-sm sticky top-0 z-20"
          style={{
            background: `${theme.bgScrolled}cc`,
          }}
        >
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-base transition-transform duration-300 group-hover:scale-110"
              style={{
                ...gradientStyle,
                ...logoTextStyle,
                fontFamily: '"Playfair Display", serif',
              }}
            >
              G
            </div>

            <span
              className="font-black text-lg tracking-tight"
              style={{
                fontFamily: '"Playfair Display", serif',
                color: theme.brandText,
              }}
            >
              GOLDKING
            </span>
          </Link>

          <Link
            to="/login"
            className="flex items-center gap-2 text-sm transition-all duration-200 group"
            style={{
              color: theme.textMuted,
            }}
          >
            <span className="hidden sm:inline">Already have an account?</span>

            <span className="sm:hidden text-xs">Have an account?</span>

            <span
              className="font-semibold group-hover:underline"
              style={{
                color: theme.primary,
              }}
            >
              Sign in
            </span>

            <HiOutlineArrowRight
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              style={{
                color: theme.primary,
              }}
            />
          </Link>
        </div>

        {/* ================================================== */}
        {/* Main Content */}
        {/* ================================================== */}

        <div className="flex-1 flex items-center justify-center p-4 py-6 sm:py-8">
          <div className="w-full max-w-2xl">
            {/* Header */}

            <div className="text-center mb-6 sm:mb-8 animate-fade-in-down">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 sm:mb-4"
                style={{
                  background: `${theme.primary}10`,
                  border: `1px solid ${theme.primary}20`,
                }}
              >
                <HiOutlineSparkles
                  className="w-3 h-3"
                  style={{
                    color: theme.primary,
                  }}
                />

                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    color: theme.primary,
                  }}
                >
                  Join the Elite
                </span>
              </div>

              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3"
                style={{
                  color: theme.textPrimary,
                  fontFamily: '"Playfair Display", serif',
                }}
              >
                Create Account
              </h1>

              <p
                className="text-xs sm:text-sm"
                style={{
                  color: theme.textMuted,
                }}
              >
                Start your journey with trusted gold dealers
              </p>
            </div>

            {/* Form Card */}

            <div
              className="rounded-2xl overflow-hidden animate-fade-in-up backdrop-blur-xl transition-all duration-300 hover:shadow-2xl"
              style={{
                background: isLightTheme
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(20,20,30,0.88)",

                border: `1px solid ${theme.border}`,

                backdropFilter: "blur(20px)",
              }}
            >
              <div
                className="h-1"
                style={{
                  background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryDark})`,
                }}
              />

              <form
                onSubmit={handleSubmit}
                className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6"
              >
                {/* ================================================== */}
                {/* Personal Information */}
                {/* ================================================== */}

                <div>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <HiOutlineUser
                      className="w-4 h-4"
                      style={{
                        color: theme.primary,
                      }}
                    />

                    <h3
                      className="text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                      style={{
                        color: theme.textMuted,
                      }}
                    >
                      Personal Information
                    </h3>

                    <div
                      className="flex-1 h-px"
                      style={{
                        background: `linear-gradient(90deg, ${theme.border}, transparent)`,
                      }}
                    />
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Full Name */}

                    <InputField
                      label="Full Name"
                      icon={HiOutlineUser}
                      required
                      value={form.name}
                      focused={focused === "name"}
                      touched={touched.name}
                      error={errors.name}
                      onBlur={() => handleBlur("name")}
                      onFocus={() => setFocused("name")}
                    >
                      <input
                        type="text"
                        value={form.name}
                        onChange={set("name")}
                        onFocus={() => setFocused("name")}
                        onBlur={() => handleBlur("name")}
                        placeholder="Ahmed Khan"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl outline-none transition-all duration-200 text-sm sm:text-base"
                        style={getInputStyle("name", showError("name"))}
                      />
                    </InputField>

                    {/* Password + Confirm Password */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* ================================ */}
                      {/* Password */}
                      {/* ================================ */}

                      <InputField
                        label="Password"
                        icon={HiOutlineLockClosed}
                        required
                        value={form.password}
                        focused={focused === "password"}
                        touched={touched.password}
                        error={errors.password}
                        onBlur={() => handleBlur("password")}
                        onFocus={() => setFocused("password")}
                      >
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={set("password")}
                            onFocus={() => setFocused("password")}
                            onBlur={() => handleBlur("password")}
                            placeholder="Create a strong password"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl outline-none transition-all duration-200 pr-12 text-sm sm:text-base"
                            style={getInputStyle(
                              "password",
                              showError("password"),
                            )}
                          />

                          {/* Eye Button */}

                          <button
                            type="button"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 transition-opacity hover:opacity-70"
                            style={{
                              color: theme.textMuted,
                            }}
                          >
                            {showPassword ? (
                              <HiOutlineEyeOff className="w-5 h-5" />
                            ) : (
                              <HiOutlineEye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </InputField>

                      {/* ================================ */}
                      {/* Confirm Password */}
                      {/* ================================ */}

                      <InputField
                        label="Confirm Password"
                        icon={HiOutlineLockClosed}
                        required
                        value={form.confirmPassword}
                        focused={focused === "confirmPassword"}
                        touched={touched.confirmPassword}
                        error={errors.confirmPassword}
                        onBlur={() => handleBlur("confirmPassword")}
                        onFocus={() => setFocused("confirmPassword")}
                      >
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={form.confirmPassword}
                            onChange={set("confirmPassword")}
                            onFocus={() => setFocused("confirmPassword")}
                            onBlur={() => handleBlur("confirmPassword")}
                            placeholder="Confirm your password"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl outline-none transition-all duration-200 pr-12 text-sm sm:text-base"
                            style={getInputStyle(
                              "confirmPassword",
                              showError("confirmPassword"),
                            )}
                          />

                          {/* Eye Button */}

                          <button
                            type="button"
                            aria-label={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 transition-opacity hover:opacity-70"
                            style={{
                              color: theme.textMuted,
                            }}
                          >
                            {showConfirmPassword ? (
                              <HiOutlineEyeOff className="w-5 h-5" />
                            ) : (
                              <HiOutlineEye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </InputField>
                    </div>
                  </div>
                </div>

                {/* ================================================== */}
                {/* Contact Information */}
                {/* ================================================== */}

                <div>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <HiOutlinePhone
                      className="w-4 h-4"
                      style={{
                        color: theme.primary,
                      }}
                    />

                    <h3
                      className="text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                      style={{
                        color: theme.textMuted,
                      }}
                    >
                      Contact Information
                    </h3>

                    <div
                      className="flex-1 h-px"
                      style={{
                        background: `linear-gradient(90deg, ${theme.border}, transparent)`,
                      }}
                    />
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Phone */}

                    <InputField
                      label="Phone Number"
                      icon={HiOutlinePhone}
                      required
                      value={form.phoneNumber}
                      focused={focused === "phoneNumber"}
                      touched={touched.phoneNumber}
                      error={errors.phoneNumber}
                      onBlur={() => handleBlur("phoneNumber")}
                      onFocus={() => setFocused("phoneNumber")}
                    >
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={form.phoneNumber}
                        onChange={handlePhoneChange}
                        onFocus={() => setFocused("phoneNumber")}
                        onBlur={() => handleBlur("phoneNumber")}
                        placeholder="03001234567"
                        maxLength={11}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl outline-none transition-all duration-200 text-sm sm:text-base"
                        style={getInputStyle(
                          "phoneNumber",
                          showError("phoneNumber"),
                        )}
                      />
                    </InputField>

                    {/* WhatsApp Toggle */}

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => {
                          setSameAsPhone((current) => {
                            if (!current) {
                              setWhatsappDigits("");

                              setForm((prev) => ({
                                ...prev,
                                whatsappNumber: "",
                              }));
                            }

                            return !current;
                          });
                        }}
                        className="w-8 sm:w-10 h-4 sm:h-5 rounded-full relative transition-all duration-200 cursor-pointer"
                        style={{
                          background: sameAsPhone
                            ? theme.primary
                            : theme.border,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <div
                          className="absolute top-0.5 w-3 sm:w-4 h-3 sm:h-4 rounded-full bg-white shadow transition-all duration-200"
                          style={{
                            left: sameAsPhone ? "calc(100% - 18px)" : "2px",
                          }}
                        />
                      </div>

                      <span
                        className="text-xs sm:text-sm transition-colors group-hover:opacity-80"
                        style={{
                          color: theme.textMuted,
                        }}
                      >
                        WhatsApp same as phone number
                      </span>
                    </label>

                    {/* WhatsApp */}

                    {!sameAsPhone && (
                      <InputField
                        label="WhatsApp Number"
                        icon={HiOutlinePhone}
                        required
                        value={whatsappDigits}
                        focused={focused === "whatsappNumber"}
                        touched={touched.whatsappNumber}
                        error={errors.whatsappNumber}
                        onBlur={() => handleBlur("whatsappNumber")}
                        onFocus={() => setFocused("whatsappNumber")}
                      >
                        <div
                          className="flex rounded-xl overflow-hidden"
                          style={{
                            border: `1px solid ${
                              showError("whatsappNumber")
                                ? "#ef4444"
                                : theme.border
                            }`,
                          }}
                        >
                          <span
                            className="flex items-center px-2 sm:px-3 text-xs sm:text-sm font-semibold"
                            style={{
                              background: `${theme.primary}10`,
                              color: theme.primary,
                              borderRight: `1px solid ${theme.border}`,
                            }}
                          >
                            +92
                          </span>

                          <input
                            type="tel"
                            inputMode="numeric"
                            value={whatsappDigits}
                            onChange={handleWhatsappChange}
                            onFocus={() => setFocused("whatsappNumber")}
                            onBlur={() => handleBlur("whatsappNumber")}
                            placeholder="3001234567"
                            maxLength={10}
                            className="flex-1 px-2 sm:px-3 py-2.5 sm:py-3 text-sm sm:text-base outline-none bg-transparent"
                            style={{
                              color: theme.textPrimary,
                            }}
                          />

                          <span
                            className="flex items-center pr-2 sm:pr-3 text-[10px] sm:text-xs"
                            style={{
                              color:
                                whatsappDigits.length === 10
                                  ? "#4ade80"
                                  : theme.textMuted,
                            }}
                          >
                            {whatsappDigits.length}
                            /10
                          </span>
                        </div>
                      </InputField>
                    )}

                    {/* Email */}

                    <InputField
                      label="Email (optional)"
                      value={form.email}
                      focused={focused === "email"}
                      touched={touched.email}
                      error={errors.email}
                      onBlur={() => handleBlur("email")}
                      onFocus={() => setFocused("email")}
                    >
                      <input
                        type="email"
                        value={form.email}
                        onChange={set("email")}
                        onFocus={() => setFocused("email")}
                        onBlur={() => handleBlur("email")}
                        placeholder="you@example.com"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl outline-none transition-all duration-200 text-sm sm:text-base"
                        style={getInputStyle("email", showError("email"))}
                      />
                    </InputField>
                  </div>
                </div>

                {/* ================================================== */}
                {/* Location */}
                {/* ================================================== */}

                <div>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <HiOutlineLocationMarker
                      className="w-4 h-4"
                      style={{
                        color: theme.primary,
                      }}
                    />

                    <h3
                      className="text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                      style={{
                        color: theme.textMuted,
                      }}
                    >
                      Location
                    </h3>

                    <div
                      className="flex-1 h-px"
                      style={{
                        background: `linear-gradient(90deg, ${theme.border}, transparent)`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* City */}

                    <InputField
                      label="City"
                      icon={HiOutlineLocationMarker}
                      value={form.city}
                      focused={focused === "city"}
                      touched={touched.city}
                      error={errors.city}
                      onBlur={() => handleBlur("city")}
                      onFocus={() => setFocused("city")}
                    >
                      <input
                        type="text"
                        value={form.city}
                        onChange={set("city")}
                        onFocus={() => setFocused("city")}
                        onBlur={() => handleBlur("city")}
                        placeholder="Karachi, Lahore, etc."
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl outline-none transition-all duration-200 text-sm sm:text-base"
                        style={getInputStyle("city", showError("city"))}
                      />
                    </InputField>

                    {/* Address */}

                    <InputField
                      label="Address"
                      icon={HiOutlineHome}
                      value={form.address}
                      focused={focused === "address"}
                      touched={touched.address}
                      error={errors.address}
                      onBlur={() => handleBlur("address")}
                      onFocus={() => setFocused("address")}
                    >
                      <input
                        type="text"
                        value={form.address}
                        onChange={set("address")}
                        onFocus={() => setFocused("address")}
                        onBlur={() => handleBlur("address")}
                        placeholder="Street address (optional)"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl outline-none transition-all duration-200 text-sm sm:text-base"
                        style={getInputStyle("address", showError("address"))}
                      />
                    </InputField>
                  </div>
                </div>

                {/* ================================================== */}
                {/* Submit */}
                {/* ================================================== */}

                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                    color: theme.logoText,
                    boxShadow: `0 4px 15px ${theme.primary}40`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <FaSpinner className="w-4 h-4 animate-spin" />

                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Create Account</span>

                      <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>

                {/* Terms */}

                <p
                  className="text-center text-[9px] sm:text-[10px] pt-2"
                  style={{
                    color: theme.textMuted,
                  }}
                >
                  By creating an account, you agree to our{" "}
                  <Link
                    to="/terms"
                    className="hover:underline transition-colors"
                    style={{
                      color: theme.primary,
                    }}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="hover:underline transition-colors"
                    style={{
                      color: theme.primary,
                    }}
                  >
                    Privacy Policy
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* Animations */}
      {/* ====================================================== */}

      <style>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }

          25% {
            transform: translate(20px, -20px) rotate(5deg);
          }

          50% {
            transform: translate(0, -30px) rotate(0deg);
          }

          75% {
            transform: translate(-20px, -20px) rotate(-5deg);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }

          33% {
            transform: translate(-15px, -20px) scale(1.1);
          }

          66% {
            transform: translate(10px, -15px) scale(0.9);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }

          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }

        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 18s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
