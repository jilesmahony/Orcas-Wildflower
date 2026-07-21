# Orcas Wildflower — Website

A from-scratch storefront front-end for Orcas Wildflower, built as plain
HTML/CSS/JS so it can be hosted for free on **GitHub Pages** with no build
step required.

## What's included

- **Home page** with an auto-scrolling photo carousel (manual left/right
  arrows + dots too), an about section, shop-by-category tiles, and a
  popular-products strip.
- **Shared header** on every page: logo + name (left), center navigation
  with hover mega-menus for Clothing / Jewelry / Accessories, and a cart
  icon (right) with a live item-count badge. On mobile this collapses
  into a slide-out menu.
- **Nine content pages**: Location & Contact, New Arrivals, Popular
  Products, Clothing, Jewelry, Accessories, Sale, a Product detail page,
  and a Cart page — all sharing the same header/footer and reading from
  one product catalog.
- **A Product Manager** at `/admin/index.html` — a simple visual tool to
  add, remove, or edit products and stock without touching code.
- **A shopping cart** that remembers what's added (stored in the
  visitor's browser) across every page.

## File structure

```
index.html                 Home page
clothing.html               \
jewelry.html                 } Category pages (with sub-tab filters)
accessories.html            /
new-arrivals.html, popular-products.html, sale.html   Tag-filtered pages
product.html                Product detail (reads ?id=... from the URL)
cart.html                   Shopping cart
location-contact.html       Address/hours/map/social + contact form
admin/index.html            Product Manager (add/remove/edit/restock)
assets/
  css/style.css             All styling
  js/nav.js                 Header + footer + mega-menus + mobile menu
  js/cart.js                Shopping cart logic (localStorage)
  js/products.js            Loads products.json, renders grids/details
  js/main.js                Homepage hero carousel
  data/products.json        ← YOUR PRODUCT CATALOG lives here
  images/                   Photos go here (see README.txt in each folder)
```

## Adding, removing, or restocking products

Every product on the site comes from **`assets/data/products.json`**.
You have two ways to edit it:

1. **The easy way** — open `admin/index.html` in a browser (works once
   the site is live, or with a local server — see below), edit the
   table, click **Download products.json**, then replace the file in
   your GitHub repo at `assets/data/products.json` with the one you
   downloaded.
2. **By hand** — open `assets/data/products.json` in any text editor and
   copy/edit an entry. Each product looks like this:

```json
{
  "id": "jw-nk-003",
  "name": "New Necklace Name",
  "category": "jewelry",
  "subcategory": "necklaces",
  "price": 40.00,
  "salePrice": null,
  "stock": 10,
  "tags": ["new"],
  "images": ["assets/images/products/your-photo.jpg"],
  "description": "A short description of the piece."
}
```

- `category` must be `clothing`, `jewelry`, or `accessories`.
- `subcategory` must match one of the sub-tabs under that category
  (e.g. `tank-tops`, `earrings`, `bags` — see the dropdown menus on the
  live site for the exact list).
- `tags` can include `"new"` and/or `"popular"` — these control whether
  a product shows up on the New Arrivals / Popular Products pages.
- Set `salePrice` to a number lower than `price` to show it on the Sale
  page with a strikethrough; leave it `null` otherwise.
- Set `stock` to `0` to automatically show "Sold Out" and disable the
  Add to Cart button.
- `images` is a list of file paths — leave it as `[]` to show a
  placeholder graphic until you have a real photo.

## Adding real photos

- **Hero carousel photos**: drop files in `assets/images/hero/` and list
  them in `assets/js/main.js` (see the comment at the top of that file).
- **Product photos**: drop files in `assets/images/products/` and
  reference them in a product's `images` field (or via the Product
  Manager).

## Previewing locally before you publish

Because the site loads `products.json` with `fetch()`, double-clicking
`index.html` won't quite work (browsers block that for local files).
Instead, from inside the project folder, run one of:

```
python3 -m http.server 8000
```

then visit `http://localhost:8000` in your browser. (If you don't have
Python, any "Live Server" extension for VS Code works too.)

## Publishing on GitHub Pages

1. Create a new GitHub repository and upload everything in this folder
   to it (keeping the folder structure intact).
2. In the repo, go to **Settings → Pages**, set **Source** to the
   branch you uploaded to (usually `main`) and folder `/ (root)`.
3. GitHub will give you a URL like `https://yourusername.github.io/your-repo/`
   — that's your live site. It updates a minute or two after every push.
4. Once you have a real domain, you can point it at GitHub Pages under
   **Settings → Pages → Custom domain**.

## Connecting the real backend (Phase 2)

The front-end is deliberately built so this can be added later without
reworking the pages themselves. Here's the recommended shape, based on
the tools you mentioned (Cloudflare, Square, Google Sheets):

**1. Cloudflare Worker as the API gateway**
A small Worker (serverless function) becomes the one place that holds
your real secrets (Square access token, Google service-account key) —
these should never live in the front-end code, since anything in the
browser is visible to anyone. The Worker exposes a few endpoints, e.g.:
- `POST /api/checkout` — receives the cart from `cart.html`, creates a
  Square order + payment using the [Square Payments API](https://developer.squareup.com/docs/payments-api/overview).
- `POST /api/order-confirmed` — after a successful payment, appends a
  row to a Google Sheet via the [Google Sheets API](https://developers.google.com/sheets/api), and calls the
  [Square Shipping Labels API](https://developer.squareup.com/docs/shipping-api/overview) to buy a label.
- `GET /api/products` — (optional) if you'd rather manage stock in
  Google Sheets than in `products.json`, this endpoint reads the Sheet
  and returns it in the same shape `products.json` uses today.

**2. Square Web Payments SDK on `cart.html`**
This is Square's client-side script that securely collects card details
in the browser and hands your Worker a one-time token — the actual card
number never touches your own code. Docs:
https://developer.squareup.com/docs/web-payments/overview

**3. Swapping the data source**
Once `/api/products` exists, the only code change needed anywhere on
the site is inside `loadProducts()` in `assets/js/products.js` —
point the `fetch()` call at your Worker's URL instead of the local
`products.json`. Every page that shows products keeps working as-is.

**4. What Claude can help with next**
When you're ready to set this up, share your Cloudflare account details,
Square application credentials (never paste secret keys directly into
chat — use environment variables/secrets in Cloudflare instead), and
your Google Sheet structure, and the Worker code, Square SDK wiring, and
Sheets integration can be built out from there.

## Notes on the design

The palette and type are meant to feel like the island itself rather
than a generic template: deep evergreen "kelp" green, warm "driftwood"
taupe, soft "linen" background, and a "fireweed" pink accent (the
wildflower that lines Orcas Island roadsides). The small hand-drawn
sprig icon in the logo and section dividers is the site's one repeating
signature — used sparingly on purpose.
