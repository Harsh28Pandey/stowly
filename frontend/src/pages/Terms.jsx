import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/ui';

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms of Service - Stowly';
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
        <div className="card p-6 sm:p-8 space-y-6">
          <div>
            <span className="badge-tag">LEGAL</span>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA] mt-1">
              Terms of Service
            </h1>
            <p className="font-mono text-xs text-[#9A9AA3] mt-1">Last updated: October 2026</p>
          </div>

          <div className="space-y-4 text-xs text-[#9A9AA3] leading-relaxed">
            <h2 className="font-heading text-sm font-bold text-[#FAFAFA]">1. Account Terms & Verification</h2>
            <p>
              Stowly is a private storage platform. Access is subject to manual administrator review and approval. You are responsible for maintaining the security of your sign-in credentials and master password.
            </p>

            <h2 className="font-heading text-sm font-bold text-[#FAFAFA]">2. Acceptable Use Policy</h2>
            <p>
              You agree not to store or transmit illegal content, malicious software, or unauthorized copyright-infringed materials. Accounts violating acceptable use will be suspended immediately.
            </p>

            <h2 className="font-heading text-sm font-bold text-[#FAFAFA]">3. Storage Quotas</h2>
            <p>
              Approved accounts are granted a 500 GB storage quota. Exceeding assigned quota limits will prevent further file uploads until disk space is reclaimed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
