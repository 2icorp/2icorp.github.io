---
title: "Branch.io 디퍼드 딥링크를 활용한 마케팅 트래킹과 오가닉 성장"
last_modified_at: 2024-10-27
categories:
  - 튜토리얼
tags:
  - React Native
  - Branch.io
  - Deferred Deep Linking
  - Marketing Analytics
excerpt: "Branch.io를 활용하여 디퍼드 딥링크를 구현하고 유료/오가닉 사용자를 구분하여 트래킹하고, 유저 초대/공유 기능을 통한 오가닉 성장을 다룬 가이드입니다."
use_math: true
classes: wide
---

## 들어가며

모바일 앱 성장을 위해서는 크게 두 가지가 필요합니다:
1. 안정적인 사용자 유입 경로 (딥링크)
2. 정확한 유입 출처 추적 (유저 트래킹)
3. 유저 초대/공유 기능을 통한 오가닉 성장

홈페이지에서 스토어 설치로 유입된 유저의 URL 파라미터를 어떻게 앱에서 가져올 수 있을지에 대한 고민이 있었습니다. 이 문제를 해결하고자 Branch.io로 전환했고, 이 과정에서 얻은 경험을 공유하고자 합니다.

## Branch.io란?

Branch.io는 모바일 링킹 플랫폼으로, 앱 성장과 사용자 경험 향상을 위한 다양한 솔루션을 제공합니다. 특히 NativeLink™라는 혁신적인 기술을 통해 Private Relay 환경에서도 IP 주소 없이 디퍼드 딥링크를 구현할 수 있습니다.

## Branch.io와 NativeLink™
iOS 환경에서는 사용자 프라이버시 보호를 위한 제약이 많아, 안정적인 딥링크 구현이 더욱 중요해졌습니다. NativeLink™는 iOS의 프라이버시 제약을 우회하면서도 안정적인 딥링크 경험을 제공합니다.

## 디퍼드 딥링크(Deferred Deep Link)란?
디퍼드 딥링크는 '지연된 딥링크'를 의미하는 기술로, 앱이 설치되지 않은 사용자도 앱 설치 후 원하는 페이지로 자연스럽게 연결할 수 있게 해주는 솔루션입니다.

## 작동 원리
1. **디퍼드 딥링크 흐름**
    - 사용자가 Branch 링크 클릭
    - 웹 브라우저에서 NativeLink™ CTA 버튼 표시
    - CTA 클릭 시 URL이 클립보드에 복사
    - App Store로 이동하여 앱 설치
    - 앱 실행 시 클립보드의 URL을 확인하여 딥링크 처리

2. **마케팅 트래킹 흐름**
    - 인스타그램 광고에 Branch 링크 설정
    - 광고 클릭 → UTM 파라미터 수집
    - 앱 설치 및 실행
    - Branch.io에서 설치 출처 및 UTM 데이터 분석

## 필요성

### 일반 딥링크의 한계

URI Scheme: 앱 미설치 시 동작하지 않음  
Universal Links: 미설치 시 앱스토어 연결 제한적  
일반 트래킹 링크: 설치 후 특정 페이지 연결 불가

### 사용자 경험 향상

광고나 마케팅 링크를 통해 유입된 사용자가 앱 설치 후 자연스럽게 원하는 콘텐츠로 연결
불필요한 탐색 과정 없이 직관적인 경험 제공
전환율 향상에 기여

### 마케팅 효과 극대화

캠페인별 차별화된 랜딩 페이지 설정 가능
설치부터 전환까지의 여정 추적 가능
광고 효과 정확한 측정 가능

## 주요 기능

1. **딥링크 관련**
    - NativeLink™ 기술 지원
    - Universal Links / App Links 지원
    - 디퍼드 딥링크 처리
    - 커스텀 링크 도메인 설정

2. **마케팅 관련**
    - UTM 파라미터 추적
    - 유료/오가닉 사용자 구분
    - 광고 캠페인 성과 측정
    - 상세한 설치 출처 분석

## 프로젝트 설정하기

### 1. Branch 대시보드 설정

먼저 [Branch.io](https://branch.io)에 가입하고 새 앱을 생성합니다. 그 후 다음 설정들을 진행합니다:

#### Default Link Behavior
```javascript
{
  // 기본 설정
  "fallback_url": "https://your-website.com",
  
  // iOS 설정
  "bundle_id": "com.your.app",
  "apple_app_prefix": "your_team_id",
  
  // Android 설정
  "package_name": "com.your.app",
  "sha256_cert": "your_cert_fingerprint"
}
```

#### Marketing Links
```javascript
{
  // UTM 파라미터
  "$utm_source": "instagram",
  "$utm_medium": "cpc",
  "$utm_campaign": "example",

  // Branch 파라미터
  "~channel": "instagram",
  "~feature": "cpc",
  "~campaign": "example",
  "~tags": ["paid"]
}
```

### 2. 패키지 설치

```bash
# npm 사용 시
npm install react-native-branch

# yarn 사용 시  
yarn add react-native-branch

# iOS 의존성 설치
cd ios && pod install
```

### 3. iOS 프로젝트 설정

#### Info.plist 설정
```xml
<key>branch_key</key>
<dict>
    <key>live</key>
    <string>key_live_{your_key}</string>
    <key>test</key>
    <string>key_test_{your_key}</string>
</dict>
<key>branch_universal_link_domains</key>
<array>
    <string>{your-app}.app.link</string>
    <string>{your-app}-alternate.app.link</string>
</array>
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>{your-app-scheme}</string>
        </array>
    </dict>
</array>
```

#### AppDelegate.m 통합 설정
```swift
#import <RNBranch/RNBranch.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <React/RCTLinkingManager.h>

@implementation AppDelegate

// 앱 실행 시 초기화
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    // Branch 초기화
    [RNBranch initSessionWithLaunchOptions:launchOptions isReferrable:YES];
    return YES;
}

// URL Scheme 처리 (딥링크)
- (BOOL)application:(UIApplication *)application 
            openURL:(NSURL *)url 
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options 
{
    // Facebook SDK URL 처리
    BOOL handled = [[FBSDKApplicationDelegate sharedInstance] application:application
                                                                openURL:url
                                                                options:options];
    
    // Branch URL 처리
    if (![RNBranch application:application openURL:url options:options]) {
        return handled || [super application:application openURL:url options:options] || 
               [RCTLinkingManager application:application openURL:url options:options];
    }
    return YES;
}

// Universal Links 처리
- (BOOL)application:(UIApplication *)application 
continueUserActivity:(NSUserActivity *)userActivity 
 restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler 
{
    BOOL branchHandled = [RNBranch continueUserActivity:userActivity];
    BOOL result = [RCTLinkingManager application:application 
                              continueUserActivity:userActivity 
                                restorationHandler:restorationHandler];
    return [super application:application 
           continueUserActivity:userActivity 
             restorationHandler:restorationHandler] || branchHandled || result;
}

@end
```

### 4. Android 프로젝트 설정

#### AndroidManifest.xml 설정
```xml
<manifest>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="com.google.android.gms.permission.AD_ID"/>
    
    <application>
        <!-- Branch 초기화 설정 -->
        <meta-data 
            android:name="io.branch.sdk.BranchKey"
            android:value="key_live_{your_key}" />
        <meta-data 
            android:name="io.branch.sdk.TestMode" 
            android:value="false" />

        <activity
            android:name=".MainActivity"
            android:launchMode="singleTask"
            android:exported="true">

            <!-- Branch URI Scheme -->
            <intent-filter>
                <data android:scheme="{your-app-scheme}" 
                      android:host="open" />
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
            </intent-filter>

            <!-- Branch App Links -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:scheme="https" 
                      android:host="{your-app}.app.link" />
                <data android:scheme="https" 
                      android:host="{your-app}-alternate.app.link" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

#### MainActivity.java 설정
```java
import io.branch.rnbranch.RNBranchModule;
import android.content.Intent;

public class MainActivity extends ReactActivity {
    @Override
    protected String getMainComponentName() {
        return "YourApp";
    }

    // Branch 딥링크 세션 초기화
    @Override
    protected void onStart() {
        super.onStart();
        RNBranchModule.initSession(getIntent().getData(), this);
    }

    // 새로운 인텐트 처리
    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        RNBranchModule.onNewIntent(intent);
    }
}
```

#### MainApplication.java 설정
```java
import io.branch.rnbranch.RNBranchModule;

public class MainApplication extends Application implements ReactApplication {
    @Override
    public void onCreate() {
        super.onCreate();
        
        // Branch 초기화 및 로깅 설정
        RNBranchModule.enableLogging();
        RNBranchModule.getAutoInstance(this);
    }
}
```

## 기능 구현하기

### 1. 딥링크 생성

```typescript
import branch from 'react-native-branch';

interface CreateLinkParams {
  type: 'invite' | 'share' | 'marketing';
  data: Record<string, any>;
  isMarketing?: boolean;
}

async function createBranchLink(params: CreateLinkParams) {
  try {
    // Branch Universal Object 생성
    const buo = await branch.createBranchUniversalObject('content', {
      title: getLinkTitle(params.type),
      contentMetadata: {
        customMetadata: {
          type: params.type,
          ...params.data
        }
      }
    });

    // 링크 프로퍼티 설정
    const linkProperties = {
      feature: params.type,
      channel: params.isMarketing ? 'paid_social' : 'app',
      campaign: params.data.campaign,
      stage: params.data.stage,
      tags: [params.isMarketing ? 'paid' : 'organic']
    };

    // 컨트롤 파라미터 설정
    const controlParams = {
      $desktop_url: 'https://your-website.com',
      $ios_url: 'https://apps.apple.com/your-app',
      $android_url: 'https://play.google.com/store/apps/details?id=your.app',
      $fallback_url: 'https://your-website.com/fallback'
    };

    const { url } = await buo.generateShortUrl(linkProperties, controlParams);
    return url;
  } catch (error) {
    console.error('Branch link creation failed:', error);
    throw error;
  }
}
```

### 2. 유저 트래킹 구현

```typescript
// App.tsx
import { AppEventsLogger } from 'react-native-fbsdk-next';

function App() {
  useEffect(() => {
    const unsubscribe = subscribeBranch();
    checkInstallSource();
    return () => unsubscribe();
  }, []);

  async function checkInstallSource() {
    try {
      const { latestReferringParams } = await getBranchReferringParams();
      const platformType = Platform.OS === 'ios' ? 'ios' : 'android';

      // 설치 소스에 따른 분기 처리
      if (latestReferringParams['~feature'] === 'cpc') {
        // 유료 광고를 통한 설치
        AppEventsLogger.logEvent('paid_user', {
          source: latestReferringParams['~channel'],
          medium: latestReferringParams['~feature'],
          campaign: latestReferringParams['~campaign'],
          platform: platformType
        });

        // 프로모션 화면으로 이동
        navigation.navigate('promotion', {
          campaignId: latestReferringParams['~campaign']
        });
      } 
      // 친구 초대를 통한 설치
      else if (latestReferringParams?.customMetadata?.type === 'invite') {
        AppEventsLogger.logEvent('referred_user', {
          referrer_id: latestReferringParams.customMetadata.referrerId,
          platform: platformType
        });

        handleInviteFlow(latestReferringParams.customMetadata);
      }
      // 직접 설치
      else {
        AppEventsLogger.logEvent('organic_user', { 
          platform: platformType 
        });
      }
    } catch (error) {
      console.error('Error checking install source:', error);
    }
  }
}
```

### 3. 딥링크 처리

```typescript
function subscribeBranch() {
  return branch.subscribe({
    onOpenStart: ({ uri, cachedInitialEvent }) => {
      console.log('Branch link processing started:', uri);
    },
    onOpenComplete: ({ error, params, uri }) => {
      if (error) {
        console.error('Branch link open error:', error);
        return;
      }
      
      if (params?.['+clicked_branch_link']) {
        handleDeepLink(params);
      }
    }
  });
}

function handleDeepLink(params: BranchParams) {
  try {
    // 유료 광고 경로
    if (params['~feature'] === 'cpc') {
      navigation.navigate('promotion', {
        campaign: params['~campaign'],
        source: params['~channel']
      });
    }
    // 친구 초대 경로
    else if (params?.customMetadata?.type === 'invite') {
      handleInviteFlow(params.customMetadata);
    }
    // 콘텐츠 공유 경로
    else if (params?.customMetadata?.type === 'share') {
      navigation.navigate('content', {
        id: params.customMetadata.contentId
      });
    }
  } catch (error) {
    console.error('Deep link handling error:', error);
  }
}
```

## 실제 사용 시나리오 구현

### 1. 친구 초대 기능

```typescript
interface InviteData {
  referrerId: string;
  inviteCode: string;
  referrerName?: string;
}

async function inviteFriend(inviteData: InviteData) {
  try {
    const inviteUrl = await createBranchLink({
      type: 'invite',
      data: {
        referrerId: inviteData.referrerId,
        inviteCode: inviteData.inviteCode,
        referrerName: inviteData.referrerName
      }
    });

    // 초대 메시지 공유
    await Share.share({
      message: `${inviteData.referrerName}님이 회원님을 ${appName}에 초대했어요!\n${inviteUrl}`
    });

    // 초대 이벤트 로깅
    logEvent('invite_shared', {
      referrer_id: inviteData.referrerId,
      invite_code: inviteData.inviteCode
    });
  } catch (error) {
    console.error('초대 링크 생성 실패:', error);
  }
}

// 초대 처리 로직
async function handleInviteFlow(inviteData: any) {
  try {
    // 초대 코드 유효성 검증
    const isValidInvite = await validateInviteCode(inviteData.inviteCode);
    if (!isValidInvite) {
      throw new Error('Invalid invite code');
    }

    // 초대 보상 지급
    await grantInviteReward(inviteData);

    // 초대한 사용자에게도 보상 지급
    await grantReferrerReward(inviteData.referrerId);

    // 이벤트 로깅
    logEvent('invite_completed', {
      referrer_id: inviteData.referrerId,
      invite_code: inviteData.inviteCode
    });

    // 초대 완료 화면으로 이동
    navigation.navigate('inviteComplete', {
      referrerName: inviteData.referrerName
    });
  } catch (error) {
    console.error('초대 처리 실패:', error);
  }
}
```

### 2. 마케팅 캠페인 트래킹

```typescript
interface CampaignConfig {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
}

async function createMarketingLink(config: CampaignConfig) {
  const linkUrl = await createBranchLink({
    type: 'marketing',
    isMarketing: true,
    data: {
      utm_source: config.source,
      utm_medium: config.medium,
      utm_campaign: config.campaign,
      utm_content: config.content,
      campaign: config.campaign,
      channel: config.source
    }
  });

  return linkUrl;
}

// 광고 캠페인 설정 예시
const campaignLinks = {
  instagram: await createMarketingLink({
    source: 'instagram',
    medium: 'cpc',
    campaign: 'summer_sale_2024',
    content: 'story_ad'
  }),
  facebook: await createMarketingLink({
    source: 'facebook',
    medium: 'cpc',
    campaign: 'summer_sale_2024',
    content: 'feed_ad'
  })
};

// 설치 후 프로모션 처리
function handlePromotionFlow(params: any) {
  const campaignData = {
    source: params['~channel'],
    campaign: params['~campaign'],
    feature: params['~feature']
  };

  // 프로모션 화면으로 이동
  navigation.navigate('promotion', {
    ...campaignData,
    promoCode: `SUMMER${Math.random().toString(36).substr(2, 6)}`
  });

  // 이벤트 로깅
  logEvent('promotion_view', campaignData);
}
```

### 3. 콘텐츠 공유 기능

```typescript
interface ShareContent {
  contentId: string;
  contentType: string;
  title: string;
  description: string;
  imageUrl?: string;
}

async function shareContent(content: ShareContent) {
  try {
    const shareUrl = await createBranchLink({
      type: 'share',
      data: {
        contentId: content.contentId,
        contentType: content.contentType,
        sharedAt: new Date().toISOString()
      }
    });

    // 소셜 미리보기 설정
    const branchUniversalObject = await branch.createBranchUniversalObject(
      content.contentId,
      {
        title: content.title,
        contentDescription: content.description,
        contentImageUrl: content.imageUrl,
        contentMetadata: {
          customMetadata: {
            type: 'share',
            contentType: content.contentType
          }
        }
      }
    );

    // 공유하기 실행
    const result = await Share.share({
      message: `${content.title}\n\n${content.description}\n\n${shareUrl}`
    });

    if (result.action === Share.sharedAction) {
      // 공유 성공 로깅
      logEvent('content_shared', {
        content_id: content.contentId,
        content_type: content.contentType
      });
    }
  } catch (error) {
    console.error('콘텐츠 공유 실패:', error);
  }
}
```

## 데이터 추적 및 분석

### 1. 설치 출처 분석

```typescript
async function analyzeInstallSource() {
  const { firstReferringParams } = await branch.getFirstReferringParams();
  
  const installData = {
    timestamp: Date.now(),
    platform: Platform.OS,
    source: firstReferringParams['~channel'] || 'organic',
    campaign: firstReferringParams['~campaign'],
    feature: firstReferringParams['~feature']
  };

  // 데이터 분석 플랫폼으로 전송
  await Analytics.logEvent('install_source', installData);
  
  return installData;
}
```

### 2. 전환 추적

```typescript
interface ConversionEvent {
  eventName: string;
  params: Record<string, any>;
}

function trackConversion(event: ConversionEvent) {
  // Branch 이벤트 로깅
  branch.logEvent(
    event.eventName,
    event.params,
    (error: Error | null) => {
      if (error) {
        console.error('Branch event logging failed:', error);
      }
    }
  );

  // Facebook 이벤트 로깅
  AppEventsLogger.logEvent(event.eventName, event.params);

  // 기타 애널리틱스 플랫폼 이벤트 로깅
  Analytics.logEvent(event.eventName, event.params);
}
```

## 성능 최적화 및 문제 해결

### 1. iOS 최적화

#### ATT (App Tracking Transparency) 처리
```typescript
import { requestTrackingPermissionsAsync } 
  from 'expo-tracking-transparency';
import { Settings } from 'react-native-fbsdk-next';

async function requestTrackingPermission() {
  if (Platform.OS === 'ios') {
    const { status } = await requestTrackingPermissionsAsync();
    
    if (status === 'granted') {
      await Settings.setAdvertiserTrackingEnabled(true);
      // Branch 트래킹 활성화
      await branch.setTrackingEnabled(true);
    } else {
      await Settings.setAdvertiserTrackingEnabled(false);
      // Branch 제한된 트래킹 모드
      await branch.setTrackingEnabled(false);
    }
    
    return status === 'granted';
  }
  return true;
}
```

#### Universal Links 검증
```bash
# AASA 파일 검증
curl -v https://your-app.app.link/.well-known/apple-app-site-association

# 예상되는 응답
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.BUNDLE_ID",
      "paths": ["*"]
    }]
  }
}
```

### 2. Android 최적화

#### Chrome Tabs 지원 추가
```groovy
// android/app/build.gradle
dependencies {
    // Branch 100% Matching 지원
    implementation 'androidx.browser:browser:1.0.0'
}
```

#### App Links 검증
```bash
# Digital Asset Links 파일 검증
curl -v https://your-app.app.link/.well-known/assetlinks.json

# 예상되는 응답
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "your.app.package",
    "sha256_cert_fingerprints": ["YOUR:SHA256:FINGERPRINT"]
  }
}]
```

### 3. 일반적인 문제 해결

#### 딥링크가 작동하지 않는 경우
```typescript
function troubleshootDeepLink(params: any) {
  // 1. Branch 초기화 확인
  if (!branch) {
    console.error('Branch not initialized');
    return;
  }

  // 2. 링크 파라미터 로깅
  console.log('Deep link params:', params);

  // 3. Branch SDK 디버그 모드 활성화
  if (__DEV__) {
    branch.setDebug();
  }

  // 4. 링크 클릭 여부 확인
  if (!params['+clicked_branch_link']) {
    console.log('Not from Branch link');
    return;
  }

  // 5. 필수 파라미터 존재 확인
  const requiredParams = ['~channel', '~feature'];
  const missingParams = requiredParams.filter(param => !params[param]);
  if (missingParams.length > 0) {
    console.error('Missing params:', missingParams);
    return;
  }
}
```

#### 설치 추적 문제 해결
```typescript
async function validateInstallTracking() {
  try {
    // 1. 첫 실행 확인
    const isFirstLaunch = await AsyncStorage.getItem('is_first_launch');
    
    if (isFirstLaunch === null) {
      // 2. Branch 초기 파라미터 확인
      const firstParams = await branch.getFirstReferringParams();
      console.log('First install params:', firstParams);
      
      // 3. 설치 이벤트 발생
      await trackInstallEvent(firstParams);
      
      // 4. 첫 실행 표시
      await AsyncStorage.setItem('is_first_launch', 'false');
    }
    
    // 5. 최근 참조 파라미터 확인
    const latestParams = await branch.getLatestReferringParams();
    console.log('Latest referring params:', latestParams);
    
  } catch (error) {
    console.error('Install tracking validation failed:', error);
  }
}
```

## 모니터링 및 유지보수

### 1. 성능 모니터링

```typescript
// 메트릭스 타입 정의
interface BranchMetrics {
   clickCount: number;
   installCount: number;
   openCount: number;
   errorCount: number;
}

// 모니터링 함수들
const createBranchMonitor = () => {
   const metrics: BranchMetrics = {
      clickCount: 0,
      installCount: 0,
      openCount: 0,
      errorCount: 0
   };

   const trackMetric = (type: keyof BranchMetrics) => {
      metrics[type]++;
      reportMetrics();
   };

   const handleError = (error: Error) => {
      console.error('Branch error:', error);
      metrics.errorCount++;

      if (metrics.errorCount > 10) {
         alertDevTeam(error);
      }
   };

   const reportMetrics = async () => {
      try {
         await Analytics.logEvent('branch_metrics', metrics);
      } catch (error) {
         console.error('Metrics reporting failed:', error);
      }
   };

   const alertDevTeam = (error: Error) => {
      // Slack, Email 등으로 알림 발송
   };

   return {
      trackMetric,
      handleError,
      getMetrics: () => ({ ...metrics })
   };
};
```

### 2. 정기 점검 항목

```typescript
// 상태 점검 함수들
const createBranchHealthCheck = () => {
   const testDeepLink = async (testUrl: string) => {
      try {
         const result = await branch.openURL(testUrl);
         return result;
      } catch (error) {
         throw new Error(`Deep link test failed: ${error.message}`);
      }
   };

   const validateConfiguration = async () => {
      const validateBranchKey = async () => {
         // Branch 키 검증 로직
      };

      const validateDomains = async () => {
         // 도메인 검증 로직
      };

      const validateURISchemes = async () => {
         // URI 스킴 검증 로직
      };

      const checks = [
         validateBranchKey(),
         validateDomains(),
         validateURISchemes()
      ];

      return Promise.all(checks);
   };

   const checkPerformance = async () => {
      const measureLinkGeneration = async () => {
         // 링크 생성 시간 측정 로직
      };

      const measureDeepLinkProcessing = async () => {
         // 딥링크 처리 시간 측정 로직
      };

      const metrics = {
         linkGenerationTime: await measureLinkGeneration(),
         deepLinkProcessingTime: await measureDeepLinkProcessing()
      };

      return metrics;
   };

   return {
      testDeepLink,
      validateConfiguration,
      checkPerformance
   };
};

// 사용 예시
const branchMonitor = createBranchMonitor();
const branchHealthCheck = createBranchHealthCheck();

// 모니터링 사용
branchMonitor.trackMetric('clickCount');
branchMonitor.handleError(new Error('Test error'));

// 상태 점검 사용
const runHealthCheck = async () => {
   const deepLinkTest = await branchHealthCheck.testDeepLink('your-test-url');
   const configValidation = await branchHealthCheck.validateConfiguration();
   const performanceMetrics = await branchHealthCheck.checkPerformance();

   return {
      deepLinkTest,
      configValidation,
      performanceMetrics
   };
};
```

## 마치며

Branch.io를 활용하여 디퍼드 딥링크를 구현하고 유료/오가닉 사용자를 구분하여 트래킹하고, 유저 초대/공유 기능을 통한 오가닉 성장을 다룬 내용입니다.

## 참고 자료
- [Branch.io 공식 문서](https://help.branch.io/developers-hub/docs/react-native)
- [React Native Branch SDK](https://github.com/BranchMetrics/react-native-branch)
- [Branch 딥링크 가이드](https://help.branch.io/using-branch/docs/deep-linking-guide)
- [Branch 마케팅 분석](https://help.branch.io/using-branch/docs/branch-universal-ads-overview)