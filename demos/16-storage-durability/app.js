(function () {
  "use strict";

  // ---- seeded PRNG (mulberry32) : same seed -> same sequence, always ----
  function mulberry32(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function nf(n) {
    return Math.round(n).toLocaleString("ko-KR");
  }
  function pf(n, d) {
    if (d === undefined) d = 1;
    if (!isFinite(n)) return "0";
    return n.toFixed(d);
  }
  function $(id) {
    return document.getElementById(id);
  }
  var svgNS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    var el = document.createElementNS(svgNS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function clearSvg(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  /* ==========================================================
     시뮬레이터 1 : 손상 · 탐지 · 복구
     ========================================================== */
  (function () {
    var nSlider = $("nSlider"),
      rSlider = $("rSlider"),
      rateSlider = $("rateSlider");
    var nVal = $("nVal"),
      rVal = $("rVal"),
      rateVal = $("rateVal");
    var checksumBox = $("checksumToggle"),
      scrubBox = $("scrubToggle");
    var objGrid = $("objGrid");
    var bitFact = $("bitFact");
    var roundStatus = $("roundStatus");
    var summaryA = $("summaryA");

    var objN, objR, rate;
    var objects, cellEls;
    var round, totalInjected, totalRepaired, history;
    var rng;

    function checksumOn() {
      return checksumBox.checked;
    }
    function scrubOn() {
      return scrubBox.checked;
    }

    function seedFor(n, r, rt) {
      return Math.floor(n * 977 + r * 104729 + rt * 1000 * 7919 + 424242) >>> 0;
    }

    function buildGrid() {
      objGrid.innerHTML = "";
      cellEls = new Array(objN);
      var frag = document.createDocumentFragment();
      for (var i = 0; i < objN; i++) {
        var cell = document.createElement("div");
        cell.className = "obj-cell";
        cell.setAttribute("aria-hidden", "true");
        cellEls[i] = cell;
        frag.appendChild(cell);
      }
      objGrid.appendChild(frag);
    }

    function reset() {
      objN = parseInt(nSlider.value, 10);
      objR = parseInt(rSlider.value, 10);
      rate = parseFloat(rateSlider.value);
      nVal.textContent = objN + "개";
      rVal.textContent = objR + "벌";
      rateVal.textContent = pf(rate, 1) + "%";

      rng = mulberry32(seedFor(objN, objR, rate));
      objects = new Array(objN);
      for (var i = 0; i < objN; i++) {
        var reps = new Array(objR);
        for (var j = 0; j < objR; j++) reps[j] = { state: "ok", ever: false };
        objects[i] = reps;
      }
      round = 0;
      totalInjected = 0;
      totalRepaired = 0;
      history = [];
      buildGrid();
      pushHistory();
      render();
    }

    function currentlyOkList() {
      var list = [];
      for (var i = 0; i < objN; i++) {
        var reps = objects[i];
        for (var j = 0; j < objR; j++) {
          if (reps[j].state === "ok") list.push(i * objR + j);
        }
      }
      return list;
    }

    function advanceRound() {
      round++;
      var totalReplicas = objN * objR;
      var count = Math.round((rate / 100) * totalReplicas);
      var ok = currentlyOkList();
      var take = Math.min(count, ok.length);
      // partial Fisher-Yates shuffle, seeded
      for (var k = 0; k < take; k++) {
        var idx = k + Math.floor(rng() * (ok.length - k));
        var tmp = ok[k];
        ok[k] = ok[idx];
        ok[idx] = tmp;
      }
      for (var k2 = 0; k2 < take; k2++) {
        var flat = ok[k2];
        var oi = Math.floor(flat / objR),
          ri = flat % objR;
        var rep = objects[oi][ri];
        rep.state = "corrupt";
        rep.ever = true;
        totalInjected++;
      }
      if (scrubOn()) {
        for (var i = 0; i < objN; i++) {
          var reps = objects[i];
          var hasGood = false;
          for (var j = 0; j < objR; j++) if (reps[j].state === "ok") hasGood = true;
          if (!hasGood) continue;
          for (var j2 = 0; j2 < objR; j2++) {
            var r = reps[j2];
            if (checksumOn() && r.state === "corrupt") {
              r.state = "ok";
              totalRepaired++;
            }
          }
        }
      }
      pushHistory();
    }

    function computeMetrics() {
      var currentlyCorrupt = 0,
        lostCount = 0,
        baselineLostCount = 0,
        detectedCount = 0;
      for (var i = 0; i < objN; i++) {
        var reps = objects[i];
        var allCorruptNow = true,
          allEverCorrupt = true;
        for (var j = 0; j < objR; j++) {
          var r = reps[j];
          if (r.state === "corrupt") {
            currentlyCorrupt++;
            if (checksumOn()) detectedCount++;
          } else {
            allCorruptNow = false;
          }
          if (!r.ever) allEverCorrupt = false;
        }
        if (allCorruptNow) lostCount++;
        if (allEverCorrupt) baselineLostCount++;
      }
      return { currentlyCorrupt: currentlyCorrupt, lostCount: lostCount, baselineLostCount: baselineLostCount, detectedCount: detectedCount };
    }

    function pushHistory() {
      var m = computeMetrics();
      history.push({
        round: round,
        lostRate: (m.lostCount / objN) * 100,
        baselineLostRate: (m.baselineLostCount / objN) * 100,
      });
    }

    function objectStatus(reps) {
      var allCorrupt = true,
        anyCorrupt = false;
      for (var j = 0; j < objR; j++) {
        if (reps[j].state === "corrupt") anyCorrupt = true;
        else allCorrupt = false;
      }
      if (allCorrupt) return "lost";
      if (!anyCorrupt) return "ok";
      return checksumOn() ? "signal" : "silent";
    }

    function renderGrid() {
      var counts = { ok: 0, signal: 0, silent: 0, lost: 0 };
      for (var i = 0; i < objN; i++) {
        var st = objectStatus(objects[i]);
        counts[st]++;
        var cls = "obj-cell";
        if (st !== "ok") cls += " obj-cell--" + st;
        cellEls[i].className = cls;
      }
      objGrid.setAttribute(
        "aria-label",
        "객체 " + objN + "개 중 정상 " + counts.ok + "개, 탐지된 손상 " + counts.signal + "개, 조용한 오염 " + counts.silent + "개, 손실 " + counts.lost + "개"
      );
      return counts;
    }

    function renderChart() {
      var svg = $("lossChart");
      clearSvg(svg);
      var W = 600,
        H = 200,
        padL = 34,
        padR = 10,
        padT = 12,
        padB = 24;
      var innerW = W - padL - padR,
        innerH = H - padT - padB;
      var n = history.length;
      var maxVal = 5;
      for (var i = 0; i < n; i++) {
        maxVal = Math.max(maxVal, history[i].lostRate, history[i].baselineLostRate);
      }
      var yMax = Math.ceil((maxVal + 2) / 5) * 5;
      function x(i) {
        return n <= 1 ? padL : padL + (innerW * i) / (n - 1);
      }
      function y(v) {
        return padT + innerH - (v / yMax) * innerH;
      }
      // gridlines
      var steps = 4;
      for (var g = 0; g <= steps; g++) {
        var gv = (yMax / steps) * g;
        var gy = y(gv);
        svg.appendChild(svgEl("line", { x1: padL, x2: W - padR, y1: gy, y2: gy, stroke: "var(--line-soft)", "stroke-width": "1" }));
        var t = svgEl("text", { x: 2, y: gy + 3, class: "axis-label" });
        t.textContent = pf(gv, 0) + "%";
        svg.appendChild(t);
      }
      // baseline path (dashed)
      if (n > 0) {
        var bd = "M " + x(0) + "," + y(history[0].baselineLostRate).toFixed(1);
        for (var i2 = 1; i2 < n; i2++) bd += " L " + x(i2).toFixed(1) + "," + y(history[i2].baselineLostRate).toFixed(1);
        svg.appendChild(svgEl("path", { d: bd, fill: "none", stroke: "var(--steel)", "stroke-width": "2", "stroke-dasharray": "6 5" }));
        // actual path
        var ad = "M " + x(0) + "," + y(history[0].lostRate).toFixed(1);
        for (var i3 = 1; i3 < n; i3++) ad += " L " + x(i3).toFixed(1) + "," + y(history[i3].lostRate).toFixed(1);
        svg.appendChild(svgEl("path", { d: ad, fill: "none", stroke: "var(--signal)", "stroke-width": "2.4" }));
      }
      // x labels
      var labelEvery = n <= 13 ? 1 : Math.ceil(n / 12);
      for (var k = 0; k < n; k++) {
        if (k % labelEvery !== 0 && k !== n - 1) continue;
        var lt = svgEl("text", { x: x(k), y: H - 6, "text-anchor": "middle", class: "axis-label" });
        lt.textContent = String(history[k].round);
        svg.appendChild(lt);
      }
    }

    function render() {
      var counts = renderGrid();
      renderChart();
      var m = computeMetrics();
      $("mDetect").textContent = m.currentlyCorrupt > 0 ? pf((m.detectedCount / m.currentlyCorrupt) * 100, 0) : checksumOn() ? "100" : "0";
      $("mRepair").textContent = nf(totalRepaired);
      $("mLostCount").textContent = nf(m.lostCount);
      $("mLostRate").textContent = pf((m.lostCount / objN) * 100, 1);

      var deltaCount = m.lostCount - m.baselineLostCount;
      var dcEl = $("mLostCountDelta");
      dcEl.className = "metric__delta " + (deltaCount < 0 ? "good" : deltaCount > 0 ? "bad" : "");
      dcEl.textContent = deltaCount === 0 ? "스크럽 없음 기준선과 동일" : "스크럽 없음 기준선 대비 " + (deltaCount > 0 ? "+" : "") + nf(deltaCount) + "개";

      var lostRate = (m.lostCount / objN) * 100,
        baseRate = (m.baselineLostCount / objN) * 100;
      var deltaRate = lostRate - baseRate;
      var drEl = $("mLostRateDelta");
      drEl.className = "metric__delta " + (deltaRate < 0 ? "good" : deltaRate > 0 ? "bad" : "");
      drEl.textContent = deltaRate === 0 ? "스크럽 없음 기준선과 동일" : "스크럽 없음 기준선 대비 " + (deltaRate > 0 ? "+" : "") + pf(deltaRate, 1) + "%p";

      roundStatus.textContent =
        "현재 라운드: " + round + " · 누적 손상 주입 " + nf(totalInjected) + "건 · 누적 복구 " + nf(totalRepaired) + "건";

      bitFact.textContent =
        "참고로 단일 비트 반전 하나만 놓고 보면, 체크섬 없음일 때 탐지율은 0%(계산값), 체크섬 있음일 때 탐지율은 100%(계산값)입니다. 지금 체크섬은 " +
        (checksumOn() ? "켜져 있어 탐지율 100%" : "꺼져 있어 탐지율 0%") +
        " 상태입니다.";

      var sentence;
      if (!checksumOn()) {
        sentence =
          "체크섬 없이 " + round + "라운드를 진행하면 손상 " + nf(totalInjected) + "건 중 0건이 탐지되고, 그중 " + nf(m.lostCount) + "개 객체가 조용히 오염된 채 남습니다(합성 데이터 계산).";
      } else if (!scrubOn()) {
        sentence =
          "체크섬을 켜면 손상 " + nf(totalInjected) + "건 중 " + nf(m.currentlyCorrupt) + "건(100%)이 탐지되지만, 스크럽이 꺼져 있어 복구되지 않고 " + nf(m.lostCount) + "개 객체가 복구 불능 상태로 남습니다(합성 데이터 계산).";
      } else {
        var saved = m.baselineLostCount - m.lostCount;
        sentence =
          "체크섬과 스크럽을 모두 켜면 손상 " + nf(totalInjected) + "건 중 " + nf(totalRepaired) + "건이 복구되어, 스크럽이 없었다면 잃었을 " + nf(saved) + "개 객체를 지켰습니다. 지금 손실 객체는 " + nf(m.lostCount) + "개입니다(합성 데이터 계산).";
      }
      summaryA.textContent = sentence;
    }

    nSlider.addEventListener("input", reset);
    rSlider.addEventListener("input", reset);
    rateSlider.addEventListener("input", reset);
    checksumBox.addEventListener("change", render);
    scrubBox.addEventListener("change", render);
    $("btnStep").addEventListener("click", function () {
      advanceRound();
      render();
    });
    $("btnAuto6").addEventListener("click", function () {
      for (var i = 0; i < 6; i++) advanceRound();
      render();
    });
    $("btnReset").addEventListener("click", reset);

    reset();
  })();

  /* ==========================================================
     시뮬레이터 2 : 저장 효율 비교 (순수 계산)
     ========================================================== */
  (function () {
    var rawSlider = $("rawSlider"),
      fSlider = $("fSlider"),
      kSlider = $("kSlider");
    var rawVal = $("rawVal"),
      fVal = $("fVal"),
      kVal = $("kVal");
    var effFormula = $("effFormula");
    var effLegend = $("effLegend");
    var summaryB = $("summaryB");

    function render() {
      var raw = parseFloat(rawSlider.value);
      var f = parseInt(fSlider.value, 10);
      var k = parseInt(kSlider.value, 10);
      rawVal.textContent = (raw % 1 === 0 ? raw.toFixed(0) : raw.toFixed(2)) + " TiB";
      var R = f + 1;
      var m = f;
      fVal.textContent = f + "개";
      kVal.textContent = k + "조각";

      var rawGiB = raw * 1024;
      var usableRepl = Math.floor(rawGiB / R);
      var usableEC = Math.floor((rawGiB * k) / (k + m));
      var ratio = usableRepl > 0 ? usableEC / usableRepl : 0;

      effFormula.textContent =
        "동시 손실 " + f + "개를 견디기 위해 복제는 " + R + "중 복제(원시/" + R + "), 소거 부호는 " + k + "+" + m + "(원시×" + k + "/" + (k + m) + ")로 맞췄습니다.";

      $("mUsableRepl").textContent = nf(usableRepl);
      $("mUsableEC").textContent = nf(usableEC);
      $("mEffRatio").textContent = pf(ratio, 1);

      // bar chart
      var svg = $("effChart");
      clearSvg(svg);
      var W = 600,
        H = 140,
        padL = 150,
        padR = 60,
        barH = 34,
        gap = 26;
      var innerW = W - padL - padR;
      var maxV = Math.max(usableRepl, usableEC, 1);
      function bw(v) {
        return (innerW * v) / maxV;
      }
      var y1 = 24,
        y2 = y1 + barH + gap;

      var lbl1 = svgEl("text", { x: 0, y: y1 + barH / 2 + 4, class: "bar-label" });
      lbl1.textContent = "복제(" + R + "중)";
      svg.appendChild(lbl1);
      svg.appendChild(svgEl("rect", { x: padL, y: y1, width: Math.max(2, bw(usableRepl)), height: barH, fill: "var(--steel)", rx: "2" }));
      var t1 = svgEl("text", { x: padL + bw(usableRepl) + 8, y: y1 + barH / 2 + 4, class: "bar-label" });
      t1.textContent = nf(usableRepl) + " GiB";
      svg.appendChild(t1);

      var lbl2 = svgEl("text", { x: 0, y: y2 + barH / 2 + 4, class: "bar-label" });
      lbl2.textContent = "소거부호(" + k + "+" + m + ")";
      svg.appendChild(lbl2);
      svg.appendChild(svgEl("rect", { x: padL, y: y2, width: Math.max(2, bw(usableEC)), height: barH, fill: "var(--signal)", rx: "2" }));
      var t2 = svgEl("text", { x: padL + bw(usableEC) + 8, y: y2 + barH / 2 + 4, class: "bar-label" });
      t2.textContent = nf(usableEC) + " GiB";
      svg.appendChild(t2);

      effLegend.textContent = "막대 길이는 원시 용량 " + nf(rawGiB) + "GiB 중 실제로 쓸 수 있는 양입니다(계산값).";

      summaryB.textContent =
        "원시 " + (raw % 1 === 0 ? raw.toFixed(0) : raw.toFixed(2)) + "TiB에서 동시 손실 " + f + "개를 견디는 조건으로, " + R + "중 복제는 " + nf(usableRepl) + "GiB, " + k + "+" + m + " 소거 부호는 " + nf(usableEC) + "GiB를 씁니다. 소거 부호가 복제보다 " + pf(ratio, 1) + "배 더 많은 용량을 실사용으로 돌려줍니다(계산값).";
    }

    rawSlider.addEventListener("input", render);
    fSlider.addEventListener("input", render);
    kSlider.addEventListener("input", render);
    render();
  })();

  /* ==========================================================
     시뮬레이터 3 : 장애 도메인 배치
     ========================================================== */
  (function () {
    var nodesSlider = $("nodesSlider"),
      domainsSlider = $("domainsSlider"),
      chunksSlider = $("chunksSlider"),
      cReplSlider = $("cReplSlider");
    var nodesVal = $("nodesVal"),
      domainsVal = $("domainsVal"),
      chunksVal = $("chunksVal"),
      cReplVal = $("cReplVal");
    var domainMap = $("domainMap");
    var domainLegend = $("domainLegend");
    var rejectNote = $("rejectNote");
    var summaryC = $("summaryC");

    function seedFor(nodes, domains, chunks, r) {
      return Math.floor(nodes * 131 + domains * 5171 + chunks * 3 + r * 65599 + 909090) >>> 0;
    }

    function render() {
      var nodes = parseInt(nodesSlider.value, 10);
      var domains = parseInt(domainsSlider.value, 10);
      var chunks = parseInt(chunksSlider.value, 10);
      var R = parseInt(cReplSlider.value, 10);
      nodesVal.textContent = nodes + "개";
      domainsVal.textContent = domains + "개";
      chunksVal.textContent = nf(chunks) + "개";
      cReplVal.textContent = R + "벌";

      var nodeDomain = new Array(nodes);
      var domainNodeMap = {};
      for (var i = 0; i < nodes; i++) {
        var d = i % domains;
        nodeDomain[i] = d;
        if (!domainNodeMap[d]) domainNodeMap[d] = [];
        domainNodeMap[d].push(i);
      }
      var domainKeys = Object.keys(domainNodeMap);

      // domain map visual
      domainMap.innerHTML = "";
      for (var di = 0; di < domainKeys.length; di++) {
        var dk = domainKeys[di];
        var chip = document.createElement("div");
        chip.className = "domain-chip";
        var lab = document.createElement("div");
        lab.className = "domain-chip__label";
        lab.textContent = "도메인 " + String.fromCharCode(65 + parseInt(dk, 10));
        var ns = document.createElement("div");
        ns.className = "domain-chip__nodes";
        ns.textContent = "노드 " + domainNodeMap[dk].join(", ");
        chip.appendChild(lab);
        chip.appendChild(ns);
        domainMap.appendChild(chip);
      }

      var rng = mulberry32(seedFor(nodes, domains, chunks, R));
      var effR = Math.min(R, nodes);
      var naiveCollide = 0,
        awareCollide = 0,
        reject = 0;

      for (var c = 0; c < chunks; c++) {
        // ---- naive: score every node, take top effR ignoring domain ----
        var scored = new Array(nodes);
        for (var ni = 0; ni < nodes; ni++) scored[ni] = { node: ni, domain: nodeDomain[ni], score: rng() };
        scored.sort(function (a, b) {
          return b.score - a.score;
        });
        var chosenNaive = scored.slice(0, effR);
        var domCount = {};
        var collided = false;
        for (var x = 0; x < chosenNaive.length; x++) {
          var dd = chosenNaive[x].domain;
          domCount[dd] = (domCount[dd] || 0) + 1;
          if (domCount[dd] >= 2) collided = true;
        }
        if (collided) naiveCollide++;

        // ---- aware: force distinct domains when possible ----
        var pool = domainKeys.slice();
        // shuffle pool
        for (var p = pool.length - 1; p > 0; p--) {
          var pi = Math.floor(rng() * (p + 1));
          var tmp = pool[p];
          pool[p] = pool[pi];
          pool[pi] = tmp;
        }
        var awareDomains;
        if (pool.length >= effR) {
          awareDomains = pool.slice(0, effR);
        } else {
          reject++;
          awareDomains = [];
          for (var y = 0; y < effR; y++) awareDomains.push(pool[y % pool.length]);
        }
        var domCount2 = {};
        var collided2 = false;
        for (var z = 0; z < awareDomains.length; z++) {
          var dz = awareDomains[z];
          domCount2[dz] = (domCount2[dz] || 0) + 1;
          if (domCount2[dz] >= 2) collided2 = true;
        }
        if (collided2) awareCollide++;
      }

      var naiveRate = (naiveCollide / chunks) * 100;
      var awareRate = (awareCollide / chunks) * 100;
      var rejectRate = (reject / chunks) * 100;

      $("mNaive").textContent = pf(naiveRate, 1);
      $("mAware").textContent = pf(awareRate, 1);
      $("mReject").textContent = nf(reject);

      rejectNote.textContent =
        reject > 0
          ? "도메인 인식 배치에서 " + nf(reject) + "건(" + pf(rejectRate, 1) + "%)의 청크는 서로 다른 도메인 " + effR + "곳을 확보하지 못해 명시적으로 거부되었습니다. 도메인 수를 복제본 수 이상으로 늘리면 사라집니다."
          : "도메인 수가 복제본 수보다 충분히 많아 거부된 청크는 없습니다(계산값).";

      // bar chart
      var svg = $("domainChart");
      clearSvg(svg);
      var W = 600,
        H = 140,
        padL = 160,
        padR = 60,
        barH = 34,
        gap = 26;
      var innerW = W - padL - padR;
      var maxV = Math.max(naiveRate, awareRate, 5);
      function bw(v) {
        return (innerW * v) / maxV;
      }
      var y1 = 24,
        y2 = y1 + barH + gap;

      var lbl1 = svgEl("text", { x: 0, y: y1 + barH / 2 + 4, class: "bar-label" });
      lbl1.textContent = "도메인 무시";
      svg.appendChild(lbl1);
      svg.appendChild(svgEl("rect", { x: padL, y: y1, width: Math.max(2, bw(naiveRate)), height: barH, fill: "var(--signal-deep)", rx: "2" }));
      var t1 = svgEl("text", { x: padL + bw(naiveRate) + 8, y: y1 + barH / 2 + 4, class: "bar-label" });
      t1.textContent = pf(naiveRate, 1) + "%";
      svg.appendChild(t1);

      var lbl2 = svgEl("text", { x: 0, y: y2 + barH / 2 + 4, class: "bar-label" });
      lbl2.textContent = "도메인 인식";
      svg.appendChild(lbl2);
      svg.appendChild(svgEl("rect", { x: padL, y: y2, width: Math.max(2, bw(awareRate)), height: barH, fill: "var(--ok)", rx: "2" }));
      var t2 = svgEl("text", { x: padL + bw(awareRate) + 8, y: y2 + barH / 2 + 4, class: "bar-label" });
      t2.textContent = pf(awareRate, 1) + "%";
      svg.appendChild(t2);

      domainLegend.textContent = "노드 " + nodes + "개 · 도메인 " + domainKeys.length + "개 · 청크 " + nf(chunks) + "개 · 청크당 복제본 " + effR + "벌 기준 실제 배치 결과입니다(계산값).";

      summaryC.textContent =
        "노드 " + nodes + "개·도메인 " + domainKeys.length + "개·청크 " + nf(chunks) + "개 기준, 도메인을 무시하면 청크의 " + pf(naiveRate, 1) + "%가 한 도메인에 복제본이 몰립니다. 도메인을 인식하면 " + pf(awareRate, 1) + "%로 줄고, 도메인이 부족해 거부된 청크는 " + nf(reject) + "건입니다(합성 데이터 계산).";
    }

    nodesSlider.addEventListener("input", render);
    domainsSlider.addEventListener("input", render);
    chunksSlider.addEventListener("input", render);
    cReplSlider.addEventListener("input", render);
    render();
  })();
})();
