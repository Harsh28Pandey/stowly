import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, PackageOpen, UploadCloud, AlertCircle, Clock, Ban } from 'lucide-react';
import axios from 'axios';
import api, { errMsg } from '../api';
import { Logo, PageLoader, Spinner, useFetch, formatDate, formatBytes } from '../components/ui';

export default function DropPublic() {
  const { token } = useParams();
  const { data, loading, error } = useFetch(() => api.get(`/drop/${token}`).then((r) => r.data.dropBox), [token]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const input = useRef();

  const send = async () => {
    if (!files.length) return;

    const empty = files.find((f) => f.size === 0);
    if (empty) {
      setErr(`Cannot send 0-byte empty file: "${empty.name}".`);
      return;
    }

    setBusy(true);
    setErr('');
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    try {
      await axios.post(`/api/drop/${token}`, fd, { onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total || 1))) });
      setDone(true);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const isExpired = data && data.expiresAt && new Date(data.expiresAt) < new Date();
  const isPaused = data && (data.paused || data.active === false);
  const isFull = data && data.remaining <= 0;

  return (
    <div className="grid min-h-screen place-items-center bg-[#09090B] text-[#FAFAFA] px-4 py-8 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-center"><Link to="/" aria-label="Stowly home"><Logo /></Link></div>

        {loading ? (
          <PageLoader />
        ) : error ? (
          /* Invalid link */
          <div className="card rounded-2xl p-6 text-center bg-[#0F0F12] border border-[#26262B]">
            <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle size={20} />
            </div>
            <h1 className="font-heading text-lg font-bold text-[#FAFAFA]">Drop Box Not Found</h1>
            <p className="mt-1 text-xs text-[#9A9AA3] leading-relaxed">This Drop Box link is invalid or may have been deleted by the owner.</p>
            <Link to="/" className="btn btn-outline btn-sm rounded-2xl mt-5 inline-flex cursor-pointer">Return to Stowly Home</Link>
          </div>
        ) : isExpired ? (
          /* Expired Link */
          <div className="card rounded-2xl p-6 text-center bg-[#0F0F12] border border-[#26262B]">
            <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
              <Clock size={20} />
            </div>
            <h1 className="font-heading text-lg font-bold text-[#FAFAFA]">Drop Box Link Expired</h1>
            <p className="mt-1 text-xs text-[#9A9AA3] leading-relaxed">This Drop Box expired on {formatDate(data.expiresAt)}. Ask {data.ownerName} for a new upload link.</p>
          </div>
        ) : isPaused ? (
          /* Paused Link */
          <div className="card rounded-2xl p-6 text-center bg-[#0F0F12] border border-[#26262B]">
            <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
              <Ban size={20} />
            </div>
            <h1 className="font-heading text-lg font-bold text-[#FAFAFA]">Drop Box Paused</h1>
            <p className="mt-1 text-xs text-[#9A9AA3] leading-relaxed">{data.ownerName} has paused incoming deliveries for "{data.title}".</p>
          </div>
        ) : isFull ? (
          /* Full Link */
          <div className="card rounded-2xl p-6 text-center bg-[#0F0F12] border border-[#26262B]">
            <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
              <PackageOpen size={20} />
            </div>
            <h1 className="font-heading text-lg font-bold text-[#FAFAFA]">Drop Box Capacity Reached</h1>
            <p className="mt-1 text-xs text-[#9A9AA3] leading-relaxed">This Drop Box has reached its maximum accepted file count.</p>
          </div>
        ) : done ? (
          /* Successful Delivery Screen */
          <div className="card rounded-2xl flex flex-col items-center p-6 text-center bg-[#0F0F12] border border-[#26262B]">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={24} />
            </span>
            <h1 className="font-heading mt-3 text-lg font-bold text-[#FAFAFA]">Files Delivered</h1>
            <p className="mt-1 text-xs text-[#9A9AA3] leading-relaxed">{data.ownerName} has received your files in their Stowly workspace.</p>
            <button className="btn btn-outline btn-sm rounded-2xl mt-5 cursor-pointer" onClick={() => { setDone(false); setFiles([]); }}>Send More Files</button>
          </div>
        ) : (
          /* Active Public Drop Form - ONE Card only (No nested sub-boxes) */
          <div className="card rounded-2xl p-5 sm:p-6 bg-[#0F0F12] border border-[#26262B]">
            <div className="flex items-center gap-2 mb-1">
              <PackageOpen size={18} className="text-brand-400 shrink-0" />
              <div>
                <h1 className="font-heading text-base font-bold text-[#FAFAFA]">{data.title}</h1>
                <p className="font-mono text-[10px] text-[#9A9AA3]">Deliver to {data.ownerName}</p>
              </div>
            </div>

            <p className="text-xs text-[#9A9AA3] mt-2 leading-relaxed">
              Files uploaded here land directly in {data.ownerName}'s inbox.
            </p>

            {/* Plain Text Info (NO inner bordered card box) */}
            <div className="mt-3 border-t border-[#26262B]/60 pt-2.5 font-mono text-[10px] text-[#9A9AA3] space-y-1">
              <p>Max file size: <strong className="text-[#FAFAFA]">{data.maxSizeMB} MB</strong> per file</p>
              <p>Accepted files remaining: <strong className="text-[#FAFAFA]">{data.remaining}</strong></p>
              {data.allowedTypes.length > 0 && <p>Allowed formats: <strong className="text-brand-400">{data.allowedTypes.join(', ')}</strong></p>}
            </div>

            <input ref={input} type="file" multiple className="sr-only" id="drop-input" onChange={(e) => setFiles([...e.target.files])} />
            <label
              htmlFor="drop-input"
              className="mt-4 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-[#26262B] bg-[#16161A]/50 px-4 py-6 text-center hover:bg-[#16161A] transition-colors"
            >
              <UploadCloud size={20} className="text-brand-400 mb-1" />
              <span className="text-xs font-semibold text-[#FAFAFA]">Choose or drag files here</span>
              <span className="font-mono text-[10px] text-[#9A9AA3]">Select up to 10 files</span>
            </label>

            {files.length > 0 && (
              <div className="mt-3 border-t border-[#26262B]/60 pt-2 space-y-1">
                <p className="font-mono text-[10px] text-[#9A9AA3] uppercase">Selected ({files.length}):</p>
                <ul className="max-h-28 overflow-y-auto divide-y divide-[#26262B]/60 font-mono text-xs text-[#FAFAFA]">
                  {files.map((f) => (
                    <li key={f.name + f.size} className="flex justify-between items-center py-1.5 text-[11px] truncate">
                      <span className="truncate">{f.name}</span>
                      <span className="text-[#9A9AA3] shrink-0 ml-2">{formatBytes(f.size)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {err && <div role="alert" className="mt-3 rounded-xl bg-rose-500/10 p-2.5 text-xs text-rose-400">{err}</div>}

            {busy && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-[#9A9AA3]">
                  <span>Delivering files...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#16161A]">
                  <div className="h-full bg-brand-500 transition-all duration-150" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button className="btn btn-primary rounded-2xl mt-4 w-full py-2 font-bold cursor-pointer" disabled={!files.length || busy} onClick={send}>
              {busy && <Spinner />} Deliver Files
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
