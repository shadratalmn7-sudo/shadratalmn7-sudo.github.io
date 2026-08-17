import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, getFirestore } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const OWNER_EMAIL='shadrat.almn7@gmail.com';
const link=(href,label,key)=>`<a data-owner-link data-admin-section="${key}" href="${href}"><span>${label}</span><b class="admin-count-badge" data-admin-badge="${key}" hidden>0</b></a>`;
const ownerLinks=`<div class="owner-menu-divider" style="height:1px;background:#e5ddce;margin:8px 0"></div><div style="padding:8px 14px;color:#8a6a2d;font-weight:900;font-size:12px">لوحة الإدارة</div>${link('admin-analytics.html','الرئيسية الإدارية','overview')}${link('admin-homepage.html','إدارة المحتوى','content')}${link('admin-users.html','الطلاب','students')}${link('admin-staff.html','الموظفون','staff')}${link('admin-orders.html','الطلبات والدعم','support')}${link('admin-community.html','المجتمع','community')}${link('admin-gamification.html','XP والإشعارات','gamification')}${link('admin-security.html','النظام والدخل','system')}`;
const adminAliases={'admin-scholarships.html':'admin-homepage.html','admin-services.html':'admin-homepage.html','admin-offers.html':'admin-homepage.html','admin-videos.html':'admin-homepage.html','admin-messages.html':'admin-orders.html','admin-announcements.html':'admin-gamification.html','admin-revenue.html':'admin-security.html'};
function markCurrentAdminLink(){const current=location.pathname.split('/').pop()||'index.html',active=adminAliases[current]||current;document.querySelectorAll('[data-owner-link]').forEach(a=>{const on=a.getAttribute('href')===active;a.classList.toggle('is-current',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}
const logout=async()=>{await signOut(auth);location.replace('index.html')};
document.querySelectorAll('span.btn,span.dark').forEach(el=>{if(/إنشاء|حساب/.test(el.textContent)){el.setAttribute('role','link');el.tabIndex=0;el.style.cursor='pointer';const go=()=>location.href='register.html';el.addEventListener('click',go);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')go()})}});
onAuthStateChanged(auth,async user=>{
  document.querySelectorAll('a[href="login.html"],a[href="register.html"]').forEach(a=>{a.hidden=!!user;if(user)a.style.setProperty('display','none','important');else a.style.removeProperty('display')});
  document.querySelectorAll('[data-auth-logout]').forEach(b=>b.remove());
  if(!user){document.body.dataset.role='student';return;}
  let role=user.email===OWNER_EMAIL?'owner':'student';
  if(role!=='owner')try{const snap=await getDoc(doc(db,'users',user.uid));role=snap.data()?.role||'student'}catch{}
  document.body.dataset.role=role;
  if(['owner','admin','support','editor','communityModerator'].includes(role)){
    const links=document.querySelector('.global-menu-links');
    if(links&&!links.querySelector('[data-owner-link]'))links.insertAdjacentHTML('beforeend',ownerLinks);
    markCurrentAdminLink();
  }
  document.querySelectorAll('.global-menu-actions,.actions,.nav-actions,.menu-cta').forEach(area=>{
    const b=document.createElement('button');b.type='button';b.dataset.authLogout='';b.textContent='تسجيل الخروج';b.style.cssText='border:0;border-radius:14px;padding:12px 18px;background:#b42318;color:#fff;font:inherit;font-weight:900;cursor:pointer';b.addEventListener('click',logout);area.appendChild(b);
  });
});
