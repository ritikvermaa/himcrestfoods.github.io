// =====================================================
// CHECKOUT.JS – Checkout, Payment & Order History
// HimCrest Foods – Production
// =====================================================

// ── ADDRESSES ─────────────────────────────────────────
let savedAddresses = [];
try { savedAddresses = JSON.parse(localStorage.getItem("hc_addresses") || "[]"); } catch { savedAddresses = []; }

function saveSavedAddresses() {
  localStorage.setItem("hc_addresses", JSON.stringify(savedAddresses));
}

// ── LOCAL ORDER BACKUP ─────────────────────────────────
let localOrders = [];
try { localOrders = JSON.parse(localStorage.getItem("hc_orders") || "[]"); } catch { localOrders = []; }

function saveLocalOrders() {
  localStorage.setItem("hc_orders", JSON.stringify(localOrders));
}

// ── PREVENT DUPLICATE SUBMISSIONS ─────────────────────
let orderInProgress = false;

// ── PAYMENT METHOD STATE ───────────────────────────────
let selectedPaymentMethod = "cod";

// ── CHECKOUT PAGE SETUP ────────────────────────────────
function setupCheckoutPage() {
  updateCheckoutSummary();
  loadSavedAddressIntoForm();
  prefillAuthFields();
  initPaymentOptions();

  // Load Razorpay script dynamically
  if (!window.Razorpay) {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    document.head.appendChild(script);
  }
}

function prefillAuthFields() {
  if (!currentUser) return;
  const nameEl  = document.getElementById("co_name");
  const emailEl = document.getElementById("co_email");
  const phoneEl = document.getElementById("co_phone");

  if (nameEl  && !nameEl.value  && currentUser.displayName) nameEl.value  = currentUser.displayName;
  if (emailEl && !emailEl.value && currentUser.email)       emailEl.value = currentUser.email;

  if (!DEMO_MODE && currentUser.uid && db) {
    getDocument("users", currentUser.uid).then(doc => {
      if (doc?.phone && phoneEl && !phoneEl.value) phoneEl.value = doc.phone.replace(/^\+91/, "");
    }).catch(() => {});
  }
}

function updateCheckoutSummary() {
  const listEl = document.getElementById("checkoutItemList");
  if (listEl) {
    listEl.innerHTML = cart.length
      ? cart.map(item => `
          <div class="co-item-row">
            <span>${item.emoji || "🌿"} ${item.name}${item.weight ? ` (${item.weight})` : ""} × ${item.qty}</span>
            <span>₹${item.price * item.qty}</span>
          </div>`).join("")
      : `<p class="hint">Your cart is empty.</p>`;
  }

  const subtotal = getCartSubtotal();
  const shipping = getCartShipping(subtotal);
  const discount = getCartDiscount(subtotal);

  setT3("coSubtotal", `₹${subtotal}`);
  setT3("coShipping", shipping === 0 ? "FREE 🎉" : `₹${shipping}`);
  setT3("coDiscount", discount > 0 ? `–₹${discount}` : "–₹0");
  setT3("coTotal",    `₹${getCartTotal()}`);
}

// ── ADDRESS ────────────────────────────────────────────
function loadSavedAddressIntoForm() {
  if (!savedAddresses.length) return;
  const addr = savedAddresses[0];
  const map  = { co_name:"name", co_phone:"phone", co_addr1:"address", co_city:"city", co_state:"state", co_pin:"pincode" };
  Object.entries(map).forEach(([fieldId, key]) => {
    const el = document.getElementById(fieldId);
    if (el && addr[key]) el.value = addr[key];
  });
}

function getAddressFromForm() {
  const addr1 = document.getElementById("co_addr1")?.value.trim() || "";
  const addr2 = document.getElementById("co_addr2")?.value.trim() || "";
  return {
    name:    document.getElementById("co_name")?.value.trim()  || "",
    phone:   document.getElementById("co_phone")?.value.trim() || "",
    email:   document.getElementById("co_email")?.value.trim() || currentUser?.email || "",
    address: addr2 ? `${addr1}, ${addr2}` : addr1,
    city:    document.getElementById("co_city")?.value.trim()  || "",
    state:   document.getElementById("co_state")?.value.trim() || "",
    pincode: document.getElementById("co_pin")?.value.trim()   || "",
  };
}

function validateAddress(addr) {
  if (!addr.name)                                              return "Please enter your full name.";
  if (!/^[6-9]\d{9}$/.test(addr.phone.replace(/\D/g, "")))   return "Please enter a valid 10-digit phone number.";
  if (!addr.email || !addr.email.includes("@"))               return "Please enter a valid email address.";
  if (!addr.address)                                          return "Please enter your delivery address.";
  if (!addr.city)                                             return "Please enter your city.";
  if (!addr.state)                                            return "Please enter your state.";
  if (!/^\d{6}$/.test(addr.pincode))                         return "Please enter a valid 6-digit pincode.";
  return null;
}

// ── PAYMENT METHOD ─────────────────────────────────────
function selectPayment(method) {
  selectedPaymentMethod = method;
  document.querySelectorAll(".payment-option").forEach(el => {
    el.classList.toggle("selected", el.dataset.method === method);
    const radio = el.querySelector("input[type='radio']");
    if (radio) radio.checked = radio.value === method;
  });
}

function initPaymentOptions() {
  // Load payment toggles from Firestore settings
  if (!DEMO_MODE && db) {
    getDocument("siteSettings", "main").then(settings => {
      const codEnabled    = settings?.codEnabled    !== false;
      const onlineEnabled = settings?.onlinePaymentEnabled !== false;

      const codOpt    = document.getElementById("payOptCOD");
      const onlineOpt = document.getElementById("payOptOnline");

      if (codOpt)    codOpt.style.display    = codEnabled    ? "" : "none";
      if (onlineOpt) onlineOpt.style.display = onlineEnabled ? "" : "none";

      // Default to first available method
      if (codEnabled) {
        setTimeout(() => selectPayment("cod"), 100);
      } else if (onlineEnabled) {
        setTimeout(() => selectPayment("online"), 100);
      }
    }).catch(() => {
      setTimeout(() => selectPayment("cod"), 100);
    });
  } else {
    setTimeout(() => selectPayment("cod"), 100);
  }
}

// ── PLACE ORDER ────────────────────────────────────────
async function placeOrder() {
  if (orderInProgress) { showToast("Order is being processed…", "info"); return; }
  if (!cart.length)    { showToast("Your cart is empty!", "error");        return; }

  const address         = getAddressFromForm();
  const validationError = validateAddress(address);
  if (validationError)  { showToast(validationError, "error");             return; }

  // Save address
  savedAddresses = [address, ...savedAddresses.filter(a => a.phone !== address.phone)].slice(0, 5);
  saveSavedAddresses();

  const total = getCartTotal();

  if (selectedPaymentMethod === "cod") {
    orderInProgress = true;
    await confirmOrder(address, "COD", "pending");
    orderInProgress = false;
  } else {
    orderInProgress = true;
    await initiateOnlinePayment(address, total);
  }
}

// ── CONFIRM ORDER ──────────────────────────────────────
async function confirmOrder(address, paymentMethod, paymentStatus, transactionId = "") {
  const orderId  = "HC" + Date.now().toString().slice(-8).toUpperCase();
  const subtotal = getCartSubtotal();
  const shipping = getCartShipping(subtotal);
  const discount = getCartDiscount(subtotal);
  const total    = getCartTotal();

  const orderData = {
    orderId,
    userId:          currentUser?.uid  || "guest",
    customerName:    address.name,
    customerEmail:   address.email,
    customerPhone:   address.phone,
    shippingAddress: address,
    items: cart.map(i => ({
      id:      i.id,
      cartKey: i.cartKey,
      name:    i.name,
      emoji:   i.emoji,
      price:   i.price,
      mrp:     i.mrp || null,
      qty:     i.qty,
      weight:  i.weight || "",
      variant: i.weight || "",
      lineTotal: i.price * i.qty,
    })),
    subtotal,
    shipping,
    discount,
    total,
    coupon:        appliedCoupon?.code || null,
    paymentMethod,
    paymentStatus,
    transactionId,
    orderStatus:   "confirmed",
    tracking:      "",
    courier:       "",
    notes:         "",
    createdAt:     new Date().toISOString(),
  };

  // Save to Firestore
  let firestoreId = null;
  if (!DEMO_MODE && db && currentUser?.uid) {
    try {
      firestoreId = await addDocument("orders", orderData);
      orderData.firestoreId = firestoreId;
    } catch (e) {
      console.warn("Firestore order save failed:", e);
    }
  }

  // Local backup
  localOrders.unshift(orderData);
  saveLocalOrders();

  // Clear cart
  cart            = [];
  appliedCoupon   = null;
  orderInProgress = false;
  saveCart();
  updateCartUI();

  // Show success
  setT3("successOrderId", orderId);
  showPage("orderSuccess");
  showToast("Order placed successfully! 🎉", "success");
}

// ── RAZORPAY ──────────────────────────────────────────
async function initiateOnlinePayment(address, amount) {
  let rzpKey = "";
  if (!DEMO_MODE && db) {
    try {
      const settings = await getDocument("siteSettings", "main");
      rzpKey = settings?.razorpayKey || "";
    } catch { /* fallback */ }
  }
  if (!rzpKey) rzpKey = localStorage.getItem("hc_rzp_key") || "";

  if (!rzpKey || !window.Razorpay) {
    showToast("Payment gateway not configured. Please use COD.", "warning");
    orderInProgress = false;
    selectPayment("cod");
    return;
  }

  const options = {
    key:         rzpKey,
    amount:      amount * 100,
    currency:    "INR",
    name:        "HimCrest Foods",
    description: "Healthy Snacks Order",
    handler: async function (response) {
      showToast("Payment successful! ✅", "success");
      await confirmOrder(address, "Razorpay", "paid", response.razorpay_payment_id);
      orderInProgress = false;
    },
    prefill: { name: address.name, email: address.email, contact: address.phone },
    theme:   { color: "#2A5F2E" },
    modal: {
      ondismiss: function () {
        orderInProgress = false;
        showToast("Payment cancelled.", "warning");
      }
    }
  };

  try {
    new window.Razorpay(options).open();
  } catch {
    orderInProgress = false;
    showToast("Payment gateway error. Please try COD.", "error");
  }
}

// ── USER ORDER HISTORY ──────────────────────────────────
async function loadUserOrders() {
  const container = document.getElementById("ordersList");
  if (!container) return;
  container.innerHTML = `<p class="hint">Loading orders…</p>`;

  let orders = [...localOrders];

  if (!DEMO_MODE && db && currentUser?.uid) {
    try {
      const fsOrders = await getCollection(
        "orders",
        [{ field: "userId", op: "==", value: currentUser.uid }],
        "createdAt", "desc"
      );
      fsOrders.forEach(fo => {
        if (!orders.find(o => o.orderId === fo.orderId)) orders.push(fo);
      });
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch { /* use local */ }
  }

  // Filter to current user's orders only
  if (currentUser?.uid) {
    orders = orders.filter(o => o.userId === currentUser.uid || o.userId === "guest");
  }

  if (!orders.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-emoji">📦</div>
        <h3>No orders yet</h3>
        <p>Start shopping to see your orders here.</p>
        <button class="btn btn-primary" onclick="showPage('shop')">Shop Now</button>
      </div>`;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <strong>Order #${order.orderId}</strong>
          <p class="hint">${formatDate(order.createdAt)}</p>
        </div>
        <span class="order-status status-${order.orderStatus}">${order.orderStatus}</span>
      </div>
      <div class="order-items-preview">
        ${(order.items || []).map(i => `<span>${i.emoji || "🌿"} ${i.name}${i.weight ? ` (${i.weight})` : ""} × ${i.qty}</span>`).join(" · ")}
      </div>
      <div class="order-card-footer">
        <span>Total: <strong>₹${order.total}</strong></span>
        <span>${order.paymentMethod}</span>
        ${order.tracking ? `<span>🚚 ${order.tracking}</span>` : ""}
        <button class="btn btn-sm btn-outline" onclick="reorder('${order.orderId}')">Reorder</button>
      </div>
    </div>`).join("");
}

function reorder(orderId) {
  const order = localOrders.find(o => o.orderId === orderId);
  if (!order) { showToast("Order not found in local cache.", "error"); return; }
  order.items.forEach(item => {
    const cartKey = item.cartKey || (item.weight ? `${item.id}_${item.weight}` : item.id);
    const existing = cart.find(c => c.cartKey === cartKey);
    if (existing) existing.qty = Math.min(existing.qty + item.qty, 20);
    else cart.push({ ...item, cartKey });
  });
  saveCart();
  updateCartUI();
  showToast("Items added back to your cart! 🛒", "success");
  showPage("cart");
}

// ── SAVED ADDRESSES ────────────────────────────────────
function loadUserAddresses() {
  const container = document.getElementById("addressesList");
  if (!container) return;
  if (!savedAddresses.length) {
    container.innerHTML = `<p class="hint">No saved addresses yet. Your delivery address will be saved after your first order.</p>`;
    return;
  }
  container.innerHTML = savedAddresses.map((addr, i) => `
    <div class="address-card">
      <div>
        <strong>${addr.name}</strong>
        <p>${addr.address}, ${addr.city}, ${addr.state} – ${addr.pincode}</p>
        <p>${addr.phone}</p>
      </div>
      <button class="btn btn-sm btn-outline" onclick="deleteAddress(${i})">Remove</button>
    </div>`).join("");
}

function deleteAddress(index) {
  savedAddresses.splice(index, 1);
  saveSavedAddresses();
  loadUserAddresses();
}

// ── UTILITY ────────────────────────────────────────────
function setT3(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
const setText3 = setT3;

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return iso || ""; }
}
