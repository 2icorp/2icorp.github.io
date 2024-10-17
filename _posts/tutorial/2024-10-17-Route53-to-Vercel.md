---
layout: default
title: "사이트 리다이렉트하는 방법"
date: 2024-10-17
categories: [Tech]
tags: [AWS, Route 53, Vercel, 도메인 리다이렉트]
---

아마존에서 구매한 도메인을 Vercel에서 운영 중인 사이트로 리다이렉트하는 간단한 방법은 다음과 같습니다.

```mermaid
graph TD
    A[Register Domain on AWS Route 53] --> B[Create Hosted Zone for 2icorp.com]
    B --> C[Update Name Servers in Amazon Domain Management]
    C --> D[Go to Vercel Project Settings]
    D --> E[Add 2icorp.com to Domains]
    E --> F[Add DNS Settings from Vercel to Route 53 (CNAME or A Record)]
    F --> G[Create Redirect Rule in Vercel]
    G --> H[Source: /*, Destination: https://2icorp.site/:path, Status: 308]
    H --> I[Wait for DNS Propagation]
```

## 1. AWS Route 53에 도메인 등록하기

1. **AWS Management Console**에 로그인하고, Route 53 서비스로 이동합니다.
2. "Hosted Zones" 메뉴에서 `2icorp.com`을 위한 Hosted Zone을 만듭니다.
3. Hosted Zone이 생성되면 **네임서버(NS) 정보**를 확인하세요.

## 2. 도메인 네임서버 변경하기

1. 아마존 도메인 관리 페이지로 가서, `2icorp.com` 도메인의 **네임서버를 Route 53에서 제공한 네임서버로 변경**합니다.

## 3. Vercel에서 리다이렉트 설정하기

1. **Vercel 대시보드**에 로그인하고, `2icorp.site` 프로젝트를 선택합니다.
2. 프로젝트 설정(Project Settings)으로 이동한 후, "Domains" 탭을 클릭합니다.
3. 여기서 `2icorp.com` 도메인을 추가합니다.
4. 도메인 추가 후, **Vercel이 제공하는 DNS 설정값(CNAME 또는 A 레코드)**을 Route 53의 Hosted Zone에 입력하세요.

## 4. 리다이렉트 규칙 추가

1. Vercel 프로젝트 설정에서 **"Redirects"** 섹션으로 이동합니다.
2. `2icorp.com`에서 `2icorp.site`로 리다이렉트하는 규칙을 설정합니다. 예시는 다음과 같습니다:

   ```
   Source: /*
   Destination: https://2icorp.site/:path
   Status: 308 (Permanent Redirect)
   ```

## 5. DNS 전파 대기

네임서버 변경과 리다이렉트 설정 후, 몇 시간에서 최대 48시간 정도 기다리면 **DNS 전파가 완료**됩니다.

이 과정이 완료되면 `2icorp.com`에 접속 시 자동으로 `2icorp.site`로 리다이렉트됩니다.

---

## 최신 글
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>