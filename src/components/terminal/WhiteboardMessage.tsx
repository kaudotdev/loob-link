/**
 * WhiteboardMessage - Mensagem clicável no terminal
 * 
 * Semelhante ao Image3DMessage
 * Abre modal do whiteboard ao clicar
 * Cada template tem seu próprio canvas persistido
 */

'use client';

import { useState, useEffect } from 'react';
import { WhiteboardModal } from './WhiteboardModal';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface WhiteboardMessageProps {
  templateId: string;
  caption?: string;
}

export function WhiteboardMessage({ templateId, caption }: WhiteboardMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [locked, setLocked] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    if (!templateId) return;

    const templateRef = doc(db, 'whiteboard_templates', templateId);
    const unsubscribe = onSnapshot(
      templateRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBackgroundImage(data.backgroundImage || '');
          setLocked(data.locked || false);
          setTemplateName(data.name || 'Whiteboard');
        }
      },
      (error) => {
        console.error('Erro ao escutar template:', error);
      }
    );

    return () => unsubscribe();
  }, [templateId]);

  return (
    <>
      {/* Preview no terminal */}
      <div 
        className="inline-block cursor-pointer border border-cyan-500 rounded-lg p-3 hover:bg-cyan-500/10 transition-all"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 border border-cyan-500 rounded overflow-hidden">
            {backgroundImage ? (
              <img 
                src={backgroundImage} 
                alt="Whiteboard" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800" />
            )}
            <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
              <span className="text-2xl">✏️</span>
            </div>
          </div>
          <div className="text-left">
            <div className="text-cyan-500 font-bold text-sm">
              {locked ? '🔒 ' : '📝 '}{templateName.toUpperCase()}
            </div>
            <div className="text-cyan-500/60 text-xs mt-1">
              {locked ? 'Apenas visualização' : 'Clique para desenhar'}
            </div>
            {caption && (
              <div className="text-cyan-500/80 text-xs mt-1">
                {caption}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal expandido */}
      {isExpanded && (
        <WhiteboardModal 
          templateId={templateId}
          onClose={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}
