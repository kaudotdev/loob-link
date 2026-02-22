/**
 * Tipos para o Whiteboard Colaborativo em Tempo Real
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Ponto no canvas (coordenadas relativas 0-1)
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Tipo de ferramenta do whiteboard
 */
export type Tool = 'pen' | 'eraser';

/**
 * Stroke (traço) desenhado no canvas
 */
export interface Stroke {
  id: string;
  tool: Tool;
  points: Point[];
  color: string;
  size: number;
  createdAt: Timestamp | Date;
}

/**
 * Dados do stroke sem ID (para criação)
 */
export interface StrokeData {
  tool: Tool;
  points: Point[];
  color: string;
  size: number;
  createdAt: any; // serverTimestamp()
}
