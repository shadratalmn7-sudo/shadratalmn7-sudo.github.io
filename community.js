(() => {
  const dialog = document.querySelector('#login-dialog');
  const closeDialog = () => {
    dialog?.classList.remove('is-open');
    dialog?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  };
  dialog?.querySelectorAll('[data-dialog-close]').forEach((button) => button.addEventListener('click', closeDialog));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDialog(); });
  document.querySelectorAll('.side-filter').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.side-filter').forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
  }));
  const requestedScholarship = new URLSearchParams(location.search).get('scholarship');
  const scholarshipFilter = document.querySelector('#scholarship-filter');
  if (requestedScholarship && scholarshipFilter) scholarshipFilter.value = requestedScholarship;
})();
