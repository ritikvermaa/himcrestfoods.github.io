// =====================================================
// ADMIN.JS – Admin Panel (Full Firestore CMS)
// HimCrest Foods – Production
// Updated: File upload removed. URL-based media only.
// =====================================================

// ── ADMIN TAB SWITCHER ────────────────────────────────
function switchAdminTab(tab, li) {
  document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".admin-nav li").forEach(l => l.classList.remove("active"));

  const tabEl = document.getElementById(`admin-tab-${tab}`);
  if (tabEl) tabEl.classList.add("active");
  if (li)    li.classList.add("active");

  const loaders = {
    "dashboard":          loadAdminDashboard,
    "products-admin":     loadAdminProducts,
    "orders-admin":       loadAdminOrders,
    "users-admin":        loadAdminUsers,
    "coupons-admin":      loadAdminCoupons,
    "contact-admin":      loadAdminContacts,
    "faq-admin":          loadAdminFAQs,
    "testimonials-admin": loadAdminTestimonials,
    "settings-admin":     loadAdminSettings,
    "banners-admin":      loadAdminBanners,
    "policies-admin":     loadAdminPolicies,
  };
  if (loaders[tab]) loaders[tab]();
}

function exitAdmin() { showPage("home"); }

// ── DASHBOARD ──────────────────────────────────────────
async function loadAdminDashboard() {
  const dateEl = document.getElementById("adminDate");
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString("en-IN", {
    weekday:"long", day:"numeric", month:"long", year:"numeric"
  });

  let orders = [...localOrders];
  if (!DEMO_MODE && db) {
    try {
      const fsOrders = await getCollection("orders", [], "createdAt", "desc");
      if (fsOrders.length) {
        fsOrders.forEach(fo => {
          if (!orders.find(o => o.orderId === fo.orderId)) orders.push(fo);
        });
        orders.forEach(o => {
          if (!localOrders.find(lo => lo.orderId === o.orderId)) localOrders.unshift(o);
        });
        saveLocalOrders();
      }
    } catch { /* use local */ }
  }

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const pending      = orders.filter(o => ["confirmed","processing"].includes(o.orderStatus)).length;
  const delivered    = orders.filter(o => o.orderStatus === "delivered").length;

  setText4("statRevenue",   `₹${totalRevenue.toLocaleString("en-IN")}`);
  setText4("statOrders",    orders.length);
  setText4("statPending",   pending);
  setText4("statDelivered", delivered);
  setText4("statProducts",  allProducts.length);

  if (!DEMO_MODE && db) {
    getCollection("users").then(users => setText4("statUsers", users.length)).catch(() => {});
  }

  const recentEl = document.getElementById("recentOrdersList");
  if (recentEl) {
    recentEl.innerHTML = orders.length
      ? orders.slice(0, 5).map(o => `
          <div class="recent-order-row">
            <div>
              <strong>#${o.orderId}</strong>
              <p class="hint">${o.customerName || "Guest"} · ${formatDate(o.createdAt)}</p>
            </div>
            <div style="text-align:right">
              <strong>₹${o.total}</strong>
              <p><span class="order-status status-${o.orderStatus}">${o.orderStatus}</span></p>
            </div>
          </div>`).join("")
      : `<p class="hint">No orders yet.</p>`;
  }

  const lowStockEl = document.getElementById("lowStockList");
  if (lowStockEl) {
    const low = allProducts.filter(p => (p.stock || 0) <= 10 && !p.outOfStock);
    lowStockEl.innerHTML = low.length
      ? low.map(p => `
          <div class="low-stock-row">
            <span>${p.emoji || "🌿"} ${escapeHtml(p.name)}</span>
            <span class="badge-red">${p.stock} left</span>
          </div>`).join("")
      : `<p class="hint">All products well stocked. ✅</p>`;
  }
}

// ── PRODUCTS ADMIN ──────────────────────────────────────
function loadAdminProducts() {
  const tbody = document.getElementById("adminProductBody");
  if (!tbody) return;

  if (!allProducts.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="hint" style="padding:20px;text-align:center">No products yet. Add your first product!</td></tr>`;
    return;
  }

  tbody.innerHTML = allProducts.map(p => {
    // Use first image from images array or fallback to image field
    const displayImg = (p.images && p.images[0]) || p.image || "";
    return `
    <tr>
      <td style="text-align:center">
        ${displayImg
          ? `<img src="${displayImg}" alt="${escapeHtml(p.name)}" style="width:44px;height:44px;object-fit:cover;border-radius:6px">`
          : `<span style="font-size:1.8rem">${p.emoji || "🌿"}</span>`}
      </td>
      <td><strong>${escapeHtml(p.name)}</strong><br><small class="hint">${escapeHtml(p.weight || "")}</small></td>
      <td>${getCatLabel(p.category)}</td>
      <td>₹${p.price}</td>
      <td>₹${p.mrp || "–"}</td>
      <td><span class="${(p.stock || 0) < 10 ? "badge-red" : "badge-green"}">${p.outOfStock ? "OOS" : (p.stock || 0)}</span></td>
      <td style="font-size:11px;white-space:nowrap">
        ${p.bestseller ? "⭐ " : ""}${p.newArrival ? "✨ " : ""}${p.offer ? "🔥 " : ""}${p.outOfStock ? "❌" : ""}
      </td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn btn-sm" style="background:var(--amber-primary);color:#fff;margin-left:4px" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>`;
  }).join("");
}

// ── PRODUCT MODAL ──────────────────────────────────────
function openProductModal(productId = null) {
  const overlay = document.getElementById("productModalOverlay");
  const modal   = document.getElementById("productModal");
  if (!overlay || !modal) return;

  overlay.style.display = "block";
  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  if (productId) {
    setText4("productModalTitle", "Edit Product");
    const idField = document.getElementById("editProductId");
    if (idField) idField.value = productId;
    // Clear previews first, then populate
    clearMediaPreviews();
    populateProductModal(productId);
  } else {
    setText4("productModalTitle", "Add New Product");
    const idField = document.getElementById("editProductId");
    if (idField) idField.value = "";
    // Clear all form fields
    const fields = ["pm_name","pm_subtitle","pm_image","pm_image2","pm_image3","pm_image4",
      "pm_video","pm_emoji","pm_description","pm_ingredients","pm_benefits",
      "pm_howto","pm_shelf","pm_storage","pm_delivery","pm_nutrition","pm_variants"];
    fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    const numFields = ["pm_price","pm_mrp","pm_stock","pm_weight","pm_rating"];
    numFields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    // Reset checkboxes
    ["pm_bestseller","pm_newArrival","pm_offer","pm_outOfStock"].forEach(id => {
      const el = document.getElementById(id); if (el) el.checked = false;
    });
    // Reset category
    const cat = document.getElementById("pm_category"); if (cat) cat.value = "fruit-snacks";
    clearMediaPreviews();
  }
}


function editProduct(productId) { openProductModal(productId); }

function populateProductModal(productId) {
  const p = getProductById(productId);
  if (!p) return;

  // Basic fields
  const fields = {
    pm_name: p.name, pm_subtitle: p.subtitle, pm_category: p.category,
    pm_price: p.price, pm_mrp: p.mrp, pm_stock: p.stock,
    pm_weight: p.weight, pm_rating: p.rating,
    pm_emoji: p.emoji,
    pm_description: p.description, pm_ingredients: p.ingredients,
    pm_benefits: p.benefits, pm_howto: p.howTo,
    pm_shelf: p.shelfLife, pm_storage: p.storage,
    pm_delivery: p.deliveryNote || "",
  };

  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  });

  // Nutrition JSON
  if (p.nutrition) {
    const nutrEl = document.getElementById("pm_nutrition");
    if (nutrEl) nutrEl.value = JSON.stringify(p.nutrition, null, 2);
  }

  // Variants JSON
  const variantsEl = document.getElementById("pm_variants");
  if (variantsEl && p.variants) {
    variantsEl.value = JSON.stringify(p.variants, null, 2);
  }

  // Checkboxes
  ["pm_bestseller","pm_newArrival","pm_offer","pm_outOfStock"].forEach(id => {
    const el = document.getElementById(id);
    const key = id.replace("pm_", "");
    if (el) el.checked = !!p[key];
  });

  // ── Media URLs ──────────────────────────────────────
  // Main image: use p.image for backward compat
  const mainImg = (p.images && p.images[0]) || p.image || "";
  const img2    = (p.images && p.images[1]) || "";
  const img3    = (p.images && p.images[2]) || "";
  const img4    = (p.images && p.images[3]) || "";

  setInputVal("pm_image",  mainImg);
  setInputVal("pm_image2", img2);
  setInputVal("pm_image3", img3);
  setInputVal("pm_image4", img4);
  setInputVal("pm_video",  p.video || "");

  // Show previews for filled URLs
  if (mainImg) previewUrlImage("pm_image",  "pmImg0Preview");
  if (img2)    previewUrlImage("pm_image2", "pmImg2Preview");
  if (img3)    previewUrlImage("pm_image3", "pmImg3Preview");
  if (img4)    previewUrlImage("pm_image4", "pmImg4Preview");
  if (p.video) previewUrlVideo("pm_video",  "pmVideoPreview");
}

function setInputVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function clearMediaPreviews() {
  ["pmImg0Preview","pmImg2Preview","pmImg3Preview","pmImg4Preview","pmVideoPreview"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
}

// ── MEDIA PREVIEW HELPERS ─────────────────────────────
function previewUrlImage(inputId, previewId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!preview) return;
  const url = input?.value.trim() || "";
  if (!url) { preview.innerHTML = ""; return; }
  preview.innerHTML = `<img src="${url}" alt="Preview"
    style="max-width:140px;max-height:110px;border-radius:8px;margin-top:6px;object-fit:cover;border:1px solid var(--border-light)"
    onerror="this.parentElement.innerHTML='<span style=\\'font-size:12px;color:#e53e3e\\'>⚠️ Could not load image</span>'">`;
}

function previewUrlVideo(inputId, previewId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  if (!preview) return;
  const url = input?.value.trim() || "";
  if (!url) { preview.innerHTML = ""; return; }
  preview.innerHTML = `<video src="${url}" controls
    style="max-width:200px;max-height:140px;border-radius:8px;margin-top:6px"
    onerror="this.parentElement.innerHTML='<span style=\\'font-size:12px;color:#e53e3e\\'>⚠️ Could not load video</span>'">
  </video>`;
}

function showMediaPreview(containerId, url, type = "image") {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (type === "image") {
    container.innerHTML = `<img src="${url}" alt="Preview" style="max-width:160px;max-height:120px;border-radius:8px;margin-top:8px">`;
  } else if (type === "video") {
    container.innerHTML = `<video src="${url}" controls style="max-width:200px;max-height:140px;border-radius:8px;margin-top:8px"></video>`;
  }
}

function closeProductModal() {
  const overlay = document.getElementById("productModalOverlay");
  const modal   = document.getElementById("productModal");
  if (overlay) overlay.style.display = "none";
  if (modal)   modal.classList.remove("open");
  document.body.style.overflow = "";
}

// ── SAVE PRODUCT (URL-based media) ────────────────────
async function saveProductFromModal(event) {
  event.preventDefault();

  const editId  = document.getElementById("editProductId")?.value.trim();
  const saveBtn = event.target;
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Saving…"; }

  let nutrition = {};
  try { nutrition = JSON.parse(document.getElementById("pm_nutrition")?.value || "{}"); } catch { nutrition = {}; }

  let variants = [];
  try { variants = JSON.parse(document.getElementById("pm_variants")?.value || "[]"); } catch { variants = []; }

  // Collect all image URLs
  const img1 = document.getElementById("pm_image")?.value.trim() || "";
  const img2 = document.getElementById("pm_image2")?.value.trim() || "";
  const img3 = document.getElementById("pm_image3")?.value.trim() || "";
  const img4 = document.getElementById("pm_image4")?.value.trim() || "";
  const images = [img1, img2, img3, img4].filter(Boolean);
  const video  = document.getElementById("pm_video")?.value.trim() || "";

  const productData = {
    name:        document.getElementById("pm_name")?.value.trim() || "",
    subtitle:    document.getElementById("pm_subtitle")?.value.trim() || "",
    category:    document.getElementById("pm_category")?.value || "fruit-snacks",
    price:       parseFloat(document.getElementById("pm_price")?.value) || 0,
    mrp:         parseFloat(document.getElementById("pm_mrp")?.value) || null,
    stock:       parseInt(document.getElementById("pm_stock")?.value) || 100,
    weight:      document.getElementById("pm_weight")?.value.trim() || "",
    rating:      parseFloat(document.getElementById("pm_rating")?.value) || 4.5,
    image:       img1,        // backward-compat single image field
    images:      images,      // new gallery array
    video:       video,       // new optional video field
    emoji:       document.getElementById("pm_emoji")?.value.trim() || "🌿",
    description: document.getElementById("pm_description")?.value.trim() || "",
    ingredients: document.getElementById("pm_ingredients")?.value.trim() || "",
    benefits:    document.getElementById("pm_benefits")?.value.trim() || "",
    howTo:       document.getElementById("pm_howto")?.value.trim() || "",
    shelfLife:   document.getElementById("pm_shelf")?.value.trim() || "",
    storage:     document.getElementById("pm_storage")?.value.trim() || "",
    deliveryNote:document.getElementById("pm_delivery")?.value.trim() || "",
    nutrition,
    variants,
    bestseller:  !!document.getElementById("pm_bestseller")?.checked,
    newArrival:  !!document.getElementById("pm_newArrival")?.checked,
    offer:       !!document.getElementById("pm_offer")?.checked,
    outOfStock:  !!document.getElementById("pm_outOfStock")?.checked,
  };

  if (!productData.name) {
    showToast("Product name is required.", "error");
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "💾 Save Product"; }
    return;
  }

  try {
    if (editId) {
      const idx = allProducts.findIndex(p => p.id === editId);
      if (idx !== -1) allProducts[idx] = { ...allProducts[idx], ...productData };
      if (!DEMO_MODE && db) await setDocument("products", editId, productData);
      showToast("Product updated! ✅", "success");
    } else {
      const newId = "prod_" + Date.now();
      productData.id = newId;
      allProducts.push({ id: newId, reviews: 0, ...productData });
      if (!DEMO_MODE && db) await setDocument("products", newId, { ...productData, reviews: 0 });
      showToast("Product added! 🌿", "success");
    }
  } catch (e) {
    showToast("Could not save product. Please try again.", "error");
    console.error(e);
  }

  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "💾 Save Product"; }
  closeProductModal();
  loadAdminProducts();
  renderHomeSections();
  renderShopGrid();
}

// Keep old saveProduct as alias for backward compat if called from HTML
async function saveProduct(event) { return saveProductFromModal(event); }

async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
  allProducts = allProducts.filter(p => p.id !== productId);
  if (!DEMO_MODE && db) { try { await deleteDocument("products", productId); } catch { /* ignore */ } }
  showToast("Product deleted.", "info");
  loadAdminProducts();
  renderShopGrid();
}

// ── ORDERS ADMIN ────────────────────────────────────────
let adminOrdersCache = [];

async function loadAdminOrders() {
  const tbody = document.getElementById("adminOrderBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="8" class="hint" style="padding:20px;text-align:center">Loading orders…</td></tr>`;

  let orders = [...localOrders];

  if (!DEMO_MODE && db) {
    try {
      const fsOrders = await getCollection("orders", [], "createdAt", "desc");
      fsOrders.forEach(fo => {
        if (!orders.find(o => o.orderId === fo.orderId)) orders.push(fo);
      });
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      fsOrders.forEach(o => {
        if (!localOrders.find(lo => lo.orderId === o.orderId)) localOrders.unshift(o);
      });
      saveLocalOrders();
    } catch { /* use local */ }
  }

  adminOrdersCache = orders;

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="hint" style="padding:20px;text-align:center">No orders yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>#${escapeHtml(o.orderId)}</strong></td>
      <td>${escapeHtml(o.customerName || "Guest")}<br><small>${escapeHtml(o.customerPhone || "")}</small></td>
      <td>${(o.items || []).length} item(s)</td>
      <td>₹${o.total}</td>
      <td>${escapeHtml(o.paymentMethod || "–")}</td>
      <td>
        <select class="sort-select" style="font-size:12px;padding:4px 8px"
          onchange="updateOrderStatus('${o.orderId}', this.value)">
          ${["confirmed","processing","shipped","delivered","cancelled","refunded"].map(s =>
            `<option value="${s}" ${o.orderStatus === s ? "selected" : ""}>${s}</option>`
          ).join("")}
        </select>
      </td>
      <td>${formatDate(o.createdAt)}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openOrderDetailModal('${o.orderId}')">View</button>
      </td>
    </tr>`).join("");
}

async function updateOrderStatus(orderId, status) {
  const order = adminOrdersCache.find(o => o.orderId === orderId) || localOrders.find(o => o.orderId === orderId);
  if (!order) return;
  order.orderStatus = status;

  const localIdx = localOrders.findIndex(o => o.orderId === orderId);
  if (localIdx !== -1) localOrders[localIdx].orderStatus = status;
  saveLocalOrders();

  if (!DEMO_MODE && db) {
    try {
      const results = await getCollection("orders", [{ field:"orderId", op:"==", value:orderId }]);
      if (results.length) await updateDocument("orders", results[0].id, { orderStatus: status });
    } catch { /* ignore */ }
  }

  showToast(`Order #${orderId} → "${status}" ✅`, "success");
}

function openOrderDetailModal(orderId) {
  const order = adminOrdersCache.find(o => o.orderId === orderId) || localOrders.find(o => o.orderId === orderId);
  if (!order) return;

  const overlay = document.getElementById("orderDetailOverlay");
  const content = document.getElementById("orderDetailContent");
  if (!overlay || !content) {
    alert(`Order: #${order.orderId}\nCustomer: ${order.customerName} (${order.customerPhone})\nTotal: ₹${order.total}\nStatus: ${order.orderStatus}`);
    return;
  }

  content.innerHTML = `
    <h3>Order #${escapeHtml(order.orderId)}</h3>
    <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
    <hr style="margin:12px 0">
    <p><strong>Customer:</strong> ${escapeHtml(order.customerName)} | ${escapeHtml(order.customerPhone)} | ${escapeHtml(order.customerEmail || "")}</p>
    <p><strong>Address:</strong> ${escapeHtml(order.shippingAddress?.address || "")}, ${escapeHtml(order.shippingAddress?.city || "")}, ${escapeHtml(order.shippingAddress?.state || "")} – ${escapeHtml(order.shippingAddress?.pincode || "")}</p>
    <hr style="margin:12px 0">
    <p><strong>Items:</strong></p>
    <ul style="margin:8px 0 12px 20px">
      ${(order.items || []).map(i => `<li>${escapeHtml(i.name)}${i.weight ? ` (${escapeHtml(i.weight)})` : ""} × ${i.qty} = ₹${i.price * i.qty}</li>`).join("")}
    </ul>
    <p><strong>Subtotal:</strong> ₹${order.subtotal} | <strong>Shipping:</strong> ₹${order.shipping} | <strong>Discount:</strong> –₹${order.discount}</p>
    <p><strong>Total:</strong> ₹${order.total} | <strong>Payment:</strong> ${escapeHtml(order.paymentMethod)} | <strong>Status:</strong> ${escapeHtml(order.paymentStatus || "")}</p>
    ${order.tracking ? `<p><strong>Tracking:</strong> ${escapeHtml(order.tracking)} (${escapeHtml(order.courier || "")})</p>` : ""}
    <div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap">
      <div>
        <label style="font-size:13px;font-weight:600">Tracking Number</label>
        <input type="text" id="orderTrackingInput" placeholder="AWB12345678" value="${escapeHtml(order.tracking || "")}"
          style="display:block;margin-top:4px;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;width:200px">
      </div>
      <div>
        <label style="font-size:13px;font-weight:600">Courier</label>
        <input type="text" id="orderCourierInput" placeholder="Delhivery / DTDC" value="${escapeHtml(order.courier || "")}"
          style="display:block;margin-top:4px;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;width:200px">
      </div>
    </div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="saveOrderTracking('${orderId}')">Save Tracking</button>`;

  overlay.style.display = "block";
  document.getElementById("orderDetailModal")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

async function saveOrderTracking(orderId) {
  const tracking = document.getElementById("orderTrackingInput")?.value.trim() || "";
  const courier  = document.getElementById("orderCourierInput")?.value.trim() || "";

  const order = adminOrdersCache.find(o => o.orderId === orderId) || localOrders.find(o => o.orderId === orderId);
  if (order) { order.tracking = tracking; order.courier = courier; }

  const localIdx = localOrders.findIndex(o => o.orderId === orderId);
  if (localIdx !== -1) { localOrders[localIdx].tracking = tracking; localOrders[localIdx].courier = courier; }
  saveLocalOrders();

  if (!DEMO_MODE && db) {
    try {
      const results = await getCollection("orders", [{ field:"orderId", op:"==", value:orderId }]);
      if (results.length) await updateDocument("orders", results[0].id, { tracking, courier });
    } catch { /* ignore */ }
  }

  showToast("Tracking info saved! 📦", "success");
  closeOrderDetailModal();
}

function closeOrderDetailModal() {
  document.getElementById("orderDetailOverlay")?.setAttribute("style", "display:none");
  document.getElementById("orderDetailModal")?.classList.remove("open");
  document.body.style.overflow = "";
}

// ── USERS ADMIN ─────────────────────────────────────────
async function loadAdminUsers() {
  const tbody = document.getElementById("adminUserBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="5" class="hint" style="padding:20px;text-align:center">Loading…</td></tr>`;

  let users = [];
  if (!DEMO_MODE && db) {
    try { users = await getCollection("users"); } catch { }
  }

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="hint" style="padding:20px;text-align:center">No registered users yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const orderCount = localOrders.filter(o => o.userId === u.id).length;
    return `
      <tr>
        <td>${escapeHtml(u.name || "–")}</td>
        <td>${escapeHtml(u.email || "–")}</td>
        <td>${escapeHtml(u.phone || "–")}</td>
        <td>
          ${u.emailVerified ? '<span class="badge-green">✅ Email</span>' : '<span class="badge-red">⚠️ Email</span>'}
        </td>
        <td><span class="${u.role === "admin" ? "badge-green" : ""}">${u.role || "user"}</span></td>
        <td>${orderCount}</td>
      </tr>`;
  }).join("");
}

// ── COUPONS ADMIN ───────────────────────────────────────
let adminCoupons = [];

async function loadAdminCoupons() {
  const tbody = document.getElementById("adminCouponBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="hint" style="padding:20px;text-align:center">Loading…</td></tr>`;

  if (!DEMO_MODE && db) {
    try {
      const fromDB = await getCollection("coupons");
      if (fromDB.length) adminCoupons = fromDB;
    } catch { /* empty */ }
  }

  if (!adminCoupons.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="hint" style="padding:20px;text-align:center">No coupons yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminCoupons.map((c, i) => `
    <tr>
      <td><code>${escapeHtml(c.code)}</code></td>
      <td>${c.type === "percent" ? "Percentage" : "Flat"}</td>
      <td>${c.type === "percent" ? c.value + "%" : "₹" + c.value}</td>
      <td>₹${c.minOrder || 0}</td>
      <td>${c.expiry ? formatDate(c.expiry) : "No expiry"}</td>
      <td>
        <span class="${c.active !== false ? "badge-green" : "badge-red"}">${c.active !== false ? "Active" : "Inactive"}</span>
        <button class="btn btn-sm" style="background:var(--amber-primary);color:#fff;margin-left:8px"
          onclick="deleteCoupon('${c.id || ""}', ${i})">Delete</button>
      </td>
    </tr>`).join("");
}

function openCouponModal() {
  document.getElementById("couponModalOverlay")?.setAttribute("style", "display:block");
  document.getElementById("couponModal")?.classList.add("open");
  document.body.style.overflow = "hidden";
  ["cm_code","cm_value","cm_expiry"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
  const moEl = document.getElementById("cm_minorder");
  if (moEl) moEl.value = "0";
}

function closeCouponModal() {
  document.getElementById("couponModalOverlay")?.setAttribute("style", "display:none");
  document.getElementById("couponModal")?.classList.remove("open");
  document.body.style.overflow = "";
}

async function saveCoupon() {
  const code     = document.getElementById("cm_code")?.value.trim().toUpperCase();
  const type     = document.getElementById("cm_type")?.value || "percent";
  const value    = parseFloat(document.getElementById("cm_value")?.value);
  const minOrder = parseFloat(document.getElementById("cm_minorder")?.value) || 0;
  const expiry   = document.getElementById("cm_expiry")?.value || "";

  if (!code || !value) { showToast("Please fill in all coupon fields.", "error"); return; }

  const coupon = { code, type, value, minOrder, expiry, active: true };
  adminCoupons.push(coupon);

  if (!DEMO_MODE && db) { try { await addDocument("coupons", coupon); } catch { /* ignore */ } }

  closeCouponModal();
  loadAdminCoupons();
  showToast(`Coupon ${code} added! 🏷️`, "success");
}

async function deleteCoupon(firestoreId, index) {
  if (!confirm("Delete this coupon?")) return;
  adminCoupons.splice(index, 1);
  if (!DEMO_MODE && db && firestoreId) { try { await deleteDocument("coupons", firestoreId); } catch { /* ignore */ } }
  loadAdminCoupons();
  showToast("Coupon deleted.", "info");
}

// ── BANNERS ADMIN ──────────────────────────────────────
let adminBanners = [];

async function loadAdminBanners() {
  const container = document.getElementById("bannerList");
  if (!container) return;
  container.innerHTML = `<p class="hint">Loading banners…</p>`;

  if (!DEMO_MODE && db) {
    try { adminBanners = await getCollection("banners", [], "order", "asc"); } catch { }
  }

  let listHtml = "";
  if (!adminBanners.length) {
    listHtml = `<p class="hint" style="margin-bottom:16px">No banners yet. Add a banner below.</p>`;
  } else {
    listHtml = adminBanners.map((b, i) => `
      <div class="admin-faq-card" style="margin-bottom:16px">
        <div class="faq-edit-header">
          <strong>Banner ${i + 1}: ${escapeHtml(b.title || "Untitled")}</strong>
          <span style="margin-left:auto;display:flex;gap:8px">
            <span class="${b.active !== false ? "badge-green" : "badge-red"}">${b.active !== false ? "Active" : "Hidden"}</span>
            <button class="btn btn-sm" style="background:var(--amber-primary);color:#fff"
              onclick="deleteBanner('${b.id}')">Delete</button>
          </span>
        </div>
        ${b.image ? `<img src="${b.image}" alt="Banner" style="max-width:100%;max-height:120px;border-radius:8px;margin:8px 0">` : ""}
        <p><strong>Subtitle:</strong> ${escapeHtml(b.subtitle || "")}</p>
        <p><strong>CTA:</strong> ${escapeHtml(b.ctaText || "")} → ${escapeHtml(b.ctaLink || "")}</p>
      </div>`).join("");
  }

  container.innerHTML = listHtml + `
    <div style="margin-top:24px;padding:20px;background:var(--surface);border-radius:12px;border:1px solid var(--border-color)">
      <h4 style="margin-bottom:16px">Add New Banner</h4>
      <div class="pm-grid">
        <div class="form-group"><label>Title</label><input type="text" id="bn_title" placeholder="Healthy Snacking…"></div>
        <div class="form-group"><label>Subtitle</label><input type="text" id="bn_subtitle" placeholder="Premium dehydrated fruits…"></div>
        <div class="form-group"><label>CTA Button Text</label><input type="text" id="bn_cta" placeholder="Shop Now"></div>
        <div class="form-group"><label>CTA Link / Category</label><input type="text" id="bn_link" placeholder="shop / fruit-snacks / p1"></div>
      </div>
      <div class="form-group">
        <label>Banner Image URL</label>
        <input type="url" id="bn_image" placeholder="https://… paste a direct image URL"
          oninput="showMediaPreview('bnImagePreview', this.value, 'image')">
        <div id="bnImagePreview"></div>
      </div>
      <button class="btn btn-primary" onclick="saveBanner()" style="margin-top:12px">Add Banner</button>
    </div>`;
}

async function saveBanner() {
  const title    = document.getElementById("bn_title")?.value.trim()    || "";
  const subtitle = document.getElementById("bn_subtitle")?.value.trim() || "";
  const ctaText  = document.getElementById("bn_cta")?.value.trim()      || "Shop Now";
  const ctaLink  = document.getElementById("bn_link")?.value.trim()     || "shop";
  const imageUrl = document.getElementById("bn_image")?.value.trim()    || "";

  if (!title) { showToast("Banner title is required.", "error"); return; }

  const banner = { title, subtitle, ctaText, ctaLink, image: imageUrl, active: true, order: adminBanners.length };

  if (!DEMO_MODE && db) { try { await addDocument("banners", banner); } catch { showToast("Could not save banner.", "error"); return; } }

  showToast("Banner added! 🖼️", "success");
  loadAdminBanners();
}

async function deleteBanner(id) {
  if (!confirm("Delete this banner?")) return;
  adminBanners = adminBanners.filter(b => b.id !== id);
  if (!DEMO_MODE && db) { try { await deleteDocument("banners", id); } catch { /* ignore */ } }
  showToast("Banner deleted.", "info");
  loadAdminBanners();
}

// ── CONTACT INQUIRIES ──────────────────────────────────
async function loadAdminContacts() {
  const container = document.getElementById("adminContactList");
  if (!container) return;

  let contacts = [];
  if (!DEMO_MODE && db) { try { contacts = await getCollection("contactMessages", [], "createdAt", "desc"); } catch { } }

  if (!contacts.length) {
    container.innerHTML = `<p class="hint" style="padding:20px">No inquiries yet.</p>`;
    return;
  }

  container.innerHTML = contacts.map(c => `
    <div style="border:1px solid var(--border-color);border-radius:10px;padding:16px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px">
        <div>
          <strong>${escapeHtml(c.name)}</strong> ·
          <span>${escapeHtml(c.email)}</span> ·
          <span>${escapeHtml(c.phone || "")}</span>
        </div>
        <span class="hint">${formatDate(c.createdAt)}</span>
      </div>
      ${c.subject ? `<p><strong>Subject:</strong> ${escapeHtml(c.subject)}</p>` : ""}
      <p style="margin-top:4px">${escapeHtml(c.message || "")}</p>
      <div style="margin-top:8px;display:flex;gap:8px">
        <span class="${c.resolved ? "badge-green" : "badge-red"}">${c.resolved ? "Resolved" : "Open"}</span>
        ${!c.resolved ? `<button class="btn btn-sm btn-outline" onclick="resolveContact('${c.id}')">Mark Resolved</button>` : ""}
        <button class="btn btn-sm" style="background:var(--amber-primary);color:#fff"
          onclick="deleteContact('${c.id}')">Delete</button>
      </div>
    </div>`).join("");
}

async function resolveContact(id) {
  if (!DEMO_MODE && db) { try { await updateDocument("contactMessages", id, { resolved: true }); } catch { } }
  showToast("Marked as resolved. ✅", "success");
  loadAdminContacts();
}

async function deleteContact(id) {
  if (!confirm("Delete this inquiry?")) return;
  if (!DEMO_MODE && db) { try { await deleteDocument("contactMessages", id); } catch { } }
  showToast("Inquiry deleted.", "info");
  loadAdminContacts();
}

// ── FAQ ADMIN ───────────────────────────────────────────
let adminFAQs = [];

async function loadAdminFAQs() {
  const container = document.getElementById("adminFAQList");
  if (!container) return;

  if (!DEMO_MODE && db) {
    try {
      const fromDB = await getCollection("faqs", [], "order", "asc");
      if (fromDB.length) adminFAQs = fromDB;
    } catch { }
  }

  if (!adminFAQs.length) {
    adminFAQs = [
      { q:"Are your products preservative-free?", a:"Yes, absolutely. We use only the natural dehydration process with no additives." },
      { q:"How long do products last once opened?", a:"Reseal tightly and consume within 30–60 days. Store in a cool, dry place." },
      { q:"Do you ship pan-India?", a:"Yes, we deliver across India in 3–5 business days. Free shipping on orders above ₹499." },
      { q:"What payment methods do you accept?", a:"We accept UPI, Credit/Debit Cards, Net Banking, Wallets, and Cash on Delivery." },
    ];
  }

  renderAdminFAQList();
}

function renderAdminFAQList() {
  const container = document.getElementById("adminFAQList");
  if (!container) return;

  container.innerHTML = adminFAQs.map((faq, i) => `
    <div class="admin-faq-card" style="border:1px solid var(--border-color);border-radius:10px;padding:16px;margin-bottom:12px">
      <div class="faq-edit-header" style="display:flex;align-items:center;margin-bottom:8px">
        <strong style="margin-right:8px">Q${i + 1}.</strong>
        <button class="btn btn-sm" style="background:var(--amber-primary);color:#fff;margin-left:auto"
          onclick="deleteAdminFAQ(${i})">Delete</button>
      </div>
      <label style="font-size:12px;color:var(--text-secondary)">Question</label>
      <input type="text" class="faq-admin-input" value="${escapeHtml(faq.q)}"
        onchange="adminFAQs[${i}].q = this.value"
        style="width:100%;margin-bottom:8px;padding:8px;border:1px solid var(--border-color);border-radius:6px">
      <label style="font-size:12px;color:var(--text-secondary)">Answer</label>
      <textarea class="faq-admin-textarea" rows="3"
        onchange="adminFAQs[${i}].a = this.value"
        style="width:100%;padding:8px;border:1px solid var(--border-color);border-radius:6px">${escapeHtml(faq.a)}</textarea>
    </div>`).join("") + `
    <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap">
      <button class="btn btn-outline" onclick="addFAQAdmin()">+ Add Question</button>
      <button class="btn btn-primary" onclick="saveFAQsToFirestore()">💾 Save All FAQs</button>
    </div>`;
}

function addFAQAdmin() {
  adminFAQs.push({ q:"New question", a:"Answer here", order: adminFAQs.length });
  renderAdminFAQList();
  showToast("New FAQ row added. Fill it in and save.", "info");
}

function deleteAdminFAQ(index) {
  if (!confirm("Delete this FAQ?")) return;
  adminFAQs.splice(index, 1);
  renderAdminFAQList();
  showToast("FAQ deleted. Click 'Save All FAQs' to persist.", "info");
}

async function saveFAQsToFirestore() {
  if (DEMO_MODE || !db) { showToast("FAQs saved locally (demo mode).", "info"); return; }
  try {
    const existing = await getCollection("faqs");
    await Promise.all(existing.map(f => deleteDocument("faqs", f.id)));
    await Promise.all(adminFAQs.map((faq, i) => addDocument("faqs", { q: faq.q, a: faq.a, order: i })));
    showToast("FAQs saved to Firestore! ✅", "success");
  } catch {
    showToast("Could not save FAQs. Please try again.", "error");
  }
}

// ── TESTIMONIALS ADMIN ─────────────────────────────────
let adminTestimonials = [];

async function loadAdminTestimonials() {
  const container = document.getElementById("adminTestimonialList");
  if (!container) return;

  if (!DEMO_MODE && db) {
    try {
      const fromDB = await getCollection("testimonials");
      if (fromDB.length) adminTestimonials = fromDB;
    } catch { }
  }

  if (!adminTestimonials.length) {
    adminTestimonials = [
      { name:"Priya Sharma", city:"Delhi", text:"I've been hooked on the apple chips! So crispy and natural.", rating:5, approved:true },
      { name:"Karan Mehta", city:"Mumbai", text:"The onion-garlic mix saves me 15 minutes every day!", rating:5, approved:true },
      { name:"Ananya Rao", city:"Bengaluru", text:"Ordered the Discovery Box as a Diwali gift — massive hit!", rating:5, approved:true },
    ];
  }

  renderAdminTestimonialList();
}

function renderAdminTestimonialList() {
  const container = document.getElementById("adminTestimonialList");
  if (!container) return;

  container.innerHTML = adminTestimonials.map((t, i) => `
    <div class="admin-faq-card" style="border:1px solid var(--border-color);border-radius:10px;padding:16px;margin-bottom:12px">
      <div class="faq-edit-header" style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px">
        <strong>${escapeHtml(t.name)}, ${escapeHtml(t.city)}</strong>
        <span class="${t.approved ? "badge-green" : "badge-red"}" style="margin-left:auto">
          ${t.approved ? "Approved" : "Hidden"}
        </span>
        <button class="btn btn-sm btn-outline"
          onclick="adminTestimonials[${i}].approved = !adminTestimonials[${i}].approved; renderAdminTestimonialList()">
          ${t.approved ? "Hide" : "Approve"}
        </button>
        <button class="btn btn-sm" style="background:var(--amber-primary);color:#fff"
          onclick="adminTestimonials.splice(${i},1); renderAdminTestimonialList()">Delete</button>
      </div>
      <p>${"★".repeat(t.rating || 5)}</p>
      <textarea rows="2" style="width:100%;padding:8px;border:1px solid var(--border-color);border-radius:6px"
        onchange="adminTestimonials[${i}].text = this.value">${escapeHtml(t.text || "")}</textarea>
    </div>`).join("") + `
    <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap">
      <button class="btn btn-outline"
        onclick="adminTestimonials.push({name:'Name',city:'City',text:'Review text',rating:5,approved:false}); renderAdminTestimonialList()">
        + Add Testimonial
      </button>
      <button class="btn btn-primary" onclick="saveTestimonialsToFirestore()">💾 Save All</button>
    </div>`;
}

async function saveTestimonialsToFirestore() {
  if (DEMO_MODE || !db) { showToast("Saved locally (demo mode).", "info"); return; }
  try {
    const existing = await getCollection("testimonials");
    await Promise.all(existing.map(t => deleteDocument("testimonials", t.id)));
    await Promise.all(adminTestimonials.map(t => addDocument("testimonials", t)));
    showToast("Testimonials saved! ✅", "success");
  } catch {
    showToast("Could not save. Please try again.", "error");
  }
}

// ── SETTINGS ────────────────────────────────────────────
async function loadAdminSettings() {
  let settings = {};
  if (!DEMO_MODE && db) {
    try { settings = await getDocument("siteSettings", "main") || {}; } catch { }
  }

  const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

  setVal("settingFreeShipping",   settings.freeShippingAbove  ?? shippingSettings.freeAbove);
  setVal("settingShippingCharge", settings.shippingCharge     ?? shippingSettings.charge);
  setVal("rzpKey",                settings.razorpayKey        || localStorage.getItem("hc_rzp_key") || "");
  setVal("settingSiteName",       settings.siteName           || "HimCrest Foods");
  setVal("settingTagline",        settings.tagline            || "Clean. Pure. Natural.");
  setVal("settingSupportEmail",   settings.supportEmail       || "hello@himcrestfoods.in");
  setVal("settingSupportPhone",   settings.supportPhone       || "");
  setVal("settingWhatsApp",       settings.whatsapp           || "");
  setVal("settingInstagram",      settings.instagramUrl       || "");
  setVal("settingFacebook",       settings.facebookUrl        || "");
  setVal("settingAnnouncementBar",settings.announcementBar    || "");
  setVal("settingFooterText",     settings.footerText         || "");
  setVal("settingAboutUs",        settings.aboutUsContent     || "");
  setVal("settingContactAddress", settings.contactAddress     || "");

  setChk("settingCOD",           settings.codEnabled          !== false);
  setChk("settingOnlinePayment", settings.onlinePaymentEnabled !== false);
  setChk("settingMaintenance",   !!settings.maintenanceMode);
}

async function saveSettings() {
  const getVal   = id => document.getElementById(id)?.value.trim() || "";
  const getNum   = (id, def) => parseFloat(document.getElementById(id)?.value) || def;
  const getCheck = id => !!(document.getElementById(id)?.checked);

  const freeAbove = getNum("settingFreeShipping", 499);
  const charge    = getNum("settingShippingCharge", 49);
  const rzpKey    = getVal("rzpKey");

  shippingSettings.freeAbove = freeAbove;
  shippingSettings.charge    = charge;
  if (rzpKey) localStorage.setItem("hc_rzp_key", rzpKey);

  const settingsData = {
    freeShippingAbove:      freeAbove,
    shippingCharge:         charge,
    razorpayKey:            rzpKey,
    siteName:               getVal("settingSiteName"),
    tagline:                getVal("settingTagline"),
    supportEmail:           getVal("settingSupportEmail"),
    supportPhone:           getVal("settingSupportPhone"),
    whatsapp:               getVal("settingWhatsApp"),
    instagramUrl:           getVal("settingInstagram"),
    facebookUrl:            getVal("settingFacebook"),
    announcementBar:        getVal("settingAnnouncementBar"),
    footerText:             getVal("settingFooterText"),
    aboutUsContent:         getVal("settingAboutUs"),
    contactAddress:         getVal("settingContactAddress"),
    codEnabled:             getCheck("settingCOD"),
    onlinePaymentEnabled:   getCheck("settingOnlinePayment"),
    maintenanceMode:        getCheck("settingMaintenance"),
  };

  if (!DEMO_MODE && db) {
    try {
      await setDocument("siteSettings", "main", settingsData);
      showToast("Settings saved! ⚙️", "success");
    } catch {
      showToast("Saved locally (Firestore error). ⚠️", "warning");
    }
  } else {
    showToast("Settings saved! ⚙️", "success");
  }
}

// ── POLICIES ADMIN ─────────────────────────────────────
const POLICY_DEFAULTS = {
  privacy: `<h2>Privacy Policy</h2>
<p><em>Effective: January 1, 2024</em></p>
<p>HimCrest Foods respects your privacy. We collect your name, email, phone and address only to process orders and improve our service. We never sell your personal data to third parties. All data is secured via Firebase's industry-standard encryption.</p>
<p>Contact: hello@himcrestfoods.in</p>`,

  terms: `<h2>Terms &amp; Conditions</h2>
<p><em>Effective: January 1, 2024</em></p>
<p>By using himcrestfoods.in you agree to these terms. Orders are confirmed on payment. We reserve the right to cancel orders due to pricing errors or stock issues. All content is the property of HimCrest Foods. Disputes subject to Shimla, Himachal Pradesh jurisdiction.</p>`,

  shipping: `<h2>Shipping Policy</h2>
<p>We ship pan-India via reputed courier partners. Standard delivery: 3–5 business days. Remote areas: 5–7 days. Free shipping on orders above ₹499. Tracking link sent via SMS/email after dispatch.</p>`,

  returns: `<h2>Return &amp; Refund Policy</h2>
<p>7-day return policy from delivery date for damaged, wrong, or sealed products. Opened products cannot be returned for hygiene reasons. Refunds processed within 5–7 business days via the original payment method. To initiate a return, contact: hello@himcrestfoods.in with your order ID and photos.</p>`,

  about: `<h2>About HimCrest Foods</h2>
<p>HimCrest Foods was born from a simple belief: the mountains give us the cleanest, most nutrient-dense produce on earth. We source the finest fruits and vegetables from Himalayan farms and use gentle dehydration to lock in maximum nutrition.</p>
<p>Whether you're a busy professional, a health-conscious parent, or a home chef — HimCrest Foods is your clean-label companion. No additives. No preservatives. Just pure, honest food.</p>`,
};

async function loadAdminPolicies() {
  const container = document.getElementById("adminPoliciesList");
  if (!container) return;

  const policyTypes = [
    { key:"privacy", label:"Privacy Policy" },
    { key:"terms",   label:"Terms & Conditions" },
    { key:"shipping",label:"Shipping Policy" },
    { key:"returns", label:"Return & Refund Policy" },
    { key:"about",   label:"About Us" },
  ];

  let existing = {};
  if (!DEMO_MODE && db) {
    try {
      const fromDB = await getCollection("policies");
      fromDB.forEach(doc => { existing[doc.id] = doc.content || ""; });
    } catch { }
  }

  container.innerHTML = policyTypes.map(pt => `
    <div style="border:1px solid var(--border-color);border-radius:10px;padding:20px;margin-bottom:20px">
      <h4 style="margin-bottom:12px">${pt.label}</h4>
      <p class="hint" style="margin-bottom:8px;font-size:12px">HTML allowed. Use &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt; tags for formatting.</p>
      <textarea id="policy_${pt.key}" rows="8"
        style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:6px;font-family:monospace;font-size:13px;resize:vertical"
      >${escapeHtml(existing[pt.key] || POLICY_DEFAULTS[pt.key] || "")}</textarea>
      <button class="btn btn-primary" style="margin-top:10px" onclick="saveSinglePolicy('${pt.key}', '${pt.label}')">💾 Save ${pt.label}</button>
    </div>`).join("");
}

async function saveSinglePolicy(key, label) {
  const content = document.getElementById(`policy_${key}`)?.value || "";
  if (!DEMO_MODE && db) {
    try {
      await setDocument("policies", key, { content }, false);
      showToast(`${label} saved! ✅`, "success");
    } catch {
      showToast("Could not save. Please try again.", "error");
    }
  } else {
    showToast(`${label} saved! ✅`, "success");
  }
}

async function showPolicyModal(type) {
  const content = document.getElementById("policyContent");
  let html = POLICY_DEFAULTS[type] || "";

  if (!DEMO_MODE && db) {
    try {
      const doc = await getDocument("policies", type);
      if (doc?.content) html = doc.content;
    } catch { }
  }

  if (content) content.innerHTML = html;
  document.getElementById("policyOverlay")?.setAttribute("style", "display:block");
  document.getElementById("policyModal")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closePolicyModal() {
  document.getElementById("policyOverlay")?.setAttribute("style", "display:none");
  document.getElementById("policyModal")?.classList.remove("open");
  document.body.style.overflow = "";
}

// ── HELPERS ────────────────────────────────────────────
function setText4(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
