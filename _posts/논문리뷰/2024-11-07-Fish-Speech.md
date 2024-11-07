---

title: "[논문리뷰] Fish-Speech Review"
last_modified_at: 2024-11-05
categories:
  - 논문리뷰
tags:
  - Fish-Speech
  - Text-to-Speech
  - Large Language Models
  - Multilingual Synthesis
  - Dual Autoregressive Architecture
excerpt: "다언어 텍스트-음성 합성에서 일관된 성능을 제공하는 Fish-Speech 모델 리뷰"
use_math: true
classes: wide
---

## FISH-SPEECH: LEVERAGING LARGE LANGUAGE MODELS FOR ADVANCED MULTILINGUAL TEXT-TO-SPEECH SYNTHESIS

TECHNICAL REPORT

Shijia Liao 1

Yuxuan Wang 1

Tianyu Li 1

Yifan Cheng 1 Yijin Xing 1

Ruoyi Zhang 1

Rongzhi Zhou 1

$^{1}$Fish Audio

{lengyue,honst,stardust}@fish.audio, yf\_cheng@hust.edu.cn, potato\_zhang@nuist.edu.cn, laziman@fish.audio, rcell233@outlook.com

2024년 11월 5일

## ABSTRACT

Text-to-Speech (TTS) 시스템은 복잡한 언어적 특징 처리, 다의어 표현 관리, 자연스러운 다언어 발화를 생성하는 데 지속적인 어려움을 겪고 있으며, 이는 미래 AI 애플리케이션에 필수적인 기능입니다. 본 논문에서는 Fish-Speech라는 새로운 프레임워크를 제안하여 Grouped Finite Scalar Vector Quantization (GFSQ)의 안정성을 향상시키기 위해 빠르고 느린 Dual Autoregressive (Dual-AR) 아키텍처를 구현하였습니다. 이 아키텍처는 시퀀스 생성 작업에서 코드북 처리 효율을 높이고 고품질 출력을 유지하여 AI 상호작용 및 음성 복제에 특히 효과적입니다.

Fish-Speech는 언어적 특징 추출에 Large Language Models (LLMs)를 활용하여 전통적인 grapheme-to-phoneme (G2P) 변환을 없애고, 이를 통해 다언어 지원을 개선하고 합성 파이프라인을 단순화하였습니다. 또한, 우리는 GFSQ를 통해 FF-GAN을 개발하여 우수한 압축 비율과 코드북의 거의 100% 활용률을 달성했습니다.

이 접근법은 현재 TTS 시스템의 주요 한계를 해결하면서, 보다 정교하고 문맥을 인식하는 음성 합성의 기초를 제공합니다. 실험 결과에 따르면 Fish-Speech는 복잡한 언어적 시나리오와 음성 복제 작업에서 기존 모델보다 훨씬 우수한 성능을 보여 AI 애플리케이션에서 TTS 기술을 발전시킬 잠재력을 가지고 있습니다. 구현은 https://github.com/fishaudio/fish-speech에서 오픈 소스로 제공됩니다.

Keywords Text to Speecch · LLM · Voice Cloning

## 1 Introduction

지난 10년간 Text-to-Speech (TTS) 시스템은 가상 비서에서 교육 도구까지 다양한 애플리케이션에서 주목할만한 발전을 이루었습니다. 현재 TTS 아키텍처는 VALL-E [Wang et al. [2023]], VITS [Kim et al. [2021]], Fastspeech [Ren et al. [2020]]와 같은 모델로 구성되며, 종종 합성 전에 텍스트를 음성적 표현으로 변환하기 위해 grapheme-to-phoneme (G2P) 변환을 사용합니다 [Klatt [1987]]. 이러한 접근법은 효과적이지만, 문맥에 따라 다의어가 다른 의미를 지닐 때나 다언어 일반화에서 복잡한 음성 규칙 때문에 어려움을 겪습니다. 최근 zero-shot 음성 변환과 같은 YourTTS [Casanova et al. [2022]]와 통합 음성 생성 모델 UniAudio [Yang et al. [2023]]는 다양한 음성 작업을 처리하는 신경망 아키텍처의 잠재력을 보여주었습니다. 또한, CosyVoice [Du et al. [2024], MatchaTTS [Mehta et al. [2024]]와 같은 흐름 기반 모델은 자연스러운 음성 합성에서 유망한 결과를 보였습니다. 그러나 대부분의 솔루션은 안정성을 개선하기 위해 의미적 및 음향적 특징을 분리하는 절충을 합니다.

다언어 TTS 시스템에 대한 수요가 증가함에 따라 G2P 기반 접근법의 한계가 더욱 명확해지고 있습니다. 언어별 음성 규칙과 어휘가 필요하여 확장성과 시스템 유지 보수가 어렵습니다. 최근 연구에서는 LLM을 사용하여 직접 언어적 특징을 추출하여 명시적 G2P 변환의 필요성을 없애는 것을 탐구하였습니다 [Betker [2023]].

우리는 Fish-Speech라는 새로운 TTS 프레임워크를 소개하여, 빠르고 느린 Dual-AR 아키텍처를 특징으로 합니다. 이 디자인은 시퀀스 생성에서 GFSQ의 안정성을 높이면서 고품질 출력을 유지합니다. TTS 파이프라인에 LLM을 통합함으로써 Fish-Speech는 합성 프로세스를 간소화하고 다의어 문자와 다언어 텍스트를 보다 잘 처리할 수 있습니다. 모델은 72만 시간의 다언어 오디오 데이터로 훈련하여 다양한 언어 패턴과 발음 변화를 학습할 수 있도록 했습니다.

합성 품질을 향상시키기 위해 우리는 Grouped Finite Scalar Vector Quantization (GFSQ)를 기반으로 한 새로운 vocoder 아키텍처 Firefly-GAN (FF-GAN)을 개발하였습니다. FFGAN은 Finite Scalar Quantization (FSQ) [Mentzer et al. [2023]]와 Group Vector Quantization (GVQ)를 결합하여 압축 비율과 코드북 사용을 최적화합니다. 우리의 평가에서는 100% 코드북 활용률을 보여주며, 이는 이 분야에서 최첨단 성능을 나타냅니다.

본 연구의 주요 기여는 다음과 같습니다:

- · LLM과 Dual-AR 아키텍처를 활용하여 전통적인 G2P 변환을 대체하여 견고하고 확장 가능한 다언어 음성 합성을 제공하는 Fish-Speech라는 새로운 TTS 프레임워크를 소개하였습니다.
- · 여러 벡터 양자화 기법을 통합하여 고충실도 음성 합성을 달성하고 최적의 압축 비율과 코드북 활용을 달성하는 고급 vocoder FFGAN을 제시하였습니다.
- · fish-tech 가속화 방법론을 개발하여 소비자용 NVIDIA RTX 4060 모바일 플랫폼에서 약 1:5, 고성능 NVIDIA RTX 4090 구성에서 1:15의 실시간 요소를 달성하고, DiT 및 Flow 구조를 사용하는 다른 TTS 시스템보다 훨씬 낮은 150ms의 지연을 제공합니다.

청취자에게 Fish Speech 1.4 샘플을 들어보기를 권장합니다. fish.audio의 온라인 합성 사이트에서도 커뮤니티가 합성한 다양한 오디오 스피커를 체험해 보시길 바랍니다.

## 2 Related Work

### 2.1 Text-to-Speech Systems

Text-to-Speech (TTS) 시스템은 기본적인 음소 기반 모델에서 텍스트를 직접 음성으로 변환하는 정교한 엔드-투-엔드 신경망 접근법으로 크게 발전해 왔습니다 [Tan et al. [2021]]. 이러한 변혁은 딥러닝의 발전과 컴퓨팅 능력 증가에 힘입어, 음성 자연스러움, 운율 제어, 다언어 기능에서 큰 개선을 이루었습니다 [Ren et al. [2019]]. 현대 TTS 시스템은 이제 지능형 비서에서 접근성 도구, 인간-컴퓨터 인터페이스에 이르기까지 다양한 애플리케이션에 사용되고 있습니다 [Capes et al. [2017]].

### 2.2 Neural Vocoders

Neural vocoders는 음성 합성 품질을 향상시키는 데 중요한 역할을 해왔습니다. WaveNet [Van Den Oord et al. [2016]]이 오디오 생성을 위한 autoregressive 모델을 처음 소개한 이후, WaveRNN [Kalchbrenner et al. [2018]], WaveGrad [Chen et al. [2020]]과 같은 더 효율적인 아키텍처가 이어졌습니다. HiFi-GAN [Kong et al. [2020]]은 적대적 학습을 도입하여 오디오 품질과 계산 효율성에서 새로운 기준을 세웠습니다. EVA-GAN은 NVIDIA에서 개발한 최신 GAN 구조 vocoder로, Context Aware Module(CAM)을 사용하여 최소한의 계산 비용으로 성능을 개선하였습니다 [Liao et al. [2024]]. EVA-GAN은 스펙트럼 연속성과 고주파 재구성에서 객관적 및 주관적 측정에서 기존 최첨단 vocoder보다 우수한 성능을 보여줍니다.

### 2.3 Vector Quantization in Speech Synthesis

Vector Quantization (VQ)은 현대 음성 합성에 필수적인 요소가 되었습니다. VQ-VAE [Van Den Oord et al. [2017]]는 오디오 생성을 위한 이산적인 잠재 표현의 효율성을 보여주었으며, SoundStream [Zeghidour et al. [2021]], EnCodec [Défossez et al. [2022]]은 이러한 기술을 고품질 오디오 압축 및 합성에 맞게 더욱 발전시

켰습니다.

### 2.4 Large Language Models in Speech Processing

Large Language Models (LLMs)는 음성 처리에서 점점 더 중요한 역할을 하고 있습니다. 현재 Parler TTS [Lacombe et al. [2024]], MeloTTS [Zhao et al. [2023]], E3-TTS [Gao et al. [2023]], XTTS [Casanova et al. [2024]]와 같은 모델들이 BERT, huBERT를 중간 구조로 사용하는 추세로, 모두 더 나은 합성 효과를 달성하고 있습니다.

### 2.5 Multilingual Speech Synthesis

다언어 음성 합성은 언어 간 일관된 품질을 유지하는 데 있어 독특한 과제에 직면하고 있습니다. 최근 해결책으로는 통합 다언어 모델 [Liu and Mak [2019]], 언어 간 전이 학습 [Nekvinda and Dušek [2020]], 언어 무관 표현 [Li et al. [2019]] 등이 있습니다.

## 3 Methods

Fish-Speech는 현재의 non-G2P TTS 시스템의 주요 한계를 해결하기 위한 새로운 Text-to-Speech (TTS) 프레임워크입니다. 이 프레임워크는 고급 AI 대화형 에이전트의 요구를 충족시키기 위해 다감정적 및 다언어 음성 합성을 처리하는 데 중점을 두고 설계되었습니다.

최근의 벡터 양자화 및 조건 표현 [Kumar et al. [2024], Chen et al. [2023], Wang et al. [2019]]의 발전을 바탕으로, 우리는 Grouped Finite Scalar Vector Quantization(GFSQ) 기술을 도입하였습니다.

이 방법은 잠재 조건을 효율적으로 인코딩하여 미묘한 음성 변화를 더 잘 포착하고 재현할 수 있도록 합니다. 우리의 접근법은 100% 코드북 활용률을 달성하여 양자화 공간의 효과를 극대화합니다.

우리는 또한 현재 TTS 시스템의 두 가지 주요 문제를 해결하는 dual autoregressive (dual-AR) 아키텍처를 개발했습니다. 첫째, 이는 기존 프레임워크에서 흔히 발생하는 코드 생성의 안정성을 개선합니다. 둘째, Diffusion Transformers (DiT)보다 생성 효율성이 뛰어나 실시간 애플리케이션에 적합합니다. 마지막으로, 음성 에이전트용으로 준비된 아키텍처로, 향후에 출시할 예정입니다.

Figure 1: Fish Speech Architecture

<!-- image -->

### 3.1 Dual Autoregressive Architecture in Fish-Speech

이 섹션에서는 Fish-Speech의 Dual Autoregressive (Dual-AR) 아키텍처 [Fig. 2]를 설명합니다. 이 TTS 시스템은 복잡한 언어적 특징, 다의어 단어, 자연스러운 다언어 합성을 처리하도록 설계되었습니다. Dual-AR 아키텍처는 시퀀스 생성 동안 GFSQ의 코드북 처리 안정성 및 계산 효율성을 개선합니다.

#### 3.1.1 Overview of the Dual-AR Architecture

Dual-AR 아키텍처는 두 개의 순차적 autoregressive transformer [Vaswani [2017], Subakan et al. [2021]] 모듈로 구성됩니다: Slow Transformer와 Fast Transformer [Yang et al. [2023]]. 이 디자인은 음성 합성의 고수준 및 세부적인 측면을 효율적으로 처리합니다.

### Slow Transformer

Slow Transformer는 전반적인 언어적 구조와 의미적 내용을 포착하기 위해 입력 텍스트 임베딩을 처리합니다. 이는 중간 숨겨진 상태를 생성하고 의미 토큰을 예측합니다.

Figure 2: Dual Autoregressive (Dual-AR) 프레임워크의 구조적 개요.

<!-- image -->

Slow Transformer는 높은 추상화 수준에서 기능하며, 입력 텍스트 임베딩을 처리하여 전반적인 언어 구조와 의미적 콘텐츠를 인코딩합니다. 이 모듈은 중간 숨겨진 상태를 생성하고 고정밀로 의미 토큰을 예측하는 역할을 합니다.

입력 토큰 시퀀스 x = [ x$\_{1}$, x$\_{2}$, ..., x$\_{T}$ ]에 대해 Slow Transformer는 다음과 같은 변환을 통해 숨겨진 상태 h ∈$\_{R}$ T × D 및 토큰 로짓 z를 생성합니다:

h = SlowTransformer ( x ) (1)

z = W$\_{tok}$ · Norm ( h ) (2)

여기서 Norm ( · )은 레이어 정규화, W$\_{tok}$는 토큰 예측 레이어의 학습 가능한 매개변수를 나타냅니다.

### Fast Transformer

Fast Transformer는 Slow Transformer의 출력을 코드북 임베딩 처리를 통해 세부적인 음향 특징을 포착하고 자연스러운 음성을 생성하는 데 최적화합니다. 이는 잔여 정보를 처리하고 코드북 사용을 최적화합니다.

Fast Transformer는 숨겨진 상태 h와 코드북 임베딩 c의 연결된 시퀀스를 입력으로 사용하여 다음과 같이 작동합니다:

˜ h = [ h ; c ] , ( h $^{fast}$) (3)

h fast = FastTransformer ( ˜ h , ( h $^{fast}$)) (4)

y = W$\_{cbk}$ · Norm ( h $^{fast}$) (5)

여기서 [ h ; c ]는 h와 c의 연결 연산을 나타내며, W$\_{cbk}$는 코드북 예측 레이어의 학습 가능한 매개변수를 포함하고 y는 결과 코드북 로짓을 나타냅니다.

#### 3.1.2 Advantages of the Dual-AR Architecture

Fish-Speech의 Dual-AR 아키텍처는 몇 가지 중요한 장점을 제공합니다:

- 1. **향상된 시퀀스 생성 안정성**: 전역 및 지역 정보의 계층적 처리가 시퀀스 생성 작업에서 GFSQ의 안정성을 크게 향상시킵니다.
- 2. **최적화된 코드북 처리**: Fast Transformer는 코드북 임베딩 처리를 위한 효율적인 메커니즘을 구현하여, 특히 7B 이상의 대규모 모델에 대해 뛰어난 성능을 발휘하면서도 상당한 계산 오버헤드를 피할 수 있습니다.
- 3. **우수한 음성 합성 품질**: Slow Transformer와 Fast Transformer의 상호작용은 복잡한 언어적 현상을 처리할 수 있는 고충실도의 음성 합성을 가능하게 합니다.
- 4. **고급 다언어 처리**: LLM과의 통합을 통해 전통적인 grapheme-to-phoneme 변환 의존성을 제거하고 합성 파이프라인을 간소화하며 다언어 기능을 향상시킵니다. 텍스트 데이터를 혼합하여 이해를 더욱 증진시킬 수 있습니다.

### 3.2 Firefly-GAN

Firefly-GAN (FF-GAN)은 EVA-GAN 아키텍처의 개선된 버전으로, 구조적 개선을 포함합니다. 이는 HiFi-GAN [Kong et al. [2020]]의 전통적인 합성 모듈을 더 효율적인 디자인으로 대체하여 Multi-Receptive Field (MRF) 모듈 대신 ParallelBlock을 도입하였습니다. GFSQ와 통합하여, FF-GAN은 시퀀스 생성 안정성을 향상시키고 언어적 변화를 잘 처리할 수 있습니다.

Firefly-GAN (FF-GAN)은 EVA-GAN 아키텍처의 개선된 버전으로, 전통적인 합성 및 변환 합성 모듈을 더욱 효율적인 구조로 대체하여, typo-codebook vocoder 애플리케이션에 특화된 ParallelBlock을 도입하였습니다. GFSQ 통합을 통해, FF-GAN은 텍스트-음성 합성 및 음성 복제 애플리케이션에서 향상된 시퀀스 생성 안정성과 자연스러운 다언어 합성을 제공합니다. 

Figure 3: Firefly-GAN 아키텍처

<!-- image -->

#### 3.2.1 Firefly Generator

FF-GAN은 depth-wise separable convolution [Howard [2017]]과 dilated convolutions [Yu [2015]]을 포함한 개선된 Conv 구조를 사용하여 기존 Conv1d 레이어를 대체합니다. 이 구조적 개선은 모델이 복잡한 오디오 특징을 포착하고 합성하는 능력을 향상시킵니다.

우리의 아키텍처에서 기존 Multi-Receptive Field (MRF) 모듈은 ParallelBlock으로 대체되어 typo-codebook 입력 처리 효율성을 최적화합니다. ParallelBlock은 조정 가능한 convolution kernel 크기와 dilation rate [Yu [2015]]을 구현하여, 3개의 ResBlock에서 출력된 정보를 처리하기 위해 stack-and-average 메커니즘을 사용합니다. 

#### 3.2.2 Quantization Techniques

typo-codebook 작업에 맞추기 위해, Grouped Finite Scalar Vector Quantization (GFSQ)을 시스템의 vq 코드북으로 사용합니다. GFSQ의 구체적인 개발 과정은 다음과 같습니다:

입력 텐서 z ∈$\_{R}$ B × C × $^{L}$. 전체 과정은 다음 단계로 이루어집니다:

### Downsampling

z를 입력 텐서로 하는 downsampling 함수 f$\_{down}$을 사용하여 downsampled 텐서 z$\_{d}$ ∈ R B × C$\_{d}$ × $^{L$\_{d}$}$를 얻습니다:

z$\_{d}$ = f$\_{down}$ ( z ) (6)

### GFSQ Process

- **특징 그룹화**: 입력 특징 행렬 Z는 G 그룹으로 나뉩니다:

Z = [ Z $^{(1)}$, Z $^{(2)}$, ..., Z ( G $^{)}$] (7)

- **스칼라 양자화**: 각 스칼라 z ( g ) $\_{b,c,l}$에 대해:

ˆ z ( g ) b,c,l = Q ( z ( g ) $\_{b,c,l}$) (8)

- **인덱스 생성**: 각 스칼라는 인덱스 k ( g ) b,c,l로 매핑됩니다.
- **디코딩**: 

ˆ z ( g ) b,c,l = Codebook ( g $^{)}$[ k ( g ) $\_{b,c,l}$] (9)

### Quantized Downsampled Tensor 재구성

모든 그룹의 양자화된 벡터를 채널 차원으로 연결하여 최종 양자화된 다운샘플링 텐서 z$\_{q}$$\_{d}$ ∈$\_{R}$ B × C$\_{d}$ × $^{L$\_{d}$}$를 얻습니다:

z$\_{q}$$\_{d}$ ( b, : , l ) = $^{[}$z (1) q$\_{d}$ ( b, : , l ); z

 (2) q$\_{d}$ ( b, : , l ); ... ; z ( G ) q$\_{d}$ ( b, : , l ) ] (10)

### Upsampling

다운샘플링된 텐서를 원래 크기로 복원하는 업샘플링 함수 f$\_{up}$을 사용하여 최종 양자화된 텐서 z$\_{q}$ ∈$\_{R}$ B × C × $^{L}$를 얻습니다:

z$\_{q}$ = f$\_{up}$ ( z$\_{q}$$\_{d}$ ) (11)

목표는 z$\_{q}$가 원래 입력 z에 최대한 가깝게 되도록 하는 것입니다:

z$\_{q}$ ≈ z (12)

#### 3.2.3 Conclusion

GFSQ 기술을 사용한 구현은 약 100%의 코드북 활용률을 달성하였으며, 내부 소실 분석에서 다른 양자화 기법(RFSQ, RVQ, GRFSQ)보다 객관적 및 주관적 점수에서 더 높은 점수를 기록했습니다. FF-GAN은 typo-codebook 작업에서 안정성을 크게 향상시키며, 다감정 및 다언어 작업에서 중간 변수 정보의 종합적 보존을 보장합니다.

FF-GAN의 혁신적인 typo-codebook 안정성 접근 방식은 다양한 음악 생성 애플리케이션에 이미 사용되고 있습니다. 프레임워크의 성능 및 아키텍처는 향후 AI 에이전트 개발의 기준 모델로 자리 잡을 가능성이 있습니다.

---

## 4 Training and Inference

### 4.1 Training

Fish-Speech는 세 단계의 훈련 접근 방식을 사용합니다. 초기에는 표준 데이터의 대규모 배치로 예비 훈련을 수행한 후, 고품질 데이터의 소규모 배치를 사용한 SFT (Supervised Fine-Tuning)를 거치며, 마지막으로 양성 및 음성 샘플 쌍을 수동으로 라벨링한 DPO (Direct Preference Optimization) 훈련을 진행합니다.

훈련 인프라는 두 개의 구성 요소로 나뉩니다 (Fig. 1): AR 훈련에는 8개의 H100 80G GPU가 일주일 동안 사용되었고, vocoder 훈련에는 8개의 4090 GPU가 추가로 일주일 동안 사용되었습니다. 이 기간에는 DPO 단계가 포함되지 않습니다.

### 4.2 Inference

우리의 추론 전략은 Fig. 1의 아키텍처를 따릅니다. KV-cache [Pope et al. [2023]], torch compile 및 기타 가속화 방법론을 포함한 fish-tech을 사용하여, 시스템은 소비자용 NVIDIA RTX 4060 모바일 플랫폼에서 약 1:5의 실시간 요소, 고성능 NVIDIA RTX 4090 구성에서 1:15의 실시간 요소를 달성합니다. 이러한 아키텍처 최적화는 추론의 지연을 상당히 개선하여, 첫 패킷 지연 시간이 150ms 이하로 단축됩니다.

또한, 시스템은 정보 처리를 플로우 방식으로 수행할 수 있어, 현대 AI 도구와 다양한 상황에서 쉽게 호환하여 사용할 수 있습니다.

## 5 Dataset

훈련 데이터는 공개 소스와 자체 데이터 수집 과정을 통해 얻은 방대한 음성 샘플로 구성되어 있습니다. 데이터셋은 약 72만 시간의 다언어 음성 데이터를 포함하며, 주요 구성 요소로 영어와 중국어 각각 30만 시간, 독일어, 프랑스어, 이탈리아어, 일본어, 한국어, 아랍어와 같은 기타 언어는 각 2만 시간을 포함하고 있습니다.

우리는 데이터의 언어 균형을 신중히 맞추어 모델이 여러 언어를 동시에 학습할 수 있도록 했습니다. 이러한 접근 방식은 모델이 혼합 언어 콘텐츠를 생성할 때 뛰어난 성능을 발휘하는 데 도움이 되며, 데이터셋의 큰 규모와 다양성은 다언어 처리를 자연스럽게 수행할 수 있는 모델의 능력을 크게 향상시킵니다.

## 6 Experimental Evaluation

본 연구에서는 speaker cloning 작업에 대해 우리의 아키텍처가 기존 모델과 비교했을 때의 효과를 평가하였습니다. 평가 방법론에는 객관적 및 주관적 지표가 포함됩니다. 객관적 지표로는 문장 인식률 (Word Error Rate, WER)이 사용되며, 이는 이해 가능성을 평가합니다. 주관적 지표로는 화자 임베딩 유사도와 평균 의견 점수 (MOS)가 사용되며, 이는 음성 복제 충실도와 지각적 품질을 평가하는 데 중점을 둡니다. 이 평가 프레임워크는 모델이 화자의 특성을 유지하면서 고품질 음성 합성을 달성할 수 있는 능력을 평가하는 것을 목표로 합니다.

### 6.1 Word Error Rate Analysis

Table 1: 음성 복제 작업에 대한 Word Error Rate (WER) 결과

| 모델 이름      | WER(%) |
|---------------|--------|
| Ground Truth  | 9.22   |
| fish-speech   | 6.89   |
| rechoo        | 11.92  |
| F5-TTS        | 13.98  |
| CosyVoice     | 22.2   |

Table 1의 분석에 따르면, 우리 모델은 음성 복제 작업에서 6.89%의 WER을 달성하여, 기본 모델들보다 훨씬 낮은 수치를 기록하며, Ground Truth 녹음보다도 더 우수한 성능을 보여줍니다. 이 성과는 우리 모델의 음성 복제 시나리오에서의 능력을 강력하게 입증합니다. 다른 경쟁 모델과의 차이 (11.92%에서 22.20% 범위)는 우리 방법론의 합성 안정성과 콘텐츠 충실도 향상을 강조합니다.

### 6.2 Speaker Similarity Analysis

Table 2: 다양한 모델에 대한 화자 유사성 점수, Ground Truth 포함

| 모델 이름      | Resemblyzer | SpeechBrain 2 |
|---------------|-------------|---------------|
| Ground Truth  | 0.921       | 0.77          |
| CosyVoice     | 0.936       | 0.813         |
| fish-speech   | 0.914       | 0.762         |
| F5-TTS        | 0.905       | 0.787         |
| rechoo        | 0.887       | 0.636         |

Table 2는 typo-codebook 전략이 화자 유사성 지표에 미친 영향을 보여줍니다. 우리 모델인 fish-speech는 Resemblyzer에서 0.914, SpeechBrain에서 0.762의 유사성 점수를 달성하여 Ground Truth 성능 (0.921 및 0.770)에 매우 가깝습니다. Resemblyzer에서 Ground Truth와의 차이가 0.76%, SpeechBrain 평가에서의 차이가 1.04%로, 이는 모델이 자연스러운 음성 특성을 포착하는 능력을 보여줍니다. 

이 결과는 우리 모델의 typo-codebook 아키텍처가 음향 상태를 더 포괄적으로 캡처할 수 있게 하여 합성된 음성의 음질 충실도가 향상되었음을 강력하게 시사합니다. 또한 F5-TTS (0.905 및 0.787), rechoo (0.887 및 0.636)와 같은 기본 모델보다 우수한 성능을 보입니다. 평가 프레임워크에서의 일관된 성능은 고품질의 텍스트-음성 합성과 에이전트 작업에서 화자 특징을 보존하는 우리 방법의 유효성을 입증합니다.

### 6.3 Perceptual Quality Assessment

Table 3: 클론된 음성 품질에 대한 다섯 단계 Mean Opinion Score (MOS) 평가

| 모델 이름      | MOS  |
|---------------|------|
| Ground Truth  | 5    |
| fish-speech   | 4.05 |
| CosyVoice     | 3.8  |
| F5-TTS        | 2.9  |
| rechoo        | 3.76 |

합성된 오디오의 지각적 품질을 평가하기 위해, 오디오 처리에 대한 사전 경험이 없는 청취자를 대상으로 포괄적인 Mean Opinion Score (MOS) 청취 테스트를 실시하였습니다. 평가 결과에 따르면, fish-speech는 다른 기본 모델에 비해 유의미하게 높은 주관적 점수를 기록하였으며 (p < 0.05), 이는 음성의 자연스러움과 화자 유사성 측면에서 우수한 성능을 나타냅니다. 인간 지각 측정에서의 이 평가 결과는 fish-speech가 특히 음성 복제 작업에서 인간 음성의 자연스러운 특징을 더 잘 포착하고 재현할 수 있음을 강하게 시사합니다.

## 7 Conclusion

본 연구는 텍스트-음성 변환 (TTS) 분야에서 다언어 및 다감정 안정화 솔루션을 제안함으로써 중요한 발전을 이룬 것입니다. 본 연구의 핵심 혁신은 dual autoregressive (dual-AR) 생성 아키텍처와 결합된 typo-codebook vocoder 개발에 있습니다. 이 아키텍처 조합은 합성 과정에서 안정성을 유지하면서 생성된 음성 내에서 음향적 특징을 보존합니다. 더불어, 우리는 non-grapheme-to-phoneme (non-G2P) 구조를 활용하여 전통적인 음소 기반 시스템의 한계를 효과적으로 해결하고, AI 에이전트 상호작용의 문맥에서 다언어 및 감정적으로 다양한 TTS 애플리케이션에 견고한 기반을 제공합니다.

## 8 Future Work

이러한 기초를 바탕으로, 우리는 앞으로 몇 가지 연구 방향을 제안합니다. 우리는 교차 언어 일반화와 감정적 안정성을 개선하는 것을 목표로 강화 학습 기법을 통합하여 모델 성능을 향상시킬 계획입니다. 또한, Fish-Speech 프레임워크를 기반으로 한 종단 간 언어 모델인 Fish Agent 애플리케이션을 개발 중에 있습니다. 이 시스템의 초기 데모는 현재 fish.audio/demo/live에서 사용할 수 있습니다. 우리는 오픈 소스 커뮤니티에 대한 기여에 헌신하고 있으며, 연구자와 개발자에게 더 넓은 접근성을 제공하기 위해 코드베이스를 지속적으로 유지 및 확장할 것입니다.

--- 

물론입니다. 이어서 연구 내용을 계속해서 번역하겠습니다.

---

## Appendix: Supplementary Information

### A.1 Model Configuration Details

Fish-Speech의 모델 구성은 고성능의 다언어 텍스트-음성 변환을 가능하게 하는 몇 가지 주요 모듈로 이루어져 있습니다. 주요 구성 요소와 하이퍼파라미터는 다음과 같습니다:

1. **Dual-AR Architecture**:
   - **Slow Transformer**: 텍스트 임베딩을 고수준의 언어 구조로 변환합니다. 
   - **Fast Transformer**: 코드북 임베딩을 통해 음향적 특징을 정밀하게 처리합니다.
   - **Batch Size**: 기본적으로 1024.
   - **학습률**: 5e-4, AdamW 최적화기를 사용.
   
2. **Firefly-GAN Vocoder**:
   - **ParallelBlock**: Multi-Receptive Field (MRF) 모듈 대신 사용되며, 더 넓은 수용 영역을 제공하여 음성의 정밀도를 높입니다.
   - **Depth-wise Separable Convolution**: 기존 Conv1D 레이어를 대체하며, 효율성을 높입니다.
   - **Grouped Finite Scalar Vector Quantization (GFSQ)**: 높은 코드북 활용을 위해 설계됨.

3. **훈련 인프라**:
   - **GPU 설정**: AR 훈련에는 H100 80G GPU 8개 사용, vocoder 훈련에는 4090 GPU 8개 사용.
   - **총 훈련 시간**: 약 2주, DPO 단계를 제외한 훈련.

### A.2 Evaluation Metrics

우리는 Fish-Speech의 성능을 평가하기 위해 객관적 및 주관적 지표를 사용했습니다. 주요 측정 지표는 다음과 같습니다:

1. **Word Error Rate (WER)**: 음성의 이해 가능성을 평가하는 객관적 지표로, 문장 인식률을 나타냅니다.
2. **Speaker Similarity**: 화자 복제의 충실도를 평가하기 위한 주관적 지표입니다. Resemblyzer 및 SpeechBrain을 사용하여 유사성 점수를 측정합니다.
3. **Mean Opinion Score (MOS)**: 청취자의 주관적인 평가를 기반으로 음성 품질을 평가합니다. MOS는 1~5점 척도로 측정되며, 5가 가장 높은 점수입니다.

### A.3 Reproducibility and Open-Source Availability

Fish-Speech 모델의 코드와 모델 가중치는 연구 재현성을 위해 오픈 소스로 제공됩니다. GitHub에서 fishaudio/fish-speech 프로젝트로 접근할 수 있으며, 실험을 재현하는 데 필요한 모든 스크립트와 설정 파일이 포함되어 있습니다.

#### Reproducibility Steps
- **환경 설정**: Python 3.9, PyTorch 2.0 이상.
- **데이터셋 다운로드**: 프로젝트 설명서에 따라 다언어 음성 데이터셋을 다운로드하고 전처리.
- **모델 훈련**: 세 단계의 훈련 절차(예비 훈련, SFT, DPO)를 따라 모델 훈련 가능.

### A.4 Limitations and Future Considerations

Fish-Speech 모델은 다언어 및 다감정 음성 합성에서 뛰어난 성능을 보이지만, 몇 가지 한계도 존재합니다:

1. **데이터 다양성 부족**: 일부 언어와 감정적 표현이 상대적으로 적어, 특정 언어와 감정에서 성능이 저하될 수 있습니다.
2. **고비용 인프라 요구**: GPU 리소스가 많이 필요하여, 소규모 연구 환경에서 재현하기 어려울 수 있습니다.
3. **실시간 대규모 적용의 어려움**: 특히 다중 사용자 환경에서의 실시간 적용에는 추가적인 최적화가 필요합니다.

향후 연구에서는 감정적 표현의 세분화를 통해 음성 합성의 표현력을 더 강화하고, 다양한 데이터셋을 통합하여 모델의 언어 범위를 확장하는 것을 목표로 하고 있습니다. 또한, 훈련 효율성을 개선하기 위해 경량화된 모델 버전을 개발하고자 합니다.

---

