import React, { useState } from 'react';

interface TriggersPanelProps {
  onTrigger: (type: string, payload?: any) => void;
  isLoading: boolean;
}

export function TriggersPanel({ onTrigger, isLoading }: TriggersPanelProps) {
  const [duration, setDuration] = useState(5);

  const triggers = [
    { id: 'glitch', label: '👾 Invasão', color: 'text-purple-400 border-purple-400/50' },
    { id: 'vibrate', label: '📳 Proximidade', color: 'text-yellow-500 border-yellow-500/50' },
    { id: 'emp', label: '⚡ Interferência', color: 'text-blue-400 border-blue-400/50' },
    { id: 'denied', label: '🚫 Negado', color: 'text-red-500 border-red-500/50' },
    { id: 'granted', label: '✅ Autorizado', color: 'text-green-500 border-green-500/50' },
  ];

  const handleTrigger = (id: string) => {
    onTrigger(id, { duration: duration * 1000 });
  };

  return (
    <div className="space-y-4">
      
      <div className="flex items-center gap-2 text-xs text-[var(--admin-text-dim)] bg-[var(--admin-bg)] p-2 rounded border border-[var(--admin-border)]">
        <span>⏱️ Duração:</span>
        {[2, 5, 10, 30].map(s => (
          <button
            key={s}
            onClick={() => setDuration(s)}
            className={`px-2 py-0.5 rounded transition-colors ${duration === s ? 'bg-[var(--admin-accent)] text-black font-bold' : 'hover:bg-white/10'}`}
          >
            {s}s
          </button>
        ))}
        <span className="ml-auto font-mono text-[var(--admin-text)]">{duration}s</span>
      </div>

      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {triggers.map(t => (
          <button
            key={t.id}
            onClick={() => handleTrigger(t.id)}
            disabled={isLoading}
            className={`admin-btn ${t.color} hover:bg-white/5 text-xs py-3`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
