---
title: "React Native로 Facebook SDK 설치 및 로깅 구현하기"
last_modified_at: 2024-10-15
categories:
  - 튜토리얼
tags:
  - react-native
  - facebook-sdk
  - mobile-tracking
  - app-development
excerpt: ""
use_math: true
classes: wide
---

# React Native로 Facebook SDK 설치 및 로깅 구현하기

Expo 앱 개발에서 Facebook SDK를 위해 React Native로 전환한 후 Facebook SDK 설치부터 로깅까지의 과정을 단계별로 설명합니다. 이 글은 Facebook SDK를 설치하고 사용자의 활동을 추적할 수 있는 로깅 기능을 설정하는 방법을 다룹니다.

## Facebook SDK가 필요한 이유

실제 앱 운영에서 Facebook SDK는 다음과 같은 중요한 역할을 합니다:

1. **정확한 광고 성과 측정**
   - Facebook 광고를 통한 사용자 유입과 전환율 추적
   - ROAS(투자 수익률) 측정 가능

2. **맞춤 타겟팅**
   - 사용자 행동 기반의 맞춤 잠재고객 생성
   - 유사 잠재고객 확보 용이

3. **앱 분석**
   - 주요 이벤트 기반 사용자 행동 분석
   - 전환 퍼널 최적화

## 1. React Native로 전환하기

### 1.1 Expo Bare Workflow로 전환

Expo는 `Bare Workflow`로 전환해야만 Facebook SDK를 완전히 지원합니다:

```bash
expo eject
```

### 1.2 전환 시 주의사항

- 네이티브 코드가 변경된 경우 앱을 다시 빌드하고 심사를 받아야 합니다
- JavaScript 코드만 수정할 경우 `expo updates`로 처리 가능
- `expo run:ios`로 테스트하여 네이티브 모듈 통합 확인

## 2. Facebook SDK 설치

### 2.1 기본 설치

```bash
npm install react-native-fbsdk-next
```

### 2.2 Android 설정

#### build.gradle 수정
```gradle
dependencies {
  implementation 'com.facebook.android:facebook-android-sdk:[5,6)'
}
```

#### AndroidManifest.xml 설정
```xml
<application>
  <meta-data 
    android:name="com.facebook.sdk.ApplicationId" 
    android:value="@string/facebook_app_id"/>
  <meta-data 
    android:name="com.facebook.sdk.ClientToken" 
    android:value="@string/facebook_client_token"/>
</application>
```

#### strings.xml 설정
```xml
<resources>
  <string name="facebook_app_id">{YOUR_FACEBOOK_APP_ID}</string>
  <string name="facebook_client_token">{YOUR_CLIENT_TOKEN}</string>
</resources>
```

### 2.3 iOS 설정

#### 2.3.1 Podfile 설정
```ruby
use_expo_modules!
platform :ios
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

target '{YourApp}' do
  config = use_native_modules!
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true
  )
  
  pod 'FBSDKCoreKit'
  pod 'FBSDKLoginKit'
  
  post_install do |installer|
    react_native_post_install(installer)
  end
end
```

#### Info.plist 설정
```xml
<key>FacebookAppID</key>
<string>{YOUR_FACEBOOK_APP_ID}</string>
<key>FacebookDisplayName</key>
<string>{YourAppName}</string>
<key>FacebookClientToken</key>
<string>{YOUR_CLIENT_TOKEN}</string>
```

### 2.4 NSUserTrackingUsageDescription 추가

iOS 14.5 이후 버전에서는 앱이 사용자 활동을 추적하려면 명시적인 동의를 받아야 합니다. NSUserTrackingUsageDescription 항목을 Info.plist에 추가하여, 사용자에게 추적의 이유를 설명하는 메시지를 제공해야 합니다.

#### 2.4.1 중요사항

•	iOS 14.5 이상의 버전에서는 앱이 추적 투명성 권한을 받지 못하면 일부 이벤트는 측정되지 않으며, Facebook SDK에서 제공하는 특정 기능도 제한될 수 있습니다.
•	Facebook은 Meta SDK용 개인정보 보호 매니페스트에서 ATT 권한이 없는 경우 데이터를 집계하고 광고 성과를 측정하는 방식으로 개인정보 보호 조치를 취하고 있습니다.

#### 2.4.2 권장 메시지 예시

•	광고 타겟팅을 위한 데이터 수집 권한 요청
•	“이 앱은 사용자 활동을 추적하여 맞춤형 광고를 제공하고, 서비스 품질을 개선하는 데 사용됩니다.”

#### Info.plist

```xml
<key>NSUserTrackingUsageDescription</key>
<string>이 앱은 사용자 활동을 추적하여 맞춤형 광고를 제공하고 앱 성과를 분석합니다.</string>
```

위 내용을 추가함으로써 앱은 iOS 14.5 이상의 기기에서 적절한 추적 권한을 요청하고, Facebook SDK가 제공하는 기능을 충분히 활용할 수 있습니다.

### 2.5 SKAdNetworkItems 추가

#### 2.5.1 역할

SKAdNetworkIdentifier는 광고 네트워크의 식별자로, 광고 네트워크가 SKAdNetwork API를 통해 전환 데이터를 받을 수 있도록 허용합니다. 즉, 해당 항목에 광고 네트워크의 식별자를 추가함으로써 Apple이 앱 설치 및 전환 데이터를 광고 네트워크에 전달할 수 있습니다.


#### 2.5.2 이유

1.	광고 성과 측정: 앱 설치나 구매와 같은 전환 이벤트가 발생할 때, SKAdNetwork는 광고주에게 익명화된 전환 데이터를 제공합니다. 이를 통해 광고주(예: Facebook, Google 등)는 광고 캠페인의 성과를 측정할 수 있습니다.
2.	사용자 개인정보 보호: 사용자의 광고 클릭 및 설치 데이터를 추적하지만, 개인식별 정보를 보호하기 위해 데이터를 익명화하여 전송합니다.
3.	광고 네트워크 승인: 이 항목을 통해 앱에서 사용하는 광고 네트워크(예: Facebook, Google Ads 등)가 Apple의 SKAdNetwork API로부터 전환 데이터를 받을 수 있도록 승인됩니다.

#### 2.5.3 구조

•	<key>SKAdNetworkIdentifier</key>: SKAdNetwork에 등록된 각 광고 네트워크의 고유 식별자입니다.
•	여러 광고 네트워크가 앱 내에서 사용될 수 있기 때문에, **각 광고 네트워크마다 하나의 <dict>**로 구성되어 있습니다.

#### Info.plist

```xml
<key>SKAdNetworkItems</key>
<array>
<dict>
   <key>SKAdNetworkIdentifier</key>
   <string>{skadnetwork}</string>
</dict>
<dict>
   <key>SKAdNetworkIdentifier</key>
   <string>{skadnetwork}</string>
</dict>
<dict>
   <key>SKAdNetworkIdentifier</key>
   <string>{skadnetwork}</string>
</dict>
</array>
```

이러한 식별자를 추가함으로써, 해당 광고 네트워크들이 SKAdNetwork 프레임워크를 통해 전환 데이터를 수신할 수 있게 되는 것입니다.

### 2.4 iOS AppDelegate 설정

`AppDelegate.mm` 파일에서 다음과 같이 Facebook SDK를 초기화합니다:

```objective-c
#import <AuthenticationServices/AuthenticationServices.h>
#import <SafariServices/SafariServices.h>
#import <FBSDKCoreKit/FBSDKCoreKit-swift.h>

// Facebook SDK 초기화
[[FBSDKApplicationDelegate sharedInstance] application:application 
                     didFinishLaunchingWithOptions:launchOptions];

// Linking API
- (BOOL)application:(UIApplication *)application 
            openURL:(NSURL *)url 
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  BOOL handled = [[FBSDKApplicationDelegate sharedInstance] application:application 
                                                             openURL:url 
                                                             options:options];
  return handled || [super application:application openURL:url options:options] 
         || [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application 
        continueUserActivity:(nonnull NSUserActivity *)userActivity
        restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL result = [RCTLinkingManager application:application
                                    continueUserActivity:userActivity
                                    restorationHandler:restorationHandler];
  return [super application:application
                   continueUserActivity:userActivity
                   restorationHandler:restorationHandler] || result;
}
```

## 3. 라이브러리 충돌 해결 가이드 (IOS)

### 3.1 의존성 충돌 해결
```ruby
# Podfile 예시
platform :ios, '1x.x'

target 'YourApp' do
  # 특정 버전 고정
  pod 'FBSDKCoreKit', '~> 1x.0'
  pod 'FBSDKLoginKit', '~> 1x.0'
  
  # 모듈 헤더 문제 해결
  pod 'FBSDKCoreKit', :modular_headers => true
  
  # post_install 스크립트 추가
  post_install do |installer|
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64'
      end
    end
  end
end
```

### 3.2 충돌 해결 절차

#### 3.2.1 Podfile.lock 삭제 후 재설치:
```bash
rm Podfile.lock
npx pod-install
```

#### 3.2.2 의존성 상세 확인:
```bash
pod install --verbose
```

### 3.3 주의사항
- 라이브러리 버전 호환성 확인
- 최소 iOS 버전 요구사항 검토
- GitHub 이슈 페이지에서 알려진 문제 확인

## 4. 라이브러리 충돌 해결 가이드 (Android)

안드로이드 환경에서도 여러 라이브러리 간 충돌 문제가 발생할 수 있습니다. 이를 해결하는 방법을 아래와 같이 정리했습니다.

### 4.1 의존성 충돌 해결

#### 4.1.1 `build.gradle`에서 특정 라이브러리 버전 고정

안드로이드에서 특정 라이브러리의 버전을 고정하여 의존성 충돌을 방지할 수 있습니다. `build.gradle` 파일의 `dependencies` 블록에 다음과 같이 특정 버전을 명시합니다.

```gradle
dependencies {
    implementation 'com.facebook.android:facebook-core:17.0.0'
    implementation 'com.facebook.android:facebook-login:17.0.0'
}
```

#### 4.1.2 충돌 시 해결할 수 있는 방법

1.	의존성 버전 확인: 충돌하는 라이브러리의 버전 차이가 있는지 확인하고, 동일한 버전으로 고정하거나 호환 가능한 버전으로 업데이트합니다.
2.	gradlew dependencies 명령어로 의존성 트리 확인: 현재 사용 중인 의존성 트리를 확인하여 어떤 버전의 라이브러리들이 사용되고 있는지 파악할 수 있습니다.

```gradle
./gradlew app:dependencies
```

이 명령어를 실행하면 프로젝트 내에서 사용 중인 라이브러리들의 의존성 트리가 출력됩니다.

#### 4.1.3	force 속성 사용: 강제로 특정 라이브러리 버전을 사용할 수 있도록 force 옵션을 사용할 수 있습니다.

```gradle
configurations.all {
    resolutionStrategy {
        force 'com.facebook.android:facebook-core:17.0.0'
    }
}
```

#### 4.1.4	exclude 옵션 사용: 충돌하는 의존성을 제거할 때 exclude를 사용할 수 있습니다. 예를 들어, 다른 라이브러리와 충돌하는 google-services의 특정 모듈을 제외할 수 있습니다.

```gradle
implementation('com.google.firebase:firebase-analytics') {
    exclude group: 'com.google.android.gms', module: 'play-services-base'
}
```

### 4.2 충돌 해결 절차

안드로이드 프로젝트에서 라이브러리 충돌이 발생했을 때, 아래 절차를 통해 해결할 수 있습니다.

#### 4.2.1	build.gradle에서 의존성 버전 고정 및 충돌 방지 설정

•	충돌 원인으로 보이는 라이브러리의 버전을 동일하게 맞추거나, 강제로 특정 버전을 사용하도록 force 옵션을 추가합니다.

#### 4.2.2	캐시 정리 후 빌드 재실행

•	기존 캐시로 인해 충돌이 발생할 수 있으므로, 캐시를 정리한 후 다시 빌드를 시도합니다.

```gradle
./gradlew clean
./gradlew build
```

#### 4.2.3	의존성 트리 확인 후 충돌 원인 분석

•	./gradlew app:dependencies 명령어를 통해 의존성 트리를 확인하고, 충돌이 발생하는 라이브러리 간 버전 차이를 찾아냅니다.

#### 4.2.4	문제가 되는 라이브러리 GitHub 페이지 확인

•	충돌이 해결되지 않는 경우, 각 라이브러리의 GitHub 이슈 페이지에서 동일한 문제가 보고된 경우를 확인하고, 해결 방법을 찾습니다.

### 4.3 주의사항

•	Android SDK 버전 호환성: 프로젝트에서 사용하는 Android SDK 버전이 의존성 라이브러리에서 요구하는 최소 SDK 버전과 호환되는지 확인합니다.

•	다른 라이브러리와의 호환성 문제: 일부 라이브러리들은 특정 버전에서만 호환되는 경우가 많으므로, 버전 호환성을 명확하게 설정하는 것이 중요합니다.

•	빌드 도구 버전: gradle-wrapper.properties에서 사용하는 Gradle 버전이나 Android Gradle Plugin 버전이 최신 라이브러리들과 호환되는지 확인하세요.

```gradle
distributionUrl=https\://services.gradle.org/distributions/gradle-7.0-all.zip
```

## 5. Hermes 설정 및 Expo Updates

### 5.1 app.json 설정
```json
{
  "expo": {
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 0
    },
    "android": {
      "jsEngine": "hermes"
    },
    "ios": {
      "jsEngine": "hermes"
    }
  }
}
```

### 5.2 Podfile.properties.json 설정
```json
{
  "expo.jsEngine": "hermes"
}
```

### 5.3 Hermes 설정 주의사항
- Podfile에서 Hermes가 올바르게 설정되지 않으면 앱 첫 실행 시 충돌 가능
- `use_react_native!` 설정에서 `hermes_enabled => true` 확인
- expo updates 사용 시 Hermes 설정은 필수

## 6. SDK 초기화 및 이벤트 로깅

### 6.1 SDK 초기화
```javascript
import { Settings } from 'react-native-fbsdk-next';
Settings.initializeSDK();
```

### 6.2 안전한 이벤트 로깅
```javascript
import { AppEventsLogger } from "react-native-fbsdk-next";

export const logEventSafely = (eventName, parameters) => {
  try {
    AppEventsLogger.logEvent(eventName, parameters);
  } catch (error) {
    console.error("Error logging: ", error);
  }
};
```

## 7 광고 및 트래킹 추적 동의

React Native에서 react-native-fbsdk-next를 사용한 광고 및 트래킹 추적 동의 안내

### 7.1 광고 및 트래킹 추적의 중요성

모바일 앱에서 Facebook SDK를 통해 사용자 행동을 추적하거나 광고 성과를 측정하는 것은 마케팅 전략의 핵심 요소입니다. 특히, react-native-fbsdk-next 라이브러리는 Facebook SDK를 React Native 앱에 통합하여 사용자 이벤트 추적, 맞춤형 광고 제공, 앱 설치 성과 분석 등을 가능하게 합니다.

하지만 개인정보 보호 규정이 강화되면서, Google Play Store와 Apple App Store는 광고 추적과 관련된 정보를 사용자에게 명확히 알리고 동의를 받도록 요구합니다.

### 7.2 Google Play Store에서의 동의 요구

Google Play Store에서는 개인정보 보호 정책을 통해 AD ID(광고 ID) 및 트래킹 사용에 대한 사용자 동의를 요청해야 합니다. 이를 위해 앱 설치 시 또는 처음 실행 시 사용자에게 광고 및 트래킹 추적에 대한 동의를 구해야 합니다. Google은 이러한 동의를 받지 않고 광고 추적을 활성화하는 것을 엄격히 금지하고 있습니다.

### 7.3 Apple App Store에서의 동의 요구 (iOS 14.5+)

Apple의 iOS 14.5 이상 버전에서는 AppTrackingTransparency(ATT) 프레임워크를 사용하여 광고 및 트래킹을 수행하기 전에 사용자로부터 명시적인 동의를 받아야 합니다. 이로 인해 앱에서 사용자 추적을 시작하기 전에 광고 추적 동의 팝업을 표시해야 합니다.

Facebook SDK에서도 광고 추적 및 이벤트 기록을 위한 동의 설정이 필요합니다. 이를 위해 Settings.setAdvertiserTrackingEnabled(true) 메소드를 호출하여, 사용자의 동의 상태에 따라 광고 추적을 활성화할 수 있습니다.

```bash
npm install @react-native-tracking-transparency
```

```javascript
import { requestTrackingPermission, getTrackingStatus } from 'react-native-tracking-transparency';

const requestTracking = async () => {
const status = await requestTrackingPermission();
if (status === 'authorized') {
    console.log('Tracking authorized');
   // 사용자 동의 할 시
    Settings.setAdvertiserTrackingEnabled(true);
} else {
    console.log('Tracking not authorized');
    // 사용자 동의 안할 시
    Settings.setAdvertiserTrackingEnabled(false);
}
};
```

### 7.4 동의 받은 후의 처리

동의를 받은 후, Facebook SDK를 사용하여 이벤트 및 사용자 데이터를 기록할 수 있습니다. 또한 Google Play와 Apple App Store에서 요구하는 개인정보 보호 정책과 관련된 정보도 함께 제공해야 합니다. 사용자에게 명확한 동의 과정을 제공하지 않으면 앱이 스토어에서 승인되지 않거나 추후 문제가 발생할 수 있습니다.

## 8. 베스트 프랙티스

1. **에러 처리**
   - AppEventsLogger 호출 시 항상 try-catch 사용
   - 오류 발생 시 적절한 로깅 구현

2. **Hermes 설정**
   - Android와 iOS 모두에서 Hermes 활성화 필수
   - expo updates 사용 시 특히 중요

3. **테스트**
   - 실제 기기에서 반드시 테스트 수행
   - 네이티브 코드 수정 시 재빌드 확인

4. **이벤트 로깅**
   - 비즈니스에 중요한 핵심 이벤트 위주로 구현
   - 파라미터 검증 후 전송

## 마치며

Bare Workflow로 전환한 후에는 네이티브 코드와 관련된 설정이 매우 중요합니다. 특히 **Hermes**를 활성화하지 않으면 `expo updates`를 사용할 때 충돌 문제가 발생할 수 있습니다. Android와 iOS 모두에서 **Hermes**를 설정해야 하며, 이를 통해 앱 성능 최적화와 코드 푸시를 효율적으로 관리할 수 있습니다.

또한, Facebook SDK를 활용하여 사용자 이벤트를 로깅할 때에는 **AppEventsLogger**를 방어적으로 래핑하여 오류를 방지하는 것이 중요합니다. 이렇게 설정된 로그 이벤트는 앱 성과 분석과 광고 타겟팅에 매우 유용하게 사용될 수 있습니다.

## 최신 글
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>