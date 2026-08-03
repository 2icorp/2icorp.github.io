(function () {
  "use strict";

  var svgNS = "http://www.w3.org/2000/svg";

  function clearSvg(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  function renderHeadline(shiftMix) {
    var v = {};
    shiftMix.variants.forEach(function (variant) {
      v[variant.variant] = variant;
    });
    var ft8 = v.ft8_only,
      mixed = v.mixed;
    var h = shiftMix.headline;
    var el = document.getElementById("callcenterHeadline");
    el.innerHTML =
      '<div class="stat"><div class="stat__label">동일 인건비 SLA 달성률</div>' +
      '<div class="stat__value good">+' +
      h.sla_pp_delta_mixed_minus_ft8only.toFixed(2) +
      "%p</div>" +
      '<div class="stat__sub">8시간 고정 ' +
      ft8.sla_cell_achievement_pct.toFixed(2) +
      "% → 혼합 시프트 " +
      mixed.sla_cell_achievement_pct.toFixed(2) +
      "%</div></div>" +
      '<div class="stat"><div class="stat__label">부족 person-interval</div>' +
      '<div class="stat__value good">' +
      h.shortage_delta_mixed_minus_ft8only +
      "</div><div class=\"stat__sub\">" +
      ft8.total_shortage_person_intervals +
      " → " +
      mixed.total_shortage_person_intervals +
      "칸</div></div>" +
      '<div class="stat"><div class="stat__label">과잉 person-interval</div>' +
      '<div class="stat__value good">' +
      h.surplus_delta_mixed_minus_ft8only +
      "</div><div class=\"stat__sub\">" +
      ft8.total_surplus_person_intervals +
      " → " +
      mixed.total_surplus_person_intervals +
      "칸</div></div>" +
      '<div class="stat"><div class="stat__label">사용 인건시간 차이</div>' +
      '<div class="stat__value">+' +
      h.labor_hours_delta_mixed_minus_ft8only.toFixed(1) +
      "시간</div><div class=\"stat__sub\">" +
      ft8.total_labor_hours.toFixed(0) +
      " → " +
      mixed.total_labor_hours.toFixed(0) +
      "시간(거의 동일 상한)</div></div>";
  }

  function renderCurveChart(points) {
    var svg = document.getElementById("callcenterChart");
    clearSvg(svg);
    var W = 900,
      H = 260,
      padL = 60,
      padR = 24,
      padT = 20,
      padB = 36;
    var innerW = W - padL - padR,
      innerH = H - padT - padB;
    var minT = 65,
      maxT = 100;
    var hours = points.map(function (p) {
      return p.labor_hours;
    });
    var minH = Math.min.apply(null, hours) * 0.94;
    var maxH = Math.max.apply(null, hours) * 1.06;

    function x(t) {
      return padL + (innerW * (t - minT)) / (maxT - minT);
    }
    function y(h) {
      return padT + innerH - (innerH * (h - minH)) / (maxH - minH);
    }

    var ySteps = 4;
    for (var g = 0; g <= ySteps; g++) {
      var hv = minH + ((maxH - minH) * g) / ySteps;
      var gy = y(hv);
      var gl = document.createElementNS(svgNS, "line");
      gl.setAttribute("x1", padL);
      gl.setAttribute("x2", W - padR);
      gl.setAttribute("y1", gy.toFixed(1));
      gl.setAttribute("y2", gy.toFixed(1));
      gl.setAttribute("stroke", "var(--line-soft)");
      gl.setAttribute("stroke-width", "1");
      svg.appendChild(gl);
      var gt = document.createElementNS(svgNS, "text");
      gt.setAttribute("x", padL - 8);
      gt.setAttribute("y", gy + 3);
      gt.setAttribute("text-anchor", "end");
      gt.setAttribute("class", "axis-label");
      gt.textContent = Math.round(hv) + "h";
      svg.appendChild(gt);
    }

    var linePts = points.map(function (p) {
      return x(p.target_pct).toFixed(1) + "," + y(p.labor_hours).toFixed(1);
    });
    var poly = document.createElementNS(svgNS, "polyline");
    poly.setAttribute("points", linePts.join(" "));
    poly.setAttribute("fill", "none");
    poly.setAttribute("stroke", "var(--signal)");
    poly.setAttribute("stroke-width", "2.4");
    svg.appendChild(poly);

    points.forEach(function (p) {
      var cx = x(p.target_pct),
        cy = y(p.labor_hours);
      var dot = document.createElementNS(svgNS, "circle");
      dot.setAttribute("cx", cx.toFixed(1));
      dot.setAttribute("cy", cy.toFixed(1));
      dot.setAttribute("r", "5");
      dot.setAttribute("fill", "var(--signal-deep)");
      var titleEl = document.createElementNS(svgNS, "title");
      titleEl.textContent =
        "SLA 목표 " + p.target_pct + "% → 실제 달성 " + p.achieved_pct.toFixed(2) + "%, 인건시간 " + p.labor_hours.toFixed(0) + "시간";
      dot.appendChild(titleEl);
      svg.appendChild(dot);

      var lx = document.createElementNS(svgNS, "text");
      lx.setAttribute("x", cx.toFixed(1));
      lx.setAttribute("y", H - 10);
      lx.setAttribute("text-anchor", "middle");
      lx.setAttribute("class", "axis-label");
      lx.textContent = "목표 " + p.target_pct + "%";
      svg.appendChild(lx);

      var vl = document.createElementNS(svgNS, "text");
      vl.setAttribute("x", cx.toFixed(1));
      vl.setAttribute("y", (cy - 10).toFixed(1));
      vl.setAttribute("text-anchor", "middle");
      vl.setAttribute("class", "axis-label");
      vl.textContent = p.labor_hours.toFixed(0) + "h";
      svg.appendChild(vl);
    });
  }

  function renderConclusion(points) {
    var first = points[0],
      last = points[points.length - 1];
    var pctUp = (((last.labor_hours - first.labor_hours) / first.labor_hours) * 100).toFixed(1);
    document.getElementById("callcenterConclusion").innerHTML =
      "SLA 목표를 " +
      first.target_pct +
      "%에서 " +
      last.target_pct +
      "%로 " +
      (last.target_pct - first.target_pct) +
      "%p 올리면, 필요한 인건시간은 " +
      first.labor_hours.toFixed(0) +
      "시간에서 " +
      last.labor_hours.toFixed(0) +
      "시간으로 <b>+" +
      pctUp +
      "%</b> 늘어납니다. SLA는 뒤로 갈수록 인건시간 대비 개선폭이 줄어드는 구간(체감 수확 체감)에 들어섭니다. 즉 95%를 목표로 잡는 순간부터는 사람을 더 늘리는 것보다 시프트 구성을 바꾸는 쪽(위 헤드라인 카드)이 먼저 검토할 레버입니다.";
  }

  window.DECISION_OS_TABS = window.DECISION_OS_TABS || {};
  window.DECISION_OS_TABS.callcenter = function () {
    fetch("data/contact-staffing.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        renderHeadline(data.shift_mix);
        renderCurveChart(data.sla_curve);
        renderConclusion(data.sla_curve);
      })
      .catch(function (err) {
        document.getElementById("callcenterHeadline").textContent = "데이터를 불러오지 못했습니다: " + err;
      });
  };
})();
