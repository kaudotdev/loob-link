# 💀 L00B LINK

<div align="center">

![L00B LINK Terminal](https://img.shields.io/badge/L00B-LINK-00ff00?style=for-the-badge&labelColor=000000)
![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=for-the-badge&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=for-the-badge&logo=firebase)

**Terminal hacker em tempo real para campanhas de RPG**

_Simule um hack no celular do jogador com estética cyberpunk_

</div>

---

## 🎮 Sobre o Projeto

**L00B LINK** é uma aplicação web desenvolvida para enriquecer campanhas de **Ordem Paranormal** (ou qualquer outro RPG com temática de tecnologia/hacking). O sistema simula um terminal hacker invadido que aparece no celular do jogador, permitindo que o mestre envie mensagens em tempo real como se fosse uma entidade misteriosa chamada **L00b**.

### 🎯 Propósito

Durante as sessões de RPG, eu (o mestre) posso enviar mensagens secretas para o celular de um jogador específico, criando momentos de tensão e imersão. As mensagens aparecem com efeito de digitação (typewriter), fazendo o celular vibrar e dando a sensação de que o personagem está sendo hackeado.

---

## ✨ Funcionalidades

### 📱 Terminal do Jogador (`/` ou `/tex`)

- **Estética CRT/Hacker**: Fundo preto, texto verde neon com glow, efeito de scanlines
- **Tela de Boot**: Animação de inicialização com sequência de "hacking"
- **Efeito Typewriter**: Mensagens são "digitadas" caractere por caractere
- **Vibração Tática**: O celular vibra ao receber novas mensagens (padrão: `[200ms, 100ms, 200ms]`)
- **Tela Cheia**: Entra em fullscreen ao iniciar conexão
- **Tempo Real**: Sincronização instantânea via Firebase Firestore

### 🎛️ Painel do Mestre (`/admin`)

- **Interface Dark**: Design minimalista e funcional
- **Envio de Mensagens**: Textarea para mensagens personalizadas
- **Atalhos Rápidos**: Botões com frases prontas do L00b:
  - 👀
  - "Conectando..."
  - "⚠️ ACESSO NEGADO"
  - "🚨 CORRAM. AGORA."
  - "💀 SISTEMA COMPROMETIDO"
  - E mais...
- **Limpar Terminal**: Apaga todas as mensagens (reset entre cenas)
- **Histórico**: Visualização das mensagens enviadas

---

## 🛠️ Tech Stack

| Tecnologia             | Uso                                           |
| ---------------------- | --------------------------------------------- |
| **Next.js 16+**        | Framework React com App Router                |
| **TypeScript**         | Tipagem estática                              |
| **Tailwind CSS**       | Estilização                                   |
| **Firebase Firestore** | Banco de dados em tempo real                  |
| **CSS Animations**     | Efeitos visuais (scanlines, glow, typewriter) |

---

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/loob-link.git
cd loob-link
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure o Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative o **Firestore Database** (modo de teste para começar)
3. Copie as credenciais do seu projeto

### 4. Configure as Variáveis de Ambiente

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 5. Execute o Projeto

```bash
npm run dev
```

- **Terminal do Jogador**: http://localhost:3000
- **Painel do Mestre**: http://localhost:3000/admin

---

## 📖 Como Usar na Sessão

### Preparação

1. Deploy a aplicação (Vercel, Netlify, etc.)
2. Envie o link do terminal (`/` ou `/tex`) para o jogador alvo
3. Abra o painel de controle (`/admin`) no seu dispositivo

### Durante a Sessão

1. **Jogador** abre o link no celular e clica em "INICIAR CONEXÃO"
2. O terminal entra em modo de escuta, pronto para receber mensagens
3. **Mestre** digita mensagens ou usa os atalhos rápidos
4. As mensagens aparecem no terminal do jogador com efeito typewriter e vibração

### Dicas de Uso

- 🎭 Use em momentos de tensão narrativa
- 📱 Peça para o jogador deixar o celular na mesa, virado para cima
- 🔇 O jogador não deve mostrar as mensagens aos outros
- 🎬 Combine com música ambiente para máxima imersão

---

## 📁 Estrutura do Projeto

```
loob-link/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Terminal do Jogador
│   │   ├── admin/
│   │   │   └── page.tsx      # Painel do Mestre
│   │   ├── tex/
│   │   │   └── page.tsx      # Rota alternativa do terminal
│   │   ├── layout.tsx        # Layout raiz
│   │   └── globals.css       # Estilos (CRT, glow, scanlines)
│   └── lib/
│       └── firebase.ts       # Configuração Firebase
├── .env.local                # Variáveis de ambiente
└── README.md
```

---

## 🔒 Regras do Firestore

Para produção, configure as regras de segurança no Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{messageId} {
      // Qualquer um pode ler (terminal do jogador)
      allow read: if true;

      // Apenas escrita autenticada (implementar auth se necessário)
      allow write: if true; // ⚠️ Altere para produção
    }
  }
}
```

---

## 🎨 Personalização

### Alterar Mensagens Rápidas

Edite o array `QUICK_MESSAGES` em `/src/app/admin/page.tsx`:

```typescript
const QUICK_MESSAGES = [
  { label: "👀", content: "👀" },
  { label: "NOVA FRASE", content: "Sua mensagem aqui" },
  // ...
];
```

### Alterar Cores

Modifique as CSS variables em `/src/app/globals.css`:

```css
:root {
  --terminal-green: #00ff00; /* Cor principal */
  --terminal-amber: #ffb000; /* Cor de prompt */
  --terminal-red: #ff0040; /* Cor de alerta */
  --terminal-cyan: #00ffff; /* Cor secundária */
}
```

---

## 📜 Licença

Este projeto foi criado para uso pessoal em campanhas de RPG. Sinta-se livre para usar, modificar e distribuir.

---

## 🙏 Créditos

- Inspirado pelo universo de **Ordem Paranormal** de Cellbit
- Desenvolvido com 💚 para criar momentos épicos de RPG

---

<div align="center">

**[ L00B ESTÁ OBSERVANDO ]**

_"Vocês não sabem do que estão lidando."_

</div>
