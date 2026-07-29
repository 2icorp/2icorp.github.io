/* 2i Case 13 imaging loop replay. Static: reads window.RUN_DATA. */
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
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = v => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(2));

  $("banner").textContent = "연구용 데모 · 합성 팬텀 · 환자 데이터 아님 · 의료기기 아님 · 임상 의사결정 사용 불가";
  $("stat-base").textContent = D.baseline_score.toFixed(2);
  $("stat-final").textContent = D.final_score.toFixed(2);
  $("stat-status").textContent =
    D.status === "gates_passed" ? "전 게이트 통과"
      : D.status === "exhausted" ? "레버 소진 (미달 게이트 정직 보고)" : D.status;
  $("disclaimer").textContent = D.disclaimer;
  $("legend").innerHTML = D.legend.map(l =>
    `<span class="legend-item"><i class="sw" style="background:${l.color}"></i>${l.name}</span>`).join("");

  const stepsEl = $("steps");
  iters.forEach((r, i) => {
    const b = document.createElement("button");
    b.className = "step " + r.status;
    b.textContent = r.iteration === 0 ? "기준" : `#${r.iteration} ${r.patch ? r.patch.operation : ""}`;
    b.title = r.patch ? r.patch.reason : "파라미터 조정 전 기본 분할";
    b.addEventListener("click", () => show(i));
    stepsEl.appendChild(b);
  });

  const PLANES = [["axial", "축상 (axial)"], ["coronal", "관상 (coronal)"], ["sagittal", "시상 (sagittal)"]];

  function show(i) {
    cur = i;
    const r = iters[i];
    $("view-title").textContent = r.iteration === 0
      ? "3면 캡처 · 기준 분할" : `3면 캡처 · 반복 ${r.iteration} (${r.status === "accepted" ? "패치 수용" : "패치 기각·롤백"})`;
    $("planes").innerHTML = PLANES.map(([k, label]) =>
      `<figure class="plane"><img src="${r.views[k]}" alt="${label} 캡처"><figcaption>${label}</figcaption></figure>`).join("");

    // per organ measurement table
    const rows = Object.entries(r.per_organ).map(([organ, d]) => {
      const acc = r.accuracy[organ] || {};
      const truth = D.true_volumes_ml[organ];
      return `<tr><td>${organ}</td><td>${d.components}</td><td>${d.edge_misalignment}</td>` +
        `<td>${d.volume_ml} mL</td><td class="muted">${truth} mL</td><td class="muted">${acc.dice}</td></tr>`;
    }).join("");
    $("organ-table").innerHTML =
      `<table><thead><tr><th>장기</th><th>성분</th><th>경계 불일치</th><th>측정 부피</th>` +
      `<th class="muted">실제 부피</th><th class="muted">Dice</th></tr></thead><tbody>${rows}</tbody></table>` +
      `<p class="note">회색 열은 검증용 정답 정보이며 루프의 목적함수에는 들어가지 않습니다.</p>`;

    const g = $("gates");
    g.innerHTML = "";
    r.gates.forEach(row => {
      const b0 = baseline.gates.find(x => x.key === row.key);
      const delta = b0 ? row.value - b0.value : 0;
      const div = document.createElement("div");
      div.className = "gate " + (row.pass ? "pass" : "fail");
      div.innerHTML = `<div class="gate-label">${row.label}</div>` +
        `<div class="gate-val">${fmt(row.value)}<small> ${row.unit}</small></div>` +
        `<div class="gate-target">허용 ${row.target}${row.unit} · ${row.pass ? "통과" : "미달"}</div>` +
        (i > 0 && delta !== 0 ? `<div class="gate-delta ${delta < 0 ? "down" : "up"}">기준 대비 ${delta < 0 ? "" : "+"}${fmt(delta)}</div>` : "");
      g.appendChild(div);
    });

    const a0 = baseline.accuracy.mean_dice, a1 = r.accuracy.mean_dice;
    $("accuracy").innerHTML =
      `<div class="acc-big">평균 Dice <b>${a1.toFixed(3)}</b>` +
      (i > 0 ? ` <span class="${a1 >= a0 ? "down" : "up"}">(기준 ${a0.toFixed(3)})</span>` : "") + `</div>` +
      `<p class="note">이 값은 루프가 보지 않습니다. 정답 없는 신호만으로 튜닝했을 때 실제 정확도가 어떻게 움직이는지 확인하기 위한 표시입니다.</p>`;

    const st = $("patch-status");
    st.className = "patch-status " + r.status;
    st.textContent = r.status === "baseline" ? "기준" : r.status === "accepted" ? "수용됨" : "롤백됨";
    const p = $("patch");
    if (!r.patch) {
      p.innerHTML = "<p>기본 파라미터로 돌린 첫 분할입니다. 크리틱이 품질 신호를 읽고 첫 패치를 제안합니다.</p>";
    } else {
      const led = ledgerByIter[r.iteration];
      let html = `<div class="patch-op">${esc(r.patch.operation)} → ${esc(r.patch.target)}</div>` +
        `<dl class="patch-kv"><dt>변경 전</dt><dd>${esc(JSON.stringify(r.patch.before))}</dd>` +
        `<dt>변경 후</dt><dd>${esc(JSON.stringify(r.patch.after))}</dd>` +
        `<dt>진단</dt><dd>${esc(r.patch.reason)}</dd>` +
        `<dt>기대 효과</dt><dd>${esc(r.patch.expected_effect)}</dd></dl>`;
      if (r.status === "rolled_back")
        html += `<div class="rollback-note">검증 실패: 품질 점수가 개선되지 않아 체크포인트로 롤백했습니다.${led && led.note ? " (" + esc(led.note) + ")" : ""}</div>`;
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
    $("spark").innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="반복별 품질 점수">` +
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
    }, 1600);
  });
  document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") show(Math.max(0, cur - 1));
    if (e.key === "ArrowRight") show(Math.min(iters.length - 1, cur + 1));
  });

  show(0);
})();
