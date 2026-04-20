# HimCrest Foods – Deployment Guide
# =====================================================

## STEP 1 – Project File Structure

Your final project folder must look like this:

  himcrest-foods/
  ├── index.html
  ├── style.css
  ├── app-extras.css
  ├── firebase.js
  ├── auth.js
  ├── products.js
  ├── cart.js
  ├── checkout.js
  ├── admin.js
  └── app.js

No build step needed. All files are plain HTML/CSS/JS.


## STEP 2 – Firebase Console Setup

Go to: https://console.firebase.google.com
Project: himalaya-harvest-cb9f3

### 2a. Enable Authentication Providers
  Console → Authentication → Sign-in method → Enable:
  ✅ Email/Password
  ✅ Google

  ❌ Phone – NOT required. Phone auth has been removed from this project.

### 2b. Configure Authorised Domains
  Authentication → Settings → Authorised domains → Add:
  - localhost
  - himcrestfoods.in (your production domain)
  - your-project.web.app (Firebase Hosting domain)
  - your-username.github.io (if using GitHub Pages)

### 2c. Create Firestore Database
  Firestore Database → Create database
  - Choose "Production mode"
  - Select region: asia-south1 (Mumbai) ← closest to India

### 2d. Apply Firestore Rules
  Firestore Database → Rules → Replace all content with
  the contents of: firebase-rules.txt
  Click "Publish"

### 2e. Firebase Storage (Optional)
  Storage is NOT required for product images in the new URL-based system.
  Admin adds product images via direct URLs (e.g. from imgbb.com, Cloudinary).

  If you still want Storage for banner images:
  Storage → Get started → Production mode → apply storage-rules.txt


## STEP 3 – Create Your Admin Account (SECURE METHOD)

There is NO demo admin login. Admin access is role-based via Firestore.

1. Run the site locally (see Step 4 below)
2. Click Login → Create Account
3. Sign up with your real admin email and a strong password
4. Verify your email by clicking the link sent to your inbox
5. Go to Firebase Console → Firestore Database → Data
6. Open the `users` collection → find your document (matches your UID)
7. Add field:
     Field name:  role
     Field type:  string
     Value:       admin
8. Click Save
9. Refresh the site and login again
10. You will now see "Admin Panel" in your account dropdown


## STEP 4 – Run Locally

Option A – Python (simplest):
  cd himcrest-foods
  python3 -m http.server 8080
  Open: http://localhost:8080

Option B – VS Code Live Server:
  Install "Live Server" extension
  Right-click index.html → "Open with Live Server"

Option C – Node.js serve:
  npx serve .
  Open: http://localhost:3000

⚠️  Never open index.html directly as a file:// URL.
    Firebase Auth requires an http:// or https:// origin.


## STEP 5 – Deploy to Firebase Hosting (Recommended)

  npm install -g firebase-tools
  firebase login
  cd himcrest-foods
  firebase init hosting
    - Select project: himalaya-harvest-cb9f3
    - Public directory: . (dot)
    - Single-page app rewrite: NO
    - Overwrite index.html: NO
  firebase deploy --only hosting

  Live at: https://himalaya-harvest-cb9f3.web.app


## STEP 6 – Adding Product Images (URL-based)

Firebase Storage is NOT needed for product images. Instead:

1. Upload your product photo to a free image host:
   - https://imgbb.com  (free, no account needed for basic use)
   - https://cloudinary.com  (free tier, best for production)
   - Google Drive (share publicly → use direct link)
   - Any CDN or your own hosting

2. Copy the direct image URL (must end in .jpg / .png / .webp or similar)

3. Go to Admin Panel → Products → Add / Edit Product

4. Paste the URL in:
   - Main Image URL  (required for main display)
   - Gallery Image 2, 3, 4  (optional, shown as thumbnails)
   - Product Video URL  (optional, shown as play button in gallery)

5. You can preview each URL before saving.


## STEP 7 – Firestore Product Data Model

Products now support these media fields:

  image:  string          // main image URL (backward-compat)
  images: string[]        // NEW: gallery array [url1, url2, url3, url4]
  video:  string          // NEW: optional video URL (mp4/webm)

Old products with only `image` still work normally.
New products with `images[]` show a full gallery with thumbnails.
Video is optional — if present, a play button appears in the gallery.

Other fields (variants, price, stock, etc.) are unchanged.


## STEP 8 – Razorpay Integration

1. Create account: https://razorpay.com
2. Dashboard → Settings → API Keys → Generate Test Keys
3. Copy Key ID (starts with rzp_test_...)
4. Login to site as admin
5. Admin Panel → Settings → Razorpay Key ID → paste key → Save Settings


## STEP 9 – Firestore Collections

  products        – Admin Panel → Products
  orders          – Customer checkout
  users           – User signup
  coupons         – Admin Panel → Coupons
  reviews         – Product detail page
  contactMessages – Contact form
  newsletter      – Newsletter signups
  testimonials    – Admin Panel → Testimonials
  faqs            – Admin Panel → FAQs
  banners         – Admin Panel → Banners
  siteSettings    – Admin Panel → Settings
  policies        – Admin Panel → Policies


## STEP 10 – Post-Deployment Checklist

□ Home page loads with hero slider
□ Category navigation and filtering works
□ Product cards render (emoji fallback if no image URL)
□ Quick view modal opens and closes
□ Product detail page shows gallery thumbnails if images[] is set
□ Gallery switching works (click thumbnails)
□ Video plays if video URL is set on product
□ Add to cart works with weight variant selection
□ Cart page shows items correctly
□ Checkout form validates all fields
□ COD order placed – success page shows order ID starting with "HC"
□ Google Sign-In works
□ Email/password signup → email verification → redirect to home
□ Login works
□ Forgot password email sent
□ My Account page shows profile + orders
□ Wishlist add/remove works
□ Search returns results
□ Admin login → Admin panel appears
□ Admin Products tab: Add Product with image URLs → preview shows
□ Admin Products: Gallery images saved and shown on frontend
□ Admin Orders tab loads and allows status change
□ Admin Settings: Save and verify settings load on refresh
□ Admin Banners: Add banner with image URL
□ Mobile menu opens and closes (no overlap)
□ Shop page: filter button opens sidebar drawer on mobile
□ Sidebar closes when category selected or tapped outside
□ No horizontal scroll on mobile (375px width)
□ Product cards fit in 2-column grid on mobile
□ Auth page fits on mobile without overflow
□ Product detail gallery is mobile-friendly
□ No phone login/signup visible anywhere


## COMMON ERRORS & FIXES

Error: "Firebase: Error (auth/configuration-not-found)"
Fix:   Make sure Email/Password and Google auth are enabled in Firebase Console
       Phone auth is no longer needed and can be left disabled.

Error: "Missing or insufficient permissions"
Fix:   Publish the Firestore rules from firebase-rules.txt

Error: Products not loading from Firestore
Fix:   Check Firestore rules allow read on /products/{productId}

Error: Admin panel not accessible after login
Fix:   Manually set role = "admin" in Firestore → users → {your-uid}

Error: Product image not showing
Fix:   Make sure the image URL is a direct link to the image file
       (not a webpage that contains the image).
       Test by opening the URL directly in a browser — it should show only the image.
       imgbb.com → use the "Direct link" option when uploading.

Error: Gallery thumbnails not showing
Fix:   Make sure you filled in images[] via Admin Panel (Gallery Image 2/3/4 fields)
       Old products with only image field still show main image — no thumbs.

Error: Video not playing
Fix:   Use a direct .mp4 or .webm URL, not a YouTube page URL.
       YouTube embed URLs (https://www.youtube.com/embed/…) also work.

Error: Razorpay payment window not opening
Fix:   Check Razorpay key is saved in Admin → Settings
       Use rzp_test_ key for testing, rzp_live_ for production

Error: Weight variants not showing on product page
Fix:   Add variants JSON array when editing product in Admin → Products
       Format: [{"weight":"100g","price":199,"mrp":249,"stock":50}]
