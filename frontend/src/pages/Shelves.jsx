import { Link } from 'react-router-dom';
import { Archive, Copy, FileText, Film, HardDrive, Image as ImageIcon, MailQuestion, Music, Sparkles, Hourglass } from 'lucide-react';
import api from '../api';
import { ErrorBox, PageHeader, Skeleton, formatBytes, useFetch } from '../components/ui';

const icons = { images: ImageIcon, videos: Film, audio: Music, documents: FileText, archives: Archive, large: HardDrive, old: Hourglass, duplicates: Copy, unopened: MailQuestion };

export default function Shelves() {
  const { data, loading, error, reload } = useFetch(() => api.get('/storage/collections').then((r) => r.data.shelves));
  return (
    <div>
      <PageHeader title="Smart Shelves" subtitle="Your files, sorted automatically. Nothing to set up." />
      {error ? <ErrorBox message={error} onRetry={reload} /> : loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => {
            const Icon = icons[s.key] || Sparkles;
            return (
              <Link
                key={s.key}
                to={`/app/files?shelf=${s.key}&label=${encodeURIComponent(s.label)}`}
                className="card rounded-2xl p-4 transition-colors hover:bg-[#16161A] cursor-pointer group flex flex-col justify-between h-32"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className="text-brand-400 shrink-0" />
                      <h3 className="text-xs font-bold text-[#FAFAFA] group-hover:text-brand-400 transition-colors">{s.label}</h3>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#FAFAFA]">{s.count} items</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#9A9AA3] line-clamp-2">{s.desc}</p>
                </div>
                <div className="border-t border-[#26262B]/60 pt-2 flex items-center justify-between text-[10px] font-mono text-[#9A9AA3]">
                  <span>Total size</span>
                  <span className="font-bold text-[#FAFAFA]">{formatBytes(s.size)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
