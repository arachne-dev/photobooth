
import React, { useRef, useEffect, useState } from 'react';

interface CameraViewProps {
  onCapture: (image: string) => void;
  status: string;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, status }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1080 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("CAMERA_LINK_FAILURE: 권한이 필요합니다.");
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

        // Mirror capture
        context.save();
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.restore();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
      }
    }
  };

  const startCountdown = () => {
    setCountdown(5);
    let count = 5;
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);
        doCapture();
      }
    }, 1000);
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square bg-white rounded-[2rem] overflow-hidden border-[6px] border-white shadow-[0_25px_60px_-10px_rgba(168,85,247,0.2)] flex flex-col group transition-all duration-500">
      {error ? (
        <div className="flex items-center justify-center h-full text-red-400 font-mono text-xs p-10 text-center uppercase tracking-widest">
          {error}
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {/* HUD Layer - Light & Purple */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Viewfinder corners */}
            <div className="absolute top-8 left-8 w-6 h-6 border-l-2 border-t-2 border-white/60"></div>
            <div className="absolute top-8 right-8 w-6 h-6 border-r-2 border-t-2 border-white/60"></div>
            <div className="absolute bottom-28 left-8 w-6 h-6 border-l-2 border-b-2 border-white/60"></div>
            <div className="absolute bottom-28 right-8 w-6 h-6 border-r-2 border-b-2 border-white/60"></div>

            {/* Top HUD */}
            <div className="absolute top-6 left-8 flex items-center gap-2.5">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
               <span className="text-white text-[9px] font-black tracking-[0.2em] uppercase bg-black/10 px-1.5 py-0.5 rounded-sm">LIVE</span>
            </div>

            <div className="absolute top-6 right-8 text-white text-[8px] font-mono tracking-tighter text-right leading-relaxed bg-black/10 px-2 py-1 rounded-sm">
              REC // 00:00:14<br/>
              ISO 100 // HDR_ON
            </div>

            <div className="scanner-line opacity-20"></div>
          </div>

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
              <span className="text-[120px] font-black text-white drop-shadow-[0_0_30px_rgba(168,85,247,0.8)] animate-pulse">
                {countdown}
              </span>
            </div>
          )}

          {/* Shutter Section */}
          <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/20 to-transparent flex items-center justify-center">
            <div className="relative group/shutter">
              <div className="absolute inset-0 bg-purple-500 rounded-full blur-lg opacity-0 group-hover/shutter:opacity-40 transition-opacity"></div>
              <button
                onClick={startCountdown}
                disabled={status === 'ANALYZING' || countdown !== null}
                className={`
                  relative w-16 h-16 rounded-full border-[4px] border-white flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-10
                  ${status === 'ANALYZING' || countdown !== null ? 'bg-gray-200' : 'bg-transparent'}
                `}
              >
                <div className={`w-12 h-12 rounded-full transition-colors ${status === 'ANALYZING' || countdown !== null ? 'bg-gray-300' : 'bg-purple-500 group-hover/shutter:bg-purple-400'}`}></div>
              </button>
            </div>
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
