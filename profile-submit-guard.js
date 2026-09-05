(()=>{
 if(window.__shadratProfileSubmitGuard)return;window.__shadratProfileSubmitGuard=true;
 document.addEventListener('submit',e=>{
  const form=e.target;if(!(form instanceof HTMLFormElement)||form.id!=='profile-deep-form')return;
  const editor=form.closest('.profile-deep-editor')||document;
  if(editor.querySelector('.profile-custom-under-pencil .unified-preview')){form.dataset.guardTries='0';return}
  e.preventDefault();e.stopImmediatePropagation();
  const status=form.querySelector('#profile-deep-status'),tries=Number(form.dataset.guardTries||0);
  if(tries>=15){if(status){status.className='profile-deep-status err';status.textContent='تعذر تجهيز التخصيص. أغلق شاشة التعديل وافتح القلم مرة ثانية.'}return}
  form.dataset.guardTries=String(tries+1);
  if(status){status.className='profile-deep-status';status.textContent='جاري تجهيز معاينة التخصيص…'}
  setTimeout(()=>form.requestSubmit(),120);
 },true);
})();