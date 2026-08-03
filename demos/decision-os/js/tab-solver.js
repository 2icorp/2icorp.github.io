(function () {
  "use strict";

  var STATE = { seed: 20260803, worker: null, history: [], running: false };
  var N = 10,
    D = 14;
  var SHIFT_LABEL = { D: "주", E: "저", N: "야", O: "휴" };
  var SHIFT_BG = { D: "var(--steel)", E: "var(--steel-soft)", N: "var(--signal-deep)", O: "var(--paper-2)" };
  var SHIFT_FG = { D: "var(--panel)", E: "var(--panel)", N: "var(--panel)", O: "var(--ink-faint)" };

  function buildGridTable(grid) {
    var html = '<table class="gridtable"><thead><tr><th class="rowhead" scope="col">직원</th>';
    for (var d = 0; d < grid[0].length; d++) html += '<th scope="col">' + (d + 1) + "</th>";
    html += "</tr></thead><tbody>";
    for (var n = 0; n < grid.length; n++) {
      html += '<tr><th class="rowhead" scope="row">직원 ' + (n + 1) + "</th>";
      for (var d2 = 0; d2 < grid[n].length; d2++) {
        var shift = grid[n][d2];
        var label = SHIFT_LABEL[shift] || shift;
        html +=
          '<td><div class="gcell" style="background:' +
          (SHIFT_BG[shift] || "var(--paper-2)") +
          ";color:" +
          (SHIFT_FG[shift] || "var(--ink-faint)") +
          '">' +
          label +
          "</div></td>";
      }
      html += "</tr>";
    }
    html += "</tbody></table>";
    return html;
  }

  var svgNS = "http://www.w3.org/2000/svg";
  function renderConvergeChart(history) {
    var svg = document.getElementById("solverConvergeChart");
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (history.length === 0) return;
    var W = 900,
      H = 200,
      padL = 40,
      padR = 14,
      padT = 12,
      padB = 26;
    var innerW = W - padL - padR,
      innerH = H - padT - padB;
    var costs = history.map(function (h) {
      return h.cost;
    });
    var maxV = Math.max.apply(null, costs.concat([1]));
    var minV = Math.min.apply(null, history.map(function (h) { return h.best; }).concat([0]));
    function x(i) {
      return padL + (innerW * i) / Math.max(1, history.length - 1);
    }
    function y(v) {
      return padT + innerH - (innerH * (v - minV)) / Math.max(1, maxV - minV);
    }
    var costPts = history.map(function (h, i) {
      return x(i).toFixed(1) + "," + y(h.cost).toFixed(1);
    });
    var bestPts = history.map(function (h, i) {
      return x(i).toFixed(1) + "," + y(h.best).toFixed(1);
    });
    var lineCost = document.createElementNS(svgNS, "polyline");
    lineCost.setAttribute("points", costPts.join(" "));
    lineCost.setAttribute("fill", "none");
    lineCost.setAttribute("stroke", "var(--ink-faint)");
    lineCost.setAttribute("stroke-width", "1.2");
    svg.appendChild(lineCost);

    var lineBest = document.createElementNS(svgNS, "polyline");
    lineBest.setAttribute("points", bestPts.join(" "));
    lineBest.setAttribute("fill", "none");
    lineBest.setAttribute("stroke", "var(--signal)");
    lineBest.setAttribute("stroke-width", "2.2");
    svg.appendChild(lineBest);

    var yt = document.createElementNS(svgNS, "text");
    yt.setAttribute("x", padL);
    yt.setAttribute("y", padT - 2);
    yt.setAttribute("class", "axis-label");
    yt.textContent = "회색 = 현재해, 굵은 선 = 지금까지 최선해";
    svg.appendChild(yt);
  }

  function renderSolverStats(cost, coveragePct, deficitTotal, iter, elapsedMs) {
    var el = document.getElementById("solverStats");
    el.innerHTML =
      '<div class="stat"><div class="stat__label">목적함수 값(최선)</div><div class="stat__value">' +
      cost.toFixed(1) +
      "</div></div>" +
      '<div class="stat"><div class="stat__label">커버리지 충족률</div><div class="stat__value ' +
      (coveragePct >= 99.9 ? "good" : "") +
      '">' +
      coveragePct.toFixed(1) +
      "%</div></div>" +
      '<div class="stat"><div class="stat__label">부족 슬롯</div><div class="stat__value">' +
      deficitTotal +
      "건</div></div>" +
      '<div class="stat"><div class="stat__label">반복 · 소요시간</div><div class="stat__value">' +
      iter.toLocaleString("ko-KR") +
      "회</div><div class=\"stat__sub\">" +
      (elapsedMs / 1000).toFixed(2) +
      "초</div></div>";
  }

  function runSolve() {
    if (STATE.running) return;
    STATE.running = true;
    STATE.history = [];
    var runBtn = document.getElementById("solverRunBtn");
    var reseedBtn = document.getElementById("solverReseedBtn");
    runBtn.setAttribute("disabled", "");
    reseedBtn.setAttribute("disabled", "");
    document.getElementById("solverIterVal").textContent = "계산 중...";
    document.getElementById("solverProgressBar").style.width = "0%";

    var worker = new Worker("js/solver-worker.js");
    STATE.worker = worker;
    var startTs = Date.now();
    var timeBudgetMs = 1800;

    worker.onmessage = function (evt) {
      var msg = evt.data;
      if (msg.type === "progress") {
        STATE.history.push({ iter: msg.iter, cost: msg.cost, best: msg.best });
        document.getElementById("solverProgressBar").style.width = Math.round(msg.fracTime * 100) + "%";
        document.getElementById("solverIterVal").textContent = msg.iter.toLocaleString("ko-KR") + "회 · 최선 " + msg.best.toFixed(1);
        if (STATE.history.length % 3 === 0) renderConvergeChart(STATE.history);
      } else if (msg.type === "done") {
        var elapsedMs = Date.now() - startTs;
        document.getElementById("solverProgressBar").style.width = "100%";
        document.getElementById("solverIterVal").textContent = "완료 · " + msg.iter.toLocaleString("ko-KR") + "회";
        document.getElementById("solverGridWrap").innerHTML = buildGridTable(msg.grid);
        renderSolverStats(msg.cost, msg.coveragePct, msg.deficitTotal, msg.iter, elapsedMs);
        STATE.history = msg.history;
        renderConvergeChart(STATE.history);
        runBtn.removeAttribute("disabled");
        reseedBtn.removeAttribute("disabled");
        STATE.running = false;
        worker.terminate();
        STATE.worker = null;
      }
    };
    worker.onerror = function (err) {
      document.getElementById("solverIterVal").textContent = "오류: 이 데모는 로컬 파일(file://)로 열면 Web Worker가 차단됩니다. python -m http.server 로 띄운 뒤 다시 시도하세요.";
      runBtn.removeAttribute("disabled");
      reseedBtn.removeAttribute("disabled");
      STATE.running = false;
    };
    worker.postMessage({ cmd: "solve", seed: STATE.seed, N: N, D: D, timeBudgetMs: timeBudgetMs });
  }

  window.DECISION_OS_TABS = window.DECISION_OS_TABS || {};
  window.DECISION_OS_TABS.solver = function () {
    document.getElementById("solverRunBtn").addEventListener("click", runSolve);
    document.getElementById("solverReseedBtn").addEventListener("click", function () {
      STATE.seed = Math.floor(Math.random() * 1e9);
      document.getElementById("solverIterVal").textContent = "새 인스턴스 준비됨 (직접 풀어보기를 누르세요)";
      document.getElementById("solverGridWrap").innerHTML = "";
      document.getElementById("solverStats").innerHTML = "";
      renderConvergeChart([]);
      document.getElementById("solverProgressBar").style.width = "0%";
    });
  };
})();
