const statusEl = document.querySelector('#docs-status');
const downloadEl = document.querySelector('#download-result');
const setStatus = text => { if (statusEl) statusEl.textContent = text; };

let currentUrl = '';
const readBytes = file => file.arrayBuffer();
const download = (bytes, name) => {
  if (!downloadEl) return;
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  downloadEl.href = currentUrl;
  downloadEl.download = name;
  downloadEl.hidden = false;
  downloadEl.textContent = 'تحميل الملف الجاهز';
};

const loadPdfLib = async () => {
  try {
    return await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm');
  } catch (error) {
    console.error(error);
    throw new Error('تعذر تحميل أداة PDF. تحقق من الاتصال ثم حاول مرة أخرى.');
  }
};

const markFiles = input => {
  const zone = input?.closest('.drop-zone');
  if (!zone) return;
  const count = input.files?.length || 0;
  zone.classList.toggle('has-files', count > 0);
  const small = zone.querySelector('small');
  if (small && count) small.textContent = `${count.toLocaleString('ar')} ملف محدد`;
};

document.querySelectorAll('.drop-zone input').forEach(input => {
  input.addEventListener('change', () => markFiles(input));
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

document.querySelector('#images-to-pdf')?.addEventListener('click', async () => {
  const files = [...(document.querySelector('#image-files')?.files || [])];
  if (!files.length) return setStatus('اختر صورة واحدة على الأقل.');
  try {
    setStatus('جاري تحويل الصور إلى PDF داخل جهازك…');
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
    download(await pdf.save(), 'shadrat-images.pdf');
    setStatus('تم إنشاء PDF. لم يتم رفع أي ملف إلى شذرات أو Firebase.');
  } catch (error) {
    setStatus(error.message || 'تعذر إنشاء PDF من الصور.');
  }
});

document.querySelector('#merge-pdf')?.addEventListener('click', async () => {
  const files = [...(document.querySelector('#merge-files')?.files || [])];
  if (files.length < 2) return setStatus('اختر ملفين PDF على الأقل للدمج.');
  try {
    setStatus('جاري دمج ملفات PDF داخل جهازك…');
    const { PDFDocument } = await loadPdfLib();
    const output = await PDFDocument.create();
    for (const file of files) {
      const source = await PDFDocument.load(await readBytes(file));
      const pages = await output.copyPages(source, source.getPageIndices());
      pages.forEach(page => output.addPage(page));
    }
    download(await output.save(), 'shadrat-merged.pdf');
    setStatus('تم دمج الملفات. لا يمكن للإدارة رؤية الملف لأنه لم يغادر جهازك.');
  } catch (error) {
    setStatus(error.message || 'تعذر دمج ملفات PDF.');
  }
});

document.querySelector('#split-pdf')?.addEventListener('click', async () => {
  const file = document.querySelector('#split-file')?.files?.[0];
  const ranges = document.querySelector('#page-ranges')?.value || '';
  if (!file) return setStatus('اختر ملف PDF أولًا.');
  if (!ranges.trim()) return setStatus('اكتب الصفحات التي تريد استخراجها.');
  try {
    setStatus('جاري استخراج الصفحات داخل جهازك…');
    const { PDFDocument } = await loadPdfLib();
    const source = await PDFDocument.load(await readBytes(file));
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, parseRanges(ranges, source.getPageCount()));
    pages.forEach(page => output.addPage(page));
    download(await output.save(), 'shadrat-pages.pdf');
    setStatus('تم استخراج الصفحات. الملف الناتج محفوظ عندك فقط.');
  } catch (error) {
    setStatus(error.message || 'تعذر استخراج الصفحات.');
  }
});
