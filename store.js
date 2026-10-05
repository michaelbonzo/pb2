'use strict';
// Tiny order store: one JSON file, written atomically (temp file + rename) and serialised through a queue
// so two requests can never interleave writes. Fine for a single bakery; move to a database if you
// run more than one server instance.

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'orders.json');

fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });

let orders = new Map();
try {
  const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  orders = new Map(Object.entries(raw));
} catch (e) {
  if (e.code !== 'ENOENT') { console.error('Could not read order store:', e.message); process.exit(1); }
}

let queue = Promise.resolve();
function persist() {
  const snapshot = JSON.stringify(Object.fromEntries(orders), null, 1);
  queue = queue.then(async () => {
    const tmp = FILE + '.' + process.pid + '.tmp';
    await fs.promises.writeFile(tmp, snapshot, { mode: 0o600 });
    await fs.promises.rename(tmp, FILE);
  }).catch(err => console.error('Order store write failed:', err.message));
  return queue;
}

module.exports = {
  get: id => orders.get(id),
  findByReference: ref => { for (const o of orders.values()) if (o.reference === ref) return o; return undefined; },
  save: order => { orders.set(order.id, order); return persist(); },
  all: () => [...orders.values()],
  countSince: ms => { let n = 0; for (const o of orders.values()) if (Date.parse(o.createdAt) >= ms) n++; return n; },
};
