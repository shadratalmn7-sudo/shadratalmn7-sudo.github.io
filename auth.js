import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const OWNER_EMAIL = 'shadrat.almn7@gmail.com';
const STAFF_ROLES = new Set(['owner', 'admin', 'support', 'editor', 'communityModerator']);
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

await setPersistence(auth, browserLocalPersistence).catch(error => console.warn('[Shadrat] local session unavailable', error));

const clean = (value = '') => String(value).trim().toLowerCase();
const isOwner = email => clean(email) === OWNER_EMAIL;
const normalizeUsername = value => clean(value).replace(/^@/, '');
const reservedUsername = value => /(^|_)(owner|admin|support|staff|shazarat|شذرات|مالك|ادارة|إدارة)(_|$)/i.test(value);

function normalizePhone(value = '') {
  let phone = String(value).replace(/[^\d+]/g, '');
  if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;
  if (/^05\d{8}$/.test(phone)) phone = `+966${phone.slice(1)}`;
  if (/^9665\d{8}$/.test(phone)) phone = `+${phone}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

function withTimeout(promise, milliseconds = 15000) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('request-timeout'), { code: 'request-timeout' })), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function errorText(error) {
  if (error?.message?.includes('phone-already-used')) return 'رقم الجوال مستخدم في حساب آخر.';
  const known = {
    'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    'auth/email-already-in-use': 'هذا البريد مستخدم في حساب آخر. جرّب تسجيل الدخول.',
    'auth/weak-password': 'اختر كلمة مرور أقوى لا تقل عن 10 أحرف.',
    'auth/popup-closed-by-user': 'أُغلقت نافذة Google قبل إكمال العملية.',
    'auth/cancelled-popup-request': 'أُلغيت نافذة Google السابقة. حاول مجددًا.',
    'auth/unauthorized-domain': 'تعذر التسجيل من هذا النطاق. تواصل مع إدارة شذرات.',
    'auth/operation-not-allowed': 'طريقة التسجيل هذه غير مفعلة حاليًا.',
    'auth/network-request-failed': 'الاتصال بطيء أو منقطع. تحقق من الإنترنت وحاول مجددًا.',
    'permission-denied': 'اسم المستخدم أو رقم الجوال مستخدم مسبقًا، أو تعذر حفظ الملف.',
    'firestore/permission-denied': 'اسم المستخدم أو رقم الجوال مستخدم مسبقًا، أو تعذر حفظ الملف.',
    'firestore/unavailable': 'خدمة الحسابات غير متاحة مؤقتًا. حاول بعد قليل.',
    'request-timeout': 'استغرق الاتصال وقتًا طويلًا. لم تكتمل العملية؛ حاول مجددًا.'
  };
  return known[error?.code] || 'تعذر إكمال العملية الآن. حاول مجددًا.';
}

function show(form, text, type = 'error') {
  const node = form?.querySelector('[data-auth-message]') || document.querySelector('[data-auth-message]');
  if (!node) return;
  node.textContent = text;
  node.className = `auth-message ${type}`;
}

function setBusy(form, busy, label) {
  const button = form?.querySelector('[type="submit"]');
  if (!button) return;
  if (!button.dataset.idleLabel) button.dataset.idleLabel = button.textContent.trim();
  button.disabled = busy;
  button.setAttribute('aria-busy', String(busy));
  button.textContent = busy ? label : button.dataset.idleLabel;
}

async function roleFor(user) {
  if (!user) return null;
  if (isOwner(user.email)) return 'owner';
  try {
    const snapshot = await withTimeout(getDoc(doc(db, 'users', user.uid)), 10000);
    return snapshot.exists() ? snapshot.data().role || 'student' : 'student';
  } catch {
    return 'student';
  }
}

function safeNext() {
  const next = new URLSearchParams(location.search).get('next');
  if (!next) return null;
  try {
    const url = new URL(next, location.origin);
    return url.origin === location.origin ? `${url.pathname.split('/').pop() || 'index.html'}${url.search}${url.hash}` : null;
  } catch {
    return null;
  }
}

async function destination(user) {
  const next = safeNext();
  const role = await roleFor(user);
  if (next?.startsWith('admin-') && !STAFF_ROLES.has(role)) return 'profile.html';
  return next || (STAFF_ROLES.has(role) ? 'admin-analytics.html' : 'profile.html');
}

async function ensureGoogleProfile(user) {
  if (isOwner(user.email)) return;
  const reference = doc(db, 'users', user.uid);
  const snapshot = await withTimeout(getDoc(reference), 10000);
  if (snapshot.exists()) return;
  const base = (user.displayName || user.email?.split('@')[0] || 'student').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16) || 'student';
  const username = `${base}_${user.uid.slice(0, 5)}`.slice(0, 24);
  await withTimeout(setDoc(reference, {
    uid: user.uid,
    fullName: user.displayName || 'طالب شذرات',
    username,
    email: user.email || '',
    role: 'student',
    accountStatus: 'active',
    publicProfile: false,
    avatarKey: null,
    location: '',
    studyLevel: '',
    xp: 0,
    level: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    authProvider: 'google'
  }), 15000);
}

document.querySelectorAll('[data-google-auth]').forEach(button => button.addEventListener('click', async () => {
  const form = document.querySelector('#login-form') || document.querySelector('#register-form');
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  show(form, 'جارٍ فتح تسجيل Google…', 'progress');
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await withTimeout(signInWithPopup(auth, provider), 45000);
    show(form, 'جارٍ تجهيز حسابك…', 'progress');
    await ensureGoogleProfile(result.user);
    location.href = await destination(result.user);
  } catch (error) {
    show(form, errorText(error));
  } finally {
    button.disabled = false;
    button.setAttribute('aria-busy', 'false');
  }
}));

const loginForm = document.querySelector('#login-form');
loginForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;
  setBusy(loginForm, true, 'جارٍ تسجيل الدخول…');
  show(loginForm, 'نتحقق من بياناتك…', 'progress');
  try {
    const credential = await withTimeout(signInWithEmailAndPassword(auth, clean(loginForm.email.value), loginForm.password.value));
    location.href = await destination(credential.user);
  } catch (error) {
    show(loginForm, errorText(error));
  } finally {
    setBusy(loginForm, false);
  }
});

document.querySelector('#reset-password')?.addEventListener('click', async event => {
  event.preventDefault();
  const email = clean(loginForm?.email.value);
  if (!email) return show(loginForm, 'اكتب بريدك الإلكتروني أولًا.');
  show(loginForm, 'جارٍ إرسال رابط الاستعادة…', 'progress');
  try {
    await withTimeout(sendPasswordResetEmail(auth, email));
    show(loginForm, 'أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.', 'success');
  } catch (error) {
    show(loginForm, errorText(error));
  }
});

const registerForm = document.querySelector('#register-form');
registerForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!registerForm.reportValidity()) return;
  const fullName = registerForm.querySelector('#full').value.trim();
  const username = normalizeUsername(registerForm.querySelector('#username').value);
  const email = clean(registerForm.querySelector('#mail').value);
  const phone = normalizePhone(registerForm.querySelector('#phone').value);
  const password = registerForm.querySelector('#pass').value;
  const confirmation = registerForm.querySelector('#confirm').value;
  if (!/^[a-z0-9_]{3,24}$/.test(username) || reservedUsername(username)) return show(registerForm, 'اسم المستخدم يجب أن يكون 3–24 حرفًا إنجليزيًا أو رقمًا أو شرطة سفلية، وألا يكون اسمًا محجوزًا.');
  if (!phone) return show(registerForm, 'اكتب رقم جوال صحيحًا بصيغة دولية، مثل +9665xxxxxxxx.');
  if (password !== confirmation) return show(registerForm, 'كلمتا المرور غير متطابقتين.');

  setBusy(registerForm, true, 'جارٍ إنشاء الحساب…');
  show(registerForm, 'الخطوة 1 من 2: إنشاء حساب الدخول…', 'progress');
  let createdUser = null;
  try {
    const phoneHash = await digest(phone);
    const credential = await withTimeout(createUserWithEmailAndPassword(auth, email, password));
    createdUser = credential.user;
    await withTimeout(updateProfile(createdUser, { displayName: fullName }), 10000);
    show(registerForm, 'الخطوة 2 من 2: حفظ ملف الطالب…', 'progress');
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', createdUser.uid), {
      uid: createdUser.uid,
      fullName,
      username,
      email,
      phoneE164: phone,
      phoneLast4: phone.slice(-4),
      role: 'student',
      accountStatus: 'active',
      publicProfile: false,
      avatarKey: null,
      location: '',
      studyLevel: '',
      xp: 0,
      level: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      authProvider: 'password'
    });
    batch.set(doc(db, 'phoneReservations', phoneHash), { uid: createdUser.uid, createdAt: serverTimestamp() });
    batch.set(doc(db, 'usernameReservations', username), { uid: createdUser.uid, createdAt: serverTimestamp() });
    await withTimeout(batch.commit(), 18000);
    sendEmailVerification(createdUser).catch(() => {});
    show(registerForm, 'تم إنشاء الحساب بنجاح. جارٍ فتح ملفك…', 'success');
    location.href = await destination(createdUser);
  } catch (error) {
    console.error('[Shadrat] registration failed', error);
    if (createdUser) {
      try { await withTimeout(deleteUser(createdUser), 8000); } catch (cleanupError) { console.warn('[Shadrat] account cleanup incomplete', cleanupError); }
    }
    show(registerForm, errorText(error));
  } finally {
    setBusy(registerForm, false);
  }
});

document.querySelectorAll('[data-sign-out]').forEach(button => button.addEventListener('click', async () => {
  await signOut(auth);
  location.replace('login.html');
}));

export { auth, db, roleFor, normalizePhone, digest };
