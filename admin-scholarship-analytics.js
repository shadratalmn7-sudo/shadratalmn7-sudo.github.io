import { getApp,getApps,initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { collection,getDocs,getFirestore } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { mergeScholarships } from './scholarship-catalog.js';
const tbody=document.querySelector('.admin-table tbody');
if(tbody){let remote=[];try{const app=getApps().length?getApp():initializeApp(firebaseConfig),snap=await getDocs(collection(getFirestore(app),'scholarships'));remote=snap.docs.map(d=>d.data())}catch(e){console.warn(e)}const items=mergeScholarships(remote);tbody.innerHTML=items.map(s=>`<tr><td data-label="المنحة"><b>${s.title}</b><br><small>${s.country}</small></td><td data-label="مشاهدات الصفحة">${s.viewCount??'—'}</td><td data-label="زوار فريدون">${s.uniqueVisitors??'—'}</td><td data-label="مرات الحفظ">${s.saveCount??'—'}</td><td data-label="ضغط المصدر">${s.sourceClicks??'—'}</td><td data-label="بدأ رحلة">${s.journeyCount??'—'}</td><td data-label="آخر تحديث">${s.lastUpdated||'15 أغسطس 2026'}</td></tr>`).join('')}
