const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const rawLines=v=>String(v??'').split(/\n+/).map(clean).filter(Boolean);
const uniq=a=>[...new Set(a.map(clean).filter(Boolean))];
const hasArabic=v=>/[\u0600-\u06ff]/.test(String(v||''));

const fields=[
  {key:'cyber',ar:'الأمن السيبراني',en:'Cybersecurity',re:/cyber|cybersecurity|information security|امن سيبر|أمن سيبر|الامن السيبر|الأمن السيبر|امن المعلومات|أمن المعلومات/i},
  {key:'cs',ar:'علوم الحاسب',en:'Computer Science',re:/computer science|علوم الحاسب|علوم الكمبيوتر/i},
  {key:'programming',ar:'تطوير البرمجيات',en:'Software Development',re:/programming|coding|software development|برمج|تطوير برمج/i},
  {key:'ai',ar:'الذكاء الاصطناعي',en:'Artificial Intelligence',re:/artificial intelligence|machine learning|\bai\b|ذكاء اصطناعي|تعلم آلي/i},
  {key:'data',ar:'علوم وتحليل البيانات',en:'Data Science and Analytics',re:/data science|data analysis|analytics|علوم البيانات|تحليل البيانات/i},
  {key:'network',ar:'الشبكات',en:'Computer Networking',re:/network|networking|شبكات/i},
  {key:'it',ar:'تقنية المعلومات',en:'Information Technology',re:/information technology|\bit\b|تقنية المعلومات|دعم فني|technical support/i},
  {key:'business',ar:'إدارة الأعمال',en:'Business Administration',re:/business administration|business|إدارة الأعمال|ادارة اعمال/i},
  {key:'accounting',ar:'المحاسبة',en:'Accounting',re:/accounting|accountant|محاسب|محاسبة/i},
  {key:'engineering',ar:'الهندسة',en:'Engineering',re:/engineering|engineer|هندسة|هندسه|مهندس/i},
  {key:'medicine',ar:'الطب والرعاية الصحية',en:'Healthcare',re:/medicine|medical|healthcare|طب|طبي|تمريض/i},
  {key:'marketing',ar:'التسويق',en:'Marketing',re:/marketing|digital marketing|تسويق/i}
];
const skillCatalog=[
  {ar:'الأمن السيبراني',en:'Cybersecurity',re:/cyber|security|أمن سيبر|الأمن السيبر|أمن المعلومات/i},
  {ar:'بايثون',en:'Python',re:/\bpython\b|بايثون/i},
  {ar:'البرمجة',en:'Programming',re:/programming|coding|برمجة|برمج/i},
  {ar:'الشبكات',en:'Networking',re:/network|شبكات/i},
  {ar:'تحليل البيانات',en:'Data Analysis',re:/data analysis|analytics|تحليل البيانات/i},
  {ar:'الذكاء الاصطناعي',en:'Artificial Intelligence',re:/artificial intelligence|machine learning|\bai\b|ذكاء اصطناعي|تعلم آلي/i},
  {ar:'الحوسبة السحابية',en:'Cloud Computing',re:/cloud|aws|azure|gcp|سحاب/i},
  {ar:'قواعد البيانات',en:'Databases',re:/database|sql|mysql|postgres|mongodb|قواعد البيانات/i},
  {ar:'لينكس',en:'Linux',re:/linux|ubuntu|لينكس/i},
  {ar:'تطوير الويب',en:'Web Development',re:/web|html|css|frontend|backend|موقع|ويب/i},
  {ar:'إدارة المشاريع',en:'Project Management',re:/project management|agile|scrum|pmp|إدارة المشاريع/i},
  {ar:'البحث',en:'Research',re:/research|بحث/i},
  {ar:'اللغة الإنجليزية',en:'English',re:/english|انجليزي|إنجليزي|اللغة الإنجليزية/i}
];
const focusCatalog={
  cyber:{ar:['حماية الأنظمة','أمن الشبكات','تحليل المخاطر','الممارسات الأمنية'],en:['Systems Security','Network Security','Risk Analysis','Security Practices']},
  cs:{ar:['حل المشكلات الحاسوبية','الخوارزميات','الأنظمة البرمجية','التفكير التحليلي'],en:['Computational Problem Solving','Algorithms','Software Systems','Analytical Thinking']},
  programming:{ar:['تصميم البرمجيات','منطق البرمجة','بناء التطبيقات','اختبار الحلول'],en:['Software Design','Programming Logic','Application Development','Solution Testing']},
  ai:{ar:['التعلم الآلي','معالجة البيانات','النمذجة','التفكير التحليلي'],en:['Machine Learning','Data Processing','Modeling','Analytical Thinking']},
  data:{ar:['تحليل البيانات','تنظيم البيانات','الاستنتاج','التصور البياني'],en:['Data Analysis','Data Organization','Inference','Data Visualization']},
  network:{ar:['بنية الشبكات','الاتصال','التوجيه','أمن الشبكات'],en:['Network Architecture','Connectivity','Routing','Network Security']},
  it:{ar:['أنظمة المعلومات','الدعم التقني','إدارة الأنظمة','البنية الرقمية'],en:['Information Systems','Technical Support','Systems Administration','Digital Infrastructure']},
  business:{ar:['التحليل الإداري','التخطيط','العمليات','اتخاذ القرار'],en:['Business Analysis','Planning','Operations','Decision Making']},
  accounting:{ar:['التقارير المالية','التحليل المالي','الدقة','تنظيم السجلات'],en:['Financial Reporting','Financial Analysis','Accuracy','Record Management']},
  engineering:{ar:['حل المشكلات','التصميم','التحليل','التطبيق العملي'],en:['Problem Solving','Design','Analysis','Practical Application']},
  medicine:{ar:['العلوم الصحية','التعلم السريري','الدقة','المسؤولية المهنية'],en:['Health Sciences','Clinical Learning','Accuracy','Professional Responsibility']},
  marketing:{ar:['سلوك الجمهور','المحتوى','التحليل','التواصل'],en:['Audience Behavior','Content','Analytics','Communication']},
  other:{ar:['التعلم المنظم','التفكير التحليلي','التطبيق العملي','التطوير المستمر'],en:['Structured Learning','Analytical Thinking','Practical Application','Continuous Development']}
};
function fieldInfo(role=''){const r=clean(role);return fields.find(x=>x.re.test(r))||{key:'other',ar:hasArabic(r)?r:'المجال المستهدف',en:hasArabic(r)?'the intended field':r||'the intended field'}}
function academicState(text=''){
  const t=clean(text);return{
    hsDone:/خريج.{0,35}(ثان|ثانوية)|خلصت.{0,30}(ثان|ثانوية)|انتهيت.{0,30}(ثان|ثانوية)|اكملت.{0,30}(ثان|ثانوية)|أكملت.{0,30}(ثان|ثانوية)|completed.{0,35}high school|high school graduate|secondary school graduate/i.test(t),
    hsNow:/طالب.{0,28}(ثان|ثانوية)|high school student|secondary school student/i.test(t),
    bachelorApply:/اقدم.{0,35}بكالوريوس|أقدم.{0,35}بكالوريوس|مقدم.{0,35}بكالوريوس|متقدم.{0,35}بكالوريوس|بقدم.{0,35}بكالوريوس|applying.{0,40}bachelor|bachelor.?s applicant|seeking.{0,32}bachelor/i.test(t),
    bachelorNow:/طالب.{0,32}بكالوريوس|ادرس.{0,32}بكالوريوس|أدرس.{0,32}بكالوريوس|bachelor.?s student|undergraduate student/i.test(t),
    bachelorDone:/خريج.{0,32}بكالوريوس|حاصل.{0,32}بكالوريوس|انهيت.{0,32}بكالوريوس|أنهيت.{0,32}بكالوريوس|bachelor.?s graduate|bachelor.?s degree holder|completed.{0,32}bachelor/i.test(t),
    masterApply:/اقدم.{0,32}ماجستير|أقدم.{0,32}ماجستير|متقدم.{0,32}ماجستير|applying.{0,40}master|master.?s applicant/i.test(t),
    masterNow:/طالب.{0,32}ماجستير|ادرس.{0,32}ماجستير|أدرس.{0,32}ماجستير|master.?s student/i.test(t)
  }
}
function professionalState(text=''){const t=clean(text);return{active:/موظف|اعمل|أعمل|اشتغل|أشتغل|خبرة|عملت|worked|experience|currently employed|working as/i.test(t),jobSeeker:/ابحث عن عمل|أبحث عن عمل|باحث عن عمل|looking for (?:a )?job|seeking (?:a )?(?:job|role|position)/i.test(t)}}
function extractGpa(text=''){const m=String(text).match(/(?:معدل|gpa|grade|score)\s*[:：-]?\s*(\d{1,3}(?:\.\d+)?\s*%?)/i)||String(text).match(/\b(\d{2,3}(?:\.\d+)\s*%)\b/);return m?.[1]?.replace(/\s/g,'')||''}
function extractYear(text=''){const years=[...String(text).matchAll(/\b(19\d{2}|20\d{2})\b/g)].map(m=>m[1]);return years.at(-1)||''}
function extractInstitution(text=''){
  const t=clean(text),m=t.match(/((?:ثانوية|مدرسة|جامعة|كلية|معهد|high school|secondary school|university|college|institute)\s+[^،,.;]{2,90})/i);if(!m)return'';
  return clean(m[1].split(/\s+(?:بمعدل|معدل|عام|سنة|في عام|وتقدير|ومقدم|ومتقدم|with|gpa|grade|year|applying)\b/i)[0])
}
function normalizeSkills(values,lang){const out=[];for(const raw of values){const x=clean(raw);if(!x)continue;const hit=skillCatalog.find(s=>s.re.test(x));out.push(hit?(lang==='ar'?hit.ar:hit.en):(hasArabic(x)&&lang==='en'?'Related Knowledge':x))}return uniq(out)}
function formalLanguage(raw,lang){return uniq(String(raw||'').split(/[|،,;\n]+/).map(clean).filter(Boolean).map(x=>{if(lang==='ar'){if(/العربي|arabic/i.test(x))return /أم|native/i.test(x)?'العربية — لغة أم':'العربية';if(/english|انجليزي|إنجليزي/i.test(x))return /b2/i.test(x)?'الإنجليزية — B2':'الإنجليزية';if(/russian|روسي/i.test(x))return /b1/i.test(x)?'الروسية — B1':'الروسية'}else{if(/العربي|arabic/i.test(x))return /أم|native/i.test(x)?'Arabic — Native':'Arabic';if(/english|انجليزي|إنجليزي/i.test(x))return /b2/i.test(x)?'English — B2':'English';if(/russian|روسي/i.test(x))return /b1/i.test(x)?'Russian — B1':'Russian'}return x})).join(' | ')}
function headline(lang,state,pState,field){
  if(lang==='ar'){
    if(state.hsDone&&state.bachelorApply)return `مرشح جامعي في مسار ${field}`;
    if(state.hsDone)return `مسار أكاديمي ناشئ في ${field}`;
    if(state.hsNow)return `استعداد مبكر للتخصص الجامعي في ${field}`;
    if(state.bachelorNow)return `مسار جامعي قيد التطوير في ${field}`;
    if(state.bachelorDone&&state.masterApply)return `انتقال إلى الدراسات العليا في ${field}`;
    if(state.bachelorDone)return `توجه أكاديمي ومهني في ${field}`;
    if(state.masterNow)return `مسار دراسات عليا في ${field}`;
    if(pState.active)return `توجه مهني متخصص في ${field}`;
    return `توجه أكاديمي نحو ${field}`
  }
  if(state.hsDone&&state.bachelorApply)return `University Candidate | ${field}`;
  if(state.hsDone)return `Emerging Academic Path | ${field}`;
  if(state.hsNow)return `Early University Preparation | ${field}`;
  if(state.bachelorNow)return `Developing Undergraduate Path | ${field}`;
  if(state.bachelorDone&&state.masterApply)return `Graduate Study Transition | ${field}`;
  if(state.bachelorDone)return `Academic & Professional Direction | ${field}`;
  if(state.masterNow)return `Graduate Academic Path | ${field}`;
  if(pState.active)return `Professional Direction | ${field}`;
  return `Academic Direction | ${field}`
}
function summaryText(lang,state,pState,field,{certificateCount,skills,educationKnown,experienceKnown}){
  const focus=skills.slice(0,5).join(lang==='ar'?'، ':', '),parts=[];
  if(lang==='ar'){
    if(state.hsDone&&state.bachelorApply)parts.push(`ينطلق هذا الملف من مرحلة تعليم ما قبل الجامعة مكتملة، مع استعداد واضح لبدء تعليم جامعي متخصص يرتبط بـ ${field}.`);
    else if(state.hsDone)parts.push(`يبني صاحب الملف خطوته الأكاديمية التالية على تعليم ما قبل الجامعة مكتمل وتوجه محدد نحو ${field}.`);
    else if(state.bachelorNow)parts.push(`يركز المسار الحالي على توسيع الأساس الجامعي وتطوير الاستعداد النظري والتطبيقي المرتبط بـ ${field}.`);
    else if(state.bachelorDone&&state.masterApply)parts.push(`تستند المرحلة المقبلة إلى مؤهل جامعي مكتمل مع توجه نحو تعميق التخصص من خلال الدراسات العليا في ${field}.`);
    else if(pState.active)parts.push(`يعرض الملف خبرة أو نشاطًا مهنيًا ضمن مسار يسعى إلى زيادة التخصص والفاعلية في ${field}.`);
    else parts.push(`يعرض الملف اتجاهًا دراسيًا منظمًا نحو ${field} بالاعتماد على الوقائع المتاحة في البيانات المدخلة.`);
    if(educationKnown)parts.push('تم تحويل المعلومات التعليمية إلى صورة توضح التسلسل الأكاديمي والاستعداد للمرحلة التالية من دون إعادة استخدام التعبير الأصلي للطالب.');
    if(certificateCount)parts.push(`يوجد كذلك رصيد موثق من ${certificateCount===1?'إنجاز تدريبي أو شهادة':'الإنجازات التدريبية والشهادات'} يدعم صورة التعلم المستمر خارج المتطلبات الدراسية الأساسية.`);
    if(focus)parts.push(`وتظهر في الملف مجالات معرفة مرتبطة بـ ${focus}، وهو ما يساعد على ربط عناصر السيرة بهدف واحد واضح بدل توزيعها كمعلومات منفصلة.`);
    if(experienceKnown)parts.push('أعيدت قراءة الأنشطة والخبرات من زاوية القيمة التي أضافتها إلى الاستعداد الأكاديمي أو العملي، وليس من زاوية وصف الحدث حرفيًا.');
    parts.push('النتيجة النهائية مصممة لتكون مهنية، مترابطة، وسريعة القراءة، مع الالتزام بالحقائق التي قدمها صاحب الملف فقط.');
  }else{
    if(state.hsDone&&state.bachelorApply)parts.push(`This profile begins from completed pre-university education and a clear transition toward specialized university study connected to ${field}.`);
    else if(state.hsDone)parts.push(`The next academic step is built on completed pre-university education and a defined direction toward ${field}.`);
    else if(state.bachelorNow)parts.push(`The current pathway is focused on strengthening undergraduate foundations and building applied readiness in ${field}.`);
    else if(state.bachelorDone&&state.masterApply)parts.push(`The next stage builds on a completed university qualification and a plan to deepen specialization through graduate study in ${field}.`);
    else if(pState.active)parts.push(`The profile reflects professional activity within a path aimed at greater specialization and effectiveness in ${field}.`);
    else parts.push(`The profile presents a structured academic direction toward ${field}, based on the factual information available in the form.`);
    if(educationKnown)parts.push('Educational details are converted into a clear academic progression and next-stage objective rather than repeating the applicant’s original wording.');
    if(certificateCount)parts.push(`The record also includes ${certificateCount===1?'a documented certificate or training achievement':'documented certificates and training achievements'} that support continued learning beyond core requirements.`);
    if(focus)parts.push(`Documented areas of knowledge include ${focus}, helping connect the different elements of the CV to one coherent objective.`);
    if(experienceKnown)parts.push('Activities and experience are interpreted by the value they add to academic or professional readiness rather than described word-for-word.');
    parts.push('The final presentation is designed to be professional, coherent, and easy to review while remaining limited to facts supplied by the applicant.');
  }
  return parts.join(' ')
}
function educationItems(data,lang,state,field){
  const text=clean(`${data.education||''} ${data.summary||''}`),gpa=extractGpa(text),year=extractYear(text),institution=extractInstitution(text),out=[];
  if(lang==='ar'){
    if(state.hsDone)out.push(`${institution||'التعليم ما قبل الجامعي'} — مرحلة مكتملة${gpa?` بنتيجة نهائية ${gpa}`:''}${year?`، ${year}`:''}.`);
    else if(state.hsNow)out.push(`${institution||'التعليم ما قبل الجامعي'} — مرحلة تعليمية مستمرة${gpa?` بنتيجة حالية ${gpa}`:''}.`);
    if(state.bachelorApply)out.push(`المرحلة التالية المخطط لها: بدء برنامج جامعي من مستوى البكالوريوس في ${field}.`);
    else if(state.bachelorNow)out.push(`المرحلة الحالية: دراسة جامعية من مستوى البكالوريوس ضمن مسار متصل بـ ${field}.`);
    else if(state.bachelorDone)out.push(`المؤهل الجامعي السابق: درجة بكالوريوس مكتملة، مع توجيه الخطوة التالية نحو ${field}.`);
    if(state.masterApply)out.push(`التطور الأكاديمي المستهدف: الانتقال إلى دراسة ماجستير تعمق المعرفة في ${field}.`);
    else if(state.masterNow)out.push(`الدراسات العليا: مسار ماجستير قيد الدراسة في ${field}.`);
    if(out.length)out.push('منهج التطوير: بناء قاعدة نظرية قوية ثم تحويلها تدريجيًا إلى تعلم تطبيقي ومخرجات قابلة للتقييم.');
    if(!out.length&&clean(data.education))out.push(`خلفية تعليمية تمثل قاعدة للانتقال إلى مرحلة أكثر تخصصًا في ${field}.`);
  }else{
    if(state.hsDone)out.push(`${institution||'Pre-University Education'} — completed${gpa?` with a final result of ${gpa}`:''}${year?` in ${year}`:''}.`);
    else if(state.hsNow)out.push(`${institution||'Pre-University Education'} — currently in progress${gpa?` with a current result of ${gpa}`:''}.`);
    if(state.bachelorApply)out.push(`Planned next stage: entry into a Bachelor's-level university program in ${field}.`);
    else if(state.bachelorNow)out.push(`Current stage: Bachelor's-level university study within a pathway connected to ${field}.`);
    else if(state.bachelorDone)out.push(`Previous university qualification: completed Bachelor's degree, with the next step directed toward ${field}.`);
    if(state.masterApply)out.push(`Targeted academic development: transition into Master's-level study to deepen knowledge in ${field}.`);
    else if(state.masterNow)out.push(`Graduate education: Master's-level study currently in progress in ${field}.`);
    if(out.length)out.push('Development approach: establish strong theoretical foundations and progressively convert them into applied learning and measurable outputs.');
    if(!out.length&&clean(data.education))out.push(`Educational background providing a foundation for a more specialized stage in ${field}.`);
  }
  return uniq(out)
}
function experienceCategory(line=''){
  const t=clean(line);if(/موقع|منصة|web|website|frontend|backend|html|css/i.test(t))return'web';if(/python|بايثون|program|coding|برمج|software/i.test(t))return'code';if(/تطوع|volunteer|community service/i.test(t))return'volunteer';if(/مسابقة|أولمبياد|competition|olympiad|hackathon/i.test(t))return'competition';if(/بحث|research|report|تقرير/i.test(t))return'research';if(/تدريب|intern|training/i.test(t))return'training';if(/عمل|وظيفة|موظف|worked|job|employment/i.test(t))return'work';return'activity'
}
function experienceItems(data,lang,field){
  const rows=rawLines(data.experience),cats=uniq(rows.map(experienceCategory)),out=[];
  for(const c of cats){
    if(lang==='ar'){
      if(c==='web')out.push('نفّذ تجربة رقمية عملية عززت فهمه لتنظيم المحتوى وبناء واجهات قابلة للاستخدام ضمن بيئة الويب.');
      else if(c==='code')out.push('حوّل مفاهيم برمجية إلى تطبيقات عملية، بما يدعم التفكير المنطقي والقدرة على بناء حلول تقنية قابلة للتطوير.');
      else if(c==='volunteer')out.push('أسهم في نشاط تطوعي أضاف خبرة في الالتزام والعمل مع الآخرين وتحمل المسؤولية خارج السياق الدراسي المباشر.');
      else if(c==='competition')out.push('خاض تجربة تنافسية أو أكاديمية دعمت سرعة التحليل وحل المشكلات ضمن متطلبات ووقت محددين.');
      else if(c==='research')out.push('مارس جمع المعلومات وتقييمها وتنظيم النتائج في سياق بحثي أو تقريري يدعم العمل المنهجي مع المصادر.');
      else if(c==='training')out.push('استخدم تجربة تدريبية لتقريب المعرفة النظرية من بيئة تطبيقية وتحديد الجوانب التي تحتاج إلى تطوير إضافي.');
      else if(c==='work')out.push('كوّن خبرة عملية ساعدت على رفع مستوى الانضباط وتنظيم المسؤوليات والتعامل مع متطلبات العمل.');
      else out.push('شارك في نشاط خارج المتطلبات الأساسية أضاف عنصرًا من المبادرة والتنظيم والاستعداد للمرحلة التالية.');
    }else{
      if(c==='web')out.push('Completed a practical digital experience that strengthened understanding of content organization and usable web interfaces.');
      else if(c==='code')out.push('Converted programming concepts into practical outputs, supporting logical thinking and the development of adaptable technical solutions.');
      else if(c==='volunteer')out.push('Contributed to volunteer activity that strengthened responsibility, collaboration, and engagement beyond formal academic requirements.');
      else if(c==='competition')out.push('Participated in a competitive or academic setting that supported analysis and problem-solving under defined requirements and time constraints.');
      else if(c==='research')out.push('Practiced gathering, evaluating, and organizing information in a research-oriented or reporting context.');
      else if(c==='training')out.push('Used a training experience to connect theoretical learning with practical context and identify areas for further development.');
      else if(c==='work')out.push('Built practical experience that strengthened reliability, organization, and the management of work responsibilities.');
      else out.push('Participated in an extracurricular or practical activity that added initiative, organization, and readiness for the next stage.');
    }
  }
  if(!out.length){
    if(lang==='ar'){
      out.push(`يركز التطوير الحالي على تأسيس معرفة متدرجة في ${field} قبل الانتقال إلى موضوعات أكثر تخصصًا.`);
      out.push('يعتمد المسار في مرحلته الحالية على التعلم المنظم والشهادات أو المعرفة الموثقة في الملف بدل تقديم خبرة عملية غير موجودة.');
      out.push('الخطوة التطويرية التالية هي تحويل المعرفة إلى مشروعات وتمارين تطبيقية يمكن عرضها وقياس تقدمها بوضوح.');
    }else{
      out.push(`Current development is focused on establishing progressive knowledge in ${field} before moving into more specialized topics.`);
      out.push('At this stage, the pathway relies on structured learning and documented certificates or knowledge rather than presenting work experience that has not been provided.');
      out.push('The next development step is to convert knowledge into practical projects and exercises with visible, measurable outcomes.');
    }
  }
  return uniq(out).slice(0,5)
}
function targetFocus(field,lang,skills){const base=focusCatalog[field.key]||focusCatalog.other,fromField=lang==='ar'?base.ar:base.en;return uniq([...skills,...fromField]).slice(0,8)}
function developmentAdditions(lang,fieldName,skills,certificateCount){const focus=skills.slice(0,5).join(lang==='ar'?'، ':', '),out=[];if(lang==='ar'){out.push(`اتجاه الملف: بناء مسار متماسك في ${fieldName} يجمع بين الاستعداد الأكاديمي والتعلم التطبيقي.`);if(focus)out.push(`مجالات التركيز الحالية: ${focus}، مرتبة بما يخدم الاتجاه المستهدف بدل ظهورها كعناصر منفصلة.`);if(certificateCount)out.push('يوضح سجل الشهادات استمرارًا في التعلم المنظم وتوسيع المعرفة خارج الدراسة الأساسية.')}else{out.push(`Profile direction: building a coherent pathway in ${fieldName} that combines academic preparation with applied learning.`);if(focus)out.push(`Current focus areas include ${focus}, organized around the intended direction rather than shown as disconnected items.`);if(certificateCount)out.push('The certificate record demonstrates structured learning and continued development beyond core academic requirements.')}return out}
export function buildSemanticCv(data,{certificateCount=0,skills=[]}={}){
  const lang=data.lang==='ar'?'ar':'en',allText=[data.summary,data.education,data.experience,data.role].map(clean).join(' '),state=academicState(allText),pState=professionalState(allText),field=fieldInfo(data.role),fieldLabel=lang==='ar'?field.ar:field.en,normalizedSkills=normalizeSkills(skills,lang),focus=targetFocus(field,lang,normalizedSkills),education=educationItems(data,lang,state,fieldLabel),experience=experienceItems(data,lang,fieldLabel),supplement=developmentAdditions(lang,fieldLabel,focus,certificateCount),summary=summaryText(lang,state,pState,fieldLabel,{certificateCount,skills:focus,educationKnown:!!clean(data.education),experienceKnown:rawLines(data.experience).length>0}),experienceTitle=rawLines(data.experience).length?(lang==='ar'?'الخبرات والمشاريع والأنشطة':'EXPERIENCE, PROJECTS & ACTIVITIES'):(lang==='ar'?'التطوير الأكاديمي والاستعداد':'ACADEMIC DEVELOPMENT & READINESS');
  return{headline:headline(lang,state,pState,fieldLabel),summary,education:uniq([...education,...supplement.slice(0,2)]),experience:uniq([...experience,...supplement.slice(2)]),experienceTitle,skills:normalizedSkills,focus,languages:formalLanguage(data.languages,lang),mode:pState.active&&!state.hsNow&&!state.bachelorNow&&!state.bachelorApply&&!state.masterApply?'professional':'academic'}
}
