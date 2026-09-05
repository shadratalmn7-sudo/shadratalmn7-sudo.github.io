(()=>{
  if(window.__shadratAccountUiV5)return;
  window.__shadratAccountUiV5=true;
  let editorLoading=false,unifiedReady=null;

  function injectStyles(){
    if(document.querySelector('#profile-account-ui-style'))return;
    const s=document.createElement('style');
    s.id='profile-account-ui-style';
    s.textContent=`
      #student-profile-editor{display:none!important}
      #profile-account-customize-card,#profile-customizer-stash{display:none!important}
      #rewards .profile-customizer{display:none!important}
    `;
    document.head.appendChild(s);
  }

  function cleanLegacy(){
    document.querySelector('#student-profile-editor')?.remove();
    document.querySelector('#profile-account-customize-card')?.remove();
    document.querySelector('#profile-customizer-stash')?.remove();
    const rewardsTitle=document.querySelector('#rewards .card-heading h2');
    if(rewardsTitle&&rewardsTitle.textContent.includes('وتخصيص'))rewardsTitle.textContent='جوائزي';
    document.querySelectorAll('.dashboard-actions [data-open-profile-tab="student-info"]').forEach(b=>{b.hidden=true;b.setAttribute('aria-hidden','true')});
  }

  function loadUnified(){
    unifiedReady=unifiedReady||import('./profile-submit-guard.js?v=2')
      .then(()=>import('./profile-save-compat.js?v=2'))
      .then(()=>import('./profile-edit-unified.js?v=1'))
      .then(()=>import('./profile-customizer-placement.js?v=1'));
    return unifiedReady;
  }

  async function openDeepEditor(){
    if(editorLoading)return;
    editorLoading=true;
    try{
      await loadUnified();
      const m=await import('./profile-edit-deep.js?v=7');
      await m.openProfileEditor();
    }catch(e){console.error('[Shadrat] deep editor',e)}finally{editorLoading=false}
  }

  function init(){
    injectStyles();cleanLegacy();loadUnified().catch(e=>console.error('[Shadrat] unified editor init',e));
    const host=document.querySelector('.container.grid')||document.body;
    new MutationObserver(cleanLegacy).observe(host,{subtree:true,childList:true});
    document.addEventListener('click',e=>{
      const pencil=e.target.closest('.profile-cover-edit');
      if(!pencil)return;
      e.preventDefault();e.stopImmediatePropagation();openDeepEditor();
    },true);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();