import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface PollMessageProps {
  id: string;   question: string;
  options: string[];
  onVote?: (option: string) => void;
}

export function PollMessage({ id, question, options, onVote }: PollMessageProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [hasVoted, setHasVoted] = useState<string | null>(null);

  useEffect(() => {
    const storageKey = `poll_vote_${id}`;
    const vote = localStorage.getItem(storageKey);
    if (vote) {
        setHasVoted(vote);
    }
  }, [id]);

  const handleVote = async (option: string) => {
    if (hasVoted || isSending) return;
    
    setIsSending(true);
    setSelectedOption(option);

    try {
      let userId = localStorage.getItem('loob_user_id');
      if (!userId) {
        userId = 'anon_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('loob_user_id', userId);
      }

      await addDoc(collection(db, 'poll_votes'), {
        pollId: id,
        option,
        userId,
        timestamp: serverTimestamp()
      });

      const storageKey = `poll_vote_${id}`;
      localStorage.setItem(storageKey, option);
      setHasVoted(option);
      if (onVote) onVote(option);

    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsSending(false);
    }
  };

  const displayedOption = hasVoted || selectedOption;

  return (
    <div className="my-4 border-l-2 pl-4 py-2 max-w-md" style={{ borderColor: 'var(--terminal-color)', backgroundColor: 'var(--terminal-dim)' }}>
      <div className="text-glow mb-3 font-bold" style={{ color: 'var(--terminal-color)' }}>{question}</div>
      <div className="flex flex-col gap-2">
        {options.map((opt, idx) => {
           const isSelected = displayedOption === opt;
           const isDisabled = !!displayedOption;

           return (
            <button
              key={idx}
              onClick={() => handleVote(opt)}
              disabled={isDisabled}
              className={`
                text-left px-4 py-2 border rounded
                transition-all duration-300 font-mono text-sm
              `}
              style={{
                borderColor: isSelected ? 'var(--terminal-color)' : 'rgba(255,255,255,0.1)',
                backgroundColor: isSelected ? 'var(--terminal-color)' : 'transparent',
                color: isSelected ? 'black' : 'var(--terminal-color)',
                opacity: (isDisabled && !isSelected) ? 0.5 : 1,
                cursor: (isDisabled && !isSelected) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSelected ? `[x] ${opt}` : `[ ] ${opt}`}
            </button>
           );
        })}
      </div>
      {displayedOption && (
        <div className="mt-2 text-xs animate-pulse" style={{ color: 'var(--terminal-color)' }}>
          &gt; RESPOSTA TRANSMITIDA. AGUARDANDO COMANDO...
        </div>
      )}
    </div>
  );
}
