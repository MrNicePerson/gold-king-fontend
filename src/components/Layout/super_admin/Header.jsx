import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { THEMES } from '../../../config/themes';
import {
  HiOutlineLogout, HiOutlineHome, HiMenu,
  HiOutlineColorSwatch, HiChevronDown, HiCheck,
  HiSun, HiMoon,
} from 'react-icons/hi';

// ── Theme Dropdown ─────────────────────────────────────────────────────────────
function ThemeDropdown({ theme, currentTheme, setCurrentTheme, onClose, isLight }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-2xl z-[200] overflow-hidden"
      style={{
        background:  isLight ? '#ffffff' : '#1a1a1a',
        border:      `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
        boxShadow:   isLight
          ? '0 20px 40px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)'
          : '0 20px 40px rgba(0,0,0,0.6),  0 4px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div
        className="p-2 max-h-72 overflow-y-auto"
        style={{ scrollbarWidth: 'thin' }}
      >
        {['light', 'dark'].map(type => (
          <div key={type} className="mb-1">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)' }}
            >
              {type === 'light' ? <HiSun className="w-3 h-3" /> : <HiMoon className="w-3 h-3" />}
              {type === 'light' ? 'Light' : 'Dark'}
            </div>

            {Object.entries(THEMES)
              .filter(([, t]) => t.type === type)
              .map(([key, t]) => {
                const active = currentTheme === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setCurrentTheme(key); onClose(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-150 text-left"
                    style={{
                      color:      active ? t.primary : (isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'),
                      background: active ? `${t.primary}15` : 'transparent',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ background: t.gradient }}
                    />
                    <span className="flex-1">{t.name}</span>
                    {active && (
                      <HiCheck className="w-3.5 h-3.5 shrink-0" style={{ color: t.primary }} />
                    )}
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Header ────────────────────────────────────────────────────────────────
export default function Header({ sidebarWidth = 240, onMobileMenuOpen }) {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, currentTheme, setCurrentTheme, isLightTheme } = useTheme();

  // Update mobile state on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLight     = isLightTheme;
  const primaryColor = theme.primary;
  const mutedColor   = theme.textMuted;
  const textColor    = theme.textPrimary;
  const headerBg     = isLight ? 'rgba(255,255,255,0.97)' : `${theme.bg}f5`;
  const headerBorder = theme.border;

  // On desktop, offset header left edge after the sidebar (+ 16px gap)
  const headerLeft = isMobile ? 0 : sidebarWidth;

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'SA';

  return (
    <header
      className={[
        'fixed top-0 right-0 z-30 h-16',
        'flex items-center justify-between',
        'px-3 sm:px-5',
        'transition-all duration-300',
      ].join(' ')}
      style={{
        left:          headerLeft,
        background:    headerBg,
        borderBottom:  `1px solid ${headerBorder}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: isLight
          ? '0 1px 0 0 rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)'
          : '0 1px 0 0 rgba(255,255,255,0.06), 0 2px 16px rgba(0,0,0,0.3)',
      }}
    >
      {/* ── LEFT ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 shrink-0"
          style={{
            color:      primaryColor,
            background: `${primaryColor}15`,
            border:     `1px solid ${primaryColor}30`,
          }}
          aria-label="Open navigation"
        >
          <HiMenu className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          style={{ color: mutedColor }}
          onMouseEnter={e => {
            e.currentTarget.style.color      = primaryColor;
            e.currentTarget.style.background = `${primaryColor}12`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color      = mutedColor;
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <HiOutlineHome className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline text-[13px]">Back to Home</span>
        </button>
      </div>

      {/* ── RIGHT ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span
          className="hidden sm:inline-flex items-center gap-1.5 text-[10.5px] font-bold tracking-widest px-2.5 py-1.5 rounded-full uppercase"
          style={{
            color:      primaryColor,
            background: `${primaryColor}15`,
            border:     `1px solid ${primaryColor}30`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: primaryColor, boxShadow: `0 0 4px ${primaryColor}` }}
          />
          {user?.role?.replace('_', ' ') || 'Super Admin'}
        </span>

        <div
          className="hidden sm:block w-px h-6 mx-0.5"
          style={{ background: headerBorder }}
        />

        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(v => !v)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm transition-all duration-200"
            style={{
              color:      primaryColor,
              background: `${primaryColor}12`,
              border:     `1px solid ${primaryColor}28`,
            }}
            aria-label="Change theme"
          >
            <HiOutlineColorSwatch className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline text-[12.5px] font-medium">{theme.name}</span>
            <HiChevronDown
              className="hidden md:block w-3 h-3 transition-transform duration-200"
              style={{ transform: showThemeMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {showThemeMenu && (
            <ThemeDropdown
              theme={theme}
              currentTheme={currentTheme}
              setCurrentTheme={setCurrentTheme}
              isLight={isLight}
              onClose={() => setShowThemeMenu(false)}
            />
          )}
        </div>

        <div
          className="hidden sm:block w-px h-6 mx-0.5"
          style={{ background: headerBorder }}
        />

        <div className="relative shrink-0">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center"
            style={{
              background: theme.gradient,
              boxShadow:  `0 4px 12px ${primaryColor}40`,
            }}
          >
            <span className="text-white font-black text-[11px] tracking-wider">{initials}</span>
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{
              background:  '#34d399',
              borderColor: isLight ? '#ffffff' : theme.bg,
              boxShadow:   '0 0 6px rgba(52,211,153,0.6)',
            }}
          />
        </div>

        <div className="hidden md:block min-w-0 max-w-[110px]">
          <p
            className="text-[13px] font-semibold truncate leading-tight"
            style={{ color: textColor }}
          >
            {user?.name || 'Super Admin'}
          </p>
          <p
            className="text-[11px] truncate leading-tight"
            style={{ color: mutedColor }}
          >
            System Manager
          </p>
        </div>

        <div
          className="hidden md:block w-px h-6 mx-0.5"
          style={{ background: headerBorder }}
        />

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150"
          style={{
            color:       mutedColor,
            border:      '1px solid transparent',
            background:  'transparent',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color        = '#ef4444';
            e.currentTarget.style.borderColor  = '#ef444430';
            e.currentTarget.style.background   = '#ef44440c';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color        = mutedColor;
            e.currentTarget.style.borderColor  = 'transparent';
            e.currentTarget.style.background   = 'transparent';
          }}
          aria-label="Logout"
        >
          <HiOutlineLogout className="w-4 h-4" />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  );
}