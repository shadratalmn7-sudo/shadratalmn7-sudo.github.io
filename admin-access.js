import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, getFirestore } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

document.body?.setAttribute('data-admin-page','');
document.documentElement.classList.add('admin-pending');
if (!document.getElementById('admin-access-guard-style')) {
  const style = document.createElement('style');
  style.id = 'admin-access-guard-style';
  style.textContent = `html.admin-pending body{visibility:hidden!important}html.admin-authorized body{visibility:visible!important}`;
  document.head.appendChild(style);
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const OWNER_EMAIL = 'shadrat.almn7@gmail.com';
const MESSAGE_TEAM_EMAILS = new Set([OWNER_EMAIL, '7ruahmed@mail.ru', '7ruarafat@gmail.com']);
const AUTH_SESSION_KEY = 'shadrat_auth_session';
const ADMIN_SESSION_KEY = 'shadrat_admin_session';
const ADMIN_SESSION_MAX_AGE = 12 * 60 * 60 * 1000;
const access = {
  'admin-staff.html': ['owner'],
  'admin-users.html': ['owner', 'admin', 'support'],
  'admin-student.html': ['owner', 'admin', 'support'],
  'admin-scholarships.html': ['owner', 'admin', 'editor'],
  'admin-services.html': ['owner', 'admin', 'editor'],
  'admin-offers.html': ['owner', 'admin', 'editor'],
  'admin-videos.html': ['owner', 'admin', 'editor'],
  'admin-homepage.html': ['owner', 'admin', 'editor'],
  'admin-orders.html': ['owner', 'admin', 'support'],
  'admin-messages.html': ['owner', 'admin', 'support'],
  'admin-gamification.html': ['owner', 'admin'],
  'admin-announcements.html': ['owner', 'admin'],
  'admin-security.html': ['owner', 'admin'],
  'admin-revenue.html': ['owner', 'admin'],
  'admin-analytics.html': ['owner', 'admin', 'support', 'editor']
};

function waitForUser(milliseconds = 12000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('auth-timeout')), milliseconds);
    const stop = onAuthStateChanged(auth, user => {
      clearTimeout(timeout);
      stop();
      resolve(user);
    }, error => {
      clearTimeout(timeout);
      stop();
      reject(error);
    });
  });
}

function withTimeout(promise, milliseconds = 10000) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('profile-timeout')), milliseconds))]);
}

function hasFreshSession(key, user) {
  try {
    const session = JSON.parse(sessionStorage.getItem(key) || 'null');
    return session?.uid === user.uid && Date.now() - Number(session.at || 0) <= ADMIN_SESSION_MAX_AGE;
  } catch {
    return false;
  }
}

function hasFreshAdminSession(user) {
  return hasFreshSession(ADMIN_SESSION_KEY, user) || hasFreshSession(AUTH_SESSION_KEY, user);
}

async function rejectSavedAdminSession() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  await signOut(auth).catch(() => {});
  throw new Error('admin-login-required');
}

export async function requireAdmin() {
  document.body?.setAttribute('data-admin-page','');
  document.documentElement.classList.add('admin-pending');
  document.documentElement.classList.remove('admin-authorized');
  const user = await waitForUser();
  if (!user) throw new Error('not-authenticated');
  if (!hasFreshAdminSession(user)) await rejectSavedAdminSession();
  const email = (user.email || '').toLowerCase();
  const owner = email === OWNER_EMAIL;
  let role = owner ? 'owner' : 'student';
  if (!owner) {
    if (!user.emailVerified) throw new Error('email-not-verified');
    const snapshot = await withTimeout(getDoc(doc(db, 'users', user.uid)));
    if (!snapshot.exists()) throw new Error('profile-missing');
    const profile = snapshot.data();
    if (profile.accountStatus !== 'active') throw new Error('account-disabled');
    role = profile.role || 'student';
  }
  const page = location.pathname.split('/').pop() || '';
  const messageTeam = MESSAGE_TEAM_EMAILS.has(email);
  const allowedByRole = (access[page] || ['owner', 'admin']).includes(role);
  const allowedMessageTeam = page === 'admin-messages.html' && messageTeam;
  if (!allowedByRole && !allowedMessageTeam) throw new Error('not-authorized');
  if (document.body) {
    document.body.dataset.role = role;
    document.body.dataset.messageTeam = messageTeam ? 'true' : 'false';
  }
  document.documentElement.classList.remove('admin-pending');
  document.documentElement.classList.add('admin-authorized');
  return { user, role, messageTeam };
}
