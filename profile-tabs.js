(() => {
  const panelNames=['student-info','level','missions','rewards','saved','journey','orders'];
  const tabs=()=>[...document.querySelectorAll('[data-profile-tab]')];
  const panels=()=>panelNames.flatMap(name=>[...document.querySelectorAll(`[data-profile-panel="${name}"], #${name}`)]);
  function openPanel(name,updateUrl=true){if(name==='missions')name='level';if(!panelNames.includes(name))name='student-info';tabs().forEach(tab=>{const active=tab.dataset.profileTab===name;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',String(active))});panels().forEach(panel=>{const panelName=panel.dataset.profilePanel||panel.id,active=panelName===name||(name==='level'&&panelName==='missions');panel.classList.toggle('is-active',active);panel.hidden=!active});if(updateUrl)history.replaceState(null,'',`#${name}`)}
  window.ShadratOpenProfilePanel=openPanel;
  document.addEventListener('click',event=>{const tab=event.target.closest('[data-profile-tab]');if(tab){event.preventDefault();openPanel(tab.dataset.profileTab);return}const quick=event.target.closest('[data-open-profile-tab]');if(quick){event.preventDefault();openPanel(quick.dataset.openProfileTab)}});
  document.querySelector('.student-edit')?.addEventListener('click',event=>{event.preventDefault();openPanel('student-info')});
  import('./student-orders-center.js?v=1').then(()=>{if(location.hash==='#orders')openPanel('orders',false)}).catch(err=>console.warn('[Shadrat] orders center',err));
  import('./scholarship-auto-alerts.js?v=1').catch(err=>console.warn('[Shadrat] scholarship auto alerts',err));
  openPanel(location.hash.slice(1),false);
})();
