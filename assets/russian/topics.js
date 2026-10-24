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

      const groups = [...grouped.entries()];
      const pageSize = 60;
      let activeGroup = 0;
      let visibleEntries = [];
      let rendered = 0;
      let searchTimer;

      const section = document.createElement('section');
      section.className = 'word-section topic-group';
      const heading = text('h2', '');
      const grid = document.createElement('div');
      grid.className = 'word-grid';
      const more = text('button', 'عرض المزيد', { type: 'button', class: 'book-button topic-more' });
      section.append(heading, grid, more);
      groupsRoot.append(section);

      const renderNext = () => {
        const fragment = document.createDocumentFragment();
        visibleEntries.slice(rendered, rendered + pageSize).forEach(entry => fragment.append(makeCard(entry)));
        grid.append(fragment);
        rendered = Math.min(rendered + pageSize, visibleEntries.length);
        more.hidden = rendered >= visibleEntries.length;
        status.textContent = `${visibleEntries.length.toLocaleString('en')} مدخلًا · يظهر الآن ${rendered.toLocaleString('en')}`;
      };

      const render = (items, title) => {
        visibleEntries = items;
        rendered = 0;
        heading.textContent = `${title} — ${items.length}`;
        grid.replaceChildren();
        renderNext();
      };

      groups.forEach(([group, items], groupIndex) => {
        const button = text('button', `${group} (${items.length})`, { type: 'button' });
        button.addEventListener('click', () => {
          activeGroup = groupIndex;
          search.value = '';
          indexRoot.querySelectorAll('button').forEach(item => item.classList.remove('is-active'));
          button.classList.add('is-active');
          render(items, group);
        });
        indexRoot.append(button);
      });

      const filter = () => {
        const query = normalize(search.value.trim());
        if (!query) {
          const [group, items] = groups[activeGroup];
          render(items, group);
          return;
        }
        const matches = entries.filter(entry => normalize([
          entry.Russian, entry.Arabic, entry.English, entry.Note,
          entry['Important forms'], entry.Unit, semanticGroup(entry)
        ].join(' ')).includes(query));
        render(matches, `نتائج البحث عن «${search.value.trim()}»`);
      };

      more.addEventListener('click', renderNext);
      search.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(filter, 120);
      });
      indexRoot.querySelector('button')?.classList.add('is-active');
      render(groups[0][1], groups[0][0]);
    })
    .catch(() => {
      status.textContent = 'تعذر تحميل الكلمات الآن. جرّب تحديث الصفحة.';
    });
})();
