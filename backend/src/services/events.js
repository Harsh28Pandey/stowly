/**
 * Real-time Server-Sent Events (SSE) event channel for Stowly.
 * Handles authenticated, per-user client rooms and admin room streams.
 */

const userClients = new Map(); // userId -> Set of res objects
const adminClients = new Set(); // Set of res objects for admins

export function addClient(userId, role, res) {
  const uid = String(userId);
  if (!userClients.has(uid)) {
    userClients.set(uid, new Set());
  }
  userClients.get(uid).add(res);

  if (role === 'ADMIN') {
    adminClients.add(res);
  }
}

export function removeClient(userId, role, res) {
  const uid = String(userId);
  if (userClients.has(uid)) {
    userClients.get(uid).delete(res);
    if (userClients.get(uid).size === 0) {
      userClients.delete(uid);
    }
  }
  adminClients.delete(res);
}

function sendSSE(res, eventName, payload) {
  try {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  } catch {
    // Client write error, will be cleaned up on socket end
  }
}

export function broadcastToUser(userId, eventName, payload = {}) {
  const uid = String(userId);
  const clients = userClients.get(uid);
  if (clients && clients.size > 0) {
    const data = { ...payload, timestamp: new Date().toISOString() };
    for (const res of clients) {
      sendSSE(res, eventName, data);
    }
  }
}

export function broadcastToAdmin(eventName, payload = {}) {
  if (adminClients.size > 0) {
    const data = { ...payload, timestamp: new Date().toISOString() };
    for (const res of adminClients) {
      sendSSE(res, eventName, data);
    }
  }
}

export function broadcastAll(eventName, payload = {}) {
  const data = { ...payload, timestamp: new Date().toISOString() };
  for (const set of userClients.values()) {
    for (const res of set) {
      sendSSE(res, eventName, data);
    }
  }
}
