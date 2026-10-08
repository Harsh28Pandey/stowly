import mongoose from 'mongoose';
import { AuditLog, Notification } from '../models/index.js';

export const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}
export const httpError = (status, message, extra) => new HttpError(status, message, extra);
export const isId = (id) => mongoose.isValidObjectId(id);

export const STATUS_MESSAGES = {
  PENDING: 'Your account is awaiting administrator approval.',
  REJECTED: 'Your account registration was not approved.',
  SUSPENDED: 'Your account has been suspended.',
};

export function validPassword(p) {
  return typeof p === 'string' && p.length >= 8 && p.length <= 100 && /[A-Za-z]/.test(p) && /\d/.test(p);
}
export const PASSWORD_RULE = 'Password must be 8-100 characters and include at least one letter and one number.';

export function parseUA(ua = '') {
  let device = 'Unknown device';
  if (/iPhone/i.test(ua)) device = 'iPhone';
  else if (/iPad/i.test(ua)) device = 'iPad';
  else if (/Android/i.test(ua)) device = 'Android device';
  else if (/Windows/i.test(ua)) device = 'Windows computer';
  else if (/Mac OS X|Macintosh/i.test(ua)) device = 'Mac';
  else if (/Linux/i.test(ua)) device = 'Linux computer';
  let browser = 'Unknown browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\//i.test(ua)) browser = 'Opera';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua)) browser = 'Safari';
  return { device, browser };
}

export function fileKind(mime = '', name = '') {
  if (mime.startsWith('image/')) return 'images';
  if (mime.startsWith('video/')) return 'videos';
  if (mime.startsWith('audio/')) return 'audio';
  if (/zip|rar|7z|tar|gzip|compressed/.test(mime) || /\.(zip|rar|7z|tar|gz)$/i.test(name)) return 'archives';
  if (
    /pdf|^text\/|msword|officedocument|opendocument|spreadsheet|presentation|rtf/.test(mime) ||
    /\.(pdf|docx?|xlsx?|pptx?|txt|md|csv|rtf)$/i.test(name)
  )
    return 'documents';
  return 'other';
}

export const fileDto = (f, dupIds) => ({
  id: f._id,
  name: f.name,
  mime: f.mime,
  size: f.size,
  kind: fileKind(f.mime, f.name),
  folder: f.folder,
  starred: f.starred,
  tags: f.tags || [],
  trashed: f.trashed,
  createdAt: f.createdAt,
  lastOpenedAt: f.lastOpenedAt,
  viaDropZone: f.viaDropZone,
  storageProvider: f.storageProvider || 'Default Cloud Storage Provider',
  url: f.url || '',
  cloudinaryId: f.cloudinaryId || '',
  duplicate: dupIds ? dupIds.has(String(f._id)) : undefined,
});

export const folderDto = (f) => ({
  id: f._id,
  name: f.name,
  parent: f.parent,
  starred: f.starred,
  trashed: f.trashed,
  createdAt: f.createdAt,
});

export const userDto = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  bio: u.bio,
  prefs: u.prefs,
  storageUsed: u.storageUsed,
  quotaBytes: u.quotaBytes,
  createdAt: u.createdAt,
  lastLoginAt: u.lastLoginAt,
});

export const cleanName = (s, max = 200) =>
  String(s || '')
    .replace(/[\\/\u0000-\u001f]/g, '')
    .trim()
    .slice(0, max);

import { broadcastToUser } from '../services/events.js';

export const audit = (user, action, meta = {}) =>
  AuditLog.create({ user: user || null, action, meta }).catch(() => {});

export const notify = async (user, type, message) => {
  try {
    const doc = await Notification.create({ user, type, message });
    broadcastToUser(user, 'notification_created', {
      notification: { id: doc._id, type: doc.type, message: doc.message, read: doc.read, createdAt: doc.createdAt },
    });
    return doc;
  } catch {
    /* ignore */
  }
};
