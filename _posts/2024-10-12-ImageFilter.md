---
layout: default
title:  "고효율의 이미지 필터 만들기"
---

# 고효율의 이미지 필터 만들기



## 최신 글
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>