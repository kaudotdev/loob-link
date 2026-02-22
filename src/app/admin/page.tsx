'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  updateDoc
} from 'firebase/firestore';

import { AdminHeader } from '@/components/admin/AdminHeader';
import { StatusMessage } from '@/components/admin/StatusMessage';
import { MessageForm } from '@/components/admin/MessageForm';
import { QuickMessages } from '@/components/admin/QuickMessages';
import { MessageHistory } from '@/components/admin/MessageHistory';
import { MediaPollPanel } from '@/components/admin/MediaPollPanel';
import { TriggersPanel } from '@/components/admin/TriggersPanel';
import { TemplateManager } from '@/components/admin/TemplateManager';
import { QRCodeManager } from '@/components/admin/QRCodeManager';
import { MiniGamesPanel } from '@/components/admin/MiniGamesPanel';
import { AsciiArtPanel } from '@/components/admin/AsciiArtPanel';
import { SceneMacrosPanel, MacroAction } from '@/components/admin/SceneMacrosPanel';
import { Image3DPanel } from '@/components/admin/Image3DPanel';
import { WhiteboardPanel } from '@/components/admin/WhiteboardPanel';
import './admin.css';

interface Message {
  id: string;
  content: string;
  timestamp: Timestamp;
}

interface Template {
  id: string;
  label: string;
  content: string | string[]; 
  category: string;
}

interface QRCode {
  id: string;
  code: string;
  response: string[];
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [status, setStatus] = useState<string>('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
        if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

        const messagesQuery = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages: Message[] = [];
      snapshot.forEach((doc) => {
        newMessages.push({
          id: doc.id,
          content: doc.data().content,
          timestamp: doc.data().timestamp,
        });
      });
      setMessages(newMessages);
    });

        const templatesQuery = query(
      collection(db, 'templates'), 
      orderBy('category')
    );
    
    const unsubTemplates = onSnapshot(templatesQuery, (snapshot) => {
      const newTemplates: Template[] = [];
      snapshot.forEach(doc => {
        newTemplates.push({ id: doc.id, ...doc.data() } as Template);
      });
      setTemplates(newTemplates);
    });

        const qrQuery = query(collection(db, 'qrcodes'), orderBy('code'));
    const unsubQr = onSnapshot(qrQuery, (snapshot) => {
        const qrs: QRCode[] = [];
        snapshot.forEach(doc => {
            qrs.push({ id: doc.id, ...doc.data() } as QRCode);
        });
        setQrCodes(qrs);
    });

    return () => {
      unsubMessages();
      unsubTemplates();
      unsubQr();
    };
  }, []);

  const sendMessage = async (content: string, type: string = 'text', payload: any = {}) => {
    if (!content.trim() && type === 'text') return;
    
    setIsLoading(true);
    setStatus('Enviando...');

    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        content: content.trim(),
        type,
        payload,
        timestamp: serverTimestamp(),
      });
      
      console.log("Documento criado com ID:", docRef.id);
      setStatus('✓ Comando enviado!');
      
      setTimeout(() => setStatus(''), 2000);
    } catch (error: any) {
      console.error('Erro ao enviar:', error);
      setStatus(`✗ Erro: ${error.message || 'Desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrigger = (type: string, payload: any = {}) => {
    let content = '';
    let msgType = type;

    switch (type) {
      case 'glitch':
        content = '*** ERRO CRÍTICO DE SISTEMA ***';
        break;
      case 'vibrate':
        content = '*** ALERTA DE PROXIMIDADE ***';
        break;
      case 'emp':
        content = '*** INTERFERÊNCIA ELETROMAGNÉTICA ***';
        msgType = 'glitch';         break;
      case 'denied':
        content = '> ⛔ ACESSO NEGADO';
        msgType = 'denied';         break;
      case 'granted':
        content = '> ✅ ACESSO AUTORIZADO';
        msgType = 'granted';         break;
      default:
        content = `[COMANDO: ${type.toUpperCase()}]`;
    }
    
    sendMessage(content, msgType, payload);
  };

  const handleSendMedia = (url: string, caption: string) => {
    sendMessage(caption || '[ARQUIVO DE MÍDIA ENVIADO]', 'image', { url, caption });
  };

  const handleSendPoll = (question: string, options: string[]) => {
    sendMessage(question, 'poll', { question, options, pollId: Date.now().toString() });
  };

  const handleStartMiniGame = (gameType: string, gameData: any) => {
    sendMessage(`> INICIANDO PROTOCOLO: ${gameType.toUpperCase()}`, 'game', { 
        gameId: Date.now().toString(),
        gameType, 
        gameData 
    });
  };

  const handleSend3DImage = (frontImage: string, backImage: string, caption: string, aspectRatio: number) => {
    sendMessage(caption || '> ARQUIVO 3D RECEBIDO', 'image3d', { 
      frontImage, 
      backImage, 
      caption,
      aspectRatio
    });
  };

  const handleSendWhiteboard = (templateId: string) => {
    sendMessage('> 📝 WHITEBOARD COLABORATIVO ATIVADO', 'whiteboard', { 
      templateId
    });
  };
  
  const clearAllMessages = async () => {
    if (!confirm('Tem certeza que deseja limpar TODAS as mensagens do terminal?')) {
      return;
    }

    setIsLoading(true);
    setStatus('Limpando...');

    try {
      const snapshot = await getDocs(collection(db, 'messages'));
      const deletePromises = snapshot.docs.map(docSnap => 
        deleteDoc(doc(db, 'messages', docSnap.id))
      );
      
      await Promise.all(deletePromises);
      setStatus('✓ Terminal limpo!');
      
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      console.error('Erro ao limpar:', error);
      setStatus('✗ Erro ao limpar');
    } finally {
      setIsLoading(false);
    }
  };

  const editMessage = async (id: string, newContent: string) => {
    setIsLoading(true);
    setStatus('Editando mensagem...');

    try {
      await updateDoc(doc(db, 'messages', id), {
        content: newContent,
      });
      setStatus('✓ Mensagem editada!');
      setTimeout(() => setStatus(''), 2000);
    } catch (error: any) {
      console.error('Erro ao editar:', error);
      setStatus(`✗ Erro ao editar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (id: string) => {
    setIsLoading(true);
    setStatus('Apagando mensagem...');

    try {
      await deleteDoc(doc(db, 'messages', id));
      setStatus('✓ Mensagem apagada!');
      setTimeout(() => setStatus(''), 2000);
    } catch (error: any) {
      console.error('Erro ao apagar:', error);
      setStatus(`✗ Erro ao apagar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

    const calculateTypingTime = (message: string) => {
    const baseTime = 500;     
    const charTime = 30;     
    return baseTime + (message.length * charTime);
  };

  const sendQuickMessage = async (content: string | string[]) => {
    if (Array.isArray(content)) {
      for (let i = 0; i < content.length; i++) {
        await sendMessage(content[i]);
        if (i < content.length - 1) {
          const typingDelay = calculateTypingTime(content[i]);
          await new Promise(resolve => setTimeout(resolve, typingDelay));
        }
      }
    } else {
      sendMessage(content);
    }
  };

  // Executar macro de cena
  const executeMacro = async (actions: MacroAction[]) => {
    setIsLoading(true);
    setStatus('▶ Executando macro...');

    try {
      for (const action of actions) {
        switch (action.type) {
          case 'message':
            if (action.value.trim()) {
              await sendMessage(action.value);
            }
            break;
          case 'glitch':
            await sendMessage('*** ERRO CRÍTICO DE SISTEMA ***', 'glitch');
            break;
          case 'vibrate':
            await sendMessage('*** ALERTA ***', 'vibrate');
            break;
          case 'theme':
            await sendMessage(`Tema: ${action.value}`, 'theme', { theme: action.value });
            break;
          case 'delay':
            // Delay puro, sem ação
            break;
        }
        
        // Aguardar o delay configurado
        if (action.delay && action.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }
      }
      
      setStatus('✓ Macro concluída!');
      setTimeout(() => setStatus(''), 2000);
    } catch (error: any) {
      console.error('Erro na macro:', error);
      setStatus(`✗ Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <AdminHeader messageCount={messages.length} />

      <main className="admin-panel mt-8">
        
        <StatusMessage status={status} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            
            <div className="space-y-6">
                
                <section className="admin-card">
                    <div className="admin-card-header">
                        <span>📡 Transmissão Manual</span>
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <MessageForm 
                        onSend={(msg) => sendMessage(msg)} 
                        onClear={clearAllMessages} 
                        isLoading={isLoading} 
                    />
                </section>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <span>📂 Gerenciador de Mídia & Decisões</span>
                    </div>
                    <MediaPollPanel 
                        onSendMedia={handleSendMedia} 
                        onSendPoll={handleSendPoll} 
                        isLoading={isLoading} 
                    />
                </section>
                
                <section className="admin-card">
                    <div className="admin-card-header">
                        <span>📱 Gerenciador de QR Codes</span>
                    </div>
                    <QRCodeManager qrCodes={qrCodes} isLoading={isLoading} />
                </section>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <span>⚡ Ações Rápidas (Gatilhos)</span>
                    </div>
                    <TriggersPanel onTrigger={handleTrigger} isLoading={isLoading} />
                </section>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <span>🎮 Minigames de Hacking</span>
                    </div>
                    <MiniGamesPanel onStartGame={handleStartMiniGame} isLoading={isLoading} />
                </section>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <span>🎬 Macros de Cena</span>
                    </div>
                    <SceneMacrosPanel onExecuteMacro={executeMacro} isLoading={isLoading} />
                </section>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <span>☠ Banco de ASCII Art</span>
                    </div>
                    <AsciiArtPanel onSendArt={(art) => sendMessage(art)} isLoading={isLoading} />
                </section>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <span>💾 Templates Salvos</span>
                    </div>
                    <TemplateManager templates={templates} />
                </section>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <span>🎴 Visualizador 3D de Imagens</span>
                        <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                    </div>
                    <Image3DPanel isLoading={isLoading} onSend3DImage={handleSend3DImage} />
                </section>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <span>📝 Whiteboard Colaborativo</span>
                        <div className="h-2 w-2 bg-cyan-500 rounded-full animate-pulse" />
                    </div>
                    <WhiteboardPanel isLoading={isLoading} onSendWhiteboard={handleSendWhiteboard} />
                </section>

            </div>

            
            <div className="space-y-6">
                
                <section className="admin-card">
                    <div className="admin-card-header">
                        <span>🚀 Atalhos de Sistema</span>
                    </div>
                    <QuickMessages 
                        templates={templates}
                        onSendQuick={sendQuickMessage} 
                        isLoading={isLoading} 
                    />
                </section>

                <section className="admin-card h-[600px] flex flex-col">
                    <div className="admin-card-header">
                        <span>📜 Log de Transmissão</span>
                        <span className="text-xs">{messages.length} msgs</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <MessageHistory 
                            messages={messages} 
                            onEdit={editMessage}
                            onDelete={deleteMessage}
                        />
                    </div>
                </section>

                <section className="text-center opacity-50 hover:opacity-100 transition-opacity">
                    <p className="text-xs mb-2 text-[var(--admin-text-dim)]">
                        LINK DE ACESSO REMOTO
                    </p>
                    <code className="bg-black border border-[var(--admin-border)] px-4 py-2 rounded text-[var(--admin-text)] text-xs block overflow-hidden text-ellipsis">
                        {origin || '...'}/
                    </code>
                </section>

            </div>
        </div>
      </main>
    </div>
  );
}