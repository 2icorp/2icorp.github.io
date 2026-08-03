(function () {
  "use strict";

  var STATE = { data: null, scenario: "normal", rafId: null };
  var RIDER_COLORS = ["var(--signal)", "var(--steel)", "var(--signal-deep)", "var(--ok)"];

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function cancelAnim() {
    if (STATE.rafId !== null) {
      cancelAnimationFrame(STATE.rafId);
      STATE.rafId = null;
    }
  }

  function pathLength(waypoints) {
    var total = 0;
    for (var i = 1; i < waypoints.length; i++) {
      total += Math.hypot(waypoints[i].x - waypoints[i - 1].x, waypoints[i].y - waypoints[i - 1].y);
    }
    return total;
  }

  function pointAt(waypoints, frac) {
    var total = pathLength(waypoints);
    if (total <= 0) return waypoints[0];
    var target = total * frac;
    var acc = 0;
    for (var i = 1; i < waypoints.length; i++) {
      var seg = Math.hypot(waypoints[i].x - waypoints[i - 1].x, waypoints[i].y - waypoints[i - 1].y);
      if (acc + seg >= target) {
        var segFrac = seg > 0 ? (target - acc) / seg : 0;
        return {
          x: waypoints[i - 1].x + (waypoints[i].x - waypoints[i - 1].x) * segFrac,
          y: waypoints[i - 1].y + (waypoints[i].y - waypoints[i - 1].y) * segFrac,
        };
      }
      acc += seg;
    }
    return waypoints[waypoints.length - 1];
  }

  function drawStatic(ctx, W, H, data, scenarioKey, riderFrac) {
    ctx.clearRect(0, 0, W, H);

    // restaurants (circles)
    data.restaurants.forEach(function (r) {
      ctx.beginPath();
      ctx.arc(r.x, r.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = getCss("--signal");
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = getCss("--ink");
      ctx.stroke();
      ctx.font = "10px " + getCss("--mono");
      ctx.fillStyle = getCss("--ink-soft");
      ctx.fillText(r.label, r.x + 12, r.y + 4);
    });

    // delivery points (squares)
    data.orders.forEach(function (o) {
      var s = 7;
      ctx.fillStyle = getCss("--ink-faint");
      ctx.fillRect(o.dropoff.x - s / 2, o.dropoff.y - s / 2, s, s);
    });

    var scenario = data.scenarios[scenarioKey];
    var rids = Object.keys(scenario.routes);
    rids.forEach(function (rid, i) {
      var route = scenario.routes[rid];
      var color = RIDER_COLORS[i % RIDER_COLORS.length];
      var wps = route.waypoints;

      // path line
      ctx.beginPath();
      wps.forEach(function (p, idx) {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.setLineDash(route.offline_after ? [5, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // reassigned-order markers
      wps.forEach(function (p) {
        if (p.reassigned && p.type === "dropoff") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
          ctx.strokeStyle = getCss("--signal-deep");
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // rider marker position
      var frac = riderFrac != null ? riderFrac : 1;
      var pos = route.offline_after ? wps[wps.length - 1] : pointAt(wps, frac);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = getCss("--panel");
      ctx.stroke();
      ctx.font = "bold 9px " + getCss("--mono");
      ctx.fillStyle = getCss("--ink");
      var displayLabel = route.rider_label + (route.offline_after ? " (오프라인)" : "");
      ctx.fillText(displayLabel, pos.x + 10, pos.y - 8);
    });
  }

  var cssCache = {};
  function getCss(varName) {
    if (!cssCache[varName]) {
      cssCache[varName] = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    return cssCache[varName];
  }

  function renderStats() {
    var d = STATE.data;
    var scenario = d.scenarios[STATE.scenario];
    var el = document.getElementById("deliveryStats");
    var activeRiders = Object.keys(scenario.routes).filter(function (rid) {
      return !scenario.routes[rid].offline_after;
    }).length;
    var reassignedCount = scenario.reassigned_order_ids ? scenario.reassigned_order_ids.length : 0;
    el.innerHTML =
      '<div class="stat"><div class="stat__label">시나리오</div><div class="stat__value">' +
      scenario.label +
      "</div></div>" +
      '<div class="stat"><div class="stat__label">가동 라이더</div><div class="stat__value">' +
      activeRiders +
      "명</div></div>" +
      '<div class="stat"><div class="stat__label">총 이동 경로 길이</div><div class="stat__value">' +
      Math.round(scenario.total_route_length) +
      "</div><div class=\"stat__sub\">합성 좌표 단위</div></div>" +
      '<div class="stat"><div class="stat__label">재배정된 주문</div><div class="stat__value ' +
      (reassignedCount > 0 ? "bad" : "") +
      '">' +
      reassignedCount +
      "건</div></div>";
    document.getElementById("deliveryScenarioLabel").textContent = scenario.label;
  }

  function renderStaticNow() {
    var canvas = document.getElementById("deliveryCanvas");
    var ctx = canvas.getContext("2d");
    drawStatic(ctx, STATE.data.map.width, STATE.data.map.height, STATE.data, STATE.scenario, 1);
  }

  function playAnimation() {
    cancelAnim();
    var canvas = document.getElementById("deliveryCanvas");
    var ctx = canvas.getContext("2d");
    if (reducedMotion()) {
      renderStaticNow();
      return;
    }
    var durationMs = 3200;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var elapsed = ts - start;
      var frac = Math.min(1, elapsed / durationMs);
      drawStatic(ctx, STATE.data.map.width, STATE.data.map.height, STATE.data, STATE.scenario, frac);
      if (frac < 1) {
        STATE.rafId = requestAnimationFrame(step);
      } else {
        STATE.rafId = null;
      }
    }
    STATE.rafId = requestAnimationFrame(step);
  }

  window.DECISION_OS_TABS = window.DECISION_OS_TABS || {};
  window.DECISION_OS_TABS.delivery = function () {
    fetch("data/delivery.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        STATE.data = data;
        renderStats();
        renderStaticNow();

        document.getElementById("deliveryPlayBtn").addEventListener("click", function () {
          playAnimation();
        });
        document.getElementById("deliveryDropoutBtn").addEventListener("click", function () {
          STATE.scenario = "dropout";
          renderStats();
          playAnimation();
        });
        document.getElementById("deliveryResetBtn").addEventListener("click", function () {
          cancelAnim();
          STATE.scenario = "normal";
          renderStats();
          renderStaticNow();
        });
      })
      .catch(function (err) {
        document.getElementById("deliveryStats").textContent = "데이터를 불러오지 못했습니다: " + err;
      });
  };
})();
