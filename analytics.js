(() => {
  if (window.__shadratAnalyticsLoaded) return;
  window.__shadratAnalyticsLoaded = true;
  const measurementId = 'G-XEXLP7S36Z';
  const storageKey = 'shazarat_analytics_consent';
  let choice = localStorage.getItem(storageKey);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  function bindEvents() {
    if (window.__shadratGaBound) return;
    window.__shadratGaBound = true;
    document.addEventListener('click', event => {
      const target = event.target.closest('a,button');
      if (!target) return;
      const text = (target.textContent || '').trim().slice(0, 80);
      const href = target.getAttribute('href') || '';
      if (target.matches('.official') || /المصدر|الموقع الرسمي/.test(text)) gtag('event', 'official_source_click', { link_url: href, link_text: text });
      if (/اطلب الخدمة|طلب الخدمة/.test(text)) gtag('event', 'service_request_start', { service_name: text });
    });
    document.addEventListener('submit', event => {
      if (event.target.matches('[data-demo-form]')) gtag('event', 'contact_submit');
    });
  }

  function enableAnalytics() {
    if (window.__shadratGaScriptLoaded) return;
    window.__shadratGaScriptLoaded = true;
    gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    gtag('js', new Date());
    gtag('config', measurementId, { anonymize_ip: true, send_page_view: true });
    bindEvents();
  }

  if (choice === 'granted') {
    enableAnalytics();
    return;
  }
  if (choice === 'denied' || document.querySelector('[data-shadrat-consent]')) return;

  const box = document.createElement('div');
  box.dir = 'rtl';
  box.dataset.shadratConsent = '';
  box.style.cssText = 'position:fixed;z-index:3000;right:14px;bottom:14px;width:min(430px,calc(100% - 28px));padding:17px;border:1px solid #ddcfb8;border-radius:18px;background:#fffdf8;color:#17352b;box-shadow:0 18px 55px #0003;font:14px/1.7 Tahoma,Arial';
  box.innerHTML = '<b>خصوصية الإحصاءات</b><div>نستخدم Google Analytics لقياس الزيارات وتحسين المنصة دون بيع بياناتك.</div><div style="display:flex;gap:8px;margin-top:11px"><button data-ga-yes style="border:0;border-radius:11px;padding:9px 15px;background:#176b4b;color:#fff;font:inherit;font-weight:bold">موافق</button><button data-ga-no style="border:1px solid #d8cdbc;border-radius:11px;padding:9px 15px;background:#fff;color:#17352b;font:inherit">رفض</button><a href="privacy.html" style="padding:9px;color:#176b4b">السياسة</a></div>';
  document.body.appendChild(box);
  box.querySelector('[data-ga-yes]').addEventListener('click', () => {
    localStorage.setItem(storageKey, 'granted');
    choice = 'granted';
    box.remove();
    enableAnalytics();
  });
  box.querySelector('[data-ga-no]').addEventListener('click', () => {
    localStorage.setItem(storageKey, 'denied');
    box.remove();
  });
})();
