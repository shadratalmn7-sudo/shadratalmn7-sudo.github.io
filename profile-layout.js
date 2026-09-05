(()=>{
  if(window.__shadratProfileLayoutV3)return;
  window.__shadratProfileLayoutV3=true;

  const GROUPS={
    overview:['overview'],
    'student-info':['student-info'],
    level:['level','rewards'],
    artifacts:['favorites','documents','artifacts'],
    orders:['orders','support']
  };
  const LEGACY_TO_MAIN={favorites:'artifacts',documents:'artifacts',rewards:'level',support:'orders'};
  let currentGroup='overview',syncing=false;

  const icon=(path)=>`<svg class="profile-main-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${path}"/></svg>`;
  const ICONS={
    home:icon('M4 10.8 12 4l8 6.8v8.7h-5.4v-5.8H9.4v5.8H4v-8.7Z'),
    account:icon('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c.8-3.6 3.1-5.5 7-5.5s6.2 1.9 7 5.5'),
    progress:icon('M5 18V9m7 9V5m7 13v-6M3 20h18'),
    files:icon('M3.5 7.5h6l1.8 2H20v9.5H3.5V7.5Zm0 0V5h6l1.5 2.5'),
    orders:icon('M6 4h12v16H6V4Zm3 4h6M9 12h6M9 16h4')
  };

  function injectStyles(){
    if(document.querySelector('#profile-layout-v3-style'))return;
    const style=document.createElement('style');
    style.id='profile-layout-v3-style';
    style.textContent=`
      .student-cover{position:relative}
      .profile-cover-edit{position:absolute;left:18px;top:18px;z-index:5;width:44px;height:44px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.45);border-radius:14px;background:rgba(255,255,255,.16);color:#fff;box-shadow:0 8px 22px rgba(15,23,42,.14);backdrop-filter:blur(8px);cursor:pointer;transition:.18s ease}
      .profile-cover-edit:hover{background:rgba(255,255,255,.25);transform:translateY(-1px)}
      .profile-cover-edit:active{transform:scale(.96)}
      .profile-cover-edit svg{width:21px;height:21px;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
      .profile-tabs{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px!important;overflow:visible!important;padding:7px 0 16px!important}
      .profile-tabs>.profile-tab-wrap{display:block!important;position:relative;min-width:0}
      .profile-tabs>button,.profile-tabs>.profile-tab-wrap>button{width:100%;min-height:67px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;white-space:normal!important;border:1px solid #d8e3f2!important;border-radius:18px!important;background:#fff!important;color:#28548d!important;padding:9px 7px!important;font:800 13px/1.25 Tahoma,Arial,sans-serif!important;box-shadow:0 6px 18px rgba(15,23,42,.045);cursor:pointer;transition:.18s ease}
      .profile-tabs>button:hover,.profile-tabs>.profile-tab-wrap>button:hover{border-color:#b8cdf0!important;transform:translateY(-1px)}
      .profile-tabs>button.is-active,.profile-tabs>.profile-tab-wrap>button.is-active{background:linear-gradient(145deg,#2563eb,#3b82f6)!important;color:#fff!important;border-color:#2563eb!important;box-shadow:0 10px 24px rgba(37,99,235,.22)!important}
      .profile-main-icon{width:22px;height:22px;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
      .profile-tabs .student-badge{top:-6px!important;left:-5px!important;z-index:4}
      .profile-group-heading{display:none;align-items:center;justify-content:space-between;gap:14px;padding:15px 17px;margin:2px 0 12px;border:1px solid #dbe7f5;border-radius:18px;background:linear-gradient(135deg,#fbfdff,#f2f7ff)}
      .profile-group-heading.is-active{display:flex}
      .profile-group-heading h2{margin:0;font-size:19px;color:#173d75}
      .profile-group-heading p{margin:4px 0 0;color:#6b7f9b;font-size:12px;line-height:1.55}
      .profile-group-chips{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
      .profile-group-chip{padding:6px 9px;border:1px solid #cfdef3;border-radius:999px;background:#fff;color:#315b91;font-size:11px;font-weight:800;white-space:nowrap}
      .profile-panel.group-section-visible{margin-top:12px}
      [data-profile-panel="favorites"].group-section-visible,[data-profile-panel="documents"].group-section-visible,[data-profile-panel="artifacts"].group-section-visible,[data-profile-panel="orders"].group-section-visible,[data-profile-panel="support"].group-section-visible,#level.group-section-visible,#missions.group-section-visible,#rewards.group-section-visible{position:relative}
      .profile-section-caption{display:flex;align-items:center;gap:8px;margin:18px 2px 9px;color:#334e73;font-size:13px;font-weight:900}
      .profile-section-caption:before{content:'';width:7px;height:7px;border-radius:50%;background:#2563eb;box-shadow:0 0 0 5px #eaf2ff}
      @media(max-width:700px){
        .profile-tabs{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}
        .profile-tabs>.profile-tab-wrap.profile-tab-wide-mobile{grid-column:1/-1}
        .profile-tabs>button,.profile-tabs>.profile-tab-wrap>button{min-height:61px;font-size:13px!important;border-radius:16px!important}
        .profile-cover-edit{left:14px;top:14px;width:42px;height:42px}
        .profile-group-heading{align-items:flex-start;flex-direction:column}
        .profile-group-chips{justify-content:flex-start}
      }
      @media(max-width:410px){.profile-tabs>button,.profile-tabs>.profile-tab-wrap>button{min-height:58px;padding:8px 5px!important}.profile-main-icon{width:20px;height:20px}}
    `;
    document.head.appendChild(style);
  }

  function buildTabs(){
    const nav=document.querySelector('.profile-tabs');
    if(!nav||document.body.dataset.profileMode==='owner')return;
    nav.innerHTML=`
      <button class="is-active" data-profile-tab="overview" type="button">${ICONS.home}<span>الرئيسية</span></button>
      <button data-profile-tab="student-info" type="button">${ICONS.account}<span>حسابي</span></button>
      <button data-profile-tab="level" type="button">${ICONS.progress}<span>تقدمي</span></button>
      <span class="profile-tab-wrap"><button data-profile-tab="artifacts" type="button">${ICONS.files}<span>ملفاتي</span></button><b class="student-badge" data-favorite-count hidden>0</b></span>
      <span class="profile-tab-wrap profile-tab-wide-mobile"><button data-profile-tab="orders" type="button">${ICONS.orders}<span>طلباتي</span></button><b class="student-badge" data-support-badge hidden>0</b></span>`;
  }

  function addGroupHeadings(){
    if(document.querySelector('[data-profile-group-heading]'))return;
    const configs=[
      {main:'student-info',anchor:'[data-profile-panel="student-info"]',title:'حسابي',desc:'بياناتك الشخصية وتخصيص مظهر حسابك.',chips:['البيانات','الصورة','الثيم والشارات']},
      {main:'level',anchor:'[data-profile-panel="level"]',title:'تقدمي',desc:'مستواك، طريقك للمستوى التالي، المهمات والجوائز.',chips:['المستويات','المهمات','الجوائز']},
      {main:'artifacts',anchor:'[data-profile-panel="favorites"]',title:'ملفاتي',desc:'كل ما حفظته أو أنشأته في شذرات بمكان واحد.',chips:['المنح المحفوظة','المستندات','CV و Motivation']},
      {main:'orders',anchor:'[data-profile-panel="orders"]',title:'طلباتي',desc:'تابع الخدمات والردود المرتبطة بحسابك.',chips:['طلبات الخدمات','ردود الإدارة']}
    ];
    configs.forEach(c=>{
      const anchor=document.querySelector(c.anchor);if(!anchor)return;
      const h=document.createElement('section');h.className='profile-group-heading';h.dataset.profileGroupHeading=c.main;
      h.innerHTML=`<div><h2>${c.title}</h2><p>${c.desc}</p></div><div class="profile-group-chips">${c.chips.map(x=>`<span class="profile-group-chip">${x}</span>`).join('')}</div>`;
      anchor.before(h);
    });
  }

  function addCaptions(){
    const captions=[
      ['level','المستوى وخط التقدم'],['missions','المهمات المتاحة'],['rewards','الجوائز والتخصيصات'],
      ['favorites','المنح المحفوظة'],['documents','المستندات والأدوات'],['artifacts','CV و Motivation المحفوظة'],
      ['orders','طلبات الخدمات'],['support','رسائل الإدارة والدعم']
    ];
    captions.forEach(([id,label])=>{
      const panel=id==='level'?document.querySelector('#level'):id==='missions'?document.querySelector('#missions'):id==='rewards'?document.querySelector('#rewards'):document.querySelector(`[data-profile-panel="${id}"]`);
      if(!panel||panel.previousElementSibling?.dataset?.profileCaption===id)return;
      const cap=document.createElement('div');cap.className='profile-section-caption';cap.dataset.profileCaption=id;cap.textContent=label;panel.before(cap);
    });
  }

  function groupMain(id){return LEGACY_TO_MAIN[id]||id}

  function activateGroup(requested,{scroll=false,subtarget=''}={}){
    if(document.body.dataset.profileMode==='owner')return;
    const main=groupMain(requested);
    if(!GROUPS[main])return;
    currentGroup=main;syncing=true;
    document.querySelectorAll('.profile-tabs [data-profile-tab]').forEach(b=>b.classList.toggle('is-active',b.dataset.profileTab===main));
    document.querySelectorAll('.profile-panel').forEach(p=>{p.classList.remove('is-active','group-section-visible')});
    const allowed=GROUPS[main];
    allowed.forEach(name=>document.querySelectorAll(`[data-profile-panel="${name}"]`).forEach(p=>{p.classList.add('is-active','group-section-visible')}));
    document.querySelectorAll('[data-profile-group-heading]').forEach(h=>h.classList.toggle('is-active',h.dataset.profileGroupHeading===main));
    document.querySelectorAll('.profile-section-caption').forEach(c=>{
      const id=c.dataset.profileCaption;
      const relatedMain=groupMain(id);
      c.style.display=relatedMain===main?'flex':'none';
    });
    syncing=false;
    if(scroll){
      const target=subtarget?document.querySelector(subtarget):document.querySelector(`[data-profile-group-heading="${main}"]`)||document.querySelector(`[data-profile-panel="${allowed[0]}"]`);
      setTimeout(()=>target?.scrollIntoView({behavior:'smooth',block:'start'}),30);
    }
  }

  function remapQuickLinks(){
    document.querySelectorAll('[data-open-profile-tab]').forEach(el=>{
      const original=el.dataset.openProfileTab||'';
      const main=groupMain(original);
      if(main!==original){el.dataset.profileOriginalTarget=original;el.dataset.openProfileTab=main}
    });
  }

  function addEditButton(){
    const cover=document.querySelector('.student-cover');if(!cover||cover.querySelector('.profile-cover-edit')||document.body.dataset.profileMode==='owner')return;
    const button=document.createElement('button');button.type='button';button.className='profile-cover-edit';button.setAttribute('aria-label','تعديل حسابي');button.title='تعديل حسابي';
    button.innerHTML='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 19.5 8 18.8 18.2 8.6a2.2 2.2 0 0 0-3.1-3.1L4.9 15.7l-.4 3.8ZM13.8 6.8l3.4 3.4"/></svg>';
    button.addEventListener('click',()=>{
      activateGroup('student-info',{scroll:true});
      let tries=0;
      const open=()=>{
        const toggle=document.querySelector('#profile-edit-toggle'),form=document.querySelector('#profile-edit-form');
        if(toggle){if(form?.hidden!==false)toggle.click();setTimeout(()=>form?.querySelector('input,select')?.focus({preventScroll:true}),90);return}
        if(++tries<30)setTimeout(open,100);
      };
      setTimeout(open,60);
    });
    cover.appendChild(button);
  }

  function hideRedundantEdit(){
    const old=document.querySelector('.dashboard-actions [data-open-profile-tab="student-info"]');
    if(old){old.hidden=true;old.setAttribute('aria-hidden','true')}
  }

  function wireMainTabs(){
    document.addEventListener('click',event=>{
      const tab=event.target.closest('.profile-tabs [data-profile-tab]');
      if(tab){event.preventDefault();event.stopImmediatePropagation();activateGroup(tab.dataset.profileTab,{scroll:true});return}
      const quick=event.target.closest('[data-open-profile-tab]');
      if(quick){
        const requested=quick.dataset.openProfileTab,sub=quick.dataset.profileOriginalTarget||'';
        if(GROUPS[groupMain(requested)]){
          event.preventDefault();event.stopImmediatePropagation();
          const subSelector=sub?`[data-profile-panel="${sub}"]`:'';
          activateGroup(requested,{scroll:true,subtarget:subSelector});
        }
      }
    },true);
  }

  function watchLegacySelection(){
    const root=document.querySelector('.container.grid');if(!root)return;
    const observer=new MutationObserver(()=>{
      if(syncing||document.body.dataset.profileMode==='owner')return;
      const active=[...document.querySelectorAll('.profile-panel.is-active')];
      if(!active.length)return;
      const candidate=active.map(x=>x.dataset.profilePanel).find(Boolean);
      const main=groupMain(candidate);
      if(main&&GROUPS[main]&&main!==currentGroup)activateGroup(main,{scroll:false});
    });
    observer.observe(root,{subtree:true,attributes:true,attributeFilter:['class']});
  }

  function init(){
    injectStyles();
    buildTabs();
    addGroupHeadings();
    addCaptions();
    remapQuickLinks();
    addEditButton();
    hideRedundantEdit();
    wireMainTabs();
    watchLegacySelection();
    activateGroup('overview',{scroll:false});
    const ownerWatch=new MutationObserver(()=>{if(document.body.dataset.profileMode==='owner')return;addEditButton();remapQuickLinks()});
    ownerWatch.observe(document.body,{attributes:true,attributeFilter:['data-profile-mode'],childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
