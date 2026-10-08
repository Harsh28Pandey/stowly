import { File } from '../models/index.js';
import { fileKind } from '../utils/index.js';

const DAY = 24 * 60 * 60 * 1000;
export const LARGE_BYTES = 25 * 1024 * 1024;
export const OLD_DAYS = 90;

export const SHELVES = [
  { key: 'images', label: 'Pictures', desc: 'Photos, screenshots and graphics' },
  { key: 'videos', label: 'Videos', desc: 'Clips and recordings' },
  { key: 'audio', label: 'Audio', desc: 'Music, voice notes and podcasts' },
  { key: 'documents', label: 'Documents', desc: 'PDFs, text files, sheets and slides' },
  { key: 'archives', label: 'Archives', desc: 'ZIP, RAR and other bundles' },
  { key: 'large', label: 'Heavy hitters', desc: 'Files of 25 MB or more' },
  { key: 'old', label: 'Gathering dust', desc: `Not opened in ${OLD_DAYS}+ days` },
  { key: 'duplicates', label: 'Look-alikes', desc: 'Files with identical content' },
  { key: 'unopened', label: 'Never opened', desc: 'Uploaded but never viewed or downloaded' },
];

export async function analyze(ownerId) {
  const files = await File.find({ owner: ownerId, trashed: false })
    .select('name mime size hash createdAt lastOpenedAt openCount')
    .lean();

  const byType = { images: 0, videos: 0, audio: 0, documents: 0, archives: 0, other: 0 };
  const byTypeCount = { ...byType };
  const byHash = new Map();
  for (const f of files) {
    const k = fileKind(f.mime, f.name);
    byType[k] += f.size;
    byTypeCount[k] += 1;
    if (f.hash) byHash.set(f.hash, [...(byHash.get(f.hash) || []), f]);
  }

  const dupIds = new Set();
  let reclaimable = 0;
  let dupGroups = 0;
  for (const group of byHash.values()) {
    if (group.length < 2) continue;
    dupGroups += 1;
    group.forEach((f) => dupIds.add(String(f._id)));
    reclaimable += group.slice(1).reduce((s, f) => s + f.size, 0);
  }

  const cutoff = Date.now() - OLD_DAYS * DAY;
  const pick = {
    images: (f) => fileKind(f.mime, f.name) === 'images',
    videos: (f) => fileKind(f.mime, f.name) === 'videos',
    audio: (f) => fileKind(f.mime, f.name) === 'audio',
    documents: (f) => fileKind(f.mime, f.name) === 'documents',
    archives: (f) => fileKind(f.mime, f.name) === 'archives',
    large: (f) => f.size >= LARGE_BYTES,
    old: (f) => new Date(f.lastOpenedAt || f.createdAt).getTime() < cutoff,
    duplicates: (f) => dupIds.has(String(f._id)),
    unopened: (f) => !f.openCount,
  };
  const idsFor = (key) => files.filter(pick[key] || (() => false)).map((f) => f._id);

  return { files, byType, byTypeCount, dupIds, dupGroups, reclaimable, pick, idsFor };
}
