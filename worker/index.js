/* ============================================================
   Orcas Wildflower — Checkout Worker
   Deployed to Cloudflare Workers. This is the ONLY place your
   real Square access token, Shippo API key, etc. live — never
   put secrets in the website code itself, since anything in the
   browser is public. See worker/README.md for full setup.

   Two endpoints:

   POST /api/quote
     In:  { cart: [{id, qty}], zip }
     Out: { subtotal, cardFee, tax, weight, shippingOptions: [...] }
     Used while the buyer is still on your cart page, to show them
     shipping choices and a running total before they check out.

   POST /api/checkout
     In:  { cart: [{id, qty}], zip, shipping: {label, amount} }
     Out: { url }  — a Square-hosted checkout page URL to send the
     buyer to. They enter card + confirm shipping address there,
     Square handles PCI compliance, then redirects back to your site.

   Both endpoints fetch your live Google Sheet themselves rather
   than trusting prices/weights sent from the browser, so someone
   can't tamper with the page and pay less.
   ============================================================ */

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj, status, env) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

function toMoney(dollars) {
  return Math.round(dollars * 100); // Square wants whole cents
}

/* ---------- Minimal CSV parser (handles quoted fields with commas) ---------- */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && next === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else { field += c; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.length > 1 || r[0]).map((r) => {
    const obj = {};
    headers.forEach((h, i) => (obj[h] = (r[i] || "").trim()));
    return obj;
  });
}

async function getLiveCatalog(env) {
  const res = await fetch(env.SHEET_CSV_URL);
  const text = await res.text();
  const rows = parseCsv(text);
  const num = (v) => (v === undefined || v === null || v === "" ? null : parseFloat(v));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    price: num(r.price) || 0,
    salePrice: num(r.salePrice),
    weight: num(r.weight) || 0.5,
    length: num(r.length) || 8,
    width: num(r.width) || 6,
    height: num(r.height) || 3,
  }));
}

/* Resolves the cart's item IDs against the live catalog, computes
   subtotal + the parcel Shippo needs to quote (simple approximation:
   total weight added up, box dimensions taken from the largest
   single item — good enough for small/light shop goods). */
function resolveCart(cartIn, catalog) {
  const lines = [];
  let subtotal = 0, weight = 0, length = 4, width = 4, height = 2;
  for (const item of cartIn) {
    const product = catalog.find((p) => p.id === item.id);
    if (!product || !item.qty || item.qty < 1) continue;
    const unitPrice = product.salePrice != null && product.salePrice < product.price ? product.salePrice : product.price;
    subtotal += unitPrice * item.qty;
    weight += product.weight * item.qty;
    length = Math.max(length, product.length);
    width = Math.max(width, product.width);
    height = Math.max(height, product.height);
    lines.push({ name: product.name, qty: item.qty, unitPrice });
  }
  return { lines, subtotal, parcel: { weight: Math.max(weight, 0.1), length, width, height } };
}

/* ---------- WA sales tax (free official state lookup; $0 outside WA) ---------- */
async function lookupTax(env, zip, subtotal) {
  try {
    const url = `https://webgis.dor.wa.gov/webapi/AddressRates.aspx?output=text&zip=${encodeURIComponent(zip)}`;
    const res = await fetch(url);
    const text = await res.text();
    const match = text.match(/Rate=([\d.]+)/);
    const resultCode = text.match(/ResultCode=(\d+)/)?.[1];
    // ResultCode 6 = not found at all (almost always means "not a WA zip") -> no WA tax.
    if (!match || resultCode === "6") return 0;
    const rate = parseFloat(match[1]);
    return Math.round(subtotal * rate * 100) / 100;
  } catch {
    return 0; // if the lookup fails for any reason, don't block checkout — just charge no tax
  }
}

/* ---------- Shippo live shipping rates ---------- */
async function getShippingOptions(env, parcel, zip) {
  const body = {
    address_from: {
      street1: env.SHOP_ADDRESS_LINE1,
      city: env.SHOP_CITY,
      state: env.SHOP_STATE,
      zip: env.SHOP_ZIP,
      country: "US",
    },
    address_to: { zip, country: "US" },
    parcels: [{
      length: String(parcel.length),
      width: String(parcel.width),
      height: String(parcel.height),
      distance_unit: "in",
      weight: String(parcel.weight),
      mass_unit: "lb",
    }],
    async: false,
  };

  const res = await fetch("https://api.goshippo.com/shipments/", {
    method: "POST",
    headers: {
      "Authorization": `ShippoToken ${env.SHIPPO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.rates) return [];

  return data.rates
    .map((r) => ({
      id: r.object_id,
      label: `${r.provider} ${r.servicelevel?.name || ""}`.trim(),
      amount: parseFloat(r.amount),
      days: r.estimated_days,
    }))
    .sort((a, b) => a.amount - b.amount)
    .slice(0, 5);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(env) });

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/quote") {
      try {
        const { cart, zip } = await request.json();
        if (!cart?.length || !zip) return json({ error: "Missing cart or ZIP code." }, 400, env);

        const catalog = await getLiveCatalog(env);
        const { subtotal, parcel } = resolveCart(cart, catalog);
        const cardFee = subtotal * 0.029 + 0.3;
        const [tax, shippingOptions] = await Promise.all([
          lookupTax(env, zip, subtotal),
          getShippingOptions(env, parcel, zip),
        ]);

        return json({ subtotal, cardFee, tax, weight: parcel.weight, shippingOptions }, 200, env);
      } catch (err) {
        return json({ error: "Could not calculate a quote", details: String(err) }, 500, env);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/checkout") {
      try {
        const { cart, zip, shipping } = await request.json();
        if (!cart?.length || !zip || !shipping?.amount) {
          return json({ error: "Missing cart, ZIP code, or shipping selection." }, 400, env);
        }
        // Basic sanity bound on the shipping amount — see the security
        // note in worker/README.md about this trust boundary.
        if (typeof shipping.amount !== "number" || shipping.amount < 0 || shipping.amount > 500) {
          return json({ error: "Shipping amount looks invalid." }, 400, env);
        }

        const catalog = await getLiveCatalog(env);
        const { lines, subtotal } = resolveCart(cart, catalog);
        const cardFee = subtotal * 0.029 + 0.3;
        const tax = await lookupTax(env, zip, subtotal);

        const lineItems = lines.map((l) => ({
          name: l.name,
          quantity: String(l.qty),
          base_price_money: { amount: toMoney(l.unitPrice), currency: "USD" },
        }));
        lineItems.push({
          name: `Shipping — ${shipping.label}`,
          quantity: "1",
          base_price_money: { amount: toMoney(shipping.amount), currency: "USD" },
        });
        if (tax > 0) {
          lineItems.push({
            name: "Sales Tax (WA)",
            quantity: "1",
            base_price_money: { amount: toMoney(tax), currency: "USD" },
          });
        }
        lineItems.push({
          name: "Credit Card Processing Fee",
          quantity: "1",
          base_price_money: { amount: toMoney(cardFee), currency: "USD" },
        });

        const squareBase = env.SQUARE_ENV === "production"
          ? "https://connect.squareup.com"
          : "https://connect.squareupsandbox.com";

        const linkRes = await fetch(`${squareBase}/v2/online-checkout/payment-links`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
            "Square-Version": "2024-10-17",
          },
          body: JSON.stringify({
            idempotency_key: crypto.randomUUID(),
            order: {
              location_id: env.SQUARE_LOCATION_ID,
              line_items: lineItems,
            },
            checkout_options: {
              ask_for_shipping_address: true,
              redirect_url: `${env.ALLOWED_ORIGIN}/order-confirmed.html`,
            },
          }),
        });
        const linkData = await linkRes.json();
        if (!linkRes.ok) return json({ error: "Could not create checkout", details: linkData }, 502, env);

        return json({ url: linkData.payment_link.url }, 200, env);
      } catch (err) {
        return json({ error: "Unexpected server error", details: String(err) }, 500, env);
      }
    }

    return new Response("Not found", { status: 404, headers: corsHeaders(env) });
  },
};
