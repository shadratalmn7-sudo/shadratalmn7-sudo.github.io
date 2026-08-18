const SITE_BASE = 'https://shadratalmn7-sudo.github.io';
const FALLBACK_ADMIN_CHAT_ID = '8679324666';

const LANGUAGE_MENU = {
  inline_keyboard: [
    [{ text: '🇸🇦 العربية', callback_data: 'lang:ar' }],
    [{ text: '🇬🇧 English', callback_data: 'lang:en' }]
  ]
};

const MENUS = {
  ar: {
    main: {
      inline_keyboard: [
        [{ text: '🎓 المنح الدراسية', callback_data: 'ar:scholarships' }],
        [{ text: '📝 الخدمات والأسعار', callback_data: 'ar:services' }],
        [{ text: '🛠 مشكلة في الموقع', callback_data: 'ar:site_issue' }],
        [{ text: '👤 التواصل مع الدعم', callback_data: 'ar:human_support' }],
        [{ text: '🌐 تغيير اللغة', callback_data: 'language' }]
      ]
    },
    back: { inline_keyboard: [[{ text: '⬅️ العودة للقائمة الرئيسية', callback_data: 'ar:home' }]] },
    scholarships: {
      inline_keyboard: [
        [{ text: '🇷🇺 Open Doors', url: `${SITE_BASE}/scholarship.html?slug=open-doors` }],
        [{ text: '🇷🇺 منحة الحكومة الروسية', url: `${SITE_BASE}/scholarship.html?slug=education-in-russia` }],
        [{ text: '🇹🇷 المنحة التركية', url: `${SITE_BASE}/scholarship.html?slug=turkiye-scholarships` }],
        [{ text: '🌐 جميع المنح', url: `${SITE_BASE}/scholarships.html` }],
        [{ text: '⬅️ رجوع', callback_data: 'ar:home' }]
      ]
    },
    services: {
      inline_keyboard: [
        [{ text: '💬 استشارة Open Doors — مجانية', callback_data: 'ar:svc:consult_open_doors' }],
        [{ text: '💬 استشارة Education in Russia — مجانية', callback_data: 'ar:svc:consult_education' }],
        [{ text: '📄 ترجمة الجواز والشهادة — نوتاريوس — 60$', callback_data: 'ar:svc:notarized_translation' }],
        [{ text: '🇷🇺 التقديم Education in Russia — 50$', callback_data: 'ar:svc:apply_education' }],
        [{ text: '🏆 Open Doors Stage 1 — 70$', callback_data: 'ar:svc:apply_open_doors' }],
        [{ text: '🌐 صفحة الخدمات بالموقع', url: `${SITE_BASE}/services.html` }],
        [{ text: '⬅️ رجوع', callback_data: 'ar:home' }]
      ]
    }
  },
  en: {
    main: {
      inline_keyboard: [
        [{ text: '🎓 Scholarships', callback_data: 'en:scholarships' }],
        [{ text: '📝 Services & Prices', callback_data: 'en:services' }],
        [{ text: '🛠 Website Issue', callback_data: 'en:site_issue' }],
        [{ text: '👤 Contact Support', callback_data: 'en:human_support' }],
        [{ text: '🌐 Change Language', callback_data: 'language' }]
      ]
    },
    back: { inline_keyboard: [[{ text: '⬅️ Back to Main Menu', callback_data: 'en:home' }]] },
    scholarships: {
      inline_keyboard: [
        [{ text: '🇷🇺 Open Doors', url: `${SITE_BASE}/scholarship.html?slug=open-doors` }],
        [{ text: '🇷🇺 Russian Government Scholarship', url: `${SITE_BASE}/scholarship.html?slug=education-in-russia` }],
        [{ text: '🇹🇷 Türkiye Scholarships', url: `${SITE_BASE}/scholarship.html?slug=turkiye-scholarships` }],
        [{ text: '🌐 All Scholarships', url: `${SITE_BASE}/scholarships.html` }],
        [{ text: '⬅️ Back', callback_data: 'en:home' }]
      ]
    },
    services: {
      inline_keyboard: [
        [{ text: '💬 Open Doors Consultation — Free', callback_data: 'en:svc:consult_open_doors' }],
        [{ text: '💬 Education in Russia Consultation — Free', callback_data: 'en:svc:consult_education' }],
        [{ text: '📄 Notarized Passport & Certificate Translation — $60', callback_data: 'en:svc:notarized_translation' }],
        [{ text: '🇷🇺 Education in Russia Application — $50', callback_data: 'en:svc:apply_education' }],
        [{ text: '🏆 Open Doors Stage 1 — $70', callback_data: 'en:svc:apply_open_doors' }],
        [{ text: '🌐 Services Page', url: `${SITE_BASE}/services.html` }],
        [{ text: '⬅️ Back', callback_data: 'en:home' }]
      ]
    }
  }
};

const SERVICES = {
  consult_open_doors: { ar: 'استشارة Open Doors', en: 'Open Doors Consultation', priceAr: 'مجانية', priceEn: 'Free' },
  consult_education: { ar: 'استشارة Education in Russia', en: 'Education in Russia Consultation', priceAr: 'مجانية', priceEn: 'Free' },
  notarized_translation: { ar: 'ترجمة الجواز والشهادة — نوتاريوس', en: 'Notarized Passport & Certificate Translation', priceAr: '60$', priceEn: '$60' },
  apply_education: { ar: 'التقديم على Education in Russia', en: 'Education in Russia Application', priceAr: '50$', priceEn: '$50' },
  apply_open_doors: { ar: 'التقديم على Open Doors — Stage 1', en: 'Open Doors Application — Stage 1', priceAr: '70$ بدل 100$', priceEn: '$70 instead of $100' }
};

export default {
  async fetch(request, env) {
    if (request.method === 'GET') return new Response('Shadrat Support Bot is running ✅', { status: 200 });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    if (!env.BOT_TOKEN) return new Response('BOT_TOKEN is missing', { status: 500 });

    let update;
    try { update = await request.json(); }
    catch { return new Response('Bad request', { status: 400 }); }

    try {
      if (update.callback_query) await handleCallback(update.callback_query, env);
      else if (update.message) await handleMessage(update.message, env);
    } catch (error) { console.error(error); }

    return new Response('OK', { status: 200 });
  }
};

async function handleMessage(message, env) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();

  if (isAdmin(message, env) && message.reply_to_message && text) {
    const targetId = extractUserId(message.reply_to_message.text || '');
    if (targetId) {
      await sendMessage(env, targetId, `💬 رد فريق شذرات / Shadrat Support:\n\n${text}`, LANGUAGE_MENU);
      return sendMessage(env, chatId, '✅ تم إرسال ردك للطالب.');
    }
  }

  if (text === '/start' || text === '/help') {
    return sendMessage(env, chatId, '🌐 اختر لغتك / Choose your language:', LANGUAGE_MENU);
  }

  if (text === '/id') return sendMessage(env, chatId, `معرّف المحادثة الخاص بك / Your Chat ID:\n${chatId}`);

  const replyText = message.reply_to_message?.text || '';
  if (text && replyText.includes('[SUPPORT_REQUEST_AR]')) return receiveSupportMessage(env, message, 'ar', 'support');
  if (text && replyText.includes('[SITE_ISSUE_AR]')) return receiveSupportMessage(env, message, 'ar', 'issue');
  if (text && replyText.includes('[SUPPORT_REQUEST_EN]')) return receiveSupportMessage(env, message, 'en', 'support');
  if (text && replyText.includes('[SITE_ISSUE_EN]')) return receiveSupportMessage(env, message, 'en', 'issue');

  return sendMessage(env, chatId, '🌐 اختر لغتك / Choose your language:', LANGUAGE_MENU);
}

async function handleCallback(query, env) {
  const chatId = query.message.chat.id;
  const data = query.data || '';
  await answerCallback(env, query.id);

  if (data === 'language') return editOrSend(env, query, '🌐 اختر لغتك / Choose your language:', LANGUAGE_MENU);
  if (data === 'lang:ar') return editOrSend(env, query, '🎓 أهلًا بك في شذرات للمنح. اختر القسم الذي تحتاجه:', MENUS.ar.main);
  if (data === 'lang:en') return editOrSend(env, query, '🎓 Welcome to Shadrat Scholarships. Choose a section:', MENUS.en.main);

  const parts = data.split(':');
  const lang = parts[0] === 'en' ? 'en' : 'ar';
  const action = parts[1] || '';

  if (action === 'svc') {
    const key = parts.slice(2).join(':');
    const service = SERVICES[key];
    if (!service) return sendServices(env, chatId, lang);
    return requestService(env, query, service, lang);
  }

  switch (action) {
    case 'home':
      return editOrSend(env, query,
        lang === 'ar' ? '🎓 أهلًا بك في شذرات للمنح. اختر القسم الذي تحتاجه:' : '🎓 Welcome to Shadrat Scholarships. Choose a section:',
        MENUS[lang].main
      );
    case 'scholarships':
      return editOrSend(env, query,
        lang === 'ar' ? '🎓 اختر المنحة:' : '🎓 Choose a scholarship:',
        MENUS[lang].scholarships
      );
    case 'services':
      return editOrSend(env, query,
        lang === 'ar' ? '📝 الخدمات والأسعار\n\nاختر الخدمة المطلوبة:' : '📝 Services & Prices\n\nChoose the service you need:',
        MENUS[lang].services
      );
    case 'site_issue':
      return askForIssue(env, chatId, lang);
    case 'human_support':
      return askForSupport(env, chatId, lang);
    default:
      return editOrSend(env, query, '🌐 اختر لغتك / Choose your language:', LANGUAGE_MENU);
  }
}

function sendServices(env, chatId, lang) {
  return sendMessage(env, chatId,
    lang === 'ar' ? '📝 الخدمات والأسعار\n\nاختر الخدمة المطلوبة:' : '📝 Services & Prices\n\nChoose the service you need:',
    MENUS[lang].services
  );
}

async function requestService(env, query, service, lang) {
  const chatId = query.message.chat.id;
  const title = lang === 'ar' ? service.ar : service.en;
  const price = lang === 'ar' ? service.priceAr : service.priceEn;

  await sendAdminNotification(env, {
    title: '🛎 طلب خدمة جديد / New Service Request',
    user: query.from || {},
    chatId,
    details: [`الخدمة / Service: ${title}`, `السعر / Price: ${price}`]
  });

  return sendMessage(env, chatId,
    lang === 'ar'
      ? `✅ تم استلام طلبك.\n\nالخدمة: ${title}\nالسعر: ${price}\n\nسيتم التواصل معك من فريق شذرات عند استلام الطلب.`
      : `✅ Your request has been received.\n\nService: ${title}\nPrice: ${price}\n\nThe Shadrat team will contact you after reviewing your request.`,
    MENUS[lang].back
  );
}

function askForSupport(env, chatId, lang) {
  return sendMessage(env, chatId,
    lang === 'ar'
      ? '👤 اكتب رسالتك للدعم الآن في ردك على هذه الرسالة.\n\n[SUPPORT_REQUEST_AR]'
      : '👤 Write your support message by replying to this message.\n\n[SUPPORT_REQUEST_EN]',
    { force_reply: true, selective: true, input_field_placeholder: lang === 'ar' ? 'اكتب رسالتك للدعم هنا…' : 'Write your support message here…' }
  );
}

function askForIssue(env, chatId, lang) {
  return sendMessage(env, chatId,
    lang === 'ar'
      ? '🛠 اشرح مشكلة الموقع باختصار في ردك على هذه الرسالة.\n\n[SITE_ISSUE_AR]'
      : '🛠 Briefly describe the website issue by replying to this message.\n\n[SITE_ISSUE_EN]',
    { force_reply: true, selective: true, input_field_placeholder: lang === 'ar' ? 'اكتب المشكلة هنا…' : 'Describe the issue here…' }
  );
}

async function receiveSupportMessage(env, message, lang, type) {
  const chatId = message.chat.id;
  await sendAdminNotification(env, {
    title: type === 'issue' ? '🛠 بلاغ مشكلة في الموقع / Website Issue' : '📩 رسالة دعم جديدة / Support Message',
    user: message.from || {},
    chatId,
    details: [message.text || '[رسالة غير نصية / Non-text message]']
  });

  return sendMessage(env, chatId,
    lang === 'ar'
      ? '✅ تم استلام رسالتك. سيتم الرد عليك من فريق شذرات عند استلامها من أحد المسؤولين.'
      : '✅ Your message has been received. The Shadrat team will reply once a team member reviews it.',
    MENUS[lang].back
  );
}

async function sendAdminNotification(env, { title, user, chatId, details }) {
  const username = user.username ? `@${user.username}` : 'بدون اسم مستخدم';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'مستخدم';
  const body = [
    title,
    `الاسم / Name: ${name}`,
    `المستخدم / Username: ${username}`,
    `Chat ID: ${chatId}`,
    `[USER_ID:${chatId}]`,
    '',
    ...details,
    '',
    '↩️ للرد على الطالب: استخدم Reply على هذه الرسالة واكتب ردك.'
  ].join('\n');
  return sendMessage(env, getAdminChatId(env), body);
}

function getAdminChatId(env) { return String(env.ADMIN_CHAT_ID || FALLBACK_ADMIN_CHAT_ID); }
function isAdmin(message, env) { return String(message.chat.id) === getAdminChatId(env); }
function extractUserId(text) { const m = text.match(/\[USER_ID:(-?\d+)\]/); return m ? m[1] : null; }

async function telegram(env, method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(`Telegram ${method} failed: ${JSON.stringify(data)}`);
  return data;
}

function sendMessage(env, chatId, text, replyMarkup) {
  const payload = { chat_id: chatId, text };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return telegram(env, 'sendMessage', payload);
}

function answerCallback(env, callbackQueryId) { return telegram(env, 'answerCallbackQuery', { callback_query_id: callbackQueryId }); }

async function editOrSend(env, query, text, replyMarkup) {
  try {
    return await telegram(env, 'editMessageText', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      text,
      reply_markup: replyMarkup
    });
  } catch {
    return sendMessage(env, query.message.chat.id, text, replyMarkup);
  }
}
