import React, { useState } from 'react';

interface MiniGamesPanelProps {
  onStartGame: (type: string, data: any) => void;
  isLoading: boolean;
}

export function MiniGamesPanel({ onStartGame, isLoading }: MiniGamesPanelProps) {
  const [targetWord, setTargetWord] = useState('');
  const [hint, setHint] = useState('');
  
  const [bruteSequence, setBruteSequence] = useState('HACK');
  const [bruteSpeed, setBruteSpeed] = useState(50);
  
  const [targetFreq, setTargetFreq] = useState(50);
  const [tolerance, setTolerance] = useState(5);

  const [activeTab, setActiveTab] = useState<'decrypt' | 'brute' | 'signal'>('decrypt');

  return (
    <div className="space-y-4">
        
        <div className="flex gap-2 border-b border-[var(--admin-border)] pb-2 text-xs">
            <button onClick={() => setActiveTab('decrypt')} className={`px-2 py-1 rounded ${activeTab === 'decrypt' ? 'bg-[var(--admin-surface)] text-white' : 'text-[var(--admin-text-dim)]'}`}>
                🔐 Decrypt
            </button>
            <button onClick={() => setActiveTab('brute')} className={`px-2 py-1 rounded ${activeTab === 'brute' ? 'bg-[var(--admin-surface)] text-white' : 'text-[var(--admin-text-dim)]'}`}>
                🔨 Brute Force
            </button>
            <button onClick={() => setActiveTab('signal')} className={`px-2 py-1 rounded ${activeTab === 'signal' ? 'bg-[var(--admin-surface)] text-white' : 'text-[var(--admin-text-dim)]'}`}>
                📡 Signal
            </button>
        </div>

        
        {activeTab === 'decrypt' && (
            <div className="space-y-3">
                <input 
                    type="text" 
                    value={targetWord} 
                    onChange={e => setTargetWord(e.target.value.toUpperCase())}
                    placeholder="SENHA ALVO (Ex: MAESTRO)"
                    className="admin-input w-full"
                />
                <input 
                    type="text" 
                    value={hint} 
                    onChange={e => setHint(e.target.value)}
                    placeholder="Dica (Opcional)"
                    className="admin-input w-full"
                />
                <button 
                    onClick={() => onStartGame('decryption', { target: targetWord, hint })}
                    disabled={!targetWord || isLoading}
                    className="admin-btn admin-btn-primary w-full"
                >
                    INICIAR DESCRIPTOGRAFIA
                </button>
            </div>
        )}

        
        {activeTab === 'brute' && (
            <div className="space-y-3">
                 <input 
                    type="text" 
                    value={bruteSequence} 
                    onChange={e => setBruteSequence(e.target.value.toUpperCase())}
                    placeholder="SEQUÊNCIA (Ex: A7X9)"
                    className="admin-input w-full"
                    maxLength={8}
                />
                 <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--admin-text-dim)]">Velocidade (ms):</span>
                    <input 
                        type="number" 
                        value={bruteSpeed} 
                        onChange={e => setBruteSpeed(Number(e.target.value))}
                        className="admin-input w-20"
                    />
                </div>
                <button 
                    onClick={() => onStartGame('bruteforce', { sequence: bruteSequence, speed: bruteSpeed })}
                    disabled={!bruteSequence || isLoading}
                    className="admin-btn admin-btn-primary w-full"
                >
                    INICIAR BRUTE FORCE
                </button>
            </div>
        )}

        
        {activeTab === 'signal' && (
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--admin-text-dim)]">Frequência Alvo (0-100):</span>
                    <input 
                         type="number" 
                         value={targetFreq} 
                         onChange={e => setTargetFreq(Number(e.target.value))}
                         className="admin-input w-20"
                    />
                </div>
                 <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--admin-text-dim)]">Tolerância:</span>
                    <input 
                         type="number" 
                         value={tolerance} 
                         onChange={e => setTolerance(Number(e.target.value))}
                         className="admin-input w-20"
                    />
                </div>
                <button 
                    onClick={() => onStartGame('signal', { targetFreq, tolerance })}
                    disabled={isLoading}
                    className="admin-btn admin-btn-primary w-full"
                >
                    INICIAR SINTONIA
                </button>
            </div>
        )}
    </div>
  );
}
