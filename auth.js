import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { browserLocalPersistence, createUserWithEmailAndPassword, deleteUser, getAuth, GoogleAuthProvider, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
const OWNER_EMAIL='shadrat.almn7@gmail.com';
const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
if(new URLSearchParams(location.search).get('admin')==='1'){await auth.authStateReady();if(auth.currentUser) await signOut(auth);}
const clean=(v='')=>v.trim().toLowerCase(),isOwner=(v='')=>clean(v)===OWNER_EMAIL;
const normalizeUsername=(value='')=>clean(value).replace(/^@/,'');
const reservedUsername=(value='')=>/(^|_)(owner|admin|support|staff|shazarat|شذرات|مالك|ادارة|إدارة)(_|$)/i.test(value);
const normalizePhone=(value='')=>{let p=value.replace(/[^\d+]/g,'');if(p.startsWith('00'))p=`+${p.slice(2)}`;if(/^05\d{8}$/.test(p))p=`+966${p.slice(1)}`;if(/^9665\d{8}$/.test(p))p=`+${p}`;return /^\+[1-9]\d{7,14}$/.test(p)?p:null};
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const errorText=(e)=>{const known={'auth/invalid-credential':'البريد الإلكتروني أو كلمة المرور غير صحيحة.','auth/email-already-in-use':'هذا البريد مستخدم في حساب آخر.','auth/weak-password':'اختر كلمة مرور أقوى لا تقل عن 10 أحرف.','auth/popup-closed-by-user':'أُغلقت نافذة Google قبل إكمال الدخول.','auth/unauthorized-domain':'نطاق الموقع غير مصرح به في Firebase.','auth/operation-not-allowed':'طريقة الدخول غير مفعلة في Firebase.','auth/network-request-failed':'تعذر الاتصال. تحقق من الإنترنت وحاول مجددًا.','permission-denied':'رفضت قاعدة البيانات العملية. تحقق من البيانات وحاول مجددًا.'};return e?.message?.includes('phone-already-used')?'رقم الجوال مستخدم في حساب آخر.':known[e?.code]||'تعذر إكمال العملية الآن. حاول مرة أخرى.'};
async function roleFor(user){if(!user)return null;if(isOwner(user.email)&&user.emailVerified)return'owner';try{const s=await getDoc(doc(db,'users',user.uid));return s.exists()?s.data().role:'student'}catch{return'student'}}
const show=(form,text,type='error')=>{const n=form?.querySelector('[data-auth-message]');if(n){n.textContent=text;n.className=`auth-message ${type}`}};
const destination=async user=>['owner','support'].includes(await roleFor(user))?'admin-analytics.html':'profile.html';
const loginForm=document.querySelector('#login-form');
loginForm?.addEventListener('submit',async(e)=>{e.preventDefault();if(!loginForm.reportValidity())return;const button=loginForm.querySelector('[type=submit]');button.disabled=true;try{await setPersistence(auth,browserLocalPersistence);const c=await signInWithEmailAndPassword(auth,clean(loginForm.email.value),loginForm.password.value);location.href=await destination(c.user)}catch(x){show(loginForm,errorText(x))}finally{button.disabled=false}});
document.querySelector('#reset-password')?.addEventListener('click',async(e)=>{e.preventDefault();const email=clean(loginForm?.email.value);if(!email)return show(loginForm,'اكتب بريدك الإلكتروني أولًا.');try{await sendPasswordResetEmail(auth,email);show(loginForm,'أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك.','success')}catch(x){show(loginForm,errorText(x))}});
document.querySelectorAll('[data-sign-out]').forEach(b=>b.addEventListener('click',async()=>{await signOut(auth);location.replace('login.html')}));
export{auth,db,roleFor,normalizePhone,digest};
