'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, BarChart3, Settings, Hotel,
  ChevronLeft, ChevronRight, X, LogOut, Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',      href: '/dashboard',  devOnly: false },
  { icon: FileText,        label: 'ODC Management', href: '/',           devOnly: false },
  { icon: BarChart3,       label: 'Reports',        href: '/reports',    devOnly: false },
  { icon: Settings,        label: 'Settings',       href: '/settings',   devOnly: true  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname    = usePathname();
  const { user, logout, isDeveloper } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const roleBadgeStyle = user?.role === 'developer'
    ? { background: '#8B5CF6', color: 'white' }
    : { background: 'var(--brand-brass)', color: '#1B2A4A' };

  const navContent = (isMobile: boolean) => (
    <>
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--brand-brass)' }}
        >
          <Hotel size={18} color="#1B2A4A" strokeWidth={2.5} />
        </div>
        {(!collapsed || isMobile) && (
          <div className="overflow-hidden flex-1">
            <p className="text-sm leading-tight" style={{ color: 'var(--brand-sand)', fontWeight: 700 }}>
              ODC Manager
            </p>
            <p className="text-xs leading-tight mt-0.5" style={{ color: 'rgba(245,240,232,0.5)' }}>
              Hotel Management
            </p>
          </div>
        )}
        {isMobile && (
          <button
            onClick={onMobileClose}
            className="ml-auto p-1 rounded-md hover:bg-white/10 transition-colors"
            style={{ color: 'rgba(245,240,232,0.6)' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {(!collapsed || isMobile) && (
          <p
            className="px-3 mb-2 text-xs uppercase tracking-widest select-none"
            style={{ color: 'rgba(245,240,232,0.3)', fontSize: '0.65rem', fontWeight: 600 }}
          >
            Main Menu
          </p>
        )}
        {NAV_ITEMS.map(({ icon: Icon, label, href, devOnly }) => {
          const isActive = pathname === href;
          const isLocked = devOnly && !isDeveloper;

          return (
            <Link
              key={label}
              href={href}
              onClick={() => { if (isMobile) onMobileClose?.(); }}
              className={`sidebar-nav-item ${isActive ? 'active' : ''} ${isLocked ? 'opacity-50' : ''}`}
              title={collapsed && !isMobile ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {(!collapsed || isMobile) && (
                <span className="flex-1">{label}</span>
              )}
              {(!collapsed || isMobile) && isLocked && (
                <Lock size={12} style={{ color: 'rgba(245,240,232,0.4)' }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer — user info + logout */}
      <div
        className="px-2 py-3 border-t flex-shrink-0 space-y-1"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {/* User card */}
        {(!collapsed || isMobile) && user && (
          <div
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-1"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={roleBadgeStyle}
            >
              {user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--brand-sand)' }}>
                {user.displayName}
              </p>
              <p className="text-xs capitalize" style={{ color: user.role === 'developer' ? '#C4B5FD' : 'var(--brand-brass-light)', fontSize: '0.65rem', fontWeight: 600 }}>
                {user.role}
              </p>
            </div>
          </div>
        )}

        {/* Collapsed avatar */}
        {collapsed && !isMobile && user && (
          <div className="flex justify-center mb-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={roleBadgeStyle}
              title={`${user.displayName} (${user.role})`}
            >
              {user.initials}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className="sidebar-nav-item w-full"
          title={collapsed && !isMobile ? 'Sign out' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {(!collapsed || isMobile) && <span className="text-xs">Sign Out</span>}
        </button>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-nav-item w-full justify-center"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{
          width: collapsed ? '64px' : '240px',
          background: 'var(--brand-navy)',
          transition: 'width 250ms cubic-bezier(0.4,0,0.2,1)',
        }}
        className="hidden md:flex fixed left-0 top-0 h-screen flex-col z-30 shadow-2xl"
      >
        {navContent(false)}
      </aside>

      {/* Mobile sidebar */}
      <>
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
            mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onMobileClose}
          aria-hidden="true"
        />
        <aside
          style={{
            background: 'var(--brand-navy)',
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1)',
            width: '280px',
          }}
          className="fixed left-0 top-0 h-screen flex flex-col z-50 shadow-2xl md:hidden"
        >
          {navContent(true)}
        </aside>
      </>
    </>
  );
}
