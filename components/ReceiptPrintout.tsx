
import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { StyleAnalysis } from '../types';
import { printImage } from '../services/printService';

interface ReceiptPrintoutProps {
  analysis: StyleAnalysis;
  onReset: () => void;
}

export const ReceiptPrintout: React.FC<ReceiptPrintoutProps> = ({ analysis, onReset }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string>('');

  // Split timestamp for clean receipt layout
  const [datePart, timePart] = analysis.timestamp.split(' ');

  // 로고를 base64로 미리 로드
  useEffect(() => {
    fetch('/logo.png')
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result as string);
        reader.readAsDataURL(blob);
      });
  }, []);

  const handlePrint = async () => {
    if (!receiptRef.current || isPrinting) return;

    setIsPrinting(true);
    setPrintStatus('CAPTURING...');

    try {
      // Capture receipt as image
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

  return (
    <div className="flex flex-col items-center pt-2">
      <div
        ref={receiptRef}
        className="w-[320px] bg-white text-black p-8 shadow-[0_15px_45px_rgba(0,0,0,0.15)] border border-gray-200 curved-edge printing-animation origin-top"
      >
        <div className="receipt-font space-y-6 text-center">

          {/* Header */}
          <div className="border-b-4 border-black pb-4">
            <div className="flex justify-center mb-2">
              {logoBase64 ? (
                <img src={logoBase64} alt="Munzi" className="h-12" style={{ filter: 'grayscale(100%) contrast(2) brightness(0)' }} />
              ) : (
                <div className="h-12 flex items-center font-black text-2xl tracking-widest">MUNZI</div>
              )}
            </div>
            <div className="flex justify-between items-end mt-4 text-[11px] font-black text-left uppercase tracking-tight">
              <div>
                <p>STYLE ENGINE: v1.0</p>
                <p>STATUS: VERIFIED</p>
              </div>
              <div className="text-right leading-tight">
                <p>{datePart}</p>
                <p>{timePart}</p>
              </div>
            </div>
          </div>

          {/* Photo Section - Grayscale high contrast for B&W print look */}
          <div className="py-2 border-b border-black border-dashed">
            <div className="aspect-[1/1] w-full overflow-hidden grayscale contrast-[1.6] brightness-[1.05] border-2 border-black relative">
              <img
                src={analysis.image}
                alt="Capture"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Item Tags */}
          <div className="py-2 text-left">
            <p className="text-[11px] font-black uppercase tracking-widest border-b border-black inline-block mb-3">ITEM_TAGS</p>
            <div className="flex flex-wrap gap-1">
              {analysis.tags.map((tag, i) => (
                <span key={i} className="text-[11px] font-bold border border-black px-1.5 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Style DNA (Grayscale Bars) */}
          <div className="py-4 text-left border-y border-black border-dashed bg-gray-50 -mx-2 px-2">
            <p className="text-[11px] font-black uppercase tracking-widest mb-3">STYLE_DNA_METRICS</p>
            <div className="space-y-3">
              {analysis.styleDNA.map((dna, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span>{dna.label}</span>
                    <span>{dna.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 relative overflow-hidden border border-black/10">
                    <div
                      className="h-full bg-black transition-all duration-1000 ease-out"
                      style={{ width: `${dna.value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expert Statement - Removed Italics */}
          <div className="py-2 text-left">
            <p className="text-[11px] font-black uppercase tracking-widest mb-2 border-b border-gray-300 inline-block">ENGINE_ANALYSIS</p>
            <p className="text-[14px] leading-tight font-medium tracking-tight text-justify">
              {analysis.vogueDescription}
            </p>
          </div>

          {/* Totals */}
          <div className="pt-4 border-t-2 border-black space-y-1 uppercase">
            <div className="flex justify-between text-[11px] font-black">
              <span>VISUAL FREQUENCY</span>
              <span>OPTIMIZED_HZ</span>
            </div>
            <div className="flex justify-between text-3xl font-black mt-4 pt-2 border-t-4 border-black">
              <span>SCORE</span>
              <span>10.0</span>
            </div>
          </div>

          {/* Footer Barcode */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="w-full flex gap-[1.5px] h-8 overflow-hidden opacity-90">
              {Array.from({ length: 60 }).map((_, i) => (
                <div key={i} className="bg-black flex-1" style={{ height: '100%', width: i % 13 === 0 ? '4px' : '1px' }}></div>
              ))}
            </div>
            <p className="text-[9px] font-black tracking-[0.5em] uppercase text-gray-400">MUNZI STYLE LAB</p>
          </div>
        </div>
      </div>

      {/* Print Status */}
      {printStatus && (
        <div className="mt-4 px-6 py-2 bg-black text-white text-[10px] font-black tracking-widest uppercase animate-pulse">
          {printStatus}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4 my-10">
        <button
          onClick={handlePrint}
          disabled={isPrinting}
          className="px-10 py-4 bg-black text-white rounded-full font-black hover:bg-gray-800 active:translate-y-1 transition-all uppercase tracking-[0.2em] text-[11px] shadow-[0_6px_0_#1f2937] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPrinting ? 'PRINTING...' : 'PRINT RECEIPT'}
        </button>
        <button
          onClick={onReset}
          className="px-10 py-4 bg-purple-600 text-white rounded-full font-black hover:bg-purple-700 active:translate-y-1 transition-all uppercase tracking-[0.2em] text-[11px] shadow-[0_6px_0_#4c1d95]"
        >
          RE-INDEX STYLE
        </button>
      </div>
    </div>
  );
};
