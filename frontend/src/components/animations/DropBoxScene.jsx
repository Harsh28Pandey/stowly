import { useEffect, useState } from 'react';
import { PackageOpen, UploadCloud, Bell, FileCheck, CheckCircle2 } from 'lucide-react';

export function DropBoxScene() {
  const [phase, setPhase] = useState(0); // 0: drop, 1: toast notification, 2: file in inbox

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase(2);
      return;
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setPhase((p) => (p + 1) % 3);
      }
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-[#26262B] bg-[#0F0F12] p-4 text-left">
      <div className="flex items-center justify-between border-b border-[#26262B] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <PackageOpen size={14} className="text-brand-400" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#9A9AA3]">
            PUBLIC DROP BOX DELIVERY
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#FAFAFA]">/drop/client-vault</span>
      </div>

      <div className="space-y-2.5">
        {/* Guest Drop Area */}
        <div
          className={`rounded-lg border border-dashed p-3 text-center transition-all duration-300 ${
            phase === 0
              ? 'border-brand-500 bg-[#16161A]'
              : 'border-[#26262B] bg-[#16161A]/50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <UploadCloud size={16} className={phase === 0 ? 'text-brand-400 animate-bounce' : 'text-[#9A9AA3]'} />
            <span className="font-mono text-xs font-semibold text-[#FAFAFA]">
              {phase === 0 ? 'Guest dropping client-brief-v2.pdf...' : 'Public Drop Zone Active'}
            </span>
          </div>
        </div>

        {/* Incoming Toast Notification */}
        {phase >= 1 && (
          <div className="rounded-lg border border-brand-500/30 bg-[#16161A] p-2.5 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-brand-400 animate-pulse" />
              <span className="text-xs font-semibold text-[#FAFAFA]">New file received in "Client Vault"</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400">Just now</span>
          </div>
        )}

        {/* Owner Inbox Result */}
        <div
          className={`rounded-lg border p-2.5 flex items-center justify-between transition-all duration-300 ${
            phase === 2
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-[#26262B] bg-[#16161A] opacity-60'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileCheck size={14} className={phase === 2 ? 'text-emerald-400' : 'text-[#9A9AA3]'} />
            <div>
              <p className="text-xs font-semibold text-[#FAFAFA]">client-brief-v2.pdf</p>
              <p className="font-mono text-[10px] text-[#9A9AA3]">3.8 MB &middot; Delivered via Drop Box</p>
            </div>
          </div>
          {phase === 2 && <CheckCircle2 size={16} className="text-emerald-400" />}
        </div>
      </div>
    </div>
  );
}
