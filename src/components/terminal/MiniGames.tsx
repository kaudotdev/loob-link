import React, { useState, useEffect, useRef, useCallback } from 'react';

interface DecryptionGameProps {
  onComplete: () => void;
  data: { target: string; hint?: string };
}

interface SignalGameProps {
  onComplete: () => void;
  data: { targetFreq: number; tolerance?: number }; }

interface BruteForceGameProps {
  onComplete: () => void;
  data: { sequence: string; speed?: number };
}

function DecryptionGame({ onComplete, data }: DecryptionGameProps) {
    const [guess, setGuess] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const input = guess.toUpperCase().trim();
        if (input === data.target.toUpperCase()) {
            setLogs(prev => [...prev, `> SENHA ACEITA: ${input}`]);
            setTimeout(onComplete, 1000);
        } else {
            setLogs(prev => [...prev, `> ERRO: ${input} INVÁLIDO`]);
            setGuess('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center font-mono p-4">
            <div className="w-full max-w-md border border-green-500 p-6 rounded shadow-[0_0_20px_rgba(0,255,0,0.2)]">
                <h2 className="text-xl text-green-500 mb-4 border-b border-green-500/30 pb-2">🔐 DESCRIPTOGRAFIA</h2>
                {data.hint && <div className="text-gray-400 text-sm mb-4">DICA: {data.hint}</div>}
                
                <div className="bg-black/50 p-4 h-48 overflow-y-auto mb-4 border border-green-500/20 rounded font-xs text-green-400">
                    {logs.map((l, i) => <div key={i}>{l}</div>)}
                    {logs.length === 0 && <div className="opacity-50">Aguardo input...</div>}
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2">
                    <span className="text-green-500 py-2">{'>'}</span>
                    <input 
                        autoFocus
                        type="text" 
                        value={guess}
                        onChange={e => setGuess(e.target.value)}
                        className="flex-1 bg-transparent border-b border-green-500 text-green-500 outline-none uppercase py-2"
                        placeholder="DIGITE A SENHA"
                    />
                    <button type="submit" className="bg-green-900/30 text-green-500 px-4 rounded border border-green-500/50 hover:bg-green-500/20">
                        ENTER
                    </button>
                </form>
            </div>
        </div>
    );
}

function SignalGame({ onComplete, data }: SignalGameProps) {
    const [freq, setFreq] = useState(50);     const [strength, setStrength] = useState(0);
    const target = data.targetFreq || Math.floor(Math.random() * 80) + 10;
    const tolerance = data.tolerance || 5;
    
    useEffect(() => {
        const diff = Math.abs(freq - target);
                const s = Math.max(0, 100 - (diff * 5));
        setStrength(s);
    }, [freq, target]);

    const handleUnlock = () => {
        if (strength > 90) {             onComplete();
        }
    };

    return (
         <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center font-mono p-4">
            <div className="w-full max-w-lg border border-blue-500 p-6 rounded shadow-[0_0_20px_rgba(0,100,255,0.2)]">
                <h2 className="text-xl text-blue-400 mb-2">📡 SINTONIA DE SINAL</h2>
                <p className="text-xs text-blue-300/70 mb-8">Ajuste a frequência até o sinal estabilizar.</p>

                
                <div className="h-24 bg-black border border-blue-500/30 mb-6 relative overflow-hidden flex items-end justify-center gap-1">
                    {Array.from({ length: 20 }).map((_, i) => (
                         <div 
                            key={i} 
                            style={{ 
                                height: `${Math.random() * (strength + 10)}%`,
                                opacity: strength > 90 ? 1 : 0.3
                            }}
                            className="w-2 bg-blue-500 transition-all duration-75"
                         />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-4xl font-bold tracking-widest transition-colors ${strength > 90 ? 'text-white' : 'text-transparent'}`}>
                            {strength > 90 ? 'LOCKED' : 'NO SIGNAL'}
                        </span>
                    </div>
                </div>

                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="0.5"
                    value={freq} 
                    onChange={e => setFreq(parseFloat(e.target.value))}
                    className="w-full mb-6 accent-blue-500 h-2 bg-blue-900/30 rounded-lg appearance-none cursor-pointer"
                />

                <div className="text-center">
                    <button 
                        onClick={handleUnlock}
                        disabled={strength <= 90}
                        className={`w-full py-3 font-bold tracking-wider border rounded transition-all
                            ${strength > 90 
                                ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_blue] animate-pulse' 
                                : 'bg-transparent text-blue-800 border-blue-900 cursor-not-allowed'}`}
                    >
                        {strength > 90 ? 'ESTABELECER CONEXÃO' : 'SINAL FRACO'}
                    </button>
                    <div className="mt-2 text-xs text-blue-500/50 font-mono">FREQ: {freq.toFixed(1)}Hz</div>
                </div>
            </div>
        </div>
    );
}

function BruteForceGame({ onComplete, data }: BruteForceGameProps) {
    const sequence = data.sequence || "HACK";
    const [currentIndex, setCurrentIndex] = useState(0);
    const [cyclingChar, setCyclingChar] = useState('A');
    const [shake, setShake] = useState(false);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    useEffect(() => {
        const interval = setInterval(() => {
            setCyclingChar(chars[Math.floor(Math.random() * chars.length)]);
        }, data.speed || 50); 
        return () => clearInterval(interval);
    }, [data.speed]);

    const handleLock = () => {
                                        
                                                
                                
                                                
        if (cyclingChar === sequence[currentIndex]) {
             if (currentIndex + 1 === sequence.length) {
                 onComplete();
             } else {
                 setCurrentIndex(prev => prev + 1);
             }
        } else {
             setShake(true);
             setTimeout(() => setShake(false), 500);
        }
    };
    
                useEffect(() => {
         const timer = setInterval(() => {
                          if (Math.random() < 0.2) {
                 setCyclingChar(sequence[currentIndex]);
             } else {
                 setCyclingChar(chars[Math.floor(Math.random() * chars.length)]);
             }
         }, 100);          return () => clearInterval(timer);
    }, [currentIndex, sequence]);

    return (
         <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center font-mono p-4 select-none">
            <div className={`w-full max-w-sm border border-red-500 p-8 rounded text-center ${shake ? 'animate-shake' : ''}`}>
                <h2 className="text-2xl text-red-500 mb-8 tracking-widest">BRUTE FORCE</h2>
                
                <div className="flex justify-center gap-4 text-4xl mb-12 font-bold text-white">
                    
                    {sequence.split('').map((char, i) => (
                        <div key={i} className={`w-12 h-16 flex items-center justify-center border-2 rounded
                            ${i < currentIndex 
                                ? 'border-red-500 bg-red-900/20 text-red-500 shadow-[0_0_15px_red]' 
                                : i === currentIndex 
                                    ? 'border-white bg-white/10 text-white' 
                                    : 'border-red-900 text-red-900/30'
                            }`}
                        >
                            {i < currentIndex ? char : (i === currentIndex ? cyclingChar : '?')}
                        </div>
                    ))}
                </div>

                <div className="text-sm text-red-400/50 mb-4">
                    CLIQUE QUANDO O CARACTERE FOR: <span className="text-white font-bold text-xl ml-2">{sequence[currentIndex]}</span>
                </div>

                <button 
                    onClick={handleLock}                     className="w-full py-6 bg-red-600 hover:bg-red-500 text-white font-bold text-xl rounded shadow-[0_0_20px_rgba(255,0,0,0.4)] active:scale-95 transition-transform"
                >
                    LOCK_BIT()
                </button>
            </div>
             <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.2s ease-in-out; }
            `}</style>
        </div>
    );
}


export function ActiveMiniGame({ game, onResult }: { game: { id: string, type: string, data: any }, onResult: (success: boolean) => void }) {
    if (game.type === 'decryption') {
        return <DecryptionGame data={game.data} onComplete={() => onResult(true)} />;
    }
    if (game.type === 'signal') {
        return <SignalGame data={game.data} onComplete={() => onResult(true)} />;
    }
    if (game.type === 'bruteforce') {
        return <BruteForceGame data={game.data} onComplete={() => onResult(true)} />;
    }
    return null; 
}
