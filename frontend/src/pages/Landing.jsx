import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Lock, Menu, X, KeyRound, PackageOpen,
  FolderTree, Gauge, UserCheck, CheckCircle2, Clock, ShieldAlert, Sparkles, FolderOpen
} from 'lucide-react';
import { useAuth } from '../auth';
import { Logo } from '../components/ui';
import { HeroStoryboard } from '../components/animations/HeroStoryboard';
import { Reveal } from '../components/animations/Reveal';

export default function Landing() {
  const { user } = useAuth();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeFlowStep, setActiveFlowStep] = useState(0);
  const menuRef = useRef(null);
  const flowSectionRef = useRef(null);

  // Close mobile menu on Escape key or outside click
  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && setMobileMenu(false);
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenu(false);
      }
    };
    if (mobileMenu) {
      document.addEventListener('keydown', handleKey);
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [mobileMenu]);

  // Scroll listener to illuminate Flow Stepper step by step on scroll
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const handleScroll = () => {
      if (!flowSectionRef.current) return;
      const rect = flowSectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how far down the section we've scrolled (0 to 1)
      const progress = Math.min(Math.max((windowHeight - rect.top) / (rect.height + windowHeight * 0.5), 0), 1);
      const step = Math.min(Math.floor(progress * 5), 4);
      setActiveFlowStep(step);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const flowSteps = [
    {
      num: '01',
      title: 'Request Access',
      desc: 'Submit your email and name on the registration form. No instant automatic access without verification.',
      icon: Clock,
    },
    {
      num: '02',
      title: 'Admin Review',
      desc: 'An administrator reviews your account request in the admin control panel.',
      icon: UserCheck,
    },
    {
      num: '03',
      title: 'Account Approval',
      desc: 'Upon admin authorization, your space is activated and your login credentials unlocked.',
      icon: CheckCircle2,
    },
    {
      num: '04',
      title: 'Sign In',
      desc: 'Authenticate with your password to access your workspace and zero-knowledge Keyring.',
      icon: Lock,
    },
    {
      num: '05',
      title: 'Use Workspace',
      desc: 'Upload files to My Stash, generate Drop Box links, and store passwords in your encrypted vault.',
      icon: FolderOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] font-sans">
      {/* 1. FLOATING NAVBAR (Detached rounded-2xl, NOT fixed / NOT sticky, max-w-[1000px], scrolls with page) */}
      <div className="pt-4 px-4 sm:pt-6 sm:px-6">
        <header
          ref={menuRef}
          className="mx-auto max-w-[1000px] rounded-2xl border border-[#26262B] bg-[#0F0F12] px-4 py-3 relative shadow-sm"
        >
          <div className="flex items-center justify-between">
            <Link to="/" aria-label="Stowly home" className="group flex items-center gap-2">
              <Logo />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden items-center gap-6 font-mono text-xs text-[#9A9AA3] md:flex">
              <a href="#overview" className="transition-colors hover:text-[#FAFAFA] cursor-pointer">OVERVIEW</a>
              <a href="#how-it-works" className="transition-colors hover:text-[#FAFAFA] cursor-pointer">HOW IT WORKS</a>
              <a href="#flow" className="transition-colors hover:text-[#FAFAFA] cursor-pointer">THE FLOW</a>
            </nav>

            {/* Auth Actions */}
            <div className="flex items-center gap-2.5">
              {user ? (
                <Link
                  to={user.role === 'ADMIN' ? '/admin' : '/app'}
                  className="btn btn-primary btn-sm font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Open Space ({user.name.split(' ')[0]})</span>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline btn-sm text-xs cursor-pointer">
                    Sign in
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm text-xs cursor-pointer">
                    Request access
                  </Link>
                </>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenu((m) => !m)}
                className="md:hidden rounded-xl border border-[#26262B] bg-[#16161A] p-2 text-[#FAFAFA] hover:bg-[#26262B] cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenu ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Panel */}
          {mobileMenu && (
            <div className="mt-3 pt-3 border-t border-[#26262B] md:hidden space-y-1 animate-in fade-in duration-150">
              <a
                href="#overview"
                onClick={() => setMobileMenu(false)}
                className="block min-h-[44px] px-3 py-2 rounded-xl font-mono text-xs font-semibold text-[#FAFAFA] hover:bg-[#16161A] flex items-center cursor-pointer"
              >
                OVERVIEW
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenu(false)}
                className="block min-h-[44px] px-3 py-2 rounded-xl font-mono text-xs font-semibold text-[#FAFAFA] hover:bg-[#16161A] flex items-center cursor-pointer"
              >
                HOW IT WORKS
              </a>
              <a
                href="#flow"
                onClick={() => setMobileMenu(false)}
                className="block min-h-[44px] px-3 py-2 rounded-xl font-mono text-xs font-semibold text-[#FAFAFA] hover:bg-[#16161A] flex items-center cursor-pointer"
              >
                THE FLOW
              </a>
            </div>
          )}
        </header>
      </div>

      {/* SECTION 1: OVERVIEW (HERO) */}
      <section id="overview" className="mx-auto max-w-[1000px] px-4 pt-10 pb-16 sm:px-6 md:pt-14 md:pb-20">
        <div className="grid gap-8 lg:grid-cols-12 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#26262B] bg-[#0F0F12] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#9A9AA3]">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              <span>PRIVATE WORKSPACE & KEYRING VAULT</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-[#FAFAFA] leading-[1.08]">
              Private cloud workspace built for privacy.
            </h1>

            <p className="text-xs sm:text-sm text-[#9A9AA3] font-sans leading-relaxed">
              Stowly provides a private cloud workspace featuring My Stash file management, an encrypted password Keyring, isolated Drop Boxes, and administrator-approved user accounts.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {user ? (
                <Link to={user.role === 'ADMIN' ? '/admin' : '/app'} className="btn btn-primary rounded-2xl px-5 py-2.5 flex items-center gap-2 cursor-pointer font-semibold text-xs">
                  <span>Open Workspace</span>
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <Link to="/register" className="btn btn-primary rounded-2xl px-5 py-2.5 flex items-center gap-2 cursor-pointer font-semibold text-xs">
                  <span>Request Access</span>
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </div>

          {/* Right Hero Storyboard (Looping interactive simulation) */}
          <div className="lg:col-span-6">
            <HeroStoryboard />
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section id="how-it-works" className="border-t border-[#26262B] bg-[#0F0F12] py-16 md:py-20">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
          <div className="mb-10 text-left max-w-xl">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9AA3]">
              CORE COMPONENTS
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA] mt-1">
              How Stowly works in plain words
            </h2>
            <p className="text-xs text-[#9A9AA3] mt-1">
              Five specialized tools working together inside your private account.
            </p>
          </div>

          {/* Plain Words Feature Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. My Stash */}
            <Reveal>
              <div className="card rounded-2xl p-5 bg-[#16161A] border border-[#26262B] h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0F0F12] border border-[#26262B] text-brand-400">
                      <FolderOpen size={16} />
                    </span>
                    <h3 className="font-heading text-sm font-bold text-[#FAFAFA]">My Stash</h3>
                  </div>
                  <p className="text-xs text-[#9A9AA3] leading-relaxed">
                    Your primary file drive. Drag and drop single or multiple files, create folder hierarchies, pin items, tag, search, and preview images, video, audio, PDFs, and code files in app.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* 2. Smart Shelves */}
            <Reveal delay={100}>
              <div className="card rounded-2xl p-5 bg-[#16161A] border border-[#26262B] h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0F0F12] border border-[#26262B] text-brand-400">
                      <FolderTree size={16} />
                    </span>
                    <h3 className="font-heading text-sm font-bold text-[#FAFAFA]">Smart Shelves</h3>
                  </div>
                  <p className="text-xs text-[#9A9AA3] leading-relaxed">
                    Automatic virtual views that categorize your workspace into Documents, Media, Archives, Large Heavy Files, and Duplicate candidates without manual file moves.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* 3. Drop Boxes */}
            <Reveal delay={150}>
              <div className="card rounded-2xl p-5 bg-[#16161A] border border-[#26262B] h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0F0F12] border border-[#26262B] text-brand-400">
                      <PackageOpen size={16} />
                    </span>
                    <h3 className="font-heading text-sm font-bold text-[#FAFAFA]">Drop Boxes</h3>
                  </div>
                  <p className="text-xs text-[#9A9AA3] leading-relaxed">
                    Single-purpose public links (<code className="font-mono text-[11px] text-brand-400">/drop/:token</code>) allowing external guests to submit files directly to your account with file size, count, and expiration limits.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* 4. Keyring */}
            <Reveal delay={200}>
              <div className="card rounded-2xl p-5 bg-[#16161A] border border-[#26262B] h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0F0F12] border border-[#26262B] text-brand-400">
                      <KeyRound size={16} />
                    </span>
                    <h3 className="font-heading text-sm font-bold text-[#FAFAFA]">Keyring Vault</h3>
                  </div>
                  <p className="text-xs text-[#9A9AA3] leading-relaxed">
                    Zero-knowledge password manager encrypted inside your browser using AES-GCM encryption and master password key derivation. Unencrypted keys never touch our servers.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* 5. Space Pulse */}
            <Reveal delay={250} className="sm:col-span-2 lg:col-span-2">
              <div className="card rounded-2xl p-5 bg-[#16161A] border border-[#26262B] h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0F0F12] border border-[#26262B] text-brand-400">
                      <Gauge size={16} />
                    </span>
                    <h3 className="font-heading text-sm font-bold text-[#FAFAFA]">Space Pulse</h3>
                  </div>
                  <p className="text-xs text-[#9A9AA3] leading-relaxed">
                    Workspace analytics breakdown showing real storage distribution across file extensions, category volumes, trash items, and active drop box statistics.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE FLOW (Step-by-step Journey Stepper) */}
      <section id="flow" ref={flowSectionRef} className="mx-auto max-w-[1000px] px-4 py-16 sm:px-6 md:py-24">
        <div className="mb-12 text-left max-w-xl">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9A9AA3]">
            ACCOUNT JOURNEY
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA] mt-1">
            The 5-step approval flow
          </h2>
          <p className="text-xs text-[#9A9AA3] mt-1">
            Every Stowly account follows a structured access pipeline to ensure high availability and security.
          </p>
        </div>

        {/* Animated Stepper Steps */}
        <div className="relative space-y-4">
          {/* Vertical Connecting Line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-[#26262B] hidden sm:block" />

          {flowSteps.map((s, idx) => {
            const isActive = idx <= activeFlowStep;
            const Icon = s.icon;

            return (
              <div
                key={s.num}
                onClick={() => setActiveFlowStep(idx)}
                className={`card rounded-2xl p-4 sm:p-5 border transition-all duration-300 cursor-pointer relative ${
                  isActive
                    ? 'bg-[#0F0F12] border-brand-500/60 shadow-lg'
                    : 'bg-[#0F0F12]/50 border-[#26262B] opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Step Badge / Icon */}
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-mono text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-brand-500 text-white border border-brand-400/40'
                        : 'bg-[#16161A] text-[#9A9AA3] border border-[#26262B]'
                    }`}
                  >
                    <Icon size={18} />
                  </span>

                  {/* Step Description */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                        STEP {s.num}
                      </span>
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
                      )}
                    </div>
                    <h3 className="font-heading text-sm font-bold text-[#FAFAFA] mt-0.5">{s.title}</h3>
                    <p className="text-xs text-[#9A9AA3] mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Banner at bottom of flow */}
        <div className="mt-12 text-center card rounded-2xl p-8 bg-[#0F0F12] border border-[#26262B]">
          <h3 className="text-lg font-bold text-[#FAFAFA]">Ready to request your Stowly workspace?</h3>
          <p className="text-xs text-[#9A9AA3] max-w-md mx-auto mt-1 mb-4">
            Submit your account request and an administrator will review your application.
          </p>
          <div className="flex justify-center gap-3">
            {user ? (
              <Link to={user.role === 'ADMIN' ? '/admin' : '/app'} className="btn btn-primary rounded-2xl cursor-pointer">
                Go to Workspace
              </Link>
            ) : (
              <Link to="/register" className="btn btn-primary rounded-2xl cursor-pointer">
                Request Access Now
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ONE-LINE FOOTER (Logo and copyright only) */}
      <footer className="border-t border-[#26262B] bg-[#09090B] py-4 text-xs text-[#9A9AA3] font-mono">
        <div className="mx-auto max-w-[1000px] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <span>&copy; {new Date().getFullYear()} Stowly. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
