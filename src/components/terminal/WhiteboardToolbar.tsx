/**
 * Toolbar do Whiteboard
 * 
 * Componente reutilizável com todos os controles:
 * - Ferramentas de desenho (pen, eraser)
 * - Controles de zoom/pan
 * - Download
 * - Reset
 */

'use client';

import { Tool } from '@/types/whiteboard';
import { PenLine, Eraser, Download, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

export interface WhiteboardToolbarProps {
  /** Ferramenta atual selecionada */
  currentTool: Tool;
  /** Callback ao trocar ferramenta */
  onToolChange: (tool: Tool) => void;
  /** Se está bloqueado (esconde ferramentas de desenho) */
  locked?: boolean;
  /** Callback zoom in */
  onZoomIn?: () => void;
  /** Callback zoom out */
  onZoomOut?: () => void;
  /** Callback reset viewport */
  onReset?: () => void;
  /** Callback download */
  onDownload?: () => void;
  /** Escala atual (para exibir) */
  scale?: number;
}

export function WhiteboardToolbar({
  currentTool,
  onToolChange,
  locked = false,
  onZoomIn,
  onZoomOut,
  onReset,
  onDownload,
  scale = 1
}: WhiteboardToolbarProps) {
  return (
    <div className="flex gap-2 p-3 bg-black/80 border-t border-[#00ff88] justify-between items-center">
      {/* Ferramentas de Desenho */}
      <div className="flex gap-2">
        {!locked && (
          <>
            <button
              className={`bg-white/10 border-2 text-white w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:bg-white/20 ${
                currentTool === 'pen' 
                  ? 'bg-[#00ff88] border-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.5)]' 
                  : 'border-transparent'
              }`}
              onClick={() => onToolChange('pen')}
              title="Caneta (P)"
              aria-label="Caneta"
            >
              <PenLine className="w-4 h-4" />
            </button>
            <button
              className={`bg-white/10 border-2 text-white w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:bg-white/20 ${
                currentTool === 'eraser' 
                  ? 'bg-[#00ff88] border-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.5)]' 
                  : 'border-transparent'
              }`}
              onClick={() => onToolChange('eraser')}
              title="Borracha (E)"
              aria-label="Borracha"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Controles de Viewport e Utilitários */}
      <div className="flex gap-2 items-center">
        {/* Indicador de Zoom */}
        <span className="text-white/60 text-xs px-2">
          {(scale * 100).toFixed(0)}%
        </span>

        {/* Zoom In */}
        {onZoomIn && (
          <button
            className="bg-white/10 border border-white/20 text-white w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:bg-white/20"
            onClick={onZoomIn}
            title="Zoom In (Ctrl + Scroll)"
            aria-label="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        )}

        {/* Zoom Out */}
        {onZoomOut && (
          <button
            className="bg-white/10 border border-white/20 text-white w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:bg-white/20"
            onClick={onZoomOut}
            title="Zoom Out (Ctrl + Scroll)"
            aria-label="Diminuir Zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        )}

        {/* Reset Viewport */}
        {onReset && (
          <button
            className="bg-white/10 border border-white/20 text-white w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:bg-white/20"
            onClick={onReset}
            title="Reset Zoom/Pan (R)"
            aria-label="Resetar Visualização"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Download */}
        {onDownload && (
          <button
            className="bg-blue-500/20 border border-blue-500 text-white w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:bg-blue-500/40"
            onClick={onDownload}
            title="Download PNG (Ctrl + S)"
            aria-label="Baixar Imagem"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
