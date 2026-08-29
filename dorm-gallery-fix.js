(() => {
  if (!location.pathname.endsWith('/university-shukhov.html') && !location.pathname.endsWith('university-shukhov.html')) return;
  const run = () => {
    const gallery = document.querySelector('#dorm .dorm-gallery');
    if (!gallery || gallery.dataset.galleryFixed === '1') return;
    const source = 'assets/shukhov-dorm-4/gallery.svg?v=3';
    gallery.dataset.galleryFixed = '1';
    gallery.classList.add('dorm-gallery-fixed');
    gallery.innerHTML = '';

    const shots = [
      ['صالة رياضية', 0, 0],
      ['غرفة دراسة مشتركة', -100, 0],
      ['صالة جلوس مشتركة', 0, -100],
      ['المطبخ', -100, -100],
      ['غرفة سكن بسريرين', 0, -200],
      ['مبنى السكن من الخارج', -100, -200]
    ];

    const grid = document.createElement('div');
    grid.className = 'dorm-photo-grid';
    shots.forEach(([label, left, top], index) => {
      const figure = document.createElement('figure');
      figure.className = 'dorm-photo-card';
      figure.innerHTML = `<button type="button" class="dorm-photo-button" aria-label="فتح صورة ${label}"><span class="dorm-photo-crop"><img src="${source}" alt="${label} — السكن رقم 4" loading="eager" decoding="async" style="left:${left}%;top:${top}%"></span><span class="dorm-photo-label">${label}</span></button>`;
      grid.appendChild(figure);
    });
    gallery.appendChild(grid);

    const lightbox = document.createElement('div');
    lightbox.className = 'dorm-lightbox';
    lightbox.hidden = true;
    lightbox.innerHTML = '<div class="dorm-lightbox-backdrop"></div><div class="dorm-lightbox-card"><button type="button" class="dorm-lightbox-close" aria-label="إغلاق">×</button><div class="dorm-lightbox-crop"><img alt=""></div><b class="dorm-lightbox-title"></b></div>';
    document.body.appendChild(lightbox);

    const open = (index) => {
      const [label, left, top] = shots[index];
      const img = lightbox.querySelector('.dorm-lightbox-crop img');
      img.src = source;
      img.alt = `${label} — السكن رقم 4`;
      img.style.left = `${left}%`;
      img.style.top = `${top}%`;
      lightbox.querySelector('.dorm-lightbox-title').textContent = label;
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    };
    const close = () => { lightbox.hidden = true; document.body.style.overflow = ''; };
    grid.querySelectorAll('.dorm-photo-button').forEach((button, index) => button.addEventListener('click', () => open(index)));
    lightbox.querySelector('.dorm-lightbox-close').addEventListener('click', close);
    lightbox.querySelector('.dorm-lightbox-backdrop').addEventListener('click', close);
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !lightbox.hidden) close(); });

    if (!document.getElementById('dorm-gallery-fix-style')) {
      const style = document.createElement('style');
      style.id = 'dorm-gallery-fix-style';
      style.textContent = `
        .dorm-gallery-fixed{border:0!important;background:transparent!important;overflow:visible!important}
        .dorm-photo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .dorm-photo-card{margin:0;min-width:0}
        .dorm-photo-button{display:block;width:100%;padding:0;border:1px solid #e4dac8;border-radius:16px;background:#fffdf9;overflow:hidden;cursor:pointer;text-align:right;box-shadow:0 8px 22px rgba(23,53,43,.07)}
        .dorm-photo-crop,.dorm-lightbox-crop{position:relative;display:block;width:100%;aspect-ratio:4/3;overflow:hidden;background:#eee8dd}
        .dorm-photo-crop img,.dorm-lightbox-crop img{position:absolute!important;width:200%!important;max-width:none!important;height:auto!important;display:block!important}
        .dorm-photo-label{display:block;padding:10px 12px;color:#234c3e;font-size:12px;font-weight:900}
        .dorm-lightbox{position:fixed;inset:0;z-index:5000}
        .dorm-lightbox[hidden]{display:none!important}
        .dorm-lightbox-backdrop{position:absolute;inset:0;background:rgba(7,25,20,.78);backdrop-filter:blur(5px)}
        .dorm-lightbox-card{position:absolute;inset:50% auto auto 50%;transform:translate(-50%,-50%);width:min(92vw,880px);padding:12px;border-radius:20px;background:#fffdf9;box-shadow:0 25px 80px rgba(0,0,0,.35)}
        .dorm-lightbox-close{position:absolute;top:18px;left:18px;z-index:2;width:38px;height:38px;border:0;border-radius:12px;background:rgba(255,255,255,.9);font-size:26px;cursor:pointer}
        .dorm-lightbox-title{display:block;padding:10px 4px 2px;color:#234c3e}
        @media(max-width:620px){.dorm-photo-grid{grid-template-columns:1fr;gap:10px}.dorm-photo-label{font-size:13px}.dorm-lightbox-card{width:94vw;padding:8px}}
      `;
      document.head.appendChild(style);
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true }); else run();
})();