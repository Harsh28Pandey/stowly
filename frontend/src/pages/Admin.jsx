import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Check, Clock, Files, HardDrive, PackageOpen, RotateCcw, Search, UserCheck, UserX, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import api, { errMsg } from '../api';
import { Badge, Confirm, Empty, ErrorBox, Field, Modal, PageHeader, Skeleton, Spinner, StatStrip, formatBytes, formatDate, formatDateTime, timeAgo, useDebounce, useFetch } from '../components/ui';

const tone = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'red', SUSPENDED: 'red' };
const actionText = {
  USER_REGISTERED: 'registered a new account', USER_APPROVED: 'approved an account', USER_REJECTED: 'rejected an account',
  USER_SUSPENDED: 'suspended an account', USER_REACTIVATED: 'reactivated an account', LOGIN_FAILED: 'had a failed sign-in attempt',
  LOGIN_SUCCESS: 'signed in', LOGIN_BLOCKED: 'was blocked from signing in', PASSWORD_CHANGED: 'changed their password',
  VAULT_CREATED: 'created a Keyring', VAULT_UNLOCKED: 'unlocked their Keyring', VAULT_LOCKED: 'locked their Keyring',
  VAULT_ENTRY_CREATED: 'saved a Keyring entry', VAULT_ENTRY_UPDATED: 'updated a Keyring entry', VAULT_ENTRY_DELETED: 'deleted a Keyring entry',
};

export function AdminHome() {
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/dashboard').then((r) => r.data));

  const stats = data ? [
    { icon: Users, label: 'Total members', value: data.stats.total },
    { icon: Clock, label: 'Pending', value: data.stats.pending },
    { icon: UserCheck, label: 'Approved', value: data.stats.approved },
    { icon: UserX, label: 'Rejected / Suspended', value: `${data.stats.rejected} / ${data.stats.suspended}` },
  ] : [];

  const extraStats = data ? [
    { icon: Files, label: 'Total files', value: data.stats.files },
    { icon: HardDrive, label: 'Storage used', value: formatBytes(data.stats.storageUsed) },
    { icon: PackageOpen, label: 'Open Drop Boxes', value: data.stats.activeDropBoxes },
    { icon: Users, label: 'System status', value: '100% Active' },
  ] : [];

  return (
    <div className="space-y-4">
      <PageHeader title="Overview" subtitle="A live view of your platform. Member data stays private: vaults are encrypted and unreadable to administrators." />
      {error ? <ErrorBox message={error} onRetry={reload} /> : loading ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : (
        <>
          {data.stats.pending > 0 && (
            <Link to="/admin/pending" className="card rounded-2xl flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-amber-300 hover:bg-amber-500/15 cursor-pointer">
              <span className="flex items-center gap-2.5 text-xs font-semibold"><Clock size={16} /> {data.stats.pending} account request(s) waiting for review.</span>
              <span className="text-xs font-bold underline">Review now</span>
            </Link>
          )}

          {/* Single StatStrip Card (NO separate cards) */}
          <StatStrip stats={stats} />
          <StatStrip stats={extraStats} />

          {/* Audit Events - ONE Card with divide-y rows */}
          <div className="card rounded-2xl bg-[#0F0F12] border border-[#26262B] overflow-hidden">
            <div className="border-b border-[#26262B]/60 px-4 py-3">
              <h2 className="text-xs font-bold text-[#FAFAFA]">Recent security & account events</h2>
            </div>
            {data.recent.length === 0 ? <p className="px-4 py-6 text-center text-xs text-[#9A9AA3]">No events logged yet.</p> : (
              <ul className="divide-y divide-[#26262B]/60">
                {data.recent.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs hover:bg-[#16161A]/50 transition-colors">
                    <span className="min-w-0 truncate text-[#FAFAFA]/90">
                      <strong className="text-[#FAFAFA]">{a.user?.name || a.email || 'Unknown visitor'}</strong> {actionText[a.action] || a.action.toLowerCase().replace(/_/g, ' ')}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-[#9A9AA3]">{timeAgo(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const REASONS = ['Not eligible', 'Duplicate account', 'Invalid information', 'Other'];

export function AdminUsers({ pendingOnly }) {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebounce(search);
  const effective = pendingOnly ? 'PENDING' : status;
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/users', { params: { status: effective || undefined, q: q || undefined } }).then((r) => r.data.users), [effective, q]);
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [quotaGB, setQuotaGB] = useState(500);

  const act = async (path, body, msg) => {
    try { await api.patch(`/admin/users/${action.user.id}/${path}`, body); toast.success(msg); reload(true); } catch (e) { toast.error(errMsg(e)); throw e; }
  };
  const u = action?.user;

  return (
    <div className="space-y-4">
      <PageHeader title={pendingOnly ? 'Pending Requests' : 'All Members'} subtitle={pendingOnly ? 'New accounts cannot sign in until you approve them and assign a storage quota.' : 'Manage member accounts and customize individual storage quotas.'} />
      
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9AA3]" />
          <input className="input text-xs pl-8" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search members" />
        </div>
        {!pendingOnly && (
          <select className="input text-xs sm:w-44 cursor-pointer font-semibold" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="SUSPENDED">Suspended</option>
          </select>
        )}
      </div>

      {error ? <ErrorBox message={error} onRetry={reload} /> : loading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : data.length === 0 ? (
        <Empty icon={pendingOnly ? Check : Users} title={pendingOnly ? 'No pending requests' : 'No members found'} text={pendingOnly ? 'You are all caught up. New requests will appear here.' : 'Try changing your search or filter.'} />
      ) : (
        /* Member List - ONE Card with divide-y rows (NO row borders or inner boxes) */
        <div className="card rounded-2xl divide-y divide-[#26262B]/60 overflow-hidden bg-[#0F0F12]">
          {data.map((m) => {
            const currentGB = Math.round((m.quotaBytes || 536870912000) / (1024 * 1024 * 1024));
            return (
              <div key={m.id} className="flex flex-col gap-3 px-4 py-3.5 lg:flex-row lg:items-center hover:bg-[#16161A]/50 transition-colors">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-xs font-bold text-brand-400">{m.name[0].toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-bold text-[#FAFAFA]">
                      <span className="truncate">{m.name}</span>
                      <Badge tone={tone[m.status]}>{m.status.charAt(0) + m.status.slice(1).toLowerCase()}</Badge>
                      {m.role === 'ADMIN' && <Badge tone="brand">Admin</Badge>}
                    </p>
                    <p className="truncate font-mono text-[10px] text-[#9A9AA3]">{m.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-mono text-[#9A9AA3] lg:w-80">
                  <span>Joined: <strong className="text-[#FAFAFA]">{formatDate(m.createdAt)}</strong></span>
                  <span>Quota: <strong className="text-brand-400">{formatBytes(m.storageUsed)} / {currentGB} GB</strong></span>
                </div>

                <div className="flex flex-wrap gap-2 lg:w-56 lg:justify-end">
                  {m.role !== 'ADMIN' && (
                    <>
                      {['PENDING', 'REJECTED'].includes(m.status) && (
                        <button className="btn btn-primary btn-sm rounded-2xl cursor-pointer" onClick={() => { setQuotaGB(currentGB || 500); setAction({ type: 'approve', user: m }); }}>
                          <Check size={13} /> Approve
                        </button>
                      )}
                      {m.status === 'APPROVED' && (
                        <button className="btn btn-outline btn-sm rounded-2xl cursor-pointer text-brand-400" onClick={() => { setQuotaGB(currentGB || 500); setAction({ type: 'quota', user: m }); }}>
                          <HardDrive size={13} /> {currentGB} GB
                        </button>
                      )}
                      {m.status === 'PENDING' && <button className="btn btn-outline btn-sm rounded-2xl text-[#F43F5E] hover:bg-[#F43F5E]/10 cursor-pointer" onClick={() => { setReason(REASONS[0]); setAction({ type: 'reject', user: m }); }}><X size={13} /> Reject</button>}
                      {m.status === 'APPROVED' && <button className="btn btn-outline btn-sm rounded-2xl text-[#F43F5E] hover:bg-[#F43F5E]/10 cursor-pointer" onClick={() => setAction({ type: 'suspend', user: m })}><Ban size={13} /> Suspend</button>}
                      {m.status === 'SUSPENDED' && <button className="btn btn-outline btn-sm rounded-2xl cursor-pointer" onClick={() => setAction({ type: 'reactivate', user: m })}><RotateCcw size={13} /> Reactivate</button>}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approve Modal */}
      <Modal open={action?.type === 'approve'} onClose={() => setAction(null)} title={`Approve Access for ${u?.name}`}>
        <div className="space-y-3">
          <p className="text-xs text-[#9A9AA3] leading-relaxed">
            {u?.name} ({u?.email}) will be approved and granted storage access. Set the initial storage limit:
          </p>
          <Field label="Storage Limit (GB)">
            <div className="flex gap-2">
              <input type="number" min="1" max="10000" className="input" value={quotaGB} onChange={(e) => setQuotaGB(e.target.value)} required />
              <span className="inline-flex items-center px-3 rounded-2xl bg-[#16161A] text-xs font-bold text-[#FAFAFA]">GB</span>
            </div>
            <p className="mt-1.5 text-[11px] text-[#9A9AA3]">Presets: <button type="button" className="text-brand-400 font-bold hover:underline" onClick={() => setQuotaGB(500)}>500 GB</button> &middot; <button type="button" className="text-brand-400 font-bold hover:underline" onClick={() => setQuotaGB(300)}>300 GB</button> &middot; <button type="button" className="text-brand-400 font-bold hover:underline" onClick={() => setQuotaGB(100)}>100 GB</button></p>
          </Field>
          <div className="flex justify-end gap-2 border-t border-[#26262B]/60 pt-3">
            <button className="btn btn-outline rounded-2xl cursor-pointer" onClick={() => setAction(null)}>Cancel</button>
            <button className="btn btn-primary rounded-2xl cursor-pointer" onClick={() => act('approve', { quotaGB }, 'User approved.')}>Approve User</button>
          </div>
        </div>
      </Modal>

      {/* Edit Quota Modal */}
      <Modal open={action?.type === 'quota'} onClose={() => setAction(null)} title={`Set Limit for ${u?.name}`}>
        <div className="space-y-3">
          <p className="text-xs text-[#9A9AA3]">Update storage limit for {u?.name} ({u?.email}):</p>
          <Field label="Storage Limit (GB)">
            <div className="flex gap-2">
              <input type="number" min="1" max="10000" className="input" value={quotaGB} onChange={(e) => setQuotaGB(e.target.value)} required />
              <span className="inline-flex items-center px-3 rounded-2xl bg-[#16161A] text-xs font-bold text-[#FAFAFA]">GB</span>
            </div>
          </Field>
          <div className="flex justify-end gap-2 border-t border-[#26262B]/60 pt-3">
            <button className="btn btn-outline rounded-2xl cursor-pointer" onClick={() => setAction(null)}>Cancel</button>
            <button className="btn btn-primary rounded-2xl cursor-pointer" onClick={() => act('quota', { quotaGB }, 'Quota saved.')}>Save Limit</button>
          </div>
        </div>
      </Modal>

      <Confirm open={action?.type === 'suspend'} onClose={() => setAction(null)} danger title="Suspend this user?" message={`${u?.name} will be signed out and blocked from logging in.`} confirmLabel="Suspend" onConfirm={() => act('suspend', {}, 'User suspended.')} />
      <Confirm open={action?.type === 'reactivate'} onClose={() => setAction(null)} title="Reactivate this user?" message={`${u?.name} will be able to sign in again.`} confirmLabel="Reactivate" onConfirm={() => act('reactivate', {}, 'User reactivated.')} />
      <Modal open={action?.type === 'reject'} onClose={() => setAction(null)} title="Reject this request?">
        <p className="text-xs text-[#9A9AA3]">{u?.name} ({u?.email}) will not be granted access.</p>
        <label className="block text-xs font-medium text-[#9A9AA3] mt-3 mb-1" htmlFor="reason">Reason</label>
        <select id="reason" className="input cursor-pointer font-semibold" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
        <div className="mt-4 flex justify-end gap-2 border-t border-[#26262B]/60 pt-3">
          <button className="btn btn-outline rounded-2xl cursor-pointer" onClick={() => setAction(null)}>Cancel</button>
          <RejectButton onGo={async () => { await act('reject', { reason }, 'Request rejected.'); setAction(null); }} />
        </div>
      </Modal>
    </div>
  );
}

function RejectButton({ onGo }) {
  const [busy, setBusy] = useState(false);
  return <button className="btn btn-danger rounded-2xl cursor-pointer" disabled={busy} onClick={async () => { setBusy(true); try { await onGo(); } catch { /* toast */ } finally { setBusy(false); } }}>{busy && <Spinner />} Reject request</button>;
}
