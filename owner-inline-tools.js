(() => {
  if (window.__shadratOwnerToolsReady) return;
  window.__shadratOwnerToolsReady = true;

  const page = location.pathname.split('/').pop() || 'index.html';
  const adminMap = {
    'index.html': 'admin-homepage.html',
    'scholarships.html': 'admin-scholarships.html',
    'documents.html': 'admin-homepage.html',
    'services.html': 'admin-services.html',
    'offers.html': 'admin-offers.html',
    'videos.html': 'admin-videos.html',
    'contact.html': 'admin-messages.html',
    'about.html': 'admin-homepage.html'
  };
  const editHref = adminMap[page] || 'admin-analytics.html';

  const style = document.createElement('style');
  style.textContent = `
    .owner-floating-tools{position:fixed;left:14px;bottom:14px;z-index:998;display:flex;gap:8px;flex-wrap:wrap;max-width:min(92vw,520px);padding:9px;border:1px solid #c9d6e2;border-radius:18px;background:#ffffffee;box-shadow:0 16px 44px #08261c26;backdrop-filter:blur(12px)}
    .owner-floating-tools a,.owner-floating-tools button{border:0;border-radius:13px;padding:10px 12px;background:#334e68;color:#fff;font:inherit;font-size:12px;font-weight:900;text-decoration:none;cursor:pointer}.owner-floating-tools a.primary{background:#176b4b}.owner-floating-tools small{display:flex;align-items:center;color:#506270;font-weight:900;padding:0 4px}
    .owner-edit-chip{position:absolute;top:10px;left:10px;z-index:5;display:inline-flex;align-items:center;gap:6px;border:1px solid #c9d6e2;border-radius:999px;padding:7px 10px;background:#fff;color:#334e68;font-size:11px;font-weight:900;box-shadow:0 8px 18px #17352b12;text-decoration:none}.owner-edit-ready{position:relative}.owner-edit-ready:hover{outline:2px dashed #176b4b33;outline-offset:4px}
    @media(max-width:620px){.owner-floating-tools{right:10px;left:10px;bottom:10px}.owner-floating-tools a,.owner-floating-tools button{flex:1;text-align:center}.owner-floating-tools small{width:100%;justify-content:center}}
  `;
  document.head.appendChild(style);

  const bar = document.createElement('div');
  bar.className = 'owner-floating-tools';
  bar.innerHTML = `<small>وضع المالك</small><a class="primary" href="${editHref}">تعديل هذه الصفحة</a><a href="admin-analytics.html">لوحة الإدارة</a><a href="admin-orders.html">الطلبات</a><button type="button" data-owner-hide>إخفاء</button>`;
  document.body.appendChild(bar);
  bar.querySelector('[data-owner-hide]')?.addEventListener('click', () => bar.remove());

  const targets = document.querySelectorAll('.overview-card,.card,.scholarship-card,.offer-card,.service-card,.steps article,.student-preview,.support-strip,.featured,.site-overview');
  targets.forEach((node, index) => {
    if (index > 20 || node.querySelector('.owner-edit-chip')) return;
    node.classList.add('owner-edit-ready');
    const chip = document.createElement('a');
    chip.className = 'owner-edit-chip';
    chip.href = editHref;
    chip.textContent = 'تعديل';
    node.appendChild(chip);
  });
})();
