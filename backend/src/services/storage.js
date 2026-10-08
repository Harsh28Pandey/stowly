import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { File, Folder, User } from '../models/index.js';
import { httpError, cleanName } from '../utils/index.js';

/**
 * Storage layer. Files are saved on local disk under UPLOAD_DIR/<ownerId>/<randomKey>.
 * Only this module touches the disk, so it can later be swapped for S3 / Cloudflare R2.
 */
export const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || './uploads');
const MAX_BYTES = (Number(process.env.MAX_FILE_MB) || 100) * 1024 * 1024;
const BLOCKED_EXT = /\.(exe|bat|cmd|com|scr|msi|vbs|ps1|jar|dll)$/i;

export const relPath = (ownerId, key) => path.join(String(ownerId), key);
export const absPath = (ownerId, key) => path.join(UPLOAD_ROOT, relPath(ownerId, key));

export const removeFile = (ownerId, key) => fs.promises.unlink(absPath(ownerId, key)).catch(() => {});
export const removeTemp = (files = []) => Promise.all(files.map((f) => fs.promises.unlink(f.path).catch(() => {})));

export const fixName = (original) => cleanName(Buffer.from(original || 'file', 'latin1').toString('utf8'), 200) || 'file';

export function makeUploader(ownerOf) {
  return multer({
    limits: { fileSize: MAX_BYTES, files: 20 },
    fileFilter: (req, file, cb) => {
      if (BLOCKED_EXT.test(fixName(file.originalname))) return cb(httpError(400, 'This file type is not allowed.'));
      cb(null, true);
    },
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(UPLOAD_ROOT, String(ownerOf(req)));
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex')),
    }),
  });
}

const sha256File = (p) =>
  new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256');
    fs.createReadStream(p).on('data', (d) => h.update(d)).on('error', reject).on('end', () => resolve(h.digest('hex')));
  });

/** Dynamically configures Cloudinary credentials based on file mime type or global keys */
export function configureCloudinary(mime = '') {
  let cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  let api_key = process.env.CLOUDINARY_API_KEY;
  let api_secret = process.env.CLOUDINARY_API_SECRET;

  if (mime.startsWith('image/') && process.env.IMAGE_CLOUDINARY_CLOUD_NAME) {
    cloud_name = process.env.IMAGE_CLOUDINARY_CLOUD_NAME;
    api_key = process.env.IMAGE_CLOUDINARY_API_KEY;
    api_secret = process.env.IMAGE_CLOUDINARY_API_SECRET;
  } else if (mime.startsWith('video/') && process.env.VIDEO_CLOUDINARY_CLOUD_NAME) {
    cloud_name = process.env.VIDEO_CLOUDINARY_CLOUD_NAME;
    api_key = process.env.VIDEO_CLOUDINARY_API_KEY;
    api_secret = process.env.VIDEO_CLOUDINARY_API_SECRET;
  } else if ((mime.includes('pdf') || mime.includes('document')) && process.env.DOCUMENT_CLOUDINARY_CLOUD_NAME) {
    cloud_name = process.env.DOCUMENT_CLOUDINARY_CLOUD_NAME;
    api_key = process.env.DOCUMENT_CLOUDINARY_API_KEY;
    api_secret = process.env.DOCUMENT_CLOUDINARY_API_SECRET;
  }

  if (cloud_name && api_key && api_secret) {
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    return true;
  }
  return false;
}

export async function uploadToCloudinary(filePath, mime, ownerId) {
  const isConfigured = configureCloudinary(mime);
  if (!isConfigured) return null;
  try {
    let resource_type = 'auto';
    if (mime.startsWith('video/')) resource_type = 'video';
    else if (mime.startsWith('image/')) resource_type = 'image';
    else resource_type = 'raw';

    const res = await cloudinary.uploader.upload(filePath, {
      folder: `stowly/${ownerId}`,
      resource_type,
    });
    return { url: res.secure_url || res.url, cloudinaryId: res.public_id };
  } catch (err) {
    console.error('Cloudinary upload error:', err.message);
    return null;
  }
}

/** Dynamically resolves third-party storage provider and API key according to file category */
export function getStorageProviderConfig(mime = '') {
  if (mime.startsWith('image/')) {
    return {
      provider: 'Cloudinary Image Cloud',
      apiKey: process.env.IMAGE_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || 'img_provider_api_key_active',
      category: 'IMAGE',
    };
  }
  if (mime.startsWith('video/')) {
    return {
      provider: 'Cloudinary Video CDN',
      apiKey: process.env.VIDEO_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || 'vid_provider_api_key_active',
      category: 'VIDEO',
    };
  }
  if (mime.includes('pdf') || mime.includes('document') || mime.includes('word') || mime.includes('sheet') || mime.includes('text/')) {
    return {
      provider: 'Cloudinary Document Vault',
      apiKey: process.env.DOCUMENT_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || 'doc_provider_api_key_active',
      category: 'DOCUMENT',
    };
  }
  return {
    provider: 'Cloudinary Cloud Storage',
    apiKey: process.env.CLOUDINARY_API_KEY || process.env.DEFAULT_STORAGE_PROVIDER_API_KEY || 'default_provider_api_key_active',
    category: 'DEFAULT',
  };
}

/** Registers freshly uploaded temp files as File documents. Enforces quota and detects duplicates. */
export async function ingestFiles({ owner, files, folderId = null, viaDropZone = false }) {
  const total = files.reduce((s, f) => s + f.size, 0);
  if (owner.storageUsed + total > owner.quotaBytes) {
    await removeTemp(files);
    throw httpError(413, 'Not enough storage space left for this upload.');
  }
  const created = [];
  const duplicates = [];
  for (const f of files) {
    const hash = await sha256File(f.path);
    const dup = await File.exists({ owner: owner._id, hash, trashed: false });
    const providerConfig = getStorageProviderConfig(f.mimetype);
    
    // Attempt Cloudinary upload
    const cRes = await uploadToCloudinary(f.path, f.mimetype, owner._id);
    const fileUrl = cRes?.url || `/api/files/${f.filename}/content`;
    const cloudinaryId = cRes?.cloudinaryId || '';

    const doc = await File.create({
      owner: owner._id,
      name: fixName(f.originalname),
      mime: f.mimetype || 'application/octet-stream',
      size: f.size,
      folder: folderId,
      storageKey: f.filename,
      storageProvider: cRes ? `Cloudinary (${providerConfig.provider})` : providerConfig.provider,
      url: fileUrl,
      cloudinaryId,
      hash,
      viaDropZone,
    });
    if (dup) duplicates.push(doc.name);
    created.push(doc);
  }
  await User.updateOne({ _id: owner._id }, { $inc: { storageUsed: total } });
  return { created, duplicates };
}

export async function descendantFolderIds(ownerId, rootId) {
  const ids = [String(rootId)];
  let frontier = [rootId];
  while (frontier.length) {
    const kids = await Folder.find({ owner: ownerId, parent: { $in: frontier } }).select('_id').lean();
    frontier = kids.map((k) => k._id);
    ids.push(...frontier.map(String));
  }
  return ids;
}

export async function breadcrumbs(ownerId, folderId) {
  const trail = [];
  let current = folderId;
  for (let i = 0; i < 25 && current; i++) {
    const f = await Folder.findOne({ _id: current, owner: ownerId }).select('name parent').lean();
    if (!f) break;
    trail.unshift({ id: f._id, name: f.name });
    current = f.parent;
  }
  return trail;
}

/** Permanently deletes File documents (and their data on disk/Cloudinary) and refunds quota. */
export async function destroyFiles(ownerId, fileDocs) {
  let freed = 0;
  for (const f of fileDocs) {
    if (f.cloudinaryId) {
      configureCloudinary(f.mime);
      let resource_type = 'image';
      if (f.mime?.startsWith('video/')) resource_type = 'video';
      else if (!f.mime?.startsWith('image/')) resource_type = 'raw';
      await cloudinary.uploader.destroy(f.cloudinaryId, { resource_type }).catch(() => {});
    }
    await removeFile(ownerId, f.storageKey);
    freed += f.size;
  }
  if (fileDocs.length) {
    await File.deleteMany({ _id: { $in: fileDocs.map((f) => f._id) }, owner: ownerId });
    await User.updateOne({ _id: ownerId }, { $inc: { storageUsed: -freed } });
  }
}

export async function getStorageSummary(userId, userQuota = null) {
  const uid = typeof userId === 'object' && userId._id ? userId._id : userId;
  let quota = userQuota;
  if (!quota) {
    const u = await User.findById(uid).select('quotaBytes storageUsed').lean();
    quota = u?.quotaBytes || 536870912000;
  }

  const [stats] = await File.aggregate([
    { $match: { owner: uid } },
    {
      $group: {
        _id: null,
        totalUsed: { $sum: '$size' },
        trashUsed: { $sum: { $cond: [{ $eq: ['$trashed', true] }, '$size', 0] } },
        filesUsed: { $sum: { $cond: [{ $eq: ['$trashed', false] }, '$size', 0] } },
        fileCount: { $sum: { $cond: [{ $eq: ['$trashed', false] }, 1, 0] } },
        trashCount: { $sum: { $cond: [{ $eq: ['$trashed', true] }, 1, 0] } },
      },
    },
  ]);

  const used = stats?.totalUsed || 0;
  const trashUsed = stats?.trashUsed || 0;
  const filesUsed = stats?.filesUsed || 0;
  const fileCount = stats?.fileCount || 0;
  const trashCount = stats?.trashCount || 0;

  await User.updateOne({ _id: uid }, { $set: { storageUsed: used } });

  const free = Math.max(0, quota - used);
  const percent = quota > 0 ? Math.min(100, Math.round((used / quota) * 1000) / 10) : 0;

  return {
    used,
    quota,
    free,
    percent,
    breakdown: {
      files: filesUsed,
      trash: trashUsed,
    },
    fileCount,
    trashCount,
    updatedAt: new Date().toISOString(),
  };
}

