import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import accountRoutes from './routes/account.js';
import filesRoutes from './routes/files.js';
import foldersRoutes from './routes/folders.js';
import storageRoutes from './routes/storage.js';
import vaultRoutes from './routes/vault.js';
import adminRoutes from './routes/admin.js';
import configRoutes from './routes/config.js';
import eventsRoutes from './routes/events.js';
import { ownerRouter as dropZoneRoutes, publicRouter as dropPublicRoutes } from './routes/dropzones.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/config', configRoutes);
app.use('/api', eventsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/folders', foldersRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/drop-zones', dropZoneRoutes);
app.use('/api/drop', dropPublicRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Serve the built frontend when it exists (single-server deployment).
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = `A file is larger than the ${process.env.MAX_FILE_MB || 100} MB limit.`;
  } else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    status = 400;
    message = 'Too many files in one upload.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid request body.';
  } else if (err.name === 'CastError' || err.name === 'ValidationError') {
    status = 400;
    message = 'Invalid request.';
  }
  if (status >= 500) {
    console.error('[error]', err.message);
    message = 'Something went wrong on our side. Please try again.';
  }
  res.status(status).json({ success: false, message, ...(err.extra || {}) });
});

export default app;
