const loadScript=(src,test)=>new Promise((resolve,reject)=>{if(test?.())return resolve(true);const absolute=new URL(src,document.baseURI).href;const old=[...document.scripts].find(s=>s.src===absolute);if(old&&!test?.())old.remove();const s=document.createElement('script');s.src=src;s.async=true;s.crossOrigin='anonymous';s.onload=()=>resolve(true);s.onerror=reject;document.head.appendChild(s)});
async function ensurePdfJs(){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',()=>!!window.pdfjsLib);window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}
async function ensureOcr(){await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',()=>!!window.Tesseract)}
const normalize=v=>String(v||'').replace(/\r/g,'\n').replace(/[\t ]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
const issuerCatalog=[['Microsoft',/\bmicrosoft\b|مايكروسوفت/i],['Cisco',/\bcisco\b|سيسكو/i],['Google',/\bgoogle\b|جوجل|غوغل/i],['IBM',/\bibm\b/i],['Amazon Web Services (AWS)',/amazon web services|\baws\b/i],['Oracle',/\boracle\b|أوراكل/i],['CompTIA',/comptia/i],['Meta',/\bmeta\b|facebook/i],['Coursera',/coursera/i],['edX',/\bedx\b/i],['Udacity',/udacity/i],['FutureLearn',/futurelearn/i],['LinkedIn Learning',/linkedin learning/i],['Huawei',/huawei|هواوي/i],['Fortinet',/fortinet/i],['Palo Alto Networks',/palo alto/i],['EC-Council',/ec-council/i],['TryHackMe',/tryhackme/i],['Hack The Box',/hack the box|htb academy/i]];
const taxonomy=[
  {en:'Cybersecurity',ar:'الأمن السيبراني',re:/cyber|cybersecurity|information security|security operations|soc|penetration|ethical hack|threat|malware|أمن سيبر|الأمن السيبر|أمن المعلومات|اختبار اختراق/i},
  {en:'Networking',ar:'الشبكات',re:/network|tcp|ip addressing|routing|switching|ccna|شبكات|توجيه|مبدلات/i},
  {en:'Python',ar:'بايثون',re:/\bpython\b|بايثون/i},
  {en:'JavaScript',ar:'جافاسكربت',re:/javascript|node\.js|typescript|جافاسكربت/i},
  {en:'Programming',ar:'البرمجة',re:/programming|software development|coding|computer programming|برمج|تطوير برمج/i},
  {en:'Web Development',ar:'تطوير الويب',re:/web development|html|css|frontend|backend|تطوير الويب/i},
  {en:'Data Analysis',ar:'تحليل البيانات',re:/data analysis|data analytics|analytics|power bi|tableau|تحليل البيانات/i},
  {en:'Data Science',ar:'علوم البيانات',re:/data science|pandas|numpy|علوم البيانات/i},
  {en:'Artificial Intelligence',ar:'الذكاء الاصطناعي',re:/artificial intelligence|machine learning|deep learning|\bai\b|ذكاء اصطناعي|تعلم آلي|تعلم عميق/i},
  {en:'Cloud Computing',ar:'الحوسبة السحابية',re:/cloud|azure|aws|gcp|cloud computing|سحاب|الحوسبة السحابية/i},
  {en:'Databases',ar:'قواعد البيانات',re:/database|sql|mysql|postgres|mongodb|قواعد البيانات/i},
  {en:'Linux',ar:'لينكس',re:/\blinux\b|ubuntu|bash|لينكس/i},
  {en:'Research',ar:'البحث',re:/research|methodology|academic writing|بحث|منهجية/i},
  {en:'Project Management',ar:'إدارة المشاريع',re:/project management|agile|scrum|pmp|إدارة المشاريع/i},
  {en:'Leadership',ar:'القيادة',re:/leadership|team leadership|قيادة/i},
  {en:'English',ar:'اللغة الإنجليزية',re:/english|ielts|toefl|duolingo english|إنجليزي|اللغة الإنجليزية/i}
];
const boilerplate=/certificate|certification|completion|achievement|award|diploma|this is to certify|has successfully|successfully completed|awarded to|presented to|شهادة|إتمام|إنجاز|تشهد|أتم بنجاح|منحت إلى|مقدمة إلى/i;
const courseSignal=/course|program|specialization|professional certificate|training|fundamentals|introduction|advanced|associate|expert|academy|bootcamp|olympiad|competition|دورة|برنامج|تخصص|تدريب|أساسيات|مقدمة|متقدم|مسابقة|أولمبياد/i;
const dateRe=/(?:\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b|\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b|\b\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}\b|\b(?:19|20)\d{2}\b)/i;
function usefulLines(raw){return normalize(raw).split(/\n+/).map(x=>x.trim()).filter(x=>x.length>=3&&x.length<=220)}
function scoreCourse(line,all){let s=0;if(courseSignal.test(line))s+=4;if(taxonomy.some(x=>x.re.test(line)))s+=5;if(/certificate|شهادة/i.test(line))s-=2;if(/verify|credential id|credential url|signature|authorized|director|instructor|تحقق|رقم الشهادة|توقيع/i.test(line))s-=5;if(line.length>=8&&line.length<=110)s+=2;if(all.indexOf(line)<=6)s+=1;return s}
function inferIssuer(lines,raw){for(const [name,re] of issuerCatalog)if(re.test(raw))return name;const general=/university|academy|institute|foundation|school|college|training center|organization|جامعة|أكاديمية|معهد|مؤسسة|كلية|مركز تدريب/i;return lines.find(x=>general.test(x)&&x.length<120)||''}
function inferCourse(lines){const ranked=lines.map(line=>({line,score:scoreCourse(line,lines)})).sort((a,b)=>b.score-a.score);const best=ranked.find(x=>x.score>=3)?.line||'';if(best)return best;const completionIndex=lines.findIndex(x=>/successfully completed|has completed|أتم بنجاح|اجتاز بنجاح/i.test(x));if(completionIndex>=0&&lines[completionIndex+1])return lines[completionIndex+1];return lines.find(x=>!boilerplate.test(x)&&x.length>=8&&x.length<=100)||lines[0]||''}
function inferTitle(lines,course){return lines.find(x=>/certificate of|professional certificate|certification|award|diploma|شهادة|إفادة|دبلوم/i.test(x)&&x!==course)||course||lines[0]||''}
export function extractCertificateInfo(raw,fileName=''){
  const text=normalize(raw),lines=usefulLines(text);if(!lines.length)return null;
  const issuer=inferIssuer(lines,text),course=inferCourse(lines),title=inferTitle(lines,course),date=text.match(dateRe)?.[0]||'',skills=taxonomy.filter(x=>x.re.test(text)).map(x=>({en:x.en,ar:x.ar})),credential=(text.match(/(?:credential\s*(?:id|number)|certificate\s*(?:id|number)|verification\s*(?:id|code)|رقم\s*(?:الشهادة|الاعتماد))\s*[:#-]?\s*([A-Z0-9_-]{5,})/i)||[])[1]||'';
  return{fileName,title,course,issuer,date,credential,skills,excerpt:lines.slice(0,12).join(' | ').slice(0,1200)}
}
async function ocr(source,onProgress){await ensureOcr();const result=await window.Tesseract.recognize(source,'eng+ara',{logger:m=>{if(m.status==='recognizing text'&&Number.isFinite(m.progress))onProgress?.(Math.round(m.progress*100),m.status)}});return result?.data?.text||''}
async function pageText(page,pageIndex,pageCount,onProgress){
  const tc=await page.getTextContent(),direct=tc.items.map(x=>x.str).join('\n').trim();if(direct.length>=70)return normalize(direct);
  const scale=(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))?1.25:1.45,viewport=page.getViewport({scale}),canvas=document.createElement('canvas');canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);await page.render({canvasContext:canvas.getContext('2d',{willReadFrequently:true}),viewport}).promise;
  return normalize(await ocr(canvas,p=>onProgress?.(Math.round(((pageIndex-1+p/100)/pageCount)*100),'ocr',{page:pageIndex,total:pageCount})))
}
function dedupeItems(items){const seen=new Set();return items.filter(item=>{const i=item.info||{},key=[i.credential,i.course||i.title,i.issuer,i.date].map(x=>cleanKey(x)).join('|');if(!key.replace(/\|/g,''))return false;if(seen.has(key))return false;seen.add(key);return true})}
function cleanKey(v){return String(v||'').toLowerCase().replace(/\s+/g,' ').trim()}
async function readPdfCertificates(file,onProgress){
  await ensurePdfJs();const pdf=await window.pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,pageCount=pdf.numPages,items=[],combined=[];
  for(let i=1;i<=pageCount;i++){
    onProgress?.(Math.round(((i-1)/pageCount)*100),'pdf',{page:i,total:pageCount});const page=await pdf.getPage(i),text=await pageText(page,i,pageCount,onProgress);if(text)combined.push(text);const info=extractCertificateInfo(text,`${file.name} — ${i}/${pageCount}`);if(info)items.push({fileName:file.name,fileType:file.type||'application/pdf',fileSize:file.size||0,sourcePage:i,pageCount,info})
  }
  let unique=dedupeItems(items);if(!unique.length){const info=extractCertificateInfo(combined.join('\n'),file.name);if(info)unique=[{fileName:file.name,fileType:file.type||'application/pdf',fileSize:file.size||0,sourcePage:1,pageCount,info}]}
  onProgress?.(100,'done',{page:pageCount,total:pageCount});if(!unique.length)throw new Error('CERTIFICATE_TEXT_EMPTY');return{fileName:file.name,fileType:file.type||'application/pdf',fileSize:file.size||0,pageCount,info:unique[0].info,items:unique}
}
export async function readCertificate(file,{onProgress}={}){
  if(file.type==='application/pdf'||/\.pdf$/i.test(file.name))return readPdfCertificates(file,onProgress);
  if(file.type.startsWith('image/')||/\.(png|jpe?g|webp)$/i.test(file.name)){const raw=normalize(await ocr(file,(p,s)=>onProgress?.(p,s,{page:1,total:1}))),info=extractCertificateInfo(raw,file.name);if(!info)throw new Error('CERTIFICATE_TEXT_EMPTY');const item={fileName:file.name,fileType:file.type||'',fileSize:file.size||0,sourcePage:1,pageCount:1,info};onProgress?.(100,'done',{page:1,total:1});return{...item,items:[item]}}
  throw new Error('UNSUPPORTED_CERTIFICATE_FILE')
}
export function skillLabels(info,lang='en'){return(info?.skills||[]).map(s=>lang==='ar'?s.ar:s.en)}
export function describeCertificate(info,lang='en',{kind='cv',target=''}={}){
  if(!info)return'';const course=info.course||info.title||'',issuer=info.issuer||'',date=info.date||'',skills=skillLabels(info,lang),skillText=skills.join(lang==='ar'?'، ':', ');
  if(lang==='ar'){const first=course?`شهادة «${course}»${issuer?` من ${issuer}`:''}${date?` بتاريخ ${date}`:''}.`:`شهادة موثقة${issuer?` صادرة من ${issuer}`:''}${date?` بتاريخ ${date}`:''}.`,second=skillText?`وترتبط بياناتها بـ ${skillText}.`:'';return kind==='letter'?[first,second,target?`ويتقاطع محتواها مع المسار المستهدف في ${target}.`:null].filter(Boolean).join(' '):[first,second].filter(Boolean).join(' ')}
  const first=course?`Certificate: “${course}”${issuer?` — ${issuer}`:''}${date?` (${date})`:''}.`:`Documented certificate${issuer?` — ${issuer}`:''}${date?` (${date})`:''}.`,second=skillText?`Documented subject areas: ${skillText}.`:'';return kind==='letter'?[first,second,target?`Its documented content overlaps with the intended path in ${target}.`:null].filter(Boolean).join(' '):[first,second].filter(Boolean).join(' ')
}
export function compactCertificate(info,lang='en'){if(!info)return'';const skills=skillLabels(info,lang);if(lang==='ar')return[info.course||info.title,info.issuer&&`— ${info.issuer}`,info.date&&`(${info.date})`,skills.length&&`— ${skills.join('، ')}`].filter(Boolean).join(' ');return[info.course||info.title,info.issuer&&`— ${info.issuer}`,info.date&&`(${info.date})`,skills.length&&`— ${skills.join(', ')}`].filter(Boolean).join(' ')}
