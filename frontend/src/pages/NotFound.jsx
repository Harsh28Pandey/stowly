import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, KeyRound } from 'lucide-react';
import { Logo } from '../components/ui';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
      {/* Floating Navbar */}
      <header className="sticky top-3 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-6xl">
        <nav className="card flex items-center justify-between px-4 py-3 bg-[#0F0F12]/90 border border-[#26262B] rounded-2xl backdrop-blur-md">
          <Link to="/" aria-label="Stowly home" className="group">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-outline btn-sm rounded-2xl">
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      {/* 404 Main Banner */}
      <main className="flex-1 grid place-items-center px-4 py-16">
        <div className="text-center max-w-md mx-auto space-y-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F43F5E]/10 border border-[#F43F5E]/20 text-[#F43F5E]">
            <ShieldAlert size={40} />
          </div>

          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#F43F5E]">404 ERROR</span>
            <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA] mt-1">Page Not Found</h1>
            <p className="text-xs text-[#9A9AA3] mt-2 leading-relaxed">
              The link or resource you followed does not exist, may have expired, or has been moved to an encrypted location.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/" className="btn btn-primary rounded-2xl w-full sm:w-auto justify-center cursor-pointer">
              <Home size={15} /> Return Home
            </Link>
            <Link to="/app" className="btn btn-outline rounded-2xl w-full sm:w-auto justify-center cursor-pointer">
              <KeyRound size={15} /> Go to Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#26262B] bg-[#0F0F12] py-6 text-center text-xs text-[#9A9AA3]">
        <p>&copy; {new Date().getFullYear()} Stowly Storage Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
