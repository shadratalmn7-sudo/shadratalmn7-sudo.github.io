import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  EmailAuthProvider,
  linkWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, getFirestore, increment, serverTimestamp, setDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const OWNER_EMAIL = 'shadrat.almn7@gmail.com';
const STAFF_ROLES = new Set(['owner', 'admin', 'support', 'editor', 'communityModerator']);
const AUTH_SESSION_KEY = 'shadrat_auth_session';
const ADMIN_SESSION_KEY = 'shadrat_admin_session';
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
auth.languageCode = 'ar';
let pendingGoogle = null;
let passwordSetupUser = null;
let sendingReset = false;

await setPersistence(auth, browserSessionPersistence).catch(error => console.warn('[Shadrat] session unavailable', error));

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
    'auth/email-already-in-use': 'هذا البريد مرتبط بحساب موجود. استخدم تسجيل الدخول أو Google، أو استعد كلمة المرور؛ لا تحتاج حسابًا جديدًا.',
    'auth/account-exists-with-different-credential': 'هذا البريد مرتبط بطريقة دخول أخرى. سجّل الدخول إلى حسابك الموجود أولًا لربط Google به.',
    'auth/credential-already-in-use': 'طريقة الدخول مرتبطة بحساب آخر. لم نغيّر حسابك؛ استخدم طريقة دخوله الأصلية.',
    'auth/provider-already-linked': 'كلمة المرور مضافة بالفعل. استخدم استعادة كلمة المرور لتغييرها.',
    'auth/requires-recent-login': 'أكّد حسابك باستخدام Google مرة أخرى، ثم أعد المحاولة.',
    'auth/too-many-requests': 'محاولات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مجددًا.',
    'auth/invalid-email': 'اكتب بريدًا إلكترونيًا صحيحًا.',
    'auth/popup-blocked': 'المتصفح منع نافذة Google. اسمح بالنوافذ المنبثقة أو استخدم البريد وكلمة المرور.',
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

function wantsAdminPage() {
  return safeNext()?.startsWith('admin-') || false;
}

async function prepareLoginPersistence() {
  await setPersistence(auth, browserSessionPersistence).catch(error => console.warn('[Shadrat] session mode unavailable', error));
}

function markAuthSession(user, role) {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ uid: user.uid, role, at: Date.now() }));
}

function markAdminSession(user, role, next) {
  markAuthSession(user, role);
  if (!next?.startsWith('admin-') || !STAFF_ROLES.has(role)) {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return;
  }
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ uid: user.uid, role, at: Date.now() }));
}

async function destination(user) {
  const next = safeNext();
  const role = await roleFor(user);
  if (next?.startsWith('admin-') && !STAFF_ROLES.has(role)) {
    markAdminSession(user, role, null);
    return 'profile.html';
  }
  markAdminSession(user, role, next);
  return next || 'profile.html';
}

async function referralUidFromUrl(currentUid = '') {
  const raw = new URLSearchParams(location.search).get('ref') || '';
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(raw) || raw === currentUid) return null;
  try {
    const snapshot = await withTimeout(getDoc(doc(db, 'referralCodes', raw)), 10000);
    return snapshot.exists() && snapshot.data().uid === raw ? raw : null;
  } catch {
    return null;
  }
}

function addReferralWrites(batch, uid, inviterUid) {
  if (!inviterUid) return;
  batch.set(doc(db, 'referrals', uid), {
    inviteeUid: uid,
    inviterUid,
    inviterXp: 50,
    inviteeXp: 25,
    status: 'awarded',
    createdAt: serverTimestamp()
  });
  batch.update(doc(db, 'users', inviterUid), {
    xp: increment(50),
    referralCount: increment(1),
    updatedAt: serverTimestamp()
  });
}

async function ensureGoogleProfile(user) {
  if (isOwner(user.email)) return;
  const reference = doc(db, 'users', user.uid);
  const snapshot = await withTimeout(getDoc(reference), 10000);
  if (snapshot.exists()) return;
  const base = (user.displayName || user.email?.split('@')[0] || 'student').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16) || 'student';
  const username = `${base}_${user.uid.slice(0, 5)}`.slice(0, 24);
  const inviterUid = await referralUidFromUrl(user.uid);
  const batch = writeBatch(db);
  batch.set(reference, {
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
    xp: inviterUid ? 25 : 0,
    referralCount: 0,
    level: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    authProvider: 'google',
    emailVerificationRequired: false,
    referredBy: inviterUid
  });
  addReferralWrites(batch, user.uid, inviterUid);
  await withTimeout(batch.commit(), 18000);
  setDoc(doc(db, 'referralCodes', user.uid), { uid: user.uid, createdAt: serverTimestamp() }).catch(error => console.warn('[Shadrat] referral code pending rules deployment', error));
}

document.querySelectorAll('[data-google-auth]').forEach(button => button.addEventListener('click', async () => {
  const form = document.querySelector('#login-form') || document.querySelector('#register-form');
  if (button.disabled) return;
  if (button.dataset.googleAuth === 'password') {
    passwordSetupUser = null;
    const setupForm = document.querySelector('#link-password-form');
    setupForm.reset(); setupForm.hidden = true;
  }
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  show(form, 'جارٍ فتح تسجيل Google…', 'progress');
  try {
    await prepareLoginPersistence();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await withTimeout(signInWithPopup(auth, provider), 45000);
    show(form, 'جارٍ تجهيز حسابك…', 'progress');
    await ensureGoogleProfile(result.user);
    if (button.dataset.googleAuth === 'password') {
      if (result.user.providerData.some(item => item.providerId === 'password')) {
        show(form, 'حسابك لديه كلمة مرور بالفعل. يمكنك تغييرها من «نسيت كلمة المرور».', 'success');
        return;
      }
      passwordSetupUser = result.user;
      document.querySelector('#link-password-form').hidden = false;
      document.querySelector('#link-password-account').textContent = `ستُضاف كلمة المرور إلى: ${result.user.email}`;
      show(form, 'تم تأكيد حساب Google. اختر الآن كلمة مرور خاصة بشذرات.', 'success');
      document.querySelector('#new-password').focus();
      return;
    }
    location.href = await destination(result.user);
  } catch (error) {
    if (error.code === 'auth/account-exists-with-different-credential' && document.querySelector('#login-form')) {
      const credential = GoogleAuthProvider.credentialFromError(error);
      const email = clean(error.customData?.email);
      if (credential && email) {
        pendingGoogle = {credential, email, expires: Date.now() + 300000};
        document.querySelector('#email').value = email;
        show(form, 'لديك حساب بهذا البريد. أدخل كلمة مرور شذرات لتأكيد ملكيته وربط Google بالحساب نفسه.');
      } else show(form, errorText(error));
    } else show(form, errorText(error));
  } finally {
    button.disabled = false;
    button.setAttribute('aria-busy', 'false');
  }
}));

const loginForm = document.querySelector('#login-form');
loginForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!loginForm.reportValidity() || loginForm.querySelector('[type="submit"]').disabled) return;
  setBusy(loginForm, true, 'جارٍ تسجيل الدخول…');
  show(loginForm, 'نتحقق من بياناتك…', 'progress');
  try {
    await prepareLoginPersistence();
    const credential = await withTimeout(signInWithEmailAndPassword(auth, clean(loginForm.email.value), loginForm.password.value));
    if (!credential.user.emailVerified) {
      await signOut(auth).catch(() => {});
      document.querySelector('#resend-verification').hidden = false;
      show(loginForm, 'لازم تؤكد بريدك الإلكتروني أولًا. افتح رسالة شذرات في بريدك واضغط رابط التأكيد، ثم سجل الدخول.', 'error');
      return;
    }
    if (pendingGoogle) {
      if (pendingGoogle.expires > Date.now() && pendingGoogle.email === clean(credential.user.email)) {
        await linkWithCredential(credential.user, pendingGoogle.credential);
      }
      pendingGoogle = null;
    }
    location.href = await destination(credential.user);
  } catch (error) {
    show(loginForm, errorText(error));
  } finally {
    setBusy(loginForm, false);
  }
});

if (loginForm) {
  const params = new URLSearchParams(location.search);
  const verification = params.get('verify');
  const emailFromSignup = params.get('email');
  if (emailFromSignup) loginForm.email.value = emailFromSignup;
  if (verification === 'sent' || verification === 'failed') document.querySelector('#resend-verification').hidden = false;
  if (verification === 'sent') show(loginForm, 'أرسلنا رسالة تأكيد إلى بريدك. افتحها واضغط رابط التأكيد، وبعدها سجل الدخول.', 'success');
  if (verification === 'failed') show(loginForm, 'تم إنشاء الحساب، لكن تعذر إرسال رسالة التأكيد. اكتب بريدك وكلمة المرور واضغط «إعادة إرسال رسالة التأكيد».');
}

document.querySelector('#resend-verification')?.addEventListener('click', async event => {
  event.preventDefault();
  const email = clean(loginForm?.email.value);
  const password = loginForm?.password.value || '';
  if (!email || !password) return show(loginForm, 'اكتب البريد الإلكتروني وكلمة المرور أولًا لإعادة إرسال رسالة التأكيد.');
  show(loginForm, 'جارٍ إعادة إرسال رسالة التأكيد…', 'progress');
  try {
    await prepareLoginPersistence();
    const credential = await withTimeout(signInWithEmailAndPassword(auth, email, password), 15000);
    if (credential.user.emailVerified) {
      await signOut(auth).catch(() => {});
      show(loginForm, 'بريدك مؤكد بالفعل. تقدر تسجل الدخول الآن.', 'success');
      return;
    }
    await withTimeout(sendEmailVerification(credential.user), 15000);
    await signOut(auth).catch(() => {});
    show(loginForm, 'تم إرسال رسالة تأكيد جديدة. افحص الوارد والرسائل غير المرغوبة.', 'success');
  } catch (error) {
    await signOut(auth).catch(() => {});
    show(loginForm, errorText(error));
  }
});

const resetForm = document.querySelector('#reset-form');
resetForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (sendingReset || !resetForm.reportValidity()) return;
  sendingReset = true; setBusy(resetForm, true, 'جارٍ إرسال الرابط…');
  const complete = () => show(resetForm, 'إذا كان البريد مرتبطًا بحساب، ستصلك رسالة برابط استعادة كلمة المرور. افحص الوارد والرسائل غير المرغوبة.', 'success');
  try {
    await sendPasswordResetEmail(auth, clean(resetForm.email.value), {url: new URL('login.html', location.href).href, handleCodeInApp: false});
    complete();
  } catch (error) {
    if (error.code === 'auth/user-not-found') complete();
    else show(resetForm, errorText(error));
  } finally {sendingReset = false; setBusy(resetForm, false);}
});
const linkPasswordForm = document.querySelector('#link-password-form');
linkPasswordForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!linkPasswordForm.reportValidity() || linkPasswordForm.querySelector('[type="submit"]').disabled) return;
  if (!passwordSetupUser || auth.currentUser?.uid !== passwordSetupUser.uid) return show(null, 'أكّد حساب Google أولًا.');
  const password = document.querySelector('#new-password').value;
  if (password !== document.querySelector('#confirm-password').value) return show(null, 'كلمتا المرور غير متطابقتين.');
  setBusy(linkPasswordForm, true, 'جارٍ حفظ كلمة المرور…');
  try {
    const uid = passwordSetupUser.uid;
    const result = await linkWithCredential(passwordSetupUser, EmailAuthProvider.credential(passwordSetupUser.email, password));
    if (result.user.uid !== uid) throw new Error('Account identity changed');
    linkPasswordForm.reset(); linkPasswordForm.hidden = true; passwordSetupUser = null;
    show(null, 'تمت إضافة كلمة المرور. يمكنك الآن الدخول باستخدام Google أو البريد وكلمة المرور إلى الحساب نفسه.', 'success');
  } catch (error) {show(null, errorText(error));}
  finally {setBusy(linkPasswordForm, false);}
});
document.querySelectorAll('[data-toggle-password]').forEach(button => button.addEventListener('click', () => {
  const input = document.getElementById(button.dataset.togglePassword), visible = input.type === 'password';
  input.type = visible ? 'text' : 'password'; button.textContent = visible ? 'إخفاء' : 'إظهار';
  button.setAttribute('aria-pressed', String(visible)); button.setAttribute('aria-label', visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
}));
document.querySelectorAll('[data-auth-route]').forEach(link => {
  const target = new URL(link.getAttribute('href'), location.href), current = new URLSearchParams(location.search);
  const next = safeNext(); if (next) target.searchParams.set('next', next);
  for (const key of ['ref','referral']) if (current.get(key)) target.searchParams.set(key, current.get(key));
  link.href = target.href;
});

const registerForm = document.querySelector('#register-form');
registerForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!registerForm.reportValidity() || registerForm.querySelector('[type="submit"]').disabled) return;
  const fullName = registerForm.querySelector('#full').value.trim();
  const username = normalizeUsername(registerForm.querySelector('#username').value);
  const email = clean(registerForm.querySelector('#mail').value);
  const phone = normalizePhone(registerForm.querySelector('#phone').value);
  const password = registerForm.querySelector('#pass').value;
  const confirmation = registerForm.querySelector('#confirm').value;
  const referralUid = await referralUidFromUrl();
  if (!/^[a-z0-9_]{3,24}$/.test(username) || reservedUsername(username)) return show(registerForm, 'اسم المستخدم يجب أن يكون 3–24 حرفًا إنجليزيًا أو رقمًا أو شرطة سفلية، وألا يكون اسمًا محجوزًا.');
  if (!phone) return show(registerForm, 'اكتب رقم جوال صحيحًا بصيغة دولية، مثل +9665xxxxxxxx.');
  if (password !== confirmation) return show(registerForm, 'كلمتا المرور غير متطابقتين.');

  setBusy(registerForm, true, 'جارٍ إنشاء الحساب…');
  show(registerForm, 'الخطوة 1 من 2: إنشاء حساب الدخول…', 'progress');
  let createdUser = null;
  let profileCommitted = false;
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
      xp: referralUid ? 25 : 0,
      referralCount: 0,
      level: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      authProvider: 'password',
      emailVerificationRequired: true,
      referredBy: referralUid
    });
    batch.set(doc(db, 'phoneReservations', phoneHash), { uid: createdUser.uid, createdAt: serverTimestamp() });
    batch.set(doc(db, 'usernameReservations', username), { uid: createdUser.uid, createdAt: serverTimestamp() });
    addReferralWrites(batch, createdUser.uid, referralUid);
    await withTimeout(batch.commit(), 18000);
    profileCommitted = true;
    setDoc(doc(db, 'referralCodes', createdUser.uid), { uid: createdUser.uid, createdAt: serverTimestamp() }).catch(error => console.warn('[Shadrat] referral code pending rules deployment', error));
    let verificationSent = true;
    try {
      await withTimeout(sendEmailVerification(createdUser), 15000);
    } catch (verificationError) {
      verificationSent = false;
      console.warn('[Shadrat] verification email failed', verificationError);
    }
    await signOut(auth).catch(() => {});
    const verifyState = verificationSent ? 'sent' : 'failed';
    const loginUrl = new URL('login.html', location.href);
    loginUrl.searchParams.set('verify', verifyState);
    loginUrl.searchParams.set('email', email);
    const next = safeNext(); if (next) loginUrl.searchParams.set('next', next);
    location.href = loginUrl.href;
  } catch (error) {
    console.error('[Shadrat] registration failed', error);
    if (createdUser && !profileCommitted) {
      try { await withTimeout(deleteUser(createdUser), 8000); } catch (cleanupError) { console.warn('[Shadrat] account cleanup incomplete', cleanupError); }
    }
    show(registerForm, errorText(error));
  } finally {
    setBusy(registerForm, false);
  }
});

document.querySelectorAll('[data-sign-out]').forEach(button => button.addEventListener('click', async () => {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  await signOut(auth);
  location.replace('login.html');
}));

export { auth, db, roleFor, normalizePhone, digest };
