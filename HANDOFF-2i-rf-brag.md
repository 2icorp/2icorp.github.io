# Handoff: RF 신호지능 역량 섹션 추가 (2i-rf-brag)

이 클론(`ax-relaunch` → `main`)에서 직접 편집됨. **canonical `site-new/` 소스는 이 머신에 없어서
반영 못 함** — 다른 머신에서 `site-new/index.html`과 `cases.json`(케이스 06)에 아래를 그대로
이식해야 다음 `render_papers.py`/`render_cases.py` 재실행 시 이 내용이 덮어써지지 않는다.

## 1. index.html — 신규 섹션 `#capability` (자동화 섹션 뒤, 창업자 섹션 앞에 삽입)

원본 위치: `AUTOMATION` 섹션(`</section>`) 직후, `FOUNDER` 섹션(`<!-- FOUNDER -->`) 직전.
클래스는 `section`(alt 아님) — 앞뒤로 `founder`가 이미 `section--alt`라 두 alt가 연속되는
걸 피하려고 plain으로 뒀다.

```html
<!-- CAPABILITY: RF SIGNAL INTELLIGENCE -->
<section class="section" id="capability">
  <div class="wrap">
    <div class="section__head reveal">
      <span class="eyebrow">보유 기술 · 증거 기반 역량</span>
      <h2>무선 신호지능, 모르는 신호를 걸러내는 능력으로 증명합니다.</h2>
      <p>사례 06(공장 무선 간섭 진단)의 기반 엔진을 자체 벤치마크로 실측했습니다. 닫힌 목록 안에서 맞히는 정확도가 아니라 <b>본 적 없는 신호원을 거절하는 능력(open-set)</b>을 정면으로 재고, GPU 없이 현장 엣지·폐쇄망에서 그대로 구동합니다.</p>
    </div>

    <div class="rf-grid reveal stagger">
      <div class="rf-cell rf-cell--lead">
        <span class="rf-metric">0.945</span>
        <span class="rf-unit">AUROC</span>
        <span class="rf-name">미지 신호원 오픈셋 식별</span>
        <span class="rf-desc">다중 패킷 융합으로 미지 신호원 거부율 100%. 상업 검증선(AUROC 0.85)은 신호원 20개 규모에서 이미 넘겼습니다.</span>
        <span class="chip chip--v">공개 데이터 실측 · WiSig, K=50</span>
      </div>
      <div class="rf-cell">
        <span class="rf-name">실시간 Rust 엔진</span>
        <span class="rf-desc">C-ABI 네이티브 구현으로 GPU 없이 엣지에서 구동합니다. 온프렘·폐쇄망 배치가 기본값입니다.</span>
      </div>
      <div class="rf-cell">
        <span class="rf-name">간섭 · 이상신호 실시간 탐지</span>
        <span class="rf-desc">CFAR 검출 + robust-hash 지문 매칭. 사례 06 무선 간섭 진단의 코어 엔진입니다.</span>
      </div>
      <div class="rf-cell">
        <span class="rf-name">변조 자동분류(AMC)</span>
        <span class="rf-desc">고전 큐뮬런트 기반 무학습 분류. 합성 4-class 벤치마크 정확도 0.99 (5dB 기준).</span>
      </div>
      <div class="rf-cell">
        <span class="rf-name">9단계 수신기 파이프라인</span>
        <span class="rf-desc">물리 기반 신호 처리 9단계 중 7단계를 정량 실측으로 검증했습니다.</span>
      </div>
      <div class="rf-cell rf-cell--pending">
        <span class="rf-name">다음 단계</span>
        <span class="rf-desc">학습형 지문 백본·재밍 강건성: 실험 진행 중.</span>
        <!-- TODO(update-after-experiments): ECAPA 학습형 지문 0.96+ 목표 / anti-jam 강건성 곡선 / 데이터-스케일 결과 -->
      </div>
    </div>

    <p class="auto-foot reveal">왜 자랑할 만한가: 닫힌 목록 안에서 맞히는 정확도는 쉽습니다. 2i 엔진은 <b>본 적 없는 신호를 거절</b>하는 지표를 정면으로 측정했고, 딥러닝 없이도 상업 검증선을 넘었으며, 폐쇄망·GPU 미보유 현장에도 그대로 들어갑니다.</p>
  </div>
</section>
```

CSS 추가 (`styles.css`, `/* brochure download chip + voucher process */` 주석 직전에 삽입, `.auto-grid`
패턴 재사용):

```css
/* ============ RF SIGNAL INTELLIGENCE CAPABILITY ============ */
.rf-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
@media (max-width: 900px) { .rf-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .rf-grid { grid-template-columns: 1fr; } }
.rf-cell { background: var(--panel); padding: 1.6rem 1.4rem; display: flex; flex-direction: column; gap: 0.4rem; transition: background var(--dur) var(--ease); }
.rf-cell:hover { background: var(--paper); }
.rf-cell--lead { grid-column: span 2; background: oklch(97% 0.02 60); }
@media (max-width: 900px) { .rf-cell--lead { grid-column: 1 / -1; } }
.rf-metric { font-family: var(--mono); font-weight: 600; font-size: clamp(2rem, 1rem + 3vw, 3rem); color: var(--signal-deep); line-height: 1; }
.rf-unit { font-family: var(--mono); font-size: var(--text-xs); letter-spacing: 0.08em; color: var(--ink-faint); text-transform: uppercase; }
.rf-name { font-weight: 850; font-size: 1.05rem; letter-spacing: -0.02em; margin-top: 0.2rem; }
.rf-desc { font-size: 0.9rem; color: var(--ink-soft); }
.rf-cell--lead .rf-desc { max-width: 52ch; }
.rf-cell--pending { background: var(--paper-2); }
.rf-cell--pending .rf-desc { color: var(--ink-faint); font-style: italic; }
```

`index.html`(및 `about.html`/`cases.html`/`papers.html`/`privacy.html`/`en/index.html`)의
`styles.css?v=5` → `styles.css?v=6` 캐시버스트도 같이 올렸다(신규 CSS가 캐시로 안 씹히게).

## 2. cases.html / cases.json — 케이스 06 (sigprint-rf) 한 줄 추가

`cases.json`의 케이스 06 `mechanism`(2i의 방식) 필드 끝에 아래 문장을 그대로 덧붙인다.
customer-projection 수치(`before_after`/`목표(귀사 데이터로 재측정)`)는 손대지 않았다 —
이 한 줄만 "공개 데이터 실측"으로 별도 표시.

기존 마지막 문장: `...동일 지문 방식을 설비 음향·진동 이상탐지로도 확장할 수 있습니다.`

추가 문장: `같은 엔진은 공개 데이터 실측(WiSig)에서 본 적 없는 신호원을 거절하는 오픈셋 식별
AUROC 0.945를 기록했습니다.`

렌더된 `cases.html`에서는 `id="case-6"` 안 `case__row` 중 `case__k`가 "2i의 방식"인 문단
끝에 위 문장이 붙어 있다(`render_cases.py`가 `mechanism` 필드를 그대로 이 문단에 꽂으므로
`cases.json`만 고치면 재생성 시 유지된다).

## 왜 이 노트가 필요한가

이 클론(`site/` = `2icorp-site-clone`)은 배포 클론이라 `render_papers.py`/`render_cases.py`를
다시 돌리면 `site-new/`에서 복사해온 파일로 덮어쓴다. `site-new/index.html`과 `cases.json`
케이스 06에 위 내용을 이식하지 않으면, 다음 정본 재생성 때 이번 RF 역량 섹션과 케이스 06 한 줄이
사라진다.

---

## 3. 후속 추가 (2026-07-27, 같은 세션) — index.html `#applications` 섹션

`#capability` 섹션 바로 뒤(창업자 섹션 앞)에 "활용 분야 · 버티컬 확장" 섹션을 추가했다.
같은 이유로 `site-new/index.html`에도 이식 필요.

### 배치
`</section>`(capability 닫힘) 직후, `<!-- FOUNDER -->` 직전. 클래스는 `section`(plain) —
capability도 plain이라 두 섹션이 이어지고, 바로 다음 founder가 `section--alt`라 거기서
배경이 갈린다.

### 콘텐츠 요지 (전문은 이 클론의 `index.html` `id="applications"` 참조)
- 리드 문장: "하나의 RF 신호지능 엔진이 산업을 가로질러 확장됩니다. 아래는 성숙도를 정직하게
  표시한 적용 지도입니다."
- 성숙도 태그 3종(범례 `.mlegend`): `mtag--demo`(실증) · `mtag--extend`(확장) · `mtag--research`(연구).
  새 색 토큰 추가 없음 — 기존 `--signal`/`--ok`/`--steel`을 `color-mix(in oklab, var(--X) N%,
  transparent)`로 재사용(papers.html `.pcard__cat` 패턴과 동일 기법).
- `.topfit-grid`(TOP 6 하이라이트, `.auto-grid`/`.rf-grid` 3열 패턴 재사용): 미등록 IoT 기기 탐지(확장) ·
  드론 RF 탐지·식별(연구) · 병원 무선 간섭 모니터링(확장) · 비접촉 바이탈 센싱(연구) ·
  사설5G 헬스 모니터링(확장) · 차량 키포브 보안(연구).
- `.vert-groups` 5개 `.vgroup`(생활·스마트홈 IoT / 의료·헬스케어 / 산업·제조 / 보안·방위(일반 역량) /
  기타 유망): 각 항목이 `.vitem`(제목+설명+태그) 행. 사례06 코어 엔진 항목만 `실증` 태그(나머지는
  `확장` 또는 `연구`) — 날조 수치 없음, 전부 정성 서술.
- ⚠️ **보안·방위 항목은 "미지 신호원 식별·스펙트럼 상황인식"·"드론 RF 탐지·식별"만, 기관명·
  무기체계·특정 군 프로그램 언급 0.** 초안에 "특정 기관·무기체계와 무관한"이라는 방어적 문구를
  넣었다가 그 문구 자체가 `무기체계` 단어를 포함해 게이트에 걸림 → 문구를 완전히 제거하고
  "스펙트럼 감시용 범용 역량으로 확장합니다"로 대체. **이식 시 이 표현을 그대로 쓸 것** —
  "무관하다"고 방어적으로 설명하려 하면 그 설명 자체가 금지어를 담게 되는 함정이 있다.
- 마무리 한 줄 + TODO 주석: `<!-- TODO(update-after-experiments): 버티컬별 파일럿 진행 시 태그를
  실증으로 갱신 / 정량 지표 확보 시 목표 수치 대체 -->` + "이 지도는 영업 약속이 아니라 정직한
  로드맵입니다. '확장'·'연구' 태그가 붙은 항목은 귀사 데이터로 실증하는 PoC 단계부터
  시작합니다."

### styles.css 추가분
`/* ============ APPLICATIONS / VERTICAL EXPANSION MAP ============ */` 블록(`.mtag*`,
`.mlegend`, `.topfit-grid`/`.topfit*`, `.vert-groups`/`.vgroup*`/`.vitem*`) — `.rf-cell--pending`
규칙 직후, "brochure download chip" 주석 직전에 위치. 새 oklch 색상 토큰 없음, 전부 기존
`--steel`/`--ok`/`--signal`/`--signal-deep`/`--ink-*`/`--line*` 재사용.

캐시버스트 `styles.css?v=6` → `?v=7`도 6개 페이지 전부에 같이 올렸다.

### 게이트/배포
- 신원 게이트: 0. em/en-dash: 0. 군사/기관 게이트(국방/방산/ADD/한화/SEI/EW/전자전/SIGINT/
  무기체계/무기/counter-drone/weapon): 0 (위 함정 수정 후).
- 커밋 `80d4cf8`(ax-relaunch, author `2i`) → 병합 `e477772`(main, author `2i`) → 라이브 확인
  완료(`curl https://2icorp.github.io/` → `id="applications"` 존재, 14개 `vitem__t`, 신원/군사
  키워드 0, dash 0).
