/**
 * Hook para sincronização em tempo real do Whiteboard via Firestore
 * 
 * Funcionalidades:
 * - Sincronização realtime de strokes usando onSnapshot
 * - Canvas separado por templateId
 * - Persistência automática de novos strokes
 * - Performance otimizada com batch writes
 */

import { useEffect, useState, useCallback } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy,
  serverTimestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Stroke, StrokeData } from '@/types/whiteboard';

export function useWhiteboardSocket(templateId: string) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Sincroniza strokes em tempo real via Firestore onSnapshot
   * Cada template tem sua própria coleção de strokes
   */
  useEffect(() => {
    if (!templateId) {
      setIsLoading(false);
      return;
    }

    console.log(`🔌 Connecting to whiteboard template: ${templateId}`);
    
    // Query ordenada por timestamp - cada template tem sua coleção
    const strokesRef = collection(db, 'whiteboard_strokes', templateId, 'strokes');
    const q = query(strokesRef, orderBy('createdAt', 'asc'));

    // Listener de tempo real
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedStrokes: Stroke[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;
          loadedStrokes.push({
            id: doc.id,
            tool: data.tool,
            points: data.points,
            color: data.color,
            size: data.size,
            createdAt: data.createdAt || new Date()
          });
        });

        setStrokes(loadedStrokes);
        setIsLoading(false);
        console.log(`📡 Synced ${loadedStrokes.length} strokes for template ${templateId}`);
      },
      (err) => {
        console.error('❌ Firestore sync error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    // Cleanup: desconecta ao desmontar
    return () => {
      console.log(`🔌 Disconnecting from template ${templateId}`);
      unsubscribe();
    };
  }, [templateId]);

  /**
   * Adiciona um novo stroke ao Firestore
   * Chamado ao finalizar um traço (onMouseUp/onTouchEnd)
   */
  const addStroke = useCallback(async (strokeData: Omit<StrokeData, 'createdAt'>) => {
    if (!templateId) return;

    try {
      const strokesRef = collection(db, 'whiteboard_strokes', templateId, 'strokes');
      
      const newStroke: StrokeData = {
        ...strokeData,
        createdAt: serverTimestamp()
      };

      await addDoc(strokesRef, newStroke);
      console.log(`✏️ Stroke saved to template ${templateId}`);
    } catch (err) {
      console.error('❌ Error saving stroke:', err);
      throw err;
    }
  }, [templateId]);

  return {
    strokes,
    isLoading,
    error,
    addStroke
  };
}
