(function () {
  "use strict";

  var REGIONS = ["gangnam", "yeoksam", "jamsil", "pangyo"];
  var REGION_LABEL = { gangnam: "강남", yeoksam: "역삼", jamsil: "잠실", pangyo: "판교" };
  var REGION_SEED = { gangnam: 42, yeoksam: 11, jamsil: 73, pangyo: 5 };

  var STATE = {
    region: "gangnam",
    worker: null,
    roadsCache: {}, // region -> parsed roads json
    projector: null,
    latest: null, // last snapshot from worker
    playing: true,
    speed: 3,
  };

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  var redrawSkip = 0;

  // -----------------------------------------------------------------
  // projection: equirectangular fit, true-aspect (cos(lat) correction),
  // letterboxed to fill the canvas without stretching the shape.
  // -----------------------------------------------------------------
  function makeProjector(bbox, W, H, padding) {
    var centerLatRad = ((bbox.north + bbox.south) / 2) * (Math.PI / 180);
    var mPerDegLon = 111320 * Math.cos(centerLatRad);
    var mPerDegLat = 110540;
    var widthM = (bbox.east - bbox.west) * mPerDegLon;
    var heightM = (bbox.north - bbox.south) * mPerDegLat;
    var availW = W - padding * 2,
      availH = H - padding * 2;
    var scale = Math.min(availW / widthM, availH / heightM);
    var usedW = widthM * scale,
      usedH = heightM * scale;
    var offsetX = padding + (availW - usedW) / 2;
    var offsetY = padding + (availH - usedH) / 2;
    return function (lon, lat) {
      return {
        x: offsetX + (lon - bbox.west) * mPerDegLon * scale,
        y: offsetY + (bbox.north - lat) * mPerDegLat * scale,
      };
    };
  }

  var cssCache = {};
  function getCss(varName) {
    if (!cssCache[varName]) {
      cssCache[varName] = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    return cssCache[varName];
  }

  // -----------------------------------------------------------------
  // rendering
  // -----------------------------------------------------------------
  function drawMap() {
    var canvas = document.getElementById("mapCanvas");
    var ctx = canvas.getContext("2d");
    var W = canvas.width,
      H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (!STATE.projector) return;
    var proj = STATE.projector;
    var roads = STATE.roadsCache[STATE.region];

    if (roads) {
      roads.roads.forEach(function (r) {
        var isArterial = r.highway === "primary" || r.highway === "secondary" || r.highway === "tertiary";
        ctx.beginPath();
        for (var i = 0; i < r.coords.length; i++) {
          var p = proj(r.coords[i][0], r.coords[i][1]);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = isArterial ? getCss("--ink-soft") : getCss("--line");
        ctx.lineWidth = isArterial ? 1.4 : 0.7;
        ctx.globalAlpha = isArterial ? 0.85 : 0.55;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    var snap = STATE.latest;
    if (!snap) return;

    snap.restaurants.forEach(function (r) {
      var p = proj(r.lon, r.lat);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = getCss("--signal");
      ctx.fill();
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = getCss("--ink");
      ctx.stroke();
    });

    snap.pendingOrders.forEach(function (o) {
      var p = proj(o.lon, o.lat);
      var s = 7;
      ctx.fillStyle = getCss("--signal-deep");
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    });

    snap.riders.forEach(function (r) {
      var p = proj(r.lon, r.lat);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r.carrying > 0 ? 7 : 6, 0, Math.PI * 2);
      if (r.offline || r.offlineAfterCurrent) {
        ctx.setLineDash([2, 2]);
        ctx.fillStyle = getCss("--paper-2");
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = getCss("--ink-faint");
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = r.carrying > 0 ? getCss("--ok") : getCss("--steel");
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = getCss("--panel");
        ctx.stroke();
      }
    });
  }

  function renderLiveStats() {
    var snap = STATE.latest;
    var el = document.getElementById("liveStats");
    if (!snap) {
      el.innerHTML = "";
      return;
    }
    var activeRiders = snap.riders.filter(function (r) {
      return !r.offline;
    }).length;
    el.innerHTML =
      '<div class="stat"><div class="stat__label">가상 경과시간</div><div class="stat__value">' +
      Math.floor(snap.simSeconds / 60) +
      "분 " +
      Math.floor(snap.simSeconds % 60) +
      "초</div></div>" +
      '<div class="stat"><div class="stat__label">미배정 주문</div><div class="stat__value ' +
      (snap.kpi.unassigned > 10 ? "bad" : "") +
      '">' +
      snap.kpi.unassigned +
      "건</div></div>" +
      '<div class="stat"><div class="stat__label">배달 완료</div><div class="stat__value good">' +
      snap.kpi.delivered +
      "건</div><div class=\"stat__sub\">재배정 " +
      snap.kpi.reassigned +
      "건</div></div>" +
      '<div class="stat"><div class="stat__label">평균 배달 시간</div><div class="stat__value">' +
      snap.kpi.avgDeliveryMin.toFixed(1) +
      "분</div></div>" +
      '<div class="stat"><div class="stat__label">가동 라이더</div><div class="stat__value">' +
      activeRiders +
      "/" +
      snap.riders.length +
      "명</div></div>" +
      '<div class="stat"><div class="stat__label">누적 주행거리</div><div class="stat__value">' +
      snap.kpi.totalDistanceKm.toFixed(1) +
      "km</div></div>";
  }

  function renderMeasuredStats() {
    var el = document.getElementById("measuredStats");
    el.innerHTML =
      '<div class="stat"><div class="stat__label">미배정 (그리디 대비, 즉시배정)</div><div class="stat__value good">-21.8%</div><div class="stat__sub">중형 인스턴스 3시드 평균</div></div>' +
      '<div class="stat"><div class="stat__label">이동거리 (그리디 대비, 즉시배정)</div><div class="stat__value good">-36.8%</div><div class="stat__sub">중형 인스턴스 3시드 평균</div></div>' +
      '<div class="stat"><div class="stat__label">재배차 변경 주문 (웜스타트 효과)</div><div class="stat__value good">-20.4%</div><div class="stat__sub">라이더 20% 이탈 + 서지 10건, cold 54건 → warm 43건</div></div>' +
      '<div class="stat"><div class="stat__label">엔진</div><div class="stat__value" style="font-size:1.05rem;">CP-SAT two-phase</div><div class="stat__sub">독립 검증기 위반 0</div></div>';
  }

  // -----------------------------------------------------------------
  // worker lifecycle
  // -----------------------------------------------------------------
  function stopWorker() {
    if (STATE.worker) {
      STATE.worker.postMessage({ cmd: "stop" });
      STATE.worker.terminate();
      STATE.worker = null;
    }
  }

  function startRegion(region) {
    stopWorker();
    STATE.region = region;
    STATE.latest = null;
    document.getElementById("mapTitle").textContent = REGION_LABEL[region] + " 권역";

    var roadsPromise = STATE.roadsCache[region]
      ? Promise.resolve(STATE.roadsCache[region])
      : fetch("data/roads-" + region + ".json")
          .then(function (r) {
            return r.json();
          })
          .then(function (data) {
            STATE.roadsCache[region] = data;
            return data;
          });

    roadsPromise
      .then(function (roads) {
        STATE.projector = makeProjector(roads.bbox, 900, 620, 24);
        document.getElementById("mapSourceNote").textContent =
          roads.source + " · " + roads.attribution + " · 간선도로 " +
          roads.roads.filter(function (r) {
            return r.highway === "primary" || r.highway === "secondary" || r.highway === "tertiary";
          }).length +
          "개 / 전체 " +
          roads.roads.length +
          "개 도로 세그먼트";

        var worker = new Worker("js/live-sim-worker.js");
        STATE.worker = worker;
        worker.onmessage = function (evt) {
          if (evt.data.type === "snapshot") {
            STATE.latest = evt.data;
            renderLiveStats();
            if (reducedMotion()) {
              redrawSkip++;
              if (redrawSkip % 3 !== 0) return;
            }
            drawMap();
          }
        };
        worker.onerror = function () {
          document.getElementById("mapSourceNote").textContent =
            "오류: 이 데모는 로컬 파일(file://)로 열면 Web Worker가 차단됩니다. python -m http.server 로 띄운 뒤 다시 시도하세요.";
        };
        worker.postMessage({
          cmd: "init",
          region: region,
          roads: roads.roads,
          bbox: roads.bbox,
          seed: REGION_SEED[region] || 1,
        });
        worker.postMessage({ cmd: "speed", value: STATE.speed });
        if (!STATE.playing) worker.postMessage({ cmd: "pause" });
        drawMap();
      })
      .catch(function (err) {
        document.getElementById("mapSourceNote").textContent = "도로 데이터를 불러오지 못했습니다: " + err;
      });
  }

  // -----------------------------------------------------------------
  // controls
  // -----------------------------------------------------------------
  function wireControls() {
    var tabBtns = Array.prototype.slice.call(document.querySelectorAll(".tab-btn"));
    tabBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        tabBtns.forEach(function (b) {
          b.setAttribute("aria-selected", "false");
          b.tabIndex = -1;
        });
        btn.setAttribute("aria-selected", "true");
        btn.tabIndex = 0;
        startRegion(btn.getAttribute("data-region"));
      });
    });

    var playPauseBtn = document.getElementById("playPauseBtn");
    playPauseBtn.addEventListener("click", function () {
      STATE.playing = !STATE.playing;
      playPauseBtn.textContent = STATE.playing ? "일시정지" : "재생";
      playPauseBtn.setAttribute("aria-pressed", STATE.playing ? "true" : "false");
      if (STATE.worker) STATE.worker.postMessage({ cmd: STATE.playing ? "play" : "pause" });
    });

    document.getElementById("speedSelect").addEventListener("change", function (evt) {
      STATE.speed = parseInt(evt.target.value, 10);
      if (STATE.worker) STATE.worker.postMessage({ cmd: "speed", value: STATE.speed });
    });

    document.getElementById("dropoutBtn").addEventListener("click", function () {
      if (STATE.worker) STATE.worker.postMessage({ cmd: "dropout" });
    });

    document.getElementById("resetBtn").addEventListener("click", function () {
      startRegion(STATE.region);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireControls();
    renderMeasuredStats();
    startRegion(STATE.region);
  });
})();
