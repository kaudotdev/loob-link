import React, { useState } from 'react';

interface MediaPollPanelProps {
  onSendMedia: (url: string, caption: string) => void;
  onSendPoll: (question: string, options: string[]) => void;
  isLoading: boolean;
}

export function MediaPollPanel({ onSendMedia, onSendPoll, isLoading }: MediaPollPanelProps) {
  const [activeTab, setActiveTab] = useState<'media' | 'poll'>('media');

    const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');

    const [question, setQuestion] = useState('');
  const [option1, setOption1] = useState('SIM');
  const [option2, setOption2] = useState('NÃO');

  const handleSendMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    onSendMedia(imageUrl, caption);
    setImageUrl('');
    setCaption('');
  };

  const handleSendPoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !option1 || !option2) return;
    onSendPoll(question, [option1, option2]);
    setQuestion('');
    setOption1('SIM');
    setOption2('NÃO');
  };

  return (
    <div>
      <div className="flex gap-4 mb-4 border-b border-[var(--admin-border)] pb-2">
        <button 
          onClick={() => setActiveTab('media')}
          className={`text-xs uppercase tracking-wider font-bold transition-colors ${activeTab === 'media' ? 'text-[var(--admin-text)]' : 'text-[var(--admin-text-dim)] hover:text-white'}`}
        >
          🖼️ Mídia
        </button>
        <button 
          onClick={() => setActiveTab('poll')}
          className={`text-xs uppercase tracking-wider font-bold transition-colors ${activeTab === 'poll' ? 'text-[var(--admin-text)]' : 'text-[var(--admin-text-dim)] hover:text-white'}`}
        >
          📊 Enquete
        </button>
      </div>

      {activeTab === 'media' ? (
        <form onSubmit={handleSendMedia} className="space-y-4">
          <input 
            type="text" 
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="URL da Imagem (https://...)"
            className="admin-input"
          />
          <input 
            type="text" 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Legenda (Opcional)"
            className="admin-input"
          />
          <button 
            type="submit" 
            disabled={isLoading || !imageUrl}
            className="admin-btn admin-btn-primary w-full"
          >
            ENVIAR IMAGEM
          </button>
        </form>
      ) : (
        <form onSubmit={handleSendPoll} className="space-y-4">
          <input 
            type="text" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pergunta da Enquete"
            className="admin-input"
          />
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              value={option1}
              onChange={(e) => setOption1(e.target.value)}
              className="admin-input"
            />
            <input 
              type="text" 
              value={option2}
              onChange={(e) => setOption2(e.target.value)}
              className="admin-input"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading || !question}
            className="admin-btn admin-btn-primary w-full"
          >
            CRIAR DECISÃO
          </button>
        </form>
      )}
    </div>
  );
}
