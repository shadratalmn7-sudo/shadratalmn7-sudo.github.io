import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, getFirestore, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const CARD_ID = 'profile-phone-link-card';
const CACHE_PREFIX = 'shadrat-profile-cache-v3:';

function normalizePhone(value = '') {
  let phone = String(value).trim().replace(/[^\d+]/g, '');
  if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;
  if (/^05\d{8}$/.test(phone)) phone = `+966${phone.slice(1)}`;
  if (/^9665\d{8}$/.test(phone)) phone = `+${phone}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : '';
}

function phoneFromProfile(data = {}) {
  return normalizePhone(data.contactValue) || normalizePhone(data.phoneE164) || normalizePhone(data.phone);
}

function ensureStyles() {
  if (document.getElementById('profile-phone-link-style')) return;
  const style = document.createElement('style');
  style.id = 'profile-phone-link-style';
  style.textContent = `
#${CARD_ID}{margin:0 0 14px;padding:14px 16px;border:1px solid #cfe0ff;border-radius:17px;background:#f7fbff;box-shadow:0 6px 18px rgba(37,99,235,.05)}
#${CARD_ID}[data-linked="true"]{border-color:#b7e4c7;background:#f1fbf5}
#${CARD_ID} .phone-link-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
#${CARD_ID} .phone-link-copy b{display:block;color:#173d75;font-size:14px;margin-bottom:4px}
#${CARD_ID} .phone-link-copy p{margin:0;color:#62718a;font-size:12px;line-height:1.7}
#${CARD_ID} .phone-link-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:11px}
#${CARD_ID} input{width:100%;min-height:45px;box-sizing:border-box;border:1px solid #cbdcf4;border-radius:12px;background:#fff;padding:9px 11px;font:inherit;text-align:left;direction:ltr}
#${CARD_ID} button{min-height:45px;white-space:nowrap}
#${CARD_ID} .phone-link-status{min-height:18px;margin-top:7px;font-size:11px;font-weight:900;color:#526b91}
#${CARD_ID} .phone-link-status.ok{color:#15803d}#${CARD_ID} .phone-link-status.err{color:#b42318}
#${CARD_ID} .phone-linked-value{font:900 14px Arial,sans-serif;direction:ltr;color:#166534;margin-top:8px}
@media(max-width:640px){#${CARD_ID}{padding:13px}#${CARD_ID} .phone-link-row{grid-template-columns:1fr}#${CARD_ID} button{width:100%}}
`;
  document.head.appendChild(style);
}

function ensureCard() {
  ensureStyles();
  let card = document.getElementById(CARD_ID);
  if (card) return card;
  card = document.createElement('section');
  card.id = CARD_ID;
  card.setAttribute('aria-live', 'polite');
  card.innerHTML = `
    <div class="phone-link-head">
      <div class="phone-link-copy">
        <b>رقم الجوال للتنبيهات</b>
        <p>أضف رقمك مرة واحدة، وسيصبح مربوطًا مباشرة بمركز إرسال الإدارة وواتساب بدون أي ربط يدوي من لوحة الإدارة.</p>
      </div>
    </div>
    <div class="phone-linked-value" data-phone-linked-value hidden></div>
    <div class="phone-link-row">
      <input data-phone-input inputmode="tel" autocomplete="tel" placeholder="+9665xxxxxxxx" aria-label="رقم الجوال">
      <button class="btn primary" type="button" data-phone-save>ربط رقم الجوال</button>
    </div>
    <div class="phone-link-status" data-phone-status></div>`;
  const tabs = document.querySelector('.profile-tabs');
  const emailCard = document.getElementById('profile-email-verification-card');
  if (emailCard?.parentNode) emailCard.insertAdjacentElement('afterend', card);
  else if (tabs?.parentNode) tabs.parentNode.insertBefore(card, tabs);
  else document.querySelector('.student-cover')?.insertAdjacentElement('afterend', card);
  return card;
}

function writeCache(user, data) {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${user.uid}`, JSON.stringify({ uid: user.uid, email: user.email || data.email || '', data, at: Date.now() }));
  } catch {}
}

function setDashboardTask(linked) {
  const apply = () => {
    if (!window.ShadratProfileDashboard?.setTask) return false;
    if (linked) window.ShadratProfileDashboard.setTask('phone-link', null);
    else window.ShadratProfileDashboard.setTask('phone-link', {
      priority: 80,
      title: 'أضف رقم الجوال',
      text: 'اربط رقمك مرة واحدة ليظهر تلقائيًا في مركز إرسال الإدارة وواتساب.',
      label: 'إضافة رقم الجوال',
      href: '#profile-phone-link-card'
    });
    return true;
  };
  if (apply()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (apply() || tries > 20) clearInterval(timer);
  }, 250);
}

function render(card, data = {}) {
  const input = card.querySelector('[data-phone-input]');
  const button = card.querySelector('[data-phone-save]');
  const value = card.querySelector('[data-phone-linked-value]');
  const linked = phoneFromProfile(data);
  card.dataset.linked = String(!!linked);
  if (linked) {
    input.value = linked;
    value.hidden = false;
    value.textContent = `مربوط مباشرة: ${linked}`;
    button.textContent = 'تحديث رقم الجوال';
  } else {
    input.value = '';
    value.hidden = true;
    value.textContent = '';
    button.textContent = 'ربط رقم الجوال';
  }
  const phoneDisplay = document.querySelector('[data-profile-value="phone"]');
  if (phoneDisplay && linked) phoneDisplay.textContent = linked;
  setDashboardTask(!!linked);
}

onAuthStateChanged(auth, async user => {
  if (!user) return;
  const card = ensureCard();
  const input = card.querySelector('[data-phone-input]');
  const button = card.querySelector('[data-phone-save]');
  const status = card.querySelector('[data-phone-status]');
  let data = {};
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    data = snap.exists() ? (snap.data() || {}) : {};
    render(card, data);
  } catch (error) {
    console.error('[Shadrat] phone link load', error);
    status.textContent = 'تعذر تحميل رقم الجوال الآن.';
    status.className = 'phone-link-status err';
  }

  if (button.dataset.wired) return;
  button.dataset.wired = '1';
  button.addEventListener('click', async () => {
    const phone = normalizePhone(input.value);
    if (!phone) {
      status.textContent = 'اكتب رقمًا صحيحًا بصيغة دولية مثل +9665xxxxxxxx.';
      status.className = 'phone-link-status err';
      input.focus();
      return;
    }
    button.disabled = true;
    status.textContent = 'جاري ربط الرقم مباشرة بمركز الإرسال…';
    status.className = 'phone-link-status';
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        contactMethod: 'رقم جوال',
        contactValue: phone,
        updatedAt: serverTimestamp()
      });
      data = { ...data, contactMethod: 'رقم جوال', contactValue: phone };
      writeCache(user, data);
      render(card, data);
      window.dispatchEvent(new CustomEvent('shadrat:profile-updated', { detail: { contactMethod: 'رقم جوال', contactValue: phone } }));
      status.textContent = 'تم الربط ✓ — الإدارة ستستخدم هذا الرقم تلقائيًا عند الإرسال عبر واتساب، بدون أي إعداد إضافي.';
      status.className = 'phone-link-status ok';
    } catch (error) {
      console.error('[Shadrat] phone link save', error);
      status.textContent = String(error?.code || '').includes('permission-denied')
        ? 'تعذر حفظ الرقم بسبب صلاحيات الحساب الحالية.'
        : 'تعذر ربط الرقم الآن. حاول مرة أخرى.';
      status.className = 'phone-link-status err';
    } finally {
      button.disabled = false;
    }
  });
});
