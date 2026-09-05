(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  const builderPages = new Set(['cv-builder.html', 'motivation-letter.html']);
  const isServiceRequest = page === 'service-request.html';
  if (!builderPages.has(page) && !isServiceRequest) return;

  const SERVICE_DRAFT_KEY = 'shadrat-service-request-draft-v1';
  const serviceFieldIds = [
    'student-name',
    'student-age',
    'nationality',
    'contact-method',
    'contact-value',
    'current-country',
    'request-details'
  ];

  let authPromise = null;
  let checkingBuilder = false;
  let checkingService = false;

  const returnTarget = () => `${page}${location.search}${location.hash}`;
  const authUrl = kind => `${kind}.html?next=${encodeURIComponent(returnTarget())}`;

  function ensureStyles() {
    if (document.querySelector('style[data-account-gate-style]')) return;
    const style = document.createElement('style');
    style.dataset.accountGateStyle = '1';
    style.textContent = `
      .shadrat-account-gate{position:fixed;inset:0;z-index:2147483645;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.48);backdrop-filter:blur(7px)}
      .shadrat-account-gate[hidden]{display:none!important}
      .shadrat-account-card{width:min(440px,100%);padding:22px;border:1px solid #dbe7f5;border-radius:24px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.22);text-align:right}
      .shadrat-account-card h2{margin:0 0 8px;color:#0f172a;font-size:21px;line-height:1.45}
      .shadrat-account-card p{margin:0;color:#64748b;font-size:13px;line-height:1.85}
      .shadrat-account-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
      .shadrat-account-actions a,.shadrat-account-actions button{display:flex;align-items:center;justify-content:center;min-height:44px;padding:10px 14px;border-radius:13px;font:800 13px/1.3 Tahoma,Arial,sans-serif;text-decoration:none;cursor:pointer}
      .shadrat-account-create{border:1px solid #1d4ed8;background:#2563eb;color:#fff}
      .shadrat-account-login{border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8}
      .shadrat-account-cancel{grid-column:1/-1;border:0;background:transparent;color:#64748b}
      .shadrat-account-note{display:block;margin-top:10px;color:#64748b;font-size:11px;line-height:1.65}
      @media(max-width:480px){.shadrat-account-card{padding:18px;border-radius:20px}.shadrat-account-actions{grid-template-columns:1fr}.shadrat-account-cancel{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function saveServiceDraft() {
    if (!isServiceRequest) return;
    const data = Object.fromEntries(serviceFieldIds.map(id => [id, document.getElementById(id)?.value ?? '']));
    try {
      localStorage.setItem(SERVICE_DRAFT_KEY, JSON.stringify({
        url: `${page}${location.search}`,
        data,
        savedAt: Date.now()
      }));
    } catch (error) {
      console.warn('[Shadrat] service draft unavailable', error);
    }
  }

  function restoreServiceDraft() {
    if (!isServiceRequest) return;
    try {
      const draft = JSON.parse(localStorage.getItem(SERVICE_DRAFT_KEY) || 'null');
      if (!draft?.data || draft.url !== `${page}${location.search}`) return;
      serviceFieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && draft.data[id] != null && !el.value) el.value = draft.data[id];
      });
    } catch (error) {
      console.warn('[Shadrat] service draft restore unavailable', error);
    }
  }

  async function currentUser() {
    if (!authPromise) {
      authPromise = import('./student-artifacts.js?v=2')
        .then(module => module.waitForUser(2600))
        .catch(error => {
          console.warn('[Shadrat] account check unavailable', error);
          return null;
        })
        .finally(() => { authPromise = null; });
    }
    return authPromise;
  }

  function showGate(kind) {
    ensureStyles();
    let overlay = document.querySelector('.shadrat-account-gate');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'shadrat-account-gate';
      overlay.innerHTML = `
        <div class="shadrat-account-card" role="dialog" aria-modal="true" aria-labelledby="shadrat-account-title">
          <h2 id="shadrat-account-title"></h2>
          <p data-account-message></p>
          <span class="shadrat-account-note">بياناتك التي أدخلتها تبقى محفوظة على هذا الجهاز، وبعد التسجيل أو تسجيل الدخول سترجع لنفس الصفحة وتجدها كما هي.</span>
          <div class="shadrat-account-actions">
            <a class="shadrat-account-create" data-account-register>إنشاء حساب</a>
            <a class="shadrat-account-login" data-account-login>تسجيل الدخول</a>
            <button class="shadrat-account-cancel" type="button" data-account-cancel>إلغاء</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('[data-account-cancel]').addEventListener('click', () => { overlay.hidden = true; });
      overlay.addEventListener('click', event => { if (event.target === overlay) overlay.hidden = true; });
    }

    if (isServiceRequest) saveServiceDraft();
    overlay.querySelector('#shadrat-account-title').textContent = kind === 'service' ? 'أنشئ حسابك أولًا لإرسال الطلب' : 'أنشئ حسابك أولًا لتحميل الملف';
    overlay.querySelector('[data-account-message]').textContent = kind === 'service'
      ? 'أكمل بيانات الخدمة عادي، لكن إرسال الطلب يتطلب حسابًا في شذرات حتى يرتبط الطلب بملفك.'
      : 'تقدر تجهز الملف كامل بدون حساب، لكن عند التحميل نحتاج حساب شذرات حتى نحفظ نسختك وتقدر ترجع لها لاحقًا.';
    overlay.querySelector('[data-account-register]').href = authUrl('register');
    overlay.querySelector('[data-account-login]').href = authUrl('login');
    overlay.hidden = false;
    overlay.querySelector('[data-account-register]').focus({ preventScroll: true });
  }

  if (builderPages.has(page)) {
    document.addEventListener('click', event => {
      const button = event.target.closest('#downloadBtn');
      if (!button) return;
      if (button.dataset.accountGateBypass === '1') {
        delete button.dataset.accountGateBypass;
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      if (checkingBuilder) return;
      checkingBuilder = true;

      currentUser().then(user => {
        if (user) {
          button.dataset.accountGateBypass = '1';
          button.click();
        } else {
          showGate('download');
        }
      }).finally(() => { checkingBuilder = false; });
    }, true);
  }

  if (isServiceRequest) {
    restoreServiceDraft();
    const form = document.getElementById('request-form');
    serviceFieldIds.forEach(id => {
      const el = document.getElementById(id);
      el?.addEventListener('input', saveServiceDraft);
      el?.addEventListener('change', saveServiceDraft);
    });

    document.addEventListener('submit', event => {
      if (event.target !== form) return;
      if (form.dataset.accountGateBypass === '1') {
        delete form.dataset.accountGateBypass;
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      saveServiceDraft();
      if (checkingService) return;
      checkingService = true;

      currentUser().then(user => {
        if (user) {
          form.dataset.accountGateBypass = '1';
          form.requestSubmit();
        } else {
          showGate('service');
        }
      }).finally(() => { checkingService = false; });
    }, true);

    const successBox = document.getElementById('success-box');
    if (successBox) {
      new MutationObserver(() => {
        if (successBox.textContent.includes('تم تسجيل الطلب')) {
          try { localStorage.removeItem(SERVICE_DRAFT_KEY); } catch {}
        }
      }).observe(successBox, { childList: true, subtree: true, characterData: true });
    }
  }
})();