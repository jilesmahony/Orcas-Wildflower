/* ============================================================
   PRODUCTS.JS
   Every product lives in assets/data/products.json. This file
   just reads that data and turns it into HTML. To add, remove,
   or restock products you only ever need to touch products.json
   (by hand, or using the Product Manager at /admin/index.html) —
   nothing in this file needs to change.

   Later, when you connect Google Sheets as the real inventory
   source, you only need to change the fetch URL inside
   loadProducts() below to point at your Sheets/Cloudflare
   endpoint instead of the local file — every page that renders
   products will keep working unchanged.
   ============================================================ */

let _productsCache = null;

/* Turns one CSV row (from a published Google Sheet) into the same
   shape a product from products.json has. See config.js for the
   expected column headers. */
function csvRowToProduct(row) {
  const num = (v) => (v === undefined || v === null || String(v).trim() === "" ? null : parseFloat(v));
  return {
    id: (row.id || "").trim(),
    name: (row.name || "").trim(),
    category: (row.category || "").trim().toLowerCase(),
    subcategory: (row.subcategory || "").trim().toLowerCase(),
    price: num(row.price) || 0,
    salePrice: num(row.salePrice),
    stock: parseInt(row.stock, 10) || 0,
    tags: (row.tags || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    images: (row.images || "").split("|").map((s) => s.trim()).filter(Boolean),
    description: (row.description || "").trim(),
  };
}

async function loadProducts() {
  if (_productsCache) return _productsCache;

  if (DATA_SOURCE.mode === "sheet" && DATA_SOURCE.sheetCsvUrl) {
    const res = await fetch(DATA_SOURCE.sheetCsvUrl);
    const csvText = await res.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    _productsCache = parsed.data.map(csvRowToProduct).filter((p) => p.id);
    return _productsCache;
  }

  const res = await fetch("assets/data/products.json");
  _productsCache = await res.json();
  return _productsCache;
}

/* SVG placeholder used whenever a product has no real photo yet. */
function placeholderArt(seed = 0) {
  const hue = (seed * 47) % 360;
  return `<div class="hero-art" style="background:
    linear-gradient(160deg, hsl(${hue},32%,88%), hsl(${(hue+40)%360},28%,78%));
    display:flex;align-items:center;justify-content:center;">
    <svg viewBox="0 0 40 40" width="34" height="34" style="color:hsl(${hue},30%,40%)" fill="none">
      <path d="M20 34V15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M20 15C20 15 11 13 9 6C9 6 18 5 20 15Z" fill="currentColor" opacity="0.85"/>
      <path d="M20 15C20 15 29 13 31 6C31 6 22 5 20 15Z" fill="currentColor" opacity="0.6"/>
      <circle cx="20" cy="10" r="3.2" fill="currentColor"/>
    </svg>
  </div>`;
}

function money(n) {
  return "$" + n.toFixed(2);
}

function productMedia(product) {
  const img = product.images && product.images[0];
  if (img) return `<img src="${img}" alt="${product.name}" loading="lazy">`;
  return placeholderArt(product.name.length);
}

function productCardHTML(product) {
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const tags = [];
  if (product.tags?.includes("new")) tags.push('<span class="tag tag-new">New</span>');
  if (product.tags?.includes("popular")) tags.push('<span class="tag tag-popular">Popular</span>');
  if (onSale) tags.push('<span class="tag tag-sale">Sale</span>');
  if (product.stock === 0) tags.push('<span class="tag tag-stock">Sold Out</span>');

  return `
  <article class="product-card">
    <a href="product.html?id=${product.id}" class="product-media">
      ${tags.length ? `<div class="product-tags">${tags.join("")}</div>` : ""}
      ${productMedia(product)}
    </a>
    <div class="product-info">
      <span class="product-cat">${labelize(product.subcategory)}</span>
      <a href="product.html?id=${product.id}"><h3 class="product-name">${product.name}</h3></a>
      <div class="product-price${onSale ? " on-sale" : ""}">
        ${onSale ? `<span class="was">${money(product.price)}</span>` : ""}
        <span>${money(onSale ? product.salePrice : product.price)}</span>
      </div>
      <button class="btn btn-primary btn-sm add-btn" ${product.stock === 0 ? "disabled" : ""}
        onclick="addToCart('${product.id}',1); this.textContent='Added ✓'; setTimeout(()=>this.textContent='Add to Cart',1200);">
        ${product.stock === 0 ? "Sold Out" : "Add to Cart"}
      </button>
    </div>
  </article>`;
}

function labelize(slug) {
  if (!slug) return "";
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderProductGrid(container, products) {
  if (!products.length) {
    container.innerHTML = `<div class="empty-msg">
      <svg viewBox="0 0 40 40" fill="none"><path d="M20 34V15" stroke="currentColor" stroke-width="1.6"/><path d="M20 15C20 15 11 13 9 6C9 6 18 5 20 15Z" fill="currentColor"/></svg>
      <p>Nothing here yet — check back soon, or browse another category.</p>
    </div>`;
    return;
  }
  container.innerHTML = products.map(productCardHTML).join("");
}

/* ------------------------------------------------------------
   Generic category-page renderer.
   category      -> "clothing" | "jewelry" | "accessories"
   subcategories -> ordered list of { slug, label } for the pill row
   ------------------------------------------------------------ */
async function initCategoryPage(category, subcategories) {
  const products = await loadProducts();
  const params = new URLSearchParams(window.location.search);
  const activeSub = params.get("sub");

  const pillRow = document.getElementById("pill-row");
  if (pillRow) {
    pillRow.innerHTML = [{ slug: null, label: "Shop All" }, ...subcategories]
      .map((s) => {
        const href = s.slug ? `${category}.html?sub=${s.slug}` : `${category}.html`;
        const isActive = activeSub === s.slug;
        return `<a class="pill${isActive ? " is-active" : ""}" href="${href}">${s.label}</a>`;
      })
      .join("");
  }

  const filtered = products.filter(
    (p) => p.category === category && (!activeSub || p.subcategory === activeSub)
  );
  renderProductGrid(document.getElementById("product-grid"), filtered);

  const titleEl = document.getElementById("category-title");
  if (titleEl && activeSub) {
    const match = subcategories.find((s) => s.slug === activeSub);
    if (match) titleEl.textContent = match.label;
  }
}

/* Renders New Arrivals / Popular / Sale pages, filtered by tag,
   with an optional category pill filter. */
async function initTagPage(tagOrFilterFn) {
  const products = await loadProducts();
  const params = new URLSearchParams(window.location.search);
  const activeCat = params.get("cat");

  const matchesTag = typeof tagOrFilterFn === "function"
    ? tagOrFilterFn
    : (p) => p.tags?.includes(tagOrFilterFn);

  const pillRow = document.getElementById("pill-row");
  const cats = [
    { slug: null, label: "All" },
    { slug: "clothing", label: "Clothing" },
    { slug: "jewelry", label: "Jewelry" },
    { slug: "accessories", label: "Accessories" },
  ];
  if (pillRow) {
    pillRow.innerHTML = cats
      .map((c) => {
        const href = c.slug ? `?cat=${c.slug}` : window.location.pathname.split("/").pop();
        const isActive = activeCat === c.slug;
        return `<a class="pill${isActive ? " is-active" : ""}" href="${href}">${c.label}</a>`;
      })
      .join("");
  }

  const filtered = products.filter((p) => matchesTag(p) && (!activeCat || p.category === activeCat));
  renderProductGrid(document.getElementById("product-grid"), filtered);
}

/* ------------------------------------------------------------
   Product detail page
   ------------------------------------------------------------ */
async function initProductPage() {
  const products = await loadProducts();
  const params = new URLSearchParams(window.location.search);
  const product = products.find((p) => p.id === params.get("id"));
  const root = document.getElementById("product-root");

  if (!product) {
    root.innerHTML = `<div class="empty-msg"><p>We couldn't find that product. <a href="index.html" class="btn-ghost">Back to home</a></p></div>`;
    return;
  }

  document.title = `${product.name} — Orcas Wildflower`;
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const images = product.images && product.images.length ? product.images : [null];
  const stockClass = product.stock === 0 ? "out" : product.stock <= 4 ? "low" : "ok";
  const stockText = product.stock === 0 ? "Currently sold out" : product.stock <= 4 ? `Only ${product.stock} left` : "In stock";

  root.innerHTML = `
    <div class="breadcrumb">
      <a href="${product.category}.html">${labelize(product.category)}</a> /
      <a href="${product.category}.html?sub=${product.subcategory}">${labelize(product.subcategory)}</a> /
      ${product.name}
    </div>
    <div class="product-detail">
      <div>
        <div class="pd-gallery-main" id="pd-gallery-main">
          ${images[0] ? `<img src="${images[0]}" alt="${product.name}">` : placeholderArt(product.name.length)}
        </div>
        ${images.length > 1 ? `<div class="pd-thumbs">
          ${images.map((img, i) => `<button class="pd-thumb${i === 0 ? " is-active" : ""}" data-i="${i}">
            ${img ? `<img src="${img}" alt="">` : placeholderArt(i)}
          </button>`).join("")}
        </div>` : ""}
      </div>
      <div>
        <span class="eyebrow">${labelize(product.subcategory)}</span>
        <h1 style="font-size:2rem;margin-top:6px;">${product.name}</h1>
        <div class="pd-price">
          ${onSale ? `<span class="was">${money(product.price)}</span>` : ""}
          <span>${money(onSale ? product.salePrice : product.price)}</span>
        </div>
        <div class="pd-stock ${stockClass}">${stockText}</div>
        <div class="pd-actions">
          <div class="qty-stepper">
            <button type="button" id="qty-minus" aria-label="Decrease quantity">–</button>
            <input type="text" id="qty-input" value="1" inputmode="numeric" aria-label="Quantity">
            <button type="button" id="qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <button class="btn btn-primary" id="pd-add-btn" ${product.stock === 0 ? "disabled" : ""}>
            ${product.stock === 0 ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
        <p class="pd-desc">${product.description || ""}</p>
      </div>
    </div>`;

  // Thumbnail switching
  root.querySelectorAll(".pd-thumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll(".pd-thumb").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const i = Number(btn.dataset.i);
      document.getElementById("pd-gallery-main").innerHTML =
        images[i] ? `<img src="${images[i]}" alt="${product.name}">` : placeholderArt(i);
    });
  });

  // Quantity stepper
  const qtyInput = document.getElementById("qty-input");
  document.getElementById("qty-minus").addEventListener("click", () => {
    qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    qtyInput.value = Math.min(product.stock || 99, Number(qtyInput.value) + 1);
  });

  const addBtn = document.getElementById("pd-add-btn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      addToCart(product.id, Number(qtyInput.value) || 1);
      addBtn.textContent = "Added ✓";
      setTimeout(() => (addBtn.textContent = "Add to Cart"), 1300);
    });
  }
}

/* ------------------------------------------------------------
   Cart page renderer
   ------------------------------------------------------------ */
async function initCartPage() {
  const lines = await getCartDetailed();
  const container = document.getElementById("cart-lines");
  const summary = document.getElementById("cart-summary-body");
  const emptyMsg = document.getElementById("cart-empty");
  const cartLayout = document.getElementById("cart-layout");

  if (!lines.length) {
    cartLayout.style.display = "none";
    emptyMsg.style.display = "block";
    return;
  }
  cartLayout.style.display = "grid";
  emptyMsg.style.display = "none";

  container.innerHTML = lines
    .map(
      (line) => `
    <div class="cart-line" data-id="${line.id}">
      <div class="cart-line-media">${productMedia(line.product)}</div>
      <div>
        <a href="product.html?id=${line.id}" class="cart-line-name">${line.product.name}</a>
        <div class="cart-line-sub">${labelize(line.product.subcategory)}</div>
        <div class="qty-stepper" style="margin-top:8px;">
          <button type="button" class="line-minus" aria-label="Decrease quantity">–</button>
          <input type="text" class="line-qty" value="${line.qty}" inputmode="numeric" aria-label="Quantity">
          <button type="button" class="line-plus" aria-label="Increase quantity">+</button>
        </div>
        <a href="#" class="cart-line-remove">Remove</a>
      </div>
      <div class="cart-line-price">${money(line.lineTotal)}</div>
    </div>`
    )
    .join("");

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  summary.innerHTML = `
    <div class="summary-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    <div class="summary-row"><span>Tax</span><span>Calculated at checkout</span></div>
    <div class="summary-row"><span>Credit Card Fee</span><span>2.9% + $0.30</span></div>
    <div class="summary-row"><span>Shipping</span><span>Calculated at checkout</span></div>
    <div class="summary-row total"><span>Total</span><span>${money(subtotal)}</span></div>`;

  container.querySelectorAll(".cart-line").forEach((el) => {
    const id = el.dataset.id;
    const input = el.querySelector(".line-qty");
    el.querySelector(".line-minus").addEventListener("click", () => {
      updateCartQty(id, Math.max(0, Number(input.value) - 1));
      initCartPage();
    });
    el.querySelector(".line-plus").addEventListener("click", () => {
      updateCartQty(id, Number(input.value) + 1);
      initCartPage();
    });
    input.addEventListener("change", () => {
      updateCartQty(id, Math.max(0, Number(input.value) || 0));
      initCartPage();
    });
    el.querySelector(".cart-line-remove").addEventListener("click", (e) => {
      e.preventDefault();
      removeFromCart(id);
      initCartPage();
    });
  });
}
