(()=>{
 if(window.__shadratCustomizerPlacement)return;window.__shadratCustomizerPlacement=true;
 function place(){
  document.querySelectorAll('.profile-deep-editor #profile-deep-form').forEach(form=>{
   const editor=form.closest('.profile-deep-editor'),box=editor?.querySelector('.profile-custom-under-pencil');
   if(!box||box.parentElement===form)return;
   const anchor=form.querySelector('#profile-deep-status')||form.querySelector('.profile-deep-actions');
   if(anchor)anchor.before(box);else form.appendChild(box);
  });
 }
 new MutationObserver(place).observe(document.documentElement,{subtree:true,childList:true});
 place();
})();