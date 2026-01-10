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
import { Html5Qrcode } from 'html5-qrcode';

interface Message {
  id: string;
  content: string;
  timestamp: Timestamp;
}

// Mensagens que serão disparadas ao escanear QR codes específicos
const QR_CODE_MESSAGES: Record<string, string[]> = {
  'LOOB_MALETA': [
    '> 🔓 BIOMETRIA DETECTADA...',
    '> AUTENTICAÇÃO: TOKEN ORGÂNICO VÁLIDO.',
    '> A maleta está destravada. O conteúdo é seu.'
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
  // QR code padrão para qualquer outro código
  'DEFAULT': [
    '> 📡 SINAL DESCONHECIDO DETECTADO.',
    '> Processando dados... Origem não catalogada.'
  ]
};

export default function TerminalPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBooted, setIsBooted] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState<Map<string, string>>(new Map());
  const [isTyping, setIsTyping] = useState(false);
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  const [showBootText, setShowBootText] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const vibrationUnlockedRef = useRef(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // Vibração
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
        // Ignora erro silenciosamente
      }
    }
  }, []);

  // Solicitar permissões
  const requestPermissions = useCallback(async () => {
    try {
      // Solicitar permissão de notificação (para vibração em background)
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Solicitar permissão de câmera
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        // Liberar a stream após obter permissão
        stream.getTracks().forEach(track => track.stop());
      }

      setPermissionsGranted(true);
      return true;
    } catch (error) {
      console.log('Erro ao solicitar permissões:', error);
      // Mesmo com erro, marcamos como tentado para não bloquear
      setPermissionsGranted(true);
      return false;
    }
  }, []);

  // Enviar mensagem para o Firestore
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

  // Processar QR Code lido
  const processQRCode = useCallback(async (decodedText: string) => {
    vibrate([500, 200, 500]);
    
    // Encontrar mensagens correspondentes ao QR code
    const messagesToSend = QR_CODE_MESSAGES[decodedText] || QR_CODE_MESSAGES['DEFAULT'];
    
    // Enviar cada mensagem com delay
    for (let i = 0; i < messagesToSend.length; i++) {
      await sendMessageToFirestore(messagesToSend[i]);
      if (i < messagesToSend.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
  }, [vibrate, sendMessageToFirestore]);

  // Iniciar scanner de QR Code
  const startScanner = useCallback(async () => {
    if (!scannerContainerRef.current) return;
    
    setIsScanning(true);
    
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;
      
      await html5QrCode.start(
        { facingMode: 'environment' }, // Câmera traseira
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // QR Code lido com sucesso
          await stopScanner();
          await processQRCode(decodedText);
        },
        () => {
          // Erro de leitura (ignorar, continua tentando)
        }
      );
      
      setScannerReady(true);
    } catch (error) {
      console.error('Erro ao iniciar scanner:', error);
      setIsScanning(false);
      
      // Mostrar mensagem de erro no terminal
      await sendMessageToFirestore('> ⚠️ ERRO: Câmera não disponível ou permissão negada.');
    }
  }, [processQRCode, sendMessageToFirestore]);

  // Parar scanner
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (error) {
        console.log('Erro ao parar scanner:', error);
      }
    }
    setIsScanning(false);
    setScannerReady(false);
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

  const handleBoot = useCallback(async () => {
    unlockVibration();
    vibrate([200, 100, 200]);
    
    // Solicitar permissões após interação do usuário
    await requestPermissions();
    
    enterFullscreen();
    setIsBooted(true);
    runBootSequence();
  }, [vibrate, unlockVibration, requestPermissions, enterFullscreen, runBootSequence]);

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

  // Listener de mensagens do Firestore
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
        vibrate([300, 100, 300]);
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

  // Scroll automático
  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedMessages, bootSequence, scrollToBottom]);

  // Cleanup do scanner ao desmontar
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Tela de Boot
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
        <p className="mt-2 text-gray-500 text-xs">
          (Permissões de câmera e notificação serão solicitadas)
        </p>
      </div>
    );
  }

  // Terminal Principal
  return (
    <div className="crt-screen">
      <div className="static-noise" />
      
      {/* Modal do Scanner de QR Code */}
      {isScanning && (
        <div className="scanner-overlay">
          <div className="scanner-container">
            <div className="scanner-header">
              <span className="text-glow-cyan">📷 SCANNER ATIVO</span>
              <button 
                onClick={stopScanner}
                className="scanner-close-btn"
              >
                ✕
              </button>
            </div>
            <div id="qr-reader" ref={scannerContainerRef} className="qr-reader-box" />
            <p className="text-glow text-sm mt-4">
              Aponte para um QR Code L00B
            </p>
          </div>
        </div>
      )}
      
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

      {/* Botão de Scanner flutuante */}
      {showBootText && !isScanning && (
        <button 
          onClick={startScanner}
          className="scan-button"
          title="Escanear QR Code"
        >
          <span className="scan-icon">📷</span>
          <span className="scan-text">SCAN</span>
        </button>
      )}
    </div>
  );
}
