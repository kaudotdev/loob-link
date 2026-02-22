'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { BootScreen } from '@/components/terminal/BootScreen';
import { AsciiText } from '@/components/terminal/AsciiText';
import { TerminalOutput } from '@/components/terminal/TerminalOutput';
import { ScannerModal } from '@/components/terminal/ScannerModal';
import { ScanButton } from '@/components/terminal/ScanButton';
import { ActiveMiniGame } from '@/components/terminal/MiniGames';
import { EffectsLayer } from '@/components/terminal/EffectsLayer';
import { useSound } from '@/hooks/useSound';

interface Message {
  id: string;
  content: string;
  type?: 'text' | 'glitch' | 'vibrate' | 'theme' | 'emp' | 'denied' | 'granted' | 'game' | 'image' | 'image3d' | 'poll' | 'whiteboard';
  payload?: any;
  timestamp: Timestamp;
}


const QR_CODE_MESSAGES: Record<string, string[]> = {
  'LOOB_MALETA': [
    '> 🔓 BIOMETRIA DETECTADA...',
    '> AUTENTICAÇÃO: TOKEN ORGÂNICO VÁLIDO.',
    '> Conteúdo: Tecido Biológico Humano em Formol.',
    '> Órgão: Fígado.',
    '> Assinatura de DNA: Compatível com Victor Krov (99.9% - Gêmeo ou Clone).',
    '> Função: Token de Acesso. A barreira da Ilha reconhece este DNA como "Autorizado".',
    '> Status da Tranca: Bloqueio Biométrico. Necessário polegar do Krov para abrir sem detonar.',
  ],
  
  'LOOB_ACESSO': [
    '> 🔑 CÓDIGO DE ACESSO ESCANEADO.',
    '> Porta desbloqueada. Vocês têm 30 segundos.'
  ],
  'LOOB_SEGREDO': [
    '> 📜 ARQUIVO CRIPTOGRAFADO DECODIFICADO.',
    '> O Maestro está na Ilha. Coordenadas: -23.5505, -46.6333',
    '> Boa sorte. Vocês vão precisar.'
  ],
    'DEFAULT': [
    '> 📡 SINAL DESCONHECIDO DETECTADO.',
    '> Processando dados... Origem não catalogada.'
  ]
};

export default function TerminalPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isBooted, setIsBooted] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState<Map<string, string>>(new Map());
  const [isTyping, setIsTyping] = useState(false);
  const [bootSequence, setBootSequence] = useState<(string | React.ReactNode)[]>([]);
  const [showBootText, setShowBootText] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [activeGame, setActiveGame] = useState<{id: string, type: string, data: any} | null>(null);
  
  const lastMessageCountRef = useRef(0);
  const vibrationUnlockedRef = useRef(false);
  const { playSound } = useSound();

  const typeMessage = useCallback(async (messageId: string, content: string) => {
    setIsTyping(true);
    let typed = '';
    
    for (let i = 0; i < content.length; i++) {
      typed += content[i];
      setDisplayedMessages(prev => new Map(prev).set(messageId, typed));
      
            if (content[i] !== ' ') {
        playSound('keypress');
      }

      const delay = content[i] === ' ' ? 20 : Math.random() * 30 + 15;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setIsTyping(false);
  }, [playSound]);

  const addLocalMessage = useCallback((content: string, type: Message['type'] = 'text') => {
      const newMessage: Message = {
          id: `local-${Date.now()}-${Math.random()}`,
          content,
          type,
          timestamp: Timestamp.now(),
          payload: {}
      };
      
      setLocalMessages(prev => [...prev, newMessage]);
      
      if (type === 'denied') playSound('access_denied');
      else if (type === 'granted') playSound('access_granted');
      else playSound('message_notification');
      
      typeMessage(newMessage.id, newMessage.content);
  }, [playSound, typeMessage]);

  const sendMessageToFirestore = useCallback(async (content: string) => {
    try {
      await addDoc(collection(db, 'messages'), {
        content: content.trim(),
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }, []);

  const handleGameResult = useCallback(async (success: boolean) => {
      setActiveGame(null);
      if (success) {
          addLocalMessage(`> [SYSTEM]: PROTOCOLO DE HACKING FINALIZADO COM SUCESSO.`, 'granted');
      } else {
          addLocalMessage(`> [SYSTEM]: FALHA NA INCURSÃO.`, 'denied');
      }
  }, [addLocalMessage]);

    const vibrate = useCallback((pattern: number | number[] = [100, 50, 100]) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        const success = navigator.vibrate(pattern);
        if (!success && Array.isArray(pattern)) {
          navigator.vibrate(200);
        }
      }
    } catch (error) {
      console.log('Vibração não suportada:', error);
    }
  }, []);

  const unlockVibration = useCallback(() => {
    if (!vibrationUnlockedRef.current) {
      vibrationUnlockedRef.current = true;
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(1);
        }
      } catch (e) {
              }
    }
  }, []);

    const sendBackgroundNotification = useCallback((content: string) => {
        const isPageHidden = typeof document !== 'undefined' && 
      (document.hidden || document.visibilityState === 'hidden');
    
    if (!isPageHidden) {
      return;     }

        if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          const notification = new Notification('📡 L00B LINK', {
            body: content.replace(/^>\s*/, ''),             icon: '/favicon.ico',
            tag: 'loob-' + Date.now(),           });

                    setTimeout(() => notification.close(), 8000);

                    notification.onclick = () => {
            window.focus();
            notification.close();
          };
          
        } catch (error) {
          console.error('Erro ao criar notificação:', error);
        }
      }
    }
  }, []);

    const requestPermissions = useCallback(async () => {
    try {
            if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        
                if (permission === 'granted') {
          new Notification('📡 L00B LINK Conectado', {
            body: 'Você receberá alertas quando houver novas transmissões.',
            icon: '/favicon.ico',
          });
        }
      }

            try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (camError) {
        console.log('Câmera não disponível:', camError);
      }
      return true;
    } catch (error) {
      console.log('Erro ao solicitar permissões:', error);
      return false;
    }
  }, []);



    const [qrCodeMap, setQrCodeMap] = useState<Record<string, string[]>>({});

  
    useEffect(() => {
     if (!isBooted) return;
     const q = query(collection(db, 'qrcodes'));
     const unsubscribe = onSnapshot(q, (snapshot) => {
         const codes: Record<string, string[]> = {};
         snapshot.forEach(doc => {
             const data = doc.data();
             codes[data.code] = Array.isArray(data.response) ? data.response : [data.response];
         });
                  setQrCodeMap(codes);
     });
     return () => unsubscribe();
  }, [isBooted]);

  const processQRCode = useCallback(async (decodedText: string) => {
    vibrate([500, 200, 500]);
    
        const messagesToSend = qrCodeMap[decodedText] || QR_CODE_MESSAGES['DEFAULT'];
    
    if (messagesToSend) {
        for (let i = 0; i < messagesToSend.length; i++) {
        addLocalMessage(messagesToSend[i]);         if (i < messagesToSend.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        }
    }
  }, [vibrate, addLocalMessage, qrCodeMap]);

  const enterFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  }, []);

  const runBootSequence = useCallback(async () => {
    const bootLines: (string | React.ReactNode)[] = [
      '> INITIALIZING L00B LINK v2.4.7...',
      '> ESTABLISHING SECURE CONNECTION...',
      '> HANDSHAKE COMPLETE',
      '',
      '████████████████████████████████████████',
      <AsciiText key="ascii-link" text="L00B" enableWaves={false} />,
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

  const handleBoot = useCallback(async () => {
    unlockVibration();
    vibrate([200, 100, 200]);
    
        await requestPermissions();
    
    enterFullscreen();
    setIsBooted(true);
    runBootSequence();

  }, [vibrate, unlockVibration, requestPermissions, enterFullscreen, runBootSequence]);

    useEffect(() => {
    if (!isBooted) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages: Message[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        newMessages.push({
          id: doc.id,
          content: data.content,
          type: data.type || 'text',
          payload: data.payload || {},
          timestamp: data.timestamp,
        });
      });

      if (newMessages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
        const latestMessage = newMessages[newMessages.length - 1];
        
                
                playSound('message_notification');

                if (latestMessage.type === 'glitch' || latestMessage.type === 'emp') {
          setIsGlitching(true);
          const sound = latestMessage.type === 'emp' ? 'emp_blast' : 'glitch_static';
          playSound(sound);
          const duration = latestMessage.payload?.duration || 2500;
          setTimeout(() => setIsGlitching(false), duration);
          vibrate([100, 50, 100, 50, duration]); 
        }

        if (latestMessage.type === 'vibrate') {
          const duration = latestMessage.payload?.duration || 2000;
          vibrate(duration); 
          playSound('alarm_proximity');
        }

        if (latestMessage.type === 'denied') {
            playSound('access_denied');
        }

        if (latestMessage.type === 'granted') {
            playSound('access_granted');
        }

        if (latestMessage.type === 'game') {
           setActiveGame({ 
             id: latestMessage.id, 
             type: latestMessage.payload.gameType, 
             data: latestMessage.payload.gameData 
           });
           playSound('system_startup'); 
        }

        if (latestMessage.type === 'theme' && latestMessage.payload?.theme) {
          document.body.setAttribute('data-theme', latestMessage.payload.theme);
        }

        if (latestMessage.type !== 'text') {
           document.body.classList.add('flash-effect');
           setTimeout(() => document.body.classList.remove('flash-effect'), 500);
        }

                sendBackgroundNotification(latestMessage.content);
        
        typeMessage(latestMessage.id, latestMessage.content);
      } else if (newMessages.length > 0 && lastMessageCountRef.current === 0) {
        newMessages.forEach(msg => {
          setDisplayedMessages(prev => new Map(prev).set(msg.id, msg.content));
        });
      }

      lastMessageCountRef.current = newMessages.length;
      setMessages(newMessages);
    }, (error) => {
      console.error("ERRO NO LISTENER DO TERMINAL:", error);
          });

    return () => unsubscribe();
  }, [isBooted, vibrate, typeMessage, sendBackgroundNotification, playSound]);

    const handleScanCode = async (decodedText: string) => {
    setIsScanning(false);
    await processQRCode(decodedText);
  };

  const handleScannerError = async (msg: string) => {
    setIsScanning(false);
    addLocalMessage(msg, 'denied');
  };

    if (!isBooted) {
    return <BootScreen onBoot={handleBoot} />;
  }

  const allMessages = [...messages, ...localMessages].sort((a, b) => {
      const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return ta - tb;
  });

  return (
    <div className={`crt-screen ${isGlitching ? 'glitch-active' : ''}`}>
      <div className="static-noise" />
      <EffectsLayer isGlitching={isGlitching} />
      
      
      {isScanning && (
        <ScannerModal 
          onClose={() => setIsScanning(false)}
          onScan={handleScanCode}
          onError={handleScannerError}
        />
      )}

      {activeGame && (
        <ActiveMiniGame 
          game={activeGame} 
          onResult={handleGameResult} 
        />
      )}
      
      <TerminalOutput 
        messages={allMessages}
        displayedMessages={displayedMessages}
        bootSequence={bootSequence}
        showBootText={showBootText}
        isTyping={isTyping}
      />

      
      {showBootText && !isScanning && (
        <ScanButton onClick={() => setIsScanning(true)} />
      )}
    </div>
  );
}
