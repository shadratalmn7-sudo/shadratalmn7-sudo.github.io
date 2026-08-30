const css=document.createElement('link');css.rel='stylesheet';css.href='admin-navigation.css?v=17';document.head.appendChild(css);
if(window.__shadratAdminNavigationReady){throw new Error('admin-navigation-ready')}window.__shadratAdminNavigationReady=true;
const icon=p=>`<svg class="admin-nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${p}"/></svg>`;
const path={
  overview:'M4 11.2 12 4l8 7.2v8.3H14.5v-5.5h-5V19.5H4v-8.3Z',
  content:'M5 4h14v5H5V4Zm0 8h6v8H5v-8Zm9 0h5v8h-5v-8Z',
  students:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c.7-3.6 3-5.5 7-5.5s6.3 1.9 7 5.5',
  staff:'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c.4-3.3 2.2-5 5-5 2.1 0 3.6.9 4.4 2.6M13 20c.3-2.7 1.5-4 3.5-4s3.2 1.3 3.5 4',
  support:'M5 5h14v14H5V5Zm3 4h8M8 13h5M8 17h7',
  gamification:'M12 3l2.3 4.7 5.2.8-3.8 3.7.9 5.3-4.6-2.5-4.6 2.5.9-5.3-3.8-3.7 5.2-.8L12 3Z',
  system:'M12 3 19 6v5c0 4.6-2.7 7.8-7 10-4.3-2.2-7-5.4-7-10V6l7-3Zm-3 9 2 2 4-4',
  finance:'M5 6h14M7 10h10M8 14h8M10 18h4',
  home:'M4 11.2 12 4l8 7.2v8.3H14.5v-5.5h-5V19.5H4v-8.3Z'
};
const sections=[
  {href:'admin-analytics.html',label:'مركز المراقبة',desc:'الأرقام والتنبيهات اليومية',key:'overview',icon:'overview',roles:['owner','admin','support','editor','communityModerator']},
  {href:'admin-homepage.html',label:'المحتوى والخدمات',desc:'الرئيسية، المنح، الخدمات، العروض',key:'content',icon:'content',roles:['owner','admin','editor']},
  {href:'admin-users.html',label:'الطلاب والعملاء',desc:'الحسابات وبيانات الطلاب',key:'students',icon:'students',roles:['owner','admin','support']},
  {href:'admin-staff.html',label:'الفريق والصلاحيات',desc:'الموظفون وأدوار الوصول',key:'staff',icon:'staff',roles:['owner']},
  {href:'admin-orders.html',label:'الطلبات والدعم',desc:'الطلبات، الرسائل والتسليم',key:'support',icon:'support',roles:['owner','admin','support']},
  {href:'admin-gamification.html',label:'النظام والتحفيز',desc:'الإشعارات، XP، الإعلانات',key:'gamification',icon:'gamification',roles:['owner','admin']},
  {href:'admin-security.html',label:'الأمان والمالية',desc:'الحماية، الدخل والإعدادات الحساسة',key:'system',icon:'system',roles:['owner','admin']}
];
const aliases={'admin-scholarships.html':'admin-homepage.html','admin-services.html':'admin-homepage.html','admin-offers.html':'admin-homepage.html','admin-videos.html':'admin-homepage.html','admin-messages.html':'admin-orders.html','admin-announcements.html':'admin-gamification.html','admin-revenue.html':'admin-security.html','admin-community.html':'admin-analytics.html'};
const role=document.body.dataset.role||'student';
const current=location.pathname.split('/').pop()||'admin-analytics.html';
const active=aliases[current]||current;
const visible=sections.filter(item=>item.roles.includes(role));
const adminLink=item=>`<a href="${item.href}" data-admin-section="${item.key}" class="admin-nav-item ${active===item.href?'active is-current':''}"><span class="admin-nav-icon-wrap">${icon(path[item.icon])}</span><span class="admin-nav-copy"><b>${item.label}</b><small>${item.desc}</small></span><b class="admin-count-badge" data-admin-badge="${item.key}" hidden>0</b></a>`;
document.querySelectorAll('.admin-nav').forEach(nav=>{
  nav.innerHTML=`<div class="admin-nav-intro"><b>إدارة شذرات</b><span>أقسام تشغيل مرتبة مثل لوحة شركة</span></div><div class="admin-nav-flat">${visible.map(adminLink).join('')}</div>`;
});
document.querySelectorAll('.admin-student-menu-button,.admin-student-menu').forEach(el=>el.remove());
document.body.classList.remove('student-menu-open');
