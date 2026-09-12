# Orcas Wildflower — Checkout Setup (v2: Hosted Checkout + Shipping + Tax)

**What changed from before:** checkout no longer has a card form built
into your cart page. Instead, the Checkout button sends the buyer to a
Square-hosted payment page (Square handles all the card security and
PCI compliance for you), and Square sends them back to
`order-confirmed.html` when they're done. Your cart page now also has
a "Calculate Shipping & Tax" step — the buyer enters their ZIP, sees
real carrier shipping rates and (for Washington buyers) real sales
tax, before they check out.

If you already did the old Part 1–2 (creating your Square app and
copying your Sandbox Application ID / Access Token / Location ID),
you can skip straight to **Part 2.5** below. Everything else in Parts
3–4 (installing Node and Wrangler) you've already done too.

---

## PART 1 — Square Developer app (skip if already done)

See the earlier walkthrough: developer.squareup.com/apps → create an
app → **Credentials** page for your Sandbox Access Token and
Application ID → **Locations** page for your Location ID.

## PART 2.5 — Create a free Shippo account (new step)

Shippo is the rate-shopping service that looks up real carrier prices
(USPS, UPS, etc.) for a given package and ZIP code — it's the same
engine behind Square's own label tool, so the numbers will match what
you'd see printing a label yourself.

1. Go to **https://goshippo.com** → **Sign Up** → create a free
   account (no credit card required just to get rates).
2. Once logged in, go to **Settings → API** (sometimes under your
   account menu, top-right).
3. You'll see two keys — a **Test Token** and a **Live Token**. Copy
   the **Test Token** for now (starts with `shippo_test_...`) — this
   gets you real rate numbers without needing to actually buy
   anything. Switch to the **Live Token** later, at the same time you
   switch Square to Production.

## PART 3 & 4 — Node.js, Wrangler, Cloudflare login

Already done from before — skip ahead. (If this is a fresh computer:
install Node.js LTS from nodejs.org, then `npm install -g wrangler`,
then `wrangler login`.)

## PART 5 — Configure and deploy the Worker

1. In the `worker` folder, open `wrangler.toml`. It now has a few more
   lines than before — check each one:
   ```toml
   [vars]
   SQUARE_ENV = "sandbox"
   ALLOWED_ORIGIN = "https://your-real-github-pages-url"
   SHEET_CSV_URL = "https://docs.google.com/...output=csv"   # your published Sheet link
   SHOP_ADDRESS_LINE1 = "203 North Beach Road"
   SHOP_CITY = "Eastsound"
   SHOP_STATE = "WA"
   SHOP_ZIP = "98245"
   ```
   `SHEET_CSV_URL` should already be filled in with your real published
   Sheet link — double check it matches what's in your website's
   `assets/js/config.js`. The shop address is already filled in with
   your real address; only change it if you're shipping from
   somewhere else.
2. In your terminal, inside the `worker` folder, set your three
   secrets (you'll paste each value in when prompted, then press Enter):
   ```
   wrangler secret put SQUARE_ACCESS_TOKEN
   wrangler secret put SQUARE_LOCATION_ID
   wrangler secret put SHIPPO_API_KEY
   ```
   For `SHIPPO_API_KEY`, paste the **Test Token** from Part 2.5.
3. Deploy:
   ```
   wrangler deploy
   ```
   Copy the `https://...workers.dev` URL it prints.

## PART 6 — Point the website at it

Same as before: open `assets/js/config.js` (directly on github.com is
easiest — click the file, click the pencil icon, edit, commit). This
file is much simpler now — just one line:
```js
const CHECKOUT_CONFIG = {
  workerUrl: "https://orcas-wildflower-checkout.yourname.workers.dev",
};
```

## PART 7 — Test a full order

1. Open your live site, add something to your cart, go to the cart page.
2. Enter a real ZIP code (use a real one — Shippo needs a real
   location to quote rates against) and click **Calculate Shipping &
   Tax**. You should see a list of real shipping options with prices,
   plus tax (only if the ZIP is in Washington) and the card fee, all
   rolled into a total.
3. Pick a shipping option, click **Checkout**. You'll be redirected to
   a Square-hosted payment page.
4. Use a Square Sandbox test card: `4111 1111 1111 1111`, any future
   expiration, any 3-digit CVV, and fill in the shipping address
   fields Square asks for.
5. Complete the payment — you should land back on your site's
   **order-confirmed.html** page.
6. Check **Sandbox Dashboard → Orders** (via developer.squareup.com →
   your app → Sandbox test account → Open in Square Dashboard) — your
   order should be there with shipping, tax, and the card fee all
   itemized, and the shipping address attached.

**Troubleshooting:**
- *No shipping options come back* → double-check the ZIP is a real
  one, and that `SHIPPO_API_KEY` was set correctly in Part 5.
- *"Could not create checkout"* → almost always a Square credential
  issue — recheck `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID`.
- Nothing happens when clicking a button → open your browser's
  developer console (right-click page → Inspect → Console tab) for
  the specific error.

## PART 8 — Go live

1. Square: switch your app to **Production**, copy the new Access
   Token and Location ID.
2. Shippo: copy your **Live Token** instead of the Test Token.
3. Update secrets and redeploy:
   ```
   wrangler secret put SQUARE_ACCESS_TOKEN
   wrangler secret put SQUARE_LOCATION_ID
   wrangler secret put SHIPPO_API_KEY
   ```
   Change `SQUARE_ENV = "production"` in `wrangler.toml`, then
   `wrangler deploy`.
4. Place one small real order yourself before opening to customers.

## PART 9 — Day-to-day: fulfilling orders & printing labels

Every paid order lands in **Square Dashboard → Orders**, fully
itemized (products, real shipping cost charged, tax, card fee) with
the buyer's confirmed shipping address attached. From there, go to the
**Shipments** tab and click **Create label** to actually buy and print
the label — this last step stays manual because Square doesn't offer
a public API for purchasing labels from outside code, only inside the
Dashboard. Since the shipping option the buyer picked at checkout was
priced using the same rate-shopping engine (Shippo) that powers
Square's own label tool, the price you charged them should match what
the label actually costs.

## A note on trust — shipping price isn't re-verified

Subtotal, tax, and the card fee are all recalculated by the Worker
itself at checkout time, so tampering with the page can't change
those. The shipping *amount*, though, is taken from whatever the
browser sends (the option the buyer clicked) rather than re-fetched
from Shippo a second time — the Worker only sanity-checks that it's a
plausible positive dollar number. For a small shop this is a low-risk
tradeoff (worst case, someone edits their browser's request to pick a
cheaper shipping price than they should), but it's worth knowing about
if that ever becomes a real problem — the fix is to have `/api/checkout`
re-request rates from Shippo and confirm the submitted amount matches
one of them.

## About sales tax — read this

This Worker calculates Washington sales tax automatically using the
state's own free, official address-based rate lookup — it's accurate
for WA. For any other state, it currently charges **$0 tax**, which
matches your current situation of only having "nexus" (a tax
obligation) in Washington. This is not legal advice: as you sell more
into other states, you may cross that state's threshold for having to
collect tax there too (this is genuinely a per-state legal question).
Worth checking in with an accountant periodically as your out-of-state
sales grow, or looking into a nexus-tracking tool. When you're ready
to start collecting for a specific state, that's a small, contained
change to make in `worker/index.js`'s `lookupTax()` function.

## A note on the shipping "box" approximation

To get a rate quote, the Worker needs one package size and weight for
your whole order. It adds up the weight of everything in the cart, and
uses the largest single item's length/width/height as the box size —
a reasonable approximation for a shop like this, but not perfectly
accurate for large multi-item orders that wouldn't really fit in one
box that size. Worth keeping an eye on for bigger orders.
