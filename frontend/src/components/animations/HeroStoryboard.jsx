import { useEffect, useState } from 'react';
import { FileText, Folder, Shield, MousePointer, CheckCircle2 } from 'lucide-react';

export function HeroStoryboard() {
  const [step, setStep] = useState(0); // 0: drop, 1: drag, 2: shelf tick, 3: lock

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setStep((s) => (s + 1) % 4);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card rounded-2xl relative overflow-hidden bg-[#0F0F12] border border-[#26262B] p-4 sm:p-5 text-left font-sans shadow-sm">
      {/* Top mock header */}
      <div className="flex items-center justify-between border-b border-[#26262B] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#26262B]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#26262B]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#26262B]" />
          <span className="ml-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[#9A9AA3]">STOWLY WORKFLOW DEMO</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[#16161A] border border-[#26262B] px-2.5 py-0.5 font-mono text-[10px] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Step {step + 1} of 4</span>
        </div>
      </div>

      {/* Product Interactive Area */}
      <div className="relative min-h-[200px] grid gap-3 sm:grid-cols-2">
        {/* Left Column: My Stash & Incoming File */}
        <div className="rounded-xl border border-[#26262B] bg-[#16161A] p-3 flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#9A9AA3]">MY STASH / INBOX</span>
              <span className="font-mono text-[10px] text-[#FAFAFA]">Active</span>
            </div>

            {/* Draggable File Card */}
            <div
              className={`rounded-xl border border-[#26262B] bg-[#0F0F12] p-2.5 flex items-center justify-between transition-all duration-700 ${
                step >= 1 ? 'translate-x-3 translate-y-2 scale-95 border-brand-500/50 bg-[#16161A]' : ''
              } ${step === 2 ? 'opacity-30 scale-90' : 'opacity-100'}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#16161A] border border-[#26262B] text-brand-400">
                  <FileText size={14} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#FAFAFA]">encrypted_document.pdf</p>
                  <p className="font-mono text-[10px] text-[#9A9AA3]">Private &middot; AES-GCM</p>
                </div>
              </div>
              {step >= 2 && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
            </div>
          </div>

          {/* Animated Dragging Cursor */}
          {step === 1 && (
            <div className="absolute top-10 left-32 pointer-events-none transition-all duration-1000 animate-bounce">
              <MousePointer size={18} className="text-brand-400 fill-brand-500" />
            </div>
          )}

          <p className="font-mono text-[10px] text-[#9A9AA3] mt-3">
            {step === 0 && '1. File arrives in Stash'}
            {step === 1 && '2. Auto-sorting to Shelf...'}
            {step === 2 && '3. Landed on Smart Shelf'}
            {step === 3 && '4. Keyring Vault encrypted'}
          </p>
        </div>

        {/* Right Column: Smart Shelves & Encryption */}
        <div className="space-y-3">
          {/* Smart Shelf Destination */}
          <div
            className={`rounded-xl border p-3 transition-all duration-300 ${
              step >= 2 ? 'border-brand-500 bg-[#16161A]' : 'border-[#26262B] bg-[#16161A]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#0F0F12] border border-[#26262B] text-brand-400">
                  <Folder size={14} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#FAFAFA]">Documents Shelf</p>
                  <p className="font-mono text-[10px] text-[#9A9AA3]">Auto-organized</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-[#FAFAFA] transition-all duration-300">
                {step >= 2 ? 'Organized' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Zero Knowledge Encryption Lock Card */}
          <div className="rounded-xl border border-[#26262B] bg-[#16161A] p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs text-[#9A9AA3]">
                <Shield size={13} className="text-emerald-400" />
                <span>Keyring Security</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 font-bold">
                {step === 3 ? 'LOCKED' : 'ENCRYPTED'}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0F0F12] border border-[#26262B]">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: step === 3 ? '100%' : '75%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {['File Drop', 'Auto Sort', 'Shelf Sync', 'Vault Lock'].map((label, idx) => (
          <button
            key={label}
            onClick={() => setStep(idx)}
            className={`rounded-xl py-1 text-center font-mono text-[10px] font-semibold transition-all cursor-pointer ${
              step === idx
                ? 'bg-brand-500 text-white'
                : 'bg-[#16161A] text-[#9A9AA3] border border-[#26262B] hover:text-[#FAFAFA]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
