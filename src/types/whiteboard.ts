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
  tool: 'pen' | 'eraser';
  points: Point[];
  color: string;
  size: number;
  createdAt: Timestamp | Date;
}

/**
 * Text element no canvas
 */
export interface TextStroke {
  id: string;
  tool: 'text';
  text: string;
  position: Point;
  color: string;
  fontSize: number;
  createdAt: Timestamp | Date;
}

/**
 * Union type para todos os elementos do canvas
 */
export type CanvasElement = Stroke | TextStroke;

/**
 * Dados do stroke sem ID (para criação)
 */
export interface StrokeData {
  tool: 'pen' | 'eraser';
  points: Point[];
  color: string;
  size: number;
  createdAt: any; // serverTimestamp()
}

/**
 * Dados do texto sem ID (para criação)
 */
export interface TextData {
  tool: 'text';
  text: string;
  position: Point;
  color: string;
  fontSize: number;
  createdAt: any; // serverTimestamp()
}
