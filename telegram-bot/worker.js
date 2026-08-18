const MAIN_MENU = {
  inline_keyboard: [
    [{ text: '🎓 المنح الدراسية', callback_data: 'scholarships' }],
    [{ text: '📝 خدمات التقديم', callback_data: 'apply_services' }],
    [{ text: '💰 الخدمات والأسعار', callback_data: 'prices' }],
    [{ text: '🛠 مشكلة في الموقع', callback_data: 'site_issue' }],
    [{ text: '👤 التواصل مع الدعم', callback_data: 'human_support' }]
  ]
};

const BACK_MENU = {
  inline_keyboard: [[{ text: '⬅️ العودة للقائمة الرئيسية', callback_data: 'home' }]]
};

const SCHOLARSHIPS_MENU = {
  inline_keyboard: [
    [{ text: '🇷🇺 Open Doors', callback_data: 'open_doors' }],
    [{ text: '🇷🇺 منحة الحكومة الروسية', callback_data: 'education_russia' }],
    [{ text: '🇹🇷 المنحة التركية', callback_data: 'turkiye' }],
    [{ text: '🌐 جميع المنح', url: 'https://shadratalmn7-sudo.github.io/scholarships.html' }],
    [{ text: '⬅️ رجوع', callback_data: 'home' }]
  ]
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET') {
      return new Response('Shadrat Support Bot is running ✅', { status: 200 });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!env.BOT_TOKEN) {
      return new Response('BOT_TOKEN is missing', { status: 500 });
    }

    let update;
    try {
      update = await request.json();
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    try {
      if (update.callback_query) {
        await handleCallback(update.callback_query, env);
      } else if (update.message) {
        await handleMessage(update.message, env);
      }
      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error(error);
      return new Response('OK', { status: 200 });
    }
  }
};

async function handleMessage(message, env) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();

  if (text === '/start' || text === '/help') {
    return sendMessage(env, chatId,
      '🎓 أهلًا بك في بوت الدعم الرسمي لمنصة شذرات للمنح.\n\nاختر القسم الذي تحتاجه من القائمة التالية:',
      MAIN_MENU
    );
  }

  if (text === '/id') {
    return sendMessage(env, chatId, `معرّف المحادثة الخاص بك:\n${chatId}`);
  }

  if (text === '/contact') {
    return startSupport(env, chatId);
  }

  if (text === '/services') {
    return sendMessage(env, chatId,
      '💼 خدمات شذرات تشمل الاستشارات، خدمات التقديم، والترجمة والتصديق حسب الخدمة المتاحة.\n\nيمكنك مشاهدة التفاصيل المحدثة من الموقع:',
      { inline_keyboard: [[{ text: 'فتح صفحة الخدمات', url: 'https://shadratalmn7-sudo.github.io/services.html' }], ...BACK_MENU.inline_keyboard] }
    );
  }

  if (text === '/scholarships') {
    return sendMessage(env, chatId, '🎓 اختر المنحة التي تريد معرفة المزيد عنها:', SCHOLARSHIPS_MENU);
  }

  // إذا كان المستخدم قد بدأ طلب دعم، حوّل رسالته للدعم إن وُجد ADMIN_CHAT_ID.
  if (env.ADMIN_CHAT_ID && text) {
    await forwardSupportMessage(env, message);
    return sendMessage(env, chatId,
      '✅ وصلت رسالتك إلى فريق الدعم. سيتم الرد عليك عند توفر أحد أعضاء الفريق.',
      BACK_MENU
    );
  }

  return sendMessage(env, chatId,
    'هذا البوت مخصص للاستفسارات المتعلقة بالدراسة والمنح وخدمات شذرات فقط. اختر أحد الخيارات من القائمة:',
    MAIN_MENU
  );
}

async function handleCallback(query, env) {
  const chatId = query.message.chat.id;
  const data = query.data;
  await answerCallback(env, query.id);

  switch (data) {
    case 'home':
      return editOrSend(env, query,
        '🎓 أهلًا بك في شذرات للمنح. اختر القسم الذي تحتاجه:',
        MAIN_MENU
      );

    case 'scholarships':
      return editOrSend(env, query, '🎓 اختر المنحة:', SCHOLARSHIPS_MENU);

    case 'open_doors':
      return editOrSend(env, query,
        '🇷🇺 منحة Open Doors\n\nيمكنك قراءة التفاصيل المحدثة، المواعيد، الشروط وخطوات التقديم من صفحة المنحة في شذرات.',
        { inline_keyboard: [[{ text: 'فتح صفحة Open Doors', url: 'https://shadratalmn7-sudo.github.io/open-doors.html' }], ...BACK_MENU.inline_keyboard] }
      );

    case 'education_russia':
      return editOrSend(env, query,
        '🇷🇺 منحة الحكومة الروسية\n\nلأن المواعيد والتفاصيل قد تختلف حسب الدولة والموسم، اعتمد على صفحة شذرات المحدثة للمعلومات.',
        { inline_keyboard: [[{ text: 'فتح صفحة المنحة', url: 'https://shadratalmn7-sudo.github.io/education-in-russia.html' }], ...BACK_MENU.inline_keyboard] }
      );

    case 'turkiye':
      return editOrSend(env, query,
        '🇹🇷 المنحة التركية\n\nتجد في صفحة شذرات التفاصيل المتاحة والمواعيد والشروط عند تحديثها.',
        { inline_keyboard: [[{ text: 'فتح صفحة المنحة التركية', url: 'https://shadratalmn7-sudo.github.io/turkiye-scholarships.html' }], ...BACK_MENU.inline_keyboard] }
      );

    case 'apply_services':
      return editOrSend(env, query,
        '📝 خدمات التقديم\n\nيمكنك الاطلاع على خدمات التقديم المتاحة حاليًا ونطاق كل خدمة من صفحة الخدمات. لا يضمن أي طلب خدمة القبول في منحة أو جامعة.',
        { inline_keyboard: [[{ text: 'عرض خدمات التقديم', url: 'https://shadratalmn7-sudo.github.io/services.html' }], ...BACK_MENU.inline_keyboard] }
      );

    case 'prices':
      return editOrSend(env, query,
        '💰 الخدمات والأسعار\n\nحتى لا يعطي البوت سعرًا قديمًا، الأسعار المعتمدة هي الموجودة في صفحة الخدمات بالموقع.',
        { inline_keyboard: [[{ text: 'عرض الأسعار الحالية', url: 'https://shadratalmn7-sudo.github.io/services.html' }], ...BACK_MENU.inline_keyboard] }
      );

    case 'site_issue':
      return editOrSend(env, query,
        '🛠 مشكلة في الموقع\n\nاكتب رسالتك الآن واشرح المشكلة باختصار. إذا تم إعداد ADMIN_CHAT_ID ستصل رسالتك إلى فريق الدعم مباشرة.',
        BACK_MENU
      );

    case 'human_support':
      return startSupport(env, chatId);

    default:
      return editOrSend(env, query, 'اختر أحد الخيارات من القائمة:', MAIN_MENU);
  }
}

async function startSupport(env, chatId) {
  if (!env.ADMIN_CHAT_ID) {
    return sendMessage(env, chatId,
      '👤 التواصل مع الدعم\n\nخدمة تحويل الرسائل للدعم تحتاج فقط إضافة ADMIN_CHAT_ID في إعدادات Cloudflare. إلى أن يتم ذلك، استخدم صفحة التواصل في الموقع.',
      { inline_keyboard: [[{ text: 'صفحة التواصل', url: 'https://shadratalmn7-sudo.github.io/contact.html' }], ...BACK_MENU.inline_keyboard] }
    );
  }

  return sendMessage(env, chatId,
    '👤 اكتب رسالتك الآن بالتفصيل، وسيتم تحويلها إلى فريق الدعم.',
    BACK_MENU
  );
}

async function forwardSupportMessage(env, message) {
  const user = message.from || {};
  const username = user.username ? `@${user.username}` : 'بدون اسم مستخدم';
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'مستخدم';
  const body = [
    '📩 رسالة دعم جديدة من بوت شذرات',
    `الاسم: ${name}`,
    `المستخدم: ${username}`,
    `Chat ID: ${message.chat.id}`,
    '',
    message.text || '[رسالة غير نصية]'
  ].join('\n');

  return sendMessage(env, env.ADMIN_CHAT_ID, body);
}

async function telegram(env, method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Telegram ${method} failed: ${detail}`);
  }
  return response.json();
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
