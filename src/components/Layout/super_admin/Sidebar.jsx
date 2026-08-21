import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import * as saAPI from '../../../services/superAdminApi'; // added for badge
import {
  HiOutlineHome, HiOutlineCurrencyDollar, HiOutlineUsers,
  HiOutlineChartBar, HiOutlineShoppingCart, HiOutlinePhotograph,
  HiOutlineBell, HiOutlineUser,
  HiChevronDoubleLeft, HiChevronDoubleRight,
  HiChevronRight,
  HiOutlineCollection, HiOutlineOfficeBuilding,
  HiOutlineViewGrid, HiX,
} from 'react-icons/hi';

const getNavItems = (t) => [
  {
    to:    '/super-admin',
    icon:  HiOutlineHome,
    label: t('navbar.dashboard', { defaultValue: 'Dashboard' }),
    end:   true,
  },
  {
    to:    '/super-admin/prices',
    icon:  HiOutlineCurrencyDollar,
    label: t('navbar.rates', { defaultValue: 'Prices' }),
  },
  {
    to:    '/super-admin/admins',
    icon:  HiOutlineOfficeBuilding,
    label: t('superAdmin.admins', { defaultValue: 'Admins' }),
  },
  {
    icon:     HiOutlineShoppingCart,
    label:    t('navbar.myOrders', { defaultValue: 'Orders' }),
    groupKey: 'orders',
    children: [
      { to: '/super-admin/orders/my-orders',  icon: HiOutlineCollection, label: t('superAdmin.myOrders', { defaultValue: 'My Orders' })  },
      { to: '/super-admin/orders/all-orders', icon: HiOutlineViewGrid,   label: t('superAdmin.allOrders', { defaultValue: 'All Orders' }) },
    ],
  },
  {
    icon:     HiOutlineUsers,
    label:    t('admin.customers', { defaultValue: 'Customers' }),
    groupKey: 'customers',
    children: [
      { to: '/super-admin/customers/my-customers',  icon: HiOutlineUser,     label: t('superAdmin.myCustomers', { defaultValue: 'My Customers' })  },
      { to: '/super-admin/customers/all-customers', icon: HiOutlineViewGrid, label: t('superAdmin.allCustomers', { defaultValue: 'All Customers' }) },
    ],
  },
  {
    to:    '/super-admin/analytics',
    icon:  HiOutlineChartBar,
    label: t('admin.analytics', { defaultValue: 'Analytics' }),
  },
  {
    to:    '/super-admin/media',
    icon:  HiOutlinePhotograph,
    label: t('admin.media', { defaultValue: 'Media' }),
  },
  {
    to:    '/super-admin/notifications',
    icon:  HiOutlineBell,
    label: t('navbar.notifications', { defaultValue: 'Notifications' }),
  },
  {
    to:    '/super-admin/profile',
    icon:  HiOutlineUser,
    label: t('navbar.profile', { defaultValue: 'Profile' }),
  },
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
function SidebarContent({ collapsed, setCollapsed, onClose, sidebarTheme, theme, unreadCount }) { // added unreadCount prop
  const { t } = useTranslation();
  const navItems = getNavItems(t);
  const [openGroups, setOpenGroups] = useState({});
  const location = useLocation();

  const toggleGroup = (key) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const isGroupActive = (children) =>
    children.some(c =>
      location.pathname === c.to || location.pathname.startsWith(c.to + '/')
    );

  const isGroupOpen = (groupKey, children) =>
    openGroups[groupKey] !== undefined
      ? openGroups[groupKey]
      : isGroupActive(children);

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
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: theme.gradient,
              boxShadow:  `0 4px 12px ${theme.primary}40`,
            }}
          >
            {/* Shield-check icon */}
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806
                   3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806
                   3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946
                   3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946
                   3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806
                   3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806
                   3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946
                   3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946
                   3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>

          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p
                className="text-[15px] font-bold tracking-wide truncate"
                style={{ color: sidebarTheme.text }}
              >
                Islam Jewellers
              </p>
              <p
                className="text-[10px] font-semibold tracking-widest uppercase truncate"
                style={{ color: theme.primary }}
              >
                Super Admin
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
      {/* Add WebKit scrollbar styling */}
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

          // ── Accordion group ──────────────────────────────────
          if (item.children) {
            const groupActive = isGroupActive(item.children);
            const groupOpen   = isGroupOpen(item.groupKey, item.children);
            const Icon        = item.icon;

            // Collapsed: show icon only, clicking expands sidebar
            if (collapsed) {
              return (
                <div key={item.groupKey} className="relative">
                  {groupActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                      style={{ background: theme.primary }}
                    />
                  )}
                  <div
                    title={item.label}
                    role="button"
                    tabIndex={0}
                    className="flex justify-center py-3 rounded-xl transition-all duration-150 select-none cursor-pointer"
                    style={{ background: groupActive ? sidebarTheme.activeBg : 'transparent' }}
                    onMouseEnter={e => { if (!groupActive) e.currentTarget.style.background = sidebarTheme.hoverBg; }}
                    onMouseLeave={e => { if (!groupActive) e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => {
                      setCollapsed(false);
                      setOpenGroups(prev => ({ ...prev, [item.groupKey]: true }));
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setCollapsed(false);
                        setOpenGroups(prev => ({ ...prev, [item.groupKey]: true }));
                      }
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: groupActive ? sidebarTheme.activeIcon : 'rgba(128,128,128,0.1)',
                      }}
                    >
                      <Icon
                        className="w-4.5 h-4.5"
                        style={{ color: groupActive ? theme.primary : sidebarTheme.textMuted }}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            // Expanded: full accordion
            return (
              <div key={item.groupKey}>
                <button
                  onClick={() => toggleGroup(item.groupKey)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                             font-medium transition-all duration-150 select-none"
                  style={{
                    color:      groupActive ? theme.primary : sidebarTheme.textMuted,
                    background: groupActive ? sidebarTheme.activeBg : 'transparent',
                  }}
                  onMouseEnter={e => {
                    if (!groupActive) {
                      e.currentTarget.style.background = sidebarTheme.hoverBg;
                      e.currentTarget.style.color      = sidebarTheme.text;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!groupActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color      = sidebarTheme.textMuted;
                    }
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150"
                    style={{ background: groupActive ? sidebarTheme.activeIcon : 'rgba(128,128,128,0.1)' }}
                  >
                    <Icon
                      className="w-4.5 h-4.5"
                      style={{ color: groupActive ? theme.primary : sidebarTheme.textMuted }}
                    />
                  </div>
                  <span
                    className="flex-1 text-left text-[13.5px] leading-none truncate"
                    style={{ color: groupActive ? theme.primary : 'inherit' }}
                  >
                    {item.label}
                  </span>
                  <HiChevronRight
                    className="w-3.5 h-3.5 shrink-0 opacity-60 transition-transform duration-200"
                    style={{
                      color:     sidebarTheme.textMuted,
                      transform: groupOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>

                {groupOpen && (
                  <div
                    className="mt-1 ml-3 pl-3 space-y-0.5"
                    style={{ borderLeft: `1px solid ${sidebarTheme.childBorder}` }}
                  >
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={handleNavClick}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl
                                     text-[12.5px] font-medium transition-all duration-150 select-none"
                          style={({ isActive }) => ({
                            color:      isActive ? theme.primary : sidebarTheme.textMuted,
                            background: isActive ? sidebarTheme.activeBg : 'transparent',
                          })}
                        >
                          {({ isActive }) => (
                            <>
                              <ChildIcon
                                className="w-3.5 h-3.5 shrink-0"
                                style={{ color: isActive ? theme.primary : sidebarTheme.textMuted }}
                              />
                              <span className="truncate">{child.label}</span>
                              {isActive && (
                                <span
                                  className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full"
                                  style={{ background: theme.primary }}
                                />
                              )}
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // ── Plain NavLink ────────────────────────────────────
          const Icon = item.icon;
          // For Notifications item, show badge with unread count
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

                  {/* Badge for Notifications */}
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
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            title="Super Admin — System Manager"
            style={{
              background: theme.gradient,
              boxShadow:  `0 2px 8px ${theme.primary}40`,
            }}
          >
            <HiOutlineUser className="w-4.5 h-4.5 text-white" />
          </div>
        ) : (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{
              background: sidebarTheme.footerBg,
              border:     `1px solid ${sidebarTheme.footerBorder}`,
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: theme.gradient,
                boxShadow:  `0 2px 8px ${theme.primary}40`,
              }}
            >
              <HiOutlineUser className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[13px] font-semibold truncate leading-tight"
                style={{ color: sidebarTheme.text }}
              >
                Super Admin
              </p>
              <p
                className="text-[11px] truncate leading-tight mt-0.5"
                style={{ color: sidebarTheme.textMuted }}
              >
                System Manager
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
export default function Sidebar({
  collapsed: controlledCollapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose,
}) {
  const { theme } = useTheme();
  const sidebarTheme = useSidebarTheme(theme);
  const [unreadCount, setUnreadCount] = useState(0); // added for badge

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await saAPI.getNotifications();
        const data = res.data ?? res;
        setUnreadCount(data.unreadCount ?? 0);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };
    fetchUnreadCount();
    // Optional: poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
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
        />
      </aside>
    </>
  );
}