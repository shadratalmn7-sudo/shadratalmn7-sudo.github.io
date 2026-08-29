if (!window.__shadratDocsToolsReadyV50) {
  window.__shadratDocsToolsReadyV50 = true;

  const fromEl = document.querySelector('#convert-from');
  const toEl = document.querySelector('#convert-to');
  const serviceEl = document.querySelector('#service-select');
  const area = document.querySelector('#active-tool-area');
  let currentUrl = '';
  const readBytes = file => file.arrayBuffer();
  const revokeOld = () => { if (currentUrl) URL.revokeObjectURL(currentUrl); currentUrl = ''; };
  const setStatus = text => { const s = area.querySelector('[data-status]'); if (s) s.textContent = text; };
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
  const loadPdfLib = async () => import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm');
  const loadZip = async () => (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
  const loadPdfJs = async () => {
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/+esm');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    return pdfjs;
  };

  const liveTools = {
    'image-pdf': [{ id:'image-to-pdf', label:'صورة إلى PDF', hint:'حوّل صورة أو عدة صور إلى ملف PDF واحد', accept:'image/jpeg,image/png,image/webp', multiple:true, badge:'PDF' }],
    'pdf-image': [{ id:'pdf-to-image', label:'PDF إلى صور PNG', hint:'حوّل صفحات PDF إلى صور داخل ملف ZIP', accept:'application/pdf', badge:'PNG' }],
    'pdf-pdf': [
      { id:'merge-pdf', label:'دمج ملفات PDF', hint:'ادمج أكثر من ملف PDF في ملف واحد', accept:'application/pdf', multiple:true, badge:'دمج' },
      { id:'split-pdf', label:'استخراج صفحات PDF', hint:'استخرج صفحات محددة مثل 1-3, 5', accept:'application/pdf', ranges:true, rangeLabel:'الصفحات المطلوبة', badge:'قص' },
      { id:'remove-pages', label:'حذف صفحات من PDF', hint:'احذف صفحات محددة من ملف PDF', accept:'application/pdf', ranges:true, rangeLabel:'الصفحات المراد حذفها', badge:'حذف' },
      { id:'rotate-pdf', label:'تدوير PDF', hint:'دوّر صفحات PDF بزاوية محددة', accept:'application/pdf', rotate:true, badge:'↻' }
    ],
    'image-image': [
      { id:'image-to-jpg', label:'صورة إلى JPG', hint:'حوّل الصورة إلى JPG', accept:'image/jpeg,image/png,image/webp', badge:'JPG' },
      { id:'image-to-png', label:'صورة إلى PNG', hint:'حوّل الصورة إلى PNG', accept:'image/jpeg,image/png,image/webp', badge:'PNG' },
      { id:'image-to-webp', label:'صورة إلى WebP', hint:'حوّل الصورة إلى WebP', accept:'image/jpeg,image/png,image/webp', badge:'WebP' },
      { id:'resize-image', label:'تصغير / ضغط صورة', hint:'قلل عرض الصورة وحجمها', accept:'image/jpeg,image/png,image/webp', resize:true, badge:'ضغط' }
    ]
  };

  const typeNames = { image:'صورة', pdf:'PDF', word:'Word', excel:'Excel', powerpoint:'PowerPoint' };
  const soonTool = (from, to) => ({ id:'soon', label:`${typeNames[from]} إلى ${typeNames[to]}`, hint:'هذه الخدمة تحتاج خادم معالجة وسيتم إضافتها قريبًا.', badge:'قريبًا', soon:true });
  const getTools = () => liveTools[`${fromEl.value}-${toEl.value}`] || [soonTool(fromEl.value, toEl.value)];

  const parseRanges = (value, total) => {
    const pages = new Set();
    String(value || '').split(',').map(p => p.trim()).filter(Boolean).forEach(part => {
      const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) throw new Error('صيغة الصفحات غير صحيحة. اكتب مثل: 1-3, 5');
      const start = Number(match[1]);
      const end = Number(match[2] || match[1]);
      if (start < 1 || end < start || end > total) throw new Error(`اختر صفحات بين 1 و ${total}.`);
      for (let page = start; page <= end; page++) pages.add(page - 1);
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
  const pdfToImages = async files => {
    const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.');
    const [pdfjs, JSZip] = await Promise.all([loadPdfJs(), loadZip()]);
    const pdf = await pdfjs.getDocument({ data: await readBytes(file) }).promise;
    const zip = new JSZip();
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      zip.file(`page-${String(i).padStart(2, '0')}.png`, await canvasBlob(canvas, 'image/png'));
    }
    makeDownload(await zip.generateAsync({ type:'blob' }), 'shadrat-pdf-images.zip');
  };
  const convertImage = async (files, tool) => {
    const file = files[0]; if (!file) throw new Error('اختر صورة أولًا.');
    const maxWidth = tool.id === 'resize-image' ? Number(area.querySelector('[data-max-width]')?.value || 1200) : null;
    const quality = Number(area.querySelector('[data-quality]')?.value || .85);
    const canvas = await imageToCanvas(file, maxWidth);
    const type = tool.id === 'image-to-png' ? 'image/png' : tool.id === 'image-to-webp' || tool.id === 'resize-image' ? 'image/webp' : 'image/jpeg';
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    makeDownload(await canvasBlob(canvas, type, quality), `shadrat-image.${ext}`);
  };

  const renderActive = () => {
    const tool = getTools().find(t => t.id === serviceEl.value) || getTools()[0];
    if (tool.soon) {
      area.innerHTML = `<div class="tool-title"><div><h3>${tool.label}</h3><p>${tool.hint}</p></div><span class="tool-badge">${tool.badge}</span></div><div class="soon-box"><b>قريبًا</b><p>التحويلات المكتبية مثل Word و Excel و PowerPoint تحتاج معالجة خاصة، لذلك ستُضاف لاحقًا بدون وضع زر وهمي.</p><div class="soon-row"><span>PDF ↔ Word</span><span>PDF ↔ Excel</span><span>PDF ↔ PowerPoint</span></div></div>`;
      return;
    }
    area.innerHTML = `<div class="tool-title"><div><h3>${tool.label}</h3><p>${tool.hint}</p></div><span class="tool-badge">${tool.badge}</span></div>
      <label class="drop-zone"><input type="file" accept="${tool.accept}" ${tool.multiple ? 'multiple' : ''}><b>ادخل الملف هنا</b><small>${tool.multiple ? 'يمكن اختيار أكثر من ملف' : 'اختر ملف واحد من جهازك'}</small></label>
      ${tool.ranges ? `<label class="field"><span>${tool.rangeLabel}</span><input data-ranges type="text" placeholder="مثال: 1-3, 5"></label>` : ''}
      ${tool.rotate ? '<label class="field"><span>زاوية التدوير</span><select data-angle><option value="90">90 درجة</option><option value="180">180 درجة</option><option value="270">270 درجة</option></select></label>' : ''}
      ${tool.resize ? '<div class="tool-options"><label class="field"><span>العرض الأقصى</span><input data-max-width type="number" min="200" max="4000" value="1200"></label><label class="field"><span>الجودة</span><select data-quality><option value="0.85">عالية</option><option value="0.7">متوسطة</option><option value="0.55">حجم أصغر</option></select></label></div>' : ''}
      <div class="tool-actions"><button class="btn primary" type="button" data-run>تحويل الآن</button><a class="download-ready" data-download hidden download>تحميل الملف الجاهز</a></div><p class="tool-status" data-status>ارفع الملف ثم اضغط تحويل الآن.</p>`;
    area.querySelector('input[type="file"]').addEventListener('change', event => {
      const count = event.target.files?.length || 0;
      const zone = event.target.closest('.drop-zone');
      zone.classList.toggle('has-files', count > 0);
      if (count) zone.querySelector('small').textContent = `${count.toLocaleString('ar')} ملف محدد`;
    });
    area.querySelector('[data-run]').addEventListener('click', async () => {
      const files = [...(area.querySelector('input[type="file"]')?.files || [])];
      const link = area.querySelector('[data-download]');
      link.hidden = true;
      try {
        setStatus('جاري التحويل داخل جهازك…');
        if (tool.id === 'image-to-pdf') await imagesToPdf(files);
        else if (tool.id === 'pdf-to-image') await pdfToImages(files);
        else if (tool.id === 'merge-pdf') await mergePdf(files);
        else if (tool.id === 'split-pdf') await splitPdf(files, area.querySelector('[data-ranges]')?.value || '');
        else if (tool.id === 'remove-pages') await removePages(files, area.querySelector('[data-ranges]')?.value || '');
        else if (tool.id === 'rotate-pdf') await rotatePdf(files, area.querySelector('[data-angle]')?.value || 90);
        else await convertImage(files, tool);
        setStatus('تم التجهيز. اضغط زر التحميل تحت الخدمة.');
      } catch (error) {
        console.error(error);
        setStatus(error.message || 'تعذر تنفيذ التحويل. حاول مرة أخرى.');
      }
    });
  };

  const updateServices = () => {
    const list = getTools();
    serviceEl.innerHTML = list.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
    renderActive();
  };
  fromEl?.addEventListener('change', updateServices);
  toEl?.addEventListener('change', updateServices);
  serviceEl?.addEventListener('change', renderActive);
  document.querySelector('#swap-conversion')?.addEventListener('click', () => {
    const old = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = old;
    updateServices();
  });
  updateServices();
}