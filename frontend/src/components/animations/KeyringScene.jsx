import { useEffect, useState } from 'react';
import { Lock, ShieldCheck, KeyRound, EyeOff } from 'lucide-react';

const PLAIN_TEXT = 'CorrectHorseBatteryStaple';
const CIPHER_TEXT = '8f3a9e21b7c4d5e6f1082a490c7b1f2e';

export function KeyringScene() {
  const [phase, setPhase] = useState(0); // 0: typing, 1: cipher scramble, 2: locked
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase(2);
      setTyped(CIPHER_TEXT);
      return;
    }

    let timer;
    if (phase === 0) {
      let idx = 0;
      const typeInterval = setInterval(() => {
        if (idx <= PLAIN_TEXT.length) {
          setTyped(PLAIN_TEXT.slice(0, idx));
          idx++;
        } else {
          clearInterval(typeInterval);
          timer = setTimeout(() => setPhase(1), 800);
        }
      }, 70);
      return () => {
        clearInterval(typeInterval);
        clearTimeout(timer);
      };
    } else if (phase === 1) {
      setTyped(CIPHER_TEXT);
      timer = setTimeout(() => setPhase(2), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 2) {
      timer = setTimeout(() => {
        setPhase(0);
        setTyped('');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  return (
    <div className="rounded-xl border border-[#26262B] bg-[#0F0F12] p-4 text-left">
      <div className="flex items-center justify-between border-b border-[#26262B] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <KeyRound size={14} className="text-brand-400" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#9A9AA3]">
            BROWSER-SIDE KEYRING ENCRYPTION
          </span>
        </div>
        <span className="font-mono text-[10px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded">
          Zero Knowledge
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="font-mono text-[10px] font-semibold text-[#9A9AA3] uppercase tracking-wider block mb-1">
            Master Password Field
          </label>
          <div className="relative flex items-center rounded-lg border border-[#26262B] bg-[#16161A] px-3 py-2">
            <code className="font-mono text-xs text-[#FAFAFA] min-h-[18px] flex-1 break-all">
              {phase === 0 ? (
                <span>{typed}<span className="animate-pulse">|</span></span>
              ) : phase === 1 ? (
                <span className="text-amber-400 animate-pulse">{typed}</span>
              ) : (
                <span className="text-emerald-400">{typed.slice(0, 24)}...</span>
              )}
            </code>
            <EyeOff size={14} className="text-[#9A9AA3] shrink-0 ml-2" />
          </div>
        </div>

        {/* AES Lock Badge */}
        <div
          className={`flex items-center justify-between rounded-lg border p-2.5 transition-all duration-300 ${
            phase === 2
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-[#26262B] bg-[#16161A] text-[#9A9AA3]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Lock size={15} className={phase === 2 ? 'text-emerald-400' : 'text-[#9A9AA3]'} />
            <span className="font-mono text-xs font-semibold">
              {phase === 2 ? 'Encrypted in your browser (AES-256-GCM)' : 'Encrypting payload...'}
            </span>
          </div>
          {phase === 2 && <ShieldCheck size={16} className="text-emerald-400" />}
        </div>
      </div>
    </div>
  );
}
