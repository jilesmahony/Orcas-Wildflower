/* ============================================================
   Orcas Wildflower — Checkout Worker
   Deployed to Cloudflare Workers. This is the ONLY place your
   real Square access token lives — never put it in the website
   code itself, since anything in the browser is public.

   What it does, per request:
   1. Receives the cart + shipping address + a one-time card
      token (created in the browser by the Square Web Payments SDK)
   2. Creates a Square Order with a SHIPMENT fulfillment (so it
      shows up ready-to-label in Square Dashboard → Shipments)
   3. Charges the card for that order via the Square Payments API
   4. Returns success/failure to the website

   See worker/README.md for how to deploy this and set your
   secrets. Nothing here needs your real keys typed into it —
   they're read from environment secrets at runtime.
   ============================================================ */

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function squareBaseUrl(env) {
  return env.SQUARE_ENV === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

async function squareFetch(env, path, body) {
  const res = await fetch(`${squareBaseUrl(env)}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      "Square-Version": "2024-10-17",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

function toMoney(dollars) {
  // Square wants whole cents, as an integer, US currency for now.
  return Math.round(dollars * 100);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }
    if (request.method !== "POST") {
      return new Response("Not found", { status: 404, headers: corsHeaders(env) });
    }

    try {
      const { cart, buyer, sourceId } = await request.json();

      if (!cart || !cart.length || !sourceId || !buyer?.email || !buyer?.address) {
        return json({ error: "Missing cart, buyer info, or payment token." }, 400, env);
      }

      // --- Recompute totals server-side (never trust prices sent from the browser) ---
      const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
      const cardFee = subtotal * 0.029 + 0.3;
      const total = subtotal + cardFee;

      const lineItems = cart.map((item) => ({
        name: item.name,
        quantity: String(item.qty),
        base_price_money: { amount: toMoney(item.unitPrice), currency: "USD" },
      }));
      lineItems.push({
        name: "Credit Card Processing Fee",
        quantity: "1",
        base_price_money: { amount: toMoney(cardFee), currency: "USD" },
      });

      // --- 1) Create the Order (with a SHIPMENT fulfillment so it lands in Square's Shipment Manager) ---
      const orderIdempotencyKey = crypto.randomUUID();
      const orderResult = await squareFetch(env, "/v2/orders", {
        idempotency_key: orderIdempotencyKey,
        order: {
          location_id: env.SQUARE_LOCATION_ID,
          line_items: lineItems,
          fulfillments: [
            {
              type: "SHIPMENT",
              shipment_details: {
                recipient: {
                  display_name: buyer.name || buyer.email,
                  email_address: buyer.email,
                  address: {
                    address_line_1: buyer.address.line1,
                    address_line_2: buyer.address.line2 || "",
                    locality: buyer.address.city,
                    administrative_district_level_1: buyer.address.state,
                    postal_code: buyer.address.zip,
                    country: buyer.address.country || "US",
                  },
                },
              },
            },
          ],
        },
      });

      if (!orderResult.ok) {
        return json({ error: "Could not create order", details: orderResult.data }, 502, env);
      }
      const order = orderResult.data.order;

      // --- 2) Charge the card for the order total ---
      const paymentResult = await squareFetch(env, "/v2/payments", {
        idempotency_key: crypto.randomUUID(),
        source_id: sourceId,
        order_id: order.id,
        location_id: env.SQUARE_LOCATION_ID,
        amount_money: { amount: toMoney(total), currency: "USD" },
        buyer_email_address: buyer.email,
      });

      if (!paymentResult.ok) {
        return json({ error: "Payment failed", details: paymentResult.data }, 402, env);
      }

      return json({
        success: true,
        orderId: order.id,
        paymentId: paymentResult.data.payment.id,
        total,
      }, 200, env);

    } catch (err) {
      return json({ error: "Unexpected server error", details: String(err) }, 500, env);
    }
  },
};

function json(obj, status, env) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}
