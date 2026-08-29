(() => {
  const page = location.pathname.split('/').pop() || '';
  if (page === 'university-shukhov.html') import('./dorm-gallery-fix.js?v=3').catch(error => console.warn('[Shadrat] dorm gallery unavailable', error));

  if (window.__shadratAdsLoaded || !document.querySelector('[data-shazarat-ad-unit],.adsbygoogle')) return;
  window.__shadratAdsLoaded = true;
  if (document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) return;
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
})();