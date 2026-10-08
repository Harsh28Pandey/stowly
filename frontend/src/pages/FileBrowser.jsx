import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Archive, ChevronRight, Download, Eye, File as FileIcon, FileText, Film, Folder, FolderInput, FolderPlus, Image as ImageIcon,
  LayoutGrid, List, Music, MoreVertical, Pencil, Pin, PinOff, RotateCcw, Search, Tag, Trash2, UploadCloud, X, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import api, { errMsg } from '../api';
import { useAuth } from '../auth';
import { useStorage } from '../storage';
import { useNotifications } from '../notifications';
import { useLiveQuery, useDocumentTitle } from '../data/liveStore';
import { QUERY_KEYS } from '../data/invalidation';
import { Confirm, Empty, ErrorBox, Modal, PageHeader, Skeleton, Spinner, formatBytes, timeAgo, useDebounce } from '../components/ui';
import { compressFiles } from '../utils/compressor';

const kindIcon = { images: ImageIcon, videos: Film, audio: Music, documents: FileText, archives: Archive, other: FileIcon };
const kindColor = {
  images: 'text-sky-400',
  videos: 'text-amber-400',
  audio: 'text-pink-400',
  documents: 'text-brand-400',
  archives: 'text-orange-400',
  other: 'text-[#9A9AA3]',
};

const TITLES = {
  all: ['My Stash', 'Everything you have stored, organized your way.'],
  recent: ['Just Opened', 'Files you opened or downloaded most recently.'],
  starred: ['Pinned', 'Your most important files and folders, one tap away.'],
  trash: ['Recycle Bin', 'Items here can be restored or deleted forever.'],
};

const EMPTY = {
  all: ['Nothing here yet', 'Drag files onto this page or use the Upload button to get started.'],
  recent: ['Nothing opened yet', 'Files you preview or download will show up here.'],
  starred: ['No pinned items', 'Pin files and folders from their menu to find them quickly.'],
  trash: ['Your Recycle Bin is empty', 'Deleted items will wait here until you remove them for good.'],
  collection: ['This shelf is empty', 'No files match this shelf right now.'],
};

function RowMenu({ items, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="rounded-xl p-1 text-[#9A9AA3] hover:bg-[#16161A] hover:text-[#FAFAFA] transition cursor-pointer"
        aria-label={`Actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <ul role="menu" className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-2xl border border-[#26262B] bg-[#0F0F12] py-1 shadow-2xl animate-in fade-in duration-150">
          {items.map(({ label: l, icon: Icon, onClick, danger }) => (
            <li key={l} role="none">
              <button
                role="menuitem"
                onClick={() => { setOpen(false); onClick(); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-xs font-semibold transition cursor-pointer ${
                  danger ? 'text-[#F43F5E] hover:bg-[#F43F5E]/15' : 'text-[#FAFAFA] hover:bg-[#16161A]'
                }`}
              >
                <Icon size={14} /> {l}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function FileBrowser({ mode }) {
  const { user } = useAuth();
  const storage = useStorage();
  const { unreadCount } = useNotifications();
  const [params, setParams] = useSearchParams();
  const folder = params.get('folder') || '';
  const shelf = params.get('shelf') || '';
  const view = shelf ? 'collection' : mode;
  const [search, setSearch] = useState('');
  const q = useDebounce(search);
  const [layout, setLayout] = useState(user?.prefs?.view || 'grid');
  const [uploading, setUploading] = useState(null);
  const [uploadStatusText, setUploadStatusText] = useState('Uploading...');
  const [dragging, setDragging] = useState(false);
  const [dialog, setDialog] = useState(null);
  const fileInput = useRef();

  useEffect(() => {
    if (user?.prefs?.view) {
      setLayout(user.prefs.view);
    }
  }, [user?.prefs?.view]);

  const queryKey = `${QUERY_KEYS.FILES}:${view}:${folder}:${q}:${shelf}`;

  const { data, loading, error, refetch: reload } = useLiveQuery(
    queryKey,
    () => api.get('/files', { params: { view, folder: folder || undefined, q: q || undefined, collection: shelf || undefined } }).then((r) => r.data)
  );

  const folderName = data?.breadcrumbs?.length ? data.breadcrumbs[data.breadcrumbs.length - 1].name : '';
  const pageTitle = mode === 'all' ? (folderName || 'My Stash') : mode === 'recent' ? 'Just Opened' : mode === 'starred' ? 'Pinned' : mode === 'trash' ? 'Recycle Bin' : 'Files';
  useDocumentTitle(pageTitle, unreadCount);

  useEffect(() => { setSearch(''); }, [mode, folder]);

  const run = async (fn, okMsg) => {
    try {
      const res = await fn();
      if (res?.data?.storageSummary) {
        storage.updateSummary(res.data.storageSummary);
      } else {
        storage.refresh();
      }
      if (okMsg) toast.success(okMsg);
      reload(true);
    } catch (e) {
      toast.error(errMsg(e));
      throw e;
    }
  };

  const upload = useCallback(async (list) => {
    const rawFiles = [...list];
    if (!rawFiles.length) return;

    const emptyFile = rawFiles.find((f) => f.size === 0);
    if (emptyFile) {
      toast.error(`Cannot upload 0-byte empty file: "${emptyFile.name}".`);
      return;
    }

    const totalSize = rawFiles.reduce((acc, f) => acc + f.size, 0);
    const quotaCheck = storage.checkQuota(totalSize);
    if (!quotaCheck.ok) {
      toast.error(quotaCheck.message);
      return;
    }

    try {
      setUploading(0);
      setUploadStatusText('Optimizing & compressing files...');

      const files = await compressFiles(rawFiles, (curr, total, name) => {
        setUploadStatusText(`Compressing (${curr}/${total}): ${name}`);
      });

      setUploadStatusText('Uploading to your stash...');

      for (let i = 0; i < files.length; i += 20) {
        const batch = files.slice(i, i + 20);
        const fd = new FormData();
        if (folder) fd.append('folder', folder);
        batch.forEach((f) => fd.append('files', f));

        const res = await api.post('/files/upload', fd, {
          onUploadProgress: (e) => setUploading(Math.round((e.loaded * 100) / (e.total || 1))),
        });
        if (res.data?.storageSummary) {
          storage.updateSummary(res.data.storageSummary);
        } else {
          storage.refresh();
        }
        toast.success(`${res.data.files.length} file(s) uploaded.`);
        if (res.data.duplicates.length) toast.warning(`Duplicate file detected: ${res.data.duplicates.join(', ')}.`);
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setUploading(null);
      reload(true);
    }
  }, [folder, reload, storage]);

  const open = (type, kind, item) => setDialog({ type, kind, item });
  const close = () => setDialog(null);
  const base = (kind, id) => (kind === 'folder' ? `/folders/${id}` : `/files/${id}`);
  const download = (f) => { window.location.href = `/api/files/${f.id}/download`; };

  const menuFor = (kind, item) => {
    if (view === 'trash')
      return [
        { label: 'Restore', icon: RotateCcw, onClick: () => run(() => api.post(`${base(kind, item.id)}/restore`), 'Restored.') },
        { label: 'Delete forever', icon: Trash2, danger: true, onClick: () => open('purge', kind, item) },
      ];
    const common = [
      { label: item.starred ? 'Unpin' : 'Pin', icon: item.starred ? PinOff : Pin, onClick: () => run(() => api.patch(base(kind, item.id), { starred: !item.starred })) },
      { label: 'Rename', icon: Pencil, onClick: () => open('rename', kind, item) },
      { label: 'Move to...', icon: FolderInput, onClick: () => open('move', kind, item) },
    ];
    const extra = kind === 'file'
      ? [{ label: 'Preview', icon: Eye, onClick: () => open('preview', kind, item) }, { label: 'Download', icon: Download, onClick: () => download(item) }, { label: 'Edit tags', icon: Tag, onClick: () => open('tags', kind, item) }]
      : [];
    return [...extra, ...common, { label: 'Move to Bin', icon: Trash2, danger: true, onClick: () => open('trash', kind, item) }];
  };

  const [title, subtitle] = shelf ? [params.get('label') || 'Smart Shelf', 'Automatically gathered for you.'] : TITLES[mode];
  const files = data?.files || [];
  const folders = data?.folders || [];
  const isEmpty = !loading && !error && !files.length && !folders.length;
  const canUpload = view === 'all';
  const searching = Boolean(q);

  return (
    <div
      onDragOver={(e) => { if (canUpload) { e.preventDefault(); setDragging(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
      onDrop={(e) => { if (canUpload) { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); } }}
      className={`relative min-h-[400px] transition-colors ${dragging ? 'ring-2 ring-brand-500 rounded-2xl bg-[#16161A]/50' : ''}`}
    >
      {shelf && <Link to="/app/shelves" className="mb-2.5 inline-flex items-center gap-1 font-mono text-xs font-semibold text-brand-400 hover:underline cursor-pointer">&larr; All shelves</Link>}
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {view === 'trash' && (files.length > 0 || folders.length > 0) && (
              <button className="btn btn-outline btn-sm text-[#F43F5E] cursor-pointer hover:bg-[#F43F5E]/10" onClick={() => open('empty')}>
                <Trash2 size={14} /> Empty bin
              </button>
            )}
            {canUpload && (
              <>
                <button className="btn btn-outline btn-sm cursor-pointer" onClick={() => open('newFolder')}>
                  <FolderPlus size={14} /> New folder
                </button>
                <button className="btn btn-primary btn-sm cursor-pointer" onClick={() => fileInput.current.click()} disabled={uploading !== null}>
                  <UploadCloud size={14} /> Upload
                </button>
                <input ref={fileInput} type="file" multiple className="sr-only" aria-label="Upload files" onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
              </>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        {mode === 'all' && !shelf && (
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9AA3]" />
            <input className="input pl-8 text-xs" placeholder="Search files, tags..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
          </div>
        )}
        {data?.breadcrumbs?.length > 0 && !searching && (
          <nav className="flex min-w-0 flex-wrap items-center gap-1 font-mono text-xs text-[#9A9AA3]" aria-label="Breadcrumb">
            <button className="hover:text-[#FAFAFA] cursor-pointer" onClick={() => setParams({})}>My Stash</button>
            {data.breadcrumbs.map((b) => (
              <span key={b.id} className="inline-flex items-center gap-1"><ChevronRight size={12} /><button className="max-w-[8rem] truncate hover:text-[#FAFAFA] cursor-pointer" title={b.name} onClick={() => setParams({ folder: b.id })}>{b.name}</button></span>
            ))}
          </nav>
        )}
        <div className="ml-auto inline-flex items-center gap-1">
          {[['grid', LayoutGrid], ['list', List]].map(([k, Icon]) => (
            <button
              key={k}
              onClick={() => setLayout(k)}
              className={`rounded-xl p-1.5 transition cursor-pointer ${layout === k ? 'bg-[#16161A] text-[#FAFAFA]' : 'text-[#9A9AA3] hover:text-[#FAFAFA]'}`}
              aria-label={`${k} view`}
              aria-pressed={layout === k}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {uploading !== null && (
        <div className="card mb-4 flex items-center gap-3 p-3 bg-[#0F0F12]" role="status">
          <Spinner className="text-brand-400" />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs text-[#FAFAFA] truncate">{uploadStatusText} ({uploading}%)</p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#16161A]">
              <div className="h-full bg-brand-500 transition-all duration-200" style={{ width: `${uploading}%` }} />
            </div>
          </div>
        </div>
      )}

      {error ? <ErrorBox message={error} onRetry={reload} /> : loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : isEmpty ? (
        <div className="card rounded-2xl bg-[#0F0F12] p-8">
          <Empty
            icon={view === 'trash' ? Trash2 : Folder}
            title={searching ? 'No matches found' : (shelf ? EMPTY.collection : EMPTY[mode])[0]}
            text={searching ? 'Try a different search term or tag.' : (shelf ? EMPTY.collection : EMPTY[mode])[1]}
            action={canUpload && !searching && <button className="btn btn-primary btn-sm rounded-2xl cursor-pointer" onClick={() => fileInput.current.click()}><UploadCloud size={14} /> Upload files</button>}
          />
        </div>
      ) : layout === 'grid' ? (
        /* Single-surface grid cards (NO inner icon box with border/bg, NO inner tag boxes) */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {folders.map((f) => (
            <div key={f.id} className="card rounded-2xl p-3 flex items-center justify-between transition-colors hover:bg-[#16161A]">
              <button className="flex min-w-0 flex-1 items-center gap-2 text-left cursor-pointer" onClick={() => view !== 'trash' && setParams({ folder: f.id })} disabled={view === 'trash'}>
                <Folder size={18} className="text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-[#FAFAFA]" title={f.name}>{f.name}</p>
                  <p className="font-mono text-[10px] text-[#9A9AA3]">Folder</p>
                </div>
              </button>
              <RowMenu label={f.name} items={menuFor('folder', f)} />
            </div>
          ))}
          {files.map((f) => {
            const Icon = kindIcon[f.kind];
            const iconColor = kindColor[f.kind];
            return (
              <div key={f.id} className="card rounded-2xl p-3 flex flex-col justify-between transition-colors hover:bg-[#16161A] h-28">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <Icon size={18} className={`${iconColor} shrink-0`} />
                    <RowMenu label={f.name} items={menuFor('file', f)} />
                  </div>
                  <button
                    className="mt-1.5 truncate text-left text-xs font-bold text-[#FAFAFA] hover:text-brand-400 cursor-pointer transition-colors block w-full"
                    title={f.name}
                    onClick={() => view !== 'trash' && open('preview', 'file', f)}
                  >
                    {f.name}
                  </button>
                </div>
                <div>
                  <p className="font-mono text-[10px] text-[#9A9AA3] truncate">{formatBytes(f.size)} &middot; {timeAgo(f.createdAt)}</p>
                  {(f.starred || f.tags.length > 0) && (
                    <div className="mt-1 flex items-center gap-1 overflow-hidden">
                      {f.starred && <Pin size={10} className="text-amber-400 fill-amber-400 shrink-0" />}
                      {f.tags.slice(0, 2).map((t) => <span key={t} className="chip text-[9px] py-0 px-1.5">#{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Rows (ONE Card with divide-y rows) */
        <div className="card rounded-2xl divide-y divide-[#26262B]/60 overflow-hidden bg-[#0F0F12]">
          {folders.map((f) => (
            <div key={f.id} className="flex h-11 items-center gap-3 px-3.5 py-2 hover:bg-[#16161A]/50 transition-colors">
              <button className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer" onClick={() => view !== 'trash' && setParams({ folder: f.id })} disabled={view === 'trash'}>
                <Folder size={16} className="shrink-0 text-amber-400" />
                <span className="truncate text-xs font-semibold text-[#FAFAFA]" title={f.name}>{f.name}</span>
              </button>
              <RowMenu label={f.name} items={menuFor('folder', f)} />
            </div>
          ))}
          {files.map((f) => {
            const Icon = kindIcon[f.kind];
            const iconColor = kindColor[f.kind];
            return (
              <div key={f.id} className="flex h-11 items-center gap-3 px-3.5 py-2 hover:bg-[#16161A]/50 transition-colors">
                <button className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer" onClick={() => view !== 'trash' && open('preview', 'file', f)}>
                  <Icon size={16} className={`shrink-0 ${iconColor}`} />
                  <span className="truncate text-xs font-medium text-[#FAFAFA]" title={f.name}>{f.name}</span>
                </button>
                <span className="hidden shrink-0 font-mono text-[11px] text-[#9A9AA3] sm:block">{formatBytes(f.size)}</span>
                <span className="hidden shrink-0 font-mono text-[11px] text-[#9A9AA3] md:block">{timeAgo(f.createdAt)}</span>
                <RowMenu label={f.name} items={menuFor('file', f)} />
              </div>
            );
          })}
        </div>
      )}

      {dragging && <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl bg-[#0F0F12]/90 border-2 border-dashed border-brand-500 font-mono text-sm font-bold text-[#FAFAFA]">Drop files to upload immediately</div>}

      <Dialogs dialog={dialog} close={close} folder={folder} run={run} base={base} reload={reload} />
    </div>
  );
}

function Dialogs({ dialog, close, folder, run, base, reload }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const d = dialog || {};

  useEffect(() => {
    if (d.type === 'rename') setValue(d.item.name);
    else if (d.type === 'tags') setValue((d.item.tags || []).join(', '));
    else setValue('');
  }, [dialog]);

  const submit = async (fn, msg) => {
    setBusy(true);
    try { await run(fn, msg); close(); } catch { /* toast */ } finally { setBusy(false); }
  };

  return (
    <>
      <Modal open={d.type === 'newFolder'} onClose={close} title="New Folder">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => api.post('/folders', { name: value, parent: folder || null }), 'Folder created.'); }}>
          <input className="input" autoFocus placeholder="Folder name" value={value} onChange={(e) => setValue(e.target.value)} required aria-label="Folder name" />
          <div className="mt-4 flex justify-end gap-2 border-t border-[#26262B]/60 pt-3">
            <button type="button" className="btn btn-outline rounded-2xl cursor-pointer" onClick={close}>Cancel</button>
            <button className="btn btn-primary rounded-2xl cursor-pointer" disabled={busy}>{busy && <Spinner />} Create</button>
          </div>
        </form>
      </Modal>

      <Modal open={d.type === 'rename'} onClose={close} title="Rename Item">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => api.patch(base(d.kind, d.item.id), { name: value }), 'Renamed.'); }}>
          <input className="input" autoFocus value={value} onChange={(e) => setValue(e.target.value)} required aria-label="New name" />
          <div className="mt-4 flex justify-end gap-2 border-t border-[#26262B]/60 pt-3">
            <button type="button" className="btn btn-outline rounded-2xl cursor-pointer" onClick={close}>Cancel</button>
            <button className="btn btn-primary rounded-2xl cursor-pointer" disabled={busy}>{busy && <Spinner />} Save</button>
          </div>
        </form>
      </Modal>

      <Modal open={d.type === 'tags'} onClose={close} title="Edit Tags">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => api.patch(base('file', d.item.id), { tags: value.split(',') }), 'Tags saved.'); }}>
          <input className="input" autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="invoice, 2026, personal" aria-label="Tags" />
          <p className="mt-1.5 text-[11px] text-[#9A9AA3]">Separate tags with commas.</p>
          <div className="mt-4 flex justify-end gap-2 border-t border-[#26262B]/60 pt-3">
            <button type="button" className="btn btn-outline rounded-2xl cursor-pointer" onClick={close}>Cancel</button>
            <button className="btn btn-primary rounded-2xl cursor-pointer" disabled={busy}>{busy && <Spinner />} Save</button>
          </div>
        </form>
      </Modal>

      {d.type === 'move' && <MoveDialog d={d} close={close} run={run} base={base} />}
      {d.type === 'preview' && <Preview file={d.item} close={close} onSeen={() => reload(true)} />}

      <Confirm open={d.type === 'trash'} onClose={close} danger title="Move to Recycle Bin?" message={`"${d.item?.name}" will be moved to the Recycle Bin. You can restore it later.`} confirmLabel="Move to bin" onConfirm={() => run(() => api.post(`${base(d.kind, d.item.id)}/trash`), 'Moved to the Recycle Bin.')} />
      <Confirm open={d.type === 'purge'} onClose={close} danger title="Delete forever?" message={`"${d.item?.name}" will be permanently deleted. This cannot be undone.`} confirmLabel="Delete forever" onConfirm={() => run(() => api.delete(base(d.kind, d.item.id)), 'Deleted permanently.')} />
      <Confirm open={d.type === 'empty'} onClose={close} danger title="Empty the Recycle Bin?" message="Everything in the Recycle Bin will be permanently deleted." confirmLabel="Empty bin" onConfirm={() => run(() => api.post('/files/trash/empty'), 'Recycle Bin emptied.')} />
    </>
  );
}

function MoveDialog({ d, close, run, base }) {
  const { data, loading } = useFetch(() => api.get('/folders/all').then((r) => r.data.folders));
  const [busy, setBusy] = useState(false);
  const go = async (dest) => {
    setBusy(true);
    try { await run(() => api.patch(base(d.kind, d.item.id), d.kind === 'folder' ? { parent: dest } : { folder: dest }), 'Moved.'); close(); } catch { /* toast */ } finally { setBusy(false); }
  };
  const list = (data || []).filter((f) => !(d.kind === 'folder' && f.id === d.item.id));
  return (
    <Modal open onClose={close} title={`Move "${d.item.name}"`}>
      {loading ? <div className="grid place-items-center py-4"><Spinner /></div> : (
        <ul className="max-h-60 space-y-1 overflow-y-auto font-mono text-xs divide-y divide-[#26262B]/60">
          <li><button disabled={busy} onClick={() => go(null)} className="flex w-full items-center gap-2 py-2 text-left text-[#FAFAFA] hover:bg-[#16161A] cursor-pointer"><Folder size={15} className="text-brand-400" /> My Stash (top level)</button></li>
          {list.map((f) => (
            <li key={f.id}><button disabled={busy} onClick={() => go(f.id)} className="flex w-full items-center gap-2 py-2 text-left text-[#FAFAFA] hover:bg-[#16161A] cursor-pointer"><Folder size={15} className="text-amber-400" /> <span className="truncate">{f.name}</span></button></li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function Preview({ file, close, onSeen }) {
  const url = `/api/files/${file.id}/download?inline=1`;
  useEffect(() => { const t = setTimeout(onSeen, 800); return () => clearTimeout(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const m = file.mime;
  let body;
  if (/^image\/(png|jpe?g|gif|webp|avif|bmp)/.test(m)) body = <img src={url} alt={file.name} className="mx-auto max-h-[60vh] rounded-xl object-contain" />;
  else if (/^video\/(mp4|webm|ogg)/.test(m)) body = <video src={url} controls className="mx-auto max-h-[60vh] w-full rounded-xl bg-black" />;
  else if (/^audio\//.test(m)) body = <audio src={url} controls className="w-full" />;
  else if (m === 'application/pdf' || m === 'text/plain') body = <iframe src={url} title={file.name} className="h-[60vh] w-full rounded-xl bg-[#0F0F12]" />;
  else body = <div className="py-8 text-center text-xs text-[#9A9AA3]">No preview available for this file format. You can download it directly.</div>;
  return (
    <Modal open onClose={close} title={file.name} wide>
      {body}
      <div className="mt-4 flex items-center justify-between gap-2 font-mono text-xs text-[#9A9AA3] border-t border-[#26262B]/60 pt-3">
        <span>{formatBytes(file.size)} &middot; {timeAgo(file.createdAt)}</span>
        <a className="btn btn-primary btn-sm rounded-2xl cursor-pointer" href={`/api/files/${file.id}/download`}><Download size={14} /> Download</a>
      </div>
    </Modal>
  );
}
