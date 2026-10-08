import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api from './api';
import { useAuth } from './auth';
import { deriveKey, decryptJSON, encryptJSON, newSalt, VERIFIER_TEXT } from './crypto';

const VaultCtx = createContext(null);
export const useVault = () => useContext(VaultCtx);

export const CATEGORIES = ['Login', 'Banking', 'Social', 'Work', 'Personal', 'Wi-Fi', 'Server', 'API', 'Other'];

const domainOf = (url) => {
  try { return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, ''); } catch { return ''; }
};

export function VaultProvider({ children }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(null); // { initialized, salt, verifier, autoLockMinutes }
  const [statusLoading, setStatusLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [entries, setEntries] = useState([]);
  const keyRef = useRef(null);
  const timerRef = useRef(null);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const { data } = await api.get('/vault/status');
      setStatus(data);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const lock = useCallback((notifyServer = true) => {
    const wasUnlocked = keyRef.current !== null;
    keyRef.current = null; // drop the key and all decrypted data from memory
    setEntries([]);
    setUnlocked(false);
    clearTimeout(timerRef.current);
    if (wasUnlocked && notifyServer) api.post('/vault/event', { type: 'locked' }).catch(() => {});
  }, []);

  const loadEntries = useCallback(async () => {
    const { data } = await api.get('/vault/entries');
    const key = keyRef.current;
    if (!key) return;
    const out = [];
    for (const row of data.entries) {
      try {
        const p = await decryptJSON(key, row.payload);
        out.push({ id: row.id, category: row.category, favorite: row.favorite, updatedAt: row.updatedAt, ...p });
      } catch {
        out.push({ id: row.id, category: row.category, favorite: row.favorite, updatedAt: row.updatedAt, name: '(Unreadable entry)', url: '', username: '', password: '', notes: '', corrupt: true });
      }
    }
    setEntries(out);
  }, []);

  const unlock = async (master) => {
    const key = await deriveKey(master, status.salt);
    try {
      await decryptJSON(key, status.verifier);
    } catch {
      throw new Error('That master password is incorrect.');
    }
    keyRef.current = key;
    setUnlocked(true);
    api.post('/vault/event', { type: 'unlocked' }).catch(() => {});
    await loadEntries();
  };

  const setup = async (master) => {
    const salt = newSalt();
    const key = await deriveKey(master, salt);
    const verifier = await encryptJSON(key, VERIFIER_TEXT);
    await api.post('/vault/setup', { salt, verifier });
    await loadStatus();
    keyRef.current = key;
    setUnlocked(true);
    setEntries([]);
  };

  const saveEntry = async (data, id) => {
    const key = keyRef.current;
    if (!key) throw new Error('Your Keyring is locked.');
    const { category, favorite, ...secret } = data;
    const body = {
      payload: await encryptJSON(key, secret),
      category,
      favorite: Boolean(favorite),
      nameMeta: secret.name,
      domainMeta: domainOf(secret.url),
    };
    if (id) await api.patch(`/vault/entries/${id}`, body);
    else await api.post('/vault/entries', body);
    await loadEntries();
  };

  const toggleFavorite = async (entry) => {
    setEntries((list) => list.map((e) => (e.id === entry.id ? { ...e, favorite: !e.favorite } : e)));
    try {
      await api.patch(`/vault/entries/${entry.id}`, { favorite: !entry.favorite });
    } catch {
      setEntries((list) => list.map((e) => (e.id === entry.id ? { ...e, favorite: entry.favorite } : e)));
      throw new Error('Could not update this key.');
    }
  };

  const removeEntry = async (id) => {
    await api.delete(`/vault/entries/${id}`);
    setEntries((list) => list.filter((e) => e.id !== id));
  };

  const setAutoLock = async (minutes) => {
    await api.patch('/vault/settings', { autoLockMinutes: minutes });
    setStatus((s) => ({ ...s, autoLockMinutes: minutes }));
  };

  // Load status when a user is signed in; wipe everything on sign-out.
  useEffect(() => {
    if (user) loadStatus();
    else {
      lock(false);
      setStatus(null);
    }
  }, [user, loadStatus, lock]);

  // Inactivity auto-lock
  useEffect(() => {
    if (!unlocked) return undefined;
    const minutes = status?.autoLockMinutes ?? 10;
    if (!minutes) return undefined;
    const reset = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => lock(), minutes * 60 * 1000);
    };
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      clearTimeout(timerRef.current);
    };
  }, [unlocked, status?.autoLockMinutes, lock]);

  return (
    <VaultCtx.Provider value={{ status, statusLoading, unlocked, entries, unlock, setup, lock, saveEntry, toggleFavorite, removeEntry, setAutoLock, loadEntries }}>
      {children}
    </VaultCtx.Provider>
  );
}
