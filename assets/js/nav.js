/* ============================================================
   NAV.JS
   Builds the header + footer once here, and injects them into
   every page. Edit the nav ONCE in this file and every page on
   the site updates — no need to copy/paste header HTML around.
   ============================================================ */

/* ---- Signature wildflower sprig mark (used as logo + divider) --- */
const SPRIG_SVG = `
<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 36V15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M20 15C20 15 11 13 9 6C9 6 18 5 20 15Z" fill="currentColor" opacity="0.9"/>
  <path d="M20 15C20 15 29 13 31 6C31 6 22 5 20 15Z" fill="currentColor" opacity="0.7"/>
  <circle cx="20" cy="10" r="3.4" fill="currentColor"/>
  <path d="M20 26C20 26 13 25 12 20C12 20 18 19 20 26Z" fill="currentColor" opacity="0.55"/>
  <path d="M20 26C20 26 27 25 28 20C28 20 22 19 20 26Z" fill="currentColor" opacity="0.4"/>
</svg>`;

/* ---- Nav data model ---------------------------------------------
   This single object drives BOTH the desktop mega-menus and the
   mobile drawer. Add/rename a link here and it updates everywhere. */
const NAV = [
  { label: "Location & Contact", href: "location-contact.html" },
  { label: "New Arrivals", href: "new-arrivals.html" },
  { label: "Popular Products", href: "popular-products.html" },
  {
    label: "Clothing", href: "clothing.html",
    children: [
      { label: "Shop All", href: "clothing.html" },
      { label: "Tank Tops", href: "clothing.html?sub=tank-tops" },
      { label: "T-Shirts", href: "clothing.html?sub=t-shirts" },
      { label: "Crew Necks", href: "clothing.html?sub=crew-necks" },
      { label: "Hoodies", href: "clothing.html?sub=hoodies" },
    ],
  },
  {
    label: "Jewelry", href: "jewelry.html",
    children: [
      { label: "Shop All", href: "jewelry.html" },
      { label: "Fine Jewelry", href: "jewelry.html?sub=fine-jewelry" },
      { label: "Earrings", href: "jewelry.html?sub=earrings" },
      { label: "Necklaces", href: "jewelry.html?sub=necklaces" },
      { label: "Bracelets", href: "jewelry.html?sub=bracelets" },
      { label: "Rings", href: "jewelry.html?sub=rings" },
    ],
  },
  {
    label: "Accessories", href: "accessories.html",
    children: [
      { label: "Shop All", href: "accessories.html" },
      { label: "Keychains", href: "accessories.html?sub=keychains" },
      { label: "Bookmarks", href: "accessories.html?sub=bookmarks" },
      { label: "Hair Clips", href: "accessories.html?sub=hair-clips" },
      { label: "Hats", href: "accessories.html?sub=hats" },
      { label: "Bags", href: "accessories.html?sub=bags" },
    ],
  },
  { label: "Sale", href: "sale.html" },
];

function buildMegaMenu(children) {
  return `<div class="mega-menu">
    ${children.map((c, i) => `<a href="${c.href}" class="${i === 0 ? 'shop-all' : ''}">${c.label}</a>`).join("")}
  </div>`;
}

function buildNavHTML(currentPage) {
  return `<ul>
    ${NAV.map(item => {
      const isCurrent = currentPage === item.href.split("?")[0];
      const hasChildren = !!item.children;
      return `<li${hasChildren ? ' class="has-children"' : ''}>
        <a class="nav-link${isCurrent ? ' is-current' : ''}" href="${item.href}">
          ${item.label}
          ${hasChildren ? '<svg class="caret" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' : ''}
        </a>
        ${hasChildren ? buildMegaMenu(item.children) : ''}
      </li>`;
    }).join("")}
  </ul>`;
}

function headerHTML(currentPage) {
  return `
  <div class="header-inner">
    <a href="index.html" class="brand" aria-label="Orcas Wildflower home">
      <span style="color:var(--kelp)">${SPRIG_SVG}</span>
      <span class="brand-word">Orcas Wildflower<small>Eastsound &middot; Orcas Island</small></span>
    </a>

    <nav class="main-nav" id="main-nav">
      ${buildNavHTML(currentPage)}
    </nav>

    <div class="header-actions">
      <button class="menu-toggle" id="menu-toggle" aria-label="Open menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <a href="cart.html" class="icon-btn" aria-label="Shopping cart">
        <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h2l1.4 10.2a2 2 0 0 0 2 1.8h7.6a2 2 0 0 0 2-1.6L21 9H7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="21" r="1.4" fill="currentColor"/><circle cx="18" cy="21" r="1.4" fill="currentColor"/></svg>
        <span class="cart-badge" id="cart-badge">0</span>
      </a>
    </div>
  </div>`;
}

function footerHTML() {
  return `
  <div class="container">
    <div class="sprig-divider" style="padding-top:0;">
      <span class="line"></span><span style="color:var(--driftwood)">${SPRIG_SVG}</span><span class="line"></span>
    </div>
    <div class="footer-grid" style="margin-top:36px;">
      <div class="footer-col footer-brand">
        <div class="brand">
          <span style="color:var(--kelp)">${SPRIG_SVG}</span>
          <span class="brand-word">Orcas Wildflower</span>
        </div>
        <p>Clothing, jewelry &amp; accessories made and gathered with an island-grown, wildflower-natural touch.</p>
        <div class="social-icons" style="margin-top:16px;">
          <a href="https://www.instagram.com/orcas_wildflower/" target="_blank" rel="noopener" aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.7"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor"/></svg>
          </a>
          <a href="https://www.facebook.com/profile.php?id=61559796787558" target="_blank" rel="noopener" aria-label="Facebook">
            <svg viewBox="0 0 24 24" fill="none"><path d="M14 8.5h2.5V5.2h-2.5c-2 0-3.6 1.6-3.6 3.6v1.9H8.5v3.2h1.9V19h3.2v-5.1h2.3l.4-3.2h-2.7V9c0-.4.3-.5.4-.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
          </a>
          <a href="mailto:orcaswildflower@outlook.com" aria-label="Email">
            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" stroke-width="1.7"/><path d="M4 6.5l8 6.2 8-6.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          </a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Shop</h4>
        <a href="clothing.html">Clothing</a>
        <a href="jewelry.html">Jewelry</a>
        <a href="accessories.html">Accessories</a>
        <a href="sale.html">Sale</a>
      </div>
      <div class="footer-col">
        <h4>Shop Info</h4>
        <a href="location-contact.html">Location &amp; Contact</a>
        <a href="new-arrivals.html">New Arrivals</a>
        <a href="popular-products.html">Popular Products</a>
        <a href="cart.html">Your Cart</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span id="footer-year"></span> Orcas Wildflower &middot; Orcas Island, WA</span>
      <span>orcaswildflower@outlook.com</span>
    </div>
  </div>`;
}

function initHeaderBehavior() {
  const header = document.getElementById("site-header");
  const mainNav = document.getElementById("main-nav");
  const toggle = document.getElementById("menu-toggle");

  // Solid header once page scrolls
  const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile drawer open/close
  toggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-mobile-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.innerHTML = isOpen
      ? '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  });

  // In mobile drawer mode, tapping a parent label with children expands
  // its submenu instead of navigating away immediately.
  mainNav.querySelectorAll("li.has-children > a.nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (window.innerWidth <= 760) {
        e.preventDefault();
        link.parentElement.classList.toggle("is-expanded");
      }
    });
  });

  // Close drawer on resize back to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      mainNav.classList.remove("is-mobile-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

/**
 * Call this at the top of every page's inline script:
 *   injectChrome("index.html");
 * Pass the current page's own filename so the matching nav
 * link can be highlighted.
 */
function injectChrome(currentPage) {
  document.getElementById("site-header").innerHTML = headerHTML(currentPage);
  document.getElementById("site-footer").innerHTML = footerHTML();
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  initHeaderBehavior();
  if (window.updateCartBadge) window.updateCartBadge();
}

/* Simple scroll-reveal for elements with class "reveal" */
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || items.length === 0) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach((el) => io.observe(el));
}
