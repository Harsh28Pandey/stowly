import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Copy, Eye, EyeOff, Globe, KeyRound, Pencil, Plus, RefreshCw, Search, Star, Trash2, Lock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useVault, CATEGORIES } from '../../vault';
import { generatePassword, strength } from '../../crypto';
import { Badge, Confirm, Empty, Field, PageLoader, Spinner } from '../../components/ui';

const CLIP_CLEAR_MS = 30000;
async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied. The clipboard will be cleared in 30 seconds.`);
    setTimeout(() => navigator.clipboard.writeText('').catch(() => {}), CLIP_CLEAR_MS);
  } catch {
    toast.error('Could not access the clipboard.');
  }
}

const hostOf = (url) => { try { return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, ''); } catch { return ''; } };

function KeyCard({ entry, reused, onDelete }) {
  const { toggleFavorite } = useVault();
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!show) return undefined;
    const t = setTimeout(() => setShow(false), 15000); // re-mask automatically
    return () => clearTimeout(t);
  }, [show]);
  const weak = !entry.corrupt && strength(entry.password).score <= 1;
  const host = hostOf(entry.url);

  return (
    <article className="card rounded-2xl p-3 flex flex-col justify-between hover:bg-[#16161A] transition-colors">
      <div>
        {/* Header line */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-brand-500/15 border border-brand-500/20 text-brand-400">
              {host ? <Globe size={14} /> : <KeyRound size={14} />}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-xs font-bold text-[#FAFAFA]" title={entry.name}>{entry.name}</h3>
              <p className="truncate font-mono text-[10px] text-[#9A9AA3]">{host || entry.username || 'Secret'}</p>
            </div>
          </div>
          <button
            onClick={() => toggleFavorite(entry).catch((e) => toast.error(e.message))}
            className="rounded-xl p-1 text-[#9A9AA3] hover:bg-[#16161A] transition cursor-pointer"
            aria-label={entry.favorite ? 'Remove from Top Keys' : 'Add to Top Keys'}
            aria-pressed={entry.favorite}
          >
            <Star size={15} className={entry.favorite ? 'fill-amber-400 text-amber-400' : 'text-[#9A9AA3]'} />
          </button>
        </div>

        {/* Compact Password Bar */}
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-[#0F0F12] border border-[#26262B] px-2.5 py-1.5 font-mono text-xs">
          <span className="truncate text-[#FAFAFA] font-mono text-[11px]">{show ? entry.password : '••••••••••••'}</span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShow((s) => !s)}
              className="rounded-lg p-1 text-[#9A9AA3] hover:bg-[#16161A] hover:text-[#FAFAFA] cursor-pointer"
              aria-label={show ? 'Hide password' : 'Reveal password'}
            >
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              onClick={() => copyText(entry.password, 'Password')}
              className="rounded-lg p-1 text-[#9A9AA3] hover:bg-[#16161A] hover:text-[#FAFAFA] cursor-pointer"
              aria-label="Copy password"
            >
              <Copy size={13} />
            </button>
          </div>
        </div>

        {(weak || reused) && (
          <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
            {weak && <span className="inline-flex items-center gap-1 text-rose-400"><ShieldAlert size={11} /> Weak key</span>}
            {reused && <span className="inline-flex items-center gap-1 text-amber-400"><ShieldAlert size={11} /> Reused</span>}
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="mt-3 flex items-center justify-between border-t border-[#26262B] pt-2">
        <Badge tone="brand">{entry.category}</Badge>
        <div className="flex items-center gap-1">
          <button
            className="rounded-xl p-1.5 text-[#9A9AA3] hover:bg-[#16161A] hover:text-[#FAFAFA] transition cursor-pointer"
            onClick={() => nav(`/app/keyring/edit/${entry.id}`)}
            title="Edit key"
          >
            <Pencil size={13} />
          </button>
          <button
            className="rounded-xl p-1.5 text-[#9A9AA3] hover:bg-[#F43F5E]/15 hover:text-[#F43F5E] transition cursor-pointer"
            onClick={() => onDelete(entry)}
            title="Delete key"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}

function KeyList({ favoritesOnly }) {
  const { entries, removeEntry } = useVault();
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || 'All';
  const [q, setQ] = useState('');
  const [removing, setRemoving] = useState(null);

  const reusedSet = useMemo(() => {
    const counts = {};
    entries.forEach((e) => { if (e.password) counts[e.password] = (counts[e.password] || 0) + 1; });
    return new Set(Object.keys(counts).filter((p) => counts[p] > 1));
  }, [entries]);

  const list = entries.filter((e) => {
    if (favoritesOnly && !e.favorite) return false;
    if (cat !== 'All' && e.category !== cat) return false;
    const s = q.trim().toLowerCase();
    return !s || [e.name, e.url, e.username, e.category].some((v) => (v || '').toLowerCase().includes(s));
  });

  return (
    <>
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9AA3]" />
          <input className="input rounded-2xl pl-9 text-xs" placeholder="Search keys by name..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search keys" />
        </div>
        <Link to="/app/keyring/new" className="btn btn-primary rounded-2xl sm:ml-auto cursor-pointer text-xs font-semibold"><Plus size={14} /> Add password</Link>
      </div>
      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1.5">
          {['All', ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => (c === 'All' ? setParams({}) : setParams({ cat: c }))} className={`shrink-0 rounded-full border px-3 py-1 text-xs font-mono font-semibold cursor-pointer ${cat === c ? 'border-brand-500 bg-brand-500 text-white' : 'border-[#26262B] bg-[#0F0F12] text-[#9A9AA3] hover:bg-[#16161A] hover:text-[#FAFAFA]'}`}>{c}</button>
          ))}
        </div>
      </div>
      {entries.length === 0 ? (
        <Empty icon={KeyRound} title="Your Keyring is empty" text="Securely save your first login credential." action={<Link to="/app/keyring/new" className="btn btn-primary rounded-2xl cursor-pointer"><Plus size={14} /> Add password</Link>} />
      ) : list.length === 0 ? (
        <Empty icon={favoritesOnly ? Star : Search} title={favoritesOnly && !q && cat === 'All' ? 'No Top Keys yet' : 'No keys found'} text={favoritesOnly && !q && cat === 'All' ? 'Tap the star on any key to keep it here for quick access.' : 'Try a different search or category.'} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => <KeyCard key={e.id} entry={e} reused={reusedSet.has(e.password)} onDelete={setRemoving} />)}
        </div>
      )}
      <Confirm open={Boolean(removing)} onClose={() => setRemoving(null)} danger title="Delete this password?" message={`"${removing?.name}" will be permanently removed from your Keyring.`} confirmLabel="Delete" onConfirm={async () => { try { await removeEntry(removing.id); toast.success('Password deleted.'); } catch { toast.error('Could not delete this password.'); throw new Error('x'); } }} />
    </>
  );
}

export const AllKeys = () => <KeyList />;
export const TopKeys = () => <KeyList favoritesOnly />;

export function KeyGroups() {
  const { entries } = useVault();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {CATEGORIES.map((c) => {
        const n = entries.filter((e) => e.category === c).length;
        return (
          <Link key={c} to={`/app/keyring/all?cat=${encodeURIComponent(c)}`} className="card rounded-2xl p-4 transition-colors hover:bg-[#16161A] border border-[#26262B] cursor-pointer">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#16161A] border border-[#26262B] text-brand-400"><KeyRound size={16} /></span>
            <h3 className="mt-2.5 text-xs font-bold text-[#FAFAFA]">{c}</h3>
            <p className="font-mono text-[10px] text-[#9A9AA3]">{n} {n === 1 ? 'key' : 'keys'}</p>
          </Link>
        );
      })}
    </div>
  );
}

export function Generator({ onUse }) {
  const [opts, setOpts] = useState({ length: 20, upper: true, lower: true, numbers: true, symbols: true });
  const [pw, setPw] = useState(() => generatePassword({ length: 20 }));
  const [copied, setCopied] = useState(false);
  const regen = (o = opts) => setPw(generatePassword(o));
  const set = (patch) => {
    const next = { ...opts, ...patch };
    if (!next.upper && !next.lower && !next.numbers && !next.symbols) return;
    setOpts(next);
    regen(next);
  };
  const handleCopy = async () => {
    await copyText(pw, 'Password');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const s = strength(pw);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-[#26262B] bg-[#0F0F12] px-3 py-2.5">
        <code className="min-w-0 flex-1 break-all font-mono text-xs text-[#FAFAFA]" aria-live="polite">{pw}</code>
        <button type="button" onClick={() => regen()} className="rounded-xl p-1.5 text-[#9A9AA3] hover:bg-[#16161A] cursor-pointer" aria-label="Generate again">
          <RefreshCw size={15} />
        </button>
        <button type="button" onClick={handleCopy} className="rounded-xl p-1.5 text-[#9A9AA3] hover:bg-[#16161A] cursor-pointer" aria-label="Copy password">
          {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0F0F12] border border-[#26262B]">
          <div className={`h-full ${s.color}`} style={{ width: `${(s.score / 5) * 100}%` }} />
        </div>
        <span className={`text-[10px] font-mono font-semibold ${s.text}`}>{s.label}</span>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#9A9AA3] mb-1 flex justify-between" htmlFor="gen-len"><span>Length</span><span className="font-mono text-xs font-semibold text-[#FAFAFA]">{opts.length}</span></label>
        <input id="gen-len" type="range" min="8" max="64" value={opts.length} onChange={(e) => set({ length: Number(e.target.value) })} className="w-full accent-brand-500 cursor-pointer" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[['upper', 'Uppercase'], ['lower', 'Lowercase'], ['numbers', 'Numbers'], ['symbols', 'Symbols']].map(([k, l]) => (
          <label key={k} className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#26262B] bg-[#0F0F12] px-3 py-2 text-xs text-[#FAFAFA]">
            <input type="checkbox" className="h-4 w-4 accent-brand-500 cursor-pointer" checked={opts[k]} onChange={(e) => set({ [k]: e.target.checked })} /> {l}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-outline rounded-2xl text-xs cursor-pointer" onClick={() => regen()}><RefreshCw size={14} /> Generate password</button>
        {onUse && <button type="button" className="btn btn-primary rounded-2xl text-xs cursor-pointer" onClick={() => onUse(pw)}>Use this password</button>}
      </div>
    </div>
  );
}

export function KeyForge() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="card rounded-2xl p-5 bg-[#0F0F12] border border-[#26262B]">
        <h2 className="text-sm font-bold text-[#FAFAFA]">Key Forge</h2>
        <p className="mb-4 mt-0.5 text-xs text-[#9A9AA3]">Forge strong, random passwords using your browser's cryptographically secure random number generator.</p>
        <Generator />
      </div>
    </div>
  );
}

export function KeyEditor() {
  const { id } = useParams();
  const { entries, saveEntry } = useVault();
  const nav = useNavigate();
  const existing = id ? entries.find((e) => e.id === id) : null;
  const [f, setF] = useState({ name: '', url: '', username: '', password: '', notes: '', category: 'Login', favorite: false });
  const [showPw, setShowPw] = useState(false);
  const [showGen, setShowGen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (existing) setF({ name: existing.name, url: existing.url || '', username: existing.username || '', password: existing.password || '', notes: existing.notes || '', category: existing.category, favorite: existing.favorite }); }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (id && !existing) return <Empty icon={KeyRound} title="Key not found" text="This key may have been deleted." action={<Link to="/app/keyring/all" className="btn btn-primary rounded-2xl cursor-pointer">Back to All Keys</Link>} />;
  const s = strength(f.password);
  const reused = entries.some((e) => e.id !== id && e.password && e.password === f.password);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.name.trim()) return setError('Please give this key a name.');
    if (!f.password) return setError('Please enter a password.');
    setBusy(true);
    try {
      await saveEntry({ ...f, name: f.name.trim() }, id);
      toast.success(id ? 'Password updated.' : 'Password saved.');
      nav('/app/keyring/all');
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl" noValidate>
      <div className="card rounded-2xl space-y-3.5 p-5 bg-[#0F0F12] border border-[#26262B]">
        <h2 className="text-sm font-bold text-[#FAFAFA]">{id ? 'Edit Key' : 'Add New Key'}</h2>
        {error && <div role="alert" className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">{error}</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name"><input className="input rounded-2xl text-xs" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="GitHub" required /></Field>
          <Field label="Category"><select className="input rounded-2xl text-xs cursor-pointer font-semibold" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
        <Field label="Website URL"><input className="input rounded-2xl text-xs" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://github.com" /></Field>
        <Field label="Username or email"><input className="input rounded-2xl text-xs" autoComplete="off" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></Field>
        <div>
          <label className="block text-xs font-medium text-[#9A9AA3] mb-1.5" htmlFor="kp">Password</label>
          <div className="relative">
            <input id="kp" className="input rounded-2xl pr-10 font-mono text-xs" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
            <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-[#9A9AA3] hover:bg-[#16161A] cursor-pointer" aria-label={showPw ? 'Hide password' : 'Show password'}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
          </div>
          {f.password && (
            <div className="mt-2">
              <div className="flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#0F0F12] border border-[#26262B]"><div className={`h-full ${s.color}`} style={{ width: `${(s.score / 5) * 100}%` }} /></div><span className={`text-[10px] font-mono font-semibold ${s.text}`}>{s.label}</span></div>
              {s.score <= 1 && <p className="mt-1 text-[11px] text-rose-400">Consider using a stronger password.</p>}
              {reused && <p className="mt-1 text-[11px] text-amber-400">Potentially reused password.</p>}
            </div>
          )}
          <button type="button" className="mt-2 text-xs font-medium text-brand-400 hover:underline cursor-pointer" onClick={() => setShowGen((v) => !v)}>{showGen ? 'Hide generator' : 'Generate strong password'}</button>
          {showGen && <div className="mt-3 rounded-2xl border border-[#26262B] bg-[#16161A] p-4"><Generator onUse={(p) => { setF({ ...f, password: p }); setShowGen(false); setShowPw(true); }} /></div>}
        </div>
        <Field label="Notes"><textarea className="input rounded-2xl text-xs min-h-[70px] resize-none" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Optional encrypted notes..." /></Field>
        <label className="flex items-center gap-2 text-xs text-[#FAFAFA] cursor-pointer"><input type="checkbox" className="h-4 w-4 accent-brand-500 cursor-pointer" checked={f.favorite} onChange={(e) => setF({ ...f, favorite: e.target.checked })} /> Add to Top Keys</label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn btn-outline rounded-2xl text-xs cursor-pointer" onClick={() => nav('/app/keyring/all')}>Cancel</button>
          <button className="btn btn-primary rounded-2xl text-xs cursor-pointer" disabled={busy}>{busy && <Spinner />} Save password</button>
        </div>
      </div>
    </form>
  );
}

export function KeyringSettings() {
  const { status, setAutoLock, lock, entries } = useVault();
  const [busy, setBusy] = useState(false);
  if (!status) return <PageLoader />;
  const change = async (v) => {
    setBusy(true);
    try { await setAutoLock(Number(v)); toast.success('Auto-lock updated.'); } catch { toast.error('Could not update setting.'); } finally { setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="card rounded-2xl p-5 bg-[#0F0F12] border border-[#26262B]">
        <h2 className="text-sm font-bold text-[#FAFAFA]">Auto-lock</h2>
        <p className="mb-3 mt-0.5 text-xs text-[#9A9AA3]">Lock the Keyring automatically after a period of inactivity.</p>
        <select className="input rounded-2xl text-xs max-w-xs cursor-pointer font-semibold" value={status.autoLockMinutes} disabled={busy} onChange={(e) => change(e.target.value)} aria-label="Auto-lock timeout">
          <option value={5}>After 5 minutes</option><option value={10}>After 10 minutes (recommended)</option><option value={30}>After 30 minutes</option><option value={0}>Never</option>
        </select>
      </div>
      <div className="card rounded-2xl p-5 bg-[#0F0F12] border border-[#26262B]">
        <h2 className="text-sm font-bold text-[#FAFAFA]">Keyring Status</h2>
        <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
          <div className="rounded-xl bg-[#16161A] border border-[#26262B] p-2.5"><dt className="text-[#9A9AA3]">State</dt><dd className="mt-0.5 flex items-center gap-1.5 font-bold text-emerald-400"><Lock size={13} /> Unlocked</dd></div>
          <div className="rounded-xl bg-[#16161A] border border-[#26262B] p-2.5"><dt className="text-[#9A9AA3]">Saved keys</dt><dd className="mt-0.5 font-bold text-[#FAFAFA]">{entries.length}</dd></div>
          <div className="rounded-xl bg-[#16161A] border border-[#26262B] p-2.5"><dt className="text-[#9A9AA3]">Encryption</dt><dd className="mt-0.5 font-bold text-[#FAFAFA]">AES-256-GCM</dd></div>
          <div className="rounded-xl bg-[#16161A] border border-[#26262B] p-2.5"><dt className="text-[#9A9AA3]">Key derivation</dt><dd className="mt-0.5 font-mono text-[10px] text-[#FAFAFA]">PBKDF2 600,000 rounds</dd></div>
        </dl>
        <button className="btn btn-outline rounded-2xl text-xs mt-4 cursor-pointer" onClick={() => { lock(); toast.success('Keyring locked.'); }}><Lock size={14} /> Lock now</button>
      </div>
    </div>
  );
}
