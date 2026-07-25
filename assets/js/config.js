/* ============================================================
   CONFIG.JS
   One switch that controls where product data comes from.

   OPTION A — Local file (default): edit assets/data/products.json
   by hand, or with the Product Manager at /admin/index.html, then
   push the change to GitHub.

   OPTION B — Google Sheets: keep your whole catalog in a Google
   Sheet and edit stock/price/description there — the site reads
   it live, no GitHub push required. To turn this on:

   1. In Google Sheets, create a sheet with one row per product and
      these exact column headers in row 1:
        id | name | category | subcategory | price | salePrice | stock | tags | images | description

      - category must be: clothing / jewelry / accessories
      - subcategory must match one of the sub-tabs (e.g. earrings, hoodies)
      - tags: put new, popular, both separated by a comma, or leave blank
      - images: one or more image URLs separated by a "|" character,
        or leave blank to show a placeholder
      - leave salePrice blank if the item isn't on sale

   2. In Google Sheets: File → Share → Publish to web → choose the
      sheet → Comma-separated values (.csv) → Publish. Copy the link
      it gives you.

   3. Paste that link below as SHEET_CSV_URL, and change MODE to "sheet".

   4. Anyone you share "edit" access to the Sheet with (not this
      code) can now update stock, price, or descriptions, and the
      live site picks it up on next page load.
   ============================================================ */

const DATA_SOURCE = {
  mode: "sheet", // "local" or "sheet"
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSbx5CPEUx5aXMZIgaHSraev2KWORsZj5CizUZvGebAxncWlS4sfwUEULAMRqfCAB__M8OPNFr3PkRa/pub?gid=1109894403&single=true&output=csv",
};

/* ============================================================
   CHECKOUT_CONFIG
   Fill these in once your Worker is deployed (see worker/README.md).
   squareAppId and squareLocationId are PUBLIC values — safe to put
   here. Your real secret (the access token) lives only in the
   Worker's environment, never in this file.
   ============================================================ */
const CHECKOUT_CONFIG = {
  squareEnv: "sandbox",          // "sandbox" or "production"
  squareAppId: "sandbox-sq0idb-x0Q17b6d-SDl4qQmuirgug",               // e.g. "sandbox-sq0idb-..."
  squareLocationId: "LPYP9MV3YVRJ9",          // e.g. "L1AB2CD3EF4GH"
  workerUrl: "https://orcas-wildflower-checkout.orcaswildflower.workers.dev",                 // e.g. "https://orcas-wildflower-checkout.yourname.workers.dev"
};
