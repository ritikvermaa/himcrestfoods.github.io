// =====================================================
// APP.JS – Main Orchestrator
// HimCrest Foods – Production
// =====================================================

// ── PAGE NAVIGATION ────────────────────────────────────
const PAGE_MAP = {
  home:         "homePage",
  shop:         "shopPage",
  product:      "productPage",
  cart:         "cartPage",
  checkout:     "checkoutPage",
  wishlist:     "wishlistPage",
  auth:         "authPage",
  account:      "accountPage",
  orderSuccess: "orderSuccessPage",
  admin:        "adminPage",
};

function showPage(pageName) {
  Object.values(PAGE_MAP).forEach(id => {
    document.getElementById(id)?.classList.remove("active");
  });

  const targetId = PAGE_MAP[pageName];
  if (targetId) document.getElementById(targetId)?.classList.add("active");

  switch (pageName) {
    case "cart":         renderCartPage();       break;
    case "checkout":
      if (!currentUser) { showToast("Please login to checkout.", "warning"); showPage("auth"); return; }
      setupCheckoutPage();
      break;
    case "wishlist":     renderWishlistPage();   break;
    case "account":
      if (!currentUser) { showPage("auth"); return; }
      updateAccountPage();
      break;
    case "admin":
      if (!isAdmin) { showToast("Admin access required.", "error"); showPage("auth"); return; }
      switchAdminTab("dashboard", document.querySelector(".admin-nav li"));
      break;
    case "auth":
      switchAuthForm("login");
      break;
  }

  updateMobileBottomNav(pageName);
  scrollToTop();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── MOBILE BOTTOM NAV ──────────────────────────────────
function updateMobileBottomNav(pageName) {
  document.querySelectorAll(".mob-nav-item").forEach(el => el.classList.remove("active"));
  const map = { home:"mobHome", shop:"mobShop", wishlist:"mobWishlist", account:"mobAccount" };
  const activeId = map[pageName];
  if (activeId) document.getElementById(activeId)?.classList.add("active");
}

// ── HERO SLIDER ────────────────────────────────────────
let currentSlide   = 0;
let sliderInterval = null;
const SLIDE_DURATION = 5000;

function initHeroSlider() {
  const track = document.getElementById("heroTrack");
  if (!track) return;

  const slides = track.querySelectorAll(".hero-slide");
  const total  = slides.length;
  if (!total) return;

  const dotsContainer = document.getElementById("heroDots");
  if (dotsContainer) {
    dotsContainer.innerHTML = Array.from({ length: total }, (_, i) =>
      `<button class="hero-dot ${i === 0 ? "active" : ""}" onclick="goToSlide(${i})" aria-label="Slide ${i + 1}"></button>`
    ).join("");
  }

  document.getElementById("heroPrev")?.addEventListener("click", () => {
    goToSlide((currentSlide - 1 + total) % total);
  });
  document.getElementById("heroNext")?.addEventListener("click", () => {
    goToSlide((currentSlide + 1) % total);
  });

  let touchStartX = 0;
  track.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
  track.addEventListener("touchend",   e => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) goToSlide(diff > 0 ? (currentSlide + 1) % total : (currentSlide - 1 + total) % total);
  });

  startSliderAutoplay(total);
  track.addEventListener("mouseenter", () => clearInterval(sliderInterval));
  track.addEventListener("mouseleave", () => startSliderAutoplay(total));
}

function goToSlide(index) {
  const track = document.getElementById("heroTrack");
  if (!track) return;
  const slides = track.querySelectorAll(".hero-slide");
  const dots   = document.querySelectorAll(".hero-dot");

  currentSlide = index;
  track.style.transform = `translateX(-${index * 100}%)`;
  dots.forEach((d, i)   => d.classList.toggle("active", i === index));
  slides.forEach((s, i) => s.classList.toggle("active", i === index));
}

function startSliderAutoplay(total) {
  clearInterval(sliderInterval);
  sliderInterval = setInterval(() => goToSlide((currentSlide + 1) % total), SLIDE_DURATION);
}

// ── NAVBAR ─────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  }, { passive: true });
}

// ── HAMBURGER MENU ─────────────────────────────────────
function initMobileMenu() {
  const hamburger = document.getElementById("hamburger");
  const menuClose = document.getElementById("menuClose");
  const overlay   = document.getElementById("menuOverlay");
  const menu      = document.getElementById("mobileMenu");

  const openMenu  = () => { menu?.classList.add("open"); overlay?.classList.add("open"); document.body.style.overflow = "hidden"; };
  const closeMenu = () => { menu?.classList.remove("open"); overlay?.classList.remove("open"); document.body.style.overflow = ""; };

  hamburger?.addEventListener("click", openMenu);
  menuClose?.addEventListener("click", closeMenu);
  overlay?.addEventListener("click",   closeMenu);

  menu?.querySelectorAll("a[data-cat]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const cat = link.dataset.cat;
      closeMenu();
      if (cat === "home") showPage("home");
      else filterCategory(cat);
    });
  });

  menu?.querySelectorAll("a[data-section]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      closeMenu();
      showPage("home");
      setTimeout(() => scrollToSection(link.dataset.section), 300);
    });
  });

  document.getElementById("mobileLoginBtn")?.addEventListener("click", e => {
    e.preventDefault();
    closeMenu();
    showPage("auth");
  });
}

// ── USER DROPDOWN ─────────────────────────────────────
function initUserDropdown() {
  const trigger = document.getElementById("userMenuTrigger");
  trigger?.addEventListener("click", e => {
    e.stopPropagation();
    if (currentUser) toggleUserDropdown();
    else showPage("auth");
  });

  document.addEventListener("click", e => {
    if (!e.target.closest("#userDropdown") && !e.target.closest("#userMenuTrigger")) {
      closeUserDropdown();
    }
  });
}

// ── CART OVERLAY ───────────────────────────────────────
function initCartOverlay() {
  document.getElementById("cartOverlay")?.addEventListener("click", closeCartDrawer);
  document.getElementById("cartNavBtn")?.addEventListener("click", e => {
    e.preventDefault();
    openCartDrawer();
  });
  document.getElementById("wishlistNavBtn")?.addEventListener("click", e => {
    e.preventDefault();
    showPage("wishlist");
  });
}

// ── CATEGORY NAV ──────────────────────────────────────
function initCatNav() {
  document.querySelectorAll(".cat-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      filterCategory(link.dataset.cat || "all");
    });
  });
}

// ── SHOP SIDEBAR FILTERS ───────────────────────────────
function initShopFilters() {
  document.querySelectorAll("input[name='catFilter']").forEach(radio => {
    radio.addEventListener("change", () => {
      currentFilter = radio.value;
      const labels  = { all:"All Products","fruit-snacks":"Fruit Snacks","veggie-snacks":"Veggie Snacks",powders:"Powders & Mixes",combo:"Combo Packs",bestsellers:"Bestsellers","new-arrivals":"New Arrivals",offers:"Offers 🔥" };
      const titleEl = document.getElementById("shopPageTitle");
      if (titleEl) titleEl.textContent = labels[radio.value] || "All Products";
      renderShopGrid();
      // Auto-close sidebar drawer on mobile after selecting filter
      if (window.innerWidth < 900) closeShopSidebar();
    });
  });

  document.getElementById("filterToggleBtn")?.addEventListener("click", () => {
    const sidebar = document.getElementById("shopSidebar");
    if (!sidebar) return;
    if (sidebar.classList.contains("mobile-open")) {
      closeShopSidebar();
    } else {
      openShopSidebar();
    }
  });
}

function openShopSidebar() {
  const sidebar = document.getElementById("shopSidebar");
  let overlay   = document.getElementById("shopSidebarOverlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "shopSidebarOverlay";
    overlay.className = "shop-sidebar-overlay";
    overlay.addEventListener("click", closeShopSidebar);
    document.body.appendChild(overlay);
  }

  sidebar?.classList.add("mobile-open");
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeShopSidebar() {
  const sidebar = document.getElementById("shopSidebar");
  const overlay = document.getElementById("shopSidebarOverlay");
  sidebar?.classList.remove("mobile-open");
  overlay?.classList.remove("open");
  document.body.style.overflow = "";
}

// ── FAQ SECTION ─────────────────────────────────────────
function renderFAQSection() {
  const container = document.getElementById("faqList");
  if (!container) return;

  const faqs = (typeof adminFAQs !== "undefined" && adminFAQs.length)
    ? adminFAQs
    : [
      { q:"Are your products 100% natural?",          a:"Yes! Every HimCrest Foods product contains only dehydrated fruits or vegetables. No artificial colours, flavours, or preservatives." },
      { q:"What is the shelf life of your products?", a:"Our products have a shelf life of 8–18 months when stored in a cool, dry place in the original sealed packaging." },
      { q:"Are these suitable for kids?",             a:"Absolutely! Our fruit snacks are a perfect healthy alternative for children. No added sugar, no preservatives." },
      { q:"Do you offer bulk or wholesale orders?",   a:"Yes! Contact us at hello@himcrestfoods.in for bulk pricing, corporate gifting, and wholesale enquiries." },
      { q:"How should I store powders once opened?",  a:"Always use a dry spoon and reseal tightly. Store in a cool, dark place. Avoid moisture at all times." },
      { q:"What payment methods do you accept?",      a:"We accept UPI, Credit/Debit Cards, Net Banking, Wallets, and Cash on Delivery (COD) across India." },
    ];

  container.innerHTML = faqs.map((faq, i) => `
    <div class="faq-item" id="faqItem${i}">
      <button class="faq-question" onclick="toggleFAQ(${i})">
        <span>${faq.q}</span>
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-answer"><p>${faq.a}</p></div>
    </div>`).join("");
}

function toggleFAQ(index) {
  const item = document.getElementById(`faqItem${index}`);
  if (!item) return;
  const isOpen = item.classList.contains("open");

  document.querySelectorAll(".faq-item").forEach(el => {
    el.classList.remove("open");
    const icon = el.querySelector(".faq-icon");
    if (icon) icon.textContent = "+";
  });

  if (!isOpen) {
    item.classList.add("open");
    const icon = item.querySelector(".faq-icon");
    if (icon) icon.textContent = "−";
  }
}

// ── TESTIMONIALS ───────────────────────────────────────
async function renderTestimonials() {
  const container = document.getElementById("homeReviewsGrid");
  if (!container) return;

  let testimonials = (typeof adminTestimonials !== "undefined" && adminTestimonials.length)
    ? adminTestimonials.filter(t => t.approved !== false)
    : [];

  if (!testimonials.length && !DEMO_MODE && db) {
    try {
      const fromDB = await getCollection("testimonials", [{ field:"approved", op:"==", value:true }]);
      if (fromDB.length) testimonials = fromDB;
    } catch { }
  }

  if (!testimonials.length) {
    testimonials = [
      { name:"Priya Sharma",  city:"Delhi",     text:"I've been hooked on the apple chips! My evening tea just isn't complete without them.", rating:5 },
      { name:"Karan Mehta",   city:"Mumbai",    text:"The onion-garlic mix saves me 15 minutes every single day. Game-changing product.", rating:5 },
      { name:"Ananya Rao",    city:"Bengaluru", text:"Ordered the Discovery Box as a Diwali gift — it was a massive hit!", rating:5 },
      { name:"Rohit Verma",   city:"Pune",      text:"The spinach powder is absolutely brilliant. I add it to my morning smoothie.", rating:5 },
    ];
  }

  container.innerHTML = testimonials.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-stars">${"★".repeat(t.rating || 5)}</div>
      <p class="testimonial-text">"${t.text}"</p>
      <div class="testimonial-author">
        <div class="reviewer-avatar">${(t.name || "U").charAt(0)}</div>
        <div>
          <strong>${t.name}</strong>
          <p>${t.city}</p>
        </div>
      </div>
    </div>`).join("");
}

// ── NEWSLETTER ─────────────────────────────────────────
async function subscribeNewsletter(event) {
  event.preventDefault();
  const form       = event.target;
  const emailInput = form.querySelector("input[type='email']");
  const email      = emailInput?.value.trim();

  if (!email || !email.includes("@")) { showToast("Please enter a valid email.", "error"); return; }

  const btn = form.querySelector("button[type='submit']");
  if (btn) { btn.disabled = true; btn.textContent = "Subscribing…"; }

  if (!DEMO_MODE && db) {
    try { await addDocument("newsletter", { email, subscribedAt: new Date().toISOString() }); }
    catch { /* silent */ }
  }

  if (emailInput) emailInput.value = "";
  if (btn)        { btn.disabled = false; btn.textContent = "Subscribe"; }
  showToast("Thanks for subscribing! 🌿 Watch your inbox for exclusive offers.", "success");
}

// ── CONTACT FORM ────────────────────────────────────────
async function submitContact(event) {
  event.preventDefault();
  const form = event.target;

  const data = {
    name:      form.name?.value.trim()    || "",
    email:     form.email?.value.trim()   || "",
    phone:     form.phone?.value.trim()   || "",
    subject:   form.subject?.value        || "",
    message:   form.message?.value.trim() || "",
    createdAt: new Date().toISOString(),
    resolved:  false,
  };

  if (!data.name || !data.email || !data.message) {
    showToast("Please fill in all required fields.", "error"); return;
  }

  const btn = form.querySelector("button[type='submit']");
  if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

  if (!DEMO_MODE && db) {
    try { await addDocument("contactMessages", data); }
    catch { console.warn("Could not save contact message."); }
  }

  form.reset();
  if (btn) { btn.disabled = false; btn.textContent = "Send Message"; }
  showToast("Message sent! We'll get back to you within 24 hours. 📧", "success");
}

// ── TOAST ──────────────────────────────────────────────
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) { console.log(`[${type}] ${message}`); return; }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const icons = { success:"✅", error:"❌", warning:"⚠️", info:"ℹ️" };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || ""}</span><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ── SCROLL ANIMATIONS ──────────────────────────────────
function initScrollAnimations() {
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".section, .product-card, .cat-card, .trust-item").forEach(el => {
    el.classList.add("fade-up");
    observer.observe(el);
  });
}

// ── PAYMENT OPTIONS ────────────────────────────────────
function selectPayment(method) {
  selectedPaymentMethod = method;
  document.querySelectorAll(".payment-option").forEach(el => {
    el.classList.toggle("selected", el.dataset.method === method);
    const radio = el.querySelector("input[type='radio']");
    if (radio) radio.checked = radio.value === method;
  });
}

function initPaymentOptions() {
  // Defer to checkout.js initPaymentOptions when on checkout page
  setTimeout(() => {
    if (selectedPaymentMethod) return;
    selectPayment("cod");
  }, 200);
}

// ── PROMO BAR ──────────────────────────────────────────
function initPromoBar() {
  const promoBar = document.getElementById("promoBar");
  if (!promoBar) return;

  if (localStorage.getItem("hc_promo_dismissed")) {
    promoBar.style.display = "none";
    return;
  }

  document.querySelector(".promo-close")?.addEventListener("click", () => {
    localStorage.setItem("hc_promo_dismissed", "1");
    promoBar.style.display = "none";
  });
}

// ── SITE SETTINGS LOADER ───────────────────────────────
async function loadSiteSettings() {
  if (DEMO_MODE || !db) return;
  try {
    const settings = await getDocument("siteSettings", "main");
    if (!settings) return;

    // Shipping
    if (settings.freeShippingAbove) shippingSettings.freeAbove = settings.freeShippingAbove;
    if (settings.shippingCharge)    shippingSettings.charge    = settings.shippingCharge;

    // Razorpay key cache
    if (settings.razorpayKey) localStorage.setItem("hc_rzp_key", settings.razorpayKey);

    // Announcement bar
    if (settings.announcementBar) {
      const track = document.querySelector("#promoBar .promo-track");
      if (track) track.innerHTML = `<span>${settings.announcementBar}</span>`;
    }

    // Dynamic brand name in page title
    if (settings.siteName) {
      const brandEls = document.querySelectorAll(".logo-brand, .auth-brand-name, .footer-brand-name");
      brandEls.forEach(el => el.textContent = settings.siteName);
    }

    // Dynamic tagline
    if (settings.tagline) {
      const taglineEls = document.querySelectorAll(".logo-tagline");
      taglineEls.forEach(el => el.textContent = settings.tagline);
    }

    // Footer text
    if (settings.footerText) {
      const footerCopy = document.getElementById("footerCopyText");
      if (footerCopy) footerCopy.textContent = settings.footerText;
    }

    // Support email links
    if (settings.supportEmail) {
      document.querySelectorAll(".support-email-link").forEach(el => {
        el.href    = `mailto:${settings.supportEmail}`;
        el.textContent = settings.supportEmail;
      });
    }

    // WhatsApp
    if (settings.whatsapp) {
      document.querySelectorAll(".whatsapp-link").forEach(el => {
        el.href = `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`;
      });
    }

    // Social links
    if (settings.instagramUrl) {
      document.querySelectorAll(".social-instagram").forEach(el => { el.href = settings.instagramUrl; });
    }
    if (settings.facebookUrl) {
      document.querySelectorAll(".social-facebook").forEach(el => { el.href = settings.facebookUrl; });
    }

    // About us content
    if (settings.aboutUsContent) {
      const aboutEl = document.getElementById("aboutUsContent");
      if (aboutEl) aboutEl.innerHTML = settings.aboutUsContent;
    }

    // Maintenance mode
    if (settings.maintenanceMode) {
      document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:32px">
          <div style="font-size:4rem;margin-bottom:16px">🔧</div>
          <h1 style="font-size:1.8rem;margin-bottom:12px">We'll be back soon!</h1>
          <p style="color:#666;max-width:400px">HimCrest Foods is currently undergoing scheduled maintenance. Please check back in a little while.</p>
        </div>`;
    }

  } catch { /* use defaults */ }
}

// ── WISHLIST FIRESTORE SYNC ────────────────────────────
async function syncWishlistFromFirestore() {
  if (DEMO_MODE || !db || !currentUser?.uid) return;
  try {
    const doc = await getDocument("users", currentUser.uid);
    if (doc?.wishlist && Array.isArray(doc.wishlist)) {
      doc.wishlist.forEach(id => { if (!wishlist.includes(id)) wishlist.push(id); });
      saveWishlist();
      updateWishlistCount();
      renderWishlistPage();
    }
  } catch { /* use local */ }
}

// ── MAIN INIT ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌿 HimCrest Foods – Initialising…");

  // 1. Auth listener
  initAuth();

  // 2. Load products
  loadProducts();

  // 3. Load site settings (shipping, Razorpay, social links, etc.)
  loadSiteSettings();

  // 4. UI inits
  initNavbar();
  initHeroSlider();
  initMobileMenu();
  initUserDropdown();
  initCartOverlay();
  initCatNav();
  initShopFilters();
  initSearch();
  initScrollAnimations();
  initPromoBar();

  // 5. Render static sections
  renderFAQSection();
  renderTestimonials();

  // 6. Restore cart & wishlist badges
  updateCartUI();
  updateWishlistCount();

  // 7. Show home
  showPage("home");

  console.log("✅ HimCrest Foods – Ready!");
});
