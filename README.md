# Prime Baking web shop

The Prime Baking website with online ordering. Customers choose delivery or collection and say how they'll pay (cash, EcoCash or card swipe). They pay when the order is delivered or collected, so no payment details are ever entered on the site.

## How the site stays safe

| Risk | What stops it |
|---|---|
| Stolen card or wallet details | None are collected. Customers pay in person on delivery or collection. |
| Editing prices in the browser | The browser only sends product names and quantities. The server works out every price and total from `catalog.js`. |
| Injected scripts (XSS) | A strict Content-Security-Policy blocks any script the site didn't serve. Customer input is never inserted as HTML. |
| Another website submitting orders (CSRF) | Orders are only accepted as JSON from your own domain. |
| Fake or spam orders | Limits per device (10 per 10 minutes) and per phone number (4 per hour), plus a site-wide ceiling of 300 orders an hour. |
| Junk or oversized data | Every field is checked (Zimbabwe mobile number, name, address length, whole-number quantities). Unknown fields are rejected and requests over 8 KB are refused. |
| Browser attacks | HTTPS only, HSTS, no framing, and strict referrer and permissions headers. |

No website can be guaranteed unhackable. To keep it safe over time, keep the server updated (`npm audit`, `npm update`), use HTTPS, and keep the order file private.

## 1. Run it on your computer

Requires Node.js 20.12 or newer.

```bash
npm install
cp .env.example .env      # set PUBLIC_URL=http://localhost:3000 and TRUST_PROXY=0
npm start                 # open http://localhost:3000
```

## 2. Put it online

Any Node.js host works (Render, Railway, Fly.io, a VPS). On Render, for example:

1. Put this folder in a private GitHub repository. The `.gitignore` already keeps `.env` and order data out.
2. Create a **Web Service** with build command `npm install` and start command `npm start`.
3. Add these environment variables: `NODE_ENV=production`, `PUBLIC_URL=https://your-domain`, `TRUST_PROXY=1`.
4. Add a **persistent disk** mounted at `/var/data` and set `DATA_DIR=/var/data`, so orders survive restarts.
5. Point your domain at the service. HTTPS is switched on automatically.

`TRUST_PROXY` must be the exact number of proxies in front of the app: 1 on most hosts, 2 if you also put Cloudflare in front, 0 on a bare server.

## 3. See your orders

Each new order writes a line like `NEW ORDER PB-… $32.50 delivery, pay by ecocash` to the server log. For full details:

```bash
npm run orders
```

That lists the latest 50 orders with name, phone, address, items, total and how the customer will pay. Call the customer to confirm, then bake and deliver.

## Changing products and prices

Edit `catalog.js` and restart. Prices are in cents (550 = $5.50), and the website picks up new prices automatically. Product photos and descriptions are in `public/app.js` and `public/img/`.

## Files

```
server.js      web server and order handling
catalog.js     products and prices (the only place prices are set)
store.js       saves orders to data/orders.json
orders.js      prints orders (npm run orders)
public/        the website itself
.env.example   settings template; copy to .env
```

The order store is a single file, which suits one server. If the shop grows to several servers, move orders into a database.
