import {createDownloadFlow} from './student-download.js?v=1';
if (!window.__shadratDocsUnifiedReady) {
  window.__shadratDocsUnifiedReady = true;

  const fromEl = document.querySelector('#convert-from');
  const toEl = document.querySelector('#convert-to');
  const area = document.querySelector('#active-tool-area');
  let flow = null;
  let inputVersion = 0;
  const labels = {image: 'صورة', pdf: 'PDF', txt: 'نص TXT'};
  const loadPdfLib = async () => import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm');
  const loadZip = async () => (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
  const loadPdfJs = async () => {
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/+esm');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    return pdfjs;
  };
  const revokeOld = () => flow?.reset();
  const readBytes = file => file.arrayBuffer();
  const setStatus = text => { const status = area?.querySelector('[data-status]'); if (status) status.textContent = text; };
  const canvasBlob = (canvas, type, quality = 0.9) => new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('تعذّر إنشاء الصورة. جرّب حجمًا أصغر.')), type, quality));
  const makeDownload = async (blob, name) => ({blob, name});
  const downloadPdf = (bytes, name) => makeDownload(new Blob([bytes], {type: 'application/pdf'}), name);
  const textDownload = (text, name) => makeDownload(new Blob([text], {type: 'text/plain;charset=utf-8'}), name);
  const fillTargets = () => {
    const previous = toEl.value;
    const values = fromEl.value === 'pdf' ? ['image', 'pdf', 'txt'] : ['pdf', 'image'];
    toEl.innerHTML = values.map(value => `<option value="${value}">${labels[value]}</option>`).join('');
    if (values.includes(previous)) toEl.value = previous;
  };
  const fillFormats = () => {
    fromEl.innerHTML = '<option value="image">صورة</option><option value="pdf">PDF</option>';
    fromEl.value = 'image'; fillTargets(); toEl.value = 'pdf';
  };
  const loadImage = file => new Promise((resolve, reject) => { const url = URL.createObjectURL(file); const img = new Image(); img.onload = () => { URL.revokeObjectURL(url); resolve(img); }; img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('تعذر قراءة الصورة.')); }; img.src = url; });
  const imageToCanvas = async (file, maxWidth = null) => { const img = await loadImage(file); const scale = maxWidth ? Math.min(1, maxWidth / img.width) : 1; const canvas = document.createElement('canvas'); canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale); const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); return canvas; };
  const getFiles = () => [...(area.querySelector('input[type="file"]')?.files || [])];
  const parseRanges = (value, total) => { const pages = new Set(); String(value || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/،/g, ',').split(',').map(part => part.trim()).filter(Boolean).forEach(part => { const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/); if (!match) throw new Error('صيغة الصفحات غير صحيحة. اكتب مثل: 1-3, 5'); const start = Number(match[1]); const end = Number(match[2] || match[1]); if (start < 1 || end < start || end > total) throw new Error(`اختر صفحات بين 1 و ${total}.`); for (let page = start; page <= end; page += 1) pages.add(page - 1); }); if (!pages.size) throw new Error('اكتب صفحة واحدة على الأقل.'); return [...pages]; };

  const imagesToPdf = async files => { if (!files.length) throw new Error('اختر صورة واحدة على الأقل.'); const { PDFDocument } = await loadPdfLib(); const pdf = await PDFDocument.create(); const pageWidth = 595.28, pageHeight = 841.89, margin = 32; for (const file of files) { let bytes = await readBytes(file), type = file.type || (/\.png$/i.test(file.name) ? 'image/png' : /\.webp$/i.test(file.name) ? 'image/webp' : 'image/jpeg'); if (type === 'image/webp') { const canvas = await imageToCanvas(file); const blob = await canvasBlob(canvas, 'image/png'); bytes = await blob.arrayBuffer(); type = 'image/png'; } const image = type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes); const scale = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2) / image.height); const width = image.width * scale, height = image.height * scale; const page = pdf.addPage([pageWidth, pageHeight]); page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height }); } return downloadPdf(await pdf.save(), 'shadrat-images.pdf'); };
  const pdfToImages = async files => { const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.'); const [pdfjs, JSZip] = await Promise.all([loadPdfJs(), loadZip()]); const pdf = await pdfjs.getDocument({ data: await readBytes(file) }).promise; const zip = new JSZip(); for (let i = 1; i <= pdf.numPages; i += 1) { const page = await pdf.getPage(i), viewport = page.getViewport({ scale: 2 }); const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height; await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise; zip.file(`page-${String(i).padStart(2, '0')}.png`, await canvasBlob(canvas, 'image/png')); } return makeDownload(await zip.generateAsync({ type: 'blob' }), 'shadrat-pdf-images.zip'); };
  const pdfToText = async files => { const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.'); const pdfjs = await loadPdfJs(); const pdf = await pdfjs.getDocument({ data: await readBytes(file) }).promise; const pages = []; for (let i = 1; i <= pdf.numPages; i += 1) { const page = await pdf.getPage(i); const content = await page.getTextContent(); pages.push(`صفحة ${i}\n${content.items.map(item => item.str).join(' ')}`); } if (!pages.some(page => page.replace(/^صفحة \d+\n/, '').trim())) throw new Error('هذا PDF ممسوح كصورة؛ لا يحتوي نصًا قابلًا للاستخراج بهذه الأداة.'); return textDownload(pages.join('\n\n--------------------\n\n'), 'shadrat-pdf-text.txt'); };
  const mergePdf = async files => { if (files.length < 2) throw new Error('اختر ملفين PDF على الأقل للدمج.'); const { PDFDocument } = await loadPdfLib(); const output = await PDFDocument.create(); for (const file of files) { const source = await PDFDocument.load(await readBytes(file)); const pages = await output.copyPages(source, source.getPageIndices()); pages.forEach(page => output.addPage(page)); } return downloadPdf(await output.save(), 'shadrat-merged.pdf'); };
  const splitPdf = async (files, ranges) => { const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.'); if (!ranges.trim()) throw new Error('اكتب الصفحات المطلوبة.'); const { PDFDocument } = await loadPdfLib(); const source = await PDFDocument.load(await readBytes(file)); const output = await PDFDocument.create(); const pages = await output.copyPages(source, parseRanges(ranges, source.getPageCount())); pages.forEach(page => output.addPage(page)); return downloadPdf(await output.save(), 'shadrat-pages.pdf'); };
  const removePages = async (files, ranges) => { const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.'); if (!ranges.trim()) throw new Error('اكتب الصفحات التي تريد حذفها.'); const { PDFDocument } = await loadPdfLib(); const source = await PDFDocument.load(await readBytes(file)); const output = await PDFDocument.create(); const removed = new Set(parseRanges(ranges, source.getPageCount())); const keep = source.getPageIndices().filter(index => !removed.has(index)); if (!keep.length) throw new Error('لا يمكن حذف كل الصفحات. اترك صفحة واحدة على الأقل.'); const pages = await output.copyPages(source, keep); pages.forEach(page => output.addPage(page)); return downloadPdf(await output.save(), 'shadrat-removed-pages.pdf'); };
  const rotatePdf = async (files, angle) => { const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.'); const { PDFDocument, degrees } = await loadPdfLib(); const pdf = await PDFDocument.load(await readBytes(file)); pdf.getPages().forEach(page => page.setRotation(degrees((page.getRotation().angle + Number(angle || 90)) % 360))); return downloadPdf(await pdf.save(), 'shadrat-rotated.pdf'); };
  const convertImage = async (files, action) => { const file = files[0]; if (!file) throw new Error('اختر صورة أولًا.'); const maxWidth = action === 'resize-image' ? Number(area.querySelector('[data-max-width]')?.value || 1200) : null; if (maxWidth !== null && (!Number.isFinite(maxWidth) || maxWidth < 200 || maxWidth > 4000)) throw new Error('اختر عرضًا بين 200 و4000 بكسل.'); const quality = Number(area.querySelector('[data-quality]')?.value || 0.85); const canvas = await imageToCanvas(file, maxWidth); const type = action === 'image-to-png' ? 'image/png' : action === 'image-to-webp' || action === 'resize-image' ? 'image/webp' : 'image/jpeg'; const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'; return makeDownload(await canvasBlob(canvas, type, quality), `shadrat-image.${ext}`); };

  const getTool = () => { const from = fromEl.value, to = toEl.value; if (from === 'image' && to === 'pdf') return { kind: 'image-pdf', title: 'صورة إلى PDF', hint: 'شغال الآن: حوّل صورة أو عدة صور إلى PDF واحد.', badge: 'PDF' }; if (from === 'pdf' && to === 'image') return { kind: 'pdf-image', title: 'PDF إلى صور', hint: 'شغال الآن: حوّل صفحات PDF إلى صور PNG داخل ملف ZIP.', badge: 'PNG' }; if (from === 'pdf' && to === 'txt') return { kind: 'pdf-text', title: 'PDF إلى نص TXT', hint: 'شغال الآن: استخراج النص من PDF قابل للنسخ.', badge: 'TXT' }; if (from === 'pdf' && to === 'pdf') return { kind: 'pdf-tools', title: 'أدوات PDF', hint: 'شغال الآن: دمج، استخراج، حذف، أو تدوير صفحات PDF.', badge: 'PDF' }; if (from === 'image' && to === 'image') return { kind: 'image-tools', title: 'أدوات الصور', hint: 'شغال الآن: تحويل JPG / PNG / WebP أو ضغط الصورة.', badge: 'IMG' }; return { kind: 'soon', title: `${labels[from]} إلى ${labels[to]}`, hint: 'قريبًا: هذا التحويل يحتاج خادم معالجة آمن.', badge: 'قريبًا' }; };
  const drawInputs = tool => { const inputs = area.querySelector('[data-inputs]'); if (!inputs) return; const pdfAction = area.querySelector('[data-pdf-action]')?.value || 'merge-pdf'; const imageAction = area.querySelector('[data-image-action]')?.value || 'image-to-jpg'; const isPdfTool = tool.kind === 'pdf-tools', isImageTool = tool.kind === 'image-tools'; const accept = isPdfTool || tool.kind === 'pdf-image' || tool.kind === 'pdf-text' ? 'application/pdf' : 'image/jpeg,image/png,image/webp'; const multiple = tool.kind === 'image-pdf' || (isPdfTool && pdfAction === 'merge-pdf'); inputs.innerHTML = `<label class="drop-zone"><input type="file" accept="${accept}" ${multiple ? 'multiple' : ''}><b>ادخل الملف هنا</b><small>${multiple ? 'يمكن اختيار أكثر من ملف' : 'اختر ملف واحد من جهازك'}</small></label>${isPdfTool && ['split-pdf','remove-pages'].includes(pdfAction) ? '<label class="field"><span>الصفحات</span><input data-ranges type="text" placeholder="مثال: 1-3, 5"></label>' : ''}${isPdfTool && pdfAction === 'rotate-pdf' ? '<label class="field"><span>زاوية التدوير</span><select data-angle><option value="90">90 درجة</option><option value="180">180 درجة</option><option value="270">270 درجة</option></select></label>' : ''}${isImageTool && imageAction === 'resize-image' ? '<div class="tool-options"><label class="field"><span>العرض الأقصى</span><input data-max-width type="number" min="200" max="4000" value="1200"></label><label class="field"><span>الجودة</span><select data-quality><option value="0.85">عالية</option><option value="0.7">متوسطة</option><option value="0.55">حجم أصغر</option></select></label></div>' : ''}`; inputs.querySelector('input[type="file"]')?.addEventListener('change', event => { inputVersion++; flow?.reset(); const names = [...event.target.files].map(f => f.name).join('، '); setStatus(names ? `تم اختيار: ${names}` : 'اختر ملفًا للبدء.'); }); };
  const renderTool = () => {
    revokeOld(); inputVersion++;
    const tool = getTool();
    const operation = tool.kind === 'pdf-tools' ? '<label class="field"><span>العملية</span><select data-pdf-action><option value="merge-pdf">دمج ملفات PDF</option><option value="split-pdf">استخراج صفحات محددة</option><option value="remove-pages">حذف صفحات محددة</option><option value="rotate-pdf">تدوير PDF</option></select></label>' : tool.kind === 'image-tools' ? '<label class="field"><span>العملية</span><select data-image-action><option value="image-to-jpg">تحويل إلى JPG</option><option value="image-to-png">تحويل إلى PNG</option><option value="image-to-webp">تحويل إلى WebP</option><option value="resize-image">ضغط / تصغير الصورة</option></select></label>' : '';
    area.innerHTML = `<div class="tool-card"><div class="tool-card-head"><span class="tool-badge">${tool.badge}</span><h3>${tool.title}</h3><p>${tool.hint.replace('شغال الآن: ', '')}</p></div>${operation}<div data-inputs></div><div class="tool-actions"><button class="btn primary" type="button" data-run>تحويل وتحميل</button><button class="btn outline" type="button" data-share-result hidden>مشاركة / حفظ</button></div><p class="status-line" data-status role="status" aria-live="polite">اختر الملف ثم اضغط تحويل وتحميل.</p></div>`;
    drawInputs(tool);
    flow = createDownloadFlow({button: area.querySelector('[data-run]'), status: setStatus, shareButton: area.querySelector('[data-share-result]'), controls: () => [fromEl, toEl, document.querySelector('#swap-conversion'), ...area.querySelectorAll('input,select')].filter(Boolean)});
    for (const selector of ['[data-pdf-action]', '[data-image-action]']) area.querySelector(selector)?.addEventListener('change', () => {inputVersion++; flow.reset(); drawInputs(tool);});
    area.querySelector('[data-run]').addEventListener('click', () => {
      const files = getFiles();
      const key = JSON.stringify([inputVersion, fromEl.value, toEl.value, ...[...area.querySelectorAll('select,input:not([type="file"])')].map(el => el.value)]);
      flow.run(key, async () => {
        if (!files.length) throw new Error('اختر الملف أولًا.');
        if (tool.kind === 'image-pdf') return imagesToPdf(files);
        if (tool.kind === 'pdf-image') return pdfToImages(files);
        if (tool.kind === 'pdf-text') return pdfToText(files);
        if (tool.kind === 'image-tools') return convertImage(files, area.querySelector('[data-image-action]').value);
        const action = area.querySelector('[data-pdf-action]').value;
        if (action === 'merge-pdf') return mergePdf(files);
        if (action === 'split-pdf') return splitPdf(files, area.querySelector('[data-ranges]').value);
        if (action === 'remove-pages') return removePages(files, area.querySelector('[data-ranges]').value);
        return rotatePdf(files, area.querySelector('[data-angle]').value);
      });
    });
  };
  fillFormats(); renderTool();
  fromEl.addEventListener('change', () => {fillTargets(); renderTool();});
  toEl.addEventListener('change', renderTool);
  document.querySelector('#swap-conversion')?.addEventListener('click', () => {
    if (toEl.value === 'txt') {setStatus('استخراج النص متاح من PDF إلى TXT فقط.'); return;}
    const previous = fromEl.value; fromEl.value = toEl.value; fillTargets(); toEl.value = previous; renderTool();
  });
}
