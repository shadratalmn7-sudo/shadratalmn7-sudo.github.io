(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  if (page === 'university-shukhov.html') import('./dorm-gallery-fix.js?v=3').catch(error => console.warn('[Shadrat] dorm gallery unavailable', error));

  const blockedPages = ['login.html','register.html','profile.html','service-request.html'];
  if (page.startsWith('admin-') || blockedPages.includes(page)) return;
  if (window.__shadratAdsterraAutoV3) return;
  window.__shadratAdsterraAutoV3 = true;

  const mobile = innerWidth < 900;
  const BAR_KEY = '81784add9b99f179fe38269f88f2f669';
  const FOOTER_KEY = 'eda2c4586cf38ead23cc20bf961a2503';
  const RAIL_KEY = '3e949efa2489333e349b38867c9f47fd';

  document.querySelectorAll('.shadrat-auto-ad,.shadrat-mobile-ad,.shadrat-desktop-rect,.shadrat-desktop-rail').forEach(el => el.remove());

  if (!window.__shadratAdsLoaded) {
    window.__shadratAdsLoaded = true;
    if (document.querySelector('[data-shazarat-ad-unit],.adsbygoogle') && !document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9420608712266016';
      script.addEventListener('load', () => {
        document.querySelectorAll('.adsbygoogle:not([data-ad-ready])').forEach(unit => {
          unit.dataset.adReady = 'true';
          try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (error) { console.warn('[Shadrat] ad unit unavailable', error); }
        });
      }, { once: true });
      document.head.appendChild(script);
    }
  }

  const style = document.createElement('style');
  style.textContent = `
    .shadrat-auto-ad{position:relative;display:flex;justify-content:center;align-items:center;overflow:hidden;margin-inline:auto;box-sizing:border-box;max-width:100%}
    .shadrat-auto-ad iframe{border:0;display:block;max-width:none;background:transparent}
    .shadrat-ad-close{position:absolute;top:5px;right:5px;z-index:20;width:28px;height:28px;display:grid;place-items:center;padding:0;border:1px solid rgba(15,23,42,.18);border-radius:999px;background:rgba(255,255,255,.94);color:#0f172a;font:700 20px/1 Arial,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(15,23,42,.18)}
    .shadrat-ad-close:hover{background:#fff}
    .shadrat-ad-close:focus-visible{outline:2px solid #2563eb;outline-offset:2px}
    .shadrat-ad-bar{width:100%;min-height:54px;margin:8px auto 12px;padding:3px 0;background:rgba(248,251,255,.72);border-block:1px solid rgba(29,78,216,.08)}
    .shadrat-ad-bar iframe{transform-origin:center top}
    .shadrat-ad-mid{margin:14px auto;opacity:.92;background:rgba(248,251,255,.5);border-block-color:rgba(29,78,216,.06)}
    .shadrat-ad-bottom{margin:22px auto 0;background:rgba(248,251,255,.55)}
    .shadrat-footer-box{width:min(360px,calc(100% - 32px));min-height:300px;margin:26px auto 0;padding:10px 0;background:rgba(248,251,255,.62);border:1px solid rgba(29,78,216,.08);border-radius:18px}
    .shadrat-desktop-rect{width:220px;min-height:300px;margin:18px auto;background:rgba(248,251,255,.55);border-radius:18px}
    .shadrat-desktop-rail{position:fixed;left:12px;top:120px;z-index:7;width:160px;height:600px;overflow:hidden;border-radius:14px;background:rgba(248,251,255,.55)}
    @media(max-width:899px){
      .shadrat-ad-bar{width:100%;min-height:48px;margin:8px 0 10px;padding:2px 0;border-radius:0;background:rgba(248,251,255,.72)}
      .shadrat-ad-mid{margin:12px 0;min-height:46px;opacity:.86}
      .shadrat-desktop-rect,.shadrat-desktop-rail{display:none!important}
    }
    @media(max-width:1299px){.shadrat-desktop-rail{display:none!important}}
  `;
  document.head.appendChild(style);

  function makeAd(key, width, height, extraClass='') {
    const wrap = document.createElement('div');
    wrap.className = `shadrat-auto-ad ${extraClass}`;
    wrap.setAttribute('aria-label','إعلان');
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'shadrat-ad-close';
    close.setAttribute('aria-label','إغلاق الإعلان');
    close.title = 'إغلاق الإعلان';
    close.textContent = '×';
    close.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      wrap.remove();
    });
    const frame = document.createElement('iframe');
    frame.width = String(width);
    frame.height = String(height);
    frame.scrolling = 'no';
    frame.loading = extraClass.includes('shadrat-ad-top') ? 'eager' : 'lazy';
    frame.title = 'إعلان';
    frame.srcdoc = `<!doctype html><html><body style="margin:0;overflow:hidden;display:flex;justify-content:center;align-items:flex-start"><script>atOptions={'key':'${key}','format':'iframe','height':${height},'width':${width},'params':{}};<\/script><script src="https://www.highrevenueformat.com/${key}/invoke.js"><\/script></body></html>`;
    wrap.append(close, frame);
    if (extraClass.includes('shadrat-ad-bar')) {
      const resize = () => {
        const available = Math.max(1, wrap.clientWidth - 10);
        const scale = Math.min(1, available / width);
        frame.style.transform = `scale(${scale})`;
        frame.style.width = `${width}px`;
        frame.style.height = `${height}px`;
        wrap.style.minHeight = `${Math.ceil(height * scale) + 6}px`;
      };
      requestAnimationFrame(resize);
      addEventListener('resize', resize, { passive:true });
    }
    return wrap;
  }

  const main = document.querySelector('main');
  if (!main) return;
  const sections = [...main.querySelectorAll(':scope > section')];
  if (!sections.length) return;

  main.prepend(makeAd(BAR_KEY,468,60,'shadrat-ad-bar shadrat-ad-top'));

  const middleTargets = mobile
    ? sections.filter((_, i) => i === 0 || i === 2).slice(0,2)
    : sections.filter((_, i) => i === 0 || i === 2 || i === 4).slice(0,3);
  middleTargets.forEach(target => target.after(makeAd(BAR_KEY,468,60,'shadrat-ad-bar shadrat-ad-mid')));

  main.appendChild(makeAd(BAR_KEY,468,60,'shadrat-ad-bar shadrat-ad-bottom'));

  if (mobile) {
    main.appendChild(makeAd(FOOTER_KEY,160,300,'shadrat-footer-box'));
    return;
  }

  const rectTarget = sections[1] || sections[0];
  if (rectTarget) rectTarget.after(makeAd(FOOTER_KEY,160,300,'shadrat-desktop-rect'));
  if (innerWidth >= 1300) document.body.appendChild(makeAd(RAIL_KEY,160,600,'shadrat-desktop-rail'));
})();