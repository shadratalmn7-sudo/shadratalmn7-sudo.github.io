if (!window.__shadratDocsUnifiedReady) {
  window.__shadratDocsUnifiedReady = true;

  const fromEl = document.querySelector('#convert-from');
  const toEl = document.querySelector('#convert-to');
  const area = document.querySelector('#active-tool-area');
  let currentUrl = '';

  const formats = [
    { value: 'image', label: 'صورة' },
    { value: 'pdf', label: 'PDF' },
    { value: 'txt', label: 'نص TXT' },
    { value: 'word', label: 'Word' },
    { value: 'excel', label: 'Excel' },
    { value: 'powerpoint', label: 'PowerPoint' }
  ];
  const labels = Object.fromEntries(formats.map(item => [item.value, item.label]));

  const readBytes = file => file.arrayBuffer();
  const revokeOld = () => { if (currentUrl) URL.revokeObjectURL(currentUrl); currentUrl = ''; };
  const setStatus = text => { const status = area?.querySelector('[data-status]'); if (status) status.textContent = text; };
  const makeDownload = (blob, name) => {
    revokeOld();
    const link = area.querySelector('[data-download]');
    currentUrl = URL.createObjectURL(blob);
    link.href = currentUrl;
    link.download = name;
    link.hidden = false;
    link.textContent = 'تحميل الملف الجاهز';
  };
  const downloadPdf = (bytes, name) => makeDownload(new Blob([bytes], { type: 'application/pdf' }), name);
  const textDownload = (text, name) => makeDownload(new Blob([text], { type: 'text/plain;charset=utf-8' }), name);

  const loadPdfLib = async () => import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm');
  const loadZip = async () => (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
  const loadPdfJs = async () => {
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/+esm');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    return pdfjs;
  };

  const fillFormats = () => {
    const html = formats.map(item => `<option value="${item.value}">${item.label}</option>`).join('');
    fromEl.innerHTML = html;
    toEl.innerHTML = html;
    fromEl.value = 'image';
    toEl.value = 'pdf';
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

  const getFiles = () => [...(area.querySelector('input[type="file"]')?.files || [])];

  const imagesToPdf = async files => {
    if (!files.length) throw new Error('اختر صورة واحدة على الأقل.');
    const { PDFDocument } = await loadPdfLib();
    const pdf = await PDFDocument.create();
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 32;
    for (const file of files) {
      let bytes = await readBytes(file);
      let type = file.type;
      if (type === 'image/webp') {
        const canvas = await imageToCanvas(file);
        const blob = await canvasBlob(canvas, 'image/png');
        bytes = await blob.arrayBuffer();
        type = 'image/png';
      }
      const image = type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      const scale = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2) / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      const page = pdf.addPage([pageWidth, pageHeight]);
      page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
    }
    downloadPdf(await pdf.save(), 'shadrat-images.pdf');
  };

  const pdfToImages = async files => {
    const file = files[0];
    if (!file) throw new Error('اختر ملف PDF أولًا.');
    const [pdfjs, JSZip] = await Promise.all([loadPdfJs(), loadZip()]);
    const pdf = await pdfjs.getDocument({ data: await readBytes(file) }).promise;
    const zip = new JSZip();
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      zip.file(`page-${String(i).padStart(2, '0')}.png`, await canvasBlob(canvas, 'image/png'));
    }
    makeDownload(await zip.generateAsync({ type: 'blob' }), 'shadrat-pdf-images.zip');
  };

  const pdfToText = async files => {
    const file = files[0];
    if (!file) throw new Error('اختر ملف PDF أولًا.');
    const pdfjs = await loadPdfJs();
    const pdf = await pdfjs.getDocument({ data: await readBytes(file) }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(' ');
      pages.push(`صفحة ${i}\n${text}`);
    }
    textDownload(pages.join('\n\n--------------------\n\n'), 'shadrat-pdf-text.txt');
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
  };

  const splitPdf = async (files, ranges) => {
    const file = files[0];
    if (!file) throw new Error('اختر ملف PDF أولًا.');
    if (!ranges.trim()) throw new Error('اكتب الصفحات المطلوبة.');
    const { PDFDocument } = await loadPdfLib();
    const source = await PDFDocument.load(await readBytes(file));
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, parseRanges(ranges, source.getPageCount()));
    pages.forEach(page => output.addPage(page));
    downloadPdf(await output.save(), 'shadrat-pages.pdf');
  };

  const removePages = async (files, ranges) => {
    const file = files[0];
    if (!file) throw new Error('اختر ملف PDF أولًا.');
    if (!ranges.trim()) throw new Error('اكتب الصفحات التي تريد حذفها.');
    const { PDFDocument } = await loadPdfLib();
    const source = await PDFDocument.load(await readBytes(file));
    const output = await PDFDocument.create();
    const removed = new Set(parseRanges(ranges, source.getPageCount()));
    const keep = source.getPageIndices().filter(index => !removed.has(index));
    if (!keep.length) throw new Error('لا يمكن حذف كل الصفحات. اترك صفحة واحدة على الأقل.');
    const pages = await output.copyPages(source, keep);
    pages.forEach(page => output.addPage(page));
    downloadPdf(await output.save(), 'shadrat-removed-pages.pdf');
  };

  const rotatePdf = async (files, angle) => {
    const file = files[0];
    if (!file) throw new Error('اختر ملف PDF أولًا.');
    const { PDFDocument, degrees } = await loadPdfLib();
    const pdf = await PDFDocument.load(await readBytes(file));
    pdf.getPages().forEach(page => page.setRotation(degrees(Number(angle || 90))));
    downloadPdf(await pdf.save(), 'shadrat-rotated.pdf');
  };

  const convertImage = async (files, action) => {
    const file = files[0];
    if (!file) throw new Error('اختر صورة أولًا.');
    const maxWidth = action === 'resize-image' ? Number(area.querySelector('[data-max-width]')?.value || 1200) : null;
    const quality = Number(area.querySelector('[data-quality]')?.value || 0.85);
    const canvas = await imageToCanvas(file, maxWidth);
    const type = action === 'image-to-png' ? 'image/png' : action === 'image-to-webp' || action === 'resize-image' ? 'image/webp' : 'image/jpeg';
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    makeDownload(await canvasBlob(canvas, type, quality), `shadrat-image.${ext}`);
  };

  const getTool = () => {
    const from = fromEl.value;
    const to = toEl.value;
    if (from === 'image' && to === 'pdf') return { kind: 'image-pdf', title: 'صورة إلى PDF', hint: 'شغال الآن: حوّل صورة أو عدة صور إلى PDF واحد.', badge: 'PDF' };
    if (from === 'pdf' && to === 'image') return { kind: 'pdf-image', title: 'PDF إلى صور', hint: 'شغال الآن: حوّل صفحات PDF إلى صور PNG داخل ملف ZIP.', badge: 'PNG' };
    if (from === 'pdf' && to === 'txt') return { kind: 'pdf-text', title: 'PDF إلى نص TXT', hint: 'شغال الآن: استخراج النص من PDF قابل للنسخ.', badge: 'TXT' };
    if (from === 'pdf' && to === 'pdf') return { kind: 'pdf-tools', title: 'أدوات PDF', hint: 'شغال الآن: دمج، استخراج، حذف، أو تدوير صفحات PDF.', badge: 'PDF' };
    if (from === 'image' && to === 'image') return { kind: 'image-tools', title: 'أدوات الصور', hint: 'شغال الآن: تحويل JPG / PNG / WebP أو ضغط الصورة.', badge: 'IMG' };
    if (from === 'txt' && to === 'txt') return { kind: 'soon', title: 'نص TXT', hint: 'هذا ليس تحويلًا. اختر نوعًا مختلفًا في خانة إلى.', badge: '—' };
    return { kind: 'soon', title: `${labels[from]} إلى ${labels[to]}`, hint: 'قريبًا: هذا التحويل يحتاج خادم معالجة آمن.', badge: 'قريبًا' };
  };

  const drawInputs = tool => {
    const inputs = area.querySelector('[data-inputs]');
    if (!inputs) return;
    const pdfAction = area.querySelector('[data-pdf-action]')?.value || 'merge-pdf';
    const imageAction = area.querySelector('[data-image-action]')?.value || 'image-to-jpg';
    const isPdfTool = tool.kind === 'pdf-tools';
    const isImageTool = tool.kind === 'image-tools';
    const accept = isPdfTool || tool.kind === 'pdf-image' || tool.kind === 'pdf-text' ? 'application/pdf' : 'image/jpeg,image/png,image/webp';
    const multiple = tool.kind === 'image-pdf' || (isPdfTool && pdfAction === 'merge-pdf');
    inputs.innerHTML = `
      <label class="drop-zone">
        <input type="file" accept="${accept}" ${multiple ? 'multiple' : ''}>
        <b>ادخل الملف هنا</b>
        <small>${multiple ? 'يمكن اختيار أكثر من ملف' : 'اختر ملف واحد من جهازك'}</small>
      </label>
      ${isPdfTool && ['split-pdf', 'remove-pages'].includes(pdfAction) ? '<label class="field"><span>الصفحات</span><input data-ranges type="text" placeholder="مثال: 1-3, 5"></label>' : ''}
      ${isPdfTool && pdfAction === 'rotate-pdf' ? '<label class="field"><span>زاوية التدوير</span><select data-angle><option value="90">90 درجة</option><option value="180">180 درجة</option><option value="270">270 درجة</option></select></label>' : ''}
      ${isImageTool && imageAction === 'resize-image' ? '<div class="tool-options"><label class="field"><span>العرض الأقصى</span><input data-max-width type="number" min="200" max="4000" value="1200"></label><label class="field"><span>الجودة</span><select data-quality><option value="0.85">عالية</option><option value="0.7">متوسطة</option><option value="0.55">حجم أصغر</option></select></label></div>' : ''}
    `;
    inputs.querySelector('input[type="file"]')?.addEventListener('change', event => {
      const count = event.target.files?.length || 0;
      const zone = event.target.closest('.drop-zone');
      zone.classList.toggle('has-files', count > 0);
      if (count) zone.querySelector('small').textContent = `${count.toLocaleString('ar')} ملف محدد`;
    });
  };

  const render = () => {
    const tool = getTool();
    revokeOld();
    if (tool.kind === 'soon') {
      area.innerHTML = `
        <div class="tool-title"><div><h3>${tool.title}</h3><p>${tool.hint}</p></div><span class="tool-badge soon-badge">${tool.badge}</span></div>
        <div class="soon-box"><b>قريبًا</b><p>ما راح نحط زر وهمي. لما نوفر خادم آمن للتحويلات الثقيلة بنفعّلها هنا.</p><div class="soon-tags"><span>${labels[fromEl.value]}</span><span>→</span><span>${labels[toEl.value]}</span></div></div>
      `;
      return;
    }

    const pdfSelect = tool.kind === 'pdf-tools' ? `
      <label class="field"><span>الخدمة</span><select data-pdf-action>
        <option value="merge-pdf">دمج ملفات PDF</option>
        <option value="split-pdf">استخراج صفحات PDF</option>
        <option value="remove-pages">حذف صفحات من PDF</option>
        <option value="rotate-pdf">تدوير PDF</option>
      </select></label>` : '';
    const imageSelect = tool.kind === 'image-tools' ? `
      <label class="field"><span>الخدمة</span><select data-image-action>
        <option value="image-to-jpg">صورة إلى JPG</option>
        <option value="image-to-png">صورة إلى PNG</option>
        <option value="image-to-webp">صورة إلى WebP</option>
        <option value="resize-image">تصغير / ضغط صورة</option>
      </select></label>` : '';

    area.innerHTML = `
      <div class="tool-title"><div><h3>${tool.title}</h3><p>${tool.hint}</p></div><span class="tool-badge">${tool.badge}</span></div>
      ${pdfSelect}${imageSelect}
      <div data-inputs></div>
      <div class="tool-actions"><button class="btn primary" type="button" data-run>تحويل الآن</button><a class="download-ready" data-download hidden download>تحميل الملف الجاهز</a></div>
      <p class="tool-status" data-status>ارفع الملف ثم اضغط تحويل الآن.</p>
    `;

    area.querySelector('[data-pdf-action]')?.addEventListener('change', () => drawInputs(tool));
    area.querySelector('[data-image-action]')?.addEventListener('change', () => drawInputs(tool));
    drawInputs(tool);

    area.querySelector('[data-run]')?.addEventListener('click', async () => {
      area.querySelector('[data-download]').hidden = true;
      try {
        setStatus('جاري التحويل داخل جهازك…');
        const files = getFiles();
        const pdfAction = area.querySelector('[data-pdf-action]')?.value || '';
        const imageAction = area.querySelector('[data-image-action]')?.value || '';
        if (tool.kind === 'image-pdf') await imagesToPdf(files);
        else if (tool.kind === 'pdf-image') await pdfToImages(files);
        else if (tool.kind === 'pdf-text') await pdfToText(files);
        else if (tool.kind === 'pdf-tools' && pdfAction === 'merge-pdf') await mergePdf(files);
        else if (tool.kind === 'pdf-tools' && pdfAction === 'split-pdf') await splitPdf(files, area.querySelector('[data-ranges]')?.value || '');
        else if (tool.kind === 'pdf-tools' && pdfAction === 'remove-pages') await removePages(files, area.querySelector('[data-ranges]')?.value || '');
        else if (tool.kind === 'pdf-tools' && pdfAction === 'rotate-pdf') await rotatePdf(files, area.querySelector('[data-angle]')?.value || 90);
        else if (tool.kind === 'image-tools') await convertImage(files, imageAction);
        setStatus('تم التجهيز. اضغط تحميل الملف الجاهز.');
      } catch (error) {
        console.error(error);
        setStatus(error.message || 'تعذر تنفيذ التحويل. حاول مرة أخرى.');
      }
    });
  };

  fillFormats();
  fromEl.addEventListener('change', render);
  toEl.addEventListener('change', render);
  document.querySelector('#swap-conversion')?.addEventListener('click', () => {
    const oldFrom = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = oldFrom;
    render();
  });
  render();
}
