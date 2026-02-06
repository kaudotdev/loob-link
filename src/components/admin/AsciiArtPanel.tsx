import React from 'react';
import { ASCII_ICONS, IconKey } from './asciiArt';

interface AsciiArtPanelProps {
  onSendArt: (art: string) => void;
  isLoading: boolean;
}

export function AsciiArtPanel({ onSendArt, isLoading }: AsciiArtPanelProps) {
  return (
    <div className="space-y-4">
      <p className="text-[var(--admin-text-dim)] text-xs mb-2">
        Clique para enviar um ícone diretamente ao terminal:
      </p>
      <div className="flex flex-wrap gap-2">
        {(Object.entries(ASCII_ICONS) as [IconKey, string][]).map(([name, icon]) => (
          <button
            key={name}
            onClick={() => onSendArt(icon)}
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center text-lg font-mono bg-transparent border border-[var(--admin-border)] rounded hover:bg-[var(--admin-text)] hover:text-black transition-all"
            title={name}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export default AsciiArtPanel;
