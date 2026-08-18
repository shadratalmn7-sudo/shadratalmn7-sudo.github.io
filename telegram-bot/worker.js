const SITE_BASE = 'https://shadratalmn7-sudo.github.io';

const MAIN_MENU = {
  inline_keyboard: [
    [{ text: '🎓 المنح الدراسية', callback_data: 'scholarships' }],
    [{ text: '📝 الخدمات والأسعار', callback_data: 'services' }],
    [{ text: '🛠 مشكلة في الموقع', callback_data: 'site_issue' }],
    [{ text: '👤 التواصل مع الدعم', callback_data: 'human_support' }]
  ]
};

const BACK_MENU = {
  inline_keyboard: [[{ text: '⬅️ العودة للقائمة الرئيسية', callback_data: 'home' }]]
};

const SCHOLARSHIPS_MENU = {
  inline_keyboard: [
    [{ text: '🇷🇺 Open Doors', url: `${SITE_BASE}/scholarship.html?slug=open-doors` }],
    [{ text: '🇷🇺 منحة الحكومة الروسية', url: `${SITE_BASE}/scholarship.html?slug=education-in-russia` }],
    [{ text: '🇹🇷 المنحة التركية', url: `${SITE_BASE}/scholarship.html?slug=turkiye-scholarships` }],
    [{ text: '🌐 جميع المنح', url: `${SITE_BASE}/scholarships.html` }],
    [{ text: '⬅️ رجوع', callback_data: 'home' }]
  ]
};

const SERVICES = {
  consult_open_doors: { title: 'استشارة Open Doors', price: 'مجانية' },
  consult_education: { title: 'استشارة Education in Russia', price: 'مجانية' },
  notarized_translation: { title: 'ترجمة الجواز والشهادة — نوتاريوس', price: '60$' },
  apply_education: { title: 'التقديم على Education in Russia', price: '50$' },
  apply_open_doors: { title: 'التقديم على Open Doors — Stage 1', price: '70$ بدل 100$' }
};

const SERVICES_MENU = {
  inline_keyboard: [
    [{ text: '💬 استشارة Open Doors — مجانية', callback_data: 'svc:consult_open_doors' }],
    [{ text: '💬 استشارة Education in Russia — مجانية', callback_data: 'svc:consult_education' }],
    [{ text: '📄 ترجمة الجواز والشهادة — نوتاريوس — 60$', callback_data: 'svc:notarized_translation' }],
    [{ text: '🇷🇺 التقديم Education in Russia — 50$', callback_data: 'svc:apply_education' }],
    [{ text: '🏆 Open Doors Stage 1 — 70$', callback_data: 'svc:apply_open_doors' }],
    [{ text: '🌐 صفحة الخدمات بالموقع', url: `${SITE_BASE}/services.html` }],
    [{ text: '⬅️ رجوع', callback_data: 'home' }]
  ]
};

export default {
  async fetch(request, env) {
    if (request.method === 'GET') {
      return new Response('Shadrat Support Bot is running ✅', { status: 200 });
    }
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    if (!env.BOT_TOKEN) return new Response('BOT_TOKEN is missing', { status: 500 });

    let update;
    try {
      update = await request.json();
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    try {
      if (update.callback_query) await handleCallback(update.callback_query, env);
      else if (update.message) await handleMessage(update.message, env);
    } catch (error) {
      console.error(error);
    }
    return new Response('OK', { status: 200 });
  }
};

async function handleMessage(message, env) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();

  if (isAdmin(message, env) && message.reply_to_message && text) {
    const targetId = extractUserId(message.reply_to_message.text || '');
    if (targetId) {
      await sendMessage(env, targetId, `💬 رد فريق شذرات:\n\n${text}`, MAIN_MENU);
      return sendMessage(env, chatId, '✅ تم إرسال ردك للطالب.');
    }
  }

  if (text === '/start' || text === '/help') {
    return sendMessage(env, chatId,
      '🎓 أهلًا بك في شذرات للمنح. اختر القسم الذي تحتاجه:',
      MAIN_MENU
    );
  }

  if (text === '/id') return sendMessage(env, chatId, `معرّف المحادثة الخاص بك:\n${chatId}`);
  if (text === '/services') return sendServices(env, chatId);
  if (text === '/scholarships') return sendMessage(env, chatId, '🎓 اختر المنحة:', SCHOLARSHIPS_MENU);
  if (text === '/contact') return askForSupport(env, chatId);

  const replyText = message.reply_to_message?.text || '';
  if (text && replyText.includes('[SUPPORT_REQUEST]')) {
    return receiveSupportMessage(env, message, 'رسالة دعم');
  }
  if (text && replyText.includes('[SITE_ISSUE]')) {
    return receiveSupportMessage(env, message, 'مشكلة في الموقع');
  }

  return sendMessage(env, chatId,
    'هذا البوت مخصص للمنح والدراسة وخدمات شذرات فقط. اختر من القائمة:',
    MAIN_MENU
  );
}

async function handleCallback(query, env) {
  const chatId = query.message.chat.id;
  const data = query.data || '';
  await answerCallback(env, query.id);

  if (data.startsWith('svc:')) {
    const key = data.slice(4);
    const service = SERVICES[key];
    if (!service) return sendServices(env, chatId);
    return requestService(env, query, service);
  }

  switch (data) {
    case 'home':
      return editOrSend(env, query, '🎓 أهلًا بك في شذرات للمنح. اختر القسم الذي تحتاجه:', MAIN_MENU);
    case 'scholarships':
      return editOrSend(env, query, '🎓 اختر المنحة. الروابط أدناه تفتح أحدث دليل مباشر:', SCHOLARSHIPS_MENU);
    case 'services':
    case 'apply_services':
    case 'prices':
      return editOrSend(env, query,
        '📝 الخدمات والأسعار\n\nاختر الخدمة المطلوبة. الأسعار أدناه مطابقة لصفحة خدمات شذرات الحالية:',
        SERVICES_MENU
      );
    case 'site_issue':
      return askForIssue(env, chatId);
    case 'human_support':
      return askForSupport(env, chatId);
    default:
      return editOrSend(env, query, 'اختر أحد الخيارات من القائمة:', MAIN_MENU);
  }
}

function sendServices(env, chatId) {
  return sendMessage(env, chatId,
    '📝 الخدمات والأسعار\n\nاختر الخدمة المطلوبة:',
    SERVICES_MENU
  );
}

async function requestService(env, query, service) {
  const chatId = query.message.chat.id;
  if (!env.ADMIN_CHAT_ID) {
    return sendMessage(env, chatId,
      '⏳ طلب الخدمات عبر البوت قيد التجهيز حاليًا. جرّب مرة أخرى لاحقًا أو استخدم صفحة الخدمات بالموقع.',
      { inline_keyboard: [[{ text: '🌐 صفحة الخدمات', url: `${SITE_BASE}/services.html` }], ...BACK_MENU.inline_keyboard] }
    );
  }

  const user = query.from || {};
  await sendAdminNotification(env, {
    title: '🛎 طلب خدمة جديد',
    user,
    chatId,
    details: [`الخدمة: ${service.title}`, `السعر: ${service.price}`]
  });

  return sendMessage(env, chatId,
    `✅ تم استلام طلبك.\n\nالخدمة: ${service.title}\nالسعر: ${service.price}\n\nسيتم التواصل معك من فريق شذرات عند استلام الطلب.`,
    BACK_MENU
  );
}

function askForSupport(env, chatId) {
  return sendMessage(env, chatId,
    '👤 اكتب رسالتك للدعم الآن في ردك على هذه الرسالة.\n\n[SUPPORT_REQUEST]',
    { force_reply: true, selective: true, input_field_placeholder: 'اكتب رسالتك للدعم هنا…' }
  );
}

function askForIssue(env, chatId) {
  return sendMessage(env, chatId,
    '🛠 اشرح مشكلة الموقع باختصار في ردك على هذه الرسالة.\n\n[SITE_ISSUE]',
    { force_reply: true, selective: true, input_field_placeholder: 'اكتب المشكلة هنا…' }
  );
}

async function receiveSupportMessage(env, message, type) {
  const chatId = message.chat.id;
  if (!env.ADMIN_CHAT_ID) {
    return sendMessage(env, chatId,
      '⏳ استقبال رسائل الدعم عبر البوت قيد التجهيز حاليًا. جرّب مرة أخرى لاحقًا.',
      BACK_MENU
    );
  }

  await sendAdminNotification(env, {
    title: type === 'مشكلة في الموقع' ? '🛠 بلاغ مشكلة في الموقع' : '📩 رسالة دعم جديدة',
    user: message.from || {},
    chatId,
    details: [message.text || '[رسالة غير نصية]']
  });

  return sendMessage(env, chatId,
    '✅ تم استلام رسالتك. سيتم الرد عليك من فريق شذرات عند استلامها من أحد المسؤولين.',
    BACK_MENU
  );
}

async function sendAdminNotification(env, { title, user, chatId, details }) {
  const username = user.username ? `@${user.username}` : 'بدون اسم مستخدم';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'مستخدم';
  const body = [
    title,
    `الاسم: ${name}`,
    `المستخدم: ${username}`,
    `Chat ID: ${chatId}`,
    `[USER_ID:${chatId}]`,
    '',
    ...details,
    '',
    '↩️ للرد على الطالب: استخدم Reply على هذه الرسالة واكتب ردك.'
  ].join('\n');
  return sendMessage(env, env.ADMIN_CHAT_ID, body);
}

function isAdmin(message, env) {
  return Boolean(env.ADMIN_CHAT_ID) && String(message.chat.id) === String(env.ADMIN_CHAT_ID);
}

function extractUserId(text) {
  const match = text.match(/\[USER_ID:(-?\d+)\]/);
  return match ? match[1] : null;
}

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

function answerCallback(env, callbackQueryId) {
  return telegram(env, 'answerCallbackQuery', { callback_query_id: callbackQueryId });
}

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
