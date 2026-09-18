// frontend/src/components/Layout/AdminSidebar.jsx
import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import * as adminAPI from '../../../services/adminApi'; // added for badge
import {
  HiOutlineHome, HiOutlineCurrencyDollar, HiOutlineUsers,
  HiOutlineChartBar, HiOutlineShoppingCart, HiOutlinePhotograph,
  HiOutlineBell, HiOutlineUser,
  HiChevronDoubleLeft, HiChevronDoubleRight,
  HiOutlineScale, HiX,
} from 'react-icons/hi';

const getNavItems = (t) => [
  { to: '/admin',               icon: HiOutlineHome,           label: t('navbar.dashboard', { defaultValue: 'Dashboard' }),    end: true },
  { to: '/admin/prices',        icon: HiOutlineCurrencyDollar, label: t('navbar.rates', { defaultValue: 'Prices' })                  },
  { to: '/admin/super-pricing', icon: HiOutlineScale,          label: t('admin.superPricing', { defaultValue: 'Ref. Pricing' })            },
  { to: '/admin/customers',     icon: HiOutlineUsers,          label: t('admin.customers', { defaultValue: 'Customers' })               },
  { to: '/admin/orders',        icon: HiOutlineShoppingCart,   label: t('navbar.myOrders', { defaultValue: 'Orders' })                  },
  { to: '/admin/analytics',     icon: HiOutlineChartBar,       label: t('admin.analytics', { defaultValue: 'Analytics' })               },
  { to: '/admin/media',         icon: HiOutlinePhotograph,     label: t('admin.media', { defaultValue: 'Media' })                   },
  { to: '/admin/notifications', icon: HiOutlineBell,           label: t('navbar.notifications', { defaultValue: 'Notifications' })           },
  { to: '/admin/profile',       icon: HiOutlineUser,           label: t('navbar.profile', { defaultValue: 'Profile' })                 },
];

// ── Sidebar colour tokens ──────────────────────────────────────────────────────
function useSidebarTheme(theme) {
  const isLight = theme.type === 'light';
  return {
    bg:           isLight ? (theme.cardBg ?? '#ffffff') : '#111111',
    border:       isLight ? (theme.border ?? 'rgba(0,0,0,0.08)') : 'rgba(255,255,255,0.08)',
    text:         isLight ? (theme.textPrimary ?? '#111827') : '#ffffff',
    textMuted:    isLight ? (theme.textMuted ?? '#6b7280')  : 'rgba(255,255,255,0.55)',
    activeText:   theme.primary,
    activeBg:     `${theme.primary}26`,
    activeIcon:   `${theme.primary}3d`,
    hoverBg:      isLight ? `${theme.primary}10` : 'rgba(255,255,255,0.07)',
    childBorder:  isLight ? `${theme.primary}30` : 'rgba(255,255,255,0.10)',
    footerBg:     isLight ? `${theme.primary}08` : 'rgba(255,255,255,0.05)',
    footerBorder: isLight ? `${theme.primary}20` : 'rgba(255,255,255,0.08)',
    scrollThumb:  isLight ? `${theme.primary}40` : 'rgba(255,255,255,0.15)',
  };
}

// ── Shared sidebar body ────────────────────────────────────────────────────────
function SidebarContent({ collapsed, setCollapsed, onClose, sidebarTheme, theme, unreadCount, user, shopLogo }) {
  const { t } = useTranslation();
  const navItems = getNavItems(t);
  const handleNavClick = () => { if (onClose) onClose(); };

  return (
    <div className="flex flex-col h-full" style={{ background: sidebarTheme.bg }}>

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div
        className={`shrink-0 h-16 flex items-center gap-2 px-3 relative
          ${collapsed ? 'justify-center' : 'justify-between'}`}
        style={{ borderBottom: `1px solid ${sidebarTheme.border}` }}
      >
        {/* Logo + wordmark */}
        <div className={`flex items-center gap-3 min-w-0 overflow-hidden ${collapsed ? 'w-full justify-center' : ''}`}>
          {shopLogo ? (
            <img
              src={shopLogo}
              alt={user?.shopName || 'Shop Logo'}
              className="w-9 h-9 rounded-xl object-cover shrink-0"
              style={{
                boxShadow: `0 4px 12px ${theme.primary}40`,
              }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: theme.gradient,
                boxShadow:  `0 4px 12px ${theme.primary}40`,
              }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          )}

          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p
                className="text-[15px] font-bold tracking-wide truncate"
                style={{ color: sidebarTheme.text }}
              >
                {user?.shopName || 'My Shop'}
              </p>
              <p
                className="text-[10px] font-semibold tracking-widest uppercase truncate"
                style={{ color: theme.primary }}
              >
                Admin Panel
              </p>
            </div>
          )}
        </div>

        {/* Mobile close */}
        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
            style={{
              color:      sidebarTheme.textMuted,
              background: sidebarTheme.hoverBg,
              border:     `1px solid ${sidebarTheme.border}`,
            }}
            aria-label="Close sidebar"
          >
            <HiX className="w-4 h-4" />
          </button>
        )}

        {/* Desktop collapse (expanded) */}
        {!onClose && !collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
            style={{
              color:      sidebarTheme.textMuted,
              background: sidebarTheme.hoverBg,
              border:     `1px solid ${sidebarTheme.border}`,
            }}
          >
            <HiChevronDoubleLeft className="w-4 h-4" />
          </button>
        )}

        {/* Desktop expand (collapsed) */}
        {!onClose && collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            className="absolute -right-4 top-5 w-8 h-8 rounded-full flex items-center justify-center
                       transition-all duration-150 shadow-lg z-10"
            style={{
              background: sidebarTheme.bg,
              border:     `2px solid ${theme.primary}99`,
              color:      theme.primary,
              boxShadow:  '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            <HiChevronDoubleRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${sidebarTheme.scrollThumb};
          border-radius: 10px;
        }
      `}</style>
      <nav
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 py-4 space-y-0.5 custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${sidebarTheme.scrollThumb} transparent`,
        }}
      >
        {!collapsed && (
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em] px-2 mb-3"
            style={{ color: sidebarTheme.textMuted, opacity: 0.6 }}
          >
            Menu
          </p>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const showBadge = item.label === 'Notifications' && unreadCount > 0;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={handleNavClick}
              title={collapsed ? item.label : undefined}
              className="group relative flex items-center rounded-xl font-medium
                         transition-all duration-150 select-none"
              style={({ isActive }) => ({
                justifyContent: collapsed ? 'center' : undefined,
                padding:        collapsed ? '12px 0' : '10px 12px',
                gap:            collapsed ? undefined  : '12px',
                color:          isActive ? theme.primary : sidebarTheme.textMuted,
                background:     isActive ? sidebarTheme.activeBg : 'transparent',
              })}
              onMouseEnter={e => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                if (!isActive) e.currentTarget.style.background = sidebarTheme.hoverBg;
              }}
              onMouseLeave={e => {
                const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {({ isActive }) => (
                <>
                  {collapsed && isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                      style={{ background: theme.primary }}
                    />
                  )}

                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                               transition-all duration-150"
                    style={{
                      background: isActive ? sidebarTheme.activeIcon : 'rgba(128,128,128,0.1)',
                    }}
                  >
                    <Icon
                      className="w-4.5 h-4.5"
                      style={{ color: isActive ? theme.primary : sidebarTheme.textMuted }}
                    />
                  </div>

                  {!collapsed && (
                    <span className="flex-1 truncate text-[13.5px] leading-none">
                      {item.label}
                    </span>
                  )}

                  {!collapsed && isActive && (
                    <span
                      className="shrink-0 w-2 h-2 rounded-full"
                      style={{
                        background: theme.primary,
                        boxShadow:  `0 0 6px ${theme.primary}80`,
                      }}
                    />
                  )}

                  {!collapsed && showBadge && (
                    <span
                      className="shrink-0 ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: '#ef4444',
                        color:      'white',
                        minWidth:   '20px',
                        textAlign:  'center',
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}

                  {collapsed && showBadge && (
                    <span
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <div
        className={`shrink-0 px-2.5 py-3 ${collapsed ? 'flex justify-center' : ''}`}
        style={{ borderTop: `1px solid ${sidebarTheme.border}` }}
      >
        {collapsed ? (
          shopLogo ? (
            <img
              src={shopLogo}
              alt={user?.shopName || 'Shop Logo'}
              className="w-9 h-9 rounded-xl object-cover"
              title="Admin — Shop Manager"
              style={{
                boxShadow: `0 2px 8px ${theme.primary}40`,
              }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              title="Admin — Shop Manager"
              style={{
                background: theme.gradient,
                boxShadow:  `0 2px 8px ${theme.primary}40`,
              }}
            >
              <HiOutlineUser className="w-4.5 h-4.5 text-white" />
            </div>
          )
        ) : (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{
              background: sidebarTheme.footerBg,
              border:     `1px solid ${sidebarTheme.footerBorder}`,
            }}
          >
            {shopLogo ? (
              <img
                src={shopLogo}
                alt={user?.shopName || 'Shop Logo'}
                className="w-9 h-9 rounded-xl object-cover shrink-0"
                style={{
                  boxShadow: `0 2px 8px ${theme.primary}40`,
                }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: theme.gradient,
                  boxShadow:  `0 2px 8px ${theme.primary}40`,
                }}
              >
                <HiOutlineUser className="w-4.5 h-4.5 text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p
                className="text-[13px] font-semibold truncate leading-tight"
                style={{ color: sidebarTheme.text }}
              >
                {user?.name || 'Admin'}
              </p>
              <p
                className="text-[11px] truncate leading-tight mt-0.5"
                style={{ color: sidebarTheme.textMuted }}
              >
                {user?.shopName || 'Shop Manager'}
              </p>
            </div>
            <span
              className="shrink-0 w-2 h-2 rounded-full"
              style={{ background: '#34d399', boxShadow: '0 0 6px #34d39980' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function AdminSidebar({
  collapsed: controlledCollapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose,
}) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const sidebarTheme = useSidebarTheme(theme);
  const [unreadCount, setUnreadCount] = useState(0);
  const [shopLogo, setShopLogo] = useState(null);

  // Fetch unread notifications count AND shop logo
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminAPI.getNotifications();
        const data = res.data ?? res;
        setUnreadCount(data.unreadCount ?? 0);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    const fetchShopLogo = async () => {
      try {
        const res = await adminAPI.getDashboard();
        const shop = res.data?.shopInfo;
        if (shop?.shopLogo) {
          setShopLogo(shop.shopLogo);
        }
      } catch (err) {
        console.error('Failed to fetch shop logo:', err);
      }
    };

    fetchData();
    fetchShopLogo();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const isControlled = controlledCollapsed !== undefined;
  const collapsed    = isControlled ? controlledCollapsed : false;
  const setCollapsed = isControlled ? onCollapsedChange   : () => {};

  // Close mobile drawer on route change
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      prevPath.current = location.pathname;
      onMobileClose?.();
    }
  }, [location.pathname, onMobileClose]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* ── DESKTOP sidebar (lg+) ─────────────────────────── */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 z-40 flex-col h-screen max-h-screen
                   transition-all duration-300 ease-in-out"
        style={{
          width:       collapsed ? 68 : 240,
          background:  sidebarTheme.bg,
          borderRight: `1px solid ${sidebarTheme.border}`,
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onClose={null}
          sidebarTheme={sidebarTheme}
          theme={theme}
          unreadCount={unreadCount}
          user={user}
          shopLogo={shopLogo}
        />
      </aside>

      {/* ── MOBILE backdrop overlay ──────────────────────── */}
      <div
        onClick={onMobileClose}
        className={`lg:hidden fixed inset-0 z-[49] transition-all duration-300
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        aria-hidden="true"
      />

      {/* ── MOBILE drawer panel ──────────────────────────── */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 flex flex-col
          w-72 max-w-[85vw]
          transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
        style={{
          background:   sidebarTheme.bg,
          borderRight:  `1px solid ${sidebarTheme.border}`,
          transform:    mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow:    mobileOpen
            ? '4px 0 24px rgba(0,0,0,0.3)'
            : 'none',
        }}
        aria-label="Mobile navigation"
        aria-modal="true"
        role="dialog"
      >
        <SidebarContent
          collapsed={false}
          setCollapsed={() => {}}
          onClose={onMobileClose}
          sidebarTheme={sidebarTheme}
          theme={theme}
          unreadCount={unreadCount}
          user={user}
          shopLogo={shopLogo}
        />
      </aside>
    </>
  );
}