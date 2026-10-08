import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from './api';
import { useAuth } from './auth';

const NotificationCtx = createContext(null);
export const useNotifications = () => useContext(NotificationCtx);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/account/notifications');
      if (data && data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread || 0);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    const prevNotifs = [...notifications];
    const prevUnread = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await api.post('/account/notifications/read');
    } catch {
      setNotifications(prevNotifs);
      setUnreadCount(prevUnread);
      throw new Error('Failed to mark notifications as read.');
    }
  }, [notifications, unreadCount]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await api.post('/account/notifications/read');
    } catch {
      fetchNotifications(true);
    }
  }, [fetchNotifications]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user, fetchNotifications]);

  // Polling every 45s and refetch on focus / visibility
  useEffect(() => {
    if (!user) return undefined;

    const onFocus = () => fetchNotifications(true);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchNotifications(true);
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') fetchNotifications(true);
    }, 45000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(timer);
    };
  }, [user, fetchNotifications]);

  return (
    <NotificationCtx.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAllRead,
        markRead,
      }}
    >
      {children}
    </NotificationCtx.Provider>
  );
}
