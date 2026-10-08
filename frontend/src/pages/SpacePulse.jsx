import { Link } from 'react-router-dom';
import { Archive, Copy, FileText, Film, Hourglass, Image as ImageIcon, Music, File as FileIcon, MailQuestion } from 'lucide-react';
import api from '../api';
import { useStorage } from '../storage';
import { ErrorBox, PageHeader, Skeleton, StatStrip, formatBytes, timeAgo, useFetch } from '../components/ui';

const meta = {
  images: { label: 'Pictures', icon: ImageIcon, dot: 'bg-sky-400' },
  videos: { label: 'Videos', icon: Film, dot: 'bg-amber-400' },
  audio: { label: 'Audio', icon: Music, dot: 'bg-pink-400' },
  documents: { label: 'Documents', icon: FileText, dot: 'bg-brand-400' },
  archives: { label: 'Archives', icon: Archive, dot: 'bg-orange-400' },
  other: { label: 'Other', icon: FileIcon, dot: 'bg-[#9A9AA3]' },
};

const FileList = ({ title, items, empty, note }) => (
  <div className="card rounded-2xl bg-[#0F0F12] border border-[#26262B] overflow-hidden">
    <div className="border-b border-[#26262B]/60 px-4 py-3">
      <h2 className="text-xs font-bold text-[#FAFAFA]">{title}</h2>
      {note && <p className="text-[11px] text-[#9A9AA3]">{note}</p>}
    </div>
    {items.length === 0 ? (
      <p className="px-4 py-6 text-center text-xs text-[#9A9AA3]">{empty}</p>
    ) : (
      <ul className="divide-y divide-[#26262B]/60">
        {items.map((f) => (
          <li key={f.id} className="flex h-10 items-center justify-between gap-3 px-4 text-xs hover:bg-[#16161A]/50 transition-colors">
            <span className="truncate font-semibold text-[#FAFAFA]">{f.name}</span>
            <span className="shrink-0 font-mono text-[11px] text-[#9A9AA3]">{formatBytes(f.size)} &middot; {timeAgo(f.createdAt)}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default function SpacePulse() {
  const { summary: storage } = useStorage();
  const { data, loading, error, reload } = useFetch(() => api.get('/storage/insights').then((r) => r.data));

  const stats = data ? [
    { icon: Copy, label: 'Look-alike Files', value: data.duplicates.files, hint: data.duplicates.files ? `${formatBytes(data.duplicates.reclaimable)} reclaimable` : 'Clean' },
    { icon: MailQuestion, label: 'Never Opened', value: data.neverOpened.count },
    { icon: Hourglass, label: '90+ Days Old', value: data.old.count },
  ] : [];

  const used = storage?.used ?? (data?.used || 0);
  const quota = storage?.quota ?? (data?.quota || 536870912000);
  const free = storage?.free ?? Math.max(0, quota - used);

  return (
    <div className="space-y-4">
      <PageHeader title="Space Pulse" subtitle="See where your storage goes and how to get some back." />
      {error ? <ErrorBox message={error} onRetry={reload} /> : loading ? (
        <div className="space-y-3"><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
      ) : (
        <>
          {/* Summary Card - Segmented Bar + Plain text legend (NO boxed legend tiles) */}
          <div className="card rounded-2xl p-4 bg-[#0F0F12] border border-[#26262B]">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[#9A9AA3]">Total Used</p>
                <p className="text-2xl font-bold tracking-tight text-[#FAFAFA]">{formatBytes(used)}</p>
              </div>
              <span className="font-mono text-xs text-[#9A9AA3]">
                {formatBytes(free)} free of {formatBytes(quota)}
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#16161A]" aria-hidden="true">
              {data.byType.map((t) => (
                <div key={t.key} className={meta[t.key].dot} style={{ width: `${(t.size / data.quota) * 100}%` }} />
              ))}
            </div>

            {/* Legend as plain text rows with colored dots (NOT boxed legend items) */}
            <div className="mt-4 border-t border-[#26262B]/60 pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              {data.byType.map((t) => {
                const m = meta[t.key];
                return (
                  <div key={t.key} className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${m.dot} shrink-0`} />
                    <span className="text-[#9A9AA3] truncate">{m.label}:</span>
                    <strong className="text-[#FAFAFA] font-mono text-[11px] truncate">{formatBytes(t.size)}</strong>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stat Strip (ONE card with dividers) */}
          <StatStrip stats={stats} />

          {/* Detailed Lists */}
          <div className="grid gap-4 lg:grid-cols-2">
            <FileList title="Largest files" items={data.largest} empty="No files yet." />
            <FileList title="Recent uploads" items={data.recent} empty="No files yet." />
            <FileList title="Never opened" items={data.neverOpened.items} empty="Everything has been opened at least once." />
            <FileList title="Gathering dust" items={data.old.items} empty="Nothing old lingering." note="Not opened in 90+ days" />
          </div>

          <p className="text-xs text-[#9A9AA3]">
            Want to tidy up? Visit <Link to="/app/shelves" className="font-semibold text-brand-400 hover:underline">Smart Shelves</Link> to review look-alikes and heavy files.
          </p>
        </>
      )}
    </div>
  );
}
