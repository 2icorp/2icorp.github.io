---
layout: default
title:  "React Native로 Facebook SDK 설치 및 로깅 구현하기"
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
    </application>
</manifest>
```

#### 2.2.3 Facebook App ID 설정

`android/app/src/main/res/values/strings.xml` 파일에 다음 코드를 추가하여 Facebook App ID를 설정합니다:

```xml
<resources>
  <string name="facebook_app_id">YOUR_FACEBOOK_APP_ID</string>
</resources>
```

### 2.3 iOS 설정

iOS에서 Facebook SDK 설정을 위해 `CocoaPods`를 사용합니다.

#### 2.3.1 `Podfile` 수정

`ios/Podfile` 파일을 열고 Facebook SDK 종속성을 추가합니다:

```ruby
pod 'react-native-fbsdk-next', :path => '../node_modules/react-native-fbsdk-next'
```

#### 2.3.2 Facebook App ID 및 설정 추가

`ios/{YourApp}/Info.plist` 파일에 다음을 추가하여 Facebook SDK를 설정합니다:

```xml
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
```

그 후, `pod install` 명령어를 실행하여 변경 사항을 반영합니다.

```bash
cd ios/ && pod install
```

## 3. Facebook SDK 초기화

앱에서 Facebook SDK를 초기화하려면 앱 시작 시에 SDK를 초기화하는 코드를 추가해야 합니다.

```javascript
import { Settings } from 'react-native-fbsdk-next';

Settings.initializeSDK();
```

이 코드를 `App.js` 또는 앱이 처음 시작되는 곳에 추가하면 됩니다.

## 4. Facebook 로그인 구현

Facebook 로그인은 사용자 인증을 처리하는 일반적인 기능입니다. 이를 구현하려면 로그인 버튼을 추가하고, Facebook의 인증 결과를 받아서 처리하는 코드를 작성해야 합니다.

### 4.1 로그인 버튼 추가

```javascript
import React from 'react';
import { LoginButton, AccessToken } from 'react-native-fbsdk-next';

const FacebookLogin = () => {
  const handleLogin = (error, result) => {
    if (error) {
      console.error("Login failed with error: " + error);
    } else if (result.isCancelled) {
      console.log("Login was cancelled");
    } else {
      AccessToken.getCurrentAccessToken().then(data => {
        console.log("Login successful, token: " + data.accessToken.toString());
      });
    }
  };

  return (
    <LoginButton
      onLoginFinished={handleLogin}
      onLogoutFinished={() => console.log("User logged out")}
    />
  );
};

export default FacebookLogin;
```

### 4.2 로그인 결과 로깅

로그인 성공 후 Facebook의 `AccessToken`을 받아와 이를 기록하고 필요한 로그를 남길 수 있습니다.

```javascript
AccessToken.getCurrentAccessToken().then(data => {
  if (data) {
    console.log("Facebook AccessToken: " + data.accessToken.toString());
    // Firebase Analytics나 다른 로깅 시스템을 활용해 기록
  }
});
```

## 5. Facebook 로그 이벤트 추가

Facebook SDK는 기본적으로 로그 이벤트를 기록할 수 있는 기능도 제공합니다. 예를 들어 사용자가 특정 작업을 완료했을 때 이벤트를 Facebook에 기록할 수 있습니다.

### 5.1 이벤트 로깅 예시

```javascript
import { AppEventsLogger } from 'react-native-fbsdk-next';

// 이벤트 로깅 함수
const logEvent = () => {
  AppEventsLogger.logEvent('purchase', { value: 10, currency: 'USD' });
};

// 이 함수는 사용자가 구매를 완료했을 때 호출됩니다.
```

이 코드를 통해 특정 사용자 활동(예: 구매, 로그인 등)을 Facebook 이벤트로 기록할 수 있습니다. 이러한 로그는 나중에 분석 및 광고 타겟팅을 위해 활용될 수 있습니다.

## 6. 결론

React Native 앱에서 Facebook SDK를 활용하면 사용자 로그인, 로그 이벤트 기록 등 다양한 기능을 구현할 수 있습니다. 이 글에서는 SDK 설치에서부터 iOS 및 Android 설정, 로그인 구현, 이벤트 로깅까지의 전체 과정을 다뤘습니다. Facebook SDK를 사용한 로그는 앱 성과 분석 및 광고 최적화에 중요한 데이터를 제공합니다.

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