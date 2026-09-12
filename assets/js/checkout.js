/* ============================================================
   CHECKOUT.JS
   1. Buyer enters their ZIP code on the cart page.
   2. We ask the Worker for a quote: real shipping rates from
      Shippo, WA sales tax if applicable, and the card fee — all
      computed server-side against your live Google Sheet.
   3. Buyer picks a shipping option; the total updates live.
   4. "Checkout" sends the cart + ZIP + chosen shipping option to
      the Worker, which creates a Square order and returns a
      Square-hosted checkout page URL. We redirect there — the
      buyer enters card + confirms their full address on Square's
      own secure page, then Square sends them back to
      order-confirmed.html when done.

   Nothing here works until CHECKOUT_CONFIG.workerUrl in config.js
   is filled in — see worker/README.md.
   ============================================================ */

let currentQuote = null;
let selectedShipping = null;

function money(n) {
  return "$" + n.toFixed(2);
}

async function handleGetQuote(e) {
  e.preventDefault();
  const zip = document.getElementById("quote-zip").value.trim();
  const statusEl = document.getElementById("quote-status");
  const btn = document.getElementById("quote-btn");
  if (!zip) return;

  btn.disabled = true;
  btn.textContent = "Calculating…";
  statusEl.textContent = "";

  try {
    const lines = await getCartDetailed();
    const cart = lines.map((l) => ({ id: l.id, qty: l.qty }));

    const res = await fetch(`${CHECKOUT_CONFIG.workerUrl}/api/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart, zip }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Couldn't get a quote.");

    currentQuote = { ...data, zip };
    selectedShipping = data.shippingOptions?.[0] || null;
    renderQuote();
  } catch (err) {
    statusEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Calculate Shipping & Tax";
  }
}

function renderQuote() {
  const wrap = document.getElementById("quote-results");
  if (!currentQuote) { wrap.innerHTML = ""; return; }

  const { subtotal, cardFee, tax, shippingOptions } = currentQuote;

  if (!shippingOptions?.length) {
    wrap.innerHTML = `<p class="summary-note">No shipping options came back for that ZIP — double check it, or contact us directly.</p>`;
    document.getElementById("checkout-submit-btn").disabled = true;
    return;
  }

  wrap.innerHTML = `
    <div class="form-field">
      <label>Choose Shipping</label>
      ${shippingOptions.map((opt, i) => `
        <label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--kelp-line);">
          <input type="radio" name="shipping-opt" value="${opt.id}" ${i === 0 ? "checked" : ""}>
          <span style="flex:1;">${opt.label}${opt.days ? ` — ~${opt.days} business day${opt.days > 1 ? "s" : ""}` : ""}</span>
          <strong>${money(opt.amount)}</strong>
        </label>`).join("")}
    </div>
    <div class="summary-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    <div class="summary-row"><span>Credit Card Fee</span><span>${money(cardFee)}</span></div>
    <div class="summary-row"><span>Tax</span><span>${tax > 0 ? money(tax) : "$0.00"}</span></div>
    <div class="summary-row"><span>Shipping</span><span id="quote-shipping-amount">${money(shippingOptions[0].amount)}</span></div>
    <div class="summary-row total"><span>Total</span><span id="quote-total-amount">${money(subtotal + cardFee + tax + shippingOptions[0].amount)}</span></div>`;

  wrap.querySelectorAll('input[name="shipping-opt"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      selectedShipping = shippingOptions.find((o) => o.id === radio.value);
      updateQuoteTotal();
    });
  });

  document.getElementById("checkout-submit-btn").disabled = false;
}

function updateQuoteTotal() {
  if (!currentQuote || !selectedShipping) return;
  const { subtotal, cardFee, tax } = currentQuote;
  document.getElementById("quote-shipping-amount").textContent = money(selectedShipping.amount);
  document.getElementById("quote-total-amount").textContent = money(subtotal + cardFee + tax + selectedShipping.amount);
}

async function handleCheckout() {
  const btn = document.getElementById("checkout-submit-btn");
  const statusEl = document.getElementById("checkout-status");
  if (!currentQuote || !selectedShipping) return;

  btn.disabled = true;
  btn.textContent = "Redirecting to secure checkout…";
  statusEl.textContent = "";

  try {
    const lines = await getCartDetailed();
    const cart = lines.map((l) => ({ id: l.id, qty: l.qty }));

    const res = await fetch(`${CHECKOUT_CONFIG.workerUrl}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart, zip: currentQuote.zip, shipping: selectedShipping }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) throw new Error(data.error || "Couldn't start checkout.");

    window.location.href = data.url;
  } catch (err) {
    statusEl.textContent = err.message;
    btn.disabled = false;
    btn.textContent = "Checkout";
  }
}
