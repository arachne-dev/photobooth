#!/usr/bin/env python3
"""CUPS를 통한 이미지 출력 테스트"""

from PIL import Image, ImageDraw, ImageFont
import subprocess
import tempfile
import os

# 테스트 이미지 생성 (80mm = 약 576px @ 203dpi)
WIDTH = 576
HEIGHT = 200

img = Image.new('L', (WIDTH, HEIGHT), 'white')
draw = ImageDraw.Draw(img)

# 텍스트 그리기
draw.text((WIDTH//2, 30), "MUNZI STYLE LAB", fill='black', anchor='mt')
draw.text((WIDTH//2, 60), "=" * 40, fill='black', anchor='mt')
draw.text((WIDTH//2, 90), "XP-80T Test Print", fill='black', anchor='mt')
draw.text((WIDTH//2, 120), "CUPS Mode - Success!", fill='black', anchor='mt')
draw.text((WIDTH//2, 150), "=" * 40, fill='black', anchor='mt')

# 임시 파일로 저장
with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
    img.save(f.name)
    temp_path = f.name

print(f"이미지 생성: {temp_path}")
print(f"크기: {WIDTH}x{HEIGHT}")

# lpr로 출력
result = subprocess.run([
    'lpr',
    '-P', 'Printer_POS_80',
    '-o', 'fit-to-page',
    temp_path
], capture_output=True, text=True)

if result.returncode == 0:
    print("✅ 출력 명령 전송 완료!")
else:
    print(f"❌ 에러: {result.stderr}")

# 임시 파일 삭제
os.unlink(temp_path)
