(()=>{
  const ensureRtlFix=()=>{
    if(document.getElementById('shadrat-builder-rtl-fix'))return;
    const style=document.createElement('style');
    style.id='shadrat-builder-rtl-fix';
    style.textContent=`
      .cv[dir="rtl"],.letter[dir="rtl"]{direction:rtl!important}
      .cv[dir="rtl"] h1,.cv[dir="rtl"] h2,.letter[dir="rtl"] h1{direction:rtl!important;unicode-bidi:isolate!important;letter-spacing:0!important;font-family:Tahoma,Arial,sans-serif!important}
      .cv[dir="rtl"] h2{text-align:right!important}
      .cv[dir="rtl"] .role,.cv[dir="rtl"] .contact,.cv[dir="rtl"] p,.cv[dir="rtl"] li,.letter[dir="rtl"] .letter-meta,.letter[dir="rtl"] p{direction:rtl!important;unicode-bidi:plaintext!important;text-align:right!important;font-family:Tahoma,Arial,sans-serif!important;letter-spacing:0!important}
    `;
    document.head.appendChild(style);
  };

  const replaceArabicWord=(text,from,to)=>text.replace(new RegExp(`(^|[\\s،؛:.!?؟])${from}(?=$|[\\s،؛:.!?؟])`,'g'),`$1${to}`);
  const commonArabicSpelling=value=>{
    let text=String(value||'');
    const fixes=[
      ['هاذا','هذا'],['هاذه','هذه'],['الى','إلى'],['ايضا','أيضًا'],
      ['لانني','لأنني'],['لاني','لأنني'],['لانها','لأنها'],['لانه','لأنه'],['لان','لأن'],
      ['الامن','الأمن'],['امن','أمن'],['اكاديمي','أكاديمي'],['اكاديمية','أكاديمية'],['الاكاديمي','الأكاديمي'],['الاكاديمية','الأكاديمية'],
      ['مسوول','مسؤول'],['مسوولية','مسؤولية'],['مسؤوليه','مسؤولية']
    ];
    fixes.forEach(([from,to])=>{text=replaceArabicWord(text,from,to)});
    return text;
  };
  const cleanFragment=value=>commonArabicSpelling(String(value||'').trim()).replace(/[.،,]+$/,'').trim();
  const withBi=value=>{const v=cleanFragment(value).replace(/^(?:بـ|ب)\s*/,'');return v?`ب${v}`:''};

  const firstPersonReason=value=>{
    let v=cleanFragment(value).replace(/^(?:أنا|انا)\s+/,'');
    if(/^(?:أحب|احب)\s+/.test(v))return `أهتم ${withBi(v.replace(/^(?:أحب|احب)\s+/,''))}`;
    if(/^(?:مهتم|مهتمًا)\s*/.test(v))return `أهتم ${withBi(v.replace(/^(?:مهتم|مهتمًا)\s*(?:بـ|ب)?\s*/,''))}`;
    if(/^(?:أبغى|ابغى|أريد|اريد)\s+/.test(v)){
      v=v.replace(/^(?:أبغى|ابغى|أريد|اريد)\s+/,'');
      if(/^(?:أدرس|ادرس)\s+/.test(v))return v.replace(/^(?:أدرس|ادرس)\s+/,'أدرس ');
      if(/^(?:أشتغل|اشتغل|أعمل|اعمل)\s+/.test(v))return v.replace(/^(?:أشتغل|اشتغل|أعمل|اعمل)\s+/,'أعمل ');
      return `أسعى إلى ${v}`;
    }
    return v;
  };

  const nominalGoal=value=>{
    let v=cleanFragment(value).replace(/^(?:أنا|انا)\s+/,'').replace(/^(?:أبغى|ابغى|أريد|اريد)\s+/,'');
    return v.replace(/^(?:أدرس|ادرس)\s+/,'دراسة ')
      .replace(/^(?:أتعلم|اتعلم)\s+/,'تعلم ')
      .replace(/^(?:أطور|اطور)\s+/,'تطوير ')
      .replace(/^(?:أكمل|اكمل)\s+دراستي/,'استكمال دراستي')
      .replace(/^(?:أدخل|ادخل)\s+/,'دخول ')
      .replace(/^(?:أشتغل|اشتغل|أعمل|اعمل)\s+في\s+/,'العمل في ')
      .replace(/^(?:أشتغل|اشتغل|أعمل|اعمل)\s+/,'العمل ')
      .replace(/\s+(?:و|،\s*و)(?:أطور|اطور)\s+نفسي\b/g,' وتطوير مهاراتي')
      .replace(/\s+(?:و|،\s*و)(?:أتعلم|اتعلم)\s+/g,' وتعلم ');
  };

  const polishArabicText=value=>{
    let text=commonArabicSpelling(value);
    if(!/[\u0600-\u06ff]/.test(text))return text;

    text=text.replace(/تتمثل خلفيتي ودوافعي الأساسية في\s+(?:مهتم|مهتمًا)\s*(?:بـ|ب)?\s*([^.!؟]+)/g,(_,x)=>`يرتكز دافعي الأكاديمي على اهتمامي ${withBi(x)}`);
    text=text.replace(/تتمثل خلفيتي ودوافعي الأساسية في\s+(طالب[^.!؟]*)/g,(_,x)=>`أواصل بناء خلفيتي الأكاديمية بصفتي ${cleanFragment(x)}`);
    text=text.replace(/تتمثل خلفيتي ودوافعي الأساسية في\s+((?:خريج|متخرج)[^.!؟]*)/g,(_,x)=>`أستند إلى خلفية تعليمية مكتملة؛ إذ إنني ${cleanFragment(x)}`);

    text=text.replace(/ينطلق هذا الاختيار من\s+(?:لأني|لاني|لأنني)\s+([^.!؟]+)/g,(_,x)=>`اخترت هذا المسار لأنني ${firstPersonReason(x)}`);
    text=text.replace(/ينطلق هذا الاختيار من\s+(?:لأنها|لانها)\s+([^.!؟]+)/g,(_,x)=>`اخترت هذا المسار لأنها ${cleanFragment(x)}`);
    text=text.replace(/ينطلق هذا الاختيار من\s+(?:لأنه|لانه)\s+([^.!؟]+)/g,(_,x)=>`اخترت هذا المسار لأنه ${cleanFragment(x)}`);
    text=text.replace(/ينطلق هذا الاختيار من\s+(?:لأن|لان)\s+([^.!؟]+)/g,(_,x)=>`اخترت هذا المسار لأن ${cleanFragment(x)}`);

    text=text.replace(/يتركز هدفي المستقبلي على\s+([^.!؟]+)/g,(_,x)=>`يتركز هدفي المستقبلي على ${nominalGoal(x)}`);
    text=text.replace(/يركز على\s+([^.!؟،]+)/g,(_,x)=>`يركز على ${nominalGoal(x)}`);
    text=text.replace(/يركز على\s+(دراسة[^.!؟،]+)\s+(?:و|،\s*و)(?:أطور|اطور)\s+نفسي/g,'يركز على $1 وتطوير مهاراتي');

    return commonArabicSpelling(text)
      .replace(/\bمن\s+(لأنني|لأنها|لأنه|لأن)\b/g,'$1')
      .replace(/\s+([،؛:.!?؟])/g,'$1')
      .replace(/([،؛])\1+/g,'$1')
      .replace(/\.{2,}/g,'.')
      .replace(/\s{2,}/g,' ')
      .trim();
  };

  const isAutoCv=()=>document.querySelector('[data-cv-mode].is-active')?.dataset.cvMode!=='manual';
  const isAutoLetter=()=>document.querySelector('[data-letter-mode].is-active')?.dataset.letterMode!=='manual';
  const polishNodes=selector=>document.querySelectorAll(selector).forEach(el=>{const old=el.textContent||'',next=polishArabicText(old);if(next&&next!==old)el.textContent=next});
  const polishGeneratedArabic=()=>{
    if(document.querySelector('.cv[dir="rtl"]')&&isAutoCv())polishNodes('#pSummary,#pObjective,#pEducation li,#pExperience li,#pSkills');
    if(document.querySelector('.letter[dir="rtl"]')&&isAutoLetter())polishNodes('#letterText p');
  };

  const fit=()=>{
    polishGeneratedArabic();
    const wrap=document.querySelector('.preview-wrap'),page=wrap?.querySelector('.cv,.letter');
    if(!wrap||!page)return;
    requestAnimationFrame(()=>{
      const pageWidth=page.offsetWidth||794,available=Math.max(220,wrap.clientWidth-28),scale=Math.min(1,available/pageWidth);
      wrap.style.setProperty('--a4-preview-scale',String(scale));
      const multiPage=page.dataset.multipage==='true',pageHeight=multiPage?Math.max(page.offsetHeight,page.scrollHeight,1123):(page.offsetHeight||1123),top=window.matchMedia('(max-width:520px)').matches?40:44;
      wrap.style.height=`${Math.ceil(top+pageHeight*scale+14)}px`;
      wrap.classList.toggle('is-a4-overflow',!multiPage&&page.scrollHeight>page.clientHeight+3);
    });
  };

  const boot=()=>{
    ensureRtlFix();polishGeneratedArabic();fit();
    const wrap=document.querySelector('.preview-wrap'),page=wrap?.querySelector('.cv,.letter');
    if(!wrap||!page)return;
    if('ResizeObserver'in window){const ro=new ResizeObserver(fit);ro.observe(wrap);ro.observe(page)}
    const mo=new MutationObserver(()=>{polishGeneratedArabic();fit()});mo.observe(page,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','dir']});
    document.addEventListener('input',()=>{polishGeneratedArabic();fit()},true);
    document.addEventListener('change',()=>{polishGeneratedArabic();fit()},true);
    document.addEventListener('click',e=>{if(e.target.closest('#generateBtn,#downloadBtn'))setTimeout(()=>{polishGeneratedArabic();fit()},0)},true);
    window.addEventListener('resize',fit,{passive:true});
    window.ShadratPolishArabic=polishGeneratedArabic;
    window.ShadratFitA4Preview=fit;
  };
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot,{once:true}):boot();
})();
