from flask import Flask, jsonify, render_template, send_from_directory
import json

app = Flask(__name__)

# JSON 파일 경로 설정
JSON_FILE_PATH = 'menu_data.json'

@app.route('/menu')
def menu():
    # JSON 파일 읽기
    try:
        with open(JSON_FILE_PATH, 'r', encoding='utf-8') as json_file:
            data = json.load(json_file)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({"error": "JSON file not found"}), 404

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True)