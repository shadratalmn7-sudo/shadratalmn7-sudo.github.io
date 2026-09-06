import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, getFirestore } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const EVENT_WEBHOOK = 'https://hook.eu1.make.com/f2k7h9lrtectb39xsr9qfjxfcbx8fusg';
const OWNER_EMAIL = 'shadrat.almn7@gmail.com';
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const stampMs = value => value?.toMillis?.() || value?.toDate?.()?.getTime?.() || 0;

async function reportNewRegistration(user) {
  if (!user || (user.email || '').toLowerCase() === OWNER_EMAIL) return;
  const marker = `shadrat_registration_reported_${user.uid}`;
  if (localStorage.getItem(marker)) return;

  let data = null;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const snapshot = await getDoc(doc(db, 'users', user.uid));
      if (snapshot.exists()) {
        data = snapshot.data();
        if (stampMs(data.createdAt)) break;
      }
    } catch {}
    await sleep(300);
  }
  if (!data) return;

  const createdMs = stampMs(data.createdAt);
  if (!createdMs) return;
  const ageMs = Date.now() - createdMs;
  if (ageMs < -120000 || ageMs > 60 * 60 * 1000) {
    localStorage.setItem(marker, 'old');
    return;
  }

  try {
    const idToken = await user.getIdToken();
    const payload = new URLSearchParams({
      idToken,
      uid: user.uid,
      eventType: 'registration',
      eventTitle: 'طالب جديد سجل في شذرات',
      studentName: data.fullName || user.displayName || 'طالب شذرات',
      studentEmail: user.email || data.email || '',
      provider: data.authProvider || user.providerData?.[0]?.providerId || '',
      occurredAt: new Date(createdMs).toISOString()
    });
    const response = await fetch(EVENT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: payload,
      keepalive: true
    });
    if (response.ok) localStorage.setItem(marker, new Date().toISOString());
  } catch (error) {
    console.warn('[Shadrat] registration report pending', error);
  }
}

onAuthStateChanged(auth, user => {
  if (user) reportNewRegistration(user).catch(() => {});
});
