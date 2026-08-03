(function () {
  "use strict";

  var STATE = { data: null, weightOn: false };

  var SHIFT_LABEL = { D: "주", E: "저", N: "야", O: "휴" };
  var SHIFT_BG = { D: "var(--steel)", E: "var(--steel-soft)", N: "var(--signal-deep)", O: "var(--paper-2)" };
  var SHIFT_FG = { D: "var(--panel)", E: "var(--panel)", N: "var(--panel)", O: "var(--ink-faint)" };

  function buildGridTable(grid, rowLabelPrefix) {
    var numDays = grid[0].length;
    var html = '<table class="gridtable"><thead><tr><th class="rowhead" scope="col">간호사</th>';
    for (var d = 0; d < numDays; d++) {
      html += '<th scope="col">' + (d + 1) + "</th>";
    }
    html += "</tr></thead><tbody>";
    for (var n = 0; n < grid.length; n++) {
      html += '<tr><th class="rowhead" scope="row">' + rowLabelPrefix + " " + (n + 1) + "</th>";
      for (var d2 = 0; d2 < numDays; d2++) {
        var shift = grid[n][d2];
        var label = SHIFT_LABEL[shift] || shift;
        html +=
          '<td><div class="gcell" style="background:' +
          (SHIFT_BG[shift] || "var(--paper-2)") +
          ";color:" +
          (SHIFT_FG[shift] || "var(--ink-faint)") +
          '" title="' +
          rowLabelPrefix +
          " " +
          (n + 1) +
          " · " +
          (d2 + 1) +
          "일차 · " +
          label +
          '">' +
          label +
          "</div></td>";
      }
      html += "</tr>";
    }
    html += "</tbody></table>";
    return html;
  }

  function fmtPct(p) {
    return (p * 100).toFixed(1) + "%";
  }

  function render() {
    var d = STATE.data;
    var key = STATE.weightOn ? "10" : "0";
    var run = d.runs[key];
    var otherKey = STATE.weightOn ? "0" : "10";
    var other = d.runs[otherKey];

    var label = document.getElementById("nurseFairLabel");
    label.textContent = STATE.weightOn ? "공정성 가중치 켜짐 (10)" : "공정성 가중치 꺼짐 (0)";

    var statsEl = document.getElementById("nurseStats");
    var deviation = run.fairness.min_max_deviation;
    var otherDeviation = other.fairness.min_max_deviation;
    var deltaGood = deviation <= otherDeviation;
    statsEl.innerHTML =
      '<div class="stat"><div class="stat__label">야간 근무 최다-최소 편차</div>' +
      '<div class="stat__value ' +
      (deviation === 0 ? "good" : "") +
      '">' +
      deviation +
      '<span style="font-size:.8rem;font-weight:500;">일</span></div>' +
      '<div class="stat__sub">가중치 ' +
      run.fairness_weight +
      "일 때 (다른 쪽은 " +
      otherDeviation +
      "일)</div></div>" +
      '<div class="stat"><div class="stat__label">야간 근무 지니계수</div>' +
      '<div class="stat__value">' +
      run.fairness.gini.toFixed(3) +
      "</div><div class=\"stat__sub\">0에 가까울수록 균등</div></div>" +
      '<div class="stat"><div class="stat__label">커버리지 충족률</div>' +
      '<div class="stat__value">' +
      fmtPct(run.coverage.coverage_rate) +
      "</div><div class=\"stat__sub\">필요 슬롯 대비 실제 충족</div></div>" +
      '<div class="stat"><div class="stat__label">Jain 공정성 지수</div>' +
      '<div class="stat__value">' +
      run.fairness.jain_index.toFixed(3) +
      "</div><div class=\"stat__sub\">1.0이 완전 균등</div></div>";

    document.getElementById("nurseGridWrap").innerHTML = buildGridTable(run.grid, "간호사");

    var ref = d.reference;
    document.getElementById("nurseSourceNote").innerHTML =
      "출처: 합성 데이터 실측(CP-SAT), domains/nurse-roster (generate.build_instance seed=1 size=medium staffing=loose, " +
      d.meta.num_employees +
      "명 x " +
      d.meta.num_days +
      "일) + model.solve(fairness_weight=" +
      run.fairness_weight +
      "), 이 데모용으로 재실행. 랩 결과 파일(tradeoff.json)에 과거 기록된 동일 조건 값은 가중치 0에서 편차 " +
      ref.night_min_max_weight0 +
      "일, 가중치 10에서 " +
      ref.night_min_max_weight10 +
      "일입니다.";

    document.getElementById("nurseHonestText").textContent =
      ref.note +
      " 두 경우 모두 OR-Tools CP-SAT로 실제로 풀었고(시간제한 25초, 8워커), 근무표 자체를 지어내지 않았습니다. 다만 이 데모가 다루는 병동 규칙(3교대·연속근무 상한 5일·야간 후 주간 금지)은 합성 데이터로 단순화한 예시라 실제 병동의 근로계약 유형별 규칙과는 다릅니다.";
  }

  window.DECISION_OS_TABS = window.DECISION_OS_TABS || {};
  window.DECISION_OS_TABS.nurse = function () {
    fetch("data/nurse-roster.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        STATE.data = data;
        render();
        document.getElementById("nurseFairToggle").addEventListener("change", function (evt) {
          STATE.weightOn = evt.target.checked;
          render();
        });
      })
      .catch(function (err) {
        document.getElementById("nurseGridWrap").textContent = "데이터를 불러오지 못했습니다: " + err;
      });
  };
})();
