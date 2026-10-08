import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/ui';

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy - Stowly';
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
              Privacy Policy
            </h1>
            <p className="font-mono text-xs text-[#9A9AA3] mt-1">Last updated: October 2026</p>
          </div>

          <div className="space-y-4 text-xs text-[#9A9AA3] leading-relaxed">
            <h2 className="font-heading text-sm font-bold text-[#FAFAFA]">1. Information We Collect</h2>
            <p>
              When you register for a Stowly account, we collect your name, email address, and hashed authentication password. We do not sell your data or profile your browsing activity.
            </p>

            <h2 className="font-heading text-sm font-bold text-[#FAFAFA]">2. Zero-Knowledge Keyring Vault Data</h2>
            <p>
              Passwords and credentials saved in your Keyring are encrypted inside your Web browser using AES-256-GCM. The unencrypted master password and secret values are never transmitted to our servers or stored in unencrypted form.
            </p>

            <h2 className="font-heading text-sm font-bold text-[#FAFAFA]">3. File Storage</h2>
            <p>
              Files uploaded to My Stash or received through Drop Boxes are stored privately. Only authorized account owners can access or download stored files.
            </p>

            <h2 className="font-heading text-sm font-bold text-[#FAFAFA]">4. Cookies & Local Session Storage</h2>
            <p>
              We use HTTP-only secure cookies and browser LocalStorage strictly for maintaining signed-in session state and local preferences.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
