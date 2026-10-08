import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, HelpCircle, Shield, KeyRound, HardDrive, PackageOpen, ArrowRight } from 'lucide-react';
import { Logo } from '../components/ui';

const FAQS = [
  {
    category: 'Account & Access',
    icon: Shield,
    items: [
      {
        q: 'Why does my new account show "Pending Approval"?',
        a: 'Stowly requires admin authorization for every new registration to maintain peak security standards and prevent resource abuse. Once an admin approves your request, you can log in immediately.'
      },
      {
        q: 'What happens if my account is suspended or rejected?',
        a: 'If your access is suspended or rejected by an administrator, login attempts will display a distinct notification explaining your current status. You can contact support for account appeals.'
      },
      {
        q: 'How does session timeout work?',
        a: 'When your session expires or you log out in one tab, Stowly automatically revokes active tokens across tabs and redirects you back to the login page with your intended return URL preserved.'
      }
    ]
  },
  {
    category: 'Keyring & Encryption',
    icon: KeyRound,
    items: [
      {
        q: 'Is my Keyring master password stored on Stowly servers?',
        a: 'No! Stowly operates on a strict zero-knowledge architecture. Your Master Password is used strictly inside your browser web workers to generate AES-GCM encryption keys. We never store or transmit your unencrypted master key.'
      },
      {
        q: 'What happens if I forget my Keyring Master Password?',
        a: 'Because of zero-knowledge client-side encryption, Stowly cannot reset or recover forgotten Master Passwords. We strongly recommend exporting a backup copy of your vault items in Keyring Settings.'
      },
      {
        q: 'What is the Key Forge password generator?',
        a: 'Key Forge allows you to create high-entropy passwords with custom length, symbols, digits, and instant strength scoring before storing them safely in your vault.'
      }
    ]
  },
  {
    category: 'Files & Storage',
    icon: HardDrive,
    items: [
      {
        q: 'What file formats can I preview inside Stowly?',
        a: 'Stowly features an in-app viewer supporting high-resolution Images (PNG, JPG, SVG, WebP), HD Video (MP4, WebM), Audio streams, PDF documents, and Code/Plain Text files.'
      },
      {
        q: 'How does the Recycle Bin work?',
        a: 'Items moved to the Recycle Bin do not count against your active workspace layout but can be restored at any time or deleted permanently when you empty the bin.'
      },
      {
        q: 'What happens when I reach 80% or 100% storage limit?',
        a: 'When storage reaches 80%, a warning banner appears in your sidebar footer. At 100%, file uploads are blocked until space is cleared or quota upgraded by an admin.'
      }
    ]
  },
  {
    category: 'Drop Boxes',
    icon: PackageOpen,
    items: [
      {
        q: 'How do Drop Boxes allow external file collection?',
        a: 'Drop Boxes generate secure public links (`/drop/:token`) where external guests can upload files directly to your account without needing a Stowly login.'
      },
      {
        q: 'Can I enforce limits on Drop Box uploads?',
        a: 'Yes! Every Drop Box can enforce maximum file size limits, maximum upload counts, specific file extensions (e.g. PDF or Images only), and automatic expiration dates.'
      }
    ]
  }
];

export default function Help() {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState({});

  const toggle = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`;
    setOpenIndex((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFaqs = FAQS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
      {/* Floating Navbar */}
      <header className="sticky top-3 z-40 mx-auto w-[calc(100%-1.5rem)] max-w-6xl">
        <nav className="card flex items-center justify-between px-4 py-3 bg-[#0F0F12]/90 border border-[#26262B] rounded-2xl backdrop-blur-md">
          <Link to="/" aria-label="Stowly home" className="group">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/contact" className="text-xs text-[#9A9AA3] hover:text-[#FAFAFA] transition-colors cursor-pointer hidden sm:inline-block">
              Contact Support
            </Link>
            <Link to="/login" className="btn btn-outline btn-sm">
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#16161A] border border-[#26262B] px-3 py-1 text-xs font-mono text-brand-400 mb-4">
            <HelpCircle size={14} /> Knowledge Base & FAQs
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#FAFAFA]">
            How can we help you?
          </h1>
          <p className="mt-2 text-sm text-[#9A9AA3]">
            Search our documented guides for answers on security, file limits, and Keyring vaulting.
          </p>

          {/* Search Box */}
          <div className="mt-6 relative max-w-xl mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9AA3]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help topics (e.g. Master password, limits, drop boxes)..."
              className="input w-full rounded-2xl bg-[#0F0F12] border-[#26262B] pl-11 pr-4 py-3 text-sm focus:border-brand-500"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {filteredFaqs.length === 0 ? (
            <div className="card p-12 text-center rounded-2xl bg-[#0F0F12] border-[#26262B]">
              <p className="text-sm text-[#9A9AA3]">No matching articles found for "{search}".</p>
              <Link to="/contact" className="inline-flex items-center gap-1.5 text-xs text-brand-400 mt-3 font-semibold hover:underline cursor-pointer">
                Contact our support team <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            filteredFaqs.map((cat, cIdx) => (
              <div key={cIdx} className="space-y-3">
                <div className="flex items-center gap-2 text-brand-400 font-semibold text-base px-1">
                  <cat.icon size={18} />
                  <h2>{cat.category}</h2>
                </div>
                <div className="space-y-2">
                  {cat.items.map((item, iIdx) => {
                    const isOpen = openIndex[`${cIdx}-${iIdx}`];
                    return (
                      <div
                        key={iIdx}
                        className="card overflow-hidden bg-[#0F0F12] border border-[#26262B] rounded-2xl transition-colors"
                      >
                        <button
                          onClick={() => toggle(cIdx, iIdx)}
                          className="w-full flex items-center justify-between p-4 text-left font-medium text-xs sm:text-sm text-[#FAFAFA] hover:bg-[#16161A] transition-colors cursor-pointer"
                        >
                          <span>{item.q}</span>
                          {isOpen ? (
                            <ChevronUp size={16} className="text-[#9A9AA3] shrink-0 ml-2" />
                          ) : (
                            <ChevronDown size={16} className="text-[#9A9AA3] shrink-0 ml-2" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="p-4 pt-0 text-xs text-[#9A9AA3] leading-relaxed border-t border-[#26262B]/50 bg-[#16161A]/50">
                            <p className="mt-3">{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 card p-8 bg-[#0F0F12] border border-[#26262B] rounded-2xl text-center flex flex-col items-center">
          <h3 className="text-lg font-bold text-[#FAFAFA]">Still need assistance?</h3>
          <p className="text-xs text-[#9A9AA3] max-w-md mt-1 mb-4">
            Our support engineers are ready to answer technical inquiries and help configure custom limits for your deployment.
          </p>
          <Link to="/contact" className="btn btn-primary rounded-2xl cursor-pointer">
            Contact Support Team
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#26262B] bg-[#0F0F12] py-6 text-center text-xs text-[#9A9AA3]">
        <p>&copy; {new Date().getFullYear()} Stowly Storage Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
