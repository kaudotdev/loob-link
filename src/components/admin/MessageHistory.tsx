import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';

interface Message {
  id: string;
  content: string;
  timestamp: Timestamp;
}

interface MessageHistoryProps {
  messages: Message[];
  onEdit?: (id: string, newContent: string) => void;
  onDelete?: (id: string) => void;
}

export function MessageHistory({ messages, onEdit, onDelete }: MessageHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  const handleStartEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = (id: string) => {
    if (onEdit && editContent.trim()) {
      onEdit(id, editContent.trim());
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = (id: string, content: string) => {
    if (onDelete && confirm(`Tem certeza que deseja apagar esta mensagem?\n\n"${content}"`)) {
      onDelete(id);
    }
  };

  return (
    <section>
      <h2 className="text-gray-400 mb-4 text-sm uppercase tracking-wider border-b border-gray-700 pb-2">
        📜 Histórico do Terminal
      </h2>
      <div className="bg-black/50 rounded-lg p-4 max-h-64 overflow-y-auto border border-gray-800">
        {messages.length === 0 ? (
          <p className="text-gray-600 text-center italic">
            Nenhuma mensagem no terminal
          </p>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className="mb-2 text-sm group hover:bg-gray-800/30 rounded px-2 py-1 transition-colors"
            >
              {editingId === msg.id ? (
                // Modo de edição
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="bg-gray-900 border border-green-500 rounded px-2 py-1 text-green-400 text-sm focus:outline-none focus:border-green-400"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(msg.id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(msg.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                      title="Salvar (Enter)"
                    >
                      ✓ Salvar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                      title="Cancelar (Esc)"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo de visualização
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-green-600">
                      [{msg.timestamp?.toDate?.()?.toLocaleTimeString('pt-BR') || '...'}]
                    </span>
                    <span className="text-green-400 ml-2 break-words">{msg.content}</span>
                  </div>
                  {(onEdit || onDelete) && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {onEdit && (
                        <button
                          onClick={() => handleStartEdit(msg)}
                          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-xs rounded transition-colors"
                          title="Editar mensagem"
                        >
                          ✎
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => handleDelete(msg.id, msg.content)}
                          className="px-2 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs rounded transition-colors"
                          title="Apagar mensagem"
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
