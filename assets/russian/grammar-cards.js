(() => {
  const topics = [...document.querySelectorAll('section.grammar-topic')];
  if (!topics.length) return;

  const cards = topics.map((topic, index) => {
    const heading = topic.querySelector(':scope > h1');
    if (!heading) return topic;
    const card = document.createElement('details');
    card.className = 'grammar-topic grammar-card';
    card.id = heading.id || `grammar-card-${index + 1}`;
    const summary = document.createElement('summary');
    const number = document.createElement('span');
    number.textContent = String(index + 1).padStart(2, '0');
    const title = document.createElement('b');
    title.textContent = heading.textContent;
    summary.append(number, title);
    const body = document.createElement('div');
    body.className = 'grammar-card-body';
    [...topic.childNodes].forEach(node => {
      if (node !== heading) body.append(node);
    });
    card.append(summary, body);
    topic.replaceWith(card);
    return card;
  });

  const openHash = () => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (target?.matches('.grammar-card')) target.open = true;
  };
  cards.forEach(card => card.addEventListener('toggle', () => {
    if (!card.open) return;
    cards.forEach(other => {
      if (other !== card) other.open = false;
    });
  }));
  addEventListener('hashchange', openHash);
  openHash();
})();
