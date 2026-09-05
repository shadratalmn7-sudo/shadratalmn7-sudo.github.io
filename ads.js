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
    const frame = document.createElement('iframe');
    frame.width = String(width);
    frame.height = String(height);
    frame.scrolling = 'no';
    frame.loading = extraClass.includes('shadrat-ad-top') ? 'eager' : 'lazy';
    frame.title = 'إعلان';
    frame.srcdoc = `<!doctype html><html><body style="margin:0;overflow:hidden;display:flex;justify-content:center;align-items:flex-start"><script>atOptions={'key':'${key}','format':'iframe','height':${height},'width':${width},'params':{}};<\/script><script src="https://www.highrevenueformat.com/${key}/invoke.js"><\/script></body></html>`;

    if (extraClass.includes('shadrat-desktop-rail')) {
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
      wrap.append(close, frame);
    } else {
      wrap.appendChild(frame);
    }

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

  const CLICK_METER_KEY = 'shadrat_ad_click_meter_v1';
  const CLICK_TARGET = 20;

  function installClickInterstitial() {
    if (window.__shadratClickInterstitialV1) return;
    window.__shadratClickInterstitialV1 = true;

    const clickStyle = document.createElement('style');
    clickStyle.textContent = `
      .shadrat-click-interstitial{position:fixed;inset:0;z-index:2147482000;display:grid;place-items:center;padding:18px;background:rgba(3,12,28,.72);backdrop-filter:blur(5px)}
      .shadrat-click-interstitial[hidden]{display:none!important}
      .shadrat-click-card{position:relative;width:min(420px,calc(100vw - 28px));max-height:calc(100vh - 28px);overflow:auto;border:1px solid rgba(255,255,255,.2);border-radius:22px;background:#fff;color:#0f172a;box-shadow:0 28px 80px rgba(2,8,23,.42);padding:14px;text-align:center}
      .shadrat-click-close{position:sticky;top:0;float:right;z-index:2147483000;width:40px;height:40px;display:grid;place-items:center;margin:0 0 -40px auto;padding:0;border:1px solid #cbd5e1;border-radius:999px;background:#fff;color:#0f172a;font:900 27px/1 Arial,sans-serif;cursor:pointer;box-shadow:0 5px 16px rgba(15,23,42,.2);-webkit-tap-highlight-color:transparent;touch-action:manipulation}
      .shadrat-click-close:hover{background:#f8fafc}
      .shadrat-click-close:active{transform:scale(.94)}
      .shadrat-click-close:focus-visible{outline:3px solid #2563eb;outline-offset:2px}
      .shadrat-click-label{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:40px;padding-right:48px;margin-bottom:9px;color:#64748b;font:700 12px/1.4 Tahoma,Arial,sans-serif}
      .shadrat-click-ad{min-height:300px;margin:0 auto 12px;background:#f8fbff;border:1px solid rgba(29,78,216,.08);border-radius:16px}
      .shadrat-click-continue{width:100%;border:0;border-radius:13px;padding:11px 14px;background:#1d4ed8;color:#fff;font:800 14px/1.4 Tahoma,Arial,sans-serif;cursor:pointer}
      .shadrat-click-continue:disabled{opacity:.55;cursor:wait}
      .shadrat-click-note{margin:8px 0 0;color:#64748b;font:12px/1.55 Tahoma,Arial,sans-serif}
      @media(max-width:520px){.shadrat-click-interstitial{padding:10px}.shadrat-click-card{width:calc(100vw - 20px);border-radius:18px;padding:11px}.shadrat-click-close{width:42px;height:42px;font-size:28px}.shadrat-click-label{min-height:42px;padding-right:50px}}
    `;
    document.head.appendChild(clickStyle);

    const readCount = () => {
      try { return Math.max(0, Number(localStorage.getItem(CLICK_METER_KEY) || 0) || 0); }
      catch { return Number(window.__shadratClickCount || 0); }
    };
    const writeCount = value => {
      try { localStorage.setItem(CLICK_METER_KEY, String(value)); }
      catch { window.__shadratClickCount = value; }
    };

    function showInterstitial(nextUrl = null) {
      if (document.querySelector('.shadrat-click-interstitial')) return;
      const overlay = document.createElement('div');
      overlay.className = 'shadrat-click-interstitial';
      overlay.setAttribute('role','dialog');
      overlay.setAttribute('aria-modal','true');
      overlay.setAttribute('aria-label','إعلان');
      const card = document.createElement('div');
      card.className = 'shadrat-click-card';
      card.innerHTML = '<div class="shadrat-click-label"><span>إعلان</span><span>شذرات للمنح</span></div>';
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'shadrat-click-close';
      close.setAttribute('aria-label','إغلاق الإعلان');
      close.title = 'إغلاق الإعلان';
      close.textContent = '×';
      const ad = makeAd(FOOTER_KEY,160,300,'shadrat-click-ad');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'shadrat-click-continue';
      button.disabled = true;
      button.textContent = 'متابعة خلال لحظة…';
      const note = document.createElement('p');
      note.className = 'shadrat-click-note';
      note.textContent = 'يظهر هذا الإعلان بشكل خفيف بعد كل 20 تفاعل داخل الموقع.';
      card.prepend(close);
      card.append(ad, button, note);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
      const oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      let finished = false;
      let unlock = null;
      let onKey = null;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (unlock) clearTimeout(unlock);
        if (onKey) document.removeEventListener('keydown', onKey);
        overlay.remove();
        document.body.style.overflow = oldOverflow;
        if (nextUrl) location.href = nextUrl;
      };
      unlock = setTimeout(() => {
        button.disabled = false;
        button.textContent = nextUrl ? 'متابعة إلى الصفحة' : 'متابعة';
      }, 1200);
      close.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        finish();
      });
      button.addEventListener('click', () => finish());
      onKey = event => {
        if (event.key !== 'Escape') return;
        finish();
      };
      document.addEventListener('keydown', onKey);
      try { close.focus({preventScroll:true}); } catch {}
    }

    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target.closest?.('a,button,[role="button"]');
      if (!target) return;
      if (target.closest('.shadrat-auto-ad,.shadrat-click-interstitial,[data-no-ad-count]')) return;
      if (target.matches('input,textarea,select,label') || target.closest('input,textarea,select,label')) return;

      let nextUrl = null;
      if (target.tagName === 'A') {
        const href = target.getAttribute('href');
        if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        if (target.hasAttribute('download') || target.target === '_blank') return;
        try {
          const url = new URL(href, location.href);
          if (url.origin !== location.origin) return;
          nextUrl = url.href;
        } catch { return; }
      } else if (target.tagName === 'BUTTON') {
        const type = (target.getAttribute('type') || 'submit').toLowerCase();
        if (type === 'submit' || type === 'reset' || target.closest('form')) return;
      }

      const count = readCount() + 1;
      if (count < CLICK_TARGET) {
        writeCount(count);
        return;
      }
      writeCount(0);

      if (nextUrl) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showInterstitial(nextUrl);
      } else {
        setTimeout(() => showInterstitial(null), 0);
      }
    }, true);
  }

  const main = document.querySelector('main');
  if (!main) return;
  const sections = [...main.querySelectorAll(':scope > section')];
  if (!sections.length) return;

  installClickInterstitial();

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