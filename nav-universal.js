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
    'services.html': ['خدمات الطلاب | شذرات للمنح', 'استشارات وخدمات واضحة لمساعدة الطلاب في تجهيز طلبات المنح والوثائق.'],
    'offers.html': ['عروض الطلاب | شذرات للمنح', 'عروض محددة المدة والنطاق لخدمات الطلاب والمنح.'],
    'videos.html': ['الفيديوهات والقنوات | شذرات للمنح', 'فيديوهات وقنوات مختارة تشرح المنح وخطوات التقديم.'],
    'contact.html': ['تواصل معنا | شذرات للمنح', 'تواصل مع فريق شذرات للاستفسارات والخدمات والبلاغات.'],
    'login.html': ['تسجيل الدخول | شذرات للمنح', 'سجّل الدخول إلى حسابك في شذرات للمنح.'],
    'register.html': ['إنشاء حساب | شذرات للمنح', 'أنشئ حساب طالب في شذرات واحفظ منحك وتابع خطواتك.']
  };

  if (!isAdmin) {
    const info = seo[page] || ['شذرات للمنح', 'منصة عربية للمنح الدراسية وخدمات الطلاب.'];
    document.title = info[0];
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement('meta');
      description.name = 'description';
      document.head.appendChild(description);
    }
    description.content = info[1];
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `https://shadratalmn7-sudo.github.io/${page === 'index.html' ? '' : page}`;
  }

  const icon = path => `<svg class="shadrat-nav-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${path}"/></svg>`;
  const icons = {
    home: icon('M4 11.2 12 4l8 7.2v8.3H14.5v-5.5h-5V19.5H4v-8.3Z'),
    scholarship: icon('m3.5 8.2 8.5-4 8.5 4-8.5 4-8.5-4Zm3 2.1v4.2c0 1.7 2.5 3.5 5.5 3.5s5.5-1.8 5.5-3.5v-4.2M20.5 8.5v5'),
    community: icon('M5 5.5h9a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H9l-4 3v-3a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3Zm12 3h1a3 3 0 0 1 3 3v3'),
    services: icon('M7 6.5h10l1 3.5-2 8H8l-2-8 1-3.5Zm2-2h6v2H9v-2ZM9.5 12h5M12 9.5v5'),
    offers: icon('M4.5 8 9 3.5h8.5l2 2V14L15 18.5 4.5 8Zm10-1.2h.01M9 13l6-6'),
    videos: icon('M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17V7A1.5 1.5 0 0 1 5 5.5Zm5 4 5 2.5-5 2.5v-5Z'),
    contact: icon('M4 6h16v12H4V6Zm0 1 8 6 8-6'),
    profile: icon('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c.7-3.6 3-5.5 7-5.5s6.3 1.9 7 5.5'),
    grid: icon('M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z')
  };

  const item = (href, key, label, extra = '') => `<a href="${href}" ${extra}><span class="menu-icon" aria-hidden="true">${icons[key]}</span><span class="menu-label">${label}</span></a>`;
  let header = document.querySelector('.site-header');
  if (!header) {
    header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = '<div class="container nav"></div>';
    document.body.prepend(header);
  }
  const nav = header.querySelector('.nav') || header.appendChild(document.createElement('div'));
  nav.classList.add('nav');
  let brand = nav.querySelector('.brand');
  if (!brand) {
    brand = document.createElement('a');
    brand.className = 'brand';
    brand.href = 'index.html';
    brand.innerHTML = '<img class="brand-logo" src="assets/shazarat-logo.svg" alt="شذرات للمنح">';
    nav.prepend(brand);
  } else if (brand.tagName !== 'A') {
    const link = document.createElement('a');
    link.className = brand.className;
    link.href = 'index.html';
    link.innerHTML = brand.innerHTML;
    brand.replaceWith(link);
    brand = link;
  }
  if (!brand.querySelector('img')) brand.innerHTML = '<img class="brand-logo" src="assets/shazarat-logo.svg" alt="شذرات للمنح">';
  nav.querySelectorAll('.links,.nav-links,.legacy-desktop-nav').forEach(node => node.remove());

  if (!isAdmin && !nav.querySelector('.desktop-student-nav')) {
    const desktop = document.createElement('nav');
    desktop.className = 'desktop-student-nav';
    desktop.setAttribute('aria-label', 'أقسام شذرات');
    desktop.innerHTML = `${item('scholarships.html', 'scholarship', 'المنح')}${item('services.html', 'services', 'الخدمات')}${item('offers.html', 'offers', 'العروض')}${item('videos.html', 'videos', 'الفيديوهات')}<div class="desktop-more"><button type="button" class="desktop-more-button" aria-expanded="false"><span class="desktop-nav-icon">${icons.grid}</span><span>المزيد</span><i>⌄</i></button><div class="desktop-more-menu" aria-hidden="true">${item('index.html', 'home', 'الرئيسية')}${item('profile.html', 'profile', 'حساب الطالب')}${item('contact.html', 'contact', 'تواصل معنا')}<div class="desktop-admin-slot"></div></div></div>`;
    brand.insertAdjacentElement('afterend', desktop);
    const more = desktop.querySelector('.desktop-more');
    const button = desktop.querySelector('.desktop-more-button');
    const menu = desktop.querySelector('.desktop-more-menu');
    const close = () => { more.classList.remove('open'); button.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true'); };
    button.addEventListener('click', event => {
      event.stopPropagation();
      const open = !more.classList.contains('open');
      more.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
    });
    document.addEventListener('click', event => { if (!more.contains(event.target)) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  }

  if (!isAdmin && !document.querySelector('.global-menu')) {
    const toggle = document.createElement('button');
    toggle.className = 'global-hamburger';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'فتح القائمة');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span aria-hidden="true">☰</span>';
    nav.appendChild(toggle);
    const menu = document.createElement('div');
    menu.className = 'global-menu';
    menu.setAttribute('aria-hidden', 'true');
    menu.innerHTML = `<div class="global-menu-backdrop" data-menu-close></div><aside class="global-menu-panel"><div class="global-menu-head"><img class="brand-logo" src="assets/shazarat-logo.svg" alt="شذرات للمنح"><button class="global-menu-close" type="button" data-menu-close aria-label="إغلاق القائمة">×</button></div><div class="student-menu-card"><span class="student-avatar">${icons.profile}</span><div><b>مساحة الطالب</b><small>منحك وخطواتك في مكان واحد</small></div></div><nav class="global-menu-links">${item('index.html','home','الرئيسية')}${item('scholarships.html','scholarship','المنح')}${item('services.html','services','الخدمات')}${item('offers.html','offers','العروض')}${item('videos.html','videos','الفيديوهات')}${item('contact.html','contact','تواصل معنا')}${item('profile.html','profile','حساب الطالب','class="student-profile-link"')}</nav><div class="global-menu-actions"><a href="login.html">تسجيل الدخول</a><a class="primary" href="register.html">إنشاء حساب</a></div></aside>`;
    document.body.appendChild(menu);
    const setOpen = open => {
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    };
    toggle.addEventListener('click', () => setOpen(true));
    menu.querySelectorAll('[data-menu-close]').forEach(node => node.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
  }

  document.querySelectorAll('.desktop-student-nav a,.global-menu-links a').forEach(link => {
    if (link.getAttribute('href') === page) {
      link.classList.add('is-current');
      link.setAttribute('aria-current', 'page');
    }
  });

  const report = (label, error) => console.warn(`[Shadrat] ${label}`, error);
  const load = (path, label = path) => import(path).catch(error => report(label, error));
  const onIdle = callback => ('requestIdleCallback' in window ? requestIdleCallback(callback, { timeout: 1800 }) : setTimeout(callback, 900));

  const publicModules = async () => {
    const routes = {
      'index.html': async () => { await load('./homepage-fixes.js?v=10', 'homepage setup'); await load('./homepage-live.js?v=10', 'homepage data'); },
      'scholarships.html': () => Promise.all([load('./scholarships-live.js?v=20', 'scholarships'), load('./scholarship-favorites.js?v=10', 'favorites')]),
      'services.html': () => load('./public-commerce-live.js?v=21', 'services'),
      'offers.html': () => load('./public-commerce-live.js?v=21', 'offers'),
      'contact.html': () => load('./contact-live.js?v=10', 'contact'),
      'profile.html': () => load('./scholarship-favorites.js?v=10', 'favorites')
    };
    await routes[page]?.();
    onIdle(() => {
      if (!['login.html', 'register.html'].includes(page)) load('./nav-auth.js?v=20', 'navigation account state');
      load('./analytics.js?v=10', 'analytics');
      if (!['login.html', 'register.html', 'terms.html', 'privacy.html'].includes(page)) load('./notifications-live.js?v=10', 'notifications');
      load('./ads.js?v=1', 'ads');
    });
  };

  const adminModules = async () => {
    try {
      const { requireAdmin } = await import('./admin-access.js?v=10');
      const session = await requireAdmin();
      if (page === 'admin-community.html') {
        location.replace('admin-analytics.html');
        return;
      }
      document.body.dataset.role = session.role;
      root.classList.remove('admin-pending');
      await load('./admin-navigation.js?v=10', 'admin navigation');
      load('./admin-mobile.js?v=10', 'admin mobile navigation');
      load('./admin-hamburger-fix.js?v=10', 'admin menu');
      load('./admin-alert-badges.js?v=10', 'admin alerts');
      const routes = {
        'admin-analytics.html': './admin-analytics.js?v=10',
        'admin-homepage.html': './admin-live-data.js?v=10',
        'admin-scholarships.html': './scholarships-admin.js?v=10',
        'admin-users.html': './admin-users.js?v=10',
        'admin-student.html': './admin-student.js?v=10',
        'admin-staff.html': './admin-staff.js?v=10',
        'admin-gamification.html': './admin-gamification.js?v=10',
        'admin-services.html': './admin-commerce.js?v=21',
        'admin-offers.html': './admin-commerce.js?v=21',
        'admin-orders.html': './admin-orders.js?v=10',
        'admin-messages.html': './admin-messages.js?v=10',
        'admin-announcements.html': './admin-announcements.js?v=21'
      };
      if (routes[page]) await load(routes[page], page);
    } catch (error) {
      report('admin access denied', error);
      location.replace(`login.html?next=${encodeURIComponent(page)}`);
    }
  };

  if (isAdmin) adminModules(); else publicModules();
})();
