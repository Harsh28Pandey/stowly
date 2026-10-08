import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Cog, FolderTree, KeyRound, Lock, LockKeyhole, PlusCircle, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useVault } from '../../vault';
import { PageHeader, PageLoader, Spinner, TabBar, Field } from '../../components/ui';

const tabs = [
  { to: '/app/keyring/all', label: 'All Keys', icon: KeyRound },
  { to: '/app/keyring/favorites', label: 'Top Keys', icon: Star },
  { to: '/app/keyring/groups', label: 'Key Groups', icon: FolderTree },
  { to: '/app/keyring/new', label: 'New Key', icon: PlusCircle },
  { to: '/app/keyring/forge', label: 'Key Forge', icon: Sparkles },
  { to: '/app/keyring/settings', label: 'Keyring Settings', icon: Cog },
];

function Gate() {
  const { status, unlock, setup } = useVault();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const creating = !status.initialized;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (creating) {
      if (pw.length < 10) return setError('Your master password must be at least 10 characters long.');
      if (pw !== pw2) return setError('The two master passwords do not match.');
    }
    setBusy(true);
    try {
      if (creating) { await setup(pw); toast.success('Your Keyring is ready.'); } else await unlock(pw);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md my-6">
      <form onSubmit={submit} className="card p-6 sm:p-8 border-[#26262B] shadow-2xl" noValidate>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#18181C] text-brand-400 border border-[#26262B]"><LockKeyhole size={28} /></span>
        <h2 className="mt-4 text-xl font-black text-[#FAFAFA]">{creating ? 'Create your Keyring Vault' : 'Unlock your Keyring Vault'}</h2>
        <p className="mt-1.5 text-xs font-medium text-[#9A9AA3] leading-relaxed">
          {creating
            ? 'Choose a master password. It encrypts everything in your browser, and we can never see it or recover it for you.'
            : 'Enter your master password to decrypt your saved passwords. This is separate from your sign-in password.'}
        </p>
        {error && <div role="alert" className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-300">{error}</div>}
        <div className="mt-5 space-y-4">
          <Field label="Master password"><input type="password" className="input" autoFocus autoComplete={creating ? 'new-password' : 'off'} value={pw} onChange={(e) => setPw(e.target.value)} required placeholder="Enter master password" /></Field>
          {creating && <Field label="Confirm master password"><input type="password" className="input" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required placeholder="Repeat master password" /></Field>}
        </div>
        {creating && <p className="mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs font-semibold text-amber-300 leading-relaxed">If you forget this master password, your saved keys cannot be recovered. Store it somewhere safe.</p>}
        <button className="btn-primary mt-6 w-full py-3 text-sm cursor-pointer font-bold" disabled={busy}>{busy ? <Spinner /> : <Lock size={16} />} {creating ? 'Create Vault' : 'Unlock Vault'}</button>
      </form>
    </div>
  );
}

export default function Keyring() {
  const { status, statusLoading, unlocked, lock } = useVault();
  const { pathname } = useLocation();
  const isForge = pathname.endsWith('/forge');

  return (
    <>
      <PageHeader
        title="Keyring"
        subtitle="Your passwords, encrypted in your browser. Only you hold the key."
        actions={unlocked && <button className="btn-outline cursor-pointer font-semibold" onClick={() => { lock(); toast.success('Keyring locked.'); }}><Lock size={15} /> Lock now</button>}
      />
      <TabBar tabs={tabs} />
      {statusLoading || !status ? <PageLoader /> : unlocked || isForge ? <Outlet /> : <Gate />}
      {unlocked && (
        <p className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#9A9AA3]"><ShieldCheck size={14} className="text-emerald-400" /> End-to-end encrypted with AES-256-GCM. Decrypted data exists only in this tab's memory.</p>
      )}
    </>
  );
}

