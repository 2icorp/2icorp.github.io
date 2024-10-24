---
layout: default
title:  "이메일 답변 자동화 시스템 구축"
---

# Gmail과 Slack API, GPT-4 Mini API를 이용한 이메일 답변 자동화 시스템 구축

이 포스트에서는 Gmail에서 특정 조건의 이메일을 읽고, Slack에 자동으로 알림을 전송하며, GPT-4 Mini API를 사용하여 자동으로 답변을 생성하는 프로그램을 Python으로 구현하는 방법을 다룹니다. 이메일 관리와 자동화는 많은 기업이 필요한 작업 중 하나입니다. 특히, 고객 문의가 빈번한 서비스의 경우 자동화된 답변 시스템은 큰 도움이 될 수 있습니다.

## 시스템 아키텍처

이 프로그램은 세 가지 주요 API를 사용하여 동작합니다.

1. **Gmail API**: Gmail에서 이메일을 읽어와 특정 조건에 맞는 이메일을 필터링합니다.
2. **Slack API**: 필터링된 이메일의 내용을 슬랙 채널로 전송합니다.
3. **GPT-4 Mini API**: 이메일 내용을 기반으로 자동으로 답변을 생성합니다.

## 주요 흐름

1. **Gmail API로 이메일 읽기**: "2i에 대한 문의"라는 제목이 포함된 이메일을 필터링합니다.
2. **Slack API로 알림 전송**: 필터링된 이메일의 제목과 내용을 Slack으로 전송합니다.
3. **GPT-4 Mini API로 답변 생성**: GPT-4 Mini API를 이용해 자동 답변을 생성합니다.
4. **Slack에 자동 답변 전송**: 생성된 답변을 Slack에 알림으로 전송합니다.

## 사전 준비

### 1. Gmail API 설정
- Google Cloud 콘솔에서 프로젝트를 생성하고, Gmail API를 활성화한 후 OAuth 2.0 인증을 설정해야 합니다.
- `credentials.json` 파일을 다운로드하여 프로젝트에 추가합니다.

### 2. Slack API 설정
- Slack에서 새로운 앱을 생성하고 OAuth 토큰을 발급받습니다.
- 앱을 원하는 Slack 채널에 추가하고, 채널 ID를 확보합니다.

### 3. GPT-4 Mini API 설정
- OpenAI의 API 키를 발급받아 GPT-4 Mini API를 사용할 수 있도록 설정합니다.

## 코드 구현

### gmail_to_slack.py 

```python
import os
import openai
import base64
import slack_sdk
from slack_sdk.web import WebClient
from slack_sdk.errors import SlackApiError
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from datetime import datetime, timedelta

# Gmail API 범위 설정
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
LAST_PROCESSED_EMAIL_FILE = 'last_processed_email.txt'

# Slack API 설정
slack_token = 'YOUR_SLACK_BOT_TOKEN'
client = WebClient(token=slack_token)
slack_channel = 'YOUR_SLACK_CHANNEL_ID'  # 슬랙 채널 ID 또는 이름

# GPT-4 mini API 설정
openai.api_key = 'YOUR_GPT4_API_KEY'

# Gmail 인증 및 서비스 생성
def get_gmail_service():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    service = build('gmail', 'v1', credentials=creds)
    return service

# 최근 처리된 이메일 ID 기록 및 중복 방지
def get_last_processed_email_id():
    if os.path.exists(LAST_PROCESSED_EMAIL_FILE):
        with open(LAST_PROCESSED_EMAIL_FILE, 'r') as file:
            return file.read().strip()
    return None

def set_last_processed_email_id(email_id):
    with open(LAST_PROCESSED_EMAIL_FILE, 'w') as file:
        file.write(email_id)

# GPT-4 mini API를 이용한 답변 생성
def generate_gpt4_response(query):
    prompt = f"""
    문의 사항:

    {query}

    답변을 작성해주세요.
    """
    
    response = openai.Completion.create(
        engine="text-davinci-003",  # GPT-4 mini API 모델 선택
        prompt=prompt,
        max_tokens=500
    )
    
    return response['choices'][0]['text'].strip()

# "2i에 대한 문의" 제목을 포함한 최근 3시간 이메일 필터링 및 답변 생성
def check_inquiry_emails(service):
    # 현재 시각에서 3시간 전 시각 계산
    time_limit = (datetime.utcnow() - timedelta(hours=3)).isoformat() + 'Z'

    query = f'subject:"2i에 대한 문의" after:{time_limit}'
    results = service.users().messages().list(userId='me', q=query).execute()
    messages = results.get('messages', [])

    if not messages:
        print('해당 제목의 이메일이 없습니다.')
        return

    last_processed_email_id = get_last_processed_email_id()

    for msg in messages:
        if last_processed_email_id and msg['id'] == last_processed_email_id:
            print('중복된 이메일입니다. 작업을 종료합니다.')
            break
        
        message = service.users().messages().get(userId='me', id=msg['id']).execute()
        subject = ""
        snippet = message.get('snippet', '')

        for header in message['payload']['headers']:
            if header['name'] == 'Subject':
                subject = header['value']

        if "2i에 대한 문의" in subject:
            print(f"이메일 제목: {subject}")
            print(f"이메일 내용 요약: {snippet}")

            # GPT-4 mini API로 답변 생성
            gpt_response = generate_gpt4_response(snippet)
            print(f"GPT-4 답변: {gpt_response}")
            
            send_to_slack(subject, snippet, gpt_response)
            set_last_processed_email_id(msg['id'])  # 마지막 처리된 이메일 기록

# 슬랙에 메시지 전송
def send_to_slack(subject, snippet, response):
    try:
        message = (
            f"*새로운 이메일 문의*\n\n"
            f"*제목:* {subject}\n"
            f"*문의 내용:* {snippet}\n\n"
            f"*자동 생성된 답변:* \n{response}"
        )
        response = client.chat_postMessage(
            channel=slack_channel,
            text=message
        )
    except SlackApiError as e:
        print(f"Error sending message to Slack: {e.response['error']}")

if __name__ == '__main__':
    service = get_gmail_service()
    check_inquiry_emails(service)
```

### /.github/workflows/email_checker.yml

```yaml
name: Email Checker

on:
  schedule:
    - cron: '0 * * * *'  # 매 시간 정각에 실행

jobs:
  email_check:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v2

    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.x'

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib openai slack_sdk

    - name: Run Gmail to Slack Script
      run: |
        python gmail_to_slack.py
```

### 코드 설명

1. **Gmail API**: `get_gmail_service` 함수를 통해 Gmail API 인증을 처리하고, 이메일을 읽어옵니다. 필터링된 이메일의 제목과 내용을 가져옵니다.
2. **GPT-4 mini API**: `generate_gpt4_response` 함수는 GPT-4 mini API를 사용하여 이메일의 요약된 내용을 바탕으로 자동으로 답변을 생성합니다.
3. **Slack API**: `send_to_slack` 함수는 이메일의 제목, 내용, 그리고 생성된 답변을 Slack 채널로 전송합니다.
4. **GitHub Actions**: `/.github/workflows/email_checker.yml` 파일을 생성하여 한 시간마다 스크립트를 실행하도록 설정합니다.

### 사전 요구 사항

- Gmail API 사용을 위해 `credentials.json` 파일을 Google Cloud 콘솔에서 다운로드하여 프로젝트 루트 디렉토리에 추가해야 합니다.
- GPT-4 mini API와 Slack API 키를 설정합니다.
- 이 프로그램을 주기적으로 실행하거나 이벤트 기반으로 트리거할 수 있는 환경을 구축하면, 새로운 이메일이 도착할 때마다 자동으로 답변이 생성되고 Slack에 알림이 전송됩니다.

### 결론

이 프로그램을 통해 이메일을 자동으로 관리하고, 슬랙에 알림을 보내며, AI 기반 답변을 생성하는 효율적인 시스템을 구축할 수 있습니다. 이는 고객 문의가 빈번한 서비스에서 시간과 리소스를 절약하는 데 큰 도움이 될 것입니다.


## 최신 글
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span>{{ post.date | date: "%B %d, %Y" }}</span>
    </li>
  {% endfor %}
</ul>