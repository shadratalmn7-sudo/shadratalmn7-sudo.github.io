const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const rawLines=v=>String(v||'').split(/\n+/).map(clean).filter(Boolean);
const hasArabic=v=>/[\u0600-\u06ff]/.test(String(v||''));
const sentence=v=>clean(v).replace(/[.،,;؛:]+$/,'');

const fields=[
  {ar:'الأمن السيبراني',en:'Cybersecurity',re:/cyber|cybersecurity|information security|امن سيبر|أمن سيبر|الامن السيبر|الأمن السيبر|امن المعلومات|أمن المعلومات/i},
  {ar:'علوم الحاسب',en:'Computer Science',re:/computer science|علوم الحاسب|علوم الكمبيوتر/i},
  {ar:'البرمجة',en:'Computer Programming',re:/programming|coding|software|برمج|كود/i},
  {ar:'الذكاء الاصطناعي',en:'Artificial Intelligence',re:/artificial intelligence|machine learning|\bai\b|ذكاء اصطناعي|تعلم آلي/i},
  {ar:'علوم وتحليل البيانات',en:'Data Science and Analytics',re:/data science|data analysis|analytics|علوم البيانات|تحليل البيانات/i},
  {ar:'الشبكات',en:'Computer Networking',re:/network|networking|شبكات/i},
  {ar:'إدارة الأعمال',en:'Business Administration',re:/business administration|business|ادارة اعمال|إدارة أعمال/i},
  {ar:'الطب',en:'Medicine',re:/medicine|medical|طب|طبي/i},
  {ar:'الهندسة',en:'Engineering',re:/engineering|هندسه|هندسة/i}
];
export function fieldName(role,lang='en'){
  const r=clean(role);if(!r)return'';
  const found=fields.find(x=>x.re.test(r));if(found)return lang==='ar'?found.ar:found.en;
  if(lang==='ar')return hasArabic(r)?sentence(r):r;
  return hasArabic(r)?'the intended field of study':sentence(r);
}
export function academicState(text=''){
  const t=clean(text);
  return{
    highSchoolGraduate:/خريج.{0,20}(ثان|ثانوية)|انتهيت.{0,15}(ثان|ثانوية)|خلصت.{0,15}(ثان|ثانوية)|اكملت.{0,15}(ثان|ثانوية)|أكملت.{0,15}(ثان|ثانوية)|completed.{0,20}high school|high school graduate|secondary school graduate/i.test(t),
    highSchoolStudent:/طالب.{0,20}(ثان|ثانوية)|high school student|secondary school student/i.test(t),
    bachelorApplicant:/اقدم.{0,20}بكالوريوس|أقدم.{0,20}بكالوريوس|مقدم.{0,20}بكالوريوس|متقدم.{0,20}بكالوريوس|بقدم.{0,20}بكالوريوس|applying.{0,25}bachelor|bachelor.?s applicant|seeking.{0,20}bachelor/i.test(t),
    bachelorStudent:/طالب.{0,20}بكالوريوس|ادرس.{0,20}بكالوريوس|أدرس.{0,20}بكالوريوس|bachelor.?s student|undergraduate student/i.test(t),
    bachelorGraduate:/خريج.{0,20}بكالوريوس|حاصل.{0,20}بكالوريوس|bachelor.?s graduate|bachelor.?s degree holder/i.test(t),
    masterApplicant:/اقدم.{0,20}ماجستير|أقدم.{0,20}ماجستير|متقدم.{0,20}ماجستير|applying.{0,25}master|master.?s applicant/i.test(t),
    masterStudent:/طالب.{0,20}ماجستير|ادرس.{0,20}ماجستير|أدرس.{0,20}ماجستير|master.?s student/i.test(t)
  }
}
function extractGpa(text=''){
  const m=String(text).match(/(?:معدل|gpa|grade|score)\s*[:：-]?\s*(\d{1,3}(?:\.\d+)?\s*%?)/i)||String(text).match(/\b(\d{2,3}(?:\.\d+)\s*%)\b/);return m?.[1]?.replace(/\s/g,'')||'';
}
function extractYear(text=''){
  const years=[...String(text).matchAll(/\b(19\d{2}|20\d{2})\b/g)].map(m=>m[1]);return years.at(-1)||'';
}
function structuredEducationLines(text=''){
  return rawLines(text).filter(line=>{
    if(/خريج|انتهيت|خلصت|اكملت|أكملت|اقدم|أقدم|مقدم|متقدم|طالب|ادرس|أدرس|graduate|applying|student|completed/i.test(line))return false;
    return /(?:school|university|college|academy|مدرس|ثانوية|جامعة|كلية|أكاديمية)/i.test(line)&&(/[—–|-]/.test(line)||/\b(?:19|20)\d{2}\b/.test(line)||/\d+(?:\.\d+)?%/.test(line));
  }).slice(0,3);
}
function headline(data,lang,state,field){
  if(lang==='ar'){
    if(state.highSchoolGraduate&&state.bachelorApplicant)return field?`خريج ثانوية ومتقدم لبرنامج بكالوريوس في ${field}`:'خريج ثانوية ومتقدم لبرنامج بكالوريوس';
    if(state.highSchoolGraduate)return field?`خريج ثانوية يستهدف مواصلة الدراسة في ${field}`:'خريج ثانوية';
    if(state.highSchoolStudent)return field?`طالب ثانوي يستهدف دراسة ${field}`:'طالب في المرحلة الثانوية';
    if(state.bachelorStudent)return field?`طالب بكالوريوس في ${field}`:'طالب بكالوريوس';
    if(state.bachelorGraduate&&state.masterApplicant)return field?`خريج بكالوريوس ومتقدم لدراسة الماجستير في ${field}`:'خريج بكالوريوس ومتقدم لدراسة الماجستير';
    if(state.bachelorGraduate)return field?`خريج بكالوريوس في مسار مرتبط بـ ${field}`:'خريج بكالوريوس';
    if(state.masterStudent)return field?`طالب ماجستير في ${field}`:'طالب ماجستير';
    return field||'ملف أكاديمي ومهني';
  }
  if(state.highSchoolGraduate&&state.bachelorApplicant)return field?`High School Graduate | Bachelor's Applicant in ${field}`:"High School Graduate | Bachelor's Applicant";
  if(state.highSchoolGraduate)return field?`High School Graduate | Prospective ${field} Student`:'High School Graduate';
  if(state.highSchoolStudent)return field?`High School Student | Aspiring ${field} Student`:'High School Student';
  if(state.bachelorStudent)return field?`Bachelor's Student in ${field}`:"Bachelor's Student";
  if(state.bachelorGraduate&&state.masterApplicant)return field?`Bachelor's Graduate | Master's Applicant in ${field}`:"Bachelor's Graduate | Master's Applicant";
  if(state.bachelorGraduate)return field?`Bachelor's Graduate | ${field}`:"Bachelor's Graduate";
  if(state.masterStudent)return field?`Master's Student in ${field}`:"Master's Student";
  return field||'Academic and Professional Profile';
}
function education(data,lang,state,field){
  const text=clean(data.education),gpa=extractGpa(text),year=extractYear(text),out=structuredEducationLines(text);
  if(lang==='ar'){
    if(state.highSchoolGraduate)out.push(`المرحلة الثانوية — مكتملة${gpa?` بمعدل ${gpa}`:''}${year?`، ${year}`:''}.`);
    else if(state.highSchoolStudent)out.push(`المرحلة الثانوية — قيد الدراسة${gpa?`، المعدل الحالي ${gpa}`:''}.`);
    if(state.bachelorApplicant)out.push(`الهدف الأكاديمي: الالتحاق ببرنامج بكالوريوس${field?` في ${field}`:''}.`);
    else if(state.bachelorStudent)out.push(`الدراسة الجامعية: برنامج بكالوريوس${field?` في ${field}`:''} — قيد الدراسة.`);
    else if(state.bachelorGraduate)out.push(`درجة البكالوريوس — مكتملة${field?` في مسار مرتبط بـ ${field}`:''}.`);
    if(state.masterApplicant)out.push(`الهدف الأكاديمي: الالتحاق ببرنامج ماجستير${field?` في ${field}`:''}.`);
    else if(state.masterStudent)out.push(`الدراسات العليا: برنامج ماجستير${field?` في ${field}`:''} — قيد الدراسة.`);
    if(!out.length&&text)out.push(field?`خلفية تعليمية تمهّد لمواصلة الدراسة في ${field}.`:'خلفية تعليمية تمهّد للمرحلة الأكاديمية القادمة.');
  }else{
    if(state.highSchoolGraduate)out.push(`Secondary education — completed${gpa?` with a final grade of ${gpa}`:''}${year?` (${year})`:''}.`);
    else if(state.highSchoolStudent)out.push(`Secondary education — currently in progress${gpa?` with a current grade of ${gpa}`:''}.`);
    if(state.bachelorApplicant)out.push(`Academic objective: admission to a Bachelor's program${field?` in ${field}`:''}.`);
    else if(state.bachelorStudent)out.push(`Bachelor's studies${field?` in ${field}`:''} — currently in progress.`);
    else if(state.bachelorGraduate)out.push(`Bachelor's degree — completed${field?` in a field related to ${field}`:''}.`);
    if(state.masterApplicant)out.push(`Academic objective: admission to a Master's program${field?` in ${field}`:''}.`);
    else if(state.masterStudent)out.push(`Master's studies${field?` in ${field}`:''} — currently in progress.`);
    if(!out.length&&text)out.push(field?`Educational background supporting further study in ${field}.`:'Educational background supporting the next academic stage.');
  }
  return[...new Set(out)].slice(0,5);
}
function summary(data,lang,state,field,{certificateCount=0,skills=[]}={}){
  const listedSkills=skills.filter(Boolean).slice(0,5);
  if(lang==='ar'){
    const parts=[];
    if(state.highSchoolGraduate&&state.bachelorApplicant)parts.push(`خريج مرحلة ثانوية يستعد للانتقال إلى الدراسة الجامعية من خلال التقديم على برنامج بكالوريوس${field?` في ${field}`:''}.`);
    else if(state.highSchoolGraduate)parts.push(`خريج مرحلة ثانوية يعمل على بناء مسار أكاديمي منظم${field?` في ${field}`:''}.`);
    else if(state.highSchoolStudent)parts.push(`طالب في المرحلة الثانوية يركز على الاستعداد المبكر للدراسة الجامعية${field?` في ${field}`:''}.`);
    else if(state.bachelorStudent)parts.push(`طالب بكالوريوس يطوّر خلفيته الأكاديمية والتطبيقية${field?` في ${field}`:''}.`);
    else if(state.bachelorGraduate&&state.masterApplicant)parts.push(`خريج بكالوريوس يستعد للانتقال إلى مرحلة الدراسات العليا${field?` في ${field}`:''}.`);
    else parts.push(field?`صاحب ملف أكاديمي يركز على تطوير مساره في ${field}.`:'صاحب ملف أكاديمي يركز على بناء مسار دراسي ومهني منظم.');
    if(certificateCount)parts.push('يدعم هذا المسار سجل من الشهادات والإنجازات الموثقة التي تعكس الاستمرار في التعلم والتطوير.');
    if(listedSkills.length)parts.push(`وتشمل مجالات التركيز المذكورة في الملف ${listedSkills.join('، ')}، باعتبارها عناصر داعمة للهدف الأكاديمي.`);
    parts.push('يقدّم ملفه بصورة واضحة ومهنية مع التركيز على المعلومات القابلة للتوثيق والمرتبطة مباشرة بالمرحلة الدراسية القادمة.');
    return parts.join(' ');
  }
  const parts=[];
  if(state.highSchoolGraduate&&state.bachelorApplicant)parts.push(`High school graduate preparing for the transition to university through an application to a Bachelor's program${field?` in ${field}`:''}.`);
  else if(state.highSchoolGraduate)parts.push(`High school graduate building a focused academic pathway${field?` toward ${field}`:''}.`);
  else if(state.highSchoolStudent)parts.push(`High school student preparing early for university study${field?` in ${field}`:''}.`);
  else if(state.bachelorStudent)parts.push(`Bachelor's student developing academic and practical preparation${field?` in ${field}`:''}.`);
  else if(state.bachelorGraduate&&state.masterApplicant)parts.push(`Bachelor's graduate preparing for postgraduate study${field?` in ${field}`:''}.`);
  else parts.push(field?`Academic profile focused on continued development in ${field}.`:'Academic profile focused on structured educational and professional development.');
  if(certificateCount)parts.push('This direction is supported by documented certificates and achievements that demonstrate continued learning and preparation.');
  if(listedSkills.length)parts.push(`Key areas mentioned in the profile include ${listedSkills.join(', ')}, presented as supporting evidence for the academic objective.`);
  parts.push('The profile emphasizes clear, verifiable information that is directly relevant to the applicant’s next academic stage.');
  return parts.join(' ');
}
export function formalExperience(line,lang='en',field=''){
  const x=clean(line);if(!x)return'';
  const web=/موقع|ويب|website|web site|web project/i.test(x),python=/python|بايثون/i.test(x),volunteer=/تطوع|متطوع|volunteer/i.test(x),club=/نادي|club|student activity|نشاط طلابي/i.test(x),research=/بحث|research/i.test(x),competition=/مسابق|olympiad|competition|أولمبياد/i.test(x);
  if(lang==='ar'){
    if(web)return'تطوير مشروع موقع ويب كخبرة تطبيقية، مع التركيز على تنظيم المحتوى وبناء تجربة استخدام واضحة.';
    if(python)return'تنفيذ مشروع تطبيقي باستخدام Python بهدف تحويل المعرفة البرمجية إلى ممارسة عملية.';
    if(volunteer)return'المشاركة في نشاط تطوعي أسهم في تنمية المسؤولية والعمل ضمن بيئة تعاونية.';
    if(club)return'المشاركة في نشاط طلابي يدعم التواصل والعمل الجماعي وتطوير المبادرة.';
    if(research)return'إعداد أو المشاركة في نشاط بحثي بهدف تنظيم المعلومات وتحليلها وعرض النتائج بصورة منهجية.';
    if(competition)return'المشاركة في منافسة أو أولمبياد أكاديمي يعكس الاهتمام بالتعلم وتطبيق المعرفة في بيئة تنافسية.';
    return field?`خبرة أو نشاط داعم للمسار الأكاديمي في ${field}.`:'خبرة أو نشاط تطبيقي داعم للملف الأكاديمي.';
  }
  if(web)return'Developed a web project as practical experience, with emphasis on content organization and a clear user experience.';
  if(python)return'Completed a practical Python project to apply programming knowledge in a hands-on context.';
  if(volunteer)return'Participated in volunteer work that supported responsibility, collaboration, and community engagement.';
  if(club)return'Participated in a student activity that strengthened communication, teamwork, and initiative.';
  if(research)return'Completed or contributed to a research activity focused on organizing information, analysis, and structured presentation of findings.';
  if(competition)return'Participated in an academic competition or olympiad that reflects continued learning and application of knowledge in a competitive setting.';
  return field?`Practical or extracurricular experience supporting the academic direction in ${field}.`:'Practical or extracurricular experience supporting the academic profile.';
}
export function buildSemanticCv(data,{certificateCount=0,skills=[]}={}){
  const lang=data.lang==='ar'?'ar':'en',field=fieldName(data.role,lang),state=academicState(`${data.education||''} ${data.summary||''} ${data.role||''}`);
  return{
    lang,field,state,
    headline:headline(data,lang,state,field),
    summary:summary(data,lang,state,field,{certificateCount,skills}),
    education:education(data,lang,state,field),
    experience:rawLines(data.experience).map(x=>formalExperience(x,lang,field)).filter(Boolean)
  };
}
