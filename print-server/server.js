const express = require('express');
const cors = require('cors');
const usb = require('usb');
const sharp = require('sharp');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Xprinter USB IDs
const VENDOR_ID = 0x1908;
const PRODUCT_ID = 0x0226;

// ESC/POS 명령어
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

// 초기화 명령
const INIT = Buffer.from([ESC, 0x40]);
// 중앙 정렬
const ALIGN_CENTER = Buffer.from([ESC, 0x61, 0x01]);
// 컷
const CUT = Buffer.from([GS, 0x56, 0x00]);
// 라인 피드
const FEED = Buffer.from([ESC, 0x64, 0x03]);

// 이미지를 ESC/POS 래스터 비트맵으로 변환
async function imageToEscPos(imageBuffer, targetWidth = 384) {
  // 이미지 리사이즈 및 그레이스케일 변환
  const { data, info } = await sharp(imageBuffer)
    .resize(targetWidth, null, { fit: 'inside' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  // 바이트 단위 폭 (8픽셀 = 1바이트)
  const bytesPerLine = Math.ceil(width / 8);

  // GS v 0 명령 (래스터 비트 이미지)
  const header = Buffer.from([
    GS, 0x76, 0x30, 0x00,
    bytesPerLine & 0xFF,
    (bytesPerLine >> 8) & 0xFF,
    height & 0xFF,
    (height >> 8) & 0xFF
  ]);

  // 픽셀 데이터를 비트맵으로 변환 (디더링 적용)
  const bitmapData = Buffer.alloc(bytesPerLine * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;
      const gray = data[pixelIndex];

      // 임계값 기반 이진화 (128 기준)
      if (gray < 128) {
        const byteIndex = y * bytesPerLine + Math.floor(x / 8);
        const bitIndex = 7 - (x % 8);
        bitmapData[byteIndex] |= (1 << bitIndex);
      }
    }
  }

  return Buffer.concat([header, bitmapData]);
}

// 프린터 찾기
function findPrinter() {
  const devices = usb.getDeviceList();
  return devices.find(d =>
    d.deviceDescriptor.idVendor === VENDOR_ID &&
    d.deviceDescriptor.idProduct === PRODUCT_ID
  );
}

// 프린터로 데이터 전송
function sendToPrinter(device, data) {
  return new Promise((resolve, reject) => {
    try {
      device.open();

      const iface = device.interface(0);

      // macOS에서 커널 드라이버 분리
      if (iface.isKernelDriverActive()) {
        iface.detachKernelDriver();
      }

      iface.claim();

      // OUT 엔드포인트 찾기
      const outEndpoint = iface.endpoints.find(ep => ep.direction === 'out');

      if (!outEndpoint) {
        throw new Error('OUT 엔드포인트를 찾을 수 없음');
      }

      outEndpoint.transfer(data, (err) => {
        try {
          iface.release(() => {
            device.close();
          });
        } catch (e) {}

        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });

    } catch (err) {
      try { device.close(); } catch (e) {}
      reject(err);
    }
  });
}

// 프린터 상태 확인 API
app.get('/api/printer/status', (req, res) => {
  try {
    const device = findPrinter();

    if (device) {
      res.json({
        connected: true,
        vendor: `0x${VENDOR_ID.toString(16)}`,
        product: `0x${PRODUCT_ID.toString(16)}`,
        message: 'Xprinter 연결됨'
      });
    } else {
      const allDevices = usb.getDeviceList();
      res.json({
        connected: false,
        availableDevices: allDevices.slice(0, 10).map(d => ({
          vendor: `0x${d.deviceDescriptor.idVendor.toString(16)}`,
          product: `0x${d.deviceDescriptor.idProduct.toString(16)}`
        })),
        message: 'Xprinter를 찾을 수 없음'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 테스트 프린트 API
app.post('/api/print/test', async (req, res) => {
  try {
    const device = findPrinter();

    if (!device) {
      return res.status(404).json({ error: 'Xprinter를 찾을 수 없음' });
    }

    const text = Buffer.from(`
================================
      MUNZI STYLE LAB
================================
    Xprinter Test Print

    ${new Date().toLocaleString('ko-KR')}
================================

`, 'utf-8');

    const data = Buffer.concat([
      INIT,
      ALIGN_CENTER,
      text,
      FEED,
      CUT
    ]);

    await sendToPrinter(device, data);
    res.json({ success: true, message: '테스트 프린트 완료!' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 이미지 프린트 API
app.post('/api/print', async (req, res) => {
  try {
    const { imageData, width = 384 } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'imageData 필요' });
    }

    const device = findPrinter();

    if (!device) {
      return res.status(404).json({ error: 'Xprinter를 찾을 수 없음' });
    }

    // Base64 디코딩
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 이미지 → ESC/POS 변환
    const imageEscPos = await imageToEscPos(imageBuffer, width);

    const data = Buffer.concat([
      INIT,
      ALIGN_CENTER,
      imageEscPos,
      FEED,
      CUT
    ]);

    await sendToPrinter(device, data);
    res.json({ success: true, message: '프린트 완료!' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🖨️  Xprinter 서버: http://localhost:${PORT}`);
  console.log(`   GET  /api/printer/status - 프린터 상태`);
  console.log(`   POST /api/print/test     - 테스트 출력`);
  console.log(`   POST /api/print          - 이미지 출력`);

  const printer = findPrinter();
  if (printer) {
    console.log(`\n✅ Xprinter 발견됨!`);
  } else {
    console.log(`\n⚠️  Xprinter 연결을 확인하세요`);
  }
});
