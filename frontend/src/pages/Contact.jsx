import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageSquare, Send, CheckCircle2, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react';
import { Logo } from '../components/ui';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General Query', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
      {/* Floating Navbar */}
      <header className="sticky top-3 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-6xl">
        <nav className="card flex items-center justify-between px-4 py-3 bg-[#0F0F12]/90 border border-[#26262B] rounded-2xl backdrop-blur-md">
          <Link to="/" aria-label="Stowly home" className="group">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/help" className="text-xs text-[#9A9AA3] hover:text-[#FAFAFA] transition-colors cursor-pointer hidden sm:inline-block">
              Help Center
            </Link>
            <Link to="/login" className="btn btn-outline btn-sm">
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16161A] border border-[#26262B] px-3 py-1 text-xs font-mono text-brand-400 mb-4">
            <MessageSquare size={14} /> Get in Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#FAFAFA]">
            We'd love to hear from you
          </h1>
          <p className="mt-3 text-sm text-[#9A9AA3]">
            Have a question about zero-knowledge encryption, your admin account, or enterprise limits? Our engineering team responds within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info Side Column */}
          <div className="space-y-4">
            <div className="card p-6 bg-[#0F0F12] border border-[#26262B] rounded-2xl">
              <div className="flex items-center gap-3 mb-3 text-brand-400">
                <Mail size={20} />
                <h3 className="font-semibold text-[#FAFAFA]">Direct Support</h3>
              </div>
              <p className="text-xs text-[#9A9AA3] mb-2">Email our core security operations directly.</p>
              <a href="mailto:support@stowly.io" className="font-mono text-xs text-brand-400 hover:underline cursor-pointer">
                support@stowly.io
              </a>
            </div>

            <div className="card p-6 bg-[#0F0F12] border border-[#26262B] rounded-2xl">
              <div className="flex items-center gap-3 mb-3 text-brand-400">
                <ShieldCheck size={20} />
                <h3 className="font-semibold text-[#FAFAFA]">Security & Vulnerabilities</h3>
              </div>
              <p className="text-xs text-[#9A9AA3] mb-2">Responsible disclosure & PGP keyring verification.</p>
              <a href="mailto:security@stowly.io" className="font-mono text-xs text-brand-400 hover:underline cursor-pointer">
                security@stowly.io
              </a>
            </div>

            <div className="card p-6 bg-[#0F0F12] border border-[#26262B] rounded-2xl">
              <div className="flex items-center gap-3 mb-3 text-brand-400">
                <HelpCircle size={20} />
                <h3 className="font-semibold text-[#FAFAFA]">Help & Docs</h3>
              </div>
              <p className="text-xs text-[#9A9AA3] mb-3">Browse common questions about drop boxes and password vaults.</p>
              <Link to="/help" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:underline cursor-pointer">
                Visit Help Center <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-2">
            <div className="card p-6 sm:p-8 bg-[#0F0F12] border border-[#26262B] rounded-2xl">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-[#FAFAFA]">Message Received</h2>
                  <p className="text-xs text-[#9A9AA3] max-w-md mx-auto">
                    Thank you for contacting Stowly support. A ticket has been dispatched to our support team and we will respond to <span className="text-[#FAFAFA] font-mono">{form.email}</span> shortly.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: 'General Query', message: '' }); }}
                    className="btn btn-outline btn-sm rounded-2xl mt-4 cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#9A9AA3] mb-1.5">Your Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Alex Vance"
                        className="input w-full rounded-2xl bg-[#16161A] border-[#26262B] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#9A9AA3] mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="alex@example.com"
                        className="input w-full rounded-2xl bg-[#16161A] border-[#26262B] text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#9A9AA3] mb-1.5">Topic</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="input w-full rounded-2xl bg-[#16161A] border-[#26262B] text-xs cursor-pointer"
                    >
                      <option value="General Query">General Query</option>
                      <option value="Account Approval">Account Approval Status</option>
                      <option value="Keyring & Zero Knowledge">Keyring & Encryption</option>
                      <option value="Storage Quota Limit">Storage Quota Limit</option>
                      <option value="Report an Issue">Report an Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#9A9AA3] mb-1.5">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe how we can assist you..."
                      className="input w-full rounded-2xl bg-[#16161A] border-[#26262B] text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full rounded-2xl justify-center py-2.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">Sending...</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send size={15} /> Submit Inquiry
                      </span>
                    )}
                  </button>
                </form>
              )}
            </div>
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
