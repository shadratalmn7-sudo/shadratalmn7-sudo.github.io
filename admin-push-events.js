const MAKE_PUSH_WEBHOOK='https://hook.eu1.make.com/fy3fpwyc5xqo67r9am0tcjcjnj7zglf7';
const PUSH_TEMPLATE_ID='522cb2e3-bea0-4728-ab98-5e6d4bd7f0da';
const SITE_ORIGIN='https://shadratalmn7-sudo.github.io';

const EVENT_HEADINGS={
  service:'✨ خدمة جديدة في شذرات',
  scholarship:'🎓 منحة جديدة في شذرات',
  consultation:'💬 استشارة جديدة في شذرات',
  tool:'🛠️ أداة جديدة في شذرات'
};

function safePageUrl(value,fallback){
  try{
    const url=new URL(value||fallback,SITE_ORIGIN);
    if(url.origin!==SITE_ORIGIN)throw new Error('UNTRUSTED_PUSH_URL');
    return url.href;
  }catch{return new URL(fallback,SITE_ORIGIN).href}
}

export async function publishPushEvent({auth,eventType,title,message,url,eventId}){
  const user=auth?.currentUser;
  if(!user)throw new Error('AUTH_REQUIRED');
  const type=EVENT_HEADINGS[eventType]?eventType:'service';
  const firebaseIdToken=await user.getIdToken(true);
  const response=await fetch(MAKE_PUSH_WEBHOOK,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      eventId:eventId||crypto.randomUUID(),eventType:type,title:EVENT_HEADINGS[type],
      message:String(message||title||'اكتشف الجديد الآن في شذرات.').slice(0,500),
      url:safePageUrl(url,type==='scholarship'?'/scholarships.html':'/services.html'),
      audience:'all',templateId:PUSH_TEMPLATE_ID,firebaseIdToken,publishedAt:new Date().toISOString()
    })
  });
  if(!response.ok)throw new Error(`PUSH_WEBHOOK_${response.status}`);
  return true;
}
