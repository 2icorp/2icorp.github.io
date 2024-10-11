---
layout: default
title:  "Welcome to 2i Tech Blog"
---

# Welcome to 2i Tech Blog

이 사이트는 2i에서 기술 블로그를 작성하는 공간입니다.

## 최신 글
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>

