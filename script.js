
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 820;
  const isHomePage = document.body.classList.contains('home-page');
  const assetPrefix = isHomePage ? '' : '../';

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

  const cursorAura = $('#cursorAura');
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

  if (!reduced && !isCoarsePointer) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(900px) rotateX(${-y*6}deg) rotateY(${x*8}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    $$('.magnetic').forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width/2);
        const y = e.clientY - (r.top + r.height/2);
        btn.style.transform = `translate(${x*.12}px, ${y*.12}px)`;
      });
      btn.addEventListener('pointerleave', () => btn.style.transform = '');
    });
  }

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

  const playlist = [
    { title: 'η', note: 'by α·Pav', src: assetPrefix + 'music/bgm.mp3' },
    { title: 'Gotta have you', note: 'by The Weepies', src: assetPrefix + 'music/bgm2.mp3' },
    { title: 'Little bit better', note: 'by Caleb Hearn/ROSIE', src: assetPrefix + 'music/bgm3.mp3' }
  ];
  const bgm = $('#bgm'), dock = $('#musicDock'), discBtn = $('#discBtn'), toggle = $('#togglePlayBtn'), prev = $('#prevTrackBtn'), next = $('#nextTrackBtn'), title = $('#trackTitle'), note = $('#trackNote');
  let current = Number(localStorage.getItem('currentTrackIndex'));
  if (!Number.isInteger(current) || current < 0 || current >= playlist.length) current = 0;
  const savedMusicTime = Number(localStorage.getItem('musicCurrentTime') || '0');
  const shouldResumeMusic = localStorage.getItem('musicWasPlaying') === 'yes';
  function updateMusicUI() {
    if (!bgm) return;
    const t = playlist[current];
    if (title) title.textContent = t.title;
    if (note) note.textContent = `第 ${current+1} 首 / 共 ${playlist.length} 首 · ${t.note}`;
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
      if (resumeTime > 0 && Number.isFinite(resumeTime) && resumeTime < (bgm.duration || Infinity)) {
        bgm.currentTime = resumeTime;
      }
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

  function normalizeArticleUrl(url) {
    try { return new URL(url, location.href); } catch { return null; }
  }

  async function loadArticleIntoReader(url, sourceLabel) {
    const targetUrl = normalizeArticleUrl(url);
    if (!targetUrl || !readerModal) return false;
    if (readerTitle) readerTitle.textContent = '正在打开';
    if (readerMeta) readerMeta.textContent = '';
    if (readerTags) readerTags.innerHTML = '';
    if (readerBody) readerBody.innerHTML = '<p>正在从星轨里取出这封信……</p>';
    if (readerFullLink) readerFullLink.href = targetUrl.href;
    if (readerKicker) readerKicker.textContent = sourceLabel || 'Archive';
    openReader();
    try {
      const res = await fetch(targetUrl.href, { cache: 'no-cache' });
      if (!res.ok) throw new Error('Fetch failed');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const shell = doc.querySelector('.article-shell');
      if (!shell) throw new Error('Article shell not found');
      const titleText = shell.querySelector('h1')?.textContent?.trim() || '一封信';
      const metaText = shell.querySelector('.article-meta')?.textContent?.trim() || '';
      const kickerText = shell.querySelector('.article-kicker')?.textContent?.trim() || sourceLabel || 'Archive';
      const tags = shell.querySelector('.tag-row')?.innerHTML || '';
      const body = shell.querySelector('.article-body')?.innerHTML || '<p>这封信暂时没有正文。</p>';
      if (readerTitle) readerTitle.textContent = titleText;
      if (readerMeta) readerMeta.textContent = metaText;
      if (readerKicker) readerKicker.textContent = kickerText;
      if (readerTags) readerTags.innerHTML = tags;
      if (readerBody) readerBody.innerHTML = body;
    } catch (err) {
      console.warn(err);
      if (readerBody) readerBody.innerHTML = '<p>这封信没有成功在当前页面打开。你可以点下面的“打开完整页面”。</p>';
    }
    return true;
  }

  if (readerModal) {
    document.addEventListener('click', (e) => {
      const closeTrigger = e.target.closest('[data-reader-close]');
      if (closeTrigger) { closeReader(); return; }
      const link = e.target.closest('a[href]');
      if (!link || link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = link.getAttribute('href') || '';
      const isArticle = /^(letters|replies)\/(letter|reply)-\d+\.html$/.test(href);
      if (!isHomePage || !isArticle) return;
      e.preventDefault();
      rememberMusicState();
      lastFocusedReaderLink = link;
      loadArticleIntoReader(href, href.startsWith('letters/') ? 'Letter Archive' : 'Incoming Transmission');
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
        if(dist<150*devicePixelRatio){ p.x += dx/dist*1.2; p.y += dy/dist*1.2; }
        p.x += p.vx*p.z*(active?2.1:1); p.y += p.vy*p.z*(active?2.1:1);
        if(p.x<0) p.x=w; if(p.x>w) p.x=0; if(p.y<0) p.y=h; if(p.y>h) p.y=0;
        const a = (dark?.55:.35) + Math.sin(t*.002+p.tw)*.18;
        ctx.beginPath();
        ctx.fillStyle = dark ? `rgba(255,230,245,${a})` : `rgba(177,95,135,${a*.7})`;
        ctx.arc(p.x,p.y,p.r*p.z*devicePixelRatio,0,Math.PI*2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
