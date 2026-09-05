(()=>{
  if(window.__shadratProfileLayoutV9)return;
  window.__shadratProfileLayoutV9=true;

  const GROUPS={
    overview:['overview'],
    'student-info':['student-info'],
    level:['level','rewards'],
    artifacts:['favorites','documents','artifacts'],
    orders:['orders','support']
  };
  const LEGACY={favorites:'artifacts',documents:'artifacts',rewards:'level',support:'orders'};
  const FINAL_TABS=`<button class="is-active" data-profile-tab="overview" type="button"><svg class="profile-main-icon" viewBox="0 0 24 24" fill="none"><path d="M4 10.8 12 4l8 6.8v8.7h-5.4v-5.8H9.4v5.8H4v-8.7Z"/></svg><span>الرئيسية</span></button><button data-profile-tab="student-info" type="button"><svg class="profile-main-icon" viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c.8-3.6 3.1-5.5 7-5.5s6.2 1.9 7 5.5"/></svg><span>حسابي</span></button><button data-profile-tab="level" type="button"><svg class="profile-main-icon" viewBox="0 0 24 24" fill="none"><path d="M5 18V9m7 9V5m7 13v-6M3 20h18"/></svg><span>تقدمي</span></button><span class="profile-tab-wrap"><button data-profile-tab="artifacts" type="button"><svg class="profile-main-icon" viewBox="0 0 24 24" fill="none"><path d="M3.5 7.5h6l1.8 2H20v9.5H3.5V7.5Zm0 0V5h6l1.5 2.5"/></svg><span>ملفاتي</span></button><b class="student-badge" data-favorite-count hidden>0</b></span><span class="profile-tab-wrap profile-tab-wide-mobile"><button data-profile-tab="orders" type="button"><svg class="profile-main-icon" viewBox="0 0 24 24" fill="none"><path d="M6 4h12v16H6V4Zm3 4h6M9 12h6M9 16h4"/></svg><span>طلباتي</span></button><b class="student-badge" data-support-badge hidden>0</b></span>`;
  let current='overview',repairing=false,editorPromise=null;

  function mainOf(id=''){return LEGACY[id]||id}
  function readCachedProfile(){
    try{
      const session=JSON.parse(sessionStorage.getItem('shadrat_auth_session')||'null'),uid=session?.uid;
      if(!uid)return null;
      return JSON.parse(localStorage.getItem('shadrat-profile-cache-v3:'+uid)||'null')?.data||null;
    }catch{return null}
  }
  function applyCachedAppearance(){
    const data=readCachedProfile();if(!data)return;
    const cover=document.querySelector('.student-cover'),avatar=document.querySelector('[data-student-avatar]'),name=document.querySelector('[data-student-name]'),studentName=document.querySelector('.student-name');
    if(!cover||!avatar||!name)return;
    const raw=String(data.avatarKey||'');let prefs={};
    if(raw.startsWith('shadrat-profile-v2:')){try{prefs=JSON.parse(raw.slice(19))||{}}catch{prefs={}}}
    cover.classList.remove('theme-sky','theme-ocean','theme-midnight','theme-premium','theme-elite');
    if(prefs.theme&&prefs.theme!=='default')cover.classList.add('theme-'+prefs.theme);
    if(/^#[0-9a-f]{6}$/i.test(prefs.accent||''))cover.style.setProperty('--student-accent',prefs.accent);
    avatar.className='student-avatar'+(prefs.frame&&prefs.frame!=='none'?' frame-'+prefs.frame:'');
    if(typeof prefs.avatarDataUrl==='string'&&prefs.avatarDataUrl.startsWith('data:image/'))avatar.innerHTML=`<img src="${prefs.avatarDataUrl}" alt="الصورة الشخصية">`;
    const colors={white:'#fff',black:'#111827',blue:'#bfdbfe',purple:'#ddd6fe',cyan:'#a5f3fc'};
    name.style.color=/^#[0-9a-f]{6}$/i.test(prefs.customNameColor||'')?prefs.customNameColor:(colors[prefs.nameColor]||'#fff');
    studentName?.classList.toggle('name-effect',!!prefs.nameEffect);
  }
  function finalTabsReady(){
    const tabs=document.querySelector('.profile-tabs');if(!tabs)return true;
    const labels=[...tabs.querySelectorAll('[data-profile-tab]')].map(b=>`${b.dataset.profileTab}:${b.textContent.trim()}`);
    return labels.length===5&&labels[0]==='overview:الرئيسية'&&labels[1]==='student-info:حسابي'&&labels[2]==='level:تقدمي'&&labels[3]==='artifacts:ملفاتي'&&labels[4]==='orders:طلباتي';
  }
  function ensureFinalTabs(){
    const tabs=document.querySelector('.profile-tabs');if(!tabs||repairing||document.body.dataset.profileMode==='owner')return;
    if(finalTabsReady())return;
    repairing=true;tabs.innerHTML=FINAL_TABS;repairing=false;
  }
  function cleanLegacy(){
    document.querySelector('#student-profile-editor')?.remove();
    document.querySelector('#profile-account-customize-card')?.remove();
    document.querySelector('#profile-customizer-stash')?.remove();
  }

  function activate(request,{scroll=false,sub=''}={}){
    if(document.body.dataset.profileMode==='owner')return;
    const main=mainOf(request);
    if(!GROUPS[main])return;
    current=main;
    ensureFinalTabs();
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

  async function openEditor(){
    try{
      editorPromise=editorPromise||import('./profile-edit-deep.js?v=4');
      const editor=await editorPromise;
      await editor.openProfileEditor();
    }catch(error){
      editorPromise=null;
      console.error('[Shadrat] profile editor failed to open',error);
      alert('تعذر فتح تعديل الحساب الآن. حدّث الصفحة وحاول مرة ثانية.');
    }
  }

  function wire(){
    document.addEventListener('click',event=>{
      const edit=event.target.closest('[data-profile-edit]');
      if(edit){event.preventDefault();event.stopImmediatePropagation();openEditor();return}
      const tab=event.target.closest('.profile-tabs [data-profile-tab]');
      if(tab){event.preventDefault();activate(tab.dataset.profileTab,{scroll:true});return}
      const shortcut=event.target.closest('[data-open-profile-tab]');
      if(!shortcut)return;
      const requested=shortcut.dataset.openProfileTab||'',main=mainOf(requested);
      if(!GROUPS[main])return;
      event.preventDefault();activate(main,{scroll:true,sub:requested!==main?requested:''});
    },true);
  }

  function markReady(){
    document.body.classList.add('profile-ui-ready');
    window.dispatchEvent(new CustomEvent('shadrat:profile-ui-ready'));
  }
  function boot(){
    cleanLegacy();
    applyCachedAppearance();
    ensureFinalTabs();
    activate(current);
    wire();
    markReady();
    const tabs=document.querySelector('.profile-tabs');if(tabs)new MutationObserver(()=>{ensureFinalTabs();activate(current)}).observe(tabs,{childList:true,subtree:true,characterData:true});
  }

  window.ShadratProfileNav={open:(id,options={})=>activate(id,{scroll:true,...options}),activate};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();