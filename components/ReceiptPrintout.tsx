
import React, { forwardRef } from 'react';
import { StyleAnalysis } from '../types';

interface ReceiptPrintoutProps {
  analysis: StyleAnalysis;
  onReset: () => void;
}

export const ReceiptPrintout = forwardRef<HTMLDivElement, ReceiptPrintoutProps>(({ analysis, onReset }, ref) => {

  const renderDNALine = (label: string, value: number) => {
    const dashes = '-'.repeat(30);
    return (
      <div className="flex items-center gap-2 font-pixel text-[14px]">
        <span className="text-[#1D1E2C]">[{label}]</span>
        <span className="text-gray-400 flex-1 overflow-hidden whitespace-nowrap">{dashes}</span>
        <span className="text-[#1D1E2C]">{value}%</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={ref}
        className="w-[280px] bg-white text-black p-6 border border-gray-200 printing-animation origin-top"
      >
        <div className="space-y-4">
          {/* Photo Section - Grayscale */}
          <div className="aspect-[4/5] w-full overflow-hidden grayscale contrast-[1.4] brightness-[1.05]">
            <img
              src={analysis.image}
              alt="Capture"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Item Tags Section */}
          <div>
            <p className="font-pixel text-[14px] text-[#1D1E2C] border-b border-black mb-2 pb-1">
              ITEM_TAGS
            </p>
            <p className="font-pretendard text-[12px] text-[#373957] leading-relaxed">
              {analysis.tags.map(tag => `#${tag}`).join(' ')}
            </p>
          </div>

          {/* Style DNA Metrics */}
          <div>
            <p className="font-pixel text-[14px] text-[#1D1E2C] border-b border-black mb-2 pb-1">
              STYLE_DNA_METRICS
            </p>
            <div className="space-y-1">
              {analysis.styleDNA.map((dna, i) => (
                <React.Fragment key={i}>
                  {renderDNALine(dna.label, dna.value)}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Style Analysis */}
          <div>
            <p className="font-pixel text-[14px] text-[#1D1E2C] border-b border-black mb-2 pb-1">
              STYLE_ANALYSIS
            </p>
            <p className="font-pretendard text-[12px] text-[#373957] leading-relaxed">
              {analysis.vogueDescription.length > 50
                ? analysis.vogueDescription.slice(0, 50) + '...+'
                : analysis.vogueDescription
              }
            </p>
          </div>

          {/* Barcode */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="w-full flex gap-[1px] h-8 overflow-hidden">
              {Array.from({ length: 80 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-black"
                  style={{
                    height: '100%',
                    width: i % 7 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1px'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
