/**
 * Dependency & Invalidation Map for Stowly Live Query System.
 * Maps backend real-time events and client mutation actions
 * to dependent query keys so all affected views update automatically.
 */

export const QUERY_KEYS = {
  ME: 'me',
  CONFIG: 'config',
  STORAGE: 'storage',
  FILES: 'files',
  FOLDERS: 'folders',
  SHELVES: 'shelves',
  INSIGHTS: 'insights',
  DROPBOXES: 'dropBoxes',
  KEYRING: 'keyring',
  NOTIFICATIONS: 'notifications',
  SESSIONS: 'sessions',
  ADMIN_USERS: 'adminUsers',
  ADMIN_DASHBOARD: 'adminDashboard',
};

export const DEPENDENCY_MAP = {
  // File operations affect files, folders, storage summary, smart shelves, and insights
  FILE_MUTATION: [
    QUERY_KEYS.FILES,
    QUERY_KEYS.FOLDERS,
    QUERY_KEYS.STORAGE,
    QUERY_KEYS.SHELVES,
    QUERY_KEYS.INSIGHTS,
  ],
  // Storage operations
  STORAGE_MUTATION: [
    QUERY_KEYS.STORAGE,
    QUERY_KEYS.INSIGHTS,
    QUERY_KEYS.ME,
  ],
  // Drop Box operations
  DROPBOX_MUTATION: [
    QUERY_KEYS.DROPBOXES,
    QUERY_KEYS.FILES,
    QUERY_KEYS.STORAGE,
    QUERY_KEYS.NOTIFICATIONS,
  ],
  // Notification operations
  NOTIFICATION_MUTATION: [
    QUERY_KEYS.NOTIFICATIONS,
  ],
  // Account & session operations
  ACCOUNT_MUTATION: [
    QUERY_KEYS.ME,
    QUERY_KEYS.SESSIONS,
  ],
  // Admin operations
  ADMIN_MUTATION: [
    QUERY_KEYS.ADMIN_USERS,
    QUERY_KEYS.ADMIN_DASHBOARD,
  ],
};

export const SSE_EVENT_MAP = {
  file_added: DEPENDENCY_MAP.FILE_MUTATION,
  file_changed: DEPENDENCY_MAP.FILE_MUTATION,
  file_trashed: DEPENDENCY_MAP.FILE_MUTATION,
  file_restored: DEPENDENCY_MAP.FILE_MUTATION,
  file_deleted: DEPENDENCY_MAP.FILE_MUTATION,
  folder_changed: DEPENDENCY_MAP.FILE_MUTATION,
  storage_changed: DEPENDENCY_MAP.STORAGE_MUTATION,
  dropbox_delivery: DEPENDENCY_MAP.DROPBOX_MUTATION,
  dropbox_changed: DEPENDENCY_MAP.DROPBOX_MUTATION,
  notification_created: DEPENDENCY_MAP.NOTIFICATION_MUTATION,
  session_revoked: DEPENDENCY_MAP.ACCOUNT_MUTATION,
  account_status_changed: [...DEPENDENCY_MAP.ACCOUNT_MUTATION, ...DEPENDENCY_MAP.ADMIN_MUTATION],
  preference_changed: DEPENDENCY_MAP.ACCOUNT_MUTATION,
  admin_queue_changed: DEPENDENCY_MAP.ADMIN_MUTATION,
};
