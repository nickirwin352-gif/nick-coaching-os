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
import { buildCollectionState, diffCollection, stableStringify } from "./cloud-sync-delta-v1.js";

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

const CLIENT_ID = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const syncState = {
  practices:new Map(),
  sessions:new Map(),
  templates:new Map(),
  banksSignature:'',
  primed:false
};
let lastSavedDb = null;
let lastLocalWriteToken = '';
let saveSequence = 0;
let saveChain = Promise.resolve();

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

function collectionState(items, idGetter) {
  return buildCollectionState(items,idGetter,(value,index)=>makeDocId(value,`item-${index}`));
}

function primeSyncState(data) {
  const safe = normaliseCloudDb(data || {});
  syncState.practices = collectionState(safe.practices,p=>p.id);
  syncState.sessions = collectionState(safe.sessions,s=>s.id);
  syncState.templates = collectionState(safe.sessionTemplates,t=>t.id);
  syncState.banksSignature = stableStringify(safe.banks || {});
  syncState.primed = true;
  lastSavedDb = clean(safe);
  return safe;
}

async function loadCollectionDocs(collectionName) {
  const snap = await getDocs(collection(firestore, collectionName));
  return snap.docs.map(d => ({ _docId: d.id, ...(d.data().data || d.data()) }));
}

async function saveCollectionDelta(collectionName, items, idGetter, stateKey) {
  const previous = syncState[stateKey] || new Map();
  const delta = diffCollection(items,idGetter,previous,(value,index)=>makeDocId(value,`item-${index}`));
  if (!delta.changed) return { changed:0, upserts:0, deletes:0 };

  const batch = writeBatch(firestore);
  delta.upserts.forEach(({id,item}) => {
    batch.set(doc(firestore, collectionName, id), {
      data: clean(item),
      updatedAt: serverTimestamp()
    });
  });
  delta.deletes.forEach(id => batch.delete(doc(firestore, collectionName, id)));
  await batch.commit();
  syncState[stateKey] = delta.nextState;
  return { changed:delta.changed, upserts:delta.upserts.length, deletes:delta.deletes.length };
}

async function loadStructuredDb() {
  const [practiceDocs, sessionDocs, templateDocs, bankSnap] = await Promise.all([
    loadCollectionDocs(COLLECTIONS.practices),
    loadCollectionDocs(COLLECTIONS.sessions),
    loadCollectionDocs(COLLECTIONS.templates),
    getDoc(doc(firestore, COLLECTIONS.wordbanks, "master"))
  ]);

  const structured = normaliseCloudDb({
    practices: practiceDocs.map(p => p.data || p),
    sessions: sessionDocs.map(s => s.data || s),
    sessionTemplates: templateDocs.map(t => t.data || t),
    banks: bankSnap.exists() ? (bankSnap.data().data || bankSnap.data() || {}) : {}
  });
  primeSyncState(structured);

  const hasStructuredData = practiceDocs.length || sessionDocs.length || templateDocs.length || bankSnap.exists();
  if (hasStructuredData) return structured;

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

async function saveIncremental(data) {
  const cleanData = normaliseCloudDb(data);
  if (!syncState.primed) primeSyncState({ practices:[], sessions:[], sessionTemplates:[], banks:{} });

  const [practiceResult, sessionResult, templateResult] = await Promise.all([
    saveCollectionDelta(COLLECTIONS.practices, cleanData.practices, p => p.id, 'practices'),
    saveCollectionDelta(COLLECTIONS.sessions, cleanData.sessions, s => s.id, 'sessions'),
    saveCollectionDelta(COLLECTIONS.templates, cleanData.sessionTemplates, t => t.id, 'templates')
  ]);

  let bankChanged = 0;
  const nextBankSignature = stableStringify(cleanData.banks || {});
  if (nextBankSignature !== syncState.banksSignature) {
    await setDoc(doc(firestore, COLLECTIONS.wordbanks, "master"), {
      data: cleanData.banks,
      updatedAt: serverTimestamp()
    });
    syncState.banksSignature = nextBankSignature;
    bankChanged = 1;
  }

  const totalChanged = practiceResult.changed + sessionResult.changed + templateResult.changed + bankChanged;
  lastSavedDb = clean(cleanData);
  if (!totalChanged) return { changed:0, practices:practiceResult, sessions:sessionResult, templates:templateResult, banks:0 };

  const writeToken = `${CLIENT_ID}-${Date.now().toString(36)}-${(++saveSequence).toString(36)}`;
  lastLocalWriteToken = writeToken;
  await setDoc(doc(firestore, COLLECTIONS.meta, "main"), {
    updatedAt: serverTimestamp(),
    structure: "split-collections-v2-delta",
    practiceCount: cleanData.practices.length,
    sessionCount: cleanData.sessions.length,
    templateCount: cleanData.sessionTemplates.length,
    clientId: CLIENT_ID,
    writeToken
  });

  return {
    changed:totalChanged,
    practices:practiceResult,
    sessions:sessionResult,
    templates:templateResult,
    banks:bankChanged
  };
}

window.nickCloud = {
  save: function(data) {
    const snapshot = clean(data);
    const run = () => saveIncremental(snapshot);
    saveChain = saveChain.then(run,run);
    return saveChain;
  },

  getCurrent: async function() {
    return await loadStructuredDb();
  },

  listen: function(callback) {
    return onSnapshot(
      doc(firestore, COLLECTIONS.meta, "main"),
      async function(metaSnap) {
        const meta = metaSnap.exists() ? metaSnap.data() : null;
        if (meta && meta.clientId === CLIENT_ID && meta.writeToken === lastLocalWriteToken && lastSavedDb) {
          callback({ data:clean(lastSavedDb), source:'local-delta-save' });
          return;
        }
        const cloudDb = await loadStructuredDb();
        callback(cloudDb ? { data:cloudDb, source:'remote' } : null);
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
      structure: "split-collections-v2-delta"
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
