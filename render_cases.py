#!/usr/bin/env python3
"""Render cases.json back into cases.html.

Inverse of parse_cases_html.py. The static shell (head/nav/hero/ticker/method
section at the top, CTA/footer at the bottom) does not vary per case and is
embedded verbatim below (captured byte-for-byte from the original cases.html
so the round trip is exact). Only the 15 <article class="case reveal"> blocks
are generated from cases.json.

Usage: python3 render_cases.py [cases.json] [-o cases.regen.html]
"""
import argparse
import json
import sys
from pathlib import Path

PREFIX = "<!doctype html>\n<html lang=\"ko\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>사례 15선 | 2i AX 컨설팅</title>\n<meta name=\"description\" content=\"중소·중견 제조·유통을 위한 AX 시나리오 사례 15선. 2i 게이지 방식(측정→실증→이관)으로 현장 KPI를 어떻게 바꾸는지, 각 사례마다 작동하는 소스코드로 증명합니다.\">\n<link rel=\"icon\" href=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23111827'/%3E%3Ctext x='16' y='22' font-family='monospace' font-size='16' font-weight='700' fill='%23e08a2b' text-anchor='middle'%3E2i%3C/text%3E%3C/svg%3E\">\n<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link href=\"https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap\" rel=\"stylesheet\">\n<link rel=\"stylesheet\" href=\"styles.css?v=4\">\n</head>\n<body>\n<header class=\"nav\">\n  <div class=\"wrap nav__inner\">\n    <a class=\"brand\" href=\"/\"><span class=\"brand__mark\">2i</span><span class=\"brand__tag\">AX 컨설팅</span></a>\n    <nav class=\"nav__links\" aria-label=\"주요 메뉴\">\n      <a href=\"/#method\">방식</a>\n      <a href=\"cases.html\">사례</a>\n      <a href=\"/#voucher\">정부 바우처</a>\n      <a class=\"nav__cta btn btn--signal\" href=\"/#contact\">상담 신청</a>\n    </nav>\n  </div>\n</header>\n<main>\n  <section class=\"wrap cases-hero\">\n    <span class=\"eyebrow\">사례집 · 15선 · 각 사례마다 작동하는 코드 · 라이브 데모</span>\n    <h1>만든 게 아니라,<br><span class=\"u accent\">바꾼</span> 것을 봅니다.</h1>\n    <p>기초 데이터 통합부터 완전 자동화, 홈페이지·마케팅까지. 각 사례는 <b>문제의 대가 → 통찰 → 2i의 방식 → 목표 델타 → 작동하는 증거(소스코드)</b> 순으로 읽힙니다. 슬라이드가 아니라, 브라우저에서 바로 열리는 라이브 데모와 GitHub 소스코드가 사례마다 붙어 있습니다.</p>\n    <p class=\"disclaimer\">ⓘ 아래는 <b>시나리오형 역량 사례</b>입니다. 특정 실존 고객의 완료 실적이 아니라 \"이런 문제를 이렇게 다룹니다\"를 보여주는 대표 예시이며, 목표 수치는 업계 통상 기대치입니다. 실제 진행 시 <b>귀사 데이터로 다시 측정</b>합니다. 각 사례에 링크된 소스코드는 합성 데이터로 동작하는 레퍼런스 구현입니다.</p>\n  </section>\n<div class=\"ticker\" aria-hidden=\"true\"><div class=\"ticker__track\"><span class=\"ticker__item\">현황 파악 소요 <b>조회 즉시 (목표)</b></span><span class=\"ticker__item\">문서 1건 처리시간 <b>60~70% 단축 (목표)</b></span><span class=\"ticker__item\">판정 일관성 <b>동일 기준 상시 적용 (목표)</b></span><span class=\"ticker__item\">핵심 SKU 결품 <b>30~40% 감소 (목표)</b></span><span class=\"ticker__item\">단순 반복 문의 응대시간 <b>60~70% 단축 (목표)</b></span><span class=\"ticker__item\">간섭원 특정 <b>실시간 원인 지목 (목표)</b></span><span class=\"ticker__item\">설비 이슈 검색시간 <b>50~70% 단축 (목표)</b></span><span class=\"ticker__item\">일일 정보 탐색시간 <b>60~70% 단축 (목표)</b></span><span class=\"ticker__item\">영상 제작 소요 <b>80% 단축 (목표)</b></span><span class=\"ticker__item\">브랜드 검색 노출 <b>단기 확보 (목표)</b></span><span class=\"ticker__item\">여정 1건 처리 <b>한 문장 · 자동 (목표)</b></span><span class=\"ticker__item\">설계 게이트 위반 <b>7개 전부 통과 (합성 스펙 실측)</b></span><span class=\"ticker__item\">품질 게이트 <b>6개 중 5개 통과 (합성 팬텀 실측)</b></span><span class=\"ticker__item\">운영 게이트 <b>5개 전부 통과 (합성 시나리오 실측)</b></span><span class=\"ticker__item\">디바이스 메모리 (나이브 INT4) <b>4.15GB (56% 감소, 실측)</b></span></div></div>\n      <section class=\"method wrap\" aria-label=\"2i 게이지 방식\">\n        <div class=\"method__head\">\n          <span class=\"eyebrow\">2i 게이지 방식</span>\n          <h2>추측하지 않습니다. <span class=\"u accent\">계측</span>합니다.</h2>\n          <p>모든 프로젝트는 세 개의 게이트를 지납니다. 각 게이트를 <b>통과할 때만 다음 단계의 예산을 씁니다.</b> AI 도입의 가장 큰 불안, '돈만 쓰고 안 되면?'을 구조로 제거하는 방식입니다.</p>\n        </div>\n        <ol class=\"gates3\">\n          <li class=\"g3\"><span class=\"g3__no\">01</span><div><b>측정 게이트</b><span class=\"g3__sub\">MEASURE · 진단</span><p>문제를 숫자로 고정합니다. 현장 KPI의 현재값(baseline)과 데이터 실태를 계측해, 무엇을 얼마나 개선할지 기준선을 만듭니다.</p></div></li>\n          <li class=\"g3\"><span class=\"g3__no\">02</span><div><b>실증 게이트</b><span class=\"g3__sub\">VERIFY · PoC</span><p>한 지점만 골라 before→after를 실제로 측정합니다. 여기서 목표 델타에 못 미치면 <b>확장하지 않습니다.</b> 큰돈은 검증 뒤에.</p></div></li>\n          <li class=\"g3 g3--build\"><span class=\"g3__no\">03</span><div><b>이관 게이트</b><span class=\"g3__sub\">OPERATE · 구축</span><p>검증된 것만 확장하고 운영팀이 스스로 돌리게 넘깁니다. 문서·매뉴얼과 함께, 성과가 날 때까지 동행합니다.</p></div></li>\n        </ol>\n      </section>\n\n  <section class=\"section\" style=\"padding-top:1.5rem\">\n    <div class=\"wrap case-list\">\n      "
SUFFIX = "\n    </div>\n  </section>\n  <section class=\"section section--alt\">\n    <div class=\"wrap\">\n      <div class=\"cta\">\n        <h2>이 중 하나가 우리 회사 이야기 같다면.</h2>\n        <p>무료 자가진단으로 시작하거나, 30분 상담으로 귀사에 맞는 시작점을 함께 찾습니다.</p>\n        <div class=\"cta__row\"><a class=\"btn btn--signal\" href=\"/#diagnose\">자가진단 →</a><a class=\"btn btn--ghost\" href=\"/#contact\">상담 신청</a></div>\n      </div>\n    </div>\n  </section>\n</main>\n<footer class=\"foot\">\n  <div class=\"wrap foot__inner\">\n    <div class=\"brand\"><span class=\"brand__mark\">2i</span><span class=\"brand__tag\">AX 컨설팅</span></div>\n    <nav class=\"foot__links\"><a href=\"/\">홈</a><a href=\"/#method\">방식</a><a href=\"https://github.com/2icorp\" target=\"_blank\" rel=\"noopener\">GitHub</a></nav>\n  </div>\n</footer>\n<script src=\"main.js\"></script>\n</body>\n</html>\n"

ARTICLE_SEP = "\n      "


def esc_no(no: int) -> str:
    return f"{no:02d}"


def render_proof(proof: dict) -> str:
    code = proof.get("code")
    demo = proof.get("demo")
    doc = proof.get("doc")
    dl = proof["dl"]

    line1_parts = []
    if code is not None:
        line1_parts.append(
            f'<a class="chip chip--code" href="{code["href"]}" target="_blank" rel="noopener">{code["text"]}</a>'
        )
    if demo is not None:
        line1_parts.append(f'<a class="chip chip--demo" href="{demo["href"]}">{demo["text"]}</a>')
    if doc is not None:
        line1_parts.append(f'<a class="chip chip--doc" href="{doc["href"]}">{doc["text"]}</a>')
    line1 = "".join(line1_parts)
    line2 = f'<a class="chip chip--dl" href="{dl["href"]}" download>{dl["text"]}</a>'

    return (
        '<div class="case__proof">\n'
        f'              {line1}\n'
        f'              {line2}\n'
        '            </div>'
    )


def render_gates(gates: list) -> str:
    return "".join(
        f'<li class="gate"><b class="gate__name">{g["name"]}</b>'
        f'<span class="gate__what">{g["what"]}</span></li>'
        for g in gates
    )


def render_ba_rows(rows: list) -> str:
    return "".join(
        '<div class="ba__row">'
        f'<span class="ba__m">{r["m"]}</span>'
        f'<span class="ba__b">{r["b"]}</span>'
        '<span class="ba__arw" aria-hidden="true">→</span>'
        f'<span class="ba__a">{r["a"]}</span>'
        '</div>'
        for r in rows
    )


def render_case(case: dict) -> str:
    no = case["no"]
    gates_html = render_gates(case["gates"])
    ba_rows_html = render_ba_rows(case["ba"]["rows"])
    proof_html = render_proof(case["proof"])

    return (
        f'<article class="case reveal" id="case-{no}">\n'
        '        <header class="case__top">\n'
        f'          <span class="case__no">{esc_no(no)}</span>\n'
        '          <div class="case__id">\n'
        f'            <span class="case__cat">{case["cat"]}</span>\n'
        f'            <span class="case__ind">{case["ind"]}</span>\n'
        '          </div>\n'
        '          <div class="case__stkm" role="group" aria-label="문제의 대가">\n'
        f'            <span class="case__stkm-l">{case["stkm_l"]}</span>\n'
        f'            <span class="case__stkm-v">{case["stkm_v"]}</span>\n'
        '          </div>\n'
        '        </header>\n'
        f'        <h3 class="case__title">{case["title"]}</h3>\n'
        f'        <p class="case__stakes">{case["stakes"]}</p>\n'
        '        <div class="case__grid">\n'
        '          <div class="case__main">\n'
        f'            <div class="case__row"><span class="case__k">통찰</span><p>{case["insight"]}</p></div>\n'
        f'            <div class="case__row"><span class="case__k">2i의 방식</span><p>{case["mechanism"]}</p></div>\n'
        f'            <ol class="case__gates">{gates_html}</ol>\n'
        '          </div>\n'
        '          <aside class="case__side">\n'
        f'            <div class="ba"><div class="ba__head">목표 지표 <span class="ba__note">· 실제 수치는 귀사 데이터로 재측정</span></div>{ba_rows_html}</div>\n'
        f'            <div class="case__sowhat"><span class="case__k case__k--go">그래서 무엇이 열리나</span><p>{case["so_what"]}</p></div>\n'
        '            <div class="case__facts">\n'
        f'              <span class="chip">{case["duration"]}</span>\n'
        '              <span class="chip chip--v">정부 바우처 적합</span>\n'
        '            </div>\n'
        f'            {proof_html}\n'
        f'            <p class="case__tech"><span class="case__tech-k">사용 기술</span> {case["tech"]}</p>\n'
        '          </aside>\n'
        '        </div>\n'
        '      </article>'
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("json_path", nargs="?", default="cases.json")
    ap.add_argument("-o", "--out", default="cases.regen.html")
    args = ap.parse_args()

    cases = json.loads(Path(args.json_path).read_text(encoding="utf-8"))
    articles = ARTICLE_SEP.join(render_case(c) for c in cases)
    html = PREFIX + articles + SUFFIX

    Path(args.out).write_text(html, encoding="utf-8")
    print(f"Rendered {len(cases)} cases -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
