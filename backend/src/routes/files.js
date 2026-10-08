import { Router } from 'express';
import fs from 'fs';
import { File, Folder } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncH, httpError, isId, fileDto, folderDto, cleanName } from '../utils/index.js';
import {
  makeUploader, ingestFiles, removeTemp, destroyFiles, breadcrumbs, absPath, relPath, UPLOAD_ROOT, getStorageSummary,
} from '../services/storage.js';
import { analyze } from '../services/analyze.js';
import { broadcastToUser } from '../services/events.js';

const router = Router();
router.use(requireAuth);

const upload = makeUploader((req) => req.user._id);
const SAFE_INLINE =
  /^(image\/(png|jpe?g|gif|webp|avif|bmp)|application\/pdf|video\/(mp4|webm|ogg)|audio\/(mpeg|mp3|ogg|wav|webm|mp4|x-m4a)|text\/plain)$/;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function getFile(req) {
  if (!isId(req.params.id)) throw httpError(404, 'File not found.');
  const f = await File.findOne({ _id: req.params.id, owner: req.user._id });
  if (!f) throw httpError(404, 'File not found.');
  return f;
}

async function ownedFolderOrNull(ownerId, id) {
  if (id === null || id === undefined || id === '') return null;
  if (!isId(id)) throw httpError(400, 'Invalid folder.');
  const f = await Folder.findOne({ _id: id, owner: ownerId, trashed: false });
  if (!f) throw httpError(404, 'Folder not found.');
  return f._id;
}

router.get(
  '/',
  asyncH(async (req, res) => {
    const { view = 'all', folder, q, collection } = req.query;
    const owner = req.user._id;
    const fileFilter = { owner, trashed: view === 'trash' };
    let folderFilter = { owner, trashed: view === 'trash' };
    let sort = { name: 1 };
    let limit = 500;
    let crumbs = [];

    if (view === 'trash') sort = { trashedAt: -1 };
    else if (view === 'starred') {
      fileFilter.starred = true;
      folderFilter.starred = true;
    } else if (view === 'recent') {
      sort = { lastOpenedAt: -1 };
      limit = 40;
      folderFilter = null;
    } else if (view === 'collection') {
      const a = await analyze(owner);
      fileFilter._id = { $in: a.idsFor(String(collection)) };
      sort = { createdAt: -1 };
      folderFilter = null;
    } else if (q && String(q).trim()) {
      const rx = new RegExp(esc(String(q).trim().slice(0, 80)), 'i');
      fileFilter.$or = [{ name: rx }, { tags: rx }];
      folderFilter.name = rx;
    } else {
      const parent = folder && isId(folder) ? folder : null;
      fileFilter.folder = parent;
      folderFilter.parent = parent;
      if (parent) crumbs = await breadcrumbs(owner, parent);
    }

    const [files, folders] = await Promise.all([
      File.find(fileFilter).sort(sort).limit(limit).lean(),
      folderFilter ? Folder.find(folderFilter).sort({ name: 1 }).limit(300).lean() : [],
    ]);
    res.json({ success: true, files: files.map((f) => fileDto(f)), folders: folders.map(folderDto), breadcrumbs: crumbs });
  })
);

router.post('/upload', upload.array('files', 20), asyncH(async (req, res) => {
  const files = req.files || [];
  if (!files.length) throw httpError(400, 'Please choose at least one file.');
  let folderId = null;
  try {
    folderId = await ownedFolderOrNull(req.user._id, req.body.folder || null);
  } catch (e) {
    await removeTemp(files);
    throw e;
  }
  const { created, duplicates } = await ingestFiles({ owner: req.user, files, folderId });
  const storageSummary = await getStorageSummary(req.user._id, req.user.quotaBytes);
  broadcastToUser(req.user._id, 'file_added', { storageSummary });
  broadcastToUser(req.user._id, 'storage_changed', { storageSummary });
  res.status(201).json({ success: true, files: created.map((f) => fileDto(f)), duplicates, storageSummary });
}));

router.post(
  '/trash/empty',
  asyncH(async (req, res) => {
    const files = await File.find({ owner: req.user._id, trashed: true });
    await destroyFiles(req.user._id, files);
    await Folder.deleteMany({ owner: req.user._id, trashed: true });
    const storageSummary = await getStorageSummary(req.user._id, req.user.quotaBytes);
    broadcastToUser(req.user._id, 'file_deleted', { empty: true, storageSummary });
    broadcastToUser(req.user._id, 'storage_changed', { storageSummary });
    res.json({ success: true, storageSummary });
  })
);

router.get(
  '/:id/download',
  asyncH(async (req, res) => {
    const f = await getFile(req);
    await File.updateOne({ _id: f._id }, { $set: { lastOpenedAt: new Date() }, $inc: { openCount: 1 } });
    if (f.url && /^https?:\/\//i.test(f.url)) {
      return res.redirect(f.url);
    }
    if (!fs.existsSync(absPath(f.owner, f.storageKey))) throw httpError(404, 'The file data could not be found.');
    const rel = relPath(f.owner, f.storageKey);
    if (req.query.inline === '1' && SAFE_INLINE.test(f.mime)) {
      res.setHeader('Content-Type', f.mime);
      res.setHeader('Content-Disposition', 'inline');
      return res.sendFile(rel, { root: UPLOAD_ROOT });
    }
    res.download(rel, f.name, { root: UPLOAD_ROOT });
  })
);

router.patch(
  '/:id',
  asyncH(async (req, res) => {
    const f = await getFile(req);
    const b = req.body || {};
    if (b.name !== undefined) {
      const name = cleanName(b.name, 255);
      if (!name) throw httpError(400, 'Please enter a file name.');
      f.name = name;
    }
    if (typeof b.starred === 'boolean') f.starred = b.starred;
    if (Array.isArray(b.tags))
      f.tags = [...new Set(b.tags.map((t) => String(t).trim().toLowerCase().slice(0, 30)).filter(Boolean))].slice(0, 10);
    if (b.folder !== undefined) f.folder = await ownedFolderOrNull(req.user._id, b.folder);
    await f.save();
    broadcastToUser(req.user._id, 'file_changed', { fileId: f._id });
    res.json({ success: true, file: fileDto(f) });
  })
);

router.post(
  '/:id/trash',
  asyncH(async (req, res) => {
    const f = await getFile(req);
    f.trashed = true;
    f.trashedAt = new Date();
    await f.save();
    const storageSummary = await getStorageSummary(req.user._id, req.user.quotaBytes);
    broadcastToUser(req.user._id, 'file_trashed', { fileId: f._id, storageSummary });
    broadcastToUser(req.user._id, 'storage_changed', { storageSummary });
    res.json({ success: true, storageSummary });
  })
);

router.post(
  '/:id/restore',
  asyncH(async (req, res) => {
    const f = await getFile(req);
    f.trashed = false;
    f.trashedAt = undefined;
    if (f.folder && !(await Folder.exists({ _id: f.folder, owner: req.user._id, trashed: false }))) f.folder = null;
    await f.save();
    const storageSummary = await getStorageSummary(req.user._id, req.user.quotaBytes);
    broadcastToUser(req.user._id, 'file_restored', { fileId: f._id, storageSummary });
    broadcastToUser(req.user._id, 'storage_changed', { storageSummary });
    res.json({ success: true, storageSummary });
  })
);

router.delete(
  '/:id',
  asyncH(async (req, res) => {
    const f = await getFile(req);
    if (!f.trashed) throw httpError(400, 'Move the file to the Recycle Bin first.');
    await destroyFiles(req.user._id, [f]);
    const storageSummary = await getStorageSummary(req.user._id, req.user.quotaBytes);
    broadcastToUser(req.user._id, 'file_deleted', { fileId: f._id, storageSummary });
    broadcastToUser(req.user._id, 'storage_changed', { storageSummary });
    res.json({ success: true, storageSummary });
  })
);

export default router;

