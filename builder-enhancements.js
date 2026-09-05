(() => {
  const page = location.pathname.split('/').pop() || '';
  if (!['cv-builder.html','motivation-letter.html'].includes(page)) return;

  const loadScript = (src, test) => new Promise((resolve, reject) => {
    if (test?.()) return resolve();
    const existing = [...document.scripts].find(s => s.src === src);
    if (existing) { existing.addEventListener('load', resolve, { once:true }); existing.addEventListener('error', reject, { once:true }); return; }
    const s = document.createElement('script'); s.src = src; s.async = true; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
  });

  const waitDom = cb => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', cb, { once:true }) : cb();
  const text = value => String(value || '').replace(/\s+/g,' ').trim();

  async function downloadPdf(node, filename) {
    const button = document.getElementById('printBtn');
    const old = button?.textContent;
    if (button) { button.disabled = true; button.textContent = 'جاري تجهيز PDF…'; }
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js', () => !!window.html2pdf);
      const clone = node.cloneNode(true);
      clone.style.cssText += ';position:static!important;box-shadow:none!important;border-radius:0!important;margin:0!important;width:190mm!important;max-width:190mm!important;min-height:auto!important;background:#fff!important;';
      const shell = document.createElement('div'); shell.style.cssText='position:fixed;left:-10000px;top:0;width:210mm;background:#fff;padding:10mm;z-index:-1;'; shell.appendChild(clone); document.body.appendChild(shell);
      await window.html2pdf().set({
        margin: [8,8,8,8], filename,
        image: { type:'jpeg', quality:.98 },
        html2canvas: { scale:2, useCORS:true, backgroundColor:'#ffffff' },
        jsPDF: { unit:'mm', format:'a4', orientation:'portrait' },
        pagebreak: { mode:['css','legacy'] }
      }).from(clone).save();
      shell.remove();
    } catch (error) {
      console.error('[Shadrat] PDF download failed', error);
      alert('تعذر تنزيل PDF مباشرة على هذا المتصفح. جرّب فتح الصفحة في Safari أو Chrome ثم أعد المحاولة.');
    } finally {
      if (button) { button.disabled = false; button.textContent = old || 'حفظ PDF'; }
    }
  }

  function wirePdfDownload() {
    const button = document.getElementById('printBtn');
    if (!button) return;
    button.onclick = null;
    button.addEventListener('click', async event => {
      event.preventDefault(); event.stopImmediatePropagation();
      const node = page === 'cv-builder.html' ? document.getElementById('cv') : document.getElementById('letter');
      const name = text(document.getElementById('name')?.value) || 'student';
      await downloadPdf(node, page === 'cv-builder.html' ? `${name}-CV.pdf` : `${name}-Motivation-Letter.pdf`);
    }, true);
    button.textContent = 'تحميل PDF';
  }

  function cleanCertificateText(raw, fallback) {
    const lines = String(raw || '').split(/\r?\n/).map(x => text(x)).filter(x => x.length >= 3 && x.length <= 180);
    const junk = /certificate of|certificate|completion|achievement|awarded to|presented to|verify|verification|credential|date|signature|شهادة|إتمام|إنجاز|مقدمة إلى|منحت إلى/i;
    const useful = lines.filter(x => !/^\d+$/.test(x));
    const title = useful.find(x => /cyber|security|data|python|network|cloud|ai|artificial|machine|program|course|specialization|olympiad|competition|الأمن|سيبر|برمج|ذكاء|بيانات|شبكات|دورة|مسابقة/i.test(x))
      || useful.find(x => !junk.test(x) && x.length >= 8) || fallback;
    const issuer = useful.find(x => /google|microsoft|cisco|ibm|coursera|udemy|academy|university|school|institute|foundation|جامعة|أكاديمية|معهد|مدرسة/i.test(x) && x !== title);
    const skills = useful.filter(x => x !== title && x !== issuer && !junk.test(x) && x.length >= 10).slice(0,2);
    return [title, issuer ? `— ${issuer}` : '', skills.length ? `— ${skills.join('؛ ')}` : ''].filter(Boolean).join(' ');
  }

  async function ensurePdfJs() {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', () => !!window.pdfjsLib);
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  async function ensureOcr() {
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js', () => !!window.Tesseract);
  }
  async function ocrSource(source) {
    await ensureOcr();
    const result = await window.Tesseract.recognize(source, 'eng+ara', { logger: () => {} });
    return result?.data?.text || '';
  }
  async function readPdf(file) {
    await ensurePdfJs();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise;
    let out='';
    const pages=Math.min(pdf.numPages,2);
    for (let i=1;i<=pages;i++) {
      const p=await pdf.getPage(i); const tc=await p.getTextContent();
      const extracted=tc.items.map(x=>x.str).join('\n').trim();
      if (extracted.length > 40) { out += '\n' + extracted; continue; }
      const viewport=p.getViewport({scale:1.5}); const canvas=document.createElement('canvas'); canvas.width=viewport.width; canvas.height=viewport.height;
      await p.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
      out += '\n' + await ocrSource(canvas);
    }
    return out;
  }
  async function readCertificate(file) {
    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return readPdf(file);
    if (file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)) return ocrSource(file);
    return '';
  }

  function wireCertificateReader() {
    if (page !== 'motivation-letter.html') return;
    const input=document.getElementById('certFiles'), list=document.getElementById('fileList'), achievements=document.getElementById('achievements');
    if (!input || !list || !achievements) return;
    const uploadLabel=input.closest('.upload');
    const hint=uploadLabel?.querySelector('small'); if (hint) hint.textContent='PDF أو صورة — الموقع يقرأ الشهادة تلقائيًا ويضيفها للخطاب';
    const note=uploadLabel?.parentElement?.querySelector('.note'); if (note) note.textContent='تتم القراءة داخل متصفحك. لا تحتاج لكتابة أسماء الشهادات يدويًا.';
    input.addEventListener('change', async event => {
      event.stopImmediatePropagation();
      const files=[...event.target.files];
      window.uploaded=[];
      achievements.value='';
      list.innerHTML=files.map((f,i)=>`<span class="chip" data-cert="${i}">⏳ جاري قراءة ${f.name.replace(/[<>]/g,'')}</span>`).join('');
      const found=[];
      for (let i=0;i<files.length;i++) {
        const file=files[i], chip=list.querySelector(`[data-cert="${i}"]`);
        try {
          const raw=await readCertificate(file);
          const fallback=file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ');
          const summary=cleanCertificateText(raw,fallback);
          found.push(summary); window.uploaded.push(summary);
          if (chip) chip.textContent='✓ '+summary.slice(0,75);
        } catch (error) {
          console.warn('[Shadrat] certificate read failed',file.name,error);
          const fallback=file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ');
          found.push(fallback); window.uploaded.push(fallback);
          if (chip) chip.textContent='⚠ '+fallback;
        }
      }
      achievements.value=found.join('\n');
      achievements.dispatchEvent(new Event('input',{bubbles:true}));
      const gen=document.getElementById('generateBtn'); if (gen) gen.click();
    }, true);
  }

  waitDom(() => { wirePdfDownload(); wireCertificateReader(); });
})();