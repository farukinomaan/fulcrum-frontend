import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface ZatcaQRProps {
  base64Data: string;
  size?: number;
}

const ZatcaQR: React.FC<ZatcaQRProps> = ({ base64Data, size = 160 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && base64Data) {
      QRCode.toCanvas(
        canvasRef.current,
        base64Data,
        {
          width: size,
          margin: 1,
          color: {
            dark: '#000000',  // Pure black for maximum scanability
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M', // Medium error correction
        },
        (error) => {
          if (error) console.error('QR Generation Error:', error);
        }
      );
    }
  }, [base64Data, size]);

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg border shadow-sm">
      <div className="text-[10px] font-bold text-gray-400 mb-2 tracking-widest uppercase">
        ZATCA E-INVOICE QR
      </div>
      <canvas ref={canvasRef} />
      <div className="mt-2 flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] text-gray-500 font-medium">FATOORA COMPLIANT</span>
      </div>
    </div>
  );
};

export default ZatcaQR;