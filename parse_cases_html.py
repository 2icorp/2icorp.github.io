#!/usr/bin/env python3
"""Parse cases.html into cases.json.

Restores the structured case data from the rendered site HTML. This is the
inverse of render_cases.py -- running parse then render should reproduce
cases.html byte-for-byte (verified by verify round trip in RESTORE-NOTES.md).

Usage: python3 parse_cases_html.py [cases.html] [-o cases.json]
"""
import argparse
import json
import re
import sys
from pathlib import Path

ARTICLE_RE = re.compile(
    r'<article class="case reveal" id="case-(\d+)">(.*?)</article>', re.DOTALL
)
FIELD_SIMPLE = {
    "cat": r'<span class="case__cat">(.*?)</span>',
    "ind": r'<span class="case__ind">(.*?)</span>',
    "stkm_l": r'<span class="case__stkm-l">(.*?)</span>',
    "stkm_v": r'<span class="case__stkm-v">(.*?)</span>',
    "title": r'<h3 class="case__title">(.*?)</h3>',
    "stakes": r'<p class="case__stakes">(.*?)</p>',
    "so_what": r'<div class="case__sowhat"><span class="case__k case__k--go">.*?</span><p>(.*?)</p></div>',
    "duration": r'<div class="case__facts">\s*<span class="chip">(.*?)</span>\s*<span class="chip chip--v">.*?</span>\s*</div>',
    "tech": r'<p class="case__tech"><span class="case__tech-k">.*?</span> (.*?)</p>',
}

ROW_RE = re.compile(
    r'<div class="case__row"><span class="case__k">.*?</span><p>(.*?)</p></div>', re.DOTALL
)
GATE_RE = re.compile(
    r'<li class="gate"><b class="gate__name">(.*?)</b><span class="gate__what">(.*?)</span></li>',
    re.DOTALL,
)
BA_ROW_RE = re.compile(
    r'<div class="ba__row"><span class="ba__m">(.*?)</span><span class="ba__b">(.*?)</span>'
    r'<span class="ba__arw" aria-hidden="true">→</span><span class="ba__a">(.*?)</span></div>',
    re.DOTALL,
)
PROOF_CODE_RE = re.compile(
    r'<a class="chip chip--code" href="(.*?)" target="_blank" rel="noopener">(.*?)</a>', re.DOTALL
)
PROOF_DEMO_RE = re.compile(r'<a class="chip chip--demo" href="(.*?)">(.*?)</a>', re.DOTALL)
PROOF_DOC_RE = re.compile(r'<a class="chip chip--doc" href="(.*?)">(.*?)</a>', re.DOTALL)
PROOF_DL_RE = re.compile(r'<a class="chip chip--dl" href="(.*?)" download>(.*?)</a>', re.DOTALL)


def parse_case(no: int, block: str) -> dict:
    case = {"no": no}
    for key, pattern in FIELD_SIMPLE.items():
        m = re.search(pattern, block, re.DOTALL)
        if not m:
            raise ValueError(f"case-{no}: field '{key}' not found")
        case[key] = m.group(1)

    rows = ROW_RE.findall(block)
    if len(rows) != 2:
        raise ValueError(f"case-{no}: expected 2 case__row, found {len(rows)}")
    case["insight"], case["mechanism"] = rows

    gates = GATE_RE.findall(block)
    if len(gates) != 3:
        raise ValueError(f"case-{no}: expected 3 gates, found {len(gates)}")
    case["gates"] = [{"name": n, "what": w} for n, w in gates]

    ba_rows = BA_ROW_RE.findall(block)
    if not ba_rows:
        raise ValueError(f"case-{no}: no ba__row found")
    case["ba"] = {"rows": [{"m": m_, "b": b_, "a": a_} for m_, b_, a_ in ba_rows]}

    proof_block_m = re.search(r'<div class="case__proof">(.*?)</div>', block, re.DOTALL)
    if not proof_block_m:
        raise ValueError(f"case-{no}: no case__proof found")
    proof_block = proof_block_m.group(1)

    def one(pattern):
        m = pattern.search(proof_block)
        return {"href": m.group(1), "text": m.group(2)} if m else None

    dl = one(PROOF_DL_RE)
    if dl is None:
        raise ValueError(f"case-{no}: no chip--dl found")
    case["proof"] = {
        "code": one(PROOF_CODE_RE),
        "demo": one(PROOF_DEMO_RE),
        "doc": one(PROOF_DOC_RE),
        "dl": dl,
    }
    return case


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("html", nargs="?", default="cases.html")
    ap.add_argument("-o", "--out", default="cases.json")
    args = ap.parse_args()

    text = Path(args.html).read_text(encoding="utf-8")
    matches = ARTICLE_RE.findall(text)
    if not matches:
        print("No <article class=\"case reveal\"> blocks found.", file=sys.stderr)
        return 1

    cases = []
    for no_str, block in matches:
        cases.append(parse_case(int(no_str), block))

    Path(args.out).write_text(
        json.dumps(cases, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Parsed {len(cases)} cases -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
