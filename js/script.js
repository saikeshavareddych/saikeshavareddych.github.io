const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.innerWidth <= 640;

/* ---------------------------------------------
   Mobile nav toggle
--------------------------------------------- */
(function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  const navbar = document.querySelector(".navbar");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  links.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", e => {
    if (!links.classList.contains("open")) return;
    if (!links.contains(e.target) && !toggle.contains(e.target)) {
      links.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  if (navbar) {
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 10);
    }, { passive: true });
  }
})();

/* ---------------------------------------------
   Terminal boot sequence (hero)
--------------------------------------------- */
(function initBootSequence() {
  const el = document.getElementById("boot-sequence");
  if (!el) return;

  const lines = JSON.parse(el.dataset.lines || "[]");
  let lineIndex = 0;

  function typeLine() {
    if (lineIndex >= lines.length) return;
    const { text, cls } = lines[lineIndex];
    const lineEl = document.createElement("div");
    lineEl.className = "line";
    el.appendChild(lineEl);

    let i = 0;
    const speed = prefersReducedMotion ? 0 : 18;

    function typeChar() {
      if (i < text.length) {
        lineEl.textContent = text.slice(0, i + 1);
        i++;
        setTimeout(typeChar, speed);
      } else {
        if (cls) lineEl.classList.add(cls);
        lineIndex++;
        setTimeout(typeLine, prefersReducedMotion ? 0 : 220);
      }
    }
    typeChar();
  }

  typeLine();
})();

/* ---------------------------------------------
   Matrix rain canvas (hero background)
--------------------------------------------- */
(function initMatrixRain() {
  const canvas = document.getElementById("matrix-canvas");
  if (!canvas || isMobile || prefersReducedMotion) return;

  const ctx = canvas.getContext("2d");
  let width, height, columns, drops;
  const chars = "01アイウエオカキクケコ$#DEVOPS<>/";
  const fontSize = 15;

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
    columns = Math.floor(width / fontSize);
    drops = new Array(columns).fill(1);
  }

  resize();
  window.addEventListener("resize", resize);

  function draw() {
    ctx.fillStyle = "rgba(2, 6, 23, 0.08)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#22ff88";
    ctx.font = `${fontSize}px monospace`;

    drops.forEach((y, x) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, x * fontSize, y * fontSize);
      if (y * fontSize > height && Math.random() > 0.975) {
        drops[x] = 0;
      }
      drops[x]++;
    });

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
})();

/* ---------------------------------------------
   Count-up metrics
--------------------------------------------- */
(function initCounters() {
  const counters = document.querySelectorAll("[data-count-to]");
  if (!counters.length) return;

  const animate = el => {
    const to = parseFloat(el.dataset.countTo);
    const suffix = el.dataset.suffix || "";
    const decimals = el.dataset.countTo.includes(".") ? 1 : 0;
    const duration = prefersReducedMotion ? 0 : 1400;
    const start = performance.now();

    function step(now) {
      const progress = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      const value = to * progress;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach(el => observer.observe(el));
})();

/* ---------------------------------------------
   Glitch-on-scroll for headings
--------------------------------------------- */
(function initGlitch() {
  const targets = document.querySelectorAll(".glitch");
  if (!targets.length || prefersReducedMotion) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("glitching");
        setTimeout(() => entry.target.classList.remove("glitching"), 800);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  targets.forEach(el => observer.observe(el));
})();

/* ---------------------------------------------
   GSAP scroll reveals + parallax (falls back to
   plain IntersectionObserver reveal if GSAP failed
   to load from CDN)
--------------------------------------------- */
(function initScrollAnimations() {
  const revealTargets = document.querySelectorAll("[data-reveal]");

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    revealTargets.forEach((el, i) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        delay: prefersReducedMotion ? 0 : (i % 6) * 0.06,
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true,
        },
      });
    });

    const parallaxImg = document.querySelector("[data-parallax]");
    if (parallaxImg && !isMobile && !prefersReducedMotion) {
      gsap.to(parallaxImg, {
        y: -40,
        ease: "none",
        scrollTrigger: {
          trigger: parallaxImg,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  } else {
    document.documentElement.classList.add("reveal-fallback");
  }
})();

/* ---------------------------------------------
   Lightbox for architecture diagrams
--------------------------------------------- */
(function initLightbox() {
  const images = document.querySelectorAll("[data-lightbox]");
  const lightbox = document.getElementById("lightbox");
  if (!images.length || !lightbox) return;

  const img = lightbox.querySelector("img");
  const closeBtn = lightbox.querySelector(".lightbox-close");

  function open(src, alt) {
    img.src = src;
    img.alt = alt;
    lightbox.classList.add("open");
  }

  function close() {
    lightbox.classList.remove("open");
    img.src = "";
  }

  images.forEach(el => {
    el.addEventListener("click", () => open(el.src, el.alt));
  });

  closeBtn.addEventListener("click", close);
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) close();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") close();
  });
})();

console.log("🚀 Portfolio loaded");
