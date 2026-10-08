import { useState } from 'react';
import { Check, Copy, ExternalLink, PackageOpen, Plus, Power, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api, { errMsg } from '../api';
import { Badge, Confirm, Empty, ErrorBox, Field, Modal, PageHeader, Skeleton, Spinner, formatDate, useFetch } from '../components/ui';

const linkFor = (token) => `${window.location.origin}/drop/${token}`;

function stateOf(z) {
  if (!z.active) return ['Paused', 'slate'];
  if (z.expiresAt && new Date(z.expiresAt) < new Date()) return ['Expired', 'red'];
  if (z.uploadCount >= z.maxFiles) return ['Full', 'amber'];
  return ['Open', 'green'];
}

export default function DropBoxes() {
  const { data, loading, error, reload } = useFetch(() => api.get('/drop-zones').then((r) => r.data.dropZones));
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [copied, setCopied] = useState('');

  const copy = async (z) => {
    try { await navigator.clipboard.writeText(linkFor(z.token)); setCopied(z.id); setTimeout(() => setCopied(''), 1800); toast.success('Link copied.'); } catch { toast.error('Could not copy link.'); }
  };
  const toggle = async (z) => {
    try { await api.patch(`/drop-zones/${z.id}`, { active: !z.active }); toast.success(z.active ? 'Drop Box paused.' : 'Drop Box reopened.'); reload(true); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Drop Boxes" subtitle="Private links that let collaborators send you files directly." actions={<button className="btn btn-primary rounded-2xl cursor-pointer" onClick={() => setCreating(true)}><Plus size={14} /> New Drop Box</button>} />
      {error ? <ErrorBox message={error} onRetry={reload} /> : loading ? (
        <div className="grid gap-3 md:grid-cols-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : data.length === 0 ? (
        <Empty icon={PackageOpen} title="No Drop Boxes created" text="Create a Drop Box link to collect files from external collaborators." action={<button className="btn btn-primary rounded-2xl cursor-pointer" onClick={() => setCreating(true)}><Plus size={14} /> Create first Drop Box</button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((z) => {
            const [label, tone] = stateOf(z);
            return (
              <div key={z.id} className="card rounded-2xl p-4 flex flex-col justify-between bg-[#0F0F12] border border-[#26262B]">
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-xs font-bold text-[#FAFAFA]" title={z.title}>{z.title}</h3>
                      <p className="font-mono text-[10px] text-[#9A9AA3]">Created {formatDate(z.createdAt)}</p>
                    </div>
                    <Badge tone={tone}>{label}</Badge>
                  </div>

                  {/* Monospace Link Row - Plain text with copy button (NO inner filled box) */}
                  <div className="mt-2.5 flex items-center justify-between gap-2 text-xs font-mono">
                    <span className="truncate text-brand-400 font-semibold">{linkFor(z.token)}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => copy(z)} className="rounded-xl p-1 text-[#9A9AA3] hover:text-[#FAFAFA] cursor-pointer" aria-label="Copy link">
                        {copied === z.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                      <a href={linkFor(z.token)} target="_blank" rel="noreferrer" className="rounded-xl p-1 text-[#9A9AA3] hover:text-[#FAFAFA] cursor-pointer" aria-label="Open link">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  {/* Stat Line - Divided plain text row (NO inner sub-boxes) */}
                  <div className="mt-3 border-t border-[#26262B]/60 pt-2.5 flex items-center justify-between font-mono text-[11px] text-[#9A9AA3]">
                    <span>Files: <strong className="text-[#FAFAFA]">{z.uploadCount}/{z.maxFiles}</strong></span>
                    <span>Max: <strong className="text-[#FAFAFA]">{z.maxSizeMB} MB</strong></span>
                    <span>Expires: <strong className="text-[#FAFAFA]">{z.expiresAt ? formatDate(z.expiresAt) : 'Never'}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 border-t border-[#26262B]/60 pt-2.5 flex items-center justify-between">
                  {z.allowedTypes.length > 0 ? (
                    <span className="font-mono text-[10px] text-[#9A9AA3] truncate">Types: {z.allowedTypes.join(', ')}</span>
                  ) : <span />}
                  <div className="flex items-center gap-2">
                    <button className="btn btn-outline btn-sm rounded-2xl cursor-pointer text-xs" onClick={() => toggle(z)}>
                      <Power size={13} /> {z.active ? 'Pause' : 'Reopen'}
                    </button>
                    <button className="btn btn-outline btn-sm rounded-2xl text-[#F43F5E] hover:bg-[#F43F5E]/10 cursor-pointer text-xs" onClick={() => setRemoving(z)}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <CreateDialog open={creating} onClose={() => setCreating(false)} onDone={() => reload(true)} />
      <Confirm open={Boolean(removing)} onClose={() => setRemoving(null)} danger title="Delete this Drop Box?" message="The link will stop working immediately. Files already received stay in your stash." confirmLabel="Delete" onConfirm={async () => { try { await api.delete(`/drop-zones/${removing.id}`); toast.success('Drop Box deleted.'); reload(true); } catch (e) { toast.error(errMsg(e)); throw e; } }} />
    </div>
  );
}

function CreateDialog({ open, onClose, onDone }) {
  const [f, setF] = useState({ title: '', maxFiles: 50, maxSizeMB: 25, allowedTypes: '', expiresAt: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api.post('/drop-zones', { ...f, expiresAt: f.expiresAt ? new Date(`${f.expiresAt}T23:59:59`).toISOString() : undefined });
      toast.success('Drop Box created.');
      setF({ title: '', maxFiles: 50, maxSizeMB: 25, allowedTypes: '', expiresAt: '' });
      onDone();
      onClose();
    } catch (e2) {
      setErr(errMsg(e2));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="New Drop Box">
      <form onSubmit={submit} className="space-y-3">
        {err && <div role="alert" className="rounded-xl bg-rose-500/10 p-2.5 text-xs text-rose-400">{err}</div>}
        <Field label="Title" hint="Visitors will see this title. Example: Project Submissions"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Max files"><input type="number" min="1" max="1000" className="input" value={f.maxFiles} onChange={(e) => setF({ ...f, maxFiles: e.target.value })} /></Field>
          <Field label="Max size per file (MB)"><input type="number" min="1" max="100" className="input" value={f.maxSizeMB} onChange={(e) => setF({ ...f, maxSizeMB: e.target.value })} /></Field>
        </div>
        <Field label="Allowed extensions (optional)" hint="Comma separated: pdf, docx, png"><input className="input font-mono text-xs" value={f.allowedTypes} onChange={(e) => setF({ ...f, allowedTypes: e.target.value })} placeholder="Leave empty for all formats" /></Field>
        <Field label="Expiry date (optional)"><input type="date" className="input font-mono text-xs" min={new Date().toISOString().slice(0, 10)} value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></Field>
        <div className="flex justify-end gap-2 border-t border-[#26262B]/60 pt-3"><button type="button" className="btn btn-outline rounded-2xl cursor-pointer" onClick={onClose}>Cancel</button><button className="btn btn-primary rounded-2xl cursor-pointer" disabled={busy}>{busy && <Spinner />} Create</button></div>
      </form>
    </Modal>
  );
}
