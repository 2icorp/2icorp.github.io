---
layout: default
title:  "연필 스케치 여정"
---

# 연필 스케치 여정

## 2017년 deepsketch 앱을 출시
지인 소개로 구글 플레이스토어 메인에 노출되면서 5만 다운로드를 일주일에 달성.
앱스토어 내려가다.
한가지에 집중하지 못하다.
사이드로 한 것이라 안되어도 문제가 없었다.

## deepsketch 앱을 통째로 카피하다.
해당 앱이 여전히 버젓이 올라와 있고 500만이나 다운로드 받은 앱이다.
내가 이 생태계를 전혀 이해하고 있지 못하구나.

## diffusion 기술로 전문가 스케치 가능하다.
비용이 들어가는데 유저가 사용할까?

## 최신 글
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>