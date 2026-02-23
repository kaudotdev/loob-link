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
  const lastDrawnIndexRef = useRef<number>(0);
  const activeTouchesRef = useRef<number>(0);
  const isDrawingRef = useRef<boolean>(false);

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

    // Redesenha o stroke atual se houver
    const currentPoints = currentStrokeRef.current;
    if (currentPoints.length > 0) {
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
      
      const startPoint = currentPoints[0];
      ctx.moveTo(startPoint.x, startPoint.y);
      
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      
      ctx.stroke();
      ctx.restore();

      // Marca todos os pontos do stroke atual como já desenhados
      lastDrawnIndexRef.current = currentPoints.length;
    }
  }, [elements, baseWidth, baseHeight, currentTool]);

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
   * Otimizado: desenha apenas novos segmentos desde último frame
   */
  const drawCurrentStroke = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const points = currentStrokeRef.current;
    const lastDrawnIndex = lastDrawnIndexRef.current;
    
    // Se não há novos pontos, não faz nada
    if (points.length <= lastDrawnIndex) return;

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
    
    // Começa do último ponto desenhado (ou do início se for o primeiro)
    if (lastDrawnIndex === 0 && points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      lastDrawnIndexRef.current = 1;
    } else if (lastDrawnIndex > 0) {
      ctx.moveTo(points[lastDrawnIndex - 1].x, points[lastDrawnIndex - 1].y);
    }
    
    // Desenha apenas os novos segmentos
    for (let i = lastDrawnIndex; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
    ctx.restore();
    
    // Atualiza índice do último ponto desenhado
    lastDrawnIndexRef.current = points.length;
  }, [currentTool]);

  /**
   * Adiciona ponto ao stroke atual
   * Usa requestAnimationFrame para suavidade sem throttle agressivo
   */
  const addPoint = useCallback((x: number, y: number) => {
    currentStrokeRef.current.push({ x, y });

    // Usa requestAnimationFrame para desenhar no próximo frame
    // Sem throttle adicional - captura todos os pontos
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(() => {
        drawCurrentStroke();
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
    lastDrawnIndexRef.current = 0;
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
   * 
   * O canvas tem transform CSS aplicado: scale(S) translate(Tx/S, Ty/S)
   * Precisamos desfazer esse transform para obter coordenadas corretas
   */
  const getCanvasCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Rect com transform aplicado
    const rect = canvas.getBoundingClientRect();
    
    // Tamanho CSS do canvas (antes do transform)
    const cssWidth = parseFloat(canvas.style.width || '0');
    const cssHeight = parseFloat(canvas.style.height || '0');
    
    if (cssWidth === 0 || cssHeight === 0) return null;

    // Centro do canvas (no espaço da tela, com transform)
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Posição relativa ao centro (no espaço transformado)
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Desfaz o scale (divide pela escala)
    const unscaledDx = dx / viewport.scale;
    const unscaledDy = dy / viewport.scale;

    // Desfaz o translate
    const finalDx = unscaledDx - viewport.offsetX;
    const finalDy = unscaledDy - viewport.offsetY;

    // Volta para coordenadas absolutas (espaço CSS do canvas)
    const canvasCenterX = cssWidth / 2;
    const canvasCenterY = cssHeight / 2;
    
    const canvasX = canvasCenterX + finalDx;
    const canvasY = canvasCenterY + finalDy;

    // Converte para coordenadas base (normaliza e multiplica pela resolução interna)
    const relX = canvasX / cssWidth;
    const relY = canvasY / cssHeight;

    const baseX = relX * baseWidth;
    const baseY = relY * baseHeight;

    return { x: baseX, y: baseY };
  }, [viewport, baseWidth, baseHeight]);

  /**
   * Handlers de eventos de desenho
   */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (locked) return;
    
    // Incrementa contador de toques ativos
    activeTouchesRef.current++;
    
    // Só desenha se for 1 toque apenas
    if (activeTouchesRef.current > 1) {
      // Múltiplos toques - cancela desenho se estava em andamento
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        currentStrokeRef.current = [];
        lastDrawnIndexRef.current = 0;
      }
      return;
    }
    
    // Previne scroll no mobile
    e.preventDefault();

    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    isDrawingRef.current = true;
    currentStrokeRef.current = [coords];
    lastDrawnIndexRef.current = 0;
    onDrawStart?.(coords.x, coords.y);
  }, [locked, getCanvasCoords, onDrawStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (locked) return;
    
    // Não desenha se houver múltiplos toques ou se não estiver desenhando
    if (activeTouchesRef.current > 1 || !isDrawingRef.current || currentStrokeRef.current.length === 0) {
      return;
    }
    
    // Previne scroll no mobile
    e.preventDefault();

    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;

    addPoint(coords.x, coords.y);
    onDrawMove?.(coords.x, coords.y);
  }, [locked, getCanvasCoords, addPoint, onDrawMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // Decrementa contador de toques ativos
    activeTouchesRef.current = Math.max(0, activeTouchesRef.current - 1);
    
    if (locked || !isDrawingRef.current || currentStrokeRef.current.length === 0) return;

    // Só finaliza se não houver mais toques ativos
    if (activeTouchesRef.current === 0) {
      isDrawingRef.current = false;
      finishStroke();
      onDrawEnd?.();
    }
  }, [locked, finishStroke, onDrawEnd]);

  const handlePointerCancel = useCallback(() => {
    // Cancela desenho e reseta contadores
    activeTouchesRef.current = 0;
    isDrawingRef.current = false;
    
    if (currentStrokeRef.current.length > 0) {
      finishStroke();
    }
  }, [finishStroke]);

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
        style={{
          cursor: locked ? 'default' : cursor,
          transform: containerTransform,
          transformOrigin: 'center center',
          imageRendering: 'auto',
          touchAction: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
    </div>
  );
});

WhiteboardCanvas.displayName = 'WhiteboardCanvas';
