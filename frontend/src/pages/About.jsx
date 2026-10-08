import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HardDrive, KeyRound, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/ui';

export default function About() {
  useEffect(() => {
    document.title = 'About Stowly - Private 500 GB Storage & Keyring';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] font-sans">
      <div className="pt-4 px-4 sm:pt-6 sm:px-6">
        <header className="mx-auto max-w-[1100px] rounded-2xl border border-[#26262B] bg-[#0F0F12] px-4 py-3 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to="/" className="btn-outline btn-sm font-mono text-xs flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </header>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="badge-tag">ABOUT STOWLY</span>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#FAFAFA]">
              Private personal storage built for clarity and control.
            </h1>
            <p className="text-sm text-[#9A9AA3] leading-relaxed">
              Stowly was engineered to provide high-density personal cloud storage without algorithmic tracking or invasive ad profiling.
            </p>
          </div>

          <div className="card p-5 space-y-4">
            <h2 className="font-heading text-lg font-bold text-[#FAFAFA]">Core Operating Principles</h2>

            <div className="grid gap-3 sm:grid-cols-3 font-mono text-xs">
              <div className="inner-card p-3">
                <ShieldCheck size={18} className="text-emerald-400 mb-1.5" />
                <p className="font-bold text-[#FAFAFA]">Zero Knowledge</p>
                <p className="text-[11px] text-[#9A9AA3] mt-1 font-sans">Keyring passwords are encrypted in your browser before saving.</p>
              </div>
              <div className="inner-card p-3">
                <HardDrive size={18} className="text-brand-400 mb-1.5" />
                <p className="font-bold text-[#FAFAFA]">500 GB Quota</p>
                <p className="text-[11px] text-[#9A9AA3] mt-1 font-sans">Dedicated storage limit assigned per verified account.</p>
              </div>
              <div className="inner-card p-3">
                <KeyRound size={18} className="text-amber-400 mb-1.5" />
                <p className="font-bold text-[#FAFAFA]">Admin Reviewed</p>
                <p className="text-[11px] text-[#9A9AA3] mt-1 font-sans">Every signup is manually activated to keep the platform clean.</p>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-heading text-base font-bold text-[#FAFAFA]">Infrastructure & Security</h2>
            <p className="text-xs text-[#9A9AA3] leading-relaxed">
              Files uploaded to Stowly are stored on isolated server storage with strict token authentication. All cryptographic operations for the password vault use PBKDF2 key derivation with 600,000 rounds and AES-256-GCM symmetric ciphers.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link to="/register" className="btn-primary btn-lg">
              Request 500 GB Access Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
