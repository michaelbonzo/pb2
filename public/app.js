(() => {
const IMG = {waffle:"/img/p_waffle.jpg", croissant:"/img/p_croissant.jpg", cookies:"/img/p_cookies.jpg", eclair:"/img/p_eclair.jpg", brownie:"/img/p_brownie.jpg", oreo:"/img/p_oreo.jpg", buttercream:"/img/p_buttercream.jpg", triple:"/img/p_triple.jpg", mousse:"/img/p_mousse.jpg", velvet:"/img/p_velvet.jpg"};
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(.22,1,.36,1)';
const $ = s => document.querySelector(s);
const money = n => '$' + n.toFixed(2);

const SHOP = [
  {id:'velvet', name:'Red velvet slice', cat:'cakes', img:'velvet', tag:'Bestseller', meta:'Per slice', price:5.5},
  {id:'triple', name:'Triple chocolate fudge cake', cat:'cakes', img:'triple', tag:'70% cacao', meta:'Whole cake, serves 12', price:32},
  {id:'oreo', name:'Cookies & cream layer cake', cat:'cakes', img:'oreo', tag:'Party size', meta:'Whole cake, serves 10', price:28},
  {id:'croissant', name:'Chocolate croissant', cat:'pastries', img:'croissant', tag:'Baked today', meta:'Single croissant', price:3.5},
  {id:'eclair', name:'Chocolate éclairs', cat:'pastries', img:'eclair', tag:'Cream filled', meta:'Box of 6', price:15},
  {id:'cookies', name:'Chocolate chip cookies', cat:'treats', img:'cookies', tag:'Soft centre', meta:'Bag of 6', price:7},
  {id:'brownie', name:'Fudge brownie stack', cat:'treats', img:'brownie', tag:'Warm sauce', meta:'Box of 4', price:12},
];
const BAKERY = [
  {id:'mousse', name:'Chocolate mousse cake', cat:'cakes', img:'mousse', tag:'New', meta:'Per slice', price:6},
  {id:'buttercream', name:'Chocolate buttercream slice', cat:'cakes', img:'buttercream', tag:'New', meta:'Per slice', price:5},
  {id:'waffle', name:'Ice cream waffle', cat:'treats', img:'waffle', tag:'New', meta:'Two scoops', price:8.5},
];
const ALL = Object.fromEntries([...SHOP, ...BAKERY].map(p => [p.id, p]));

function card(p){
  const el = document.createElement('article');
  el.className = 'card'; el.dataset.cat = p.cat; el.dataset.id = p.id;
  const t = [];
  if (p.flip) t.push('scaleX(-1)');
  if (p.zoom) t.push(`scale(${p.zoom})`);
  el.innerHTML = `<div class="card-media"><img src="${IMG[p.img]}" alt="${p.name}" loading="lazy"><span class="tag">${p.tag}</span><span class="peek" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M7 17 17 7M9 7h8v8"/></svg></span><button class="add" data-add="${p.id}">Add to cart</button></div>
  <div class="card-body"><h3><a class="card-link" href="#cake-${p.id}">${p.name}</a></h3><p class="meta">${p.meta}</p><p class="price">${money(p.price)}</p></div>`;
  if (t.length){ const img = el.querySelector('img'); img.style.transform = t.join(' ');
    el.addEventListener('mouseenter', () => img.style.transform = t.join(' ') + ' scale(1.08)');
    el.addEventListener('mouseleave', () => img.style.transform = t.join(' '));
  }
  return el;
}
const shopGrid = $('#shopGrid'), bakeryGrid = $('#bakeryGrid');
SHOP.forEach(p => shopGrid.append(card(p)));
const lastTile = bakeryGrid.querySelector('[data-last]');
BAKERY.forEach(p => bakeryGrid.insertBefore(card(p), lastTile));

// marquee
const ORIGINS = [['Stone-milled flour','Unbleached'],['Cultured butter','Churned weekly'],['Free-range eggs','Local farms'],['Real vanilla','Madagascar'],['Dark cacao','Single-origin'],['Wild honey','Raw']];
const ul = () => '<ul>' + ORIGINS.map(([c,r]) => `<li>${c}<small>${r}</small></li>`).join('') + '</ul>';
$('#marquee').innerHTML = ul() + ul().replace('<ul>','<ul aria-hidden="true">');

// header compact + parallax
const header = $('#header'), heroBg = $('#heroBg'), bandBg = $('#bandBg'), band = $('.band');
let ticking = false;
function onScroll(){
  const y = scrollY;
  const c = header.classList.contains('compact');
  if (!c && y > 90) header.classList.add('compact'); else if (c && y < 20) header.classList.remove('compact');
  if (!reduce){
    if (y < innerHeight * 1.2) heroBg.style.transform = `translate3d(0,${y*0.28}px,0)`;
    const r = band.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight){
      const p = (r.top + r.height/2 - innerHeight/2) / innerHeight;
      bandBg.style.transform = `translate3d(0,${p*-80}px,0)`;
    }
  }
  spy(); ticking = false;
}
addEventListener('scroll', () => { if(!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, {passive:true});
heroBg.addEventListener('animationend', () => { heroBg.style.animation = 'none'; onScroll(); });

// nav ink + scrollspy
const navInk = $('#navInk'), navLinks = [...document.querySelectorAll('.nav a')];
let current = null;
function moveInk(a){
  if (!a || current === a) return; current = a;
  navInk.style.width = (a.offsetWidth - 32) + 'px';
  navInk.style.transform = `translateX(${a.offsetLeft + 16}px)`;
  navInk.style.opacity = 1;
}
function spy(){
  const ids = ['contact','bakery','origins','shop'];
  let found = 'top';
  const nearBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  if (nearBottom) found = 'contact';
  else for (const id of ids){ const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < innerHeight*0.4){ found = id; break; } }
  moveInk(navLinks.find(a => a.dataset.spy === found));
}
addEventListener('resize', () => { const c = current; current = null; moveInk(c); moveChip(); });
document.fonts && document.fonts.ready.then(() => { const c = current; current = null; moveInk(c || navLinks[0]); moveChip(); });

// mobile menu
const burger = $('#burger'), nav = $('#nav');
burger.addEventListener('click', () => { const o = burger.getAttribute('aria-expanded') !== 'true'; burger.setAttribute('aria-expanded', o); nav.classList.toggle('open', o); });
nav.addEventListener('click', e => { if (e.target.closest('a')){ burger.setAttribute('aria-expanded', false); nav.classList.remove('open'); } });

// reveal on scroll (content is visible at rest; this only animates entry)
if (!reduce && 'IntersectionObserver' in window){
  const targets = [...document.querySelectorAll('.section-head, .grid > *, .features li, .band .wrap > *, .footer .wrap > div')];
  const seen = new WeakSet();
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting || seen.has(en.target)) return;
      seen.add(en.target); io.unobserve(en.target);
      if (en.boundingClientRect.top < 0) return;
      const sibs = [...en.target.parentElement.children];
      const i = Math.max(0, sibs.indexOf(en.target)) % 4;
      en.target.animate([{opacity:0, transform:'translateY(36px)'},{opacity:1, transform:'none'}], {duration:900, delay:i*90, easing:EASE, fill:'backwards'});
    });
  }, {threshold:0.12});
  requestAnimationFrame(() => targets.forEach(t => { if (t.getBoundingClientRect().top > innerHeight) io.observe(t); }));
}

// filter chips with FLIP
const chips = $('#chips'), chipInk = $('#chipInk');
function moveChip(){
  const b = chips.querySelector('[aria-pressed="true"]');
  Object.assign(chipInk.style, {width:b.offsetWidth+'px', height:b.offsetHeight+'px', transform:`translate(${b.offsetLeft}px,${b.offsetTop}px)`});
}
moveChip();
chips.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  chips.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
  moveChip();
  const f = b.dataset.f, items = [...shopGrid.children];
  const first = new Map(items.map(el => [el, el.getBoundingClientRect()]));
  items.forEach(el => { if (el.classList.contains('card')) el.hidden = !(f === 'all' || el.dataset.cat === f); });
  if (reduce) return;
  items.forEach(el => {
    if (el.hidden) return;
    const a = first.get(el), l = el.getBoundingClientRect();
    if (!a.width){ el.animate([{opacity:0, transform:'scale(.9)'},{opacity:1, transform:'none'}], {duration:520, easing:EASE}); return; }
    const dx = a.left - l.left, dy = a.top - l.top;
    if (dx || dy) el.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}], {duration:620, easing:EASE});
  });
});

// cart
const cart = new Map();
const cartBtn = $('#cartBtn'), drawer = $('#drawer'), scrim = $('#scrim'), lines = $('#lines');
let SHIP = 4.5, FREE = 40;
function render(){
  const count = [...cart.values()].reduce((a,b) => a+b, 0);
  $('#cartCount').textContent = count; $('#pdCount').textContent = count;
  cartBtn.querySelector('.word:last-of-type').textContent = count === 1 ? ' item' : ' items';
  if (!count){ lines.innerHTML = '<li class="empty"><strong>Nothing here yet</strong>Add a slice of cake or a box of éclairs to get started.</li>'; }
  else {
    lines.innerHTML = [...cart].map(([id,q]) => { const p = ALL[id];
      return `<li class="line-item" data-id="${id}"><img src="${IMG[p.img]}" alt=""><div><h3>${p.name}</h3><span class="qty"><button data-q="-1" aria-label="One fewer">−</button><span>${q}</span><button data-q="1" aria-label="One more">+</button></span></div><span class="line-total">${money(p.price*q)}</span></li>`; }).join('');
  }
  const sub = [...cart].reduce((s,[id,q]) => s + ALL[id].price*q, 0);
  const ship = !count || sub >= FREE ? 0 : SHIP;
  $('#sub').textContent = money(sub);
  $('#ship').textContent = !count ? '—' : ship ? money(ship) : 'Free';
  $('#tot').textContent = money(sub + ship);
  $('#note').textContent = count && sub < FREE ? `Add ${money(FREE - sub)} more for free city delivery.` : '';
}
render();
lines.addEventListener('click', e => {
  const b = e.target.closest('[data-q]'); if (!b) return;
  const id = b.closest('[data-id]').dataset.id, q = (cart.get(id) || 0) + +b.dataset.q;
  q > 0 ? cart.set(id, q) : cart.delete(id);
  saveCart();
  const scroll = lines.scrollTop; render(); lines.scrollTop = scroll;
  lines.querySelectorAll('.line-item').forEach(li => li.style.animation = 'none');
});
let toastT;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
function fly(img, target = cartBtn){
  if (reduce) return Promise.resolve();
  const a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
  const f = document.createElement('img'); f.src = img.src; f.className = 'flyer';
  const s = 64; Object.assign(f.style, {width:s+'px', height:s+'px', left:0, top:0});
  document.body.append(f);
  const x0 = a.left + a.width/2 - s/2, y0 = a.top + a.height/2 - s/2, x1 = b.left + b.width/2 - s/2, y1 = b.top + b.height/2 - s/2;
  const mx = (x0 + x1)/2, my = Math.min(y0, y1) - 120;
  return f.animate([
    {transform:`translate(${x0}px,${y0}px) scale(1.6)`, opacity:0},
    {transform:`translate(${x0}px,${y0}px) scale(1.2)`, opacity:1, offset:.12},
    {transform:`translate(${mx}px,${my}px) scale(.8)`, offset:.55},
    {transform:`translate(${x1}px,${y1}px) scale(.2)`, opacity:.6}
  ], {duration:900, easing:'cubic-bezier(.5,0,.3,1)'}).finished.then(() => f.remove());
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-add]'); if (!b) return;
  const id = b.dataset.add;
  b.textContent = 'Added ✓'; setTimeout(() => b.textContent = 'Add to cart', 1400);
  fly(b.closest('.card').querySelector('img')).then(() => {
    cart.set(id, (cart.get(id) || 0) + 1); saveCart(); render();
    cartBtn.classList.remove('bump'); void cartBtn.offsetWidth; cartBtn.classList.add('bump');
    toast(`${ALL[id].name} added to your cart`);
  });
});
const bg = () => document.querySelectorAll('main,.header,.footer,.topbar');
const layers = () => pdId ? [pd] : [...bg()];
let cartReturn = cartBtn;
function openCart(from){ cartReturn = from instanceof Element ? from : cartBtn; drawer.inert = false; layers().forEach(e => e.inert = true); cartBtn.setAttribute('aria-expanded','true'); drawer.classList.add('open'); scrim.classList.add('open'); setTimeout(() => $('#closeCart').focus(), 300); }
function closeCart(){ drawer.inert = true; layers().forEach(e => e.inert = false); cartBtn.setAttribute('aria-expanded','false'); drawer.classList.remove('open'); scrim.classList.remove('open'); cartReturn.focus(); }
cartBtn.addEventListener('click', openCart);
document.querySelectorAll('[data-open-cart]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openCart(); }));
$('#closeCart').addEventListener('click', closeCart);
scrim.addEventListener('click', closeCart);
addEventListener('keydown', e => { if (pdId && !drawer.classList.contains('open') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')){ step(e.key === 'ArrowRight' ? 1 : -1); return; } if (e.key !== 'Escape') return; if (drawer.classList.contains('open')) closeCart(); else if (pdId) leave(); else if (nav.classList.contains('open')){ burger.setAttribute('aria-expanded', false); nav.classList.remove('open'); burger.focus(); } });
// ---------- checkout: orders are placed online and paid on delivery or collection ----------
const API = '/api';
let online = false;
const store = {
  get(k){ try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
  set(k, v){ try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k){ try { sessionStorage.removeItem(k); } catch {} },
};
function saveCart(){ store.set('pb-cart', [...cart]); }
(function loadCart(){
  const saved = store.get('pb-cart');
  if (Array.isArray(saved)) for (const row of saved){
    if (Array.isArray(row) && ALL[row[0]] && Number.isInteger(row[1]) && row[1] > 0 && row[1] <= 50) cart.set(row[0], row[1]);
  }
  render();
})();

// Prices come from the server so the page always shows what will be charged.
fetch(API + '/products', {headers:{Accept:'application/json'}}).then(r => r.ok ? r.json() : Promise.reject()).then(d => {
  if (!d || !Array.isArray(d.products)) return;
  for (const p of d.products) if (ALL[p.id] && Number.isInteger(p.cents)) ALL[p.id].price = p.cents / 100;
  if (Number.isInteger(d.deliveryCents)) SHIP = d.deliveryCents / 100;
  if (Number.isInteger(d.freeDeliveryFromCents)) FREE = d.freeDeliveryFromCents / 100;
  document.querySelectorAll('.card').forEach(c => { const p = ALL[c.dataset.id]; if (p) c.querySelector('.price').textContent = money(p.price); });
  online = true; render(); payTotals();
}).catch(() => { online = false; });

const payForm = $('#payForm'), cartView = $('#cartView'), payStatus = $('#payStatus');
const views = {cart: cartView, pay: payForm, status: payStatus};
let view = 'cart';
function show(v){
  view = v;
  for (const [k, el] of Object.entries(views)) el.hidden = k !== v;
  $('#drawerTitle').textContent = v === 'cart' ? 'Your cart' : v === 'pay' ? 'Checkout' : 'Order placed';
  $('#drawerBack').hidden = v !== 'pay';
}
$('#drawerBack').addEventListener('click', () => show('cart'));

const fulfilment = () => payForm.querySelector('input[name="fulfilment"]:checked').value;
const method = () => payForm.querySelector('input[name="method"]:checked').value;
function payTotals(){
  const sub = [...cart].reduce((s,[id,q]) => s + Math.round(ALL[id].price*100)*q, 0) / 100;
  const ship = fulfilment() === 'delivery' && sub < FREE ? SHIP : 0;
  $('#pSub').textContent = money(sub);
  $('#pShip').textContent = fulfilment() === 'collect' ? 'Collect' : ship ? money(ship) : 'Free';
  $('#pTot').textContent = money(sub + ship);
  $('#payLabel').textContent = `Place order · ${money(sub + ship)}`;
  $('#addrField').hidden = fulfilment() !== 'delivery';
  const when = fulfilment() === 'delivery' ? 'When your order is delivered' : 'At the counter when you collect';
  payForm.querySelectorAll('.when').forEach(el => el.textContent = when);
}
payForm.addEventListener('change', payTotals);
payForm.addEventListener('input', e => { const f = e.target.closest('.field'); if (f) f.classList.remove('bad'); $('#payError').textContent = ''; });

$('#checkout').addEventListener('click', () => {
  if (!cart.size){ $('#note').textContent = 'Your cart is empty.'; return; }
  $('#payError').textContent = '';
  payTotals(); show('pay');
  setTimeout(() => $('#cName').focus(), 350);
});

function fieldError(id, msg){
  $('#' + id).closest('.field').classList.add('bad');
  $('#' + id).focus();
  return msg;
}
function readForm(){
  payForm.querySelectorAll('.field.bad').forEach(f => f.classList.remove('bad'));
  const name = $('#cName').value.trim(), email = $('#cEmail').value.trim();
  const phone = $('#cPhone').value.replace(/[\s-]/g, '').replace(/^\+?263/, '0');
  const address = $('#cAddress').value.trim();
  let err = '';
  if (name.length < 2) err = fieldError('cName', 'Enter your name.');
  else if (!/^07[1378]\d{7}$/.test(phone)) err = fieldError('cPhone', 'Enter a Zimbabwe mobile number, like 0771234567.');
  else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) err = fieldError('cEmail', 'Check your email address, or leave it blank.');
  else if (fulfilment() === 'delivery' && address.length < 6) err = fieldError('cAddress', 'Enter your delivery address.');
  return {err, body:{
    items: [...cart].map(([id, qty]) => ({id, qty})),
    customer: {name, email, phone, address: fulfilment() === 'delivery' ? address : ''},
    method: method(), fulfilment: fulfilment()
  }};
}

const ICONS = {
  ok: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  bad: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M7 7l10 10M17 7 7 17"/></svg>',
  info: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/></svg>'
};
function status({icon, title, msg, ref = '', actions = []}){
  const el = $('#psIcon'); el.className = 'ps-icon' + (icon === 'ok' ? ' ok' : icon === 'bad' ? ' bad' : ''); el.innerHTML = ICONS[icon];
  $('#psTitle').textContent = title; $('#psMsg').textContent = msg;
  $('#psRef').textContent = ref ? 'Order ' + ref : '';
  const box = $('#psActions'); box.replaceChildren();
  for (const a of actions){ const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (a.ghost ? ' ghost' : ''); b.textContent = a.label; b.addEventListener('click', a.run); box.append(b); }
  show('status');
}

const PAY_LABEL = {cash:'cash', ecocash:'EcoCash', card:'card'};
payForm.addEventListener('submit', async e => {
  e.preventDefault();
  const {err, body} = readForm();
  const errEl = $('#payError'); errEl.textContent = err;
  if (err) return;
  if (!online){ errEl.textContent = 'Ordering is switched off in this preview. It works once the site runs on its own server.'; return; }
  const btn = $('#payBtn'); btn.disabled = true; $('#payLabel').textContent = 'Placing order…';
  try {
    const r = await fetch(API + '/orders', {method:'POST', headers:{'Content-Type':'application/json', Accept:'application/json'}, body: JSON.stringify(body), cache:'no-store'});
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Your order could not be placed. Please try again.');
    cart.clear(); saveCart(); render();
    const total = money((Number(d.total) || 0) / 100), how = PAY_LABEL[body.method];
    status({icon:'ok', title:'Thank you, order received',
      msg: body.fulfilment === 'collect'
        ? `We'll call ${body.customer.phone} when it's ready to collect. Pay ${total} by ${how} at the counter.`
        : `We'll call ${body.customer.phone} to confirm delivery. Pay ${total} by ${how} when it arrives.`,
      ref: d.reference, actions:[{label:'Keep shopping', run:() => { show('cart'); closeCart(); }}]});
    payForm.reset();
  } catch (ex){
    errEl.textContent = ex.message || 'Network problem. Check your connection and try again.';
  } finally {
    btn.disabled = false; payTotals();
  }
});

// ---------- product detail view ----------
const DETAILS = {
  velvet:{unit:'per slice', ingr:'Buttermilk red velvet sponge, cocoa powder, cream cheese frosting, butter, sugar, free-range eggs, flour, fresh strawberries, mint.', n:[367,4.4,18.6,46.2]},
  triple:{unit:'whole cake', ingr:'Dark chocolate (70% cacao), chocolate sponge, chocolate mousse, ganache glaze, butter, sugar, free-range eggs, flour, chocolate curls.', n:[428,5.8,24.9,46.0]},
  oreo:{unit:'whole cake', ingr:'Chocolate sponge, vanilla cream, chocolate buttercream, chocolate sandwich cookies, dark chocolate drip, whipped cream, butter, sugar, eggs, flour.', n:[412,4.6,22.3,49.5]},
  croissant:{unit:'each', ingr:'Laminated butter pastry, dark chocolate batons, chocolate drizzle, cocoa nibs, flour, milk, sugar, yeast, free-range egg wash.', n:[426,7.2,24.1,45.3]},
  eclair:{unit:'box of 6', ingr:'Choux pastry, vanilla bean crème pâtissière, whipped cream, dark chocolate glaze, butter, free-range eggs, milk, flour, sugar.', n:[262,5.1,15.8,25.4]},
  cookies:{unit:'bag of 6', ingr:'Brown butter, dark chocolate chips, brown sugar, cane sugar, free-range eggs, flour, vanilla, sea salt, baking soda.', n:[488,5.6,23.7,63.1]},
  brownie:{unit:'box of 4', ingr:'Dark chocolate, butter, brown sugar, free-range eggs, flour, cocoa powder, warm chocolate fudge sauce, sea salt.', n:[466,5.9,26.4,52.8]},
  mousse:{unit:'per slice', ingr:'Light chocolate mousse, chocolate sponge, milk chocolate buttercream, dark chocolate shards, cream, eggs, sugar, flour.', n:[352,5.3,22.8,31.6]},
  buttercream:{unit:'per slice', ingr:'Chocolate sponge, chocolate buttercream, chocolate drizzle, butter, sugar, free-range eggs, flour, cocoa powder, dark chocolate chunks.', n:[398,4.8,21.4,47.0]},
  waffle:{unit:'two scoops', ingr:'Golden Belgian waffle, two scoops of chocolate ice cream, warm chocolate sauce, butter, milk, eggs, flour, sugar.', n:[312,5.2,15.1,39.6]},
};
const CAT = {cakes:'Cakes', pastries:'Pastries', treats:'Sweet treats'};
const ORDER = [...SHOP, ...BAKERY].map(p => p.id);
const pd = $('#pd'), pdImg = $('#pdImg'), pdPlate = $('#pdPlate'), pdBag = $('#pdBag'), pdDots = $('#pdDots');
const statEls = [...document.querySelectorAll('#pdStats dd')];
let pdId = null, pdQty = 1, pdPushed = false, pdOrigin = null, pdY = 0, pdOpener = null, pdSeq = 0;
const fmt = (v, i) => i === 0 ? Math.round(v).toString() : v.toFixed(1);
const pad = n => String(n).padStart(2, '0');

pdDots.innerHTML = ORDER.map(id => `<button data-go="${id}" aria-label="${ALL[id].name}"></button>`).join('');
pdDots.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });

function imgLook(p){
  const t = []; if (p.flip) t.push('scaleX(-1)'); if (p.zoom) t.push(`scale(${p.zoom})`);
  return {objectPosition: p.pos || '50% 50%', transform: t.join(' '), transformOrigin: p.pos || '50% 50%'};
}
function setQty(q){ pdQty = Math.max(1, Math.min(20, q)); $('#pdQty').textContent = pdQty; }
function countTo(vals, animate){
  const from = statEls.map(el => parseFloat(el.textContent) || 0);
  if (!animate || reduce){ statEls.forEach((el, i) => el.textContent = fmt(vals[i], i)); return; }
  const t0 = performance.now(), D = 700;
  const tick = now => {
    const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
    statEls.forEach((el, i) => el.textContent = fmt(from[i] + (vals[i] - from[i]) * e, i));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function fill(id, animateStats){
  const p = ALL[id], d = DETAILS[id];
  pdId = id;
  pdImg.src = IMG[p.img]; pdImg.alt = p.name; Object.assign(pdImg.style, imgLook(p));
  $('#pdKicker').textContent = `${CAT[p.cat]} · ${p.tag}`;
  $('#pdTitle').textContent = p.name;
  $('#pdIngr').textContent = 'Made with ' + d.ingr.charAt(0).toLowerCase() + d.ingr.slice(1);
  $('#pdPrice').textContent = money(p.price);
  $('#pdUnit').textContent = '/ ' + d.unit;
  countTo(d.n, animateStats);
  setQty(1);
  const i = ORDER.indexOf(id);
  $('#pdIndex').textContent = `${pad(i + 1)} / ${pad(ORDER.length)}`;
  pdDots.querySelectorAll('button').forEach(b => b.setAttribute('aria-current', b.dataset.go === id));
}
const infoParts = () => ['#pdKicker','#pdTitle','.pd-label','#pdIngr','#pdStats','.pd-per','.pd-buy'].map(s => pd.querySelector(s));

function flight(fromEl, toEl, p, toRound, dur = 760){
  const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
  if (!a.width || a.bottom < 0 || a.top > innerHeight) return null;
  const f = document.createElement('div'); f.className = 'pd-flyer';
  const im = document.createElement('img'); im.src = IMG[p.img]; im.alt = ''; Object.assign(im.style, imgLook(p));
  f.append(im); document.body.append(f);
  const r0 = toRound ? '14px' : '50%', r1 = toRound ? '50%' : '14px';
  return f.animate([
    {left:a.left+'px', top:a.top+'px', width:a.width+'px', height:a.height+'px', borderRadius:r0},
    {left:b.left+'px', top:b.top+'px', width:b.width+'px', height:b.height+'px', borderRadius:r1}
  ], {duration:dur, easing:EASE, fill:'forwards'}).finished.then(() => f);
}

function openDetail(id){
  pdY = scrollY; pdOpener = document.activeElement;
  fill(id, false);
  const o = pdOrigin; pdOrigin = null;
  const card = o && o.card;
  if (o){ pd.style.setProperty('--cx', o.x + 'px'); pd.style.setProperty('--cy', o.y + 'px'); }
  else { pd.style.setProperty('--cx', '50%'); pd.style.setProperty('--cy', '50%'); }
  document.documentElement.classList.add('pd-lock');
  bg().forEach(e => e.inert = true);
  pd.inert = false; pd.scrollTop = 0; pd.classList.add('open');
  if (reduce){ setTimeout(() => $('#pdClose').focus({preventScroll:true}), 50); return; }
  const fl = card ? flight(card.querySelector('.card-media'), pdPlate, ALL[id], true) : null;
  if (fl){
    pdPlate.style.opacity = 0;
    fl.then(f => { pdPlate.style.opacity = ''; f.animate([{opacity:1},{opacity:0}], {duration:200}).finished.then(() => f.remove()); });
  } else {
    pdPlate.animate([{transform:'scale(.6) rotate(-30deg)', opacity:0},{transform:'none', opacity:1}], {duration:900, delay:200, easing:EASE, fill:'backwards'});
  }
  pd.querySelector('.pd-badge').animate([{transform:'scale(0)'},{transform:'none'}], {duration:700, delay:650, easing:'cubic-bezier(.34,1.56,.64,1)', fill:'backwards'});
  infoParts().forEach((el, i) => el.animate([{opacity:0, transform:'translateY(26px)'},{opacity:1, transform:'none'}], {duration:800, delay:260 + i*70, easing:EASE, fill:'backwards'}));
  countTo(DETAILS[id].n.map(() => 0), false); countTo(DETAILS[id].n, true);
  setTimeout(() => $('#pdClose').focus({preventScroll:true}), 450);
}

function closeDetail(thenScrollTo){
  const id = pdId; if (!id) return;
  pdSeq++;
  const card = document.querySelector(`.card[data-id="${id}"]:not([hidden])`);
  let target = null;
  if (card && !thenScrollTo){
    const r = card.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight){ target = card; pd.style.setProperty('--cx', (r.left + r.width/2) + 'px'); pd.style.setProperty('--cy', (r.top + r.height/2) + 'px'); }
  }
  if (target && !reduce){
    const fl = flight(pdPlate, target.querySelector('.card-media'), ALL[id], false, 700);
    if (fl){ pdPlate.style.opacity = 0; fl.then(f => { f.animate([{opacity:1},{opacity:0}], {duration:220}).finished.then(() => f.remove()); pdPlate.style.opacity = ''; }); }
  }
  pd.classList.remove('open'); pd.inert = true; pdId = null;
  bg().forEach(e => e.inert = false);
  document.documentElement.classList.remove('pd-lock');
  if (thenScrollTo){
    const el = document.getElementById(thenScrollTo);
    setTimeout(() => el && el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth'}), 120);
  } else {
    scrollTo({top:pdY, behavior:'instant'});
    const link = card && card.querySelector('.card-link');
    (link || pdOpener || cartBtn).focus({preventScroll:true});
  }
}

async function showProduct(id){
  const from = ORDER.indexOf(pdId), to = ORDER.indexOf(id);
  const dir = to > from ? 1 : -1, seq = ++pdSeq;
  if (reduce){ fill(id, false); return; }
  const parts = infoParts().slice(0, 4);
  const out = [
    pdPlate.animate([{transform:'none', opacity:1},{transform:`rotate(${-dir*40}deg) scale(.82)`, opacity:0}], {duration:340, easing:'cubic-bezier(.5,0,.75,0)', fill:'forwards'}),
    ...parts.map((el, i) => el.animate([{opacity:1, transform:'none'},{opacity:0, transform:`translateX(${-dir*30}px)`}], {duration:260, delay:i*35, easing:'ease-in', fill:'forwards'}))
  ];
  await Promise.all(out.map(a => a.finished.catch(() => {})));
  if (seq !== pdSeq) return;
  fill(id, true);
  await new Promise(r => pdImg.complete ? r() : pdImg.onload = r);
  out.forEach(a => a.cancel());
  pdPlate.animate([{transform:`rotate(${dir*40}deg) scale(.82)`, opacity:0},{transform:'none', opacity:1}], {duration:700, easing:EASE, fill:'backwards'});
  parts.forEach((el, i) => el.animate([{opacity:0, transform:`translateX(${dir*30}px)`},{opacity:1, transform:'none'}], {duration:620, delay:60 + i*60, easing:EASE, fill:'backwards'}));
}

function parseHash(){ const h = location.hash.slice(1); return h.startsWith('cake-') && ALL[h.slice(5)] ? h.slice(5) : null; }
function route(){
  const id = parseHash();
  if (id && !pdId) openDetail(id);
  else if (id && pdId && id !== pdId) showProduct(id);
  else if (!id && pdId) closeDetail();
}
addEventListener('hashchange', route);
function go(id){ if (id !== pdId) location.replace('#cake-' + id); }
function step(d){ const i = ORDER.indexOf(pdId); go(ORDER[(i + d + ORDER.length) % ORDER.length]); }
function leave(sectionId){
  if (!pdId) return;
  if (pdPushed && !sectionId){ pdPushed = false; history.back(); return; }
  pdPushed = false;
  history.replaceState(null, '', location.pathname + location.search);
  closeDetail(sectionId);
}

document.addEventListener('click', e => {
  const link = e.target.closest('.card-link'); if (!link) return;
  const card = link.closest('.card');
  pdOrigin = {card, x: e.clientX || innerWidth/2, y: e.clientY || innerHeight/2};
  pdPushed = true;
});
pd.querySelectorAll('[data-pd-close]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  leave(a.hasAttribute('data-stay') ? null : a.getAttribute('href').slice(1));
}));
$('#pdClose').addEventListener('click', () => leave());
$('#pdPrev').addEventListener('click', () => step(-1));
$('#pdNext').addEventListener('click', () => step(1));
$('#pdMinus').addEventListener('click', () => setQty(pdQty - 1));
$('#pdPlus').addEventListener('click', () => setQty(pdQty + 1));
pdBag.addEventListener('click', () => openCart(pdBag));
$('#pdAdd').addEventListener('click', () => {
  const id = pdId, q = pdQty, btn = $('#pdAdd');
  btn.textContent = 'Added ✓'; setTimeout(() => btn.textContent = 'Add to bag', 1400);
  fly(pdImg, pdBag).then(() => {
    cart.set(id, (cart.get(id) || 0) + q); saveCart(); render();
    pdBag.classList.remove('bump'); void pdBag.offsetWidth; pdBag.classList.add('bump');
    toast(`${q} × ${ALL[id].name} added to your bag`);
  });
});
let touchX = null;
$('#pdVisual').addEventListener('touchstart', e => touchX = e.touches[0].clientX, {passive:true});
$('#pdVisual').addEventListener('touchend', e => { if (touchX == null) return; const dx = e.changedTouches[0].clientX - touchX; touchX = null; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); });
if (parseHash()) openDetail(parseHash());
onScroll();
})();
