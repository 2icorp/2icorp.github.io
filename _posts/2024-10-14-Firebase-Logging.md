---
layout: default
title:  "Firebase Analytics를 활용한 코호트 분석을 위한 로그 설정 방법"
date: 2024-10-15
categories: [Analytics, Firebase, React Native]
tags: [Firebase Analytics, Cohort Analysis, User Retention, React Native Firebase]
author: 이태용
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

### 1.4 Firebase 초기화 작업 (AppDelegate.mm)

iOS 프로젝트에서 Firebase를 초기화하려면 AppDelegate.mm 파일에서 다음 코드를 추가하여 Firebase가 초기화되지 않았을 경우만 초기화가 실행되도록 설정할 수 있습니다.

```objective-c
#import <Firebase.h>

if ([FIRApp defaultApp] == nil) {
[FIRApp configure];
}
```

### 1.5 Firebase DebugView 설정 (AppDelegate.mm)

Firebase DebugView는 디버그 모드에서 실시간으로 이벤트를 추적할 수 있게 해주는 도구입니다. 이를 활성화하기 위해서는 AppDelegate.mm에서 다음과 같은 코드를 추가하여 -FIRDebugEnabled 플래그를 설정합니다.

```objective-c
NSArray *args = [[NSProcessInfo processInfo] arguments];
NSMutableArray *newArgs = [args mutableCopy];
[newArgs addObject:@"-FIRDebugEnabled"];
[[NSProcessInfo processInfo] setValue:newArgs forKey:@"arguments"];
```

DebugView 끄기

디버그 모드를 비활성화하려면 -FIRDebugEnabled 대신 -FIRDebugDisabled로 변경하고 빌드를 새로 해주면 됩니다.

```objective-c
// FIRDebugEnabled 대신 FIRDebugDisabled로 변경
[newArgs addObject:@"-FIRDebugDisabled"];
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

## 6. 코호트 분석과 리텐션 분석 코드 예시

코호트 및 리텐션 분석을 위해 설치 또는 앱 열기 시점에서 로그를 남기고 분석할 수 있습니다.

```javascript
const isFirstLaunch = await AsyncStorage.getItem("is_first_open");

if (isFirstLaunch === null) {
    await logEvent("app_install", { platform: Platform.OS });
    await AsyncStorage.setItem("is_first_open", "false");
} else {
    await logEvent("app_open", { platform: Platform.OS });
}
```

## 7. 결론

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

