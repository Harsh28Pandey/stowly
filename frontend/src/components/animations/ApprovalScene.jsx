import { useEffect, useState } from 'react';
import { UserCheck, Clock, ShieldCheck, HardDrive } from 'lucide-react';

export function ApprovalScene() {
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setApproved(true);
      return;
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setApproved((a) => !a);
      }
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-[#26262B] bg-[#0F0F12] p-4 text-left">
      <div className="flex items-center justify-between border-b border-[#26262B] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <UserCheck size={14} className="text-brand-400" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#9A9AA3]">
            ADMIN ACCOUNT VERIFICATION
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#9A9AA3]">Private Platform</span>
      </div>

      <div className="rounded-lg border border-[#26262B] bg-[#16161A] p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded bg-[#0F0F12] border border-[#26262B] font-mono text-xs font-bold text-brand-400">
              ER
            </span>
            <div>
              <p className="text-xs font-semibold text-[#FAFAFA]">Elena Rostova</p>
              <p className="font-mono text-[10px] text-[#9A9AA3]">elena@tech-corp.io</p>
            </div>
          </div>

          {/* Animated Status Badge */}
          <span
            className={`flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-500 ${
              approved
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border border-amber-500/30 bg-amber-500/10 text-amber-400'
            }`}
          >
            {approved ? (
              <>
                <ShieldCheck size={12} /> Approved
              </>
            ) : (
              <>
                <Clock size={12} className="animate-spin" /> Pending Review
              </>
            )}
          </span>
        </div>

        {/* Quota Grant Details */}
        <div className="flex items-center justify-between rounded border border-[#26262B] bg-[#0F0F12] px-3 py-1.5 font-mono text-[10px]">
          <span className="text-[#9A9AA3]">Assigned Quota</span>
          <span className="flex items-center gap-1 font-bold text-[#FAFAFA]">
            <HardDrive size={11} className="text-brand-400" />
            {approved ? '500 GB Storage Granted' : 'Awaiting Approval'}
          </span>
        </div>
      </div>
    </div>
  );
}
