import { Router } from 'express';
import { VaultEntry, User } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncH, httpError, isId, audit } from '../utils/index.js';

/**
 * Keyring (password vault) API.
 * Zero-knowledge: the server stores only ciphertext produced in the browser,
 * a random salt and a verifier ciphertext. It never receives the master password
 * or any decrypted entry, and treats `payload` as opaque data.
 */
const router = Router();
router.use(requireAuth);

export const CATEGORIES = ['Login', 'Banking', 'Social', 'Work', 'Personal', 'Wi-Fi', 'Server', 'API', 'Other'];
const B64 = /^[A-Za-z0-9+/=]+$/;

function checkBlob(b, label) {
  if (!b || typeof b.iv !== 'string' || typeof b.ct !== 'string' || !B64.test(b.iv) || !B64.test(b.ct))
    throw httpError(400, `Invalid ${label}.`);
  if (b.iv.length > 64 || b.ct.length > 30000) throw httpError(400, `${label} is too large.`);
  return { iv: b.iv, ct: b.ct };
}

const dto = (e) => ({
  id: e._id,
  payload: e.payload,
  category: e.category,
  nameMeta: e.nameMeta,
  domainMeta: e.domainMeta,
  favorite: e.favorite,
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
});

function parseEntry(b = {}) {
  const out = {};
  if (b.payload !== undefined) out.payload = checkBlob(b.payload, 'encrypted data');
  if (b.category !== undefined) {
    if (!CATEGORIES.includes(b.category)) throw httpError(400, 'Invalid category.');
    out.category = b.category;
  }
  if (b.nameMeta !== undefined) out.nameMeta = String(b.nameMeta).slice(0, 100);
  if (b.domainMeta !== undefined) out.domainMeta = String(b.domainMeta).slice(0, 100);
  if (typeof b.favorite === 'boolean') out.favorite = b.favorite;
  return out;
}

router.get('/categories', (req, res) => res.json({ success: true, categories: CATEGORIES }));

router.get('/status', (req, res) => {
  const v = req.user.vault || {};
  res.json({
    success: true,
    initialized: Boolean(v.salt && v.verifier?.ct),
    salt: v.salt || null,
    verifier: v.verifier?.ct ? { iv: v.verifier.iv, ct: v.verifier.ct } : null,
    autoLockMinutes: v.autoLockMinutes ?? 10,
  });
});

router.post(
  '/setup',
  asyncH(async (req, res) => {
    if (req.user.vault?.salt) throw httpError(409, 'Your Keyring is already set up.');
    const { salt, verifier } = req.body || {};
    if (typeof salt !== 'string' || !B64.test(salt) || salt.length > 64) throw httpError(400, 'Invalid salt.');
    const v = checkBlob(verifier, 'verifier');
    await User.updateOne({ _id: req.user._id }, { $set: { 'vault.salt': salt, 'vault.verifier': v } });
    await audit(req.user._id, 'VAULT_CREATED');
    res.status(201).json({ success: true });
  })
);

router.patch(
  '/settings',
  asyncH(async (req, res) => {
    const m = Number(req.body?.autoLockMinutes);
    if (![0, 5, 10, 30].includes(m)) throw httpError(400, 'Invalid auto-lock option.');
    await User.updateOne({ _id: req.user._id }, { $set: { 'vault.autoLockMinutes': m } });
    res.json({ success: true, autoLockMinutes: m });
  })
);

router.post(
  '/event',
  asyncH(async (req, res) => {
    const type = req.body?.type === 'locked' ? 'VAULT_LOCKED' : 'VAULT_UNLOCKED';
    await audit(req.user._id, type);
    res.json({ success: true });
  })
);

router.get(
  '/entries',
  asyncH(async (req, res) => {
    const list = await VaultEntry.find({ owner: req.user._id }).sort({ updatedAt: -1 }).limit(2000).lean();
    res.json({ success: true, entries: list.map(dto) });
  })
);

router.post(
  '/entries',
  asyncH(async (req, res) => {
    const data = parseEntry(req.body);
    if (!data.payload) throw httpError(400, 'Encrypted data is required.');
    const e = await VaultEntry.create({ ...data, owner: req.user._id });
    await audit(req.user._id, 'VAULT_ENTRY_CREATED');
    res.status(201).json({ success: true, entry: dto(e) });
  })
);

async function own(req) {
  if (!isId(req.params.id)) throw httpError(404, 'Entry not found.');
  const e = await VaultEntry.findOne({ _id: req.params.id, owner: req.user._id });
  if (!e) throw httpError(404, 'Entry not found.');
  return e;
}

router.get('/entries/:id', asyncH(async (req, res) => res.json({ success: true, entry: dto(await own(req)) })));

router.patch(
  '/entries/:id',
  asyncH(async (req, res) => {
    const e = await own(req);
    const data = parseEntry(req.body);
    Object.assign(e, data);
    await e.save();
    if (data.payload) await audit(req.user._id, 'VAULT_ENTRY_UPDATED');
    res.json({ success: true, entry: dto(e) });
  })
);

router.delete(
  '/entries/:id',
  asyncH(async (req, res) => {
    const e = await own(req);
    await e.deleteOne();
    await audit(req.user._id, 'VAULT_ENTRY_DELETED');
    res.json({ success: true });
  })
);

export default router;
