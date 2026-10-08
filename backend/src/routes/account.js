import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Session, Notification } from '../models/index.js';
import { asyncH, httpError, audit, isId, userDto, validPassword, PASSWORD_RULE } from '../utils/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.patch(
  '/profile',
  asyncH(async (req, res) => {
    const name = String(req.body?.name ?? req.user.name).trim();
    const bio = String(req.body?.bio ?? req.user.bio).trim();
    if (name.length < 2 || name.length > 80) throw httpError(400, 'Please enter a valid name.');
    if (bio.length > 300) throw httpError(400, 'Bio can be at most 300 characters.');
    req.user.name = name;
    req.user.bio = bio;
    await req.user.save();
    res.json({ success: true, user: userDto(req.user) });
  })
);

router.post(
  '/password',
  asyncH(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!(await bcrypt.compare(String(currentPassword || ''), req.user.passwordHash)))
      throw httpError(400, 'Your current password is incorrect.');
    if (!validPassword(newPassword)) throw httpError(400, PASSWORD_RULE);
    req.user.passwordHash = await bcrypt.hash(newPassword, 12);
    await req.user.save();
    await Session.updateMany({ user: req.user._id, _id: { $ne: req.session._id } }, { revoked: true });
    await audit(req.user._id, 'PASSWORD_CHANGED');
    res.json({ success: true, message: 'Password updated. Your other devices have been signed out.' });
  })
);

router.patch(
  '/prefs',
  asyncH(async (req, res) => {
    const b = req.body || {};
    if (b.view !== undefined) {
      if (!['grid', 'list'].includes(b.view)) throw httpError(400, 'Invalid view option.');
      req.user.prefs.view = b.view;
    }
    for (const k of ['notifyDrops', 'notifyAccount', 'notifyStorage'])
      if (typeof b[k] === 'boolean') req.user.prefs[k] = b[k];
    await req.user.save();
    res.json({ success: true, user: userDto(req.user) });
  })
);

router.get(
  '/sessions',
  asyncH(async (req, res) => {
    const list = await Session.find({ user: req.user._id, revoked: false }).sort({ lastActive: -1 }).lean();
    res.json({
      success: true,
      sessions: list.map((s) => ({
        id: s._id,
        device: s.device,
        browser: s.browser,
        createdAt: s.createdAt,
        lastActive: s.lastActive,
        current: String(s._id) === String(req.session._id),
      })),
    });
  })
);

router.post(
  '/sessions/revoke-others',
  asyncH(async (req, res) => {
    await Session.updateMany({ user: req.user._id, _id: { $ne: req.session._id } }, { revoked: true });
    res.json({ success: true });
  })
);

router.delete(
  '/sessions/:id',
  asyncH(async (req, res) => {
    if (!isId(req.params.id)) throw httpError(404, 'Session not found.');
    if (String(req.params.id) === String(req.session._id)) throw httpError(400, 'Use Sign out to end this device.');
    const r = await Session.updateOne({ _id: req.params.id, user: req.user._id }, { revoked: true });
    if (!r.matchedCount) throw httpError(404, 'Session not found.');
    res.json({ success: true });
  })
);

router.get(
  '/notifications',
  asyncH(async (req, res) => {
    const items = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({
      success: true,
      unread: items.filter((n) => !n.read).length,
      notifications: items.map((n) => ({ id: n._id, type: n.type, message: n.message, read: n.read, createdAt: n.createdAt })),
    });
  })
);

router.post(
  '/notifications/read',
  asyncH(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  })
);

export default router;
