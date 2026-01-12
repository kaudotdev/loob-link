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
