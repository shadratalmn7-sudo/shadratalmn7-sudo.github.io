(function () {
  'use strict';

  const page = location.pathname.split('/').pop() || 'index.html';
  if (page === 'index.html' || page.startsWith('admin-')) return;
  if (document.getElementById('shadrat-vast-ad')) return;

  const AD_TAG = 'https://nautical-hand.com/d/m.FnznduGYNavCZ_GEUr/ieSmh9MuQZDUTlfkNPGTZcnzbOQTmEO0-MSzUMWtBNxzDMI5iMRT/QXzLN-wT';
  // HilltopAds prohibits incentivized traffic. This is a normal video placement,
  // independent of document downloads; never register it as a rewarded provider.
  let started = false;
  let closed = false;
  let watchdog = null;
  const controller = new AbortController();
  let failed = false;

  const style = document.createElement('style');
  style.textContent = `
    #shadrat-vast-ad{position:fixed;right:16px;bottom:16px;z-index:2147482000;width:min(360px,calc(100vw - 24px));aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#071426;box-shadow:0 14px 40px rgba(2,12,27,.32);direction:rtl;font-family:inherit}
    #shadrat-vast-ad[hidden]{display:none!important}
    #shadrat-vast-content{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#071426}
    .shadrat-vast-gate{position:absolute;inset:0;z-index:3;display:grid;place-content:center;gap:10px;padding:24px;text-align:center;color:#fff;background:linear-gradient(145deg,#0c2d59,#1459a7)}
    .shadrat-vast-gate[hidden]{display:none!important}
    .shadrat-vast-gate b{font-size:17px}.shadrat-vast-gate span{font-size:12px;line-height:1.6;color:#dbeafe}
    .shadrat-vast-play{border:0;border-radius:999px;padding:11px 18px;background:#fff;color:#144f94;font:inherit;font-weight:900;cursor:pointer}
    .shadrat-vast-play:disabled{cursor:wait;opacity:.76}
    .shadrat-vast-close{position:absolute;top:8px;left:8px;z-index:2147483000;width:32px;height:32px;border:0;border-radius:50%;background:rgba(0,0,0,.72);color:#fff;font-size:20px;line-height:1;cursor:pointer}
    .shadrat-vast-label{position:absolute;top:10px;right:10px;z-index:4;padding:4px 8px;border-radius:999px;background:rgba(0,0,0,.62);color:#fff;font-size:10px;font-weight:800;pointer-events:none}
    @media(max-width:600px){#shadrat-vast-ad{right:8px;bottom:10px;width:min(330px,calc(100vw - 16px));border-radius:14px}.shadrat-vast-gate{padding:18px}.shadrat-vast-gate b{font-size:15px}}
  `;
  document.head.appendChild(style);

  const root = document.createElement('aside');
  root.id = 'shadrat-vast-ad';
  root.setAttribute('aria-label', 'إعلان فيديو');
  root.innerHTML = `
    <video id="shadrat-vast-content" playsinline webkit-playsinline muted controls preload="none" disablepictureinpicture></video>
    <span class="shadrat-vast-label">إعلان</span>
    <button class="shadrat-vast-close" type="button" aria-label="إغلاق الإعلان">×</button>
    <div class="shadrat-vast-gate">
      <b>إعلان فيديو</b>
      <span>يمكنك إغلاق الإعلان في أي وقت.</span>
      <button class="shadrat-vast-play" type="button">تشغيل الإعلان</button>
    </div>`;
  document.body.appendChild(root);


  const video = root.querySelector('#shadrat-vast-content');
  const gate = root.querySelector('.shadrat-vast-gate');
  const playButton = root.querySelector('.shadrat-vast-play');
  const closeButton = root.querySelector('.shadrat-vast-close');
  function closePlayer() {
    if (closed) return;
    clearTimeout(watchdog);
    closed = true;
    controller.abort();
    try { video.pause(); } catch (_) {}
    video.removeAttribute('src');
    video.load();
    root.remove();
    style.remove();
  }

  function fail() {
    if (closed || failed) return;
    failed = true;
    controller.abort();
    clearTimeout(watchdog);
    gate.hidden = false;
    gate.innerHTML = '<b>لا يوجد إعلان متاح الآن</b><span>سنخفي المشغّل تلقائيًا.</span>';
    setTimeout(function () { closePlayer(); }, 1800);
  }

  function ping(url) {
    if (!url) return;
    const img = new Image();
    img.referrerPolicy = 'no-referrer-when-downgrade';
    img.src = url.replace(/\[CACHEBUSTING\]|\[CACHEBUSTER\]/gi, String(Date.now()));
  }

  function elements(rootNode, name) {
    return Array.from(rootNode.getElementsByTagName('*')).filter(function (node) {
      return node.localName === name;
    });
  }

  function textOf(node) {
    return node && node.textContent ? node.textContent.trim() : '';
  }

  async function loadVast(url, depth) {
    if (depth > 3) throw new Error('VAST wrapper limit');
    const response = await fetch(url, { signal: controller.signal, credentials: 'include', cache: 'no-store', referrerPolicy: 'no-referrer-when-downgrade' });
    if (!response.ok) throw new Error('VAST HTTP ' + response.status);
    const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
    if (xml.querySelector('parsererror')) throw new Error('Invalid VAST XML');

    const wrapperUri = elements(xml, 'VASTAdTagURI')[0];
    if (wrapperUri) {
      const nested = await loadVast(textOf(wrapperUri), depth + 1);
      nested.impressions.unshift(...elements(xml, 'Impression').map(textOf));
      for (const node of elements(xml, 'Tracking')) {
        const event = node.getAttribute('event');
        (nested.tracking[event] ||= []).push(textOf(node));
      }
      return nested;
    }

    const linear = elements(xml, 'Linear')[0];
    if (!linear) throw new Error('No linear ad');
    const media = elements(linear, 'MediaFile').filter(function (node) {
      return /^https:\/\//i.test(textOf(node));
    });
    const chosen = media.find(function (node) { return (node.getAttribute('type') || '').toLowerCase() === 'video/mp4'; }) ||
      media.find(function (node) { return (node.getAttribute('type') || '').toLowerCase() === 'video/webm'; });
    if (!chosen) throw new Error('No supported media');

    return {
      mediaUrl: textOf(chosen),
      impressions: elements(xml, 'Impression').map(textOf),
      tracking: elements(xml, 'Tracking').reduce(function (events, node) { (events[node.getAttribute('event')] ||= []).push(textOf(node)); return events; }, {})
    };
  }

  async function requestAd() {
    if (started || closed) return;
    started = true;
    playButton.disabled = true;
    playButton.textContent = 'جارٍ تحميل الإعلان…';
    watchdog = setTimeout(fail, 15000);

    try {
      const ad = await loadVast(AD_TAG, 0);
      if (closed || failed) return;
      let tracked = false, watched = 0, previous = 0;
      const sent = new Set();
      const track = function (event) { if (sent.has(event)) return; sent.add(event); (ad.tracking[event] || []).forEach(ping); };
      video.addEventListener('timeupdate', function () {
        const delta = video.currentTime - previous; previous = video.currentTime;
        if (!video.seeking && delta > 0 && delta < 1.5) watched += delta;
        if (!Number.isFinite(video.duration)) return;
        for (const [event, fraction] of [['firstQuartile', .25], ['midpoint', .5], ['thirdQuartile', .75]]) if (watched >= video.duration * fraction) track(event);
      });
      video.addEventListener('playing', function () {
        clearTimeout(watchdog);
        gate.hidden = true;

        if (!tracked) {
          tracked = true;
          ad.impressions.forEach(ping);
          track('start');
        }
      }, { once: true });
      video.addEventListener('ended', function () { if (watched >= video.duration - 1) track('complete'); closePlayer(); }, { once: true });
      video.addEventListener('error', fail, { once: true });
      video.src = ad.mediaUrl;
      video.load();
      await video.play();
    } catch (_) {
      fail();
    }
  }

  playButton.addEventListener('click', requestAd);
  closeButton.addEventListener('click', function () { closePlayer(false); });
})();
