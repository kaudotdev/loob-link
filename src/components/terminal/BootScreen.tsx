import React from 'react';
import { AsciiText } from './AsciiText';

interface BootScreenProps {
  onBoot: () => void;
}

export function BootScreen({ onBoot }: BootScreenProps) {
  return (
    <div className="boot-screen crt-screen">
      <div className="static-noise" />
      
      <div className="mb-8 text-center">
        <AsciiText text="L00B" enableWaves={false} />
        <p className="text-glow-amber text-xl mt-4 tracking-widest">
          [ LINK PROTOCOL v2.4.7 ]
        </p>
      </div>

      <button 
        onClick={onBoot}
        className="boot-button"
      >
        ▶ INICIAR CONEXÃO
      </button>

      <p className="mt-8 text-glow-cyan text-sm opacity-70">
        Toque para estabelecer link seguro
      </p>
      <p className="mt-2 text-gray-500 text-xs">
        (Permissões de câmera e notificação serão solicitadas)
      </p>
    </div>
  );
}
