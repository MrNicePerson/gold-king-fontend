import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { THEMES } from '../../config/themes';
import { getProfile, getUnreadCount } from '../../services/customerApi';
import LanguageSwitcher from './LanguageSwitcher';

// ─── SVG Icon primitives ────────────────────────────────────────────────────
const Ico = ({ d, children, size = 18 }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
        aria-hidden="true"
    >
        {children}
    </svg>
);

const IcoRates = (p) => (
    <Ico {...p}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </Ico>
);
const IcoShops = (p) => (
    <Ico {...p}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </Ico>
);
const IcoOrders = (p) => (
    <Ico {...p}>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </Ico>
);
const IcoBell = (p) => (
    <Ico {...p}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Ico>
);
const IcoUser = (p) => (
    <Ico {...p}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </Ico>
);
const IcoDashboard = (p) => (
    <Ico {...p}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </Ico>
);
const IcoPalette = (p) => (
    <Ico {...p}>
        <circle cx="13.5" cy="6.5" r=".5" />
        <circle cx="17.5" cy="10.5" r=".5" />
        <circle cx="8.5" cy="7.5" r=".5" />
        <circle cx="6.5" cy="12.5" r=".5" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </Ico>
);
const IcoLogout = (p) => (
    <Ico {...p}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </Ico>
);
const IcoLogin = (p) => (
    <Ico {...p}>
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
    </Ico>
);
const IcoCheck = (p) => (
    <Ico {...p} size={14}>
        <polyline points="20 6 9 12 4 10" />
    </Ico>
);
const IcoMenu = (p) => (
    <Ico {...p} size={22}>
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
    </Ico>
);
const IcoClose = (p) => (
    <Ico {...p} size={20}>
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
    </Ico>
);
const IcoPhone = (p) => (
    <Ico {...p} size={13}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
    </Ico>
);
const IcoPin = (p) => (
    <Ico {...p} size={13}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </Ico>
);
const IcoEdit = (p) => (
    <Ico {...p}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Ico>
);

// ─── Notification badge ─────────────────────────────────────────────────────
const Badge = ({ count }) =>
    count > 0 ? (
        <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
            {count > 99 ? '99+' : count}
        </span>
    ) : null;

// ─── Theme-aware CSS variable injector (only active on md+ screens) ───────
const ThemeVars = ({ theme }) => {
    useEffect(() => {
        const id = 'gk-theme-vars';
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement('style');
            el.id = id;
            document.head.appendChild(el);
        }

        const mq = window.matchMedia('(min-width: 768px)');

        const setVars = () => {
            if (mq.matches) {
                el.textContent = `:root {
          --gk-primary: ${theme.primary};
          --gk-bg: ${theme.bg};
          --gk-bg-scrolled: ${theme.bgScrolled};
          --gk-card: ${theme.cardBg};
          --gk-muted: ${theme.textMuted};
          --gk-text: ${theme.textPrimary};
          --gk-border: ${theme.border};
          --gk-brand: ${theme.brandText};
          --gk-logo-text: ${theme.logoText};
          --gk-gradient: ${theme.gradient};
        }`;
            } else {
                el.textContent = '';
            }
        };

        setVars();

        const handler = () => setVars();
        if (mq.addEventListener) mq.addEventListener('change', handler);
        else mq.addListener(handler);

        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', handler);
            else mq.removeListener(handler);
            if (el && el.parentNode) el.parentNode.removeChild(el);
        };
    }, [theme]);
    return null;
};

// ─── Logout Confirmation Modal ──────────────────────────────────────────────
const LogoutModal = ({ theme, isLightTheme, onConfirm, onCancel }) => {
    const { t } = useTranslation();
    const gradientStyle = { background: theme.gradient };
    const logoTextStyle = { color: theme.logoText };

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={onCancel}
        >
            <div
                className="w-full max-w-sm rounded-2xl overflow-hidden"
                style={{
                    background: isLightTheme ? theme.bg : '#0e0b06',
                    border: `1px solid ${theme.border}`,
                    boxShadow: isLightTheme ? '0 20px 60px rgba(0,0,0,0.15)' : '0 20px 60px rgba(0,0,0,0.7)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${theme.primary}80, transparent)` }} />

                <div className="p-6">
                    <div className="flex justify-center mb-4">
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
                        >
                            <IcoLogout size={24} />
                        </div>
                    </div>

                    <h3
                        className="text-center text-lg font-bold mb-1"
                        style={{ fontFamily: '"Playfair Display", serif', color: theme.textPrimary }}
                    >
                        {t('auth.logout')}
                    </h3>
                    <p className="text-center text-sm mb-6" style={{ color: theme.textMuted }}>
                        {t('auth.logoutModalDesc', { defaultValue: 'Are you sure you want to sign out of GOLDKING?' })}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                            style={{
                                background: 'transparent',
                                border: `1px solid ${theme.border}`,
                                color: theme.textMuted,
                            }}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                            style={{
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.35)',
                                color: '#ef4444',
                            }}
                        >
                            <IcoLogout size={15} /> {t('auth.logout')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Sidebar nav link ───────────────────────────────────────────────────────
const SidebarLink = ({ icon: Icon, label, to, href, isAnchor, onClick, isActive, badge, theme }) => {
    const base = `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium`;
    const active = `font-semibold`;

    if (isAnchor) {
        return (
            <a
                href={href}
                onClick={onClick}
                className={`${base} ${isActive ? active : ''}`}
                style={{
                    color: isActive ? theme.primary : theme.textMuted,
                    background: isActive ? `${theme.primary}18` : 'transparent',
                    border: `1px solid ${isActive ? `${theme.primary}40` : 'transparent'}`,
                }}
            >
                <Icon />
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                    <span className="min-w-[20px] h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                        {badge > 99 ? '99+' : badge}
                    </span>
                )}
            </a>
        );
    }
    return (
        <Link
            to={to}
            onClick={onClick}
            className={`${base} ${isActive ? active : ''}`}
            style={{
                color: isActive ? theme.primary : theme.textMuted,
                background: isActive ? `${theme.primary}18` : 'transparent',
                border: `1px solid ${isActive ? `${theme.primary}40` : 'transparent'}`,
            }}
        >
            <Icon />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
                <span className="min-w-[20px] h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </Link>
    );
};

// ─── Main Navbar ─────────────────────────────────────────────────────────────
// Pass `embedInline` when you want just the trigger buttons (bell + menu)
// rendered in place — e.g. inside HeroSection next to the USD Rate card —
// instead of the default fixed full-width header. The sidebar it opens is
// always fixed/full-page regardless of where the trigger is mounted, so
// clicking it opens the same complete-page navigation menu either way.
const Navbar = ({ embedInline = false, triggerClassName = '' }) => {
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const { theme, currentTheme, setCurrentTheme, isLightTheme } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    useEffect(() => {
        if (user?.role === 'customer') {
            getProfile().then((r) => setProfileData(r.data.customer)).catch(console.error);
            const fetchUnread = async () => {
                try { const r = await getUnreadCount(); setUnreadCount(r.data?.unreadCount || 0); }
                catch { /* silent */ }
            };
            fetchUnread();
            const iv = setInterval(fetchUnread, 30000);
            return () => clearInterval(iv);
        }
    }, [user]);

    const handleLogout = () => { logout(); navigate('/login'); setSidebarOpen(false); setShowLogoutModal(false); };

    const getDashboardPath = () => {
        if (user?.role === 'super_admin') return '/super-admin';
        if (user?.role === 'admin') return '/admin';
        return '/login';
    };

    const displayName = profileData?.name || user?.name || user?.email || '';
    const initials = displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'GK';

    const isActive = (path) => location.pathname === path;

    const gradientStyle = { background: theme.gradient };
    const logoTextStyle = { color: theme.logoText };

    // ── Trigger buttons (bell + hamburger) — shared between embedded & fixed modes
    const triggerButtons = (
        <div className={`flex items-center gap-2 ${triggerClassName}`}>
            {user?.role === 'customer' && (
                <Link
                    to="/notifications"
                    className="relative w-10 h-10 flex items-center justify-center rounded-xl"
                    style={{
                        background: `${theme.primary}14`,
                        border: `1px solid ${theme.primary}33`,
                        color: theme.primary,
                    }}
                >
                    <IcoBell size={19} />
                    <Badge count={unreadCount} />
                </Link>
            )}
            <button
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-xl"
                style={{
                    background: `${theme.primary}14`,
                    border: `1px solid ${theme.primary}33`,
                    color: theme.primary,
                }}
                aria-label="Open navigation menu"
            >
                <IcoMenu />
            </button>
        </div>
    );

    // ── Everything below is rendered through a portal straight into
    // document.body. This is what actually fixes the bug: if Navbar (or
    // HeroSection) sits inside a Framer Motion `motion.div`, that ancestor
    // gets an inline `transform` style once it animates — and any CSS
    // `transform` on an ancestor turns it into the containing block for
    // `position: fixed` descendants. That's why the header/sidebar were only
    // "fixed" within the Hero section instead of the whole page, and why the
    // sidebar bottom (Login/Register) was getting clipped by Hero's
    // `overflow-hidden`. Portaling to document.body escapes all of that,
    // on every page, regardless of what wraps <Navbar />.
    const portalContent = (
        <>
            {showLogoutModal && (
                <LogoutModal
                    theme={theme}
                    isLightTheme={isLightTheme}
                    onConfirm={handleLogout}
                    onCancel={() => setShowLogoutModal(false)}
                />
            )}

            {/* ══ HEADER (fixed full-width bar — only in non-embedded mode) ════════ */}
            {!embedInline && (
                <header
                    className="fixed top-0 inset-x-0 z-50 border-b"
                    style={{ background: theme.bg, borderColor: theme.border }}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-end gap-4">
                        {triggerButtons}
                    </div>
                </header>
            )}

            {/* ══ SIDEBAR OVERLAY (fixed — always covers the whole page) ═══════════ */}
            <div
                onClick={() => setSidebarOpen(false)}
                className={`fixed inset-0 z-[998] ${sidebarOpen ? 'block' : 'hidden'}`}
                style={{ background: 'rgba(0,0,0,0.55)' }}
                aria-hidden="true"
            />

            {/* ══ SIDEBAR PANEL (fixed — always covers the whole page) ═════════════ */}
            <aside
                className={`fixed top-0 right-0 bottom-0 z-[999] flex flex-col
          w-[300px] max-w-[85vw]
          border-l overflow-y-auto
          ${sidebarOpen ? 'block' : 'hidden'}`}
                style={{ background: isLightTheme ? theme.bg : '#0e0b06', borderColor: theme.border }}
            >
                <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b" style={{ borderColor: theme.border }}>
                    <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0"
                            style={{ ...gradientStyle, ...logoTextStyle, fontFamily: '"Playfair Display", serif' }}
                        >
                            G
                        </div>
                        <span className="font-black text-base tracking-tight" style={{ fontFamily: '"Playfair Display", serif', color: theme.brandText }}>
                            GOLDKING
                        </span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl"
                        style={{ background: `${theme.primary}14`, border: `1px solid ${theme.primary}33`, color: theme.primary }}
                        aria-label="Close menu"
                    >
                        <IcoClose />
                    </button>
                </div>

                {user && (
                    <div className="mx-4 mt-4 p-4 rounded-2xl shrink-0" style={{ background: `${theme.primary}0f`, border: `1px solid ${theme.primary}30` }}>
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shrink-0" style={gradientStyle}>
                                <span style={logoTextStyle}>{initials}</span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-sm truncate" style={{ color: theme.primary }}>{displayName}</p>
                                <p className="text-xs capitalize" style={{ color: theme.textMuted }}>{user.role?.replace('_', ' ')}</p>
                            </div>
                        </div>

                        {profileData && user.role === 'customer' && (
                            <div className="mt-3 pt-3 flex flex-col gap-1.5 border-t" style={{ borderColor: theme.border }}>
                                {profileData.phoneNumber && (
                                    <span className="flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
                                        <IcoPhone /> {profileData.phoneNumber}
                                    </span>
                                )}
                                {profileData.city && (
                                    <span className="flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
                                        <IcoPin /> {profileData.city}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <nav className="flex-1 flex flex-col gap-1 px-4 py-4">
                    <SidebarLink icon={IcoRates} label={t('navbar.rates')} href="#rates" isAnchor isActive={false} onClick={() => setSidebarOpen(false)} theme={theme} />
                    <SidebarLink icon={IcoShops} label={t('navbar.shops')} href="#shops" isAnchor isActive={false} onClick={() => setSidebarOpen(false)} theme={theme} />
                    <LanguageSwitcher />

                    {user && (
                        <SidebarLink icon={IcoOrders} label={t('navbar.myOrders')} to="/my-orders" isActive={isActive('/my-orders')} onClick={() => setSidebarOpen(false)} theme={theme} />
                    )}

                    {user?.role === 'customer' && (
                        <>
                            <SidebarLink icon={IcoBell} label={t('navbar.notifications')} to="/notifications" isActive={isActive('/notifications')} onClick={() => setSidebarOpen(false)} theme={theme} badge={unreadCount} />
                            <SidebarLink icon={IcoEdit} label={t('customer.profileTitle')} to="/profile" isActive={isActive('/profile')} onClick={() => setSidebarOpen(false)} theme={theme} />
                        </>
                    )}

                    {(user?.role === 'super_admin' || user?.role === 'admin') && (
                        <SidebarLink icon={IcoDashboard} label={t('navbar.dashboard')} to={getDashboardPath()} isActive={location.pathname.startsWith('/admin') || location.pathname.startsWith('/super')} onClick={() => setSidebarOpen(false)} theme={theme} />
                    )}

                    <div className="mt-5">
                        <p className="flex items-center gap-1.5 px-2 mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
                            <IcoPalette size={12} /> {t('common.theme', { defaultValue: 'Theme' })}
                        </p>
                        <div className="flex flex-wrap gap-1.5 px-1">
                            {Object.entries(THEMES).map(([key, t]) => {
                                const active = currentTheme === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setCurrentTheme(key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${active ? 'font-semibold' : 'font-normal'}`}
                                        style={{
                                            color: active ? t.primary : theme.textMuted,
                                            border: `1px solid ${active ? t.primary : theme.border}`,
                                            background: active ? `${t.primary}18` : 'transparent',
                                        }}
                                    >
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.gradient }} />
                                        {t.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                <div className="px-4 pb-6 pt-2 shrink-0 border-t" style={{ borderColor: theme.border }}>
                    {user ? (
                        <button
                            onClick={() => { setSidebarOpen(false); setShowLogoutModal(true); }}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium mt-4"
                            style={{ color: theme.textMuted, border: `1px solid ${theme.border}`, background: 'transparent' }}
                        >
                            <IcoLogout /> {t('navbar.logout')}
                        </button>
                    ) : (
                        <div className="flex flex-col gap-2 mt-4">
                            <Link
                                to="/login"
                                onClick={() => setSidebarOpen(false)}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
                                style={{ color: theme.textMuted, border: `1px solid ${theme.border}` }}
                            >
                                <IcoLogin /> {t('navbar.login')}
                            </Link>
                            <Link
                                to="/register"
                                onClick={() => setSidebarOpen(false)}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                                style={{ ...gradientStyle, ...logoTextStyle }}
                            >
                                <IcoUser /> {t('navbar.register')}
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );

    return (
        <>
            <ThemeVars theme={theme} />

            {/* Embedded trigger renders inline, exactly where the parent (Hero) puts
          it in the layout — this part is NOT portaled, since its position is
          meant to flow with the surrounding content. */}
            {embedInline && triggerButtons}

            {/* Header / overlay / sidebar / logout modal always portal to
          document.body so they're truly fixed to the viewport on every page. */}
            {createPortal(portalContent, document.body)}
        </>
    );
};

export default Navbar;