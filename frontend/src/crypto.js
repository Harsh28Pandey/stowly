/**
 * Keyring cryptography (browser only), built on the Web Crypto API.
 *
 *  master password --PBKDF2-SHA256 (600k iterations, random 16-byte salt)--> AES-256-GCM key
 *  each entry      --AES-GCM with a fresh random 12-byte IV-->               { iv, ct }
 *
 * The key is created as non-extractable and lives only in memory. The server
 * stores the salt, a verifier ciphertext (to check the master password) and the
 * encrypted entries. It never sees the master password or any plaintext.
 * Note: Web Crypto requires HTTPS (or localhost).
 */
const enc = new TextEncoder();
const dec = new TextDecoder();
const ITERATIONS = 600000;

export const toB64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
export const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export const newSalt = () => toB64(crypto.getRandomValues(new Uint8Array(16)));

export async function deriveKey(masterPassword, saltB64) {
  const base = await crypto.subtle.importKey('raw', enc.encode(masterPassword), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(saltB64), iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptJSON(key, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value)));
  return { iv: toB64(iv), ct: toB64(ct) };
}

export async function decryptJSON(key, { iv, ct }) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, key, fromB64(ct));
  return JSON.parse(dec.decode(plain));
}

export const VERIFIER_TEXT = { check: 'stowly-keyring-v1' };

/** Cryptographically secure password generator (rejection sampling avoids modulo bias). */
export function generatePassword({ length = 20, upper = true, lower = true, numbers = true, symbols = true } = {}) {
  const sets = [];
  if (upper) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ');
  if (lower) sets.push('abcdefghijkmnopqrstuvwxyz');
  if (numbers) sets.push('23456789');
  if (symbols) sets.push('!@#$%^&*()-_=+[]{};:,.?');
  if (!sets.length) return '';
  const all = sets.join('');
  const rand = (max) => {
    const limit = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % max;
  };
  const chars = sets.map((s) => s[rand(s.length)]); // guarantee one char from each chosen set
  while (chars.length < length) chars.push(all[rand(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, length).join('');
}

/** Local password strength estimate. Passwords are never sent anywhere. */
export function strength(pw = '') {
  if (!pw) return { score: 0, label: 'Empty', color: 'bg-slate-200', text: 'text-slate-500' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (pw.length >= 16) s++;
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (classes >= 3) s++;
  if (classes === 4) s++;
  if (/(.)\1{2,}/.test(pw) || /password|1234|qwerty|letmein/i.test(pw)) s = Math.max(0, s - 2);
  const levels = [
    { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' },
    { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' },
    { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' },
    { label: 'Good', color: 'bg-yellow-500', text: 'text-yellow-600' },
    { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' },
    { label: 'Very strong', color: 'bg-emerald-600', text: 'text-emerald-700' },
  ];
  return { score: Math.max(1, s), ...levels[Math.min(s, 5)] };
}
