    const themeBtn = document.getElementById("themeBtn");
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      themeBtn.textContent = "白天模式";
    }

    themeBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      themeBtn.textContent = isDark ? "白天模式" : "夜晚模式";
    });

    const playlist = [
      { title: "η", note: "by α·Pav", src: "music/bgm.mp3" },
      { title: "Gotta have you", note: "by The Weepies", src: "music/bgm2.mp3" },
      { title: "Little bit better", note: "by Caleb Hearn/ROSIE", src: "music/bgm3.mp3" }
    ];

    const bgm = document.getElementById("bgm");
    const musicIntro = document.getElementById("musicIntro");
    const startMusicBtn = document.getElementById("startMusicBtn");
    const skipMusicBtn = document.getElementById("skipMusicBtn");
    const musicPlayer = document.getElementById("musicPlayer");
    const playerTrackTitle = document.getElementById("playerTrackTitle");
    const playerTrackNote = document.getElementById("playerTrackNote");
    const introTrackTitle = document.getElementById("introTrackTitle");
    const introTrackNote = document.getElementById("introTrackNote");
    const prevTrackBtn = document.getElementById("prevTrackBtn");
    const togglePlayBtn = document.getElementById("togglePlayBtn");
    const nextTrackBtn = document.getElementById("nextTrackBtn");
    const petalLayer = document.getElementById("petalLayer");
    const fireflyLayer = document.getElementById("fireflyLayer");
    const interactionLayer = document.getElementById("interactionLayer");
    const cursorGlow = document.getElementById("cursorGlow");
    const togetherDays = document.getElementById("togetherDays");
    const togetherHours = document.getElementById("togetherHours");
    const togetherMinutes = document.getElementById("togetherMinutes");
    const togetherSeconds = document.getElementById("togetherSeconds");
    const togetherSentence = document.getElementById("togetherSentence");
    const knownDays = document.getElementById("knownDays");

    const togetherStart = new Date(2026, 2, 20, 0, 0, 0);
    const knownStart = new Date(2026, 2, 5, 0, 0, 0);

    let currentTrackIndex = Number(localStorage.getItem("currentTrackIndex"));
    if (!Number.isInteger(currentTrackIndex) || currentTrackIndex < 0 || currentTrackIndex >= playlist.length) {
      currentTrackIndex = 0;
    }

    bgm.volume = 0.6;

    function getDurationParts(fromDate, toDate) {
      const diff = Math.max(0, toDate.getTime() - fromDate.getTime());
      const oneSecond = 1000;
      const oneMinute = 60 * oneSecond;
      const oneHour = 60 * oneMinute;
      const oneDay = 24 * oneHour;

      const days = Math.floor(diff / oneDay);
      const hours = Math.floor((diff % oneDay) / oneHour);
      const minutes = Math.floor((diff % oneHour) / oneMinute);
      const seconds = Math.floor((diff % oneMinute) / oneSecond);

      return { days, hours, minutes, seconds };
    }

    function updateLoveCounter() {
      const now = new Date();
      const together = getDurationParts(togetherStart, now);
      const known = getDurationParts(knownStart, now);

      if (togetherDays) togetherDays.textContent = together.days;
      if (togetherHours) togetherHours.textContent = together.hours;
      if (togetherMinutes) togetherMinutes.textContent = together.minutes;
      if (togetherSeconds) togetherSeconds.textContent = together.seconds;
      if (knownDays) knownDays.textContent = known.days;

      if (togetherSentence) {
        togetherSentence.textContent = `从 2026.03.20 开始，我们已经一起走过 ${together.days} 天 ${together.hours} 小时 ${together.minutes} 分钟 ${together.seconds} 秒。`;
      }
    }

    function updatePlayerUI() {
      const currentTrack = playlist[currentTrackIndex];
      const countText = `第 ${currentTrackIndex + 1} 首 / 共 ${playlist.length} 首`;

      if (playerTrackTitle) playerTrackTitle.textContent = currentTrack.title;
      if (playerTrackNote) playerTrackNote.textContent = `${countText} · ${currentTrack.note}`;
      if (introTrackTitle) introTrackTitle.textContent = currentTrack.title;
      if (introTrackNote) introTrackNote.textContent = currentTrack.note;
      if (togglePlayBtn) togglePlayBtn.textContent = bgm.paused ? "播放" : "暂停";
      if (musicPlayer) musicPlayer.classList.toggle("is-playing", !bgm.paused);
      document.body.classList.toggle("music-playing", !bgm.paused);
    }

    function loadTrack(index, shouldPlay = false) {
      currentTrackIndex = (index + playlist.length) % playlist.length;
      localStorage.setItem("currentTrackIndex", String(currentTrackIndex));
      bgm.src = playlist[currentTrackIndex].src;
      bgm.load();
      updatePlayerUI();

      if (shouldPlay) {
        playMusic();
      }
    }

    async function playMusic() {
      try {
        await bgm.play();
        updatePlayerUI();
      } catch (err) {
        console.error("音乐播放失败：", err);
        updatePlayerUI();
      }
    }

    function pauseMusic() {
      bgm.pause();
      updatePlayerUI();
    }

    function playNextTrack() {
      loadTrack(currentTrackIndex + 1, true);
    }

    function playPreviousTrack() {
      loadTrack(currentTrackIndex - 1, true);
    }

    function hideIntro() {
      musicIntro.classList.add("hidden");
      musicIntro.setAttribute("aria-hidden", "true");
    }

    startMusicBtn.addEventListener("click", async () => {
      hideIntro();
      await playMusic();
    });

    skipMusicBtn.addEventListener("click", () => {
      hideIntro();
      pauseMusic();
    });

    togglePlayBtn.addEventListener("click", async () => {
      if (bgm.paused) {
        await playMusic();
      } else {
        pauseMusic();
      }
    });

    prevTrackBtn.addEventListener("click", playPreviousTrack);
    nextTrackBtn.addEventListener("click", playNextTrack);

    bgm.addEventListener("play", updatePlayerUI);
    bgm.addEventListener("pause", updatePlayerUI);
    bgm.addEventListener("ended", playNextTrack);
    bgm.addEventListener("error", () => {
      console.error("当前曲目加载失败，请确认文件存在：", playlist[currentTrackIndex].src);
      updatePlayerUI();
    });

    function createPetals(count) {
      if (!petalLayer) return;
      petalLayer.innerHTML = "";

      for (let i = 0; i < count; i += 1) {
        const petal = document.createElement("span");
        petal.className = "petal";

        const left = Math.random() * 100;
        const size = 10 + Math.random() * 16;
        const opacity = 0.34 + Math.random() * 0.40;
        const rotate = `${Math.random() * 360}deg`;
        const drift = `${-80 + Math.random() * 160}px`;
        const fallDuration = `${10 + Math.random() * 12}s`;
        const swayDuration = `${2.8 + Math.random() * 3.6}s`;
        const delay = `${-Math.random() * 18}s`;

        petal.style.left = `${left}vw`;
        petal.style.setProperty("--size", `${size}px`);
        petal.style.setProperty("--opacity", opacity);
        petal.style.setProperty("--rotate", rotate);
        petal.style.setProperty("--drift", drift);
        petal.style.setProperty("--fall-duration", fallDuration);
        petal.style.setProperty("--sway-duration", swayDuration);
        petal.style.setProperty("--delay", delay);

        petalLayer.appendChild(petal);
      }
    }


    function createFireflies(count) {
      if (!fireflyLayer) return;
      fireflyLayer.innerHTML = "";

      for (let i = 0; i < count; i += 1) {
        const firefly = document.createElement("span");
        firefly.className = "firefly";

        firefly.style.left = `${Math.random() * 100}vw`;
        firefly.style.top = `${12 + Math.random() * 78}vh`;
        firefly.style.setProperty("--float-x", `${-26 + Math.random() * 52}px`);
        firefly.style.setProperty("--float-y", `${-18 + Math.random() * 36}px`);
        firefly.style.setProperty("--duration", `${5 + Math.random() * 7}s`);
        firefly.style.setProperty("--delay", `${-Math.random() * 8}s`);
        firefly.style.setProperty("--scale", `${0.65 + Math.random() * 0.85}`);

        fireflyLayer.appendChild(firefly);
      }
    }

    function moveCursorGlow(event) {
      if (!cursorGlow || window.innerWidth < 800) return;
      cursorGlow.style.opacity = "1";
      cursorGlow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
    }

    function hideCursorGlow() {
      if (cursorGlow) cursorGlow.style.opacity = "0";
    }

    function createClickBurst(event) {
      if (!interactionLayer || reducedMotion) return;

      const isDark = document.body.classList.contains("dark");
      const burstCount = window.innerWidth < 700 ? 8 : 14;
      const x = event.clientX;
      const y = event.clientY;

      for (let i = 0; i < burstCount; i += 1) {
        const spark = document.createElement("span");
        const usePetal = !isDark && i % 3 !== 0;
        spark.className = usePetal ? "touch-petal" : "touch-star";

        const angle = (Math.PI * 2 * i) / burstCount + Math.random() * 0.7;
        const distance = 22 + Math.random() * 54;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        const size = usePetal ? 8 + Math.random() * 10 : 4 + Math.random() * 8;

        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.setProperty("--tx", `${tx}px`);
        spark.style.setProperty("--ty", `${ty}px`);
        spark.style.setProperty("--burst-size", `${size}px`);
        spark.style.setProperty("--spin", `${Math.random() * 220 - 110}deg`);

        interactionLayer.appendChild(spark);
        window.setTimeout(() => spark.remove(), 950);
      }
    }

    document.addEventListener("pointermove", moveCursorGlow);
    document.addEventListener("pointerleave", hideCursorGlow);
    document.addEventListener("pointerdown", createClickBurst);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion) {
      createPetals(window.innerWidth < 700 ? 14 : 22);
      createFireflies(window.innerWidth < 700 ? 8 : 16);
      window.addEventListener("resize", () => {
        createPetals(window.innerWidth < 700 ? 14 : 22);
        createFireflies(window.innerWidth < 700 ? 8 : 16);
      });
    }

    function refreshFoldLabels() {
      document.querySelectorAll("details.fold-panel").forEach((panel) => {
        const toggle = panel.querySelector(".fold-toggle");
        if (toggle) toggle.textContent = panel.open ? "收起" : "展开";
      });

      document.querySelectorAll("details.letter-card").forEach((panel) => {
        const hint = panel.querySelector(".expand-hint");
        if (hint) hint.textContent = panel.open ? "收起" : "展开";
      });
    }

    document.querySelectorAll("details.fold-panel, details.letter-card").forEach((panel) => {
      panel.addEventListener("toggle", refreshFoldLabels);
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        const panel = target.querySelector("details.fold-panel");
        if (panel) panel.open = true;
      });
    });

    loadTrack(currentTrackIndex, false);
    updateLoveCounter();
    setInterval(updateLoveCounter, 1000);
    refreshFoldLabels();
    updatePlayerUI();

// ===== Love Universe V2 / 高动效增强 =====
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js-ready");

  const portal = document.getElementById("entryPortal");
  if (portal) {
    const closePortal = () => {
      portal.classList.add("portal-hide");
      portal.setAttribute("aria-hidden", "true");
      window.setTimeout(() => portal.remove(), 900);
    };
    portal.addEventListener("click", closePortal);
    window.setTimeout(closePortal, reduceMotion ? 450 : 2300);
  }

  // 章节滚动出现 + 右侧进度线
  const revealTargets = document.querySelectorAll(".section, .divider, .hero, .footer");
  revealTargets.forEach((el) => el.classList.add("reveal-on-scroll"));
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("in-view"));
  }

  const railLinks = Array.from(document.querySelectorAll(".journey-rail a"));
  const sectionIds = railLinks.map((link) => link.getAttribute("href")).filter(Boolean);
  const sections = sectionIds.map((id) => document.querySelector(id)).filter(Boolean);
  function updateScrollVisuals() {
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / max));
    document.body.style.setProperty("--page-progress", progress.toFixed(4));
    document.body.style.setProperty("--scroll-shift", `${Math.round(window.scrollY * 0.045)}px`);

    let active = sections[0];
    const pivot = window.innerHeight * 0.42;
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= pivot) active = section;
    });
    railLinks.forEach((link) => {
      link.classList.toggle("active", active && link.getAttribute("href") === `#${active.id}`);
    });
  }
  updateScrollVisuals();
  window.addEventListener("scroll", updateScrollVisuals, { passive: true });
  window.addEventListener("resize", updateScrollVisuals);

  // Canvas 星河 / 花粉粒子背景
  const canvas = document.getElementById("universeCanvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  let particles = [];
  let mouse = { x: -9999, y: -9999, active: false };
  let rafId = null;
  let lastTime = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function isNightMode() {
    return document.body.classList.contains("dark");
  }

  function isMusicOn() {
    return document.body.classList.contains("music-playing");
  }

  function particleCount() {
    const area = window.innerWidth * window.innerHeight;
    const base = window.innerWidth < 700 ? 56 : 125;
    const extra = Math.min(95, Math.floor(area / 26000));
    return base + extra;
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildParticles();
  }

  function buildParticles() {
    if (!canvas) return;
    const count = particleCount();
    particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.8 + 0.45,
      depth: Math.random() * 0.85 + 0.15,
      phase: Math.random() * Math.PI * 2,
      hue: i % 4
    }));
  }

  function drawParticles(time) {
    if (!ctx || !canvas) return;
    const dt = Math.min(32, time - lastTime || 16);
    lastTime = time;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const night = isNightMode();
    const music = isMusicOn();
    const energy = music ? 1.45 : 1;

    ctx.clearRect(0, 0, w, h);

    // subtle nebula wash
    const grad = ctx.createRadialGradient(w * 0.75, h * 0.08, 0, w * 0.72, h * 0.12, Math.max(w, h) * 0.82);
    if (night) {
      grad.addColorStop(0, "rgba(255, 214, 156, 0.07)");
      grad.addColorStop(0.45, "rgba(178, 107, 182, 0.045)");
      grad.addColorStop(1, "rgba(20, 30, 48, 0)");
    } else {
      grad.addColorStop(0, "rgba(255, 198, 214, 0.06)");
      grad.addColorStop(0.5, "rgba(255, 232, 238, 0.03)");
      grad.addColorStop(1, "rgba(255, 250, 247, 0)");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    particles.forEach((p, i) => {
      p.phase += 0.004 * dt * energy;
      p.x += p.vx * dt * p.depth * energy + Math.sin(p.phase) * 0.014 * dt;
      p.y += p.vy * dt * p.depth * energy + Math.cos(p.phase * 0.8) * 0.012 * dt;

      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 160) {
          const force = (1 - dist / 160) * 0.18;
          p.x += dx * force;
          p.y += dy * force;
        }
      }

      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      const twinkle = 0.42 + Math.sin(p.phase + i) * 0.28 + p.depth * 0.30;
      const radius = p.r * (night ? 1.05 : 1.25) * (music ? 1.08 : 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      if (night) {
        const palette = p.hue === 0 ? "255, 236, 190" : p.hue === 1 ? "202, 219, 255" : p.hue === 2 ? "255, 188, 208" : "214, 255, 237";
        ctx.fillStyle = `rgba(${palette}, ${Math.min(0.9, twinkle)})`;
      } else {
        ctx.fillStyle = `rgba(202, 135, 157, ${Math.min(0.34, twinkle * 0.25)})`;
      }
      ctx.shadowColor = night ? "rgba(255, 220, 166, 0.45)" : "rgba(222, 154, 178, 0.18)";
      ctx.shadowBlur = night ? 9 * p.depth : 5 * p.depth;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    if (mouse.active && night && window.innerWidth > 860) {
      ctx.lineWidth = 0.5;
      particles.forEach((a, idx) => {
        for (let j = idx + 1; j < Math.min(particles.length, idx + 14); j += 1) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 84) {
            ctx.strokeStyle = `rgba(255, 221, 171, ${0.08 * (1 - dist / 84)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      });
    }

    rafId = requestAnimationFrame(drawParticles);
  }

  if (ctx && !reduceMotion) {
    resizeCanvas();
    rafId = requestAnimationFrame(drawParticles);
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("pointermove", (event) => {
      mouse = { x: event.clientX, y: event.clientY, active: true };
    }, { passive: true });
    document.addEventListener("pointerleave", () => {
      mouse.active = false;
    });
  }

  // 3D 卡片倾斜 + 光泽追踪
  const tiltTargets = Array.from(document.querySelectorAll(".card, .fold-summary, .quote"));
  function resetTilt(el) {
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--shine-x", "50%");
    el.style.setProperty("--shine-y", "50%");
  }
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    tiltTargets.forEach((el) => {
      el.classList.add("tilt-surface");
      resetTilt(el);
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        const rx = (0.5 - py) * 7;
        const ry = (px - 0.5) * 9;
        el.style.setProperty("--tilt-x", `${rx.toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${ry.toFixed(2)}deg`);
        el.style.setProperty("--shine-x", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--shine-y", `${(py * 100).toFixed(1)}%`);
      });
      el.addEventListener("pointerleave", () => resetTilt(el));
    });
  }

  // 按钮磁吸，不改布局，只给轻微跟手感
  const magneticTargets = Array.from(document.querySelectorAll(".btn, .theme-btn, .player-control-btn, .fold-toggle, .expand-hint"));
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    magneticTargets.forEach((el) => {
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const dx = (event.clientX - rect.left - rect.width / 2) * 0.10;
        const dy = (event.clientY - rect.top - rect.height / 2) * 0.14;
        el.style.setProperty("--magnet-x", `${dx.toFixed(1)}px`);
        el.style.setProperty("--magnet-y", `${dy.toFixed(1)}px`);
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--magnet-x", "0px");
        el.style.setProperty("--magnet-y", "0px");
      });
    });
  }

  // 折叠展开时加动态状态，做更明显的“打开信纸”动画
  document.querySelectorAll("details.fold-panel, details.letter-card").forEach((panel) => {
    panel.addEventListener("toggle", () => {
      panel.classList.add("just-toggled");
      window.setTimeout(() => panel.classList.remove("just-toggled"), 520);
    });
  });

  // 隐藏彩蛋：点站名五次
  const siteName = document.querySelector(".site-name");
  let secretTap = 0;
  let secretTimer = null;
  function showToast(text) {
    const toast = document.createElement("div");
    toast.className = "love-toast";
    toast.textContent = text;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.classList.add("show"), 30);
    window.setTimeout(() => {
      toast.classList.remove("show");
      window.setTimeout(() => toast.remove(), 520);
    }, 3200);
  }
  if (siteName) {
    siteName.addEventListener("click", () => {
      secretTap += 1;
      clearTimeout(secretTimer);
      secretTimer = setTimeout(() => { secretTap = 0; }, 1400);
      if (secretTap >= 5) {
        secretTap = 0;
        showToast("你发现这里啦。其实我一直都在等你点开。✨");
      }
    });
  }

  // 让音乐播放器更像可收放的小组件：双击唱片切换精简模式
  if (musicPlayer) {
    const icon = musicPlayer.querySelector(".player-icon");
    icon?.addEventListener("dblclick", () => {
      musicPlayer.classList.toggle("player-compact");
    });
  }
})();
