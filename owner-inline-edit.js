import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { collection, doc, getDocs, getFirestore, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const OWNER_EMAIL = 'shadrat.almn7@gmail.com';
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const editableSelector = '[data-edit-key]';
const style = document.createElement('style');
style.textContent = `
  .owner-inline-ready ${editableSelector}{outline:1px dashed transparent;transition:.15s ease;position:relative}.owner-inline-ready ${editableSelector}:hover{outline-color:#dcae5a;background:#fff8df55}.owner-edit-btn{position:absolute;z-index:80;min-width:34px;height:30px;border:1px solid #d0b36b;border-radius:999px;background:#fff8df;color:#6b4e12;font-size:12px;font-weight:900;box-shadow:0 8px 22px #17352b18;cursor:pointer}.owner-edit-btn:hover{background:#dcae5a;color:#2d250f}.owner-edit-modal{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;background:#09251bcc;padding:18px}.owner-edit-box{width:min(560px,100%);border-radius:24px;background:#fffdf8;border:1px solid #e1d6c4;box-shadow:0 30px 80px #0004;padding:18px;direction:rtl}.owner-edit-box h2{margin:0 0 8px;font-size:22px}.owner-edit-box p{margin:0 0 12px;color:#68766f;font-size:13px}.owner-edit-box textarea{width:100%;min-height:150px;border:1px solid #d8cebe;border-radius:18px;padding:14px;font:inherit;line-height:1.8;resize:vertical}.owner-edit-actions{display:flex;gap:10px;justify-content:flex-start;flex-wrap:wrap;margin-top:12px}.owner-edit-actions button{border:0;border-radius:14px;padding:11px 16px;font:inherit;font-weight:900;cursor:pointer}.owner-edit-save{background:#176b4b;color:#fff}.owner-edit-cancel{background:#efe7da;color:#17352b}.owner-edit-status{margin-top:9px;color:#176b4b;font-size:13px;font-weight:900}.owner-edit-disabled{position:fixed;left:12px;bottom:12px;z-index:1200;max-width:320px;border:1px solid #edd2a0;background:#fff8df;color:#604714;border-radius:16px;padding:12px;font-size:12px;box-shadow:0 12px 30px #17352b18}`;
document.head.appendChild(style);

const textOf = element => element.textContent.trim();
const setText = (key, value) => {
  document.querySelectorAll(`[data-edit-key="${CSS.escape(key)}"]`).forEach(element => {
    element.textContent = value;
  });
};

async function applySavedText() {
  try {
    const snap = await getDocs(collection(db, 'siteText'));
    snap.forEach(item => {
      const data = item.data() || {};
      if (typeof data.value === 'string') setText(item.id, data.value);
    });
  } catch (error) {
    console.warn('[Shadrat] saved text unavailable', error);
  }
}

function openEditor(element) {
  const key = element.dataset.editKey;
  const current = textOf(element);
  const modal = document.createElement('div');
  modal.className = 'owner-edit-modal';
  modal.innerHTML = `<div class="owner-edit-box" role="dialog" aria-modal="true"><h2>تعديل سريع</h2><p>التعديل هنا يحفظ النص في نفس الصفحة ويظهر للزوار بعد التحديث.</p><textarea>${current.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</textarea><div class="owner-edit-actions"><button class="owner-edit-save" type="button">حفظ</button><button class="owner-edit-cancel" type="button">إلغاء</button></div><div class="owner-edit-status" aria-live="polite"></div></div>`;
  document.body.appendChild(modal);
  const textarea = modal.querySelector('textarea');
  const status = modal.querySelector('.owner-edit-status');
  textarea.focus();
  modal.querySelector('.owner-edit-cancel').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', event => { if (event.target === modal) modal.remove(); });
  modal.querySelector('.owner-edit-save').addEventListener('click', async () => {
    const value = textarea.value.trim();
    if (!value) { status.textContent = 'النص لا يكون فاضي.'; return; }
    status.textContent = 'جاري الحفظ…';
    try {
      await setDoc(doc(db, 'siteText', key), { value, page: location.pathname.split('/').pop() || 'index.html', updatedAt: serverTimestamp() }, { merge: true });
      setText(key, value);
      status.textContent = 'تم الحفظ.';
      setTimeout(() => modal.remove(), 500);
    } catch (error) {
      console.error(error);
      status.textContent = 'تعذر الحفظ. تأكد أن حسابك مالك وأن صلاحيات Firestore تسمح بالتعديل.';
    }
  });
}

function placeButton(button, target) {
  const rect = target.getBoundingClientRect();
  button.style.top = `${Math.max(8, rect.top + window.scrollY - 12)}px`;
  button.style.left = `${Math.max(8, rect.left + window.scrollX + 4)}px`;
}

function enableOwnerEdit() {
  document.documentElement.classList.add('owner-inline-ready');
  document.querySelectorAll(editableSelector).forEach(element => {
    element.addEventListener('mouseenter', () => {
      if (document.querySelector('.owner-edit-modal')) return;
      let button = document.querySelector('.owner-edit-btn');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'owner-edit-btn';
        button.textContent = 'تعديل';
        document.body.appendChild(button);
      }
      button.onclick = event => { event.preventDefault(); event.stopPropagation(); openEditor(element); };
      placeButton(button, element);
      button.hidden = false;
    });
  });
  window.addEventListener('scroll', () => { const button = document.querySelector('.owner-edit-btn'); if (button) button.hidden = true; }, { passive: true });
}

applySavedText();
onAuthStateChanged(auth, user => {
  if (user?.email === OWNER_EMAIL) enableOwnerEdit();
});