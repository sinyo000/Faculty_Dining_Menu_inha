#!/usr/bin/env python3

#%%
import requests
from bs4 import BeautifulSoup
import json
import base64
import urllib.parse
from datetime import datetime, timedelta
import boto3
import os
from dotenv import load_dotenv
import pytz

# .env 파일에서 환경 변수를 로드합니다.
load_dotenv()

# 환경 변수에서 시간대 가져오기
timezone_str = os.getenv('TIMEZONE', 'UTC')
tz = pytz.timezone(timezone_str)
today_date_str = datetime.now(tz).strftime("%Y.%m.%d")

print(f"Using timezone: {timezone_str}")
print(f"Calculated date: {today_date_str}")

# URL 생성 함수
def create_this_week_url(base_url, start_date_str):
    # 날짜 형식 지정
    date_format = "%Y.%m.%d"

    # 시작 날짜 파싱
    start_date = datetime.strptime(start_date_str, date_format)

    # 오늘 날짜 기준 저번 주 월요일 계산
    last_week_sunday = start_date - timedelta(days=start_date.weekday() + 2)
    last_week_sunday_str = last_week_sunday.strftime(date_format)

    # 인코딩된 문자열 생성
    encoded_str = f"fnct1|@@|%2Fdiet%2Fkr%2F1%2Fview.do%3Fmonday%3D{last_week_sunday_str}%26week%3Dnext%26"

    # Base64 인코딩
    encoded_bytes = base64.b64encode(encoded_str.encode('utf-8'))
    encoded_base64_str = encoded_bytes.decode('utf-8').rstrip('=') + '='

    # 최종 URL 생성
    this_week_url = base_url + urllib.parse.quote(encoded_base64_str)
    return this_week_url


# 기본 URL 설정
base_url = "https://www.inha.ac.kr/kr/1073/subview.do?&enc="

# 오늘 날짜 설정
today_date_str = datetime.now().strftime("%Y.%m.%d")

# 이번 주 URL 생성
this_week_url = create_this_week_url(base_url, today_date_str)
print(f"This week URL: {this_week_url}")

# 1. 웹페이지 접근
response = requests.get(this_week_url)

# 응답 코드 확인
if response.status_code != 200:
    print(f"Failed to fetch page, status code: {response.status_code}")
else:
    # 2. HTML 파싱
    soup = BeautifulSoup(response.content, 'html.parser')

# 날짜와 식단 정보를 담을 리스트
week_data = []

# 식단 날짜 가져오기
week_range_tag = soup.select_one('.moveWeekBox strong')
if week_range_tag:
    week_range = week_range_tag.text.strip()
else:
    print("Failed to find the week range")
    week_range = "Unknown"

# 요일별 식단 정보 추출
for day_section in soup.select('.foodInfoWrap'):
    day_title_tag = day_section.find_previous_sibling('h2')
    if day_title_tag:
        day_title = day_title_tag.text.strip()

        # 각 식단별 정보 추출
        for row in day_section.select('tbody tr'):
            meal = {}
            meal['날짜'] = day_title
            meal['구분'] = row.find('th').text.strip()
            menu_cell = row.find('td')
            if menu_cell:
                # '<br>' 태그로 나눈 텍스트 리스트를 생성
                menu_items = menu_cell.decode_contents().split('<br>')
                # 각 아이템을 스트립하여 정리
                menu_items = [BeautifulSoup(item, 'html.parser').text.strip() for item in menu_items if item.strip()]
                # 공백, 탭, 개행 문자 제거
                menu_items = [item.replace('\t', '').replace('\r', ',').replace('\n', '').replace('*', '&').replace('D',
                                                                                                                    ' 드레싱').replace(
                    'S', ' 소스') for item in menu_items]
                menu_items = [item.replace(',&', '&') for item in menu_items]
                meal['메뉴'] = ', '.join(menu_items)
                # 마지막 수정: ',&' -> '&'
            else:
                meal['메뉴'] = ""
            week_data.append(meal)


# AWS S3에 업로드
def upload_to_s3(file_name, data):
    s3 = boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    bucket_name = os.getenv('S3_BUCKET_NAME')
    if not bucket_name:
        raise ValueError("S3_BUCKET_NAME environment variable is not set")

    s3.put_object(Bucket=bucket_name, Key=file_name, Body=json.dumps(data, ensure_ascii=False, indent=4))
    print(f"Data uploaded to S3 bucket {bucket_name} with key {file_name}")


upload_to_s3('menu_data.json', week_data)
print("JSON data:", json.dumps(week_data, ensure_ascii=False, indent=4))