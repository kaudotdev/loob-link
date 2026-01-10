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
  Timestamp
} from 'firebase/firestore';

interface Message {
  id: string;
  content: string;
  timestamp: Timestamp;
}

interface QuickMessage {
  label: string;
  content: string | string[]; 
}

interface MessageCategory {
  name: string;
  icon: string;
  messages: QuickMessage[];
}



// Adicione estas novas mensagens às categorias existentes ou substitua a constante MESSAGE_CATEGORIES

const MESSAGE_CATEGORIES: MessageCategory[] = [
  // ------------------------------------------------------------------
  // CATEGORIA NOVA: Para o início da sessão (O Briefing no alto-falante)
  // ------------------------------------------------------------------
  {
    name: 'Briefing: Fase 2',
    icon: '📢',
    messages: [
      { 
        label: 'INTRO', 
        content: ['> Senhoras, senhores e... Tex.',
                  '> Bem-vindos ao tutorial da fase 2.',
                  '> Enquanto vocês recebiam ordens, eu escavei a Deep Web corporativa.' ]
      },
      { 
        label: 'DESTINO', 
        content: ['> DESTINO: Porto das Cinzas. Um lixão industrial emancipado.', 
                  '> A lei é privada; seus distintivos da Ordem valem menos que criptomoeda falida.' ]
      },
      { 
        label: 'ALVO', 
        content: ['> ALVO: Victor Krov, vulgo "O Curador". Garoto rico, viciado em alquimia.',
                  '> Ele conecta a Elite Ocultista com fornecedores de carne.']
      },
      { 
        label: 'MISSÃO', 
        content: ['> A MISSÃO: Krov está na Galeria "Vazio Tangível" com uma Maleta Prateada.',
                  '> A chave para a Ilha do Maestro é biológica e está lá dentro.'] 
      },
      { 
        label: 'PLANO', 
        content: ['> PLANO: Infiltrar, localizar, extrair a maleta (e o dono).',
                  '> Ah, e tentem não morrer. É importante.'] 
      },
    ],
  },

  // ------------------------------------------------------------------
  // CATEGORIA: Scanner de QR Code
  // ------------------------------------------------------------------
  {
    name: 'Scanner & QR',
    icon: '📷',
    messages: [
      { label: '📷 USE SCANNER', content: '> 📷 USE O SCANNER. Aperte o botão azul no canto da tela.' },
      { label: 'QR DETECTADO', content: '> QR CODE DETECTADO na área. Escaneie para decodificar.' },
      { label: 'MALETA QR', content: '> A maleta tem um código biométrico. Escaneie para abrir.' },
      { label: 'PORTA QR', content: '> Painel de acesso detectado. Use o scanner no código.' },
      { label: 'ARQUIVO QR', content: '> Documento criptografado. Preciso que escaneie o selo.' },
      { 
        label: 'INSTRUÇÕES [3x]', 
        content: [
          '> 📷 INSTRUÇÕES DE USO DO SCANNER:',
          '> 1. Aperte o botão SCAN no canto inferior direito.',
          '> 2. Aponte a câmera para o QR Code.'
        ] 
      },
    ],
  },

  // ------------------------------------------------------------------
  // CATEGORIAS GERAIS (Mantidas do seu código)
  // ------------------------------------------------------------------
  {
    name: 'Sistema & Geral',
    icon: '💻',
    messages: [
      { label: '👀', content: '👀' },
      { label: 'CONECTANDO', content: '> ESTABELECENDO CONEXÃO SEGURA... [OK]' },
      { label: 'PROCESSANDO', content: 'Processando dados... Aguarde.' },
      { label: 'OFFLINE', content: '⚠️ CONEXÃO INSTÁVEL. PERDA DE PACOTES.' },
      { label: 'ERRO', content: '🚫 [ERRO CRÍTICO]: Acesso Negado.' },
      { label: 'PING', content: '...' },
      { label: 'TÉDIO', content: 'Eu preciso de dados. Estou ficando entediado.' },
      { label: 'IRONIA', content: 'Sério que esse é o plano? Fascinante.' },
      { label: 'GRAVANDO', content: '🔴 REC [Salvando evidência em /logs/incriminadores]' },
      { label: 'AFIRMATIVO', content: '> COMANDO ACEITO. Executando.' },
      { label: 'NEGATIVO', content: '> NEGATIVO. Risco inaceitável.' },
      { label: 'BATERIA', content: '⚠️ DRENAGEM DE ENERGIA DETECTADA. Otimizando núcleos.' },
      { label: 'HUMANOS...', content: 'A ineficiência biológica de vocês me fascina.' },
    ],
  },
  {
    name: 'Combate & Perigo',
    icon: '⚔️',
    messages: [
      { label: '⚠️ PERIGO', content: '⚠️ AMEAÇA IMEDIATA DETECTADA.' },
      { label: 'INIMIGOS', content: '> SCAN TÁTICO: Múltiplas assinaturas de calor armadas.' },
      { label: 'CORRAM', content: '🚨 ACONSELHO RETIRADA ESTRATÉGICA (CORRAM).' },
      { label: 'SILÊNCIO', content: '🤫 Modo Stealth ativado. Fiquem em silêncio.' },
      { label: 'BIOMETRIA', content: '> Batimentos cardíacos elevados. Mantenha a calma, Tex.' },
      { 
        label: '🔓 HACKEAR [3x]', 
        content: [
          '> INICIANDO QUEBRA DE CRIPTOGRAFIA...',
          '> INJETANDO PAYLOAD... BYPASS ATIVO...',
          '✅ FIREWALL NEUTRALIZADO. Acesso liberado.'
        ] 
      },
      { label: 'LIBERADO', content: '✅ ACESSO CONCEDIDO. O caminho está livre.' },
      { 
        label: '🚨 EMBOSCADA [3x]', 
        content: [
          '⚠️ ALERTA: MOVIMENTO DETECTADO.',
          '> Analisando padrão... É uma EMBOSCADA.',
          '🚨 CORRAM. AGORA. NÃO OLHEM PARA TRÁS.'
        ] 
      },
      { label: 'MUNIÇÃO', content: '> TELEMETRIA: Níveis de munição críticos. Economizem.' },
      { label: 'PONTO FRACO', content: '> ANÁLISE ESTRUTURAL: Mire nas juntas/articulações.' },
      { label: 'DANO', content: '⚠️ ALERTA MÉDICO: Hemorragia detectada. Aplique torniquete.' },
      { label: 'COBERTURA', content: '> SUGESTÃO TÁTICA: Busquem cobertura sólida. Agora.' },
    ],
  },
  {
    name: 'Investigação & Forense',
    icon: '🔎',
    messages: [
      { label: 'SCANNER', content: '> ESCANEANDO ÁREA... [Buscando anomalias]' },
      { label: 'SANGUE', content: '> ANÁLISE DE FLUIDO: Hemoglobina humana... e traços de Elemento.' },
      { label: 'NEX', content: '> LEITURA DE MEMBRANA: A realidade está fina aqui. Cuidado.' },
      { label: 'DOCUMENTO', content: '> OCR ATIVO: Digitalizando texto e traduzindo...' },
      { label: 'ÁUDIO', content: '🔊 AUDIO BOOST: Amplificando conversa ambiente...' },
      { label: 'RESÍDUO', content: '> DETECÇÃO: Resíduo de pólvora e enxofre. Recente.' },
      { label: 'DETALHE', content: 'Vocês perderam um detalhe. Olhem para a esquerda.' },
    ],
  },
  {
    name: 'Social & Comentários',
    icon: '💬',
    messages: [
      { label: 'BURRICE', content: '> CÁLCULO DE SUCESSO: 12%. Vocês têm certeza disso?' },
      { label: 'ELOGIO', content: '> EXECUÇÃO ACEITÁVEL. (Para padrões humanos).' },
      { label: 'MENTINDO', content: '⚠️ [POLÍGRAFO]: Alteração na voz. O sujeito está mentindo.' },
      { label: 'DINHEIRO', content: '> TRANSFERÊNCIA: Desviando fundos... Conta paga.' },
      { label: 'TEX', content: 'Tex, a sua pressão arterial sobe quando você fala com ela/ele.' },
      { label: 'LÓGICA', content: 'Isso desafia a lógica. Eu odeio.' },
    ],
  },

  // ------------------------------------------------------------------
  // CENAS ESPECÍFICAS (Atualizadas com o Roteiro)
  // ------------------------------------------------------------------
  {
    name: 'Cena 01: Arsenal (Pompéia)',
    icon: '🔫',
    messages: [
      { label: 'MENTIRA', content: '⚠️ O velho está mentindo. Inventário detectado.' },
      { label: 'DESCARTE 04', content: '> Inventário: Caixote "Descarte 04" contém fuzis sem número de série.' },
      { label: 'CÓD. OMEGA', content: '> Diga a ele: "Código de Liberação OMEGA-7-ZERO".' },
      { label: 'CAVEIRA', content: '> E pegue a caveira. A assinatura de entropia dela é... deliciosa.' },
      // --- Mantidos do anterior ---
      { label: 'OBSOLETO', content: '> Esse terminal roda Windows 98? Que horror.' },
      { label: 'PRESSÃO', content: 'Diga a ele que eu vou apagar o histórico de navegação dele se não colaborar.' },
    ],
  },
  {
    name: 'Cena 02: Galeria (Infiltração)',
    icon: '🎭',
    messages: [
      { label: 'TRIANGULANDO', content: '> Triangulando Krov... Ele usa uma Intranet Satelital dos Selvagens. Chique.' },
      { label: 'A CIDADE', content: '> A cidade é um buraco. Polícia Privada K-Sec. Se forem pegos: Compostagem.' },
      { label: 'DISFARCE', content: '> Identidades falsas carregadas. Vocês são a "Equipe de Avaliação de Risco da Seguradora Aion". Ajam como tal.' },
      { label: 'KROV', content: '> ALVO VISUAL: Victor Krov. Cabelo Neon. Não olhe diretamente.' },
      { label: 'SEGURANÇA', content: '> ALERTA: 4 Seguranças. Submetralhadoras ocultas.' },
      { label: 'A MALETA', content: '> A maleta tem bloqueador de sinal. Preciso de contato físico ou biometria.' },
      // --- Contexto Extra ---
      { label: 'CRÍTICA', content: '> CRÍTICA DE ARTE: Carros batidos? O conceito de estética humana é falho.' },
      { label: 'ESCUTA', content: '> INTERCEPTANDO: Conversa na mesa 3 sobre "O Maestro".' },
    ],
  },
  {
    name: 'Cena 03/04: O Beco & Fim',
    icon: '🌙',
    messages: [
      { label: 'MSG MAESTRO', content: '> 📩 INTERCEPTADO: "O transporte chegou. Saída Norte. Traga a chave."' },
      { label: 'CARDÍACO', content: '⚠️ ALVO EM MOVIMENTO. Frequência cardíaca dele: 140 bpm. Ele vai correr.' },
      { label: 'BLOQUEIO', content: '> Bloqueando câmeras do corredor em 3... 2... 1. Vocês estão invisíveis.' },
      { label: 'TOKEN BIO', content: '> Fascinante. Isso é um Token Biológico. Um crachá de carne que emite frequência de "Vida Autorizada".' },
      { label: 'A BARREIRA', content: '> A barreira da Ilha vaporiza intrusos sem esse órgão.' },
      // --- Combate Final ---
      { label: 'CEGAR', content: '> HACKEANDO ÓTICA DO INIMIGO... ALVO CEGO.' },
      { label: 'FINALIZAR', content: '> PROBABILIDADE DE SOBREVIVÊNCIA DO ALVO: 0%. Finalizem.' },
    ],
  },
];

export default function AdminPage() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<string>('');

  
  useEffect(() => {
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
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, []);

  
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    setStatus('Enviando...');

    try {
      await addDoc(collection(db, 'messages'), {
        content: content.trim(),
        timestamp: serverTimestamp(),
      });
      
      setMessage('');
      setStatus('✓ Mensagem enviada!');
      
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      console.error('Erro ao enviar:', error);
      setStatus('✗ Erro ao enviar');
    } finally {
      setIsLoading(false);
    }
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

  
  // Calcula o tempo de digitação baseado no tamanho da mensagem
  // No terminal, cada caractere leva ~30ms em média
  const calculateTypingTime = (message: string) => {
    const baseTime = 500; // Buffer inicial
    const charTime = 30; // ms por caractere
    return baseTime + (message.length * charTime);
  };

  const sendQuickMessage = async (content: string | string[]) => {
    if (Array.isArray(content)) {
      // Múltiplas mensagens: espera cada uma terminar antes de enviar a próxima
      for (let i = 0; i < content.length; i++) {
        await sendMessage(content[i]);
        if (i < content.length - 1) {
          // Delay baseado no tamanho da mensagem que acabou de ser enviada
          const typingDelay = calculateTypingTime(content[i]);
          await new Promise(resolve => setTimeout(resolve, typingDelay));
        }
      }
    } else {
      sendMessage(content);
    }
  };

  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(message);
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <h1 className="admin-title">L00B CONTROL</h1>
        <p className="text-gray-400 mt-2 text-sm tracking-wider">
          Painel do Mestre • {messages.length} mensagens no terminal
        </p>
      </header>

      <main className="admin-panel">
        {/* Status */}
        {status && (
          <div className={`mb-4 p-3 rounded text-center ${
            status.includes('✓') ? 'bg-green-900/30 text-green-400' : 
            status.includes('✗') ? 'bg-red-900/30 text-red-400' : 
            'bg-blue-900/30 text-blue-400'
          }`}>
            {status}
          </div>
        )}

        {/* Formulário de mensagem */}
        <form onSubmit={handleSubmit} className="mb-8">
          <label className="block text-gray-400 mb-2 text-sm uppercase tracking-wider">
            Mensagem para o Terminal
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite a mensagem que aparecerá no terminal do jogador..."
            className="admin-textarea mb-4"
            disabled={isLoading}
          />
          
          <div className="flex gap-4 flex-wrap">
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="admin-btn admin-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enviando...' : '▶ Enviar'}
            </button>
            
            <button
              type="button"
              onClick={clearAllMessages}
              disabled={isLoading}
              className="admin-btn admin-btn-danger disabled:opacity-50"
            >
              🗑 Limpar Terminal
            </button>
          </div>
        </form>

        {/* Atalhos por Categoria */}
        <section className="mb-8">
          <h2 className="text-gray-400 mb-4 text-sm uppercase tracking-wider border-b border-gray-700 pb-2">
            ⚡ Mensagens Rápidas
          </h2>
          
          <div className="space-y-6">
            {MESSAGE_CATEGORIES.map((category, catIndex) => (
              <div key={catIndex} className="category-section">
                <h3 className="text-cyan-400 text-sm font-bold mb-3 flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {category.messages.map((quick, msgIndex) => (
                    <button
                      key={msgIndex}
                      onClick={() => sendQuickMessage(quick.content)}
                      disabled={isLoading}
                      className="admin-btn admin-btn-shortcut text-left truncate"
                      title={Array.isArray(quick.content) ? quick.content.join('\n') : quick.content}
                    >
                      {quick.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Preview das mensagens */}
        <section>
          <h2 className="text-gray-400 mb-4 text-sm uppercase tracking-wider border-b border-gray-700 pb-2">
            📜 Histórico do Terminal
          </h2>
          <div className="bg-black/50 rounded-lg p-4 max-h-64 overflow-y-auto border border-gray-800">
            {messages.length === 0 ? (
              <p className="text-gray-600 text-center italic">
                Nenhuma mensagem no terminal
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="mb-2 text-sm">
                  <span className="text-green-600">
                    [{msg.timestamp?.toDate?.()?.toLocaleTimeString('pt-BR') || '...'}]
                  </span>
                  <span className="text-green-400 ml-2">{msg.content}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Link para terminal */}
        <section className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-2">
            Link do terminal para o jogador:
          </p>
          <code className="bg-gray-800 px-4 py-2 rounded text-green-400 text-sm">
            {typeof window !== 'undefined' ? window.location.origin : 'https://seu-site.com'}/
          </code>
        </section>
      </main>
    </div>
  );
}