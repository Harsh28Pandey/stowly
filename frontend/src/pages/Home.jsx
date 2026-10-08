import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FolderOpen, KeyRound, PackageOpen, Pin, UploadCloud, Gauge, Trash2, ArrowUpRight, Clock, HardDrive, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import api from '../api';
import { useAuth } from '../auth';
import { useStorage } from '../storage';
import { useNotifications } from '../notifications';
import { useLiveQuery, useTicker, useDocumentTitle } from '../data/liveStore';
import { QUERY_KEYS } from '../data/invalidation';
import { ErrorBox, Skeleton, StatStrip, formatBytes, timeAgo, Empty } from '../components/ui';

export default function Home() {
  const { user } = useAuth();
  const { summary: storage } = useStorage();
  const { unreadCount } = useNotifications();

  useDocumentTitle('Home Base', unreadCount);
  useTicker(30000);

  const { data, loading, error, refetch } = useLiveQuery(
    QUERY_KEYS.INSIGHTS,
    () => api.get('/storage/insights').then((r) => r.data)
  );

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  const storageUsed = storage?.used ?? (data?.used || 0);
  const storageQuota = storage?.quota ?? (data?.quota || 536870912000);
  const storagePercent = storage?.percent ?? (storageQuota ? Math.min(100, Math.round((storageUsed / storageQuota) * 100)) : 0);
  const isWarning = storagePercent >= 80 && storagePercent < 95;
  const isFull = storagePercent >= 95;

  // Welcome Checklist state dynamically driven from database counts
  const hasFiles = (storage?.fileCount || data?.fileCount || 0) > 0;
  const hasDropBoxes = (data?.activeDropBoxes || 0) > 0;
  const [hasKeyring, setHasKeyring] = useState(false);

  useEffect(() => {
    const keys = localStorage.getItem('stowly_vault_keys');
    if (keys && JSON.parse(keys)?.length > 0) {
      setHasKeyring(true);
    }
  }, []);

  const completedCount = (hasFiles ? 1 : 0) + (hasKeyring ? 1 : 0) + (hasDropBoxes ? 1 : 0);
  const showChecklist = completedCount < 3;

  const stats = data ? [
    { icon: FileText, label: 'Total Files', value: storage?.fileCount ?? data.fileCount },
    { icon: FolderOpen, label: 'Folders', value: data.folderCount },
    { icon: Pin, label: 'Pinned Items', value: data.starredCount },
    { icon: PackageOpen, label: 'Drop Boxes', value: data.activeDropBoxes },
  ] : [];

  return (
    <div className="space-y-4 font-sans max-w-5xl mx-auto">
      {/* Top Banner & Header */}
      <div className="card rounded-2xl bg-[#0F0F12] p-4 sm:p-5 text-[#FAFAFA] border border-[#26262B]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="section-label mb-0">STOWLY WORKSPACE</span>
              <span className="chip bg-emerald-500/15 text-emerald-400">Active</span>
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAFA] mt-1">{greet}, {firstName}</h1>
            <p className="text-xs text-[#9A9AA3]">Manage your files, passwords and drop boxes from one console.</p>
          </div>
          <Link to="/app/files" className="btn btn-primary rounded-2xl flex items-center gap-1.5 self-start sm:self-auto font-bold cursor-pointer">
            <UploadCloud size={14} /> Upload Files
          </Link>
        </div>
      </div>

      {error ? <ErrorBox message={error} onRetry={reload} /> : loading ? (
        <Skeleton className="h-20 rounded-2xl" />
      ) : (
        <>
          {/* Welcome Onboarding Checklist - ONE Card with Divider Rows */}
          {showChecklist && (
            <div className="card rounded-2xl bg-[#0F0F12] border border-[#26262B] p-4">
              <div className="flex items-center justify-between border-b border-[#26262B]/60 pb-2.5 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#FAFAFA]">Welcome Checklist</span>
                  <span className="chip bg-brand-500/15 text-brand-400">
                    {completedCount} of 3 completed
                  </span>
                </div>
                <span className="text-[11px] text-[#9A9AA3]">Gets you ready in 2 mins</span>
              </div>

              <div className="divide-y divide-[#26262B]/60">
                <Link
                  to="/app/files"
                  className="flex items-center gap-3 py-2.5 px-2 rounded-xl transition-colors hover:bg-[#16161A]/50 cursor-pointer"
                >
                  {hasFiles ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <Circle size={16} className="text-[#9A9AA3] shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#FAFAFA]">1. Upload a File</p>
                    <p className="text-[11px] text-[#9A9AA3]">Add your first document or image to My Stash</p>
                  </div>
                  <ArrowUpRight size={14} className="text-[#9A9AA3]" />
                </Link>

                <Link
                  to="/app/keyring"
                  className="flex items-center gap-3 py-2.5 px-2 rounded-xl transition-colors hover:bg-[#16161A]/50 cursor-pointer"
                >
                  {hasKeyring ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <Circle size={16} className="text-[#9A9AA3] shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#FAFAFA]">2. Lock Keyring Vault</p>
                    <p className="text-[11px] text-[#9A9AA3]">Store zero-knowledge encrypted passwords</p>
                  </div>
                  <ArrowUpRight size={14} className="text-[#9A9AA3]" />
                </Link>

                <Link
                  to="/app/dropboxes"
                  className="flex items-center gap-3 py-2.5 px-2 rounded-xl transition-colors hover:bg-[#16161A]/50 cursor-pointer"
                >
                  {hasDropBoxes ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <Circle size={16} className="text-[#9A9AA3] shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#FAFAFA]">3. Open a Drop Box</p>
                    <p className="text-[11px] text-[#9A9AA3]">Generate single-purpose guest upload links</p>
                  </div>
                  <ArrowUpRight size={14} className="text-[#9A9AA3]" />
                </Link>
              </div>
            </div>
          )}

          {/* Storage Alert (If 90%+ or 100% full) */}
          {isFull ? (
            <div className="rounded-2xl bg-rose-500/10 p-3 flex items-center justify-between text-xs text-rose-300">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                <span><strong>Storage limit reached (100%).</strong> New uploads blocked until space is freed.</span>
              </div>
              <Link to="/app/shelves" className="btn btn-danger btn-sm rounded-2xl font-mono text-[10px] uppercase cursor-pointer">Reclaim Space</Link>
            </div>
          ) : isWarning ? (
            <div className="rounded-2xl bg-amber-500/10 p-3 flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <span><strong>Storage warning ({storagePercent}% used).</strong> Space running low.</span>
              </div>
              <Link to="/app/shelves" className="btn btn-outline btn-sm rounded-2xl font-mono text-[10px] uppercase text-amber-300 cursor-pointer">Review Files</Link>
            </div>
          ) : null}

          {/* Storage Meter Card */}
          <div className="card rounded-2xl p-4 bg-[#0F0F12] border border-[#26262B]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HardDrive size={15} className="text-brand-400" />
                <h2 className="text-xs font-bold text-[#FAFAFA]">Storage Meter</h2>
              </div>
              <span className="font-mono text-xs text-[#9A9AA3]">
                {formatBytes(storageUsed)} of {formatBytes(storageQuota)} ({storagePercent}%)
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#16161A]">
              <div
                className={`h-full transition-all duration-500 ${isFull ? 'bg-[#F43F5E]' : isWarning ? 'bg-amber-500' : 'bg-brand-500'}`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>

          {/* Stat Strip Card (ONE single card with dividers) */}
          <StatStrip stats={stats} />

          {/* Recently Added & Shortcuts */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Recently Added Section (ONE Card with divide-y rows) */}
            <div className="card rounded-2xl lg:col-span-2 overflow-hidden bg-[#0F0F12] border border-[#26262B]">
              <div className="flex items-center justify-between border-b border-[#26262B]/60 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-[#9A9AA3]" />
                  <h2 className="text-xs font-bold text-[#FAFAFA]">Recently Added</h2>
                </div>
                <Link to="/app/files" className="font-mono text-[11px] text-brand-400 hover:underline flex items-center gap-1 cursor-pointer">
                  My Stash <ArrowUpRight size={13} />
                </Link>
              </div>

              {data.recent.length === 0 ? (
                <div className="p-4">
                  <Empty icon={FolderOpen} title="Stash is empty" text="Upload your first file to view recent items." action={<Link to="/app/files" className="btn btn-primary btn-sm rounded-2xl cursor-pointer">Go to My Stash</Link>} />
                </div>
              ) : (
                <ul className="divide-y divide-[#26262B]/60">
                  {data.recent.map((f) => (
                    <li key={f.id} className="flex h-11 items-center justify-between gap-3 px-4 py-2 hover:bg-[#16161A]/50 transition-colors cursor-pointer">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <FileText size={15} className="text-[#9A9AA3] shrink-0" />
                        <span className="truncate text-xs font-semibold text-[#FAFAFA]" title={f.name}>{f.name}</span>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] text-[#9A9AA3]">
                        {formatBytes(f.size)} &middot; {timeAgo(f.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick Actions Panel (ONE Card) */}
            <div className="card rounded-2xl p-4 bg-[#0F0F12] border border-[#26262B]">
              <h2 className="text-xs font-bold text-[#FAFAFA] mb-3">Shortcuts</h2>
              <div className="divide-y divide-[#26262B]/60">
                {[
                  { to: '/app/keyring/new', icon: KeyRound, label: 'Add Keyring Secret', tone: 'text-[#22C55E]' },
                  { to: '/app/dropboxes', icon: PackageOpen, label: 'Manage Drop Boxes', tone: 'text-purple-400' },
                  { to: '/app/pulse', icon: Gauge, label: 'Space Pulse Insights', tone: 'text-amber-400' },
                  { to: '/app/bin', icon: Trash2, label: `Recycle Bin (${data.trashedCount})`, tone: 'text-[#F43F5E]' },
                ].map(({ to, icon: Icon, label, tone }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center justify-between py-2.5 px-2 hover:bg-[#16161A]/50 transition-colors cursor-pointer rounded-xl"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={15} className={tone} />
                      <span className="truncate text-xs font-medium text-[#FAFAFA]">{label}</span>
                    </div>
                    <ArrowUpRight size={14} className="text-[#9A9AA3]" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
