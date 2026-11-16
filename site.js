(() => {
  'use strict';
  const lifecycle=new AbortController(); const {signal}=lifecycle;
  let disposed=false;const disposables=[];
  const onWindow=(type,fn,options={})=>window.addEventListener(type,fn,{...options,signal});
  window.__siteDispose=()=>{disposed=true;lifecycle.abort();visibleObserver.disconnect();disposables.forEach(f=>f());};
  const $ = (q, p = document) => p.querySelector(q);
  const $$ = (q, p = document) => [...p.querySelectorAll(q)];
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const forceReduced = new URLSearchParams(location.search).get('motion') === 'off';
  let reduced = motionQuery.matches || forceReduced;
  const setMotionMode = () => {
    reduced = motionQuery.matches || forceReduced;
    document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
  };
  setMotionMode(); motionQuery.addEventListener('change', setMotionMode,{signal});

  // One shared scheduler; off-screen scenes do no rendering.
  const scenes = [];
  let previous = performance.now();
  const visibleObserver = new IntersectionObserver(entries => {
    for (const e of entries) {
      const scene = scenes.find(s => s.el === e.target);
      if (scene) { scene.visible = e.isIntersecting; scene.dirty = true; }
    }
  }, { rootMargin: '100px' });
  function addScene(scene) { scene.visible = false; scene.dirty = true; scenes.push(scene); visibleObserver.observe(scene.el); }
  function frame(now) {
    if(disposed)return;
    const dt = Math.min((now - previous) / 1000, .04); previous = now;
    if (!document.hidden) for (const scene of scenes) if (scene.visible) scene.tick(dt, now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  const header = $('.site-header'), menu = $('#mobile-menu'), menuToggle = $('.menu-toggle');
  function toggleMenu(open) {
    menu.hidden = !open; menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('no-scroll', open);
    header.classList.toggle('menu-is-open', open);
    if (open) $('a', menu).focus(); else menuToggle.focus({ preventScroll: true });
  }
  menuToggle.addEventListener('click', () => toggleMenu(menu.hidden));
  $$('a', menu).forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  onWindow('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) toggleMenu(false);
    if (e.key === 'Tab' && !menu.hidden) {
      const nodes = [menuToggle, ...$$('a', menu)];
      if (e.shiftKey && document.activeElement === menuToggle) { e.preventDefault(); nodes.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === nodes.at(-1)) { e.preventDefault(); menuToggle.focus(); }
    }
  });
  function updateHeader() { header.classList.toggle('header-compact', scrollY > innerHeight * .7); }
  onWindow('scroll', updateHeader, { passive: true }); updateHeader();
  onWindow('load',updateHeader,{once:true});
  const heroSection=$('.hero-live');
  if(heroSection){const headerObserver=new IntersectionObserver(es=>header.classList.toggle('header-compact',!es[0].isIntersecting),{threshold:0});headerObserver.observe(heroSection);disposables.push(()=>headerObserver.disconnect());}

  const projectIndex = $('.project-index'), rows = $$('.project-row'), preview = $('.preview-frame>img');
  function previewRow(row) {
    if (matchMedia('(max-width:760px)').matches) return;
    if (!preview || preview.getAttribute('src') === row.dataset.preview) return;
    preview.src = row.dataset.preview; preview.alt = $('.row-name p', row).textContent;
    const caption = $('.preview-caption>span'); if (caption) caption.textContent = 'SELECTED PROJECT / ' + $('.row-number', row).textContent;
    projectIndex.dataset.preview = row.dataset.pageTitle;
    const d = $('.project-deck');
    if (d) d.hidden = !row.href.includes('shokz-black-friday');
    $('.preview-frame').hidden = row.href.includes('shokz-black-friday');
  }
  rows.forEach(row => { row.addEventListener('pointerenter', () => previewRow(row)); row.addEventListener('focus', () => previewRow(row)); });
  $$('[data-filter]').forEach(b => b.addEventListener('click', () => {
    projectIndex.dataset.filter = b.dataset.filter;
    $$('[data-filter]').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    rows.forEach(row => row.hidden = b.dataset.filter !== 'all' && row.dataset.kind !== b.dataset.filter);
    const first = rows.find(row => !row.hidden); if (first) previewRow(first);
  }));
  $$('[data-view]').forEach(b => b.addEventListener('click', () => {
    projectIndex.classList.toggle('grid-mode', b.dataset.view === 'grid');
    $$('[data-view]').forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  }));
  $$('.project-deck').forEach(d => {
    $$('.deck-card', d).forEach(card => {
      function promote() { $$('.deck-card', d).forEach(c => c.dataset.front = String(c === card)); }
      card.addEventListener('pointerenter', promote); card.addEventListener('focus', promote);
    });
  });

  // Accessible image viewing. The actual source images keep their original proportions.
  const lightbox = $('.lightbox'), lightboxImage = $('.lightbox-stage img'), lightboxCaption = $('.lightbox>p');
  let imageItems = [], imageIndex = 0, previousFocus;
  function showImage(index) {
    imageIndex = (index + imageItems.length) % imageItems.length;
    const item = imageItems[imageIndex]; lightboxImage.src = item.src;
    lightboxImage.alt = item.caption; lightboxCaption.textContent = item.caption;
  }
  function openImage(src, caption, source) {
    previousFocus = source || document.activeElement;
    const nearestGallery = source?.closest('.gallery,.flat-gallery,.evidence-panel,.case-section');
    const candidates = nearestGallery ? $$('[data-lightbox]', nearestGallery) : [];
    imageItems = candidates.length ? candidates.map(e => ({ src: e.dataset.lightbox, caption: e.dataset.caption })) : [{ src, caption }];
    const index = imageItems.findIndex(e => e.src === src); showImage(Math.max(index, 0));
    $('.lightbox-nav').hidden = imageItems.length < 2;
    lightbox.showModal(); document.body.classList.add('no-scroll'); $('.lightbox-close').focus();
  }
  $$('[data-lightbox]').forEach(b => b.addEventListener('click', () => openImage(b.dataset.lightbox, b.dataset.caption, b)));
  $('.lightbox-close').addEventListener('click', () => lightbox.close());
  $('[data-prev]').addEventListener('click', () => showImage(imageIndex - 1));
  $('[data-next]').addEventListener('click', () => showImage(imageIndex + 1));
  lightbox.addEventListener('close', () => { document.body.classList.remove('no-scroll'); lightboxImage.removeAttribute('src'); previousFocus?.focus({ preventScroll: true }); });
  lightbox.addEventListener('click', e => { if (e.target === lightbox || e.target.classList.contains('lightbox-stage')) lightbox.close(); });
  lightbox.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') showImage(imageIndex + 1);
    if (e.key === 'ArrowLeft') showImage(imageIndex - 1);
  });

  // Reusable tab groups with touch and arrow-key support.
  $$('[role=tablist]').forEach(list => {
    const tabs = $$('[role=tab]', list);
    function activate(tab) {
      tabs.forEach(t => {
        const selected = t === tab; t.setAttribute('aria-selected', String(selected)); t.tabIndex = selected ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
      });
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', e => {
        let next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); activate(tabs[next]); tabs[next].focus(); }
      });
    });
  });

  // Mobbin-inspired depth reel: steady text, independently moving icon cards.
  const toolSection = $('.tools-section');
  if (toolSection) {
    const cards = $$('.tool-card', toolSection), reels = $$('.tool-reel', toolSection);
    let time = 0, userPaused = false, hoverPaused = false;
    const button = $('.motion-toggle');
    toolSection.addEventListener('pointerover', e => { if (e.target.closest('.tool-reel')) hoverPaused = true; });
    toolSection.addEventListener('pointerout', e => { if (!e.relatedTarget?.closest('.tool-reel')) hoverPaused = false; });
    cards.forEach(card => {
      function describe() { $('.tool-description strong').textContent = card.dataset.tool; $('.tool-description span').textContent = card.dataset.use; }
      card.addEventListener('pointerenter', describe); card.addEventListener('focus', () => { hoverPaused = true; describe(); });
      card.addEventListener('blur', () => hoverPaused = false);
      card.addEventListener('click', describe);
    });
    button?.addEventListener('click', () => {
      userPaused = !userPaused; button.setAttribute('aria-pressed', String(userPaused));
      button.textContent = userPaused ? '▶ 继续图标动态' : 'Ⅱ 暂停图标动态';
    });
    const scene = { el: toolSection, tick(dt) {
      if (!reduced && !userPaused && !hoverPaused) time += dt;
      const mobile = matchMedia('(max-width:760px)').matches;
      reels.forEach((reel, side) => {
        $$('.tool-card', reel).forEach((card, i) => {
          const angle = i / 5 * Math.PI * 2 + (reduced ? 0 : time / 12 * Math.PI * 2) * (side ? -1 : 1);
          const depth = (Math.cos(angle) + 1) / 2;
          const spread = mobile ? Math.min(reel.clientWidth * .35, 132) : 145;
          const long = Math.sin(angle) * spread;
          const short = (depth - .5) * (mobile ? 42 : 55) * (side ? -1 : 1);
          const scale = .65 + depth * .35;
          card.style.transform = `translate3d(${mobile ? long : short}px,${mobile ? short : long}px,0) scale(${scale})`;
          card.style.zIndex = String(Math.round(depth * 100));
          card.style.filter = reduced ? 'none' : `blur(${Math.max(0, .35 - depth) * 6}px)`;
          card.style.opacity = String(.66 + depth * .34);
        });
      });
      toolSection.dataset.motionTime = time.toFixed(2); toolSection.dataset.paused = String(userPaused || hoverPaused || reduced);
    } };
    addScene(scene); scene.tick(0);
  }

  // SeaLink-inspired continuously curved image ribbon. Small vertical image strips
  // are projected onto a smooth screen-space surface, preserving native aspect ratio.
  const ribbon = $('.ribbon-stage');
  if (ribbon) {
    const canvas = $('canvas', ribbon), ctx = canvas.getContext('2d', { alpha: false });
    const images = $$('img', $('.ribbon-fallback'));
    // Horizontal lazy-load clipping otherwise leaves small screens below the ready threshold.
    images.forEach(im => im.loading = 'eager');
    let w = 0, h = 0, offset = 0, inertia = 0, dragging = false, paused = false, dragStart = null, shift = 0, paintCount = 0;
    let positions = [], lastPoint = 0;
    let needsPaint = true;
    const control = $('[data-wall-pause]');
    function resize() {
      const box = ribbon.getBoundingClientRect(); w = box.width; h = box.height;
      const dpr = Math.min(devicePixelRatio, 1.6); canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      needsPaint = true;
    }
    const ribbonObserver=new ResizeObserver(resize); ribbonObserver.observe(ribbon);disposables.push(()=>ribbonObserver.disconnect());resize();
    function toggle() { paused = !paused; needsPaint = true; }
    control?.addEventListener('click', toggle);
    $('[data-ribbon-prev]').addEventListener('click', () => { if (reduced) $('.ribbon-fallback').scrollBy({left:-220,behavior:'instant'}); else shift -= w < 760 ? 180 : 270; });
    $('[data-ribbon-next]').addEventListener('click', () => { if (reduced) $('.ribbon-fallback').scrollBy({left:220,behavior:'instant'}); else shift += w < 760 ? 180 : 270; });
    $('[data-wall-flat]')?.addEventListener('click', e => {
      const flat = $('#flat-gallery'); flat.hidden = !flat.hidden; e.currentTarget.setAttribute('aria-expanded', String(!flat.hidden));
      e.currentTarget.textContent = flat.hidden ? '平铺浏览全部作品 ↗' : '收起平铺作品 ↑';
    });
    ribbon.addEventListener('pointerdown', e => {
      if (reduced || e.button !== 0) return;
      dragging = true; ribbon.dataset.dragging = 'true'; dragStart = { x: e.clientX, y: e.clientY }; lastPoint = e.clientX; inertia = 0;
      ribbon.setPointerCapture(e.pointerId);
    });
    ribbon.addEventListener('pointermove', e => {
      if (!dragging) return;
      const delta = e.clientX - lastPoint; offset -= delta; inertia = -delta * 12; lastPoint = e.clientX;
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false; ribbon.dataset.dragging = 'false'; ribbon.releasePointerCapture(e.pointerId);

    }
    ribbon.addEventListener('pointerup', endDrag);
    ribbon.addEventListener('pointercancel', e => { dragging = false; ribbon.dataset.dragging = 'false'; inertia = 0; });
    ribbon.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); if(reduced) $('.ribbon-fallback').scrollBy({left:-220,behavior:'instant'}); else shift -= 220; }
      if (e.key === 'ArrowRight') { e.preventDefault(); if(reduced) $('.ribbon-fallback').scrollBy({left:220,behavior:'instant'}); else shift += 220; }
    });
    const scene = { el: ribbon, tick(dt) {
      if (reduced || !ctx) { ribbon.classList.remove('ready'); return; }
      const loaded = images.filter(im => im.complete && im.naturalWidth);
      if (loaded.length < 4 || !w) return;
      if (paused && !dragging && Math.abs(inertia) < .1 && Math.abs(shift) < .1 && !needsPaint) return;
      ribbon.classList.add('ready');
      const size = w < 760 ? 165 : Math.min(270, w * .22), gap = w < 760 ? 8 : 12, pitch = size + gap, total = images.length * pitch;
      if (!dragging && !paused && !lightbox.open) offset += dt * 24;
      if (!dragging && Math.abs(inertia) > .1) { offset += inertia * dt; inertia *= Math.exp(-8 * dt); }
      if (Math.abs(shift) > .1) { const step = shift * (1 - Math.exp(-10 * dt)); offset += step; shift -= step; }
      ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, w, h); positions = [];
      const strip = w < 760 ? 6 : 5;
      images.forEach((im, i) => {
        if (!im.complete || !im.naturalWidth) return;
        const x = ((i * pitch - offset + total * 100) % total) - pitch;
        if (x < -size - 10 || x > w + 10) return;
        const aspect = im.naturalHeight / im.naturalWidth;
        const drawW = Math.min(size, h * .79 / aspect), cardH = drawW * aspect, center = h * .49;
        const inset = (size - drawW) / 2;
        positions.push({ x, width: size, src: im.src });
        for (let dx = 0; dx < drawW; dx += strip) {
          const bw = Math.min(strip, drawW - dx), sx = x + inset + dx;
          const n = (sx + bw / 2 - w / 2) / Math.max(w * .62, 1);
          const wave = Math.cos(n * Math.PI * .72);
          const depth = .83 + .17 * wave;
          const scaledH = cardH * depth;
          const top = center - scaledH / 2 - wave * (w < 760 ? 16 : 35);
          ctx.globalAlpha = .83 + .17 * Math.max(0, wave);
          ctx.drawImage(im, dx / drawW * im.naturalWidth, 0, bw / drawW * im.naturalWidth, im.naturalHeight, sx, top, bw + .6, scaledH);
        }
      });
      ctx.globalAlpha = 1;
      canvas.dataset.offset = offset.toFixed(2); canvas.dataset.frame = String(++paintCount); canvas.dataset.paused = String(paused);
      needsPaint = false;
    } };
    addScene(scene);
    images.forEach(im => im.addEventListener('load', () => needsPaint = true));
  }

  $$('img').forEach(im => im.addEventListener('error', () => {
    const button = im.closest('.image-button'); if (button) { button.classList.add('failed'); im.hidden = true; }
  }));
})();
