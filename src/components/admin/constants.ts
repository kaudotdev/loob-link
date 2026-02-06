// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS - L00B LINK ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════════

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
    name: 'Fase 01: A Chegada (Geral)',
    icon: '🌊',
    messages: [
      {
        label: '⚠ BIO-SCAN',
        content: [
          '> ANÁLISE AMBIENTAL: A ilha...',
          '> Ela está respirando. O solo tem pulsação de 40bpm.',
          '> Não confiem na estabilidade do terreno. Vocês estão pisando em um organismo.'
        ]
      },
      {
        label: '⛔ PROTOCOLO',
        content: [
          '> LEMBRETE DE ETIQUETA:',
          '> Não comam nada. Não bebam nada.',
          '> A "comida" tem 98% de compatibilidade genética com vocês.',
          '> Canibalismo pega mal no relatório final.'
        ]
      },
      {
        label: '📷 QR-SCAN',
        content: '> OBJETIVO: Procurem por códigos nos itens dos convidados. O sistema precisa de dados para descriptografar a rede local.'
      }
    ],
  },
  {
    name: 'Grupo A: Salão Dourado',
    icon: '🥂',
    messages: [
      {
        label: '🍷 ANÁLISE',
        content: [
          '> LIQUIDO IDENTIFICADO NA TAÇA:',
          '> Hemoglobina processada, morfina e... especiarias?',
          '> É sangue, gênios. Vintage 1980. Não bebam, a menos que queiram viciar em Entropia.'
        ]
      },
      {
        label: '👁 MÁSCARAS',
        content: [
          '> ZOOM VISUAL APLICADO.',
          '> As máscaras dos convidados não têm elásticos.',
          '> Elas estão grampeadas cirurgicamente. Sugiro não tentar removê-las à força, a menos que queiram causar uma cena.'
        ]
      },
      {
        label: '🔍 PISTA',
        content: '> QR CODE DETECTADO: Há um Menu de Jantar na mesa principal. Escaneiem para identificar a origem da "carne".'
      }
    ],
  },
  {
    name: 'Grupo B: Cozinha/Matadouro',
    icon: '🔪',
    messages: [
      {
        label: '⚠ PERIGO',
        content: [
          '> ALERTA DE TEMPERATURA.',
          '> O incinerador está ativo. O cheiro de enxofre está mascarando o cheiro de decomposição.',
          '> Se entrarem lá, virem cinzas em 30 segundos.'
        ]
      },
      {
        label: '🥩 O SACO',
        content: [
          '> BIO-LEITURA DO SACO DE LIXO:',
          '> Sinais vitais detectados. Fracos, mas presentes.',
          '> O conteúdo não é lixo. É um "doador" que falhou no teste de qualidade.',
          '> Decisão tática: Salvar ou Queimar. O relógio está correndo.'
        ]
      },
      {
        label: '🔍 PISTA',
        content: '> QR CODE DETECTADO: Verifiquem a Etiqueta de Processamento no lixo. Pode conter códigos de acesso para as portas de serviço.'
      }
    ],
  },
  {
    name: 'Grupo C: Servidores',
    icon: '💻',
    messages: [
      {
        label: '👁 DRONES',
        content: [
          '> ALERTA DE FURTIVIDADE.',
          '> Esses drones usam olhos humanos reais como lentes.',
          '> Eles reagem a movimento rápido e... medo.',
          '> Mantenham a frequência cardíaca abaixo de 100bpm ou serão vistos.'
        ]
      },
      {
        label: '❄ SISTEMA',
        content: [
          '> DIAGNÓSTICO DO SERVIDOR:',
          '> Refrigeração à base de ectoplasma.',
          '> Se o sistema superaquecer, os espíritos presos no hardware vão se libertar.',
          '> Mantenham o ar condicionado no máximo.'
        ]
      },
      {
        label: '🔍 PISTA',
        content: '> QR CODE DETECTADO: Terminal do Zelador. Escaneiem para obter as rotas de fuga dos dutos de ventilação.'
      }
    ],
  },
  {
    name: 'Ato III: A Valsa',
    icon: '🎻',
    messages: [
      {
        label: '⚡ RITMO',
        content: [
          '> DETECÇÃO DE PADRÃO SONORO.',
          '> A música está controlando a física do local.',
          '> SEGUEM O RITMO ou sofram dano estrutural nos ossos.',
          '> BPM atual: 60 (Adagio). Preparem-se para aceleração.'
        ]
      },
      {
        label: '⚠ DISSONÂNCIA',
        content: '> SOLUÇÃO TÁTICA: Vocês precisam desafinar a orquestra. Criem caos sonoro simultâneo nos três setores. AGORA.'
      }
    ],
  },
  {
    name: 'Chefe: O Cadáver',
    icon: '☠',
    messages: [
      {
        label: '⚠ BOSS',
        content: [
          '> AMEAÇA NÍVEL OMEGA DETECTADA.',
          '> Designação: "O Cadáver".',
          '> Composição: 40% Aço Industrial, 60% Carne Necrosada, 100% Ódio.',
          '> Ele se alimenta de Luto. Ignorem as vozes que ele emite.'
        ]
      },
      {
        label: '⚔ PONTO FRACO',
        content: [
          '> ANÁLISE DE COMBATE:',
          '> A armadura dele é impenetrável para balas comuns.',
          '> MIREM NAS JUNTAS DE CARNE EXPOSTA.',
          '> Use dano de MORTE/ENTROPIA para acelerar a decomposição.'
        ]
      },
      {
        label: '🏃 FUGA',
        content: '> A ilha está colapsando. O Iate é a única saída. Corram ou virem parte da fundação.'
      }
    ],
  }
];