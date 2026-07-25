// 2i landing — minimal progressive enhancement. No deps.
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Hero process-gauge load animation
  var hero = document.querySelector(".hero");
  if (hero) {
    if (reduce) hero.classList.add("loaded");
    else requestAnimationFrame(function () {
      setTimeout(function () { hero.classList.add("loaded"); }, 120);
    });
  }

  // Scroll reveal
  var reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

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
      // count-up
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
