import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const ref = (to, extra = {}) => ({ type: Schema.Types.ObjectId, ref: to, ...extra });

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'], default: 'PENDING', index: true },
    rejectionReason: String,
    reviewedAt: Date,
    bio: { type: String, default: '', maxlength: 300 },
    storageUsed: { type: Number, default: 0 },
    quotaBytes: {
      type: Number,
      default: () => {
        const gb = Number(process.env.STORAGE_QUOTA_GB) || (Number(process.env.STORAGE_QUOTA_MB) ? Number(process.env.STORAGE_QUOTA_MB) / 1024 : 500);
        return Math.round(gb * 1024 * 1024 * 1024);
      },
    },
    lastLoginAt: Date,
    prefs: {
      view: { type: String, enum: ['grid', 'list'], default: 'grid' },
      notifyDrops: { type: Boolean, default: true },
      notifyAccount: { type: Boolean, default: true },
      notifyStorage: { type: Boolean, default: true },
    },
    // Keyring (password vault). The server only ever stores the salt, a verifier
    // ciphertext and encrypted entries. The master password never leaves the browser.
    vault: {
      salt: String,
      verifier: { iv: String, ct: String },
      autoLockMinutes: { type: Number, default: 10 },
    },
  },
  { timestamps: true }
);

const sessionSchema = new Schema(
  {
    user: ref('User', { index: true }),
    device: String,
    browser: String,
    lastActive: { type: Date, default: Date.now },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const folderSchema = new Schema(
  {
    owner: ref('User', { index: true }),
    name: { type: String, required: true, trim: true, maxlength: 200 },
    parent: ref('Folder', { default: null }),
    starred: { type: Boolean, default: false },
    trashed: { type: Boolean, default: false },
    trashedAt: Date,
  },
  { timestamps: true }
);

const fileSchema = new Schema(
  {
    owner: ref('User', { index: true }),
    name: { type: String, required: true, maxlength: 255 },
    mime: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    folder: ref('Folder', { default: null }),
    storageKey: { type: String, required: true },
    hash: { type: String, index: true },
    starred: { type: Boolean, default: false },
    tags: [String],
    trashed: { type: Boolean, default: false },
    trashedAt: Date,
    lastOpenedAt: { type: Date, default: Date.now },
    openCount: { type: Number, default: 0 },
    viaDropZone: { type: Boolean, default: false },
    storageProvider: { type: String, default: 'Default Storage Provider' },
    url: { type: String, default: '' },
    cloudinaryId: { type: String, default: '' },
  },
  { timestamps: true }
);
fileSchema.index({ owner: 1, trashed: 1, folder: 1 });

const dropZoneSchema = new Schema(
  {
    owner: ref('User', { index: true }),
    title: { type: String, required: true, trim: true, maxlength: 100 },
    token: { type: String, required: true, unique: true },
    folder: ref('Folder', { default: null }),
    expiresAt: Date,
    maxFiles: { type: Number, default: 50 },
    maxSizeMB: { type: Number, default: 25 },
    allowedTypes: [String],
    uploadCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const vaultEntrySchema = new Schema(
  {
    owner: ref('User', { index: true }),
    payload: { iv: { type: String, required: true }, ct: { type: String, required: true } },
    algorithmVersion: { type: String, default: 'aes-256-gcm/pbkdf2-sha256-600k/v1' },
    category: { type: String, default: 'Login' },
    nameMeta: { type: String, default: '' },
    domainMeta: { type: String, default: '' },
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const notificationSchema = new Schema(
  {
    user: ref('User', { index: true }),
    type: String,
    message: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const auditSchema = new Schema(
  {
    user: ref('User', { default: null }),
    action: { type: String, index: true },
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const User = model('User', userSchema);
export const Session = model('Session', sessionSchema);
export const Folder = model('Folder', folderSchema);
export const File = model('File', fileSchema);
export const DropZone = model('DropZone', dropZoneSchema);
export const VaultEntry = model('VaultEntry', vaultEntrySchema);
export const Notification = model('Notification', notificationSchema);
export const AuditLog = model('AuditLog', auditSchema);
