import { Clock, FolderOpen, Gauge, KeyRound, LayoutGrid, PackageOpen, Pin, Settings, ShieldCheck, Trash2, Sparkles, Users, UserCheck, LayoutDashboard } from 'lucide-react';
import Shell from '../components/Shell';

export const UserLayout = () => (
  <Shell
    sections={[
      {
        heading: 'Workspace',
        items: [
          { to: '/app', label: 'Home Base', icon: LayoutGrid, end: true },
          { to: '/app/files', label: 'My Stash', icon: FolderOpen },
          { to: '/app/recent', label: 'Just Opened', icon: Clock },
          { to: '/app/pinned', label: 'Pinned', icon: Pin },
          { to: '/app/shelves', label: 'Smart Shelves', icon: Sparkles },
          { to: '/app/dropboxes', label: 'Drop Boxes', icon: PackageOpen },
          { to: '/app/pulse', label: 'Space Pulse', icon: Gauge },
          { to: '/app/bin', label: 'Recycle Bin', icon: Trash2 },
        ],
      },
      {
        heading: 'Private',
        items: [
          { to: '/app/keyring', label: 'Keyring', icon: KeyRound },
          { to: '/app/settings', label: 'Settings', icon: Settings },
        ],
      },
    ]}
    mobileTabs={[
      { to: '/app', label: 'Home', icon: LayoutGrid, end: true },
      { to: '/app/files', label: 'Stash', icon: FolderOpen },
      { to: '/app/keyring', label: 'Keyring', icon: KeyRound },
      { to: '/app/dropboxes', label: 'Boxes', icon: PackageOpen },
    ]}
  />
);

export const AdminLayout = () => (
  <Shell
    sections={[
      {
        heading: 'Control Room',
        items: [
          { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
          { to: '/admin/pending', label: 'Pending Requests', icon: UserCheck },
          { to: '/admin/users', label: 'All Members', icon: Users },
        ],
      },
    ]}
    footerLink={{ to: '/app', label: 'Open my workspace', icon: ShieldCheck }}
    mobileTabs={[
      { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/admin/pending', label: 'Pending', icon: UserCheck },
      { to: '/admin/users', label: 'Members', icon: Users },
      { to: '/app', label: 'My space', icon: ShieldCheck },
    ]}
  />
);
