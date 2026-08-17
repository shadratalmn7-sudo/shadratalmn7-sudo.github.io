(() => {
  const modal = document.querySelector('#profile-edit-modal');
  const form = document.querySelector('#profile-edit-form');
  const openButtons = document.querySelectorAll('.student-edit, [data-demo="edit-profile"]');
  const closeButtons = modal?.querySelectorAll('.profile-modal-close, .profile-modal-cancel') || [];
  const storageKey = 'shazarat_student_profile_preview';
  const defaults = { fullName: 'اسم الطالب', username: 'student_name', email: 'student@example.com', phone: '', location: '', studyLevel: '' };

  function getProfile() {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; }
    catch { return defaults; }
  }

  function render(profile) {
    document.querySelectorAll('[data-profile-value]').forEach((item) => {
      const key = item.dataset.profileValue;
      const empty = key === 'phone' ? 'لم تتم إضافته' : 'لم يتم تحديدها';
      item.textContent = key === 'username' ? `@${profile[key] || 'student_name'}` : (profile[key] || empty);
    });
    document.querySelector('.student-name h2').textContent = `مرحبًا، ${profile.fullName || 'اسم الطالب'}`;
    document.querySelector('.student-name .handle').textContent = `@${profile.username || 'student_name'}`;
  }

  function setOpen(open) {
    modal?.classList.toggle('is-open', open);
    modal?.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
    if (open && form) {
      const profile = getProfile();
      Object.entries(profile).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value; });
      form.elements.fullName?.focus();
    }
  }

  openButtons.forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); setOpen(true); }));
  closeButtons.forEach((button) => button.addEventListener('click', () => setOpen(false)));
  modal?.addEventListener('click', (event) => { if (event.target === modal) setOpen(false); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    localStorage.setItem(storageKey, JSON.stringify(data));
    render(data);
    setOpen(false);
  });
  render(getProfile());
})();
