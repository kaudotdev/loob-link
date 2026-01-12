export interface QuickMessage {
  label: string;
  content: string | string[]; 
}

export interface MessageCategory {
  name: string;
  icon: string;
  messages: QuickMessage[];
}

export const MESSAGE_CATEGORIES: MessageCategory[] = [
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
      { label: 'MENTIRA', content: '⚠️ O velho está mentindo. Inventário detectado.' },
      { label: 'DESCARTE 04', content: '> Inventário: Caixote "Descarte 04" contém fuzis sem número de série.' },
      { label: 'CÓD. OMEGA', content: '> Diga a ele: "Código de Liberação OMEGA-7-ZERO".' },
      { label: 'CAVEIRA', content: '> E pegue a caveira. A assinatura de entropia dela é... deliciosa.' },
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
      { 
        label: 'TOKEN BIO', 
        content: [
          '> Fascinante. Isso é um Token Biológico.',
          '> A barreira da Ilha vaporiza intrusos.',
          '> Esse órgão emite uma frequência de "Vida Autorizada".',
          '> É um crachá de carne.'
        ] 
      },
            { label: 'CEGAR', content: '> HACKEANDO ÓTICA DO INIMIGO... ALVO CEGO.' },
      { label: 'FINALIZAR', content: '> PROBABILIDADE DE SOBREVIVÊNCIA DO ALVO: 0%. Finalizem.' },
    ],
  },
];
