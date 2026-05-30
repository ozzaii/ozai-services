/* ============================================================
   OZAI storefront — motion + generative always-on agent field
   Vanilla, dependency-free, reduced-motion aware.
   ============================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- scroll progress bar ---- */
  var bar = document.querySelector(".progress");
  if (bar) {
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        var p = max > 0 ? h.scrollTop / max : 0;
        bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---- reveal + stagger on scroll ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal, .stagger").forEach(function (el) { io.observe(el); });

  /* ---- custom cursor (fine pointers) ---- */
  if (!reduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var cur = document.querySelector(".cursor");
    if (cur) {
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy, shown = false;
      window.addEventListener("mousemove", function (ev) {
        tx = ev.clientX; ty = ev.clientY;
        if (!shown) { cur.style.opacity = "1"; shown = true; }
      });
      window.addEventListener("mousedown", function () { cur.classList.add("is-down"); });
      window.addEventListener("mouseup", function () { cur.classList.remove("is-down"); });
      document.addEventListener("mouseover", function (ev) {
        var t = ev.target.closest("a, button, .sku, .channel, .price-row:not(.price-head)");
        cur.classList.toggle("is-active", !!t);
      });
      (function loop() {
        cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
        cur.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
        requestAnimationFrame(loop);
      })();
    }
  }

  /* ---- generative "always-on" agent field (hero canvas) ---- */
  var canvas = document.querySelector(".hero-canvas");
  if (canvas && !reduced) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, nodes = [], raf = null, running = true;
    var TERRA = "184,72,42";
    var COUNT, LINK = 132;

    function resize() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      COUNT = Math.max(26, Math.min(64, Math.round(w * h / 16000)));
      seed();
    }
    function seed() {
      nodes = [];
      for (var i = 0; i < COUNT; i++) {
        nodes.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.6 + 0.7, pulse: Math.random() * Math.PI * 2
        });
      }
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        a.x += a.vx; a.y += a.vy; a.pulse += 0.02;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = "rgba(" + TERRA + "," + (0.12 * (1 - d / LINK)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (var k = 0; k < nodes.length; k++) {
        var n = nodes[k], glow = 0.45 + Math.sin(n.pulse) * 0.28;
        ctx.fillStyle = "rgba(" + TERRA + "," + glow.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } }

    var ro = new ResizeObserver(function () { resize(); });
    ro.observe(canvas);
    var vis = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) start(); else stop();
    }, { threshold: 0 });
    vis.observe(canvas);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
    resize(); start();
  }
})();
