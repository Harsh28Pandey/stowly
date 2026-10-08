import { Router } from 'express';
import { User, File, DropZone, AuditLog, Session, Notification } from '../models/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncH, httpError, isId, audit, notify } from '../utils/index.js';
import { broadcastToUser, broadcastToAdmin } from '../services/events.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const REASONS = ['Not eligible', 'Duplicate account', 'Invalid information', 'Other'];

// Metadata only. Vault data and password hashes are never selected or returned.
const adminUserDto = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  createdAt: u.createdAt,
  lastLoginAt: u.lastLoginAt,
  storageUsed: u.storageUsed || 0,
  quotaBytes: u.quotaBytes || 500 * 1024 * 1024 * 1024,
  reviewedAt: u.reviewedAt,
});
const SAFE_FIELDS = 'name email role status createdAt lastLoginAt storageUsed quotaBytes reviewedAt';

router.get(
  '/dashboard',
  asyncH(async (req, res) => {
    const [byStatus, files, storage, activeDrops, recent] = await Promise.all([
      User.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      File.countDocuments({}),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$storageUsed' } } }]),
      DropZone.countDocuments({ active: true }),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(12).populate('user', 'name email').lean(),
    ]);
    const c = Object.fromEntries(byStatus.map((s) => [s._id, s.n]));
    res.json({
      success: true,
      stats: {
        total: Object.values(c).reduce((a, b) => a + b, 0),
        pending: c.PENDING || 0,
        approved: c.APPROVED || 0,
        rejected: c.REJECTED || 0,
        suspended: c.SUSPENDED || 0,
        files,
        storageUsed: storage[0]?.total || 0,
        activeDropBoxes: activeDrops,
      },
      recent: recent.map((a) => ({
        id: a._id,
        action: a.action,
        createdAt: a.createdAt,
        user: a.user ? { name: a.user.name, email: a.user.email } : null,
        email: a.meta?.email,
      })),
    });
  })
);

router.get(
  '/users',
  asyncH(async (req, res) => {
    const filter = {};
    if (['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(req.query.status)) filter.status = req.query.status;
    if (req.query.q) {
      const rx = new RegExp(String(req.query.q).trim().slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }];
    }
    const users = await User.find(filter).select(SAFE_FIELDS).sort({ createdAt: -1 }).limit(300).lean();
    res.json({ success: true, users: users.map(adminUserDto) });
  })
);

async function target(req) {
  if (!isId(req.params.id)) throw httpError(404, 'User not found.');
  const u = await User.findById(req.params.id);
  if (!u) throw httpError(404, 'User not found.');
  if (u.role === 'ADMIN') throw httpError(403, 'Administrator accounts cannot be changed here.');
  return u;
}

router.patch(
  '/users/:id/approve',
  asyncH(async (req, res) => {
    const u = await target(req);
    if (!['PENDING', 'REJECTED'].includes(u.status)) throw httpError(400, 'Only pending or rejected accounts can be approved.');
    u.status = 'APPROVED';
    u.reviewedAt = new Date();
    u.rejectionReason = undefined;
    if (req.body.quotaGB && !isNaN(Number(req.body.quotaGB))) {
      u.quotaBytes = Math.round(Number(req.body.quotaGB) * 1024 * 1024 * 1024);
    }
    await u.save();
    await notify(u._id, 'account', `Your Stowly account has been approved with ${Math.round(u.quotaBytes / (1024 * 1024 * 1024))} GB storage limit. Welcome aboard!`);
    await audit(req.user._id, 'USER_APPROVED', { email: u.email, quotaGB: u.quotaBytes / (1024 * 1024 * 1024) });
    broadcastToUser(u._id, 'account_status_changed', { status: u.status });
    broadcastToAdmin('admin_queue_changed');
    res.json({ success: true, user: adminUserDto(u) });
  })
);

router.patch(
  '/users/:id/quota',
  asyncH(async (req, res) => {
    const u = await target(req);
    const quotaGB = Number(req.body.quotaGB);
    if (isNaN(quotaGB) || quotaGB <= 0) throw httpError(400, 'Please provide a valid positive storage limit in GB.');
    u.quotaBytes = Math.round(quotaGB * 1024 * 1024 * 1024);
    await u.save();
    await notify(u._id, 'account', `Your storage limit has been updated to ${quotaGB} GB.`);
    await audit(req.user._id, 'USER_QUOTA_UPDATED', { email: u.email, quotaGB });
    broadcastToUser(u._id, 'account_status_changed', { quotaBytes: u.quotaBytes });
    res.json({ success: true, user: adminUserDto(u) });
  })
);

router.patch(
  '/users/:id/reject',
  asyncH(async (req, res) => {
    const u = await target(req);
    if (u.status !== 'PENDING') throw httpError(400, 'Only pending accounts can be rejected.');
    const reason = REASONS.includes(req.body?.reason) ? req.body.reason : 'Other';
    u.status = 'REJECTED';
    u.rejectionReason = reason;
    u.reviewedAt = new Date();
    await u.save();
    await audit(req.user._id, 'USER_REJECTED', { email: u.email, reason });
    broadcastToUser(u._id, 'account_status_changed', { status: u.status });
    broadcastToAdmin('admin_queue_changed');
    res.json({ success: true, user: adminUserDto(u) });
  })
);

router.patch(
  '/users/:id/suspend',
  asyncH(async (req, res) => {
    const u = await target(req);
    if (u.status !== 'APPROVED') throw httpError(400, 'Only approved accounts can be suspended.');
    u.status = 'SUSPENDED';
    await u.save();
    await Session.updateMany({ user: u._id }, { revoked: true });
    await audit(req.user._id, 'USER_SUSPENDED', { email: u.email });
    broadcastToUser(u._id, 'account_status_changed', { status: u.status });
    broadcastToAdmin('admin_queue_changed');
    res.json({ success: true, user: adminUserDto(u) });
  })
);

router.patch(
  '/users/:id/reactivate',
  asyncH(async (req, res) => {
    const u = await target(req);
    if (u.status !== 'SUSPENDED') throw httpError(400, 'Only suspended accounts can be reactivated.');
    u.status = 'APPROVED';
    await u.save();
    await notify(u._id, 'account', 'Your Stowly account has been reactivated.');
    await audit(req.user._id, 'USER_REACTIVATED', { email: u.email });
    broadcastToUser(u._id, 'account_status_changed', { status: u.status });
    broadcastToAdmin('admin_queue_changed');
    res.json({ success: true, user: adminUserDto(u) });
  })
);


export default router;
