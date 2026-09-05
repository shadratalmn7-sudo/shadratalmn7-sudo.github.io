(()=>{
  const root=document.documentElement;
  if(window.__shadratAdminShellBootstrap)return;
  window.__shadratAdminShellBootstrap=true;
  root.classList.add('admin-shell-pending');

  const style=document.createElement('style');
  style.id='admin-shell-bootstrap-style';
  style.textContent=`html.admin-shell-pending body{visibility:hidden!important}html.admin-shell-error body{visibility:visible!important}html.admin-shell-error body>*{display:none!important}html.admin-shell-error:before{content:"تعذر تحميل واجهة الإدارة الحديثة. أعد تحميل الصفحة.";position:fixed;inset:0;display:grid;place-items:center;padding:24px;text-align:center;background:#f8fbff;color:#173763;font:700 16px Tahoma,Arial;z-index:2147483647}`;
  document.head.appendChild(style);

  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));

  async function waitForRole(){
    const started=Date.now();
    while(!document.body||!document.body.dataset.role||document.body.dataset.role==='pending'){
      if(Date.now()-started>12000)throw new Error('admin role timeout');
      await sleep(40);
    }
  }

  function ensureCurrentCss(){
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('link[data-admin-navigation-current="24"]');
      if(existing){
        if(existing.sheet)return resolve();
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',()=>reject(new Error('admin navigation css failed')),{once:true});
        return;
      }
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href='admin-navigation.css?v=24';
      link.dataset.adminNavigationCurrent='24';
      link.addEventListener('load',resolve,{once:true});
      link.addEventListener('error',()=>reject(new Error('admin navigation css failed')),{once:true});
      document.head.appendChild(link);
    });
  }

  async function boot(){
    await waitForRole();
    await ensureCurrentCss();
    const aside=document.querySelector('.admin-nav');
    if(aside)aside.dataset.adminBuilt='force-current-24';
    await import('./admin-navigation.js?v=24');
    await nextPaint();
    document.body.dataset.adminShellReady='24';
    root.classList.remove('admin-pending','admin-shell-pending');
  }

  boot().catch(error=>{
    console.error('[Shadrat] admin shell bootstrap',error);
    root.classList.remove('admin-pending','admin-shell-pending');
    root.classList.add('admin-shell-error');
  });
})();
