// pages/auth/ResetPassword.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/authApi';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  HiOutlineLockClosed, 
  HiOutlineArrowLeft, 
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineArrowRight,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { FaSpinner, FaGem } from 'react-icons/fa';

// Toast Component
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
            background: t.type === 'error'
              ? `linear-gradient(135deg, ${theme.cardBg}dd, ${theme.bg})`
              : `linear-gradient(135deg, ${theme.cardBg}dd, ${theme.bg})`,
            border: t.type === 'error'
              ? `1px solid ${theme.primary}40`
              : `1px solid ${theme.primary}40`,
            color: t.type === 'error' ? '#f87171' : theme.primary,
          }}
        >
          <span className="shrink-0 mt-0.5">
            {t.type === 'error' ? (
              <HiOutlineExclamationCircle className="w-4 h-4" />
            ) : (
              <HiOutlineCheckCircle className="w-4 h-4" />
            )}
          </span>
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error', duration = 4000) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

// Animated Background Component
const AnimatedBackground = ({ theme }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    const createParticles = () => {
      const particleCount = 50;
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
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = theme.primary;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
        
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
      });
      
      animationId = requestAnimationFrame(drawParticles);
    };
    
    resizeCanvas();
    createParticles();
    drawParticles();
    
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
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

// Floating Orbs Component
const FloatingOrbs = ({ theme }) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full animate-float-slow" style={{ background: `radial-gradient(circle, ${theme.primary}10, transparent)`, filter: 'blur(50px)' }} />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full animate-float-delayed" style={{ background: `radial-gradient(circle, ${theme.primaryLight || theme.primary}08, transparent)`, filter: 'blur(60px)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full animate-pulse-slow" style={{ background: `radial-gradient(circle, ${theme.primary}05, transparent)`, filter: 'blur(70px)' }} />
    </div>
  );
};

// Password Strength Indicator
const PasswordStrength = ({ password }) => {
  const { theme } = useTheme();
  
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4);
  };
  
  const strength = getStrength();
  const strengthText = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#059669'][strength];
  
  if (!password) return null;
  
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full overflow-hidden bg-gray-700">
          <div 
            className="h-full transition-all duration-300"
            style={{ width: `${(strength + 1) * 20}%`, background: strengthColor }}
          />
        </div>
        <span className="text-[10px] font-medium" style={{ color: strengthColor }}>{strengthText}</span>
      </div>
    </div>
  );
};

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { theme, isLightTheme } = useTheme();
  const { toasts, addToast, removeToast } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (newPassword !== confirmPassword) {
      const errMsg = 'Passwords do not match.';
      setError(errMsg);
      addToast(errMsg, 'error');
      return;
    }
    
    if (newPassword.length < 8) {
      const errMsg = 'Password must be at least 8 characters.';
      setError(errMsg);
      addToast(errMsg, 'error');
      return;
    }
    
    // Password strength validation
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      const errMsg = 'Password must contain at least one uppercase letter.';
      setError(errMsg);
      addToast(errMsg, 'error');
      return;
    }
    
    if (!/(?=.*[a-z])/.test(newPassword)) {
      const errMsg = 'Password must contain at least one lowercase letter.';
      setError(errMsg);
      addToast(errMsg, 'error');
      return;
    }
    
    if (!/(?=.*\d)/.test(newPassword)) {
      const errMsg = 'Password must contain at least one number.';
      setError(errMsg);
      addToast(errMsg, 'error');
      return;
    }
    
    setLoading(true);
    try {
      await authAPI.resetPassword(token, { newPassword });
      setSuccess(true);
      addToast('Password reset successfully! Redirecting to login...', 'success');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successfully! Please log in.' } });
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Reset failed. The link may have expired.';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const gradientStyle = { background: theme.gradient };
  const logoTextStyle = { color: theme.logoText };
  
  const getInputStyle = (field) => ({
    background: isLightTheme ? '#f8f8f8' : 'rgba(30,30,40,0.8)',
    border: `1px solid ${focusedField === field ? theme.primary : theme.border}`,
    color: theme.textPrimary,
  });

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <AnimatedBackground theme={theme} />
        <FloatingOrbs theme={theme} />
        
        <div className="fixed inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${theme.bg}, ${theme.cardBg})` }} />
        
        <Toast toasts={toasts} removeToast={removeToast} />
        
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md animate-fade-in-up">
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center justify-center gap-2.5 group">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl transition-transform duration-300 group-hover:scale-105"
                  style={{ ...gradientStyle, ...logoTextStyle, fontFamily: '"Playfair Display", serif' }}
                >
                  G
                </div>
              </Link>
            </div>

            {/* Success Card */}
            <div
              className="rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl transition-all duration-300"
              style={{
                background: isLightTheme ? `rgba(255,255,255,0.95)` : `rgba(20,20,30,0.88)`,
                border: `1px solid ${theme.border}`,
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="h-1 w-full rounded-full mb-6" style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryDark})` }} />
              
              <div className="text-center space-y-4">
                <div
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center animate-scale-in"
                  style={{ background: `${theme.primary}20`, border: `1px solid ${theme.primary}30` }}
                >
                  <HiOutlineCheckCircle className="text-5xl" style={{ color: theme.primary }} />
                </div>
                
                <h2 className="text-2xl font-bold" style={{ color: theme.textPrimary, fontFamily: '"Playfair Display", serif' }}>
                  Password Reset Successful!
                </h2>
                
                <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                  Your password has been changed successfully. You can now log in with your new password.
                </p>
                
                <div className="pt-4">
                  <div className="w-8 h-8 mx-auto border-2 rounded-full animate-spin" style={{ borderTopColor: theme.primary, borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }} />
                  <p className="text-xs mt-2" style={{ color: theme.textMuted }}>Redirecting to login...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground theme={theme} />
      <FloatingOrbs theme={theme} />
      
      <div className="fixed inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${theme.bg}, ${theme.cardBg})` }} />
      
      <Toast toasts={toasts} removeToast={removeToast} />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Navigation */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 backdrop-blur-sm sticky top-0 z-20" style={{ background: `${theme.bgScrolled}cc` }}>
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-base transition-transform duration-300 group-hover:scale-110"
              style={{ ...gradientStyle, ...logoTextStyle, fontFamily: '"Playfair Display", serif' }}
            >
              G
            </div>
            <span
              className="font-black text-lg tracking-tight hidden sm:inline"
              style={{ fontFamily: '"Playfair Display", serif', color: theme.brandText }}
            >
              GOLDKING
            </span>
          </Link>
          
          <Link to="/login" className="flex items-center gap-1 text-sm transition-all duration-200 group" style={{ color: theme.textMuted }}>
            <HiOutlineArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Login</span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 py-8">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8 animate-fade-in-down">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
                <HiOutlineSparkles className="w-3 h-3" style={{ color: theme.primary }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.primary }}>Reset Password</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: theme.textPrimary, fontFamily: '"Playfair Display", serif' }}>
                Create New Password
              </h1>
              <p className="text-xs sm:text-sm" style={{ color: theme.textMuted }}>
                Choose a strong password for your account
              </p>
            </div>

            {/* Form Card */}
            <div
              className="rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 animate-fade-in-up"
              style={{
                background: isLightTheme ? `rgba(255,255,255,0.95)` : `rgba(20,20,30,0.88)`,
                border: `1px solid ${theme.border}`,
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="h-1 w-full rounded-full mb-6" style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryDark})` }} />

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password Field */}
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: focusedField === 'password' ? theme.primary : theme.textMuted }}
                  >
                    <HiOutlineLockClosed className="w-3 h-3" />
                    New Password
                  </label>
                  <div className="relative">
                    <div
                      className="absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-200"
                      style={{ color: focusedField === 'password' ? theme.primary : theme.textMuted }}
                    >
                      <HiOutlineLockClosed className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl outline-none transition-all duration-200 text-sm sm:text-base"
                      style={getInputStyle('password')}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: theme.textMuted }}
                    >
                      {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                    </button>
                    <div
                      className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-300 ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'}`}
                      style={{ boxShadow: `0 0 0 3px ${theme.primary}20` }}
                    />
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="space-y-1 mt-2">
                    <p className="text-[10px] font-medium" style={{ color: theme.textMuted }}>Password requirements:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${newPassword.length >= 8 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {newPassword.length >= 8 ? '✓' : '○'} 8+ chars
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {/[A-Z]/.test(newPassword) ? '✓' : '○'} Uppercase
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${/[a-z]/.test(newPassword) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {/[a-z]/.test(newPassword) ? '✓' : '○'} Lowercase
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${/\d/.test(newPassword) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {/\d/.test(newPassword) ? '✓' : '○'} Number
                      </span>
                    </div>
                  </div>
                  
                  <PasswordStrength password={newPassword} />
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: focusedField === 'confirm' ? theme.primary : theme.textMuted }}
                  >
                    <HiOutlineLockClosed className="w-3 h-3" />
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div
                      className="absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-200"
                      style={{ color: focusedField === 'confirm' ? theme.primary : theme.textMuted }}
                    >
                      <HiOutlineLockClosed className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl outline-none transition-all duration-200 text-sm sm:text-base"
                      style={getInputStyle('confirm')}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: theme.textMuted }}
                    >
                      {showConfirmPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                    </button>
                    <div
                      className={`absolute inset-0 rounded-xl pointer-events-none transition-all duration-300 ${focusedField === 'confirm' ? 'opacity-100' : 'opacity-0'}`}
                      style={{ boxShadow: `0 0 0 3px ${theme.primary}20` }}
                    />
                  </div>
                  
                  {/* Password Match Indicator */}
                  {confirmPassword && (
                    <div className="mt-1">
                      {newPassword === confirmPassword ? (
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <HiOutlineCheckCircle className="w-3 h-3" /> Passwords match
                        </p>
                      ) : (
                        <p className="text-[10px] text-red-400 flex items-center gap-1">
                          <HiOutlineExclamationCircle className="w-3 h-3" /> Passwords do not match
                        </p>
                      )}
                    </div>
                  )}
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
                  disabled={loading}
                  className="relative w-full py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group mt-4"
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
                      <span>Resetting Password...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Reset Password</span>
                      <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>

                {/* Back to Login Link */}
                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 text-xs sm:text-sm transition-all duration-200 hover:opacity-70"
                    style={{ color: theme.textMuted }}
                  >
                    <HiOutlineArrowLeft className="w-3 h-3" />
                    Back to Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -20px) rotate(5deg); }
          50% { transform: translate(0, -30px) rotate(0deg); }
          75% { transform: translate(-20px, -20px) rotate(-5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-15px, -20px) scale(1.1); }
          66% { transform: translate(10px, -15px) scale(0.9); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.5s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
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