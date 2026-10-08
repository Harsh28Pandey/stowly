import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, Eye, EyeOff, MailCheck, XCircle, Ban, Lock, ShieldCheck } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';
import { Logo, Spinner, Field } from '../components/ui';

const Frame = ({ title, subtitle, children }) => (
  <div className="grid min-h-screen place-items-center bg-[#09090B] text-[#FAFAFA] px-4 py-8">
    <div className="w-full max-w-sm">
      <div className="mb-4 flex flex-col items-center gap-1.5 text-center">
        <Link to="/" aria-label="Stowly home" className="group">
          <Logo />
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16161A] px-2.5 py-0.5 font-mono text-[10px] text-[#9A9AA3]">
          <ShieldCheck size={13} className="text-brand-400" /> Private Cloud Workspace
        </span>
      </div>
      <div className="card rounded-2xl p-5 sm:p-6 bg-[#0F0F12] border border-[#26262B]">
        <h1 className="font-heading text-lg sm:text-xl font-bold text-[#FAFAFA]">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-[#9A9AA3] leading-relaxed">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  </div>
);

const PasswordInput = ({ value, onChange, id, autoComplete, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9AA3]">
        <Lock size={14} />
      </div>
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="input pl-9 pr-10 font-mono text-xs"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-1 text-[#9A9AA3] hover:bg-[#16161A] hover:text-[#FAFAFA] transition cursor-pointer"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
};

const statusInfo = {
  PENDING: {
    icon: Clock,
    tone: 'bg-amber-500/10 text-amber-400',
    title: 'Account pending review',
    desc: 'Your request is awaiting administrator approval.',
  },
  REJECTED: {
    icon: XCircle,
    tone: 'bg-rose-500/10 text-rose-400',
    title: 'Request declined',
    desc: 'Your access request was declined by an administrator.',
  },
  SUSPENDED: {
    icon: Ban,
    tone: 'bg-rose-500/10 text-rose-400',
    title: 'Account suspended',
    desc: 'Your account has been suspended by an administrator.',
  },
};

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const u = await login(form.email, form.password);
      const target = redirect || (u.role === 'ADMIN' ? '/admin' : '/app');
      nav(target, { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setStatus(err?.response?.data?.status || '');
    } finally {
      setBusy(false);
    }
  };

  const info = statusInfo[status];

  return (
    <Frame title="Sign in" subtitle="Enter your email and password to access your Stowly space.">
      <form onSubmit={submit} className="space-y-3" noValidate>
        {redirect && (
          <div className="rounded-xl bg-brand-500/10 px-3 py-2 text-xs text-brand-300">
            Please sign in to continue to your requested page.
          </div>
        )}
        {error && (
          <div role="alert" className={`flex items-start gap-2.5 rounded-xl p-3 text-xs font-sans ${info ? info.tone : 'bg-rose-500/10 text-rose-400'}`}>
            {info ? (
              <>
                <info.icon size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">{info.title}</p>
                  <p className="mt-0.5 text-[11px] opacity-90">{info.desc}</p>
                </div>
              </>
            ) : (
              <span>{error}</span>
            )}
          </div>
        )}
        <Field label="Email Address">
          <input className="input font-mono text-xs" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
        </Field>
        <Field label="Password">
          <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" placeholder="Your password" />
        </Field>
        <button className="btn btn-primary rounded-2xl w-full py-2 cursor-pointer font-bold mt-1" disabled={busy}>
          {busy && <Spinner />} Sign in
        </button>
      </form>
      <p className="mt-4 text-center font-mono text-[11px] text-[#9A9AA3]">
        New to Stowly? <Link to="/register" className="font-bold text-brand-400 hover:underline cursor-pointer">Request access</Link>
      </p>
    </Frame>
  );
}

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/auth/register', { name: form.name, email: form.email, password: form.password });
      setDone(true);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <Frame title="Access Request Received">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <MailCheck size={20} />
          </span>
          <p className="mt-3 text-xs text-[#9A9AA3] leading-relaxed">
            Your request has been registered and is pending administrator review. You will be able to sign in once an administrator approves your account.
          </p>
          <Link to="/login" className="btn btn-primary rounded-2xl mt-5 w-full cursor-pointer py-2 font-bold text-xs">
            Return to Sign in
          </Link>
        </div>
      </Frame>
    );

  return (
    <Frame title="Request Stowly Access" subtitle="Every account is reviewed by an administrator before activation.">
      <form onSubmit={submit} className="space-y-3" noValidate>
        {error && <div role="alert" className="rounded-xl bg-rose-500/10 p-2.5 text-xs text-rose-400">{error}</div>}
        <Field label="Full Name">
          <input className="input text-xs" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" required />
        </Field>
        <Field label="Email Address">
          <input className="input font-mono text-xs" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
        </Field>
        <Field label="Password" hint="At least 8 characters with a letter and a number.">
          <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" placeholder="Create password" />
        </Field>
        <button className="btn btn-primary rounded-2xl w-full py-2 cursor-pointer font-bold mt-1" disabled={busy}>
          {busy && <Spinner />} Submit Request
        </button>
      </form>
      <p className="mt-4 text-center font-mono text-[11px] text-[#9A9AA3]">
        Already approved? <Link to="/login" className="font-bold text-brand-400 hover:underline cursor-pointer">Sign in</Link>
      </p>
    </Frame>
  );
}
