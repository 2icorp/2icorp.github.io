---
layout: default
title:  "React Native로 Facebook SDK 설치 및 로깅 구현하기"
date: 2024-10-15
categories: [Facebook SDK, React Native]
tags: [Facebook SDK, Bare Workflow, React Native, Mobile App Tracking]
author: 이태용
---

# React Native로 Facebook SDK 설치 및 로깅 구현하기

Expo 앱 개발에서 Facebook SDK를 위해 React Native로 전환한 후 Facebook SDK 설치부터 로깅까지의 과정을 단계별로 설명합니다. 이 글은 Facebook SDK를 설치하고 사용자의 활동을 추적할 수 있는 로깅 기능을 설정하는 방법을 다룹니다.

## 1. React Native로 전환하기

Expo는 `Bare Workflow`로 전환해야만 Facebook SDK를 완전히 지원합니다. 프로젝트를 Expo에서 Bare Workflow로 전환한 후 Facebook SDK를 설치하고 설정해야 합니다.

### 1.1 Expo Bare Workflow로 전환

다음 명령어를 통해 Expo에서 Bare Workflow로 전환합니다:

```bash
expo eject
```

eject 명령어를 실행하면 Expo에서 생성한 기본 프로젝트에 네이티브 Android 및 iOS 디렉토리가 추가됩니다. 이 디렉토리에서 Android 및 iOS 파일을 직접 수정할 수 있습니다.

### 1.2 Bare Workflow 전환 후 네이티브 코드의 중요성

Bare Workflow로 전환한 후에는 더 이상 단순히 JavaScript 코드만 업데이트하는 방식인 `expo updates`를 사용할 수 없습니다. 네이티브 코드가 변경되었기 때문에 **앱을 다시 빌드하고 심사**를 보내야 합니다. 심사가 완료된 후에야 네이티브 코드를 포함한 새 버전의 앱이 사용자에게 배포되며, 이후 JavaScript 코드 수정은 `expo updates`로 처리할 수 있습니다.

### 1.3 Expo run:ios로 테스트하기

`react-native-fbsdk-next`와 같은 네이티브 기능을 사용하는 경우, 테스트는 실제 휴대폰에서 하는 대신 **Xcode**를 사용하여 `expo run:ios`로 빌드하고 실행합니다. Xcode로 빌드한 후, 앱이 에러 없이 실행되는지 확인하는 것이 중요합니다. 이를 통해 네이티브 모듈과의 통합이 원활히 이루어지는지 확인할 수 있습니다.

## 2. Facebook SDK 설치

React Native에서 Facebook SDK를 설치하려면 `react-native-fbsdk-next` 패키지를 사용해야 합니다. Facebook SDK는 앱의 사용자 로그인을 처리하고 광고 추적 및 앱 분석 기능을 제공합니다.

### 2.1 Facebook SDK 설치 명령어

```bash
npm install react-native-fbsdk-next
```

### 2.2 Android 설정

#### 2.2.1 `android/app/build.gradle` 파일 수정

```gradle
dependencies {
  implementation 'com.facebook.android:facebook-android-sdk:[5,6)'
}
```

#### 2.2.2 `android/app/src/main/AndroidManifest.xml` 파일 수정

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yourapp">

    <application
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher">
      
      <!-- Facebook SDK 초기화 -->
      <meta-data android:name="com.facebook.sdk.ApplicationId" android:value="@string/facebook_app_id"/>
      <meta-data android:name="com.facebook.sdk.ClientToken" android:value="@string/facebook_client_token" />
    </application>
</manifest>
```

#### 2.2.3 Facebook App ID 설정

`android/app/src/main/res/values/strings.xml` 파일에 다음 코드를 추가하여 Facebook App ID를 설정합니다:

```xml
<resources>
  <string name="facebook_app_id">YOUR_FACEBOOK_APP_ID</string>
  <string name="facebook_client_token">YOUR_CLIENT_TOKEN</string>
</resources>
```

### 2.3 iOS 설정

iOS에서 Facebook SDK 설정을 위해 `CocoaPods`를 사용합니다.

#### 2.3.1 `Podfile` 수정

`ios/Podfile` 파일을 열고 Facebook SDK 종속성을 추가합니다:

```ruby
use_expo_modules!

pod 'FBSDKCoreKit', '~> 17.0'
pod 'FBSDKLoginKit', '~> 17.0'  # Facebook 로그인 기능을 사용할 경우
```

#### 2.3.2 Facebook App ID 및 설정 추가

`ios/{YourApp}/Info.plist` 파일에 다음을 추가하여 Facebook SDK를 설정합니다:

```text
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>fbYOUR_FACEBOOK_APP_ID</string>
    </array>
  </dict>
</array>

<key>FacebookAppID</key>
<string>YOUR_FACEBOOK_APP_ID</string>

<key>FacebookDisplayName</key>
<string>YourAppName</string>

<key>FacebookClientToken</key>
<string>YOUR_CLIENT_TOKEN</string>

<key>NSUserTrackingUsageDescription</key>
<string>The app tracks user activity to provide personalized ads.</string>

<key>SKAdNetworkItems</key>
<array>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>cstr6suwn9.skadnetwork</string>
  </dict>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>v9wttpbfk9.skadnetwork</string>
  </dict>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>n38lu8286q.skadnetwork</string>
  </dict>
</array>
```

그 후, `pod install` 명령어를 실행하여 변경 사항을 반영합니다.

```bash
cd ios/ && pod install
```

### 2.4 iOS AppDelegate 설정

`AppDelegate.mm` 파일에서 Facebook SDK 초기화를 추가해야 합니다. 이 코드는 iOS에서 Facebook 로그인을 처리하고 SDK를 초기화하는 역할을 합니다.

```objective-c
#import <AuthenticationServices/AuthenticationServices.h>
#import <SafariServices/SafariServices.h>
#import <FBSDKCoreKit/FBSDKCoreKit-swift.h>

// Facebook SDK 초기화
[[FBSDKApplicationDelegate sharedInstance] application:application didFinishLaunchingWithOptions:launchOptions];

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  BOOL handled = [[FBSDKApplicationDelegate sharedInstance] application:application openURL:url options:options];
  return handled || [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || result;
}
```

## 3. Hermes 설정 및 Expo Updates

Bare Workflow로 전환한 후 **Hermes**를 활성화하는 것이 필수입니다. `Hermes`는 React Native에서 성능을 높이는 JavaScript 엔진이며, 이를 활성화하지 않으면 `expo updates`에서 발생하는 충돌이나 성능 저하를 경험할 수 있습니다.

### 3.1 `app.json` 파일 설정

`app.json` 파일에서 Hermes를 활성화하기 위해 다음 설정을 추가해야 합니다:

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

### 3.2 `Podfile.properties.json` 설정

`ios/Podfile.properties.json` 파일에서 Hermes를 활성화하는 설정을 추가합니다:

```json
{
  "expo.jsEngine": "hermes"
}
```

### 3.3 Podfile 설정 주의사항

`Podfile`에서 Hermes가 올바르게 설정되지 않으면, 앱이 첫 실행 시 충돌할 수 있습니다. Podfile에서 Hermes 설정이 제대로 반영되도록 확인해야 하며, 다음과 같은 설정을 추가합니다:

```ruby
# Hermes 엔진 사용을 위한 설정
use_expo_modules!

platform :ios, '12.4'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

target 'YourApp' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true  # Hermes 활성화
  )

  # Facebook SDK 추가
  pod 'FBSDKCoreKit', '~> 17.0'
  pod 'FBSDKLoginKit', '~> 17.0'

  post_install do |installer|
    react_native_post_install(installer)
  end
end
```

## 4. Facebook SDK 초기화

앱에서 Facebook SDK를 초기화하려면 앱 시작 시에 SDK를 초기화하는 코드를 추가해야 합니다.

```javascript
import { Settings }

 from 'react-native-fbsdk-next';

Settings.initializeSDK();
```

이 코드를 `App.js` 또는 앱이 처음 시작되는 곳에 추가하면 됩니다.

## 5. Facebook 구매 이벤트 로깅

Facebook SDK에서 사용자의 구매 이벤트를 로깅할 수 있습니다. 하지만, **AppEventsLogger**가 값이 없을 때 문제가 발생할 수 있기 때문에, 이를 방어적으로 처리하는 코드를 작성하는 것이 중요합니다.

### 5.1 안전한 구매 로깅 함수

다음과 같이 `logPurchaseSafely` 함수를 사용하여 **AppEventsLogger**가 값이 없을 때 발생할 수 있는 충돌을 방지할 수 있습니다:

```javascript
import { AppEventsLogger } from "react-native-fbsdk-next";
import { Params } from "react-native-fbsdk-next/src/FBAppEventsLogger";

export const logPurchaseSafely = (
  purchaseAmount: number,
  currencyCode: string,
  parameters
) => {
  try {
    AppEventsLogger.logPurchase(purchaseAmount, currencyCode, parameters);
  } catch (error) {
    console.error("Error logging purchase: ", error);
  }
};
```

이 함수를 활용하여 안전하게 구매 이벤트를 로깅할 수 있습니다:

```javascript
logPurchaseSafely(discountedProduct?.price, country, {
  version: response.customerInfo.originalApplicationVersion || "",
  lang: i18n.locale,
  concept_id: productIdentifier,
  customer_id: response.customerInfo.originalAppUserId,
  purchase_date: response.transaction.purchaseDate,
});
```

구매 이벤트 로깅 중 **AppEventsLogger**에 문제가 발생했을 때, 앱이 충돌하지 않고 에러를 안전하게 처리하도록 방어코드를 추가하였습니다.

## 6. 결론

Bare Workflow로 전환한 후에는 네이티브 코드와 관련된 설정이 매우 중요합니다. 특히 **Hermes**를 활성화하지 않으면 `expo updates`를 사용할 때 충돌 문제가 발생할 수 있습니다. Android와 iOS 모두에서 **Hermes**를 설정해야 하며, 이를 통해 앱 성능 최적화와 코드 푸시를 효율적으로 관리할 수 있습니다.

또한, Facebook SDK를 활용하여 사용자 구매 이벤트를 로깅할 때에는 **AppEventsLogger**를 방어적으로 래핑하여 오류를 방지하는 것이 중요합니다. 이렇게 설정된 로그 이벤트는 앱 성과 분석과 광고 타겟팅에 매우 유용하게 사용될 수 있습니다.

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

