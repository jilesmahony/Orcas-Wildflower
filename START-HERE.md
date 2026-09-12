# Start-to-Finish Guide — Picking Up From Here

This covers everything left to do, written assuming you've never used
any of these programs before. Follow it in order, top to bottom.

---

# PART A — Set up the one-click importer in your Google Sheet

This adds a button to your existing Sheet that replaces your whole
product catalog from a file in one click, instead of copy-pasting
cells.

1. Open your product Google Sheet in your browser (the one you
   already have set up and published).
2. Along the top of the screen, find the menu bar (it has words like
   File, Edit, View, Insert...). Click **Extensions**.
3. In the dropdown, click **Apps Script**. This opens a new browser
   tab with a code editor — it looks intimidating but you're just
   going to paste in two things.
4. You'll see a file already open, usually named `Code.gs`, with some
   placeholder text like `function myFunction() {}`. **Click inside
   that code area, select everything** (click once inside it, then
   press `Ctrl+A` on Windows or `Cmd+A` on Mac), and **delete it**.
5. Open the file called `Code.gs` from the `google-sheets-importer`
   folder in the zip I gave you (in any text editor, or just view it
   in File Explorer/Finder). **Select all of its text and copy it**
   (`Ctrl+A` then `Ctrl+C`, or `Cmd+A` then `Cmd+C` on Mac).
6. Go back to the Apps Script browser tab and **paste** (`Ctrl+V` /
   `Cmd+V`) into the empty code area.
7. Now you need to add the second file. In the Apps Script editor,
   look at the left sidebar — there's a **Files** section with a
   **+** button next to it. Click the **+**, then click **HTML** from
   the little menu that appears.
8. It'll ask you to name the new file. Type exactly:
   ```
   ImportDialog
   ```
   (no `.html` at the end — Apps Script adds that automatically) and
   press Enter.
9. This opens a new blank file. Delete any placeholder content the
   same way as step 4, then open `ImportDialog.html` from the same
   `google-sheets-importer` folder, copy all of its contents, and
   paste them into this new file.
10. Repeat steps 7–9 one more time for a **third** file: click **+**
    → **HTML**, name it exactly `AddPhotoDialog`, delete any
    placeholder content, then copy everything from
    `AddPhotoDialog.html` (same folder) and paste it in.
11. Save everything: press `Ctrl+S` (Windows) or `Cmd+S` (Mac). It
    may ask you to name the whole project — type anything, like
    `Product Importer`, and click **OK**.

## Part A.5 — One-time: connect free photo hosting (imgur)

This is what makes the "Add Product Photo" button work — it's a
one-time setup for you (not something your aunt needs to touch), so
photo uploads never need GitHub at all.

1. Go to **https://api.imgur.com/oauth2/addclient**.
2. Log in or create a free imgur account if it asks.
3. Fill in the form:
   - **Application name**: anything, like `Orcas Wildflower Photos`.
   - **Authorization type**: choose **Anonymous usage without user
     authorization**.
   - **Email**: your email address.
   - Fill in the "how will this be used" box with a sentence or two —
     anything reasonable works.
4. Click **Submit**. It shows you a **Client ID** — a short string of
   letters and numbers. Copy it.
5. Back in the Apps Script editor tab, open `Code.gs` and find this
   line near the top:
   ```
   const IMGUR_CLIENT_ID = "PASTE_YOUR_IMGUR_CLIENT_ID_HERE";
   ```
   Replace the placeholder text between the quotes with the Client ID
   you copied, keeping the quotation marks. Save (`Ctrl+S` / `Cmd+S`).

This never expires and never needs touching again.

12. Close the Apps Script browser tab and **go back to your actual
    Google Sheet tab**. **Refresh the page** (reload the browser tab —
    click the circular refresh arrow, or press `F5`).
13. After it reloads, look at the menu bar again. You should now see
    a brand new menu item called **Product Catalog** sitting after
    Help, with two options: **Import CSV (replace all)...** and
    **Add Product Photo...**. (If you don't see it yet, wait a few
    seconds and refresh again — it can take a moment the very first
    time.)

**The first time you use it**, Google will ask for permission since
this is a script you added yourself:
- Click **Product Catalog → Import CSV (replace all)...**
- A box titled "Authorization required" will pop up. Click
  **Continue**.
- Choose your Google account.
- You'll likely see a screen saying "Google hasn't verified this app"
  — this is completely normal for a script you wrote/pasted in
  yourself (Google shows this for any personal script, not because
  anything is wrong). Click **Advanced** (small text link), then
  click **Go to Product Importer (unsafe)** — "unsafe" here just
  means "not reviewed by Google's app store," not that anything is
  actually wrong.
- Click **Allow** on the final permissions screen.

That's the one-time setup done. From now on, **Product Catalog →
Import CSV (replace all)...** just works instantly with no more
permission prompts.

---

# PART B — Import your updated product catalog

1. In your Google Sheet, click **Product Catalog → Import CSV
   (replace all)...**
2. A small box pops up. Click **Choose File**, and select
   `products-final.csv` (from the files I gave you in this
   conversation — save it to your computer first if you haven't).
3. Click **Import & Replace**.
4. You'll see "Imported 28 products!" and the dialog closes itself.
   Your whole sheet is now replaced with the updated data — including
   the new `weight`, `length`, `width`, `height` columns, with
   `description` moved to the far-right column as you asked.

**Important:** this only replaces the data — it does **not** change
your Sheet's published link, since it's the same sheet/tab as before.
Nothing else needs to be touched for the website to see this update.

From now on, whenever you want to bulk-replace your whole catalog
(e.g. after making a lot of edits somewhere else, or restocking a big
batch of new items), you can build a new CSV with the same 14 column
headers and use this same **Import CSV (replace all)** button instead
of retyping everything by hand.

---

# PART B.5 — Adding photos (this is the easy part for your aunt)

Once Part A and Part A.5 are done, this is the **entire** workflow —
no GitHub, no code, no copying links. This is the part to show her:

1. Open the Google Sheet.
2. Click **Product Catalog → Add Product Photo...** in the menu bar.
3. A small box pops up. Use the dropdown to pick which product the
   photo is for.
4. Click **Choose File** (or tap it on a phone) and pick the photo —
   straight from a camera roll, Downloads folder, wherever it is.
5. Click **Upload Photo**.
6. After a few seconds it'll say "Done!" and close itself. The photo
   is now live on the website for that product — nothing else to do.

That's the whole thing. Adding a second photo to the same product
later works exactly the same way — it adds onto the first one rather
than replacing it. If you ever want to *remove* a photo, that one
small edit does need the Sheet itself: find that product's row, click
into its `images` cell, and delete the specific link (or the whole
cell) by hand.

---

# PART C — Upload the updated website files to GitHub

Only these files actually changed this round — you don't need to
touch anything else in your repo:

- `assets/css/style.css`
- `assets/js/products.js`
- `assets/js/checkout.js` *(new file)*
- `assets/js/config.js`
- `cart.html`
- `order-confirmed.html` *(new file)*
- `worker/index.js`
- `worker/wrangler.toml`
- `worker/README.md`

**How to upload/replace them**, one at a time, the same way as
before:
1. Go to your repository on **github.com**.
2. Click into the folder containing the file (e.g. click `assets`,
   then `js`, to get to `products.js`).
3. Click **Add file → Upload files** (top right).
4. Drag the matching file from the zip I gave you into the upload box.
   GitHub will recognize it has the same name and offer to replace
   the old one.
5. Scroll down, click **Commit changes**.
6. Repeat for each file in the list above. For the two brand-new
   files (`checkout.js` and `order-confirmed.html`), upload them into
   `assets/js/` and the main repo root, respectively — same Upload
   Files process, just adding something new rather than replacing.

Give GitHub Pages a minute or two after your last upload to rebuild
before testing.

---

# PART D — Create your free Shippo account

Shippo looks up real shipping prices for you — same engine behind
Square's own label printing.

1. Go to **https://goshippo.com** in your browser.
2. Click **Sign Up** (top right).
3. Fill in your email and a password, or sign up with Google. No
   credit card is required just to get rate quotes.
4. Once you're logged in and land on the Shippo dashboard, click your
   account/profile icon or name (usually top-right corner).
5. Look for **Settings**, then **API** in the menu on that page (the
   exact wording can shift slightly, but it will say something like
   "API" or "API Keys").
6. You'll see two long strings of letters/numbers: a **Test Token**
   and a **Live Token**. Click the little copy icon next to the
   **Test Token**, or select and copy it manually — it starts with
   `shippo_test_`. Paste it somewhere temporary (a Notes app, a blank
   document) — you'll need it in the next part.

---

# PART E — Redeploy the Worker with the new setup

You've done all of this before, just with a couple of new additions.

1. Open a terminal (Command Prompt on Windows, Terminal on Mac).
2. Get into the `worker` folder from the zip — type `cd ` (with a
   trailing space), then drag the `worker` folder from File
   Explorer/Finder into the terminal window, then press Enter.
3. Confirm you're in the right place — type `dir` (Windows) or `ls`
   (Mac) and press Enter. You should see `index.js` and
   `wrangler.toml` listed.
4. Open `wrangler.toml` in Notepad (Windows: right-click → Open with
   → Notepad) or TextEdit (Mac: right-click → Open With → TextEdit,
   then Format menu → Make Plain Text if needed). Check these lines
   near the top match your real info (they should already be
   pre-filled correctly, but double check):
   ```
   ALLOWED_ORIGIN = "https://your-real-github-pages-address"
   SHEET_CSV_URL = "https://docs.google.com/...your real link...output=csv"
   SHOP_ADDRESS_LINE1 = "203 North Beach Road"
   SHOP_CITY = "Eastsound"
   SHOP_STATE = "WA"
   SHOP_ZIP = "98245"
   ```
   Fix anything that doesn't match your actual info, save, and close
   the editor.
5. Back in the terminal, set your three secret values one at a time.
   For each one: type the command, press Enter, paste the value when
   it prompts you (nothing will visibly appear as you paste — that's
   normal), then press Enter again.
   ```
   wrangler secret put SQUARE_ACCESS_TOKEN
   ```
   (paste your Sandbox Access Token from Square)
   ```
   wrangler secret put SQUARE_LOCATION_ID
   ```
   (paste your Square Location ID)
   ```
   wrangler secret put SHIPPO_API_KEY
   ```
   (paste the Shippo **Test Token** from Part D)
6. Deploy:
   ```
   wrangler deploy
   ```
   Wait for it to finish. It'll print a URL ending in `.workers.dev`
   — copy that exact text.

---

# PART F — Point the website at your Worker

1. Go to your repo on **github.com**.
2. Click into `assets`, then `js`, then click on `config.js`.
3. Click the pencil (✏️) icon near the top right of the file view to
   edit it right in your browser.
4. Find this near the bottom of the file:
   ```js
   const CHECKOUT_CONFIG = {
     workerUrl: "",
   };
   ```
5. Type your Worker's URL between the quotation marks, so it looks
   like:
   ```js
   const CHECKOUT_CONFIG = {
     workerUrl: "https://orcas-wildflower-checkout.yourname.workers.dev",
   };
   ```
6. Scroll down and click the green **Commit changes** button.

---

# PART G — Test a complete order

1. Wait a minute or two for GitHub Pages to rebuild, then open your
   live website.
2. Add a product to your cart, then click the cart icon and go to the
   cart page.
3. Type a real ZIP code into the ZIP field (use a real one — Shippo
   needs an actual place to calculate rates for) and click
   **Calculate Shipping & Tax**.
4. You should see a short list of real shipping prices appear, plus a
   tax line (only shows a real number if the ZIP is in Washington)
   and a total at the bottom.
5. Click a shipping option (one is pre-selected already), then click
   **Checkout**.
6. Your browser will redirect to a secure page hosted by Square. Fill
   in:
   - Card number: `4111 1111 1111 1111`
   - Expiration: any future date, like `12/29`
   - CVV: any 3 digits, like `123`
   - Shipping address: any real-looking address is fine for testing
7. Complete the payment. You should land back on your site's **"Your
   order is in"** confirmation page.
8. To double check it worked: go to **developer.squareup.com/apps** →
   your app → make sure it's set to **Sandbox** → find **Sandbox test
   accounts** in the left menu → click through to **Open in Square
   Dashboard** → click **Orders**. Your test order should be listed,
   itemized with the product, shipping cost, tax (if applicable), and
   card fee, plus the shipping address you entered.

If anything goes wrong, the page will usually show a red error
message — send me the exact wording and I'll help debug it.

---

# PART H — Go live (real orders, real money)

Only do this once Part G works cleanly.

1. On developer.squareup.com, switch your app from **Sandbox** to
   **Production** (toggle near the top). Copy the new **Production**
   Access Token (click Show) and Location ID.
2. On goshippo.com, copy your **Live Token** instead of the Test
   Token (same Settings → API page as Part D).
3. Back in your terminal, in the `worker` folder, update all three
   secrets with these new values (same three commands as Part E,
   step 5, just with the new Production/Live values this time).
4. Open `wrangler.toml` again, change:
   ```
   SQUARE_ENV = "production"
   ```
   Save, then run `wrangler deploy` again.
5. Place **one small real order yourself** — an actual card, an
   actual few dollars — before telling any customers you're open.

---

# PART I — Running the shop day-to-day from here

- **Add, remove, or restock products**: edit your Google Sheet
  directly (any single-cell edit updates the live site instantly), or
  build a new CSV and use the **Product Catalog → Import CSV** button
  from Part A/B to replace everything at once.
- **Add a photo**: **Product Catalog → Add Product Photo...** in the
  same Sheet — no GitHub involved (see Part B.5).
- **Fulfilling an order**: open **Square Dashboard → Orders**, find
  the paid order, go to its **Shipments** tab, and click **Create
  label** to buy and print the actual shipping label — this one step
  stays manual, since Square doesn't let outside code buy labels for
  you automatically.
- **Nothing else here needs Node, npm, or the terminal again** unless
  you want to change how the Worker itself behaves (e.g. tweak tax
  logic, change the credit card fee formula) — day-to-day selling is
  just the Google Sheet and Square Dashboard from here on.
