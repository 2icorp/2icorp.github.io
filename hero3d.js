// 2i hero - 3D motion engine (no deps). Three modes on one projection core:
//   wave   - signal surface with roaming + pointer-driven radio pulses (home, telecom)
//   nodes  - floating cluster lattice with data packets traveling the links (cloud)
//   market - scrolling price terrain, front series highlighted (finance)
// Theme-aware via CSS tokens, reduced-motion safe, pauses offscreen, DPR capped.
(function () {
  "use strict";
  var canvases = document.querySelectorAll("canvas.hero3d");
  if (!canvases.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  var col = { steel: "#5b7a99", signal: "#e08a2b" };
  function readTokens() {
    var s = getComputedStyle(document.documentElement);
    var steel = s.getPropertyValue("--steel-soft").trim();
    var signal = s.getPropertyValue("--signal").trim();
    if (steel) col.steel = steel;
    if (signal) col.signal = signal;
  }
  readTokens();

  function frac(n) { return n - Math.floor(n); }
  function rnd(n) { return frac(Math.sin(n * 127.1 + 311.7) * 43758.5453); }

  function makeScene(canvas) {
    if (!canvas.getContext) return null;
    var ctx = canvas.getContext("2d");
    var mode = canvas.getAttribute("data-mode") || "wave";
    var W = 0, H = 0;
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.max(1, W * dpr);
      canvas.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize, { passive: true });
    resize();

    var mx = 0.62, my = 0.4;
    if (finePointer) {
      var host = canvas.parentElement;
      host.addEventListener("mousemove", function (e) {
        var r = host.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width;
        my = (e.clientY - r.top) / r.height;
      }, { passive: true });
    }

    var COLS = mode === "nodes" ? 26 : 60;
    var ROWS = mode === "nodes" ? 14 : 28;
    var p = [0, 0, 0];

    function project(x, y, z, out) {
      var camZ = 3.3;
      var s = camZ / (camZ + y + 1.7);
      out[0] = W * 0.52 + x * (W * 0.205) * s;
      out[1] = H * 0.54 + (1.02 - z * 0.56) * (H * 0.36) * s - y * (H * 0.12) * s;
      out[2] = s;
    }

    function zWave(x, y, t) {
      var z = Math.sin(x * 1.6 + t * 0.8) * 0.32 + Math.cos(y * 2.1 - t * 0.6) * 0.22;
      var px = Math.sin(t * 0.33) * 1.5, py = Math.cos(t * 0.21) * 0.7;
      var d1 = Math.hypot(x - px, y - py);
      z += Math.sin(d1 * 3.1 - t * 2.1) * 0.5 * Math.exp(-d1 * 0.85);
      var qx = (mx - 0.5) * 3.4, qy = (my - 0.5) * 1.8;
      var d2 = Math.hypot(x - qx, y - qy);
      z += Math.sin(d2 * 3.8 - t * 2.8) * 0.34 * Math.exp(-d2 * 1.1);
      return z;
    }

    function zNodes(x, y, t) {
      return Math.sin(x * 1.1 + t * 0.5) * 0.16 + Math.cos(y * 1.6 - t * 0.4) * 0.13 +
             Math.sin((x + y) * 0.9 + t * 0.3) * 0.08;
    }

    // market: per-column random walk, scrolling toward the viewer over time
    function zMarket(i, j, t) {
      var shift = t * 1.6;
      var n = i * 0.55 + j * 1.7 + shift;
      var base = Math.floor(n);
      var f = frac(n); f = f * f * (3 - 2 * f);
      function level(k) {
        return (rnd(k) - 0.5) * 0.9 + Math.sin(k * 0.23) * 0.35;
      }
      var z = level(base) * (1 - f) + level(base + 1) * f;
      z += Math.sin(i * 0.35 + t * 0.7) * 0.06;
      return z;
    }

    // packets for nodes mode: travel along rows/cols of the lattice
    var packets = [];
    if (mode === "nodes") {
      for (var k = 0; k < 7; k++) {
        packets.push({ axis: k % 2, idx: Math.floor(rnd(k + 1) * (k % 2 ? COLS : ROWS)), pos: rnd(k + 9), speed: 0.05 + rnd(k + 33) * 0.1 });
      }
    }

    function gx(i) { return -2.7 + 5.4 * i / (COLS - 1); }
    function gy(j) { return -1.4 + 2.8 * j / (ROWS - 1); }

    function drawWaveLike(t, zf, accentEvery, frontHot) {
      for (var j = 0; j < ROWS; j++) {
        var y = gy(j), depth = j / (ROWS - 1);
        ctx.beginPath();
        for (var i = 0; i < COLS; i++) {
          var x = gx(i);
          project(x, y, zf(x, y, i, j, t), p);
          if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
        }
        var accent = (j % accentEvery === 0) || (frontHot && j === ROWS - 1);
        ctx.strokeStyle = accent ? col.signal : col.steel;
        ctx.lineWidth = (frontHot && j === ROWS - 1) ? 1.8 : 1;
        ctx.globalAlpha = accent ? 0.10 + 0.32 * depth : 0.06 + 0.26 * depth;
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      if (mode === "wave") {
        drawWaveLike(t, function (x, y, i, j, tt) { return zWave(x, y, tt); }, 6, false);
        var px = Math.sin(t * 0.33) * 1.5, py = Math.cos(t * 0.21) * 0.7;
        project(px, py, zWave(px, py, t) + 0.06, p);
        ctx.globalAlpha = 0.85; ctx.fillStyle = col.signal;
        ctx.beginPath(); ctx.arc(p[0], p[1], 2.6 * p[2], 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.22; ctx.strokeStyle = col.signal;
        ctx.beginPath(); ctx.arc(p[0], p[1], (7 + 3 * Math.sin(t * 3)) * p[2], 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (mode === "market") {
        drawWaveLike(t, function (x, y, i, j, tt) { return zMarket(i, j, tt); }, 5, true);
      } else if (mode === "nodes") {
        // faint lattice
        ctx.lineWidth = 1;
        for (var j = 0; j < ROWS; j++) {
          var y = gy(j), depth = j / (ROWS - 1);
          ctx.beginPath();
          for (var i = 0; i < COLS; i++) {
            project(gx(i), y, zNodes(gx(i), y, t), p);
            if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
          }
          ctx.strokeStyle = col.steel; ctx.globalAlpha = 0.05 + 0.14 * depth; ctx.stroke();
        }
        for (var i2 = 0; i2 < COLS; i2 += 2) {
          ctx.beginPath();
          for (var j2 = 0; j2 < ROWS; j2++) {
            project(gx(i2), gy(j2), zNodes(gx(i2), gy(j2), t), p);
            if (j2 === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
          }
          ctx.strokeStyle = col.steel; ctx.globalAlpha = 0.07; ctx.stroke();
        }
        // nodes
        for (var j3 = 0; j3 < ROWS; j3++) {
          for (var i3 = 0; i3 < COLS; i3 += 2) {
            var d3 = j3 / (ROWS - 1);
            project(gx(i3), gy(j3), zNodes(gx(i3), gy(j3), t), p);
            ctx.globalAlpha = 0.10 + 0.3 * d3;
            ctx.fillStyle = col.steel;
            ctx.beginPath(); ctx.arc(p[0], p[1], 1.1 * p[2], 0, Math.PI * 2); ctx.fill();
          }
        }
        // packets traveling the lattice
        for (var k2 = 0; k2 < packets.length; k2++) {
          var pk = packets[k2];
          pk.pos += pk.speed / 60;
          if (pk.pos > 1) { pk.pos = 0; pk.idx = Math.floor(rnd(t + k2) * (pk.axis ? COLS : ROWS)); }
          var xx, yy;
          if (pk.axis) { xx = gx(pk.idx % COLS); yy = gy(0) + 2.8 * pk.pos; }
          else { xx = gx(0) + 5.4 * pk.pos; yy = gy(pk.idx % ROWS); }
          project(xx, yy, zNodes(xx, yy, t) + 0.05, p);
          ctx.globalAlpha = 0.9; ctx.fillStyle = col.signal;
          ctx.beginPath(); ctx.arc(p[0], p[1], 2.2 * p[2], 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 0.18; ctx.strokeStyle = col.signal;
          ctx.beginPath(); ctx.arc(p[0], p[1], 6 * p[2], 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }

    return { canvas: canvas, draw: draw, resize: resize };
  }

  var scenes = [];
  canvases.forEach(function (c) { var s = makeScene(c); if (s) scenes.push(s); });
  if (!scenes.length) return;

  new MutationObserver(function () {
    readTokens();
    if (reduce) scenes.forEach(function (s) { s.draw(6.0); });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  if (reduce) { scenes.forEach(function (s) { s.draw(6.0); }); return; }

  var visible = new WeakMap();
  scenes.forEach(function (s) { visible.set(s.canvas, true); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible.set(e.target, e.isIntersecting); });
    }, { threshold: 0.02 });
    scenes.forEach(function (s) { io.observe(s.canvas); });
  }

  var t0 = null;
  function loop(now) {
    if (t0 === null) t0 = now;
    if (!document.hidden) {
      var t = (now - t0) / 1000;
      scenes.forEach(function (s) { if (visible.get(s.canvas)) s.draw(t); });
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
