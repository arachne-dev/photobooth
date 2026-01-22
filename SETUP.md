# 포토부스 설치 가이드

## 요구사항
- Node.js 18+
- Python 3.9+
- 80mm 열전사 프린터 (Xprinter 등)

---

## 1. 프로젝트 클론

```bash
git clone https://github.com/arachne-dev/photobooth.git
cd photobooth
```

---

## 2. 웹 앱 설정

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 열어서 Gemini API 키 입력
```

**`.env.local` 내용:**
```
VITE_GEMINI_API_KEY=실제_API_키_입력
```

---

## 3. 프린터 설정 (CUPS)

### 3.1 프린터 연결 확인
```bash
# USB 프린터 확인
system_profiler SPUSBDataType | grep -A5 -i printer
```

### 3.2 CUPS에 프린터 추가
1. 시스템 설정 → 프린터 및 스캐너
2. 프린터 추가 (+ 버튼)
3. 프린터 이름을 `Printer_POS_80`으로 설정

또는 터미널에서:
```bash
# CUPS 웹 인터페이스 접속
open http://localhost:631
```

### 3.3 프린터 상태 확인
```bash
lpstat -p Printer_POS_80
# "대기 중" 또는 "idle" 이면 정상
```

### 3.4 프린터 이름이 다른 경우
`print-server/print_server.py` 파일에서 수정:
```python
PRINTER_NAME = "Printer_POS_80"  # ← 실제 프린터 이름으로 변경
```

---

## 4. Python 의존성 설치

```bash
pip3 install Pillow
```

---

## 5. 실행

### 터미널 1: 웹 서버
```bash
npm run dev
```
→ http://localhost:3000

### 터미널 2: 프린트 서버
```bash
cd print-server
python3 print_server.py
```
→ http://localhost:3002

---

## 6. 사용법

1. 웹 브라우저에서 http://localhost:3000 접속
2. 카메라 권한 허용
3. 촬영 버튼 클릭 → 5초 카운트다운 후 촬영
4. AI 분석 완료 후 영수증 자동 출력

---

## 트러블슈팅

### 프린트가 흐리게 나올 때
`print-server/print_server.py`에서 조정:
```python
img = enhancer.enhance(3.5)  # 대비 (높이면 더 진함)
img = brightness.enhance(0.85)  # 밝기 (낮추면 더 진함)
```

### 프린터 연결 안 됨
```bash
# 프린터 목록 확인
lpstat -p -d

# CUPS 재시작
sudo launchctl stop org.cups.cupsd
sudo launchctl start org.cups.cupsd
```

### 카메라가 안 보일 때
- 브라우저 카메라 권한 확인
- HTTPS가 아닌 localhost에서만 카메라 작동

---

## 파일 구조

```
photobooth/
├── App.tsx              # 메인 앱
├── components/
│   ├── CameraView.tsx   # 카메라 + 카운트다운
│   └── ReceiptPrintout.tsx  # 영수증 UI
├── services/
│   └── geminiService.ts # AI 분석
├── print-server/
│   └── print_server.py  # 프린트 서버
├── .env.local           # API 키 (git 제외)
└── .env.example         # API 키 템플릿
```
