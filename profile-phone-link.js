import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, getFirestore, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const CARD_ID = 'profile-phone-link-card';
const CACHE_PREFIX = 'shadrat-profile-cache-v3:';

const COUNTRY_DIALS = [
  ['SA','966'],['YE','967'],['AE','971'],['OM','968'],['QA','974'],['KW','965'],['BH','973'],['JO','962'],['PS','970'],['LB','961'],['SY','963'],['IQ','964'],['EG','20'],['SD','249'],['SO','252'],['DJ','253'],['KM','269'],['LY','218'],['TN','216'],['DZ','213'],['MA','212'],['MR','222'],
  ['TR','90'],['RU','7'],['KZ','7'],['UZ','998'],['KG','996'],['TJ','992'],['TM','993'],['AZ','994'],['AM','374'],['GE','995'],['AF','93'],['PK','92'],['IN','91'],['BD','880'],['LK','94'],['NP','977'],['BT','975'],['MV','960'],
  ['CN','86'],['HK','852'],['MO','853'],['TW','886'],['JP','81'],['KR','82'],['KP','850'],['MN','976'],['MY','60'],['SG','65'],['ID','62'],['BN','673'],['PH','63'],['TH','66'],['VN','84'],['KH','855'],['LA','856'],['MM','95'],['TL','670'],
  ['GB','44'],['IE','353'],['FR','33'],['DE','49'],['IT','39'],['ES','34'],['PT','351'],['NL','31'],['BE','32'],['LU','352'],['CH','41'],['AT','43'],['SE','46'],['NO','47'],['DK','45'],['FI','358'],['IS','354'],['PL','48'],['CZ','420'],['SK','421'],['HU','36'],['RO','40'],['BG','359'],['GR','30'],['CY','357'],['MT','356'],['AL','355'],['BA','387'],['HR','385'],['RS','381'],['ME','382'],['MK','389'],['SI','386'],['XK','383'],['MD','373'],['UA','380'],['BY','375'],['LT','370'],['LV','371'],['EE','372'],
  ['US','1'],['CA','1'],['MX','52'],['GT','502'],['BZ','501'],['SV','503'],['HN','504'],['NI','505'],['CR','506'],['PA','507'],['CU','53'],['JM','1'],['HT','509'],['DO','1'],['BS','1'],['BB','1'],['TT','1'],['AG','1'],['DM','1'],['GD','1'],['KN','1'],['LC','1'],['VC','1'],
  ['BR','55'],['AR','54'],['CL','56'],['CO','57'],['PE','51'],['VE','58'],['EC','593'],['BO','591'],['PY','595'],['UY','598'],['GY','592'],['SR','597'],
  ['AU','61'],['NZ','64'],['FJ','679'],['PG','675'],['WS','685'],['TO','676'],['VU','678'],['SB','677'],['KI','686'],['TV','688'],['NR','674'],['PW','680'],['FM','691'],['MH','692'],
  ['ZA','27'],['NG','234'],['GH','233'],['KE','254'],['TZ','255'],['UG','256'],['RW','250'],['BI','257'],['ET','251'],['ER','291'],['SS','211'],['TD','235'],['CF','236'],['CM','237'],['GQ','240'],['GA','241'],['CG','242'],['CD','243'],['AO','244'],['ZM','260'],['ZW','263'],['BW','267'],['NA','264'],['SZ','268'],['LS','266'],['MZ','258'],['MW','265'],['MG','261'],['MU','230'],['SC','248'],['CV','238'],['SN','221'],['GM','220'],['GN','224'],['GW','245'],['SL','232'],['LR','231'],['CI','225'],['BF','226'],['ML','223'],['NE','227'],['TG','228'],['BJ','229'],['ST','239'],
  ['IL','972'],['IR','98'],['MN','976'],['GL','299'],['FO','298'],['GI','350'],['AD','376'],['MC','377'],['SM','378'],['VA','379'],['LI','423']
];

const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['ar'], { type: 'region' })
  : null;
const COUNTRIES = COUNTRY_DIALS.map(([iso, dial]) => ({
  iso,
  dial,
  name: regionNames?.of(iso) || iso,
  flag: iso === 'XK' ? '🇽🇰' : String.fromCodePoint(...iso.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
})).sort((a, b) => a.name.localeCompare(b.name, 'ar'));

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

function countryLabel(country) {
  return `${country.flag} ${country.name} (+${country.dial})`;
}

function searchText(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u064B-\u065F\u0670]/g, '').trim();
}

function detectCountry(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return COUNTRIES.find(c => c.iso === 'SA') || COUNTRIES[0];
  const matches = COUNTRIES.filter(c => digits.startsWith(c.dial)).sort((a, b) => b.dial.length - a.dial.length);
  return matches[0] || COUNTRIES.find(c => c.iso === 'SA') || COUNTRIES[0];
}

function nationalFromPhone(phone = '', country) {
  const digits = String(phone).replace(/\D/g, '');
  if (!country || !digits) return '';
  return digits.startsWith(country.dial) ? digits.slice(country.dial.length) : digits;
}

function toE164(country, raw = '') {
  if (!country) return '';
  const direct = normalizePhone(raw);
  if (direct && direct.startsWith(`+${country.dial}`)) return direct;
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith(country.dial)) digits = digits.slice(country.dial.length);
  digits = digits.replace(/^0+/, '');
  const phone = `+${country.dial}${digits}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : '';
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
#${CARD_ID} .country-picker{position:relative;margin-top:12px}
#${CARD_ID} .country-label{display:block;margin-bottom:6px;color:#294866;font-size:12px;font-weight:900}
#${CARD_ID} .country-trigger{width:100%;min-height:46px;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #cbdcf4;border-radius:12px;background:#fff;padding:10px 12px;color:#17324f;font:inherit;font-weight:800;cursor:pointer;text-align:right}
#${CARD_ID} .country-trigger:after{content:'⌄';color:#64748b;font-size:18px}
#${CARD_ID} .country-menu{position:absolute;z-index:40;top:calc(100% + 6px);right:0;left:0;padding:8px;border:1px solid #cbdcf4;border-radius:14px;background:#fff;box-shadow:0 16px 38px rgba(15,23,42,.14)}
#${CARD_ID} .country-search{width:100%;min-height:42px;box-sizing:border-box;border:1px solid #d7e2f0;border-radius:10px;padding:8px 10px;font:inherit;text-align:right;direction:rtl}
#${CARD_ID} .country-list{display:grid;gap:3px;max-height:260px;overflow:auto;margin-top:7px}
#${CARD_ID} .country-option{width:100%;min-height:42px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;border:0;border-radius:10px;background:#fff;padding:8px 10px;color:#17324f;font:inherit;cursor:pointer;text-align:right}
#${CARD_ID} .country-option:hover,#${CARD_ID} .country-option:focus{background:#eef5ff;outline:none}
#${CARD_ID} .country-option small{direction:ltr;color:#64748b;font:800 12px Arial,sans-serif}
#${CARD_ID} .country-empty{padding:14px;text-align:center;color:#64748b;font-size:12px}
#${CARD_ID} .phone-link-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}
#${CARD_ID} .phone-number-field{display:grid;grid-template-columns:auto 1fr;align-items:center;border:1px solid #cbdcf4;border-radius:12px;background:#fff;overflow:hidden}
#${CARD_ID} .dial-prefix{padding:0 11px;border-left:1px solid #e2e8f0;color:#173d75;font:900 13px Arial,sans-serif;direction:ltr}
#${CARD_ID} .phone-number-field input{width:100%;min-height:45px;box-sizing:border-box;border:0;background:transparent;padding:9px 11px;font:inherit;text-align:left;direction:ltr;outline:none}
#${CARD_ID} button[data-phone-save]{min-height:45px;white-space:nowrap}
#${CARD_ID} .phone-link-status{min-height:18px;margin-top:7px;font-size:11px;font-weight:900;color:#526b91}
#${CARD_ID} .phone-link-status.ok{color:#15803d}#${CARD_ID} .phone-link-status.err{color:#b42318}
#${CARD_ID} .phone-linked-value{font:900 14px Arial,sans-serif;direction:ltr;color:#166534;margin-top:8px}
@media(max-width:640px){#${CARD_ID}{padding:13px}#${CARD_ID} .phone-link-row{grid-template-columns:1fr}#${CARD_ID} button[data-phone-save]{width:100%}.country-menu{position:fixed!important;inset:auto 10px 14px 10px!important;max-height:62vh}.country-list{max-height:48vh!important}}
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
        <p>اختر الدولة أولًا، ثم اكتب رقمك. سيتم ربطه مباشرة بمركز إرسال الإدارة وواتساب بدون إعداد يدوي.</p>
      </div>
    </div>
    <div class="phone-linked-value" data-phone-linked-value hidden></div>
    <div class="country-picker" data-country-picker>
      <span class="country-label">الدولة</span>
      <button class="country-trigger" type="button" data-country-trigger aria-haspopup="listbox" aria-expanded="false">اختر الدولة</button>
      <div class="country-menu" data-country-menu hidden>
        <input class="country-search" data-country-search type="search" autocomplete="off" placeholder="ابحث باسم الدولة أو مفتاحها..." aria-label="البحث عن الدولة">
        <div class="country-list" data-country-list role="listbox"></div>
      </div>
    </div>
    <div class="phone-link-row">
      <div class="phone-number-field">
        <span class="dial-prefix" data-dial-prefix>+---</span>
        <input data-phone-input inputmode="tel" autocomplete="tel-national" placeholder="رقم الجوال" aria-label="رقم الجوال">
      </div>
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
      text: 'اختر دولتك ثم اربط رقمك مرة واحدة ليظهر تلقائيًا في مركز إرسال الإدارة وواتساب.',
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

function setupCountryPicker(card) {
  const trigger = card.querySelector('[data-country-trigger]');
  const menu = card.querySelector('[data-country-menu]');
  const search = card.querySelector('[data-country-search]');
  const list = card.querySelector('[data-country-list]');
  const prefix = card.querySelector('[data-dial-prefix]');
  let selected = null;

  function renderList(query = '') {
    const q = searchText(query);
    const rows = COUNTRIES.filter(c => !q || searchText(`${c.name} ${c.iso} +${c.dial} ${c.dial}`).includes(q));
    list.innerHTML = rows.length ? rows.map(c => `
      <button type="button" class="country-option" data-country-iso="${c.iso}" role="option">
        <span>${c.flag} ${c.name}</span><small>+${c.dial}</small>
      </button>`).join('') : '<div class="country-empty">لا توجد دولة مطابقة للبحث.</div>';
  }

  function choose(country, { close = true } = {}) {
    selected = country;
    trigger.textContent = countryLabel(country);
    prefix.textContent = `+${country.dial}`;
    card.dataset.countryIso = country.iso;
    if (close) {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
  }

  function open() {
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    search.value = '';
    renderList('');
    setTimeout(() => search.focus(), 0);
  }

  trigger.addEventListener('click', () => menu.hidden ? open() : (menu.hidden = true, trigger.setAttribute('aria-expanded', 'false')));
  search.addEventListener('input', () => renderList(search.value));
  list.addEventListener('click', event => {
    const option = event.target.closest('[data-country-iso]');
    if (!option) return;
    const country = COUNTRIES.find(c => c.iso === option.dataset.countryIso);
    if (country) choose(country);
  });
  document.addEventListener('click', event => {
    if (!card.querySelector('[data-country-picker]')?.contains(event.target)) {
      menu.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  renderList('');
  return {
    getSelected: () => selected,
    choose,
    chooseFromPhone(phone) {
      const country = detectCountry(phone);
      choose(country, { close: true });
      return country;
    },
    clear() {
      selected = null;
      trigger.textContent = 'اختر الدولة';
      prefix.textContent = '+---';
      delete card.dataset.countryIso;
    },
    open
  };
}

function render(card, picker, data = {}) {
  const input = card.querySelector('[data-phone-input]');
  const button = card.querySelector('[data-phone-save]');
  const value = card.querySelector('[data-phone-linked-value]');
  const linked = phoneFromProfile(data);
  card.dataset.linked = String(!!linked);
  if (linked) {
    const country = picker.chooseFromPhone(linked);
    input.value = nationalFromPhone(linked, country);
    value.hidden = false;
    value.textContent = `مربوط مباشرة: ${linked}`;
    button.textContent = 'تحديث رقم الجوال';
  } else {
    picker.clear();
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
  const picker = setupCountryPicker(card);
  const input = card.querySelector('[data-phone-input]');
  const button = card.querySelector('[data-phone-save]');
  const status = card.querySelector('[data-phone-status]');
  let data = {};
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    data = snap.exists() ? (snap.data() || {}) : {};
    render(card, picker, data);
  } catch (error) {
    console.error('[Shadrat] phone link load', error);
    status.textContent = 'تعذر تحميل رقم الجوال الآن.';
    status.className = 'phone-link-status err';
  }

  if (button.dataset.wired) return;
  button.dataset.wired = '1';
  button.addEventListener('click', async () => {
    const country = picker.getSelected();
    if (!country) {
      status.textContent = 'اختر الدولة أولًا.';
      status.className = 'phone-link-status err';
      picker.open();
      return;
    }
    const phone = toE164(country, input.value);
    if (!phone) {
      status.textContent = `اكتب رقم جوال صحيح بعد مفتاح الدولة +${country.dial}.`;
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
      render(card, picker, data);
      window.dispatchEvent(new CustomEvent('shadrat:profile-updated', { detail: { contactMethod: 'رقم جوال', contactValue: phone } }));
      status.textContent = 'تم الربط ✓ — الرقم محفوظ بصيغته الدولية وتستخدمه الإدارة تلقائيًا عند الإرسال.';
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
