import React, { useState } from 'react';

interface MessageFormProps {
  onSend: (message: string) => Promise<void>;
  onClear: () => Promise<void>;
  isLoading: boolean;
}

export function MessageForm({ onSend, onClear, isLoading }: MessageFormProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(message);
    setMessage('');
  };

  // Emojis rápidos
  const quickEmojis = [
    { emoji: '🤫', label: 'Silêncio' },
    { emoji: '🖕', label: 'Dedo do meio' },
    { emoji: '😊', label: 'Feliz' },
    { emoji: '👀', label: 'Olhos' },
    { emoji: '😛', label: 'Língua' },
    { emoji: '👍', label: 'Joinha' },
  ];

  const addEmoji = (emoji: string) => {
    setMessage(message + emoji);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite o comando ou mensagem..."
            className="admin-input h-12"
            disabled={isLoading}
            autoFocus
          />
          <div className="absolute right-3 top-3 text-[var(--admin-text-dim)] animate-pulse pointer-events-none">_</div>
      </div>
      
      {/* Quick Emojis */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-400 font-mono self-center mr-1">Emojis rápidos:</span>
        {quickEmojis.map((item) => (
          <button
            key={item.emoji}
            type="button"
            onClick={() => addEmoji(item.emoji)}
            disabled={isLoading}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:cursor-not-allowed border border-[var(--admin-border)] hover:border-cyan-600 rounded text-lg transition-all transform hover:scale-110 active:scale-95"
            title={item.label}
          >
            {item.emoji}
          </button>
        ))}
      </div>
      
      <div className="flex gap-4">
        <button 
          type="submit" 
          disabled={isLoading || !message.trim()}
          className="admin-btn admin-btn-primary flex-1"
        >
          {isLoading ? 'ENVIANDO...' : 'TRANSMITIR [ENTER]'}
        </button>
        
        <button 
          type="button" 
          onClick={onClear}
          disabled={isLoading}
          className="admin-btn admin-btn-danger"
          title="Limpar Terminal"
        >
          🗑 CLS
        </button>
      </div>
    </form>
  );
}
