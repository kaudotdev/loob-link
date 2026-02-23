/**
 * Whiteboard Modal - Overlay interativo sobre o terminal
 * 
 * REFATORADO para garantir coordenadas consistentes entre dispositivos
 * 
 * Arquitetura:
 * - Canvas com resolução fixa = resolução natural da imagem
 * - Zoom/Pan gerenciados via useViewport hook
 * - Conversão de coordenadas via matemática precisa
 * - Sincronização perfeita entre usuários
 * - Performance otimizada com requestAnimationFrame
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Tool } from '@/types/whiteboard';
import { useWhiteboardSocket } from '@/lib/useWhiteboardSocket';
import { useViewport } from '@/hooks/useViewport';
import { WhiteboardCanvas, WhiteboardCanvasHandle } from './WhiteboardCanvas';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { Maximize2, Minimize2, X, Lock, Unlock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface WhiteboardModalProps {
  templateId: string;
  onClose?: () => void;
}

export function WhiteboardModal({ templateId, onClose }: WhiteboardModalProps) {
  // Estados básicos
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [locked, setLocked] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  
  // Dimensões base da imagem (source of truth)
  const [baseWidth, setBaseWidth] = useState(0);
  const [baseHeight, setBaseHeight] = useState(0);

  // Refs
  const canvasHandleRef = useRef<WhiteboardCanvasHandle>(null);
  const backgroundImgRef = useRef<HTMLImageElement>(null);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);

  // Viewport (zoom/pan) gerenciado por hook dedicado
  const {
    viewport,
    zoomIn,
    zoomOut,
    reset,
    handleWheel,
    handlePinchStart,
    handlePinchMove,
    handlePinchEnd
  } = useViewport({
    minScale: 0.1,
    maxScale: 10,
    scrollSensitivity: 0.002,
    zoomIncrement: 0.2
  });

  // Refs para pinch
  const lastTouchDistanceRef = useRef<number | null>(null);

  /**
   * Carrega template e escuta mudanças em tempo real
   */
  useEffect(() => {
    if (!templateId) {
      setIsLoadingTemplate(false);
      return;
    }

    console.log(`🔌 Listening to template: ${templateId}`);

    const templateRef = doc(db, 'whiteboard_templates', templateId);
    const unsubscribe = onSnapshot(
      templateRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBackgroundImage(data.backgroundImage || '');
          setLocked(data.locked || false);
        }
        setIsLoadingTemplate(false);
      },
      (error) => {
        console.error('❌ Error loading template:', error);
        setIsLoadingTemplate(false);
      }
    );

    return () => {
      console.log(`🔌 Disconnecting from template ${templateId}`);
      unsubscribe();
    };
  }, [templateId]);

  /**
   * Quando imagem carregar, captura resolução natural
   * CRÍTICO: Esta é a resolução base usada por todo o sistema
   */
  useEffect(() => {
    const img = backgroundImgRef.current;
    if (!img || !backgroundImage) return;

    const handleImageLoad = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      
      setBaseWidth(width);
      setBaseHeight(height);
      
      console.log(`📐 Image base resolution: ${width}x${height}px`);
      console.log(`✅ All strokes will use this resolution as source of truth`);
    };

    if (img.complete && img.naturalWidth > 0) {
      handleImageLoad();
    } else {
      img.addEventListener('load', handleImageLoad);
      return () => img.removeEventListener('load', handleImageLoad);
    }
  }, [backgroundImage]);

  // Sincronização com Firestore
  const { elements, addStroke } = useWhiteboardSocket(templateId);

  // Configurações de desenho
  const PEN_COLOR = '#000000';
  const PEN_SIZE = 2;
  const ERASER_SIZE = 20;

  /**
   * Callbacks de desenho
   */
  const handleDrawStart = useCallback((x: number, y: number) => {
    if (locked || baseWidth === 0 || baseHeight === 0) return;
    
    currentStrokeRef.current = [{ x, y }];
    
    // Adiciona ponto ao canvas visual
    canvasHandleRef.current?.addPoint(x, y);
  }, [locked, baseWidth, baseHeight]);

  const handleDrawMove = useCallback((x: number, y: number) => {
    if (locked || currentStrokeRef.current.length === 0) return;
    
    currentStrokeRef.current.push({ x, y });
    
    // Adiciona ponto ao canvas visual
    canvasHandleRef.current?.addPoint(x, y);
  }, [locked]);

  const handleDrawEnd = useCallback(() => {
    if (locked || currentStrokeRef.current.length === 0) return;

    const points = currentStrokeRef.current;
    
    if (points.length > 1) {
      // Converte coordenadas base para normalizadas (0-1) para salvar
      const normalizedPoints = points.map(p => ({
        x: p.x / baseWidth,
        y: p.y / baseHeight
      }));

      // Salva no Firestore
      addStroke({
        tool: currentTool,
        points: normalizedPoints,
        color: PEN_COLOR,
        size: currentTool === 'pen' ? PEN_SIZE : ERASER_SIZE
      });
    }

    // Limpa stroke local
    currentStrokeRef.current = [];
    canvasHandleRef.current?.finishStroke();
  }, [locked, currentTool, baseWidth, baseHeight, addStroke]);

  /**
   * Handlers de touch com pinch zoom
   */
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom com dois dedos
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const center = getTouchCenter(e.touches[0], e.touches[1]);
      
      lastTouchDistanceRef.current = distance;
      handlePinchStart(distance, center.x, center.y);
    }
  }, [handlePinchStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current) {
      // Pinch zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const center = getTouchCenter(e.touches[0], e.touches[1]);
      
      handlePinchMove(distance, center.x, center.y);
      lastTouchDistanceRef.current = distance;
    }
  }, [handlePinchMove]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      lastTouchDistanceRef.current = null;
      handlePinchEnd();
    }
  }, [handlePinchEnd]);

  /**
   * Registra handler de wheel para zoom
   */
  useEffect(() => {
    const handleWheelEvent = (e: WheelEvent) => {
      // Só aplica zoom se Ctrl está pressionado (padrão de zoom)
      if (e.ctrlKey) {
        handleWheel(e);
      }
    };

    window.addEventListener('wheel', handleWheelEvent, { passive: false });
    window.addEventListener('touchstart', handleTouchStart as any, { passive: false });
    window.addEventListener('touchmove', handleTouchMove as any, { passive: false });
    window.addEventListener('touchend', handleTouchEnd as any, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheelEvent);
      window.removeEventListener('touchstart', handleTouchStart as any);
      window.removeEventListener('touchmove', handleTouchMove as any);
      window.removeEventListener('touchend', handleTouchEnd as any);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  /**
   * Download como PNG
   */
  const handleDownload = useCallback(() => {
    const canvas = canvasHandleRef.current?.getCanvas();
    const background = backgroundImgRef.current;
    if (!canvas) return;

    // Cria canvas temporário para compositar imagem + desenhos
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = baseWidth;
    tempCanvas.height = baseHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Desenha background
    if (background && background.complete) {
      tempCtx.drawImage(background, 0, 0, baseWidth, baseHeight);
    } else {
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, baseWidth, baseHeight);
    }

    // Desenha canvas por cima
    tempCtx.drawImage(canvas, 0, 0);

    // Download
    tempCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [baseWidth, baseHeight]);

  const cursorStyle = locked ? 'default' : (currentTool === 'pen' ? 'crosshair' : 'pointer');

  return (
    <div className={`fixed bg-black/95 border-2 border-[#00ff88] flex flex-col z-[9999] shadow-[0_0_50px_rgba(0,255,136,0.3)] ${
      isFullscreen 
        ? 'top-0 left-0 w-screen h-screen rounded-none' 
        : 'bottom-[100px] right-5 w-[400px] h-[500px] rounded-lg sm:w-[90vw] sm:h-[70vh] sm:right-[5vw] sm:bottom-20'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-[#00ff88]/10 border-b border-[#00ff88]">
        <div className="flex items-center gap-2">
          {locked ? (
            <Lock className="w-4 h-4 text-[#00ff88]" />
          ) : (
            <Unlock className="w-4 h-4 text-[#00ff88]" />
          )}
          <span className="text-[#00ff88] font-bold text-sm">
            {locked ? 'Whiteboard (Visualização)' : 'Whiteboard Colaborativo'}
          </span>
          <span className="text-[#00ff88]/60 text-xs ml-2">
            {(viewport.scale * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-transparent border border-[#00ff88] text-[#00ff88] w-8 h-8 rounded cursor-pointer flex items-center justify-center transition-all hover:bg-[#00ff88] hover:text-black"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Minimizar' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button 
              className="bg-transparent border border-[#00ff88] text-[#00ff88] w-8 h-8 rounded cursor-pointer flex items-center justify-center transition-all hover:bg-[#00ff88] hover:text-black"
              onClick={onClose} 
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 bg-[#1a1a1a] overflow-hidden">
        {/* Background Image */}
        {backgroundImage && (
          <img
            ref={backgroundImgRef}
            src={backgroundImage}
            alt="Background"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            crossOrigin="anonymous"
            style={{ 
              transform: `scale(${viewport.scale}) translate(${viewport.offsetX / viewport.scale}px, ${viewport.offsetY / viewport.scale}px)`,
              transformOrigin: 'center center',
              zIndex: 1
            }}
          />
        )}

        {/* Canvas Whiteboard (acima da imagem) */}
        {baseWidth > 0 && baseHeight > 0 && (
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            <WhiteboardCanvas
              ref={canvasHandleRef}
              baseWidth={baseWidth}
              baseHeight={baseHeight}
              elements={elements}
              viewport={viewport}
              currentTool={currentTool}
              locked={locked}
              onDrawStart={handleDrawStart}
              onDrawMove={handleDrawMove}
              onDrawEnd={handleDrawEnd}
              cursor={cursorStyle}
            />
          </div>
        )}

        {isLoadingTemplate && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[#00ff88] text-sm">Carregando...</div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <WhiteboardToolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        locked={locked}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={reset}
        onDownload={handleDownload}
        scale={viewport.scale}
      />
    </div>
  );
}
