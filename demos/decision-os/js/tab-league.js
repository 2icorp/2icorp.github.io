(function () {
  "use strict";

  var STATE = { data: null, strongOn: false };
  var VENUE_LABEL = { H: "홈", A: "원정", "-": "휴식" };
  var VENUE_BG = { H: "var(--steel)", A: "var(--steel-soft)", "-": "var(--paper-2)" };
  var VENUE_FG = { H: "var(--panel)", A: "var(--panel)", "-": "var(--ink-faint)" };
  var VISIBLE_DAYS = 30;

  // marks the SECOND of two consecutive same-venue games (skipping off days
  // in between) as a "break" cell -- same definition verify.py uses
  // (see data/league-fixture.json bake: recomputed totals match exactly).
  function breakFlags(row) {
    var flags = new Array(row.length).fill(false);
    var lastVenue = null,
      lastIdx = -1;
    for (var i = 0; i < row.length; i++) {
      var v = row[i];
      if (v === "-") continue;
      if (lastVenue !== null && v === lastVenue) flags[i] = true;
      lastVenue = v;
      lastIdx = i;
    }
    return flags;
  }

  function buildCalendar(grid, teams, days) {
    var numDays = Math.min(VISIBLE_DAYS, days.length);
    var html = '<table class="gridtable"><thead><tr><th class="rowhead" scope="col">팀</th>';
    for (var d = 0; d < numDays; d++) {
      html += '<th scope="col">' + (d + 1) + "</th>";
    }
    html += "</tr></thead><tbody>";
    for (var t = 0; t < teams.length; t++) {
      var flags = breakFlags(grid[t]);
      html += '<tr><th class="rowhead" scope="row">' + teams[t].name + "</th>";
      for (var d2 = 0; d2 < numDays; d2++) {
        var venue = grid[t][d2];
        var isBreak = flags[d2];
        var style =
          "background:" +
          VENUE_BG[venue] +
          ";color:" +
          VENUE_FG[venue] +
          (isBreak ? ";outline:2px solid var(--signal-deep);outline-offset:-2px;" : "");
        html +=
          '<td><div class="gcell" style="' +
          style +
          '" title="' +
          teams[t].name +
          " · " +
          days[d2] +
          " · " +
          VENUE_LABEL[venue] +
          (isBreak ? " · breaks" : "") +
          '">' +
          (venue === "-" ? "" : venue) +
          "</div></td>";
      }
      html += "</tr>";
    }
    html += "</tbody></table>";
    return html;
  }

  function render() {
    var d = STATE.data;
    var key = STATE.strongOn ? "strong" : "weak";
    var run = d.runs[key];
    var other = d.runs[STATE.strongOn ? "weak" : "strong"];

    document.getElementById("leagueWeightLabel").textContent = STATE.strongOn
      ? "breaks 페널티 강함 (가중치 1000)"
      : "breaks 페널티 약함 (가중치 50)";

    var statsEl = document.getElementById("leagueStats");
    statsEl.innerHTML =
      '<div class="stat"><div class="stat__label">breaks 총합</div>' +
      '<div class="stat__value ' +
      (run.breaks_total <= other.breaks_total ? "good" : "bad") +
      '">' +
      run.breaks_total +
      "건</div><div class=\"stat__sub\">다른 쪽은 " +
      other.breaks_total +
      "건</div></div>" +
      '<div class="stat"><div class="stat__label">총 이동거리</div>' +
      '<div class="stat__value">' +
      run.total_travel_km.toLocaleString("ko-KR") +
      "km</div><div class=\"stat__sub\">breaks를 줄이면 이동거리가 늘어나는 트레이드오프</div></div>" +
      '<div class="stat"><div class="stat__label">최대 연속 홈/원정</div>' +
      '<div class="stat__value">' +
      run.max_consecutive_run_seen +
      "연속</div><div class=\"stat__sub\">상한 " +
      d.meta.max_consecutive_break +
      "연속</div></div>";

    document.getElementById("leagueGridWrap").innerHTML = buildCalendar(run.grid, d.teams, d.days);

    var breaksDelta = other.breaks_total - run.breaks_total;
    var travelDelta = run.total_travel_km - other.total_travel_km;
    document.getElementById("leagueConclusion").innerHTML = STATE.strongOn
      ? "페널티 가중치를 50에서 1000으로 올리면 breaks가 " +
        other.breaks_total +
        "건에서 " +
        run.breaks_total +
        "건으로 <b>" +
        breaksDelta +
        "건 줄지만</b>, 총 이동거리는 " +
        other.total_travel_km.toLocaleString("ko-KR") +
        "km에서 " +
        run.total_travel_km.toLocaleString("ko-KR") +
        "km로 <b>+" +
        travelDelta.toLocaleString("ko-KR") +
        "km</b> 늘어납니다. 연속 홈/원정을 줄이는 대가는 팀들이 더 멀리 이동하는 일정입니다."
      : "지금은 breaks 페널티가 약합니다(가중치 50). 이 조건에서는 이동거리가 " +
        run.total_travel_km.toLocaleString("ko-KR") +
        "km로 짧은 대신, breaks가 " +
        run.breaks_total +
        "건으로 많습니다. 토글을 켜서 페널티를 강하게 주면 breaks가 " +
        other.breaks_total +
        "건으로 줄어드는 것을 볼 수 있습니다.";

    document.getElementById("leagueHonestText").textContent =
      "이 결과는 " +
      d.meta.num_teams +
      "개 팀 · " +
      d.meta.total_games +
      "경기 · " +
      d.days.length +
      "일 일정을 OR-Tools CP-SAT로 실제로 풀어 얻었습니다(w_travel=1 고정, w_break만 50→1000). 정확한 최적해가 아니라 FEASIBLE(제한시간 60초 내 실행 가능해)이므로, 더 오래 돌리면 두 쪽 다 더 나아질 여지가 있습니다. 팀 이름은 전부 가상의 이름이며 실제 리그·구단과 무관합니다.";
  }

  window.DECISION_OS_TABS = window.DECISION_OS_TABS || {};
  window.DECISION_OS_TABS.league = function () {
    fetch("data/league-fixture.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        STATE.data = data;
        render();
        document.getElementById("leagueWeightToggle").addEventListener("change", function (evt) {
          STATE.strongOn = evt.target.checked;
          render();
        });
      })
      .catch(function (err) {
        document.getElementById("leagueGridWrap").textContent = "데이터를 불러오지 못했습니다: " + err;
      });
  };
})();
