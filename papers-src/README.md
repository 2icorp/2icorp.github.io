# 논문·실험 게시판 — 발행 방법

이 폴더(`papers-src/`)에 마크다운 파일 하나를 넣고 렌더러를 돌리면, 게시판(`papers.html`)과
읽기 페이지(`papers/<slug>.html`)가 자동으로 만들어집니다. the local stack 기술 블로그의 `_posts`
프론트매터 형식을 그대로 씁니다. 그래서 nightly-paper 등에서 나온 마크다운을 손대지 않고
바로 떨어뜨릴 수 있습니다.

## 1) 마크다운 파일 추가

파일명: `YYYY-MM-DD-슬러그.md` (예: `2026-08-01-vetd-cost-descent.md`)

```markdown
---
title: "논문 제목"
excerpt: "게시판과 페이지 상단에 보이는 한 줄 요약"
date: 2026-08-01
categories:
  - research        # research / experiment / paper / method / tutorial / news
tags:
  - 태그1
  - 태그2
reading_time_min: 12   # 생략하면 글자수로 자동 계산
pdf: assets/vetd.pdf   # (선택) PDF 원문. site-new/papers/assets/ 에 두고 상대경로로.
---

본문은 일반 마크다운입니다. 제목(`##`), 목록, 표, 코드블록, 링크 모두 지원합니다.
수식은 `$...$`(인라인), `$$...$$`(블록)으로 쓰면 KaTeX로 렌더됩니다.
```

## 2) 렌더

```bash
cd 2icorp-work        # (또는 repo 루트)
python3 render_papers.py
```

`papers.html` + `papers/*.html` + `papers.json`이 다시 생성됩니다.

## 3) 배포

렌더된 파일을 커밋해서 push하면 GitHub Pages에 반영됩니다. 빌드 과정 없음(.nojekyll).

## 참고

- 카테고리 한글 라벨은 `render_papers.py`의 `CAT_LABEL`에서 바꿉니다.
- 글을 내리려면 해당 `.md`를 지우고 다시 렌더하면 됩니다.
- 이 폴더의 예시 2개(`2026-07-25...`, `2026-07-26...`)는 지우고 실제 논문으로 교체해도 됩니다.
