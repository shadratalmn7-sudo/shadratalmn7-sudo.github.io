import{getApp,getApps,initializeApp}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import{collection,getDocs,getFirestore}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
import{firebaseConfig}from'./firebase-config.js';
const app=getApps().length?getApp():initializeApp(firebaseConfig),db=getFirestore(app);
const read=async name=>{try{const s=await getDocs(collection(db,name));return s.docs.map(d=>({id:d.id,...d.data()}))}catch(e){console.warn('admin badge',name,e);return[]}};
const isPendingMessage=x=>x.status==='new'||x.status===undefined||x.status===null;
const isPendingOrder=x=>x.status==='created'||x.status===undefined||x.status===null;
const paint=(key,count,title='')=>{document.querySelectorAll(`[data-admin-badge="${key}"]`).forEach(b=>{b.textContent=Number(count||0).toLocaleString('ar');b.hidden=!count;if(title)b.title=title})};
async function load(){const role=document.body.dataset.role||'student',supportAccess=['owner','admin','support'].includes(role);const [messages,orders]=await Promise.all([supportAccess?read('messages'):[],supportAccess?read('orders'):[]]);const supportMessages=messages.filter(isPendingMessage),supportOrders=orders.filter(isPendingOrder),support=supportMessages.length+supportOrders.length;paint('support',support,`${supportMessages.length} رسائل/شكاوى جديدة لم تُعالج + ${supportOrders.length} طلبات جديدة لم تُعالج`);paint('overview',support,`${support} عناصر لم تُعالج بعد`)}
load();setInterval(load,60000);
