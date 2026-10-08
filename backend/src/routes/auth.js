import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Session } from '../models/index.js';
import { asyncH, httpError, audit, parseUA, userDto, validPassword, PASSWORD_RULE, STATUS_MESSAGES } from '../utils/index.js';
import { requireAuth, COOKIE } from '../middleware/auth.js';

const router = Router();
const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

import { broadcastToAdmin } from '../services/events.js';

router.post(
  '/register',
  asyncH(async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = req.body?.password;
    if (name.length < 2 || name.length > 80) throw httpError(400, 'Please enter your full name.');
    if (!EMAIL_RE.test(email)) throw httpError(400, 'Please enter a valid email address.');
    if (!validPassword(password)) throw httpError(400, PASSWORD_RULE);
    if (await User.exists({ email })) throw httpError(409, 'An account with this email already exists.');
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), status: 'PENDING' });
    await audit(user._id, 'USER_REGISTERED', { email });
    broadcastToAdmin('admin_queue_changed', { email, name });
    res.status(201).json({
      success: true,
      message: 'Your account has been created and is waiting for administrator approval.',
    });
  })
);

router.post(
  '/login',
  asyncH(async (req, res) => {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');
    const user = await User.findOne({ email });
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) {
      await audit(user?._id, 'LOGIN_FAILED', { email });
      throw httpError(401, 'Invalid email or password.');
    }
    if (user.status !== 'APPROVED') {
      await audit(user._id, 'LOGIN_BLOCKED', { status: user.status });
      throw httpError(403, STATUS_MESSAGES[user.status] || 'Your account cannot sign in.', { status: user.status });
    }
    const { device, browser } = parseUA(req.headers['user-agent']);
    const session = await Session.create({ user: user._id, device, browser });
    user.lastLoginAt = new Date();
    await user.save();
    const token = jwt.sign({ uid: String(user._id), sid: String(session._id) }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie(COOKIE, token, cookieOpts);
    await audit(user._id, 'LOGIN_SUCCESS', { device, browser });
    res.json({ success: true, user: userDto(user) });
  })
);

router.post(
  '/logout',
  asyncH(async (req, res) => {
    try {
      const p = jwt.verify(req.cookies?.[COOKIE] || '', process.env.JWT_SECRET);
      await Session.updateOne({ _id: p.sid }, { revoked: true });
    } catch {
      /* already signed out */
    }
    res.clearCookie(COOKIE, { ...cookieOpts, maxAge: undefined });
    res.json({ success: true });
  })
);

router.get('/me', requireAuth, (req, res) => res.json({ success: true, user: userDto(req.user) }));

export default router;
