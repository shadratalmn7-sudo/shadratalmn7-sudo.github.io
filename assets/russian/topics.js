(() => {
  const groupsRoot = document.querySelector('#topic-groups');
  const indexRoot = document.querySelector('#topic-index');
  const search = document.querySelector('#topic-search');
  const status = document.querySelector('#topic-status');
  if (!groupsRoot || !indexRoot || !search || !status) return;

  const text = (tag, value, attributes = {}) => {
    const element = document.createElement(tag);
    element.textContent = value ?? '';
    Object.entries(attributes).forEach(([name, entry]) => element.setAttribute(name, entry));
    return element;
  };

  const normalize = value => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ar');

  const professionWords = /^(инжене́р|преподава́тель|дире́ктор|врач|хи́мик|журнали́ст|журнали́стка|экономи́ст|профе́ссия|спортсме́н|продаве́ц|арти́ст|учи́тель|слу́жащий|худо́жник|поэ́т|арти́стка|спортсме́нка|писа́тель|перево́дчик|учи́тельница|медсестра́|фи́зик|музыка́нт|компози́тор|матема́тик|рок-музыка́нт)$/u;
  const semanticGroup = entry => {
    if (entry.Group === 'الدراسة واللغة' || professionWords.test(entry.Russian || '')) {
      return 'الدراسة والتخصصات والمهن والمدرسون';
    }
    return entry.Group || 'غير مصنف';
  };

  const makeCard = entry => {
    const card = document.createElement('article');
    card.className = 'word';
    card.id = `topic-${entry['Entry ID']}`;
    card.dataset.search = normalize([entry.Russian, entry.Arabic, entry.English, entry.Note, entry['Important forms'], entry.Unit].join(' '));
    card.append(text('h3', entry.Russian, { lang: 'ru', dir: 'ltr' }));
    card.append(text('p', entry.Arabic));
    card.append(text('p', entry.English, { lang: 'en', dir: 'ltr' }));
    if (entry.Note) card.append(text('small', entry.Note));
    if (entry['Important forms']) card.append(text('p', entry['Important forms'], { class: 'forms', dir: 'auto' }));
    const meta = document.createElement('p');
    meta.className = 'search-meta';
    meta.append(text('a', `الدرس ${entry.Unit}`, { href: `russian-lesson-${entry.Unit}.html#${entry['Entry ID']}` }));
    card.append(meta);
    return card;
  };

  fetch('assets/russian/search.json')
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(entries => {
      const grouped = new Map();
      entries.forEach(entry => {
        const group = semanticGroup(entry);
        if (!grouped.has(group)) grouped.set(group, []);
        grouped.get(group).push(entry);
      });

      grouped.forEach((items, group, groupIndex) => {
        const id = `group-${groupIndex + 1}`;
        indexRoot.append(text('a', `${group} (${items.length})`, { href: `#${id}` }));
        const section = document.createElement('section');
        section.className = 'word-section topic-group';
        section.id = id;
        section.append(text('h2', `${group} — ${items.length}`));
        const grid = document.createElement('div');
        grid.className = 'word-grid';
        items.forEach(entry => grid.append(makeCard(entry)));
        section.append(grid);
        groupsRoot.append(section);
      });

      const cards = [...groupsRoot.querySelectorAll('.word')];
      const sections = [...groupsRoot.querySelectorAll('.topic-group')];
      const filter = () => {
        const query = normalize(search.value.trim());
        let visible = 0;
        cards.forEach(card => {
          const show = !query || card.dataset.search.includes(query);
          card.hidden = !show;
          if (show) visible += 1;
        });
        sections.forEach(section => {
          section.hidden = ![...section.querySelectorAll('.word')].some(card => !card.hidden);
        });
        indexRoot.hidden = Boolean(query);
        status.textContent = query ? `${visible} نتيجة مطابقة` : `${entries.length.toLocaleString('en')} مدخلًا في ${grouped.size} مجموعة موضوعية`;
      };
      search.addEventListener('input', filter);
      filter();
    })
    .catch(() => {
      status.textContent = 'تعذر تحميل الكلمات الآن. جرّب تحديث الصفحة.';
    });
})();
