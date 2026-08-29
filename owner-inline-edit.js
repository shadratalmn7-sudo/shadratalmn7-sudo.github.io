import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { collection, doc, getDocs, getFirestore, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const OWNER_EMAIL = 'shadrat.almn7@gmail.com';
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const editableSelector = '[data-edit-key]';
let editMode = false;
let active = null;
let original = '';

const style = document.createElement('style');
style.textContent = `
.owner-edit-toggle{position:fixed;left:14px;bottom:14px;z-index:1300;border:0;border-radius:15px;padding:11px 15px;background:#176b4b;color:#fff;font:inherit;font-size:12px;font-weight:900;box-shadow:0 14px 34px #17352b25;cursor:pointer}.owner-edit-toggle.active{background:#8a641f}.owner-edit-mode ${editableSelector}{outline:1px dashed #c7a758;outline-offset:3px;cursor:text}.owner-edit-mode a${editableSelector}{cursor:text}.owner-inline-active{outline:2px solid #176b4b!important;outline-offset:4px!important;background:#fff8df66!important;border-radius:6px}.owner-inline-actions{position:absolute;z-index:1400;display:flex;gap:6px;padding:6px;border:1px solid #d8cebe;border-radius:13px;background:#fffdf8;box-shadow:0 10px 28px #17352b24}.owner-inline-actions button{border:0;border-radius:9px;padding:7px 10px;font:inherit;font-size:11px;font-weight:900;cursor:pointer}.owner-inline-save{background:#176b4b;color:#fff}.owner-inline-cancel{background:#eee5d6;color:#17352b}.owner-inline-status{position:fixed;left:14px;bottom:66px;z-index:1350;padding:9px 12px;border-radius:12px;background:#17352b;color:#fff;font-size:11px;font-weight:800;box-shadow:0 10px 28px #17352b25}.owner-inline-status.error{background:#9f2f2f}@media(max-width:620px){.owner-edit-toggle{left:10px;bottom:10px}.owner-inline-status{left:10px;bottom:60px}}
`;
document.head.appendChild(style);

const pageName = location.pathname.split('/').pop() || 'index.html';
const slug = value => value.toLowerCase().replace(/\.html$/,'').replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'') || 'page';
function prepareAutomaticEditableText(){
  const root = document.querySelector('main');
  if(!root) return;
  const selectors = 'h1,h2,h3,p,small,b,span';
  const counters = new Map();
  root.querySelectorAll(selectors).forEach(el=>{
    if(el.dataset.editKey || el.closest('a,button,label,form,script,style,[data-no-inline-edit]')) return;
    if(el.children.length || !el.textContent.trim()) return;
    const section = el.closest('[id]')?.id || el.closest('section')?.className?.toString().split(/\s+/)[0] || 'main';
    const base = `${slug(pageName)}-${slug(section)}-${el.tagName.toLowerCase()}`;
    const next = (counters.get(base)||0)+1; counters.set(base,next);
    el.dataset.editKey = `${base}-${next}`;
    el.dataset.autoEditKey = '1';
  });
}

const setText = (key, value) => document.querySelectorAll(`[data-edit-key="${CSS.escape(key)}"]`).forEach(el => el.textContent = value);
async function applySavedText(){prepareAutomaticEditableText();try{const snap=await getDocs(collection(db,'siteText'));snap.forEach(item=>{const data=item.data()||{};if(typeof data.value==='string')setText(item.id,data.value);});}catch(error){console.warn('[Shadrat] saved text unavailable',error);}}

function status(message,error=false){let el=document.querySelector('.owner-inline-status');if(!el){el=document.createElement('div');el.className='owner-inline-status';document.body.appendChild(el);}el.textContent=message;el.classList.toggle('error',error);clearTimeout(status.t);status.t=setTimeout(()=>el.remove(),2200);}
function closeActions(){document.querySelector('.owner-inline-actions')?.remove();}
function stopEditing(restore=false){if(!active)return;if(restore)active.textContent=original;active.removeAttribute('contenteditable');active.classList.remove('owner-inline-active');active=null;original='';closeActions();}
function placeActions(target){closeActions();const box=document.createElement('div');box.className='owner-inline-actions';box.innerHTML='<button type="button" class="owner-inline-save">حفظ</button><button type="button" class="owner-inline-cancel">إلغاء</button>';document.body.appendChild(box);const rect=target.getBoundingClientRect();box.style.top=`${rect.bottom+window.scrollY+7}px`;box.style.left=`${Math.max(8,rect.left+window.scrollX)}px`;box.querySelector('.owner-inline-cancel').addEventListener('click',()=>stopEditing(true));box.querySelector('.owner-inline-save').addEventListener('click',saveActive);}
async function saveActive(){if(!active)return;const value=active.textContent.trim();if(!value){status('النص ما يقدر يكون فاضي',true);return;}const key=active.dataset.editKey;status('جاري الحفظ…');try{await setDoc(doc(db,'siteText',key),{value,page:pageName,updatedAt:serverTimestamp()},{merge:true});setText(key,value);stopEditing(false);status('تم الحفظ مباشرة');}catch(error){console.error(error);status(`تعذر الحفظ: ${error?.code||'راجع صلاحيات قاعدة البيانات'}`,true);}}
function startEditing(element,event){if(!editMode)return;event.preventDefault();event.stopPropagation();if(active&&active!==element)stopEditing(false);active=element;original=element.textContent;element.setAttribute('contenteditable','true');element.classList.add('owner-inline-active');element.focus();const range=document.createRange();range.selectNodeContents(element);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);placeActions(element);}
function enableOwner(){if(document.querySelector('.owner-edit-toggle'))return;prepareAutomaticEditableText();const toggle=document.createElement('button');toggle.type='button';toggle.className='owner-edit-toggle';toggle.textContent='تفعيل التعديل';document.body.appendChild(toggle);toggle.addEventListener('click',()=>{prepareAutomaticEditableText();editMode=!editMode;document.documentElement.classList.toggle('owner-edit-mode',editMode);toggle.classList.toggle('active',editMode);toggle.textContent=editMode?'إنهاء التعديل':'تفعيل التعديل';if(!editMode)stopEditing(false);status(editMode?'اضغط على أي نص لتعديله في مكانه':'تم إيقاف وضع التعديل');});document.addEventListener('click',event=>{const el=event.target.closest?.(editableSelector);if(el)startEditing(el,event);},true);document.addEventListener('keydown',event=>{if(!active)return;if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();saveActive();}if(event.key==='Escape'){event.preventDefault();stopEditing(true);}});window.addEventListener('scroll',()=>{if(active)placeActions(active);},{passive:true});new MutationObserver(()=>{prepareAutomaticEditableText();}).observe(document.body,{childList:true,subtree:true});}

applySavedText();
onAuthStateChanged(auth,user=>{if(user?.email===OWNER_EMAIL)enableOwner();});
