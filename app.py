import os
import json
import boto3
from flask import Flask, jsonify, render_template, send_from_directory

app = Flask(__name__, static_folder='static', static_url_path='/static')

# S3 버킷 정보
BUCKET_NAME = os.getenv('S3_BUCKET_NAME')
FILE_NAME = 'menu_data.json'

# AWS 자격 증명 설정 (환경 변수에서 가져오기)
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

# S3 클라이언트 생성
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

@app.route('/menu')
def menu():
    try:
        # S3에서 JSON 파일 가져오기
        obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=FILE_NAME)
        data = json.loads(obj['Body'].read().decode('utf-8'))
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 404
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True)