#!/usr/bin/env python3
"""Xprinter 프린트 서버 (CUPS 방식)"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from PIL import Image, ImageEnhance, ImageFilter
import subprocess
import tempfile
import json
import base64
import io
import os

PRINTER_NAME = "Printer_POS_80"
PRINTER_WIDTH = 576  # 80mm @ 203dpi
PORT = 3002


def print_image(image_data, width=PRINTER_WIDTH):
    """이미지를 프린터로 출력 (열전사 프린터용 최적화)"""
    # Base64 디코딩
    if ',' in image_data:
        image_data = image_data.split(',')[1]
    image_bytes = base64.b64decode(image_data)

    # 이미지 열기
    img = Image.open(io.BytesIO(image_bytes))

    # 프린터 폭에 맞게 리사이즈 (세로 비율 유지)
    ratio = width / img.width
    new_height = int(img.height * ratio)
    img = img.resize((width, new_height), Image.Resampling.LANCZOS)

    # 그레이스케일 변환
    img = img.convert('L')

    # 언샤프 마스크 (더 선명하게)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=150, threshold=2))

    # 대비 강화 (열전사 프린터용 - 더 강하게)
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(3.5)  # 대비 3.5배 증가

    # 밝기 조정 (약간 어둡게 해서 진하게 출력)
    brightness = ImageEnhance.Brightness(img)
    img = brightness.enhance(0.85)

    # Floyd-Steinberg 디더링으로 1비트 변환 (열전사 프린터 최적화)
    img = img.convert('1')

    # 상단/하단 여백 추가
    TOP_MARGIN = 30
    BOTTOM_MARGIN = 30
    new_img = Image.new('L', (img.width, img.height + TOP_MARGIN + BOTTOM_MARGIN), 255)
    new_img.paste(img, (0, TOP_MARGIN))
    img = new_img

    # 임시 파일로 저장
    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
        img.save(f.name)
        temp_path = f.name

    # 이미지 높이를 mm로 변환 (203 DPI 기준)
    height_mm = int((img.height / 203) * 25.4) + 10  # 약간의 여유

    # lpr로 출력 (이미지 높이에 맞춘 커스텀 사이즈)
    result = subprocess.run([
        'lpr',
        '-P', PRINTER_NAME,
        '-o', f'PageSize=Custom.72x{height_mm}mm',
        temp_path
    ], capture_output=True, text=True)

    # 임시 파일 삭제
    os.unlink(temp_path)

    if result.returncode != 0:
        raise Exception(f"출력 실패: {result.stderr}")

    return True


class PrintHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {args[0]}")

    def _send_response(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/printer/status':
            # 프린터 상태 확인
            result = subprocess.run(
                ['lpstat', '-p', PRINTER_NAME],
                capture_output=True, text=True
            )
            if '대기 중' in result.stdout or 'idle' in result.stdout.lower():
                self._send_response(200, {
                    'connected': True,
                    'printer': PRINTER_NAME,
                    'message': '프린터 준비됨'
                })
            else:
                self._send_response(200, {
                    'connected': False,
                    'message': result.stdout or '프린터 상태 확인 필요'
                })
        else:
            self._send_response(404, {'error': 'Not found'})

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        if self.path == '/api/print':
            try:
                data = json.loads(body)
                image_data = data.get('imageData', '')
                width = data.get('width', PRINTER_WIDTH)

                if not image_data:
                    self._send_response(400, {'error': 'imageData 필요'})
                    return

                print_image(image_data, width)
                self._send_response(200, {'success': True, 'message': '프린트 완료!'})

            except Exception as e:
                print(f"에러: {e}")
                self._send_response(500, {'error': str(e)})
        else:
            self._send_response(404, {'error': 'Not found'})


if __name__ == '__main__':
    print(f"🖨️  Xprinter 서버 (CUPS): http://localhost:{PORT}")
    print(f"   프린터: {PRINTER_NAME}")
    print(f"   GET  /api/printer/status - 프린터 상태")
    print(f"   POST /api/print          - 이미지 출력")
    print()

    # 프린터 상태 확인
    result = subprocess.run(['lpstat', '-p', PRINTER_NAME], capture_output=True, text=True)
    if '대기 중' in result.stdout:
        print("✅ 프린터 준비됨!")
    else:
        print(f"⚠️  프린터 상태: {result.stdout}")

    print()
    print("서버 시작...")
    server = HTTPServer(('0.0.0.0', PORT), PrintHandler)
    server.serve_forever()
