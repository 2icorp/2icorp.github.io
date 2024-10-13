---
layout: default
title:  "Metric Learning에 대한 고찰"
---

# Metric Learning과 ArcFace 정리

## 1. Metric Learning 소개
Metric Learning은 데이터 포인트 간의 거리를 학습하는 기법으로, 두 데이터 간의 유사도 또는 차이를 측정하는 함수의 학습을 목표로 합니다. 핵심 목표는 유사한 데이터는 가까이 위치하고, 다른 데이터는 멀리 위치하게 만드는 것입니다. 이 방법은 얼굴 인식, 이미지 분류, 음성 인식과 같은 다양한 작업에 활용됩니다.

## 2. 앵커-양성-음성 구조
Metric Learning에서 많이 사용되는 구조는 삼중 쌍(triplet) 구조입니다. 이 구조는 다음의 세 가지 샘플로 구성됩니다.

- **앵커 (A):** 기준이 되는 데이터 포인트입니다.
- **양성 (P):** 앵커와 같은 클래스에 속하는 샘플입니다.
- **음성 (N):** 앵커와 다른 클래스에 속하는 샘플입니다.

### 목표
삼중 쌍 구조에서 Metric Learning의 목표는 두 가지입니다:
- 앵커와 양성 샘플 간의 거리를 최소화.
- 앵커와 음성 샘플 간의 거리를 최대화.

이 관계는 **Triplet Loss** 함수로 정의됩니다:

$$
L_{\text{triplet}} = \max(0, d(A, P) - d(A, N) + \text{margin})
$$

여기서:
- \( d(A, P) \): 앵커와 양성 샘플 간의 거리.
- \( d(A, N) \): 앵커와 음성 샘플 간의 거리.
- margin: 양성-음성 샘플 간 최소 거리를 설정하는 기준 값.

이 손실 함수를 통해 모델은 앵커와 양성 쌍을 가까이 배치하고, 앵커와 음성 쌍은 멀리 배치하도록 학습됩니다.

## 3. ArcFace: 얼굴 인식의 혁신

### 3.1 주요 혁신
ArcFace는 각도 기반 마진(angular margin)을 활용하여 얼굴 임베딩을 계산하는 새로운 방법을 도입했습니다. 기존 방법들이 유클리드 거리(Euclidean distance)를 사용한 반면, ArcFace는 임베딩 간의 코사인 유사도(cosine similarity)를 측정합니다.

### 3.2 각도 마진
ArcFace의 핵심은 각도에 추가적인 마진 \( m \)을 더하여 클래스 간 결정 경계를 강화하는 것입니다:

$$
\cos(\theta + m)
$$

여기서 \( \theta \)는 임베딩 벡터와 클래스 가중치 벡터 사이의 각도를 의미합니다. 마진 \( m \)은 같은 사람의 얼굴 이미지들이 더 밀집하게 모이게 하고, 다른 사람의 얼굴 이미지는 더 멀리 떨어지도록 학습합니다.

### 3.3 학습 과정
1. **데이터 준비:** 라벨이 달린 대규모 얼굴 이미지 데이터셋을 준비합니다.
2. **특징 추출:** Convolutional Neural Network (CNN)를 사용해 얼굴 이미지로부터 임베딩 벡터를 추출합니다.
3. **코사인 유사도 계산:** 추출된 임베딩 벡터 간 코사인 유사도를 계산하여 각도 차이를 측정합니다.
4. **각도 마진 적용:** 마진을 적용하여 같은 클래스는 가깝게, 다른 클래스는 멀리 배치되도록 학습합니다.
5. **소프트맥스와 손실 함수 계산:** 수정된 각도 마진을 소프트맥스에 통합해 클래스별 확률을 계산하고, Cross-Entropy 손실을 최소화하도록 모델을 학습시킵니다.

ArcFace의 완전한 손실 함수는 다음과 같습니다:

$$
L_{\text{arcface}} = -\log \left( \frac{e^{s \cdot \cos(\theta_y + m)}}{e^{s \cdot \cos(\theta_y + m)} + \sum_{j \neq y} e^{s \cdot \cos(\theta_j)}} \right)
$$

여기서:
- \( s \)는 스케일 팩터 (일반적으로 64로 설정됨).
- \( \theta_y \)는 정답 클래스의 각도.
- \( \theta_j \)는 다른 클래스들의 각도입니다.

### 3.4 ArcFace의 주요 장점
- **정확도 향상:** ArcFace는 각도 기반 마진을 통해 클래스 간 구분 능력을 높여, 얼굴 인식에서 매우 높은 성능을 보입니다.
- **일반화 능력 향상:** 다양한 얼굴 이미지에 대해 일반화 능력이 뛰어나며, 새로운 데이터에도 잘 대응합니다.

## 4. ArcFace 이후의 발전

### 4.1 CosFace
CosFace는 **코사인 마진**을 도입해 ArcFace와 유사한 시기에 발표되었으며, 클래스 간 결정 경계를 강화했습니다. ArcFace는 추가적인 각도 마진을 통해 더 나은 성과를 냈습니다.

### 4.2 AdaFace
AdaFace는 ArcFace의 한계를 보완한 모델로, 얼굴 이미지 품질에 따라 적응형 마진을 적용해 저해상도 이미지나 왜곡된 이미지를 더 정확하게 인식합니다.

### 4.3 Partial FC
Partial FC는 대규모 데이터셋에서 학습 시간을 단축하면서도 성능을 유지할 수 있는 방법으로, 일부 클래스만 샘플링하여 학습하는 방식입니다.

### 4.4 CurricularFace
CurricularFace는 학습 커리큘럼을 도입하여 더 어려운 샘플을 우선 학습하게 하며, ArcFace의 각도 마진을 그대로 적용하면서 학습 효율을 높였습니다.

## 5. 결론
ArcFace와 그 변형들은 얼굴 인식에서 각도 기반 마진을 사용하여 임베딩을 더 정밀하게 구분하는 방식으로 큰 혁신을 이루었습니다. 이러한 모델들은 최신 얼굴 인식 시스템에서 중요한 역할을 하며, 데이터 간의 유사성과 차이를 보다 명확하게 구분해 높은 성능을 제공합니다.

---

`Angular margin`을 적용한 손실 함수는 주로 얼굴 인식 모델에서 사용되며, ArcFace, CosFace, SphereFace 등에서 구현된 개념입니다. `Angular margin`을 이용하면 모델이 더 구분된 임베딩을 학습하게 도와줍니다. 아래는 Keras를 사용하여 `Angular margin`을 적용한 간단한 얼굴 인식용 모델 코드 예시입니다.

### ArcFace 손실 함수를 적용한 예시

```python
import tensorflow as tf
from tensorflow.keras.layers import Input, Dense, BatchNormalization, Activation, Lambda
from tensorflow.keras.models import Model
from tensorflow.keras import backend as K
import numpy as np

# 파라미터 설정
embedding_size = 512
num_classes = 10
s = 30.0  # Scaling factor
m = 0.5   # Margin

# ArcFace 손실 함수
def arcface_loss(y_true, y_pred):
    cos_m = tf.math.cos(m)
    sin_m = tf.math.sin(m)
    threshold = tf.math.cos(np.pi - m)
    
    y_true = tf.cast(y_true, tf.float32)
    cos_t = y_pred
    sin_t = tf.math.sqrt(1.0 - tf.square(cos_t))
    
    cos_mt = s * (cos_t * cos_m - sin_t * sin_m)
    cond = cos_t > threshold
    cos_t = tf.where(cond, cos_mt, s * cos_t)
    
    return tf.nn.sparse_softmax_cross_entropy_with_logits(labels=y_true, logits=cos_t)

# 모델 정의
def create_model(input_shape, num_classes):
    inputs = Input(shape=input_shape)
    x = Dense(512)(inputs)
    x = BatchNormalization()(x)
    x = Activation('relu')(x)
    embeddings = Dense(embedding_size)(x)
    norm_embeddings = Lambda(lambda x: tf.nn.l2_normalize(x, axis=1))(embeddings)
    
    # Fully connected layer for classification
    logits = Dense(num_classes)(norm_embeddings)
    
    # Softmax output
    outputs = Activation('softmax')(logits)
    
    model = Model(inputs, outputs)
    return model

# 데이터 예시
input_shape = (128,)
X_train = np.random.rand(100, *input_shape).astype(np.float32)
y_train = np.random.randint(0, num_classes, 100)

# 모델 생성
model = create_model(input_shape, num_classes)

# 컴파일
model.compile(optimizer='adam', loss=arcface_loss, metrics=['accuracy'])

# 모델 학습
model.fit(X_train, y_train, batch_size=32, epochs=10)
```

### 설명:

1. **ArcFace Loss**:  
   `arcface_loss`는 입력으로 예측값(`y_pred`)과 실제 라벨(`y_true`)을 받아, 각 라벨과 예측 간의 각도 거리에 margin을 더한 손실을 계산합니다. 스케일링 `s`와 margin `m`을 적용하여 손실 함수가 더 강력하게 작동하게 만듭니다.

2. **모델 구조**:  
   간단한 Dense Layer로 이루어진 모델을 정의하고, 마지막 레이어에서 L2 Normalization을 적용한 후 `logits`로 변환하여 Softmax를 통해 최종 출력을 계산합니다.

3. **훈련 데이터**:  
   간단한 예시로 랜덤 데이터와 라벨을 생성해 모델을 훈련시킵니다.

이 코드는 ArcFace의 핵심 개념을 간단하게 구현한 예시로, 실제 학습에서는 훨씬 복잡한 데이터 전처리와 모델 구조가 필요할 수 있습니다.


## 최신 글
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>
