import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import Sidebar from './Sidebar';
import Header  from './Header';

export default function Layout() {
  const { user, loading } = useAuth();
  const { theme, isLightTheme } = useTheme();

  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  // ── Loading splash ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: theme?.bg ?? '#0c0c0c' }}
      >
        <div className="relative w-12 h-12">
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: `${theme?.primary ?? '#f59e0b'}30` }}
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: theme?.primary ?? '#f59e0b' }}
          />
        </div>
      </div>
    );
  }

  // ── Auth guard ─────────────────────────────────────────────────────────────
  if (!user || user.role !== 'super_admin') {
    if (user?.role === 'admin')    return <Navigate to="/admin"    replace />;
    if (user?.role === 'customer') return <Navigate to="/customer" replace />;
    return <Navigate to="/login" replace />;
  }

  // ── Responsive sidebar width (desktop only) ────────────────────────────────
  const sidebarW = collapsed ? 68 : 240;

  // ── Page background ────────────────────────────────────────────────────────
  const pageBg = isLightTheme
    ? (theme.pageBg ?? '#f2f1ed')
    : (theme.bg     ?? '#0c0c0c');

  return (
    <div
      className="min-h-screen flex"
      style={{ background: pageBg }}
    >
      {/* ── Sidebar (desktop fixed | mobile drawer) ─────────────────────── */}
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Main content area ───────────────────────────────────────────── */}
      <div
        className={[
          'flex flex-col flex-1 min-h-screen min-w-0',
          'transition-[margin-left] duration-300',
          'lg:ml-[var(--sidebar-w)]',
        ].join(' ')}
        style={{ '--sidebar-w': `${sidebarW}px` }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <Header
          sidebarWidth={sidebarW}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />

        {/* ── Page content ────────────────────────────────────────────── */}
        <main
          className="flex-1 mt-16 overflow-auto min-w-0
                     px-3 py-4
                     
                     "
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}