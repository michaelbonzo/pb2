'use strict';
// The single source of truth for prices. The browser only ever sends product ids and quantities;
// every order total is calculated here on the server, so editing prices in the page changes nothing.
// Prices are in US cents to avoid floating-point rounding.

const PRODUCTS = Object.freeze({
  velvet:      { name: 'Red velvet slice',            unit: 'per slice',  cents: 550 },
  triple:      { name: 'Triple chocolate fudge cake', unit: 'whole cake', cents: 3200 },
  oreo:        { name: 'Cookies & cream layer cake',  unit: 'whole cake', cents: 2800 },
  croissant:   { name: 'Chocolate croissant',         unit: 'each',       cents: 350 },
  eclair:      { name: 'Chocolate éclairs',           unit: 'box of 6',   cents: 1500 },
  cookies:     { name: 'Chocolate chip cookies',      unit: 'bag of 6',   cents: 700 },
  brownie:     { name: 'Fudge brownie stack',         unit: 'box of 4',   cents: 1200 },
  mousse:      { name: 'Chocolate mousse cake',       unit: 'per slice',  cents: 600 },
  buttercream: { name: 'Chocolate buttercream slice', unit: 'per slice',  cents: 500 },
  waffle:      { name: 'Ice cream waffle',            unit: 'two scoops', cents: 850 },
});

const DELIVERY_CENTS = 450;          // flat city delivery
const FREE_DELIVERY_FROM_CENTS = 4000; // free delivery on orders of $40 or more
const MAX_LINES = 20;
const MAX_QTY_PER_LINE = 50;
const MAX_ORDER_CENTS = 100000;      // $1,000 ceiling per online order

module.exports = { PRODUCTS, DELIVERY_CENTS, FREE_DELIVERY_FROM_CENTS, MAX_LINES, MAX_QTY_PER_LINE, MAX_ORDER_CENTS };
