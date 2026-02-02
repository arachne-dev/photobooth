import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { StyleAnalysis } from '../types';
import html2canvas from 'html2canvas';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string | null;
  analysis: StyleAnalysis | null;
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, analysisId, analysis }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const shareUrl = analysisId ? `${window.location.origin}/share/${analysisId}` : '';

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    try {
      const element = receiptRef.current;
      const rect = element.getBoundingClientRect();

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: rect.width,
        height: rect.height,
      });

      const link = document.createElement('a');
      link.download = `munzi-fit-check-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to download:', err);
    }
  };

  const renderDNALine = (label: string, value: number) => {
    const dashes = '-'.repeat(20);
    return (
      <div className="flex items-center gap-1 font-pixel text-[11px]">
        <span className="text-[#1D1E2C]">[{label}]</span>
        <span className="text-gray-400 flex-1 overflow-hidden whitespace-nowrap">{dashes}</span>
        <span className="text-[#1D1E2C]">{value}%</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-6 max-w-[700px] w-full mx-4 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#373957] hover:text-[#1D1E2C] transition-colors z-10"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="font-pixel text-[24px] text-[#1D1E2C] text-center mb-6">
          Share Your Style
        </h2>

        {!analysisId || !analysis ? (
          /* Loading/Error State */
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-[#A56CE8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-pretendard text-[16px] text-[#373957]">
              공유 링크 생성 중...
            </p>
          </div>
        ) : (
          <div className="flex gap-6 flex-col md:flex-row">
            {/* Left: Receipt Preview */}
            <div className="flex-1 flex justify-center">
              <div
                ref={receiptRef}
                className="w-[240px] bg-white border-2 border-[#1D1E2C] p-4"
              >
                {/* Photo */}
                <div className="aspect-[4/5] w-full overflow-hidden grayscale contrast-[1.4] brightness-[1.05] mb-3">
                  <img
                    src={analysis.image}
                    alt="Capture"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Item Tags */}
                <div className="mb-3">
                  <p className="font-pixel text-[11px] text-[#1D1E2C] border-b border-black mb-1 pb-1">
                    ITEM_TAGS
                  </p>
                  <p className="font-pretendard text-[10px] text-[#373957] leading-relaxed">
                    {analysis.tags.map(tag => `#${tag}`).join(' ')}
                  </p>
                </div>

                {/* Style DNA */}
                <div className="mb-3">
                  <p className="font-pixel text-[11px] text-[#1D1E2C] border-b border-black mb-1 pb-1">
                    STYLE_DNA
                  </p>
                  <div className="space-y-0.5">
                    {analysis.styleDNA.map((dna, i) => (
                      <React.Fragment key={i}>
                        {renderDNALine(dna.label, dna.value)}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Analysis */}
                <div>
                  <p className="font-pixel text-[11px] text-[#1D1E2C] border-b border-black mb-1 pb-1">
                    ANALYSIS
                  </p>
                  <p className="font-pretendard text-[10px] text-[#373957] leading-relaxed">
                    {analysis.vogueDescription}
                  </p>
                </div>

                {/* Barcode */}
                <div className="mt-3 flex gap-[1px] h-6 overflow-hidden">
                  {Array.from({ length: 60 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-black"
                      style={{
                        height: '100%',
                        width: i % 7 === 0 ? '2px' : i % 3 === 0 ? '1.5px' : '1px'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: QR & Download */}
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* QR Code */}
              <div className="p-3 bg-white border-2 border-[#1D1E2C] mb-4">
                <QRCodeSVG
                  value={shareUrl}
                  size={160}
                  level="M"
                  fgColor="#1D1E2C"
                  bgColor="#ffffff"
                />
              </div>

              {/* Instructions */}
              <p className="font-pretendard text-[14px] text-[#373957] text-center mb-4">
                QR 코드를 스캔하거나<br />
                이미지를 다운로드하세요!
              </p>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-[#A56CE8] text-white font-pixel text-[16px] rounded-full hover:bg-[#9259D6] transition-colors flex items-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRModal;
