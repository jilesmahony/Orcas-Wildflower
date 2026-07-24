/* ============================================================
   CHECKOUT.JS
   Front-end half of the Square checkout. This file:
   1. Loads Square's Web Payments SDK (sandbox or production,
      based on CHECKOUT_CONFIG in config.js)
   2. Renders a secure card-number field Square hosts for you
      (your code never touches raw card numbers)
   3. On submit, tokenizes the card, then sends the cart + shipping
      address + that token to your Worker (see /worker) to actually
      charge it and create the Square order.

   Nothing here works until CHECKOUT_CONFIG in config.js is filled
   in — see worker/README.md for the full setup walkthrough.
   ============================================================ */

let squareCard = null;

function loadSquareSdk() {
  return new Promise((resolve, reject) => {
    if (window.Square) return resolve();
    const script = document.createElement("script");
    script.src = CHECKOUT_CONFIG.squareEnv === "production"
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load Square's payment form."));
    document.head.appendChild(script);
  });
}

async function initCheckoutForm() {
  const wrap = document.getElementById("checkout-form-wrap");
  if (!wrap) return;

  if (!CHECKOUT_CONFIG.workerUrl || !CHECKOUT_CONFIG.squareAppId || !CHECKOUT_CONFIG.squareLocationId) {
    wrap.innerHTML = `<div class="admin-note">Checkout isn't configured yet — fill in <code>CHECKOUT_CONFIG</code> in <code>assets/js/config.js</code> once your Worker is deployed (see <code>worker/README.md</code>).</div>`;
    return;
  }

  try {
    await loadSquareSdk();
    const payments = window.Square.payments(CHECKOUT_CONFIG.squareAppId, CHECKOUT_CONFIG.squareLocationId);
    squareCard = await payments.card();
    await squareCard.attach("#square-card-container");
  } catch (err) {
    wrap.innerHTML = `<div class="admin-note">Couldn't load the payment form: ${err.message}</div>`;
  }
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("checkout-submit-btn");
  const statusEl = document.getElementById("checkout-status");
  btn.disabled = true;
  btn.textContent = "Processing…";
  statusEl.textContent = "";

  try {
    const tokenResult = await squareCard.tokenize();
    if (tokenResult.status !== "OK") {
      throw new Error(tokenResult.errors?.[0]?.message || "Card details didn't validate.");
    }

    const lines = await getCartDetailed();
    const cart = lines.map((l) => ({ id: l.id, name: l.product.name, qty: l.qty, unitPrice: l.unitPrice }));

    const buyer = {
      name: document.getElementById("ship-name").value.trim(),
      email: document.getElementById("ship-email").value.trim(),
      address: {
        line1: document.getElementById("ship-address1").value.trim(),
        line2: document.getElementById("ship-address2").value.trim(),
        city: document.getElementById("ship-city").value.trim(),
        state: document.getElementById("ship-state").value.trim(),
        zip: document.getElementById("ship-zip").value.trim(),
        country: "US",
      },
    };

    const res = await fetch(CHECKOUT_CONFIG.workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart, buyer, sourceId: tokenResult.token }),
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.error || "Payment couldn't be completed.");
    }

    localStorage.removeItem(CART_KEY);
    document.getElementById("checkout-form-wrap").innerHTML = `
      <div class="admin-note">
        <strong>Thank you! Your order is in.</strong><br>
        Order confirmation: ${result.orderId}<br>
        A receipt has been sent to ${buyer.email}. All sales are final.
      </div>`;
  } catch (err) {
    statusEl.textContent = err.message;
    btn.disabled = false;
    btn.textContent = "Place Order";
  }
}
