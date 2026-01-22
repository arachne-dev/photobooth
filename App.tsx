
import React, { useState, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { ReceiptPrintout } from './components/ReceiptPrintout';
import { analyzeFashion } from './services/geminiService';
import { AppStatus, StyleAnalysis } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [loadingText, setLoadingText] = useState("SCANNING...");

  const loadingPhrases = [
    "ARACHNE_DNA_SEQUENCING...",
    "MAPPING_TEXTURES...",
    "CALIBRATING_AURA...",
    "EXTRACTING_STYLE_NODES...",
    "FINALIZING_LOG_v4.2..."
  ];

  useEffect(() => {
    let interval: any;
    if (status === AppStatus.ANALYZING) {
      let idx = 0;
      interval = setInterval(() => {
        setLoadingText(loadingPhrases[idx % loadingPhrases.length]);
        idx++;
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleCapture = async (image: string) => {
    setCurrentImage(image);
    setStatus(AppStatus.ANALYZING);
    
    const result = await analyzeFashion(image);
    
    // Captured full timestamp: YYYY.MM.DD HH:mm:ss
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
    setStatus(AppStatus.RESULT);
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setCurrentImage(null);
    setAnalysis(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-transparent overflow-hidden text-gray-900 selection:bg-purple-200 selection:text-purple-900 relative">
      
      {/* Light Glass Header */}
      <header className="h-20 flex items-center justify-between px-12 z-50 border-b border-purple-200 bg-white/60 backdrop-blur-xl shadow-sm">
        <div className="flex items-center">
          <img src="/logo.png" alt="Munzi" className="h-10" />
        </div>
        
        <nav className="flex items-center gap-12 text-[10px] font-black tracking-widest uppercase text-gray-400">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]"></div>
            <span className="text-purple-600">NODE_ACTIVE: 77-24</span>
          </div>
        </nav>
      </header>

      {/* Main UI */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left: Camera Booth Section */}
        <section className="w-1/2 flex flex-col items-center justify-center p-12 border-r border-purple-100 bg-white/30">
          <div className="relative w-full max-w-sm">
             <CameraView onCapture={handleCapture} status={status} />
             
             {/* HUD Markers - Lavender Purple */}
             <div className="absolute -top-8 -left-8 border-l-2 border-t-2 border-purple-300 w-16 h-16"></div>
             <div className="absolute -bottom-8 -right-8 border-r-2 border-b-2 border-purple-300 w-16 h-16"></div>
             
             <div className="absolute top-1/2 -left-12 -translate-y-1/2 w-1 h-24 bg-purple-200"></div>
             <div className="absolute top-1/2 -right-12 -translate-y-1/2 w-1 h-24 bg-purple-200"></div>

             <div className="mt-12 text-center">
                <p className="text-[11px] font-black tracking-[0.6em] uppercase text-purple-400">
                  SCAN_READY_FOR_OOTD
                </p>
             </div>
          </div>
        </section>

        {/* Right: Output / Printer Section */}
        <section className="w-1/2 h-full flex flex-col items-center bg-purple-50/10 backdrop-blur-sm relative">
          
          {/* Printer Slot Styling */}
          <div className="mt-12 mb-4 w-[360px] flex flex-col items-center">
            <div className="w-full h-[1px] bg-purple-200"></div>
            <div className="w-full h-4 bg-white rounded-b-lg border-x border-b border-purple-100 shadow-sm"></div>
            <div className="w-[98%] h-2.5 bg-gray-900 rounded-b-sm shadow-xl mt-[-3px] z-20 border-b border-purple-500/10"></div>
          </div>
          
          {/* Scrollable Receipt Column */}
          <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center custom-scrollbar pb-32 px-4">
            
            {status === AppStatus.IDLE && (
              <div className="mt-32 flex flex-col items-center gap-8 opacity-20">
                <div className="w-24 h-24 border-2 border-purple-400 flex items-center justify-center rotate-45 animate-pulse">
                   <div className="w-12 h-12 bg-purple-300 -rotate-45"></div>
                </div>
                <p className="text-[11px] font-black tracking-[1em] uppercase text-purple-600">STANDBY_MODE</p>
              </div>
            )}

            {status === AppStatus.ANALYZING && (
              <div className="mt-12 flex flex-col items-center w-full max-w-xs">
                {/* Minimalist Loading Card */}
                <div className="p-[2px] bg-purple-200 shadow-[0_10px_40px_rgba(168,85,247,0.15)] rounded-sm">
                  <div className="w-64 h-80 bg-white overflow-hidden relative rounded-sm">
                    <img src={currentImage!} className="w-full h-full object-cover grayscale opacity-30" />
                    <div className="scanner-line"></div>
                  </div>
                </div>

                <div className="text-center mt-10 space-y-4">
                  <h3 className="text-xs font-black tracking-[0.6em] uppercase text-purple-500 animate-pulse">
                    {loadingText}
                  </h3>
                  <div className="flex justify-center gap-2">
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            {status === AppStatus.RESULT && analysis && (
              <div className="flex flex-col items-center w-full">
                 <ReceiptPrintout analysis={analysis} onReset={handleReset} />
              </div>
            )}
          </div>

          {/* Bottom Fade Overlay - Adjusted for Light Mode */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#faf9ff] to-transparent pointer-events-none z-10"></div>
        </section>
      </main>

      {/* Minimal Light Footer */}
      <footer className="h-12 flex items-center justify-between px-12 border-t border-purple-100 bg-white/80 backdrop-blur-md">
        <div className="flex gap-10 text-[9px] font-black text-gray-400 uppercase tracking-widest">
          <span>&copy; MUNZI_STYLE_LAB</span>
          <span>v1.0</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-purple-50 text-purple-500 border border-purple-200 text-[9px] font-black tracking-tighter">
            STYLE ENGINE ACTIVE
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
