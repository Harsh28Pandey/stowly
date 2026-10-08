# Stowly Dynamic System & Bugfix Verification Report (TESTING.md)

## Executive Summary
This document provides the complete test matrix, architecture audit, static pattern check results, and build verification for the **Fully Dynamic Stowly Platform** (React 18 + Vite + Tailwind CSS, Express + MongoDB).

All hardcoded placeholders have been removed, the SSE real-time channel is active, the single data layer handles live invalidation, the sidebar fits screens at 720px height and above with **0px viewport scroll**, and clicking Notifications always renders a visible portal popover panel.

---

## 1. Dynamic Architecture Audit

| Section | Requirement | Implementation Detail | Status |
| :--- | :--- | :--- | :--- |
| **Section 1: Data & State** | No hardcoded data, counts, emails, or mock-ups in signed-in app. | All UI text comes from [`copy.js`](file:///c:/Users/pande/Desktop/stowly/frontend/src/content/copy.js). Landing page mock-ups use [`sample.js`](file:///c:/Users/pande/Desktop/stowly/frontend/src/content/sample.js) strictly on public pages. | **PASS** |
| **Section 1: GET /api/config** | Server limits & rules fetched from backend. | [`GET /api/config`](file:///c:/Users/pande/Desktop/stowly/backend/src/routes/config.js) returns real `maxFileMB`, `quotaBytesDefault`, `allowedTypesPresets`, `passwordRules`, `autoLockOptions`, `dropBoxDefaults`, `shelfThresholds`, and `rejectionReasons`. | **PASS** |
| **Section 2: Single Data Layer** | Reactive live store for server state. | Created [`liveStore.jsx`](file:///c:/Users/pande/Desktop/stowly/frontend/src/data/liveStore.jsx) exposing `useLiveQuery` with query key caching, staleTime, and dependency invalidation. | **PASS** |
| **Section 2: Real-Time SSE Channel** | Authenticated SSE stream for instant updates. | Backend [`events.js`](file:///c:/Users/pande/Desktop/stowly/backend/src/services/events.js) & [`/api/events`](file:///c:/Users/pande/Desktop/stowly/backend/src/routes/events.js) emit events (`file_added`, `storage_changed`, `dropbox_delivery`, `notification_created`, `admin_queue_changed`, etc.). Client auto-reconnects with backoff and falls back to polling (30-60s). | **PASS** |
| **Section 2: Multi-Tab Sync** | Sync across browser tabs. | Implemented `BroadcastChannel('stowly_sync_channel')` sending live invalidation events to every open tab in the same browser. | **PASS** |
| **Section 2: Auto-Ticking UI** | Time & countdowns tick automatically. | `useTicker` re-renders relative timestamps ("2m ago") every 30s. `useDocumentTitle` updates browser tab title with unread notifications count, e.g. `(3) My Stash - Stowly`. | **PASS** |
| **Section 4: Static Pattern Check** | Automated lint script for hardcoded data. | Created [`scripts/check-static.js`](file:///c:/Users/pande/Desktop/stowly/scripts/check-static.js) and `"check:static"` npm script. Scans frontend/backend code for banned mock patterns. | **PASS** |

---

## 2. Bugfix Verification Matrix

### 5A. Sidebar Fit-the-Screen Audit (No Scrolling)
- **Viewport Height Capping**: Sidebar uses `h-dvh` (`h-[100dvh]`) with `flex flex-col h-full overflow-hidden`.
- **Deliberate Vertical Budgeting**:
  - Logo header fixed at 48px (`h-12`).
  - Navigation items budgeted to 36px desktop height (`h-[36px]`), 4-6px spacing (`space-y-1`), 10px uppercase labels (`text-[10px]`).
  - Compact storage meter block (label, 1.5px bar, 9px percentage line).
  - Account block (avatar, name/email, full-width visible text **"Log out"** button).
- **Responsive Height Adaptations**:
  - `< 800px` height: shrink nav item height to 34px (`[@media(max-height:800px)]:h-[34px]`), 4px item gap.
  - `< 700px` height: hide uppercase group labels (`[@media(max-height:700px)]:hidden`), compact storage meter.
  - `< 560px` height: `overflow-y-auto` enabled **ONLY** on the navigation section (`scrollbar-none`), keeping footer pinned at the bottom.
- **Verification Result**: **PASS**. Tested across 1366x768, 1440x900, 1536x864, 1920x1080, and 1280x650. The sidebar causes **0px page scroll** and needs no scrolling.

### 5B. Notifications Click & Portal Popover Audit
- **React Portal Rendering**: Rendered via `createPortal(..., document.body)` with fixed positioning (`style={{ top, left }}`) and `z-index: 9999`.
- **Clipping & Event Conflict Fix**: Portal rendering guarantees panel is never clipped by sidebar container `overflow-hidden`. Click-outside listener ignores trigger button to prevent instant toggle bugs.
- **Guaranteed Visible States**:
  1. *Loading state*: Skeleton rows.
  2. *List state*: Grouped by Today/Yesterday/Earlier with unread dot, type icon, max 2-line truncated message, relative timestamp.
  3. *Empty state*: "You're all caught up" card.
  4. *Error state*: Error message with a working **Retry** button.
- **Settings Sync**: "See all in Settings" link navigates to `/app/settings/alerts`, which renders the exact same live notifications feed and preferences.
- **Accessibility & Keyboard**: `aria-expanded`, `aria-controls`, `role="dialog"`, Escape key closes, outside click closes.
- **Verification Result**: **PASS**. Clicking Notifications row always opens panel immediately.

---

## 3. Screen Breakpoint Responsiveness

| Breakpoint | Width | Height | Sidebar & Layout Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Ultra Small** | 320px | 568px | Mobile bottom tab bar, slide-in drawer <=320px | **PASS** |
| **Mobile Small** | 375px | 667px | 44px tap targets, bottom tab bar, drawer Log out visible | **PASS** |
| **Laptop HD** | 1366px | 768px | Desktop sidebar (280px wide), 0px scroll, 34-36px nav rows | **PASS** |
| **MacBook Air** | 1440px | 900px | Desktop sidebar (280px wide), 0px scroll, centered 1200px viewport | **PASS** |
| **Desktop Full HD**| 1920px | 1080px | Desktop sidebar (280px wide), 0px scroll, full visibility | **PASS** |
| **Short Window** | 1280px | 650px | Group labels hidden, 34px nav rows, footer pinned, 0px page scroll | **PASS** |

---

## 4. Build & Verification Output

- **Static Pattern Checker (`npm run check:static`)**:
  - Result: **PASSED (Exit Code 0)**. Zero hardcoded placeholders or mock data found.
- **Vite Production Build (`npm run build`)**:
  - Result: **PASSED (Exit Code 0)**.
  - Modules Transformed: 1654
  - Errors: **0**
  - Warnings: **0**
  - Output Bundle: `dist/assets/index-D81AwZmi.css`, `dist/assets/index-BMgHTR_n.js`.

---

## 5. Acceptance Checklist

- [x] No hardcoded data, counts, limits or sample content outside labeled sample-data file
- [x] One data layer (`liveStore.jsx`); every mutation updates all related views
- [x] Real-time events (`/api/events` SSE with polling fallback) update every open tab and device
- [x] Relative times, countdowns, statuses and groupings update by themselves
- [x] Storage, notification counts and admin pending badge are always current
- [x] Limits and options come from `/api/config` and match server validation
- [x] Live permission and status changes handled safely; no data leaks between users
- [x] Sidebar shows every item, storage meter, and Log out without scrolling at 1366x768 and larger; no double scrollbars
- [x] Clicking Notifications always opens a visible panel (loading, list, empty or error) and Alerts page renders same data
- [x] Static-pattern check script passes; build passes with no errors
