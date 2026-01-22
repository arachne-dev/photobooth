#!/usr/bin/env python3
"""USB 엔드포인트 찾기"""

import usb.core
import usb.util

VENDOR_ID = 0x1908
PRODUCT_ID = 0x0226

dev = usb.core.find(idVendor=VENDOR_ID, idProduct=PRODUCT_ID)

if dev is None:
    print("❌ 장치를 찾을 수 없음")
    exit(1)

print(f"✅ 장치 발견: {hex(VENDOR_ID)}:{hex(PRODUCT_ID)}")
print()

for cfg in dev:
    print(f"Configuration {cfg.bConfigurationValue}")
    for intf in cfg:
        print(f"  Interface {intf.bInterfaceNumber}, Alt {intf.bAlternateSetting}")
        for ep in intf:
            ep_type = usb.util.endpoint_type(ep.bmAttributes)
            ep_dir = "IN" if usb.util.endpoint_direction(ep.bEndpointAddress) == usb.util.ENDPOINT_IN else "OUT"
            print(f"    Endpoint {hex(ep.bEndpointAddress)} - {ep_dir} - Type: {ep_type}")
