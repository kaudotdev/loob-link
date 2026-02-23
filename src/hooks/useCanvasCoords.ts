/**
 * Hook para conversão de coordenadas do canvas
 * 
 * CRÍTICO: Este hook garante que coordenadas sejam consistentes
 * entre TODOS os dispositivos (desktop, tablet, mobile)
 * 
 * Princípio:
 * - Canvas tem resolução fixa = resolução natural da imagem
 * - Coordenadas são SEMPRE salvas nessa resolução base
 * - Zoom/Pan são aplicados via CSS transform, não afetam os dados
 * - Conversão de mouse/touch -> coordenadas base é feita matematicamente
 * 
 * Isso garante que um traço desenhado no desktop apareça
 * EXATAMENTE na mesma posição no mobile.
 */

import { useCallback, RefObject } from 'react';
import { Viewport } from './useViewport';

export interface CanvasCoords {
  /** Converte posição da tela (clientX/Y) para coordenadas do canvas base */
  screenToCanvas: (clientX: number, clientY: number) => { x: number; y: number } | null;
  
  /** Converte coordenadas do canvas base para posição na tela */
  canvasToScreen: (canvasX: number, canvasY: number) => { x: number; y: number } | null;
  
  /** Retorna informações da transformação atual */
  getTransform: () => {
    baseWidth: number;
    baseHeight: number;
    scale: number;
    offsetX: number;
    offsetY: number;
  } | null;
}

export interface UseCanvasCoordsOptions {
  /** Referência ao elemento canvas */
  canvasRef: RefObject<HTMLCanvasElement>;
  /** Estado do viewport (zoom/pan) */
  viewport: Viewport;
  /** Largura base do canvas (resolução natural da imagem) */
  baseWidth: number;
  /** Altura base do canvas (resolução natural da imagem) */
  baseHeight: number;
}

/**
 * Hook para conversão de coordenadas considerando zoom e pan
 * 
 * Matemática:
 * 1. Obter posição relativa ao canvas na tela: relX = (clientX - rect.left) / rect.width
 * 2. Ajustar pelo zoom: ajustado = (rel - 0.5) / scale + 0.5
 * 3. Ajustar pelo pan: final = ajustado - (offset / scale / tamanho_renderizado)
 * 4. Converter para coordenadas base: baseX = final * BASE_WIDTH
 */
export function useCanvasCoords({
  canvasRef,
  viewport,
  baseWidth,
  baseHeight
}: UseCanvasCoordsOptions): CanvasCoords {
  
  /**
   * Converte coordenadas da tela para coordenadas do canvas base
   * 
   * Esta é a função CRÍTICA para garantir consistência entre dispositivos.
   * 
   * Fluxo:
   * clientX, clientY (posição do mouse/touch na tela)
   *   ↓
   * posição relativa no canvas renderizado (0-1)
   *   ↓
   * ajuste por zoom e pan
   *   ↓
   * coordenadas base (0 a baseWidth/baseHeight)
   * 
   * @param clientX - Posição X do mouse/touch (screenX)
   * @param clientY - Posição Y do mouse/touch (screenY)
   * @returns Coordenadas no canvas base ou null se inválido
   */
  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || baseWidth === 0 || baseHeight === 0) return null;

    // Pega dimensões do canvas RENDERIZADO na tela (com CSS)
    const rect = canvas.getBoundingClientRect();

    // 1. Posição relativa no canvas renderizado (0-1)
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;

    // 2. Ajusta pelo viewport (zoom e pan)
    // Fórmula: inverte a transformação aplicada pelo CSS
    // (rel - 0.5) / scale - (offset / scale / tamanho_renderizado) + 0.5
    const adjustedX = (relX - 0.5) / viewport.scale - (viewport.offsetX / viewport.scale / rect.width) + 0.5;
    const adjustedY = (relY - 0.5) / viewport.scale - (viewport.offsetY / viewport.scale / rect.height) + 0.5;

    // 3. Converte para coordenadas base (pixels da resolução natural)
    const baseX = adjustedX * baseWidth;
    const baseY = adjustedY * baseHeight;

    return { x: baseX, y: baseY };
  }, [canvasRef, baseWidth, baseHeight, viewport]);

  /**
   * Converte coordenadas do canvas base para posição na tela
   * (útil para desenhar cursores de outros usuários, etc)
   */
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || baseWidth === 0 || baseHeight === 0) return null;

    const rect = canvas.getBoundingClientRect();

    // 1. Normaliza para 0-1
    const normX = canvasX / baseWidth;
    const normY = canvasY / baseHeight;

    // 2. Aplica viewport transform
    const viewX = (normX - 0.5) * viewport.scale + viewport.offsetX / rect.width + 0.5;
    const viewY = (normY - 0.5) * viewport.scale + viewport.offsetY / rect.height + 0.5;

    // 3. Converte para pixels da tela
    const screenX = rect.left + viewX * rect.width;
    const screenY = rect.top + viewY * rect.height;

    return { x: screenX, y: screenY };
  }, [canvasRef, baseWidth, baseHeight, viewport]);

  /**
   * Retorna informações da transformação atual
   * (útil para debug)
   */
  const getTransform = useCallback(() => {
    if (baseWidth === 0 || baseHeight === 0) return null;

    return {
      baseWidth,
      baseHeight,
      scale: viewport.scale,
      offsetX: viewport.offsetX,
      offsetY: viewport.offsetY
    };
  }, [baseWidth, baseHeight, viewport]);

  return {
    screenToCanvas,
    canvasToScreen,
    getTransform
  };
}
