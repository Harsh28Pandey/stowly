import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { addClient, removeClient } from '../services/events.js';

const router = Router();

router.get('/events', requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const userId = req.user._id;
  const role = req.user.role;

  addClient(userId, role, res);

  // Send initial connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ userId, role, time: new Date().toISOString() })}\n\n`);

  // Send periodic ping heartbeat to prevent timeout
  const timer = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {
      clearInterval(timer);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(timer);
    removeClient(userId, role, res);
  });
});

export default router;
