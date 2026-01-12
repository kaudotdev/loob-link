import React from 'react';

interface EffectsLayerProps {
  isGlitching: boolean;
}

export function EffectsLayer({ isGlitching }: EffectsLayerProps) {
  if (!isGlitching) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      
      <div className="absolute top-1/4 left-0 w-full h-2 bg-white/20 animate-pulse" style={{ animationDuration: '0.1s' }} />
      <div className="absolute top-2/3 left-0 w-full h-8 bg-white/10" style={{ transform: 'skewX(20deg)' }} />
      <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay" />
      
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <h1 className="text-6xl font-black text-red-500 opacity-50 tracking-tighter">
          SYSTEM ERROR
        </h1>
      </div>
    </div>
  );
}
