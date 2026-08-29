if (!window.__shadratDocsUnifiedReady) {
  window.__shadratDocsUnifiedReady = true;

  const fromEl = document.querySelector('#convert-from');
  const toEl = document.querySelector('#convert-to');
  const area = document.querySelector('#active-tool-area');
  let currentUrl = '';

  const formats = [
    { value: 'image', label: 'صورة JPG / PNG / WebP' },
    { value: 'pdf', label: 'PDF' },
    { value: 'word', label: 'Word' },
    { value: 'excel', label: 'Excel' },
    { value: 'powerpoint', label: 'PowerPoint' }
  ];

  const labels = Object.fromEntries(formats.map(item => [item.value, item.label]));
  const working = new Set(['image-pdf', 'pdf-image', 'pdf-pdf', 'image-image']);
  const imageTools = [
    { id:'image-to-jpg', label:'صورة إلى JPG', hint:'حوّل الصورة إلى JPG', accept:'image/jpeg,image/png,image/webp', badge:'JPG' },
    { id:'image-to-png', label:'صورة إلى PNG', hint:'حوّل الصورة إلى PNG', accept:'image/jpeg,image/png,image/webp', badge:'PNG' },
    { id:'image-to-webp', label:'صورة إلى WebP', hint:'حوّل الصورة إلى WebP', accept:'image/jpeg,image/png,image/webp', badge:'WebP' },
    { id:'resize-image', label:'تصغير / ضغط صورة', hint:'قلل عرض الصورة وحجمها', accept:'image/jpeg,image/png,image/webp', resize:true, badge:'ضغط' }
  ];

  const readBytes = file => file.arrayBuffer();
  const revokeOld = () => { if (currentUrl) URL.revokeObjectURL(currentUrl); currentUrl = ''; };
  const makeDownload = (blob, name) => {
    revokeOld();
    const link = area.querySelector('[data-download]');
    currentUrl = URL.createObjectURL(blob);
    link.href = currentUrl;
    link.download = name;
    link.hidden = false;
    link.textContent = 'تحميل الملف الجاهز';
  };
  const downloadPdf = (bytes, name) => makeDownload(new Blob([bytes], { type:'application/pdf' }), name);
  const setStatus = text => { const status = area.querySelector('[data-status]'); if (status) status.textContent = text; };

  const loadPdfLib = async () => import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm');
  const loadZip = async () => (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
  const loadPdfJs = async () => {
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/+esm');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    return pdfjs;
  };

  const parseRanges = (value, total) => {
    const pages = new Set();
    String(value || '').split(',').map(p => p.trim()).filter(Boolean).forEach(part => {
      const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) throw new Error('صيغة الصفحات غير صحيحة. اكتب مثل: 1-3, 5');
      const start = Number(match[1]);
      const end = Number(match[2] || match[1]);
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
  const canvasBlob = (canvas, type, quality = .9) => new Promise(resolve => canvas.toBlob(resolve, type, quality));
  const imageToCanvas = async (file, maxWidth = null) => {
    const img = await loadImage(file);
    const scale = maxWidth ? Math.min(1, maxWidth / img.width) : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  const toolFor = (from, to) => {
    const key = `${from}-${to}`;
    if (from === 'image' && to === 'pdf') return { id:'image-to-pdf', label:'صورة إلى PDF', hint:'حوّل صورة أو عدة صور إلى ملف PDF واحد', accept:'image/jpeg,image/png,image/webp', multiple:true, badge:'PDF' };
    if (from === 'pdf' && to === 'image') return { id:'pdf-to-image', label:'PDF إلى صور PNG', hint:'حوّل صفحات PDF إلى صور داخل ملف ZIP', accept:'application/pdf', badge:'PNG' };
    if (from === 'pdf' && to === 'pdf') return { id:'pdf-tools', label:'أدوات PDF', hint:'اختر دمج، استخراج، حذف، أو تدوير صفحات PDF', accept:'application/pdf', badge:'PDF', pdfMode:true };
    if (from === 'image' && to === 'image') return { id:'image-tools', label:'أدوات الصور', hint:'اختر تحويل الصورة إلى JPG أو PNG أو WebP أو ضغطها', accept:'image/jpeg,image/png,image/webp', badge:'IMG', imageMode:true };
    return { id:'soon', label:`${labels[from]} إلى ${labels[to]}`, hint:'هذا التحويل يحتاج خادم معالجة وسيتم تفعيله لاحقًا.', badge:'قريبًا' };
  };

  const imagesToPdf = async files => {
    if (!files.length) throw new Error('اختر صورة واحدة على الأقل.');
    const { PDFDocument } = await loadPdfLib();
    const pdf = await PDFDocument.create();
    const pageWidth = 595.28, pageHeight = 841.89, margin = 32;
    for (const file of files) {
      let bytes = await readBytes(file), type = file.type;
      if (type === 'image/webp') { const canvas = await imageToCanvas(file); const blob = await canvasBlob(canvas, 'image/png'); bytes = await blob.arrayBuffer(); type = 'image/png'; }
      const image = type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      const scale = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2) / image.height);
      const width = image.width * scale, height = image.height * scale;
      const page = pdf.addPage([pageWidth, pageHeight]);
      page.drawImage(image, { x:(pageWidth-width)/2, y:(pageHeight-height)/2, width, height });
    }
    downloadPdf(await pdf.save(), 'shadrat-images.pdf');
  };

  const pdfToImages = async files => {
    const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.');
    const [pdfjs, JSZip] = await Promise.all([loadPdfJs(), loadZip()]);
    const pdf = await pdfjs.getDocument({ data: await readBytes(file) }).promise;
    const zip = new JSZip();
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      zip.file(`page-${String(i).padStart(2, '0')}.png`, await canvasBlob(canvas, 'image/png'));
    }
    makeDownload(await zip.generateAsync({ type:'blob' }), 'shadrat-pdf-images.zip');
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
    const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.');
    if (!ranges.trim()) throw new Error('اكتب الصفحات المطلوبة.');
    const { PDFDocument } = await loadPdfLib();
    const source = await PDFDocument.load(await readBytes(file));
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, parseRanges(ranges, source.getPageCount()));
    pages.forEach(page => output.addPage(page));
    downloadPdf(await output.save(), 'shadrat-pages.pdf');
  };

  const removePages = async (files, ranges) => {
    const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.');
    if (!ranges.trim()) throw new Error('اكتب الصفحات التي تريد حذفها.');
    const { PDFDocument } = await loadPdfLib();
    const source = await PDFDocument.load(await readBytes(file));
    const output = await PDFDocument.create();
    const removed = new Set(parseRanges(ranges, source.getPageCount()));
    const keep = source.getPageIndices().filter(i => !removed.has(i));
    if (!keep.length) throw new Error('لا يمكن حذف كل الصفحات. اترك صفحة واحدة على الأقل.');
    const pages = await output.copyPages(source, keep); pages.forEach(page => output.addPage(page));
    downloadPdf(await output.save(), 'shadrat-removed-pages.pdf');
  };

  const rotatePdf = async (files, angle) => {
    const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.');
    const { PDFDocument, degrees } = await loadPdfLib();
    const pdf = await PDFDocument.load(await readBytes(file));
    pdf.getPages().forEach(page => page.setRotation(degrees(Number(angle || 90))));
    downloadPdf(await pdf.save(), 'shadrat-rotated.pdf');
  };

  const convertImage = async (files, mode) => {
    const file = files[0]; if (!file) throw new Error('اختر صورة أولًا.');
    const maxWidth = mode === 'resize-image' ? Number(area.querySelector('[data-max-width]')?.value || 1200) : null;
    const quality = Number(area.querySelector('[data-quality]')?.value || .85);
    const canvas = await imageToCanvas(file, maxWidth);
    const type = mode === 'image-to-png' ? 'image/png' : mode === 'image-to-webp' || mode === 'resize-image' ? 'image/webp' : 'image/jpeg';
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    makeDownload(await canvasBlob(canvas, type, quality), `shadrat-image.${ext}`);
  };

  const fileAccept = tool => tool.pdfMode ? 'application/pdf' : tool.imageMode ? 'image/jpeg,image/png,image/webp' : tool.accept;
  const fileMultiple = tool => tool.id === 'image-to-pdf' || (tool.pdfMode && area.querySelector('[data-pdf-action]')?.value === 'merge-pdf');

  const renderTool = () => {
    const tool = toolFor(fromEl.value, toEl.value);
    if (tool.id === 'soon') {
      area.innerHTML = `<div class="tool-title"><div><h3>${tool.label}</h3><p>${tool.hint}</p></div><span class="tool-badge">${tool.badge}</span></div><div class="soon-box"><b>قريبًا</b><p>التحويلات بين Word / Excel / PowerPoint و PDF تحتاج خادم آمن. بنخليها ظاهرة هنا، لكن بدون زر وهمي.</p><div class="soon-tags"><span>${labels[fromEl.value]}</span><span>→</span><span>${labels[toEl.value]}</span></div></div>`;
      return;
    }
    const extraSelect = tool.pdfMode ? `<label class="field"><span>أداة PDF</span><select data-pdf-action><option value="merge-pdf">دمج ملفات PDF</option><option value="split-pdf">استخراج صفحات</option><option value="remove-pages">حذف صفحات</option><option value="rotate-pdf">تدوير PDF</option></select></label>` : tool.imageMode ? `<label class="field"><span>أداة الصور</span><select data-image-action>${imageTools.map(item => `<option value="${item.id}">${item.label}</option>`).join('')}</select></label>` : '';
    area.innerHTML = `<div class="tool-title"><div><h3>${tool.label}</h3><p>${tool.hint}</p></div><span class="tool-badge">${tool.badge}</span></div>${extraSelect}<div data-inputs></div><div class="tool-actions"><button class="btn primary" type="button" data-run>تحويل الآن</button><a class="download-ready" data-download hidden download>تحميل الملف الجاهز</a></div><p class="tool-status" data-status>ارفع الملف ثم اضغط تحويل الآن.</p>`;
    const drawInputs = () => {
      const pdfAction = area.querySelector('[data-pdf-action]')?.value;
      const imageAction = area.querySelector('[data-image-action]')?.value;
      const accept = tool.pdfMode ? 'application/pdf' : tool.imageMode ? 'image/jpeg,image/png,image/webp' : tool.accept;
      const multiple = tool.id === 'image-to-pdf' || pdfAction === 'merge-pdf';
      area.querySelector('[data-inputs]').innerHTML = `<label class="drop-zone"><input type="file" accept="${accept}" ${multiple ? 'multiple' : ''}><b>ادخل الملف هنا</b><small>${multiple ? 'يمكن اختيار أكثر من ملف' : 'اختر ملف واحد من جهازك'}</small></label>${['split-pdf','remove-pages'].includes(pdfAction) ? '<label class="field"><span>الصفحات</span><input data-ranges type="text" placeholder="مثال: 1-3, 5"></label>' : ''}${pdfAction === 'rotate-pdf' ? '<label class="field"><span>زاوية التدوير</span><select data-angle><option value="90">90 درجة</option><option value="180">180 درجة</option><option value="270">270 درجة</option></select></label>' : ''}${imageAction === 'resize-image' ? '<div class="tool-options"><label class="field"><span>العرض الأقصى</span><input data-max-width type="number" min="200" max="4000" value="1200"></label><label class="field"><span>الجودة</span><select data-quality><option value="0.85">عالية</option><option value="0.7">متوسطة</option><option value="0.55">حجم أصغر</option></select></label></div>' : ''}`;
      area.querySelector('input[type="file"]').addEventListener('change', event => {
        const count = event.target.files?.length || 0;
        const zone = event.target.closest('.drop-zone');
        zone.classList.toggle('has-files', count > 0);
        if (count) zone.querySelector('small').textContent = `${count.toLocaleString('ar')} ملف محدد`;
      });
    };
    area.querySelector('[data-pdf-action]')?.addEventListener('change', drawInputs);
    area.querySelector('[data-image-action]')?.addEventListener('change', drawInputs);
    drawInputs();

    area.querySelector('[data-run]').addEventListener('click', async () => {
      const files = [...(area.querySelector('input[type="file"]')?.files || [])];
      area.querySelector('[data-download]').hidden = true;
      try {
        setStatus('جاري التحويل داخل جهازك…');
        if (tool.id === 'image-to-pdf') await imagesToPdf(files);
        else if (tool.id === 'pdf-to-image') await pdfToImages(files);
        else if (tool.pdfMode) {
          const action = area.querySelector('[data-pdf-action]')?.value;
          if (action === 'merge-pdf') await mergePdf(files);
          if (action === 'split-pdf') await splitPdf(files, area.querySelector('[data-ranges]')?.value || '');
          if (action === 'remove-pages') await removePages(files, area.querySelector('[data-ranges]')?.value || '');
          if (action === 'rotate-pdf') await rotatePdf(files, area.querySelector('[data-angle]')?.value || 90);
        } else if (tool.imageMode) await convertImage(files, area.querySelector('[data-image-action]')?.value || 'image-to-jpg');
        setStatus('تم التجهيز. اضغط تحميل الملف الجاهز.');
      } catch (error) {
        console.error(error);
        setStatus(error.message || 'تعذر تنفيذ التحويل. حاول مرة أخرى.');
      }
    });
  };

  const fillFormats = () => {
    const options = formats.map(item => `<option value="${item.value}">${item.label}</option>`).join('');
    fromEl.innerHTML = options;
    toEl.innerHTML = options;
    fromEl.value = 'image';
    toEl.value = 'pdf';
  };

  fillFormats();
  fromEl.addEventListener('change', renderTool);
  toEl.addEventListener('change', renderTool);
  document.querySelector('#swap-conversion')?.addEventListener('click', () => {
    const old = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = old;
    renderTool();
  });
  renderTool();
}
