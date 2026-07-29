/* 2i Case 12 blockout loop replay. Static: reads window.RUN_DATA. */
(function () {
  "use strict";
  const D = window.RUN_DATA;
  if (!D) { document.body.innerHTML = "<p style='padding:2rem'>run_data.js 없음. run_demo.py를 먼저 실행하세요.</p>"; return; }

  const iters = D.iterations;
  const baseline = iters[0];
  const ledgerByIter = {};
  (D.ledger || []).forEach(e => { ledgerByIter[e.iteration] = e; });
  let cur = 0, playing = null;
  const $ = id => document.getElementById(id);

  $("stat-base").textContent = D.baseline_score.toFixed(2);
  $("stat-final").textContent = D.final_score.toFixed(2);
  $("stat-status").textContent = D.status === "gates_passed" ? "전 게이트 통과" : D.status;
  $("disclaimer").textContent = D.disclaimer;

  const stepsEl = $("steps");
  iters.forEach((r, i) => {
    const b = document.createElement("button");
    b.className = "step " + r.status;
    b.textContent = r.iteration === 0 ? "기준" : `#${r.iteration} ${r.patch ? r.patch.operation : ""}`;
    b.title = r.patch ? r.patch.reason : "패치 적용 전 초안";
    b.addEventListener("click", () => show(i));
    stepsEl.appendChild(b);
  });

  const fmt = v => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function show(i) {
    cur = i;
    const r = iters[i];
    $("plan-title").textContent = r.iteration === 0
      ? "평면도 · 기준 blockout (급조 초안)"
      : `평면도 · 반복 ${r.iteration} (${r.status === "accepted" ? "패치 수용" : "패치 기각·롤백"})`;
    $("plan-svg").innerHTML = r.svg;

    // violation detail
    const d = r.detail || {};
    const chunks = [];
    if (d.area && d.area.length)
      chunks.push(`<b>면적 미달</b> ` + d.area.map(x => `${x.room} ${x.area}/${x.required}m2`).join(", "));
    if (d.daylight && d.daylight.length)
      chunks.push(`<b>일조 심도 초과</b> ` + d.daylight.map(x => `${x.room} ${x.depth}m > ${x.limit}m`).join(", "));
    if (d.egress && d.egress.length)
      chunks.push(`<b>피난거리 초과</b> ` + d.egress.map(x => `${x.room} ${x.dist}m > ${x.limit}m`).join(", "));
    if (d.overlap && d.overlap.length)
      chunks.push(`<b>실 간섭</b> ` + d.overlap.map(x => `${x.a}-${x.b} ${x.area}m2`).join(", "));
    if (d.grid && d.grid.length)
      chunks.push(`<b>모듈 이탈</b> ` + d.grid.map(x => `${x.room} ${x.offset}m`).join(", "));
    $("violations").innerHTML = chunks.length
      ? chunks.map(c => `<div class="viol">${c}</div>`).join("")
      : `<div class="viol ok">위반 없음. 유효 실면적 합계 ${r.net_area} m2</div>`;

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
        `<div class="gate-target">허용 ${row.target}${row.unit} · ${row.pass ? "통과" : "미달"}</div>` +
        (i > 0 && delta !== 0 ? `<div class="gate-delta ${delta < 0 ? "down" : "up"}">기준 대비 ${delta < 0 ? "" : "+"}${fmt(delta)}</div>` : "");
      g.appendChild(div);
    });

    // patch
    const st = $("patch-status");
    st.className = "patch-status " + r.status;
    st.textContent = r.status === "baseline" ? "초안" : r.status === "accepted" ? "수용됨" : "롤백됨";
    const p = $("patch");
    if (!r.patch) {
      p.innerHTML = "<p>요구 스펙에서 뽑은 첫 blockout입니다. 크리틱이 기하 위반을 진단하고 첫 패치를 제안합니다.</p>";
    } else {
      const led = ledgerByIter[r.iteration];
      let html = `<div class="patch-op">${esc(r.patch.operation)} → ${esc(r.patch.target)}</div>` +
        `<dl class="patch-kv">` +
        `<dt>변경 전</dt><dd>${esc(JSON.stringify(r.patch.before))}</dd>` +
        `<dt>변경 후</dt><dd>${esc(JSON.stringify(r.patch.after))}</dd>` +
        `<dt>진단</dt><dd>${esc(r.patch.reason)}</dd>` +
        `<dt>기대 효과</dt><dd>${esc(r.patch.expected_effect)}</dd></dl>`;
      if (r.status === "rolled_back")
        html += `<div class="rollback-note">검증 실패: 게이트 점수가 개선되지 않아 체크포인트로 롤백했습니다.${led && led.note ? " (" + esc(led.note) + ")" : ""}</div>`;
      p.innerHTML = html;
    }

    drawSpark(i);
    [...stepsEl.children].forEach((el, k) => el.classList.toggle("active", k === i));
  }

  function drawSpark(activeIdx) {
    const w = 800, h = 72, pad = 8;
    const maxS = Math.max(...iters.map(r => r.score), 0.001);
    const x = i => pad + (w - 2 * pad) * (iters.length === 1 ? 0 : i / (iters.length - 1));
    const y = s => h - pad - (h - 2 * pad) * (s / maxS);
    let path = "", dots = "";
    iters.forEach((r, i) => {
      path += (i === 0 ? "M" : "L") + x(i).toFixed(1) + " " + y(r.score).toFixed(1) + " ";
      const c = r.status === "rolled_back" ? "var(--bad)" : (i === 0 ? "var(--ink-2)" : "var(--good)");
      dots += `<circle cx="${x(i).toFixed(1)}" cy="${y(r.score).toFixed(1)}" r="${i === activeIdx ? 5 : 3}" fill="${c}"></circle>`;
    });
    $("spark").innerHTML =
      `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="반복별 게이트 점수">` +
      `<line x1="${pad}" y1="${y(0)}" x2="${w - pad}" y2="${y(0)}" stroke="var(--line)" stroke-dasharray="4 4"/>` +
      `<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/>${dots}</svg>`;
  }

  $("btn-prev").addEventListener("click", () => show(Math.max(0, cur - 1)));
  $("btn-next").addEventListener("click", () => show(Math.min(iters.length - 1, cur + 1)));
  $("btn-play").addEventListener("click", function () {
    if (playing) { clearInterval(playing); playing = null; this.textContent = "▶ 재생"; return; }
    if (cur >= iters.length - 1) show(0);
    this.textContent = "❚❚ 정지";
    playing = setInterval(() => {
      if (cur >= iters.length - 1) { clearInterval(playing); playing = null; $("btn-play").textContent = "▶ 재생"; return; }
      show(cur + 1);
    }, 1500);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") show(Math.max(0, cur - 1));
    if (e.key === "ArrowRight") show(Math.min(iters.length - 1, cur + 1));
  });

  show(0);
})();
