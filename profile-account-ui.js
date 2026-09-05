(()=>{
  if(window.__shadratAccountUiV1)return;
  window.__shadratAccountUiV1=true;

  let deepRoot=null;

  function injectStyles(){
    if(document.querySelector('#profile-account-ui-style'))return;
    const s=document.createElement('style');
    s.id='profile-account-ui-style';
    s.textContent=`
      #student-profile-editor{display:none!important}
      .profile-account-customize-card{margin-top:14px;padding:16px;border:1px solid #d7e4f5;border-radius:18px;background:linear-gradient(135deg,#fbfdff,#f1f6ff);display:flex;align-items:center;justify-content:space-between;gap:14px;box-shadow:0 7px 22px rgba(15,23,42,.04)}
      .profile-account-customize-copy{display:flex;align-items:center;gap:12px;min-width:0}.profile-account-customize-icon{width:48px;height:48px;flex:0 0 48px;display:grid;place-items:center;border-radius:15px;background:linear-gradient(145deg,#2563eb,#3b82f6);color:#fff;font-size:23px;box-shadow:0 8px 20px rgba(37,99,235,.2)}
      .profile-account-customize-card h3{margin:0 0 4px;font-size:16px;color:#173d75}.profile-account-customize-card p{margin:0;color:#6b7f9b;font-size:12px;line-height:1.7}
      .profile-customizer-stash{display:none!important}
      .profile-customize-deep{position:fixed;inset:0;z-index:12500;background:#f5f8fd;overflow:auto;overscroll-behavior:contain}
      .profile-customize-shell{width:min(860px,100%);min-height:100%;margin:auto;background:#fff}
      .profile-customize-bar{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:46px 1fr 46px;align-items:center;gap:10px;padding:13px 16px;border-bottom:1px solid #dce6f4;background:rgba(255,255,255,.95);backdrop-filter:blur(14px)}
      .profile-customize-back{width:42px;height:42px;border:1px solid #d4e0f0;border-radius:13px;background:#fff;color:#2563eb;font:900 24px/1 Tahoma;display:grid;place-items:center;cursor:pointer}
      .profile-customize-title{text-align:center}.profile-customize-title b{display:block;font-size:17px}.profile-customize-title small{display:block;color:#71819a;font-size:11px;margin-top:2px}
      .profile-customize-body{padding:18px 16px 34px}.profile-customize-body>.profile-customizer{margin:0!important;padding:0!important;border-top:0!important}
      .profile-customize-loading{padding:45px 15px;text-align:center;color:#617694;font-weight:900}
      @media(max-width:640px){.profile-account-customize-card{align-items:flex-start;flex-direction:column}.profile-account-customize-card .btn{width:100%}.profile-customize-body{padding:15px 13px 28px}.profile-customize-bar{padding:11px 13px}}
    `;
    document.head.appendChild(s);
  }

  function removeLegacyEditor(){
    document.querySelector('#student-profile-editor')?.remove();
    document.querySelectorAll('.dashboard-actions [data-open-profile-tab="student-info"]').forEach(b=>{b.hidden=true;b.setAttribute('aria-hidden','true')});
  }

  function ensureAccountCard(){
    if(document.querySelector('#profile-account-customize-card'))return;
    const panel=document.querySelector('[data-profile-panel="student-info"]');
    const grid=panel?.querySelector('.info-grid');
    if(!panel||!grid)return;
    const card=document.createElement('section');
    card.id='profile-account-customize-card';
    card.className='profile-account-customize-card';
    card.innerHTML=`<div class="profile-account-customize-copy"><span class="profile-account-customize-icon">🎨</span><div><h3>تخصيص حسابي</h3><p>الصورة الشخصية، ثيم الملف، إطار الصورة، الشارة، لون الاسم والتأثيرات التي تفتحها بالمستويات.</p></div></div><button class="btn outline" type="button" data-open-account-customizer>فتح التخصيص</button>`;
    grid.after(card);
    const stash=document.createElement('div');
    stash.id='profile-customizer-stash';
    stash.className='profile-customizer-stash';
    card.after(stash);
    card.querySelector('[data-open-account-customizer]').addEventListener('click',openCustomizer);
  }

  function currentHost(){return deepRoot?.querySelector('[data-customizer-host]')||document.querySelector('#profile-customizer-stash')}

  function syncCustomizer(){
    ensureAccountCard();
    const incoming=document.querySelector('#rewards .profile-customizer');
    if(!incoming)return;
    const host=currentHost();
    if(!host)return;
    host.querySelector('.profile-customizer')?.remove();
    host.appendChild(incoming);
    const rewardsTitle=document.querySelector('#rewards .card-heading h2');
    if(rewardsTitle&&rewardsTitle.textContent.includes('وتخصيص'))rewardsTitle.textContent='جوائزي';
  }

  function closeCustomizer(){
    if(!deepRoot)return;
    const custom=deepRoot.querySelector('.profile-customizer');
    const stash=document.querySelector('#profile-customizer-stash');
    if(custom&&stash)stash.appendChild(custom);
    deepRoot.remove();
    deepRoot=null;
    document.body.style.overflow='';
  }

  function openCustomizer(){
    if(deepRoot)return;
    syncCustomizer();
    document.body.style.overflow='hidden';
    deepRoot=document.createElement('div');
    deepRoot.className='profile-customize-deep';
    deepRoot.innerHTML=`<div class="profile-customize-shell"><header class="profile-customize-bar"><button class="profile-customize-back" type="button" aria-label="رجوع">‹</button><div class="profile-customize-title"><b>تخصيص حسابي</b><small>كل خيار مقفل يفتح تلقائيًا عند المستوى المطلوب</small></div><span></span></header><main class="profile-customize-body" data-customizer-host><div class="profile-customize-loading">جاري تجهيز خيارات التخصيص…</div></main></div>`;
    document.body.appendChild(deepRoot);
    deepRoot.querySelector('.profile-customize-back').addEventListener('click',closeCustomizer);
    const stash=document.querySelector('#profile-customizer-stash');
    const custom=stash?.querySelector('.profile-customizer');
    if(custom){const host=deepRoot.querySelector('[data-customizer-host]');host.innerHTML='';host.appendChild(custom)}
    else setTimeout(syncCustomizer,80);
  }

  function hardenReadOnly(){
    const panel=document.querySelector('[data-profile-panel="student-info"]');
    panel?.querySelectorAll('#profile-edit-toggle,#profile-edit-form,.profile-edit-head').forEach(el=>el.remove());
  }

  function init(){
    injectStyles();removeLegacyEditor();hardenReadOnly();ensureAccountCard();syncCustomizer();
    const root=document.querySelector('.container.grid')||document.body;
    new MutationObserver(()=>{removeLegacyEditor();hardenReadOnly();ensureAccountCard();syncCustomizer()}).observe(root,{subtree:true,childList:true});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&deepRoot)closeCustomizer()});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();