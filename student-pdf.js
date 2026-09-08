// Export bounded page canvases, preserving browser Arabic shaping via SVG.
let libraries;
const loadLibraries = () => libraries ||= Promise.all([
  import('https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/+esm'),
  import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm')
]).catch(error => {libraries = null; throw error;});
export function pageSlices(height, lines, pageHeight = 1030) {
  const slices = [];
  for (let start = 0; start < height;) {
    let end = Math.min(height, start + pageHeight);
    for (let pass = 0; pass < 12; pass++) {
      const crossing = lines.filter(r => r.top < end && r.bottom > end);
      if (!crossing.length || end === height) break;
      const next = Math.min(...crossing.map(r => r.top)) - 2;
      if (next <= start + pageHeight * .55) break;
      end = next;
    }
    slices.push({start, height: end - start}); start = end;
  }
  return slices;
}
export async function createNodePdfBlob(node) {
  if (!node) throw new Error('لم نعثر على المستند. أعد فتح الأداة.');
  const [{toCanvas}, {PDFDocument, rgb, StandardFonts}] = await loadLibraries();
  if (document.fonts?.ready) await document.fonts.ready;
  const width = 794, viewport = document.createElement('div');
  viewport.setAttribute('aria-hidden', 'true');
  viewport.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;overflow:hidden;background:white;pointer-events:none;`;
  const clone = node.cloneNode(true);
  clone.querySelectorAll('[hidden],.counter,script,iframe').forEach(el => el.remove());
  clone.removeAttribute('id'); clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  clone.style.setProperty('transform', 'none', 'important'); clone.style.setProperty('position', 'relative', 'important');
  for (const property of ['top', 'left', 'right', 'bottom']) clone.style.setProperty(property, 'auto', 'important');
  for (const property of ['width', 'min-width', 'max-width']) clone.style.setProperty(property, `${width}px`, 'important');
  for (const [property, value] of Object.entries({'height':'auto','min-height':'0','max-height':'none','overflow':'visible','margin':'0','box-shadow':'none'})) clone.style.setProperty(property, value, 'important');
  viewport.appendChild(clone); document.body.appendChild(viewport);
  try {
    await new Promise(resolve => requestAnimationFrame(resolve));
    const origin = clone.getBoundingClientRect(), lines = [];
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (!walker.currentNode.textContent.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(walker.currentNode);
      for (const rect of range.getClientRects()) lines.push({top: rect.top - origin.top, bottom: rect.bottom - origin.top});
    }
    const slices = pageSlices(Math.ceil(clone.scrollHeight), lines);
    const pdf = await PDFDocument.create(), font = await pdf.embedFont(StandardFonts.Helvetica);
    const accent = node.className.includes('creative') ? rgb(.49,.23,.93) : rgb(.12,.29,.63);
    for (let index = 0; index < slices.length; index++) {
      const slice = slices[index]; viewport.style.height = `${slice.height}px`;
      clone.style.setProperty('transform', `translateY(-${slice.start}px)`, 'important');
      const canvas = await toCanvas(viewport, {width, height:slice.height, pixelRatio:1.6, backgroundColor:'#ffffff', skipFonts:true, style:{position:'relative',left:'0',top:'0'}});
      const image = await pdf.embedPng(canvas.toDataURL('image/png'));
      const page = pdf.addPage([595.28,841.89]), drawWidth = 559.28, drawHeight = slice.height * drawWidth / width;
      page.drawImage(image, {x:18,y:841.89-20-drawHeight,width:drawWidth,height:drawHeight});
      if (index > 0) page.drawRectangle({x:18,y:827,width:drawWidth,height:2,color:accent});
      const number = `${index+1} / ${slices.length}`;
      page.drawText(number, {x:(595.28-font.widthOfTextAtSize(number,9))/2,y:12,font,size:9,color:rgb(.39,.45,.55)});
      canvas.width=0; canvas.height=0;
    }
    return new Blob([await pdf.save()], {type:'application/pdf'});
  } finally {viewport.remove();}
}
