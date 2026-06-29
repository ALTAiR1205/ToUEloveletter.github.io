(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
  const DATA = window.SITE_CONTENT || { playlist: [], letters: [], replies: [], fragments: [] };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 820;
  const isHomePage = document.body.classList.contains('home-page');

  function plainText(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent.replace(/\s+/g, ' ').trim();
  }
  function excerpt(html, n=170) {
    const s = plainText(html);
    return s.length > n ? s.slice(0, n) + '…' : s;
  }
  function esc(s) {
    return String(s ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
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

  function rebuildSakuraPetals() {
    const layer = document.getElementById('sakuraPetalLayer');
    if (!layer || reduced) return;
    layer.innerHTML = '';
    const count = isCoarsePointer ? 18 : 34;
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
  window.addEventListener('resize', () => {
    clearTimeout(sakuraResizeTimer);
    sakuraResizeTimer = setTimeout(rebuildSakuraPetals, 180);
  }, { passive: true });

  const themeBtn = $('#themeBtn');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme !== 'light') document.body.classList.add('dark');
  if (themeBtn) themeBtn.textContent = document.body.classList.contains('dark') ? '白天模式' : '夜晚模式';
  themeBtn?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeBtn.textContent = isDark ? '白天模式' : '夜晚模式';
  });

  const loader = $('#openingLoader');
  if (loader) setTimeout(() => loader.classList.add('is-hidden'), isCoarsePointer ? 720 : 1150);

  window.addEventListener('pointermove', (e) => {
    document.documentElement.style.setProperty('--mx', e.clientX + 'px');
    document.documentElement.style.setProperty('--my', e.clientY + 'px');
  }, {passive:true});

  if (!reduced) {
    window.addEventListener('click', (e) => {
      if (e.target.closest('button,a')) return;
      for (let i=0;i<(isCoarsePointer ? 5 : 12);i++) {
        const s = document.createElement('span');
        s.className = 'spark';
        s.style.left = e.clientX + 'px';
        s.style.top = e.clientY + 'px';
        const a = Math.random()*Math.PI*2;
        const r = 26 + Math.random()*76;
        s.style.setProperty('--dx', Math.cos(a)*r + 'px');
        s.style.setProperty('--dy', Math.sin(a)*r + 'px');
        document.body.appendChild(s);
        setTimeout(()=>s.remove(), 900);
      }
    });
  }

  const revealEls = $$('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(ent => { if (ent.isIntersecting) ent.target.classList.add('is-visible'); });
  }, {threshold:.16});
  revealEls.forEach(el => io.observe(el));

  const railLinks = $$('.chapter-rail a');
  const sections = $$('[data-section]');
  const sio = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (!ent.isIntersecting) return;
      const id = ent.target.dataset.section;
      railLinks.forEach(a => a.classList.toggle('is-active', a.dataset.rail === id));
    });
  }, {threshold:.45});
  sections.forEach(s => sio.observe(s));

  function setupTiltAndMagnetics(root=document) {
    if (reduced || isCoarsePointer) return;
    $$('[data-tilt]', root).forEach(card => {
      if (card.dataset.tiltReady === 'yes') return;
      card.dataset.tiltReady = 'yes';
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateX(${-y*6}deg) rotateY(${x*8}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
    $$('.magnetic', root).forEach(btn => {
      if (btn.dataset.magneticReady === 'yes') return;
      btn.dataset.magneticReady = 'yes';
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width/2);
        const y = e.clientY - (r.top + r.height/2);
        btn.style.transform = `translate(${x*.12}px, ${y*.12}px)`;
      });
      btn.addEventListener('pointerleave', () => btn.style.transform = '');
    });
  }
  setupTiltAndMagnetics();

  const togetherStart = new Date('2026-03-20T23:22:00-05:00');
  const knownStart = new Date('2026-03-05T00:00:00-05:00');
  const day = 86400000, hour = 3600000, minute = 60000;
  function parts(from) {
    const diff = Math.max(0, Date.now() - from.getTime());
    return { d: Math.floor(diff/day), h: Math.floor((diff%day)/hour), m: Math.floor((diff%hour)/minute), s: Math.floor((diff%minute)/1000) };
  }
  function updateTime() {
    const p = parts(togetherStart), k = parts(knownStart);
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('#coreDays', p.d); set('#coreHours', p.h); set('#coreMinutes', p.m); set('#coreSeconds', p.s);
    const sentence = $('#coreSentence');
    if (sentence) sentence.textContent = `从认识起已经 ${k.d} 天；从正式在一起起，我们已经一起走过 ${p.d} 天 ${p.h} 小时 ${p.m} 分钟 ${p.s} 秒。`;
  }
  updateTime(); setInterval(updateTime, 1000);

  const playlist = (DATA.playlist && DATA.playlist.length ? DATA.playlist : [
    { title: 'η', note: 'by α·Pav', src: 'music/bgm.mp3' }
  ]);
  const bgm = $('#bgm'), dock = $('#musicDock'), discBtn = $('#discBtn'), toggle = $('#togglePlayBtn'), prev = $('#prevTrackBtn'), next = $('#nextTrackBtn'), title = $('#trackTitle'), note = $('#trackNote');
  let current = Number(localStorage.getItem('currentTrackIndex'));
  if (!Number.isInteger(current) || current < 0 || current >= playlist.length) current = 0;
  const savedMusicTime = Number(localStorage.getItem('musicCurrentTime') || '0');
  const shouldResumeMusic = localStorage.getItem('musicWasPlaying') === 'yes';
  function updateMusicUI() {
    if (!bgm) return;
    const t = playlist[current];
    if (title) title.textContent = t.title;
    if (note) note.textContent = `第 ${current+1} 首 / 共 ${playlist.length} 首 · ${t.note || ''}`;
    if (toggle) toggle.textContent = bgm.paused ? 'Play' : 'Pause';
    dock?.classList.toggle('is-playing', !bgm.paused);
    document.body.classList.toggle('music-active', !bgm.paused);
  }
  function rememberMusicState() {
    if (!bgm) return;
    localStorage.setItem('currentTrackIndex', String(current));
    localStorage.setItem('musicCurrentTime', String(Math.max(0, bgm.currentTime || 0)));
    localStorage.setItem('musicWasPlaying', bgm.paused ? 'no' : 'yes');
  }
  function loadTrack(i, play=false, resumeTime=0) {
    if (!bgm) return;
    current = (i + playlist.length) % playlist.length;
    localStorage.setItem('currentTrackIndex', String(current));
    bgm.src = playlist[current].src;
    bgm.volume = .62;
    bgm.load();
    bgm.addEventListener('loadedmetadata', () => {
      if (resumeTime > 0 && Number.isFinite(resumeTime) && resumeTime < (bgm.duration || Infinity)) bgm.currentTime = resumeTime;
    }, { once: true });
    updateMusicUI();
    if (play) bgm.play().catch(console.warn).finally(updateMusicUI);
  }
  discBtn?.addEventListener('click', () => { if (bgm.paused) bgm.play().catch(console.warn).finally(updateMusicUI); else { bgm.pause(); updateMusicUI(); } });
  toggle?.addEventListener('click', () => discBtn?.click());
  prev?.addEventListener('click', () => loadTrack(current-1, true));
  next?.addEventListener('click', () => loadTrack(current+1, true));
  bgm?.addEventListener('ended', () => loadTrack(current+1, true));
  bgm?.addEventListener('play', () => { updateMusicUI(); rememberMusicState(); });
  bgm?.addEventListener('pause', () => { updateMusicUI(); rememberMusicState(); });
  bgm?.addEventListener('timeupdate', () => { if (Math.floor((bgm.currentTime || 0) % 3) === 0) rememberMusicState(); });
  window.addEventListener('beforeunload', rememberMusicState);
  loadTrack(current, shouldResumeMusic, savedMusicTime);

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
    if (readerBody) readerBody.innerHTML = type === 'fragments' ? `<div class="quote-text">${item.body || ''}</div>` : (item.body || '<p>这里还没有正文。</p>');
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

  const canvas = $('#spaceCanvas');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    let w=0,h=0, particles=[];
    const mouse = {x:innerWidth/2,y:innerHeight/2};
    addEventListener('pointermove', e => {mouse.x=e.clientX; mouse.y=e.clientY;}, {passive:true});
    function resize(){
      w=canvas.width=innerWidth*devicePixelRatio; h=canvas.height=innerHeight*devicePixelRatio;
      canvas.style.width=innerWidth+'px'; canvas.style.height=innerHeight+'px';
      const count = innerWidth < 700 ? 38 : (innerWidth < 980 ? 80 : 150);
      particles = Array.from({length:count}, () => ({
        x:Math.random()*w, y:Math.random()*h, z:.3+Math.random()*1.4,
        vx:(Math.random()-.5)*.18, vy:(Math.random()-.5)*.18,
        r:.6+Math.random()*1.7, tw:Math.random()*Math.PI*2
      }));
    }
    resize(); addEventListener('resize', resize);
    function frame(t){
      ctx.clearRect(0,0,w,h);
      const dark = document.body.classList.contains('dark');
      const active = document.body.classList.contains('music-active');
      for(const p of particles){
        const mx = mouse.x*devicePixelRatio, my = mouse.y*devicePixelRatio;
        const dx=p.x-mx, dy=p.y-my, dist=Math.hypot(dx,dy);
        if(dist<150*devicePixelRatio && dist>0){ p.x += dx/dist*1.2; p.y += dy/dist*1.2; }
        p.x += p.vx*p.z*(active?2.1:1); p.y += p.vy*p.z*(active?2.1:1);
        if(p.x<0) p.x=w; if(p.x>w) p.x=0; if(p.y<0) p.y=h; if(p.y>h) p.y=0;
        const a = (dark ? .55 : .22) + Math.sin(t*.002+p.tw)*.18;
        ctx.beginPath();
        if (dark) {
          ctx.fillStyle = `rgba(255,230,245,${a})`;
          ctx.arc(p.x,p.y,p.r*p.z*devicePixelRatio,0,Math.PI*2);
        } else {
          ctx.fillStyle = `rgba(210,118,151,${Math.max(.05, a*.46)})`;
          ctx.ellipse(p.x,p.y,(p.r*1.9)*p.z*devicePixelRatio,(p.r*.9)*p.z*devicePixelRatio, p.tw, 0, Math.PI*2);
        }
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
