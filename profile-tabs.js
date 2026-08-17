(() => {
  const tabs = [...document.querySelectorAll('[data-profile-tab]')];
  const panelNames = ['student-info', 'level', 'missions', 'rewards', 'saved', 'journey', 'orders'];
  const panels = panelNames.flatMap((name) => [...document.querySelectorAll(`[data-profile-panel="${name}"], #${name}`)]);

  function openPanel(name, updateUrl = true) {
    if (name === 'missions') name = 'level';
    if (!panelNames.includes(name)) name = 'student-info';

    tabs.forEach((tab) => {
      const active = tab.dataset.profileTab === name;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    panels.forEach((panel) => {
      const panelName = panel.dataset.profilePanel || panel.id;
      const active = panelName === name || (name === 'level' && panelName === 'missions');
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });

    if (updateUrl) history.replaceState(null, '', `#${name}`);
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => openPanel(tab.dataset.profileTab)));

  const editProfile = document.querySelector('.student-edit');
  editProfile?.addEventListener('click', (event) => {
    event.preventDefault();
    openPanel('student-info');
  });

  openPanel(location.hash.slice(1), false);
})();
