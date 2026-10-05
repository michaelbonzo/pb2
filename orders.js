'use strict';
// Prints recent orders: `npm run orders`
const store = require('./store');
const want = process.argv[2];
const rows = store.all().filter(o => !want || o.status === want).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50);
for (const o of rows) {
  console.log(`${o.createdAt.slice(0, 16).replace('T', ' ')}  ${o.reference}  $${(o.total / 100).toFixed(2).padStart(7)}  ${o.customer.name} · ${o.customer.phone} · ${o.fulfilment}, pays by ${o.method}${o.customer.address ? ' → ' + o.customer.address : ''}`);
  console.log('    ' + o.lines.map(l => `${l.qty}× ${l.name}`).join(', '));
}
if (!rows.length) console.log('No orders yet.');
