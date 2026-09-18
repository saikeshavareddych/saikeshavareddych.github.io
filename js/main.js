/* =========================================================================
   Site behaviour: nav, diagram mounting, counters, skill meters, lightbox,
   case-study scrollspy, hero topology.
   Everything expensive is gated on visibility and on prefers-reduced-motion.
   ========================================================================= */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  /* --- Nav ------------------------------------------------------------- */
  (function nav() {
    var bar = document.querySelector(".nav");
    var toggle = document.querySelector(".nav-toggle");
    var list = document.querySelector(".nav-list");
    if (!bar) return;

    if (toggle && list) {
      var setOpen = function (open) {
        list.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
      };
      toggle.addEventListener("click", function () {
        setOpen(toggle.getAttribute("aria-expanded") !== "true");
      });
      list.addEventListener("click", function (e) {
        if (e.target.closest("a")) setOpen(false);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") setOpen(false);
      });
      document.addEventListener("click", function (e) {
        if (!list.classList.contains("is-open")) return;
        if (!list.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
      });
    }

    var tick = false;
    window.addEventListener("scroll", function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        bar.classList.toggle("is-scrolled", window.scrollY > 8);
        tick = false;
      });
    }, { passive: true });
  })();

  /* --- Diagrams -------------------------------------------------------- */
  (function diagrams() {
    var slots = document.querySelectorAll("[data-diagram]");
    if (!slots.length || !window.DIAGRAMS) return;

    slots.forEach(function (slot) {
      var make = window.DIAGRAMS[slot.dataset.diagram];
      if (!make) return;
      slot.innerHTML = make();
    });

    /* Flow animation runs only while the diagram is on screen */
    if (reduced || !("IntersectionObserver" in window)) {
      slots.forEach(function (s) { if (!reduced) s.classList.add("is-live"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle("is-live", en.isIntersecting);
      });
    }, { rootMargin: "80px" });
    slots.forEach(function (s) { io.observe(s); });
  })();

  /* --- Entrance: a single reveal per major section, not per element ----- */
  (function entrance() {
    var items = document.querySelectorAll("[data-enter]");
    if (!items.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* --- Count-up metrics ------------------------------------------------ */
  (function counters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;

    function run(el) {
      var to = parseFloat(el.dataset.count);
      var dp = (el.dataset.count.split(".")[1] || "").length;
      var pre = el.dataset.prefix || "";
      var suf = el.dataset.suffix || "";
      if (reduced) { el.textContent = pre + to.toFixed(dp) + suf; return; }
      var t0 = performance.now();
      var dur = 1100;
      (function step(now) {
        var p = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + (to * eased).toFixed(dp) + suf;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }

    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* --- Skill meters ---------------------------------------------------- */
  (function skills() {
    var fills = document.querySelectorAll(".skill__fill");
    if (!fills.length) return;
    function fill(el) { el.style.width = (el.dataset.level || 0) + "%"; }
    if (!("IntersectionObserver" in window)) { fills.forEach(fill); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        setTimeout(function () { fill(el); }, reduced ? 0 : Math.random() * 220);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    fills.forEach(function (el) { io.observe(el); });
  })();

  /* --- Diagram lightbox ------------------------------------------------ */
  (function lightbox() {
    var box = document.getElementById("lightbox");
    if (!box) return;
    var inner = box.querySelector(".lightbox__inner");
    var closeBtn = box.querySelector(".lightbox__close");
    var lastFocus = null;

    function open(html, labelText) {
      lastFocus = document.activeElement;
      inner.innerHTML = html;
      box.classList.add("is-open");
      box.setAttribute("aria-label", labelText || "Diagram, enlarged");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }
    function close() {
      box.classList.remove("is-open");
      inner.innerHTML = "";
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }

    document.querySelectorAll("[data-zoom]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(btn.dataset.zoom);
        if (!target) return;
        open(target.innerHTML, btn.dataset.zoomLabel);
        inner.classList.add("diagram", "is-live");
      });
    });

    closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && box.classList.contains("is-open")) close();
    });
  })();

  /* --- Case-study rail scrollspy --------------------------------------- */
  (function rail() {
    var links = document.querySelectorAll(".case-rail a");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var map = {};
    var targets = [];
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var el = document.getElementById(id);
      if (!el) return;
      map[id] = a;
      targets.push(el);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-active"); });
        var a = map[en.target.id];
        if (a) a.classList.add("is-active");
      });
    }, { rootMargin: "-20% 0px -70%" });

    targets.forEach(function (t) { io.observe(t); });
  })();

  /* --- Hero topology --------------------------------------------------- */
  (function topology() {
    var cv = document.getElementById("topology");
    if (!cv || reduced || coarse) return;

    var ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var nodes = [];
    var edges = [];
    var packets = [];
    var raf = null;
    var visible = true;

    /* A small pipeline graph: sources on the left, a spine, sinks right. */
    var LAYOUT = [
      [0.10, 0.22], [0.10, 0.50], [0.10, 0.78],
      [0.30, 0.36], [0.30, 0.64],
      [0.52, 0.50],
      [0.74, 0.28], [0.74, 0.50], [0.74, 0.72],
      [0.92, 0.39], [0.92, 0.61]
    ];
    var WIRES = [
      [0, 3], [1, 3], [1, 4], [2, 4],
      [3, 5], [4, 5],
      [5, 6], [5, 7], [5, 8],
      [6, 9], [7, 9], [7, 10], [8, 10]
    ];

    function size() {
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = LAYOUT.map(function (p) {
        return { x: p[0] * W, y: p[1] * H };
      });
      edges = WIRES.map(function (w) { return { a: nodes[w[0]], b: nodes[w[1]] }; });
    }

    function spawn() {
      var e = edges[Math.floor(Math.random() * edges.length)];
      packets.push({ e: e, t: 0, v: 0.0035 + Math.random() * 0.004 });
    }

    var last = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      if (now - last < 32) return;   /* ~30fps is plenty for a backdrop */
      last = now;

      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = "rgba(43, 58, 92, 0.75)";
      ctx.lineWidth = 1;
      edges.forEach(function (e) {
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.stroke();
      });

      ctx.fillStyle = "rgba(108, 127, 158, 0.9)";
      nodes.forEach(function (n) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      for (var i = packets.length - 1; i >= 0; i--) {
        var p = packets[i];
        p.t += p.v;
        if (p.t >= 1) { packets.splice(i, 1); continue; }
        var x = p.e.a.x + (p.e.b.x - p.e.a.x) * p.t;
        var y = p.e.a.y + (p.e.b.y - p.e.a.y) * p.t;
        var a = Math.sin(p.t * Math.PI);
        ctx.fillStyle = "rgba(69, 208, 232, " + (a * 0.95).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (packets.length < 16 && Math.random() < 0.28) spawn();
    }

    size();
    window.addEventListener("resize", function () {
      clearTimeout(cv._t);
      cv._t = setTimeout(size, 150);
    });

    document.addEventListener("visibilitychange", function () {
      visible = !document.hidden;
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting && !document.hidden;
      }).observe(cv);
    }

    raf = requestAnimationFrame(frame);
  })();

  /* --- Current year ---------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
