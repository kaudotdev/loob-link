import React, { useEffect, useState } from 'react';

interface AsciiTextProps {
  text: string;
  enableWaves?: boolean;
}

export function AsciiText({ text, enableWaves = false }: AsciiTextProps) {
  const [asciiArt, setAsciiArt] = useState<string>('');

  useEffect(() => {
    const renderAscii = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const fontSize = 60;
      const font = `900 ${fontSize}px "Courier New", monospace`;
      ctx.font = font;

      const metrics = ctx.measureText(text);
      const width = Math.ceil(metrics.width);
      const height = fontSize; 
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = '#ffffff';
      ctx.font = font;
      ctx.fillText(text, 0, height * 0.8);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      const chars = " .:-=+*#%@";       let output = "";
      
            const sampleX = 2;       const sampleY = 4; 
      for (let y = 0; y < height; y += sampleY) {
        let line = "";
        for (let x = 0; x < width; x += sampleX) {
          const offset = (y * width + x) * 4;
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          const a = data[offset + 3];

                    const brightness = (r + g + b) / 3;
          
          if (a > 128) {                                                                  
                          const charIndex = Math.floor(Math.random() * (chars.length - 4)) + 4;              line += enableWaves ? chars[charIndex] : "█";           } else {
             line += " ";
          }
        }
        output += line + "\n";
      }
      setAsciiArt(output);
    };

    renderAscii();
  }, [text, enableWaves]);

  return (
    <pre 
      className="text-[var(--terminal-color)] font-mono text-[6px] sm:text-[8px] leading-[6px] sm:leading-[8px] whitespace-pre text-left select-none overflow-hidden"
      style={{
        textShadow: '0 0 10px var(--terminal-glow)'
      }}
    >
      {asciiArt}
    </pre>
  );
}
