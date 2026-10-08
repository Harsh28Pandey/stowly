import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AlertCircle, Layers, Loader2, X } from 'lucide-react';
import { errMsg } from '../api';

export const formatBytes = (n = 0) => {
  if (n < 1024) return `${n} B`;
  const u = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return `${n.toFixed(n >= 100 ? 0 : 1)} ${u[i]}`;
};

export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-');
export const formatDateTime = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-');

export function timeAgo(d) {
  if (!d) return 'never';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return formatDate(d);
}

/** Loads data with loading + error state. */
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const load = useCallback(async (silent = false) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await fnRef.current();
      setState({ data, loading: false, error: '' });
    } catch (e) {
      setState({ data: null, loading: false, error: errMsg(e) });
    }
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, deps);
  return { ...state, reload: load };
}

export function useDebounce(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export const Logo = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-500 text-white border border-brand-400/30">
      <Layers size={18} />
    </span>
    <span className="font-heading text-lg font-bold tracking-tight text-[#FAFAFA]">
      Stowly
    </span>
  </span>
);

export const Spinner = ({ className = '' }) => <Loader2 className={`animate-spin ${className}`} size={16} aria-label="Loading" />;

export const PageLoader = () => (
  <div className="grid min-h-[30vh] place-items-center text-brand-400" role="status">
    <div className="flex flex-col items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#16161A] text-brand-400">
        <Layers size={20} />
      </div>
      <p className="font-mono text-xs text-[#9A9AA3]">Loading data...</p>
    </div>
  </div>
);

export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded-xl bg-[#16161A] ${className}`} />;

export const ErrorBox = ({ message, onRetry }) => (
  <div className="card rounded-2xl flex flex-col items-center gap-2.5 p-5 text-center bg-[#0F0F12]" role="alert">
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#F43F5E]/10 text-[#F43F5E]">
      <AlertCircle size={18} />
    </div>
    <p className="text-xs font-medium text-[#FAFAFA] max-w-md">{message}</p>
    {onRetry && <button className="btn btn-outline btn-sm rounded-2xl cursor-pointer" onClick={() => onRetry()}>Try again</button>}
  </div>
);

export const Empty = ({ icon: Icon, title, text, action }) => (
  <div className="flex flex-col items-center px-4 py-8 text-center">
    {Icon && (
      <div className="mb-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#16161A] text-brand-400">
          <Icon size={20} />
        </span>
      </div>
    )}
    <h3 className="font-heading text-sm font-bold text-[#FAFAFA]">{title}</h3>
    {text && <p className="mt-1 max-w-sm text-xs text-[#9A9AA3] font-sans leading-relaxed">{text}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <h1 className="truncate font-heading text-xl sm:text-[22px] font-bold tracking-tight text-[#FAFAFA]">{title}</h1>
      {subtitle && <p className="mt-0.5 text-xs text-[#9A9AA3]">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

/** Plain TabBar - NOT a card. Renders a plain row with subtle active pill or border. */
export const TabBar = ({ tabs }) => (
  <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 border-b border-[#26262B]/60 pb-2">
    <nav className="inline-flex items-center gap-1.5 min-w-full sm:min-w-0" aria-label="Section tabs">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition-colors duration-150 cursor-pointer ${
              isActive
                ? 'bg-[#16161A] text-[#FAFAFA] font-semibold'
                : 'text-[#9A9AA3] hover:bg-[#16161A]/60 hover:text-[#FAFAFA]'
            }`
          }
        >
          {Icon && <Icon size={14} />}
          {label}
        </NavLink>
      ))}
    </nav>
  </div>
);

/** Single Surface Modal - No cards inside content. */
export function Modal({ open, onClose, title, children, wide }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    if (modalRef.current) {
      const focusables = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusables.length) focusables[0].focus();
    }

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div
        ref={modalRef}
        className={`relative flex max-h-[90vh] w-full flex-col rounded-t-3xl sm:rounded-3xl bg-[#0F0F12] text-[#FAFAFA] border border-[#26262B] ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#26262B]/60 px-5 py-3.5">
          <h2 className="truncate font-heading text-sm font-bold text-[#FAFAFA]">{title}</h2>
          <button onClick={onClose} className="rounded-xl p-1 text-[#9A9AA3] hover:bg-[#16161A] hover:text-[#FAFAFA] transition cursor-pointer" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try { await onConfirm(); onClose(); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-xs text-[#9A9AA3] leading-relaxed">{message}</p>
      <div className="mt-4 flex justify-end gap-2 border-t border-[#26262B]/60 pt-3">
        <button className="btn btn-outline rounded-2xl cursor-pointer" onClick={onClose} disabled={busy}>Cancel</button>
        <button className={danger ? 'btn btn-danger rounded-2xl cursor-pointer' : 'btn btn-primary rounded-2xl cursor-pointer'} onClick={go} disabled={busy}>
          {busy && <Spinner />} {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/** StatStrip - ONE card containing a horizontal stat strip divided by thin lines */
export const StatStrip = ({ stats }) => (
  <div className="stat-strip">
    {stats.map((s, idx) => {
      const Icon = s.icon;
      return (
        <div key={idx} className="stat-item">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#9A9AA3]">{s.label}</p>
            {Icon && <Icon size={14} className="text-brand-400" />}
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-mono text-[20px] font-bold tracking-tight text-[#FAFAFA] leading-none">{s.value}</p>
            {s.hint && <p className="font-mono text-[10px] text-[#9A9AA3] truncate">{s.hint}</p>}
          </div>
        </div>
      );
    })}
  </div>
);

/** Plain text chip / badge - NO inner border */
export const Badge = ({ children, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-[#16161A] text-[#9A9AA3]',
    green: 'bg-[#22C55E]/15 text-[#22C55E]',
    amber: 'bg-amber-500/15 text-amber-400',
    red: 'bg-[#F43F5E]/15 text-[#F43F5E]',
    brand: 'bg-brand-500/15 text-brand-300',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
};

export const Field = ({ label, hint, children }) => (
  <div>
    {label && <label className="block text-xs font-medium text-[#9A9AA3] mb-1.5">{label}</label>}
    {children}
    {hint && <p className="mt-1 text-[11px] text-[#9A9AA3]">{hint}</p>}
  </div>
);
