import jwt from 'jsonwebtoken';
import { Session, User } from '../models/index.js';
import { asyncH, httpError, STATUS_MESSAGES } from '../utils/index.js';

export const COOKIE = 'stowly_token';

export const requireAuth = asyncH(async (req, res, next) => {
  const token = req.cookies?.[COOKIE];
  if (!token) throw httpError(401, 'Please sign in to continue.');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw httpError(401, 'Your session has expired. Please sign in again.');
  }
  const session = await Session.findById(payload.sid);
  if (!session || session.revoked) throw httpError(401, 'Your session has ended. Please sign in again.');
  const user = await User.findById(payload.uid);
  if (!user) throw httpError(401, 'Please sign in to continue.');
  if (user.status !== 'APPROVED')
    throw httpError(403, STATUS_MESSAGES[user.status] || 'Your account cannot access Stowly.', { status: user.status });
  
  // Auto-migrate legacy user accounts to 500 GB quota default
  const DEFAULT_500GB = 500 * 1024 * 1024 * 1024;
  if (!user.quotaBytes || user.quotaBytes < 5 * 1024 * 1024 * 1024) {
    user.quotaBytes = DEFAULT_500GB;
    await user.save();
  }
  if (Date.now() - new Date(session.lastActive).getTime() > 60 * 1000) {
    session.lastActive = new Date();
    await session.save();
  }
  req.user = user;
  req.session = session;
  next();
});

export const requireAdmin = (req, res, next) => {
  if (req.user?.role === 'ADMIN') return next();
  next(httpError(403, 'You do not have permission to do that.'));
};
