---
title: "AWS Route 53과 Vercel을 이용한 도메인 리다이렉션 가이드"
last_modified_at: 2024-10-17
categories:
  - 튜토리얼
tags:
  - route53
  - domain
  - redirect
  - dns
  - alias
  - seo
  - https
excerpt: ""
use_math: true
classes: wide
---

AWS Route 53에서 구매한 도메인을 Vercel에서 운영 중인 사이트로 리다이렉션하는 방법을 단계별로 살펴보겠습니다. 이 가이드는 DNS 설정부터 리다이렉션 규칙 설정, SEO 최적화, 보안 설정까지 전 과정을 다룹니다.

## DNS 개념 이해하기

### 1. DNS (Domain Name System)
- 도메인 이름을 IP 주소로 변환하는 시스템
- 사람이 읽을 수 있는 도메인 이름을 컴퓨터가 인식할 수 있는 IP 주소로 변환합니다

### 2. CNAME 레코드
- Canonical Name의 약자
- 한 도메인 이름을 다른 도메인 이름으로 매핑
- 예: blog.example.com을 example.github.io로 연결
- 루트 도메인(@)에는 사용할 수 없음

### 3. A 레코드
- Address 레코드의 약자
- 도메인을 직접 IP 주소로 매핑
- 예: example.com을 192.0.2.1로 연결
- 루트 도메인에서도 사용 가능

### 4. 호스트 존 (Hosted Zone)
- 도메인의 DNS 레코드를 그룹화하는 컨테이너
- DNS 레코드 관리를 위한 Route 53의 기본 구성 요소
- 도메인에 대한 DNS 설정을 중앙 집중적으로 관리

### 5. 별칭 (Alias) 레코드
- AWS 리소스를 위한 Route 53의 특별한 레코드 유형
- AWS 서비스 엔드포인트를 도메인에 매핑할 때 사용
- CNAME과 유사하지만 다음과 같은 장점이 있습니다:
  - 루트 도메인(@)에서 사용 가능
  - DNS 쿼리 비용이 없음
  - AWS 리소스의 IP 변경을 자동으로 추적
- 주요 사용 사례:
  - CloudFront 배포
  - ELB 로드 밸런서
  - S3 웹사이트 엔드포인트
  - API Gateway

#### CNAME vs Alias 비교
특징 | CNAME | Alias
---|---|---
루트 도메인 사용 | 불가능 | 가능
DNS 쿼리 비용 | 발생 | 무료
AWS 서비스 통합 | 제한적 | 완벽한 통합
IP 변경 추적 | 수동 업데이트 필요 | 자동 업데이트

## HTTP 307과 308 상태 코드 이해하기

리다이렉션 설정에 앞서, 사용되는 HTTP 상태 코드에 대해 이해하는 것이 중요합니다:

- **307 (Temporary Redirect)**:
  - 일시적인 리다이렉션을 나타냅니다
  - 원본 HTTP 메소드와 본문을 유지합니다
  - 캐시되지 않으며, 매 요청마다 리다이렉션을 수행합니다

- **308 (Permanent Redirect)**:
  - 영구적인 리다이렉션을 나타냅니다
  - 원본 HTTP 메소드와 본문을 유지합니다
  - 브라우저가 이 정보를 캐시하여 향후 요청 시 자동으로 새 URL로 이동합니다


## SEO에 미치는 영향

리다이렉션 설정은 검색 엔진 최적화(SEO)에 중요한 영향을 미칩니다. 특히 308 영구 리다이렉션의 경우 다음과 같은 영향이 있습니다:

### 긍정적인 영향
- **페이지 랭크 유지**: 이전 URL의 SEO 가치가 새 URL로 이전됩니다
- **검색 엔진 업데이트**: 검색 엔진이 새 URL을 자동으로 인덱싱합니다
- **구조 개선**: 사용자 경험 향상으로 SEO 점수가 개선될 수 있습니다

### 주의할 점
- **리다이렉트 체인 방지**: 여러 번의 리다이렉트는 성능 저하를 초래합니다
- **속도 최적화**: 리다이렉트로 인한 로딩 시간 증가를 최소화해야 합니다

## HTTPS 설정 및 보안

### SSL/TLS 인증서 설정
1. **Vercel의 자동 SSL 설정**
  - Let's Encrypt 인증서 자동 발급
  - 도메인 추가 시 자동 설정됨

2. **HTTPS 확인 방법**
  - 브라우저 주소창의 자물쇠 아이콘 확인
  - SSL Labs 테스트 도구 활용
  - 모든 서브도메인에서 HTTPS 작동 확인

### HTTPS의 중요성
- **SEO 개선**: 검색 엔진이 보안 사이트 선호
- **신뢰도 향상**: 사용자에게 보안 신뢰감 제공
- **데이터 보호**: 암호화된 데이터 전송 보장

## 구현 단계

```mermaid
graph TD
    A[Register Domain on AWS Route 53] --> B[Create Hosted Zone for 2icorp.com]
    B --> C[Update Name Servers in Amazon Domain Management]
    C --> D[Go to Vercel Project Settings]
    D --> E[Add 2icorp.com to Domains]
    E --> F[Add DNS Settings from Vercel to Route 53]
    F --> G[Create Redirect Rule in Vercel]
    G --> H[Source: /*, Destination: https://{your_url}/:path, Status: 308]
    H --> I[Wait for DNS Propagation]
```

### 1. AWS Route 53 도메인 등록
1. AWS Management Console 로그인
2. Route 53 서비스로 이동
3. Hosted Zone 생성
4. NS (네임서버) 정보 확인

### 2. 도메인 네임서버 설정
1. 아마존 도메인 관리 페이지 접속
2. 도메인의 네임서버를 Route 53 네임서버로 변경

### 3. Vercel 설정
1. Vercel 대시보드 로그인
2. 해당 프로젝트 선택
3. 프로젝트 설정 > Domains
4. 해당 도메인 추가
5. DNS 설정값을 Route 53에 추가

### 4. 리다이렉트 규칙 설정
```plaintext
Source: /*
Destination: https://{your_url}/:path
Status: 308 (Permanent Redirect)
```

### 5. DNS 전파 대기
- DNS 전파 완료까지 최대 48시간 소요
- 전파 완료 후 자동 리다이렉션 작동

## 주의사항
- 308 상태 코드 사용 시 영구적 리다이렉션이므로 신중히 설정해야 합니다
- HTTPS 설정이 올바르게 되어있는지 확인하세요
- AWS 리소스를 사용할 경우 가능한 Alias 레코드 사용을 고려하세요
- 리다이렉트 체인을 만들지 않도록 주의하세요
- 정기적으로 SSL/TLS 인증서 상태를 확인하세요

## 결론
이 가이드를 따라 설정하면 AWS Route 53에서 구매한 도메인을 Vercel 호스팅 사이트로 성공적으로 리다이렉션할 수 있습니다. DNS 설정, 리다이렉션 규칙, SEO 최적화, 보안 설정을 올바르게 구성하는 것이 핵심입니다. 특히 AWS 서비스를 활용할 경우, Alias 레코드의 장점을 고려하여 설정하는 것이 좋습니다. 또한, HTTPS 설정과 SEO 최적화를 통해 안전하고 검색 엔진 친화적인 웹사이트를 구축할 수 있습니다.