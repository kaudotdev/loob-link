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



const MESSAGE_CATEGORIES: MessageCategory[] = [
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
  {
    name: 'Cena 01: Arsenal (Pompéia)',
    icon: '🔫',
    messages: [
      { label: 'MENTIRA', content: '[ANÁLISE DE VOZ]: Mentira detectada. Ele tem estoque oculto.' },
      { label: 'ESTOQUE', content: '> Inventário do Sistema: 12 Fuzis Táticos "Descarte" no Lote 4.' },
      { label: 'CÓD. OMEGA', content: '> CÓDIGO DE LIBERAÇÃO: OMEGA-7-ZERO' },
      { label: 'CRÂNIO', content: '> O Artefato... a assinatura de entropia dele é deliciosa. PEGUEM.' },
      
      { label: 'OBSOLETO', content: '> Esse terminal roda Windows 98? Que horror.' },
      { label: 'PRESSÃO', content: 'Diga a ele que eu vou apagar o histórico de navegação dele se não colaborar.' },
      { label: 'GRANADAS', content: '> SUGESTÃO: Aquelas granadas não estão listadas no inventário oficial.' },
    ],
  },
  {
    name: 'Cena 02: Galeria (Infiltração)',
    icon: '🎭',
    messages: [
      { label: 'LOCALIZAÇÃO', content: '> Triangulando posição do alvo... Galeria Vazio Tangível.' },
      { label: 'KROV', content: '> ALVO IDENTIFICADO: Victor Krov. Cabelo Neon. Bar.' },
      { label: 'SEGURANÇA', content: '> ALERTA: 4 Seguranças com submetralhadoras ocultas.' },
      { label: 'A MALETA', content: '> A maleta tem bloqueador de sinal. Não consigo hackear. Preciso da mão dele.' },
      { label: 'DISFARCE', content: '> Upload de Identidades Falsas: CONCLUÍDO. Ajam naturalmente.' },
      { label: 'CHECK-IN', content: '> Hackeando Scanner Ocular... [VERDE]. Bem-vindos.' },
      
      { label: 'CRÍTICA', content: '> CRÍTICA DE ARTE: Carros batidos? O conceito de estética humana é falho.' },
      { label: 'ESCUTA', content: '> INTERCEPTANDO: Conversa na mesa 3 sobre "O Maestro".' },
      { label: 'NÃO TOQUE', content: '> AVISO: Não toquem na exposição. Nível de radiação paranormal baixo.' },
      { label: 'BOLSO', content: '> DICA: O cartão de acesso está no bolso interno do segurança.' },
    ],
  },
  {
    name: 'Cena 03/04: O Beco & Fim',
    icon: '🌙',
    messages: [
      { label: 'MSG MAESTRO', content: '> INTERCEPTADO: "Transporte chegou. Saída Norte."' },
      { label: 'CIBORGUE', content: '⚠️ ANOMALIA: Carne e Máquina fundidas. Mire nas juntas.' },
      { label: 'CEGAR', content: '> HACKEANDO ÓTICA DO INIMIGO... ALVO CEGO.' },
      { label: 'TOKEN', content: '> ANÁLISE: Isso é um Token Biológico. Um crachá de carne para a Ilha.' },
      { label: 'OLHO', content: 'Dica: Se matarem ele, levem o olho. Pode ser útil.' },
      
      { label: 'CHUVA', content: '> AMBIENTE: Chuva com pH ácido. Sugiro não olhar para cima.' },
      { label: 'FINALIZAR', content: '> PROBABILIDADE DE SOBREVIVÊNCIA DO ALVO: 0%. Finalizem.' },
      { label: 'A ILHA', content: '> GEOLOCALIZAÇÃO: Destino confirmado. Ilha do Maestro. Sem sinal de retorno.' },
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

  
  const sendQuickMessage = async (content: string | string[]) => {
    if (Array.isArray(content)) {
      
      for (let i = 0; i < content.length; i++) {
        await sendMessage(content[i]);
        if (i < content.length - 1) {
          
          await new Promise(resolve => setTimeout(resolve, 800));
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
                      title={quick.content}
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
