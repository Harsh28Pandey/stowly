# Stowly - Store smart. Share safe.

Stowly is a full-stack MERN web app that combines personal cloud storage, a zero-knowledge password Keyring and private Drop Boxes. **Every new account must be approved by the administrator before the user can sign in.**

## Dashboard map

| Area | Tabs |
| --- | --- |
| Workspace | Home Base (overview), My Stash (files), Just Opened (recent), Pinned (starred), Smart Shelves (smart collections), Drop Boxes, Space Pulse (storage insights), Recycle Bin (trash) |
| Keyring (password vault) | All Keys, Top Keys (favorites), Key Groups (categories), New Key (add password), Key Forge (password generator), Keyring Settings (vault settings) |
| Settings | Profile, Shield (security), Devices (sessions), Alerts (notifications), Personalize (preferences) |
| Admin (Control Room) | Overview, Pending Requests, All Members |

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS (light theme), React Router, Axios, Lucide icons, Sonner toasts
- **Backend:** Node.js, Express, MongoDB with Mongoose, JWT in HTTP-only cookies, bcrypt, Helmet, CORS, express-rate-limit, Multer

## Quick start

### 1. Requirements
- Node.js 18 or newer
- MongoDB (local install or a free MongoDB Atlas cluster)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Open `backend/.env` and set these values:

| Variable | Meaning |
| --- | --- |
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Frontend URL for CORS (`http://localhost:5173` in development) |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/stowly` for local MongoDB, or your Atlas connection string |
| `JWT_SECRET` | Long random string. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The first administrator. It is created automatically on the first start |
| `UPLOAD_DIR` | Where uploaded files are stored (default `./uploads`) |
| `MAX_FILE_MB` | Largest single upload (default `100`) |
| `STORAGE_QUOTA_MB` | Storage given to every user (default `1024`) |

Start it:

```bash
npm run dev
```

You should see `MongoDB connected` and `Stowly API running on http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. No frontend `.env` is needed in development because Vite proxies `/api` to the backend on port 5000.

### 4. Try the approval flow
1. Open `/register` and create an account. You will see: "Your account has been created and is waiting for administrator approval."
2. Try to sign in. You will be told the account is awaiting approval.
3. Sign in as the administrator (the email and password from `backend/.env`). You land in the Control Room.
4. Open **Pending Requests** and click **Approve** (or **Reject**).
5. The user can now sign in.

## Production (single server)

```bash
cd frontend && npm install && npm run build
cd ../backend && npm install
NODE_ENV=production npm start
```

When `frontend/dist` exists, the Express server serves it automatically, so one process serves both the site and the API. Put it behind HTTPS (required for the Keyring's Web Crypto API and for secure cookies). If the frontend is hosted separately, set `CLIENT_URL` to its address and proxy `/api` to the backend.

## How the approval gate works

- Registration creates the user with status `PENDING`. No session is created.
- Login is refused with a clear message for `PENDING`, `REJECTED` and `SUSPENDED` accounts.
- Every protected API call re-checks the account status, so suspending a user takes effect immediately and all of their sessions are revoked.
- Only users with the `ADMIN` role can reach `/api/admin/*`. Administrators cannot change other administrators.

## Keyring security design

- The master password never leaves the browser.
- A key is derived with PBKDF2-SHA256 (600,000 iterations, random 16-byte salt) using the Web Crypto API and kept in memory only (non-extractable).
- Every entry is encrypted with AES-256-GCM using a fresh random 12-byte IV before it is sent. MongoDB stores only ciphertext, the salt, a verifier ciphertext and non-sensitive metadata (name, domain, category, favorite flag).
- Admin APIs never select vault data. Passwords are never logged and never written to localStorage, sessionStorage or IndexedDB.
- The Keyring auto-locks after inactivity (5 / 10 / 30 minutes or never) and locks on sign-out. Copied passwords are cleared from the clipboard after 30 seconds. Revealed passwords hide again after 15 seconds.
- Password strength and reuse checks run locally. If you forget the master password, the data cannot be recovered. That is the zero-knowledge trade-off.

## Other security measures

Helmet headers, rate limiting on sign-in and registration, bcrypt (12 rounds), HTTP-only SameSite cookies, server-side session revocation, per-user ownership checks on every file/folder/vault query (no IDOR), random on-disk file names (no path traversal), blocked executable uploads, safe inline preview types only, quota enforcement and SHA-256 duplicate detection.

## Project structure

```
stowly/
  backend/
    src/
      index.js            server start + first admin creation
      app.js              middleware and route mounting
      models/             User, Session, File, Folder, DropZone, VaultEntry, Notification, AuditLog
      routes/             auth, account, files, folders, storage, dropzones, vault, admin
      middleware/         auth + admin guards
      services/           storage (disk layer), analyze (insights and shelves)
      utils/
  frontend/
    src/
      pages/              Landing, auth, Home, FileBrowser, Shelves, DropBoxes, SpacePulse, Settings, Admin, keyring/
      components/         Shell (responsive layout), ui helpers
      crypto.js           Keyring cryptography
      vault.jsx           Keyring state, lock/unlock, auto-lock
```

## Notes

- Files are stored on local disk under `UPLOAD_DIR`. `backend/src/services/storage.js` is the only module that touches the disk, so it can be swapped for S3 or Cloudflare R2 later. On hosts with ephemeral disks, mount a persistent volume for `UPLOAD_DIR`.
- Approval notifications appear in the user's **Alerts** tab. Email delivery is not included.
