(()=>{
  const root=document.documentElement;
  if(window.__shadratAdminShellBootstrap)return;
  window.__shadratAdminShellBootstrap=true;

  if(!window.__shadratAdminEnglishLocale){
    window.__shadratAdminEnglishLocale=true;
    const dateOptions=options=>({...((options&&typeof options==='object')?options:{}),calendar:'gregory',numberingSystem:'latn'});
    const numberOptions=options=>({...((options&&typeof options==='object')?options:{}),numberingSystem:'latn'});
    const NativeDateTimeFormat=Intl.DateTimeFormat;
    const AdminDateTimeFormat=function(locales,options){return new NativeDateTimeFormat('en-GB',dateOptions(options))};
    AdminDateTimeFormat.prototype=NativeDateTimeFormat.prototype;
    AdminDateTimeFormat.supportedLocalesOf=NativeDateTimeFormat.supportedLocalesOf.bind(NativeDateTimeFormat);
    Intl.DateTimeFormat=AdminDateTimeFormat;
    const NativeNumberFormat=Intl.NumberFormat;
    const AdminNumberFormat=function(locales,options){return new NativeNumberFormat('en-US',numberOptions(options))};
    AdminNumberFormat.prototype=NativeNumberFormat.prototype;
    AdminNumberFormat.supportedLocalesOf=NativeNumberFormat.supportedLocalesOf.bind(NativeNumberFormat);
    Intl.NumberFormat=AdminNumberFormat;
    const nativeDate=Date.prototype.toLocaleDateString,nativeDateTime=Date.prototype.toLocaleString,nativeTime=Date.prototype.toLocaleTimeString;
    Date.prototype.toLocaleDateString=function(locales,options){return nativeDate.call(this,'en-GB',dateOptions(options))};
    Date.prototype.toLocaleString=function(locales,options){return nativeDateTime.call(this,'en-GB',dateOptions(options))};
    Date.prototype.toLocaleTimeString=function(locales,options){return nativeTime.call(this,'en-GB',dateOptions(options))};
    const nativeNumber=Number.prototype.toLocaleString;
    Number.prototype.toLocaleString=function(locales,options){return nativeNumber.call(this,'en-US',numberOptions(options))};
    if(typeof BigInt!=='undefined'&&BigInt.prototype?.toLocaleString){const nativeBigInt=BigInt.prototype.toLocaleString;BigInt.prototype.toLocaleString=function(locales,options){return nativeBigInt.call(this,'en-US',numberOptions(options))}}
  }

  root.classList.add('admin-shell-pending');
  const style=document.createElement('style');style.id='admin-shell-bootstrap-style';style.textContent=`html.admin-shell-pending body{visibility:hidden!important}html.admin-shell-error body{visibility:visible!important}html.admin-shell-error body>*{display:none!important}html.admin-shell-error:before{content:"تعذر تحميل واجهة الإدارة الحديثة. أعد تحميل الصفحة.";position:fixed;inset:0;display:grid;place-items:center;padding:24px;text-align:center;background:#f8fbff;color:#173763;font:700 16px Tahoma,Arial;z-index:2147483647}time,[data-date],[data-time]{font-variant-numeric:tabular-nums}`;document.head.appendChild(style);
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function waitForRole(){const started=Date.now();while(!document.body||!document.body.dataset.role||document.body.dataset.role==='pending'){if(Date.now()-started>12000)throw new Error('admin role timeout');await sleep(30)}}
  function ensureCurrentCss(){return new Promise((resolve,reject)=>{const existing=document.querySelector('link[data-admin-navigation-current="30"],link[data-admin-navigation-css="30"]');if(existing){if(existing.sheet)return resolve();existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',()=>reject(new Error('admin navigation css failed')),{once:true});return}const link=document.createElement('link');link.rel='stylesheet';link.href='admin-navigation.css?v=30';link.dataset.adminNavigationCurrent='30';link.addEventListener('load',resolve,{once:true});link.addEventListener('error',()=>reject(new Error('admin navigation css failed')),{once:true});document.head.appendChild(link)})}
  async function boot(){await waitForRole();const cssReady=ensureCurrentCss();const navReady=import('./admin-navigation.js?v=30');await Promise.all([cssReady,navReady]);const aside=document.querySelector('.admin-nav');if(aside&&aside.dataset.adminBuilt!=='30')aside.dataset.adminBuilt='force-current-30';document.body.dataset.adminShellReady='30';root.classList.remove('admin-pending','admin-shell-pending')}
  boot().catch(error=>{console.error('[Shadrat] admin shell bootstrap',error);root.classList.remove('admin-pending','admin-shell-pending');root.classList.add('admin-shell-error')});
})();