# Orcas Wildflower — Checkout Setup (Detailed Walkthrough)

This is the complete, click-by-click path from "nothing connected" to
"a real order lands in Square." Do it in order — don't skip to
Production until Sandbox testing works.

---

## PART 1 — Create your Square Developer app

1. Go to **https://developer.squareup.com/apps** in your browser.
2. Sign in with your **regular Square account** (the same login you'd
   use for the Square Point of Sale app or Square Dashboard). If you
   don't have a Square account yet, create one first at squareup.com —
   it's free, and you don't need a card reader or subscription to use
   the API.
3. You'll land on the **Developer Console**. Click the **+** button
   (usually labeled "Create your first application" or just a **+**
   icon near the top).
4. Name it something recognizable, like `Orcas Wildflower Website`.
   Click **Create Application**.
5. You're now on your application's settings page. At the top of the
   page you'll see a toggle for **Sandbox** / **Production** — leave
   it on **Sandbox** for now. (Sandbox = fake test money, safe to
   break. Production = real charges. Always build and test in Sandbox
   first.)

## PART 2 — Copy your three Sandbox values

Still on your application's page:

1. In the left-hand menu, click **Credentials**.
2. Confirm the toggle at the top still says **Sandbox**.
3. You'll see:
   - **Sandbox Application ID** — starts with `sandbox-sq0idb-...`. Copy it.
   - **Sandbox Access Token** — click **Show**, then copy it. Treat
     this like a password — it's the one value that must never appear
     in your website's code, only in the Worker (Part 5).
4. In the left-hand menu, click **Locations**.
5. Copy the **Location ID** shown there (looks like `L1AB2CD3EF4GH`).

Paste all three into a temporary note for now — you'll use them in
Parts 5 and 7.

## PART 3 — Install Node.js (skip if you already have it)

Node.js is what lets your computer run the deploy tool in Part 4.

- **Mac**: go to https://nodejs.org, download the **LTS** version,
  open the installer, click through it (defaults are fine).
- **Windows**: same link, download the **LTS** Windows installer, run
  it, click through with defaults.
- **Verify it worked**: open a fresh Terminal (Mac) or Command Prompt
  (Windows) window and type:
  ```
  node -v
  ```
  You should see something like `v20.x.x`. If you see "command not
  found," close and reopen your terminal (or restart your computer)
  and try again — this is the most common hiccup.

## PART 4 — Install Wrangler and log into Cloudflare

1. If you don't already have a Cloudflare account, create a free one
   at https://dash.cloudflare.com/sign-up.
2. In your terminal, install Cloudflare's deploy tool:
   ```
   npm install -g wrangler
   ```
3. Confirm it installed:
   ```
   wrangler --version
   ```
4. Log in (this opens a browser tab asking you to approve access —
   click **Allow**):
   ```
   wrangler login
   ```

## PART 5 — Deploy the Worker

1. In your terminal, navigate into the `worker` folder from the
   website files you downloaded. For example, if you extracted
   everything to your Desktop:
   ```
   cd Desktop/orcas-wildflower/worker
   ```
   (Typing `cd ` then dragging the `worker` folder into the terminal
   window also works, on both Mac and Windows.)
2. Open `wrangler.toml` in any text editor (Notepad, TextEdit, VS
   Code — whatever you have). Find this line:
   ```
   ALLOWED_ORIGIN = "https://YOUR-GITHUB-USERNAME.github.io"
   ```
   Replace it with your actual GitHub Pages address — check your
   repo's **Settings → Pages** tab for the exact URL if you're not
   sure. Save the file.
3. Set your two secrets. Run this first command, then paste your
   **Sandbox Access Token** from Part 2 when it asks and press Enter:
   ```
   wrangler secret put SQUARE_ACCESS_TOKEN
   ```
   Then this one, pasting your **Location ID**:
   ```
   wrangler secret put SQUARE_LOCATION_ID
   ```
4. Deploy:
   ```
   wrangler deploy
   ```
5. When it finishes, it prints a URL that looks like:
   ```
   https://orcas-wildflower-checkout.yourname.workers.dev
   ```
   Copy this exact URL — you need it in Part 7.

## PART 6 — Sanity-check the Worker is alive

In your browser, visit the Worker URL from Part 5 directly (just
paste it in the address bar and hit enter). You should see a plain
`Not found` message — that's correct and expected! It means the
Worker is running; it only replies properly to the real checkout
request the website sends, not to a plain visit like this.

## PART 7 — Point the website at everything

1. Open `assets/js/config.js` in a text editor.
2. Find the `CHECKOUT_CONFIG` block and fill in all four values:
   ```js
   const CHECKOUT_CONFIG = {
     squareEnv: "sandbox",
     squareAppId: "sandbox-sq0idb-...",       // from Part 2
     squareLocationId: "L1AB2CD3EF4GH",       // from Part 2
     workerUrl: "https://orcas-wildflower-checkout.yourname.workers.dev", // from Part 5
   };
   ```
3. Save, then upload this one changed file to your GitHub repo
   (replacing the old `assets/js/config.js`), the same way you've
   been updating files before.

## PART 8 — Test a full order (Sandbox — no real money moves)

1. Give GitHub Pages a minute to rebuild, then open your live site
   and add something to the cart.
2. Go to the cart page and fill in the shipping form with any test
   info (e.g. your own name and address).
3. For the card field, use one of Square's official Sandbox test
   cards. The most common one:
   - Card number: `4111 1111 1111 1111`
   - Expiration: any future date (e.g. `12/29`)
   - CVV: any 3 digits (e.g. `111`)
   - ZIP: any 5 digits
4. Click **Place Order**. You should see a confirmation message with
   an order number.
5. Go back to **developer.squareup.com/apps** → your app → make sure
   the **Sandbox** toggle is on → open the **Sandbox Dashboard**
   (there's a link for this in the Developer Console) → **Orders**.
   Your test order should be sitting there with the shipping address
   attached.

If something goes wrong at this step, the error message shown on the
cart page (in red) will usually say why — common ones:
- *"Card details didn't validate"* → double check the test card
  number and that the expiration date is in the future.
- *"Payment couldn't be completed"* → the Worker reached Square but
  Square rejected it; open your browser's developer console (right
  click the page → Inspect → Console tab) for more detail, or recheck
  that your Access Token and Location ID were pasted correctly with
  no extra spaces in Part 5.
- Nothing happens at all when you click Place Order → open the
  browser console (same as above) and look for a red error — it
  usually means `CHECKOUT_CONFIG` in `config.js` still has a blank or
  mistyped value.

## PART 9 — Go live (real money)

Only do this once Part 8 works cleanly.

1. Back on your app's settings page at developer.squareup.com,
   toggle from **Sandbox** to **Production** at the top.
2. On the **Credentials** page (still in Production mode), copy your
   **Production Access Token** (click Show) and note the
   **Production Application ID**.
3. On the **Locations** page (Production mode), copy your real
   **Location ID**.
4. Back in your terminal, in the `worker` folder, update your secrets
   with the production values:
   ```
   wrangler secret put SQUARE_ACCESS_TOKEN
   wrangler secret put SQUARE_LOCATION_ID
   ```
5. Open `wrangler.toml`, change:
   ```
   SQUARE_ENV = "production"
   ```
   Save, then redeploy:
   ```
   wrangler deploy
   ```
6. Open `assets/js/config.js`, update `squareEnv: "production"` and
   swap in your production `squareAppId` and `squareLocationId`.
   Upload the file to GitHub.
7. Place **one small real order yourself** (an actual card, an actual
   few dollars) to confirm the whole path works before telling
   customers you're open. Refund yourself afterward from the Square
   Dashboard if you'd like.

## PART 10 — Fulfilling orders day-to-day

1. Every paid order appears in **Square Dashboard → Orders &
   Payments → Orders**, with the buyer's shipping address already
   attached (because the Worker sends it as a `SHIPMENT`
   fulfillment).
2. Go to the **Shipments** tab, find the order, and click **Create
   label** to buy and print the actual shipping label — this part is
   manual because Square doesn't offer a public API for purchasing
   labels from outside code (see below).
3. Mark orders as fulfilled in the dashboard once shipped so your
   records stay clean.

---

## Quick reference — where each value goes

| Value | Where you got it | Where it goes |
|---|---|---|
| Sandbox/Production Application ID | Square → Credentials page | `config.js` → `squareAppId` |
| Sandbox/Production Access Token | Square → Credentials page | Worker secret `SQUARE_ACCESS_TOKEN` (never in `config.js`) |
| Location ID | Square → Locations page | Both `config.js` → `squareLocationId` **and** Worker secret `SQUARE_LOCATION_ID` |
| Worker URL | Printed after `wrangler deploy` | `config.js` → `workerUrl` |
| GitHub Pages URL | Your repo's Settings → Pages tab | `wrangler.toml` → `ALLOWED_ORIGIN` |

## About shipping labels specifically

Square doesn't offer a public API for purchasing/printing a shipping
label from outside code — that step only exists inside Square
Dashboard (**Orders & Payments → Orders → Shipments**, per Part 10).
Because the Worker creates every order with a `SHIPMENT` fulfillment
and the buyer's address attached, paid orders show up there
automatically, ready for a label in a couple of clicks. There's no way
to fully skip that manual step and still use Square as your shipping
carrier — third-party tools like Shippo integrate with Square if you
want to automate that piece too, down the line.

## A note on security

The Worker recomputes prices and the card fee itself rather than
trusting whatever the browser sends, so someone can't tamper with
prices in the page and pay less. It does still trust the *names and
quantities* of items in the cart, since it doesn't check them against
your live Google Sheet before charging. Worth hardening later, not
required to launch.
