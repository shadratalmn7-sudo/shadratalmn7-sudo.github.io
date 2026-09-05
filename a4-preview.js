(()=>{
  const fit=()=>{
    const wrap=document.querySelector('.preview-wrap');
    const page=wrap?.querySelector('.cv,.letter');
    if(!wrap||!page)return;
    requestAnimationFrame(()=>{
      const pageWidth=page.offsetWidth||794;
      const available=Math.max(220,wrap.clientWidth-28);
      const scale=Math.min(1,available/pageWidth);
      wrap.style.setProperty('--a4-preview-scale',String(scale));
      const pageHeight=Math.max(page.scrollHeight,page.offsetHeight,1123);
      const top=window.matchMedia('(max-width:520px)').matches?40:44;
      wrap.style.height=`${Math.ceil(top+pageHeight*scale+14)}px`;
    });
  };
  const boot=()=>{
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
