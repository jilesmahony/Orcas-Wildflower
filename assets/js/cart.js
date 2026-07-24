/* ============================================================
   CART.JS
   A simple shopping cart stored in the browser (localStorage).
   No backend is required for this to work — it just remembers
   what a visitor has added while they browse the site.

   When you connect Square payments later (see README "Phase 2"),
   the checkoutWithSquare() function at the bottom is the one
   spot you'll wire up to actually charge a card and create the
   order — everything above it can stay exactly as-is.
   ============================================================ */

const CART_KEY = "orcasWildflowerCart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find((line) => line.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }
  saveCart(cart);
}

function updateCartQty(productId, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter((line) => line.id !== productId);
  } else {
    const line = cart.find((l) => l.id === productId);
    if (line) line.qty = qty;
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((line) => line.id !== productId);
  saveCart(cart);
}

function getCartCount() {
  return getCart().reduce((sum, line) => sum + line.qty, 0);
}

/* Reads live product data (price/stock) so totals always match
   what's currently in assets/data/products.json. */
async function getCartDetailed() {
  const products = await loadProducts();
  const cart = getCart();
  return cart
    .map((line) => {
      const product = products.find((p) => p.id === line.id);
      if (!product) return null;
      const unitPrice = product.salePrice ?? product.price;
      return { ...line, product, unitPrice, lineTotal: unitPrice * line.qty };
    })
    .filter(Boolean);
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;
  const count = getCartCount();
  badge.textContent = count;
  badge.classList.toggle("is-visible", count > 0);
}
window.updateCartBadge = updateCartBadge;
