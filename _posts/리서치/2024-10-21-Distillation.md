---
layout: default
title: "Knowledge Distillation: Pytorch 예제로 이해하는 Teacher-Student 학습"
date: 2024-10-21
categories: AI, Machine Learning
tags: [Pytorch, Knowledge Distillation, Machine Learning]
author: 한효정
---

# Knowledge Distillation: Pytorch 예제로 이해하는 Teacher-Student 학습

**Knowledge Distillation**은 대규모 모델이 가지고 있는 복잡한 지식을 작은 모델에 전달하는 과정입니다. 이 글에서는 distillation의 개념을 심플한 파이토치(Pytorch) 예제를 통해 설명하겠습니다.

## 1. Distillation 개요

**Distillation**이란, 큰 모델(Teacher)이 학습한 지식을 작은 모델(Student)에게 전달하는 과정을 말합니다. 이를 통해 Student 모델은 더 적은 자원으로 Teacher 모델과 유사한 성능을 발휘할 수 있습니다. 이 과정에서 중요한 개념은 **Soft Targets**입니다. Teacher 모델은 각 클래스에 대해 예측한 확률을 제공하며, 이 확률 분포를 Student 모델이 학습하게 됩니다.

> ### 주요 개념
> - **Teacher 모델**: 크고 복잡한 네트워크로, 높은 성능을 발휘하지만 계산 비용이 큼.
> - **Student 모델**: 작은 네트워크로, Teacher 모델로부터 지식을 전달받음.
> - **Soft Targets**: Teacher 모델이 예측한 확률 분포로, 정답 레이블보다 더 많은 정보를 포함함.
> - **Temperature**: Soft Targets를 부드럽게 만들어 Student 모델이 학습할 수 있도록 도와주는 파라미터.

## 2. Pytorch 예제 코드

다음은 Pytorch를 사용해 **Knowledge Distillation**을 구현하는 예제입니다. 이 예제에서는 **Teacher 모델**과 **Student 모델**을 정의하고, distillation을 통해 Student 모델이 학습하는 과정을 보여줍니다.

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torchvision import datasets, transforms

# 1. Teacher와 Student 모델 정의
class TeacherModel(nn.Module):
    def __init__(self):
        super(TeacherModel, self).__init__()
        self.conv1 = nn.Conv2d(3, 64, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.fc1 = nn.Linear(128*8*8, 256)
        self.fc2 = nn.Linear(256, 10)

    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.max_pool2d(F.relu(self.conv2(x)), 2)
        x = x.view(-1, 128*8*8)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x

class StudentModel(nn.Module):
    def __init__(self):
        super(StudentModel, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.fc1 = nn.Linear(64*8*8, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.max_pool2d(F.relu(self.conv2(x)), 2)
        x = x.view(-1, 64*8*8)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x
```

### 3. 데이터 준비 및 Soft Targets 생성

```python
# 2. 데이터셋 준비
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5)),
])

trainset = datasets.CIFAR10(root='./data', train=True, download=True, transform=transform)
trainloader = torch.utils.data.DataLoader(trainset, batch_size=64, shuffle=True)

# 3. Temperature를 사용한 Soft Targets 생성
def soft_targets(logits, T):
    return F.softmax(logits / T, dim=1)
```

### 4. Distillation 손실 함수 정의

```python
# 4. Knowledge Distillation Loss 정의
def distillation_loss(student_logits, teacher_logits, labels, T, alpha):
    # Cross-Entropy Loss (Student와 정답 라벨 간의 손실)
    ce_loss = F.cross_entropy(student_logits, labels)

    # Teacher의 소프트 타겟을 사용한 손실 (KL Divergence)
    teacher_probs = soft_targets(teacher_logits, T)
    student_probs = F.log_softmax(student_logits / T, dim=1)
    kl_loss = F.kl_div(student_probs, teacher_probs, reduction='batchmean') * (T * T)

    # 전체 손실
    return alpha * kl_loss + (1. - alpha) * ce_loss
```

### 5. 훈련 루프

```python
# 5. 모델, 옵티마이저 및 훈련 루프
teacher_model = TeacherModel()
student_model = StudentModel()

# Teacher 모델은 이미 사전 학습되었다고 가정
teacher_model.load_state_dict(torch.load('teacher_model.pth'))

optimizer = optim.Adam(student_model.parameters(), lr=0.001)

# Temperature와 alpha 설정
T = 5.0  # soft targets를 위한 temperature
alpha = 0.7  # KL divergence와 cross-entropy 손실 간의 가중치

# 훈련 루프
student_model.train()
for epoch in range(10):  # 10 epochs 훈련
    for images, labels in trainloader:
        # 1. Teacher 모델의 출력 가져오기 (soft targets 생성)
        teacher_logits = teacher_model(images).detach()

        # 2. Student 모델의 출력
        student_logits = student_model(images)

        # 3. Distillation Loss 계산
        loss = distillation_loss(student_logits, teacher_logits, labels, T, alpha)

        # 4. Backpropagation과 최적화
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    print(f'Epoch {epoch + 1}, Loss: {loss.item()}')

# 6. Student 모델 저장
torch.save(student_model.state_dict(), 'student_model.pth')
```

## 6. 결론

이 예제는 **Knowledge Distillation**을 통해 작은 모델(Student)이 큰 모델(Teacher)의 지식을 학습하는 과정을 보여줍니다. 이를 통해 Student 모델은 메모리와 계산 자원을 적게 사용하면서도 Teacher 모델과 비슷한 성능을 낼 수 있습니다. **Temperature**와 **Soft Targets**의 개념을 적용하여 지식 전수가 더 효율적으로 이루어지도록 했습니다. distillation은 특히 제한된 자원에서 성능을 최적화하는 데 매우 유용한 기법입니다.

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