/* ==========================================================================
   VEGALTAiR · Love Universe — v7.0 「Asme 夜晚 · Lumora 白天 · 花开」
   内容渲染 + 交互 + 3D 星空引擎。所有文字内容来自 content.js。
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

  /* ---------- 内容规范化：新增内容不用再手写 id / kicker / 排序 ----------
     在 content.js 里新增信件/回信/碎碎念时，只需要 date、title、body（tags 可选），
     放在数组的任何位置都可以：这里会按日期自动排序（新→旧）、自动补全 id 和编号。
     已经写了 id 的旧条目保持原样，历史链接不会失效。 */
  function normalizeCollection(list, prefix, label) {
    if (!Array.isArray(list)) return;
    list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const used = new Set(list.map(x => x.id).filter(Boolean));
    const n = list.length;
    list.forEach((item, i) => {
      if (!item.id) {
        const base = prefix + '-' + (String(item.date || '').replace(/\D/g, '') || 'n' + (n - i));
        let id = base, k = 2;
        while (used.has(id)) id = base + '-' + (k++);
        used.add(id);
        item.id = id;
      }
      if (!item.kicker && label) item.kicker = label + ' ' + String(n - i).padStart(2, '0');
    });
  }
  normalizeCollection(DATA.letters, 'letter', 'Letter');
  normalizeCollection(DATA.replies, 'reply', 'Reply');
  normalizeCollection(DATA.fragments, 'fragment', '');

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

  /* ---------- 花开模式引擎：滚动驱动视频背景（懒加载，切到花开模式才下载） ---------- */
  const BLOOM_SRC = 'media/bloom.mp4';
  let bloomStarted = false;
  function startBloom() {
    if (bloomStarted) return;
    const bCanvas = $('#bloomCanvas');
    const bVideo = $('#bloomVideo');
    if (!bCanvas || !bVideo) return;
    bloomStarted = true;
    const bCtx = bCanvas.getContext('2d');
    let frames = [], ready = false, lastIdx = -1, seeking = false;

    bVideo.preload = 'auto';
    bVideo.src = BLOOM_SRC;
    bVideo.load();
    bVideo.addEventListener('loadeddata', () => { try { bVideo.currentTime = 0; } catch (e) {} });
    bVideo.addEventListener('seeked', () => { seeking = false; });
    bVideo.addEventListener('stalled', () => { seeking = false; });
    bCanvas.style.visibility = 'hidden';

    function resizeBloom() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const bw = Math.round(innerWidth * dpr), bh = Math.round(innerHeight * dpr);
      if (bCanvas.width !== bw || bCanvas.height !== bh) { bCanvas.width = bw; bCanvas.height = bh; }
      lastIdx = -1;
    }
    resizeBloom();
    addEventListener('resize', resizeBloom, { passive: true });

    /* 预抽帧：比直接拖 video.currentTime 顺滑得多；按设备自适应帧数与尺寸 */
    async function extractBloomFrames() {
      try {
        const res = await fetch(BLOOM_SRC);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const v = document.createElement('video');
        v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
        await new Promise((ok, no) => { v.onloadedmetadata = () => ok(); v.onerror = () => no(); setTimeout(no, 15000); });
        const isMobile = innerWidth < 768;
        const mem = navigator.deviceMemory || 4;
        const maxW = isMobile ? 720 : 1280;
        const maxFrames = (isMobile || mem <= 4) ? 72 : 120;
        const scale = Math.min(1, maxW / v.videoWidth);
        const fw = Math.round(v.videoWidth * scale), fh = Math.round(v.videoHeight * scale);
        const n = Math.max(30, Math.min(maxFrames, Math.round(v.duration * 24)));
        for (let i = 0; i < n; i++) {
          v.currentTime = (i / (n - 1)) * (v.duration - 0.05);
          await new Promise((ok, no) => {
            const done = () => { v.removeEventListener('seeked', done); ok(); };
            v.addEventListener('seeked', done);
            setTimeout(() => { v.removeEventListener('seeked', done); no(); }, 3000);
          });
          frames.push(await createImageBitmap(v, { resizeWidth: fw, resizeHeight: fh }));
        }
        if (frames.length) {
          ready = true;
          bCanvas.style.visibility = 'visible';
          /* 真视频保留在画布下层：停止滚动时显示原片全分辨率画面 */
        }
        URL.revokeObjectURL(url);
      } catch (e) { /* 抽帧失败则退回拖动 video.currentTime */ }
    }
    extractBloomFrames();

    function drawBloom(frame) {
      const cw = bCanvas.width, ch = bCanvas.height;
      const s = Math.max(cw / frame.width, ch / frame.height);
      const dw = frame.width * s, dh = frame.height * s;
      bCtx.drawImage(frame, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }
    /* 滚动中：画抽帧（顺滑）；停止滚动 220ms 后：把真视频定位到当前进度，
       淡出画布露出原片（全分辨率清晰画面）。 */
    let lastProgress = -1, lastMoveAt = 0, parked = false, parkPending = false;
    bVideo.addEventListener('seeked', () => {
      if (parkPending) { parkPending = false; parked = true; bCanvas.style.opacity = '0'; }
    });
    function bloomTick() {
      if (document.body.classList.contains('bloom')) {
        const max = document.documentElement.scrollHeight - innerHeight;
        const progress = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
        const now = performance.now();
        if (ready && frames.length) {
          if (Math.abs(progress - lastProgress) > 0.0005) {
            lastProgress = progress;
            lastMoveAt = now;
            if (parked || parkPending) { parked = false; parkPending = false; bCanvas.style.opacity = '1'; }
            const idx = Math.round(progress * (frames.length - 1));
            if (idx !== lastIdx && frames[idx]) { lastIdx = idx; drawBloom(frames[idx]); }
          } else if (!parked && !parkPending && now - lastMoveAt > 220 && bVideo.duration && isFinite(bVideo.duration)) {
            parkPending = true;
            seeking = true;
            try { bVideo.currentTime = progress * bVideo.duration; } catch (e) { parkPending = false; }
          }
        } else if (bVideo.duration && isFinite(bVideo.duration) && bVideo.readyState >= 1) {
          const t = progress * bVideo.duration;
          if (!seeking && Math.abs(bVideo.currentTime - t) > 0.001) { seeking = true; bVideo.currentTime = t; }
        }
      }
      requestAnimationFrame(bloomTick);
    }
    requestAnimationFrame(bloomTick);
  }

  /* ---------- 白天模式引擎（Lumora）：分章节视频背景，懒加载 ---------- */
  const DAYVIDS = ['media/day-golden.mp4', 'media/day-water.mp4', 'media/day-woods.mp4', 'media/day-dawn.mp4'];
  const dayScene = $('#dayvidScene');
  let dayStarted = false, dayEls = [], dayActive = -1, dayCooldownUntil = 0, dayReqId = 0, dayPending = -1;
  function setDayVideo(i, force) {
    if (!dayStarted || i === dayActive || !dayEls[i]) return;
    const now = performance.now();
    if (!force && now < dayCooldownUntil) {
      /* 冷却期内的请求排队，冷却结束后自动执行最后一个 */
      if (dayPending !== i) {
        dayPending = i;
        setTimeout(() => {
          const p = dayPending; dayPending = -1;
          if (p >= 0 && p !== dayActive) setDayVideo(p, true);
        }, dayCooldownUntil - now + 60);
      }
      return;
    }
    dayCooldownUntil = now + 1000;
    const req = ++dayReqId;
    const v = dayEls[i];
    if (!v.src) { v.src = DAYVIDS[i]; v.load(); }
    const doFade = () => {
      if (req !== dayReqId) return; /* 已被更新的切换请求取代 */
      dayActive = i;
      dayEls.forEach((el, j) => el.classList.toggle('active', j === i));
      if (!reduced) v.play().catch(() => {});
      setTimeout(() => dayEls.forEach((el, j) => { if (j !== i && el.src) el.pause(); }), 1100);
      $$('.dayvid-switcher button').forEach(b => b.classList.toggle('active', Number(b.dataset.vid) === i));
      /* 深林视频偏亮：正文切换为深色（Lumora 规范） */
      document.body.classList.toggle('vid-bright', i === 2);
    };
    if (v.readyState >= 2) doFade();
    else v.addEventListener('canplay', doFade, { once: true });
  }
  function startDayVideos() {
    if (!dayScene) return;
    if (dayStarted) {
      if (dayActive >= 0 && !reduced) dayEls[dayActive].play().catch(() => {});
      return;
    }
    dayStarted = true;
    const scrim = dayScene.querySelector('.dayvid-scrim');
    dayEls = DAYVIDS.map(() => {
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
      v.preload = 'none';
      dayScene.insertBefore(v, scrim);
      return v;
    });
    const fixed = dayScene.dataset.fixed;
    if (fixed !== undefined && fixed !== '') { setDayVideo(Number(fixed), true); return; }
    /* 章节 ↔ 视频：章节进入视口中线时交叉淡入对应视频
       （用 rootMargin 中央带触发，高于一屏的长章节也能命中） */
    const vio = new IntersectionObserver((ents) => {
      ents.forEach(ent => {
        if (!ent.isIntersecting) return;
        if (!document.body.classList.contains('daylight')) return;
        const idx = Number(ent.target.dataset.vid);
        if (Number.isInteger(idx) && idx >= 0 && idx < DAYVIDS.length) setDayVideo(idx);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    $$('section[data-vid]').forEach(s => vio.observe(s));
    $$('.dayvid-switcher button').forEach(b => {
      b.addEventListener('click', () => setDayVideo(Number(b.dataset.vid), true));
    });
    setDayVideo(0, true);
  }

  /* ---------- 夜晚模式引擎（Asme）：hero 无缝黑场循环 + 分区视频懒加载 ---------- */
  let nightStarted = false, nightVids = [];
  function startNight() {
    if (nightStarted) {
      if (!reduced) nightVids.forEach(v => { if (v.src && v.paused) v.play().catch(() => {}); });
      return;
    }
    nightStarted = true;
    nightVids = $$('video[data-night-src]');
    if (!nightVids.length) return;
    const heroV = document.getElementById('nightHeroVideo');

    /* 分区视频：接近视口时才加载（省流量），加载后循环播放 */
    const lazyIO = new IntersectionObserver((ents) => {
      ents.forEach(ent => {
        if (!ent.isIntersecting) return;
        const v = ent.target;
        lazyIO.unobserve(v);
        if (v.src) return;
        v.src = v.dataset.nightSrc;
        v.load();
        v.addEventListener('canplay', () => {
          if (!reduced && document.body.classList.contains('night')) v.play().catch(() => {});
        }, { once: true });
      });
    }, { rootMargin: '240px 0px' });
    nightVids.forEach(v => { if (v !== heroV) lazyIO.observe(v); });

    /* Hero：淡入 → 结尾前 0.55s 淡出到黑 → 100ms 黑场 → 回开头再淡入（无缝循环） */
    if (heroV) {
      heroV.style.transition = 'opacity 0.5s ease';
      let fadingOut = false;
      /* 电脑横屏用横屏高清源，手机竖屏用竖屏高清源 */
      const landscape = innerWidth >= innerHeight;
      heroV.src = (landscape && heroV.dataset.nightSrcLandscape) ? heroV.dataset.nightSrcLandscape : heroV.dataset.nightSrc;
      heroV.load();
      heroV.addEventListener('canplay', () => {
        if (reduced) { heroV.style.opacity = '0.85'; return; }
        heroV.play().catch(() => {});
        heroV.style.opacity = '1';
      }, { once: true });
      heroV.addEventListener('timeupdate', () => {
        if (!fadingOut && heroV.duration && heroV.duration - heroV.currentTime <= 0.55) {
          fadingOut = true;
          heroV.style.opacity = '0';
        }
      });
      heroV.addEventListener('ended', () => {
        setTimeout(() => {
          heroV.currentTime = 0;
          if (!reduced && document.body.classList.contains('night')) heroV.play().catch(() => {});
          fadingOut = false;
          heroV.style.opacity = reduced ? '0.85' : '1';
        }, 100);
      });
    }
  }
  function stopNight() {
    nightVids.forEach(v => { if (v.src) v.pause(); });
  }

  /* ---------- 主题切换：夜晚 → 白天 → 花开（localStorage.theme，兼容旧值） ---------- */
  const themeBtn = $('#themeBtn');
  const THEME_ORDER = ['dark', 'light', 'bloom'];
  let themeMode = localStorage.getItem('theme');
  if (!THEME_ORDER.includes(themeMode)) themeMode = 'dark';
  function applyTheme(mode) {
    themeMode = mode;
    document.body.classList.toggle('dark', mode !== 'light');
    document.body.classList.toggle('bloom', mode === 'bloom');
    document.body.classList.toggle('daylight', mode === 'light');
    document.body.classList.toggle('night', mode === 'dark');
    if (themeBtn) themeBtn.textContent = mode === 'dark' ? '白天模式' : mode === 'light' ? '花开模式' : '夜晚模式';
    if (mode === 'bloom') startBloom();
    if (mode === 'light') startDayVideos();
    else if (dayStarted) dayEls.forEach(v => { if (v.src) v.pause(); });
    if (mode === 'dark') startNight(); else stopNight();
  }
  applyTheme(themeMode);
  themeBtn?.addEventListener('click', () => {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(themeMode) + 1) % THEME_ORDER.length];
    localStorage.setItem('theme', next);
    applyTheme(next);
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

  /* ---------- 入场动画：章节级双向重播 + 卡片级逐张浮现 ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.intersectionRatio >= 0.14) ent.target.classList.add('is-visible');
      else if (!ent.isIntersecting) ent.target.classList.remove('is-visible');
    });
  }, { threshold: [0, 0.14] });
  $$('.reveal').forEach(el => io.observe(el));

  const itemIO = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (!ent.isIntersecting) return;
      const el = ent.target;
      itemIO.unobserve(el);
      el.classList.add('is-visible');
      const delayMs = (parseFloat(el.style.transitionDelay) || 0) * 1000;
      setTimeout(() => {
        el.classList.remove('reveal-item', 'is-visible');
        el.style.transitionDelay = '';
      }, 950 + delayMs);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
  ['#lettersPreview', '#fragmentsPreview', '#repliesPreview', '#archiveGrid'].forEach(sel => {
    const box = $(sel);
    if (!box) return;
    Array.from(box.children).forEach((el, i) => {
      if (!el.matches('a, article')) return;
      el.classList.add('reveal-item');
      el.style.transitionDelay = ((i % 4) * 0.09) + 's';
      itemIO.observe(el);
    });
  });

  /* ---------- Hero 随滚动淡出下沉（滚回来复原） ---------- */
  const heroStage = $('#hero');
  if (heroStage && isHomePage && !reduced) {
    let heroTicking = false;
    const heroFade = () => {
      heroTicking = false;
      const f = Math.max(0, 1 - scrollY / (innerHeight * 0.62));
      heroStage.style.opacity = f.toFixed(3);
      heroStage.style.transform = `translateY(${Math.min(scrollY * 0.18, 240).toFixed(1)}px)`;
      heroStage.style.pointerEvents = f < 0.05 ? 'none' : '';
    };
    addEventListener('scroll', () => {
      if (!heroTicking) { heroTicking = true; requestAnimationFrame(heroFade); }
    }, { passive: true });
    heroFade();
  }

  /* ---------- 章节标题视差：滚动时轻微漂移 ---------- */
  const parallaxHeads = $$('.section-heading h2');
  if (parallaxHeads.length && !reduced && !isCoarsePointer) {
    (function headTick() {
      for (const h2 of parallaxHeads) {
        const r = h2.parentElement.getBoundingClientRect();
        if (r.bottom < -80 || r.top > innerHeight + 80) continue;
        const off = (r.top + r.height / 2 - innerHeight / 2) * 0.08;
        h2.style.transform = `translateY(${off.toFixed(1)}px)`;
      }
      requestAnimationFrame(headTick);
    })();
  }

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
  let daysCountUpDone = false; /* 进场时数字从 0 滚到当前天数，完成前 updateTime 不覆盖 */
  function updateTime() {
    const p = parts(togetherStart), k = parts(knownStart);
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    if (daysCountUpDone) set('#coreDays', p.d);
    set('#coreHours', p.h); set('#coreMinutes', p.m); set('#coreSeconds', p.s);
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

  /* ---------- 天数滚动进场：滚到时间章节时数字从 0 跳到当前 ---------- */
  const timeStage = document.getElementById('time');
  if (timeStage && !reduced) {
    const cuIO = new IntersectionObserver((ents) => {
      ents.forEach(ent => {
        if (!ent.isIntersecting) return;
        cuIO.disconnect();
        const el = $('#coreDays');
        const target = parts(togetherStart).d;
        const t0 = performance.now(), dur = 1400;
        requestAnimationFrame(function cu(t) {
          const k2 = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - k2, 3);
          if (el) el.textContent = Math.round(target * eased);
          if (k2 < 1) requestAnimationFrame(cu);
          else daysCountUpDone = true;
        });
      });
    }, { threshold: 0.3 });
    cuIO.observe(timeStage);
  } else {
    daysCountUpDone = true;
    updateTime();
  }

  /* ---------- 白天模式底部数据条：数字来自真实内容 ---------- */
  const dsDays = $('#dsDays');
  if (dsDays) {
    dsDays.textContent = `在一起 ${parts(togetherStart).d} 天`;
    const dsL = $('#dsLetters'), dsF = $('#dsFrags'), dsR = $('#dsReplies');
    if (dsL) dsL.textContent = `${(DATA.letters || []).length} 封信件`;
    if (dsF) dsF.textContent = `${(DATA.fragments || []).length} 条碎碎念`;
    if (dsR) dsR.textContent = `${(DATA.replies || []).length} 封回信`;
  }

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

  /* ---------- 行星视差（鼠标轻微推动，近快远慢） ---------- */
  const planetHorizon = $('#planetHorizon');
  const planetRinged = $('#planetRinged');
  if ((planetHorizon || planetRinged) && !reduced && window.matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', e => {
      const px = e.clientX / innerWidth - 0.5, py = e.clientY / innerHeight - 0.5;
      if (planetHorizon) planetHorizon.style.transform = `translate3d(${px * -20}px, ${py * -10}px, 0)`;
      if (planetRinged) planetRinged.style.transform = `translate3d(${px * 30}px, ${py * 20}px, 0)`;
    }, { passive: true });
  }

  /* ==========================================================================
     星空引擎 v3：真·3D 透视星野 —— 星星带纵深缓缓向你飘来，
     近星大而亮（带十字光芒），远星小而暗；鼠标视差近快远慢。
     + 流星 + 靠近光标的星座连线（夜晚）；白天为暖色光尘。
     ========================================================================== */
  const canvas = $('#spaceCanvas');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(2, devicePixelRatio || 1);
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const Z_FAR = 6, Z_NEAR = 0.35;
    let w = 0, h = 0, cx = 0, cy = 0, F = 0, extX = 0, extY = 0;
    let stars = [], dust = [], meteors = [];
    let nextMeteorAt = 0;
    const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

    function makeStar(z) {
      return {
        x: (Math.random() * 2 - 1) * extX,
        y: (Math.random() * 2 - 1) * extY,
        z,
        r: 0.5 + Math.random() * 1.3,
        tw: Math.random() * Math.PI * 2,
        twSpeed: 0.0012 + Math.random() * 0.0022,
        hue: Math.random(),
        sx: 0, sy: 0
      };
    }
    function resize() {
      w = canvas.width = Math.floor(innerWidth * DPR);
      h = canvas.height = Math.floor(innerHeight * DPR);
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      cx = w / 2; cy = h / 2;
      F = h * 0.9;
      extX = (w / 2) * Z_FAR / F * 1.2;
      extY = (h / 2) * Z_FAR / F * 1.2;
      const count = innerWidth < 700 ? 110 : (innerWidth < 980 ? 170 : 260);
      stars = Array.from({ length: count }, () => makeStar(Z_NEAR + Math.random() * (Z_FAR - Z_NEAR)));
      const dustCount = innerWidth < 700 ? 40 : 90;
      dust = Array.from({ length: dustCount }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
        r: 0.6 + Math.random() * 1.7,
        tw: Math.random() * Math.PI * 2,
        twSpeed: 0.0012 + Math.random() * 0.002
      }));
    }
    resize();
    addEventListener('resize', resize, { passive: true });

    function spawnMeteor(now) {
      const fromX = w * (0.15 + Math.random() * 0.75);
      const fromY = h * (0.02 + Math.random() * 0.25);
      const speed = (7 + Math.random() * 7) * DPR;
      const angle = Math.PI * (0.72 + Math.random() * 0.1);
      meteors.push({
        x: fromX, y: fromY,
        vx: Math.cos(angle) * speed, vy: -Math.sin(angle) * speed,
        life: 1, decay: 0.012 + Math.random() * 0.012,
        len: (70 + Math.random() * 90) * DPR
      });
      nextMeteorAt = now + 2800 + Math.random() * 4500;
    }

    function starColor(s, alpha) {
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
      if (document.body.classList.contains('bloom') || document.body.classList.contains('daylight')) { requestAnimationFrame(frame); return; }
      const dark = document.body.classList.contains('dark');
      const active = document.body.classList.contains('music-active');

      if (dark) {
        /* --- 3D 星野 --- */
        const zSpeed = 0.0016 * (active ? 2.2 : 1);
        const camX = (mouse.x / innerWidth - 0.5) * 0.05;
        const camY = (mouse.y / innerHeight - 0.5) * 0.035;
        for (const s of stars) {
          s.z -= zSpeed;
          if (s.z < Z_NEAR) {
            s.x = (Math.random() * 2 - 1) * extX;
            s.y = (Math.random() * 2 - 1) * extY;
            s.z = Z_FAR;
          }
          const k = F / s.z;
          const sx = cx + (s.x - camX) * k;
          const sy = cy + (s.y - camY) * k;
          s.sx = sx; s.sy = sy;
          if (sx < -30 || sx > w + 30 || sy < -30 || sy > h + 30) continue;
          const depth = 1 - (s.z - Z_NEAR) / (Z_FAR - Z_NEAR);
          let a = 0.2 + depth * 0.62 + Math.sin(t * s.twSpeed + s.tw) * 0.22;
          if (s.z < 0.75) a *= (s.z - Z_NEAR) / (0.75 - Z_NEAR);
          a = Math.max(0.04, Math.min(1, a));
          const sr = Math.min(3 * DPR, s.r * DPR * (0.55 + depth * 1.35));
          ctx.beginPath();
          ctx.fillStyle = starColor(s, a);
          ctx.arc(sx, sy, sr, 0, Math.PI * 2);
          ctx.fill();
          if (depth > 0.82 && a > 0.5) {
            ctx.strokeStyle = starColor(s, a * 0.28);
            ctx.lineWidth = 1 * DPR;
            ctx.beginPath();
            ctx.moveTo(sx - sr * 3.2, sy); ctx.lineTo(sx + sr * 3.2, sy);
            ctx.moveTo(sx, sy - sr * 3.2); ctx.lineTo(sx, sy + sr * 3.2);
            ctx.stroke();
          }
        }

        /* --- 星座连线：靠近光标的近景星互相牵手 --- */
        if (finePointer) {
          const mx = mouse.x * DPR, my = mouse.y * DPR;
          const near = [];
          for (const s of stars) {
            if (s.z > 1.8) continue;
            const dx = s.sx - mx, dy = s.sy - my;
            if (dx * dx + dy * dy < (230 * DPR) * (230 * DPR)) near.push(s);
            if (near.length >= 14) break;
          }
          ctx.lineWidth = 1 * DPR;
          for (let i = 0; i < near.length; i++) {
            for (let j = i + 1; j < near.length; j++) {
              const a = near[i], b = near[j];
              const dx = a.sx - b.sx, dy = a.sy - b.sy;
              const dist = Math.hypot(dx, dy);
              const maxD = 140 * DPR;
              if (dist < maxD) {
                const alpha = (1 - dist / maxD) * 0.38;
                ctx.strokeStyle = `rgba(185, 166, 255, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(a.sx, a.sy);
                ctx.lineTo(b.sx, b.sy);
                ctx.stroke();
              }
            }
          }
        }

        /* --- 流星 --- */
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
      } else {
        /* --- 白天：暖色光尘 --- */
        if (meteors.length) meteors = [];
        const speedBoost = active ? 2 : 1;
        for (const p of dust) {
          p.x += p.vx * speedBoost; p.y += p.vy * speedBoost;
          if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
          const a = 0.24 + Math.sin(t * p.twSpeed + p.tw) * 0.14;
          ctx.beginPath();
          ctx.fillStyle = `rgba(214, 122, 155, ${Math.max(0.05, a * 0.5)})`;
          ctx.ellipse(p.x, p.y, p.r * 1.8 * DPR, p.r * 0.9 * DPR, p.tw, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();
