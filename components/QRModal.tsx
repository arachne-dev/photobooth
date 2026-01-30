import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: string | null;
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, analysisId }) => {
  const [copied, setCopied] = useState(false);

  console.log('QRModal render - isOpen:', isOpen, 'analysisId:', analysisId);

  if (!isOpen) return null;

  const shareUrl = analysisId ? `${window.location.origin}/share/${analysisId}` : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-8 max-w-[400px] w-full mx-4 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#373957] hover:text-[#1D1E2C] transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h2 className="font-pixel text-[28px] text-[#1D1E2C] text-center mb-6">
          Share Your Style
        </h2>

        {!analysisId ? (
          /* Loading/Error State */
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-[#A56CE8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-pretendard text-[16px] text-[#373957]">
              공유 링크 생성 중...
            </p>
            <p className="font-pretendard text-[14px] text-[#999] mt-2">
              잠시만 기다려주세요
            </p>
          </div>
        ) : (
          <>
            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white border-2 border-[#1D1E2C]">
                <QRCodeSVG
                  value={shareUrl}
                  size={200}
                  level="M"
                  fgColor="#1D1E2C"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            {/* Instructions */}
            <p className="font-pretendard text-[16px] text-[#373957] text-center mb-6">
              QR 코드를 스캔하거나 링크를 복사해서<br />
              친구들과 스타일을 공유하세요!
            </p>

            {/* Link & Copy */}
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-[#F6F2FC] border border-[#A56CE8] rounded-lg font-pretendard text-[14px] text-[#373957] truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-[#A56CE8] text-white font-pixel text-[14px] rounded-lg hover:bg-[#9259D6] transition-colors whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QRModal;
