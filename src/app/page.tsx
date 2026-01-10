'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';

interface Message {
  id: string;
  content: string;
  timestamp: Timestamp;
}

export default function TerminalPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBooted, setIsBooted] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState<Map<string, string>>(new Map());
  const [isTyping, setIsTyping] = useState(false);
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  const [showBootText, setShowBootText] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  const vibrate = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  }, []);

  const runBootSequence = useCallback(async () => {
    const bootLines = [
      '> INITIALIZING L00B LINK v2.4.7...',
      '> ESTABLISHING SECURE CONNECTION...',
      '> BYPASSING FIREWALL... [OK]',
      '> DECRYPTING CHANNEL... [OK]',
      '> HANDSHAKE COMPLETE',
      '> AWAITING TRANSMISSION...',
      '',
      '████████████████████████████████████████',
      '█                                      █',
      '█     ██       ████   ████  ██████     █',
      '█     ██      ██  ██ ██  ██ ██   ██    █',
      '█     ██      ██  ██ ██  ██ ██████     █',
      '█     ██████   ████   ████  ██████     █',
      '█                                      █',
      '█           [ LINK ACTIVE ]            █',
      '█                                      █',
      '████████████████████████████████████████',
      '',
      '> LISTENING ON ENCRYPTED CHANNEL...',
    ];

    for (let i = 0; i < bootLines.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setBootSequence(prev => [...prev, bootLines[i]]);
    }
    setShowBootText(true);
  }, []);

  
  const handleBoot = useCallback(() => {
    
    vibrate();
    
    
    enterFullscreen();
    
    
    setIsBooted(true);
    runBootSequence();
  }, [vibrate, enterFullscreen, runBootSequence]);

  
  const typeMessage = useCallback(async (messageId: string, content: string) => {
    setIsTyping(true);
    let typed = '';
    
    for (let i = 0; i < content.length; i++) {
      typed += content[i];
      setDisplayedMessages(prev => new Map(prev).set(messageId, typed));
      
      
      const delay = content[i] === ' ' ? 20 : Math.random() * 30 + 15;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setIsTyping(false);
  }, []);

  
  const scrollToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, []);

  
  useEffect(() => {
    if (!isBooted) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages: Message[] = [];
      
      snapshot.forEach((doc) => {
        newMessages.push({
          id: doc.id,
          content: doc.data().content,
          timestamp: doc.data().timestamp,
        });
      });

      
      if (newMessages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
        const latestMessage = newMessages[newMessages.length - 1];
        
        
        vibrate();
        
        
        document.body.classList.add('flash-effect');
        setTimeout(() => document.body.classList.remove('flash-effect'), 150);
        
        
        typeMessage(latestMessage.id, latestMessage.content);
      } else if (newMessages.length > 0 && lastMessageCountRef.current === 0) {
        
        newMessages.forEach(msg => {
          setDisplayedMessages(prev => new Map(prev).set(msg.id, msg.content));
        });
      }

      lastMessageCountRef.current = newMessages.length;
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [isBooted, vibrate, typeMessage]);

  
  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedMessages, bootSequence, scrollToBottom]);

  
  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  
  if (!isBooted) {
    return (
      <div className="boot-screen crt-screen">
        <div className="static-noise" />
        
        <div className="mb-8 text-center">
          <pre className="text-glow text-sm sm:text-base" style={{ lineHeight: 1.2 }}>
{`
 ██╗      ██████╗  ██████╗ ██████╗ 
 ██║     ██╔═══██╗██╔═══██╗██╔══██╗
 ██║     ██║   ██║██║   ██║██████╔╝
 ██║     ██║   ██║██║   ██║██╔══██╗
 ███████╗╚██████╔╝╚██████╔╝██████╔╝
 ╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝ 
`}
          </pre>
          <p className="text-glow-amber text-xl mt-4 tracking-widest">
            [ LINK PROTOCOL v2.4.7 ]
          </p>
        </div>

        <button 
          onClick={handleBoot}
          className="boot-button"
        >
          ▶ INICIAR CONEXÃO
        </button>

        <p className="mt-8 text-glow-cyan text-sm opacity-70">
          Toque para estabelecer link seguro
        </p>
      </div>
    );
  }

  
  return (
    <div className="crt-screen">
      <div className="static-noise" />
      
      <div ref={terminalRef} className="terminal-container">
        {/* Boot Sequence */}
        {bootSequence.map((line, index) => (
          <div 
            key={`boot-${index}`} 
            className={`message-line ${line.startsWith('>') ? 'text-glow-cyan' : 'text-glow'}`}
          >
            {line}
          </div>
        ))}

        {/* Separador */}
        {showBootText && messages.length > 0 && (
          <div className="message-line text-glow-amber my-6">
            ═══════════════════════════════════════
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <div key={message.id} className="message-line">
            <span className="message-timestamp">
              [{formatTime(message.timestamp)}]
            </span>
            <span className="message-prompt"> L00B&gt; </span>
            <span className="text-glow typewriter">
              {displayedMessages.get(message.id) || ''}
            </span>
            {isTyping && displayedMessages.get(message.id) !== message.content && (
              <span className="cursor-blink" />
            )}
          </div>
        ))}

        {/* Cursor piscando quando idle */}
        {!isTyping && showBootText && (
          <div className="message-line mt-4">
            <span className="message-prompt">_</span>
            <span className="cursor-blink text-glow" />
          </div>
        )}
      </div>
    </div>
  );
}
