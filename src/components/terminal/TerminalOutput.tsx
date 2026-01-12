import React, { useEffect, useRef } from 'react';
import { Timestamp } from 'firebase/firestore';
import { TerminalMessageItem } from './TerminalMessageItem';


interface TerminalOutputProps {
  messages: any[];
  displayedMessages: Map<string, string>;
  bootSequence: (string | React.ReactNode)[];
  showBootText: boolean;
  isTyping: boolean;
}

export function TerminalOutput({ 
  messages, 
  displayedMessages, 
  bootSequence, 
  showBootText, 
  isTyping 
}: TerminalOutputProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  
  return (
    <div ref={terminalRef} className="terminal-container">
      
      {bootSequence.map((line, index) => (
        <div 
          key={`boot-${index}`} 
          className="message-line text-glow"
        >
          {line}
        </div>
      ))}

      
      {showBootText && messages.length > 0 && (
        <div className="message-line text-glow my-6">
          ═══════════════════════════════════════
        </div>
      )}

      
      {messages.map((message) => (
         <TerminalMessageItem 
           key={message.id}
           message={message}
           displayedContent={displayedMessages.get(message.id) || ''}
           formatTime={formatTime}
         />
      ))}

      
      {!isTyping && showBootText && (
        <div className="message-line mt-4">
          <span className="message-prompt">_</span>
          <span className="cursor-blink text-glow" />
        </div>
      )}
    </div>
  );
}
