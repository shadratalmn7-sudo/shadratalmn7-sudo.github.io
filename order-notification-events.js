import{doc,getDoc,serverTimestamp,setDoc,updateDoc}from'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const MAKE_GATEWAY='https://hook.eu1.make.com/fy3fpwyc5xqo67r9am0tcjcjnj7zglf7';
const SITE_ORIGIN='https://shadratalmn7-sudo.github.io';
const ONE_SIGNAL_APP_ID='fece206d-55fe-4ff4-a207-62421a870f16';

const STATUS={
  created:{label:'تم استلام الطلب',channels:['whatsapp','push','email']},
  waiting_info:{label:'بانتظار معلومات منك',channels:['whatsapp','push','email']},
  under_review:{label:'قيد المراجعة',channels:['push']},
  in_progress:{label:'قيد التنفيذ',channels:['push']},
  action_needed:{label:'مطلوب منك إجراء',channels:['whatsapp','push','email']},
  completed:{label:'مكتمل',channels:['whatsapp','push','email']},
  canceled:{label:'ملغي',channels:['whatsapp','push','email']}
};

const clean=(v,max=500)=>String(v??'').trim().slice(0,max);
const orderCode=id=>String(id||'').slice(0,8).toUpperCase();
const statusInfo=s=>STATUS[s]||{label:'تحديث الطلب',channels:['push']};

export function normalizeWhatsApp(value='',country='',nationality=''){
  let digits=String(value).replace(/\D/g,'');
  if(!digits)return'';
  if(digits.startsWith('00'))digits=digits.slice(2);
  if(digits.startsWith('05')&&digits.length===10)digits=`966${digits.slice(1)}`;
  else if(digits.startsWith('5')&&digits.length===9&&/السعود|saudi/i.test(`${country} ${nationality}`))digits=`966${digits}`;
  else if(digits.startsWith('7')&&digits.length===9&&/اليمن|يمني|yemen/i.test(`${country} ${nationality}`))digits=`967${digits}`;
  else if(digits.startsWith('01')&&digits.length===11&&/مصر|مصري|egypt/i.test(`${country} ${nationality}`))digits=`20${digits}`;
  return /^\d{10,15}$/.test(digits)?`+${digits}`:'';
}

function defaultMessage(status,student,service,code,note){
  const name=student||'الطالب';
  const extra=note?` ملاحظة الفريق: ${note}`:'';
  if(status==='created')return`مرحبًا ${name}، تم استلام طلبك لخدمة ${service} بنجاح. رقم الطلب #${code}. سنبلغك عند حدوث تحديث.`;
  if(status==='waiting_info'||status==='action_needed')return`مرحبًا ${name}، طلبك لخدمة ${service} يحتاج معلومات أو إجراء منك. رقم الطلب #${code}.${extra}`;
  if(status==='under_review')return`مرحبًا ${name}، طلبك لخدمة ${service} أصبح قيد المراجعة. رقم الطلب #${code}.`;
  if(status==='in_progress')return`مرحبًا ${name}، بدأ فريق شذرات تنفيذ خدمة ${service}. رقم الطلب #${code}.`;
  if(status==='completed')return`مرحبًا ${name}، تم الانتهاء من طلبك لخدمة ${service} بنجاح. رقم الطلب #${code}.${extra}`;
  if(status==='canceled')return`مرحبًا ${name}، تم إغلاق طلب خدمة ${service}. رقم الطلب #${code}.${extra}`;
  return`مرحبًا ${name}، تم تحديث طلبك لخدمة ${service}. رقم الطلب #${code}.${extra}`;
}

export async function dispatchOrderNotification({auth,db,orderId,order,status,studentMessage='',eventType='order_status'}){
  const user=auth?.currentUser;if(!user)throw new Error('AUTH_REQUIRED');
  const info=statusInfo(status),code=orderCode(orderId),student=clean(order.userName||'الطالب',120),service=clean(order.serviceTitle||'خدمة شذرات',200),note=clean(studentMessage||order.studentMessage||'',500);
  const eventId=`order-${orderId}-${status}`,eventRef=doc(db,'notificationEvents',eventId),existing=await getDoc(eventRef);
  if(existing.exists()&&existing.data()?.makeState==='accepted')return{duplicate:true,eventId};
  const phone=/واتساب|whatsapp/i.test(order.contactMethod||'')?normalizeWhatsApp(order.contactValue,order.currentCountry,order.nationality):'';
  const email=clean(order.userEmail||user.email||'',200),message=defaultMessage(status,student,service,code,note),title=`${info.label} • ${service}`;
  const channels={push:info.channels.includes('push')&&!!order.userId,email:info.channels.includes('email')&&!!email,whatsapp:info.channels.includes('whatsapp')&&!!phone};
  await setDoc(eventRef,{eventId,eventType,orderId,status,statusLabel:info.label,actorUid:user.uid,studentUid:order.userId||user.uid,studentName:student,serviceName:service,orderCode:code,title,message,channels,makeState:'pending',attemptedAt:serverTimestamp(),createdAt:existing.exists()?existing.data().createdAt||serverTimestamp():serverTimestamp()},{merge:true});
  const firebaseIdToken=await user.getIdToken(true),payload={
    eventId,eventType,userId:order.userId||user.uid,orderId,status,statusLabel:info.label,studentName:student,serviceName:service,orderCode:code,adminMessage:note,title,message,
    toEmail:email,toPhone:phone,sendEmail:channels.email,sendWhatsApp:channels.whatsapp,sendPush:channels.push,
    whatsappTemplate:status==='created'?'shadrat_welcome':'shadrat_update',
    pushPayloadJson:JSON.stringify({app_id:ONE_SIGNAL_APP_ID,include_aliases:{external_id:[order.userId||user.uid]},target_channel:'push',headings:{en:title},contents:{en:message},url:`${SITE_ORIGIN}/profile.html#orders`,idempotency_key:eventId}),
    url:`${SITE_ORIGIN}/profile.html#orders`,firebaseIdToken,publishedAt:new Date().toISOString()
  };
  try{
    const response=await fetch(MAKE_GATEWAY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!response.ok)throw new Error(`NOTIFICATION_GATEWAY_${response.status}`);
    await updateDoc(eventRef,{makeState:'accepted',makeAcceptedAt:serverTimestamp()});
    return{duplicate:false,eventId,channels};
  }catch(error){await updateDoc(eventRef,{makeState:'failed',lastError:clean(error?.message||error,240),failedAt:serverTimestamp()}).catch(()=>{});throw error}
}
