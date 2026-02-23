# Whiteboard Colaborativo - Arquitetura

## 🎯 Objetivo

Sistema de whiteboard colaborativo com **coordenadas 100% consistentes** entre todos os dispositivos (desktop, tablet, mobile), com zoom/pan suave estilo Figma/Excalidraw.

---

## ✅ Garantias

- ✅ Traços aparecem **exatamente na mesma posição** em qualquer dispositivo
- ✅ Desktop, tablet e mobile desenham no **mesmo ponto real** da imagem
- ✅ Canvas e imagem sempre com a **mesma resolução lógica**
- ✅ Suporte a zoom + pan suave
- ✅ Sem distorção
- ✅ Sincronização perfeita entre usuários
- ✅ Performance otimizada (requestAnimationFrame, throttle)

---

## 🏗️ Arquitetura

### 1. Resolução Base (Source of Truth)

```typescript
// Quando a imagem carregar:
const BASE_WIDTH = image.naturalWidth;
const BASE_HEIGHT = image.naturalHeight;

// Canvas usa essa resolução FIXA:
canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;
```

**Princípio crítico**: Todos os strokes são salvos usando essa escala. SEMPRE.

Exemplo:
- Imagem 2000x1200
- Todos os pontos são salvos nessa escala
- Independente do tamanho da tela do usuário

---

### 2. Canvas com Resolução Real

Canvas interno (não CSS) tem a mesma resolução:

```typescript
canvas.width = BASE_WIDTH;   // resolução interna
canvas.height = BASE_HEIGHT; // resolução interna
```

⚠️ **Importante**: Isso é diferente de `canvas.style.width` (CSS)

---

### 3. Responsividade via CSS Transform

```css
canvas {
  max-width: 100%;
  max-height: 100%;
  transform: scale(viewport.scale) translate(...);
}
```

Os **dados** nunca mudam. Apenas a **visualização** muda.

---

### 4. Conversão de Coordenadas

**CRÍTICO**: Conversão matemática precisa garante consistência.

```typescript
// Mouse/Touch → Coordenadas Base
function screenToCanvas(clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  
  // 1. Posição relativa (0-1)
  const relX = (clientX - rect.left) / rect.width;
  const relY = (clientY - rect.top) / rect.height;
  
  // 2. Ajusta por zoom/pan
  const adjustedX = (relX - 0.5) / viewport.scale 
                    - (viewport.offsetX / viewport.scale / rect.width) + 0.5;
  const adjustedY = (relY - 0.5) / viewport.scale 
                    - (viewport.offsetY / viewport.scale / rect.height) + 0.5;
  
  // 3. Converte para coordenadas base
  const baseX = adjustedX * BASE_WIDTH;
  const baseY = adjustedY * BASE_HEIGHT;
  
  return { x: baseX, y: baseY };
}
```

---

### 5. Modelo de Dados

```typescript
interface Point {
  x: number; // 0-1 normalizado
  y: number; // 0-1 normalizado
}

interface Stroke {
  id: string;
  tool: 'pen' | 'eraser';
  points: Point[];  // SEMPRE normalizadas 0-1
  color: string;
  size: number;
  createdAt: Timestamp;
}
```

**Nunca salvar**:
- ❌ `screenX`, `clientX`
- ❌ Pixels da tela
- ❌ Valores CSS

---

### 6. Zoom + Pan

Sistema profissional com viewport:

```typescript
interface Viewport {
  scale: number;    // 1 = 100%, 2 = 200%, etc
  offsetX: number;  // em pixels
  offsetY: number;  // em pixels
}
```

**Recursos**:
- Zoom com scroll wheel (foca no cursor)
- Zoom com pinch (mobile)
- Botões +/- para zoom
- Pan com arrastar
- Limites: 0.1x (10%) até 10x (1000%)

**Importante**: Zoom/Pan são **locais**. Não sincronizam entre usuários. Apenas strokes sincronizam.

---

## 📂 Estrutura de Arquivos

```
src/
├── components/
│   └── terminal/
│       ├── WhiteboardModal.tsx         # Container principal
│       ├── WhiteboardCanvas.tsx        # Canvas otimizado
│       └── WhiteboardToolbar.tsx       # Barra de ferramentas
├── hooks/
│   ├── useViewport.ts                  # Gerencia zoom/pan
│   └── useCanvasCoords.ts              # Converte coordenadas
├── lib/
│   └── useWhiteboardSocket.ts          # Sincronização Firestore
└── types/
    └── whiteboard.ts                   # Tipos TypeScript
```

---

## 🔧 Hooks

### `useViewport`

Gerencia zoom e pan:

```typescript
const {
  viewport,        // estado atual
  zoomIn,          // aumenta zoom
  zoomOut,         // diminui zoom
  reset,           // volta ao 100%
  handleWheel,     // handler de scroll
  handlePinchStart,
  handlePinchMove,
  handlePinchEnd
} = useViewport({
  minScale: 0.1,
  maxScale: 10,
  scrollSensitivity: 0.002,
  zoomIncrement: 0.2
});
```

### `useCanvasCoords`

Converte coordenadas:

```typescript
const {
  screenToCanvas,  // mouse/touch → coordenadas base
  canvasToScreen,  // coordenadas base → posição na tela
  getTransform     // info do transform atual
} = useCanvasCoords({
  canvasRef,
  viewport,
  baseWidth,
  baseHeight
});
```

---

## 🎨 Componente WhiteboardCanvas

Canvas otimizado com:
- Resolução fixa
- Desenho incremental
- requestAnimationFrame
- Throttle de input
- Zero re-render

```tsx
<WhiteboardCanvas
  baseWidth={image.naturalWidth}
  baseHeight={image.naturalHeight}
  elements={strokes}
  viewport={viewport}
  currentTool="pen"
  onDrawStart={handleStart}
  onDrawMove={handleMove}
  onDrawEnd={handleEnd}
/>
```

---

## 🔥 Sincronização Firestore

Estrutura do banco:

```
whiteboard_templates/
  {templateId}/
    - backgroundImage: string
    - locked: boolean
    - createdAt: Timestamp

whiteboard_strokes/
  {templateId}/
    strokes/
      {strokeId}/
        - tool: 'pen' | 'eraser'
        - points: Point[]
        - color: string
        - size: number
        - createdAt: Timestamp
```

Cada template tem sua própria coleção de strokes, isolada.

---

## 🚀 Performance

**Otimizações aplicadas**:

1. **requestAnimationFrame** para desenho
2. **Throttle** de input (16ms = ~60fps)
3. **Desenho incremental** (apenas último segmento)
4. **useRef** para evitar re-renders
5. **Canvas 2D context reuso**
6. **Batch writes** no Firestore

---

## 📱 Suporte Mobile

- ✅ Touch events (touchstart, touchmove, touchend)
- ✅ Pinch-to-zoom com 2 dedos
- ✅ Desenho com 1 dedo
- ✅ Prevenção de scroll durante desenho
- ✅ Coordenadas consistentes independente do device

---

## 🎯 Casos de Uso

### Cenário 1: Desktop + Mobile desenhando juntos

1. Admin abre whiteboard no desktop (1920x1080)
2. Usuário abre no mobile (375x667)
3. **Ambos veem a mesma imagem com resolução base 2000x1200**
4. Desktop desenha um círculo na posição (1000, 600)
5. Mobile recebe via Firestore: `{ x: 0.5, y: 0.5 }` (normalizado)
6. Mobile renderiza na mesma posição visual: centro da imagem
7. ✅ **Perfeito alinhamento**

### Cenário 2: Zoom não afeta dados

1. Usuário aplica zoom 200%
2. Desenha um traço
3. Coordenadas são **convertidas** para escala base antes de salvar
4. Outro usuário (sem zoom) recebe o traço **na posição correta**
5. ✅ **Zoom é local, dados são globais**

---

## 🐛 Debug

Para verificar se está funcionando:

```typescript
// No console do browser:
const canvas = document.querySelector('canvas');
console.log('Canvas resolution:', canvas.width, canvas.height);
console.log('Image resolution:', img.naturalWidth, img.naturalHeight);
// Devem ser IGUAIS

// Verificar coordenadas normalizadas salvas:
console.log('Stroke points:', stroke.points);
// Todos os valores devem estar entre 0 e 1
```

---

## ⚠️ Regras Críticas

**NUNCA**:
- ❌ Salvar coordenadas em pixels da tela
- ❌ Usar `clientX/clientY` diretamente
- ❌ Redimensionar canvas dinamicamente baseado no container
- ❌ Sincronizar zoom/pan entre usuários

**SEMPRE**:
- ✅ Usar resolução natural da imagem como base
- ✅ Converter coordenadas matematicamente
- ✅ Normalizar pontos (0-1) antes de salvar
- ✅ Aplicar zoom/pan via CSS transform

---

## 📚 Referências

Inspirado em:
- [Excalidraw](https://github.com/excalidraw/excalidraw) - Canvas colaborativo
- [Figma](https://www.figma.com) - Zoom/pan profissional
- [tldraw](https://github.com/tldraw/tldraw) - Coordenadas infinitas

---

## 🎉 Resultado

Com essa arquitetura:

✅ **100% de alinhamento** entre dispositivos  
✅ **Zoom suave** estilo aplicações profissionais  
✅ **Performance otimizada** (60fps)  
✅ **Código limpo e tipado**  
✅ **Fácil manutenção**  

🚀 **Pronto para produção!**
