# cases.html ↔ cases.json 복원 노트 (2026-07-31)

⚠️ **정본 워크스페이스는 다른 머신에 있다.** 이 복원본은 이 배포 클론(`cases.html`)만 보고
역설계한 것이라, 정본 워크스페이스의 `cases.json`/`render_cases.py`와 필드명·스키마가
다를 수 있다. 새 사례를 추가하기 전에 가능하면 정본 머신의 원본과 대조할 것.

## 절차

1. `parse_cases_html.py cases.html -o cases.json` — `cases.html`의 15개
   `<article class="case reveal" id="case-N">` 블록을 정규식으로 파싱해 `cases.json`(배열,
   15건) 생성.
2. `render_cases.py cases.json -o cases.regen.html` — `cases.json` → HTML 재생성. 상단
   head/nav/hero/ticker/2i 게이지 방식 섹션과 하단 CTA/footer는 케이스별로 달라지지 않으므로
   `cases.html`에서 그대로 캡처해 `render_cases.py` 안에 `PREFIX`/`SUFFIX` 상수로 박아뒀다
   (분리된 템플릿 파일을 만들지 않기 위해 — 지시된 산출 파일 목록을 지켰다). 15개 아티클
   블록만 `cases.json`에서 생성해 `PREFIX + "\n      ".join(articles) + SUFFIX`로 조립.
3. `diff cases.html cases.regen.html` → 검증.

## 왕복 검증 결과 — ⭐ 완전 일치

```
$ diff cases.html cases.regen.html
(출력 없음)
$ cmp cases.html cases.regen.html
(출력 없음 — byte-identical)
$ wc -c cases.html cases.regen.html
   83200 cases.html
   83200 cases.regen.html
```

두 파일 모두 83200바이트, `diff`/`cmp` 둘 다 차이 0. 정규화나 억지 맞춤 없이 첫 시도에서
바이트 단위로 일치했다.

## 스키마 매핑 표 (`cases.json`의 케이스 객체 1건)

| JSON 필드 | HTML 소스 | 비고 |
|---|---|---|
| `no` | `id="case-N"` / `<span class="case__no">NN</span>` | 표시 순번(1~15). 렌더 시 `{no:02d}`로 0패딩. **주의**: addendum json의 `no`(13, 14)와 다른 개념 — 아래 "특이사항" 참조 |
| `cat` | `<span class="case__cat">` | |
| `ind` | `<span class="case__ind">` | |
| `stkm_l` | `<span class="case__stkm-l">` | "문제의 대가" 라벨 |
| `stkm_v` | `<span class="case__stkm-v">` | "문제의 대가" 값 |
| `title` | `<h3 class="case__title">` | 원문 그대로(엔티티 `&quot;`/`&#x27;` 등 이스케이프 안 풀고 문자열째 보존) |
| `stakes` | `<p class="case__stakes">` | 동일 |
| `insight` | 1번째 `<div class="case__row">`의 `<p>` | 라벨(`통찰`)은 상수라 JSON에 안 담고 렌더러가 고정 출력 |
| `mechanism` | 2번째 `<div class="case__row">`의 `<p>` | 라벨(`2i의 방식`)도 상수 |
| `gates` | `<ol class="case__gates">` 내 `<li class="gate">` 3개 | `[{"name","what"}]`. 이름은 `측정/실증/이관 게이트`(항상 3개, 순서 고정) |
| `ba.rows` | `<div class="ba">` 내 `<div class="ba__row">` N개 | `[{"m","b","a"}]`. 화살표(`→`)는 상수라 미저장 |
| `so_what` | `<div class="case__sowhat">`의 `<p>` | 라벨(`그래서 무엇이 열리나`)도 상수 |
| `duration` | `<div class="case__facts">`의 첫 `<span class="chip">` | 소요기간 칩. 두 번째 칩(`정부 바우처 적합`)은 15건 전부 동일해 상수 처리, JSON 미저장 |
| `proof.code`/`.demo`/`.doc`/`.dl` | `<div class="case__proof">` 내 `<a>` 태그들 | 아래 "proof 구조" 참조 |
| `tech` | `<p class="case__tech">`에서 `사용 기술` 라벨 뒤 텍스트 | 라벨과 텍스트 사이 공백 1개는 렌더러가 고정 삽입 |

렌더러가 **상수로 하드코딩**하고 JSON에 담지 않는 것들(15건 전부 동일함을 직접 확인함):
- `case__row` 라벨: `통찰`, `2i의 방식`
- `case__sowhat` 라벨: `그래서 무엇이 열리나`
- `ba__head` 텍스트: `목표 지표 ` + `ba__note`: `· 실제 수치는 귀사 데이터로 재측정`
- `case__facts` 두 번째 칩: `정부 바우처 적합`
- `ba__arw` 화살표: `→`
- `case__tech-k` 라벨: `사용 기술`

### proof 구조 (케이스마다 다름 — 유일한 구조적 분기)

`case__proof`는 두 가지 모양 중 하나다:
1. **code+demo+dl** (14/15건, case-1~14): `<a chip--code>`(GitHub, `target="_blank"
   rel="noopener"`)와 `<a chip--demo>`(`/demos/...`)가 같은 줄에 붙어 있고, 다음 줄에
   `<a chip--dl>`(브로셔 PDF, `download` 속성).
2. **doc+dl** (1/15건, case-15만): `<a chip--doc>`(`/papers/....html`, target/rel 없음)가
   단독으로 첫 줄, 다음 줄에 `<a chip--dl>`.

JSON에는 `proof.code`/`proof.demo`/`proof.doc` 세 슬롯을 두고 안 쓰는 건 `null`, `proof.dl`은
항상 존재. 렌더러가 `code`/`demo`가 있으면 그 둘을 붙여 첫 줄, 없으면 `doc`만 첫 줄에 쓴다.

## 특이사항 (addendum json과 실제 `cases.html` 비교에서 발견 — 정직 보고)

`cases-addendum-13.json`/`cases-addendum-14.json`을 스키마 참고용으로 봤는데, 실제
`cases.html`은 그 두 파일의 내용을 **글자 그대로 반영하지 않았다**. 억지로 맞추지 않고
`cases.html`을 그라운드 트루스로 삼아 파싱했다. 발견한 불일치:

1. **`no` 필드가 표시 순번과 다르다**: `cases-addendum-13.json`은 `"no": 13`인데 그 내용은
   실제로 `case-15`(인프라·엣지 AI, GPU 없이 VLM 사례)로 렌더돼 있다. `cases-addendum-14.json`은
   `"no": 14`인데 그 내용은 `case-11`(대화형 에이전트 오케스트레이션, "부산 출장")에 더 가깝다.
   즉 addendum의 `no`는 case-N 표시 순번이 아니라 별개의(아마 작성 시점 기준) 식별자로 보인다.
   복원한 `cases.json`의 `no`는 **표시 순번(1~15)**으로 재정의했다 — 렌더 뱃지가 그 값을
   그대로 쓰기 때문에 이게 실제로 필요한 값이다.
2. **case-11과 addendum-14가 내용이 살짝 다르다(완전 동일 아님)**: 두 텍스트가 거의
   같지만(같은 주제 "부산 출장 준비해줘"), `insight`/`mechanism`/`ba.rows`/`facts` 등에서
   addendum-14가 더 풍부하다(문장 하나 더 있음, ba row 1개 더 있음, gate 이름에 `· N주` 소요기간
   포함). `cases-addendum-14.json`의 note는 "cases.html에는 case-14 아티클로 직접 반영됨"이라
   적혀 있지만, 실제로는 그 내용이 **case-14가 아니라 case-11 자리에, 그것도 구버전으로만**
   들어가 있다. addendum-14 병합이 이 배포 클론에는 완전히 반영되지 않은 것으로 보인다.
3. **`gates[].name`의 `· N주` 소요기간 접미사가 실제 렌더에는 없다**: addendum json은
   `"측정 게이트 · 2주"`처럼 기간을 이름에 붙이지만, `cases.html`에는 어느 케이스든
   `측정 게이트`/`실증 게이트`/`이관 게이트`로 접미사 없이 나온다. 복원한 `cases.json`도
   접미사 없는 실제 렌더값을 그대로 담았다.
4. **`ba.head`가 addendum과 다르다**: `cases-addendum-13.json`은 case-15용으로
   `"head": "실측 지표"`를 쓰지만 실제 `cases.html`은 15건 전부(15번 포함) `목표 지표`로
   렌더돼 있다.
5. **구분자 스타일이 다르다**: addendum json은 여러 항목을 `/`로 구분하는 곳이 있는데
   (예: `"소비자용 Mac 1대 (이미지/프레임 기준)"`, `"스트리밍/이미지 스코프"`) 실제
   `cases.html`은 같은 자리에 가운뎃점 `·`를 쓴다(`이미지·프레임`, `스트리밍과 이미지`).
6. **addendum의 `facts`(불릿 배열)·`tech_note`·`demo`·`note` 필드는 `cases.html`에 대응
   하는 별도 UI 요소가 없다**: `case__facts`라는 클래스명은 addendum의 `facts`와 이름만
   같을 뿐 실제로는 기간 칩 + 바우처 칩 2개만 담는 다른 개념이다. addendum의 `facts` 불릿
   내용(스코프 고지 등)은 case-15에서는 `case__tech` 문단 끝에 산문으로 풀어 붙어 있다.
   이 정보 손실 없이 그대로 두려면 `cases.json`의 `tech` 필드가 이미 그 문장을 포함한다
   (파싱이 있는 그대로 캡처했으므로 손실 없음).

결론: `cases-addendum-*.json`은 **미래/제안 스키마의 스냅샷**이고, 실제 배포된 `cases.html`은
그보다 단순하고 약간 다른 값으로 렌더돼 있다. 이번 복원은 **실제 배포본을 정확히 재현하는 것**을
우선했고, addendum 스키마와의 불일치는 억지로 지우거나 통일하지 않고 위처럼 기록만 했다.

## 새 사례를 추가하려면

1. `cases.json`을 읽어 마지막 항목의 `no`(=현재 15)를 확인하고, 새 케이스 dict를 위 스키마
   그대로 배열 끝에 append한다(`no`는 16, `id="case-16"`이 되도록). 순서를 바꾸고 싶으면
   배열 내 위치를 옮기면 된다 — 렌더러는 `no`가 아니라 **배열 순서**로 표시 뱃지를 매기지
   않고 `no` 필드값을 그대로 뱃지에 쓰므로, 배열 순서와 `no` 값을 일치시켜야 한다(0패딩
   2자리로 표시됨, 16 이상이면 `case__no`가 3자리 이상이 안 되게 표기 방식을 다시 점검할 것 —
   현재 렌더러는 `{no:02d}`라 16이면 `16`으로 정상 출력되지만 100 이상은 고려 안 됨).
   `proof`는 code+demo+dl 조합(GitHub 레포·라이브 데모·브로셔 PDF)이 기본형이고, 논문형
   증거만 있으면 case-15처럼 `doc`만 채우고 `code`/`demo`는 `null`로 둔다.
2. `python3 render_cases.py cases.json -o cases.html`로 **직접 `cases.html`에 렌더**한다
   (또는 `-o`로 임시 파일에 렌더해 diff 검토 후 `cases.html`로 옮긴다 — 이 복원 작업 중엔
   `cases.html`을 건드리지 말라는 지시가 있었으므로 이번엔 `cases.regen.html`에만 썼다).
3. 브로셔 PDF(`brochures/2i-brochure-NN-....pdf`)와 라이브 데모 디렉터리(`demos/NN-.../`)가
   실제로 존재하는지 확인 — 렌더러는 링크 문자열만 만들 뿐 파일 존재를 검증하지 않는다.
4. `diff` 대신 육안으로 새 아티클 블록이 기존 15개와 같은 구조(헤더 순서·클래스명·들여쓰기)로
   나왔는지 확인한다. 정본 워크스페이스가 있다면 거기서도 같은 `no`로 병합해 두 워크스페이스가
   갈라지지 않게 한다.
