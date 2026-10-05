'use strict';
/*
 * Prime Baking web shop server.
 *
 * Customers place orders online and pay on delivery or at collection, so no payment details are ever
 * sent to this site. The browser sends only product ids and quantities; every price and total is worked
 * out here from catalog.js, so editing the page can't change what an order costs.
 */

require('./env').load();
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const C = require('./catalog');
const store = require('./store');

// ---------- configuration ----------
const PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/+$/, '');

function fatal(msg) { console.error('Startup refused: ' + msg); process.exit(1); }
if (!/^https?:\/\/[^/]+$/.test(PUBLIC_URL)) fatal('PUBLIC_URL must be the site origin, e.g. https://primebaking.co.zw');
if (PROD && !PUBLIC_URL.startsWith('https://')) fatal('PUBLIC_URL must use https:// in production.');
const TRUST_HOPS = Number(process.env.TRUST_PROXY);
if (!Number.isInteger(TRUST_HOPS) || TRUST_HOPS < 0 || TRUST_HOPS > 5) fatal('TRUST_PROXY must be set to the exact number of proxies in front of the app (0 if none, usually 1 on hosting platforms).');

// ---------- helpers ----------
const clean = (s, max) => String(s).normalize('NFC').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const isPlainObject = v => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
const onlyKeys = (obj, allowed) => Object.keys(obj).every(k => allowed.includes(k));
// Linear-time email pattern (no nested quantifiers), so crafted input can't stall the server.
const EMAIL_RE = /^[A-Za-z0-9_]+(?:[.+-][A-Za-z0-9_]+)*@[A-Za-z0-9_]+(?:[.-][A-Za-z0-9_]+)*\.[A-Za-z]{2,24}$/;
const ZW_MOBILE_RE = /^07[1378]\d{7}$/; // Econet 077/078, NetOne 071, Telecel 073
const PAY_METHODS = ['cash', 'ecocash', 'card'];

class BadRequest extends Error {}

function validateOrder(body) {
  if (!isPlainObject(body) || !onlyKeys(body, ['items', 'customer', 'method', 'fulfilment'])) throw new BadRequest('Unexpected fields in request.');
  const { items, customer, method, fulfilment } = body;

  if (!Array.isArray(items) || items.length === 0) throw new BadRequest('Your cart is empty.');
  if (items.length > C.MAX_LINES) throw new BadRequest('Too many different items in one order.');
  const lines = new Map();
  for (const it of items) {
    if (!isPlainObject(it) || !onlyKeys(it, ['id', 'qty'])) throw new BadRequest('Invalid cart item.');
    if (typeof it.id !== 'string' || !Object.prototype.hasOwnProperty.call(C.PRODUCTS, it.id)) throw new BadRequest('A product in your cart is no longer available.');
    if (!Number.isInteger(it.qty) || it.qty < 1 || it.qty > C.MAX_QTY_PER_LINE) throw new BadRequest('Invalid quantity.');
    lines.set(it.id, (lines.get(it.id) || 0) + it.qty);
  }
  for (const q of lines.values()) if (q > C.MAX_QTY_PER_LINE) throw new BadRequest('Invalid quantity.');

  if (!PAY_METHODS.includes(method)) throw new BadRequest('Choose how you will pay.');
  if (!['delivery', 'collect'].includes(fulfilment)) throw new BadRequest('Choose delivery or collection.');

  if (!isPlainObject(customer) || !onlyKeys(customer, ['name', 'email', 'phone', 'address'])) throw new BadRequest('Invalid customer details.');
  const name = clean(customer.name || '', 80);
  const email = clean(customer.email || '', 254).toLowerCase();
  const phone = String(customer.phone || '').replace(/[\s-]/g, '').replace(/^\+?263/, '0');
  const address = clean(customer.address || '', 200);
  if (name.length < 2) throw new BadRequest('Enter your name.');
  if (!ZW_MOBILE_RE.test(phone)) throw new BadRequest('Enter a valid Zimbabwe mobile number, like 0771234567.');
  if (email && (email.length > 254 || !EMAIL_RE.test(email))) throw new BadRequest('Check your email address, or leave it blank.');
  if (fulfilment === 'delivery' && address.length < 6) throw new BadRequest('Enter a delivery address.');

  // Price everything server-side.
  const priced = [...lines].map(([id, qty]) => ({ id, qty, name: C.PRODUCTS[id].name, cents: C.PRODUCTS[id].cents * qty }));
  const subtotal = priced.reduce((s, l) => s + l.cents, 0);
  const delivery = fulfilment === 'delivery' && subtotal < C.FREE_DELIVERY_FROM_CENTS ? C.DELIVERY_CENTS : 0;
  const total = subtotal + delivery;
  if (total <= 0 || total > C.MAX_ORDER_CENTS) throw new BadRequest('Orders over $1,000 need to be placed with the shop directly.');

  return { lines: priced, subtotal, delivery, total, method, fulfilment, customer: { name, email, phone, address: fulfilment === 'delivery' ? address : '' } };
}

// ---------- app ----------
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', TRUST_HOPS);

if (PROD) {
  app.use((req, res, next) => (req.secure ? next() : res.redirect(301, PUBLIC_URL + req.originalUrl)));
}

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ['https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      ...(PROD ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  strictTransportSecurity: PROD ? { maxAge: 63072000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false,
}));
app.use((req, res, next) => { res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()'); next(); });

const apiLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false });
const orderLimiter = rateLimit({ windowMs: 10 * 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Too many orders from this device. Please wait a few minutes and try again.' } });
const phoneLimiter = rateLimit({ windowMs: 60 * 60_000, limit: 4, standardHeaders: 'draft-7', legacyHeaders: false,
  keyGenerator: req => 'phone:' + String(req.body?.customer?.phone || '').replace(/\D/g, '').slice(-9),
  message: { error: 'Too many orders for this number. Please call the shop if you need to change an order.' } });
const MAX_ORDERS_PER_HOUR = 300; // site-wide ceiling against floods of fake orders
app.use('/api/', apiLimiter);

// Only accept JSON from our own pages: blocks cross-site form posts and other origins.
function sameOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin && origin !== PUBLIC_URL) return res.status(403).json({ error: 'Forbidden.' });
  if (!req.is('application/json')) return res.status(415).json({ error: 'Unsupported request.' });
  next();
}

app.get('/api/products', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json({
    deliveryCents: C.DELIVERY_CENTS, freeDeliveryFromCents: C.FREE_DELIVERY_FROM_CENTS,
    products: Object.entries(C.PRODUCTS).map(([id, p]) => ({ id, name: p.name, unit: p.unit, cents: p.cents })),
  });
});

app.post('/api/orders', orderLimiter, sameOrigin, express.json({ limit: '8kb', strict: true }), phoneLimiter, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  let o;
  try { o = validateOrder(req.body); }
  catch (e) { return res.status(400).json({ error: e instanceof BadRequest ? e.message : 'Invalid request.' }); }
  if (store.countSince(Date.now() - 3600_000) >= MAX_ORDERS_PER_HOUR) {
    return res.status(503).json({ error: 'The shop is very busy right now. Please try again in a few minutes or call us.' });
  }

  let reference;
  do { reference = 'PB-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase(); }
  while (store.findByReference(reference));

  const order = { id: crypto.randomUUID(), reference, status: 'new', createdAt: new Date().toISOString(), ...o };
  await store.save(order);
  console.log(`NEW ORDER ${reference} $${(o.total / 100).toFixed(2)} ${o.fulfilment}, pay by ${o.method} (run "npm run orders" for details)`);
  res.status(201).json({ reference, total: o.total });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.use(express.static(path.join(__dirname, 'public'), {
  dotfiles: 'deny', index: 'index.html',
  setHeaders: (res, file) => res.setHeader('Cache-Control', file.endsWith('.html') ? 'no-cache' : 'public, max-age=604800'),
}));

app.use((err, req, res, next) => {
  if (res.headersSent) return;
  const status = err.status && err.status < 500 ? err.status : 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Something went wrong.' : 'Invalid request.' });
});

app.listen(PORT, () => console.log(`Prime Baking running on port ${PORT}`));
