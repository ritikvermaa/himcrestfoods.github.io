// =====================================================
// AUTH.JS – Authentication Logic
// HimCrest Foods – Production
// =====================================================

// ── GLOBAL USER STATE ─────────────────────────────────
let currentUser = null;
let isAdmin     = false;

// ── SIGNUP MULTI-STEP STATE ───────────────────────────
let signupStep        = 1;
let pendingSignupCred = null;

// ── AUTH STATE LISTENER ───────────────────────────────
function initAuth() {
  if (DEMO_MODE || !auth) { updateAuthUI(null); return; }

  auth.onAuthStateChanged(async user => {
    if (user) {
      currentUser = user;
      try {
        const doc = await getDocument("users", user.uid);
        isAdmin = doc?.role === "admin";
      } catch { isAdmin = false; }
      updateAuthUI(user);
    } else {
      currentUser = null;
      isAdmin     = false;
      updateAuthUI(null);
    }
  });
}

// ── UI UPDATE ─────────────────────────────────────────
function updateAuthUI(user) {
  const label          = document.getElementById("userNavLabel");
  const mobileName     = document.getElementById("mobileUserName");
  const mobileLoginBtn = document.getElementById("mobileLoginBtn");

  if (user) {
    const name = user.displayName || user.email?.split("@")[0] || "My Account";
    if (label)          label.textContent = name.split(" ")[0];
    if (mobileName)     mobileName.textContent = `Hi, ${name.split(" ")[0]}!`;
    if (mobileLoginBtn) mobileLoginBtn.style.display = "none";
    renderUserDropdown(user);
  } else {
    if (label)          label.textContent = "Login";
    if (mobileName)     mobileName.textContent = "Welcome, Guest";
    if (mobileLoginBtn) { mobileLoginBtn.style.display = "inline"; mobileLoginBtn.textContent = "Login / Signup"; }
    renderGuestDropdown();
  }
  updateAccountPage();
}

// ── DROPDOWNS ─────────────────────────────────────────
function renderUserDropdown(user) {
  const content = document.getElementById("userDropdownContent");
  if (!content) return;
  const name = user.displayName || user.email?.split("@")[0] || "User";
  content.innerHTML = `
    <div class="dropdown-user-info">
      <div class="avatar-circle">${name.charAt(0).toUpperCase()}</div>
      <div>
        <strong>${escapeHtmlAuth(name)}</strong>
        <p>${escapeHtmlAuth(user.email || "")}</p>
      </div>
    </div>
    <ul class="dropdown-links">
      <li onclick="closeUserDropdown(); showPage('account')">👤 My Account</li>
      <li onclick="closeUserDropdown(); showPage('account'); switchAccountTab('orders', null)">📦 My Orders</li>
      <li onclick="closeUserDropdown(); showPage('wishlist')">♡ Wishlist</li>
      ${isAdmin ? `<li onclick="closeUserDropdown(); showPage('admin')" class="admin-link">🛡️ Admin Panel</li>` : ""}
      <li onclick="logoutUser()" class="logout-item">🚪 Logout</li>
    </ul>`;
}

function renderGuestDropdown() {
  const content = document.getElementById("userDropdownContent");
  if (!content) return;
  content.innerHTML = `
    <div class="dropdown-guest">
      <p>Welcome to HimCrest Foods!</p>
      <button class="btn btn-primary btn-full" onclick="closeUserDropdown(); showPage('auth')">Login / Sign Up</button>
    </div>
    <ul class="dropdown-links">
      <li onclick="closeUserDropdown(); showPage('auth')">🔑 Login</li>
      <li onclick="closeUserDropdown(); showPage('auth'); switchAuthForm('signup')">📝 Create Account</li>
    </ul>`;
}

function toggleUserDropdown() {
  document.getElementById("userDropdown")?.classList.toggle("open");
}
function closeUserDropdown() {
  document.getElementById("userDropdown")?.classList.remove("open");
}

// ── AUTH FORM SWITCHER ────────────────────────────────
function switchAuthForm(form) {
  // Only valid auth forms (phone forms removed)
  ["loginForm","signupForm","forgotForm","verifyEmailForm"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === form + "Form") ? "block" : "none";
  });
  if (form === "signup") { signupStep = 1; pendingSignupCred = null; }
}

// ── LOGIN (Email/Password) ─────────────────────────────
async function loginUser() {
  const email    = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();

  if (!email || !password) {
    showToast("Please enter your email and password.", "error"); return;
  }

  if (DEMO_MODE || !auth) {
    showToast("Firebase not configured.", "warning"); return;
  }

  const btn = document.getElementById("loginBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Logging in…"; }

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);

    // TEMPORARILY DISABLED: Strict email verification check
    // This allows you to login with manually created admin accounts easily
    /*
    if (!cred.user.emailVerified) {
      showToast("Please verify your email first. Check your inbox.", "warning");
      pendingSignupCred = cred;
      showVerifyEmailBanner();
      if (btn) { btn.disabled = false; btn.textContent = "Login"; }
      return;
    }
    */

    showToast("Welcome back! 🌿", "success");
    showPage("home");
  } catch (e) {
    console.error("Login Error:", e);
    showToast(getAuthErrorMessage(e.code), "error");
  }

  if (btn) { btn.disabled = false; btn.textContent = "Login"; }
}

// ── SIGNUP (Email/Password + optional phone) ──────────
async function signupUser() {
  const first    = document.getElementById("signupFirst")?.value.trim();
  const last     = document.getElementById("signupLast")?.value.trim();
  const phone    = document.getElementById("signupPhone")?.value.trim();
  const email    = document.getElementById("signupEmail")?.value.trim();
  const password = document.getElementById("signupPassword")?.value.trim();
  const confirm  = document.getElementById("signupConfirm")?.value.trim();

  if (!first || !email || !password || !confirm) {
    showToast("Please fill in all required fields.", "error"); return;
  }
  if (password !== confirm) {
    showToast("Passwords do not match.", "error"); return;
  }
  if (password.length < 6) {
    showToast("Password must be at least 6 characters.", "error"); return;
  }
  if (phone && !/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ""))) {
    showToast("Please enter a valid 10-digit Indian mobile number.", "error"); return;
  }

  if (DEMO_MODE || !auth) {
    showToast("Firebase not configured. Cannot create account.", "warning"); return;
  }

  const btn = document.getElementById("signupSubmitBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Creating account…"; }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: `${first} ${last}`.trim() });

    await setDocument("users", cred.user.uid, {
      name:          `${first} ${last}`.trim(),
      email,
      phone:         phone || "",
      phoneVerified: false,
      emailVerified: false,
      role:          "user",
    });

    await cred.user.sendEmailVerification();
    pendingSignupCred  = cred;

    if (btn) { btn.disabled = false; btn.textContent = "Create Account"; }
    showToast("Account created! Please verify your email. 📧", "success");
    switchAuthForm("verifyEmail");
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = "Create Account"; }
    showToast(getAuthErrorMessage(e.code), "error");
  }
}

// ── EMAIL VERIFICATION ────────────────────────────────
function showVerifyEmailBanner() {
  switchAuthForm("verifyEmail");
  showPage("auth");
}

async function resendEmailVerification() {
  const user = pendingSignupCred?.user || auth?.currentUser;
  if (!user) { showToast("Please sign in first.", "error"); return; }
  try {
    await user.sendEmailVerification();
    showToast("Verification email re-sent! Check your inbox. 📧", "success");
  } catch (e) {
    showToast(getAuthErrorMessage(e.code), "error");
  }
}

async function proceedAfterEmailVerification() {
  const user = pendingSignupCred?.user || auth?.currentUser;
  if (!user) { showToast("Session expired. Please log in again.", "error"); switchAuthForm("login"); return; }

  try {
    await user.reload();
    if (!user.emailVerified) {
      showToast("Email not yet verified. Please click the link in the email.", "warning"); return;
    }
    await updateDocument("users", user.uid, { emailVerified: true });
    showToast("Email verified! ✅ Welcome to HimCrest Foods 🎉", "success");
    pendingSignupCred = null;
    showPage("home");
  } catch (e) {
    showToast("Could not reload. Please try again.", "error");
  }
}

// ── GOOGLE SIGN-IN ─────────────────────────────────────
async function loginWithGoogle() {
  if (DEMO_MODE || !auth) {
    showToast("Firebase not configured.", "warning"); return;
  }
  try {
    console.log("Starting Google Sign-In...");
    const provider = new firebase.auth.GoogleAuthProvider();
    const result   = await auth.signInWithPopup(provider);
    
    if (result.additionalUserInfo?.isNewUser) {
      await setDocument("users", result.user.uid, {
        name:          result.user.displayName,
        email:         result.user.email,
        role:          "user",
        emailVerified: true,
        phoneVerified: false,
      });
    }
    showToast(`Welcome, ${result.user.displayName?.split(" ")[0]}! 🌿`, "success");
    showPage("home");
  } catch (e) {
    console.error("Google Auth Error:", e);
    // Explicit error check so the user knows exactly what to fix
    if (e.code === "auth/operation-not-allowed") {
      showToast("Google Sign-In is disabled. Please enable it in Firebase Console.", "error");
    } else if (e.code === "auth/unauthorized-domain") {
      showToast("This domain is not authorized. Add it to Firebase Auth settings.", "error");
    } else if (e.code !== "auth/popup-closed-by-user") {
      showToast(getAuthErrorMessage(e.code) || "Google login failed.", "error");
    }
  }
}

// ── FORGOT PASSWORD ────────────────────────────────────
async function sendPasswordReset() {
  const email = document.getElementById("resetEmail")?.value.trim();
  if (!email) { showToast("Please enter your email address.", "error"); return; }
  if (DEMO_MODE || !auth) { showToast("Firebase not configured.", "warning"); return; }
  try {
    await auth.sendPasswordResetEmail(email);
    showToast("Reset link sent! Check your inbox. 📧", "success");
    switchAuthForm("login");
  } catch (e) {
    showToast(getAuthErrorMessage(e.code), "error");
  }
}

// ── LOGOUT ─────────────────────────────────────────────
async function logoutUser() {
  isAdmin     = false;
  currentUser = null;
  if (!DEMO_MODE && auth) {
    try { await auth.signOut(); } catch (e) { console.error(e); }
  }
  updateAuthUI(null);
  showToast("You have been logged out.", "info");
  showPage("home");
  closeUserDropdown();
}

// ── ACCOUNT PAGE ────────────────────────────────────────
function updateAccountPage() {
  const nameEl       = document.getElementById("accountName");
  const emailEl      = document.getElementById("accountEmail");
  const profileName  = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profilePhone = document.getElementById("profilePhone");
  const avatarEl     = document.getElementById("accountAvatar");

  if (currentUser) {
    const name = currentUser.displayName || currentUser.email?.split("@")[0] || "User";
    if (nameEl)       nameEl.textContent  = name;
    if (emailEl)      emailEl.textContent = currentUser.email || "";
    if (profileName)  profileName.value   = name;
    if (profileEmail) profileEmail.value  = currentUser.email || "";
    if (avatarEl)     avatarEl.textContent = name.charAt(0).toUpperCase();

    if (!DEMO_MODE && currentUser.uid) {
      getDocument("users", currentUser.uid).then(doc => {
        if (!doc) return;
        if (profilePhone) profilePhone.value = doc.phone || "";
        const emailStatus = document.getElementById("emailVerifiedStatus");
        const phoneStatus = document.getElementById("phoneVerifiedStatus");
        if (emailStatus) {
          emailStatus.textContent = (doc.emailVerified || currentUser.emailVerified) ? "✅ Verified" : "⚠️ Not verified";
          emailStatus.className   = (doc.emailVerified || currentUser.emailVerified) ? "badge-green" : "badge-red";
        }
        if (phoneStatus) {
          phoneStatus.textContent = doc.phoneVerified ? "✅ Verified" : "⚠️ Not verified";
          phoneStatus.className   = doc.phoneVerified ? "badge-green" : "badge-red";
        }
      }).catch(() => {});
    }
  }
}

function switchAccountTab(tab, li) {
  document.querySelectorAll(".account-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".account-nav li").forEach(l => l.classList.remove("active"));
  const tabEl = document.getElementById(`tab-${tab}`);
  if (tabEl) tabEl.classList.add("active");
  if (li)    li.classList.add("active");
  if (tab === "orders")       loadUserOrders();
  if (tab === "addresses")    loadUserAddresses();
  if (tab === "wishlist-acc") renderWishlistInAccount();
}

async function saveProfile() {
  const name  = document.getElementById("profileName")?.value.trim();
  const phone = document.getElementById("profilePhone")?.value.trim();
  if (!currentUser || !name) { showToast("Please fill in your name.", "error"); return; }

  try {
    if (!DEMO_MODE && auth?.currentUser) {
      await auth.currentUser.updateProfile({ displayName: name });
    }
    if (!DEMO_MODE && currentUser.uid) {
      await updateDocument("users", currentUser.uid, { name, phone });
    }
    currentUser.displayName = name;
    updateAuthUI(currentUser);
    showToast("Profile updated! ✅", "success");
  } catch {
    showToast("Could not save profile. Please try again.", "error");
  }
}

function handleAccountNav() {
  showPage(currentUser ? "account" : "auth");
}

function togglePasswordVisibility(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) field.type = field.type === "password" ? "text" : "password";
}

// ── ERROR MESSAGES ─────────────────────────────────────
function getAuthErrorMessage(code) {
  const map = {
    "auth/user-not-found":             "No account found with this email.",
    "auth/wrong-password":             "Incorrect password. Please try again.",
    "auth/email-already-in-use":       "An account with this email already exists.",
    "auth/weak-password":              "Password is too weak. Use at least 6 characters.",
    "auth/invalid-email":              "Please enter a valid email address.",
    "auth/too-many-requests":          "Too many attempts. Please wait and try again.",
    "auth/network-request-failed":     "Network error. Please check your connection.",
    "auth/popup-blocked":              "Popup was blocked. Please allow popups for this site.",
    "auth/invalid-phone-number":       "Invalid phone number. Use format: +91XXXXXXXXXX",
    "auth/invalid-verification-code":  "Incorrect OTP. Please check and try again.",
    "auth/session-expired":            "OTP expired. Please request a new one.",
    "auth/quota-exceeded":             "SMS quota exceeded. Please try again later.",
    "auth/credential-already-in-use":  "This credential is already linked to another account.",
    "auth/invalid-credential":         "Invalid login credentials. Please try again.",
    "auth/operation-not-allowed":      "This sign-in method is not enabled in Firebase.",
    "auth/unauthorized-domain":        "This domain is not authorized in Firebase settings."
  };
  return map[code] || "Something went wrong. Please try again.";
}

// ── UTILITY ────────────────────────────────────────────
function escapeHtmlAuth(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}