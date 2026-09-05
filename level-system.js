export const VISIBLE_LEVEL_MAX=20;
export const FUTURE_LEVEL_LABEL='21+';
export const XP_SYSTEM_MAX=1000000;
export const LEVEL_THRESHOLDS=[0,300,650,1050,1525,2075,2700,3400,4200,5100,6100,7200,8400,9700,11100,12600,14250,16050,17950,19950,22150];
export const LEVEL_REWARDS=[
 {level:1,icon:'🎓',title:'طالب شذرات',description:'بدء رحلة المستويات وفتح 3 ثيمات أساسية للملف الشخصي.',type:'badge'},
 {level:2,icon:'🌅',title:'Sunrise Kingdom + Nebula',description:'فتح مملكة الشروق وثيم Nebula للملف الشخصي.',type:'profile'},
 {level:3,icon:'🌃',title:'Neon Rain + ألوان الاسم',description:'فتح ثيم مدينة النيون مع ألوان إضافية للاسم.',type:'profile'},
 {level:4,icon:'🌳',title:'Moon Tree + إطار',description:'فتح ثيم شجرة القمر وإطار أزرق للصورة الشخصية.',type:'profile'},
 {level:5,icon:'🚀',title:'Cosmic Deck + Motivation',description:'فتح ثيم منصة المجرة وقالبين Premium من Motivation Letter.',type:'profile'},
 {level:6,icon:'🏜️',title:'Desert Rider + Anime Dusk',description:'فتح فارس الصحراء وثيم Anime Dusk للملف الشخصي.',type:'profile'},
 {level:7,icon:'🌌',title:'Aurora Lake + قوالب CV',description:'فتح بحيرة الشفق وقالبين Premium للسيرة الذاتية.',type:'profile'},
 {level:8,icon:'🌊',title:'Moonlit Sea + طالب نشيط',description:'فتح بحر القمر وشارة طالب نشيط.',type:'profile'},
 {level:9,icon:'📄',title:'قالبان CV إضافيان',description:'فتح قالبين Premium إضافيين للسيرة الذاتية.',type:'cv'},
 {level:10,icon:'✍️',title:'كل قوالب Motivation',description:'فتح القوالب الثلاثة Premium المتبقية.',type:'motivation'},
 {level:11,icon:'📄',title:'كل قوالب CV',description:'فتح آخر قالب Premium للسيرة الذاتية.',type:'cv'},
 {level:12,icon:'🌳',title:'ثيم Luminous Tree',description:'فتح ثيم الشجرة المضيئة للملف الشخصي.',type:'profile'},
 {level:13,icon:'✨',title:'تأثير الاسم + Glow',description:'فتح تأثير خفيف للاسم وإطار Glow جديد.',type:'profile'},
 {level:14,icon:'📂',title:'مساحة ملفات أكبر',description:'رفع حد النسخ المحفوظة من CV وMotivation داخل الحساب.',type:'files'},
 {level:15,icon:'🎟️',title:'خصم 15%',description:'خصم 15% على خدمة واحدة مؤهلة + شارة برونزية.',type:'discount',discount:15},
 {level:16,icon:'🎨',title:'لون الحساب الخاص',description:'فتح اختيار لون أساسي خاص لملفك الشخصي.',type:'profile'},
 {level:17,icon:'🖼️',title:'3 إطارات جديدة',description:'فتح الإطارات الفضي والذهبي والماسي.',type:'profile'},
 {level:18,icon:'🏆',title:'Badge Showcase',description:'عرض حتى 3 شارات تختارها في ملفك.',type:'badge'},
 {level:19,icon:'🌙',title:'ثيم Midnight',description:'فتح ثيم Midnight الداكن للملف الشخصي.',type:'profile'},
 {level:20,icon:'🎁',title:'صندوق Level 20',description:'إطار حصري + شارة فضية + تخصيص كامل للملف.',type:'milestone'}
];
export const CV_TEMPLATE_LEVELS={creative:7,executive:7,timeline:9,editorial:9,technical:11};
export const MOTIVATION_TEMPLATE_LEVELS={executive:5,editorial:5,creative:10,technical:10,serif:10};
export const PROFILE_THEMES=[
 {id:'default',label:'شذرات الأزرق',level:1},{id:'sky',label:'Sky — سماوي',level:1},{id:'ocean',label:'Ocean — محيط',level:1},
 {id:'sunrise-kingdom',label:'Sunrise Kingdom — مملكة الغيوم',level:2},{id:'nebula',label:'Nebula — فضاء',level:2},
 {id:'neon-rain',label:'Neon Rain — مدينة النيون',level:3},{id:'moon-tree',label:'Moon Tree — شجرة القمر',level:4},
 {id:'cosmic-deck',label:'Cosmic Deck — المجرة',level:5},{id:'desert-rider',label:'Desert Rider — فارس الصحراء',level:6},
 {id:'anime-dusk',label:'Anime Dusk — مدينة وغروب',level:6},{id:'aurora-lake',label:'Aurora Lake — الشفق القطبي',level:7},
 {id:'moonlit-sea',label:'Moonlit Sea — بحر القمر',level:8},{id:'luminous-tree',label:'Luminous Tree — الشجرة المضيئة',level:12},
 {id:'midnight',label:'Midnight — ليلي',level:19}
];
export const PROFILE_NAME_COLORS=[{id:'white',label:'أبيض',value:'#ffffff',level:1},{id:'black',label:'أسود',value:'#111827',level:3},{id:'blue',label:'أزرق',value:'#bfdbfe',level:3},{id:'purple',label:'بنفسجي',value:'#ddd6fe',level:6},{id:'cyan',label:'سماوي',value:'#a5f3fc',level:6}];
export const PROFILE_FRAMES=[{id:'none',label:'بدون إطار',level:1},{id:'blue',label:'Blue Ring',level:4},{id:'glow',label:'Glow',level:13},{id:'silver',label:'Silver',level:17},{id:'gold',label:'Gold',level:17},{id:'diamond',label:'Diamond',level:17},{id:'elite',label:'Elite',level:20}];
export const PROFILE_BADGES=[{id:'student',label:'طالب شذرات',icon:'🎓',level:1},{id:'active',label:'طالب نشيط',icon:'🏅',level:8},{id:'bronze',label:'المستوى البرونزي',icon:'🥉',level:15},{id:'silver',label:'نخبة Level 20',icon:'🥈',level:20}];
export function levelFromXp(value=0){const xp=Math.min(XP_SYSTEM_MAX,Math.max(0,Number(value)||0));let level=1;for(let i=0;i<LEVEL_THRESHOLDS.length;i++)if(xp>=LEVEL_THRESHOLDS[i])level=i+1;return Math.min(VISIBLE_LEVEL_MAX+1,level)}
export function levelLabel(level){return Number(level)>VISIBLE_LEVEL_MAX?FUTURE_LEVEL_LABEL:String(Math.max(1,Number(level)||1))}
export function nextLevelInfo(value=0){const xp=Math.min(XP_SYSTEM_MAX,Math.max(0,Number(value)||0)),level=levelFromXp(xp);if(level>VISIBLE_LEVEL_MAX)return{level,label:FUTURE_LEVEL_LABEL,start:LEVEL_THRESHOLDS[VISIBLE_LEVEL_MAX],target:null,current:0,needed:0,remaining:0,percent:100,xp};const start=LEVEL_THRESHOLDS[level-1]||0,target=LEVEL_THRESHOLDS[level]||start,needed=Math.max(1,target-start),current=Math.max(0,xp-start);return{level,label:String(level),start,target,current,needed,remaining:Math.max(0,target-xp),percent:Math.min(100,Math.max(0,Math.floor(current/needed*100))),xp}}
export function journeyProgress(value=0){const info=nextLevelInfo(value);if(info.level>VISIBLE_LEVEL_MAX)return 100;return Math.min(100,Math.max(0,((info.level-1)+(info.percent/100))/VISIBLE_LEVEL_MAX*100))}
export function rewardForLevel(level){return LEVEL_REWARDS.find(r=>r.level===Number(level))||null}
export function templateRequiredLevel(kind,id){const map=kind==='cv'?CV_TEMPLATE_LEVELS:MOTIVATION_TEMPLATE_LEVELS;return Number(map[id]||1)}
export function isTemplateUnlocked(kind,id,level){return Number(level||1)>=templateRequiredLevel(kind,id)}
export function artifactSaveLimit(level){return Number(level||1)>=14?8:3}
if(typeof document!=='undefined'&&!document.querySelector('link[data-profile-art-themes]')){const link=document.createElement('link');link.rel='stylesheet';link.href='./profile-art-themes.css?v=6';link.dataset.profileArtThemes='1';document.head.appendChild(link)}
if(typeof document!=='undefined'&&!document.querySelector('link[data-profile-card-fixes]')){const link=document.createElement('link');link.rel='stylesheet';link.href='./profile-card-fixes.css?v=3';link.dataset.profileCardFixes='1';document.head.appendChild(link)}
if(typeof document!=='undefined'&&/\bprofile\.html$/i.test(location.pathname)&&!document.querySelector('script[data-public-profile-sync]')){const script=document.createElement('script');script.type='module';script.src='./profile-public-sync.js?v=2';script.dataset.publicProfileSync='1';document.head.appendChild(script)}
