// Ordinary HilltopAds VAST does not support rewarded/incentivized inventory.
// ShadratRewardedAd may be registered only by a compatible rewarded provider.
export function createDownloadFlow({button, status, shareButton, controls = () => []}) {
  let prepared = null, preparedKey = '', unlocked = false, url = '', busy = false;
  const initialLabel = button.textContent;
  function reset() {
    if (busy) return;
    if (url) URL.revokeObjectURL(url);
    prepared = null; preparedKey = ''; unlocked = false; url = '';
    button.textContent = initialLabel;
    if (shareButton) {shareButton.hidden = true; shareButton.onclick = null;}
  }
  async function run(key, prepare) {
    if (busy) return false;
    if (preparedKey !== key) reset();
    busy = true;
    const locked = [...new Set([button, ...controls()])].map(el => [el, el.disabled]);
    locked.forEach(([el]) => {el.disabled = true;});
    button.setAttribute('aria-busy', 'true');
    try {
      if (!prepared) {
        button.textContent = 'جارٍ تجهيز الملف…'; status('جارٍ تجهيز الملف داخل المتصفح…');
        prepared = await prepare();
        if (!(prepared?.blob instanceof Blob) || !prepared.blob.size) {
          prepared = null; throw new Error('لم ينتج ملف صالح. راجع البيانات ثم حاول مجددًا.');
        }
        preparedKey = key;
      }
      if (!unlocked && window.ShadratRewardedAd?.play) {
        button.textContent = 'شاهد الفيديو لإكمال التنزيل';
        status('ملفك جاهز. أكمل الفيديو ليبدأ التنزيل تلقائيًا.');
        const result = await window.ShadratRewardedAd.play();
        if (result?.status !== 'completed') {
          status(result?.status === 'cancelled' ? 'لم يكتمل الفيديو. اضغط الزر نفسه للمحاولة دون إعادة تجهيز الملف.' : 'تعذّر تشغيل الفيديو. ملفك محفوظ مؤقتًا هنا؛ اضغط الزر نفسه لإعادة المحاولة.');
          return false;
        }
      }
      unlocked = true;
      if (!url) url = URL.createObjectURL(prepared.blob);
      const link = document.createElement('a');
      link.href = url; link.download = prepared.name; link.hidden = true;
      document.body.appendChild(link); link.click(); link.remove();
      if (shareButton && navigator.canShare) {
        try {
          const file = new File([prepared.blob], prepared.name, {type: prepared.blob.type});
          if (navigator.canShare({files: [file]})) {
            shareButton.hidden = false;
            shareButton.onclick = async () => {
              try {await navigator.share({files: [file], title: prepared.name});}
              catch (error) {if (error.name !== 'AbortError') status('تعذّر فتح المشاركة. اضغط زر التنزيل للمحاولة مجددًا.');}
            };
          }
        } catch (_) {}
      }
      status('ملفك جاهز وبدأ طلب التنزيل. إذا لم يظهر، اضغط الزر نفسه لإعادة تنزيله.');
      return true;
    } catch (error) {
      console.error('[Shadrat] download failed', error); status(error.message || 'تعذّر تجهيز الملف. حاول مجددًا.'); return false;
    } finally {
      busy = false; locked.forEach(([el, disabled]) => {el.disabled = disabled;}); button.removeAttribute('aria-busy');
      button.textContent = unlocked ? 'إعادة تنزيل الملف' : prepared ? 'إكمال التنزيل' : initialLabel;
    }
  }
  window.addEventListener('pagehide', () => {if (url) URL.revokeObjectURL(url); url = '';});
  return {run, reset, get busy() {return busy;}};
}
