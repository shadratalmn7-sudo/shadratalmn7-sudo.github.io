const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const rawLines=v=>String(v??'').split(/\n+/).map(clean).filter(Boolean);
const uniq=a=>[...new Set(a.map(clean).filter(Boolean))];
const hasArabic=v=>/[\u0600-\u06ff]/.test(String(v||''));

const fields=[
  {key:'cyber',ar:'الأمن السيبراني',en:'Cybersecurity',re:/cyber|cybersecurity|information security|امن سيبر|أمن سيبر|الامن السيبر|الأمن السيبر|امن المعلومات|أمن المعلومات/i},
  {key:'cs',ar:'علوم الحاسب',en:'Computer Science',re:/computer science|علوم الحاسب|علوم الكمبيوتر/i},
  {key:'programming',ar:'البرمجة وتطوير البرمجيات',en:'Software Development',re:/programming|coding|software development|برمج|تطوير برمج/i},
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
function fieldInfo(role=''){
  const r=clean(role);return fields.find(x=>x.re.test(r))||{key:'other',ar:hasArabic(r)?r:'المجال المستهدف',en:hasArabic(r)?'the intended field':r||'the intended field'}
}
function fieldName(role,lang){const f=fieldInfo(role);return lang==='ar'?f.ar:f.en}
function academicState(text=''){
  const t=clean(text);return{
    highSchoolGraduate:/خريج.{0,35}(ثان|ثانوية)|خلصت.{0,30}(ثان|ثانوية)|انتهيت.{0,30}(ثان|ثانوية)|اكملت.{0,30}(ثان|ثانوية)|أكملت.{0,30}(ثان|ثانوية)|completed.{0,35}high school|high school graduate|secondary school graduate/i.test(t),
    highSchoolStudent:/طالب.{0,28}(ثان|ثانوية)|high school student|secondary school student/i.test(t),
    bachelorApplicant:/اقدم.{0,35}بكالوريوس|أقدم.{0,35}بكالوريوس|مقدم.{0,35}بكالوريوس|متقدم.{0,35}بكالوريوس|بقدم.{0,35}بكالوريوس|applying.{0,40}bachelor|bachelor.?s applicant|seeking.{0,32}bachelor/i.test(t),
    bachelorStudent:/طالب.{0,32}بكالوريوس|ادرس.{0,32}بكالوريوس|أدرس.{0,32}بكالوريوس|bachelor.?s student|undergraduate student/i.test(t),
    bachelorGraduate:/خريج.{0,32}بكالوريوس|حاصل.{0,32}بكالوريوس|انهيت.{0,32}بكالوريوس|أنهيت.{0,32}بكالوريوس|bachelor.?s graduate|bachelor.?s degree holder|completed.{0,32}bachelor/i.test(t),
    masterApplicant:/اقدم.{0,32}ماجستير|أقدم.{0,32}ماجستير|متقدم.{0,32}ماجستير|applying.{0,40}master|master.?s applicant/i.test(t),
    masterStudent:/طالب.{0,32}ماجستير|ادرس.{0,32}ماجستير|أدرس.{0,32}ماجستير|master.?s student/i.test(t),
    masterGraduate:/خريج.{0,32}ماجستير|حاصل.{0,32}ماجستير|master.?s graduate|master.?s degree holder/i.test(t)
  }
}
function professionalState(text=''){
  const t=clean(text),years=(t.match(/(?:خبرة|خبرتي|اشتغلت|عملت|experience|worked)[^\d]{0,35}(\d{1,2})\s*(?:سنوات|سنة|عام|years?|yrs?)/i)||t.match(/(\d{1,2})\s*(?:سنوات|سنة|عام)\s*(?:خبرة|عمل)/i)||[])[1]||'';
  return{employed:/موظف|اعمل|أعمل|اشتغل|أشتغل|currently work|currently employed|working as|employed as/i.test(t),jobSeeker:/ابحث عن عمل|أبحث عن عمل|ابحث عن وظيفة|أبحث عن وظيفة|باحث عن عمل|looking for (?:a )?job|seeking (?:a )?(?:job|role|position|opportunity)|open to work/i.test(t),experienced:/خبرة|خبرتي|اشتغلت|عملت|worked|experience/i.test(t),internship:/تدريب تعاوني|متدرب|تدريب عملي|internship|intern\b|trainee/i.test(t),years:Number(years||0)}
}
function extractGpa(text=''){const m=String(text).match(/(?:معدل|gpa|grade|score)\s*[:：-]?\s*(\d{1,3}(?:\.\d+)?\s*%?)/i)||String(text).match(/\b(\d{2,3}(?:\.\d+)\s*%)\b/);return m?.[1]?.replace(/\s/g,'')||''}
function extractYear(text=''){const years=[...String(text).matchAll(/\b(19\d{2}|20\d{2})\b/g)].map(m=>m[1]);return years.at(-1)||''}
function extractInstitution(text=''){
  const t=clean(text),ar=t.match(/((?:ثانوية|مدرسة|جامعة|كلية|معهد)\s+[^،.;]{2,90})/i),en=t.match(/((?:high school|secondary school|university|college|institute)\s+[^,.;]{2,90})/i),m=ar||en;if(!m)return'';
  return clean(m[1].split(/\s+(?:بمعدل|معدل|عام|سنة|في عام|وتقدير|ومقدم|ومتقدم|with|gpa|grade|year|applying)\b/i)[0])
}
function normalizeSkills(values,lang){
  const out=[];for(const raw of values){const x=clean(raw);if(!x)continue;const hit=skillCatalog.find(s=>s.re.test(x));out.push(hit?(lang==='ar'?hit.ar:hit.en):(hasArabic(x)&&lang==='en'?'Related technical knowledge':x))}return uniq(out)
}
function formalLanguage(raw,lang){
  return uniq(String(raw||'').split(/[|،,;\n]+/).map(clean).filter(Boolean).map(x=>{
    if(lang==='ar'){
      if(/العربي|arabic/i.test(x))return /أم|native/i.test(x)?'العربية — لغة أم':'العربية';
      if(/english|انجليزي|إنجليزي/i.test(x))return /b2/i.test(x)?'الإنجليزية — B2':'الإنجليزية';
      if(/russian|روسي/i.test(x))return /b1/i.test(x)?'الروسية — B1':'الروسية';
    }else{
      if(/العربي|arabic/i.test(x))return /أم|native/i.test(x)?'Arabic — Native':'Arabic';
      if(/english|انجليزي|إنجليزي/i.test(x))return /b2/i.test(x)?'English — B2':'English';
      if(/russian|روسي/i.test(x))return /b1/i.test(x)?'Russian — B1':'Russian';
    }return x
  })).join(' | ')
}
function headline(lang,state,pState,field){
  if(lang==='ar'){
    if(state.highSchoolGraduate&&state.bachelorApplicant)return `خريج ثانوية يستعد لبدء دراسة البكالوريوس في ${field}`;
    if(state.highSchoolGraduate)return `خريج ثانوية يركز على بناء مسار أكاديمي في ${field}`;
    if(state.highSchoolStudent)return `طالب ثانوي يستعد للدراسة الجامعية في ${field}`;
    if(state.bachelorStudent)return `طالب بكالوريوس يطوّر مساره في ${field}`;
    if(state.bachelorGraduate&&state.masterApplicant)return `خريج بكالوريوس يستعد للدراسات العليا في ${field}`;
    if(state.bachelorGraduate)return `خريج بكالوريوس ذو توجه مهني في ${field}`;
    if(state.masterStudent)return `طالب ماجستير في ${field}`;
    if(pState.employed||pState.experienced)return `ملف مهني موجه إلى ${field}`;
    return `ملف أكاديمي موجه إلى ${field}`
  }
  if(state.highSchoolGraduate&&state.bachelorApplicant)return `High School Graduate Preparing for Bachelor's Study in ${field}`;
  if(state.highSchoolGraduate)return `High School Graduate Building an Academic Path in ${field}`;
  if(state.highSchoolStudent)return `High School Student Preparing for University Study in ${field}`;
  if(state.bachelorStudent)return `Bachelor's Student Developing a Path in ${field}`;
  if(state.bachelorGraduate&&state.masterApplicant)return `Bachelor's Graduate Preparing for Master's Study in ${field}`;
  if(state.bachelorGraduate)return `Bachelor's Graduate Focused on ${field}`;
  if(state.masterStudent)return `Master's Student in ${field}`;
  if(pState.employed||pState.experienced)return `Professional Profile Focused on ${field}`;
  return `Academic Profile Focused on ${field}`
}
function summaryText(lang,state,pState,field,{certificateCount,skills,educationKnown,experienceKnown}){
  const focus=skills.slice(0,5).join(lang==='ar'?'، ':', '),parts=[];
  if(lang==='ar'){
    if(state.highSchoolGraduate&&state.bachelorApplicant)parts.push(`يمثل هذا الملف طالبًا أنهى المرحلة الثانوية ويستعد للانتقال إلى التعليم الجامعي عبر مسار بكالوريوس مرتبط بـ ${field}.`);
    else if(state.highSchoolGraduate)parts.push(`يعكس هذا الملف خلفية تعليمية مكتملة في المرحلة الثانوية مع توجه واضح نحو مواصلة الدراسة في ${field}.`);
    else if(state.bachelorStudent)parts.push(`يعرض هذا الملف مسار طالب بكالوريوس يعمل على توسيع معارفه الأكاديمية والتطبيقية في ${field}.`);
    else if(state.bachelorGraduate&&state.masterApplicant)parts.push(`يعرض هذا الملف خلفية بكالوريوس مكتملة مع استعداد للانتقال إلى الدراسات العليا في ${field}.`);
    else if(pState.employed||pState.experienced)parts.push(`يعرض هذا الملف خلفية مهنية تتجه إلى تطوير الخبرة والقدرات ذات الصلة بـ ${field}.`);
    else parts.push(`يعرض هذا الملف توجهًا أكاديميًا منظمًا نحو ${field} بالاعتماد على المعلومات الموثقة التي أُدخلت في السيرة.`);
    if(educationKnown)parts.push('تمت صياغة الخلفية التعليمية بصورة تبرز المرحلة الحالية والانتقال المنطقي إلى الخطوة الأكاديمية التالية بدل تكرار وصف المستخدم بصيغته الأصلية.');
    if(certificateCount)parts.push(`يدعم هذا المسار سجل من ${certificateCount===1?'شهادة أو إنجاز موثق':'الشهادات والإنجازات الموثقة'} يعكس الاستمرار في التعلم خارج المتطلبات الأساسية.`);
    if(focus)parts.push(`وتتركز مجالات المعرفة المذكورة أو المستخرجة من الشهادات حول ${focus}، بما يمنح الملف اتجاهًا أكثر اتساقًا مع الهدف المستقبلي.`);
    if(experienceKnown)parts.push('كما يضم الملف أنشطة أو خبرات عملية أعيدت صياغتها لتوضيح القيمة التي أضافتها إلى الاستعداد الأكاديمي أو المهني.');
    parts.push('يهدف هذا العرض إلى تقديم صورة مهنية متماسكة وقابلة للمراجعة السريعة، مع الاعتماد على الحقائق المتوفرة فقط دون إضافة خبرة أو إنجاز غير مذكور.');
  }else{
    if(state.highSchoolGraduate&&state.bachelorApplicant)parts.push(`This profile represents a high school graduate preparing to transition into university through a Bachelor's pathway related to ${field}.`);
    else if(state.highSchoolGraduate)parts.push(`This profile reflects completed secondary education and a clear intention to continue academic development in ${field}.`);
    else if(state.bachelorStudent)parts.push(`This profile presents a Bachelor's student building stronger academic and practical foundations in ${field}.`);
    else if(state.bachelorGraduate&&state.masterApplicant)parts.push(`This profile presents a completed Bachelor's background and preparation for graduate study in ${field}.`);
    else if(pState.employed||pState.experienced)parts.push(`This profile presents professional experience directed toward further development in ${field}.`);
    else parts.push(`This profile presents a structured academic direction toward ${field}, based only on the information documented in the CV.`);
    if(educationKnown)parts.push('The educational background has been rewritten to emphasize academic stage, progression, and readiness for the next step rather than repeating the applicant’s original wording.');
    if(certificateCount)parts.push(`The profile is supported by ${certificateCount===1?'a documented certificate or achievement':'documented certificates and achievements'} that demonstrate continued learning beyond core requirements.`);
    if(focus)parts.push(`The documented areas of focus include ${focus}, giving the profile a clearer connection to the intended direction.`);
    if(experienceKnown)parts.push('Projects and activities are presented in professional language that emphasizes their contribution to academic or career readiness.');
    parts.push('The result is designed to be concise, professional, and evidence-based, without introducing experience or achievements that were not provided.');
  }
  return parts.join(' ')
}
function educationItems(data,lang,state,field){
  const text=clean(`${data.education||''} ${data.summary||''}`),gpa=extractGpa(text),year=extractYear(text),institution=extractInstitution(text),out=[];
  if(lang==='ar'){
    if(state.highSchoolGraduate)out.push(`${institution||'المرحلة الثانوية'} — أتم الدراسة بنجاح${gpa?` بمعدل ${gpa}`:''}${year?`، عام ${year}`:''}.`);
    else if(state.highSchoolStudent)out.push(`${institution||'المرحلة الثانوية'} — دراسة ثانوية قيد الإكمال${gpa?` بمعدل حالي ${gpa}`:''}.`);
    if(state.bachelorApplicant)out.push(`الهدف الأكاديمي الحالي: الالتحاق ببرنامج بكالوريوس في ${field} والانتقال إلى دراسة جامعية متخصصة.`);
    else if(state.bachelorStudent)out.push(`الدراسة الجامعية الحالية: مسار بكالوريوس مرتبط بـ ${field} مع التركيز على بناء أساس أكاديمي وتطبيقي متين.`);
    else if(state.bachelorGraduate)out.push(`المؤهل الجامعي: درجة بكالوريوس مكتملة، مع توجيه المرحلة التالية نحو ${field}.`);
    if(state.masterApplicant)out.push(`الهدف الأكاديمي التالي: الالتحاق ببرنامج ماجستير يوسّع التخصص والخبرة في ${field}.`);
    else if(state.masterStudent)out.push(`الدراسات العليا: برنامج ماجستير قيد الدراسة في ${field}.`);
    if(out.length)out.push(`اتجاه التطوير الأكاديمي: تعزيز المعرفة النظرية وربطها بالتطبيق العملي بما يخدم التخصص المستهدف.`);
    if(!out.length&&clean(data.education))out.push(`خلفية تعليمية تمهّد للمرحلة الأكاديمية التالية في ${field}.`);
  }else{
    if(state.highSchoolGraduate)out.push(`${institution||'Secondary Education'} — successfully completed${gpa?` with a final grade of ${gpa}`:''}${year?` in ${year}`:''}.`);
    else if(state.highSchoolStudent)out.push(`${institution||'Secondary Education'} — currently in progress${gpa?` with a current grade of ${gpa}`:''}.`);
    if(state.bachelorApplicant)out.push(`Current academic objective: admission to a Bachelor's program in ${field} and transition into specialized university study.`);
    else if(state.bachelorStudent)out.push(`Current university stage: Bachelor's-level study related to ${field}, with emphasis on strong academic and practical foundations.`);
    else if(state.bachelorGraduate)out.push(`University qualification: completed Bachelor's degree with the next stage directed toward ${field}.`);
    if(state.masterApplicant)out.push(`Next academic objective: admission to a Master's program that deepens specialization in ${field}.`);
    else if(state.masterStudent)out.push(`Graduate study: Master's program currently in progress in ${field}.`);
    if(out.length)out.push(`Academic development focus: strengthening theoretical knowledge and connecting it with practical application in the intended field.`);
    if(!out.length&&clean(data.education))out.push(`Educational background supporting the next academic stage in ${field}.`);
  }
  return uniq(out)
}
function experienceCategory(line=''){
  const t=clean(line);
  if(/موقع|منصة|web|website|frontend|backend|html|css/i.test(t))return'web';
  if(/python|بايثون|program|coding|برمج|software/i.test(t))return'code';
  if(/تطوع|volunteer|community service/i.test(t))return'volunteer';
  if(/مسابقة|أولمبياد|competition|olympiad|hackathon/i.test(t))return'competition';
  if(/بحث|research|report|تقرير/i.test(t))return'research';
  if(/تدريب|intern|training|course project/i.test(t))return'training';
  if(/عمل|وظيفة|موظف|worked|job|employment/i.test(t))return'work';
  return'activity'
}
function experienceItems(data,lang,field){
  const rows=rawLines(data.experience),cats=uniq(rows.map(experienceCategory)),out=[];
  for(const c of cats){
    if(lang==='ar'){
      if(c==='web')out.push('طوّر مشروعًا أو منصة رقمية، ما أتاح تطبيق مهارات تنظيم المحتوى وبناء تجربة استخدام عملية ضمن بيئة ويب.');
      else if(c==='code')out.push('طبّق مفاهيم برمجية في أنشطة عملية أو مشروعات شخصية، مع التركيز على تحويل المعرفة النظرية إلى مخرجات قابلة للاستخدام.');
      else if(c==='volunteer')out.push('شارك في نشاط تطوعي عزز الانضباط والعمل مع الآخرين وتحمل المسؤولية خارج الإطار الدراسي المباشر.');
      else if(c==='competition')out.push('شارك في نشاط تنافسي أو أكاديمي ساعد على تطوير الاستعداد لحل المشكلات والعمل تحت متطلبات محددة.');
      else if(c==='research')out.push('مارس جمع المعلومات وتحليلها وتنظيمها ضمن نشاط بحثي أو تقريري، بما يدعم القدرة على التعامل المنهجي مع المصادر.');
      else if(c==='training')out.push('استفاد من تجربة تدريبية عملية لتوسيع المعرفة وربط التعلم بالمهارات المطلوبة في بيئة تطبيقية.');
      else if(c==='work')out.push('اكتسب خبرة عملية دعمت الالتزام بالمسؤوليات والتعامل مع متطلبات العمل بصورة منظمة.');
      else out.push('شارك في نشاط عملي أو خارج المنهج أسهم في تطوير الجدية والتنظيم والاستعداد للمرحلة الأكاديمية أو المهنية التالية.');
    }else{
      if(c==='web')out.push('Developed a digital or web-based project, applying content organization and practical user-experience considerations in a real implementation context.');
      else if(c==='code')out.push('Applied programming concepts through hands-on or personal projects, translating theoretical learning into usable outputs.');
      else if(c==='volunteer')out.push('Participated in volunteer activity that strengthened responsibility, teamwork, and engagement beyond formal academic requirements.');
      else if(c==='competition')out.push('Took part in an academic or competitive activity that supported problem-solving and performance under defined requirements.');
      else if(c==='research')out.push('Practiced information gathering, analysis, and structured reporting through research-oriented activity.');
      else if(c==='training')out.push('Used practical training to expand knowledge and connect academic learning with applied skills.');
      else if(c==='work')out.push('Gained practical experience that strengthened reliability, organization, and responsibility in a work setting.');
      else out.push('Participated in a practical or extracurricular activity that contributed to organization, initiative, and readiness for the next academic or professional stage.');
    }
  }
  if(!out.length){
    if(lang==='ar'){
      out.push(`يركز التطوير الحالي على بناء أساس متدرج في ${field} قبل الانتقال إلى متطلبات أكثر تخصصًا.`);
      out.push('يتم دعم هذا المسار بالتعلم الذاتي والشهادات أو المهارات الموثقة الموجودة في الملف، مع تجنب إدراج خبرة عملية غير مثبتة.');
      out.push('الأولوية في المرحلة الحالية هي تحويل المعرفة المكتسبة إلى تطبيقات ومشروعات عملية قابلة للعرض والتقييم مستقبلاً.');
    }else{
      out.push(`Current development is focused on building a progressive foundation in ${field} before moving into more specialized requirements.`);
      out.push('This direction is supported by documented learning, certificates, and skills in the profile without presenting unverified work experience.');
      out.push('The present priority is to convert acquired knowledge into practical projects and evidence that can be evaluated in future academic or professional applications.');
    }
  }
  return uniq(out).slice(0,5)
}
function developmentAdditions(lang,field,skills,certificateCount){
  const focus=skills.slice(0,5).join(lang==='ar'?'، ':', '),out=[];
  if(lang==='ar'){
    out.push(`اتجاه الملف: بناء مسار متماسك في ${field} يجمع بين الاستعداد الأكاديمي والتعلم التطبيقي.`);
    if(focus)out.push(`مجالات التركيز الحالية: ${focus}، مع ترتيبها بما يخدم التخصص المستهدف بدل عرضها كعناصر منفصلة.`);
    if(certificateCount)out.push('تعكس الشهادات المرفقة اهتمامًا بالتعلم المنظم والاستمرار في تطوير المعرفة خارج الدراسة الأساسية.');
  }else{
    out.push(`Profile direction: building a coherent path in ${field} that combines academic preparation with applied learning.`);
    if(focus)out.push(`Current focus areas include ${focus}, organized around the intended field rather than presented as disconnected keywords.`);
    if(certificateCount)out.push('The documented certificates reflect structured learning and continued development beyond core academic requirements.');
  }
  return out
}
export function buildSemanticCv(data,{certificateCount=0,skills=[]}={}){
  const lang=data.lang==='ar'?'ar':'en',allText=[data.summary,data.education,data.experience,data.role].map(clean).join(' '),state=academicState(allText),pState=professionalState(allText),field=fieldName(data.role,lang),normalizedSkills=normalizeSkills(skills,lang),education=educationItems(data,lang,state,field),experience=experienceItems(data,lang,field),supplement=developmentAdditions(lang,field,normalizedSkills,certificateCount);
  const summary=summaryText(lang,state,pState,field,{certificateCount,skills:normalizedSkills,educationKnown:!!clean(data.education),experienceKnown:rawLines(data.experience).length>0});
  const experienceTitle=rawLines(data.experience).length?(lang==='ar'?'الخبرات والمشاريع والأنشطة':'EXPERIENCE, PROJECTS & ACTIVITIES'):(lang==='ar'?'التطوير الأكاديمي والاستعداد':'ACADEMIC DEVELOPMENT & READINESS');
  return{headline:headline(lang,state,pState,field),summary,education:uniq([...education,...supplement.slice(0,2)]),experience:uniq([...experience,...supplement.slice(2)]),experienceTitle,skills:normalizedSkills,languages:formalLanguage(data.languages,lang),mode:(pState.employed||pState.experienced)&&!(state.highSchoolStudent||state.bachelorStudent||state.bachelorApplicant||state.masterApplicant)?'professional':'academic'}
}
