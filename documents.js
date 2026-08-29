const statusEl = document.querySelector('#docs-status');
const downloadEl = document.querySelector('#download-result');
const fromEl = document.querySelector('#convert-from');
const toEl = document.querySelector('#convert-to');
const serviceEl = document.querySelector('#service-select');
const dynamicArea = document.querySelector('#dynamic-area');
const runButton = document.querySelector('#run-conversion');
const setStatus = text => { if (statusEl) statusEl.textContent = text; };

let currentUrl = '';
let zipBlobType = 'application/pdf';
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

const loadZip = async () => {
  const module = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
  return module.default;
};

const loadPdfJs = async () => {
  const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/+esm');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
  return pdfjs;
};

const services = {
  'image-pdf': [
    { value: 'image-to-pdf', label: 'تحويل صورة أو عدة صور إلى PDF' }
  ],
  'pdf-image': [
    { value: 'pdf-to-image', label: 'تحويل صفحات PDF إلى صور PNG' }
  ],
  'pdf-pdf': [
    { value: 'merge-pdf', label: 'دمج أكثر من ملف PDF' },
    { value: 'split-pdf', label: 'استخراج صفحات محددة من PDF' }
  ],
  'image-image': [
    { value: 'image-copy', label: 'لا يوجد تحويل مطلوب للصور' }
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

const renderUpload = service => {
  resetDownload();
  const isImages = service === 'image-to-pdf';
  const isMerge = service === 'merge-pdf';
  const accept = isImages ? 'image/jpeg,image/png' : 'application/pdf';
  const multiple = isImages || isMerge ? 'multiple' : '';
  const title = isImages ? 'اختر صور JPG أو PNG' : isMerge ? 'اختر ملفات PDF' : 'اختر ملف PDF واحد';
  const hint = isImages ? 'يمكن اختيار أكثر من صورة مرة واحدة' : isMerge ? 'اختر ملفين أو أكثر للدمج' : service === 'pdf-to-image' ? 'سيتم تحويل كل صفحة إلى صورة PNG' : 'ثم اكتب الصفحات المطلوبة';
  dynamicArea.innerHTML = `
    <label class="drop-zone"><input type="file" id="active-files" accept="${accept}" ${multiple}><b>${title}</b><small>${hint}</small></label>
    ${service === 'split-pdf' ? '<label class="field range-row"><span>الصفحات المطلوبة</span><input id="page-ranges" type="text" inputmode="text" placeholder="مثال: 1-3, 5, 8"><small>اكتب أرقام الصفحات أو نطاقات بينها فاصلة.</small></label>' : ''}
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

document.querySelector('#swap-conversion')?.addEventListener('click', () => {
  const oldFrom = fromEl.value;
  fromEl.value = toEl.value;
  toEl.value = oldFrom;
  updateServices();
});

document.querySelectorAll('[data-preset]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-preset]').forEach(node => node.classList.remove('active'));
    button.classList.add('active');
    const preset = button.dataset.preset;
    if (preset === 'image-to-pdf') { fromEl.value = 'image'; toEl.value = 'pdf'; }
    if (preset === 'pdf-to-image') { fromEl.value = 'pdf'; toEl.value = 'image'; }
    if (preset === 'merge-pdf' || preset === 'split-pdf') { fromEl.value = 'pdf'; toEl.value = 'pdf'; }
    updateServices();
    serviceEl.value = preset;
    renderUpload(preset);
  });
});

const parseRanges = (value, total) => {
  const pages = new Set();
  String(value || '').split(',').map(part => part.trim()).filter(Boolean).forEach(part => {
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error('صيغة الصفحات غير صحيحة. اكتب مثل: 1-3, 5');
    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end > total) throw new Error(`اختر صفحات بين 1 و ${total}.`);
    for (let page = start; page <= end; page += 1) pages.add(page - 1);
  });
  return [...pages];
};

const imagesToPdf = async files => {
  if (!files.length) throw new Error('اختر صورة واحدة على الأقل.');
  const { PDFDocument } = await loadPdfLib();
  const pdf = await PDFDocument.create();
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 32;
  for (const file of files) {
    const bytes = await readBytes(file);
    const image = file.type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    const scale = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2) / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
  }
  downloadPdf(await pdf.save(), 'shadrat-images.pdf');
  setStatus('تم تحويل الصور إلى PDF. الملف محفوظ عندك فقط.');
};

const mergePdf = async files => {
  if (files.length < 2) throw new Error('اختر ملفين PDF على الأقل للدمج.');
  const { PDFDocument } = await loadPdfLib();
  const output = await PDFDocument.create();
  for (const file of files) {
    const source = await PDFDocument.load(await readBytes(file));
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach(page => output.addPage(page));
  }
  downloadPdf(await output.save(), 'shadrat-merged.pdf');
  setStatus('تم دمج الملفات. لا يمكن للإدارة رؤية الملف لأنه لم يغادر جهازك.');
};

const splitPdf = async (files, ranges) => {
  const file = files[0];
  if (!file) throw new Error('اختر ملف PDF أولًا.');
  if (!ranges.trim()) throw new Error('اكتب الصفحات التي تريد استخراجها.');
  const { PDFDocument } = await loadPdfLib();
  const source = await PDFDocument.load(await readBytes(file));
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, parseRanges(ranges, source.getPageCount()));
  pages.forEach(page => output.addPage(page));
  downloadPdf(await output.save(), 'shadrat-pages.pdf');
  setStatus('تم استخراج الصفحات. الملف الناتج محفوظ عندك فقط.');
};

const pdfToImages = async files => {
  const file = files[0];
  if (!file) throw new Error('اختر ملف PDF أولًا.');
  setStatus('جاري تحويل صفحات PDF إلى صور PNG…');
  const [pdfjs, JSZip] = await Promise.all([loadPdfJs(), loadZip()]);
  const pdf = await pdfjs.getDocument({ data: await readBytes(file) }).promise;
  const zip = new JSZip();
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: context, viewport }).promise;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    zip.file(`page-${String(i).padStart(2, '0')}.png`, blob);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  makeDownload(zipBlob, 'shadrat-pdf-images.zip');
  setStatus('تم تحويل PDF إلى صور. حمّل ملف ZIP وفي داخله الصور.');
};

runButton?.addEventListener('click', async () => {
  const service = serviceEl?.value;
  const files = [...(document.querySelector('#active-files')?.files || [])];
  const ranges = document.querySelector('#page-ranges')?.value || '';
  try {
    resetDownload();
    setStatus('جاري تنفيذ التحويل داخل جهازك…');
    if (service === 'image-to-pdf') await imagesToPdf(files);
    else if (service === 'merge-pdf') await mergePdf(files);
    else if (service === 'split-pdf') await splitPdf(files, ranges);
    else if (service === 'pdf-to-image') await pdfToImages(files);
    else setStatus('هذا الاختيار لا يحتاج تحويل. اختر خدمة مختلفة.');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'تعذر تنفيذ التحويل. حاول مرة أخرى.');
  }
});

updateServices();