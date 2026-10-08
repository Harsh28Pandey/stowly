import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from './api';
import { useAuth } from './auth';

const StorageCtx = createContext(null);
export const useStorage = () => useContext(StorageCtx);

export function StorageProvider({ children }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    used: user?.storageUsed || 0,
    quota: user?.quotaBytes || 536870912000,
    free: (user?.quotaBytes || 536870912000) - (user?.storageUsed || 0),
    percent: user?.quotaBytes ? Math.min(100, Math.round(((user.storageUsed || 0) / user.quotaBytes) * 1000) / 10) : 0,
    breakdown: { files: user?.storageUsed || 0, trash: 0 },
    fileCount: 0,
    trashCount: 0,
    updatedAt: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/storage/summary');
      if (data && data.success) {
        setSummary({
          used: data.used,
          quota: data.quota,
          free: data.free,
          percent: data.percent,
          breakdown: data.breakdown || { files: data.used, trash: 0 },
          fileCount: data.fileCount || 0,
          trashCount: data.trashCount || 0,
          updatedAt: data.updatedAt,
          loading: false,
        });
      }
    } catch {
      setSummary((s) => ({ ...s, loading: false }));
    }
  }, [user]);

  const updateSummary = useCallback((newSummary) => {
    if (!newSummary) return;
    setSummary({
      used: newSummary.used,
      quota: newSummary.quota,
      free: newSummary.free,
      percent: newSummary.percent,
      breakdown: newSummary.breakdown || { files: newSummary.used, trash: 0 },
      fileCount: newSummary.fileCount || 0,
      trashCount: newSummary.trashCount || 0,
      updatedAt: newSummary.updatedAt,
      loading: false,
    });
  }, []);

  const checkQuota = useCallback((additionalBytes = 0) => {
    const freeSpace = summary.free;
    const ok = additionalBytes <= freeSpace;
    return {
      ok,
      remaining: freeSpace,
      message: ok ? '' : `Upload of ${formatBytesLocal(additionalBytes)} exceeds available storage by ${formatBytesLocal(additionalBytes - freeSpace)}.`,
    };
  }, [summary.free]);

  // Sync initial user storage properties when user updates
  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setSummary({
        used: 0,
        quota: 536870912000,
        free: 536870912000,
        percent: 0,
        breakdown: { files: 0, trash: 0 },
        fileCount: 0,
        trashCount: 0,
        updatedAt: null,
        loading: false,
      });
    }
  }, [user, refresh]);

  // Window focus, visibility, online, and 60-second periodic refetch
  useEffect(() => {
    if (!user) return undefined;

    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const onOnline = () => refresh();

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 60000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      clearInterval(timer);
    };
  }, [user, refresh]);

  return (
    <StorageCtx.Provider value={{ summary, refresh, updateSummary, checkQuota }}>
      {children}
    </StorageCtx.Provider>
  );
}

function formatBytesLocal(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
