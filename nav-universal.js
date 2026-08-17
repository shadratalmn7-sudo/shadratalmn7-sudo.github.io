(() => {
  const currentPage=location.pathname.split('/').pop()||'index.html';
  const isAdminPage=currentPage.startsWith('admin-');
  if(!isAdminPage&&!document.querySelector('script[data-shazarat-adsense]')){
    const ads=document.createElement('script');
    ads.async=true;
    ads.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9420608712266016';
    ads.crossOrigin='anonymous';
    ads.dataset.shazaratAdsense='true';
    document.head.appendChild(ads);
  }
  let nav = document.querySelector('header .nav');
  if (!nav) {
    const header = document.createElement('header');
    header.className = 'site-header global-site-header';
    header.innerHTML = `<div class="container nav"><a class="brand" href="index.html"><img class="brand-logo" src="assets/shazarat-logo.svg" alt="شذرات للمنح"></a></div>`;
    document.body.prepend(header);
    nav = header.querySelector('.nav');
  }
  if (document.querySelector('.global-hamburger')) return;
  const button = document.createElement('button');button.className='global-hamburger';button.type='button';button.setAttribute('aria-label','فتح القائمة');button.setAttribute('aria-expanded','false');button.innerHTML='<span aria-hidden="true">☰</span>';nav.appendChild(button);
  const menu=document.createElement('div');menu.className='global-menu';menu.setAttribute('aria-hidden','true');menu.innerHTML=`<div class="global-menu-backdrop" data-menu-close></div><aside class="global-menu-panel" aria-label="قائمة الموقع"><div class="global-menu-head"><img class="brand-logo" src="assets/shazarat-logo.svg" alt="شذرات للمنح"><button class="global-menu-close" type="button" aria-label="إغلاق القائمة" data-menu-close>×</button></div><nav class="global-menu-links"><a href="index.html">الرئيسية</a><a href="scholarships.html">المنح</a><a href="community.html">مجتمع شذرات</a><a href="services.html">الخدمات</a><a href="offers.html">العروض</a><a href="videos.html">الفيديوهات والقنوات</a><a href="contact.html">تواصل معنا</a><a href="profile.html">حساب الطالب</a></nav><div class="global-menu-actions"><a href="login.html">تسجيل الدخول</a><a class="primary" href="register.html">إنشاء حساب</a></div></aside>`;document.body.appendChild(menu);
  const page=currentPage;menu.querySelectorAll('.global-menu-links a').forEach(link=>{if(link.getAttribute('href')===page){link.classList.add('is-current');link.setAttribute('aria-current','page')}});
  const setOpen=open=>{menu.classList.toggle('is-open',open);menu.setAttribute('aria-hidden',String(!open));button.setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open)};button.addEventListener('click',()=>setOpen(true));menu.querySelectorAll('[data-menu-close]').forEach(item=>item.addEventListener('click',()=>setOpen(false)));menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setOpen(false)));document.addEventListener('keydown',event=>{if(event.key==='Escape')setOpen(false)});
  import('./nav-auth.js?v=6').catch(()=>{});import('./notifications-live.js?v=2').catch(()=>{});import('./scholarship-extra.js?v=5').catch(()=>{});import('./scholarships-live.js?v=5').catch(()=>{});import('./homepage-fixes.js?v=2').catch(()=>{});import('./homepage-live.js?v=3').catch(()=>{});
  if(location.pathname.endsWith('/community.html'))import('./community-filters-live.js?v=2').catch(console.error);
  const adminPage=page.startsWith('admin-');if(adminPage)import('./admin-access.js?v=2').then(({requireAdmin})=>requireAdmin()).then(()=>{import('./admin-navigation.js?v=4').catch(console.error);import('./admin-alert-badges.js?v=2').catch(console.error);if(location.pathname.endsWith('/admin-scholarships.html'))import('./scholarships-admin.js?v=3').catch(console.error);if(location.pathname.endsWith('/admin-users.html'))import('./admin-users.js?v=5').catch(console.error);if(location.pathname.endsWith('/admin-student.html'))import('./admin-student.js?v=2').catch(console.error);if(location.pathname.endsWith('/admin-staff.html'))import('./admin-staff.js?v=2').catch(console.error);if(location.pathname.endsWith('/admin-gamification.html'))import('./admin-gamification.js?v=4').catch(console.error);if(location.pathname.endsWith('/admin-community.html'))import('./admin-community.js?v=2').catch(console.error);if(location.pathname.endsWith('/admin-services.html')||location.pathname.endsWith('/admin-offers.html'))import('./admin-commerce.js?v=2').catch(console.error);if(location.pathname.endsWith('/admin-orders.html'))import('./admin-orders.js?v=2').catch(console.error);if(location.pathname.endsWith('/admin-messages.html'))import('./admin-messages.js?v=4').catch(console.error);if(location.pathname.endsWith('/admin-announcements.html'))import('./admin-announcements.js?v=2').catch(console.error)}).catch(()=>location.replace('login.html?admin=1'));
  if(location.pathname.endsWith('/services.html')||location.pathname.endsWith('/offers.html'))import('./public-commerce-live.js?v=4').catch(console.error);if(location.pathname.endsWith('/contact.html'))import('./contact-live.js?v=2').catch(console.error);if(location.pathname.endsWith('/profile.html'))import('./profile-gamification-live.js?v=2').catch(console.error);import('./analytics.js?v=2').catch(()=>{});
})();
