import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { PageLoader } from './components/ui';
import { UserLayout, AdminLayout } from './layouts/Layouts';

import Landing from './pages/Landing';
import { Login, Register } from './pages/AuthPages';
import DropPublic from './pages/DropPublic';

import Home from './pages/Home';
import FileBrowser from './pages/FileBrowser';
import Shelves from './pages/Shelves';
import DropBoxes from './pages/DropBoxes';
import SpacePulse from './pages/SpacePulse';
import Keyring from './pages/keyring/Keyring';
import { AllKeys, TopKeys, KeyGroups, KeyEditor, KeyForge, KeyringSettings } from './pages/keyring/KeyringPages';
import Settings, { Profile, Shield, Devices, Alerts, Personalize } from './pages/Settings';
import { AdminHome, AdminUsers } from './pages/Admin';

function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/app" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/drop/:token" element={<DropPublic />} />

      {/* App Workspace */}
      <Route path="/app" element={<Protected><UserLayout /></Protected>}>
        <Route index element={<Home />} />
        <Route path="files" element={<FileBrowser mode="all" />} />
        <Route path="recent" element={<FileBrowser mode="recent" />} />
        <Route path="pinned" element={<FileBrowser mode="starred" />} />
        <Route path="shelves" element={<Shelves />} />
        <Route path="dropboxes" element={<DropBoxes />} />
        <Route path="pulse" element={<SpacePulse />} />
        <Route path="bin" element={<FileBrowser mode="trash" />} />
        <Route path="keyring" element={<Keyring />}>
          <Route index element={<Navigate to="all" replace />} />
          <Route path="all" element={<AllKeys />} />
          <Route path="favorites" element={<TopKeys />} />
          <Route path="groups" element={<KeyGroups />} />
          <Route path="new" element={<KeyEditor />} />
          <Route path="edit/:id" element={<KeyEditor />} />
          <Route path="forge" element={<KeyForge />} />
          <Route path="settings" element={<KeyringSettings />} />
        </Route>
        <Route path="settings" element={<Settings />}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<Profile />} />
          <Route path="shield" element={<Shield />} />
          <Route path="devices" element={<Devices />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="personalize" element={<Personalize />} />
        </Route>
      </Route>

      {/* Admin Panel */}
      <Route path="/admin" element={<Protected admin><AdminLayout /></Protected>}>
        <Route index element={<AdminHome />} />
        <Route path="pending" element={<AdminUsers pendingOnly />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
