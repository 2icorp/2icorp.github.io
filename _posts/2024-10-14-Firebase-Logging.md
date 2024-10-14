---
layout: default
title:  "Firebase Analytics를 활용한 코호트 분석을 위한 로그 설정 방법"
---

# Firebase Analytics를 활용한 코호트 분석을 위한 로그 설정 방법

React Native로 개발한 앱에서 Firebase Analytics를 사용해 코호트 분석을 하려면, 이벤트 로그를 적절히 설정하고 추적해야 합니다. 이 글에서는 Firebase Analytics를 이용한 이벤트 로깅과 코호트 분석을 글로벌 기업 수준으로 구현하는 방법을 단계별로 소개합니다.

## 1. Firebase Analytics 설치 및 설정

먼저 Firebase Analytics를 React Native 프로젝트에 설치하고 설정해야 합니다.

### 1.1 Firebase Analytics 패키지 설치

React Native 앱에 Firebase Analytics를 설치하려면 다음 명령어를 실행하세요:

```bash
npm install @react-native-firebase/app @react-native-firebase/analytics
```

### 1.2 Android 설정

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

### 1.3 iOS 설정

iOS에서는 Firebase 설정을 위해 `CocoaPods`를 사용해야 합니다. `ios/Podfile`에 다음을 추가하세요:

```ruby
pod 'RNFBAnalytics', :path => '../node_modules/@react-native-firebase/analytics'
```

그 후 `pod install`을 실행합니다:

```bash
cd ios/ && pod install
```

## 2. Firebase Analytics 로그 이벤트 정의

코호트 분석을 위해서는 사용자 행동에 대한 이벤트를 정확하게 정의하고 추적해야 합니다. 이벤트는 사용자의 전환과 관련된 중요한 행동을 기록해야 합니다.

### 2.1 이벤트 로깅 코드 예시

아래는 앱 실행 시 또는 특정 행동이 발생할 때 Firebase에 로그를 남기는 방법입니다.

#### 앱 설치 추적

```javascript
import analytics from '@react-native-firebase/analytics';

// 앱이 처음 실행될 때 호출
async function logAppInstall() {
  await analytics().logEvent('app_install', {
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
  });
}
```

#### 로그인 이벤트 추적

```javascript
async function logLoginMethod(method) {
  await analytics().logEvent('login', {
    method: method, // 로그인 방법 (e.g., 'Google', 'Facebook')
    timestamp: new Date().toISOString(),
  });
}
```

#### 인앱 구매 이벤트 추적

```javascript
async function logPurchase(purchaseId, amount, currency) {
  await analytics().logEvent('purchase', {
    id: purchaseId,
    amount: amount,
    currency: currency,
    timestamp: new Date().toISOString(),
  });
}
```

## 3. 코호트 분석을 위한 이벤트 설계 방법

글로벌 기업들이 효과적으로 코호트 분석을 하기 위해서는 중요한 전환 지점에 해당하는 이벤트를 설계하는 것이 중요합니다. 예를 들어:

- **첫 방문:** 사용자가 처음 앱을 실행한 시점
- **회원가입:** 사용자가 가입한 시점
- **로그인:** 사용자가 로그인한 시점
- **구매:** 사용자가 인앱 구매를 완료한 시점
- **구독 시작/종료:** 사용자가 구독 서비스를 시작하거나 종료한 시점

### 코호트 분석을 위한 로그 예시

다음과 같은 이벤트를 정의하여 코호트 분석을 할 수 있습니다:

#### 첫 방문 후 로그인한 사용자 추적

```javascript
async function trackLoginAfterInstall() {
  await analytics().logEvent('app_install', { platform: Platform.OS });
  // 이후 첫 로그인 이벤트 기록
  await analytics().logEvent('login', { method: 'Google' });
}
```

#### 구매 후 30일간 활동 추적

```javascript
async function trackPurchaseAfterActivity() {
  await analytics().logEvent('purchase', { amount: 10000, currency: 'USD' });
  // 이후 30일 동안의 활동 로그 추적 가능
}
```

## 4. Firebase 콘솔에서 코호트 분석 활용

Firebase Analytics 콘솔의 코호트 기능을 활용해 특정 이벤트를 기준으로 사용자 그룹을 분석할 수 있습니다. 예를 들어:

- **설치 후 7일 이내 로그인한 사용자**
- **구매 후 30일간 활동한 사용자**

이러한 방식으로 사용자의 행동 패턴을 분석하고, 각 그룹의 전환율을 추적할 수 있습니다.

## 5. 추가적인 팁

### 커스텀 파라미터 활용

이벤트에 **커스텀 파라미터**를 추가하여 더 세부적인 데이터를 추적할 수 있습니다. 예를 들어, 구매 이벤트에 상품 ID나 가격을 기록하는 방식입니다.

```javascript
await analytics().logEvent('purchase', {
  id: 'product_123',
  amount: 10000,
  currency: 'USD',
});
```

### 유저 속성 설정

사용자 속성을 설정하여 특정 사용자 그룹을 대상으로 분석할 수 있습니다. 예를 들어, 앱을 사용하는 사용자의 **언어 설정**이나 **국가**를 기록할 수 있습니다.

```javascript
await analytics().setUserProperty('favorite_language', 'english');
```

## 6. 결론

Firebase Analytics를 통해 코호트 분석을 하려면, **사용자 행동을 적절히 추적**하고, **이벤트 로그를 명확하게 정의**하는 것이 중요합니다. 이를 통해 전환율, 유지율 등을 분석하고, 앱의 성과를 극대화할 수 있습니다. 특히 커스텀 파라미터와 유저 속성 설정을 활용하면 더 깊이 있는 분석이 가능합니다.

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

