(function () {
  'use strict';

  const page = location.pathname.split('/').pop() || 'index.html';
  if (page === 'index.html' || page.startsWith('admin-')) return;
  if (document.getElementById('shadrat-vast-ad')) return;

  const AD_TAG = 'https://nautical-hand.com/d/m.FnznduGYNavCZ_GEUr/ieSmh9MuQZDUTlfkNPGTZcnzbOQTmEO0-MSzUMWtBNxzDMI5iMRT/QXzLN-wT';
  const IMA_SDK = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
  let adsManager = null;
  let adsLoader = null;
  let started = false;
  let closed = false;

  const style = document.createElement('style');
  style.textContent = `
    #shadrat-vast-ad{position:fixed;right:16px;bottom:16px;z-index:2147482000;width:min(360px,calc(100vw - 24px));aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#071426;box-shadow:0 14px 40px rgba(2,12,27,.32);direction:rtl;font-family:inherit}
    #shadrat-vast-ad[hidden]{display:none!important}
    #shadrat-vast-content,#shadrat-vast-container{position:absolute;inset:0;width:100%;height:100%}
    #shadrat-vast-content{object-fit:cover;background:#071426}
    #shadrat-vast-container{z-index:2}
    .shadrat-vast-gate{position:absolute;inset:0;z-index:3;display:grid;place-content:center;gap:10px;padding:24px;text-align:center;color:#fff;background:linear-gradient(145deg,#0c2d59,#1459a7)}
    .shadrat-vast-gate b{font-size:17px}.shadrat-vast-gate span{font-size:12px;line-height:1.6;color:#dbeafe}
    .shadrat-vast-play{border:0;border-radius:999px;padding:11px 18px;background:#fff;color:#144f94;font:inherit;font-weight:900;cursor:pointer}
    .shadrat-vast-close{position:absolute;top:8px;left:8px;z-index:2147483000;width:32px;height:32px;border:0;border-radius:50%;background:rgba(0,0,0,.72);color:#fff;font-size:20px;line-height:1;cursor:pointer}
    .shadrat-vast-label{position:absolute;top:10px;right:10px;z-index:4;padding:4px 8px;border-radius:999px;background:rgba(0,0,0,.62);color:#fff;font-size:10px;font-weight:800}
    @media(max-width:600px){#shadrat-vast-ad{right:8px;bottom:10px;width:min(330px,calc(100vw - 16px));border-radius:14px}.shadrat-vast-gate{padding:18px}.shadrat-vast-gate b{font-size:15px}}
    @media(prefers-reduced-motion:reduce){#shadrat-vast-ad{scroll-behavior:auto}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('aside');
  root.id = 'shadrat-vast-ad';
  root.setAttribute('aria-label', 'إعلان فيديو');
  root.innerHTML = `
    <video id="shadrat-vast-content" playsinline webkit-playsinline muted preload="metadata"></video>
    <div id="shadrat-vast-container"></div>
    <span class="shadrat-vast-label">إعلان</span>
    <button class="shadrat-vast-close" type="button" aria-label="إغلاق الإعلان">×</button>
    <div class="shadrat-vast-gate">
      <b>شاهد إعلانًا قصيرًا</b>
      <span>مشاهدتك تساعد شذرات على إبقاء أدوات الطلاب متاحة.</span>
      <button class="shadrat-vast-play" type="button">تشغيل الإعلان</button>
    </div>`;
  document.body.appendChild(root);

  const contentVideo = root.querySelector('#shadrat-vast-content');
  const adContainer = root.querySelector('#shadrat-vast-container');
  const gate = root.querySelector('.shadrat-vast-gate');
  const playButton = root.querySelector('.shadrat-vast-play');

  function size() {
    return { width: Math.max(280, root.clientWidth), height: Math.max(158, root.clientHeight) };
  }

  function closePlayer() {
    if (closed) return;
    closed = true;
    try { adsManager && adsManager.destroy(); } catch (_) {}
    try { adsLoader && adsLoader.destroy(); } catch (_) {}
    root.remove();
    style.remove();
  }

  function fail() {
    if (closed) return;
    gate.hidden = false;
    gate.innerHTML = '<b>لا يوجد إعلان متاح الآن</b><span>سنخفي المشغّل تلقائيًا.</span>';
    setTimeout(closePlayer, 2200);
  }

  function onAdsManagerLoaded(event) {
    const settings = new google.ima.AdsRenderingSettings();
    settings.restoreCustomPlaybackStateOnAdBreakComplete = true;
    try {
      adsManager = event.getAdsManager(contentVideo, settings);
      adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, fail);
      adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, function () { gate.hidden = true; });
      adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, function () { contentVideo.pause(); });
      adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, closePlayer);
      adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, closePlayer);
      const box = size();
      adsManager.init(box.width, box.height, google.ima.ViewMode.NORMAL);
      adsManager.start();
    } catch (_) {
      fail();
    }
  }

  function requestAd() {
    if (started || closed || !window.google || !google.ima) return;
    started = true;
    playButton.disabled = true;
    playButton.textContent = 'جارٍ تحميل الإعلان…';
    google.ima.settings.setDisableCustomPlaybackForIOS10Plus(true);
    const displayContainer = new google.ima.AdDisplayContainer(adContainer, contentVideo);
    displayContainer.initialize();
    adsLoader = new google.ima.AdsLoader(displayContainer);
    adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, onAdsManagerLoaded, false);
    adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, fail, false);
    const request = new google.ima.AdsRequest();
    const box = size();
    request.adTagUrl = AD_TAG;
    request.linearAdSlotWidth = box.width;
    request.linearAdSlotHeight = box.height;
    request.nonLinearAdSlotWidth = box.width;
    request.nonLinearAdSlotHeight = Math.round(box.height / 3);
    request.setAdWillAutoPlay(false);
    request.setAdWillPlayMuted(false);
    adsLoader.requestAds(request);
  }

  playButton.addEventListener('click', requestAd);
  root.querySelector('.shadrat-vast-close').addEventListener('click', closePlayer);
  window.addEventListener('resize', function () {
    if (!adsManager || closed) return;
    const box = size();
    try { adsManager.resize(box.width, box.height, google.ima.ViewMode.NORMAL); } catch (_) {}
  }, { passive: true });

  const sdk = document.createElement('script');
  sdk.src = IMA_SDK;
  sdk.async = true;
  sdk.referrerPolicy = 'no-referrer-when-downgrade';
  sdk.onerror = fail;
  document.head.appendChild(sdk);
})();
