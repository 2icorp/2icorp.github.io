---
layout: default
title: "Cross Attention 리뷰"
date: 2024-10-17
categories: [AI, Deep Learning]
---

# Cross Attention Review


**Stable Diffusion**에서 텍스트와 이미지를 연결하는 핵심 요소는 **Cross Attention** 메커니즘입니다. 이 메커니즘은 **텍스트 정보**와 **이미지의 잠재 공간(latent space)** 사이의 연관성을 학습하여, 주어진 텍스트 설명에 맞는 이미지를 생성하는 역할을 합니다.

### Cross Attention의 역할:
- **텍스트**는 언어 모델을 통해 임베딩 벡터로 변환됩니다.
- **이미지**는 주로 UNet과 같은 모델을 통해 잠재 공간(latent space)에서 표현됩니다.
- Cross Attention은 **텍스트 임베딩**과 **이미지의 잠재 표현**을 연결하여, 이미지 생성 과정에서 텍스트의 의미가 이미지에 반영되도록 합니다.

### Cross Attention의 기본 개념:
- **Query(쿼리)**: 이미지를 처리하는 모델의 출력(주로 잠재 공간에서의 표현)이 쿼리가 됩니다.
- **Key(키), Value(값)**: 텍스트 임베딩에서 추출된 벡터들이 각각 키(Key)와 값(Value)로 사용됩니다.
- **Attention 메커니즘**: 쿼리와 키 사이의 유사도를 계산한 후, 이를 바탕으로 값(Value)에 가중치를 부여하여, 텍스트 정보가 이미지 생성에 영향을 미치게 됩니다.

### Cross Attention PyTorch 코드 예시

아래는 PyTorch에서 **Cross Attention**을 사용하는 방법을 설명하는 코드입니다. 이 코드는 기본적인 Attention 구조를 기반으로 하며, 텍스트 임베딩과 이미지의 잠재 표현을 연결하는 Cross Attention을 구현합니다.

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

# Cross Attention Layer
class CrossAttention(nn.Module):
    def __init__(self, embed_dim, num_heads=8):
        super(CrossAttention, self).__init__()
        self.num_heads = num_heads
        self.embed_dim = embed_dim
        self.query_proj = nn.Linear(embed_dim, embed_dim)
        self.key_proj = nn.Linear(embed_dim, embed_dim)
        self.value_proj = nn.Linear(embed_dim, embed_dim)
        self.out_proj = nn.Linear(embed_dim, embed_dim)

    def forward(self, image_features, text_features):
        # 이미지에서 쿼리, 텍스트에서 키와 값을 생성
        query = self.query_proj(image_features)  # Query는 이미지에서
        key = self.key_proj(text_features)      # Key는 텍스트에서
        value = self.value_proj(text_features)  # Value도 텍스트에서

        # 쿼리, 키, 값을 num_heads로 분리 (multi-head attention)
        batch_size = query.size(0)
        query = query.view(batch_size, -1, self.num_heads, self.embed_dim // self.num_heads).transpose(1, 2)
        key = key.view(batch_size, -1, self.num_heads, self.embed_dim // self.num_heads).transpose(1, 2)
        value = value.view(batch_size, -1, self.num_heads, self.embed_dim // self.num_heads).transpose(1, 2)

        # Scaled Dot-Product Attention
        attention_scores = torch.matmul(query, key.transpose(-2, -1)) / (self.embed_dim ** 0.5)
        attention_weights = F.softmax(attention_scores, dim=-1)

        # 값(Value)에 어텐션 가중치를 곱함
        attention_output = torch.matmul(attention_weights, value)

        # Multi-head Attention을 병합
        attention_output = attention_output.transpose(1, 2).contiguous().view(batch_size, -1, self.embed_dim)

        # 출력 프로젝션 적용
        output = self.out_proj(attention_output)
        return output

# 간단한 UNet 기반 예시 모델 (이미지 잠재 공간에서 작동)
class SimpleUNet(nn.Module):
    def __init__(self, embed_dim):
        super(SimpleUNet, self).__init__()
        self.downsample = nn.Conv2d(3, embed_dim, kernel_size=4, stride=2, padding=1)
        self.upsample = nn.ConvTranspose2d(embed_dim, 3, kernel_size=4, stride=2, padding=1)
        self.cross_attention = CrossAttention(embed_dim)

    def forward(self, images, text_features):
        # 이미지 잠재 표현을 얻기 위한 다운샘플링
        x = self.downsample(images)
        x = x.view(x.size(0), -1, x.size(1))  # 잠재 공간에서 표현

        # Cross Attention을 통해 텍스트 임베딩과 이미지 표현을 결합
        x = self.cross_attention(x, text_features)

        # 업샘플링하여 이미지를 재구성
        x = x.view(x.size(0), x.size(2), 1, 1)  # 다시 이미지 형식으로 변환
        x = self.upsample(x)
        return x

# 모델 초기화
embed_dim = 256
model = SimpleUNet(embed_dim=embed_dim)

# 입력 예시: 랜덤 이미지 및 텍스트 임베딩
images = torch.randn(4, 3, 64, 64)  # 배치 크기 4, 64x64 크기의 이미지
text_features = torch.randn(4, 10, embed_dim)  # 배치 크기 4, 10개의 토큰을 가진 텍스트 임베딩

# 모델 실행
output_images = model(images, text_features)

print("Output image shape:", output_images.shape)
```

### 코드 설명:

1. **CrossAttention 클래스**: 
   - **Query**는 이미지에서 추출된 잠재 표현입니다.
   - **Key**와 **Value**는 텍스트 임베딩에서 가져옵니다.
   - **attention_scores**는 Query와 Key 사이의 내적을 계산하여, 각 텍스트와 이미지의 잠재 표현 사이의 관계를 측정합니다.
   - **attention_weights**는 각 텍스트 토큰에 대한 이미지 잠재 공간의 가중치를 계산한 값입니다. 이 가중치를 Value에 적용하여 텍스트 정보가 이미지 잠재 공간에 반영되도록 만듭니다.
   - 마지막으로, 결과를 **out_proj**를 통해 이미지 잠재 공간과 텍스트 정보가 결합된 결과를 출력합니다.

2. **SimpleUNet 클래스**:
   - UNet의 간단한 형태로, 이미지 데이터를 잠재 공간으로 변환한 후 Cross Attention을 통해 텍스트와의 관계를 학습합니다.
   - 이미지와 텍스트 임베딩을 결합한 후 다시 이미지로 재구성합니다.

3. **입력 및 출력**:
   - 예시에서는 64x64 크기의 랜덤 이미지를 입력으로 주고, 10개의 토큰으로 이루어진 텍스트 임베딩과 함께 사용하여 이미지를 생성합니다.

### Cross Attention을 사용하는 이유:

1. **텍스트와 이미지의 상호작용**: Cross Attention을 통해 이미지 잠재 표현이 텍스트 임베딩을 반영할 수 있습니다. 이는 Stable Diffusion과 같은 모델에서 **텍스트 설명**에 맞는 이미지를 생성하는 데 매우 유용합니다.
   
2. **텍스트의 세밀한 반영**: 텍스트의 각 단어(또는 토큰)가 이미지 생성 과정에 영향을 미칠 수 있도록, 텍스트 임베딩의 각 부분이 이미지의 각 부분에 어떻게 영향을 미치는지 학습할 수 있습니다.

3. **유연한 연결**: Cross Attention은 텍스트와 이미지 사이의 유연한 연결을 제공하므로, 모델이 텍스트의 다양한 의미를 반영하여 더 구체적이고 맞춤형 이미지를 생성할 수 있습니다.

### Stable Diffusion에서의 활용:

Stable Diffusion에서는 이러한 Cross Attention 메커니즘을 통해 텍스트 설명이 이미지 생성 과정에서 **주요 피드백 역할**을 합니다. 텍스트 임베딩이 UNet 기반의 이미지 생성 네트워크에 **직접적인 정보**를 제공하여, 텍스트에서 묘사한 장면에 맞는 이미지를 만들어냅니다.

이를 통해 **"파란 하늘이 있는 바다"**와 같은 텍스트를 주면, Cross Attention은 이 텍스트의 중요한 요소(파란 하늘, 바다)를 이미지 생성 과정에 반영하여, 결과적으로 그에 맞는 이미지를 생성할 수 있습니다.

## 최신 글
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>