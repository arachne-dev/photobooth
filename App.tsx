
import React, { useState, useRef, useEffect } from 'react';
import { ReceiptPrintout } from './components/ReceiptPrintout';
import QRModal from './components/QRModal';
import { analyzeFashion } from './services/geminiService';
import { printImage } from './services/printService';
import { uploadImage, saveAnalysis } from './services/supabaseClient';
import { AppStatus, StyleAnalysis } from './types';
import html2canvas from 'html2canvas';

const Logo: React.FC = () => (
  <svg width="43" height="40" viewBox="0 0 43 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M39.4065 13.3904L37.9656 12.4431C37.0233 11.8237 36.4275 10.7936 36.3598 9.66513L36.2322 7.5568C35.8867 1.85809 29.8619 -1.64464 24.7617 0.89009L23.2197 1.65622C22.7004 1.91422 22.1351 2.03436 21.5707 2.02451C21.0063 2.03042 20.4409 1.90536 19.9246 1.64342L18.3885 0.865471C13.3089 -1.70865 7.25666 1.74583 6.866 7.44257L6.72171 9.54991C6.64417 10.6774 6.04149 11.7026 5.09331 12.3151L3.64552 13.2506C1.22991 14.8114 0.0137634 17.3609 2.16518e-05 19.9153C-0.00586768 22.4707 1.18967 25.0291 3.59349 26.6096L5.03442 27.5569C5.97671 28.1763 6.57251 29.2064 6.64024 30.3349L6.76784 32.4432C7.11335 38.1419 13.1381 41.6446 18.2383 39.1099L19.7803 38.3438C20.2996 38.0858 20.8649 37.9656 21.4293 37.9755C21.9937 37.9696 22.5591 38.0946 23.0754 38.3566L24.6115 39.1345C29.6911 41.7086 35.7433 38.2542 36.134 32.5574L36.2783 30.4501C36.3558 29.3226 36.9585 28.2974 37.9067 27.6849L39.3545 26.7494C41.7701 25.1876 42.9862 22.6391 43 20.0837C43.0059 17.5283 41.8103 14.9699 39.4065 13.3894V13.3904ZM14.5643 21.3166L14.3081 21.482C14.1403 21.5904 14.0343 21.7716 14.0206 21.9705L13.995 22.3427C13.9263 23.3491 12.8564 23.9606 11.9583 23.5057L11.6864 23.3678C11.5951 23.3215 11.495 23.2999 11.3949 23.3009C11.2948 23.2989 11.1947 23.3206 11.1034 23.3658L10.8305 23.5017C9.92943 23.9498 8.86444 23.3304 8.80261 22.323L8.78003 21.9498C8.76825 21.7499 8.66224 21.5687 8.49636 21.4584L8.24214 21.291C7.81713 21.0113 7.60609 20.5593 7.60707 20.1073C7.61002 19.6553 7.824 19.2053 8.25195 18.9296L8.50814 18.7641C8.67599 18.6558 8.78199 18.4746 8.79574 18.2757L8.82126 17.9035C8.88997 16.8971 9.95986 16.2856 10.858 16.7405L11.1299 16.8784C11.2212 16.9246 11.3213 16.9463 11.4214 16.9453C11.5215 16.9473 11.6216 16.9256 11.7129 16.8803L11.9858 16.7444C12.8869 16.2964 13.9518 16.9158 14.0137 17.9232L14.0363 18.2964C14.048 18.4963 14.154 18.6775 14.3199 18.7878L14.5741 18.9552C14.9992 19.2349 15.2102 19.6869 15.2092 20.1388C15.2063 20.5908 14.9923 21.0409 14.5643 21.3166Z" fill="#7020D1"/>
  </svg>
);

const CameraFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative">
    <div className="camera-corner camera-corner-tl"></div>
    <div className="camera-corner camera-corner-tr"></div>
    <div className="camera-corner camera-corner-bl"></div>
    <div className="camera-corner camera-corner-br"></div>
    {children}
  </div>
);

const LoadingDiamonds: React.FC = () => (
  <div className="flex gap-2 items-center">
    {Array.from({ length: 24 }).map((_, i) => (
      <div
        key={i}
        className="diamond diamond-animate"
        style={{
          animationDelay: `${i * 0.08}s`,
          opacity: i > 18 ? 0.3 : 1
        }}
      />
    ))}
  </div>
);

const PrimaryButton: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean }> = ({ onClick, children, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-8 py-3 bg-[#A56CE8] text-white font-pixel text-[32px] rounded-full hover:bg-[#9259D6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);

const SecondaryButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="px-8 py-3 bg-[#F6F2FC] text-[#A56CE8] font-pixel text-[32px] rounded-full border border-[#A56CE8] hover:bg-[#EDE5F9] transition-colors"
  >
    {children}
  </button>
);

const TextButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="text-[#373957] font-dot text-[28px] hover:text-[#A56CE8] transition-colors"
  >
    {children}
  </button>
);

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [countdown, setCountdown] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1350 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("카메라 권한이 필요합니다.");
      }
    };
    startCamera();
  }, []);

  const doCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.save();
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.restore();
        return canvas.toDataURL('image/jpeg', 0.9);
      }
    }
    return null;
  };

  const startCountdown = () => {
    setStatus(AppStatus.COUNTDOWN);
    setCountdown(10);
    let count = 10;
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        handleCapture();
      }
    }, 1000);
  };

  const handleCapture = async () => {
    // Flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    const image = doCapture();
    if (!image) return;

    setCurrentImage(image);
    setStatus(AppStatus.ANALYZING);

    const result = await analyzeFashion(image);

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestampStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    setAnalysis({
      tags: result.tags,
      vogueDescription: result.description,
      styleDNA: result.styleDNA,
      timestamp: timestampStr,
      image: image
    });

    // Save to Supabase in the background
    try {
      console.log('Starting Supabase upload...');
      const imageUrl = await uploadImage(image);
      console.log('Image uploaded, URL:', imageUrl);
      const analysisId = await saveAnalysis(
        imageUrl,
        result.tags,
        result.description,
        result.styleDNA,
        timestampStr
      );
      console.log('Analysis saved with ID:', analysisId);
      setSavedAnalysisId(analysisId);
    } catch (err) {
      console.error('Failed to save to Supabase:', err);
      // Continue even if save fails - the main feature should still work
    }

    setStatus(AppStatus.RESULT);
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setCurrentImage(null);
    setAnalysis(null);
    setSavedAnalysisId(null);
    setShowQRModal(false);
  };

  const handlePrint = async () => {
    if (!receiptRef.current || isPrinting) return;

    setIsPrinting(true);
    setPrintStatus('CAPTURING...');

    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imageData = canvas.toDataURL('image/png');

      setPrintStatus('PRINTING...');
      const result = await printImage(imageData);

      if (result.success) {
        setPrintStatus('PRINT COMPLETE!');
      } else {
        setPrintStatus(`ERROR: ${result.message}`);
      }
    } catch (error) {
      setPrintStatus('PRINT FAILED');
      console.error('Print error:', error);
    } finally {
      setIsPrinting(false);
      setTimeout(() => setPrintStatus(null), 3000);
    }
  };

  const renderTitle = () => {
    switch (status) {
      case AppStatus.IDLE:
        return "MUNZI FIT CHECK";
      case AppStatus.COUNTDOWN:
        return "COUNTDOWN!";
      case AppStatus.ANALYZING:
        return "Analyzing Your Fit";
      case AppStatus.RESULT:
        return "Fit Summary";
      default:
        return "";
    }
  };

  const showCamera = status === AppStatus.IDLE || status === AppStatus.COUNTDOWN;

  return (
    <div className="h-screen w-screen bg-white flex flex-col">
      {/* Camera Flash Effect */}
      {showFlash && (
        <div className="fixed inset-0 bg-white z-[100] animate-flash pointer-events-none" />
      )}

      {/* Logo - Fixed position */}
      <div className="absolute top-12 left-16 z-50">
        <Logo />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        {showCamera && (
          <div className="flex flex-col items-center gap-8">
            <h1 className="font-pixel text-[52px] text-[#1D1E2C] tracking-wider">
              {renderTitle()}
            </h1>

            <CameraFrame>
              <div className="w-[400px] h-[500px] bg-gray-100 overflow-hidden relative">
                {error ? (
                  <div className="w-full h-full flex items-center justify-center text-red-500 font-pretendard text-center p-8">
                    {error}
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                )}
                {/* Countdown Overlay */}
                {status === AppStatus.COUNTDOWN && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-pixel text-[52px] text-[#1D1E2C] bg-white/90 px-6 py-2">
                      {countdown}
                    </span>
                  </div>
                )}
              </div>
            </CameraFrame>

            {status === AppStatus.IDLE ? (
              <>
                <PrimaryButton onClick={startCountdown} disabled={!!error}>
                  Analyze Fit
                </PrimaryButton>
                <p className="font-pretendard text-[20px] text-[#373957] text-center">
                  먼지 포토부스에서<br/>
                  아웃핏 분석을 받아보세요!
                </p>
              </>
            ) : (
              <p className="font-pretendard text-[20px] text-[#373957] text-center">
                {countdown}초 후 촬영됩니다. 카메라를 봐주세요.
              </p>
            )}
          </div>
        )}

        {status === AppStatus.ANALYZING && (
          <div className="flex flex-col items-center gap-16">
            <h1 className="font-pixel text-[52px] text-[#1D1E2C] tracking-wider">
              {renderTitle()}
            </h1>

            <LoadingDiamonds />

            <div className="text-center space-y-4">
              <p className="font-dot text-[28px] text-[#373957]">
                Processing fit details...
              </p>
              <p className="font-pretendard text-[20px] text-[#373957]">
                아웃핏을 분석 중이니<br/>
                잠시만 기다려주세요!
              </p>
            </div>
          </div>
        )}

        {status === AppStatus.RESULT && analysis && (
          <div className="flex gap-16 items-start max-w-[1200px] mx-auto px-8">
            {/* Left: Receipt */}
            <div className="flex-shrink-0">
              <h1 className="font-pixel text-[52px] text-[#1D1E2C] tracking-wider mb-8">
                {renderTitle()}
              </h1>
              <ReceiptPrintout ref={receiptRef} analysis={analysis} onReset={handleReset} />
            </div>

            {/* Right: Info & Actions */}
            <div className="flex flex-col gap-8 pt-20">
              <div className="space-y-2">
                <p className="font-pretendard text-[20px] text-[#373957]">
                  인쇄된 영수증에서 전체 스타일 분석을 확인하세요.
                </p>
                <p className="font-pretendard text-[20px] text-[#373957]">
                  Full analysis is revealed in print.<br/>
                  Print to see the full style report
                </p>
              </div>

              <PrimaryButton onClick={handlePrint} disabled={isPrinting}>
                {isPrinting ? 'Printing...' : 'Print Style Receipt'}
              </PrimaryButton>

              {printStatus && (
                <div className="px-6 py-2 bg-[#1D1E2C] text-white font-pixel text-[14px] tracking-wider animate-pulse">
                  {printStatus}
                </div>
              )}

              {/* Captured Image */}
              <div className="mt-4">
                <p className="font-pretendard text-[20px] text-[#373957] mb-4">
                  Captured Image
                </p>
                <div className="w-[200px] h-[200px] rounded-full overflow-hidden border-4 border-[#A56CE8]">
                  <img
                    src={currentImage || ''}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-8 mt-4">
                <SecondaryButton onClick={() => {
                  console.log('QR/Link clicked, savedAnalysisId:', savedAnalysisId);
                  setShowQRModal(true);
                }}>
                  QR/Link
                </SecondaryButton>
                <TextButton onClick={handleReset}>
                  Try Again
                </TextButton>
              </div>
            </div>
          </div>
        )}

        {/* QR Modal */}
        <QRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          analysisId={savedAnalysisId}
          analysis={analysis}
        />
      </main>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default App;
