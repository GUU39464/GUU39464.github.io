(() => {
  const hero = document.querySelector('.hero-video');
  const heroSection = document.querySelector('.video-hero');
  const source = hero?.querySelector('source[data-src]');
  const play = document.querySelector('.hero-play-toggle');
  const sound = document.querySelector('[data-sound-toggle]');
  const status = document.querySelector('[data-hero-video-status]');
  const progress = document.querySelector('[data-video-progress]');
  const duration = document.querySelector('[data-video-duration]');
  if (!hero || !heroSection || !play || !sound || !source) return;

  let loaded = false;
  let manualPause = true;
  let resumeWhenVisible = false;
  let loadTimer = 0;

  function format(seconds) {
    if (!Number.isFinite(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function setStatus(message, state = '') {
    status.textContent = message;
    status.dataset.state = state;
  }

  function label() {
    play.textContent = hero.paused ? '播放 ▶' : '暂停 II';
    play.setAttribute('aria-label', hero.paused ? '播放首屏视频' : '暂停首屏视频');
    sound.textContent = hero.muted ? 'SOUND OFF' : 'SOUND ON';
    sound.setAttribute('aria-label', hero.muted ? '开启视频声音' : '关闭视频声音');
  }

  function loadHero() {
    if (loaded) return;
    loaded = true;
    heroSection.classList.add('video-loading');
    setStatus('视频加载中…', 'loading');
    source.src = source.dataset.src;
    hero.load();
    loadTimer = window.setTimeout(() => {
      if (hero.readyState < 3) setStatus('网络较慢，视频仍在加载', 'slow');
    }, 12000);
  }

  async function start() {
    manualPause = false;
    loadHero();
    try {
      await hero.play();
    } catch {
      hero.muted = true;
      try {
        await hero.play();
      } catch {
        setStatus('视频暂时无法播放，请点击重试', 'error');
      }
    }
    label();
  }

  function toggle() {
    if (hero.paused) start();
    else {
      manualPause = true;
      resumeWhenVisible = false;
      hero.pause();
    }
    label();
  }

  hero.addEventListener('loadeddata', () => {
    window.clearTimeout(loadTimer);
    heroSection.classList.remove('video-loading');
    heroSection.classList.add('video-ready');
    sound.disabled = false;
    setStatus('', 'ready');
  });
  hero.addEventListener('loadedmetadata', () => { duration.textContent = format(hero.duration); });
  hero.addEventListener('timeupdate', () => { progress.textContent = format(hero.currentTime); });
  hero.addEventListener('error', () => {
    window.clearTimeout(loadTimer);
    heroSection.classList.remove('video-loading');
    setStatus('视频加载失败，请检查网络后点击重试', 'error');
    loaded = false;
    source.removeAttribute('src');
  });
  hero.addEventListener('play', label);
  hero.addEventListener('pause', label);
  hero.addEventListener('volumechange', label);

  play.addEventListener('click', toggle);
  heroSection.addEventListener('click', (event) => {
    if (!event.target.closest('button,a')) toggle();
  });
  sound.addEventListener('click', () => {
    hero.muted = !hero.muted;
    if (hero.paused) start();
    label();
  });

  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting && !hero.paused) {
      resumeWhenVisible = !manualPause;
      hero.pause();
    } else if (entry.isIntersecting && resumeWhenVisible && !document.hidden) {
      resumeWhenVisible = false;
      start();
    }
  }, { threshold: 0 }).observe(heroSection);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !hero.paused) {
      resumeWhenVisible = !manualPause;
      hero.pause();
    } else if (!document.hidden && resumeWhenVisible) {
      resumeWhenVisible = false;
      start();
    }
  });

  label();
})();

(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero-video');
  const data = [
    ['display', '展陈空间 · 产品广告', '00:28', '展陈细节与交付场景。'],
    ['display2', '店铺陈列 · 产品广告', '00:31', '商业空间与展示设施。'],
    ['craft', '陶瓷工艺 · 制作流程', '00:32', '从打样、烧制到包装。'],
    ['herbal', '草本原料 · 产品信息', '00:40', '原料、加工与生产场景。'],
    ['herbal2', '草本原料 · 系列延展', '00:40', '同品牌下不同原料的信息表达。'],
    ['ad5', 'ESAB · 户外焊接场景', '01:07', '完整横屏广告作品。'],
    ['ad6', 'ESAB · 工业切割场景', '00:38', '完整横屏广告作品。'],
    ['brand', '陶瓷品牌 · 横屏介绍', '01:00', '工艺、产品系列与交付画面。'],
    ['essay', '视频论文 · 影像分析', '05:00', '以已有影视片段辅助论述的视频论文。'],
    ['showreel', '作品集 · 综合混剪', '01:40', '完整作品集混剪，含音乐。']
  ];
  const track = document.querySelector('.video-carousel');
  if (!track) return;

  data.forEach(([key, title, time, desc], index) => {
    const card = document.createElement('article');
    card.className = `video-card ${index < 5 ? 'is-portrait' : 'is-landscape'}${index === 0 ? ' is-current' : ''}`;
    card.innerHTML = `<button type="button" data-play-video="${key}" aria-label="播放：${title}"><img src="assets/videos/${key}.jpg" alt="${title}视频封面" loading="lazy" decoding="async" draggable="false"><span class="video-play">▶</span><span class="video-duration">${time}</span></button><h3>${title}</h3><p>${desc}</p>`;
    track.append(card);
  });

  let current = 0;
  let raf = 0;
  const cards = [...track.children];
  function update() {
    raf = 0;
    const middle = track.getBoundingClientRect().left + cards[0].offsetWidth / 2;
    current = cards.reduce((best, card, index) => (
      Math.abs(card.getBoundingClientRect().left + card.offsetWidth / 2 - middle)
      < Math.abs(cards[best].getBoundingClientRect().left + cards[best].offsetWidth / 2 - middle) ? index : best
    ), 0);
    cards.forEach((card, index) => card.classList.toggle('is-current', index === current));
    document.querySelector('[data-video-count]').textContent = `0${current + 1} / ${data.length}`;
    document.querySelector('[data-video-prev]').disabled = current === 0;
    document.querySelector('[data-video-next]').disabled = current === data.length - 1;
  }
  function go(index) {
    const next = Math.max(0, Math.min(data.length - 1, index));
    track.scrollTo({
      left: track.scrollLeft + cards[next].getBoundingClientRect().left - track.getBoundingClientRect().left,
      behavior: reduced.matches ? 'instant' : 'smooth'
    });
  }

  track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  document.querySelector('[data-video-prev]').onclick = () => go(current - 1);
  document.querySelector('[data-video-next]').onclick = () => go(current + 1);
  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      go(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });

  let down = null;
  let dragged = false;
  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') return;
    down = { x: event.clientX, scroll: track.scrollLeft };
    dragged = false;
  });
  window.addEventListener('pointermove', (event) => {
    if (!down) return;
    if (Math.abs(event.clientX - down.x) > 6) {
      dragged = true;
      track.style.scrollSnapType = 'none';
      track.scrollLeft = down.scroll - (event.clientX - down.x);
    }
  });
  window.addEventListener('pointerup', () => {
    if (down && dragged) update();
    down = null;
  });

  const modal = document.querySelector('.video-modal');
  const full = modal.querySelector('video');
  let opener;
  let overflow;
  track.addEventListener('click', (event) => {
    if (dragged) {
      dragged = false;
      return;
    }
    const button = event.target.closest('[data-play-video]');
    if (!button) return;
    opener = button;
    const item = data.find((entry) => entry[0] === button.dataset.playVideo);
    modal.querySelector('h3').textContent = item[1];
    modal.querySelector('.video-error').hidden = true;
    full.poster = `assets/videos/${item[0]}.jpg`;
    full.src = `assets/videos/${item[0]}.mp4`;
    full.muted = false;
    hero?.pause();
    overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modal.showModal();
    full.play().catch(() => {});
  });
  modal.querySelector('[data-video-close]').onclick = () => modal.close();
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });
  modal.addEventListener('close', () => {
    full.pause();
    full.removeAttribute('src');
    full.removeAttribute('poster');
    full.load();
    document.body.style.overflow = overflow;
    opener?.focus({ preventScroll: true });
  });
  full.addEventListener('error', () => {
    if (full.getAttribute('src')) modal.querySelector('.video-error').hidden = false;
  });
  update();
})();
