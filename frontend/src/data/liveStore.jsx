import { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import api from '../api';
import { useAuth } from '../auth';
import { QUERY_KEYS, SSE_EVENT_MAP } from './invalidation';

const LiveStoreCtx = createContext(null);
export const useLiveStore = () => useContext(LiveStoreCtx);

const cache = new Map(); // key -> { data, timestamp, loading, error }
const listeners = new Map(); // key -> Set of subscriber callback functions
const broadChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('stowly_sync_channel') : null;

export function LiveStoreProvider({ children }) {
  const { user } = useAuth();
  const [sseStatus, setSseStatus] = useState('disconnected'); // 'connected' | 'reconnecting' | 'disconnected'
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const eventSourceRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  // Fetch real server configuration on startup
  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await api.get('/config');
      if (data && data.success) {
        setConfig(data.config);
      }
    } catch {
      /* ignore */
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Notify subscribers for a specific query key
  const notifyKey = useCallback((key) => {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
      const state = cache.get(key) || { data: null, loading: true, error: null };
      for (const fn of keyListeners) {
        try { fn(state); } catch { /* ignore subscriber error */ }
      }
    }
  }, []);

  // Invalidate specific query keys
  const invalidate = useCallback((keys) => {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const key of keyList) {
      if (typeof key === 'string') {
        const item = cache.get(key);
        if (item) {
          cache.set(key, { ...item, stale: true });
        }
        notifyKey(key);
      }
    }

    // Broadcast across tabs
    if (broadChannel) {
      try {
        broadChannel.postMessage({ type: 'INVALIDATE', keys: keyList });
      } catch {
        /* ignore */
      }
    }
  }, [notifyKey]);

  // Set data directly in cache
  const setCacheData = useCallback((key, data) => {
    cache.set(key, { data, timestamp: Date.now(), loading: false, error: null, stale: false });
    notifyKey(key);
  }, [notifyKey]);

  // Listen to BroadcastChannel messages from other tabs
  useEffect(() => {
    if (!broadChannel) return undefined;
    const handleMsg = (e) => {
      const msg = e.data;
      if (msg && msg.type === 'INVALIDATE') {
        const keyList = Array.isArray(msg.keys) ? msg.keys : [msg.keys];
        for (const key of keyList) {
          notifyKey(key);
        }
      }
    };
    broadChannel.addEventListener('message', handleMsg);
    return () => broadChannel.removeEventListener('message', handleMsg);
  }, [notifyKey]);

  // Connect Server-Sent Events (SSE) stream for authenticated user
  useEffect(() => {
    if (!user) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setSseStatus('disconnected');
      return undefined;
    }

    let active = true;
    let attempt = 0;

    const connectSSE = () => {
      if (!active) return;

      // Native EventSource to /api/events
      const es = new EventSource('/api/events', { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!active) return;
        setSseStatus('connected');
        attempt = 0;
      };

      const handleSSEEvent = (eventName) => (e) => {
        if (!active) return;
        try {
          const payload = JSON.parse(e.data);
          const invalidKeys = SSE_EVENT_MAP[eventName];
          if (invalidKeys) {
            invalidate(invalidKeys);
          }
          if (payload.storageSummary) {
            setCacheData(QUERY_KEYS.STORAGE, payload.storageSummary);
          }
        } catch {
          invalidate(QUERY_KEYS.STORAGE);
        }
      };

      // Register handler for all SSE event types
      Object.keys(SSE_EVENT_MAP).forEach((evt) => {
        es.addEventListener(evt, handleSSEEvent(evt));
      });

      es.onerror = () => {
        if (!active) return;
        es.close();
        setSseStatus('reconnecting');
        attempt++;
        const backoff = Math.min(30000, 1000 * Math.pow(2, Math.min(attempt, 5)));
        reconnectTimerRef.current = setTimeout(connectSSE, backoff);
      };
    };

    connectSSE();

    return () => {
      active = false;
      clearTimeout(reconnectTimerRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [user, invalidate, setCacheData]);

  return (
    <LiveStoreCtx.Provider
      value={{
        config,
        configLoading,
        sseStatus,
        invalidate,
        setCacheData,
        notifyKey,
      }}
    >
      {children}
    </LiveStoreCtx.Provider>
  );
}

/**
 * Universal hook for reading dynamic live server queries.
 * Handles staleTime, background refetching on focus/visibility/online, and real-time updates.
 */
export function useLiveQuery(key, fetcher, options = {}) {
  const store = useLiveStore();
  const { user } = useAuth();
  const [state, setState] = useState(() => {
    const existing = cache.get(key);
    return existing || { data: null, loading: true, error: null };
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const executeFetch = useCallback(async (silent = false) => {
    if (!key || !user) return;
    if (!silent) {
      setState((s) => ({ ...s, loading: !s.data }));
    }
    try {
      const res = await fetcherRef.current();
      const newObj = { data: res, timestamp: Date.now(), loading: false, error: null, stale: false };
      cache.set(key, newObj);
      setState(newObj);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch data.';
      setState((s) => ({ ...s, loading: false, error: errorMsg }));
    }
  }, [key, user]);

  // Subscribe to key updates in central store
  useEffect(() => {
    if (!key) return undefined;

    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    const setOfListeners = listeners.get(key);

    const onUpdate = (newState) => {
      setState({ ...newState });
      if (newState.stale) {
        executeFetch(true);
      }
    };

    setOfListeners.add(onUpdate);

    // Initial fetch if missing or stale
    const current = cache.get(key);
    const staleTimeMs = options.staleTime ?? 5000;
    if (!current || current.stale || Date.now() - (current.timestamp || 0) > staleTimeMs) {
      executeFetch(false);
    } else {
      setState(current);
    }

    return () => {
      setOfListeners.delete(onUpdate);
      if (setOfListeners.size === 0) {
        listeners.delete(key);
      }
    };
  }, [key, options.staleTime, executeFetch]);

  // Background refetch on focus, visibility, online
  useEffect(() => {
    if (!key || !user) return undefined;

    const onFocus = () => executeFetch(true);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') executeFetch(true);
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onFocus);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onFocus);
    };
  }, [key, user, executeFetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch: () => executeFetch(false),
  };
}

/** Hook for accessing real server configuration */
export function useConfig() {
  const store = useLiveStore();
  return {
    config: store?.config,
    loading: store?.configLoading,
  };
}

/** Hook that forces re-render periodically for auto-ticking time indicators */
export function useTicker(intervalMs = 30000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
}

/** Hook for setting document tab title dynamically with unread badge */
export function useDocumentTitle(title, unreadCount = 0) {
  useEffect(() => {
    const prefix = unreadCount > 0 ? `(${unreadCount > 9 ? '9+' : unreadCount}) ` : '';
    const cleanTitle = title ? `${title} - Stowly` : 'Stowly - Private Cloud Workspace';
    document.title = `${prefix}${cleanTitle}`;
  }, [title, unreadCount]);
}
