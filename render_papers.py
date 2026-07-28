#!/usr/bin/env python3
"""
2i papers board renderer.

Ingests markdown papers written in the SAME front-matter format as the
a tech blog (`_posts/*.md`), so nightly-paper-factory output drops in
unchanged. Produces, in the 2i instrument/blueprint design:

  papers-src/*.md  ->  papers.html            (board / 게시판)
                       papers/<slug>.html      (rendered reading pages)
                       papers.json             (machine index)

No Jekyll, no build step on GitHub Pages. Run locally:  python3 render_papers.py
"""
import json, re, sys, shutil, html
from pathlib import Path
from datetime import datetime

try:
    import yaml
except Exception:
    sys.exit("PyYAML required: pip install pyyaml")
try:
    import markdown as md
except Exception:
    sys.exit("markdown required: pip install markdown")

ROOT = Path(__file__).resolve().parent
# workspace layout keeps sources in site-new/; the deploy clone is flat
SITE = ROOT / "site-new" if (ROOT / "site-new").is_dir() else ROOT
SRC = SITE / "papers-src"
OUT_DIR = SITE / "papers"
BOARD = SITE / "papers.html"
INDEX = SITE / "papers.json"

# category slug -> Korean label shown on the board
CAT_LABEL = {
    "research": "리서치",
    "experiment": "실험 노트",
    "paper": "논문 리뷰",
    "paper-review": "논문 리뷰",
    "method": "방법",
    "tutorial": "튜토리얼",
    "news": "동향",
    "case": "현장 기록",
}

# ---------- shared chrome (matches index.html exactly) ----------

def head(title, desc, rel, extra=""):
    return f"""<!doctype html>
<html lang="ko">
<head>
<script>(function(){{try{{var t=localStorage.getItem("theme");if(!t&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)t="dark";if(t)document.documentElement.setAttribute("data-theme",t);}}catch(e){{}}}})();</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:type" content="article">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23111827'/%3E%3Ctext x='16' y='22' font-family='monospace' font-size='16' font-weight='700' fill='%23e08a2b' text-anchor='middle'%3E2i%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{rel}styles.css?v=11">{extra}
</head>
<body>

<header class="nav">
  <div class="wrap nav__inner">
    <a class="brand" href="{rel or '/'}" aria-label="2i 홈">
      <span class="brand__mark">2i</span>
      <span class="brand__tag">AX 컨설팅</span>
    </a>
    <button class="nav__burger" type="button" aria-expanded="false" aria-controls="navLinks" aria-label="메뉴 열기"><span></span><span></span><span></span></button>
    <nav class="nav__links" id="navLinks" aria-label="주요 메뉴">
      <a href="{rel}index.html#method">방식</a>
      <a href="{rel}cases.html">사례</a>
      <a href="{rel}comms.html">통신</a>
      <a href="{rel}index.html#ideas">아이디어 30</a>
      <a href="{rel}index.html#studio">영상</a>
      <a href="{rel}papers.html">논문·실험</a>
      <a href="{rel}about.html">회사소개</a>
      <a href="{rel}index.html#voucher">정부 바우처</a>
      <button class="nav__theme" type="button" aria-label="테마 전환" title="테마 전환"><svg class="ic-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="ic-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button>
      <a class="nav__lang" href="{rel}en/">EN</a>
      <a class="nav__cta btn btn--signal" href="{rel}index.html#contact">상담 신청</a>
    </nav>
  </div>
</header>
"""

def foot(rel):
    return f"""
<footer class="foot">
  <div class="wrap foot__inner">
    <div>
      <div class="brand"><span class="brand__mark">2i</span><span class="brand__tag">AX 컨설팅</span></div>
      <div class="foot__mono" style="margin-top:0.6rem">중소·중견 제조·유통을 위한 AI 전환</div>
    </div>
    <nav class="foot__links" aria-label="하단 메뉴">
      <a href="{rel}index.html#method">방식</a>
      <a href="{rel}comms.html">통신</a>
      <a href="{rel}papers.html">논문·실험</a>
      <a href="{rel}index.html#voucher">정부 바우처</a>
      <a href="https://github.com/2icorp" target="_blank" rel="noopener">GitHub</a>
      <a href="{rel}en/">EN</a>
    </nav>
  </div>
</footer>

<script src="{rel}main.js"></script>
</body>
</html>"""

# ---------- markdown with math protection ----------

_MATH = []
def _protect(m):
    _MATH.append(m.group(0))
    return f"\x00MATH{len(_MATH)-1}\x00"

def render_body(text):
    """Protect $$..$$, $..$, \\(..\\), \\[..\\] from markdown, render, restore."""
    global _MATH
    _MATH = []
    # order matters: display blocks first
    text = re.sub(r"\$\$.+?\$\$", _protect, text, flags=re.S)
    text = re.sub(r"\\\[.+?\\\]", _protect, text, flags=re.S)
    text = re.sub(r"(?<!\\)\$(?!\s)(?:\\.|[^$\n])+?(?<!\s)\$", _protect, text)
    text = re.sub(r"\\\(.+?\\\)", _protect, text, flags=re.S)
    body = md.markdown(text, extensions=["extra", "sane_lists", "toc", "admonition"],
                       output_format="html5")
    for i, frag in enumerate(_MATH):
        body = body.replace(f"\x00MATH{i}\x00", frag)
    return body

# ---------- parsing ----------

def parse(path):
    raw = path.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", raw, flags=re.S)
    if not m:
        fm, body = {}, raw
    else:
        fm = yaml.safe_load(m.group(1)) or {}
        body = m.group(2)
    # slug from filename: strip leading date, .md
    stem = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", path.stem)
    slug = str(fm.get("slug") or stem)
    cats = fm.get("categories") or ([fm["category"]] if fm.get("category") else [])
    if isinstance(cats, str):
        cats = [cats]
    cat = (cats[0] if cats else "research")
    # date
    d = fm.get("date")
    if isinstance(d, str):
        d = d[:10]
    elif isinstance(d, datetime):
        d = d.strftime("%Y-%m-%d")
    elif d is not None:
        d = str(d)[:10]
    else:
        mm = re.match(r"^(\d{4}-\d{2}-\d{2})", path.name)
        d = mm.group(1) if mm else "1970-01-01"
    # reading time
    rt = fm.get("reading_time_min")
    if not rt:
        chars = len(re.sub(r"\s", "", body))
        rt = max(1, round(chars / 500))
    tags = fm.get("tags") or []
    if isinstance(tags, str):
        tags = [tags]
    return {
        "slug": slug,
        "title": str(fm.get("title") or slug),
        "excerpt": str(fm.get("excerpt") or "").strip(),
        "date": d,
        "cat": cat,
        "cat_label": CAT_LABEL.get(cat, cat),
        "tags": [str(t) for t in tags][:8],
        "reading_time": int(rt),
        "pdf": fm.get("pdf"),
        "body": body,
    }

# ---------- board rendering ----------

def kdate(d):
    return d.replace("-", ".")

def card_html(p):
    meta = [f'<span class="pcard__cat">{html.escape(p["cat_label"])}</span>',
            f'<span class="pcard__date">{kdate(p["date"])}</span>',
            f'<span class="pcard__rt">약 {p["reading_time"]}분</span>']
    if p.get("pdf"):
        meta.append('<span class="pcard__pdf">PDF</span>')
    tags = "".join(f'<span>#{html.escape(t)}</span>' for t in p["tags"])
    exc = f'<p class="pcard__excerpt">{html.escape(p["excerpt"])}</p>' if p["excerpt"] else ""
    return f"""      <a class="pcard reveal" href="papers/{p['slug']}.html" data-cat="{html.escape(p['cat'])}">
        <div class="pcard__meta">{''.join(meta)}</div>
        <h3 class="pcard__title">{html.escape(p['title'])}</h3>
        {exc}
        <div class="pcard__tags">{tags}<span class="pcard__go">읽기 →</span></div>
      </a>"""

def filters_html(papers):
    counts = {}
    for p in papers:
        counts[p["cat"]] = counts.get(p["cat"], 0) + 1
    chips = [f'<button class="pfilter is-on" data-cat="all">전체 <b>{len(papers)}</b></button>']
    for cat in sorted(counts, key=lambda c: -counts[c]):
        chips.append(f'<button class="pfilter" data-cat="{html.escape(cat)}">'
                     f'{html.escape(CAT_LABEL.get(cat, cat))} <b>{counts[cat]}</b></button>')
    return '<div class="pfilters" role="tablist" aria-label="분류 필터">' + "".join(chips) + "</div>"

def board_html(papers):
    if papers:
        body = filters_html(papers) + '\n    <div class="pboard">\n' + \
               "\n".join(card_html(p) for p in papers) + "\n    </div>"
    else:
        body = """    <div class="pempty">
      <div class="pempty__mono">// 게시판 준비 완료 · awaiting first entry</div>
      <p>곧 2i가 현장에서 검증한 논문과 실험 기록이 이 자리에 올라옵니다.</p>
      <a class="btn btn--ghost" href="index.html#contact">먼저 상담으로 이야기하기 <span class="arrow">→</span></a>
    </div>"""
    return head("논문·실험 · 2i AX 컨설팅",
                "2i가 현장에서 검증한 방법과 읽은 논문을 기록으로 남깁니다. 제조·유통 AX 실험 노트와 논문 리뷰.",
                "") + f"""
<main>
  <section class="section pboard-hero">
    <div class="wrap">
      <span class="eyebrow">논문 · 실험 기록</span>
      <h1 class="pboard-hero__h1">현장에서 <span class="u accent">측정한 것</span>만 기록합니다.</h1>
      <p class="pboard-hero__lede">데모용 이론이 아니라, 2i가 실제 제조·유통 현장에서 돌려보고 확인한 방법과, 그 판단의 근거가 된 논문을 게시판으로 남깁니다.</p>
    </div>
  </section>
  <section class="section section--alt" style="padding-top:0">
    <div class="wrap">
    {body}
    </div>
  </section>
</main>
""" + foot("")

def article_html(p):
    body = render_body(p["body"])
    meta = [f'<span class="pcard__cat">{html.escape(p["cat_label"])}</span>',
            f'<span class="pcard__date">{kdate(p["date"])}</span>',
            f'<span class="pcard__rt">약 {p["reading_time"]}분</span>']
    tags = "".join(f'<span>#{html.escape(t)}</span>' for t in p["tags"])
    pdf = ""
    if p.get("pdf"):
        pdf = f'<a class="btn btn--ghost article__pdf" href="{html.escape(str(p["pdf"]))}" target="_blank" rel="noopener">PDF 원문 내려받기 <span class="arrow">↓</span></a>'
    exc = f'<p class="article__excerpt">{html.escape(p["excerpt"])}</p>' if p["excerpt"] else ""
    katex = """
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false},{left:'\\\\[',right:'\\\\]',display:true},{left:'\\\\(',right:'\\\\)',display:false}]})"></script>"""
    return head(f'{p["title"]} · 2i', p["excerpt"] or p["title"], "../", extra=katex) + f"""
<main>
  <article class="article wrap">
    <a class="article__back" href="../papers.html">← 논문·실험 게시판</a>
    <div class="article__head">
      <div class="pcard__meta">{''.join(meta)}</div>
      <h1 class="article__title">{html.escape(p['title'])}</h1>
      {exc}
      <div class="pcard__tags">{tags}</div>
      {pdf}
    </div>
    <div class="article__body prose">
{body}
    </div>
    <div class="article__cta">
      <p>이 방법을 당신 현장의 숫자로 다시 재보고 싶다면.</p>
      <a class="btn btn--signal" href="../index.html#contact">30분 진단 상담 <span class="arrow">→</span></a>
      <a class="btn btn--ghost" href="../papers.html">다른 기록 보기</a>
    </div>
  </article>
</main>
""" + foot("../")

# ---------- main ----------

def main():
    SRC.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(f for f in SRC.glob("*.md") if f.stem.lower() != "readme")
    papers = [parse(f) for f in files]
    # only published (front matter published: false => skip)
    papers = [p for p in papers if p]
    papers.sort(key=lambda p: p["date"], reverse=True)

    BOARD.write_text(board_html(papers), encoding="utf-8")
    for p in papers:
        (OUT_DIR / f"{p['slug']}.html").write_text(article_html(p), encoding="utf-8")

    idx = [{k: p[k] for k in ("slug", "title", "excerpt", "date", "cat", "cat_label",
                              "tags", "reading_time")} for p in papers]
    INDEX.write_text(json.dumps(idx, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"papers: {len(papers)}")
    for p in papers:
        print(f"  - {p['date']}  [{p['cat_label']}]  {p['title']}  (papers/{p['slug']}.html)")
    print(f"board:  {BOARD}")
    print(f"index:  {INDEX}")

if __name__ == "__main__":
    main()
