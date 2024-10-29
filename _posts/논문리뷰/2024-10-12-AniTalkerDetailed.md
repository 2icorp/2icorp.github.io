---
title: "[논문리뷰] AniTalker 상세정리"
last_modified_at: 2024-10-12
categories:
  - 논문리뷰
tags:
  - Text to Image
excerpt: ""
use_math: true
classes: wide
---

**제목:** AniTalker: Identity-Decoupled Facial Motion Encoding을 통한 생동감 있는 다양한 얼굴 애니메이션 생성  
**저자:** Tao Liu, Feilong Chen, Shuai Fan, Chenpeng Du, Qi Chen, Xie Chen, Kai Yu

**[AniTalker GitHub Repository](https://github.com/X-LANCE/AniTalker)**  
**[AniTalker arXiv Paper](https://arxiv.org/abs/2405.03121)**

### A. **Data Processing Pipeline**
AniTalker의 데이터 처리 파이프라인은 **VoxCeleb**, **HDTF**, **VFHQ** 데이터셋을 기반으로 하며, 총 4단계로 구성되어 있어요:
1. **데이터셋 재다운로드**: 모든 데이터를 일관되게 처리하기 위해 원본 비디오를 다시 다운로드했어요. VoxCeleb과 HDTF 데이터셋의 약 60-70%를 확보할 수 있었고, VFHQ는 완전한 비디오 세트를 제공받았어요.
2. **얼굴 감지**: 프레임 내에서 자연스러운 머리 움직임을 보존하기 위해 얼굴 정렬을 생략하고, 비디오에서 얼굴을 감지했어요.
3. **필터링 규칙 적용**: 해상도가 256×256 이하이거나, 회전 각도가 60도 이상인 얼굴 이미지는 제외했어요.
4. **ID 태그 기반 클립 선택**: 다양한 정체성 데이터를 확보하기 위해 각 ID당 2-3개의 비디오 클립을 무작위로 선택했어요.
모든 이미지를 256×256 해상도로 크기 조정한 후, 총 17,108개의 비디오 클립과 55시간 분량의 데이터를 확보했어요.

### B. **Training Details**
#### B.1 **Data Augmentation**
데이터 증강은 **배경의 일관성**을 유지하기 위해 제한적으로 사용되었어요. 단, ID 인코더 학습 시에는 **수평 반전**, **컬러 변경**, **블러**, **회전** 등의 증강 기법을 사용했어요.

#### B.2 **Training Configuration**
1. **손실 함수**: 다양한 손실 함수(재구성 손실, 지각 손실, 적대적 손실 등)를 사용해 모션 인코더와 생성기를 학습했어요. **CLUB**을 이용한 상호 정보 손실은 동작과 정체성 간 차이를 최소화하는 데 사용됐어요.
2. **하드웨어 설정**: 4개의 A100 GPU에서 약 50시간 동안 1차 모션 표현 학습을 진행했으며, 120시간 동안 EMA를 사용해 학습을 안정화했어요.

### C. **Model Details**

![AniTalker Framework](/assets/images/posts/AniTalkerFramework.png)

#### C.1 **Identity and Motion Encoder**
AniTalker는 **정체성 인코더**와 **모션 인코더**로 나뉘며, 정체성 인코더는 **Metric Learning** 손실을 통해 정체성을 학습하고, 모션 인코더는 **상호 정보 손실**을 통해 모션을 학습해요. 모션 표현의 차원 축소를 위해 **Linear Motion Decomposition(LMD)** 방법이 사용됐어요.

#### C.2 **Rendering Block**
렌더링 블록은 **LIA**의 **Wrap 기반 모듈**을 사용해 다양한 이미지 인코더 계층에서 추출한 특징을 변형하고, 이를 합성하여 최종 이미지를 생성해요. 총 8개의 계층을 사용해 각 계층의 특징을 합성했어요.

#### C.3 **Motion Generator**
모션 생성기는 오디오 입력과 이미지를 모션 시퀀스로 변환해요. **Speech Encoder**와 **Diffusion Motion Generator**가 이 과정에서 중요한 역할을 해요. 두 모듈 모두 **Conformer** 구조를 사용해 음성과 모션을 결합해요.

### C.4 **Experiments (실험)**

#### C.4.1 **렌더링 성능 분석**
AniTalker의 **렌더링 성능**을 GAIA 및 EMO와 비교했을 때, AniTalker는 더 나은 **PSNR**(35.634)과 **SSIM**(0.979)을 기록하며 **얼굴 재구성 능력**에서 두 모델보다 우수한 성능을 보였어요. GAIA와 EMO는 VAE 기반의 렌더링 방식을 사용하지만, AniTalker는 Wrap 기반의 렌더링 블록을 사용해 **고주파 정보 손실**을 줄이고 **세밀한 얼굴 디테일**을 더 잘 유지할 수 있었어요.

#### C.4.2 **모션 프로젝트 구조 분석**
모션 프로젝트에서의 **차원 축소 방법**을 비교한 결과, **LMD(Linear Motion Decomposition)** 방법이 **완전 연결층(FC)**보다 더 우수한 성과를 냈어요. **차원 수**가 20일 때 가장 성능이 안정적이었으며, 10차원이나 32차원에서의 성능 변화는 미미했어요.

#### C.4.3 **분리 과정에 대한 시각적 검증**
서로 다른 **분리 방법**으로 실험한 결과, **상호 정보 손실**을 포함한 AniTalker는 ID 누출 현상을 크게 줄일 수 있었어요. 이는 **모션과 정체성**을 명확히 구분하는 데 효과적이었으며, 특히 **동작 재현**에서 높은 신뢰도를 보였어요.

---

### D. **Demo Setup (데모 설정)**

AniTalker의 성능을 시각적으로 확인할 수 있는 다양한 데모를 제공하고 있어요. 데모는 총 9가지 테스트 케이스로 구성되어 있으며, 각각의 설정에 대한 설명은 다음과 같아요:

1. **Audio-driven Talking Face Generation (Realism)**: 오디오 입력을 통해 현실적인 인간 얼굴을 생성하는 테스트.
2. **Audio-driven Talking Face Generation (Statue/Cartoon)**: 만화나 조각상과 같은 비인간적 얼굴을 대상으로 모델의 일반화 성능을 테스트.
3. **Video-driven Talking Face Generation (Cross/Self Reenactment)**: 동일 인물 및 교차 재현 테스트로 모션 표현의 효과성을 검증.
4. **Diversity**: 두 개의 다른 시드와 9개의 무작위 시드를 사용하여 **다양한 결과**를 생성하는 테스트.
5. **Controllability**: 모션의 **제어 가능성**을 평가, 포즈, 머리 위치, 오디오 등을 결합하여 테스트.
6. **Long Video Generation**: 장시간 비디오 생성 능력을 테스트하며, 8GB VRAM을 가진 GPU에서도 몇 분간의 비디오를 안정적으로 생성 가능.
7. **Method Comparison (Audio-driven)**: 다양한 오디오 기반 방법들과 비교하여 성능을 평가.
8. **Method Comparison (Video-driven)**: 비디오 기반 얼굴 재현 기법들과의 성능 비교.
9. **Ablation Study**: 서로 다른 모듈들이 결과에 미치는 영향을 검증하기 위한 테스트.

---

### E. **Ethical Consideration (윤리적 고려사항)**

디지털 얼굴 생성 기술은 **사기성 ID 생성**이나 **허위 정보 유포** 등 악용될 가능성이 있어요. 이러한 기술이 오용되는 것을 방지하기 위해선 사전에 윤리적 가이드라인을 설정하고, **동의**와 **투명성**, **책임성**을 확보해야 해요. 특히 생성된 콘텐츠에 **디지털 워터마크**를 포함하는 것이 권장되며, 이를 통해 해당 콘텐츠가 인위적으로 생성되었음을 알 수 있도록 해야 해요.

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


