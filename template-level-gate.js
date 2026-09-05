import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{doc,getFirestore,onSnapshot}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{getAuth,onAuthStateChanged}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import{firebaseConfig}from'./firebase-config.js';
import{levelFromXp,templateRequiredLevel}from'./level-system.js?v=2';

const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
let cleanup=null;

function styles(){if(document.querySelector('#template-level-gate-style'))return;const s=document.createElement('style');s.id='template-level-gate-style';s.textContent=`
.template-choice{position:relative;overflow:hidden}.template-choice.is-level-locked{border-color:#cbd5e1!important;background:linear-gradient(145deg,#fff,#f8fafc)!important;padding-top:34px!important}.template-choice.is-level-locked:after{content:'معاينة متاحة';position:absolute;left:8px;bottom:7px;font-size:10px;font-weight:900;color:#2563eb}.template-level-lock{position:absolute;top:7px;right:7px;display:inline-flex;gap:4px;align-items:center;padding:4px 7px;border-radius:999px;background:#0f172a;color:#fff;font-size:10px;font-weight:900;box-shadow:0 4px 10px rgba(15,23,42,.15)}.template-choice.is-level-open{border-color:#b7cdf8}.template-level-opened{position:absolute;top:7px;right:7px;padding:4px 7px;border-radius:999px;background:#dcfce7;color:#166534;font-size:10px;font-weight:900}.locked-template-preview-note{position:sticky;top:8px;z-index:10;margin:0 0 10px;padding:10px 12px;border-radius:13px;background:#fff7d6;border:1px solid #f2d47b;color:#744b00;font:800 12px/1.6 Tahoma,Arial,sans-serif;box-shadow:0 8px 24px rgba(15,23,42,.08)}
`;document.head.appendChild(s)}

function previewLocked(kind,id,required){const preview=kind==='cv'?document.querySelector('#cv'):document.querySelector('#letter'),wrap=document.querySelector('.preview-wrap');if(!preview)return;if(kind==='cv'){preview.className=preview.className.replace(/\btemplate-[^\s]+/g,'').trim()+` template-${id}`}else{preview.className=preview.className.replace(/\bletter-template-[^\s]+/g,'').trim()+` letter-template-${id}`}
 let note=wrap?.querySelector('.locked-template-preview-note');if(!note&&wrap){note=document.createElement('div');note.className='locked-template-preview-note';wrap.prepend(note)}if(note)note.textContent=`🔒 هذه معاينة فقط. القالب يفتح للاستخدام عند Level ${required}.`;
 const status=document.querySelector('#builderStatus');if(status)status.textContent=`معاينة فقط — هذا القالب يفتح عند Level ${required}. أكمل المهمات وارفع مستواك لاستخدامه وتحميل الملف به.`}

function init(kind){styles();const selector=kind==='cv'?'[data-cv-template]':'[data-motivation-template]',input=document.querySelector('#template'),fallback=kind==='cv'?'formal':'academic';let currentLevel=1;
 function enforce(){if(!input)return;const need=templateRequiredLevel(kind,input.value);if(need>currentLevel){input.value=fallback;input.dispatchEvent(new Event('input',{bubbles:true}))}}
 function decorate(){const buttons=[...document.querySelectorAll(selector)];if(!buttons.length)return false;buttons.forEach(b=>{const id=kind==='cv'?b.dataset.cvTemplate:b.dataset.motivationTemplate,need=templateRequiredLevel(kind,id),locked=currentLevel<need;b.classList.toggle('is-level-locked',locked);b.classList.toggle('is-level-open',!locked&&need>1);b.setAttribute('aria-disabled',locked?'true':'false');b.querySelectorAll('.template-level-lock,.template-level-opened').forEach(x=>x.remove());if(need>1){const tag=document.createElement('span');tag.className=locked?'template-level-lock':'template-level-opened';tag.textContent=locked?`🔒 Level ${need}`:'✓ مفتوح';b.appendChild(tag)}});enforce();return true}
 document.addEventListener('click',e=>{const b=e.target.closest(selector);if(!b)return;const id=kind==='cv'?b.dataset.cvTemplate:b.dataset.motivationTemplate,need=templateRequiredLevel(kind,id);if(currentLevel>=need)return;e.preventDefault();e.stopImmediatePropagation();previewLocked(kind,id,need)},true);
 let tries=0,timer=setInterval(()=>{decorate();if(++tries>35)clearInterval(timer)},120);
 const stopAuth=onAuthStateChanged(auth,user=>{cleanup?.();cleanup=null;if(!user){currentLevel=1;decorate();return}cleanup=onSnapshot(doc(db,'users',user.uid),snap=>{currentLevel=levelFromXp(snap.data()?.xp||0);decorate()},()=>{currentLevel=1;decorate()})});
 return()=>{clearInterval(timer);stopAuth();cleanup?.()}
}

export function initTemplateLevelGate(kind){if(!['cv','motivation'].includes(kind))return()=>{};if(document.readyState==='loading'){let stop=()=>{};document.addEventListener('DOMContentLoaded',()=>{stop=init(kind)},{once:true});return()=>stop()}return init(kind)}
