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

export const IA_DE_BOLSO_EXTRA: MessageCategory[] = [
  {
    name: 'Terminal Principal: Subsolo',
    icon: '📟',
    messages: [
      {
        label: '🔐 ACESSO INICIAL',
        content: [
          '> CONEXÃO ESTABELECIDA: CIBORGUE_2.0',
          '> MODO: TERMINAL RAIZ (RESTRITO)',
          '> USUÁRIO: NÃO AUTORIZADO',
          '> EXECUTANDO BYPASS...',
          '> ...',
          '> ACESSO TEMPORÁRIO CONCEDIDO (180s)',
          '> Sugestão amigável: sejam rápidos.'
        ]
      },
      {
        label: '🧪 ESTABILIZAÇÃO — LOG DO SISTEMA',
        content: [
          '> CONSULTA: STATUS_ESTABILIZAÇÃO',
          '> CRISTAL_ORIGINAL: AUSENTE',
          '> FONTE_SUBSTITUTA: VETOR_ORGÂNICO',
          '> INTEGRIDADE_ATUAL: 42%',
          '> ALERTA: DEGRADAÇÃO EM PROGRESSO',
          '> NOTA DO SISTEMA:',
          '> "Amplificador removido. Condutor necessário."',
          '> DETECÇÃO DE BIO-RESSONÂNCIA PRÓXIMA...',
          '> Compatibilidade parcial identificada.'
        ]
      },
      {
        label: '⚠ MONITORAMENTO',
        content: [
          '> ALERTA DE REDE:',
          '> Oscilação detectada na malha interna.',
          '> Origem provável: Sala de Controle.',
          '> Curadoria notificada automaticamente.',
          '> Tempo estimado até resposta: 02:37',
          '> Eu recomendaria encerrar a sessão.',
          '> Mas vocês raramente seguem recomendações.'
        ]
      },
      {
        label: '🧠 PROJETO MAESTRO — BUFFER',
        content: [
          '> QUERY: MAESTRO_CORE',
          '> STATUS: ATIVO',
          '> STATUS_BIOLÓGICO: IRRELEVANTE',
          '> STATUS_CONSCIÊNCIA: NÃO ENCERRADA',
          '> ERRO: PROTOCOLO "ÓBITO" NÃO ENCONTRADO',
          '> LOG 17:42:13 — Tentativa de desligamento falhou.',
          '> LOG 17:42:14 — Reinicialização autônoma detectada.',
          '> LOG 17:42:15 — Presença persistente confirmada.',
          '> OBSERVAÇÃO DO SISTEMA:',
          '> "Ele não morreu."',
          '> Sinal interno ainda responde ao estímulo sonoro.',
          '> A música continua.'
        ]
      }
    ],
  },
   {
    name: 'Sistema de Segurança Interno',
    icon: '🛰',
    messages: [
      {
        label: '📹 CÂMERAS',
        content: [
          '> LOOP DE IMAGEM DISPONÍVEL.',
          '> Posso congelar o feed por 180 segundos.',
          '> Depois disso, alguém muito elegante vai perceber.',
          '> Escolham o momento com cuidado.'
        ]
      },
      {
        label: '🚪 ELEVADOR PRIVADO',
        content: [
          '> Acesso vertical bloqueado.',
          '> Requer autenticação da Curadoria.',
          '> Sugestão: combinem fragmentos de senha encontrados no Protocolo Despertar.',
          '> Ou matem alguém com um crachá melhor que o de vocês.'
        ]
      }
    ],
  }
];