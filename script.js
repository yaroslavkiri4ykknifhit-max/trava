(() => {
  "use strict";

  const state = {
    lenis: null,
    mm: null,
    cursor: { x: 0, y: 0, tx: 0, ty: 0 },
    menuOpen: false,
    heroPointerBound: false,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function initLoader() {
    const loader = $(".site-loader");
    if (!loader || state.reducedMotion) {
      loader?.remove();
      return;
    }

    window.setTimeout(() => {
      if (!window.gsap) {
        loader.remove();
        return;
      }
      gsap.to(loader, {
        autoAlpha: 0,
        duration: 0.75,
        ease: "power3.inOut",
        onComplete: () => loader.remove()
      });
    }, 450);
  }

  function initSmoothScroll() {
    if (!window.Lenis || state.reducedMotion) return;

    state.lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      syncTouch: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.05
    });

    const raf = (time) => {
      state.lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);

    if (window.gsap && window.ScrollTrigger) {
      gsap.ticker.lagSmoothing(1000, 16);
      gsap.ticker.add((time) => state.lenis?.raf(time * 1000));
    }

    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        closeMenu();
        state.lenis?.scrollTo(target, { offset: -20, duration: 1.15 });
      });
    });
  }

  function initHeader() {
    const header = $("[data-header]");
    if (!header || !window.gsap) return;

    let lastY = 0;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      header.classList.toggle("scrolled", y > 30);
      if (y > lastY + 8 && y > 160) header.classList.add("hide");
      if (y < lastY - 8 || y < 60) header.classList.remove("hide");
      lastY = y;
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  function initRevealAnimations() {
    if (!window.gsap || !window.ScrollTrigger) return;

    gsap.utils.toArray(".reveal-up").forEach((el, index) => {
      gsap.set(el, { autoAlpha: 0, y: 34 });

      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => {
          gsap.to(el, {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            delay: (index % 5) * 0.035,
            ease: "power3.out"
          });
        }
      });
    });

    const heroLines = $$(".hero-title .line");
    if (heroLines.length) {
      gsap.set(heroLines, { autoAlpha: 0, yPercent: 110, rotateX: -25, transformOrigin: "50% 100%" });
      gsap.to(heroLines, {
        autoAlpha: 1,
        yPercent: 0,
        rotateX: 0,
        duration: 1.2,
        delay: 0.55,
        stagger: 0.12,
        ease: "power4.out"
      });
    }

    gsap.utils.toArray(".services-grid .service-card").forEach((card, i) => {
      gsap.from(card, {
        y: 70,
        rotation: i % 2 ? 1.2 : -1.2,
        autoAlpha: 0,
        duration: 1,
        delay: i * 0.05,
        ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 88%", once: true }
      });
    });
  }

  function initHeroDepth() {
    const hero = $("[data-hero]");
    const bg = $('[data-parallax="bg"]');
    const copy = $('[data-parallax="copy"]');
    const fg = $('[data-parallax="fg"]');
    if (!hero || !bg || !copy || !fg || state.reducedMotion) return;

    if (window.gsap && window.ScrollTrigger) {
      gsap.to(bg, {
        yPercent: 12,
        scale: 1.13,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
      });

      gsap.to(copy, {
        yPercent: 16,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
      });

      gsap.to(fg, {
        yPercent: 24,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
      });
    }

    const finePointer = window.matchMedia("(pointer:fine)").matches;
    if (!finePointer) return;

    state.heroPointerBound = true;
    let rafId = 0;

    const render = () => {
      const nx = state.cursor.tx;
      const ny = state.cursor.ty;
      const bgX = nx * -9;
      const bgY = ny * -5;
      const copyX = nx * -15;
      const copyY = ny * -9;
      const fgX = nx * 34;
      const fgY = ny * 18;

      gsap.to(bg, { x: bgX, y: bgY, duration: 1.15, ease: "power3.out", overwrite: true });
      gsap.to(copy, { x: copyX, y: copyY, duration: 0.8, ease: "power3.out", overwrite: true });
      gsap.to(fg, { x: fgX, y: fgY, duration: 0.9, ease: "power3.out", overwrite: true });
      rafId = 0;
    };

    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      state.cursor.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      state.cursor.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      state.cursor.x = event.clientX;
      state.cursor.y = event.clientY;
      $(".cursor-glow")?.style.setProperty("opacity", "1");
      $(".cursor-glow")?.style.setProperty("left", `${event.clientX}px`);
      $(".cursor-glow")?.style.setProperty("top", `${event.clientY}px`);
      if (!rafId) rafId = requestAnimationFrame(render);
    });

    hero.addEventListener("pointerleave", () => {
      state.cursor.tx = 0;
      state.cursor.ty = 0;
      $(".cursor-glow")?.style.setProperty("opacity", "0");
      render();
    });
  }

  function initGyro() {
    if (state.reducedMotion) return;
    const bg = $('[data-parallax="bg"]');
    const fg = $('[data-parallax="fg"]');
    if (!bg || !fg || window.matchMedia("(pointer:fine)").matches) return;

    let permissionAsked = false;

    const apply = (gamma, beta) => {
      const gx = clamp(gamma / 35, -1, 1);
      const gy = clamp((beta - 45) / 35, -1, 1);
      gsap.to(bg, { x: gx * -7, y: gy * -3, duration: 0.7, ease: "power2.out", overwrite: true });
      gsap.to(fg, { x: gx * 18, y: gy * 10, duration: 0.8, ease: "power2.out", overwrite: true });
    };

    const bind = () => {
      if (permissionAsked) return;
      permissionAsked = true;
      window.addEventListener("deviceorientation", (event) => {
        if (typeof event.gamma === "number" && typeof event.beta === "number") {
          apply(event.gamma, event.beta);
        }
      }, true);
    };

    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      document.addEventListener("click", async () => {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === "granted") bind();
        } catch (_) {
          // Gyroscope is optional; scroll parallax remains available.
        }
      }, { once: true });
    } else {
      bind();
    }
  }

  function initParticles() {
    const canvas = $("[data-particles]");
    if (!canvas || state.reducedMotion) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const particles = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const count = window.innerWidth < 700 ? 26 : 58;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.45,
        s: Math.random() * 0.35 + 0.1,
        drift: Math.random() * 0.65 - 0.325,
        alpha: Math.random() * 0.42 + 0.08,
        phase: Math.random() * Math.PI * 2
      });
    }

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      const t = time * 0.001;

      for (const p of particles) {
        p.y += p.s;
        p.x += Math.sin(t * 0.7 + p.phase) * 0.25 + p.drift;

        if (p.y > height + 10) p.y = -10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(235,240,218,${p.alpha})`;
        ctx.fill();
      }

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  }

  function initCompareSlider() {
    const root = $("[data-compare]");
    const range = $(".compare-range", root);
    const handle = $("[data-compare-handle]", root);
    if (!root || !range || !handle) return;

    const setSplit = (value, animate = false) => {
      const split = `${value}%`;
      root.style.setProperty("--split", split);
      if (animate && window.gsap) {
        gsap.fromTo(handle, { scale: 0.85 }, { scale: 1, duration: 0.35, ease: "back.out(2)" });
      }
    };

    range.addEventListener("input", (e) => setSplit(Number(e.target.value)));

    const count = $("[data-slider-count]");
    const prev = $("[data-slider-prev]");
    const next = $("[data-slider-next]");
    const values = [26, 41, 50, 58, 66, 76];
    let index = 2;

    const updateIndex = (delta) => {
      index = (index + delta + values.length) % values.length;
      range.value = String(values[index]);
      setSplit(values[index], true);
      if (count) count.textContent = `${index + 1} / ${values.length}`;
    };

    prev?.addEventListener("click", () => updateIndex(-1));
    next?.addEventListener("click", () => updateIndex(1));

    let dragging = false;
    const pointerToValue = (event) => {
      const rect = root.getBoundingClientRect();
      return clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    };

    root.addEventListener("pointerdown", (event) => {
      dragging = true;
      root.setPointerCapture?.(event.pointerId);
      setSplit(pointerToValue(event));
    });

    root.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      setSplit(pointerToValue(event));
    });

    ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => {
      root.addEventListener(name, () => { dragging = false; });
    });
  }

  function initForm() {
    const form = $("[data-contact-form]");
    if (!form) return;

    const status = $(".form-status", form);

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const data = Object.fromEntries(new FormData(form));
      const name = String(data.name || "").trim();
      const phone = String(data.phone || "").trim();
      const service = String(data.service || "").trim();
      const consent = $('input[type="checkbox"]', form)?.checked;

      const normalizedPhone = phone.replace(/[^\d+]/g, "");
      if (name.length < 2) {
        status.textContent = "Укажите имя.";
        return;
      }
      if (normalizedPhone.replace("+", "").length < 10) {
        status.textContent = "Проверьте номер телефона.";
        return;
      }
      if (!service) {
        status.textContent = "Выберите услугу.";
        return;
      }
      if (!consent) {
        status.textContent = "Подтвердите согласие на обработку данных.";
        return;
      }

      status.textContent = "Спасибо! Заявка подготовлена. Мы свяжемся с вами в ближайшее время.";
      form.reset();

      if (window.gsap) {
        gsap.fromTo(status, { y: 6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: "power3.out" });
      }
    });
  }

  function initMagneticButtons() {
    if (!window.gsap || !window.matchMedia("(pointer:fine)").matches || state.reducedMotion) return;

    $$(".magnetic").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        gsap.to(button, {
          x: x * 0.12,
          y: y * 0.2,
          duration: 0.35,
          ease: "power3.out",
          overwrite: true
        });
      });

      button.addEventListener("pointerleave", () => {
        gsap.to(button, { x: 0, y: 0, duration: 0.65, ease: "elastic.out(1, 0.32)" });
      });
    });
  }

  function openMenu() {
    const wrapper = $("[data-mobile-menu]");
    const panel = $(".mobile-menu-panel", wrapper);
    const backdrop = $(".mobile-menu-backdrop", wrapper);
    const links = $$("[data-menu-link]", wrapper);
    const toggle = $("[data-menu-toggle]");

    if (!wrapper || !panel || !backdrop) return;
    state.menuOpen = true;
    document.body.classList.add("menu-open");
    wrapper.classList.add("is-open");
    wrapper.setAttribute("aria-hidden", "false");
    toggle?.classList.add("active");
    toggle?.setAttribute("aria-expanded", "true");

    if (window.gsap) {
      gsap.to(backdrop, { autoAlpha: 1, duration: 0.45, ease: "power2.out" });
      gsap.to(panel, { x: 0, duration: 0.75, ease: "power4.out" });
      gsap.fromTo(links, { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.065, delay: 0.18, ease: "power3.out"
      });
    } else {
      panel.style.transform = "translateX(0)";
      backdrop.style.opacity = "1";
    }
  }

  function closeMenu() {
    const wrapper = $("[data-mobile-menu]");
    const panel = $(".mobile-menu-panel", wrapper);
    const backdrop = $(".mobile-menu-backdrop", wrapper);
    const links = $$("[data-menu-link]", wrapper);
    const toggle = $("[data-menu-toggle]");
    if (!wrapper || !panel || !backdrop) return;

    state.menuOpen = false;
    document.body.classList.remove("menu-open");
    toggle?.classList.remove("active");
    toggle?.setAttribute("aria-expanded", "false");

    if (window.gsap) {
      gsap.to(links, { autoAlpha: 0, y: 14, duration: 0.22, stagger: 0.025, ease: "power2.in" });
      gsap.to(panel, {
        x: "100%",
        duration: 0.58,
        delay: 0.04,
        ease: "power3.inOut",
        onComplete: () => wrapper.classList.remove("is-open")
      });
      gsap.to(backdrop, { autoAlpha: 0, duration: 0.35, delay: 0.12, ease: "power2.in" });
    } else {
      wrapper.classList.remove("is-open");
      panel.style.transform = "translateX(100%)";
      backdrop.style.opacity = "0";
    }

    wrapper.setAttribute("aria-hidden", "true");
  }

  function initMenu() {
    $("[data-menu-toggle]")?.addEventListener("click", () => state.menuOpen ? closeMenu() : openMenu());
    $("[data-menu-close]")?.addEventListener("click", closeMenu);
    $(".mobile-menu-backdrop")?.addEventListener("click", closeMenu);
    $$("[data-menu-link]").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.menuOpen) closeMenu();
    });
  }

  function initScrollParallaxLayers() {
    if (!window.gsap || !window.ScrollTrigger || state.reducedMotion) return;

    gsap.utils.toArray(".services-intro, .reasons-heading, .contacts-copy").forEach((el) => {
      gsap.fromTo(el,
        { y: 35 },
        {
          y: -35,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });
  }

  function init() {
    initLoader();

    const boot = () => {
      initSmoothScroll();
      initHeader();
      initRevealAnimations();
      initHeroDepth();
      initGyro();
      initParticles();
      initCompareSlider();
      initForm();
      initMagneticButtons();
      initMenu();
      initScrollParallaxLayers();

      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };

    if (window.gsap && window.ScrollTrigger && window.Lenis) {
      boot();
      return;
    }

    const wait = window.setInterval(() => {
      if (window.gsap && window.ScrollTrigger && window.Lenis) {
        clearInterval(wait);
        boot();
      }
    }, 50);

    window.setTimeout(() => clearInterval(wait), 8000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
