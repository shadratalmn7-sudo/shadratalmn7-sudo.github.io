export const VISIBLE_LEVEL_MAX=20;
export const FUTURE_LEVEL_LABEL='21+';
export const XP_SYSTEM_MAX=9000;
// Cumulative XP needed to enter each visible level. Level 21+ begins at 1770 XP.
// The remaining XP capacity stays reserved for Levels 21-100 when those stages are designed.
export const LEVEL_THRESHOLDS=[0,50,110,175,245,320,400,485,575,670,770,870,970,1070,1170,1270,1370,1470,1570,1670,1770];

export const LEVEL_REWARDS=[
 {level:1,icon:'🎓',title:'طالب شذرات',description:'بدء رحلة المستويات وفتح شارة طالب شذرات.',type:'badge'},
 {level:2,icon:'🎨',title:'ثيم الملف الأول',description:'فتح ثيم Sky لتخصيص ملفك الشخصي.',type:'profile'},
 {level:3,icon:'🖌️',title:'ألوان الاسم',description:'فتح ألوان إضافية لاسمك الظاهر في الملف.',type:'profile'},
 {level:4,icon:'🪪',title:'إطار الصورة الأول',description:'فتح إطار أزرق للصورة الشخصية.',type:'profile'},
 {level:5,icon:'✍️',title:'قالبان Motivation',description:'فتح قالبين Premium من قوالب Motivation Letter.',type:'motivation'},
 {level:6,icon:'🌊',title:'حزمة ألوان وثيم',description:'فتح لونين إضافيين للاسم وثيم Ocean.',type:'profile'},
 {level:7,icon:'📄',title:'قالبان CV',description:'فتح قالبين Premium من قوالب السيرة الذاتية.',type:'cv'},
 {level:8,icon:'🏅',title:'طالب نشيط',description:'فتح شارة طالب نشيط وإمكانية اختيار الشارة الظاهرة.',type:'badge'},
 {level:9,icon:'📄',title:'قالبان CV إضافيان',description:'فتح قالبين Premium إضافيين للسيرة الذاتية.',type:'cv'},
 {level:10,icon:'✍️',title:'كل قوالب Motivation',description:'فتح القوالب الثلاثة Premium المتبقية.',type:'motivation'},
 {level:11,icon:'📄',title:'كل قوالب CV',description:'فتح آخر قالب Premium للسيرة الذاتية.',type:'cv'},
 {level:12,icon:'🎭',title:'Theme Pack',description:'فتح ثيم Midnight الداكن للملف الشخصي.',type:'profile'},
 {level:13,icon:'✨',title:'تأثير الاسم + إطار',description:'فتح تأثير خفيف للاسم وإطار Glow جديد.',type:'profile'},
 {level:14,icon:'📂',title:'مساحة ملفات أكبر',description:'رفع حد النسخ المحفوظة من CV وMotivation داخل الحساب.',type:'files'},
 {level:15,icon:'🎟️',title:'خصم 15%',description:'خصم 15% على خدمة واحدة مؤهلة + شارة برونزية.',type:'discount',discount:15},
 {level:16,icon:'🎨',title:'لون الحساب الخاص',description:'فتح اختيار لون أساسي خاص لملفك الشخصي.',type:'profile'},
 {level:17,icon:'🖼️',title:'3 إطارات جديدة',description:'فتح الإطارات الفضي والذهبي والماسي.',type:'profile'},
 {level:18,icon:'🏆',title:'Badge Showcase',description:'عرض حتى 3 شارات تختارها في ملفك.',type:'badge'},
 {level:19,icon:'💎',title:'Premium Profile',description:'فتح ثيم Premium مميز للملف الشخصي.',type:'profile'},
 {level:20,icon:'🎁',title:'صندوق Level 20',description:'ثيم Elite + إطار حصري + شارة فضية + تخصيص كامل للملف.',type:'milestone'}
];

export const CV_TEMPLATE_LEVELS={creative:7,executive:7,timeline:9,editorial:9,technical:11};
export const MOTIVATION_TEMPLATE_LEVELS={executive:5,editorial:5,creative:10,technical:10,serif:10};

export const PROFILE_THEMES=[
 {id:'default',label:'شذرات الأزرق',level:1},
 {id:'sky',label:'Sky',level:2},
 {id:'ocean',label:'Ocean',level:6},
 {id:'midnight',label:'Midnight',level:12},
 {id:'premium',label:'Premium',level:19},
 {id:'elite',label:'Elite',level:20}
];
export const PROFILE_NAME_COLORS=[
 {id:'white',label:'أبيض',value:'#ffffff',level:1},
 {id:'black',label:'أسود',value:'#111827',level:3},
 {id:'blue',label:'أزرق',value:'#bfdbfe',level:3},
 {id:'purple',label:'بنفسجي',value:'#ddd6fe',level:6},
 {id:'cyan',label:'سماوي',value:'#a5f3fc',level:6}
];
export const PROFILE_FRAMES=[
 {id:'none',label:'بدون إطار',level:1},
 {id:'blue',label:'Blue Ring',level:4},
 {id:'glow',label:'Glow',level:13},
 {id:'silver',label:'Silver',level:17},
 {id:'gold',label:'Gold',level:17},
 {id:'diamond',label:'Diamond',level:17},
 {id:'elite',label:'Elite',level:20}
];
export const PROFILE_BADGES=[
 {id:'student',label:'طالب شذرات',icon:'🎓',level:1},
 {id:'active',label:'طالب نشيط',icon:'🏅',level:8},
 {id:'bronze',label:'المستوى البرونزي',icon:'🥉',level:15},
 {id:'silver',label:'نخبة Level 20',icon:'🥈',level:20}
];

export function levelFromXp(value=0){
 const xp=Math.min(XP_SYSTEM_MAX,Math.max(0,Number(value)||0));let level=1;
 for(let i=0;i<LEVEL_THRESHOLDS.length;i++)if(xp>=LEVEL_THRESHOLDS[i])level=i+1;
 return Math.min(VISIBLE_LEVEL_MAX+1,level);
}
export function levelLabel(level){return Number(level)>VISIBLE_LEVEL_MAX?FUTURE_LEVEL_LABEL:String(Math.max(1,Number(level)||1))}
export function nextLevelInfo(value=0){
 const xp=Math.min(XP_SYSTEM_MAX,Math.max(0,Number(value)||0)),level=levelFromXp(xp);
 if(level>VISIBLE_LEVEL_MAX)return{level,label:FUTURE_LEVEL_LABEL,start:LEVEL_THRESHOLDS[VISIBLE_LEVEL_MAX],target:null,current:0,needed:0,remaining:0,percent:100,xp};
 const start=LEVEL_THRESHOLDS[level-1]||0,target=LEVEL_THRESHOLDS[level]||start,needed=Math.max(1,target-start),current=Math.max(0,xp-start);
 return{level,label:String(level),start,target,current,needed,remaining:Math.max(0,target-xp),percent:Math.min(100,Math.max(0,Math.round(current/needed*100))),xp};
}
export function journeyProgress(value=0){const info=nextLevelInfo(value);if(info.level>VISIBLE_LEVEL_MAX)return 100;return Math.min(100,Math.max(0,((info.level-1)+(info.percent/100))/VISIBLE_LEVEL_MAX*100))}
export function rewardForLevel(level){return LEVEL_REWARDS.find(r=>r.level===Number(level))||null}
export function templateRequiredLevel(kind,id){const map=kind==='cv'?CV_TEMPLATE_LEVELS:MOTIVATION_TEMPLATE_LEVELS;return Number(map[id]||1)}
export function isTemplateUnlocked(kind,id,level){return Number(level||1)>=templateRequiredLevel(kind,id)}
export function artifactSaveLimit(level){return Number(level||1)>=14?8:3}
