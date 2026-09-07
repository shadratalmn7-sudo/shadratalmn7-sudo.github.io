import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged, reload, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const CARD_ID = 'profile-email-verification-card';
const COOLDOWN_KEY = 'shadrat_email_verification_sent_at';

function isPasswordAccount(user) {
  return (user?.providerData || []).some(provider => provider?.providerId === 'password');
}

function ensureStyles() {
  if (document.getElementById('profile-email-verification-style')) return;
  const style = document.createElement('style');
  style.id = 'profile-email-verification-style';
  style.textContent = `
#${CARD_ID}{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 14px;padding:14px 16px;border:1px solid #f4c7a1;border-radius:17px;background:#fff8f1;color:#7c2d12;box-shadow:0 6px 18px rgba(124,45,18,.05)}
#${CARD_ID}[data-verified="true"]{border-color:#b7e4c7;background:#f1fbf5;color:#166534}
#${CARD_ID} .email-verify-copy{min-width:0;flex:1}
#${CARD_ID} .email-verify-copy b{display:block;font-size:14px;margin-bottom:4px}
#${CARD_ID} .email-verify-copy p{margin:0;font-size:12px;line-height:1.7;color:inherit;opacity:.88}
#${CARD_ID} .email-verify-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:flex-end}
#${CARD_ID} .email-verify-status{width:100%;font-size:11px;font-weight:800;margin-top:4px}
#${CARD_ID} .email-verify-btn{min-height:42px;white-space:nowrap}
@media(max-width:640px){#${CARD_ID}{align-items:stretch;flex-direction:column;padding:13px}#${CARD_ID} .email-verify-actions{justify-content:stretch}#${CARD_ID} .email-verify-btn{width:100%}}
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
    <div class="email-verify-copy">
      <b data-email-verify-title>جاري التحقق من البريد الإلكتروني…</b>
      <p data-email-verify-copy>نتأكد من حالة البريد المرتبط بالحساب.</p>
      <div class="email-verify-status" data-email-verify-status></div>
    </div>
    <div class="email-verify-actions">
      <button class="btn primary email-verify-btn" type="button" data-email-verify-button hidden>تفعيل البريد الإلكتروني</button>
    </div>`;
  const tabs = document.querySelector('.profile-tabs');
  if (tabs?.parentNode) tabs.parentNode.insertBefore(card, tabs);
  else document.querySelector('.student-cover')?.insertAdjacentElement('afterend', card);
  return card;
}

function setDashboardTask(verified) {
  const apply = () => {
    if (!window.ShadratProfileDashboard?.setTask) return false;
    if (verified) window.ShadratProfileDashboard.setTask('email-verification', null);
    else window.ShadratProfileDashboard.setTask('email-verification', {
      priority: 100,
      title: 'فعّل بريدك الإلكتروني',
      text: 'تفعيل البريد الإلكتروني إجباري لحماية حسابك وتسجيل الدخول لاحقًا.',
      label: 'تفعيل البريد',
      tab: 'student-info'
    });
    return true;
  };
  if (apply()) return;
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (apply() || attempts > 20) clearInterval(timer);
  }, 250);
}

function render(user, message = '') {
  const card = ensureCard();
  if (!card) return;
  const title = card.querySelector('[data-email-verify-title]');
  const copy = card.querySelector('[data-email-verify-copy]');
  const status = card.querySelector('[data-email-verify-status]');
  const button = card.querySelector('[data-email-verify-button]');
  const passwordAccount = isPasswordAccount(user);
  const verified = !passwordAccount || !!user.emailVerified;

  card.dataset.verified = String(verified);
  status.textContent = message;
  if (verified) {
    title.textContent = passwordAccount ? 'البريد الإلكتروني مفعّل ✓' : 'البريد موثّق عبر Google ✓';
    copy.textContent = passwordAccount ? 'تم تأكيد البريد المرتبط بحسابك.' : 'لا يحتاج حساب Google إلى خطوة تفعيل إضافية.';
    button.hidden = true;
  } else {
    title.textContent = 'تفعيل البريد الإلكتروني إجباري';
    copy.textContent = `البريد: ${user.email || '—'} — افتح رسالة شذرات واضغط رابط التفعيل. لن يسمح تسجيل الدخول بالبريد وكلمة المرور قبل التفعيل.`;
    button.hidden = false;
    button.textContent = 'تفعيل البريد الإلكتروني';
  }
  setDashboardTask(verified);
}

async function verifyOrSend(user, button, status) {
  button.disabled = true;
  status.textContent = 'جاري التحقق من حالة البريد…';
  try {
    await reload(user);
    if (user.emailVerified) {
      render(user, 'تم تفعيل البريد بنجاح ✓');
      return;
    }
    const lastSent = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    const elapsed = Date.now() - lastSent;
    if (elapsed < 60000) {
      const seconds = Math.max(1, Math.ceil((60000 - elapsed) / 1000));
      status.textContent = `تم إرسال الرسالة قبل قليل. انتظر ${seconds} ثانية ثم حاول مرة أخرى إذا لم تصل.`;
      return;
    }
    await sendEmailVerification(user);
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    status.textContent = 'أرسلنا رابط التفعيل إلى بريدك. افتح الرسالة واضغط الرابط، ثم ارجع لهذه الصفحة وحدّثها.';
    button.textContent = 'تحقق من التفعيل';
  } catch (error) {
    console.error('[Shadrat] email verification', error);
    const code = String(error?.code || '');
    status.textContent = code.includes('too-many-requests')
      ? 'تم طلب رسائل كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مجددًا.'
      : code.includes('network-request-failed')
        ? 'تعذر الاتصال الآن. تحقق من الإنترنت وحاول مرة أخرى.'
        : 'تعذر إرسال رسالة التفعيل الآن. حاول مرة أخرى.';
  } finally {
    button.disabled = false;
  }
}

onAuthStateChanged(auth, user => {
  if (!user) return;
  const card = ensureCard();
  const button = card?.querySelector('[data-email-verify-button]');
  const status = card?.querySelector('[data-email-verify-status]');
  if (button && !button.dataset.wired) {
    button.dataset.wired = '1';
    button.addEventListener('click', () => verifyOrSend(auth.currentUser, button, status));
  }
  render(user);
});
