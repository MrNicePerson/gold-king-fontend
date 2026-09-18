// pages/home/ProfilePage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getProfile, updateProfile } from '../../services/customerApi';
import { authAPI } from '../../services/authApi';
import Navbar from '../../components/HomePage/Navbar';
import Footer from '../../components/HomePage/Footer';
import { 
  HiOutlineUser, 
  HiOutlineMail, 
  HiOutlinePhone, 
  HiOutlineLocationMarker,
  HiOutlineHome,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlinePencil,
  HiOutlineSave,
  HiOutlineX,
  HiOutlineLogout,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiOutlineUserCircle,
  HiOutlineBriefcase,
} from 'react-icons/hi';
import { FaSpinner, FaGem, FaRegEdit } from 'react-icons/fa';

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
      const particleCount = 40;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.15,
          opacity: Math.random() * 0.15 + 0.05,
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
      style={{ opacity: 0.25 }}
    />
  );
};

// Floating Orbs Component
const FloatingOrbs = ({ theme }) => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full animate-float-slow" style={{ background: `radial-gradient(circle, ${theme.primary}08, transparent)`, filter: 'blur(50px)' }} />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full animate-float-delayed" style={{ background: `radial-gradient(circle, ${theme.primaryLight || theme.primary}05, transparent)`, filter: 'blur(60px)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full animate-pulse-slow" style={{ background: `radial-gradient(circle, ${theme.primary}03, transparent)`, filter: 'blur(70px)' }} />
    </div>
  );
};

// Info Card Component
const InfoCard = ({ icon: Icon, label, value, isEditing, editValue, onChange, type = "text", placeholder = "" }) => {
  const { theme, isLightTheme } = useTheme();
  
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color: theme.primary }} />
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.textMuted }}>{label}</span>
      </div>
      {isEditing ? (
        <input
          type={type}
          value={editValue}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl outline-none transition-all duration-200 text-sm"
          style={{
            background: isLightTheme ? '#f5f5f5' : 'rgba(50,50,60,0.9)',
            border: `1px solid ${theme.border}`,
            color: theme.textPrimary,
          }}
        />
      ) : (
        <p className="text-sm font-medium" style={{ color: value ? theme.textPrimary : theme.textMuted }}>
          {value || 'Not specified'}
        </p>
      )}
    </div>
  );
};

export default function CustomerProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, isLightTheme } = useTheme();
  const { toasts, addToast, removeToast } = useToast();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phoneNumber: '',
    whatsappNumber: '',
    address: '',
    city: '',
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const gradientStyle = { background: theme.gradient };
  const logoTextStyle = { color: theme.logoText };

  const loadProfile = useCallback(async () => {
    try {
      const res = await getProfile();
      setProfile(res.data.customer);
      setEditForm({
        name: res.data.customer.name || '',
        phoneNumber: res.data.customer.phoneNumber || '',
        whatsappNumber: res.data.customer.whatsappNumber || '',
        address: res.data.customer.address || '',
        city: res.data.customer.city || '',
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      addToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleEditChange = (field) => (e) => {
    setEditForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await updateProfile(editForm);
      setProfile(res.data.customer);
      setIsEditing(false);
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword.length < 8) {
      addToast('New password must be at least 8 characters', 'error');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    
    setChangingPassword(true);
    
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      addToast('Password changed successfully!', 'success');
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      name: profile?.name || '',
      phoneNumber: profile?.phoneNumber || '',
      whatsappNumber: profile?.whatsappNumber || '',
      address: profile?.address || '',
      city: profile?.city || '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: `radial-gradient(circle at 50% 50%, ${theme.bg}, ${theme.cardBg})` }}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: `${theme.primary}20`, borderTopColor: theme.primary }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: theme.primary }} />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground theme={theme} />
      <FloatingOrbs theme={theme} />
      
      <div className="fixed inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${theme.bg}, ${theme.cardBg})` }} />
      
      <Toast toasts={toasts} removeToast={removeToast} />
      
      <div className="relative z-10">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 py-20 sm:py-24">
          {/* Header */}
          <div className="mb-8 animate-fade-in-down">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs mb-4 transition-all duration-200 group"
              style={{ color: theme.textMuted }}
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span className="group-hover:opacity-80">Back</span>
            </button>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
                  <HiOutlineSparkles className="w-3 h-3" style={{ color: theme.primary }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: theme.primary }}>My Profile</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.textPrimary, fontFamily: '"Playfair Display", serif' }}>
                  {profile?.name || user?.name || 'Customer'}
                </h1>
                <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
                  Manage your personal information
                </p>
              </div>
              
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    background: `${theme.primary}15`,
                    border: `1px solid ${theme.primary}30`,
                    color: theme.primary,
                  }}
                >
                  <FaRegEdit className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Avatar Card */}
          <div className="mb-6 animate-fade-in-up">
            <div className="rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300"
              style={{
                background: isLightTheme ? `rgba(255,255,255,0.95)` : `rgba(20,20,30,0.88)`,
                border: `1px solid ${theme.border}`,
                backdropFilter: 'blur(20px)',
              }}>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                    color: theme.logoText,
                  }}
                >
                  {profile?.name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'G'}
                </div>
                <div className="text-center sm:text-left">
                  {profile?.addedBy && (
                    <div className="mb-2 flex items-center justify-center sm:justify-start gap-1.5 text-base font-bold" style={{ color: theme.primary }}>
                      <HiOutlineBriefcase className="w-5 h-5" />
                      <span>Added by {profile.addedBy.shopName || profile.addedBy.name}</span>
                    </div>
                  )}
                  <h2 className="text-xl font-bold" style={{ color: theme.textPrimary }}>{profile?.name || user?.name}</h2>
                  <p className="text-sm" style={{ color: theme.textMuted }}>{profile?.email || user?.email}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ background: `${theme.primary}15`, color: theme.primary }}>
                      <HiOutlineUserCircle className="w-3 h-3" />
                      Customer
                    </span>
                    <span className="text-xs flex items-center" style={{ color: theme.textMuted }}>
                      <HiOutlineCalendar className="w-3 h-3 mr-1" />
                      Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short' }) : 'recently'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Mode Banner */}
          {isEditing && (
            <div className="mb-6 p-4 rounded-xl animate-slide-up" style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}20` }}>
              <div className="flex items-center gap-3">
                <HiOutlinePencil className="w-5 h-5" style={{ color: theme.primary }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>Edit Mode</p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>Update your information below</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Profile Card */}
          <div className="rounded-2xl overflow-hidden animate-fade-in-up backdrop-blur-xl transition-all duration-300 hover:shadow-2xl"
            style={{
              background: isLightTheme ? `rgba(255,255,255,0.95)` : `rgba(20,20,30,0.88)`,
              border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(20px)',
            }}>
            <div className="h-1" style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryDark})` }} />
            
            <div className="p-6 sm:p-8">
              <form onSubmit={handleSaveProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoCard
                    icon={HiOutlineUser}
                    label="FULL NAME"
                    value={profile?.name}
                    editValue={editForm.name}
                    onChange={handleEditChange('name')}
                    isEditing={isEditing}
                    placeholder="Your full name"
                  />
                  
                  <InfoCard
                    icon={HiOutlineMail}
                    label="EMAIL ADDRESS"
                    value={profile?.email || user?.email}
                    isEditing={false}
                  />
                  
                  <InfoCard
                    icon={HiOutlinePhone}
                    label="PHONE NUMBER"
                    value={profile?.phoneNumber}
                    editValue={editForm.phoneNumber}
                    onChange={handleEditChange('phoneNumber')}
                    isEditing={isEditing}
                    placeholder="03001234567"
                  />
                  
                  <InfoCard
                    icon={HiOutlineBriefcase}
                    label="WHATSAPP NUMBER"
                    value={profile?.whatsappNumber || profile?.phoneNumber}
                    editValue={editForm.whatsappNumber}
                    onChange={handleEditChange('whatsappNumber')}
                    isEditing={isEditing}
                    placeholder="03001234567"
                  />
                  
                  <InfoCard
                    icon={HiOutlineLocationMarker}
                    label="CITY"
                    value={profile?.city}
                    editValue={editForm.city}
                    onChange={handleEditChange('city')}
                    isEditing={isEditing}
                    placeholder="Your city"
                  />
                  
                  <InfoCard
                    icon={HiOutlineHome}
                    label="ADDRESS"
                    value={profile?.address}
                    editValue={editForm.address}
                    onChange={handleEditChange('address')}
                    isEditing={isEditing}
                    placeholder="Street address"
                  />
                </div>
                
                {isEditing && (
                  <div className="flex gap-3 mt-8 pt-4 border-t" style={{ borderColor: theme.border }}>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                        color: theme.logoText,
                      }}
                    >
                      {saving ? (
                        <>
                          <FaSpinner className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <HiOutlineSave className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
                      style={{ color: theme.textMuted, border: `1px solid ${theme.border}` }}
                    >
                      <HiOutlineX className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Security Section */}
          <div className="mt-6 rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300"
            style={{
              background: isLightTheme ? `rgba(255,255,255,0.95)` : `rgba(20,20,30,0.88)`,
              border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(20px)',
            }}>
            <div className="flex items-center gap-2.5 px-6 py-4 border-b" style={{ borderColor: theme.border }}>
              <HiOutlineLockClosed className="w-4 h-4" style={{ color: theme.primary }} />
              <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: theme.textMuted }}>Security</span>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-medium" style={{ color: theme.textPrimary }}>Password</h3>
                  <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>Change your account password</p>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    color: theme.primary,
                    border: `1px solid ${theme.primary}30`,
                  }}
                >
                  <HiOutlineLockClosed className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-6 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(239,68,68,0.05)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
            <div className="flex items-center gap-2.5 px-6 py-4 border-b" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
              <span className="text-base">⚠️</span>
              <span className="text-[11px] font-bold tracking-wider uppercase text-red-400">Danger Zone</span>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-medium text-red-400">Logout</h3>
                  <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>Sign out of your account</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171',
                  }}
                >
                  <HiOutlineLogout className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden animate-fade-in-up"
            style={{
              background: isLightTheme ? `rgba(255,255,255,0.98)` : `rgba(20,20,30,0.96)`,
              border: `1px solid ${theme.border}`,
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}>
            <div className="h-1" style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryDark})` }} />
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold" style={{ color: theme.textPrimary, fontFamily: '"Playfair Display", serif' }}>
                  Change Password
                </h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-2xl leading-none transition-opacity hover:opacity-70"
                  style={{ color: theme.textMuted }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold tracking-wider uppercase mb-1.5" style={{ color: theme.textMuted }}>
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 rounded-xl outline-none transition-all duration-200 pr-12 text-sm"
                      style={{
                        background: isLightTheme ? '#f5f5f5' : 'rgba(50,50,60,0.9)',
                        border: `1px solid ${theme.border}`,
                        color: theme.textPrimary,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: theme.textMuted }}
                    >
                      {showCurrentPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider uppercase mb-1.5" style={{ color: theme.textMuted }}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 rounded-xl outline-none transition-all duration-200 pr-12 text-sm"
                      style={{
                        background: isLightTheme ? '#f5f5f5' : 'rgba(50,50,60,0.9)',
                        border: `1px solid ${theme.border}`,
                        color: theme.textPrimary,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: theme.textMuted }}
                    >
                      {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold tracking-wider uppercase mb-1.5" style={{ color: theme.textMuted }}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 rounded-xl outline-none transition-all duration-200 pr-12 text-sm"
                      style={{
                        background: isLightTheme ? '#f5f5f5' : 'rgba(50,50,60,0.9)',
                        border: `1px solid ${theme.border}`,
                        color: theme.textPrimary,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: theme.textMuted }}
                    >
                      {showConfirmPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-[10px] mt-1 text-red-400 flex items-center gap-1">
                      <HiOutlineExclamationCircle className="w-3 h-3" /> Passwords do not match
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
                      color: theme.logoText,
                    }}
                  >
                    {changingPassword ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200"
                    style={{ color: theme.textMuted, border: `1px solid ${theme.border}` }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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