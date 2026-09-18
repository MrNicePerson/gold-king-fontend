// pages/auth/Login.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineUserCircle,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import { FaSpinner, FaStore, FaShieldAlt } from "react-icons/fa";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b';
  const icon = type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️';

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
      <div 
        className="px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px] max-w-md"
        style={{ background: bgColor, color: 'white' }}
      >
        <span className="text-lg font-bold">{icon}</span>
        <span className="text-sm font-medium flex-1">{message}</span>
        <button onClick={onClose} className="hover:opacity-70 transition-opacity">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div 
        className="relative max-w-md w-full rounded-2xl shadow-xl animate-fade-in-up"
        style={{ background: theme.cardBg, border: `1px solid ${theme.border}` }}
      >
        <div className="p-6">
          <h3 className="text-lg font-bold mb-2" style={{ color: theme.textPrimary }}>{title}</h3>
          <p className="text-sm" style={{ color: theme.textMuted }}>{message}</p>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-80"
            style={{ background: 'var(--gk-hover)', color: theme.textMuted }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: theme.primary }}
          >
            {loading ? <FaSpinner className="w-4 h-4 animate-spin mx-auto" /> : t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Login() {
  const { t } = useTranslation();
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ number: false, password: false });
  const [error, setError] = useState("");
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [toast, setToast] = useState(null);
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { login } = useAuth();
  const { theme, isLightTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const successMessage = location.state?.message || "";
  const from = location.state?.from || "/";

  // Validation functions
  const validateNumber = (num) => {
    if (!num.trim()) return t('auth.mobileRequired', { defaultValue: 'Mobile number is required' });
    const digitsOnly = num.replace(/\D/g, '');
    if (digitsOnly.length < 7) return t('auth.validMobileRequired', { defaultValue: 'Please enter a valid mobile number' });
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return t('auth.passwordRequired', { defaultValue: 'Password is required' });
    if (password.length < 6) return t('auth.passwordMinLength', { defaultValue: 'Password must be at least 8 characters' });
    return "";
  };

  const numberError = touched.number ? validateNumber(number) : "";
  const passwordError = touched.password ? validatePassword(password) : "";
  const isFormValid = !numberError && !passwordError && number && password;

  // Load saved email if remember me was checked
  useEffect(() => {
    const savedNumber = localStorage.getItem("rememberedNumber");
    if (savedNumber) {
      setNumber(savedNumber);
      setRememberMe(true);
    }
  }, []);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFocusedField(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ number: true, password: true });
    
    // Validate all fields
    const emailErr = validateNumber(number);
    const passwordErr = validatePassword(password);
    
    if (emailErr || passwordErr) {
      showToast(emailErr || passwordErr || "Please fix the errors above", 'error');
      return;
    }
    
    setError("");
    setLoadingBtn(true);

    try {
      const userData = await login(number, password);

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberedNumber", number);
      } else {
        localStorage.removeItem("rememberedNumber");
      }

      showToast(`Welcome back, ${userData.name || userData.shopName || 'User'}!`, 'success');

      setTimeout(() => {
        if (userData.role === "super_admin") {
          navigate("/super-admin");
        } else if (userData.role === "admin") {
          navigate("/admin");
        } else if (userData.role === "customer") {
          navigate(from === "/login" ? "/" : from);
        } else {
          navigate("/");
        }
      }, 500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Invalid credentials";
      setError(errorMessage);
      showToast(errorMessage, 'error');
      
      if (errorMessage.includes('deactivated')) {
        showToast("Your account has been deactivated. Please contact support.", 'error');
      } else if (errorMessage.includes('flagged')) {
        showToast("Your account has been flagged. Please contact support.", 'error');
      }
    } finally {
      setLoadingBtn(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number })
      });
      const data = await response.json();
      if (response.ok) {
        showToast("Verification message sent successfully!", 'success');
        setShowResendModal(false);
      } else {
        showToast(data.message || "Failed to send verification email", 'error');
      }
    } catch (err) {
      showToast("Network error. Please try again.", 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const getRoleIcon = () => {
    if (from?.includes("admin")) return <FaStore className="w-3 h-3" />;
    if (from?.includes("super")) return <FaShieldAlt className="w-3 h-3" />;
    return <HiOutlineUserCircle className="w-3 h-3" />;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-all duration-300"
      style={{ background: `linear-gradient(135deg, ${theme.bg}, ${theme.cardBg})` }}
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmationModal
        isOpen={showResendModal}
        onClose={() => setShowResendModal(false)}
        onConfirm={handleResendVerification}
        title="Resend Verification"
        message={`We'll send a verification message to ${number}. Please check your device.`}
        loading={resendLoading}
      />

      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10 animate-pulse-slow"
          style={{ background: theme.primary, filter: 'blur(60px)' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10 animate-pulse-slow delay-1000"
          style={{ background: theme.primaryLight, filter: 'blur(60px)' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand Card */}
        <div className="text-center mb-6 animate-fade-in-down">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl shadow-2xl mb-4 transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
              boxShadow: `0 20px 35px -10px ${theme.primary}40`,
            }}
            onClick={() => navigate('/')}
          >
            <span className="text-4xl font-black" style={{ color: theme.logoText }}>GK</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: theme.textPrimary }}>
            {t('auth.welcomeBack')}
          </h1>
          <p className="mt-2 text-sm" style={{ color: theme.textMuted }}>
            {t('auth.signInSubtitle', { defaultValue: 'Sign in to your GOLDKING account' })}
          </p>
          {from !== "/" && from !== "/login" && (
            <div
              className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-medium animate-pulse-subtle"
              style={{
                background: `${theme.primary}15`,
                color: theme.primary,
                border: `1px solid ${theme.primary}25`,
              }}
            >
              {getRoleIcon()}
              <span>{t('auth.loginRequired', { defaultValue: 'Login required to continue' })}</span>
            </div>
          )}
        </div>

        {/* Success Message from previous action */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl animate-slide-up bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-center font-medium" style={{ color: '#10b981' }}>
              {successMessage}
            </p>
          </div>
        )}

        {/* Login Form Card */}
        <div
          className="rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm transition-all duration-300"
          style={{
            background: isLightTheme
              ? `rgba(255,255,255,0.95)`
              : `rgba(20,20,30,0.85)`,
            border: `1px solid ${theme.border}`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider transition-colors duration-200"
                style={{ color: focusedField === 'number' ? theme.primary : theme.textMuted }}
              >
                {t('auth.mobileNumber')}
              </label>
              <div className="relative group">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-200"
                  style={{ color: focusedField === 'number' ? theme.primary : theme.textMuted }}
                >
                  <HiOutlineUserCircle className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  onFocus={() => setFocusedField('number')}
                  onBlur={() => handleBlur('number')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all duration-200"
                  style={{
                    background: isLightTheme ? '#f8f8f8' : 'rgba(30,30,40,0.8)',
                    border: `1px solid ${
                      numberError && touched.number
                        ? '#ef4444'
                        : focusedField === 'number'
                        ? theme.primary
                        : theme.border
                    }`,
                    color: theme.textPrimary,
                  }}
                  placeholder="03XXXXXXXXX"
                  autoComplete="tel"
                />
                {touched.number && !numberError && number && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
                <div
                  className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-300 ${
                    focusedField === 'number' ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ boxShadow: `0 0 0 3px ${theme.primary}20` }}
                />
              </div>
              
              {/* Email Validation Message */}
              {touched.number && numberError && (
                <div className="flex items-center gap-1.5 mt-1 animate-slide-up">
                  <HiOutlineExclamationCircle className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-xs font-medium" style={{ color: '#ef4444' }}>{numberError}</p>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  className="text-xs font-semibold uppercase tracking-wider transition-colors duration-200"
                  style={{ color: focusedField === 'password' ? theme.primary : theme.textMuted }}
                >
                  {t('auth.password')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium transition-all duration-200 hover:underline"
                  style={{ color: theme.primary }}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative group">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-200"
                  style={{ color: focusedField === 'password' ? theme.primary : theme.textMuted }}
                >
                  <HiOutlineLockClosed className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => handleBlur('password')}
                  className="w-full pl-10 pr-12 py-3 rounded-xl outline-none transition-all duration-200"
                  style={{
                    background: isLightTheme ? '#f8f8f8' : 'rgba(30,30,40,0.8)',
                    border: `1px solid ${
                      passwordError && touched.password
                        ? '#ef4444'
                        : focusedField === 'password'
                        ? theme.primary
                        : theme.border
                    }`,
                    color: theme.textPrimary,
                  }}
                  placeholder={t('auth.password')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200 hover:opacity-70"
                  style={{ color: theme.textMuted }}
                >
                  {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
                <div
                  className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-300 ${
                    focusedField === 'password' ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ boxShadow: `0 0 0 3px ${theme.primary}20` }}
                />
              </div>
              
              {/* Password Validation Message */}
              {touched.password && passwordError && (
                <div className="flex items-center gap-1.5 mt-1 animate-slide-up">
                  <HiOutlineExclamationCircle className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-xs font-medium" style={{ color: '#ef4444' }}>{passwordError}</p>
                </div>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                      rememberMe ? 'bg-opacity-100' : 'bg-opacity-0'
                    }`}
                    style={{
                      borderColor: rememberMe ? theme.primary : theme.border,
                      background: rememberMe ? theme.primary : 'transparent',
                    }}
                  >
                    {rememberMe && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm transition-colors duration-200 group-hover:opacity-80" style={{ color: theme.textMuted }}>
                  {t('auth.rememberMe')}
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl animate-shake" style={{ background: '#ef444410', border: '1px solid #ef444430' }}>
                <p className="text-sm text-center font-medium" style={{ color: '#ef4444' }}>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loadingBtn || !isFormValid}
              className="w-full py-3.5 rounded-xl font-bold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                color: theme.logoText,
                boxShadow: `0 4px 15px ${theme.primary}40`,
              }}
            >
              {loadingBtn ? (
                <div className="flex items-center justify-center gap-2">
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  <span>{t('auth.signingIn')}</span>
                </div>
              ) : (
                t('auth.signIn')
              )}
            </button>

            {/* Register Link */}
            <div className="text-center pt-2">
              <p className="text-sm" style={{ color: theme.textMuted }}>
                {t('auth.noAccount')}{" "}
                <Link
                  to="/register"
                  className="font-semibold transition-all duration-200 hover:underline"
                  style={{ color: theme.primary }}
                >
                  {t('auth.register')}
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-xs" style={{ color: theme.textMuted }}>
            Secure login with 256-bit encryption
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px]" style={{ color: theme.textMuted }}>
            <span>🔒 SSL Protected</span>
            <span>✓ GDPR Compliant</span>
            <span>🛡️ 2FA Ready</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.1); }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}