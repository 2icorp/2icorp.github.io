// 2i landing - progressive enhancement, no deps. Compositor-only motion, reduced-motion safe.
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  // Hero process-gauge load animation
  var hero = document.querySelector(".hero");
  if (hero) {
    if (reduce) hero.classList.add("loaded");
    else requestAnimationFrame(function () {
      setTimeout(function () { hero.classList.add("loaded"); }, 120);
    });
  }

  // Scroll-progress gauge (on-brand). rAF-throttled, transform-free width on a 2px bar.
  (function () {
    if (reduce) return;
    var g = document.createElement("div");
    g.className = "scrollgauge";
    g.setAttribute("aria-hidden", "true");
    var fill = document.createElement("i");
    fill.className = "scrollgauge__fill";
    g.appendChild(fill);
    document.body.appendChild(g);
    var ticking = false;
    function set() {
      var st = window.pageYOffset || document.documentElement.scrollTop;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.width = (h > 0 ? (st / h) * 100 : 0) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(set); }
    }, { passive: true });
    set();
  })();

  // Seamless ticker: clone the track's children once so translateX(-50%) loops perfectly.
  document.querySelectorAll(".ticker__track").forEach(function (track) {
    var html = track.innerHTML;
    track.innerHTML = html + html;
  });

  // Reveal + in-view (reveal fade, gates3 sequence, case before→after pop)
  var revealEls = document.querySelectorAll(".reveal");
  var inviewEls = document.querySelectorAll(".gates3");
  if (reduce || !hasIO) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
    inviewEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    inviewEls.forEach(function (el) { io.observe(el); });
  }

  // Count-up numbers when they enter view ([data-count] with optional data-format="comma")
  (function () {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length) return;
    function fmt(n, comma) {
      return comma ? Math.round(n).toLocaleString("en-US") : String(Math.round(n));
    }
    function run(el) {
      var target = parseFloat(el.getAttribute("data-count")) || 0;
      var comma = el.getAttribute("data-format") === "comma";
      if (reduce) { el.textContent = fmt(target, comma); return; }
      var start = null, dur = 1400;
      function tick(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased, comma);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if (!hasIO) { nums.forEach(run); return; }
    var nio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); nio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { nio.observe(el); });
  })();

  // Magnetic pull on the hero primary CTA (fine-pointer only)
  (function () {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    var btn = document.querySelector(".hero__cta .btn--signal");
    if (!btn) return;
    var raf = null, tx = 0, ty = 0;
    btn.addEventListener("mousemove", function (ev) {
      var r = btn.getBoundingClientRect();
      tx = (ev.clientX - (r.left + r.width / 2)) * 0.18;
      ty = (ev.clientY - (r.top + r.height / 2)) * 0.28;
      if (!raf) raf = requestAnimationFrame(function () {
        btn.style.transform = "translate(" + tx + "px," + ty + "px)";
        raf = null;
      });
    });
    btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
  })();

  // Self-diagnosis meter
  var form = document.getElementById("diagForm");
  if (form) {
    var scoreEl = document.getElementById("score");
    var barEl = document.getElementById("meterBar");
    var bandEl = document.getElementById("band");
    var hintEl = document.getElementById("hint");
    var inputs = form.querySelectorAll("input[type=checkbox]");

    var BANDS = [
      { min: 0,  name: "먼저 대화가 필요합니다", hint: "지금은 무엇이 문제인지부터 함께 정리하는 게 좋습니다. 무료 상담으로 시작하세요." },
      { min: 35, name: "기초 단계", hint: "가능성이 보입니다. 진단 스프린트로 우선 과제와 ROI를 확인해 보세요." },
      { min: 65, name: "도약 준비", hint: "지금 시작하기 좋은 상태입니다. PoC로 될 것만 골라 빠르게 검증하세요." },
      { min: 85, name: "즉시 착수 권장", hint: "준비가 충분합니다. 바우처 연계까지 얹으면 부담 없이 시작할 수 있습니다." }
    ];

    function pickBand(v) {
      var b = BANDS[0];
      for (var i = 0; i < BANDS.length; i++) if (v >= BANDS[i].min) b = BANDS[i];
      return b;
    }

    function update() {
      var total = 0;
      inputs.forEach(function (i) { if (i.checked) total += parseInt(i.getAttribute("data-w"), 10) || 0; });
      if (total > 100) total = 100;
      var b = pickBand(total);
      var cur = parseInt(scoreEl.textContent, 10) || 0;
      var step = total > cur ? 1 : -1;
      clearInterval(scoreEl._t);
      scoreEl._t = setInterval(function () {
        cur += step;
        scoreEl.textContent = cur;
        if (cur === total) clearInterval(scoreEl._t);
      }, 14);
      barEl.style.width = total + "%";
      bandEl.textContent = b.name;
      hintEl.textContent = b.hint;
    }
    inputs.forEach(function (i) { i.addEventListener("change", update); });
  }
})();

// Mobile nav burger (guarded; runs on every page with the burger button)
(function () {
  "use strict";
  var nav = document.querySelector(".nav");
  var burger = document.querySelector(".nav__burger");
  if (!nav || !burger) return;
  function close() {
    nav.classList.remove("nav--open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "메뉴 열기");
  }
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("nav--open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  });
  nav.querySelectorAll(".nav__links a").forEach(function (a) {
    a.addEventListener("click", close);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("nav--open")) { close(); burger.focus(); }
  });
})();

// AX ideas board - category filter (guarded; only runs on index.html)
(function () {
  "use strict";
  var chips = document.querySelectorAll(".ifilter");
  if (!chips.length) return;
  var items = document.querySelectorAll(".idea");
  chips.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.getAttribute("data-icat");
      chips.forEach(function (b) { b.classList.toggle("is-on", b === btn); });
      items.forEach(function (it) {
        it.classList.toggle("is-hidden", cat !== "all" && it.getAttribute("data-icat") !== cat);
      });
    });
  });
})();

// Papers board - category filter (guarded; only runs on papers.html)
(function () {
  "use strict";
  var filters = document.querySelectorAll(".pfilter");
  if (!filters.length) return;
  var cards = document.querySelectorAll(".pcard");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.getAttribute("data-cat");
      filters.forEach(function (b) { b.classList.toggle("is-on", b === btn); });
      cards.forEach(function (c) {
        var show = cat === "all" || c.getAttribute("data-cat") === cat;
        c.classList.toggle("is-hidden", !show);
      });
    });
  });
})();

// Lead form -> clean mailto (works with no backend; footer/about also list the address)
(function () {
  "use strict";
  var form = document.getElementById("leadForm");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var g = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ""; };
    var subject = "[2i 상담 신청] " + (g("company") || "문의");
    var body = [
      "이름: " + g("name"),
      "회사: " + g("company"),
      "업종: " + g("industry"),
      "연락처: " + g("contact"),
      "관심 단계: " + g("stage"),
      "",
      "상황:",
      g("message")
    ].join("\n");
    window.location.href = "mailto:contact@2icorp.site?subject=" +
      encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });
})();

// Comms page - pipeline stage lamps light up as the signal "reaches" them
(function () {
  "use strict";
  var stages = document.querySelectorAll(".pstage");
  if (!stages.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    stages.forEach(function (s) { s.classList.add("is-live"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-live"); io.unobserve(e.target); }
    });
  }, { threshold: 0.5, rootMargin: "0px 0px -18% 0px" });
  stages.forEach(function (s) { io.observe(s); });
})();

// Theme toggle (persists to localStorage; head stamp script applies before paint)
(function () {
  "use strict";
  var btns = document.querySelectorAll(".nav__theme");
  if (!btns.length) return;
  function current() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t;
    return (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  }
  function set(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) {}
  }
  btns.forEach(function (b) {
    b.addEventListener("click", function () { set(current() === "dark" ? "light" : "dark"); });
  });
})();
