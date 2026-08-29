const statusEl = document.querySelector('#docs-status');
const downloadEl = document.querySelector('#download-result');
const fromEl = document.querySelector('#convert-from');
const toEl = document.querySelector('#convert-to');
const serviceEl = document.querySelector('#service-select');
const dynamicArea = document.querySelector('#dynamic-area');
const runButton = document.querySelector('#run-conversion');
const setStatus = text => { if (statusEl) statusEl.textContent = text; };

let currentUrl = '';
const readBytes = file => file.arrayBuffer();
const resetDownload = () => { if (downloadEl) downloadEl.hidden = true; };
const makeDownload = (blob, name) => {
  if (!downloadEl) return;
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = URL.createObjectURL(blob);
  downloadEl.href = currentUrl;
  downloadEl.download = name;
  downloadEl.hidden = false;
  downloadEl.textContent = 'تحميل الملف الجاهز';
};
const downloadPdf = (bytes, name) => makeDownload(new Blob([bytes], { type: 'application/pdf' }), name);

const loadPdfLib = async () => {
  try {
    return await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm');
  } catch (error) {
    console.error(error);
    throw new Error('تعذر تحميل أداة PDF. تحقق من الاتصال ثم حاول مرة أخرى.');
  }
};
const loadZip = async () => (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
const loadPdfJs = async () => {
  const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/+esm');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
  return pdfjs;
};

const services = {
  'image-pdf': [{ value: 'image-to-pdf', label: 'تحويل صورة أو عدة صور إلى PDF' }],
  'pdf-image': [{ value: 'pdf-to-image', label: 'تحويل صفحات PDF إلى صور PNG' }],
  'pdf-pdf': [
    { value: 'merge-pdf', label: 'دمج أكثر من ملف PDF' },
    { value: 'split-pdf', label: 'استخراج صفحات محددة من PDF' },
    { value: 'remove-pages', label: 'حذف صفحات محددة من PDF' },
    { value: 'rotate-pdf', label: 'تدوير صفحات PDF' }
  ],
  'image-image': [
    { value: 'image-to-jpg', label: 'تحويل الصورة إلى JPG' },
    { value: 'image-to-png', label: 'تحويل الصورة إلى PNG' },
    { value: 'image-to-webp', label: 'تحويل الصورة إلى WebP' },
    { value: 'resize-image', label: 'تصغير أو ضغط الصورة' }
  ]
};

const markFiles = input => {
  const zone = input?.closest('.drop-zone');
  if (!zone) return;
  const count = input.files?.length || 0;
  zone.classList.toggle('has-files', count > 0);
  const small = zone.querySelector('small');
  if (small && count) small.textContent = `${count.toLocaleString('ar')} ملف محدد`;
};

const imageService = service => ['image-to-jpg', 'image-to-png', 'image-to-webp', 'resize-image'].includes(service);
const renderUpload = service => {
  resetDownload();
  const isImagesToPdf = service === 'image-to-pdf';
  const isMerge = service === 'merge-pdf';
  const isImageTool = imageService(service);
  const accept = isImagesToPdf || isImageTool ? 'image/jpeg,image/png,image/webp' : 'application/pdf';
  const multiple = isImagesToPdf || isMerge ? 'multiple' : '';
  const title = isImagesToPdf ? 'اختر صور JPG أو PNG أو WebP' : isMerge ? 'اختر ملفات PDF' : isImageTool ? 'اختر صورة واحدة' : 'اختر ملف PDF واحد';
  const hint = isImagesToPdf ? 'يمكن اختيار أكثر من صورة مرة واحدة' : isMerge ? 'اختر ملفين أو أكثر للدمج' : service === 'pdf-to-image' ? 'سيتم تحويل كل صفحة إلى صورة PNG' : imageService(service) ? 'سيتم تجهيز الصورة داخل جهازك' : 'ثم اكتب الصفحات المطلوبة عند الحاجة';
  dynamicArea.innerHTML = `
    <label class="drop-zone"><input type="file" id="active-files" accept="${accept}" ${multiple}><b>${title}</b><small>${hint}</small></label>
    ${['split-pdf','remove-pages'].includes(service) ? '<label class="field range-row"><span>الصفحات المطلوبة</span><input id="page-ranges" type="text" inputmode="text" placeholder="مثال: 1-3, 5, 8"><small>اكتب أرقام الصفحات أو نطاقات بينها فاصلة.</small></label>' : ''}
    ${service === 'rotate-pdf' ? '<label class="field range-row"><span>زاوية التدوير</span><select id="rotate-angle"><option value="90">90 درجة</option><option value="180">180 درجة</option><option value="270">270 درجة</option></select></label>' : ''}
    ${service === 'resize-image' ? '<div class="option-grid"><label class="field"><span>العرض الأقصى بالبكسل</span><input id="max-width" type="number" min="200" max="4000" value="1200"></label><label class="field"><span>الجودة</span><select id="image-quality"><option value="0.85">عالية</option><option value="0.7">متوسطة</option><option value="0.55">أصغر حجم</option></select></label></div>' : ''}
    <div class="hint-box">كل التحويلات الأساسية هنا مجانية وتتم داخل جهازك قدر الإمكان، والملف الناتج لا يظهر للإدارة.</div>
  `;
  dynamicArea.querySelector('#active-files')?.addEventListener('change', event => markFiles(event.target));
};

const updateServices = () => {
  const key = `${fromEl?.value || 'image'}-${toEl?.value || 'pdf'}`;
  const list = services[key] || services['image-pdf'];
  serviceEl.innerHTML = list.map(item => `<option value="${item.value}">${item.label}</option>`).join('');
  renderUpload(serviceEl.value);
};
fromEl?.addEventListener('change', updateServices);
toEl?.addEventListener('change', updateServices);
serviceEl?.addEventListener('change', () => renderUpload(serviceEl.value));
document.querySelector('#swap-conversion')?.addEventListener('click', () => { const oldFrom = fromEl.value; fromEl.value = toEl.value; toEl.value = oldFrom; updateServices(); });
document.querySelectorAll('[data-preset]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-preset]').forEach(node => node.classList.remove('active'));
    button.classList.add('active');
    const preset = button.dataset.preset;
    if (preset === 'image-to-pdf') { fromEl.value = 'image'; toEl.value = 'pdf'; }
    if (preset === 'pdf-to-image') { fromEl.value = 'pdf'; toEl.value = 'image'; }
    if (['merge-pdf','split-pdf','remove-pages','rotate-pdf'].includes(preset)) { fromEl.value = 'pdf'; toEl.value = 'pdf'; }
    if (['image-to-jpg','image-to-png','image-to-webp','resize-image'].includes(preset)) { fromEl.value = 'image'; toEl.value = 'image'; }
    updateServices(); serviceEl.value = preset; renderUpload(preset);
  });
});

const parseRanges = (value, total) => {
  const pages = new Set();
  String(value || '').split(',').map(part => part.trim()).filter(Boolean).forEach(part => {
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error('صيغة الصفحات غير صحيحة. اكتب مثل: 1-3, 5');
    const start = Number(match[1]); const end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end > total) throw new Error(`اختر صفحات بين 1 و ${total}.`);
    for (let page = start; page <= end; page += 1) pages.add(page - 1);
  });
  return [...pages];
};

const loadImage = file => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('تعذر قراءة الصورة.')); };
  img.src = url;
});
const canvasBlob = (canvas, type, quality = 0.9) => new Promise(resolve => canvas.toBlob(resolve, type, quality));
const imageToCanvas = async (file, maxWidth = null) => {
  const img = await loadImage(file);
  const scale = maxWidth ? Math.min(1, maxWidth / img.width) : 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
};

const imagesToPdf = async files => {
  if (!files.length) throw new Error('اختر صورة واحدة على الأقل.');
  const { PDFDocument } = await loadPdfLib();
  const pdf = await PDFDocument.create();
  const pageWidth = 595.28, pageHeight = 841.89, margin = 32;
  for (const file of files) {
    let bytes = await readBytes(file); let type = file.type;
    if (type === 'image/webp') { const canvas = await imageToCanvas(file); const blob = await canvasBlob(canvas, 'image/png'); bytes = await blob.arrayBuffer(); type = 'image/png'; }
    const image = type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const scale = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2) / image.height);
    const width = image.width * scale, height = image.height * scale;
    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
  }
  downloadPdf(await pdf.save(), 'shadrat-images.pdf'); setStatus('تم تحويل الصور إلى PDF. الملف محفوظ عندك فقط.');
};
const mergePdf = async files => {
  if (files.length < 2) throw new Error('اختر ملفين PDF على الأقل للدمج.');
  const { PDFDocument } = await loadPdfLib(); const output = await PDFDocument.create();
  for (const file of files) { const source = await PDFDocument.load(await readBytes(file)); const pages = await output.copyPages(source, source.getPageIndices()); pages.forEach(page => output.addPage(page)); }
  downloadPdf(await output.save(), 'shadrat-merged.pdf'); setStatus('تم دمج الملفات. لا يمكن للإدارة رؤية الملف لأنه لم يغادر جهازك.');
};
const splitPdf = async (files, ranges) => {
  const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.'); if (!ranges.trim()) throw new Error('اكتب الصفحات التي تريد استخراجها.');
  const { PDFDocument } = await loadPdfLib(); const source = await PDFDocument.load(await readBytes(file)); const output = await PDFDocument.create();
  const pages = await output.copyPages(source, parseRanges(ranges, source.getPageCount())); pages.forEach(page => output.addPage(page));
  downloadPdf(await output.save(), 'shadrat-pages.pdf'); setStatus('تم استخراج الصفحات. الملف الناتج محفوظ عندك فقط.');
};
const removePages = async (files, ranges) => {
  const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.'); if (!ranges.trim()) throw new Error('اكتب الصفحات التي تريد حذفها.');
  const { PDFDocument } = await loadPdfLib(); const source = await PDFDocument.load(await readBytes(file)); const output = await PDFDocument.create();
  const removed = new Set(parseRanges(ranges, source.getPageCount())); const keep = source.getPageIndices().filter(i => !removed.has(i));
  if (!keep.length) throw new Error('لا يمكن حذف كل الصفحات. اترك صفحة واحدة على الأقل.');
  const pages = await output.copyPages(source, keep); pages.forEach(page => output.addPage(page));
  downloadPdf(await output.save(), 'shadrat-removed-pages.pdf'); setStatus('تم حذف الصفحات المحددة من PDF.');
};
const rotatePdf = async (files, angle) => {
  const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.');
  const { PDFDocument, degrees } = await loadPdfLib(); const pdf = await PDFDocument.load(await readBytes(file));
  pdf.getPages().forEach(page => page.setRotation(degrees(Number(angle || 90))));
  downloadPdf(await pdf.save(), 'shadrat-rotated.pdf'); setStatus('تم تدوير صفحات PDF.');
};
const pdfToImages = async files => {
  const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.');
  setStatus('جاري تحويل صفحات PDF إلى صور PNG…'); const [pdfjs, JSZip] = await Promise.all([loadPdfJs(), loadZip()]);
  const pdf = await pdfjs.getDocument({ data: await readBytes(file) }).promise; const zip = new JSZip();
  for (let i = 1; i <= pdf.numPages; i += 1) { const page = await pdf.getPage(i); const viewport = page.getViewport({ scale: 2 }); const canvas = document.createElement('canvas'); const context = canvas.getContext('2d'); canvas.width = viewport.width; canvas.height = viewport.height; await page.render({ canvasContext: context, viewport }).promise; const blob = await canvasBlob(canvas, 'image/png'); zip.file(`page-${String(i).padStart(2, '0')}.png`, blob); }
  makeDownload(await zip.generateAsync({ type: 'blob' }), 'shadrat-pdf-images.zip'); setStatus('تم تحويل PDF إلى صور. حمّل ملف ZIP وفي داخله الصور.');
};
const convertImage = async (files, service) => {
  const file = files[0]; if (!file) throw new Error('اختر صورة أولًا.');
  const maxWidth = service === 'resize-image' ? Number(document.querySelector('#max-width')?.value || 1200) : null;
  const quality = Number(document.querySelector('#image-quality')?.value || 0.9);
  const canvas = await imageToCanvas(file, maxWidth);
  const map = { 'image-to-jpg': ['image/jpeg', 'jpg'], 'image-to-png': ['image/png', 'png'], 'image-to-webp': ['image/webp', 'webp'], 'resize-image': ['image/jpeg', 'jpg'] };
  const [type, ext] = map[service] || map['image-to-jpg'];
  const blob = await canvasBlob(canvas, type, quality);
  makeDownload(blob, `shadrat-image.${ext}`); setStatus(service === 'resize-image' ? 'تم تصغير الصورة وتجهيزها للتحميل.' : 'تم تحويل الصورة وتجهيزها للتحميل.');
};

runButton?.addEventListener('click', async () => {
  const service = serviceEl?.value; const files = [...(document.querySelector('#active-files')?.files || [])]; const ranges = document.querySelector('#page-ranges')?.value || '';
  try { resetDownload(); setStatus('جاري تنفيذ التحويل داخل جهازك…');
    if (service === 'image-to-pdf') await imagesToPdf(files);
    else if (service === 'merge-pdf') await mergePdf(files);
    else if (service === 'split-pdf') await splitPdf(files, ranges);
    else if (service === 'remove-pages') await removePages(files, ranges);
    else if (service === 'rotate-pdf') await rotatePdf(files, document.querySelector('#rotate-angle')?.value);
    else if (service === 'pdf-to-image') await pdfToImages(files);
    else if (imageService(service)) await convertImage(files, service);
    else setStatus('هذا الاختيار غير متاح حاليًا.');
  } catch (error) { console.error(error); setStatus(error.message || 'تعذر تنفيذ التحويل. حاول مرة أخرى.'); }
});
updateServices();