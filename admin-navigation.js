(()=>{
  const VERSION='29';
  const css=document.createElement('link');
  css.rel='stylesheet';css.href=`admin-navigation.css?v=${VERSION}`;css.dataset.adminNavigationCss=VERSION;document.head.appendChild(css);

  const icon=p=>`<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${p}"/></svg>`;
  const icons={
    dashboard:'M4 11.2 12 4l8 7.2v8.3H14.5v-5.5h-5V19.5H4v-8.3Z',
    mail:'M4 6h16v12H4V6Zm0 1 8 6 8-6',
    orders:'M6 4h12v16H6V4Zm3 4h6M9 12h6M9 16h4',
    users:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c.7-3.6 3-5.5 7-5.5s6.3 1.9 7 5.5',
    scholarship:'m3.5 8.2 8.5-4 8.5 4-8.5 4-8.5-4Zm3 2.1v4.2c0 1.7 2.5 3.5 5.5 3.5s5.5-1.8 5.5-3.5v-4.2M20.5 8.5v5',
    services:'M7 6.5h10l1 3.5-2 8H8l-2-8 1-3.5Zm2-2h6v2H9v-2ZM9.5 12h5M12 9.5v5',
    offers:'M4.5 8 9 3.5h8.5l2 2V14L15 18.5 4.5 8Zm10-1.2h.01M9 13l6-6',
    homepage:'M5 5h14v14H5V5Zm3 3h8M8 12h8M8 16h5',
    announcements:'M5 11h3l7-4v10l-7-4H5v-2Zm10-1.5 3-2v9l-3-2',
    gamification:'M12 3l2.3 4.7 5.2.8-3.8 3.7.9 5.3-4.6-2.5-4.6 2.5.9-5.3-3.8-3.7 5.2-.8L12 3Z',
    videos:'M5 6h14v12H5V6Zm5 3 5 3-5 3V9Z',
    staff:'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c.4-3.3 2.2-5 5-5 2.1 0 3.6.9 4.4 2.6M13 20c.3-2.7 1.5-4 3.5-4s3.2 1.3 3.5 4',
    security:'M12 3 19 6v5c0 4.6-2.7 7.8-7 10-4.3-2.2-7-5.4-7-10V6l7-3Zm-3 9 2 2 4-4',
    finance:'M5 6h14M7 10h10M8 14h8M10 18h4',
    monitor:'M4 5h16v14H4V5Zm3 10 3-4 3 2 4-5'
  };

  const groups=[
    {key:'home',title:'الرئيسية',desc:'الملخص الحي وما يحتاج انتباهك الآن',icon:'dashboard',items:[
      {href:'admin-analytics.html',label:'لوحة الإدارة',desc:'الأرقام الحية وآخر نشاط',icon:'dashboard',roles:['owner','admin','support','editor']}
    ]},
    {key:'students',title:'الطلاب والمتابعة',desc:'الحسابات والطلبات والرسائل في مكان واحد',icon:'users',items:[
      {href:'admin-users.html',label:'الطلاب',desc:'الحسابات والملفات والنشاط',icon:'users',roles:['owner','admin','support']},
      {href:'admin-orders.html',label:'طلبات الخدمات',desc:'الجديدة وقيد التنفيذ والمكتملة',icon:'orders',roles:['owner','admin','support']},
      {href:'admin-messages.html',label:'الرسائل والشكاوى',desc:'الوارد والردود وحالة القراءة',icon:'mail',roles:['owner','admin','support']}
    ]},
    {key:'content',title:'المحتوى والخدمات',desc:'المنح والخدمات والعروض وكل ما يظهر للطلاب',icon:'scholarship',items:[
      {href:'admin-scholarships.html',label:'المنح',desc:'إضافة ونشر وإدارة المنح',icon:'scholarship',roles:['owner','admin','editor']},
      {href:'admin-services.html',label:'الخدمات',desc:'إضافة ونشر وإدارة الخدمات',icon:'services',roles:['owner','admin','editor']},
      {href:'admin-offers.html',label:'العروض',desc:'العروض وتواريخها',icon:'offers',roles:['owner','admin','editor']},
      {href:'admin-homepage.html',label:'تنسيق الرئيسية',desc:'ترتيب ما يظهر في الصفحة الرئيسية',icon:'homepage',roles:['owner','admin','editor']},
      {href:'admin-videos.html',label:'الفيديوهات',desc:'المحتوى المرئي',icon:'videos',roles:['owner','admin','editor']}
    ]},
    {key:'engagement',title:'التنبيهات والتفاعل',desc:'البوش والإشعارات والمهام والجوائز',icon:'announcements',items:[
      {href:'admin-announcements.html',label:'الإشعارات والبوش',desc:'تنبيهات الموقع وإشعارات Push',icon:'announcements',roles:['owner','admin']},
      {href:'admin-gamification.html',label:'المهام والمكافآت',desc:'XP والجوائز والمهمات',icon:'gamification',roles:['owner','admin']}
    ]},
    {key:'system',title:'النظام والإدارة',desc:'الفريق والصلاحيات والتكاملات والدخل',icon:'security',items:[
      {href:'admin-staff.html',label:'الفريق والصلاحيات',desc:'الموظفون والأدوار',icon:'staff',roles:['owner']},
      {href:'admin-security.html',label:'الإعدادات والتكاملات',desc:'الأمان وربط الخدمات الخارجية',icon:'security',roles:['owner','admin']},
      {href:'admin-revenue.html',label:'الإعلانات والدخل',desc:'الإيرادات والمتابعة',icon:'finance',roles:['owner','admin']}
    ]}
  ];

  const role=document.body.dataset.role||'student';
  const messageTeam=document.body.dataset.messageTeam==='true';
  const messageOnly=document.body.dataset.messageOnly==='true';
  const current=location.pathname.split('/').pop()||'admin-analytics.html';
  const visible=groups.map(g=>({...g,items:g.items.filter(i=>messageOnly?i.href==='admin-messages.html':i.roles.includes(role)||(messageTeam&&i.href==='admin-messages.html'))})).filter(g=>g.items.length);
  const currentGroup=visible.find(g=>g.items.some(i=>i.href===current));

  const itemLink=(i,extraClass='admin-drawer-link')=>`<a href="${i.href}" class="${extraClass} ${current===i.href?'is-current':''}" data-admin-target="${i.href}"><span class="admin-nav-icon-wrap">${icon(icons[i.icon])}</span><span class="admin-nav-copy"><b>${i.label}</b><small>${i.desc}</small></span><b class="admin-count-badge" data-admin-badge="${i.href}" hidden>0</b></a>`;
  const groupCard=g=>`<button type="button" class="admin-group-card ${currentGroup?.key===g.key?'is-current':''}" data-admin-section="${g.key}"><span class="admin-nav-icon-wrap">${icon(icons[g.icon])}</span><span class="admin-group-card-copy"><b>${g.title}</b><small>${g.desc}</small></span><span class="admin-group-card-arrow" aria-hidden="true">‹</span></button>`;

  function rootView(){
    return `<div class="admin-drawer-heading"><b>أقسام الإدارة</b><small>اختر القسم، وبعدها تظهر كل أدواته ككروت مستقلة.</small></div><div class="admin-group-grid">${visible.map(groupCard).join('')}</div><a class="admin-back-site" href="index.html">العودة إلى الموقع</a>`;
  }
  function sectionView(key){
    const g=visible.find(x=>x.key===key);
    if(!g)return rootView();
    return `<div class="admin-section-top"><button type="button" class="admin-section-back" aria-label="الرجوع إلى أقسام الإدارة">→</button><span class="admin-section-title"><b>${g.title}</b><small>${g.desc}</small></span></div><div class="admin-section-card-grid">${g.items.map(i=>itemLink(i)).join('')}</div><a class="admin-back-site" href="index.html">العودة إلى الموقع</a>`;
  }

  function ensureAside(){
    let a=document.querySelector('.admin-nav');
    if(!a){a=document.createElement('aside');a.className='admin-nav';document.body.appendChild(a)}
    a.style.setProperty('display','block','important');
    if(a.dataset.adminBuilt!==VERSION){
      a.dataset.adminBuilt=VERSION;
      a.setAttribute('aria-hidden','true');
      const homeHref=messageOnly?'admin-messages.html':'admin-analytics.html';
      const homeLabel=messageOnly?'صندوق الرسائل':'إدارة شذرات';
      const homeSub=messageOnly?'رسائل فريق شذرات':'مركز الإدارة';
      a.innerHTML=`<div class="admin-drawer-head"><a class="admin-drawer-home" href="${homeHref}"><span class="admin-nav-icon-wrap">${icon(messageOnly?icons.mail:icons.monitor)}</span><span><b>${homeLabel}</b><small>${homeSub}</small></span></a><button type="button" class="admin-drawer-close" aria-label="إغلاق القائمة">×</button></div><div class="admin-drawer-body"><div class="admin-drawer-stage">${rootView()}</div></div>`;
    }
    return a;
  }
  function drawerStage(){return ensureAside().querySelector('.admin-drawer-stage')}
  function showRoot(){const s=drawerStage();if(s)s.innerHTML=rootView()}
  function showSection(key){const s=drawerStage();if(s)s.innerHTML=sectionView(key)}
  function ensureBackdrop(){
    let b=document.querySelector('.admin-drawer-backdrop');
    if(!b){b=document.createElement('button');b.type='button';b.className='admin-drawer-backdrop';b.setAttribute('aria-label','إغلاق قائمة الإدارة');document.body.appendChild(b)}
    return b;
  }
  function ensureToggle(){
    const nav=document.querySelector('.site-header .nav');if(!nav)return null;
    let t=nav.querySelector('.admin-hamburger');
    if(!t){t=document.createElement('button');t.type='button';t.className='admin-hamburger';t.setAttribute('aria-label','فتح قائمة الإدارة');t.innerHTML='<span aria-hidden="true">☰</span><b>الإدارة</b>';nav.prepend(t)}
    t.setAttribute('aria-expanded',String(document.body.classList.contains('admin-drawer-open')));
    return t;
  }
  function setOpen(open){
    const a=ensureAside();ensureBackdrop();const t=ensureToggle();
    if(open)showRoot();
    document.body.classList.toggle('admin-drawer-open',open);
    a.setAttribute('aria-hidden',String(!open));
    t?.setAttribute('aria-expanded',String(open));
  }

  function ensureHub(){
    if(messageOnly||current!=='admin-analytics.html')return;
    const main=document.querySelector('.admin-main');
    const title=main?.querySelector('.admin-title');
    if(!main||!title)return;
    main.querySelectorAll('.admin-control-hub').forEach(x=>x.remove());
    const hub=document.createElement('section');
    hub.className='admin-control-hub';
    hub.innerHTML=`<div class="admin-control-hub-head"><div><h2>أقسام الإدارة</h2><p>خمسة أقسام واضحة، وكل قسم يحتوي أدواته ككروت.</p></div></div><div class="admin-control-groups">${visible.map(g=>`<section class="admin-control-group"><div class="admin-control-group-head"><span class="admin-nav-icon-wrap">${icon(icons[g.icon])}</span><span class="admin-control-group-copy"><b>${g.title}</b><small>${g.desc}</small></span></div><div class="admin-control-items">${g.items.map(i=>itemLink(i,'admin-control-item')).join('')}</div></section>`).join('')}</div>`;
    title.insertAdjacentElement('afterend',hub);
  }

  function prefetchAdminPages(){
    visible.flatMap(g=>g.items).forEach(i=>{
      if(i.href===current||document.head.querySelector(`link[data-admin-prefetch="${i.href}"]`))return;
      const l=document.createElement('link');l.rel='prefetch';l.href=i.href;l.dataset.adminPrefetch=i.href;document.head.appendChild(l);
    });
  }

  function primeSlowPages(){
    if(current==='admin-orders.html')import('./admin-orders.js?v=21').catch(console.error);
    if(current==='admin-users.html')import('./admin-users.js?v=11').catch(console.error);
  }

  function ensureMounted(){
    ensureAside();ensureBackdrop();ensureToggle();
    document.querySelectorAll('.admin-student-menu-button,.admin-student-menu').forEach(x=>x.remove());
    document.body.classList.remove('student-menu-open');
  }

  if(!window.__shadratAdminNavigationEvents){
    window.__shadratAdminNavigationEvents=true;
    document.addEventListener('click',e=>{
      if(e.target.closest('.admin-hamburger')){e.preventDefault();e.stopPropagation();setOpen(!document.body.classList.contains('admin-drawer-open'));return}
      if(e.target.closest('.admin-drawer-close,.admin-drawer-backdrop')){e.preventDefault();setOpen(false);return}
      const section=e.target.closest('[data-admin-section]');
      if(section){e.preventDefault();showSection(section.dataset.adminSection);return}
      if(e.target.closest('.admin-section-back')){e.preventDefault();showRoot();return}
      const link=e.target.closest('a[data-admin-target]');
      if(link){document.body.classList.add('admin-navigating');setOpen(false)}
    },true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
    window.addEventListener('pageshow',()=>document.body.classList.remove('admin-navigating'));
  }

  ensureMounted();
  ensureHub();
  setTimeout(ensureMounted,350);
  setTimeout(prefetchAdminPages,100);
  primeSlowPages();

  if(!messageOnly&&!document.querySelector('script[data-admin-activity-center]')){
    const s=document.createElement('script');s.type='module';s.src='admin-activity-center.js?v=3';s.dataset.adminActivityCenter='1';document.body.appendChild(s);
  }
})();