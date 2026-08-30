(() => {
  const page = location.pathname.split('/').pop() || 'index.html';
  if (page === 'university-shukhov.html') import('./dorm-gallery-fix.js?v=3').catch(error => console.warn('[Shadrat] dorm gallery unavailable', error));

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

  if (window.__shadratAdsterraAuto || page.startsWith('admin-') || ['login.html','register.html','service-request.html'].includes(page)) return;
  window.__shadratAdsterraAuto = true;

  const mobile = innerWidth < 900;
  const style = document.createElement('style');
  style.textContent = `.shadrat-auto-ad{display:flex;justify-content:center;align-items:center;width:min(1160px,calc(100% - 32px));margin:22px auto;overflow:hidden;min-height:60px}.shadrat-auto-ad iframe{border:0;display:block;max-width:100%}.shadrat-desktop-rail{position:fixed;left:12px;top:120px;z-index:7;width:160px;height:600px;overflow:hidden}@media(max-width:1299px){.shadrat-desktop-rail{display:none!important}}@media(max-width:899px){.shadrat-auto-ad{width:100%;margin:16px auto;padding:4px 0;min-height:60px}.shadrat-mobile-ad{min-height:300px}.shadrat-mobile-ad iframe{width:160px!important;height:300px!important}}`;
  document.head.appendChild(style);

  function makeAd(key, width, height, extraClass='') {
    const wrap = document.createElement('div');
    wrap.className = `shadrat-auto-ad ${extraClass}`;
    wrap.setAttribute('aria-label','إعلان');
    const frame = document.createElement('iframe');
    frame.width = String(width); frame.height = String(height); frame.scrolling = 'no'; frame.loading = 'lazy'; frame.title = 'إعلان';
    frame.srcdoc = `<!doctype html><html><body style="margin:0;overflow:hidden;display:flex;justify-content:center"><script>atOptions={'key':'${key}','format':'iframe','height':${height},'width':${width},'params':{}};<\/script><script src="https://www.highrevenueformat.com/${key}/invoke.js"><\/script></body></html>`;
    wrap.appendChild(frame); return wrap;
  }

  const main = document.querySelector('main');
  if (!main) return;
  const sections = [...main.querySelectorAll(':scope > section')];
  if (!sections.length) return;

  if (mobile) {
    const targets = sections.filter((_,i) => i === 0 || (i + 1) % 2 === 0).slice(0,3);
    targets.forEach((target,i) => {
      if (target.nextElementSibling?.classList?.contains('shadrat-auto-ad')) return;
      target.after(makeAd('eda2c4586cf38ead23cc20bf961a2503',160,300,'shadrat-mobile-ad'));
    });
    return;
  }

  if (!document.querySelector('.adsterra-banner-468,.shadrat-auto-ad')) {
    sections[0].after(makeAd('81784add9b99f179fe38269f88f2f669',468,60));
  }
  const rectTarget = sections[1] || sections[0];
  if (rectTarget && !rectTarget.nextElementSibling?.classList?.contains('shadrat-auto-ad')) rectTarget.after(makeAd('eda2c4586cf38ead23cc20bf961a2503',160,300));
  if (innerWidth >= 1300) document.body.appendChild(makeAd('3e949efa2489333e349b38867c9f47fd',160,600,'shadrat-desktop-rail'));
})();