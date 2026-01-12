
import React, { useState } from 'react';

interface ImageMessageProps {
  url: string;
  caption?: string;
  onLoad?: () => void;
}

export function ImageMessage({ url, caption, onLoad }: ImageMessageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  return (
    <div className="my-4 max-w-full sm:max-w-md border border-gray-800 bg-black p-1 relative group">
      
      {!isLoaded && (
        <div className="h-48 w-full flex items-center justify-center bg-gray-900 text-gray-500 animate-pulse">
          <span className="text-xs">[CARREGANDO ARQUIVO DE MÍDIA...]</span>
        </div>
      )}
      
      <img
        src={url}
        alt={caption || "Mídia do terminal"}
        className={`w-full h-auto object-cover max-h-96 filter grayscale sepia-[.5] hover:grayscale-0 hover:sepia-0 transition-all duration-700 ${!isLoaded ? 'hidden' : 'block'}`}
        onLoad={handleLoad}
        style={{ imageRendering: 'pixelated' }}
      />
      
      
      <div className="absolute inset-0 bg-repeat-y pointer-events-none opacity-20 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAADCAYAAABS3WWCAAAAE0lEQVQIW2NkYGD4zwABjFA6CgAN0wEAAu1j3QAAAABJRU5ErkJggg==')] bg-[length:1px_3px]" />

      {caption && isLoaded && (
        <div className="mt-2 text-xs text-gray-500 border-t border-gray-800 pt-1 font-mono">
          {`> FIG. REF-${url.length + (caption?.length || 0)}: ${caption}`}
        </div>
      )}
    </div>
  );
}
