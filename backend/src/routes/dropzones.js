import { Router } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { DropZone, Folder, User } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncH, httpError, isId, cleanName, fileDto, notify } from '../utils/index.js';
import { makeUploader, ingestFiles, removeTemp, fixName, getStorageSummary } from '../services/storage.js';
import { broadcastToUser } from '../services/events.js';

/* ---------- Owner routes: /api/drop-zones ---------- */
export const ownerRouter = Router();
ownerRouter.use(requireAuth);

const zoneDto = (z) => ({
  id: z._id,
  title: z.title,
  token: z.token,
  folder: z.folder,
  expiresAt: z.expiresAt,
  maxFiles: z.maxFiles,
  maxSizeMB: z.maxSizeMB,
  allowedTypes: z.allowedTypes,
  uploadCount: z.uploadCount,
  active: z.active,
  createdAt: z.createdAt,
});

ownerRouter.get(
  '/',
  asyncH(async (req, res) => {
    const zones = await DropZone.find({ owner: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, dropZones: zones.map(zoneDto) });
  })
);

ownerRouter.post(
  '/',
  asyncH(async (req, res) => {
    const b = req.body || {};
    const title = cleanName(b.title, 100);
    if (title.length < 2) throw httpError(400, 'Please give your Drop Box a title.');
    const maxFiles = Math.min(Math.max(parseInt(b.maxFiles, 10) || 50, 1), 1000);
    const maxSizeMB = Math.min(Math.max(parseInt(b.maxSizeMB, 10) || 25, 1), Number(process.env.MAX_FILE_MB) || 100);
    const allowedTypes = String(b.allowedTypes || '')
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/^\./, ''))
      .filter((t) => /^[a-z0-9]{1,10}$/.test(t))
      .slice(0, 20);
    let expiresAt = null;
    if (b.expiresAt) {
      expiresAt = new Date(b.expiresAt);
      if (isNaN(expiresAt) || expiresAt <= new Date()) throw httpError(400, 'The expiry date must be in the future.');
    }
    let folder = null;
    if (b.folder) {
      if (!isId(b.folder)) throw httpError(400, 'Invalid folder.');
      folder = await Folder.findOne({ _id: b.folder, owner: req.user._id, trashed: false });
      if (!folder) throw httpError(404, 'Folder not found.');
    } else {
      folder = await Folder.create({ owner: req.user._id, name: `Drop Box - ${title}`.slice(0, 200), parent: null });
    }
    const zone = await DropZone.create({
      owner: req.user._id,
      title,
      token: crypto.randomBytes(7).toString('base64url'),
      folder: folder._id,
      expiresAt,
      maxFiles,
      maxSizeMB,
      allowedTypes,
    });
    broadcastToUser(req.user._id, 'dropbox_changed', { zoneId: zone._id });
    res.status(201).json({ success: true, dropZone: zoneDto(zone) });
  })
);

ownerRouter.patch(
  '/:id',
  asyncH(async (req, res) => {
    if (!isId(req.params.id)) throw httpError(404, 'Drop Box not found.');
    const z = await DropZone.findOne({ _id: req.params.id, owner: req.user._id });
    if (!z) throw httpError(404, 'Drop Box not found.');
    if (typeof req.body?.active === 'boolean') z.active = req.body.active;
    await z.save();
    broadcastToUser(req.user._id, 'dropbox_changed', { zoneId: z._id });
    res.json({ success: true, dropZone: zoneDto(z) });
  })
);

ownerRouter.delete(
  '/:id',
  asyncH(async (req, res) => {
    if (!isId(req.params.id)) throw httpError(404, 'Drop Box not found.');
    const r = await DropZone.deleteOne({ _id: req.params.id, owner: req.user._id });
    if (!r.deletedCount) throw httpError(404, 'Drop Box not found.');
    broadcastToUser(req.user._id, 'dropbox_changed', { zoneId: req.params.id });
    res.json({ success: true });
  })
);

/* ---------- Public routes: /api/drop/:token ---------- */
export const publicRouter = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
publicRouter.use(limiter);

const loadZone = asyncH(async (req, res, next) => {
  const zone = await DropZone.findOne({ token: String(req.params.token) });
  const owner = zone ? await User.findById(zone.owner) : null;
  if (!zone || !zone.active || !owner || owner.status !== 'APPROVED') throw httpError(404, 'This Drop Box is not available.');
  if (zone.expiresAt && zone.expiresAt < new Date()) throw httpError(410, 'This Drop Box has expired.');
  if (zone.uploadCount >= zone.maxFiles) throw httpError(410, 'This Drop Box has reached its upload limit.');
  req.zone = zone;
  req.zoneOwner = owner;
  next();
});

publicRouter.get('/:token', loadZone, (req, res) => {
  const z = req.zone;
  res.json({
    success: true,
    dropBox: {
      title: z.title,
      ownerName: req.zoneOwner.name,
      remaining: z.maxFiles - z.uploadCount,
      maxSizeMB: z.maxSizeMB,
      allowedTypes: z.allowedTypes,
      expiresAt: z.expiresAt,
    },
  });
});

const dropUpload = makeUploader((req) => req.zone.owner);
publicRouter.post(
  '/:token',
  loadZone,
  dropUpload.array('files', 10),
  asyncH(async (req, res) => {
    const files = req.files || [];
    const z = req.zone;
    const reject = async (status, msg) => {
      await removeTemp(files);
      throw httpError(status, msg);
    };
    if (!files.length) return reject(400, 'Please choose at least one file.');
    if (files.length > z.maxFiles - z.uploadCount) return reject(400, 'This Drop Box does not have room for that many files.');
    for (const f of files) {
      if (f.size > z.maxSizeMB * 1024 * 1024) return reject(413, `Each file must be ${z.maxSizeMB} MB or smaller.`);
      const ext = (fixName(f.originalname).split('.').pop() || '').toLowerCase();
      if (z.allowedTypes.length && !z.allowedTypes.includes(ext))
        return reject(400, `Only these file types are accepted: ${z.allowedTypes.join(', ')}.`);
    }
    const { created } = await ingestFiles({ owner: req.zoneOwner, files, folderId: z.folder, viaDropZone: true });
    await DropZone.updateOne({ _id: z._id }, { $inc: { uploadCount: created.length } });
    if (req.zoneOwner.prefs?.notifyDrops !== false)
      await notify(req.zoneOwner._id, 'drop', `${created.length} new file(s) arrived in your Drop Box "${z.title}".`);
    const storageSummary = await getStorageSummary(req.zoneOwner._id, req.zoneOwner.quotaBytes);
    broadcastToUser(req.zoneOwner._id, 'dropbox_delivery', { zoneId: z._id, count: created.length, storageSummary });
    broadcastToUser(req.zoneOwner._id, 'storage_changed', { storageSummary });
    res.status(201).json({ success: true, message: 'Your files were delivered successfully.', count: created.map((f) => fileDto(f)).length, storageSummary });
  })
);
