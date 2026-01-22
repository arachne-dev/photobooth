#!/usr/bin/env python3
"""Xprinter XP-80T - 한 번에 전송"""

import usb.core
import usb.util
import sys

VENDOR_ID = 0x1908
PRODUCT_ID = 0x0226

print("Xprinter XP-80T 테스트")
print("=" * 40)

dev = usb.core.find(idVendor=VENDOR_ID, idProduct=PRODUCT_ID)
if dev is None:
    print("❌ 장치를 찾을 수 없음")
    sys.exit(1)

print("✅ 장치 발견!")

try:
    if dev.is_kernel_driver_active(0):
        dev.detach_kernel_driver(0)
        print("✅ 커널 드라이버 분리")
except:
    pass

dev.set_configuration()

# 모든 데이터를 한 번에 전송
data = b''
data += b'\x1b\x40'  # ESC @ - Initialize
data += b'\x1b\x61\x01'  # ESC a 1 - Center align
data += b'\n'
data += b'================================\n'
data += b'    MUNZI STYLE LAB\n'
data += b'================================\n'
data += b'    XP-80T Print Test\n'
data += b'================================\n'
data += b'\n\n\n\n\n'  # 여러 줄 피드

print(f"\n전송 중... ({len(data)} 바이트)")
try:
    written = dev.write(0x01, data, timeout=5000)
    print(f"✅ {written} 바이트 전송 완료!")
    print("\n*** Hex dump 모드면 FEED 버튼 누르세요! ***")
    print("*** 정상 모드면 바로 출력되어야 해요! ***")
except Exception as e:
    print(f"❌ 실패: {e}")
