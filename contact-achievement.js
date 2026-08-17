(() => {
  const type = document.querySelector('#type');
  const fields = [...document.querySelectorAll('[data-achievement-field]')];
  const contact = document.querySelector('#contact-method');
  const proof = document.querySelector('#proof-link');
  const serviceField = document.querySelector('[data-service-field]');
  const serviceName = document.querySelector('#service-name');
  const message = document.querySelector('#message');
  const params = new URLSearchParams(location.search);

  function updateAchievementFields() {
    const active = type?.value === 'achievement';
    fields.forEach((field) => { field.hidden = !active; });
    if (contact) contact.required = active;
    if (proof) proof.required = active;
  }

  function updateServiceField() {
    const active = type?.value === 'service';
    if (serviceField) serviceField.hidden = !active;
    if (serviceName) serviceName.required = active;
  }

  const requestedType = params.get('type');
  if ((requestedType === 'achievement' || requestedType === 'service') && type) type.value = requestedType;
  const requestedService = (params.get('service') || '').trim().slice(0, 120);
  if (requestedService && serviceName) {
    serviceName.value = requestedService;
    if (message && !message.value) message.value = `أرغب في طلب خدمة: ${requestedService}\n\nوسيلة التواصل المناسبة معي: `;
  }
  type?.addEventListener('change', () => {
    updateAchievementFields();
    updateServiceField();
  });
  updateAchievementFields();
  updateServiceField();
})();
