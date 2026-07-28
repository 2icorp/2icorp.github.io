// 2i hero - 3D signal surface (no deps). Perspective wireframe wave with
// traveling radio pulses. Theme-aware, reduced-motion safe, pauses offscreen.
(function () {
  "use strict";
  var canvas = document.getElementById("hero3d");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.max(1, W * dpr);
    canvas.height = Math.max(1, H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize, { passive: true });

  // palette from CSS tokens; refreshed on theme change
  var col = { steel: "#5b7a99", signal: "#e08a2b" };
  function readTokens() {
    var s = getComputedStyle(document.documentElement);
    var steel = s.getPropertyValue("--steel-soft").trim();
    var signal = s.getPropertyValue("--signal").trim();
    if (steel) col.steel = steel;
    if (signal) col.signal = signal;
  }
  readTokens();
  new MutationObserver(function () { readTokens(); if (reduce) drawFrame(6.0); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // mouse parallax (fine pointers only)
  var mx = 0.62, my = 0.4;
  if (window.matchMedia("(pointer: fine)").matches) {
    var hero = canvas.closest(".hero") || canvas.parentElement;
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width;
      my = (e.clientY - r.top) / r.height;
    }, { passive: true });
  }

  var COLS = 60, ROWS = 28;

  function zval(x, y, t) {
    var z = Math.sin(x * 1.6 + t * 0.8) * 0.32 + Math.cos(y * 2.1 - t * 0.6) * 0.22;
    // roaming pulse
    var px = Math.sin(t * 0.33) * 1.5, py = Math.cos(t * 0.21) * 0.7;
    var d1 = Math.hypot(x - px, y - py);
    z += Math.sin(d1 * 3.1 - t * 2.1) * 0.5 * Math.exp(-d1 * 0.85);
    // pointer-driven pulse
    var qx = (mx - 0.5) * 3.4, qy = (my - 0.5) * 1.8;
    var d2 = Math.hypot(x - qx, y - qy);
    z += Math.sin(d2 * 3.8 - t * 2.8) * 0.34 * Math.exp(-d2 * 1.1);
    return z;
  }

  function project(x, y, z, out) {
    var camZ = 3.3;
    var s = camZ / (camZ + y + 1.7);
    out[0] = W * 0.52 + x * (W * 0.205) * s;
    out[1] = H * 0.54 + (1.02 - z * 0.56) * (H * 0.36) * s - y * (H * 0.12) * s;
    out[2] = s;
  }

  var p = [0, 0, 0];
  function drawFrame(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    for (var j = 0; j < ROWS; j++) {
      var y = -1.4 + 2.8 * j / (ROWS - 1);
      var depth = j / (ROWS - 1);
      ctx.beginPath();
      for (var i = 0; i < COLS; i++) {
        var x = -2.7 + 5.4 * i / (COLS - 1);
        project(x, y, zval(x, y, t), p);
        if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      }
      var accent = (j % 6 === 0);
      ctx.strokeStyle = accent ? col.signal : col.steel;
      ctx.globalAlpha = accent ? 0.10 + 0.30 * depth : 0.06 + 0.26 * depth;
      ctx.stroke();
    }
    // crest markers on the roaming pulse
    var px = Math.sin(t * 0.33) * 1.5, py = Math.cos(t * 0.21) * 0.7;
    project(px, py, zval(px, py, t) + 0.06, p);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = col.signal;
    ctx.beginPath();
    ctx.arc(p[0], p[1], 2.6 * p[2], 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(p[0], p[1], (7 + 3 * Math.sin(t * 3)) * p[2], 0, Math.PI * 2);
    ctx.strokeStyle = col.signal;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  resize();
  if (reduce) { drawFrame(6.0); return; }

  var running = true, visible = true, t0 = null;
  function loop(now) {
    if (t0 === null) t0 = now;
    if (visible && !document.hidden) drawFrame((now - t0) / 1000);
    if (running) requestAnimationFrame(loop);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }, { threshold: 0.02 }).observe(canvas);
  }
  requestAnimationFrame(loop);
})();
