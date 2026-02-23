/**
 * Componente Canvas otimizado para Whiteboard Colaborativo
 * 
 * ARQUITETURA CRÍTICA:
 * 
 * 1. Canvas tem resolução FIXA = resolução natural da imagem
 *    canvas.width = image.naturalWidth
 *    canvas.height = image.naturalHeight
 * 
 * 2. Todas as coordenadas são salvas nessa resolução base
 *    Exemplo: imagem 2000x1200 → todos os strokes usam essa escala
 * 
 * 3. Responsividade é feita via CSS (transform), NÃO via resize de coordenadas
 * 
 * 4. Zoom/Pan são aplicados via CSS transform no container
 * 
 * 5. Performance: requestAnimationFrame, throttle, desenho incremental
 * 
 * RESULTADO: Traços aparecem EXATAMENTE na mesma posição em qualquer dispositivo
 */

'use client';

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { CanvasElement, Tool } from '@/types/whiteboard';
import { Viewport } from '@/hooks/useViewport';

export interface WhiteboardCanvasProps {
  /** Largura base (resolução natural da imagem) */
  baseWidth: number;
  /** Altura base (resolução natural da imagem) */
  baseHeight: number;
  /** Elementos para desenhar (strokes sincronizados) */
  elements: CanvasElement[];
  /** Estado do viewport (zoom/pan) */
  viewport: Viewport;
  /** Ferramenta atual */
  currentTool: Tool;
  /** Se está bloqueado (visualização apenas) */
  locked?: boolean;
  /** Callback quando desenho inicia */
  onDrawStart?: (x: number, y: number) => void;
  /** Callback durante desenho */
  onDrawMove?: (x: number, y: number) => void;
  /** Callback quando desenho termina */
  onDrawEnd?: () => void;
  /** Cursor CSS */
  cursor?: string;
}

export interface WhiteboardCanvasHandle {
  /** Limpa o canvas completamente */
  clear: () => void;
  /** Redesenha todos os elementos */
  redraw: () => void;
  /** Adiciona ponto ao stroke atual (desenho local em tempo real) */
  addPoint: (x: number, y: number) => void;
  /** Finaliza stroke atual */
  finishStroke: () => void;
  /** Retorna referência do canvas */
  getCanvas: () => HTMLCanvasElement | null;
}

/**
 * Componente Canvas otimizado com resolução fixa
 * 
 * Uso:
 * ```tsx
 * <WhiteboardCanvas
 *   baseWidth={image.naturalWidth}
 *   baseHeight={image.naturalHeight}
 *   elements={strokes}
 *   viewport={viewport}
 *   currentTool="pen"
 *   onDrawStart={handleStart}
 *   onDrawMove={handleMove}
 *   onDrawEnd={handleEnd}
 * />
 * ```
 */
export const WhiteboardCanvas = forwardRef<WhiteboardCanvasHandle, WhiteboardCanvasProps>(({
  baseWidth,
  baseHeight,
  elements,
  viewport,
  currentTool,
  locked = false,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  cursor = 'crosshair'
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number>(0);

  // Configurações de desenho
  const PEN_COLOR = '#000000';
  const PEN_SIZE = 2;
  const ERASER_SIZE = 20;

  /**
   * Redesenha todos os elementos no canvas
   * Chamado quando elementos mudam ou após zoom/pan
   */
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Limpa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha todos os elementos
    elements.forEach((element: CanvasElement) => {
      ctx.save();

      if ('points' in element && element.points.length > 0) {
        // Desenha stroke (pen ou eraser)
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

        // CRÍTICO: Coordenadas já estão em pixels base
        // Converte de coordenadas normalizadas (0-1) para pixels base
        const startPoint = element.points[0];
        ctx.moveTo(startPoint.x * baseWidth, startPoint.y * baseHeight);

        for (let i = 1; i < element.points.length; i++) {
          const point = element.points[i];
          ctx.lineTo(point.x * baseWidth, point.y * baseHeight);
        }

        ctx.stroke();
      }

      ctx.restore();
    });
  }, [elements, baseWidth, baseHeight]);

  /**
   * Configura resolução do canvas (apenas uma vez ou quando base muda)
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || baseWidth === 0 || baseHeight === 0) return;

    // Define resolução interna do canvas = resolução base
    if (canvas.width !== baseWidth || canvas.height !== baseHeight) {
      canvas.width = baseWidth;
      canvas.height = baseHeight;
      
      console.log(`🎨 Canvas resolution set to: ${baseWidth}x${baseHeight}px`);
    }
  }, [baseWidth, baseHeight]);

  /**
   * Ajusta tamanho CSS do canvas para corresponder ao tamanho renderizado da imagem
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || baseWidth === 0 || baseHeight === 0) return;

    const resizeCanvas = () => {
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      const imageAspect = baseWidth / baseHeight;
      const containerAspect = containerWidth / containerHeight;

      let renderWidth: number, renderHeight: number;

      // Calcula tamanho de renderização (object-contain)
      if (containerAspect > imageAspect) {
        // Container mais largo - limita pela altura
        renderHeight = containerHeight;
        renderWidth = renderHeight * imageAspect;
      } else {
        // Container mais alto - limita pela largura
        renderWidth = containerWidth;
        renderHeight = renderWidth / imageAspect;
      }

      // Define tamanho CSS (não afeta resolução interna)
      canvas.style.width = `${renderWidth}px`;
      canvas.style.height = `${renderHeight}px`;

      // Redesenha após resize
      redrawAll();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [baseWidth, baseHeight, redrawAll]);

  /**
   * Redesenha quando elementos mudam
   */
  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  /**
   * Desenha stroke local (enquanto usuário está desenhando)
   * Usa requestAnimationFrame para performance
   */
  const drawCurrentStroke = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const points = currentStrokeRef.current;
    if (points.length < 2) return;

    // Desenha apenas o último segmento (incremental)
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
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    ctx.restore();
  }, [currentTool]);

  /**
   * Adiciona ponto ao stroke atual (com throttle via requestAnimationFrame)
   */
  const addPoint = useCallback((x: number, y: number) => {
    currentStrokeRef.current.push({ x, y });

    // Throttle usando requestAnimationFrame
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => {
        const now = performance.now();
        
        // Adicional throttle por tempo (16ms = ~60fps)
        if (now - lastRenderTimeRef.current >= 16) {
          drawCurrentStroke();
          lastRenderTimeRef.current = now;
        }
        
        animationFrameRef.current = null;
      });
    }
  }, [drawCurrentStroke]);

  /**
   * Finaliza stroke atual
   */
  const finishStroke = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    currentStrokeRef.current = [];
  }, []);

  /**
   * Limpa canvas
   */
  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  /**
   * Expõe métodos via ref
   */
  useImperativeHandle(ref, () => ({
    clear,
    redraw: redrawAll,
    addPoint,
    finishStroke,
    getCanvas: () => canvasRef.current
  }), [clear, redrawAll, addPoint, finishStroke]);

  /**
   * Converte posição do mouse/touch para coordenadas base
   * CRÍTICO: Esta conversão garante consistência entre dispositivos
   */
  const getCanvasCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    // 1. Posição relativa no canvas renderizado (0-1)
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;

    // 2. Ajusta pelo viewport (zoom e pan)
    const adjustedX = (relX - 0.5) / viewport.scale - (viewport.offsetX / viewport.scale / rect.width) + 0.5;
    const adjustedY = (relY - 0.5) / viewport.scale - (viewport.offsetY / viewport.scale / rect.height) + 0.5;

    // 3. Converte para coordenadas base (pixels da resolução natural)
    const baseX = adjustedX * baseWidth;
    const baseY = adjustedY * baseHeight;

    return { x: baseX, y: baseY };
  }, [viewport, baseWidth, baseHeight]);

  /**
   * Handlers de eventos de desenho
   */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (locked) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    currentStrokeRef.current = [coords];
    onDrawStart?.(coords.x, coords.y);
  }, [locked, getCanvasCoords, onDrawStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (locked || currentStrokeRef.current.length === 0) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    addPoint(coords.x, coords.y);
    onDrawMove?.(coords.x, coords.y);
  }, [locked, getCanvasCoords, addPoint, onDrawMove]);

  const handlePointerUp = useCallback(() => {
    if (locked || currentStrokeRef.current.length === 0) return;

    finishStroke();
    onDrawEnd?.();
  }, [locked, finishStroke, onDrawEnd]);

  /**
   * CSS transform para zoom/pan
   */
  const containerTransform = `
    scale(${viewport.scale})
    translate(${viewport.offsetX / viewport.scale}px, ${viewport.offsetY / viewport.scale}px)
  `;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: 'transparent' }}
    >
      <canvas
        ref={canvasRef}
        className="touch-none"
        style={{
          cursor: locked ? 'default' : cursor,
          transform: containerTransform,
          transformOrigin: 'center center',
          imageRendering: 'auto'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
});

WhiteboardCanvas.displayName = 'WhiteboardCanvas';
