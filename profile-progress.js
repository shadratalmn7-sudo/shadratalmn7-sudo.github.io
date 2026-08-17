(() => {
  const tasks = [...document.querySelectorAll('[data-profile-task]')];
  const value = document.querySelector('#profile-progress-value');
  const bar = document.querySelector('#profile-progress-bar');
  const count = document.querySelector('#completed-count');
  const message = document.querySelector('#profile-progress-message');
  if (!tasks.length || !value || !bar) return;

  const storageKey = 'shazarat-profile-tasks-v1';
  let completed = {};
  try { completed = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { completed = {}; }

  const render = () => {
    const done = tasks.filter((task) => task.checked).length;
    const percent = Math.round((done / tasks.length) * 100);
    value.textContent = `${percent}%`;
    bar.style.width = `${percent}%`;
    if (count) count.textContent = `${done} / ${tasks.length}`;
    if (message) message.textContent = percent === 100 ? 'ملفك مكتمل — أنت جاهز للحصول على اقتراحات مخصصة.' : percent === 0 ? 'ابدأ بإكمال بياناتك لتحصل على اقتراحات أدق.' : `أكملت ${done} من ${tasks.length} خطوات.`;
  };

  tasks.forEach((task) => {
    const key = task.dataset.profileTask;
    task.checked = Boolean(completed[key]);
    task.addEventListener('change', () => {
      completed[key] = task.checked;
      localStorage.setItem(storageKey, JSON.stringify(completed));
      render();
    });
  });
  render();
})();
