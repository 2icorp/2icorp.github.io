/* 2i Case 14 loop replay viewer. Pure static: reads window.RUN_DATA. */
(function () {
  "use strict";
  const D = window.RUN_DATA;
  if (!D) { document.body.innerHTML = "<p style='padding:2rem'>run_data.js 없음. run_demo.py를 먼저 실행하세요.</p>"; return; }

  const iters = D.iterations;
  const baseline = iters[0];
  const ledgerByIter = {};
  (D.ledger || []).forEach(e => { ledgerByIter[e.iteration] = e; });

  let cur = 0;
  let playing = null;

  const $ = id => document.getElementById(id);

  // header
  $("stat-base").textContent = D.baseline_score.toFixed(2);
  $("stat-final").textContent = D.final_score.toFixed(2);
  $("stat-status").textContent = D.status === "gates_passed"
    ? "전 게이트 통과" : D.status;
  $("disclaimer").textContent = D.disclaimer;

  // timeline steps
  const stepsEl = $("steps");
  iters.forEach((r, i) => {
    const b = document.createElement("button");
    b.className = "step " + r.status;
    b.textContent = r.iteration === 0
      ? "기준"
      : `#${r.iteration} ${r.patch ? r.patch.operation : ""}`;
    b.title = r.patch ? r.patch.reason : "패치 적용 전 기준 상태";
    b.addEventListener("click", () => show(i));
    stepsEl.appendChild(b);
  });

  function fmt(v) {
    return Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1);
  }

  function show(i) {
    cur = i;
    const r = iters[i];

    $("floor-title").textContent = r.iteration === 0
      ? "평면도 · 기준 상태 (혼잡 노출)"
      : `평면도 · 반복 ${r.iteration} (${r.status === "accepted" ? "패치 수용" : "패치 기각·롤백"})`;
    $("floor-svg").innerHTML = r.svg;

    // gates
    const g = $("gates");
    g.innerHTML = "";
    r.gates.forEach(row => {
      const b0 = baseline.gates.find(x => x.key === row.key);
      const delta = b0 ? row.value - b0.value : 0;
      const div = document.createElement("div");
      div.className = "gate " + (row.pass ? "pass" : "fail");
      div.innerHTML =
        `<div class="gate-label">${row.label}</div>` +
        `<div class="gate-val">${fmt(row.value)}<small> ${row.unit}</small></div>` +
        `<div class="gate-target">게이트 ${row.target}${row.unit} · ${row.pass ? "통과" : "미달"}</div>` +
        (i > 0 ? `<div class="gate-delta ${delta <= 0 ? "down" : "up"}">기준 대비 ${delta <= 0 ? "" : "+"}${fmt(delta)}</div>` : "");
      g.appendChild(div);
    });

    // patch detail
    const st = $("patch-status");
    st.className = "patch-status " + r.status;
    st.textContent = r.status === "baseline" ? "기준 상태"
      : r.status === "accepted" ? "수용됨" : "롤백됨";
    const p = $("patch");
    if (!r.patch) {
      p.innerHTML = "<p>패치 적용 전 기준 상태입니다. 크리틱이 게이트 위반을 진단하고 첫 패치를 제안합니다.</p>";
    } else {
      const led = ledgerByIter[r.iteration];
      let html =
        `<div class="patch-op">${r.patch.operation} → ${r.patch.target}</div>` +
        `<dl class="patch-kv">` +
        `<dt>변경 전</dt><dd>${escapeHtml(String(r.patch.before))}</dd>` +
        `<dt>변경 후</dt><dd>${escapeHtml(String(r.patch.after))}</dd>` +
        `<dt>진단</dt><dd>${escapeHtml(r.patch.reason)}</dd>` +
        `<dt>기대 효과</dt><dd>${escapeHtml(r.patch.expected_effect)}</dd>` +
        `</dl>`;
      if (r.status === "rolled_back" && led && led.metrics_after) {
        html += `<div class="rollback-note">검증 실패: 적용 시 게이트 점수가 개선되지 않아 체크포인트로 롤백했습니다. (${escapeHtml(led.note || "")})</div>`;
      }
      p.innerHTML = html;
    }

    // sparkline + active step
    drawSpark(i);
    [...stepsEl.children].forEach((el, k) => el.classList.toggle("active", k === i));
  }

  function drawSpark(activeIdx) {
    const w = 800, h = 72, pad = 8;
    const scores = iters.map(r => r.score);
    const maxS = Math.max(...scores, 0.001);
    const x = i => pad + (w - 2 * pad) * (iters.length === 1 ? 0 : i / (iters.length - 1));
    const y = s => h - pad - (h - 2 * pad) * (s / maxS);
    let path = "";
    iters.forEach((r, i) => { path += (i === 0 ? "M" : "L") + x(i).toFixed(1) + " " + y(r.score).toFixed(1) + " "; });
    let dots = "";
    iters.forEach((r, i) => {
      const c = r.status === "rolled_back" ? "var(--bad)" : (i === 0 ? "var(--ink-2)" : "var(--good)");
      const rr = i === activeIdx ? 5 : 3;
      dots += `<circle cx="${x(i).toFixed(1)}" cy="${y(r.score).toFixed(1)}" r="${rr}" fill="${c}"></circle>`;
    });
    $("spark").innerHTML =
      `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="반복별 게이트 점수">` +
      `<line x1="${pad}" y1="${y(0)}" x2="${w - pad}" y2="${y(0)}" stroke="var(--line)" stroke-dasharray="4 4"/>` +
      `<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/>` + dots + `</svg>`;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // controls
  $("btn-prev").addEventListener("click", () => show(Math.max(0, cur - 1)));
  $("btn-next").addEventListener("click", () => show(Math.min(iters.length - 1, cur + 1)));
  $("btn-play").addEventListener("click", function () {
    if (playing) { clearInterval(playing); playing = null; this.textContent = "▶ 재생"; return; }
    if (cur >= iters.length - 1) show(0);
    this.textContent = "❚❚ 정지";
    playing = setInterval(() => {
      if (cur >= iters.length - 1) {
        clearInterval(playing); playing = null; $("btn-play").textContent = "▶ 재생";
        return;
      }
      show(cur + 1);
    }, 1400);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") show(Math.max(0, cur - 1));
    if (e.key === "ArrowRight") show(Math.min(iters.length - 1, cur + 1));
  });

  show(0);
})();
