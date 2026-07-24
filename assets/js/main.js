/* ============================================================
   MAIN.JS
   Homepage-only behavior: the auto-scrolling hero photo carousel
   with manual left/right arrow navigation and dot indicators.

   TO USE YOUR OWN PHOTOS: drop image files into
   assets/images/hero/ and list them in HERO_SLIDES below
   (replace the placeholder "art" slides). Each slide can have
   its own eyebrow/heading/text if you'd like different captions.
   ============================================================ */

const HERO_SLIDES = [
  {
    // image: "assets/images/hero/photo1.jpg",   // <- uncomment & set once you have real photos
    art: 210,
    eyebrow: "Orcas Island, Washington",
    heading: "Orcas Wildflower",
    text: "Clothing, jewelry, and accessories gathered with a natural, island-grown touch.",
    ctaLabel: "Shop All",
    ctaHref: "shop-all.html",
  },
  {
    art: 340,
    eyebrow: "New This Season",
    heading: "Fresh Arrivals",
    text: "Hand-picked pieces just in — from fine jewelry to cozy hoodies.",
    ctaLabel: "Shop New Arrivals",
    ctaHref: "new-arrivals.html",
  },
  {
    art: 20,
    eyebrow: "Made & Chosen With Care",
    heading: "Little Everyday Treasures",
    text: "Keychains, hair clips, and gifts as easygoing as island life.",
    ctaLabel: "Shop Accessories",
    ctaHref: "accessories.html",
  },
  {
    art: 130,
    eyebrow: "Shop The Sale",
    heading: "Season-End Finds",
    text: "A rotating edit of favorites at a friendlier price.",
    ctaLabel: "Shop Sale",
    ctaHref: "sale.html",
  },
];

let heroIndex = 0;
let heroTimer = null;

function heroSlideHTML(slide, i) {
  const bg = slide.image
    ? `<img src="${slide.image}" alt="${slide.heading}">`
    : `<div class="hero-art" style="background:
        radial-gradient(circle at 30% 20%, hsl(${slide.art},34%,30%), hsl(${(slide.art + 40) % 360},38%,14%) 70%);"></div>`;
  return `
  <div class="hero-slide${i === 0 ? " is-active" : ""}" data-i="${i}">
    ${bg}
    <div class="hero-caption">
      <span class="eyebrow">${slide.eyebrow}</span>
      <h1${i === 0 ? ' class="brand-script"' : ''}>${slide.heading}</h1>
      <p>${slide.text}</p>
      <a href="${slide.ctaHref}" class="btn btn-accent">${slide.ctaLabel}</a>
    </div>
  </div>`;
}

function goToHeroSlide(i) {
  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-dot");
  heroIndex = (i + slides.length) % slides.length;
  slides.forEach((s, idx) => s.classList.toggle("is-active", idx === heroIndex));
  dots.forEach((d, idx) => d.classList.toggle("is-active", idx === heroIndex));
}

function startHeroAutoplay() {
  stopHeroAutoplay();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  heroTimer = setInterval(() => goToHeroSlide(heroIndex + 1), 5500);
}
function stopHeroAutoplay() {
  if (heroTimer) clearInterval(heroTimer);
}

function initHero() {
  const track = document.getElementById("hero-track");
  const dotsWrap = document.getElementById("hero-dots");
  if (!track) return;

  track.innerHTML = HERO_SLIDES.map(heroSlideHTML).join("");
  dotsWrap.innerHTML = HERO_SLIDES.map((_, i) => `<button class="hero-dot${i === 0 ? " is-active" : ""}" data-i="${i}" aria-label="Go to slide ${i + 1}"></button>`).join("");

  document.getElementById("hero-prev").addEventListener("click", () => {
    goToHeroSlide(heroIndex - 1);
    startHeroAutoplay();
  });
  document.getElementById("hero-next").addEventListener("click", () => {
    goToHeroSlide(heroIndex + 1);
    startHeroAutoplay();
  });
  dotsWrap.querySelectorAll(".hero-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      goToHeroSlide(Number(dot.dataset.i));
      startHeroAutoplay();
    });
  });

  const hero = document.querySelector(".hero");
  hero.addEventListener("mouseenter", stopHeroAutoplay);
  hero.addEventListener("mouseleave", startHeroAutoplay);

  startHeroAutoplay();
}

/* Homepage "shop by category" tiles + featured products */
async function initHomeSections() {
  const products = await loadProducts();

  const featured = products.filter((p) => p.tags?.includes("popular")).slice(0, 4);
  const featuredGrid = document.getElementById("featured-grid");
  if (featuredGrid) renderProductGrid(featuredGrid, featured);
}
