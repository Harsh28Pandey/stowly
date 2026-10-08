import { Router } from 'express';
import { File, Folder } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncH, httpError, isId, folderDto, cleanName } from '../utils/index.js';
import { descendantFolderIds, destroyFiles, getStorageSummary } from '../services/storage.js';

const router = Router();
router.use(requireAuth);

async function getFolder(req) {
  if (!isId(req.params.id)) throw httpError(404, 'Folder not found.');
  const f = await Folder.findOne({ _id: req.params.id, owner: req.user._id });
  if (!f) throw httpError(404, 'Folder not found.');
  return f;
}

async function parentOrNull(ownerId, id) {
  if (id === null || id === undefined || id === '') return null;
  if (!isId(id)) throw httpError(400, 'Invalid folder.');
  const p = await Folder.findOne({ _id: id, owner: ownerId, trashed: false });
  if (!p) throw httpError(404, 'Destination folder not found.');
  return p._id;
}

router.get(
  '/all',
  asyncH(async (req, res) => {
    const list = await Folder.find({ owner: req.user._id, trashed: false }).sort({ name: 1 }).limit(1000).lean();
    res.json({ success: true, folders: list.map(folderDto) });
  })
);

router.post(
  '/',
  asyncH(async (req, res) => {
    const name = cleanName(req.body?.name, 200);
    if (!name) throw httpError(400, 'Please enter a folder name.');
    const parent = await parentOrNull(req.user._id, req.body?.parent);
    const folder = await Folder.create({ owner: req.user._id, name, parent });
    res.status(201).json({ success: true, folder: folderDto(folder) });
  })
);

router.patch(
  '/:id',
  asyncH(async (req, res) => {
    const f = await getFolder(req);
    const b = req.body || {};
    if (b.name !== undefined) {
      const name = cleanName(b.name, 200);
      if (!name) throw httpError(400, 'Please enter a folder name.');
      f.name = name;
    }
    if (typeof b.starred === 'boolean') f.starred = b.starred;
    if (b.parent !== undefined) {
      const parent = await parentOrNull(req.user._id, b.parent);
      if (parent) {
        const banned = await descendantFolderIds(req.user._id, f._id);
        if (banned.includes(String(parent))) throw httpError(400, 'A folder cannot be moved inside itself.');
      }
      f.parent = parent;
    }
    await f.save();
    res.json({ success: true, folder: folderDto(f) });
  })
);

router.post(
  '/:id/trash',
  asyncH(async (req, res) => {
    const f = await getFolder(req);
    const ids = await descendantFolderIds(req.user._id, f._id);
    const now = new Date();
    await Folder.updateMany({ _id: { $in: ids }, owner: req.user._id }, { trashed: true, trashedAt: now });
    await File.updateMany({ folder: { $in: ids }, owner: req.user._id }, { trashed: true, trashedAt: now });
    const storageSummary = await getStorageSummary(req.user._id, req.user.quotaBytes);
    res.json({ success: true, storageSummary });
  })
);

router.post(
  '/:id/restore',
  asyncH(async (req, res) => {
    const f = await getFolder(req);
    if (f.parent && !(await Folder.exists({ _id: f.parent, owner: req.user._id, trashed: false }))) f.parent = null;
    await f.save();
    const ids = await descendantFolderIds(req.user._id, f._id);
    await Folder.updateMany({ _id: { $in: ids }, owner: req.user._id }, { trashed: false, $unset: { trashedAt: 1 } });
    await File.updateMany({ folder: { $in: ids }, owner: req.user._id }, { trashed: false, $unset: { trashedAt: 1 } });
    const storageSummary = await getStorageSummary(req.user._id, req.user.quotaBytes);
    res.json({ success: true, storageSummary });
  })
);

router.delete(
  '/:id',
  asyncH(async (req, res) => {
    const f = await getFolder(req);
    if (!f.trashed) throw httpError(400, 'Move the folder to the Recycle Bin first.');
    const ids = await descendantFolderIds(req.user._id, f._id);
    const files = await File.find({ folder: { $in: ids }, owner: req.user._id });
    await destroyFiles(req.user._id, files);
    await Folder.deleteMany({ _id: { $in: ids }, owner: req.user._id });
    const storageSummary = await getStorageSummary(req.user._id, req.user.quotaBytes);
    res.json({ success: true, storageSummary });
  })
);

export default router;
