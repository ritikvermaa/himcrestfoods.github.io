// =====================================================
// CART.JS – Cart & Wishlist Logic
// HimCrest Foods – Production
// =====================================================

// ── STATE ─────────────────────────────────────────────
let cart = [];
try { cart = JSON.parse(localStorage.getItem("hc_cart") || "[]"); } catch { cart = []; }

let appliedCoupon = null;

// Shipping settings (overridden by Firestore siteSettings on load)
let shippingSettings = { freeAbove: 499, charge: 49 };

// ── PERSIST ───────────────────────────────────────────
function saveCart() {
  localStorage.setItem("hc_cart", JSON.stringify(cart));
}

// ── ADD TO CART ────────────────────────────────────────
// selectedVariant: { weight, price, mrp, stock } or null
function addToCart(productId, qty = 1, selectedVariant = null) {
  const product = getProductById(productId);
  if (!product) { showToast("Product not found.", "error"); return; }

  // Determine effective price, mrp, weight from variant or product root
  const price  = selectedVariant?.price  ?? product.price;
  const mrp    = selectedVariant?.mrp    ?? product.mrp    ?? null;
  const weight = selectedVariant?.weight ?? product.weight ?? "";

  if (product.outOfStock || (selectedVariant && selectedVariant.stock === 0)) {
    showToast("This product is out of stock.", "warning"); return;
  }

  // Cart key includes variant weight to distinguish same product in different weights
  const cartKey = weight ? `${productId}_${weight}` : productId;

  const existing = cart.find(item => item.cartKey === cartKey);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, 20);
  } else {
    cart.push({
      cartKey,
      id:     productId,
      name:   product.name,
      emoji:  product.emoji || "🌿",
      image:  product.image || "",
      price,
      mrp,
      weight,
      qty,
    });
  }

  saveCart();
  updateCartUI();
  showToast(`${product.name}${weight ? " – " + weight : ""} added to cart! 🛒`, "success");
  openCartDrawer();
}

function addToCartById(productId) { addToCart(productId, 1); }

// ── REMOVE ────────────────────────────────────────────
function removeFromCart(cartKey) {
  cart = cart.filter(item => item.cartKey !== cartKey);
  saveCart();
  updateCartUI();
  renderCartPage();
  renderCartDrawer();
}

// ── UPDATE QTY ────────────────────────────────────────
function updateCartQty(cartKey, delta) {
  const item = cart.find(i => i.cartKey === cartKey);
  if (!item) return;
  item.qty = Math.max(1, Math.min(item.qty + delta, 20));
  saveCart();
  updateCartUI();
  renderCartPage();
  renderCartDrawer();
}

// ── TOTALS ────────────────────────────────────────────
function getCartSubtotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
function getCartShipping(subtotal) { return subtotal >= shippingSettings.freeAbove ? 0 : shippingSettings.charge; }
function getCartDiscount(subtotal) {
  if (!appliedCoupon) return 0;
  if (subtotal < (appliedCoupon.minOrder || 0)) return 0;
  return appliedCoupon.type === "percent"
    ? Math.round(subtotal * appliedCoupon.value / 100)
    : appliedCoupon.value;
}
function getCartTotal() {
  const sub  = getCartSubtotal();
  const ship = getCartShipping(sub);
  const disc = getCartDiscount(sub);
  return Math.max(0, sub + ship - disc);
}
function getCartItemCount() { return cart.reduce((s, i) => s + i.qty, 0); }

// ── UI BADGES ─────────────────────────────────────────
function updateCartUI() {
  const count = getCartItemCount();
  ["cartCount","mobCartBadge","drawerCartCount"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  });
  renderCartDrawer();
}

// ── CART DRAWER ────────────────────────────────────────
function openCartDrawer() {
  document.getElementById("cartOverlay")?.classList.add("open");
  document.getElementById("cartDrawer")?.classList.add("open");
  document.body.style.overflow = "hidden";
  renderCartDrawer();
}

function closeCartDrawer() {
  document.getElementById("cartOverlay")?.classList.remove("open");
  document.getElementById("cartDrawer")?.classList.remove("open");
  document.body.style.overflow = "";
}

function renderCartDrawer() {
  const container = document.getElementById("drawerCartItems");
  const totalEl   = document.getElementById("drawerTotal");
  const countEl   = document.getElementById("drawerCartCount");

  if (countEl) countEl.textContent = getCartItemCount();
  if (totalEl) totalEl.textContent = `₹${getCartTotal()}`;
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty-state" style="padding:32px 16px">
        <div class="empty-emoji">🛒</div>
        <p>Your cart is empty</p>
        <button class="btn btn-primary" onclick="closeCartDrawer(); showPage('shop')" style="margin-top:12px">Shop Now</button>
      </div>`;
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="drawer-item">
      ${item.image
        ? `<img src="${item.image}" alt="${item.name}" class="drawer-item-img" onerror="this.style.display='none'">`
        : `<span class="drawer-item-emoji">${item.emoji || "🌿"}</span>`}
      <div class="drawer-item-info">
        <p class="drawer-item-name">${item.name}${item.weight ? ` <small>(${item.weight})</small>` : ""}</p>
        <div class="drawer-qty-row">
          <div class="qty-mini">
            <button onclick="updateCartQty('${item.cartKey}', -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="updateCartQty('${item.cartKey}', 1)">+</button>
          </div>
          <span class="drawer-item-price">₹${item.price * item.qty}</span>
        </div>
      </div>
      <button class="drawer-remove" onclick="removeFromCart('${item.cartKey}')">×</button>
    </div>`).join("");
}

// ── CART PAGE ──────────────────────────────────────────
function renderCartPage() {
  const container = document.getElementById("cartItems");
  if (!container) return;

  if (!cart.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started</p>
        <button class="btn btn-primary" onclick="showPage('shop')">Shop Now</button>
      </div>`;
    updateCartSummary();
    return;
  }

  container.innerHTML = cart.map(item => {
    const saving = item.mrp ? (item.mrp - item.price) * item.qty : 0;
    return `
      <div class="cart-item">
        <div class="cart-item-img">
          ${item.image
            ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" onerror="this.style.display='none'">`
            : (item.emoji || "🌿")}
        </div>
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          ${item.weight ? `<p class="cart-item-weight">📦 ${item.weight}</p>` : ""}
          ${saving > 0 ? `<p class="cart-item-saving">You save ₹${saving}</p>` : ""}
          <div class="cart-item-controls">
            <div class="qty-control">
              <button onclick="updateCartQty('${item.cartKey}', -1)">−</button>
              <span>${item.qty}</span>
              <button onclick="updateCartQty('${item.cartKey}', 1)">+</button>
            </div>
            <button class="remove-btn" onclick="removeFromCart('${item.cartKey}')">Remove</button>
          </div>
        </div>
        <div class="cart-item-price">
          <span class="item-total">₹${item.price * item.qty}</span>
          ${item.mrp ? `<span class="item-mrp">₹${item.mrp * item.qty}</span>` : ""}
        </div>
      </div>`;
  }).join("");

  updateCartSummary();
}

function updateCartSummary() {
  const subtotal = getCartSubtotal();
  const shipping = getCartShipping(subtotal);
  const discount = getCartDiscount(subtotal);

  setT("cartSubtotal", `₹${subtotal}`);
  setT("cartShipping", shipping === 0 ? "FREE 🎉" : `₹${shipping}`);
  setT("cartDiscount", discount > 0 ? `–₹${discount}` : "–₹0");
  setT("cartTotal",    `₹${getCartTotal()}`);

  const freeShipEl = document.getElementById("cartFreeShipNote");
  if (freeShipEl) {
    const remaining = shippingSettings.freeAbove - subtotal;
    freeShipEl.textContent = remaining > 0
      ? `Add ₹${remaining} more to get FREE shipping!`
      : "🎉 You qualify for free shipping!";
  }

  if (document.getElementById("coSubtotal")) updateCheckoutSummary();
}

// ── COUPON ─────────────────────────────────────────────
async function applyCoupon() {
  const input = document.getElementById("couponInput");
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  if (!code) { showToast("Please enter a coupon code.", "error"); return; }

  let coupons = [];
  if (!DEMO_MODE && db) {
    try {
      const fromDB = await getCollection("coupons", [{ field:"active", op:"==", value:true }]);
      if (fromDB.length) coupons = fromDB;
    } catch { /* empty */ }
  }

  const coupon   = coupons.find(c => c.code === code);
  const subtotal = getCartSubtotal();

  if (!coupon) { showToast("Invalid coupon code.", "error"); return; }
  if (coupon.active === false) { showToast("This coupon is no longer active.", "warning"); return; }
  if (subtotal < (coupon.minOrder || 0)) {
    showToast(`Minimum order of ₹${coupon.minOrder} required for this coupon.`, "warning"); return;
  }
  if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
    showToast("This coupon has expired.", "warning"); return;
  }

  appliedCoupon = coupon;
  updateCartSummary();
  renderCartPage();
  showToast(`Coupon applied! You save ₹${getCartDiscount(subtotal)} 🎉`, "success");
}

function removeCoupon() {
  appliedCoupon = null;
  updateCartSummary();
  renderCartPage();
  showToast("Coupon removed.", "info");
  const input = document.getElementById("couponInput");
  if (input) input.value = "";
}

// ── WISHLIST ────────────────────────────────────────────
let wishlist = [];
try { wishlist = JSON.parse(localStorage.getItem("hc_wishlist") || "[]"); } catch { wishlist = []; }

function saveWishlist() {
  localStorage.setItem("hc_wishlist", JSON.stringify(wishlist));
  if (!DEMO_MODE && currentUser && currentUser.uid && db) {
    updateDocument("users", currentUser.uid, { wishlist }).catch(() => {});
  }
}

function isInWishlist(productId) { return wishlist.includes(productId); }

function toggleWishlist(productId) {
  const idx = wishlist.indexOf(productId);
  if (idx === -1) {
    wishlist.push(productId);
    showToast("Added to wishlist ♥", "success");
  } else {
    wishlist.splice(idx, 1);
    showToast("Removed from wishlist", "info");
  }
  saveWishlist();
  updateWishlistCount();
  renderWishlistPage();
  if (currentProduct) updateWishlistDetailBtn(currentProduct.id);
}

function updateWishlistCount() {
  const el = document.getElementById("wishlistCount");
  if (el) el.textContent = wishlist.length;
}

function renderWishlistPage() {
  const grid  = document.getElementById("wishlistGrid");
  const empty = document.getElementById("wishlistEmpty");
  if (!grid) return;

  const products = wishlist.map(id => getProductById(id)).filter(Boolean);
  if (!products.length) {
    grid.innerHTML = "";
    if (empty) empty.style.display = "flex";
    return;
  }
  if (empty) empty.style.display = "none";
  renderGrid("wishlistGrid", products);
}

function renderWishlistInAccount() {
  const grid = document.getElementById("accWishlistGrid");
  if (!grid) return;
  const products = wishlist.map(id => getProductById(id)).filter(Boolean);
  if (!products.length) {
    grid.innerHTML = `<p class="hint">Your wishlist is empty.</p>`;
  } else {
    renderGrid("accWishlistGrid", products);
  }
}

// ── UTILITY ────────────────────────────────────────────
function setT(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
const setText2 = setT;
