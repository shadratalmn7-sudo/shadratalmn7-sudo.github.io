if (!window.__shadratDocsToolsReady) {
  window.__shadratDocsToolsReady = true;

  const grid = document.querySelector('#tools-grid');
  let currentUrl = '';
  const readBytes = file => file.arrayBuffer();
  const setText = (el, text) => { if (el) el.textContent = text; };
  const revokeOld = () => { if (currentUrl) URL.revokeObjectURL(currentUrl); currentUrl = ''; };
  const makeDownload = (panel, blob, name) => {
    revokeOld();
    const link = panel.querySelector('[data-download]');
    currentUrl = URL.createObjectURL(blob);
    link.href = currentUrl;
    link.download = name;
    link.hidden = false;
    link.textContent = 'تحميل الملف الجاهز';
  };
  const downloadPdf = (panel, bytes, name) => makeDownload(panel, new Blob([bytes], { type: 'application/pdf' }), name);

  const loadPdfLib = async () => {
    try { return await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm'); }
    catch (error) { console.error(error); throw new Error('تعذر تحميل أداة PDF. تحقق من الاتصال ثم حاول مرة أخرى.'); }
  };
  const loadZip = async () => (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
  const loadPdfJs = async () => {
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/+esm');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    return pdfjs;
  };

  const tools = [
    { id:'image-to-pdf', title:'صورة → PDF', hint:'حوّل صورة أو عدة صور إلى ملف PDF واحد', accept:'image/jpeg,image/png,image/webp', multiple:true, icon:'PDF' },
    { id:'pdf-to-image', title:'PDF → صور', hint:'حوّل صفحات PDF إلى صور PNG داخل ملف ZIP', accept:'application/pdf', icon:'PNG' },
    { id:'merge-pdf', title:'دمج PDF', hint:'ادمج أكثر من ملف PDF في ملف واحد', accept:'application/pdf', multiple:true, icon:'دمج' },
    { id:'split-pdf', title:'استخراج صفحات', hint:'استخرج صفحات محددة مثل 1-3, 5', accept:'application/pdf', icon:'قص', ranges:true, rangeLabel:'الصفحات المطلوبة' },
    { id:'remove-pages', title:'حذف صفحات', hint:'احذف صفحات محددة من ملف PDF', accept:'application/pdf', icon:'حذف', ranges:true, rangeLabel:'الصفحات المراد حذفها' },
    { id:'rotate-pdf', title:'تدوير PDF', hint:'دوّر كل صفحات PDF بزاوية محددة', accept:'application/pdf', icon:'↻', rotate:true },
    { id:'image-to-jpg', title:'صورة → JPG', hint:'حوّل الصورة إلى JPG', accept:'image/jpeg,image/png,image/webp', icon:'JPG' },
    { id:'image-to-png', title:'صورة → PNG', hint:'حوّل الصورة إلى PNG', accept:'image/jpeg,image/png,image/webp', icon:'PNG' },
    { id:'image-to-webp', title:'صورة → WebP', hint:'حوّل الصورة إلى WebP', accept:'image/jpeg,image/png,image/webp', icon:'WebP' },
    { id:'resize-image', title:'تصغير صورة', hint:'قلل عرض الصورة وحجمها', accept:'image/jpeg,image/png,image/webp', icon:'ضغط', resize:true }
  ];

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

  const imagesToPdf = async (panel, files) => {
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
      page.drawImage(image, { x:(pageWidth-width)/2, y:(pageHeight-height)/2, width, height });
    }
    downloadPdf(panel, await pdf.save(), 'shadrat-images.pdf');
  };

  const mergePdf = async (panel, files) => {
    if (files.length < 2) throw new Error('اختر ملفين PDF على الأقل للدمج.');
    const { PDFDocument } = await loadPdfLib();
    const output = await PDFDocument.create();
    for (const file of files) {
      const source = await PDFDocument.load(await readBytes(file));
      const pages = await output.copyPages(source, source.getPageIndices());
      pages.forEach(page => output.addPage(page));
    }
    downloadPdf(panel, await output.save(), 'shadrat-merged.pdf');
  };

  const splitPdf = async (panel, files, ranges) => {
    const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.');
    if (!ranges.trim()) throw new Error('اكتب الصفحات المطلوبة.');
    const { PDFDocument } = await loadPdfLib();
    const source = await PDFDocument.load(await readBytes(file));
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, parseRanges(ranges, source.getPageCount()));
    pages.forEach(page => output.addPage(page));
    downloadPdf(panel, await output.save(), 'shadrat-pages.pdf');
  };

  const removePages = async (panel, files, ranges) => {
    const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.');
    if (!ranges.trim()) throw new Error('اكتب الصفحات التي تريد حذفها.');
    const { PDFDocument } = await loadPdfLib();
    const source = await PDFDocument.load(await readBytes(file));
    const output = await PDFDocument.create();
    const removed = new Set(parseRanges(ranges, source.getPageCount()));
    const keep = source.getPageIndices().filter(i => !removed.has(i));
    if (!keep.length) throw new Error('لا يمكن حذف كل الصفحات. اترك صفحة واحدة على الأقل.');
    const pages = await output.copyPages(source, keep);
    pages.forEach(page => output.addPage(page));
    downloadPdf(panel, await output.save(), 'shadrat-removed-pages.pdf');
  };

  const rotatePdf = async (panel, files, angle) => {
    const file = files[0]; if (!file) throw new Error('اختر ملف PDF أولًا.');
    const { PDFDocument, degrees } = await loadPdfLib();
    const pdf = await PDFDocument.load(await readBytes(file));
    pdf.getPages().forEach(page => page.setRotation(degrees(Number(angle || 90))));
    downloadPdf(panel, await pdf.save(), 'shadrat-rotated.pdf');
  };

  const pdfToImages = async (panel, files) => {
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
    makeDownload(panel, await zip.generateAsync({ type: 'blob' }), 'shadrat-pdf-images.zip');
  };

  const convertImage = async (panel, files, tool) => {
    const file = files[0]; if (!file) throw new Error('اختر صورة أولًا.');
    const maxWidth = tool.id === 'resize-image' ? Number(panel.querySelector('[data-max-width]')?.value || 1200) : null;
    const quality = Number(panel.querySelector('[data-quality]')?.value || 0.85);
    const canvas = await imageToCanvas(file, maxWidth);
    const type = tool.id === 'image-to-png' ? 'image/png' : tool.id === 'image-to-webp' || tool.id === 'resize-image' ? 'image/webp' : 'image/jpeg';
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    makeDownload(panel, await canvasBlob(canvas, type, quality), `shadrat-image.${ext}`);
  };

  const runTool = async (tool, panel) => {
    const status = panel.querySelector('[data-status]');
    const link = panel.querySelector('[data-download]');
    link.hidden = true;
    const files = [...(panel.querySelector('input[type="file"]')?.files || [])];
    try {
      setText(status, 'جاري التحويل داخل جهازك…');
      if (tool.id === 'image-to-pdf') await imagesToPdf(panel, files);
      else if (tool.id === 'pdf-to-image') await pdfToImages(panel, files);
      else if (tool.id === 'merge-pdf') await mergePdf(panel, files);
      else if (tool.id === 'split-pdf') await splitPdf(panel, files, panel.querySelector('[data-ranges]')?.value || '');
      else if (tool.id === 'remove-pages') await removePages(panel, files, panel.querySelector('[data-ranges]')?.value || '');
      else if (tool.id === 'rotate-pdf') await rotatePdf(panel, files, panel.querySelector('[data-angle]')?.value || 90);
      else await convertImage(panel, files, tool);
      setText(status, 'تم التجهيز. اضغط زر التحميل تحت الخدمة.');
    } catch (error) {
      console.error(error);
      setText(status, error.message || 'تعذر تنفيذ التحويل. حاول مرة أخرى.');
    }
  };

  const buildPanel = tool => `
    <label class="drop-zone"><input type="file" accept="${tool.accept}" ${tool.multiple ? 'multiple' : ''}><b>ادخل الملف هنا</b><small>${tool.multiple ? 'يمكن اختيار أكثر من ملف' : 'اختر ملف واحد من جهازك'}</small></label>
    ${tool.ranges ? `<label class="field"><span>${tool.rangeLabel}</span><input data-ranges type="text" placeholder="مثال: 1-3, 5"></label>` : ''}
    ${tool.rotate ? '<label class="field"><span>زاوية التدوير</span><select data-angle><option value="90">90 درجة</option><option value="180">180 درجة</option><option value="270">270 درجة</option></select></label>' : ''}
    ${tool.resize ? '<div class="tool-options"><label class="field"><span>العرض الأقصى</span><input data-max-width type="number" min="200" max="4000" value="1200"></label><label class="field"><span>الجودة</span><select data-quality><option value="0.85">عالية</option><option value="0.7">متوسطة</option><option value="0.55">حجم أصغر</option></select></label></div>' : ''}
    <div class="tool-actions"><button class="btn primary" type="button" data-run>تحويل الآن</button><a class="download-ready" data-download hidden download>تحميل الملف الجاهز</a></div>
    <p class="tool-status" data-status>ارفع الملف ثم اضغط تحويل الآن.</p>`;

  if (grid) {
    grid.innerHTML = tools.map((tool, index) => `<article class="tool-item" data-tool="${tool.id}"><button class="tool-button" type="button" data-open><span class="tool-title"><b>${tool.title}</b><small>${tool.hint}</small></span><span class="tool-badge">${tool.icon}</span></button><div class="tool-panel">${buildPanel(tool)}</div></article>`).join('');
    grid.querySelectorAll('.tool-item').forEach(item => {
      const tool = tools.find(t => t.id === item.dataset.tool);
      const panel = item.querySelector('.tool-panel');
      item.querySelector('[data-open]').addEventListener('click', () => {
        grid.querySelectorAll('.tool-item').forEach(node => { if (node !== item) node.classList.remove('active'); });
        item.classList.toggle('active');
      });
      panel.querySelector('input[type="file"]').addEventListener('change', event => {
        const zone = event.target.closest('.drop-zone');
        const count = event.target.files?.length || 0;
        zone.classList.toggle('has-files', count > 0);
        const small = zone.querySelector('small');
        if (small && count) small.textContent = `${count.toLocaleString('ar')} ملف محدد`;
      });
      panel.querySelector('[data-run]').addEventListener('click', () => runTool(tool, panel));
    });
  }
}