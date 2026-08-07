import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDbBy2QfJZ2y-Mq8cpeqLjDEBgrcIdclYI",
  authDomain: "nick-coaching-os.firebaseapp.com",
  projectId: "nick-coaching-os",
  storageBucket: "nick-coaching-os.firebasestorage.app",
  messagingSenderId: "250479748129",
  appId: "1:250479748129:web:5b8bd15b91d6a14a7d2f60"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const COLLECTIONS = {
  practices: "coachingOSPractices",
  sessions: "coachingOSSessions",
  templates: "coachingOSSessionBlueprints",
  wordbanks: "coachingOSWordbanks",
  meta: "coachingOSMeta",
  backups: "coachingOSBackups",
  legacy: "coachingOS"
};

function clean(data) {
  return JSON.parse(JSON.stringify(data || {}));
}

function makeDocId(value, fallback) {
  const raw = String(value || fallback || ("item-" + Date.now()));
  return encodeURIComponent(raw).replace(/\./g, "%2E").slice(0, 140) || fallback;
}

function cloudDrillIds(item) {
  const raw = Array.isArray(item && item.drills)
    ? item.drills
    : [item && item.act, item && item.skill, item && item.tact, item && item.cond];
  return raw.map(d => typeof d === "string" ? d : (d && d.id)).filter(Boolean);
}

function normaliseCloudDb(data) {
  const safe = clean(data);
  safe.practices = Array.isArray(safe.practices) ? safe.practices : [];
  safe.sessions = Array.isArray(safe.sessions) ? safe.sessions : [];
  safe.sessionTemplates = Array.isArray(safe.sessionTemplates) ? safe.sessionTemplates : [];
  safe.banks = safe.banks && typeof safe.banks === "object" ? safe.banks : {};

  safe.practices = safe.practices.map((p, i) => {
    const item = p || {};
    const { fav, favorite, ...rest } = item;
    return {
      ...rest,
      id: item.id || ("practice-" + (i + 1)),
      isFavourite: !!(item.isFavourite ?? fav ?? favorite)
    };
  });

  safe.sessions = safe.sessions.map((s, i) => ({
    ...s,
    id: s.id || makeDocId([s.date, s.team, s.theme, i].join("-"), "session-" + (i + 1)),
    drills: cloudDrillIds(s)
  }));

  safe.sessionTemplates = safe.sessionTemplates.map((t, i) => {
    const item = t || {};
    const { fav, favorite, ...rest } = item;
    return {
      ...rest,
      id: item.id || makeDocId([item.name, item.theme, i].join("-"), "blueprint-" + (i + 1)),
      isFavourite: !!(item.isFavourite ?? fav ?? favorite),
      useCount: Number(item.useCount || 0),
      drills: cloudDrillIds(item)
    };
  });

  return safe;
}

async function loadCollectionDocs(collectionName) {
  const snap = await getDocs(collection(firestore, collectionName));
  return snap.docs.map(d => ({ _docId: d.id, ...(d.data().data || d.data()) }));
}

async function saveCollection(collectionName, items, idGetter) {
  const snap = await getDocs(collection(firestore, collectionName));
  const existingIds = new Set(snap.docs.map(d => d.id));
  const batch = writeBatch(firestore);
  const wantedIds = new Set();

  items.forEach((item, index) => {
    const docId = makeDocId(idGetter(item, index), "item-" + index);
    wantedIds.add(docId);
    batch.set(doc(firestore, collectionName, docId), {
      data: clean(item),
      updatedAt: serverTimestamp()
    });
  });

  existingIds.forEach(id => {
    if (!wantedIds.has(id)) {
      batch.delete(doc(firestore, collectionName, id));
    }
  });

  await batch.commit();
}

async function loadStructuredDb() {
  const [practiceDocs, sessionDocs, templateDocs, bankSnap] = await Promise.all([
    loadCollectionDocs(COLLECTIONS.practices),
    loadCollectionDocs(COLLECTIONS.sessions),
    loadCollectionDocs(COLLECTIONS.templates),
    getDoc(doc(firestore, COLLECTIONS.wordbanks, "master"))
  ]);

  const hasStructuredData = practiceDocs.length || sessionDocs.length || templateDocs.length || bankSnap.exists();

  if (hasStructuredData) {
    return normaliseCloudDb({
      practices: practiceDocs.map(p => p.data || p),
      sessions: sessionDocs.map(s => s.data || s),
      sessionTemplates: templateDocs.map(t => t.data || t),
      banks: bankSnap.exists() ? (bankSnap.data().data || bankSnap.data() || {}) : {}
    });
  }

  // Migration fallback: if your old single-document database still exists,
  // load it once so it can be saved into the new separate collections.
  const legacySnap = await getDoc(doc(firestore, COLLECTIONS.legacy, "main"));
  if (legacySnap.exists() && legacySnap.data().data) {
    const legacyDb = normaliseCloudDb(legacySnap.data().data);
    await window.nickCloud.save(legacyDb);
    return legacyDb;
  }

  return null;
}

window.nickCloud = {
  save: async function(data) {
    const cleanData = normaliseCloudDb(data);

    await Promise.all([
      saveCollection(COLLECTIONS.practices, cleanData.practices, p => p.id),
      saveCollection(COLLECTIONS.sessions, cleanData.sessions, s => s.id),
      saveCollection(COLLECTIONS.templates, cleanData.sessionTemplates, t => t.id),
      setDoc(doc(firestore, COLLECTIONS.wordbanks, "master"), {
        data: cleanData.banks,
        updatedAt: serverTimestamp()
      })
    ]);

    await setDoc(doc(firestore, COLLECTIONS.meta, "main"), {
      updatedAt: serverTimestamp(),
      structure: "split-collections-v1",
      practiceCount: cleanData.practices.length,
      sessionCount: cleanData.sessions.length,
      templateCount: cleanData.sessionTemplates.length
    });
  },

  getCurrent: async function() {
    return await loadStructuredDb();
  },

  listen: function(callback) {
    return onSnapshot(
      doc(firestore, COLLECTIONS.meta, "main"),
      async function() {
        const cloudDb = await loadStructuredDb();
        callback(cloudDb ? { data: cloudDb } : null);
      },
      function(error) {
        console.error("Firebase listener failed", error);
      }
    );
  },

  createBackup: async function(data) {
    const cleanData = normaliseCloudDb(data);
    await addDoc(collection(firestore, COLLECTIONS.backups), {
      data: cleanData,
      createdAt: serverTimestamp(),
      label: new Date().toLocaleString("en-GB"),
      structure: "split-collections-v1"
    });
  },

  loadBackups: async function() {
    const q = query(
      collection(firestore, COLLECTIONS.backups),
      orderBy("createdAt", "desc"),
      limit(25)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};
