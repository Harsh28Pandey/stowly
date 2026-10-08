import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LogOut, Menu, X, Shield, Sparkles, HardDrive, Bell, AlertTriangle,
  PackageOpen, UserCheck, Check, ExternalLink, RefreshCw
} from 'lucide-react';
import { useAuth } from '../auth';
import { useVault } from '../vault';
import { useStorage } from '../storage';
import { useNotifications } from '../notifications';
import { COPY } from '../content/copy';
import { Logo, formatBytes, timeAgo, Confirm, Spinner, Skeleton } from './ui';

function SideNav({ sections, footerLink, onNavigate }) {
  const { user, logout } = useAuth();
  const { unlocked: vaultUnlocked, lock: lockVault } = useVault();
  const { summary: storage } = useStorage();
  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    error: notifError,
    fetchNotifications,
    markAllRead,
    markRead,
  } = useNotifications();

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifLimit, setNotifLimit] = useState(20);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const notifRef = useRef(null);
  const notifButtonRef = useRef(null);

  const quotaText = formatBytes(storage?.quota || 536870912000);
  const usedText = formatBytes(storage?.used || 0);
  const usedPercent = storage?.percent ?? 0;
  const isHigh = usedPercent >= 80;
  const isFull = usedPercent >= 95;
  const isAdmin = user?.role === 'ADMIN';

  // Toggle notifications popover & calculate React Portal screen coordinates
  const toggleNotifications = (e) => {
    e.stopPropagation();
    if (!notifOpen && notifButtonRef.current) {
      const rect = notifButtonRef.current.getBoundingClientRect();
      // Position popover to the right of the button or viewport-adjusted
      const left = Math.min(rect.right + 12, window.innerWidth - 390);
      const top = Math.max(16, Math.min(rect.top - 80, window.innerHeight - 520));
      setPopoverPos({ top, left });
    }
    setNotifOpen((prev) => !prev);
  };

  // Perform complete logout and wipe in-memory + local storage state
  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      lockVault(false);
      localStorage.removeItem('stowly_vault_keys');
      localStorage.removeItem('stowly_prefs');
      await logout();
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }, [lockVault, logout, navigate]);

  const requestLogout = () => {
    if (vaultUnlocked) {
      setLogoutConfirm(true);
    } else {
      handleLogout();
    }
  };

  // Close notifications popover on click outside or Escape key
  useEffect(() => {
    if (!notifOpen) return undefined;

    const handleClickOutside = (e) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target) &&
        notifButtonRef.current &&
        !notifButtonRef.current.contains(e.target)
      ) {
        setNotifOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        notifButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notifOpen]);

  // Group notifications into Today, Yesterday, Earlier
  const now = new Date();
  const todayStr = now.toDateString();
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const yestStr = yest.toDateString();

  const grouped = { Today: [], Yesterday: [], Earlier: [] };
  notifications.slice(0, notifLimit).forEach((n) => {
    const dStr = new Date(n.createdAt).toDateString();
    if (dStr === todayStr) grouped.Today.push(n);
    else if (dStr === yestStr) grouped.Yesterday.push(n);
    else grouped.Earlier.push(n);
  });

  const getNotifIcon = (type) => {
    if (type === 'drop') return <PackageOpen size={14} className="text-purple-400 shrink-0" />;
    if (type === 'account') return <UserCheck size={14} className="text-emerald-400 shrink-0" />;
    if (type === 'storage') return <HardDrive size={14} className="text-amber-400 shrink-0" />;
    return <Bell size={14} className="text-brand-400 shrink-0" />;
  };

  const handleNotifClick = (n) => {
    if (!n.read) markRead(n.id);
    setNotifOpen(false);

    if (n.type === 'drop') navigate('/app/dropboxes');
    else if (n.type === 'storage') navigate('/app/bin');
    else if (n.type === 'account') navigate('/app/settings/alerts');
    else navigate('/app/settings/alerts');

    if (onNavigate) onNavigate();
  };

  return (
    <div className="flex h-full flex-col bg-[#0F0F12] text-[#FAFAFA] rounded-3xl border border-[#26262B] overflow-hidden relative select-none">
      {/* Brand Header */}
      <div className="flex h-12 shrink-0 items-center justify-between px-3.5 border-b border-[#26262B] bg-[#0F0F12]">
        <Link to="/" aria-label="Stowly home" className="group">
          <Logo />
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[#22C55E]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" /> Live
        </span>
      </div>

      {/* Main Nav Items (Deliberately budgeted 36px height, fits screen with NO scroll) */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-2 py-2 min-h-0 scrollbar-none" aria-label="Sidebar navigation">
        {sections.map((s, i) => (
          <div key={i}>
            {s.heading && (
              <div className="mb-1 px-2 [@media(max-height:700px)]:hidden">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9AA3]">
                  {s.heading}
                </p>
              </div>
            )}
            <ul className="space-y-0.5">
              {s.items.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group flex h-[36px] [@media(max-height:800px)]:h-[34px] items-center gap-2.5 rounded-2xl px-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-[#16161A] text-[#FAFAFA] border border-[#26262B] font-semibold'
                          : 'text-[#9A9AA3] hover:bg-[#16161A] hover:text-[#FAFAFA]'
                      }`
                    }
                    aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`grid h-5 w-5 place-items-center transition-colors ${isActive ? 'text-brand-400' : 'text-[#9A9AA3] group-hover:text-[#FAFAFA]'}`}>
                          <Icon size={16} />
                        </span>
                        <span className="flex-1 truncate text-xs">{label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Notifications Sidebar Entry */}
        <div>
          <div className="mb-1 px-2 [@media(max-height:700px)]:hidden">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9AA3]">
              Updates
            </p>
          </div>
          <button
            ref={notifButtonRef}
            onClick={toggleNotifications}
            aria-expanded={notifOpen}
            aria-haspopup="dialog"
            aria-label="Notifications"
            className={`group flex h-[36px] [@media(max-height:800px)]:h-[34px] w-full items-center gap-2.5 rounded-2xl px-2.5 text-xs font-medium transition-colors duration-150 cursor-pointer text-left ${
              notifOpen
                ? 'bg-[#16161A] text-[#FAFAFA] border border-[#26262B] font-semibold'
                : 'text-[#9A9AA3] hover:bg-[#16161A] hover:text-[#FAFAFA]'
            }`}
          >
            <span className={`grid h-5 w-5 place-items-center transition-colors ${notifOpen ? 'text-brand-400' : 'text-[#9A9AA3] group-hover:text-[#FAFAFA]'}`}>
              <Bell size={16} />
            </span>
            <span className="flex-1 truncate text-xs">{COPY.nav.notifications}</span>
            {unreadCount > 0 && (
              <span className="grid h-4 min-w-[18px] place-items-center rounded-full bg-brand-500 px-1 font-mono text-[9px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {isAdmin && (
          <div className="pt-0.5">
            <Link
              to={pathname.startsWith('/admin') ? '/app' : '/admin'}
              onClick={onNavigate}
              className="flex h-[36px] items-center gap-2.5 rounded-2xl border border-[#26262B] bg-[#16161A] px-2.5 text-xs font-semibold text-brand-400 hover:bg-[#26262B] transition-colors cursor-pointer"
            >
              {pathname.startsWith('/admin') ? <Shield size={16} /> : <Sparkles size={16} />}
              <span className="truncate">{pathname.startsWith('/admin') ? 'User Workspace' : 'Admin Control Room'}</span>
            </Link>
          </div>
        )}

        {footerLink && (
          <div className="pt-0.5">
            <Link
              to={footerLink.to}
              onClick={onNavigate}
              className="flex h-[36px] items-center gap-2.5 rounded-2xl border border-dashed border-[#26262B] bg-[#16161A] px-2.5 text-xs font-semibold text-[#FAFAFA] hover:border-[#3F3F46] transition-colors cursor-pointer"
            >
              <footerLink.icon size={16} className="text-brand-400" />
              <span className="truncate">{footerLink.label}</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Storage Meter Block (Compact Budgeted Footer Block) */}
      <div className="shrink-0 border-t border-[#26262B] p-2 bg-[#0F0F12]">
        <div className="rounded-2xl bg-[#16161A] border border-[#26262B] p-2 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#FAFAFA]">
            <span className="flex items-center gap-1 text-brand-400 font-bold">
              <HardDrive size={13} /> Storage
            </span>
            <span className="font-mono text-[9px] text-[#9A9AA3]">
              {usedText} / {quotaText}
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0F0F12] border border-[#26262B]">
            <div
              className={`h-full transition-all duration-500 ${
                isFull ? 'bg-[#F43F5E]' : isHigh ? 'bg-amber-400' : 'bg-brand-500'
              }`}
              style={{ width: `${Math.min(100, usedPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-[#9A9AA3] [@media(max-height:700px)]:hidden">
            <span>{usedPercent.toFixed(1)}% used</span>
            {isHigh ? (
              <Link
                to="/app/bin"
                onClick={onNavigate}
                className="text-amber-400 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <AlertTriangle size={9} /> Free space
              </Link>
            ) : (
              <span>{formatBytes(storage?.free || 0)} free</span>
            )}
          </div>
        </div>

        {/* Account Block with Explicit Full-Width LOG OUT Button */}
        <div className="mt-1.5 rounded-2xl border border-[#26262B] bg-[#16161A] p-2 space-y-1.5">
          <div className="flex items-center gap-2 px-0.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-brand-500 text-xs font-bold text-white border border-brand-400/30">
              {user?.name?.[0]?.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#FAFAFA]">{user?.name}</p>
              <p className="truncate font-mono text-[9px] text-[#9A9AA3]">{user?.email}</p>
            </div>
          </div>

          {/* Log Out Button (Visible icon + text, never truncated) */}
          <button
            onClick={requestLogout}
            disabled={loggingOut}
            className="w-full flex h-8 items-center justify-center gap-1.5 rounded-xl bg-[#0F0F12] border border-[#26262B] text-xs font-semibold text-[#9A9AA3] hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Log out"
          >
            {loggingOut ? <Spinner size={13} /> : <LogOut size={14} />}
            <span>{loggingOut ? 'Signing out...' : COPY.nav.logOut}</span>
          </button>
        </div>
      </div>

      {/* Notifications Panel rendered in React Portal to document.body (Guarantees visible popover) */}
      {notifOpen &&
        createPortal(
          <div
            ref={notifRef}
            role="dialog"
            aria-label="Notifications panel"
            style={{ top: `${popoverPos.top}px`, left: `${popoverPos.left}px` }}
            className="fixed w-[360px] sm:w-[380px] max-h-[70vh] rounded-2xl border border-[#26262B] bg-[#0F0F12] shadow-2xl p-4 z-[9999] flex flex-col animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-[#26262B]/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#FAFAFA]">{COPY.notifications.title}</span>
                {unreadCount > 0 && (
                  <span className="chip bg-brand-500/15 text-brand-400 font-mono text-[10px]">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-brand-400 hover:underline cursor-pointer"
                  >
                    {COPY.notifications.markAllRead}
                  </button>
                )}
                <Link
                  to="/app/settings/alerts"
                  onClick={() => { setNotifOpen(false); if (onNavigate) onNavigate(); }}
                  className="text-[11px] font-medium text-[#9A9AA3] hover:text-[#FAFAFA] flex items-center gap-0.5 cursor-pointer"
                >
                  {COPY.notifications.seeAllInSettings} <ExternalLink size={10} />
                </Link>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
              {notifError ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-[#F43F5E] mb-2">{notifError}</p>
                  <button
                    onClick={() => fetchNotifications()}
                    className="btn btn-outline btn-sm rounded-2xl text-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> {COPY.notifications.retry}
                  </button>
                </div>
              ) : notifLoading ? (
                <div className="space-y-2 py-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell size={24} className="mx-auto text-[#9A9AA3]/40 mb-2" />
                  <p className="text-xs font-semibold text-[#FAFAFA]">{COPY.notifications.emptyTitle}</p>
                  <p className="text-[11px] text-[#9A9AA3] mt-0.5">{COPY.notifications.emptyText}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(grouped).map(([groupKey, items]) => {
                    if (!items.length) return null;
                    return (
                      <div key={groupKey} className="space-y-1">
                        <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#9A9AA3] px-1">
                          {groupKey}
                        </p>
                        <div className="divide-y divide-[#26262B]/60 rounded-xl bg-[#16161A]/40 border border-[#26262B]/60 overflow-hidden">
                          {items.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotifClick(n)}
                              className={`flex items-start gap-2.5 p-2.5 transition-colors cursor-pointer ${
                                !n.read ? 'bg-[#16161A]' : 'hover:bg-[#16161A]/60'
                              }`}
                            >
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full flex items-center justify-center">
                                {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                              </span>
                              {getNotifIcon(n.type)}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-[#FAFAFA] leading-tight line-clamp-2">{n.message}</p>
                                <span className="font-mono text-[9px] text-[#9A9AA3] block mt-1">
                                  {timeAgo(n.createdAt)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {notifications.length > notifLimit && (
                    <div className="pt-1 text-center">
                      <button
                        onClick={() => setNotifLimit((l) => l + 20)}
                        className="text-xs font-semibold text-brand-400 hover:underline cursor-pointer"
                      >
                        {COPY.notifications.loadMore}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Confirmation Modal for Logout with Unlocked Keyring */}
      <Confirm
        open={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        danger
        title={COPY.nav.logOutConfirmTitle}
        message={COPY.nav.logOutConfirmMsg}
        confirmLabel="Log out now"
        onConfirm={handleLogout}
      />
    </div>
  );
}

export default function Shell({ sections, mobileTabs, footerLink }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  const allNavItems = sections.flatMap((s) => s.items);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col lg:flex-row font-sans">
      {/* Desktop Floating Left Sidebar (Exact Viewport Height: h-dvh, no screen scrolling) */}
      <aside className="hidden w-[248px] xl:w-[280px] shrink-0 p-3 sm:p-4 lg:block">
        <div className="sticky top-4 h-[calc(100dvh-2rem)]">
          <SideNav sections={sections} footerLink={footerLink} />
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Slide-in Sidebar Panel */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80 transition-opacity" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-full max-w-[320px] max-w-[88vw] p-3 bg-[#09090B]">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 rounded-2xl p-1.5 text-[#9A9AA3] hover:bg-[#16161A] hover:text-[#FAFAFA] cursor-pointer z-20"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SideNav sections={sections} footerLink={footerLink} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Viewport Content (NO TOP NAVBAR AFTER LOGIN!) */}
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 pb-20 lg:pb-8">
          <div className="mx-auto w-full max-w-[1200px] px-3 py-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#26262B] bg-[#0F0F12] px-2 py-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] lg:hidden">
        <nav className="flex items-center justify-around" aria-label="Mobile quick links">
          {allNavItems.slice(0, 4).map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 text-[10px] font-mono uppercase tracking-wider transition-colors min-w-[56px] min-h-[44px] cursor-pointer ${
                  isActive ? 'text-brand-400 font-bold' : 'text-[#9A9AA3] hover:text-[#FAFAFA]'
                }`
              }
            >
              <Icon size={18} />
              <span className="truncate mt-0.5">{label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 text-[10px] font-mono uppercase tracking-wider text-[#9A9AA3] hover:text-[#FAFAFA] min-w-[56px] min-h-[44px] cursor-pointer"
          >
            <Menu size={18} />
            <span className="truncate mt-0.5">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
