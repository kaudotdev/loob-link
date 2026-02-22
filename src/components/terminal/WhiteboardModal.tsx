/**
 * Whiteboard Modal - Overlay interativo sobre o terminal
 * 
 * Ativado quando o admin envia mensagem type='whiteboard'
 * Semelhante ao Image3DMessage, mas com desenho colaborativo
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Tool, Point, CanvasElement } from '@/types/whiteboard';
import { useWhiteboardSocket } from '@/lib/useWhiteboardSocket';
import { PenLine, Eraser, Download, Maximize2, Minimize2, X, Lock, Unlock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface WhiteboardModalProps {
  templateId: string;
  onClose?: () => void;
}

export function WhiteboardModal({ templateId, onClose }: WhiteboardModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [locked, setLocked] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  
  // Estados de zoom e pan
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistanceRef = useRef<number | null>(null);
  const initialPinchCenterRef = useRef<{ x: number; y: number } | null>(null);
  
  // Estado do desenho
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const lastPointTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Carregar dados do template e escutar mudanças em tempo real (incluindo locked)
  useEffect(() => {
    if (!templateId) {
      setIsLoadingTemplate(false);
      return;
    }

    console.log(`🔌 Listening to template changes: ${templateId}`);

    const templateRef = doc(db, 'whiteboard_templates', templateId);
    const unsubscribe = onSnapshot(
      templateRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBackgroundImage(data.backgroundImage || '');
          setLocked(data.locked || false);
          
          // Se foi bloqueado durante uso, cancela desenho atual
          if (data.locked && isDrawing) {
            setIsDrawing(false);
            currentStrokeRef.current = [];
          }
        }
        setIsLoadingTemplate(false);
      },
      (error) => {
        console.error('Erro ao escutar template:', error);
        setIsLoadingTemplate(false);
      }
    );

    return () => {
      console.log(`🔌 Disconnecting from template ${templateId}`);
      unsubscribe();
    };
  }, [templateId, isDrawing]);

  // Firestore sync (elementos separados por templateId)
  const { elements, addStroke } = useWhiteboardSocket(templateId);

  /**
   * Captura aspect ratio da imagem de fundo quando carregar
   */
  useEffect(() => {
    const img = backgroundRef.current;
    if (!img || !backgroundImage) return;

    const handleImageLoad = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      setImageAspectRatio(ratio);
      console.log(`📐 Image aspect ratio: ${ratio.toFixed(2)} (${img.naturalWidth}x${img.naturalHeight})`);
    };

    if (img.complete) {
      handleImageLoad();
    } else {
      img.addEventListener('load', handleImageLoad);
      return () => img.removeEventListener('load', handleImageLoad);
    }
  }, [backgroundImage]);

  // Configurações
  const PEN_COLOR = '#000000';
  const PEN_SIZE = 2;
  const ERASER_SIZE = 20;
  const THROTTLE_MS = 16;

  /**
   * Redimensiona canvas para tamanho exato da imagem renderizada
   * Canvas e imagem devem ter dimensões idênticas para evitar traços esticados
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = backgroundRef.current;
    if (!canvas || !container || !img || !imageAspectRatio) return;

    const resizeCanvas = () => {
      // Aguarda imagem estar completamente carregada
      if (!img.complete || img.naturalWidth === 0) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      const containerAspect = containerWidth / containerHeight;

      let renderWidth, renderHeight, offsetX, offsetY;

      // Calcula tamanho real da imagem renderizada (object-contain)
      if (containerAspect > imageAspectRatio) {
        // Container mais largo - imagem se ajusta pela altura
        renderHeight = containerHeight;
        renderWidth = renderHeight * imageAspectRatio;
        offsetX = (containerWidth - renderWidth) / 2;
        offsetY = 0;
      } else {
        // Container mais alto - imagem se ajusta pela largura
        renderWidth = containerWidth;
        renderHeight = renderWidth / imageAspectRatio;
        offsetX = 0;
        offsetY = (containerHeight - renderHeight) / 2;
      }

      // Canvas deve ter EXATAMENTE o mesmo tamanho da imagem renderizada
      canvas.width = renderWidth;
      canvas.height = renderHeight;
      canvas.style.width = `${renderWidth}px`;
      canvas.style.height = `${renderHeight}px`;
      canvas.style.left = `${offsetX}px`;
      canvas.style.top = `${offsetY}px`;

      // Imagem também deve ter o mesmo tamanho e posição
      img.style.width = `${renderWidth}px`;
      img.style.height = `${renderHeight}px`;
      img.style.left = `${offsetX}px`;
      img.style.top = `${offsetY}px`;
      
      redrawAllStrokes();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isFullscreen, imageAspectRatio]);

  /**
   * Redesenha todos os elementos (strokes e textos)
   */
  const redrawAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((element: CanvasElement) => {
      ctx.save();

      // Apenas renderiza strokes (pen/eraser), ignora text
      if ('points' in element && element.points.length > 0) {
        // Renderizar stroke (pen ou eraser)
        if (element.tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
          ctx.lineWidth = ERASER_SIZE;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = element.color;
          ctx.lineWidth = element.size;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        
        const startPoint = element.points[0];
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);

        for (let i = 1; i < element.points.length; i++) {
          const point = element.points[i];
          ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
        }

        ctx.stroke();
      }

      ctx.restore();
    });
  }, [elements]);

  useEffect(() => {
    redrawAllStrokes();
  }, [elements, redrawAllStrokes]);

  /**
   * Coordenadas relativas (considerando zoom e pan)
   */
  const getRelativePoint = (clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    // Posição no canvas visível (com zoom)
    const canvasX = (clientX - rect.left) / rect.width;
    const canvasY = (clientY - rect.top) / rect.height;
    
    // Ajusta pelo zoom e pan para obter coordenada real no canvas original
    const adjustedX = (canvasX - 0.5) / scale - (panX / scale / rect.width) + 0.5;
    const adjustedY = (canvasY - 0.5) / scale - (panY / scale / rect.height) + 0.5;
    
    return {
      x: adjustedX,
      y: adjustedY
    };
  };

  /**
   * Adiciona ponto com throttle
   */
  const addPointToCurrentStroke = (point: Point) => {
    const now = Date.now();
    if (now - lastPointTimeRef.current < THROTTLE_MS) return;

    lastPointTimeRef.current = now;
    currentStrokeRef.current.push(point);

    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => {
        drawCurrentStroke();
        animationFrameRef.current = null;
      });
    }
  };

  /**
   * Desenha stroke local
   */
  const drawCurrentStroke = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const points = currentStrokeRef.current;
    if (points.length < 2) return;

    const lastPoint = points[points.length - 2];
    const currentPoint = points[points.length - 1];

    ctx.save();

    if (currentTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = ERASER_SIZE;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = PEN_COLOR;
      ctx.lineWidth = PEN_SIZE;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.x * canvas.width, lastPoint.y * canvas.height);
    ctx.lineTo(currentPoint.x * canvas.width, currentPoint.y * canvas.height);
    ctx.stroke();
    ctx.restore();
  };

  /**
   * Calcula distância entre dois toques
   */
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * Calcula centro entre dois toques
   */
  const getTouchCenter = (touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  /**
   * Handler de pinch-to-zoom
   */
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      // Pinch zoom com dois dedos
      e.preventDefault();
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      lastTouchDistanceRef.current = distance;
      initialPinchCenterRef.current = getTouchCenter(e.touches[0], e.touches[1]);
      
      // Cancela desenho se estava em andamento
      if (isDrawing) {
        setIsDrawing(false);
        currentStrokeRef.current = [];
      }
    } else if (e.touches.length === 1) {
      // Desenho com um dedo
      e.preventDefault();
      const touch = e.touches[0];
      startDrawing(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const currentCenter = getTouchCenter(e.touches[0], e.touches[1]);
      
      if (lastTouchDistanceRef.current && initialPinchCenterRef.current) {
        const scaleChange = currentDistance / lastTouchDistanceRef.current;
        const newScale = Math.max(0.5, Math.min(5, scale * scaleChange)); // Limita entre 0.5x e 5x
        
        // Ajusta pan para zoom centralizado no ponto de pinça
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const zoomPointX = (currentCenter.x - rect.left) / rect.width;
          const zoomPointY = (currentCenter.y - rect.top) / rect.height;
          
          setPanX(panX + (zoomPointX - 0.5) * (newScale - scale) * rect.width);
          setPanY(panY + (zoomPointY - 0.5) * (newScale - scale) * rect.height);
        }
        
        setScale(newScale);
        lastTouchDistanceRef.current = currentDistance;
      }
    } else if (e.touches.length === 1 && !lastTouchDistanceRef.current) {
      // Desenho com um dedo
      e.preventDefault();
      const touch = e.touches[0];
      continueDrawing(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    if (e.touches.length < 2) {
      lastTouchDistanceRef.current = null;
      initialPinchCenterRef.current = null;
    }
    
    if (e.touches.length === 0) {
      endDrawing();
    }
  };

  /**
   * Eventos de desenho (desabilitados se locked=true)
   */
  const startDrawing = (clientX: number, clientY: number) => {
    if (locked) return; // Bloqueado: sem desenho
    const point = getRelativePoint(clientX, clientY);
    if (!point) return;

    setIsDrawing(true);
    currentStrokeRef.current = [point];
    lastPointTimeRef.current = Date.now();
  };

  const continueDrawing = (clientX: number, clientY: number) => {
    if (locked || !isDrawing) return; // Bloqueado: sem desenho
    const point = getRelativePoint(clientX, clientY);
    if (!point) return;
    addPointToCurrentStroke(point);
  };

  const endDrawing = () => {
    if (locked || !isDrawing) return; // Bloqueado: sem desenho
    setIsDrawing(false);

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (currentStrokeRef.current.length > 1 && (currentTool === 'pen' || currentTool === 'eraser')) {
      addStroke({
        tool: currentTool,
        points: [...currentStrokeRef.current],
        color: PEN_COLOR,
        size: currentTool === 'pen' ? PEN_SIZE : ERASER_SIZE
      });
    }

    currentStrokeRef.current = [];
  };

  /**
   * Download PNG
   */
  const handleDownload = () => {
    const canvas = canvasRef.current;
    const background = backgroundRef.current;
    if (!canvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    if (background && background.complete) {
      tempCtx.drawImage(background, 0, 0, tempCanvas.width, tempCanvas.height);
    } else {
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    tempCtx.drawImage(canvas, 0, 0);

    tempCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

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
      <div ref={containerRef} className="relative flex-1 bg-[#1a1a1a] overflow-hidden">
        {backgroundImage && (
          <img
            ref={backgroundRef}
            src={backgroundImage}
            alt="Background"
            className="absolute pointer-events-none"
            style={{
              transform: `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`,
              transformOrigin: 'center center',
              objectFit: 'contain'
            }}
            crossOrigin="anonymous"
          />
        )}
        <canvas
          ref={canvasRef}
          className="absolute touch-none"
          style={{ 
            cursor: cursorStyle,
            transform: `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px)`,
            transformOrigin: 'center center'
          }}
          onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
          onMouseMove={(e) => continueDrawing(e.clientX, e.clientY)}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 p-3 bg-black/80 border-t border-[#00ff88] justify-center">
        {!locked && (
          <>
            <button
              className={`bg-white/10 border-2 text-white w-12 h-12 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:bg-white/20 hover:-translate-y-0.5 ${
                currentTool === 'pen' ? 'bg-[#00ff88] border-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.5)]' : 'border-transparent'
              }`}
              onClick={() => setCurrentTool('pen')}
              title="Caneta"
            >
              <PenLine className="w-5 h-5" />
            </button>
            <button
              className={`bg-white/10 border-2 text-white w-12 h-12 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:bg-white/20 hover:-translate-y-0.5 ${
                currentTool === 'eraser' ? 'bg-[#00ff88] border-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.5)]' : 'border-transparent'
              }`}
              onClick={() => setCurrentTool('eraser')}
              title="Borracha"
            >
              <Eraser className="w-5 h-5" />
            </button>
          </>
        )}
        <button
          className="bg-blue-500/20 border-2 border-blue-500 text-white w-12 h-12 rounded-lg cursor-pointer flex items-center justify-center transition-all hover:bg-blue-500/40 hover:-translate-y-0.5"
          onClick={handleDownload}
          title="Download PNG"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
