if(location.pathname.endsWith('/scholarships.html')){
 const cards=document.querySelector('.cards');
 if(cards){
  const base=[...cards.children];
  base[0]?.classList.add('scholarship-feature','theme-open-doors');
  base[1]?.classList.add('scholarship-feature','theme-education-russia');
  base[0]?.insertAdjacentHTML('afterbegin','<div class="scholarship-mark">OD</div><div class="scholarship-kicker">بوابتك إلى الجامعات الروسية</div>');
  base[1]?.insertAdjacentHTML('afterbegin','<div class="scholarship-mark">RU</div><div class="scholarship-kicker">المسار الحكومي الرسمي</div>');
 }
 if(cards&&!document.querySelector('[data-extra-scholarships]'))cards.insertAdjacentHTML('beforeend',`<article class="card" data-extra-scholarships><span class="tag">مغلقة 2026</span><h2>منحة الحكومة التركية</h2><p class="muted">تسكين جامعي ورسوم وسكن وتأمين وراتب وتذاكر وفق الشروط.</p><div class="facts"><div class="fact"><b>الموعد السابق</b><span class="date">10 يناير – 20 فبراير 2026</span></div><div class="fact"><b>الموسم القادم</b>بانتظار الإعلان</div></div><a class="btn" href="turkiye-scholarships.html">الدليل الكامل</a></article><article class="card"><span class="tag">المجر</span><h2>Stipendium Hungaricum</h2><p class="muted">إعفاء ومخصص وسكن أو مساهمة وتأمين، مع ترشيح حسب الدولة.</p><a class="btn" href="stipendium-hungaricum.html">الدليل الكامل</a></article><article class="card"><span class="tag">روسيا</span><h2>منح HSE University</h2><p class="muted">منح كاملة أو جزئية ومسارات كوتة وOpen Doors.</p><a class="btn" href="hse-scholarship.html">المسارات والمواعيد</a></article><article class="card"><span class="tag">موسكو</span><h2>جامعة RUDN</h2><p class="muted">الكوتة الحكومية أو القبول المباشر حسب المسار.</p><a class="btn" href="rudn-scholarship.html">التفاصيل</a></article><article class="card"><span class="tag">نوفوسيبيرسك</span><h2>جامعة NSU</h2><p class="muted">الكوتة الروسية وOpen Doors والقبول الدولي.</p><a class="btn" href="nsu-scholarship.html">التفاصيل</a></article>`);
}
if(location.pathname==='/'||location.pathname.endsWith('/index.html')){
 const all=[...document.querySelectorAll('b,span')].find(el=>el.textContent.trim()==='عرض جميع المنح ←');
 if(all){all.setAttribute('role','link');all.tabIndex=0;all.style.cursor='pointer';all.style.textDecoration='underline';const go=()=>location.href='scholarships.html';all.addEventListener('click',go);all.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')go()})}
}
