import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, getFirestore } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const OWNER_EMAIL = 'shadrat.almn7@gmail.com';
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
  'admin-community.html': ['owner', 'admin', 'communityModerator'],
  'admin-gamification.html': ['owner', 'admin'],
  'admin-announcements.html': ['owner', 'admin'],
  'admin-security.html': ['owner', 'admin'],
  'admin-revenue.html': ['owner', 'admin'],
  'admin-analytics.html': ['owner', 'admin', 'support', 'editor', 'communityModerator']
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

export async function requireAdmin() {
  const user = await waitForUser();
  if (!user) throw new Error('not-authenticated');
  const owner = (user.email || '').toLowerCase() === OWNER_EMAIL;
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
  if (!(access[page] || ['owner', 'admin']).includes(role)) throw new Error('not-authorized');
  return { user, role };
}
