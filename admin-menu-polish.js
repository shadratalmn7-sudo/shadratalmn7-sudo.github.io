(() => {
  const labels = {
    'admin-analytics.html': 'مركز المراقبة',
    'admin-homepage.html': 'المحتوى والخدمات',
    'admin-users.html': 'دفتر العملاء',
    'admin-staff.html': 'صلاحيات الموظفين',
    'admin-orders.html': 'الطلبات والمحاسبة',
    'admin-gamification.html': 'الإشعارات والتحفيز',
    'admin-security.html': 'النظام والمالية'
  };
  function polish(card){
    if(!card || card.dataset.monitorReady === '1') return;
    card.dataset.monitorReady = '1';
    card.classList.add('monitor-admin-card');
    const links = card.querySelector('.hamburger-section-links');
    if(!links) return;
    links.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      const text = labels[href];
      if(text){
        const label = a.querySelector('.admin-hamburger-label') || a.querySelector('.menu-label') || a.querySelector('span:last-child');
        if(label) label.textContent = text;
        else a.append(text);
      }
    });
    const oldTitle = card.querySelector('.hamburger-section-title');
    if(oldTitle) oldTitle.remove();
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hamburger-section-toggle admin-monitor-toggle';
    btn.setAttribute('aria-expanded','false');
    btn.innerHTML = '<span><b>إدارة شذرات</b><small>مراقبة، محاسبة وتشغيل</small></span><i aria-hidden="true">⌄</i>';
    card.insertBefore(btn, links);
    links.hidden = true;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      const root = card.closest('.hamburger-sections');
      root?.querySelectorAll('.hamburger-section').forEach(other => {
        if(other === card) return;
        other.classList.remove('is-open');
        other.querySelector('.hamburger-section-toggle')?.setAttribute('aria-expanded','false');
        const otherLinks = other.querySelector('.hamburger-section-links');
        if(otherLinks) otherLinks.hidden = true;
      });
      card.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      links.hidden = !open;
    });
  }
  function scan(){document.querySelectorAll('[data-admin-menu-card]').forEach(polish)}
  scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
})();
