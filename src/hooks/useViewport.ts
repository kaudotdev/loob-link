/**
 * Hook para gerenciar viewport com zoom e pan
 * Implementação estilo Figma/Excalidraw
 * 
 * Funcionalidades:
 * - Zoom com scroll wheel (foca no cursor)
 * - Zoom com pinch (mobile)
 * - Zoom com botões +/-
 * - Pan com arrastar (espaço + drag ou botão do meio)
 * - Limites de zoom configuráveis
 * - Reset para posição inicial
 */

import { useState, useCallback, useRef } from 'react';

export interface Viewport {
  /** Escala do zoom (1 = 100%, 2 = 200%, 0.5 = 50%) */
  scale: number;
  /** Offset X em pixels */
  offsetX: number;
  /** Offset Y em pixels */
  offsetY: number;
}

export interface ViewportControls {
  /** Estado atual do viewport */
  viewport: Viewport;
  /** Aplica zoom focado em um ponto específico */
  zoomAt: (deltaScale: number, pointX: number, pointY: number) => void;
  /** Zoom in (aumenta 20%) */
  zoomIn: () => void;
  /** Zoom out (diminui 20%) */
  zoomOut: () => void;
  /** Pan (mover viewport) */
  pan: (deltaX: number, deltaY: number) => void;
  /** Reset para posição inicial */
  reset: () => void;
  /** Define zoom específico */
  setZoom: (scale: number) => void;
  /** Handlers de eventos */
  handleWheel: (e: WheelEvent) => void;
  handlePinchStart: (distance: number, centerX: number, centerY: number) => void;
  handlePinchMove: (distance: number, centerX: number, centerY: number) => void;
  handlePinchEnd: () => void;
}

export interface UseViewportOptions {
  /** Zoom mínimo (padrão: 0.1 = 10%) */
  minScale?: number;
  /** Zoom máximo (padrão: 10 = 1000%) */
  maxScale?: number;
  /** Sensibilidade do zoom com scroll (padrão: 0.002) */
  scrollSensitivity?: number;
  /** Incremento do zoom com botões +/- (padrão: 0.2 = 20%) */
  zoomIncrement?: number;
}

export function useViewport(options: UseViewportOptions = {}): ViewportControls {
  const {
    minScale = 0.1,
    maxScale = 10,
    scrollSensitivity = 0.002,
    zoomIncrement = 0.2
  } = options;

  const [viewport, setViewport] = useState<Viewport>({
    scale: 1,
    offsetX: 0,
    offsetY: 0
  });

  // Armazena estado do pinch para cálculos incrementais
  const pinchRef = useRef<{
    initialDistance: number;
    initialScale: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  /**
   * Aplica zoom focado em um ponto específico
   * O ponto permanece fixo na tela durante o zoom
   * 
   * @param deltaScale - Mudança na escala (ex: 0.1 para +10%, -0.1 para -10%)
   * @param pointX - Coordenada X do ponto de foco (em pixels da tela)
   * @param pointY - Coordenada Y do ponto de foco (em pixels da tela)
   */
  const zoomAt = useCallback((deltaScale: number, pointX: number, pointY: number) => {
    setViewport(prev => {
      const newScale = Math.max(minScale, Math.min(maxScale, prev.scale + deltaScale));
      
      // Se já está no limite, não faz nada
      if (newScale === prev.scale) return prev;

      // Calcula novo offset para manter o ponto fixo
      // Fórmula: novo_offset = ponto - (ponto - offset_antigo) * (nova_escala / escala_antiga)
      const scaleRatio = newScale / prev.scale;
      const newOffsetX = pointX - (pointX - prev.offsetX) * scaleRatio;
      const newOffsetY = pointY - (pointY - prev.offsetY) * scaleRatio;

      return {
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      };
    });
  }, [minScale, maxScale]);

  /**
   * Zoom in (aumenta escala)
   */
  const zoomIn = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      scale: Math.min(maxScale, prev.scale * (1 + zoomIncrement))
    }));
  }, [maxScale, zoomIncrement]);

  /**
   * Zoom out (diminui escala)
   */
  const zoomOut = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      scale: Math.max(minScale, prev.scale * (1 - zoomIncrement))
    }));
  }, [minScale, zoomIncrement]);

  /**
   * Pan (move o viewport)
   * 
   * @param deltaX - Movimento em X (pixels)
   * @param deltaY - Movimento em Y (pixels)
   */
  const pan = useCallback((deltaX: number, deltaY: number) => {
    setViewport(prev => ({
      ...prev,
      offsetX: prev.offsetX + deltaX,
      offsetY: prev.offsetY + deltaY
    }));
  }, []);

  /**
   * Reset para posição inicial (zoom 100%, sem offset)
   */
  const reset = useCallback(() => {
    setViewport({
      scale: 1,
      offsetX: 0,
      offsetY: 0
    });
  }, []);

  /**
   * Define zoom específico (mantém centro)
   */
  const setZoom = useCallback((scale: number) => {
    setViewport(prev => ({
      ...prev,
      scale: Math.max(minScale, Math.min(maxScale, scale))
    }));
  }, [minScale, maxScale]);

  /**
   * Handler para scroll wheel (zoom focado no cursor)
   */
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    // Calcula delta do zoom baseado em deltaY do scroll
    const deltaScale = -e.deltaY * scrollSensitivity;

    // Aplica zoom focado na posição do cursor
    zoomAt(deltaScale, e.clientX, e.clientY);
  }, [scrollSensitivity, zoomAt]);

  /**
   * Inicia pinch zoom (dois dedos no mobile)
   */
  const handlePinchStart = useCallback((distance: number, centerX: number, centerY: number) => {
    pinchRef.current = {
      initialDistance: distance,
      initialScale: viewport.scale,
      centerX,
      centerY
    };
  }, [viewport.scale]);

  /**
   * Move pinch zoom
   */
  const handlePinchMove = useCallback((distance: number, centerX: number, centerY: number) => {
    if (!pinchRef.current) return;

    const { initialDistance, initialScale, centerX: initialCenterX, centerY: initialCenterY } = pinchRef.current;

    // Calcula nova escala baseada na mudança de distância
    const scaleMultiplier = distance / initialDistance;
    const newScale = Math.max(minScale, Math.min(maxScale, initialScale * scaleMultiplier));

    // Atualiza viewport mantendo o centro do pinch fixo
    setViewport(prev => {
      const scaleRatio = newScale / prev.scale;
      const newOffsetX = centerX - (centerX - prev.offsetX) * scaleRatio;
      const newOffsetY = centerY - (centerY - prev.offsetY) * scaleRatio;

      return {
        scale: newScale,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      };
    });
  }, [minScale, maxScale]);

  /**
   * Finaliza pinch zoom
   */
  const handlePinchEnd = useCallback(() => {
    pinchRef.current = null;
  }, []);

  return {
    viewport,
    zoomAt,
    zoomIn,
    zoomOut,
    pan,
    reset,
    setZoom,
    handleWheel,
    handlePinchStart,
    handlePinchMove,
    handlePinchEnd
  };
}
