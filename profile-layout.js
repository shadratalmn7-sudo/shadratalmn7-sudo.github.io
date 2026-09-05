(()=>{
  if(window.__shadratProfileLayoutV7)return;
  window.__shadratProfileLayoutV7=true;

  const GROUPS={
    overview:['overview'],
    'student-info':['student-info'],
    level:['level','rewards'],
    artifacts:['favorites','documents','artifacts'],
    orders:['orders','support']
  };
  const LEGACY={favorites:'artifacts',documents:'artifacts',rewards:'level',support:'orders'};
  const LEVEL_TAB='<svg class="profile-main-icon" viewBox="0 0 24 24" fill="none"><path d="M5 18V9m7 9V5m7 13v-6M3 20h18"/></svg><span>تقدمي</span>';
  let current='overview',repairing=false;

  function mainOf(id=''){return LEGACY[id]||id}

  function activate(request,{scroll=false,sub=''}={}){
    if(document.body.dataset.profileMode==='owner')return;
    const main=mainOf(request);
    if(!GROUPS[main])return;
    current=main;
    document.querySelectorAll('.profile-tabs [data-profile-tab]').forEach(button=>{
      const active=button.dataset.profileTab===main;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-current',active?'page':'false');
    });
    document.querySelectorAll('.profile-panel').forEach(panel=>panel.classList.remove('is-active'));
    GROUPS[main].forEach(id=>document.querySelectorAll(`[data-profile-panel="${id}"]`).forEach(panel=>panel.classList.add('is-active')));
    if(scroll){
      const target=sub?document.querySelector(`[data-profile-panel="${sub}"]`):document.querySelector(`[data-profile-panel="${GROUPS[main][0]}"]`);
      setTimeout(()=>target?.scrollIntoView({behavior:'smooth',block:'start'}),20);
    }
  }

  function keepFinalTabs(){
    if(repairing)return;
    const level=document.querySelector('.profile-tabs [data-profile-tab="level"]');
    if(level&&!level.querySelector('.profile-main-icon')){
      repairing=true;level.innerHTML=LEVEL_TAB;repairing=false;
    }
  }

  function wire(){
    document.addEventListener('click',event=>{
      const tab=event.target.closest('.profile-tabs [data-profile-tab]');
      if(tab){event.preventDefault();activate(tab.dataset.profileTab,{scroll:true});return}
      const shortcut=event.target.closest('[data-open-profile-tab]');
      if(!shortcut)return;
      const requested=shortcut.dataset.openProfileTab||'',main=mainOf(requested);
      if(!GROUPS[main])return;
      event.preventDefault();activate(main,{scroll:true,sub:requested!==main?requested:''});
    });
  }

  function init(){
    wire();activate(current);keepFinalTabs();
    const tabs=document.querySelector('.profile-tabs');if(tabs)new MutationObserver(keepFinalTabs).observe(tabs,{childList:true,subtree:true});
  }

  window.ShadratProfileNav={open:(id,options={})=>activate(id,{scroll:true,...options}),activate};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();