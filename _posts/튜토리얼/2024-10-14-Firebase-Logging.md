---
title: "Firebase Analytics 설치 및 설정 가이드: 사용자 행동 추적과 코호트 분석을 통한 데이터 기반 의사결정 심층 분석"
last_modified_at: 2024-10-14
categories:
  - 튜토리얼
tags:
  - Firebase Analytics
  - Cohort Analysis
  - User Retention
  - Mobile Analytics
excerpt: ""
use_math: true
classes: wide
---

## 1. Firebase Analytics 선택의 근거

현재 모바일 앱 시장에는 다양한 분석 도구들이 존재합니다. Google Analytics, Amplitude, Facebook Analytics 등 각각의 도구들은 저마다의 특징과 장점을 가지고 있습니다. 이러한 상황에서 Firebase Analytics를 선택해야 하는 이유를 자세히 살펴보겠습니다.

### 1.1. 비용 효율성
Firebase Analytics는 기본적으로 무료 서비스를 제공하며, 다음과 같은 특징을 가집니다:

- **무제한 이벤트 추적**
    - 모든 사용자 행동 데이터 수집 가능
    - 이벤트당 최대 25개의 매개변수 지원
    - 사용자당 최대 500개의 서로 다른 이벤트 타입 생성 가능

- **무제한 사용자 수**
    - 앱의 규모에 관계없이 모든 사용자 데이터 수집
    - 확장 가능한 인프라 구조
    - 성장하는 서비스에도 추가 비용 없음

- **Big Query 연동 옵션**
    - 필요시에만 유료 서비스로 전환
    - 데이터 심층 분석 가능
    - 커스텀 리포트 생성 지원

### 1.2. 퍼널 분석의 강점
퍼널 분석은 사용자의 전환 과정을 단계별로 추적하는 핵심 기능입니다:

- **전환 단계 설정**
  ```typescript
  // 구매 퍼널 추적 예시
  const trackPurchaseFunnel = async (stage: string, productId: string) => {
    await analytics().logEvent('purchase_funnel', {
      stage: stage,
      product_id: productId,
      timestamp: new Date().toISOString(),
      user_type: await getUserType()
    });
  };

  // 각 단계별 추적
  await trackPurchaseFunnel('view_product', 'SKU_123');
  await trackPurchaseFunnel('add_to_cart', 'SKU_123');
  await trackPurchaseFunnel('begin_checkout', 'SKU_123');
  await trackPurchaseFunnel('purchase_complete', 'SKU_123');
  ```

- **이탈률 분석**
    - 각 단계별 이탈률 자동 계산
    - 문제 지점 식별 용이
    - A/B 테스트 결과 추적 가능

- **최적화 기회 발견**
    - 단계별 성과 지표 제공
    - 개선 포인트 도출
    - ROI 측정 가능

### 1.3. 코호트 분석의 심층적 이해
코호트 분석은 사용자 그룹의 행동 패턴을 시간에 따라 추적하는 고급 분석 방법입니다.

#### 코호트 분석의 주요 지표
1. **리텐션 트렌드**
    - 일일/주간/월간 활성 사용자
    - 재방문율
    - 장기 사용자 비율

2. **사용자 세그먼트 분석**
    - 연령대별 사용 패턴
    - 지역별 활성도
    - 디바이스별 선호도

3. **가치 기반 분석**
    - 고객 생애 가치(LTV)
    - 구매 주기
    - 충성도 지표

## 2. Firebase Analytics의 데이터 구조 이해

### 2.1. 사용자 속성 (User Properties)
사용자 속성은 개별 사용자의 특성을 정의하는 중요한 메타데이터입니다:

```typescript
// 사용자 속성 관리 유틸리티
const UserPropertyManager = {
    setBasicProperties: async (user: UserProfile) => {
        await analytics().setUserProperty('user_tier', user.tier);
        await analytics().setUserProperty('registration_date', user.registrationDate);
        await analytics().setUserProperty('preferred_language', user.language);
        await analytics().setUserProperty('account_type', user.accountType);
    },

    updateEngagementProperties: async (engagement: UserEngagement) => {
        await analytics().setUserProperty('last_activity_date', engagement.lastActive);
        await analytics().setUserProperty('session_count', String(engagement.sessionCount));
        await analytics().setUserProperty('total_purchases', String(engagement.purchaseCount));
    }
};
```

### 2.2. 이벤트 구조화
Firebase Analytics의 이벤트는 다음과 같은 세 가지 카테고리로 구분됩니다:

#### 1) 자동 수집 이벤트
시스템에서 자동으로 추적되는 기본 이벤트들:

- **first_open**
    - 최초 설치 후 실행
    - 재설치 추적
    - 설치 출처 정보

- **session_start**
    - 세션 시작 시점
    - 세션 길이 측정
    - 사용 패턴 분석

- **app_update**
    - 업데이트 설치 추적
    - 버전별 사용자 분포
    - 업데이트 전환율

#### 2) 기본 제공 이벤트
Firebase가 미리 정의한 표준 이벤트들:

```typescript
// 기본 제공 이벤트 추적 예시
const StandardEventTracker = {
    logSearch: async (searchData: SearchInfo) => {
        await analytics().logEvent('search', {
            search_term: searchData.query,
            number_of_results: searchData.resultCount
        });
    }
};
```

#### 3) 커스텀 이벤트
비즈니스 특화된 맞춤 이벤트:

```typescript
// 커스텀 이벤트 관리자
const CustomEventManager = {
    logBusinessMetric: async (metric: BusinessMetric) => {
        await analytics().logEvent('business_metric', {
            metric_name: metric.name,
            metric_value: metric.value,
            metric_unit: metric.unit,
            business_vertical: metric.vertical
        });
    }
};
```

## 3. 리텐션 분석의 전략적 활용

### 3.1. 리텐션의 비즈니스 가치
리텐션은 앱의 장기적 성공을 결정하는 핵심 지표입니다:

- **사용자 유지 비용**
    - 신규 사용자 획득 비용의 1/5
    - ROI 향상에 직접적 영향
    - 마케팅 효율성 증대

- **수익성 향상**
    - LTV 증가
    - 구매 전환율 개선
    - 브랜드 충성도 강화

### 3.2. 리텐션 측정 방법론
다양한 각도에서 리텐션을 측정하고 분석합니다:

```typescript
// 리텐션 추적 시스템
const RetentionTracker = {
    trackUserRetention: async (userData: UserRetentionData) => {
        await analytics().logEvent('retention_check', {
            days_since_first_open: userData.daysSinceFirstOpen,
            session_count: userData.sessionCount,
            last_session_date: userData.lastSessionDate,
            feature_usage_count: userData.featureUsageCount,
            user_segment: userData.segment
        });
    },

    trackEngagementMetrics: async (engagement: EngagementMetrics) => {
        await analytics().logEvent('engagement_metrics', {
            daily_active_time: engagement.activeTimeMinutes,
            features_used: engagement.featuresUsed,
            social_interactions: engagement.socialInteractions,
            content_consumed: engagement.contentConsumed
        });
    }
};
```

### 3.3. 리텐션 개선 전략
데이터 기반의 리텐션 개선 방안:

1. **온보딩 최적화**
    - 첫 사용 경험 개선
    - 핵심 가치 전달 강화
    - 사용자 이해도 측정

2. **참여도 향상**
    - 개인화된 콘텐츠 제공
    - 보상 시스템 구축
    - 소셜 기능 강화

3. **이탈 방지**
    - 위험 신호 조기 감지
    - 자동화된 리인게이지먼트
    - 피드백 수집 및 분석

## 4. Firebase Analytics의 실제 구현

먼저 Firebase Analytics를 React Native 프로젝트에 설치하고 설정해야 합니다.

### 4.1 Firebase Analytics 패키지 설치

React Native 앱에 Firebase Analytics를 설치하려면 다음 명령어를 실행하세요:

```bash
npm install @react-native-firebase/app @react-native-firebase/analytics
```

### 4.2 Android 설정

`android/build.gradle` 파일에 Firebase SDK를 설정합니다:

```gradle
buildscript {
  dependencies {
    // Firebase SDK 추가
    classpath 'com.google.gms:google-services:4.3.10'
  }
}
```

그 다음, `android/app/build.gradle`에 다음을 추가합니다:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### 4.3 iOS 설정

iOS에서는 Firebase 설정을 위해 `CocoaPods`를 사용해야 합니다.

광고 식별자가 필요하지 않으므로, Firebase Analytics에서 광고 ID를 비활성화하여 사용자의 개인 정보를 더욱 보호하고, 불필요한 데이터 수집을 방지하고자 합니다.
또한, Firebase SDK와의 패키지 충돌 문제를 방지하기 위해 Firebase SDK 버전과 충돌되는 다른 패키지의 버전을 명시적으로 설정하였습니다.
iOS 설정에서 Firebase와 expo-face-detector 라이브러리 간의 GoogleUtilities 버전 충돌을 방지하기 위해, expo-face-detector 대신 @react-native-ml-kit/face-detection 라이브러리를 사용하는 것을 권장합니다.
이 과정에서 GoogleUtilities 라이브러리의 버전을 명시적으로 설정하여 문제를 해결할 수 있습니다.

`ios/Podfile`에 추가된 설정은 다음과 같습니다:

```ruby
$RNFirebaseAnalyticsWithoutAdIdSupport = true
$FirebaseSDKVersion = '10.29.0'

use_modular_headers!

# Firebase 설정
pod 'Firebase/Auth', $FirebaseSDKVersion
pod 'Firebase/Core', $FirebaseSDKVersion
pod 'FirebaseAnalytics', $FirebaseSDKVersion
pod 'GoogleSignIn', '~> 7.0.0'

# Google Utilities
pod 'GoogleUtilities/Network', '~> 7.11'
pod 'GoogleUtilities', '~> 7.13.0'
```

그 후 `pod install`을 실행합니다:

```bash
cd ios/ && pod install
```

### 4.4 Firebase 초기화 작업 (AppDelegate.mm)

iOS 프로젝트에서 Firebase를 초기화하려면 AppDelegate.mm 파일에서 다음 코드를 추가하여 Firebase가 초기화되지 않았을 경우만 초기화가 실행되도록 설정할 수 있습니다.

```objective-c
#import <Firebase.h>

if ([FIRApp defaultApp] == nil) {
[FIRApp configure];
}
```

### 4.5 Firebase DebugView 설정 (AppDelegate.mm)

#### 4.5.1 DebugView 켜기

Firebase DebugView는 디버그 모드에서 실시간으로 이벤트를 추적할 수 있게 해주는 도구입니다. 이를 활성화하기 위해서는 AppDelegate.mm에서 다음과 같은 코드를 추가하여 -FIRDebugEnabled 플래그를 설정합니다.

```objective-c
NSArray *args = [[NSProcessInfo processInfo] arguments];
NSMutableArray *newArgs = [args mutableCopy];
[newArgs addObject:@"-FIRDebugEnabled"];
[[NSProcessInfo processInfo] setValue:newArgs forKey:@"arguments"];
```


#### 4.5.2 DebugView 끄기

디버그 모드를 비활성화하려면 -FIRDebugEnabled 대신 -FIRDebugDisabled로 변경하고 빌드를 새로 해주면 됩니다.

```objective-c
// FIRDebugEnabled 대신 FIRDebugDisabled로 변경
[newArgs addObject:@"-FIRDebugDisabled"];
```

## 5. 코호트 분석을 위한 이벤트 설계 방법

글로벌 기업들이 효과적으로 코호트 분석을 하기 위해서는 중요한 전환 지점에 해당하는 이벤트를 설계하는 것이 중요합니다. 예를 들어:

- **첫 방문:** 사용자가 처음 앱을 실행한 시점
- **회원가입:** 사용자가 가입한 시점
- **로그인:** 사용자가 로그인한 시점
- **구매:** 사용자가 인앱 구매를 완료한 시점
- **구독 시작/종료:** 사용자가 구독 서비스를 시작하거나 종료한 시점

### 5.1 코호트 분석을 위한 로그 예시

다음과 같은 이벤트를 정의하여 코호트 분석을 할 수 있습니다:

#### 5.1.1 첫 방문 후 로그인한 사용자 추적

```javascript
async function trackLoginAfterInstall() {
  await analytics().logEvent('app_install', { platform: Platform.OS });
  // 이후 첫 로그인 이벤트 기록
  await analytics().logEvent('login', { method: 'Google' });
}
```

#### 5.1.2 구매 후 30일간 활동 추적

```javascript
async function trackPurchaseAfterActivity() {
  await analytics().logEvent('purchase', { amount: 10000, currency: 'USD' });
  // 이후 30일 동안의 활동 로그 추적 가능
}
```

## 6. Firebase 콘솔에서 코호트 분석 활용

Firebase Analytics 콘솔의 코호트 기능을 활용해 특정 이벤트를 기준으로 사용자 그룹을 분석할 수 있습니다. 예를 들어:

- **설치 후 7일 이내 로그인한 사용자**
- **구매 후 30일간 활동한 사용자**

이러한 방식으로 사용자의 행동 패턴을 분석하고, 각 그룹의 전환율을 추적할 수 있습니다.

## 결론

Firebase Analytics는 단순한 분석 도구를 넘어 비즈니스 의사결정을 위한 전략적 도구입니다. 특히 리텐션과 코호트 분석을 통해 사용자의 행동을 깊이 있게 이해하고, 이를 바탕으로 제품을 개선할 수 있습니다.

실시간 분석의 한계가 있지만, Big Query 연동을 통한 심층 분석 능력과 무료로 제공되는 강력한 기본 기능들은 Firebase Analytics를 모바일 앱 분석의 핵심 도구로 만들어줍니다.

특히 코호트 분석과 리텐션 분석을 통해 얻은 인사이트는 제품의 장기적 성공을 위한 로드맵 수립에 직접적인 도움이 될 것입니다.

## 최신 글
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>