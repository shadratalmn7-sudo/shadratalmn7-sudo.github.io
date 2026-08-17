if(document.body.dataset.role==='owner'){
 const note=document.querySelector('.admin-note');
 if(note){note.innerHTML='<b>البيانات الحقيقية:</b> بدأ ربط الموقع بـGA4 بعد موافقة الزائر. يحتاج التقرير عادةً إلى وقت لمعالجة البيانات، بينما يظهر التقرير اللحظي أسرع.';const a=document.createElement('a');a.href='https://analytics.google.com/analytics/web/#/a404536661p549755347/reports/intelligenthome';a.target='_blank';a.rel='noopener';a.className='btn primary';a.style.marginTop='10px';a.textContent='فتح تقرير GA4 الحقيقي ↗';note.append(document.createElement('br'),a)}
}
