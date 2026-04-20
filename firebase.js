// =====================================================
// FIREBASE.JS – Firebase Initialisation & Helpers
// HimCrest Foods – Production Configuration
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyBYpzIQkLWLnMa2mrM4oOgbgQgibIRm6mQ",
  authDomain: "himalaya-harvest-cb9f3.firebaseapp.com",
  projectId: "himalaya-harvest-cb9f3",
  storageBucket: "himalaya-harvest-cb9f3.firebasestorage.app",
  messagingSenderId: "280510922913",
  appId: "1:280510922913:web:247d07db7dfd6a23c370e0",
  measurementId: "G-2GEM2NBD54"
};

let app     = null;
let auth    = null;
let db      = null;
let storage = null;

// DEMO_MODE must remain false in production.
const DEMO_MODE = false;

try {
  app     = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
  auth    = firebase.auth();
  db      = firebase.firestore();
  storage = firebase.storage();

  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

  console.log("✅ HimCrest Foods – Firebase connected");
} catch (e) {
  console.error("Firebase init failed:", e);
}

// ── FIRESTORE HELPERS ─────────────────────────────────

async function getCollection(col, filters = [], orderField = null, orderDir = "asc") {
  try {
    let ref = db.collection(col);
    filters.forEach(f => { ref = ref.where(f.field, f.op, f.value); });
    if (orderField) ref = ref.orderBy(orderField, orderDir);
    const snap = await ref.get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error(`getCollection(${col}):`, e);
    return [];
  }
}

async function getDocument(col, docId) {
  try {
    const doc = await db.collection(col).doc(docId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (e) {
    console.error(`getDocument(${col}/${docId}):`, e);
    return null;
  }
}

async function addDocument(col, data) {
  try {
    const ts  = firebase.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection(col).add({ ...data, createdAt: ts, updatedAt: ts });
    return ref.id;
  } catch (e) {
    console.error(`addDocument(${col}):`, e);
    throw e;
  }
}

async function setDocument(col, docId, data, merge = true) {
  try {
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection(col).doc(docId).set({ ...data, updatedAt: ts }, { merge });
  } catch (e) {
    console.error(`setDocument(${col}/${docId}):`, e);
    throw e;
  }
}

async function updateDocument(col, docId, data) {
  return setDocument(col, docId, data, true);
}

async function deleteDocument(col, docId) {
  try {
    await db.collection(col).doc(docId).delete();
  } catch (e) {
    console.error(`deleteDocument(${col}/${docId}):`, e);
    throw e;
  }
}

// ── STORAGE HELPERS ────────────────────────────────────

async function uploadFileToStorage(file, folder = "uploads", onProgress = null) {
  if (!file || !storage) return "";
  const safeName = `${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
  const ref  = storage.ref().child(`${folder}/${safeName}`);
  const meta = { contentType: file.type || "application/octet-stream" };
  const task = ref.put(file, meta);

  if (onProgress) {
    task.on("state_changed", snap => {
      onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
    });
  }

  await task;
  return await ref.getDownloadURL();
}

async function deleteFileFromStorage(url) {
  if (!url || !storage) return;
  try { await storage.refFromURL(url).delete(); } catch (e) { console.warn("Storage delete failed:", e); }
}

// NOTE: Phone auth helpers removed.
// Phone login/signup is no longer used in this project.
// Only email/password and Google Sign-In are active.
