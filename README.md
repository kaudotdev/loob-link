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

Durante as sessões de RPG, eu (o mestre) posso enviar mensagens secretas para o celular de um jogador específico, criar minigames de hacking, e triggers sensoriais (vibração/sons), criando momentos de tensão e imersão.

---

## ✨ Funcionalidades

### 📱 Terminal do Jogador (`/`)

- **Estética CRT/Hacker**: Fundo preto, texto verde neon com glow, efeito de scanlines.
- **Minigames de Hacking**: Desafios interativos disparados pelo mestre (Descriptografia, Força Bruta, Sinal).
- **Scanner de QR Code**: Câmera integrada para escanear códigos físicos e revelar segredos (Resultados 100% locais).
- **Feedback Local**: Falhas de acesso e conquistas pessoais aparecem apenas para o jogador, sem poluir o chat global.
- **Efeito Typewriter**: Mensagens são "digitadas" caractere por caractere.
- **Gatilhos Sensoriais**:
  - 📳 **Vibração Tática**: Padrões de vibração customizáveis.
  - 🔊 **Sons Imersivos**: Glitch, alarmes, sucesso, e erro.
  - ⚡ **Efeitos Visuais**: Glitch na tela, Flash, Shake.

### 🎛️ Painel do Mestre (`/admin`)

- **Controle Total**: Interface para gerenciar toda a narrativa.
- **Minigames Panel**: Configure e inicie jogos de hacking para os jogadores.
  - _Decryption_: Jogador deve adivinhar a senha.
  - _Brute Force_: Teste de reflexos e timing.
  - _Signal Tuning_: Encontrar a frequência correta.
- **Gerenciador de QR Codes**: Crie e edite códigos que os jogadores podem escanear na vida real.
- **Templates & Mensagens Rápidas**: Banco de mensagens salvas e atalhos de um clique.
- **Gatilhos de Efeito**: Botões para causar Glitch, EMP, ou Vibração instantânea.
- **Mídia & Enquetes**: Envie imagens ou votações para o terminal.

---

## 🛠️ Tech Stack

| Tecnologia             | Uso                                         |
| ---------------------- | ------------------------------------------- |
| **Next.js 16+**        | Framework React com App Router              |
| **TypeScript**         | Tipagem estática robusta                    |
| **Tailwind CSS**       | Estilização responsiva e tema dark          |
| **Firebase Firestore** | Banco de dados em tempo real (Mensagens/QR) |
| **Web Audio API**      | Sons de interface e efeitos (`useSound`)    |
| **Vibration API**      | Feedback tátil em dispositivos móveis       |

---

## 🚀 Como Jogar (Minigames)

O mestre pode iniciar protocolos de hacking que sobrepõem o terminal do jogador.

1. **🔐 Descriptografia (Decryption)**

   - O jogador recebe um prompt de senha.
   - Deve digitar a senha correta (igual Wordle ou terminal clássico).
   - _Uso_: Descobrir a senha de um computador ou maleta.

2. **🔨 Força Bruta (Brute Force)**

   - Caracteres rolam rapidamente na tela.
   - O jogador deve clicar em `LOCK_BIT()` no momento certo para travar a senha.
   - _Uso_: Quebrar firewalls ou trancas eletrônicas sob pressão.

3. **📡 Sintonia (Signal Tuning)**
   - Um slider de frequência com visualizador de ruído.
   - O jogador ajusta até o sinal ficar "LOCKED" (>90% de força).
   - _Uso_: Sintonizar rádio, interceptar sinal ou estabilizar conexão.

---

## 🚀 Instalação e Configuração

### 1. Clone e Instale

```bash
git clone https://github.com/seu-usuario/loob-link.git
cd loob-link
npm install
```

### 2. Configure Variáveis (.env.local)

Crie um projeto no Firebase e adicione as chaves:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
...
```

### 3. Popule o Banco de Dados (Opcional)

Use o script de seed para criar QR Codes padrão:

```bash
node scripts/seed-qr.js
```

### 4. Execute

```bash
npm run dev
```

Acesse:

- **Terminal**: `http://localhost:3000` (Mobile recommended)
- **Admin**: `http://localhost:3000/admin` (Desktop recommended)

---

## 📁 Estrutura Principal

```
loob-link/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Terminal (Lógica Principal)
│   │   ├── admin/            # Painel do Mestre
│   ├── components/
│   │   ├── admin/            # Componentes do Painel (Managers, Trigger, etc)
│   │   ├── terminal/         # Componentes do Jogador (Minigames, Output, Scanner)
│   ├── hooks/                # useSound, useVibration
│   └── lib/                  # Firebase config
```

---

<div align="center">

**[ L00B ESTÁ OBSERVANDO ]**

_"Vocês não sabem com o que estão lidando."_

</div>
