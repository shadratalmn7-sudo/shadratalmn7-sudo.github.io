(()=>{
  const ensureRtlFix=()=>{
    if(document.getElementById('shadrat-builder-rtl-fix'))return;
    const style=document.createElement('style');
    style.id='shadrat-builder-rtl-fix';
    style.textContent=`
      .cv[dir="rtl"],.letter[dir="rtl"]{direction:rtl!important}
      .cv[dir="rtl"] h1,.cv[dir="rtl"] h2,.letter[dir="rtl"] h1{
        direction:rtl!important;
        unicode-bidi:isolate!important;
        letter-spacing:0!important;
        font-family:Tahoma,Arial,sans-serif!important;
      }
      .cv[dir="rtl"] h2{ text-align:right!important }
      .cv[dir="rtl"] .role,.cv[dir="rtl"] .contact,.cv[dir="rtl"] p,.cv[dir="rtl"] li,
      .letter[dir="rtl"] .letter-meta,.letter[dir="rtl"] p{
        direction:rtl!important;
        unicode-bidi:plaintext!important;
        text-align:right!important;
        font-family:Tahoma,Arial,sans-serif!important;
        letter-spacing:0!important;
      }
    `;
    document.head.appendChild(style);
  };
  const fit=()=>{
    const wrap=document.querySelector('.preview-wrap');
    const page=wrap?.querySelector('.cv,.letter');
    if(!wrap||!page)return;
    requestAnimationFrame(()=>{
      const pageWidth=page.offsetWidth||794;
      const available=Math.max(220,wrap.clientWidth-28);
      const scale=Math.min(1,available/pageWidth);
      wrap.style.setProperty('--a4-preview-scale',String(scale));
      const multiPage=page.dataset.multipage==='true';
      const pageHeight=multiPage?Math.max(page.offsetHeight,page.scrollHeight,1123):(page.offsetHeight||1123);
      const top=window.matchMedia('(max-width:520px)').matches?40:44;
      wrap.style.height=`${Math.ceil(top+pageHeight*scale+14)}px`;
      const overflow=!multiPage&&page.scrollHeight>page.clientHeight+3;
      wrap.classList.toggle('is-a4-overflow',overflow);
    });
  };
  const boot=()=>{
    ensureRtlFix();
    fit();
    const wrap=document.querySelector('.preview-wrap');
    const page=wrap?.querySelector('.cv,.letter');
    if(!wrap||!page)return;
    if('ResizeObserver'in window){const ro=new ResizeObserver(fit);ro.observe(wrap);ro.observe(page)}
    const mo=new MutationObserver(fit);mo.observe(page,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','dir']});
    document.addEventListener('input',fit,true);
    document.addEventListener('change',fit,true);
    window.addEventListener('resize',fit,{passive:true});
    window.ShadratFitA4Preview=fit;
  };
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
