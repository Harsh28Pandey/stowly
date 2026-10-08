import { useEffect, useState, useCallback } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  User, ShieldCheck, Laptop, Bell, Palette, Lock, Eye, EyeOff,
  Smartphone, Check, AlertTriangle, KeyRound, Save, RotateCcw,
  LayoutGrid, List, Sliders, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';
import { useVault } from '../vault';
import { useStorage } from '../storage';
import { useNotifications } from '../notifications';
import {
  Confirm, Empty, ErrorBox, Field, PageHeader, Spinner, formatBytes,
  formatDate, formatDateTime, timeAgo, Skeleton
} from '../components/ui';

const sections = [
  { id: 'profile', to: '/app/settings/profile', label: 'Profile', desc: 'Your name, bio, and account status', icon: User },
  { id: 'shield', to: '/app/settings/shield', label: 'Shield', desc: 'Password, Keyring vault & auto-lock', icon: ShieldCheck },
  { id: 'devices', to: '/app/settings/devices', label: 'Devices', desc: 'Active sessions & security sign-out', icon: Laptop },
  { id: 'alerts', to: '/app/settings/alerts', label: 'Alerts', desc: 'Notification preferences & recent alerts', icon: Bell },
  { id: 'personalize', to: '/app/settings/personalize', label: 'Personalize', desc: 'File browser layout & density preferences', icon: Palette },
];

export default function Settings() {
  return (
    <div className="space-y-4 max-w-5xl mx-auto font-sans">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, security, devices, notifications and workspace preferences."
      />

      {/* Rebuilt Single-Surface rounded-3xl Container */}
      <div className="rounded-3xl border border-[#26262B] bg-[#0F0F12] flex flex-col lg:flex-row overflow-hidden shadow-2xl min-h-[520px]">
        {/* Mobile Horizontally Scrollable Segmented Tab Row */}
        <div className="flex overflow-x-auto gap-2 p-3 border-b border-[#26262B]/60 lg:hidden no-scrollbar bg-[#0F0F12]">
          {sections.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#16161A] text-[#FAFAFA] border border-[#26262B]'
                    : 'text-[#9A9AA3] hover:text-[#FAFAFA]'
                }`
              }
            >
              <Icon size={15} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Desktop Left Vertical Split Menu */}
        <nav aria-label="Settings navigation" className="hidden lg:block w-64 border-r border-[#26262B]/60 p-3.5 space-y-1.5 shrink-0 bg-[#0F0F12]">
          {sections.map(({ to, label, desc, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-start gap-3 p-3 rounded-2xl text-xs transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#16161A] text-[#FAFAFA] border border-[#26262B] font-semibold'
                    : 'text-[#9A9AA3] hover:bg-[#16161A] hover:text-[#FAFAFA]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl transition-colors ${isActive ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30' : 'bg-[#16161A] text-[#9A9AA3] group-hover:text-[#FAFAFA]'}`}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold text-xs ${isActive ? 'text-[#FAFAFA]' : 'text-[#9A9AA3] group-hover:text-[#FAFAFA]'}`}>{label}</p>
                    <p className="text-[10px] text-[#9A9AA3] line-clamp-1 mt-0.5">{desc}</p>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Active Section Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-w-0 bg-[#0F0F12]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

/** 1. Profile Section */
export function Profile() {
  const { user, setUser } = useAuth();
  const { summary: storage } = useStorage();
  const [f, setF] = useState({ name: user?.name || '', bio: user?.bio || '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setF({ name: user.name, bio: user.bio || '' });
    }
  }, [user]);

  const dirty = f.name !== user?.name || f.bio !== (user?.bio || '');

  const discard = () => {
    setF({ name: user?.name || '', bio: user?.bio || '' });
  };

  const save = async (e) => {
    if (e) e.preventDefault();
    if (!f.name.trim() || f.name.length < 2) {
      toast.error('Please enter a valid name (at least 2 characters).');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.patch('/account/profile', f);
      setUser(data.user);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-base font-bold text-[#FAFAFA]">Profile Settings</h2>
        <p className="text-xs text-[#9A9AA3]">Manage your public workspace identity and details.</p>
      </div>

      {/* Avatar & Account Info Header Row */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#16161A]/50 border border-[#26262B]/60">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-2xl font-bold text-brand-400 border border-brand-500/30">
          {user?.name?.[0]?.toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-bold text-[#FAFAFA]">{user?.name}</h3>
            <span className="chip bg-emerald-500/15 text-emerald-400 font-mono text-[9px] uppercase font-bold">
              {user?.role === 'ADMIN' ? 'Administrator' : user?.status}
            </span>
          </div>
          <p className="text-xs text-[#9A9AA3] mt-0.5">Member since {formatDate(user?.createdAt)}</p>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={save} className="space-y-4">
        <Field label="Full name">
          <input
            className="input"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            required
            maxLength={80}
          />
        </Field>

        <Field label="Email address" hint="Your email is read-only and used for account sign-in.">
          <div className="relative">
            <input
              className="input pr-9 text-[#9A9AA3] cursor-not-allowed bg-[#16161A]"
              value={user?.email || ''}
              disabled
            />
            <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9AA3]" />
          </div>
        </Field>

        <Field label="Bio">
          <div className="space-y-1">
            <textarea
              className="input min-h-[90px] resize-none"
              maxLength={300}
              value={f.bio}
              onChange={(e) => setF({ ...f, bio: e.target.value })}
              placeholder="Tell us a little about your role or workspace..."
            />
            <div className="flex justify-end font-mono text-[10px] text-[#9A9AA3]">
              {f.bio.length} / 300 characters
            </div>
          </div>
        </Field>

        {/* Save Bar (Appears ONLY when there are unsaved changes) */}
        {dirty && (
          <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <span className="text-xs text-brand-300 font-medium flex items-center gap-1.5">
              <Sparkles size={14} /> You have unsaved profile changes
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={discard}
                className="btn btn-outline btn-sm rounded-2xl text-xs cursor-pointer"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary btn-sm rounded-2xl text-xs cursor-pointer flex items-center gap-1"
              >
                {busy ? <Spinner size={12} /> : <Save size={12} />} Save changes
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Read-Only Storage Capacity Summary */}
      <div className="pt-4 border-t border-[#26262B]/60 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[#FAFAFA]">
          <span>Storage Capacity</span>
          <span className="font-mono text-[#9A9AA3]">
            {formatBytes(storage?.used)} of {formatBytes(storage?.quota)} ({storage?.percent}%)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#16161A]">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${storage?.percent || 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/** 2. Shield Section */
export function Shield() {
  const { status: vaultStatus, unlocked: vaultUnlocked, lock: lockVault, setAutoLock } = useVault();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Password requirements calculation
  const p = f.newPassword;
  const checks = {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
  const passedCount = Object.values(checks).filter(Boolean).length;
  const strengthLabel = passedCount === 0 ? '' : passedCount <= 2 ? 'Weak' : passedCount === 3 ? 'Good' : 'Strong';
  const strengthColor = passedCount <= 2 ? 'bg-[#F43F5E]' : passedCount === 3 ? 'bg-amber-400' : 'bg-[#22C55E]';

  const submitPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (f.newPassword !== f.confirm) return setError('The new passwords do not match.');
    if (passedCount < 2) return setError('Password does not meet minimum strength requirements.');

    setBusy(true);
    try {
      const { data } = await api.post('/account/password', {
        currentPassword: f.currentPassword,
        newPassword: f.newPassword,
      });
      toast.success(data.message);
      setF({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-base font-bold text-[#FAFAFA]">Shield & Security</h2>
        <p className="text-xs text-[#9A9AA3]">Manage your login credentials, password strength, and Keyring vault settings.</p>
      </div>

      {/* Change Password Form */}
      <form onSubmit={submitPassword} className="space-y-4" noValidate>
        <h3 className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider font-mono">Change Password</h3>

        {error && (
          <div role="alert" className="rounded-2xl bg-[#F43F5E]/10 p-3 text-xs text-[#F43F5E] border border-[#F43F5E]/30 flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Field label="Current password">
          <input
            className="input"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={f.currentPassword}
            onChange={(e) => setF({ ...f, currentPassword: e.target.value })}
            required
          />
        </Field>

        <Field label="New password">
          <input
            className="input"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={f.newPassword}
            onChange={(e) => setF({ ...f, newPassword: e.target.value })}
            required
          />
        </Field>

        {/* Live Strength Meter & Requirements Checklist */}
        {f.newPassword && (
          <div className="space-y-2 p-3 rounded-2xl bg-[#16161A]/50 border border-[#26262B]/60 text-xs">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-[#9A9AA3]">Password Strength</span>
              <span className={`font-bold ${passedCount <= 2 ? 'text-[#F43F5E]' : passedCount === 3 ? 'text-amber-400' : 'text-[#22C55E]'}`}>
                {strengthLabel}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#0F0F12] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strengthColor}`}
                style={{ width: `${(passedCount / 4) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
              <span className={`flex items-center gap-1.5 ${checks.length ? 'text-[#22C55E]' : 'text-[#9A9AA3]'}`}>
                <Check size={12} /> At least 8 characters
              </span>
              <span className={`flex items-center gap-1.5 ${checks.upper ? 'text-[#22C55E]' : 'text-[#9A9AA3]'}`}>
                <Check size={12} /> Uppercase letter
              </span>
              <span className={`flex items-center gap-1.5 ${checks.number ? 'text-[#22C55E]' : 'text-[#9A9AA3]'}`}>
                <Check size={12} /> Number (0-9)
              </span>
              <span className={`flex items-center gap-1.5 ${checks.special ? 'text-[#22C55E]' : 'text-[#9A9AA3]'}`}>
                <Check size={12} /> Special character
              </span>
            </div>
          </div>
        )}

        <Field label="Confirm new password">
          <input
            className="input"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={f.confirm}
            onChange={(e) => setF({ ...f, confirm: e.target.value })}
            required
          />
        </Field>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-[#9A9AA3] hover:text-[#FAFAFA] cursor-pointer"
            onClick={() => setShow((s) => !s)}
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />} {show ? 'Hide' : 'Show'} passwords
          </button>
          <button className="btn btn-primary rounded-2xl text-xs cursor-pointer" disabled={busy}>
            {busy && <Spinner size={12} />} Update password
          </button>
        </div>

        <p className="text-[11px] text-[#9A9AA3] bg-[#16161A]/40 p-2.5 rounded-xl border border-[#26262B]/40">
          Note: Updating your password revokes all active sessions on other devices for security.
        </p>
      </form>

      {/* Keyring Vault Controls */}
      <div className="pt-4 border-t border-[#26262B]/60 space-y-3">
        <h3 className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider font-mono flex items-center gap-2">
          <KeyRound size={14} className="text-brand-400" /> Keyring Vault
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#16161A]/50 border border-[#26262B]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#FAFAFA]">Vault Status</span>
              <span className={`chip text-[9px] font-bold uppercase ${vaultUnlocked ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#26262B] text-[#9A9AA3]'}`}>
                {vaultUnlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
            <p className="text-[11px] text-[#9A9AA3] mt-0.5">Zero-knowledge AES-256 encrypted passwords.</p>
          </div>

          {vaultUnlocked && (
            <button
              onClick={() => { lockVault(); toast.success('Keyring Vault locked.'); }}
              className="btn btn-outline btn-sm rounded-2xl text-xs text-amber-400 hover:bg-amber-400/10 cursor-pointer"
            >
              Lock now
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#16161A]/50 border border-[#26262B]/60">
          <div>
            <p className="text-xs font-bold text-[#FAFAFA]">Inactivity Auto-Lock</p>
            <p className="text-[11px] text-[#9A9AA3]">Automatically locks vault after idle time.</p>
          </div>
          <select
            value={vaultStatus?.autoLockMinutes ?? 10}
            onChange={(e) => setAutoLock(Number(e.target.value))}
            className="input py-1.5 px-3 text-xs w-28 bg-[#0F0F12] cursor-pointer"
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={0}>Never</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/** 3. Devices Section */
export function Devices() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmAll, setConfirmAll] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/account/sessions');
      setSessions(data.sessions || []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const revoke = async (id) => {
    try {
      await api.delete(`/account/sessions/${id}`);
      toast.success('Device signed out.');
      fetchSessions();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const revokeOthers = async () => {
    try {
      await api.post('/account/sessions/revoke-others');
      toast.success('All other devices signed out.');
      fetchSessions();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">Active Devices</h2>
          <p className="text-xs text-[#9A9AA3]">Sessions currently signed into your Stowly account.</p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={() => setConfirmAll(true)}
            className="btn btn-outline btn-sm rounded-2xl text-xs text-rose-400 hover:bg-rose-500/10 cursor-pointer shrink-0"
          >
            Sign out all others
          </button>
        )}
      </div>

      {error ? (
        <ErrorBox message={error} onRetry={fetchSessions} />
      ) : loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-[#26262B]/60 rounded-2xl bg-[#16161A]/40 border border-[#26262B]/60 overflow-hidden">
          {sessions.map((s) => {
            const Icon = /iPhone|iPad|Android/i.test(s.device) ? Smartphone : Laptop;
            return (
              <li key={s.id} className="flex items-center gap-3.5 p-3.5 hover:bg-[#16161A]/60 transition-colors">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#16161A] text-[#FAFAFA] border border-[#26262B]">
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold text-[#FAFAFA]">
                      {s.device} &middot; {s.browser}
                    </p>
                    {s.current && (
                      <span className="chip text-[9px] bg-emerald-500/15 text-emerald-400 font-bold">
                        This device
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#9A9AA3] mt-0.5">
                    Active {timeAgo(s.lastActive)} &middot; Created {formatDateTime(s.createdAt)}
                  </p>
                </div>
                {!s.current && (
                  <button
                    onClick={() => revoke(s.id)}
                    className="btn btn-outline btn-sm rounded-2xl text-xs text-rose-400 hover:bg-rose-500/10 cursor-pointer shrink-0"
                  >
                    Sign out
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Confirm
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        danger
        title="Sign out all other devices?"
        message="Every active session except this device will be revoked immediately."
        confirmLabel="Sign out others"
        onConfirm={revokeOthers}
      />
    </div>
  );
}

/** 4. Alerts Section */
export function Alerts() {
  const { user, setUser } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAllRead,
    markRead,
  } = useNotifications();

  const [limit, setLimit] = useState(25);

  const togglePref = async (key, value) => {
    const prevUser = { ...user };
    setUser({ ...user, prefs: { ...user?.prefs, [key]: value } });
    try {
      const { data } = await api.patch('/account/prefs', { [key]: value });
      setUser(data.user);
      toast.success('Notification preferences updated.');
    } catch (e) {
      setUser(prevUser);
      toast.error(errMsg(e));
    }
  };

  const prefsList = [
    ['notifyDrops', 'Drop Box deliveries', 'Get notified when guest files arrive in your Drop Boxes.'],
    ['notifyAccount', 'Account updates', 'Get notified about approval and administrative changes.'],
    ['notifyStorage', 'Storage warnings', 'Get notified when disk usage reaches capacity limits.'],
  ];

  // Grouping
  const now = new Date();
  const todayStr = now.toDateString();
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const yestStr = yest.toDateString();

  const grouped = { Today: [], Yesterday: [], Earlier: [] };
  notifications.slice(0, limit).forEach((n) => {
    const dStr = new Date(n.createdAt).toDateString();
    if (dStr === todayStr) grouped.Today.push(n);
    else if (dStr === yestStr) grouped.Yesterday.push(n);
    else grouped.Earlier.push(n);
  });

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-base font-bold text-[#FAFAFA]">Alerts & Notifications</h2>
        <p className="text-xs text-[#9A9AA3]">Control notification preferences and view your recent activity feed.</p>
      </div>

      {/* Notification Preferences */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider font-mono">Preferences</h3>
        <div className="divide-y divide-[#26262B]/60 rounded-2xl bg-[#16161A]/40 border border-[#26262B]/60 px-4">
          {prefsList.map(([key, label, desc]) => {
            const isChecked = Boolean(user?.prefs?.[key]);
            return (
              <div key={key} className="flex items-center justify-between gap-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#FAFAFA]">{label}</p>
                  <p className="text-[11px] text-[#9A9AA3]">{desc}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={isChecked}
                  aria-label={label}
                  onClick={() => togglePref(key, !isChecked)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer flex items-center p-0.5 ${
                    isChecked ? 'bg-brand-500' : 'bg-[#26262B]'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                      isChecked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Alerts Feed */}
      <div className="space-y-3 pt-2 border-t border-[#26262B]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider font-mono">Recent Activity</h3>
            {unreadCount > 0 && (
              <span className="chip bg-brand-500/15 text-brand-400 font-mono text-[10px]">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-brand-400 hover:underline cursor-pointer"
            >
              Mark all as read
            </button>
          )}
        </div>

        {error ? (
          <ErrorBox message={error} onRetry={() => fetchNotifications()} />
        ) : loading ? (
          <div className="space-y-2 py-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Empty icon={Bell} title="You're all caught up" text="New system alerts and delivery notifications will appear here." />
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([groupKey, items]) => {
              if (!items.length) return null;
              return (
                <div key={groupKey} className="space-y-1.5">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#9A9AA3] px-1">
                    {groupKey}
                  </p>
                  <div className="divide-y divide-[#26262B]/60 rounded-2xl bg-[#16161A]/40 border border-[#26262B]/60 overflow-hidden">
                    {items.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`flex items-start gap-3 p-3.5 transition-colors cursor-pointer ${
                          !n.read ? 'bg-[#16161A]' : 'hover:bg-[#16161A]/60'
                        }`}
                      >
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full flex items-center justify-center">
                          {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-[#FAFAFA] leading-relaxed">{n.message}</p>
                          <span className="font-mono text-[10px] text-[#9A9AA3] block mt-1">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {notifications.length > limit && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setLimit((l) => l + 25)}
                  className="btn btn-outline btn-sm rounded-2xl text-xs cursor-pointer"
                >
                  Load more alerts
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 5. Personalize Section */
export function Personalize() {
  const { user, setUser } = useAuth();
  const [compact, setCompact] = useState(() => {
    return localStorage.getItem('stowly_density_compact') === 'true';
  });

  const pickView = async (view) => {
    const prev = { ...user };
    setUser({ ...user, prefs: { ...user?.prefs, view } });
    try {
      const { data } = await api.patch('/account/prefs', { view });
      setUser(data.user);
      toast.success(`Default layout set to ${view === 'grid' ? 'Grid' : 'List'}.`);
    } catch (e) {
      setUser(prev);
      toast.error(errMsg(e));
    }
  };

  const toggleCompact = (enabled) => {
    setCompact(enabled);
    localStorage.setItem('stowly_density_compact', String(enabled));
    if (enabled) {
      document.documentElement.classList.add('density-compact');
    } else {
      document.documentElement.classList.remove('density-compact');
    }
    toast.success(`Density updated to ${enabled ? 'Compact' : 'Comfortable'}.`);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-base font-bold text-[#FAFAFA]">Personalization</h2>
        <p className="text-xs text-[#9A9AA3]">Customize how files and workspace views are rendered.</p>
      </div>

      {/* Default File Layout Segmented Control with Tiny Previews */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider font-mono">Default File Layout</h3>
        <p className="text-xs text-[#9A9AA3]">Choose the default view when opening My Stash or file collections.</p>

        <div className="grid grid-cols-2 gap-3">
          {[
            ['grid', 'Grid View', 'Card tiles with preview icons', LayoutGrid],
            ['list', 'List View', 'Compact tabular rows', List],
          ].map(([key, title, desc, Icon]) => {
            const selected = (user?.prefs?.view || 'grid') === key;
            return (
              <button
                key={key}
                onClick={() => pickView(key)}
                aria-pressed={selected}
                className={`p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between h-32 ${
                  selected
                    ? 'bg-[#16161A] text-[#FAFAFA] border-brand-500 shadow-md ring-1 ring-brand-500/50'
                    : 'bg-[#16161A]/40 text-[#9A9AA3] border-[#26262B]/60 hover:border-[#3F3F46] hover:text-[#FAFAFA]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon size={20} className={selected ? 'text-brand-400' : 'text-[#9A9AA3]'} />
                  {selected && <Check size={16} className="text-brand-400 font-bold" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#FAFAFA]">{title}</p>
                  <p className="text-[10px] text-[#9A9AA3] mt-0.5">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Density Setting Toggle */}
      <div className="pt-4 border-t border-[#26262B]/60 space-y-3">
        <h3 className="text-xs font-bold text-[#FAFAFA] uppercase tracking-wider font-mono">Density & Display</h3>

        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#16161A]/40 border border-[#26262B]/60">
          <div>
            <p className="text-xs font-semibold text-[#FAFAFA]">Compact Density</p>
            <p className="text-[11px] text-[#9A9AA3]">Reduces padding and height across lists for high data density.</p>
          </div>
          <button
            role="switch"
            aria-checked={compact}
            aria-label="Compact Density"
            onClick={() => toggleCompact(!compact)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer flex items-center p-0.5 ${
              compact ? 'bg-brand-500' : 'bg-[#26262B]'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
                compact ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
