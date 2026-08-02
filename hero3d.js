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

    // ---- stack mode: exploded engine-room cross-section ---------------------
    // Slabs are drawn from cases.json-derived layer data, so the dots are
    // information, not decoration. The canvas is aria-hidden; the real,
    // always-present truth is the sibling HTML layer list.
    var layers = [], polys = [], active = -1, rows = [], stackPackets = [];
    if (mode === "stack") {
      try { layers = JSON.parse(canvas.getAttribute("data-layers") || "[]"); }
      catch (e) { layers = []; }
      var host2 = canvas.parentElement;
      rows = host2 ? [].slice.call(host2.querySelectorAll("[data-layer-row]")) : [];
      for (var sp = 0; sp < 6; sp++) {
        stackPackets.push({
          x: (rnd(sp + 5) - 0.5) * 1.1,
          y: (rnd(sp + 41) - 0.5) * 1.1,
          pos: rnd(sp + 77),
          speed: 0.10 + rnd(sp + 13) * 0.10
        });
      }
    }

    function setActive(i) {
      if (i === active) return;
      active = i;
      for (var r = 0; r < rows.length; r++) {
        if (r === i) rows[r].setAttribute("data-on", "1");
        else rows[r].removeAttribute("data-on");
      }
    }

    function inQuad(q, x, y) {
      var sign = 0;
      for (var i = 0; i < 4; i++) {
        var a = q[i], b = q[(i + 1) % 4];
        var cr = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
        if (cr !== 0) {
          var s = cr > 0 ? 1 : -1;
          if (sign === 0) sign = s; else if (s !== sign) return false;
        }
      }
      return true;
    }

    function hitTest(x, y) {
      // index 0 is the highest slab and is drawn last, so it wins overlaps
      for (var i = 0; i < polys.length; i++) {
        if (polys[i] && inQuad(polys[i], x, y)) return i;
      }
      return -1;
    }

    if (mode === "stack") {
      var hostEl = canvas.parentElement;
      canvas.style.pointerEvents = "auto";
      canvas.addEventListener("mousemove", function (e) {
        var r = canvas.getBoundingClientRect();
        var hit = hitTest(e.clientX - r.left, e.clientY - r.top);
        canvas.style.cursor = hit >= 0 ? "pointer" : "default";
        if (hit >= 0) setActive(hit);
      }, { passive: true });
      canvas.addEventListener("mouseleave", function () { setActive(-1); }, { passive: true });
      canvas.addEventListener("click", function (e) {
        var r = canvas.getBoundingClientRect();
        var hit = hitTest(e.clientX - r.left, e.clientY - r.top);
        if (hit >= 0 && rows[hit]) {
          var a = rows[hit].tagName === "A" ? rows[hit] : rows[hit].querySelector("a");
          if (a) a.click();
        }
      });
      for (var rr = 0; rr < rows.length; rr++) {
        (function (idx) {
          rows[idx].addEventListener("mouseenter", function () { setActive(idx); }, { passive: true });
          rows[idx].addEventListener("focus", function () { setActive(idx); }, true);
        })(rr);
      }
      if (hostEl) hostEl.addEventListener("mouseleave", function () { setActive(-1); }, { passive: true });
    }

    function drawStack(t) {
      var n = layers.length;
      if (!n) return;
      var S = Math.min(W * 0.30, H * 0.36);
      var ux = S, uy = S * 0.46;
      var thick = Math.max(5, H * 0.022);
      var gap = Math.max(H * 0.075, (H * 0.84 - 2 * uy - thick) / Math.max(1, n - 1));
      var cx = W * 0.5;
      var cy = H * 0.5 + ((n - 1) * gap) / 2;
      var top = (n - 1) * gap;

      function iso(px2, py2, h, out) {
        out[0] = cx + (px2 - py2) * ux * 0.5;
        out[1] = cy + (px2 + py2) * uy * 0.5 - h;
      }

      // vertical spine, bottom to top
      var a1 = [0, 0], a2 = [0, 0];
      iso(0, 0, 0, a1); iso(0, 0, top, a2);
      ctx.strokeStyle = col.steel; ctx.globalAlpha = 0.16; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke();

      // data-layers is authored top-to-bottom (same order as the HTML list),
      // so index 0 sits highest. Draw bottom-first for correct overlap.
      polys = new Array(n);
      for (var i = n - 1; i >= 0; i--) {
        var lift = reduce ? 0 : Math.sin(t * 0.55 + i * 0.9) * gap * 0.07;
        var h = (n - 1 - i) * gap + lift;
        var on = (i === active);
        // higher slabs read as nearer, so they carry more weight
        var prom = n > 1 ? 1 - i / (n - 1) : 1;
        var q = [];
        var corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
        for (var c = 0; c < 4; c++) {
          var o = [0, 0];
          iso(corners[c][0], corners[c][1], h, o);
          q.push([o[0], o[1]]);
        }
        polys[i] = q;

        // slab thickness: side faces under the two front edges
        ctx.beginPath();
        ctx.moveTo(q[1][0], q[1][1]);
        ctx.lineTo(q[2][0], q[2][1]);
        ctx.lineTo(q[3][0], q[3][1]);
        ctx.lineTo(q[3][0], q[3][1] + thick);
        ctx.lineTo(q[2][0], q[2][1] + thick);
        ctx.lineTo(q[1][0], q[1][1] + thick);
        ctx.closePath();
        ctx.fillStyle = on ? col.signal : col.steel;
        ctx.globalAlpha = on ? 0.24 : 0.10 + 0.09 * prom;
        ctx.fill();

        // top face
        ctx.beginPath();
        ctx.moveTo(q[0][0], q[0][1]);
        for (var e2 = 1; e2 < 4; e2++) ctx.lineTo(q[e2][0], q[e2][1]);
        ctx.closePath();
        ctx.fillStyle = on ? col.signal : col.steel;
        ctx.globalAlpha = on ? 0.18 : 0.05 + 0.05 * prom;
        ctx.fill();
        ctx.strokeStyle = on ? col.signal : col.steel;
        ctx.globalAlpha = on ? 0.9 : 0.34 + 0.3 * prom;
        ctx.lineWidth = on ? 2 : 1.15;
        ctx.stroke();

        // one dot per case in this family
        var cnt = Math.max(0, layers[i].n | 0);
        if (cnt) {
          var cols2 = Math.ceil(Math.sqrt(cnt));
          var rows2 = Math.ceil(cnt / cols2);
          for (var k = 0; k < cnt; k++) {
            var gxk = ((k % cols2) + 0.5) / cols2 * 1.2 - 0.6;
            var gyk = (Math.floor(k / cols2) + 0.5) / rows2 * 1.2 - 0.6;
            var dp = [0, 0];
            iso(gxk, gyk, h, dp);
            ctx.beginPath();
            ctx.arc(dp[0], dp[1], on ? 3.3 : 2.6, 0, Math.PI * 2);
            ctx.fillStyle = on ? col.signal : col.steel;
            ctx.globalAlpha = on ? 1 : 0.55 + 0.3 * prom;
            ctx.fill();
          }
        }
      }

      // packets rising from infrastructure to judgement
      if (!reduce) {
        for (var m = 0; m < stackPackets.length; m++) {
          var pk2 = stackPackets[m];
          pk2.pos += pk2.speed / 60;
          if (pk2.pos > 1) {
            pk2.pos = 0;
            pk2.x = (rnd(t + m) - 0.5) * 1.1;
            pk2.y = (rnd(t + m + 7) - 0.5) * 1.1;
          }
          var ph = [0, 0];
          iso(pk2.x, pk2.y, pk2.pos * top, ph);
          ctx.beginPath(); ctx.arc(ph[0], ph[1], 2.4, 0, Math.PI * 2);
          ctx.fillStyle = col.signal; ctx.globalAlpha = 0.9 * (1 - Math.abs(pk2.pos - 0.5) * 0.7);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      if (mode === "stack") {
        drawStack(t);
      } else if (mode === "wave") {
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
