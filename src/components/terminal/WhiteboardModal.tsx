/**
 * Whiteboard Modal - Overlay interativo sobre o terminal
 * 
 * Ativado quando o admin envia mensagem type='whiteboard'
 * Semelhante ao Image3DMessage, mas com desenho colaborativo
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Tool, Point } from '@/types/whiteboard';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  // Firestore sync (strokes separados por templateId)
  const { strokes, addStroke } = useWhiteboardSocket(templateId);

  // Configurações
  const PEN_COLOR = '#000000';
  const PEN_SIZE = 2;
  const ERASER_SIZE = 20;
  const THROTTLE_MS = 16;

  /**
   * Redimensiona canvas responsivamente
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawAllStrokes();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isFullscreen]);

  /**
   * Redesenha todos os strokes
   */
  const redrawAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;

      ctx.save();

      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = ERASER_SIZE;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      const startPoint = stroke.points[0];
      ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
      }

      ctx.stroke();
      ctx.restore();
    });
  }, [strokes]);

  useEffect(() => {
    redrawAllStrokes();
  }, [strokes, redrawAllStrokes]);

  /**
   * Coordenadas relativas
   */
  const getRelativePoint = (clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
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

    if (currentStrokeRef.current.length > 1) {
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
            className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
            crossOrigin="anonymous"
          />
        )}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full touch-none"
          style={{ cursor: cursorStyle }}
          onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
          onMouseMove={(e) => continueDrawing(e.clientX, e.clientY)}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startDrawing(touch.clientX, touch.clientY);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            continueDrawing(touch.clientX, touch.clientY);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            endDrawing();
          }}
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
