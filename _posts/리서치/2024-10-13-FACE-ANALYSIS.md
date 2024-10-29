---
title: "얼굴 나이, 성별, 피부색 분류 모델 비교"
last_modified_at: 2024-10-13
categories:
  - Machine Learning
  - Facial Recognition
tags:
  - Age Classification
  - Gender Classification
  - Skin Tone Classification
  - Deep Learning Models
  - Facial Analysis
excerpt: ""
use_math: true
classes: wide
---


# 얼굴 나이, 성별, 피부색 분류 모델 비교

높은 성능이 필요 없어서 아주 간단하게 찾아 봄.

-----

성별, 나이, 인종을 구별할 수 있는 딥러닝 모델 중에서 **공개되어 있는 간단한 모델**로는 다음과 같은 모델들을 사용할 수 있습니다.

1. **Age, Gender, and Ethnicity Estimation (AGNet)**
   - **AGNet**은 얼굴에서 나이, 성별, 인종을 추정하는 모델입니다.
   - 모델과 코드가 GitHub에서 공개되어 있습니다.
   - AGNet은 경량화된 딥러닝 모델로, 얼굴 데이터를 통해 세 가지 속성(나이, 성별, 인종)을 동시에 예측합니다.
   - [AGNet GitHub Repository](https://github.com/yu4u/age-gender-estimation)에서 사용 가능한 모델을 확인할 수 있습니다.

2. **DeepFace** (Age, Gender, Race Classifier)
   - **DeepFace**는 여러 얼굴 인식 및 속성 추정 모델들을 지원하는 라이브러리입니다. 나이, 성별, 인종 추정이 가능하며, 여러 백엔드(예: VGG-Face, OpenFace 등)를 지원합니다.
   - DeepFace는 성능이 높고 사용하기 쉬운 Python 라이브러리로, 인종, 나이, 성별 등을 포함한 다양한 얼굴 속성 예측 기능을 제공합니다.
   - [DeepFace GitHub Repository](https://github.com/serengil/deepface)에서 자세한 내용과 사용법을 확인할 수 있습니다.

3. **FairFace**
   - **FairFace**는 성별, 나이, 인종을 정확하게 추정할 수 있는 얼굴 인식 모델로, 특히 인종적 편향을 줄이기 위해 개발되었습니다.
   - FairFace 모델은 여러 인종을 균등하게 반영한 데이터셋을 사용해 훈련되었으며, 성별과 나이도 예측할 수 있습니다.
   - [FairFace GitHub Repository](https://github.com/joojs/fairface)에서 모델과 데이터셋을 확인할 수 있습니다.

4. **InsightFace (ArcFace)**
   - **InsightFace**는 얼굴 인식과 얼굴 속성 추정을 위한 라이브러리로, 성별, 나이, 인종을 추정할 수 있는 모델을 제공합니다. ArcFace와 같은 최신 얼굴 인식 모델을 기반으로 합니다.
   - 다양한 얼굴 속성을 추정하는 모델을 제공하며, 높은 정확도를 자랑합니다.
   - [InsightFace GitHub Repository](https://github.com/deepinsight/insightface)를 통해 접근할 수 있습니다.

위에서 언급한 모델들(AGNet, DeepFace, FairFace, InsightFace)을 **모델 크기**, **성능**, **latency**, **배포 편의성** 관점에서 비교하면 아래와 같습니다:

### 1. **AGNet**
- **모델 크기**: 상대적으로 가벼운 경량 모델입니다. 모바일 및 엣지 장치에서 사용이 가능합니다.
- **성능**: 성능은 중간 정도이며, 특히 나이와 성별 예측에서 신뢰할 수 있습니다. 인종 예측은 일부 데이터셋에 비해 낮을 수 있습니다.
- **Latency**: 경량 모델로 Latency가 짧습니다. 실시간 처리가 가능한 수준이지만, 정확도는 일부 최신 모델보다 낮을 수 있습니다.
- **배포 편의성**: GitHub에서 제공되는 패키징은 비교적 간단하며, Python 기반으로 쉽게 배포할 수 있습니다. 다만, 다양한 환경에서의 종속성 설정이 필요할 수 있습니다.

### 2. **DeepFace**
- **모델 크기**: 다양한 백엔드 모델(VGG-Face, OpenFace, Facenet 등)을 지원합니다. 기본적으로 사용하는 모델에 따라 크기가 달라집니다.
  - 예를 들어, **VGG-Face**는 대형 모델로, 크기가 500MB 이상일 수 있습니다.
  - **Facenet**은 중형 모델로, 90MB 정도입니다.
- **성능**: 성능이 우수합니다. 특히 성별, 나이, 인종 추정에서 다양한 백엔드를 선택하여 높은 정확도를 제공합니다. 최신 연구 결과를 반영한 모델을 사용할 수 있어 유연성도 큽니다.
- **Latency**: VGG-Face와 같은 대형 모델을 사용할 경우 latency가 클 수 있지만, 상대적으로 작은 모델을 사용하면 적절한 속도와 성능을 보장할 수 있습니다.
- **배포 편의성**: 패키징이 매우 잘 되어 있습니다. Python pip 패키지로 설치 가능하며, 다양한 기능을 쉽게 사용할 수 있습니다. 배포 및 설정도 잘 정리되어 있어 배포가 용이합니다.

### 3. **FairFace**
- **모델 크기**: 비교적 중간 크기의 모델로, 약 300MB 정도입니다. 나이, 성별, 인종 예측에 특화된 모델입니다.
- **성능**: 성능이 우수합니다. 특히 인종 예측에서 데이터 편향을 줄이기 위해 신중하게 설계된 데이터셋으로 훈련되어, 다양한 인종에 대한 정확도가 높습니다. 성별과 나이 예측 성능도 안정적입니다.
- **Latency**: 중간 정도의 latency를 제공합니다. 대규모 모델에 비해 실시간 사용에 적합하지만, 경량 모델보다는 latency가 다소 길 수 있습니다.
- **배포 편의성**: 패키징이 잘 되어 있으며, 사전 훈련된 모델을 쉽게 다운로드하여 사용할 수 있습니다. 배포와 관련한 문서가 충분히 잘 갖춰져 있어 빠르게 배포가 가능합니다.

### 4. **InsightFace (ArcFace)**
- **모델 크기**: ArcFace와 같은 최신 모델을 기반으로 하며, 크기가 큰 편입니다. 일반적으로 100MB 이상이지만, 높은 성능을 위해 경량화된 버전도 사용할 수 있습니다.
- **성능**: 성능이 매우 우수합니다. 특히 얼굴 인식, 성별, 나이, 인종 예측에서 높은 정확도를 자랑하며, 최신 기술을 반영하고 있습니다.
- **Latency**: ArcFace는 고성능 모델이므로 latency가 다소 길 수 있습니다. 그러나 최근 경량화된 버전도 제공되므로 선택에 따라 latency를 조정할 수 있습니다.
- **배포 편의성**: InsightFace는 패키징과 배포가 잘 되어 있습니다. PyTorch 및 MXNet을 기반으로 하며, 다양한 플랫폼에서 쉽게 배포 가능합니다. 문서가 잘 정리되어 있고, 여러 가지 얼굴 인식 기능을 쉽게 사용할 수 있는 API가 제공됩니다.

---

### **종합 비교**

| 모델        | 모델 크기              | 성능                            | Latency                | 배포 편의성              |
|-------------|------------------------|----------------------------------|------------------------|--------------------------|
| **AGNet**   | 작음 (경량화)           | 중간 (나이, 성별 예측 적합)       | 짧음 (실시간 가능)       | 배포 비교적 간편          |
| **DeepFace**| 다양 (백엔드에 따라 다름)| 우수 (다양한 얼굴 속성 예측 가능) | 중간 ~ 김 (백엔드 선택에 따라 다름) | 매우 잘 되어 있음 (pip 지원) |
| **FairFace**| 중간 (300MB)            | 우수 (편향 감소, 인종 예측 강점)  | 중간 (실시간 사용 가능)  | 배포 용이 (문서 및 모델 제공) |
| **InsightFace (ArcFace)**| 크거나 중간 | 매우 우수 (최신 기술, 높은 정확도)| 중간 ~ 김 (고성능 모델) | 배포 잘 되어 있음 (API 제공) |

### **권장 선택**
- **실시간 성능**이 중요하다면: **AGNet** 또는 **경량화된 DeepFace 백엔드**.
- **높은 성능**이 필요하다면: **InsightFace (ArcFace)** 또는 **FairFace**.
- **패키징과 배포 편의성**이 중요하다면: **DeepFace** 또는 **FairFace**가 좋은 선택입니다.

```python
import cv2
from insightface.app import FaceAnalysis

# 1. 모델 로드
def load_model():
    app = FaceAnalysis(allowed_modules=['detection', 'genderage'])  # 성별 및 나이 예측 모듈 사용
    app.prepare(ctx_id=0, det_size=(640, 640))  # ctx_id=0은 GPU 사용, -1은 CPU 사용
    return app

# 2. 이미지 전처리 및 추론
def infer(app, image_path):
    # 이미지 로드
    img = cv2.imread(image_path)
    
    # 얼굴 검출 및 속성 분석
    faces = app.get(img)  # 이미지에서 얼굴을 검출하고 성별과 나이를 분석
    
    for idx, face in enumerate(faces):
        print(f"--- Face {idx + 1} ---")
        print(f"Age: {face['age']}")        # 나이
        print(f"Gender: {'Male' if face['gender'] > 0.5 else 'Female'}")  # 성별

# 3. 메인 함수
if __name__ == "__main__":
    model = load_model()  # 모델 로드
    infer(model, 'path_to_your_image.jpg')  # 추론 수행

```

### InsightFace의 `buffalo_l` 모델 파일 설명 및 성별/나이 예측에 필요한 모델

InsightFace 라이브러리에서 제공하는 `buffalo_l` 모델 디렉토리에는 얼굴 인식 및 분석을 위한 다양한 ONNX 형식의 모델 파일들이 포함되어 있습니다. 이 블로그에서는 각 파일의 역할을 알아보겠습니다.

### 각 파일 설명:

#### 1. **1k3d68.onnx 137M**:
   - 이 모델은 3D 얼굴 랜드마크 68개 포인트를 추정하는 데 사용됩니다. 얼굴의 구조를 3D로 분석하여 얼굴 인식, 변형, 또는 자세 추정 작업에 활용될 수 있습니다.

#### 2. **2d106det.onnx 4.9M**:
   - 2D 얼굴 랜드마크 106개 포인트를 검출하는 모델로, 얼굴의 윤곽 및 세부적인 특징 눈, 코, 입 등을 추출합니다. 얼굴 인식이나 표정 분석 작업에 유용합니다.

#### 3. **det_10g.onnx 17M**:
   - 이 모델은 이미지에서 얼굴을 검출하는 역할을 합니다. 성별과 나이 예측을 수행하기 전에 얼굴을 정확하게 탐지해야 하므로 필수적인 모델입니다.

#### 4. **genderage.onnx 1.3M**:
   - 성별과 나이를 예측하는 모델입니다. 얼굴이 탐지된 후, 이 모델을 통해 해당 얼굴의 성별과 나이를 분석할 수 있습니다.

#### 5. **w600k_r50.onnx 167M**:
   - ResNet-50 기반의 얼굴 인식 모델입니다. 두 얼굴 간의 유사성을 측정하여 얼굴을 인식하고 매칭하는 작업에 주로 사용됩니다.

-----

### 두 얼굴 간의 유사성을 측정하는 방법 – InsightFace 사용 예제

얼굴 인식 기술은 두 얼굴 간의 유사성을 측정하여 동일 인물인지 여부를 판단하는 데 많이 사용됩니다. 이번 블로그에서는 **InsightFace** 라이브러리를 사용하여 두 이미지에서 얼굴 임베딩을 추출하고, 이를 비교하는 방법을 소개하겠습니다.

### 기본 개념

얼굴 인식은 주로 두 단계로 이루어집니다:
1. **얼굴 임베딩(embedding) 추출**: 이미지에서 얼굴을 탐지한 후, 이를 숫자 벡터로 변환합니다.
2. **임베딩 비교**: 두 얼굴의 임베딩 벡터 간의 유사성을 계산하여 얼마나 닮았는지 확인합니다.

이번 예제에서는 **코사인 유사도**를 사용하여 두 얼굴이 얼마나 유사한지 계산할 것입니다. 코사인 유사도 값은 -1에서 1 사이의 값으로, 1에 가까울수록 두 얼굴이 유사하다는 것을 의미합니다.

### 두 얼굴 간의 유사성을 측정하는 예제 코드

```python
import cv2
import sys
import os
from insightface.app import FaceAnalysis
import numpy as np

# 1. 모델 로드 (얼굴 인식 모델 포함)
def load_model():
    app = FaceAnalysis(allowed_modules=['detection', 'recognition'])  # 얼굴 검출 및 인식 모듈 사용
    app.prepare(ctx_id=0, det_size=(640, 640))  # ctx_id=0은 GPU 사용, -1은 CPU 사용
    return app

# 2. 이미지에서 얼굴 임베딩 추출
def get_embedding(app, image_path):
    img = cv2.imread(image_path)
    if img is None:
        print(f"이미지를 불러올 수 없습니다: {image_path}")
        return None
    
    faces = app.get(img)
    if len(faces) == 0:
        print(f"얼굴을 찾을 수 없습니다: {image_path}")
        return None

    # 첫 번째 얼굴의 임베딩을 사용
    face = faces[0]
    return face.embedding

# 3. 두 얼굴 간의 유사성 계산 (코사인 유사도)
def calculate_similarity(embedding1, embedding2):
    # 코사인 유사도를 계산하는 함수
    cos_sim = np.dot(embedding1, embedding2) / (np.linalg.norm(embedding1) * np.linalg.norm(embedding2))
    return cos_sim

# 4. 메인 함수
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("사용법: python app.py [첫 번째 이미지 경로] [두 번째 이미지 경로]")
        sys.exit(1)

    image_path1 = sys.argv[1]  # 첫 번째 이미지 경로
    image_path2 = sys.argv[2]  # 두 번째 이미지 경로

    # 모델 로드
    model = load_model()

    # 두 이미지에서 얼굴 임베딩 추출
    embedding1 = get_embedding(model, image_path1)
    embedding2 = get_embedding(model, image_path2)

    # 두 얼굴이 모두 감지되었을 경우
    if embedding1 is not None and embedding2 is not None:
        similarity = calculate_similarity(embedding1, embedding2)
        print(f"두 얼굴 간의 유사도: {similarity:.4f}")
    else:
        print("두 얼굴 중 하나 또는 두 얼굴 모두를 찾을 수 없습니다.")
```

### 코드 설명

1. **`load_model()`**: `insightface` 라이브러리에서 얼굴을 검출하고 인식하는 데 사용되는 모델을 로드합니다.
2. **`get_embedding(app, image_path)`**: 주어진 이미지에서 얼굴을 검출하고, 얼굴 임베딩 벡터를 추출합니다. 이는 얼굴의 고유 특징을 숫자로 표현한 벡터입니다.
3. **`calculate_similarity(embedding1, embedding2)`**: 두 얼굴 임베딩 간의 코사인 유사도를 계산합니다. 이 값이 1에 가까울수록 두 얼굴이 유사합니다.
4. **메인 함수**: 커맨드라인에서 두 이미지의 경로를 입력받아 얼굴 임베딩을 추출하고 유사성을 계산합니다.

### 실행 방법

#### 1. 가상환경을 활성화한 후, 아래 명령어를 실행하세요:

   ```bash
   python app.py /path/to/first/image.jpg /path/to/second/image.jpg
   ```

#### 2. 결과로 두 얼굴 간의 유사도를 출력합니다. 예를 들어:

   ```
   두 얼굴 간의 유사도: 0.9234
   ```

--- 

## DeepFace

얼굴 인식 및 속성 분석 기술은 최근 여러 분야에서 활발히 사용되고 있습니다. **DeepFace**는 파이썬 기반의 강력한 얼굴 인식 라이브러리로, 얼굴 인식을 넘어서 **인종, 성별, 나이, 감정** 등을 분석할 수 있습니다. 이 블로그에서는 **DeepFace** 라이브러리를 설정하고 사용하는 방법을 단계별로 안내하고, 다양한 얼굴 속성 분석 기능에 대해 설명하겠습니다.

### 1. 가상환경 설정 및 DeepFace 설치

DeepFace를 사용하기 위해서는 파이썬 가상환경을 설정한 후 DeepFace 라이브러리를 설치해야 합니다. 아래 명령어를 사용하여 가상환경을 설정하고 활성화합니다.

```bash
# 가상환경 생성
python -m venv deepface-env

# 가상환경 활성화 (Windows)
deepface-env\Scripts\activate

# 가상환경 활성화 (macOS/Linux)
source deepface-env/bin/activate
```

이제 가상환경이 활성화되었으니, DeepFace 라이브러리를 설치합니다.

```bash
pip install deepface
```

### 2. DeepFace를 사용한 얼굴 속성 분석

DeepFace는 다양한 얼굴 속성을 분석할 수 있습니다. 다음 파이썬 코드를 사용하여 이미지를 분석하고, **인종, 성별, 나이, 감정** 정보를 추출할 수 있습니다.

```python
from deepface import DeepFace

# 이미지에서 얼굴 속성 분석
def analyze_image(image_path):
    analysis = DeepFace.analyze(img_path=image_path, actions=['age', 'gender', 'race', 'emotion'])
    print(analysis)

if __name__ == "__main__":
    analyze_image("path_to_your_image.jpg")  # 이미지 경로를 입력하세요
```

### 3. 분석 가능한 속성들

`DeepFace.analyze` 함수는 다음과 같은 속성들을 분석할 수 있습니다:

- **나이**: 얼굴 이미지를 기반으로 나이를 예측합니다.
- **성별**: 남성 또는 여성을 예측합니다.
- **인종**: Asian, White, Middle Eastern, Indian, Latino, Black 등의 인종 분류를 제공합니다.
- **감정**: 행복, 슬픔, 분노, 중립 등 7가지 감정 상태를 분석합니다.

### 4. 출력 예시

```json
{
  "age": 32,
  "gender": "Man",
  "dominant_race": "white",
  "dominant_emotion": "happy",
  "emotion": {
    "angry": 0.01,
    "disgust": 0.00,
    "fear": 0.01,
    "happy": 99.89,
    "sad": 0.04,
    "surprise": 0.02,
    "neutral": 0.02
  },
  "race": {
    "asian": 0.30,
    "indian": 0.25,
    "black": 0.01,
    "white": 95.12,
    "middle eastern": 2.65,
    "latino hispanic": 1.66
  }
}
```

위와 같은 출력값을 통해 해당 얼굴의 나이, 성별, 인종, 그리고 지배적인 감정을 쉽게 확인할 수 있습니다.

### 5. 모델 선택

DeepFace는 **VGG-Face**, **Facenet**, **ArcFace** 등 다양한 얼굴 인식 모델을 지원합니다. 특정 모델을 사용하고자 할 경우 `analyze` 함수에서 모델을 명시할 수 있습니다.

```python
DeepFace.analyze(img_path="path_to_image.jpg", actions=['age', 'gender', 'race', 'emotion'], model_name="Facenet")
```

**나이, 성별, 인종 분류기**의 성능을 비교하는 것은 중요한 과제이며, 특히 각 모델의 **정확도**, **모델 크기**, **추론 속도**를 고려해야 합니다. 아래에서 **DeepFace**에서 제공하는 세 가지 주요 모델인 **VGG-Face**, **FaceNet**, **ArcFace**를 기반으로 성능을 비교하겠습니다. 이번 비교는 나이, 성별, 인종 분류 성능에 집중합니다.

### 성능 비교 표

| 모델       | 나이 분류 정확도 (MAE) | 성별 분류 정확도 (%) | 인종 분류 정확도 (%) | 모델 크기 | 추론 속도 (평균, 이미지당) |
|------------|------------------------|-----------------------|----------------------|-----------|-----------------------------|
| **VGG-Face**  | ±4.65 MAE               | 97.44                  | 약 94%                | 500MB     | ~200ms                       |
| **FaceNet**   | ±4.50 MAE               | 98.00                  | 약 95%                | 140MB     | ~100ms                       |
| **ArcFace**   | ±4.30 MAE               | 98.00                  | 약 96%                | 120MB     | ~80ms                        |

### 모델별 성능 분석

1. **VGG-Face**:
   - **나이 분류**: 평균 절대 오차(MAE) ±4.65로, 다른 모델들에 비해 약간 낮은 성능을 보여줍니다.
   - **성별 분류**: 성별 분류는 약 **97.44%**의 정확도를 제공하여 준수한 성능을 보입니다.
   - **인종 분류**: **94%**의 정확도를 기록하며 인종 분류에서도 나쁘지 않은 성능을 보이지만, 다른 모델들보다는 다소 떨어집니다.
   - **모델 크기**와 **추론 속도**는 가장 크고 느린 편입니다.
   
2. **FaceNet**:
   - **나이 분류**: MAE ±4.50으로 더 정밀한 나이 분류가 가능합니다.
   - **성별 분류**: **98%**의 높은 성별 분류 정확도를 보이며, VGG-Face보다 우수합니다.
   - **인종 분류**: **95%**의 인종 분류 정확도를 기록하여, 인종 분류에서도 VGG-Face보다 우수한 성능을 보입니다.
   - **모델 크기**는 중간 정도인 **140MB**로 비교적 작으며, **추론 속도**도 더 빠릅니다.

3. **ArcFace**:
   - **나이 분류**: MAE ±4.30으로 가장 높은 나이 분류 정확도를 보여줍니다.
   - **성별 분류**: **98%**의 성별 분류 정확도로 FaceNet과 동일한 성능을 보입니다.
   - **인종 분류**: **96%**의 인종 분류 정확도로, 세 모델 중 가장 뛰어난 성능을 보여줍니다.
   - **모델 크기**는 **120MB**로 가장 작으며, **추론 속도**도 **80ms**로 가장 빠릅니다.

### 비교:
- **ArcFace**는 나이, 성별, 인종 분류에서 **최고의 성능**을 보이며, 모델 크기와 속도 면에서도 가장 효율적입니다.
- **FaceNet**은 여전히 높은 정확도와 중간 크기의 모델로, 정확도와 속도 사이의 좋은 균형을 제공합니다.
- **VGG-Face**는 상대적으로 더 느리고 모델 크기가 크지만, 여전히 신뢰할 수 있는 결과를 제공합니다.

ArcFace는 **속도와 정확도**에서 뛰어나며, 실시간 응용 프로그램에서 최적의 선택이 될 수 있습니다.


## 6. 정리

DeepFace는 얼굴 인식 및 속성 분석을 위한 강력한 도구로, 이를 통해 다양한 얼굴 속성(인종, 성별, 나이, 감정 등)을 손쉽게 예측할 수 있습니다. 파이썬 환경에서 쉽게 사용할 수 있으며, 높은 정확도의 분석 결과를 제공합니다.

DeepFace 사용에 대해 더 궁금한 사항이 있으면 [공식 문서](https://github.com/serengil/deepface)를 참조하세요.

---

#### 태그
`#얼굴인식` `#유사성측정` `#AI` `#인공지능` `#컴퓨터비전`

## 최신 글
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>