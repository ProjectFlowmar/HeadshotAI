/**
 * Simple JSON-file-based order storage.
 * Orders: { orderId, email, package, status, stripeSessionId, imageUrl, results[], createdAt, completedAt }
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'orders.json');

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '{}');
}

function readAll() {
  ensureDir();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeAll(data) {
  ensureDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getOrder(orderId) {
  const all = readAll();
  return all[orderId] || null;
}

function getOrderByStripeSession(sessionId) {
  const all = readAll();
  return Object.values(all).find(o => o.stripeSessionId === sessionId) || null;
}

function getOrderByEmail(email) {
  const all = readAll();
  return Object.values(all).filter(o => o.email === email).sort((a, b) => b.createdAt - a.createdAt);
}

function createOrder(order) {
  const all = readAll();
  all[order.orderId] = { ...order, createdAt: Date.now() };
  writeAll(all);
  return all[order.orderId];
}

function updateOrder(orderId, updates) {
  const all = readAll();
  if (all[orderId]) {
    Object.assign(all[orderId], updates);
    writeAll(all);
  }
  return all[orderId] || null;
}

function getAllOrders() {
  return Object.values(readAll()).sort((a, b) => b.createdAt - a.createdAt);
}

module.exports = { getOrder, getOrderByStripeSession, getOrderByEmail, createOrder, updateOrder, getAllOrders };
