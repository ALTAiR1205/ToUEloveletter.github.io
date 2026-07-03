/* ==========================================================================
   VEGALTAiR · Love Universe — v5.0 「鹊桥 · 星河」
   内容渲染 + 交互 + 星空引擎。所有文字内容来自 content.js。
   ========================================================================== */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const DATA = window.SITE_CONTENT || { playlist: [], letters: [], replies: [], fragments: [] };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 820;
  const isHomePage = document.body.classList.contains('home-page');

  /* ---------- 工具 ---------- */
  function plainText(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent.replace(/\s+/g, ' ').trim();
  }
  function excerpt(html, n = 170) {
    const s = plainText(html);
    return s.length > n ? s.slice(0, n) + '…' : s;
  }
  function esc(s) {
    return String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }
  function getCollection(type) {
    if (type === 'letters') return DATA.letters || [];
    if (type === 'replies') return DATA.replies || [];
    if (type === 'fragments') return DATA.fragments || [];
    return [];
  }
  function getItem(type, id) {
    return getCollection(type).find(item => item.id === id);
  }
  function articleHref(type, id) {
    return `article.html?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
  }
  function archiveHref(type) {
    return `archive.html?type=${encodeURIComponent(type)}`;
  }
  function labelFor(type) {
    return type === 'letters' ? 'Letter Archive' : type === 'replies' ? 'Incoming Transmission' : 'Fragment Archive';
  }

  /* ---------- 内容渲染 ---------- */
  function renderHomeContent() {
    const lettersBox = $('#lettersPreview');
    if (lettersBox) {
      lettersBox.innerHTML = (DATA.letters || []).slice(0, 8).map(item => `
        <a class="timeline-node tilt-card" href="${articleHref('letters', item.id)}" data-type="letters" data-id="${esc(item.id)}" data-tilt>
          <span class="node-date">${esc(item.date || item.meta || '')}</span>
          <strong>${esc(item.title)}</strong>
          <p>${esc(excerpt(item.body, 190))}</p>
          <span class="node-tags">${(item.tags || []).map(t => `<span>${esc(t)}</span>`).join('')}</span>
        </a>`).join('') || '<p class="empty-state">还没有信件。</p>';
    }

    const fragmentsBox = $('#fragmentsPreview');
    if (fragmentsBox) {
      fragmentsBox.innerHTML = (DATA.fragments || []).slice(0, 10).map(item => `
        <article class="nebula-card tilt-card" data-tilt>
          <div class="quote-text">${item.body || ''}</div>
          <small>${esc(item.date || '')}</small>
        </article>`).join('') || '<p class="empty-state">还没有碎碎念。</p>';
    }

    const repliesBox = $('#repliesPreview');
    if (repliesBox) {
      repliesBox.innerHTML = (DATA.replies || []).slice(0, 4).map(item => `
        <a class="transmission-card tilt-card" href="${articleHref('replies', item.id)}" data-type="replies" data-id="${esc(item.id)}" data-tilt>
          <span class="signal-line"></span>
          <small>${esc(item.meta || item.date || '')}</small>
          <strong>${esc(item.title)}</strong>
          <p>${esc(excerpt(item.body, 190))}</p>
        </a>`).join('') || '<p class="empty-state">还没有回信。</p>';
    }
  }

  function renderArchivePage() {
    if (!document.body.classList.contains('archive-dynamic-page')) return;
    const params = new URLSearchParams(location.search);
    const type = params.get('type') || 'letters';
    const list = getCollection(type);
    const heroEyebrow = $('#archiveEyebrow');
    const heroTitle = $('#archiveTitle');
    const heroDesc = $('#archiveDesc');
    const grid = $('#archiveGrid');
    const back = $('#archiveBack');
    if (back) back.href = 'index.html#' + (type === 'letters' ? 'letters' : type === 'replies' ? 'replies' : 'fragments');

    const titleMap = {
      letters: ['Archive / Letters', '全部信件', '每一次想你，都被收进这里。'],
      replies: ['Archive / Replies', '全部回信', '从另一颗星球传来的讯号。'],
      fragments: ['Archive / Fragments', '全部碎碎念', '书、歌、游戏和一些突然落下来的心情。']
    };
    const [ey, title, desc] = titleMap[type] || titleMap.letters;
    if (heroEyebrow) heroEyebrow.textContent = ey;
    if (heroTitle) heroTitle.textContent = title;
    if (heroDesc) heroDesc.textContent = desc;
    document.title = `${title} · VEGALTAiR`;

    if (!grid) return;
    if (type === 'fragments') {
      grid.classList.add('fragment-list');
      grid.innerHTML = list.map(item => `
        <article class="library-card fragment-library tilt-card" data-tilt>
          <small>${esc(item.date || '')}</small>
          <div class="quote-text">${item.body || ''}</div>
        </article>`).join('') || '<p class="empty-state">还没有内容。</p>';
    } else {
      grid.classList.remove('fragment-list');
      grid.innerHTML = list.map(item => `
        <a class="library-card tilt-card" href="${articleHref(type, item.id)}" data-type="${esc(type)}" data-id="${esc(item.id)}" data-tilt>
          <small>${esc(item.date || item.meta || '')}</small>
          <h2>${esc(item.title)}</h2>
          <p>${esc(excerpt(item.body, 180))}</p>
          ${(item.tags && item.tags.length) ? `<div class="tag-row">${item.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
        </a>`).join('') || '<p class="empty-state">还没有内容。</p>';
    }
  }

  function renderArticlePage() {
    if (!document.body.classList.contains('article-dynamic-page')) return;
    const params = new URLSearchParams(location.search);
    const type = params.get('type') || 'letters';
    const id = params.get('id') || '';
    const item = getItem(type, id) || getCollection(type)[0];
    const back = $('#articleBack');
    if (back) {
      back.href = archiveHref(type);
      back.textContent = type === 'replies' ? '← 返回回信档案' : type === 'fragments' ? '← 返回碎片档案' : '← 返回信件档案';
    }
    if (!item) {
      $('#articleTitle').textContent = '没有找到这篇内容';
      $('#articleBody').innerHTML = '<p>请回到首页重新打开。</p>';
      return;
    }
    document.title = `${item.title || '阅读'} · VEGALTAiR`;
    const shell = $('.article-shell');
    if (shell) shell.classList.toggle('reply-article', type === 'replies');
    $('#articleKicker').textContent = item.kicker || labelFor(type);
    $('#articleTitle').textContent = item.title || '未命名';
    $('#articleMeta').textContent = item.meta || item.date || '';
    const tagRow = $('#articleTags');
    if (tagRow) tagRow.innerHTML = (item.tags || []).map(t => `<span>${esc(t)}</span>`).join('');
    $('#articleBody').innerHTML = type === 'fragments' ? `<div class="quote-text">${item.body || ''}</div>` : (item.body || '<p>这里还没有正文。</p>');
  }

  renderHomeContent();
  renderArchivePage();
  renderArticlePage();

  /* ---------- 主题切换（记忆保持不变：localStorage.theme） ---------- */
  const themeBtn = $('#themeBtn');
  const savedTheme = localStorage.getItem('theme');
  document.body.classList.toggle('dark', savedTheme !== 'light');
  if (themeBtn) themeBtn.textContent = document.body.classList.contains('dark') ? '白天模式' : '夜晚模式';
  themeBtn?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeBtn.textContent = isDark ? '白天模式' : '夜晚模式';
  });

  /* ---------- 开屏动画 ---------- */
  const loader = $('#openingLoader');
  if (loader) {
    const hideLoader = () => loader.classList.add('is-hidden');
    setTimeout(hideLoader, reduced ? 300 : (isCoarsePointer ? 2100 : 2600));
    loader.addEventListener('click', hideLoader, { once: true });
  }

  /* ---------- 滚动进度条 ---------- */
  const progressFill = $('#scrollProgress span');
  if (progressFill) {
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      progressFill.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
    };
    addEventListener('scroll', updateProgress, { passive: true });
    addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
  }

  /* ---------- 自定义光标（仅桌面精确指针） ---------- */
  const cursorDot = $('#cursorDot');
  const cursorRing = $('#cursorRing');
  if (cursorDot && cursorRing && !reduced && window.matchMedia('(pointer: fine)').matches) {
    document.body.classList.add('has-custom-cursor');
    let rx = innerWidth / 2, ry = innerHeight / 2, tx = rx, ty = ry;
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      cursorDot.style.left = tx + 'px';
      cursorDot.style.top = ty + 'px';
      const hot = e.target.closest('a, button, [data-tilt]');
      cursorRing.classList.toggle('is-hover', !!hot);
    }, { passive: true });
    (function ringFrame() {
      rx += (tx - rx) * 0.16; ry += (ty - ry) * 0.16;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top = ry + 'px';
      requestAnimationFrame(ringFrame);
    })();
  }

  /* ---------- 首页副标题打字机 ---------- */
  const heroSubtitle = $('#heroSubtitle');
  if (heroSubtitle && !reduced) {
    const lines = heroSubtitle.innerHTML.split(/<br\s*\/?>/i).map(s => plainText(s)).filter(Boolean);
    heroSubtitle.innerHTML = '';
    const caret = document.createElement('span');
    caret.className = 'type-caret';
    heroSubtitle.appendChild(caret);
    let li = 0, ci = 0;
    function typeNext() {
      if (li >= lines.length) { caret.remove(); return; }
      const line = lines[li];
      if (ci < line.length) {
        caret.before(document.createTextNode(line[ci]));
        ci += 1;
        setTimeout(typeNext, 62);
      } else {
        caret.before(document.createElement('br'));
        li += 1; ci = 0;
        setTimeout(typeNext, 380);
      }
    }
    setTimeout(typeNext, isCoarsePointer ? 2300 : 2800);
  }

  /* ---------- 樱花花瓣（白天模式） ---------- */
  function rebuildSakuraPetals() {
    const layer = document.getElementById('sakuraPetalLayer');
    if (!layer || reduced) return;
    layer.innerHTML = '';
    const count = isCoarsePointer ? 16 : 30;
    for (let i = 0; i < count; i += 1) {
      const petal = document.createElement('span');
      petal.className = 'day-petal';
      petal.style.setProperty('--left', `${Math.random() * 100}vw`);
      petal.style.setProperty('--size', `${8 + Math.random() * 18}px`);
      petal.style.setProperty('--opacity', `${0.24 + Math.random() * 0.46}`);
      petal.style.setProperty('--rotate', `${Math.random() * 360}deg`);
      petal.style.setProperty('--drift', `${-90 + Math.random() * 180}px`);
      petal.style.setProperty('--fall', `${13 + Math.random() * 16}s`);
      petal.style.setProperty('--sway', `${3.2 + Math.random() * 4.8}s`);
      petal.style.setProperty('--delay', `${-Math.random() * 24}s`);
      layer.appendChild(petal);
    }
  }
  rebuildSakuraPetals();
  let sakuraResizeTimer;
  addEventListener('resize', () => {
    clearTimeout(sakuraResizeTimer);
    sakuraResizeTimer = setTimeout(rebuildSakuraPetals, 180);
  }, { passive: true });

  /* ---------- 点击星火 + 爱心 ---------- */
  if (!reduced) {
    addEventListener('click', (e) => {
      if (e.target.closest('button,a')) return;
      const total = isCoarsePointer ? 6 : 13;
      for (let i = 0; i < total; i++) {
        const isHeart = i % 4 === 0;
        const s = document.createElement('span');
        s.className = isHeart ? 'heart-spark' : 'spark';
        if (isHeart) s.textContent = '♥';
        s.style.left = e.clientX + 'px';
        s.style.top = e.clientY + 'px';
        const a = Math.random() * Math.PI * 2;
        const r = 28 + Math.random() * 80;
        s.style.setProperty('--dx', Math.cos(a) * r + 'px');
        s.style.setProperty('--dy', (Math.sin(a) * r - (isHeart ? 30 : 0)) + 'px');
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 1100);
      }
    });
  }

  /* ---------- 入场动画 & 章节导航 ---------- */
  const revealEls = $$('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(ent => { if (ent.isIntersecting) ent.target.classList.add('is-visible'); });
  }, { threshold: 0.16 });
  revealEls.forEach(el => io.observe(el));

  const railLinks = $$('.chapter-rail a');
  const sections = $$('[data-section]');
  const sio = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (!ent.isIntersecting) return;
      const id = ent.target.dataset.section;
      railLinks.forEach(a => a.classList.toggle('is-active', a.dataset.rail === id));
    });
  }, { threshold: 0.45 });
  sections.forEach(s => sio.observe(s));

  /* ---------- 3D 倾斜 & 磁性按钮 ---------- */
  function setupTiltAndMagnetics(root = document) {
    if (reduced || isCoarsePointer) return;
    $$('[data-tilt]', root).forEach(card => {
      if (card.dataset.tiltReady === 'yes') return;
      card.dataset.tiltReady = 'yes';
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
    $$('.magnetic', root).forEach(btn => {
      if (btn.dataset.magneticReady === 'yes') return;
      btn.dataset.magneticReady = 'yes';
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
      });
      btn.addEventListener('pointerleave', () => btn.style.transform = '');
    });
  }
  setupTiltAndMagnetics();

  /* ---------- 时间计数 & 里程碑 ---------- */
  const togetherStart = new Date('2026-03-20T23:22:00-05:00');
  const knownStart = new Date('2026-03-05T00:00:00-05:00');
  const day = 86400000, hour = 3600000, minute = 60000;
  function parts(from) {
    const diff = Math.max(0, Date.now() - from.getTime());
    return { d: Math.floor(diff / day), h: Math.floor((diff % day) / hour), m: Math.floor((diff % hour) / minute), s: Math.floor((diff % minute) / 1000) };
  }
  let lastSecond = -1;
  function updateTime() {
    const p = parts(togetherStart), k = parts(knownStart);
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('#coreDays', p.d); set('#coreHours', p.h); set('#coreMinutes', p.m); set('#coreSeconds', p.s);
    const secEl = $('#coreSeconds');
    if (secEl && p.s !== lastSecond) {
      lastSecond = p.s;
      secEl.classList.remove('pop');
      void secEl.offsetWidth;
      secEl.classList.add('pop');
    }
    const sentence = $('#coreSentence');
    if (sentence) sentence.textContent = `从认识起已经 ${k.d} 天；从正式在一起起，我们已经一起走过 ${p.d} 天 ${p.h} 小时 ${p.m} 分钟 ${p.s} 秒。`;
    const fill = $('#milestoneFill');
    const msText = $('#milestoneText');
    if (fill && msText) {
      const within = p.d % 100;
      const nextMark = (Math.floor(p.d / 100) + 1) * 100;
      fill.style.width = within + '%';
      msText.textContent = within === 0 && p.d > 0
        ? `今天是我们在一起第 ${p.d} 天，正好是一个纪念日！`
        : `距离在一起 ${nextMark} 天，还有 ${nextMark - p.d} 天`;
    }
  }
  updateTime(); setInterval(updateTime, 1000);

  /* ---------- 音乐播放器（记忆键保持不变） ---------- */
  const playlist = (DATA.playlist && DATA.playlist.length ? DATA.playlist : [
    { title: 'η', note: 'by α·Pav', src: 'music/bgm.mp3' }
  ]);
  const bgm = $('#bgm'), dock = $('#musicDock'), discBtn = $('#discBtn'), toggle = $('#togglePlayBtn'), prev = $('#prevTrackBtn'), next = $('#nextTrackBtn'), title = $('#trackTitle'), note = $('#trackNote');
  const discProgress = $('#discProgress');
  const RING_LEN = 131.95;
  let current = Number(localStorage.getItem('currentTrackIndex'));
  if (!Number.isInteger(current) || current < 0 || current >= playlist.length) current = 0;
  const savedMusicTime = Number(localStorage.getItem('musicCurrentTime') || '0');
  const shouldResumeMusic = localStorage.getItem('musicWasPlaying') === 'yes';
  function updateMusicUI() {
    if (!bgm) return;
    const t = playlist[current];
    if (title) title.textContent = t.title;
    if (note) note.textContent = `第 ${current + 1} 首 / 共 ${playlist.length} 首 · ${t.note || ''}`;
    if (toggle) toggle.textContent = bgm.paused ? '▶' : '❚❚';
    dock?.classList.toggle('is-playing', !bgm.paused);
    document.body.classList.toggle('music-active', !bgm.paused);
  }
  function updateRing() {
    if (!discProgress || !bgm || !bgm.duration) return;
    const ratio = Math.min(1, (bgm.currentTime || 0) / bgm.duration);
    discProgress.style.strokeDashoffset = String(RING_LEN * (1 - ratio));
  }
  function rememberMusicState() {
    if (!bgm) return;
    localStorage.setItem('currentTrackIndex', String(current));
    localStorage.setItem('musicCurrentTime', String(Math.max(0, bgm.currentTime || 0)));
    localStorage.setItem('musicWasPlaying', bgm.paused ? 'no' : 'yes');
  }
  function loadTrack(i, play = false, resumeTime = 0) {
    if (!bgm) return;
    current = (i + playlist.length) % playlist.length;
    localStorage.setItem('currentTrackIndex', String(current));
    bgm.src = playlist[current].src;
    bgm.volume = 0.62;
    bgm.load();
    bgm.addEventListener('loadedmetadata', () => {
      if (resumeTime > 0 && Number.isFinite(resumeTime) && resumeTime < (bgm.duration || Infinity)) bgm.currentTime = resumeTime;
    }, { once: true });
    if (discProgress) discProgress.style.strokeDashoffset = String(RING_LEN);
    updateMusicUI();
    if (play) bgm.play().catch(console.warn).finally(updateMusicUI);
  }
  discBtn?.addEventListener('click', () => { if (bgm.paused) bgm.play().catch(console.warn).finally(updateMusicUI); else { bgm.pause(); updateMusicUI(); } });
  toggle?.addEventListener('click', () => discBtn?.click());
  prev?.addEventListener('click', () => loadTrack(current - 1, true));
  next?.addEventListener('click', () => loadTrack(current + 1, true));
  bgm?.addEventListener('ended', () => loadTrack(current + 1, true));
  bgm?.addEventListener('play', () => { updateMusicUI(); rememberMusicState(); });
  bgm?.addEventListener('pause', () => { updateMusicUI(); rememberMusicState(); });
  bgm?.addEventListener('timeupdate', () => {
    updateRing();
    if (Math.floor((bgm.currentTime || 0) % 3) === 0) rememberMusicState();
  });
  addEventListener('beforeunload', rememberMusicState);
  loadTrack(current, shouldResumeMusic, savedMusicTime);

  /* ---------- 阅读弹窗 ---------- */
  const readerModal = $('#readerModal');
  const readerTitle = $('#readerTitle');
  const readerMeta = $('#readerMeta');
  const readerKicker = $('#readerKicker');
  const readerTags = $('#readerTags');
  const readerBody = $('#readerBody');
  const readerFullLink = $('#readerFullLink');
  let lastFocusedReaderLink = null;
  function openReader() {
    if (!readerModal) return;
    readerModal.classList.add('is-open');
    readerModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('reader-open');
    const closeBtn = readerModal.querySelector('[data-reader-close]');
    closeBtn?.focus({ preventScroll: true });
  }
  function closeReader() {
    if (!readerModal) return;
    readerModal.classList.remove('is-open');
    readerModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('reader-open');
    lastFocusedReaderLink?.focus?.({ preventScroll: true });
  }
  function loadArticleIntoReader(type, id) {
    const item = getItem(type, id);
    if (!item || !readerModal) return false;
    if (readerTitle) readerTitle.textContent = item.title || '一封信';
    if (readerMeta) readerMeta.textContent = item.meta || item.date || '';
    if (readerKicker) readerKicker.textContent = item.kicker || labelFor(type);
    if (readerTags) readerTags.innerHTML = (item.tags || []).map(t => `<span>${esc(t)}</span>`).join('');
    if (readerBody) { readerBody.innerHTML = type === 'fragments' ? `<div class="quote-text">${item.body || ''}</div>` : (item.body || '<p>这里还没有正文。</p>'); }
    if (readerFullLink) readerFullLink.href = articleHref(type, id);
    openReader();
    return true;
  }
  if (readerModal) {
    document.addEventListener('click', (e) => {
      const closeTrigger = e.target.closest('[data-reader-close]');
      if (closeTrigger) { closeReader(); return; }
      const link = e.target.closest('a[href]');
      if (!link || link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = link.getAttribute('href') || '';
      const url = new URL(href, location.href);
      if (!isHomePage || !url.pathname.endsWith('/article.html')) return;
      const type = url.searchParams.get('type');
      const id = url.searchParams.get('id');
      if (!type || !id || type === 'fragments') return;
      e.preventDefault();
      rememberMusicState();
      lastFocusedReaderLink = link;
      loadArticleIntoReader(type, id);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && readerModal.classList.contains('is-open')) closeReader();
    });
  }

  /* ==========================================================================
     星空引擎 v2：三层视差星野 + 流星 + 靠近光标的星座连线（夜）
     白天为暖色光尘。
     ========================================================================== */
  const canvas = $('#spaceCanvas');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(2, devicePixelRatio || 1);
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    let w = 0, h = 0;
    let stars = [];
    let meteors = [];
    let nextMeteorAt = 0;
    const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

    function resize() {
      w = canvas.width = Math.floor(innerWidth * DPR);
      h = canvas.height = Math.floor(innerHeight * DPR);
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      const count = innerWidth < 700 ? 70 : (innerWidth < 980 ? 120 : 190);
      stars = Array.from({ length: count }, () => {
        const depth = 0.25 + Math.random() * 1.15; // 越大越近
        return {
          x: Math.random() * w, y: Math.random() * h,
          depth,
          vx: (Math.random() - 0.5) * 0.06 * depth,
          vy: (Math.random() - 0.5) * 0.06 * depth,
          r: (0.5 + Math.random() * 1.5) * depth,
          tw: Math.random() * Math.PI * 2,
          twSpeed: 0.0012 + Math.random() * 0.0022,
          hue: Math.random()
        };
      });
    }
    resize();
    addEventListener('resize', resize, { passive: true });

    function spawnMeteor(now) {
      const fromX = w * (0.15 + Math.random() * 0.75);
      const fromY = h * (0.02 + Math.random() * 0.25);
      const speed = (7 + Math.random() * 7) * DPR;
      const angle = Math.PI * (0.72 + Math.random() * 0.1); // 向左下
      meteors.push({
        x: fromX, y: fromY,
        vx: Math.cos(angle) * speed, vy: -Math.sin(angle) * speed,
        life: 1, decay: 0.012 + Math.random() * 0.012,
        len: (70 + Math.random() * 90) * DPR
      });
      nextMeteorAt = now + 2800 + Math.random() * 4500;
    }

    function starColor(s, alpha, dark) {
      if (!dark) return `rgba(214, 122, 155, ${alpha * 0.5})`;
      if (s.hue < 0.6) return `rgba(255, 244, 255, ${alpha})`;
      if (s.hue < 0.8) return `rgba(190, 214, 255, ${alpha})`;
      return `rgba(255, 214, 231, ${alpha})`;
    }

    let running = true;
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });

    function frame(t) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const dark = document.body.classList.contains('dark');
      const active = document.body.classList.contains('music-active');
      const speedBoost = active ? 2 : 1;
      const px = (mouse.x / innerWidth - 0.5), py = (mouse.y / innerHeight - 0.5);

      /* 星 / 光尘 */
      for (const s of stars) {
        s.x += s.vx * speedBoost; s.y += s.vy * speedBoost;
        if (s.x < -10) s.x = w + 10; if (s.x > w + 10) s.x = -10;
        if (s.y < -10) s.y = h + 10; if (s.y > h + 10) s.y = -10;
        const ox = -px * s.depth * 26 * DPR;
        const oy = -py * s.depth * 26 * DPR;
        const a = (dark ? 0.5 : 0.28) + Math.sin(t * s.twSpeed + s.tw) * (dark ? 0.32 : 0.14);
        ctx.beginPath();
        ctx.fillStyle = starColor(s, Math.max(0.05, a), dark);
        if (dark) {
          ctx.arc(s.x + ox, s.y + oy, s.r * DPR, 0, Math.PI * 2);
        } else {
          ctx.ellipse(s.x + ox, s.y + oy, s.r * 1.8 * DPR, s.r * 0.9 * DPR, s.tw, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      /* 星座连线：靠近光标的星互相牵手（夜晚 + 桌面） */
      if (dark && finePointer) {
        const mx = mouse.x * DPR, my = mouse.y * DPR;
        const near = [];
        for (const s of stars) {
          if (s.depth < 0.8) continue;
          const dx = s.x - mx, dy = s.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < (220 * DPR) * (220 * DPR)) near.push(s);
          if (near.length >= 14) break;
        }
        ctx.lineWidth = 1 * DPR;
        for (let i = 0; i < near.length; i++) {
          for (let j = i + 1; j < near.length; j++) {
            const a = near[i], b = near[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.hypot(dx, dy);
            const maxD = 130 * DPR;
            if (dist < maxD) {
              const alpha = (1 - dist / maxD) * 0.4;
              ctx.strokeStyle = `rgba(185, 166, 255, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      /* 流星（夜晚） */
      if (dark) {
        if (t > nextMeteorAt) spawnMeteor(t);
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += m.vx; m.y += m.vy; m.life -= m.decay;
          if (m.life <= 0 || m.x < -m.len || m.y > h + m.len) { meteors.splice(i, 1); continue; }
          const tail = Math.hypot(m.vx, m.vy);
          const tx = m.x - (m.vx / tail) * m.len;
          const ty = m.y - (m.vy / tail) * m.len;
          const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
          grad.addColorStop(0, `rgba(255, 240, 250, ${0.9 * m.life})`);
          grad.addColorStop(0.3, `rgba(185, 166, 255, ${0.45 * m.life})`);
          grad.addColorStop(1, 'rgba(185, 166, 255, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2 * DPR;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 250, 255, ${0.95 * m.life})`;
          ctx.arc(m.x, m.y, 2.2 * DPR, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (meteors.length) {
        meteors = [];
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
