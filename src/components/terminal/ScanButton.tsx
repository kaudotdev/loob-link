import React from 'react';

interface ScanButtonProps {
  onClick: () => void;
}

export function ScanButton({ onClick }: ScanButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="scan-button-terminal"
      title="Escanear QR Code"
    >
      📷 SCAN
    </button>
  );
}
