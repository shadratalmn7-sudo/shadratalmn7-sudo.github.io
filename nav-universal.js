(() => {
  if (window.__shadratShellReady) return;
  window.__shadratShellReady = true;

  const page = location.pathname.split('/').pop() || 'index.html';
  const isAdmin = page.startsWith('admin-');
  const root = document.documentElement;
  root.lang = 'ar';
  root.dir = 'rtl';

  const seo = {
    'index.html': ['شذرات للمنح | منح دراسية وفرص موثوقة', 'منصة عربية تساعد الطلاب على اكتشاف المنح وتجهيز ملفاتهم ومتابعة التقديم من مصدر موثوق.'],
    'scholarships.html': ['المنح الدراسية | شذرات للمنح', 'ابحث في منح دراسية موثقة وفلترها حسب الدولة والمرحلة وحالة التقديم.'],
    'documents.html': ['مستنداتي | تحويل الملفات مجانًا | شذرات للمنح', 'حوّل ملفاتك الأساسية داخل المتصفح مع توضيح التحويلات المتاحة والقادمة.'],
    'guides.html': ['الأدلة المجانية | شذرات للمنح', 'أدلة عربية مجانية لفهم المنح والأولمبيادات وتجهيز ملف التقديم.'],
    'sessions.html': ['الجلسات المباشرة | شذرات للمنح', 'جلسات شذرات المباشرة عند فتح الحجز، مع بدائل الاستشارة المجانية.'],
    'currency.html': ['تحويل العملات | شذرات للمنح', 'حوّل بين العملات باستخدام سعر صرف مرجعي مباشر وواضح.'],
    'services.html': ['خدمات الطلاب | شذرات للمنح', 'استشارات وخدمات واضحة لمساعدة الطلاب في تجهيز طلبات المنح والوثائق.'],
    'offers.html': ['عروض الطلاب | شذرات للمنح', 'عروض محددة المدة والنطاق لخدمات الطلاب والمنح.'],
    'videos.html': ['الفيديوهات والقنوات | شذرات للمنح', 'فيديوهات وقنوات مختارة تشرح المنح وخطوات التقديم.'],
    'about.html': ['من نحن | شذرات للمنح', 'تعرف على إدارة شذرات للمنح وقنوات التواصل المباشر مع الإدارة.'],
    'contact.html': ['تواصل معنا | شذرات للمنح', 'تواصل مع فريق شذرات للاستفسارات والخدمات والبلاغات.'],
    'privacy.html': ['الخصوصية | شذرات للمنح', 'سياسة الخصوصية في منصة شذرات للمنح.'],
    'terms.html': ['الشروط | شذرات للمنح', 'شروط استخدام منصة شذرات للمنح.'],
    'login.html': ['تسجيل الدخول | شذرات للمنح', 'سجّل الدخول إلى حسابك في شذرات للمنح.'],
    'register.html': ['إنشاء حساب | شذرات للمنح', 'أنشئ حساب طالب في شذرات واحفظ منحك وتابع خطواتك.'],
    'profile.html': ['حسابي | شذرات للمنح', 'مساحة الطالب في منصة شذرات للمنح.']
  };

  if (!isAdmin) {
    const info = seo[page] || ['شذرات للمنح', 'منصة عربية للمنح الدراسية وخدمات الطلاب.'];
    document.title = info[0];
    let description = document.querySelector('meta[name="description"]');
    if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.appendChild(description); }
    description.content = info[1];
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = `https://shadratalmn7-sudo.github.io/${page === 'index.html' ? '' : page}`;
  }

  const icon = path => `<svg class="shadrat-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${path}"/></svg>`;
  const icons = {
    home: icon('M4 11.2 12 4l8 7.2v8.3H14.5v-5.5h-5V19.5H4v-8.3Z'),
    scholarship: icon('m3.5 8.2 8.5-4 8.5 4-8.5 4-8.5-4Zm3 2.1v4.2c0 1.7 2.5 3.5 5.5 3.5s5.5-1.8 5.5-3.5v-4.2M20.5 8.5v5'),
    documents: icon('M7 3.5h7l3 3v13H7v-16Zm7 0v4h4M9.5 11h5M9.5 14h5M9.5 17H13'),
    guides: icon('M5.5 4.5h6.5c1.1 0 2 .9 2 2v13c0-.8-.9-1.5-2-1.5H5.5v-13.5Zm8.5 2c0-1.1.9-2 2-2h2.5v13.5H16c-1.1 0-2 .7-2 1.5V6.5Z'),
    sessions: icon('M7 8.5h10M7 12h6M5 4.5h14v10H8l-3 3v-13Z'),
    currency: icon('M7 7h10m0 0-3-3m3 3-3 3M17 17H7m0 0 3 3m-3-3 3-3'),
    services: icon('M7 6.5h10l1 3.5-2 8H8l-2-8 1-3.5Zm2-2h6v2H9v-2ZM9.5 12h5M12 9.5v5'),
    offers: icon('M4.5 8 9 3.5h8.5l2 2V14L15 18.5 4.5 8Zm10-1.2h.01M9 13l6-6'),
    contact: icon('M4 6h16v12H4V6Zm0 1 8 6 8-6'),
    profile: icon('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c.7-3.6 3-5.5 7-5.5s6.3 1.9 7 5.5'),
    about: icon('M12 4a8 8 0 0 0-8 8v6l2.5-1.5A8 8 0 1 0 12 4Zm-3 7h.01M12 11h.01M15 11h.01M8.5 14.5c2.2 1.6 4.8 1.6 7 0'),
    grid: icon('M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z')
  };

  const item = (href, key, label, extra = '') => `<a href="${href}" ${extra}><span class="menu-icon" aria-hidden="true">${icons[key]}</span><span class="menu-label">${label}</span></a>`;
  const section = (title, subtitle, items, key) => `<section class="hamburger-section" data-accordion="${key}"><button type="button" class="hamburger-section-toggle" aria-expanded="false"><span><b>${title}</b><small>${subtitle}</small></span><i aria-hidden="true">⌄</i></button><div class="hamburger-section-links" hidden>${items}</div></section>`;

  let header = document.querySelector('.site-header');
  if (!header) { header = document.createElement('header'); header.className = 'site-header'; header.innerHTML = '<div class="container nav"></div>'; document.body.prepend(header); }
  const nav = header.querySelector('.nav') || header.appendChild(document.createElement('div'));
  nav.classList.add('nav');
  let brand = nav.querySelector('.brand');
  if (!brand) { brand = document.createElement('a'); brand.className = 'brand'; brand.href = 'index.html'; brand.innerHTML = '<img class="brand-logo" src="assets/shazarat-logo.svg" alt="شذرات للمنح">'; nav.prepend(brand); }
  else if (brand.tagName !== 'A') { const link = document.createElement('a'); link.className = brand.className; link.href = 'index.html'; link.innerHTML = brand.innerHTML; brand.replaceWith(link); brand = link; }
  if (!brand.querySelector('img')) brand.innerHTML = '<img class="brand-logo" src="assets/shazarat-logo.svg" alt="شذرات للمنح">';
  nav.querySelectorAll('.links,.nav-links,.legacy-desktop-nav').forEach(node => node.remove());

  if (!isAdmin && !nav.querySelector('.desktop-student-nav')) {
    const desktop = document.createElement('nav'); desktop.className = 'desktop-student-nav'; desktop.setAttribute('aria-label','أقسام شذرات');
    desktop.innerHTML = `${item('profile.html','profile','حسابي','class="student-profile-link"')}${item('scholarships.html','scholarship','المنح')}${item('guides.html','guides','الأدلة')}${item('documents.html','documents','مستنداتي')}${item('services.html','services','الخدمات')}<div class="desktop-more"><button type="button" class="desktop-more-button" aria-expanded="false"><span class="desktop-nav-icon">${icons.grid}</span><span>المزيد</span><i>⌄</i></button><div class="desktop-more-menu" aria-hidden="true">${item('index.html','home','الرئيسية')}${item('sessions.html','sessions','الجلسات')}${item('currency.html','currency','العملات')}${item('offers.html','offers','العروض')}${item('contact.html','contact','تواصل معنا')}${item('about.html','about','من نحن')}<div class="desktop-admin-slot"></div></div></div>`;
    brand.insertAdjacentElement('afterend', desktop);
    const more = desktop.querySelector('.desktop-more'), button = desktop.querySelector('.desktop-more-button'), menu = desktop.querySelector('.desktop-more-menu');
    const close = () => { more.classList.remove('open'); button.setAttribute('aria-expanded','false'); menu.setAttribute('aria-hidden','true'); };
    button.addEventListener('click', event => { event.stopPropagation(); const open = !more.classList.contains('open'); more.classList.toggle('open', open); button.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-hidden', String(!open)); });
    document.addEventListener('click', event => { if (!more.contains(event.target)) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  }

  function wireAccordion(container) {
    container.querySelectorAll('.hamburger-section-toggle').forEach(toggle => {
      if (toggle.dataset.ready === '1') return;
      toggle.dataset.ready = '1';
      toggle.addEventListener('click', () => {
        const sectionEl = toggle.closest('.hamburger-section');
        const links = sectionEl?.querySelector('.hamburger-section-links');
        if (!sectionEl || !links) return;
        const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
        container.querySelectorAll('.hamburger-section').forEach(other => {
          const otherToggle = other.querySelector('.hamburger-section-toggle');
          const otherLinks = other.querySelector('.hamburger-section-links');
          if (!otherToggle || !otherLinks) return;
          other.classList.remove('is-open');
          otherToggle.setAttribute('aria-expanded','false');
          otherLinks.hidden = true;
        });
        if (willOpen) {
          sectionEl.classList.add('is-open');
          toggle.setAttribute('aria-expanded','true');
          links.hidden = false;
        }
      });
    });
  }

  if (!isAdmin && !document.querySelector('.global-menu')) {
    const toggle = document.createElement('button'); toggle.className = 'global-hamburger'; toggle.type = 'button'; toggle.setAttribute('aria-label','فتح القائمة'); toggle.setAttribute('aria-expanded','false'); toggle.innerHTML = '<span aria-hidden="true">☰</span>'; nav.appendChild(toggle);
    const menu = document.createElement('div'); menu.className = 'global-menu'; menu.setAttribute('aria-hidden','true');
    menu.innerHTML = `<div class="global-menu-backdrop" data-menu-close></div><aside class="global-menu-panel"><div class="global-menu-head"><img class="brand-logo" src="assets/shazarat-logo.svg" alt="شذرات للمنح"><button class="global-menu-close" type="button" data-menu-close aria-label="إغلاق القائمة">×</button></div><div class="hamburger-sections">${section('حساب الطالب','ملفك وخطواتك', item('profile.html','profile','حسابي','class="student-profile-link"') + '<div class="hamburger-auth-mini"><a href="login.html">دخول</a><a href="register.html">إنشاء حساب</a></div>','account')}${section('الأقسام الأساسية','أكثر ما يحتاجه الطالب', item('index.html','home','الرئيسية') + item('scholarships.html','scholarship','المنح') + item('guides.html','guides','الأدلة') + item('documents.html','documents','مستنداتي') + item('sessions.html','sessions','الجلسات') + item('currency.html','currency','تحويل العملات') + item('services.html','services','الخدمات') + item('offers.html','offers','العروض'),'main')}${section('تواصل معنا','التواصل ومعلومات شذرات', item('contact.html','contact','تواصل معنا') + item('about.html','about','من نحن'),'contact')}</div></aside>`;
    document.body.appendChild(menu);
    const accordionRoot = menu.querySelector('.hamburger-sections');
    wireAccordion(accordionRoot);
    const observer = new MutationObserver(() => wireAccordion(accordionRoot));
    observer.observe(accordionRoot,{childList:true,subtree:true});
    const setOpen = open => { menu.classList.toggle('is-open', open); menu.setAttribute('aria-hidden', String(!open)); toggle.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('menu-open', open); };
    toggle.addEventListener('click', () => setOpen(true));
    menu.querySelectorAll('[data-menu-close]').forEach(node => node.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
  }

  document.querySelectorAll('.desktop-student-nav a,.global-menu a').forEach(link => { const href = link.getAttribute('href'); if (href === page) { link.classList.add('is-current'); link.setAttribute('aria-current','page'); } });
  const report = (label,error) => console.warn(`[Shadrat] ${label}`, error);
  const load = (path,label=path) => import(path).catch(error => report(label,error));
  const onIdle = callback => ('requestIdleCallback' in window ? requestIdleCallback(callback,{timeout:1800}) : setTimeout(callback,900));
  const publicModules = async () => {
    const routes = { 'index.html': async () => { await load('./homepage-fixes.js?v=11','homepage setup'); await load('./homepage-live.js?v=12','homepage data'); }, 'scholarships.html': () => Promise.all([load('./scholarships-live.js?v=20260902branches','scholarships'), load('./scholarship-favorites.js?v=10','favorites')]), 'documents.html': () => load('./documents.js?v=80','documents tools'), 'services.html': () => load('./public-commerce-live.js?v=21','services'), 'offers.html': () => load('./public-commerce-live.js?v=21','offers'), 'contact.html': () => load('./contact-live.js?v=10','contact'), 'profile.html': () => load('./scholarship-favorites.js?v=10','favorites') };
    await routes[page]?.();
    onIdle(() => { if (!['login.html','register.html'].includes(page)) load('./nav-auth.js?v=102','navigation account state'); load('./analytics.js?v=10','analytics'); if (!['login.html','register.html','terms.html','privacy.html'].includes(page)) load('./notifications-live.js?v=11','notifications'); load('./ads.js?v=1','ads'); });
  };
  const adminModules = async () => {
    try {
      const { requireAdmin } = await import('./admin-access.js?v=12'); const session = await requireAdmin(); if (page === 'admin-community.html') { location.replace('admin-analytics.html'); return; }
      document.body.dataset.role = session.role; root.classList.remove('admin-pending'); await load('./admin-navigation.js?v=17','admin navigation'); load('./admin-mobile.js?v=11','admin mobile navigation'); load('./admin-alert-badges.js?v=10','admin alerts');
      const routes = { 'admin-analytics.html':'./admin-analytics.js?v=10', 'admin-homepage.html':'./admin-live-data.js?v=10', 'admin-scholarships.html':'./scholarships-admin.js?v=10', 'admin-users.html':'./admin-users.js?v=10', 'admin-student.html':'./admin-student.js?v=10', 'admin-staff.html':'./admin-staff.js?v=10', 'admin-gamification.html':'./admin-gamification.js?v=10', 'admin-services.html':'./admin-commerce.js?v=21', 'admin-offers.html':'./admin-commerce.js?v=21', 'admin-orders.html':'./admin-orders.js?v=10', 'admin-messages.html':'./admin-messages.js?v=10', 'admin-announcements.html':'./admin-announcements.js?v=21' };
      if (routes[page]) await load(routes[page], page);
    } catch (error) { report('admin access denied', error); location.replace(`login.html?next=${encodeURIComponent(page)}`); }
  };
  if (isAdmin) adminModules(); else publicModules();
})();
