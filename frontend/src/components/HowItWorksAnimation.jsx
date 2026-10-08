import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, ShieldCheck, FolderOpen, KeyRound, PackageOpen, Gauge,
  Check, Lock, Sparkles, UploadCloud, FileText, Image as ImageIcon,
  Copy, CheckCircle2
} from 'lucide-react';

const steps = [
  {
    id: 'approval',
    number: '01',
    title: 'Approval-First Access',
    subtitle: 'Trusted community protection',
    description: 'Every new user signs up and waits for an administrator to review their request before getting access to the cloud workspace.',
    icon: UserCheck,
    color: 'from-brand-600 to-indigo-600',
    badgeTone: 'bg-[#18181C] text-brand-300 border-[#26262B]',
  },
  {
    id: 'stash',
    number: '02',
    title: 'My Stash & Smart Shelves',
    subtitle: 'Self-organizing storage',
    description: 'Upload any file type. Stowly automatically categorizes your files into pictures, documents, videos, and large items.',
    icon: FolderOpen,
    color: 'from-indigo-600 to-purple-600',
    badgeTone: 'bg-[#18181C] text-indigo-300 border-[#26262B]',
  },
  {
    id: 'keyring',
    number: '03',
    title: 'Zero-Knowledge Keyring',
    subtitle: 'Browser-side AES-256 encryption',
    description: 'Passwords and secrets are encrypted inside your browser with a master password that only you know. We store ciphertext, never plain secrets.',
    icon: KeyRound,
    color: 'from-purple-600 to-pink-600',
    badgeTone: 'bg-[#18181C] text-purple-300 border-[#26262B]',
  },
  {
    id: 'dropboxes',
    number: '04',
    title: 'Private Drop Boxes',
    subtitle: 'Secure external file collecting',
    description: 'Create dedicated drop links so clients or team members can submit files directly to your stash without seeing your account.',
    icon: PackageOpen,
    color: 'from-emerald-600 to-teal-600',
    badgeTone: 'bg-[#18181C] text-emerald-400 border-[#26262B]',
  },
  {
    id: 'pulse',
    number: '05',
    title: 'Space Pulse Analytics',
    subtitle: 'Storage insights & duplicate finder',
    description: 'Spot look-alike files, identify files gathering dust, and optimize your storage space with instant actionable recommendations.',
    icon: Gauge,
    color: 'from-amber-500 to-orange-600',
    badgeTone: 'bg-[#18181C] text-amber-400 border-[#26262B]',
  },
];

export default function HowItWorksAnimation() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle through steps continuously unless paused by hover
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const activeStep = steps[activeStepIndex];

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-[#26262B] bg-[#111114] p-6 sm:p-8 text-[#FAFAFA] shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Ambient Light Glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />

      {/* Header section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#26262B] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#18181C] border border-[#26262B] px-3.5 py-1 text-xs font-bold text-brand-300">
            <Sparkles size={14} className="text-brand-400" />
            <span>Interactive System Simulator</span>
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-[#FAFAFA]">
            How Stowly Works
          </h2>
        </div>

        {/* Continuous Progress Dots */}
        <div className="flex items-center gap-2">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setActiveStepIndex(idx)}
              className={`h-2.5 transition-all duration-300 rounded-full cursor-pointer ${
                idx === activeStepIndex
                  ? 'w-8 bg-gradient-to-r from-brand-600 to-indigo-600 shadow-xs'
                  : 'w-2.5 bg-[#26262B] hover:bg-[#3f3f46]'
              }`}
              aria-label={`Jump to step ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Interactive Tabs Row */}
      <div className="relative z-10 mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeStepIndex;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStepIndex(idx)}
              className={`group flex items-center gap-2.5 rounded-2xl p-3 text-left transition-all duration-300 cursor-pointer border ${
                isActive
                  ? 'border-[#26262B] bg-[#18181C] text-[#FAFAFA] shadow-xs translate-y-[-1px]'
                  : 'border-[#26262B]/50 bg-[#0C0C0F] hover:bg-[#18181C] text-[#9A9AA3]'
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xs'
                    : 'bg-[#18181C] text-[#9A9AA3] group-hover:bg-[#26262B] group-hover:text-[#FAFAFA]'
                }`}
              >
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1 hidden sm:block">
                <p className="truncate text-xs font-bold text-[#FAFAFA]">{step.title}</p>
                <p className="truncate text-[10px] text-[#9A9AA3] font-semibold">Step {step.number}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Animated Showcase Grid */}
      <div className="relative z-10 mt-6 grid gap-6 lg:grid-cols-12 items-center">
        {/* Left Side: Step Info */}
        <div className="lg:col-span-5 space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-brand-400">Step {activeStep.number}</span>
                <span className="text-xs uppercase tracking-wider text-[#9A9AA3] font-bold">• {activeStep.subtitle}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#FAFAFA]">{activeStep.title}</h3>
              <p className="text-sm leading-relaxed text-[#9A9AA3] font-medium">{activeStep.description}</p>
              
              <div className="pt-1 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 px-3 py-1 font-bold text-[#22C55E]">
                  <CheckCircle2 size={13} /> Automated Workflow
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 px-3 py-1 font-bold text-brand-300">
                  <ShieldCheck size={13} /> AES-256 Vault
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Visual Canvas */}
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-2xl border border-[#26262B] bg-[#0C0C0F] p-5 shadow-inner min-h-[250px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeStepIndex === 0 && <Step01VisualLight key="step0" />}
              {activeStepIndex === 1 && <Step02VisualLight key="step1" />}
              {activeStepIndex === 2 && <Step03VisualLight key="step2" />}
              {activeStepIndex === 3 && <Step04VisualLight key="step3" />}
              {activeStepIndex === 4 && <Step05VisualLight key="step4" />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Step 1 Visual */
function Step01VisualLight() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="w-full space-y-3"
    >
      <div className="flex items-center justify-between text-xs text-[#9A9AA3] border-b border-[#26262B] pb-2">
        <span className="flex items-center gap-2 font-bold"><UserCheck size={16} className="text-brand-400" /> Account Approval Flow</span>
        <span className="rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">Pending Approval</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#26262B] bg-[#111114] p-3.5 space-y-2 shadow-xs">
          <p className="text-xs font-bold text-[#FAFAFA]">1. Registration Request</p>
          <div className="flex items-center gap-2.5 rounded-lg bg-[#18181C] p-2 text-xs">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white font-bold">AK</div>
            <div className="min-w-0">
              <p className="font-bold text-[#FAFAFA] truncate">Alex Morgan</p>
              <p className="text-[10px] text-[#9A9AA3]">alex@example.com</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-3.5 space-y-2 relative shadow-xs">
          <p className="text-xs font-bold text-[#22C55E]">2. Admin Approved</p>
          <div className="flex items-center gap-2 rounded-lg bg-[#111114] border border-[#22C55E]/30 p-2 text-xs text-[#22C55E] font-bold">
            <Check size={16} className="text-[#22C55E] shrink-0" />
            <span>500 GB Access Granted</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* Step 2 Visual */
function Step02VisualLight() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="w-full space-y-3"
    >
      <div className="flex items-center justify-between text-xs text-[#9A9AA3]">
        <span className="flex items-center gap-1.5 font-bold"><UploadCloud size={16} className="text-brand-400" /> Auto-Sorting Shelves</span>
        <span className="text-[11px] text-[#9A9AA3] font-semibold">Pre-Compressed Upload</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { name: 'Pictures', icon: ImageIcon, color: 'border-[#26262B] bg-[#111114] text-sky-400', count: '142 files' },
          { name: 'Documents', icon: FileText, color: 'border-[#26262B] bg-[#111114] text-brand-300', count: '58 files' },
          { name: 'Heavy Hitters', icon: Sparkles, color: 'border-[#26262B] bg-[#111114] text-purple-400', count: '12 files' },
        ].map((item) => (
          <div key={item.name} className={`rounded-xl border ${item.color} p-3 text-center space-y-1 shadow-xs`}>
            <item.icon size={20} className="mx-auto" />
            <p className="text-xs font-bold text-[#FAFAFA]">{item.name}</p>
            <p className="text-[10px] font-medium text-[#9A9AA3]">{item.count}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* Step 3 Visual */
function Step03VisualLight() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="w-full space-y-3"
    >
      <div className="flex items-center justify-between text-xs text-[#9A9AA3] border-b border-[#26262B] pb-2">
        <span className="flex items-center gap-2 font-bold"><Lock size={16} className="text-purple-400" /> Client-Side Encryption</span>
        <span className="font-mono text-[10px] text-purple-300 font-bold">AES-256-GCM</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        <div className="rounded-xl border border-[#26262B] bg-[#111114] p-3 space-y-1 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#9A9AA3]">In Your Browser</span>
          <p className="font-mono text-xs text-[#22C55E] bg-[#18181C] p-2 rounded border border-[#26262B] font-semibold">
            password: P@ssw0rd2026!
          </p>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 space-y-1 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-purple-300">Stored on Server</span>
          <p className="font-mono text-[11px] text-purple-200 bg-[#111114] p-2 rounded border border-purple-500/30 truncate font-semibold">
            e3b0c44298fc1c149afbf4c8996fb924
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* Step 4 Visual */
function Step04VisualLight() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="w-full space-y-3"
    >
      <div className="flex items-center justify-between text-xs text-[#9A9AA3]">
        <span className="flex items-center gap-2 font-bold"><PackageOpen size={16} className="text-[#22C55E]" /> Drop Box Submission Link</span>
        <span className="text-[#22C55E] text-[10px] font-bold">Active</span>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-3 text-xs shadow-xs">
        <code className="text-[#22C55E] font-mono font-semibold truncate">stowly.app/drop/client-project-99</code>
        <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-white font-bold flex items-center gap-1 shrink-0">
          <Copy size={12} /> Copy
        </span>
      </div>
    </motion.div>
  );
}

/* Step 5 Visual */
function Step05VisualLight() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="w-full space-y-3"
    >
      <div className="flex items-center justify-between text-xs text-[#9A9AA3]">
        <span className="flex items-center gap-2 font-bold"><Gauge size={16} className="text-amber-400" /> Real-time Storage Pulse</span>
        <span className="text-[#FAFAFA] font-bold text-[11px]">2.4 GB / 500 GB</span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-[#18181C] p-0.5 border border-[#26262B]">
        <div className="h-full w-[15%] rounded-full bg-gradient-to-r from-brand-500 to-indigo-500" />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 shadow-xs">
          <p className="text-[10px] text-amber-400 font-bold">Look-alikes found</p>
          <p className="text-sm font-extrabold text-[#FAFAFA]">4 files (420 MB)</p>
        </div>
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-2.5 shadow-xs">
          <p className="text-[10px] text-sky-400 font-bold">Never opened</p>
          <p className="text-sm font-extrabold text-[#FAFAFA]">8 files</p>
        </div>
      </div>
    </motion.div>
  );
}

