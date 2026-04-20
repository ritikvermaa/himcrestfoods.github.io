// =====================================================
// PRODUCTS.JS – Product Data, Rendering, Filtering,
//               Search, Quick View, Product Detail,
//               Weight Variant Selection
// HimCrest Foods – Production
// =====================================================

// ── DEMO PRODUCT DATA ─────────────────────────────────
// Used as fallback when Firestore is empty.
const DEMO_PRODUCTS = [
  {
    id:"p1", name:"Apple Chips – Cinnamon Delight", subtitle:"Crispy · Sweet · 100% Natural",
    category:"fruit-snacks", price:199, mrp:249, stock:80, weight:"100g",
    variants:[
      {weight:"50g",  price:119, mrp:149, stock:40},
      {weight:"100g", price:199, mrp:249, stock:80},
      {weight:"200g", price:369, mrp:449, stock:30},
    ],
    rating:4.8, reviews:124, image:"", emoji:"🍎",
    bestseller:true, newArrival:false, offer:true, outOfStock:false,
    description:"Thinly sliced Himalayan apples, slow-dehydrated to crispy perfection with a hint of Ceylon cinnamon. Zero added sugar, zero preservatives — just pure apple goodness.",
    ingredients:"Dehydrated apple (99.5%), cinnamon (0.5%)",
    benefits:"Rich in dietary fibre · Vitamin C source · Natural antioxidants · Low calorie snacking",
    howTo:"Enjoy straight from the pack as a snack. Crush over oatmeal, yoghurt or salads. Rehydrate in warm water for baking.",
    nutrition:{"Calories":"320 kcal","Protein":"1.5g","Carbs":"76g","Fat":"0.8g","Fibre":"8g","Sugar":"52g (natural)"},
    shelfLife:"12 months from manufacture", storage:"Store in a cool, dry place. Reseal after opening.",
    deliveryNote:"Ships within 1–2 business days."
  },
  {
    id:"p2", name:"Alphonso Mango Slices", subtitle:"Tangy · Chewy · Tropical",
    category:"fruit-snacks", price:249, mrp:299, stock:60, weight:"100g",
    variants:[
      {weight:"100g", price:249, mrp:299, stock:60},
      {weight:"200g", price:469, mrp:569, stock:25},
      {weight:"500g", price:1099, mrp:1349, stock:10},
    ],
    rating:4.9, reviews:218, image:"", emoji:"🥭",
    bestseller:true, newArrival:false, offer:false, outOfStock:false,
    description:"Sun-ripened Alphonso mangoes from the Konkan coast, gently dehydrated to retain maximum flavour and nutrients. The perfect travel snack.",
    ingredients:"Dehydrated Alphonso mango (100%)",
    benefits:"High in Vitamin A & C · Natural energy booster · Rich tropical flavour · Gluten free",
    howTo:"Eat as a snack, blend into smoothies, or mix into trail mix.",
    nutrition:{"Calories":"310 kcal","Protein":"2g","Carbs":"73g","Fat":"0.5g","Fibre":"5g","Sugar":"58g (natural)"},
    shelfLife:"12 months", storage:"Store away from sunlight in an airtight container."
  },
  {
    id:"p3", name:"Mixed Fruit Bites", subtitle:"Apple · Mango · Pineapple · Papaya",
    category:"fruit-snacks", price:229, mrp:279, stock:45, weight:"100g",
    variants:[{weight:"100g",price:229,mrp:279,stock:45},{weight:"200g",price:429,mrp:529,stock:20}],
    rating:4.7, reviews:89, image:"", emoji:"🍓",
    bestseller:false, newArrival:true, offer:true, outOfStock:false,
    description:"A festive mix of four dehydrated tropical fruits — each bite bursting with natural sweetness. Perfect for kids and adults alike.",
    ingredients:"Dehydrated apple, mango, pineapple, papaya",
    benefits:"Multi-vitamin · Digestive enzymes from papaya & pineapple · Kid-friendly snack",
    howTo:"Grab a handful as a snack. Add to muesli or granola. Great in lunchboxes.",
    nutrition:{"Calories":"305 kcal","Protein":"1.8g","Carbs":"72g","Fat":"0.6g","Fibre":"7g"},
    shelfLife:"10 months", storage:"Store in a cool, dry place."
  },
  {
    id:"p4", name:"Beetroot Chips – Sea Salt", subtitle:"Earthy · Crunchy · Iron-rich",
    category:"veggie-snacks", price:179, mrp:220, stock:70, weight:"80g",
    variants:[{weight:"80g",price:179,mrp:220,stock:70},{weight:"200g",price:389,mrp:480,stock:30}],
    rating:4.6, reviews:67, image:"", emoji:"🫀",
    bestseller:true, newArrival:false, offer:false, outOfStock:false,
    description:"Farm-fresh beetroots sliced thin and baked (not fried) with a touch of Himalayan pink salt.",
    ingredients:"Dehydrated beetroot (97%), Himalayan pink salt (3%)",
    benefits:"Iron & folate rich · Natural nitrates for stamina · Antioxidant powerhouse",
    howTo:"Eat straight as a crunchy snack. Use as a garnish on soups and salads.",
    nutrition:{"Calories":"285 kcal","Protein":"5g","Carbs":"58g","Fat":"1g","Fibre":"12g"},
    shelfLife:"12 months", storage:"Store in a cool, dry place. Keep away from moisture."
  },
  {
    id:"p5", name:"Kale & Spinach Crisps", subtitle:"Lightly Seasoned · Super Greens",
    category:"veggie-snacks", price:189, mrp:240, stock:35, weight:"60g",
    variants:[{weight:"60g",price:189,mrp:240,stock:35},{weight:"150g",price:419,mrp:519,stock:15}],
    rating:4.5, reviews:43, image:"", emoji:"🥬",
    bestseller:false, newArrival:true, offer:false, outOfStock:false,
    description:"A power-packed blend of kale and spinach leaves, slow-dehydrated and seasoned with cumin and black pepper.",
    ingredients:"Dehydrated kale (60%), dehydrated spinach (37%), cumin, black pepper, sea salt",
    benefits:"Vitamin K, A, C source · Bone health · Iron-rich · Detox greens",
    howTo:"Snack directly. Crumble over dals and sabzis. Mix into raita.",
    nutrition:{"Calories":"240 kcal","Protein":"8g","Carbs":"32g","Fat":"3g","Fibre":"15g"},
    shelfLife:"8 months", storage:"Keep in airtight packaging, away from light."
  },
  {
    id:"p6", name:"Spinach Powder – Pure", subtitle:"Kitchen Essential · High Nutrition",
    category:"powders", price:219, mrp:269, stock:90, weight:"200g",
    variants:[{weight:"100g",price:129,mrp:159,stock:50},{weight:"200g",price:219,mrp:269,stock:90},{weight:"500g",price:499,mrp:619,stock:40}],
    rating:4.8, reviews:156, image:"", emoji:"🌿",
    bestseller:true, newArrival:false, offer:false, outOfStock:false,
    description:"100% pure spinach powder with no fillers, no additives. One teaspoon = a big handful of fresh spinach.",
    ingredients:"Dehydrated spinach (100%)",
    benefits:"Iron · Calcium · Vitamins A, C, K · Chlorophyll-rich · Alkalising",
    howTo:"Add to smoothies, soups, roti dough, pasta dough, dal or sauces.",
    nutrition:{"Calories":"247 kcal","Protein":"29g","Carbs":"36g","Fat":"3g","Fibre":"18g"},
    shelfLife:"18 months", storage:"Store in a cool, dry, dark place. Use dry spoon."
  },
  {
    id:"p7", name:"Tomato Powder – Kitchen Grade", subtitle:"Bold Flavour · Instant Use",
    category:"powders", price:199, mrp:249, stock:75, weight:"200g",
    variants:[{weight:"100g",price:119,mrp:149,stock:40},{weight:"200g",price:199,mrp:249,stock:75},{weight:"500g",price:449,mrp:549,stock:30}],
    rating:4.7, reviews:98, image:"", emoji:"🍅",
    bestseller:false, newArrival:false, offer:true, outOfStock:false,
    description:"Vine-ripened tomatoes dehydrated and finely ground into a rich powder.",
    ingredients:"Dehydrated tomato (100%)",
    benefits:"Lycopene-rich · Vitamin C · Instant cooking aid · Long shelf life vs fresh tomatoes",
    howTo:"Mix 1 tbsp powder with 3 tbsp water for fresh tomato puree. Add directly to gravies, soups.",
    nutrition:{"Calories":"258 kcal","Protein":"13g","Carbs":"55g","Fat":"2.5g","Fibre":"14g"},
    shelfLife:"18 months", storage:"Keep sealed, away from moisture."
  },
  {
    id:"p8", name:"Onion-Garlic Master Mix", subtitle:"The Base of Every Great Curry",
    category:"powders", price:229, mrp:279, stock:55, weight:"200g",
    variants:[{weight:"100g",price:139,mrp:169,stock:30},{weight:"200g",price:229,mrp:279,stock:55},{weight:"500g",price:529,mrp:649,stock:20}],
    rating:4.9, reviews:203, image:"", emoji:"🧅",
    bestseller:true, newArrival:false, offer:false, outOfStock:false,
    description:"Slow-dehydrated onions and roasted garlic, blended in the perfect 2:1 ratio.",
    ingredients:"Dehydrated onion (66%), dehydrated garlic (34%)",
    benefits:"Prebiotic fibre · Anti-inflammatory allicin · Odour-free vs raw garlic · Saves 15 min daily",
    howTo:"Replace fresh onion+garlic with 2 tbsp of this mix. Sauté directly or rehydrate.",
    nutrition:{"Calories":"342 kcal","Protein":"9g","Carbs":"75g","Fat":"0.5g","Fibre":"9g"},
    shelfLife:"18 months", storage:"Airtight container, away from heat and moisture."
  },
  {
    id:"p9", name:"Immunity Soup Veg Mix", subtitle:"Carrot · Beans · Peas · Corn · Capsicum",
    category:"powders", price:259, mrp:319, stock:40, weight:"250g",
    variants:[{weight:"250g",price:259,mrp:319,stock:40},{weight:"500g",price:479,mrp:589,stock:20}],
    rating:4.6, reviews:72, image:"", emoji:"🍲",
    bestseller:false, newArrival:false, offer:false, outOfStock:false,
    description:"Five dehydrated vegetables in one convenient pack.",
    ingredients:"Dehydrated carrot, green beans, sweet corn, green peas, red capsicum",
    benefits:"5 vegetables in 1 · High fibre · Beta carotene · Quick hydration cooking",
    howTo:"Add 2 tbsp to 500ml boiling water for instant soup. Use in pulao, pasta, fried rice.",
    nutrition:{"Calories":"270 kcal","Protein":"11g","Carbs":"54g","Fat":"1.5g","Fibre":"16g"},
    shelfLife:"15 months", storage:"Cool, dry, airtight container."
  },
  {
    id:"p10", name:"Discovery Box – Original", subtitle:"12 Best-loved Flavours in 1 Box",
    category:"combo", price:799, mrp:999, stock:25, weight:"850g (12 × 70g)",
    variants:[],
    rating:4.9, reviews:312, image:"", emoji:"🎁",
    bestseller:true, newArrival:false, offer:true, outOfStock:false,
    description:"The perfect starter kit or gift box. Contains 12 of our bestselling products.",
    ingredients:"Assorted dehydrated fruits and vegetables (see individual packs)",
    benefits:"Best value · Discover 12 flavours · Great gifting option · Variety for the whole family",
    howTo:"Try each product and find your favourites.",
    nutrition:{"Note":"See individual packs for nutrition details"},
    shelfLife:"Min. 8 months from dispatch", storage:"Store in a cool, dry place."
  },
  {
    id:"p11", name:"HimCrest Gift Pack – Premium", subtitle:"For Health-Conscious Gifting",
    category:"combo", price:1299, mrp:1599, stock:15, weight:"1.2 kg (assorted)",
    variants:[],
    rating:4.8, reviews:89, image:"", emoji:"🏔️",
    bestseller:false, newArrival:false, offer:false, outOfStock:false,
    description:"A premium curated gift box featuring our finest products, elegantly packaged.",
    ingredients:"Curated selection of our best dehydrated fruits and vegetable products",
    benefits:"Elegant packaging · Thoughtful healthy gifting · Customisable message card",
    howTo:"Gift as-is. All products are individually sealed for freshness.",
    nutrition:{"Note":"See individual packs inside for details"},
    shelfLife:"Min. 8 months from dispatch", storage:"Keep in a cool, dry place until gifted."
  },
  {
    id:"p12", name:"Pineapple & Coconut Bites", subtitle:"Tropical Flavour Combo",
    category:"fruit-snacks", price:219, mrp:269, stock:50, weight:"100g",
    variants:[{weight:"100g",price:219,mrp:269,stock:50},{weight:"200g",price:409,mrp:499,stock:20}],
    rating:4.7, reviews:61, image:"", emoji:"🍍",
    bestseller:false, newArrival:true, offer:false, outOfStock:false,
    description:"Sun-dried pineapple chunks paired with delicate coconut flakes.",
    ingredients:"Dehydrated pineapple (80%), desiccated coconut (20%)",
    benefits:"Vitamin C · Natural digestive enzymes · No added sugar",
    howTo:"Snack straight from the pack. Add to smoothies or top on desserts.",
    nutrition:{"Calories":"330 kcal","Protein":"2g","Carbs":"68g","Fat":"5g","Fibre":"6g"},
    shelfLife:"10 months", storage:"Cool, dry place. Reseal tightly after opening."
  },
  {
    id:"p13", name:"Banana Chips – Classic", subtitle:"Crispy · Light · High Energy",
    category:"fruit-snacks", price:149, mrp:189, stock:100, weight:"100g",
    variants:[{weight:"100g",price:149,mrp:189,stock:100},{weight:"250g",price:329,mrp:399,stock:50}],
    rating:4.5, reviews:44, image:"", emoji:"🍌",
    bestseller:false, newArrival:false, offer:false, outOfStock:false,
    description:"Ripe Nendran bananas, thinly sliced and slow-baked to a crispy golden finish.",
    ingredients:"Dehydrated banana (100%)",
    benefits:"Quick energy source · Rich in potassium · Kid & athlete favourite",
    howTo:"Enjoy as a snack. Crumble over porridge or yoghurt.",
    nutrition:{"Calories":"347 kcal","Protein":"3.9g","Carbs":"79g","Fat":"0.7g","Fibre":"8g"},
    shelfLife:"12 months", storage:"Store in a cool, dry place."
  },
  {
    id:"p14", name:"Moringa Powder", subtitle:"Superfood Green · High Protein",
    category:"powders", price:299, mrp:369, stock:65, weight:"150g",
    variants:[{weight:"100g",price:219,mrp:269,stock:40},{weight:"150g",price:299,mrp:369,stock:65},{weight:"300g",price:549,mrp:679,stock:25}],
    rating:4.8, reviews:133, image:"", emoji:"☘️",
    bestseller:true, newArrival:false, offer:false, outOfStock:false,
    description:"Premium cold-dried moringa leaf powder, retaining maximum nutrients and vivid green colour.",
    ingredients:"Dehydrated moringa leaves (100%)",
    benefits:"Complete protein source · 92 nutrients · Anti-inflammatory · Bone strengthening",
    howTo:"Add 1 tsp to smoothies, juices, yoghurt, dals, or baked goods daily.",
    nutrition:{"Calories":"205 kcal","Protein":"27g","Carbs":"38g","Fat":"2g","Fibre":"19g"},
    shelfLife:"18 months", storage:"Store in a cool, dry, dark place. Avoid moisture."
  },
  {
    id:"p15", name:"Snack & Crunch Combo", subtitle:"3 Best Veggie Snacks + 1 Powder",
    category:"combo", price:549, mrp:699, stock:30, weight:"340g (4-pack)",
    variants:[],
    rating:4.7, reviews:57, image:"", emoji:"🥗",
    bestseller:false, newArrival:true, offer:true, outOfStock:false,
    description:"The ultimate veggie snack trio plus one essential pantry powder, bundled at a great price.",
    ingredients:"Beetroot Chips, Kale & Spinach Crisps, Mixed Veggie Snack, Spinach Powder",
    benefits:"Value pack · 4 products in 1 · Variety of textures & flavours",
    howTo:"Snack on the chips and crisps. Use the powder in your daily cooking.",
    nutrition:{"Note":"See individual packs for nutrition details"},
    shelfLife:"8 months from dispatch", storage:"Cool, dry place."
  },
];

// ── STATE ─────────────────────────────────────────────
let allProducts          = [...DEMO_PRODUCTS];
let currentFilter        = "all";
let currentSort          = "default";
let currentPriceMax      = 2000;
let currentProduct       = null;
let currentSelectedVariant = null;   // tracks selected weight variant on detail page
let pendingReviewRating  = 5;

// ── LOAD PRODUCTS ─────────────────────────────────────
async function loadProducts() {
  if (DEMO_MODE || !db) {
    renderHomeSections();
    renderShopGrid();
    return;
  }
  try {
    const fsProducts = await getCollection("products");
    if (fsProducts.length) allProducts = fsProducts;
  } catch (e) {
    console.warn("Firestore product load failed, using demo data:", e);
  }
  renderHomeSections();
  renderShopGrid();
}

// ── HOME SECTIONS ─────────────────────────────────────
function renderHomeSections() {
  renderGrid("bestsellerGrid",  allProducts.filter(p => p.bestseller && !p.outOfStock).slice(0, 8));
  renderGrid("newArrivalsGrid", allProducts.filter(p => p.newArrival && !p.outOfStock).slice(0, 4));
  renderGrid("offersGrid",      allProducts.filter(p => p.offer && !p.outOfStock).slice(0, 4));
}

// ── SHOP GRID ─────────────────────────────────────────
function renderShopGrid() {
  let products = [...allProducts];

  if (currentFilter && currentFilter !== "all") {
    if (currentFilter === "bestsellers")   products = products.filter(p => p.bestseller);
    else if (currentFilter === "new-arrivals") products = products.filter(p => p.newArrival);
    else if (currentFilter === "offers")   products = products.filter(p => p.offer);
    else products = products.filter(p => p.category === currentFilter);
  }

  products = products.filter(p => p.price <= currentPriceMax);

  if (currentSort === "price-asc")  products.sort((a, b) => a.price - b.price);
  else if (currentSort === "price-desc") products.sort((a, b) => b.price - a.price);
  else if (currentSort === "rating")    products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (currentSort === "newest")    products.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0));

  const countEl = document.getElementById("productCount");
  if (countEl) countEl.textContent = `${products.length} product${products.length !== 1 ? "s" : ""}`;

  renderGrid("mainProductGrid", products);
}

// ── GRID RENDERER ─────────────────────────────────────
function renderGrid(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!products || !products.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:40px 20px">
        <div class="empty-emoji">🌿</div>
        <h3>No products found</h3>
        <p>Try a different filter or search term.</p>
      </div>`;
    return;
  }

  container.innerHTML = products.map(createProductCard).join("");
}

// ── GALLERY SWITCHER ──────────────────────────────────
function switchGalleryMedia(type, url, btn) {
  // Deactivate all thumbs
  document.querySelectorAll(".thumb-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const galleryMain = document.querySelector(".gallery-main");
  if (!galleryMain) return;

  // Remove any injected video player
  const existingVideo = galleryMain.querySelector(".gallery-video-player");
  if (existingVideo) existingVideo.remove();

  const imgEl   = document.getElementById("mainProductImg");
  const emojiEl = galleryMain.querySelector(".detail-emoji");

  if (type === "img") {
    if (imgEl) { imgEl.src = url; imgEl.style.display = "block"; }
    if (emojiEl) emojiEl.style.display = "none";
  } else if (type === "video") {
    if (imgEl) imgEl.style.display = "none";
    if (emojiEl) emojiEl.style.display = "none";
    const video = document.createElement("video");
    video.className = "gallery-video-player";
    video.src = url;
    video.controls = true;
    video.autoplay = true;
    video.style.cssText = "width:100%;height:100%;object-fit:contain;border-radius:var(--radius-xl)";
    galleryMain.appendChild(video);
  }
}

// ── PRODUCT CARD (updated to use images[]) ────────────
function createProductCard(p) {
  if (!p) return "";
  const inWishlist = isInWishlist(p.id);
  const stars      = "★".repeat(Math.round(p.rating || 0)) + "☆".repeat(5 - Math.round(p.rating || 0));
  const discount   = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

  let labelHTML = "";
  if (p.bestseller)    labelHTML = `<span class="card-label bestseller">⭐ Bestseller</span>`;
  else if (p.newArrival) labelHTML = `<span class="card-label new">✨ New</span>`;
  else if (p.offer)    labelHTML = `<span class="card-label offer">🔥 Offer</span>`;

  // Use first image from images[] array, fall back to image field
  const primaryImg = (p.images && p.images[0]) || p.image || "";
  const imgHTML = primaryImg
    ? `<img src="${primaryImg}" alt="${escapeHtmlProd(p.name)}" class="card-img" loading="lazy" onerror="this.style.display='none';this.nextSibling.style.display='flex'">`
    : "";

  return `
    <div class="product-card" data-id="${p.id}">
      <div class="card-img-wrap" onclick="openProductDetail('${p.id}')">
        ${labelHTML}
        ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ""}
        ${imgHTML}
        <div class="card-img-placeholder" ${primaryImg ? 'style="display:none"' : ""}>${p.emoji || "🌿"}</div>
        <button class="wishlist-btn ${inWishlist ? "active" : ""}"
          onclick="event.stopPropagation(); toggleWishlist('${p.id}')" title="Wishlist">
          ${inWishlist ? "♥" : "♡"}
        </button>
        <button class="quick-view-btn" onclick="event.stopPropagation(); openQuickView('${p.id}')">
          Quick View
        </button>
      </div>
      <div class="card-body">
        <p class="card-cat">${getCatLabel(p.category)}</p>
        <h4 class="card-name" onclick="openProductDetail('${p.id}')">${escapeHtmlProd(p.name)}</h4>
        <p class="card-subtitle">${escapeHtmlProd(p.subtitle || "")}</p>
        <div class="card-rating">
          <span class="stars">${stars}</span>
          <span class="rating-count">(${p.reviews || 0})</span>
        </div>
        <p class="card-weight-hint">${p.weight || ""}</p>
        <div class="card-price-row">
          <span class="card-price">₹${p.price}</span>
          ${p.mrp ? `<span class="card-mrp">₹${p.mrp}</span>` : ""}
          ${discount > 0 ? `<span class="card-save">${discount}% off</span>` : ""}
        </div>
        <div class="card-actions">
          ${p.outOfStock
            ? `<button class="btn btn-outline btn-sm btn-full" disabled>Out of Stock</button>`
            : `<button class="btn btn-primary btn-sm" onclick="addToCartById('${p.id}')">Add to Cart</button>
               <button class="btn btn-outline btn-sm" onclick="openProductDetail('${p.id}')">Details</button>`
          }
        </div>
      </div>
    </div>`;
}

// ── CATEGORY LABEL ────────────────────────────────────
function getCatLabel(cat) {
  const map = {
    "fruit-snacks":  "🍎 Fruit Snacks",
    "veggie-snacks": "🥦 Veggie Snacks",
    "powders":       "🌿 Powders",
    "combo":         "🎁 Combo",
    "bestsellers":   "⭐ Bestsellers",
    "new-arrivals":  "✨ New Arrivals",
    "offers":        "🔥 Offers",
  };
  return map[cat] || cat;
}

function getProductById(id) { return allProducts.find(p => p.id === id) || null; }

// ── FILTER & SORT ─────────────────────────────────────
function filterCategory(el) {
  const cat = (typeof el === "string") ? el : (el?.dataset?.cat || "all");
  currentFilter = cat;

  document.querySelectorAll(".cat-link").forEach(link => {
    link.classList.toggle("active", link.dataset.cat === cat);
  });
  const radio = document.querySelector(`input[name="catFilter"][value="${cat}"]`);
  if (radio) radio.checked = true;

  const catLabels = { all:"All Products","fruit-snacks":"Fruit Snacks","veggie-snacks":"Veggie Snacks",powders:"Powders & Mixes",combo:"Combo Packs",bestsellers:"Bestsellers","new-arrivals":"New Arrivals",offers:"Offers 🔥" };
  const titleEl = document.getElementById("shopPageTitle");
  if (titleEl) titleEl.textContent = catLabels[cat] || "Products";

  showPage("shop");
  renderShopGrid();
  scrollToTop();
}

function filterByPrice(val) {
  currentPriceMax = parseInt(val);
  const label = document.getElementById("priceRangeVal");
  if (label) label.textContent = `₹${val}`;
  renderShopGrid();
}

function sortProducts(val) {
  currentSort = val;
  renderShopGrid();
}

// ── LIVE SEARCH ────────────────────────────────────────
let searchTimeout = null;

function initSearch() {
  const input    = document.getElementById("searchInput");
  const dropdown = document.getElementById("searchDropdown");
  if (!input) return;

  input.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => showSearchResults(input.value.trim()), 220);
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && input.value.trim()) runFullSearch(input.value.trim());
    if (e.key === "Escape" && dropdown) dropdown.style.display = "none";
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".search-wrapper") && dropdown) dropdown.style.display = "none";
  });

  document.getElementById("searchBtn")?.addEventListener("click", () => {
    if (input.value.trim()) runFullSearch(input.value.trim());
  });
}

function showSearchResults(query) {
  const dropdown = document.getElementById("searchDropdown");
  if (!dropdown) return;
  if (!query) { dropdown.style.display = "none"; return; }

  const q       = query.toLowerCase();
  const results = allProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.subtitle || "").toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  ).slice(0, 6);

  dropdown.innerHTML = results.length
    ? results.map(p => `
        <div class="search-item" onclick="openProductDetail('${p.id}'); document.getElementById('searchDropdown').style.display='none'">
          <span class="search-item-emoji">${p.emoji || "🌿"}</span>
          <div>
            <div class="search-item-name">${escapeHtmlProd(p.name)}</div>
            <div class="search-item-price">₹${p.price} · ${p.weight || ""}</div>
          </div>
        </div>`).join("")
    : `<div class="search-no-result">No products found for "<strong>${escapeHtmlProd(query)}</strong>"</div>`;

  dropdown.style.display = "block";
}

function runFullSearch(query) {
  const q       = query.toLowerCase();
  const results = allProducts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.subtitle || "").toLowerCase().includes(q) ||
    (p.description || "").toLowerCase().includes(q)
  );
  currentFilter = "all";
  showPage("shop");
  const titleEl = document.getElementById("shopPageTitle");
  if (titleEl) titleEl.textContent = `Results for "${query}"`;
  const countEl = document.getElementById("productCount");
  if (countEl) countEl.textContent = `${results.length} result${results.length !== 1 ? "s" : ""}`;
  renderGrid("mainProductGrid", results);
  const dropdown = document.getElementById("searchDropdown");
  if (dropdown) dropdown.style.display = "none";
}

// ── PRODUCT DETAIL ────────────────────────────────────
function openProductDetail(id) {
  const p = getProductById(id);
  if (!p) return;
  currentProduct = p;
  currentSelectedVariant = null;

  // ── Build media arrays (backward-compat) ──────────────
  // New: p.images[] array. Old: p.image string. Both supported.
  let mediaImages = [];
  if (p.images && Array.isArray(p.images) && p.images.length) {
    mediaImages = p.images.filter(Boolean);
  } else if (p.image) {
    mediaImages = [p.image];
  }
  const hasImages = mediaImages.length > 0;
  const hasVideo  = !!(p.video && p.video.trim());

  // ── Main image display ────────────────────────────────
  const imgEl = document.getElementById("mainProductImg");
  if (imgEl) {
    if (hasImages) { imgEl.src = mediaImages[0]; imgEl.alt = p.name; imgEl.style.display = "block"; }
    else imgEl.style.display = "none";
  }

  // Emoji fallback
  const gallery = document.querySelector(".gallery-main");
  if (gallery) {
    let emojiDiv = gallery.querySelector(".detail-emoji");
    if (!emojiDiv) { emojiDiv = document.createElement("div"); emojiDiv.className = "detail-emoji"; gallery.insertBefore(emojiDiv, gallery.firstChild); }
    emojiDiv.textContent = p.emoji || "🌿";
    emojiDiv.style.display = hasImages ? "none" : "flex";
  }

  // ── Gallery thumbnails + optional video thumb ─────────
  const thumbsContainer = document.getElementById("galleryThumbs");
  if (thumbsContainer) {
    let thumbHtml = "";
    mediaImages.forEach((url, i) => {
      thumbHtml += `<button class="thumb-btn ${i === 0 ? "active" : ""}" onclick="switchGalleryMedia('img', '${url}', this)">
        <img src="${url}" alt="View ${i+1}" loading="lazy" onerror="this.parentElement.style.display='none'">
      </button>`;
    });
    if (hasVideo) {
      thumbHtml += `<button class="thumb-btn thumb-video" onclick="switchGalleryMedia('video', '${escapeHtmlProd(p.video)}', this)" title="Play video">
        <span class="thumb-play-icon">▶</span>
      </button>`;
    }
    thumbsContainer.innerHTML = thumbHtml;
    thumbsContainer.style.display = (mediaImages.length > 1 || hasVideo) ? "flex" : "none";
  }

  // Labels
  const labelsEl = document.getElementById("productLabels");
  if (labelsEl) {
    let labels = "";
    if (p.bestseller) labels += `<span class="card-label bestseller">⭐ Bestseller</span>`;
    if (p.newArrival) labels += `<span class="card-label new">✨ New Arrival</span>`;
    if (p.offer)      labels += `<span class="card-label offer">🔥 On Offer</span>`;
    labelsEl.innerHTML = labels;
  }

  setText("productTitle",    p.name);
  setText("productSubtitle", p.subtitle || "");

  // Rating bar
  const ratingBar = document.getElementById("productRatingBar");
  if (ratingBar) {
    const stars = "★".repeat(Math.round(p.rating || 0)) + "☆".repeat(5 - Math.round(p.rating || 0));
    ratingBar.innerHTML = `<span class="stars gold">${stars}</span> <span class="rating-num">${p.rating || 0}</span> <span class="rating-count">(${p.reviews || 0} reviews)</span>`;
  }

  // Weight variants
  renderWeightOptions(p);

  // Stock & delivery
  const stockEl = document.getElementById("productStock");
  if (stockEl) {
    stockEl.textContent = p.outOfStock ? "❌ Out of Stock" : (p.stock < 10 ? `⚠️ Only ${p.stock} left!` : "✅ In Stock");
    stockEl.className   = "product-stock " + (p.outOfStock ? "oos" : "in-stock");
  }

  const delivEl = document.getElementById("productDelivery");
  if (delivEl) delivEl.textContent = p.deliveryNote || "🚚 Ships within 1–2 business days";

  setText("detailQty", "1");
  const addBtn = document.getElementById("addToCartBtn");
  const buyBtn = document.getElementById("buyNowBtn");
  if (addBtn) addBtn.disabled = !!p.outOfStock;
  if (buyBtn) buyBtn.disabled = !!p.outOfStock;

  updateWishlistDetailBtn(p.id);

  // Description tab
  const desc = document.getElementById("tab-description");
  if (desc) desc.innerHTML = `
    <p>${escapeHtmlProd(p.description || "")}</p>
    ${p.ingredients ? `<p><strong>Ingredients:</strong> ${escapeHtmlProd(p.ingredients)}</p>` : ""}
    ${p.benefits    ? `<p><strong>Benefits:</strong><br>${escapeHtmlProd(p.benefits)}</p>` : ""}
    <p><strong>Shelf Life:</strong> ${escapeHtmlProd(p.shelfLife || "See pack")}</p>
    <p><strong>Storage:</strong> ${escapeHtmlProd(p.storage || "See pack")}</p>`;

  // Nutrition tab
  const nutrEl = document.getElementById("tab-nutrition");
  if (nutrEl && p.nutrition) {
    const rows = Object.entries(p.nutrition).map(([k, v]) =>
      `<tr><td>${escapeHtmlProd(k)}</td><td>${escapeHtmlProd(String(v))}</td></tr>`
    ).join("");
    nutrEl.innerHTML = `<table class="nutrition-table"><tbody>${rows}</tbody></table>`;
  }

  // How to use
  const howtoEl = document.getElementById("tab-how-to");
  if (howtoEl) howtoEl.innerHTML = `<p>${escapeHtmlProd(p.howTo || "See packaging.")}</p>`;

  // Breadcrumb
  const breadCat = document.getElementById("breadcrumbCat");
  if (breadCat) { breadCat.textContent = getCatLabel(p.category); breadCat.onclick = () => filterCategory(p.category); }
  setText("breadcrumbProduct", p.name);

  loadReviews(p.id);

  const related = allProducts.filter(rp => rp.category === p.category && rp.id !== p.id).slice(0, 4);
  renderGrid("relatedGrid", related);

  showPage("product");
  scrollToTop();
}

// ── WEIGHT VARIANT SELECTOR ────────────────────────────
function renderWeightOptions(product) {
  const container = document.getElementById("weightOptions");
  if (!container) return;

  const variants = product.variants || [];

  if (!variants.length) {
    // Single weight — just display it, no selector
    container.innerHTML = product.weight
      ? `<div class="weight-single">📦 Net Weight: <strong>${product.weight}</strong></div>`
      : "";
    updateDetailPrice(product.price, product.mrp);
    return;
  }

  container.innerHTML = `
    <div class="weight-label">Select Size:</div>
    <div class="weight-chips">
      ${variants.map((v, i) => `
        <button
          class="weight-chip ${i === 0 ? "active" : ""} ${v.stock === 0 ? "oos" : ""}"
          onclick="selectWeightVariant(${i})"
          data-variant-index="${i}"
          ${v.stock === 0 ? "disabled title='Out of stock'" : ""}
        >
          ${v.weight}
          ${v.stock > 0 && v.stock <= 5 ? `<span class="chip-stock">Only ${v.stock} left</span>` : ""}
        </button>`).join("")}
    </div>`;

  // Default select first available variant
  const firstAvail = variants.findIndex(v => v.stock > 0);
  if (firstAvail >= 0) selectWeightVariant(firstAvail);
}

function selectWeightVariant(index) {
  const product = currentProduct;
  if (!product) return;
  const variants = product.variants || [];
  const variant  = variants[index];
  if (!variant) return;

  currentSelectedVariant = variant;

  // Highlight selected chip
  document.querySelectorAll(".weight-chip").forEach((chip, i) => {
    chip.classList.toggle("active", i === index);
  });

  // Update price display
  updateDetailPrice(variant.price, variant.mrp);

  // Update stock status
  const stockEl = document.getElementById("productStock");
  if (stockEl) {
    stockEl.textContent = variant.stock === 0 ? "❌ Out of Stock" : (variant.stock <= 5 ? `⚠️ Only ${variant.stock} left!` : "✅ In Stock");
    stockEl.className   = "product-stock " + (variant.stock === 0 ? "oos" : "in-stock");
  }

  const addBtn = document.getElementById("addToCartBtn");
  const buyBtn = document.getElementById("buyNowBtn");
  if (addBtn) addBtn.disabled = variant.stock === 0;
  if (buyBtn) buyBtn.disabled = variant.stock === 0;
}

function updateDetailPrice(price, mrp) {
  setText("productPrice", `₹${price}`);
  const discount = mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
  setText("productMRP",      mrp ? `₹${mrp}` : "");
  setText("productDiscount", discount > 0 ? `${discount}% off` : "");
  const savingEl = document.getElementById("productSaving");
  if (savingEl) savingEl.textContent = mrp && discount > 0 ? `You save ₹${mrp - price}` : "";
}

// ── DETAIL PAGE ACTIONS ───────────────────────────────
function changeDetailQty(delta) {
  const el = document.getElementById("detailQty");
  if (!el) return;
  let qty = (parseInt(el.textContent) || 1) + delta;
  qty = Math.max(1, Math.min(qty, 99));
  el.textContent = qty;
}

function addCurrentToCart() {
  if (!currentProduct) return;
  const qty = parseInt(document.getElementById("detailQty")?.textContent || "1");
  addToCart(currentProduct.id, qty, currentSelectedVariant);
}

function buyNow() {
  if (!currentProduct) return;
  const qty = parseInt(document.getElementById("detailQty")?.textContent || "1");
  addToCart(currentProduct.id, qty, currentSelectedVariant);
  closeCartDrawer();
  showPage("checkout");
}

function toggleWishlistDetail() {
  if (!currentProduct) return;
  toggleWishlist(currentProduct.id);
  updateWishlistDetailBtn(currentProduct.id);
}

function updateWishlistDetailBtn(id) {
  const btn = document.getElementById("wishlistDetailBtn");
  if (!btn) return;
  const inW = isInWishlist(id);
  btn.textContent = inW ? "♥" : "♡";
  btn.classList.toggle("active", inW);
}

function switchTab(tabId, btn) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const el = document.getElementById("tab-" + tabId);
  if (el) el.classList.add("active");
}

// ── QUICK VIEW ────────────────────────────────────────
function openQuickView(id) {
  const p = getProductById(id);
  if (!p) return;

  const discount = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  const variants = p.variants || [];

  const content = document.getElementById("quickViewContent");
  if (content) {
    content.innerHTML = `
      <div class="qv-img">
        <div class="qv-emoji">${p.emoji || "🌿"}</div>
        ${p.image ? `<img src="${p.image}" alt="${escapeHtmlProd(p.name)}" class="qv-img-real">` : ""}
      </div>
      <div class="qv-info">
        <div class="product-labels">
          ${p.bestseller ? '<span class="card-label bestseller">⭐ Bestseller</span>' : ""}
          ${p.newArrival ? '<span class="card-label new">✨ New</span>' : ""}
          ${p.offer      ? '<span class="card-label offer">🔥 Offer</span>' : ""}
        </div>
        <h3>${escapeHtmlProd(p.name)}</h3>
        <p class="card-subtitle">${escapeHtmlProd(p.subtitle || "")}</p>
        <div class="product-price-block">
          <span class="product-price" id="qvPrice">₹${p.price}</span>
          ${p.mrp ? `<span class="product-mrp" id="qvMRP">₹${p.mrp}</span>` : ""}
          ${discount > 0 ? `<span class="product-discount">${discount}% off</span>` : ""}
        </div>
        ${variants.length ? `
          <div class="weight-chips" style="margin:12px 0">
            ${variants.map((v, i) => `
              <button class="weight-chip ${i===0?"active":""} ${v.stock===0?"oos":""}"
                onclick="selectQVVariant(this, ${p.price}, ${JSON.stringify(v)})"
                ${v.stock===0?"disabled":""}>
                ${v.weight}
              </button>`).join("")}
          </div>` : `<p style="font-size:13px;color:var(--text-secondary);margin:8px 0">📦 ${p.weight}</p>`}
        <p style="margin:12px 0;color:var(--text-secondary);font-size:14px">${escapeHtmlProd((p.description || "").substring(0, 160))}…</p>
        <div class="card-actions" style="margin-top:16px">
          ${p.outOfStock
            ? `<button class="btn btn-outline btn-full" disabled>Out of Stock</button>`
            : `<button class="btn btn-primary" onclick="addToCartById('${p.id}'); closeQuickView()">Add to Cart</button>
               <button class="btn btn-outline" onclick="closeQuickView(); openProductDetail('${p.id}')">Full Details</button>`
          }
        </div>
      </div>`;
  }

  document.getElementById("quickViewOverlay")?.setAttribute("style", "display:block");
  document.getElementById("quickViewModal")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function selectQVVariant(btn, basePrice, variant) {
  document.querySelectorAll("#quickViewContent .weight-chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const priceEl = document.getElementById("qvPrice");
  const mrpEl   = document.getElementById("qvMRP");
  if (priceEl) priceEl.textContent = `₹${variant.price}`;
  if (mrpEl && variant.mrp) mrpEl.textContent = `₹${variant.mrp}`;
}

function closeQuickView() {
  const ov = document.getElementById("quickViewOverlay");
  const m  = document.getElementById("quickViewModal");
  if (ov) ov.style.display = "none";
  if (m)  m.classList.remove("open");
  document.body.style.overflow = "";
}

// ── REVIEWS ────────────────────────────────────────────
let demoReviews = {
  p1:  [{ name:"Priya S.",  rating:5, text:"Absolutely love these! My kids can't stop munching.", date:"2 weeks ago" }],
  p6:  [{ name:"Neha T.",   rating:5, text:"I add this to everything — smoothies, dal, roti dough. Such an easy way to get greens in!", date:"3 weeks ago" }],
  p8:  [{ name:"Rajesh K.", rating:5, text:"Game changer for cooking. No more crying over onions!", date:"1 month ago" }],
  p10: [{ name:"Kiran L.",  rating:5, text:"Ordered as a gift for my mom. She loved every single product. Packaging was beautiful!", date:"1 week ago" }],
};

async function loadReviews(productId) {
  const list    = document.getElementById("reviewList");
  const summary = document.getElementById("reviewsSummary");
  if (!list) return;

  let reviews = demoReviews[productId] || [];

  if (!DEMO_MODE && db) {
    try {
      const fsReviews = await getCollection("reviews", [{ field:"productId", op:"==", value:productId }]);
      if (fsReviews.length) reviews = fsReviews;
    } catch { /* use demo */ }
  }

  list.innerHTML = reviews.length
    ? reviews.map(r => `
        <div class="review-card">
          <div class="review-header">
            <div class="reviewer-avatar">${(r.name || "U").charAt(0)}</div>
            <div>
              <strong>${escapeHtmlProd(r.name || "Customer")}</strong>
              <div class="stars gold">${"★".repeat(r.rating || 5)}${"☆".repeat(5 - (r.rating || 5))}</div>
            </div>
            <span class="review-date">${r.date || ""}</span>
          </div>
          <p>${escapeHtmlProd(r.text || "")}</p>
        </div>`).join("")
    : `<p class="hint" style="padding:16px">No reviews yet. Be the first!</p>`;

  if (summary) {
    const product = getProductById(productId);
    summary.innerHTML = `
      <div class="rating-big">${product?.rating || 0}</div>
      <div>
        <div class="stars gold">${"★".repeat(Math.round(product?.rating || 0))}${"☆".repeat(5 - Math.round(product?.rating || 0))}</div>
        <p>${product?.reviews || 0} reviews</p>
      </div>`;
  }

  setReviewRating(5);
}

function setReviewRating(n) {
  pendingReviewRating = n;
  document.querySelectorAll("#starSelector span").forEach((s, i) => s.classList.toggle("active", i < n));
}

async function submitReview() {
  const text = document.getElementById("reviewText")?.value.trim();
  if (!text) { showToast("Please write your review first.", "error"); return; }
  if (!currentUser) { showToast("Please login to submit a review.", "warning"); showPage("auth"); return; }
  if (!currentProduct) return;

  const review = {
    name:      currentUser.displayName || currentUser.email?.split("@")[0] || "Customer",
    rating:    pendingReviewRating,
    text,
    productId: currentProduct.id,
    date:      "Just now",
    userId:    currentUser.uid,
  };

  if (!DEMO_MODE) {
    try { await addDocument("reviews", review); } catch { /* fallback */ }
  }

  if (!demoReviews[currentProduct.id]) demoReviews[currentProduct.id] = [];
  demoReviews[currentProduct.id].unshift(review);

  const textarea = document.getElementById("reviewText");
  if (textarea) textarea.value = "";
  loadReviews(currentProduct.id);
  showToast("Thank you for your review! 🌿", "success");
}

// ── UTILITY ────────────────────────────────────────────
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function scrollToShop() { filterCategory("all"); }

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

function escapeHtmlProd(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
