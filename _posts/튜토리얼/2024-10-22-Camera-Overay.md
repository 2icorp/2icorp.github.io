---
title: "카메라 오버레이 가이드와 합성 이미지 저장 기능 구현"
last_modified_at: 2024-10-17
categories:
  - 튜토리얼
tags:
  - React Native
  - Camera
  - Image Overlay
  - Image Composition
  - RNCamera
  - react-native-canvas
  - react-native-fs
  - Mobile Development
  - Image Processing
excerpt: ""
use_math: true
classes: wide
---

# 카메라 오버레이 가이드와 합성 이미지 저장 기능 구현

모바일 앱에서 카메라를 통해 가이드 이미지를 투명하게 오버레이하고, 사용자가 해당 가이드에 맞춰 사진을 찍은 후 합성하여 저장하는 기능을 구현하는 방법을 설명합니다. 이 가이드는 React Native 및 Expo를 기반으로 하여 카메라 모듈을 활용하는 방식으로 진행되며, 필요한 라이브러리 및 주요 개발 과정을 단계별로 안내합니다.

---

#### **1. 카메라 기능 구현**

카메라 기능을 구현하기 위해 `react-native-camera` 라이브러리를 사용합니다. 이 라이브러리는 카메라 미리보기를 제공하고, 여기에 가이드 이미지를 오버레이하는 데 필요한 기반을 마련합니다.

##### **설치**
먼저 `react-native-camera` 라이브러리를 설치합니다.

```bash
npm install react-native-camera
cd ios && pod install
```

##### **카메라 화면 구성**

카메라를 화면에 표시하려면 `RNCamera` 컴포넌트를 사용하여 간단한 카메라 화면을 구현합니다.

```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RNCamera } from 'react-native-camera';

const CameraScreen = () => {
  return (
    <View style={styles.container}>
      <RNCamera
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
        captureAudio={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

export default CameraScreen;
```

---

#### **2. 투명한 가이드 이미지 오버레이**

이제 카메라 미리보기 위에 투명한 가이드 이미지를 오버레이하는 작업을 진행합니다. 가이드 이미지는 PNG 형식으로, 투명도가 적용된 이미지를 준비해 `Image` 컴포넌트를 통해 카메라 미리보기 위에 겹쳐서 표시합니다.

```javascript
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { RNCamera } from 'react-native-camera';

const CameraScreen = () => {
  return (
    <View style={styles.container}>
      <RNCamera
        style={styles.preview}
        type={RNCamera.Constants.Type.back}
        captureAudio={false}
      />
      <Image
        source={require('./path/to/your/transparent-guide.png')}
        style={styles.overlay}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,  // 투명도 설정
  },
});

export default CameraScreen;
```

---

#### **3. 이미지 합성 및 저장**

사진을 찍고 난 뒤, 카메라에서 촬영된 이미지와 가이드 이미지를 합성하여 하나의 이미지로 만들어야 합니다. 이 작업은 클라이언트 측에서 진행하거나 서버에서 처리할 수 있으며, 클라이언트 측에서 처리할 경우 `react-native-canvas` 라이브러리를 활용하여 캔버스에서 이미지를 합성하는 방법이 있습니다.

##### **라이브러리 설치**

```bash
npm install react-native-canvas
```

##### **캔버스를 이용한 이미지 합성 예시**

```javascript
import React, { useRef, useEffect } from 'react';
import { View, Button } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Canvas from 'react-native-canvas';

const CameraScreen = () => {
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const data = await cameraRef.current.takePictureAsync();
      drawCanvas(data.uri);
    }
  };

  const drawCanvas = (imageUri) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageUri;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // 가이드 이미지 오버레이
      const guideImage = new Image();
      guideImage.src = './path/to/guide-image.png';
      guideImage.onload = () => {
        ctx.drawImage(guideImage, 0, 0, canvas.width, canvas.height);
      };
    };
  };

  return (
    <View style={{ flex: 1 }}>
      <RNCamera
        ref={cameraRef}
        style={{ flex: 1 }}
        type={RNCamera.Constants.Type.back}
        captureAudio={false}
      />
      <Canvas ref={canvasRef} />
      <Button title="Take Picture" onPress={takePicture} />
    </View>
  );
};

export default CameraScreen;
```

---

#### **4. 최종 이미지 저장**

이미지를 합성한 후에는 파일로 저장할 수 있어야 합니다. 이를 위해 `react-native-fs` 라이브러리를 사용하여 이미지를 로컬 파일 시스템에 저장합니다.

##### **라이브러리 설치**

```bash
npm install react-native-fs
```

##### **이미지 저장 예시**

```javascript
import RNFS from 'react-native-fs';

const saveImage = async (imageData) => {
  const filePath = `${RNFS.DocumentDirectoryPath}/finalImage.png`;
  await RNFS.writeFile(filePath, imageData, 'base64');
  console.log('Image saved to', filePath);
};
```

---

#### **결론**

이 가이드를 통해 모바일 앱에서 카메라를 통해 가이드 이미지를 오버레이하고, 사용자로 하여금 해당 가이드에 맞춰 사진을 찍고 이를 합성하여 저장하는 기능을 구현할 수 있습니다. 앱에서 이러한 기능을 제공함으로써 사용자에게 보다 유익하고 재미있는 경험을 선사할 수 있습니다.

--- 

**카테고리:** 모바일 앱 개발  
**태그:** React Native, Camera, 이미지 합성, 가이드 이미지, React Native Camera, 오버레이  



## 최신 글
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>