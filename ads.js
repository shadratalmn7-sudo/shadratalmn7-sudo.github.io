(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  if (page === 'university-shukhov.html') import('./dorm-gallery-fix.js?v=3').catch(error => console.warn('[Shadrat] dorm gallery unavailable', error));

  const mobile = innerWidth < 900;

  if (mobile) {
    document.querySelectorAll('.shadrat-mobile-ad,.shadrat-desktop-rect,.shadrat-desktop-rail').forEach(el => el.remove());
  }

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

  if (window.__shadratAdsterraAuto || page.startsWith('admin-') || ['login.html','register.html','profile.html','service-request.html'].includes(page)) return;
  window.__shadratAdsterraAuto = true;

  const BAR_KEY = '81784add9b99f179fe38269f88f2f669';
  const RECT_KEY = 'eda2c4586cf38ead23cc20bf961a2503';
  const RAIL_KEY = '3e949efa2489333e349b38867c9f47fd';

  const style = document.createElement('style');
  style.textContent = `.shadrat-auto-ad{display:flex;justify-content:center;align-items:center;width:min(1160px,calc(100% - 32px));margin:22px auto;overflow:hidden;min-height:60px}.shadrat-auto-ad iframe{border:0;display:block}.shadrat-ad-bar{width:100%;max-width:100%;margin:10px auto 14px;padding:6px 0;background:rgba(248,251,255,.72);border-block:1px solid rgba(29,78,216,.09);min-height:60px}.shadrat-ad-bottom{margin:18px auto 0}.shadrat-ad-bar iframe{transform-origin:center top}.shadrat-desktop-rect{min-height:300px}.shadrat-desktop-rail{position:fixed;left:12px;top:120px;z-index:7;width:160px;height:600px;overflow:hidden}@media(max-width:1299px){.shadrat-desktop-rail{display:none!important}}@media(max-width:899px){.shadrat-mobile-ad,.shadrat-desktop-rect,.shadrat-desktop-rail{display:none!important}.shadrat-auto-ad{width:100%;margin:14px auto;padding:0;min-height:60px}.shadrat-ad-bar{margin:8px auto 12px;padding:5px 0;background:rgba(248,251,255,.78)}.shadrat-ad-bottom{margin-top:16px}}`;
  document.head.appendChild(style);

  function makeAd(key, width, height, extraClass='') {
    const wrap = document.createElement('div');
    wrap.className = `shadrat-auto-ad ${extraClass}`;
    wrap.setAttribute('aria-label','إعلان');
    const frame = document.createElement('iframe');
    frame.width = String(width); frame.height = String(height); frame.scrolling = 'no'; frame.loading = 'lazy'; frame.title = 'إعلان';
    frame.srcdoc = `<!doctype html><html><body style="margin:0;overflow:hidden;display:flex;justify-content:center"><script>atOptions={'key':'${key}','format':'iframe','height':${height},'width':${width},'params':{}};<\/script><script src="https://www.highrevenueformat.com/${key}/invoke.js"><\/script></body></html>`;
    wrap.appendChild(frame);
    if (extraClass.includes('shadrat-ad-bar')) {
      requestAnimationFrame(() => {
        const available = Math.max(1, wrap.clientWidth - 16);
        const scale = Math.min(1, available / width);
        frame.style.transform = `scale(${scale})`;
        frame.style.width = `${width}px`;
        frame.style.height = `${height}px`;
        wrap.style.minHeight = `${Math.ceil(height * scale) + 12}px`;
      });
    }
    return wrap;
  }

  const main = document.querySelector('main');
  if (!main) return;
  const sections = [...main.querySelectorAll(':scope > section')];
  if (!sections.length) return;

  const top = makeAd(BAR_KEY,468,60,'shadrat-ad-bar shadrat-ad-top');
  const bottom = makeAd(BAR_KEY,468,60,'shadrat-ad-bar shadrat-ad-bottom');
  if (!document.querySelector('.shadrat-ad-top')) main.prepend(top);
  if (!document.querySelector('.shadrat-ad-bottom')) main.appendChild(bottom);

  if (mobile) {
    const targets = sections.filter((_,i) => (i + 1) % 2 === 0).slice(0,3);
    targets.forEach(target => {
      if (target.nextElementSibling?.classList?.contains('shadrat-auto-ad')) return;
      target.after(makeAd(BAR_KEY,468,60,'shadrat-ad-bar shadrat-ad-mid'));
    });
    return;
  }

  const rectTarget = sections[1] || sections[0];
  if (rectTarget && !rectTarget.nextElementSibling?.classList?.contains('shadrat-auto-ad')) rectTarget.after(makeAd(RECT_KEY,160,300,'shadrat-desktop-rect'));
  if (innerWidth >= 1300) document.body.appendChild(makeAd(RAIL_KEY,160,600,'shadrat-desktop-rail'));
})();