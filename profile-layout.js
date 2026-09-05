(()=>{
  if(window.__shadratProfileLayoutV10)return;
  window.__shadratProfileLayoutV10=true;

  const GROUPS={overview:['overview'],'student-info':['student-info'],level:['level','rewards'],artifacts:['favorites','documents','artifacts'],orders:['orders','support']};
  const LEGACY={favorites:'artifacts',documents:'artifacts',rewards:'level',support:'orders'};
  const FINAL_TABS=`<button class="is-active" data-profile-tab="overview" type="button"><svg class="profile-main-icon" viewBox="0 0 24 24" fill="none"><path d="M4 10.8 12 4l8 6.8v8.7h-5.4v-5.8H9.4v5.8H4v-8.7Z"/></svg><span>الرئيسية</span></button><button data-profile-tab="student-info" type="button"><svg class="profile-main-icon" viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c.8-3.6 3.1-5.5 7-5.5s6.2 1.9 7 5.5"/></svg><span>حسابي</span></button><button data-profile-tab="level" type="button"><svg class="profile-main-icon" viewBox="0 0 24 24" fill="none"><path d="M5 18V9m7 9V5m7 13v-6M3 20h18"/></svg><span>تقدمي</span></button><span class="profile-tab-wrap"><button data-profile-tab="artifacts" type="button"><svg class="profile-main-icon" viewBox="0 0 24 24" fill="none"><path d="M3.5 7.5h6l1.8 2H20v9.5H3.5V7.5Zm0 0V5h6l1.5 2.5"/></svg><span>ملفاتي</span></button><b class="student-badge" data-favorite-count hidden>0</b></span><span class="profile-tab-wrap profile-tab-wide-mobile"><button data-profile-tab="orders" type="button"><svg class="profile-main-icon" viewBox="0 0 24 24" fill="none"><path d="M6 4h12v16H6V4Zm3 4h6M9 12h6M9 16h4"/></svg><span>طلباتي</span></button><b class="student-badge" data-support-badge hidden>0</b></span>`;
  let current='overview',repairing=false,editorPromise=null;

  const mainOf=id=>LEGACY[id]||id;
  function finalTabsReady(){const tabs=document.querySelector('.profile-tabs');if(!tabs)return true;const v=[...tabs.querySelectorAll('[data-profile-tab]')].map(b=>`${b.dataset.profileTab}:${b.textContent.trim()}`);return v.length===5&&v[0]==='overview:الرئيسية'&&v[1]==='student-info:حسابي'&&v[2]==='level:تقدمي'&&v[3]==='artifacts:ملفاتي'&&v[4]==='orders:طلباتي'}
  function ensureFinalTabs(){const tabs=document.querySelector('.profile-tabs');if(!tabs||repairing||document.body.dataset.profileMode==='owner'||finalTabsReady())return;repairing=true;tabs.innerHTML=FINAL_TABS;repairing=false}
  function cleanLegacy(){document.querySelector('#student-profile-editor')?.remove();document.querySelector('#profile-account-customize-card')?.remove();document.querySelector('#profile-customizer-stash')?.remove()}

  function activate(request,{scroll=false,sub=''}={}){
    if(document.body.dataset.profileMode==='owner')return;
    const main=mainOf(request);if(!GROUPS[main])return;current=main;ensureFinalTabs();
    document.querySelectorAll('.profile-tabs [data-profile-tab]').forEach(b=>{const on=b.dataset.profileTab===main;b.classList.toggle('is-active',on);b.setAttribute('aria-current',on?'page':'false')});
    document.querySelectorAll('.profile-panel').forEach(p=>p.classList.remove('is-active'));
    GROUPS[main].forEach(id=>document.querySelectorAll(`[data-profile-panel="${id}"]`).forEach(p=>p.classList.add('is-active')));
    if(scroll){const t=sub?document.querySelector(`[data-profile-panel="${sub}"]`):document.querySelector(`[data-profile-panel="${GROUPS[main][0]}"]`);setTimeout(()=>t?.scrollIntoView({behavior:'smooth',block:'start'}),20)}
  }

  function getEditor(){editorPromise=editorPromise||import('./profile-edit-deep.js?v=5').catch(error=>{editorPromise=null;throw error});return editorPromise}
  async function openEditor(){try{const editor=await getEditor();await editor.openProfileEditor()}catch(error){console.error('[Shadrat] profile editor failed to open',error);alert('تعذر فتح تعديل الحساب الآن. حدّث الصفحة وحاول مرة ثانية.')}}

  function customColorInput(root=document){return root.querySelector('[name="profileCustomName"],[data-profile-custom-name]')}
  function prepareColorMode(root=document){const input=customColorInput(root);if(!input)return;input.dataset.profileCustomName='1';const radios=[...root.querySelectorAll('[name="profileNameColor"]')];if(input.name==='profileCustomName'&&input.value.toLowerCase()==='#ffffff'&&radios.some(r=>r.checked))input.removeAttribute('name')}
  function wireColorMode(){
    document.addEventListener('change',event=>{const radio=event.target.closest?.('[name="profileNameColor"]');if(!radio)return;const form=radio.closest('form'),input=customColorInput(form||document);if(input){input.dataset.profileCustomName='1';input.removeAttribute('name')}},true);
    document.addEventListener('input',event=>{const input=event.target.closest?.('[data-profile-custom-name]');if(!input)return;input.setAttribute('name','profileCustomName');input.closest('form')?.querySelectorAll('[name="profileNameColor"]').forEach(r=>r.checked=false)},true);
    new MutationObserver(()=>prepareColorMode()).observe(document.documentElement,{subtree:true,childList:true});
  }

  function wire(){document.addEventListener('click',event=>{const edit=event.target.closest('[data-profile-edit]');if(edit){event.preventDefault();event.stopImmediatePropagation();openEditor();return}const tab=event.target.closest('.profile-tabs [data-profile-tab]');if(tab){event.preventDefault();activate(tab.dataset.profileTab,{scroll:true});return}const shortcut=event.target.closest('[data-open-profile-tab]');if(!shortcut)return;const req=shortcut.dataset.openProfileTab||'',main=mainOf(req);if(!GROUPS[main])return;event.preventDefault();activate(main,{scroll:true,sub:req!==main?req:''})},true)}

  function boot(){cleanLegacy();ensureFinalTabs();activate(current);wire();wireColorMode();prepareColorMode();const tabs=document.querySelector('.profile-tabs');if(tabs)new MutationObserver(()=>{ensureFinalTabs();activate(current)}).observe(tabs,{childList:true,subtree:true,characterData:true});document.body.classList.add('profile-ui-ready');window.dispatchEvent(new CustomEvent('shadrat:profile-ui-ready'));const warm=()=>getEditor().catch(()=>{});if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:1200});else setTimeout(warm,250)}

  window.ShadratProfileNav={open:(id,options={})=>activate(id,{scroll:true,...options}),activate};
  boot();
})();