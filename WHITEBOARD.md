# 📝 Whiteboard Colaborativo em Tempo Real

## Visão Geral

Sistema de whiteboard colaborativo integrado ao terminal, permitindo que múltiplos usuários desenhem simultaneamente sobre uma imagem de fundo.

---

## 🎯 Características

✅ **Colaboração em Tempo Real**
- Sincronização instantânea via Firestore
- Todos os usuários veem os desenhos simultaneamente
- Sem necessidade de refresh

✅ **Ferramentas de Desenho**
- ✏️ Caneta preta (2px)
- 🗑️ Borracha (20px)
- ⬇️ Download PNG (background + desenhos)

✅ **Performance Otimizada**
- Throttling de pontos (16ms / ~60fps)
- requestAnimationFrame para animações suaves
- Coordenadas relativas para responsividade
- Batch writes no Firestore

✅ **Suporte Completo**
- Mouse, touch e stylus
- Mobile-first design
- Fullscreen mode
- Preview mode

---

## 📂 Estrutura de Arquivos

```
src/
├── components/
│   ├── admin/
│   │   └── WhiteboardPanel.tsx          # Painel admin para configurar/enviar
│   ├── terminal/
│   │   └── WhiteboardModal.tsx          # Modal exibido no terminal
│   └── Toolbar.tsx                      # Barra de ferramentas (não usado no modal)
│   └── WhiteboardCanvas.tsx             # Canvas HTML5 standalone (não usado no modal)
├── lib/
│   ├── firebase.ts                      # Config Firebase (+ Storage)
│   └── useWhiteboardSocket.ts           # Hook de sincronização realtime
└── types/
    └── whiteboard.ts                    # Tipos TypeScript
```

---

## 🚀 Como Usar

### 1️⃣ No Admin (`/admin`)

1. **Upload de Imagem de Fundo**
   - Clique em "📁 Escolher Imagem"
   - Selecione uma imagem (máx 5MB)
   - Ou cole uma URL diretamente

2. **Salvar Template (Opcional)**
   - Digite um nome para o template
   - Clique em "💾 Salvar Template"
   - Templates ficam salvos para reuso

3. **Ativar Whiteboard**
   - Clique em "🚀 Ativar nos Terminais"
   - Todos os terminais conectados vão receber o whiteboard

### 2️⃣ No Terminal (`/`)

Quando o admin ativa o whiteboard:
- Aparece uma notificação no terminal
- Modal do whiteboard abre automaticamente
- Começa em modo preview (canto inferior direito)
- Clique em ⊡ para expandir para fullscreen

**Ferramentas:**
- ✏️ **Caneta**: Desenha linhas pretas suaves
- 🗑️ **Borracha**: Apaga desenhos
- ⬇️ **Download**: Salva PNG (background + desenhos)

---

## 🔥 Firebase - Estrutura de Dados

### Storage

```
whiteboard/
└── backgrounds/
    └── [timestamp]-[filename].png
```

### Firestore

**Coleção: `whiteboard/current/strokes`**

Cada documento é um stroke (traço):

```typescript
{
  id: string,                    // ID único do Firestore
  tool: 'pen' | 'eraser',       // Ferramenta usada
  points: [                      // Array de pontos (coordenadas relativas 0-1)
    { x: 0.5, y: 0.3 },
    { x: 0.51, y: 0.31 },
    // ...
  ],
  color: '#000000',              // Cor (sempre preto)
  size: 2,                       // Tamanho (2 para caneta, 20 para borracha)
  createdAt: Timestamp           // Timestamp do servidor
}
```

**Coleção: `whiteboard_templates`**

Templates salvos pelo admin:

```typescript
{
  id: string,
  name: string,
  backgroundImage: string,       // URL do Firebase Storage
  uploadedAt: Date
}
```

**Coleção: `messages`**

Mensagem que ativa o whiteboard:

```typescript
{
  content: '> 📝 WHITEBOARD COLABORATIVO ATIVADO',
  type: 'whiteboard',
  payload: {
    backgroundImage: string      // URL da imagem de fundo
  },
  timestamp: Timestamp
}
```

---

## 🎨 Fluxo de Sincronização

1. **Usuário desenha** → Canvas local (instantâneo)
2. **Ao soltar o mouse/touch** → Salva stroke no Firestore
3. **Firestore `onSnapshot`** → Notifica todos os clientes conectados
4. **Outros usuários** → Recebem e redesenham o stroke

**Performance:**
- Throttle de 16ms entre pontos (60fps)
- requestAnimationFrame para desenhos suaves
- Apenas vetores são salvos (não imagens inteiras)

---

## 🛠️ Detalhes Técnicos

### Coordenadas Relativas

Todos os pontos são salvos como valores relativos (0-1):

```typescript
// Exemplo: ponto no centro da tela
{ x: 0.5, y: 0.5 }
```

**Vantagens:**
- Funciona em qualquer resolução
- Responsivo por padrão
- Fácil redimensionamento

### Desenho Suave

```typescript
ctx.lineCap = 'round';    // Pontas arredondadas
ctx.lineJoin = 'round';   // Junções arredondadas
```

### Borracha

```typescript
ctx.globalCompositeOperation = 'destination-out';
// Apaga pixels do canvas
```

### Download PNG

1. Cria canvas temporário
2. Desenha background
3. Sobrepõe canvas de desenhos
4. Exporta como PNG
5. Download automático

---

## 📱 Responsividade

### Desktop
- Modal em modo preview (400x500px)
- Fullscreen disponível
- Suporte a mouse

### Mobile
- Modal responsivo (90vw x 70vh)
- Touch otimizado
- Botões maiores
- Gestos suaves

---

## 🔒 Segurança Firebase (Recomendado)

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Strokes do whiteboard: todos podem ler e escrever
    match /whiteboard/current/strokes/{strokeId} {
      allow read: if true;
      allow create: if true;
      allow delete: if false;  // Não permitir deletar strokes individuais
    }
    
    // Templates: apenas admin pode escrever
    match /whiteboard_templates/{templateId} {
      allow read: if true;
      allow write: if request.auth != null;  // Requer autenticação
    }
    
    // Mensagens: apenas admin envia
    match /messages/{messageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Backgrounds do whiteboard
    match /whiteboard/backgrounds/{filename} {
      allow read: if true;
      allow write: if request.auth != null  // Apenas autenticados
                  && request.resource.size < 5 * 1024 * 1024  // Max 5MB
                  && request.resource.contentType.matches('image/.*');  // Apenas imagens
    }
  }
}
```

---

## 🐛 Troubleshooting

### Whiteboard não abre
- ✅ Verifique se a imagem de fundo é acessível
- ✅ Veja o console do navegador
- ✅ Confirme conexão com Firestore

### Desenhos não sincronizam
- ✅ Verifique Firestore Rules
- ✅ Teste conexão internet
- ✅ Veja console: "📡 Synced X strokes"

### Performance lenta
- ✅ Imagem de fundo muito grande? Reduza para < 2MB
- ✅ Muitos strokes? (> 1000) Considere limpar whiteboard
- ✅ Internet lenta?

### Upload de imagem falha
- ✅ Imagem > 5MB? Reduza o tamanho
- ✅ Storage Rules configuradas?
- ✅ Formato de imagem válido? (PNG, JPG, WebP)

---

## 🧹 Limpeza de Strokes

Para limpar todos os desenhos do whiteboard:

```javascript
// No Firebase Console > Firestore
// Deletar coleção: whiteboard/current/strokes
```

Ou criar função no admin:

```typescript
const clearWhiteboard = async () => {
  const snapshot = await getDocs(
    collection(db, 'whiteboard', 'current', 'strokes')
  );
  
  const deletePromises = snapshot.docs.map(doc => 
    deleteDoc(doc.ref)
  );
  
  await Promise.all(deletePromises);
};
```

---

## 🎯 Próximas Melhorias (Opcional)

- [ ] Múltiplas cores
- [ ] Tamanhos de pincel ajustáveis
- [ ] Undo/Redo
- [ ] Camadas
- [ ] Formas geométricas
- [ ] Texto
- [ ] Clear all button
- [ ] Cursor de outros usuários em tempo real
- [ ] Histórico de versões
- [ ] Permissões de desenho (admin-only mode)

---

## 📄 Licença

Integrado ao projeto **LOOB LINK v2.4.7**

---

## ✨ Pronto para Produção!

O whiteboard está totalmente funcional e otimizado. Basta:

1. Configurar Firebase (`.env.local`)
2. Fazer deploy
3. Ativar via admin

**Divirta-se desenhando! 🎨**
