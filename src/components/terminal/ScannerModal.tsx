import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerModalProps {
  onClose: () => void;
  onScan: (decodedText: string) => void;
  onError: (msg: string) => void;
}

export function ScannerModal({ onClose, onScan, onError }: ScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    let scanner: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
                await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mountedRef.current) return;

        scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
                                      if (mountedRef.current) {
                 onScan(decodedText);
             }
          },
          () => {}         );
      } catch (error) {
        console.error('Erro ao iniciar scanner:', error);
        if (mountedRef.current) {
          onError('> ⚠️ ERRO: Câmera não disponível ou permissão negada.');
          onClose();
        }
      }
    };

    startScanner();

    return () => {
      mountedRef.current = false;
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(err => console.log('Erro ao parar scanner no cleanup:', err));
      }
    };
  }, [onScan, onError, onClose]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <div className="scanner-header">
          <span className="text-glow-cyan">📷 SCANNER ATIVO</span>
          <button 
            onClick={onClose}
            className="scanner-close-btn"
          >
            ✕
          </button>
        </div>
        <div id="qr-reader" className="qr-reader-box" />
        <p className="text-glow text-sm mt-4">
          Aponte para um QR Code L00B
        </p>
      </div>
    </div>
  );
}
