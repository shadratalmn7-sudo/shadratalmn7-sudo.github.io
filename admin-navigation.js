const css=document.createElement('link');css.rel='stylesheet';css.href='admin-navigation.css?v=18';document.head.appendChild(css);
if(!window.__shadratAdminNavigationReady){
  window.__shadratAdminNavigationReady=true;

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
    finance:'M5 6h14M7 10h10M8 14h8M10 18h4'
  };

  const groups=[
    {title:'المتابعة',items:[
      {href:'admin-analytics.html',label:'مركز المراقبة',desc:'ملخص الإدارة والتنبيهات',icon:'dashboard',roles:['owner','admin','support','editor','communityModerator']},
      {href:'admin-messages.html',label:'الإيميل والرسائل',desc:'الاستفسارات والشكاوى والبلاغات والإنجازات',icon:'mail',roles:['owner','admin','support']},
      {href:'admin-orders.html',label:'الطلبات',desc:'طلبات الخدمات والعروض وأي طلب مسجل',icon:'orders',roles:['owner','admin','support']}
    ]},
    {title:'الطلاب والمحتوى',items:[
      {href:'admin-users.html',label:'الطلاب والعملاء',desc:'الحسابات وبيانات الطلاب',icon:'users',roles:['owner','admin','support']},
      {href:'admin-scholarships.html',label:'المنح',desc:'إضافة وتعديل وإدارة المنح',icon:'scholarship',roles:['owner','admin','editor']},
      {href:'admin-services.html',label:'الخدمات',desc:'إدارة خدمات شذرات',icon:'services',roles:['owner','admin','editor']},
      {href:'admin-offers.html',label:'العروض',desc:'إدارة العروض والأسعار',icon:'offers',roles:['owner','admin','editor']},
      {href:'admin-homepage.html',label:'الصفحة الرئيسية',desc:'ترتيب محتوى الصفحة الرئيسية',icon:'homepage',roles:['owner','admin','editor']},
      {href:'admin-videos.html',label:'الفيديوهات',desc:'إدارة الفيديوهات والمحتوى المرئي',icon:'videos',roles:['owner','admin','editor']}
    ]},
    {title:'النظام والإدارة',items:[
      {href:'admin-announcements.html',label:'التنبيهات والإعلانات',desc:'إعلانات وتنبيهات الطلاب',icon:'announcements',roles:['owner','admin']},
      {href:'admin-gamification.html',label:'XP والجوائز',desc:'المستويات والمهمات والجوائز',icon:'gamification',roles:['owner','admin']},
      {href:'admin-staff.html',label:'الفريق والصلاحيات',desc:'الموظفون وصلاحيات الوصول',icon:'staff',roles:['owner']},
      {href:'admin-security.html',label:'الأمان',desc:'الحماية وإعدادات الإدارة الحساسة',icon:'security',roles:['owner','admin']},
      {href:'admin-revenue.html',label:'المالية',desc:'الدخل والمتابعة المالية',icon:'finance',roles:['owner','admin']}
    ]}
  ];

  const role=document.body.dataset.role||'student';
  const current=location.pathname.split('/').pop()||'admin-analytics.html';
  const allowed=item=>item.roles.includes(role);
  const link=item=>`<a href="${item.href}" class="admin-drawer-link ${current===item.href?'is-current':''}">
    <span class="admin-nav-icon-wrap">${icon(icons[item.icon])}</span>
    <span class="admin-nav-copy"><b>${item.label}</b><small>${item.desc}</small></span>
    <b class="admin-count-badge" data-admin-badge="${item.href}" hidden>0</b>
  </a>`;

  let aside=document.querySelector('.admin-nav');
  if(!aside){
    aside=document.createElement('aside');
    aside.className='admin-nav';
    document.body.appendChild(aside);
  }
  aside.classList.remove('card');
  aside.setAttribute('aria-hidden','true');
  aside.innerHTML=`<div class="admin-drawer-head">
      <div><b>إدارة شذرات</b><small>انتقل مباشرة إلى القسم المطلوب</small></div>
      <button type="button" class="admin-drawer-close" aria-label="إغلاق القائمة">×</button>
    </div>
    <div class="admin-drawer-body">
      ${groups.map(group=>{
        const items=group.items.filter(allowed);
        if(!items.length)return '';
        return `<section class="admin-drawer-group"><h3>${group.title}</h3><div>${items.map(link).join('')}</div></section>`;
      }).join('')}
      <a class="admin-back-site" href="index.html">العودة إلى الموقع</a>
    </div>`;

  let backdrop=document.querySelector('.admin-drawer-backdrop');
  if(!backdrop){
    backdrop=document.createElement('button');
    backdrop.type='button';
    backdrop.className='admin-drawer-backdrop';
    backdrop.setAttribute('aria-label','إغلاق قائمة الإدارة');
    document.body.appendChild(backdrop);
  }

  const headerNav=document.querySelector('.site-header .nav');
  let toggle=document.querySelector('.admin-hamburger');
  if(!toggle&&headerNav){
    toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='admin-hamburger';
    toggle.setAttribute('aria-label','فتح قائمة الإدارة');
    toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML='<span aria-hidden="true">☰</span><b>الإدارة</b>';
    headerNav.prepend(toggle);
  }

  const setOpen=open=>{
    document.body.classList.toggle('admin-drawer-open',open);
    aside.setAttribute('aria-hidden',String(!open));
    toggle?.setAttribute('aria-expanded',String(open));
  };
  toggle?.addEventListener('click',()=>setOpen(true));
  aside.querySelector('.admin-drawer-close')?.addEventListener('click',()=>setOpen(false));
  backdrop.addEventListener('click',()=>setOpen(false));
  aside.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setOpen(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});

  document.querySelectorAll('.admin-student-menu-button,.admin-student-menu').forEach(el=>el.remove());
  document.body.classList.remove('student-menu-open');
}
