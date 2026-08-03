(function () {
  "use strict";

  var STATE = { data: null, scenario: "assigned", rafId: null };
  var RIDER_COLORS = [
    "var(--signal)",
    "var(--steel)",
    "var(--signal-deep)",
    "var(--ok)",
    "var(--steel-soft)",
    "var(--ink-soft)",
  ];

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
    if (waypoints.length === 1) return waypoints[0];
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

  var cssCache = {};
  function getCss(varName) {
    if (!cssCache[varName]) {
      cssCache[varName] = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    return cssCache[varName];
  }

  function drawStatic(ctx, W, H, data, scenarioKey, riderFrac) {
    ctx.clearRect(0, 0, W, H);

    // restaurants (circles) -- shared across scenarios, real generator coords
    data.restaurants.forEach(function (r) {
      ctx.beginPath();
      ctx.arc(r.x, r.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = getCss("--signal");
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = getCss("--ink");
      ctx.stroke();
      ctx.font = "9px " + getCss("--mono");
      ctx.fillStyle = getCss("--ink-soft");
      ctx.fillText(r.label, r.x + 10, r.y + 3);
    });

    var scenario = data.scenarios[scenarioKey];

    // delivered dropoff points (squares), read straight out of each rider's
    // waypoints so the map only shows the destinations this scenario's
    // solve actually covers.
    Object.keys(scenario.routes).forEach(function (rid) {
      scenario.routes[rid].waypoints.forEach(function (p) {
        if (p.type === "dropoff") {
          var s = 6;
          ctx.fillStyle = getCss("--ink-faint");
          ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        }
      });
    });

    // unassigned orders (hollow dashed squares)
    (scenario.unassigned_markers || []).forEach(function (m) {
      var s = 7;
      ctx.save();
      ctx.setLineDash([2, 2]);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = getCss("--signal-deep");
      ctx.strokeRect(m.x - s / 2, m.y - s / 2, s, s);
      ctx.restore();
    });

    var rids = Object.keys(scenario.routes);
    rids.forEach(function (rid, i) {
      var route = scenario.routes[rid];
      var color = RIDER_COLORS[i % RIDER_COLORS.length];
      var wps = route.waypoints;

      if (wps.length > 1) {
        ctx.beginPath();
        wps.forEach(function (p, idx) {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.6;
        ctx.setLineDash(route.offline_after ? [5, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      var frac = riderFrac != null ? riderFrac : 1;
      var pos = route.offline_after ? wps[wps.length - 1] : pointAt(wps, frac);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, route.offline_after ? 6 : 7, 0, Math.PI * 2);
      if (route.offline_after) {
        ctx.setLineDash([2, 2]);
        ctx.fillStyle = getCss("--paper-2");
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = getCss("--ink-faint");
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = getCss("--panel");
        ctx.stroke();
      }
    });
  }

  function fmtDelta(pct) {
    return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
  }

  function renderHeadline() {
    var h = STATE.data.headline_cp_vs_greedy;
    var el = document.getElementById("deliveryHeadline");
    el.innerHTML =
      '<div class="stat"><div class="stat__label">미배정 주문 (그리디 대비)</div>' +
      '<div class="stat__value good">' +
      fmtDelta(h.delta_pct.unassigned) +
      "</div><div class=\"stat__sub\">그리디 " +
      h.greedy.n_unassigned +
      "건 → CP-SAT " +
      h.cp.n_unassigned +
      "건</div></div>" +
      '<div class="stat"><div class="stat__label">총 이동거리 (그리디 대비)</div>' +
      '<div class="stat__value good">' +
      fmtDelta(h.delta_pct.distance) +
      "</div><div class=\"stat__sub\">그리디 " +
      h.greedy.total_distance.toFixed(1) +
      " → CP-SAT " +
      h.cp.total_distance.toFixed(1) +
      "</div></div>" +
      '<div class="stat"><div class="stat__label">배정률</div><div class="stat__value">' +
      h.cp.assignment_rate_pct.toFixed(1) +
      "%</div><div class=\"stat__sub\">CP-SAT 정식 해 기준</div></div>" +
      '<div class="stat"><div class="stat__label">정시 배달률</div><div class="stat__value">' +
      h.cp.on_time_rate_pct.toFixed(1) +
      "%</div><div class=\"stat__sub\">배정된 주문 중</div></div>";
  }

  function renderReoptHeadline() {
    var r = STATE.data.reoptimize_headline;
    var el = document.getElementById("deliveryReoptHeadline");
    el.innerHTML =
      '<div class="stat"><div class="stat__label">변경된 주문(웜스타트 효과)</div>' +
      '<div class="stat__value good">' +
      r.delta_warm_minus_cold.changed_orders +
      "</div><div class=\"stat__sub\">cold " +
      r.cold.changed_orders_vs_confirmed +
      "건 → warm " +
      r.warm.changed_orders_vs_confirmed +
      "건</div></div>" +
      '<div class="stat"><div class="stat__label">미배정 주문</div><div class="stat__value good">' +
      r.delta_warm_minus_cold.n_unassigned +
      "</div><div class=\"stat__sub\">cold " +
      r.cold.n_unassigned +
      "건 → warm " +
      r.warm.n_unassigned +
      "건</div></div>" +
      '<div class="stat"><div class="stat__label">총 지각(분)</div><div class="stat__value good">' +
      r.delta_warm_minus_cold.total_late_minutes +
      "</div><div class=\"stat__sub\">cold " +
      r.cold.total_late_minutes +
      "분 → warm " +
      r.warm.total_late_minutes +
      "분</div></div>" +
      '<div class="stat"><div class="stat__label">총 이동거리</div><div class="stat__value">' +
      r.warm.total_distance.toFixed(1) +
      "</div><div class=\"stat__sub\">cold " +
      r.cold.total_distance.toFixed(1) +
      " → warm " +
      r.warm.total_distance.toFixed(1) +
      "</div></div>";
  }

  function renderStats() {
    var d = STATE.data;
    var scenario = d.scenarios[STATE.scenario];
    var el = document.getElementById("deliveryStats");
    var activeRiders = Object.keys(scenario.routes).filter(function (rid) {
      return !scenario.routes[rid].offline_after;
    }).length;
    el.innerHTML =
      '<div class="stat"><div class="stat__label">시나리오</div><div class="stat__value">' +
      scenario.label +
      "</div></div>" +
      '<div class="stat"><div class="stat__label">가동 라이더</div><div class="stat__value">' +
      activeRiders +
      "명</div></div>" +
      '<div class="stat"><div class="stat__label">미배정 주문</div><div class="stat__value ' +
      (scenario.n_unassigned > 0 ? "bad" : "good") +
      '">' +
      scenario.n_unassigned +
      "건</div></div>" +
      '<div class="stat"><div class="stat__label">총 이동거리</div><div class="stat__value">' +
      scenario.total_distance.toFixed(1) +
      "</div></div>";
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
    var durationMs = 3600;
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
        renderHeadline();
        renderReoptHeadline();
        renderStats();
        renderStaticNow();

        document.getElementById("deliveryPlayBtn").addEventListener("click", function () {
          playAnimation();
        });
        document.getElementById("deliveryDropoutBtn").addEventListener("click", function () {
          STATE.scenario = "reoptimize";
          renderStats();
          playAnimation();
        });
        document.getElementById("deliveryResetBtn").addEventListener("click", function () {
          cancelAnim();
          STATE.scenario = "assigned";
          renderStats();
          renderStaticNow();
        });
      })
      .catch(function (err) {
        document.getElementById("deliveryStats").textContent = "데이터를 불러오지 못했습니다: " + err;
      });
  };
})();
