(() => {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;

  let activeButton = null;
  const getRussianVoice = () => speechSynthesis.getVoices().find(voice => /^ru(?:-|_)/i.test(voice.lang));

  const addButton = heading => {
    if (heading.dataset.speechReady === 'true') return;
    const word = heading.textContent.trim();
    if (!word) return;
    heading.dataset.speechReady = 'true';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'speak-button';
    button.dataset.speak = word;
    button.setAttribute('aria-label', `استمع إلى نطق ${word} بالروسية`);
    button.setAttribute('title', 'استمع إلى النطق الروسي');
    button.textContent = '🔊';
    heading.closest('.word')?.append(button);
  };

  const hydrate = root => {
    if (root.nodeType !== Node.ELEMENT_NODE && root !== document) return;
    if (root.matches?.('.word h3[lang="ru"]')) addButton(root);
    root.querySelectorAll?.('.word h3[lang="ru"]').forEach(addButton);
  };

  document.addEventListener('click', event => {
    const button = event.target.closest('.speak-button');
    if (!button) return;
    speechSynthesis.cancel();
    if (activeButton) activeButton.classList.remove('is-speaking');
    activeButton = button;
    button.classList.add('is-speaking');
    const utterance = new SpeechSynthesisUtterance(button.dataset.speak);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.82;
    utterance.pitch = 1;
    const voice = getRussianVoice();
    if (voice) utterance.voice = voice;
    const clear = () => {
      button.classList.remove('is-speaking');
      if (activeButton === button) activeButton = null;
    };
    utterance.addEventListener('end', clear, { once: true });
    utterance.addEventListener('error', clear, { once: true });
    speechSynthesis.speak(utterance);
  });

  hydrate(document);
  new MutationObserver(mutations => {
    mutations.forEach(mutation => mutation.addedNodes.forEach(hydrate));
  }).observe(document.body, { childList: true, subtree: true });
})();
