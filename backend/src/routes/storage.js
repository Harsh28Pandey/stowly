import { Router } from 'express';
import { File, Folder, DropZone } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncH, fileDto } from '../utils/index.js';
import { analyze, SHELVES } from '../services/analyze.js';
import { getStorageSummary } from '../services/storage.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/summary',
  asyncH(async (req, res) => {
    const summary = await getStorageSummary(req.user._id, req.user.quotaBytes);
    res.json({ success: true, ...summary });
  })
);

router.get(
  '/collections',
  asyncH(async (req, res) => {
    const a = await analyze(req.user._id);
    const shelves = SHELVES.map((s) => {
      const items = a.files.filter(a.pick[s.key]);
      return { ...s, count: items.length, size: items.reduce((t, f) => t + f.size, 0) };
    });
    res.json({ success: true, shelves });
  })
);

router.get(
  '/insights',
  asyncH(async (req, res) => {
    const owner = req.user._id;
    const a = await analyze(owner);
    const [folderCount, activeDropBoxes, trashedCount, starredCount] = await Promise.all([
      Folder.countDocuments({ owner, trashed: false }),
      DropZone.countDocuments({ owner, active: true }),
      File.countDocuments({ owner, trashed: true }),
      File.countDocuments({ owner, trashed: false, starred: true }),
    ]);
    const byDate = (key) => (x, y) => new Date(y[key]) - new Date(x[key]);
    const top = (list, n = 6) => list.slice(0, n).map((f) => fileDto(f, a.dupIds));
    res.json({
      success: true,
      used: req.user.storageUsed,
      quota: req.user.quotaBytes,
      fileCount: a.files.length,
      folderCount,
      activeDropBoxes,
      trashedCount,
      starredCount,
      byType: Object.keys(a.byType).map((k) => ({ key: k, size: a.byType[k], count: a.byTypeCount[k] })),
      largest: top([...a.files].sort((x, y) => y.size - x.size)),
      recent: top([...a.files].sort(byDate('createdAt'))),
      duplicates: { groups: a.dupGroups, files: a.dupIds.size, reclaimable: a.reclaimable },
      neverOpened: { count: a.files.filter((f) => !f.openCount).length, items: top(a.files.filter((f) => !f.openCount).sort(byDate('createdAt'))) },
      old: { count: a.idsFor('old').length, items: top(a.files.filter(a.pick.old).sort(byDate('lastOpenedAt'))) },
    });
  })
);

export default router;
