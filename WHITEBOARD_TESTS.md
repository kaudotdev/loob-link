# Whiteboard - Guia de Testes

## 🧪 Testes de Consistência de Coordenadas

### Teste 1: Desktop ↔ Mobile (CRÍTICO)

**Objetivo**: Verificar se traços aparecem na mesma posição em diferentes dispositivos.

**Passos**:
1. Abra o whiteboard no desktop (Chrome, 1920x1080)
2. Abra o mesmo whiteboard no mobile (Safari iOS ou Chrome Android)
3. No desktop: Desenhe um círculo no centro da imagem
4. No mobile: Verifique se o círculo aparece no centro
5. No mobile: Desenhe uma linha diagonal
6. No desktop: Verifique se a linha aparece exatamente na mesma posição

**Resultado esperado**: ✅ Traços aparecem EXATAMENTE na mesma posição relativa à imagem

**Resultado NÃO esperado**: ❌ Traços deslocados, proporções diferentes, posições inconsistentes

---

### Teste 2: Diferentes Resoluções de Tela

**Objetivo**: Validar que resolução da tela não afeta coordenadas.

**Passos**:
1. Abra em um monitor 4K (3840x2160)
2. Desenhe um traço
3. Abra em um laptop Full HD (1920x1080)
4. Verifique o traço
5. Abra em um tablet (1024x768)
6. Verifique o traço

**Resultado esperado**: ✅ Traço sempre aparece na mesma posição relativa à imagem

---

### Teste 3: Zoom não Afeta Dados Salvos

**Objetivo**: Garantir que zoom é apenas visual.

**Passos**:
1. Usuário A: Aplica zoom 200%
2. Usuário A: Desenha um traço
3. Usuário B: Sem zoom (100%)
4. Usuário B: Vê o traço exatamente onde deveria estar (sem deslocamento)

**Resultado esperado**: ✅ Traço aparece na posição correta independente do zoom de quem desenhou

---

## 🔍 Testes de Zoom e Pan

### Teste 4: Zoom com Scroll (Desktop)

**Passos**:
1. Hover mouse sobre o whiteboard
2. Segure Ctrl
3. Scroll up/down
4. **Verificar**: Zoom deve focar no cursor (ponto sob o mouse permanece fixo)

**Resultado esperado**: ✅ Zoom suave focando no cursor

---

### Teste 5: Pinch Zoom (Mobile/Tablet)

**Passos**:
1. Coloque 2 dedos na tela
2. Afaste os dedos (zoom in)
3. Aproxime os dedos (zoom out)
4. **Verificar**: Zoom deve focar no centro do pinch

**Resultado esperado**: ✅ Pinch suave e responsivo

---

### Teste 6: Botões de Zoom

**Passos**:
1. Clique no botão "+" várias vezes
2. Clique no botão "-" várias vezes
3. Clique no botão reset (↻)
4. **Verificar**: Zoom incrementa/decrementa corretamente e reset volta ao 100%

**Resultado esperado**: ✅ Botões funcionam e reset volta ao estado inicial

---

### Teste 7: Limites de Zoom

**Passos**:
1. Tente dar zoom out ao máximo (deve parar em 10%)
2. Tente dar zoom in ao máximo (deve parar em 1000%)

**Resultado esperado**: ✅ Limites respeitados (min: 0.1x, max: 10x)

---

## ✏️ Testes de Desenho

### Teste 8: Desenho Básico

**Passos**:
1. Selecione a ferramenta "Caneta"
2. Desenhe linhas, círculos, formas
3. **Verificar**: Linhas são suaves, sem atraso perceptível

**Resultado esperado**: ✅ Desenho fluido ~60fps

---

### Teste 9: Borracha

**Passos**:
1. Desenhe alguns traços
2. Selecione "Borracha"
3. Passe sobre os traços
4. **Verificar**: Traços são apagados

**Resultado esperado**: ✅ Borracha funciona e apaga traços

---

### Teste 10: Desenho com Zoom

**Passos**:
1. Aplique zoom 300%
2. Desenhe detalhes pequenos
3. Dê zoom out para 100%
4. **Verificar**: Detalhes aparecem proporcionais e na posição correta

**Resultado esperado**: ✅ Desenho correto independente do zoom

---

### Teste 11: Desenho Durante Pinch (Mobile)

**Passos**:
1. Tente desenhar com 1 dedo
2. Adicione um segundo dedo (inicia pinch)
3. **Verificar**: Desenho deve cancelar e entrar em modo zoom

**Resultado esperado**: ✅ Pinch cancela desenho e aplica zoom

---

## 🔄 Testes de Sincronização

### Teste 12: Sincronização em Tempo Real

**Passos**:
1. Abra 2 navegadores (ou dispositivos) com o mesmo whiteboard
2. Usuário A desenha
3. Usuário B deve ver o traço aparecer em tempo real (<1s)

**Resultado esperado**: ✅ Sincronização rápida via Firestore

---

### Teste 13: Modo Locked (Visualização)

**Passos**:
1. Admin bloqueia o whiteboard (locked = true)
2. Usuário tenta desenhar
3. **Verificar**: Desenho deve estar desabilitado
4. **Verificar**: Ferramentas de desenho não aparecem na toolbar

**Resultado esperado**: ✅ Modo visualização impede desenho

---

## 📥 Testes de Download

### Teste 14: Download PNG

**Passos**:
1. Desenhe alguns traços
2. Clique em "Download"
3. Abra a imagem PNG baixada
4. **Verificar**: Imagem contém background + traços corretamente compostos

**Resultado esperado**: ✅ PNG correto com resolução base

---

## 🐛 Testes de Debug

### Teste 15: Verificar Resolução do Canvas

**No console do navegador**:
```javascript
const canvas = document.querySelector('canvas');
const img = document.querySelector('img[src*="background"]');

console.log('Canvas resolution:', canvas.width, 'x', canvas.height);
console.log('Image resolution:', img.naturalWidth, 'x', img.naturalHeight);
console.log('Match:', canvas.width === img.naturalWidth && canvas.height === img.naturalHeight);
```

**Resultado esperado**: ✅ `Match: true`

---

### Teste 16: Verificar Coordenadas Normalizadas

**No Firestore**:
1. Vá para `whiteboard_strokes/{templateId}/strokes`
2. Abra um documento de stroke
3. Verifique o campo `points`
4. Todos os valores de `x` e `y` devem estar entre 0 e 1

**Resultado esperado**: ✅ Valores normalizados (0-1)

Exemplo:
```json
{
  "points": [
    { "x": 0.5, "y": 0.3 },
    { "x": 0.52, "y": 0.31 },
    { "x": 0.54, "y": 0.32 }
  ]
}
```

---

## 🚀 Testes de Performance

### Teste 17: Desenho Rápido

**Passos**:
1. Desenhe muito rápido (rabiscos)
2. **Verificar**: FPS não deve cair abaixo de 30fps
3. **Verificar**: Sem lag perceptível

**Resultado esperado**: ✅ Performance suave (throttle + requestAnimationFrame funcionando)

---

### Teste 18: Muitos Strokes

**Passos**:
1. Desenhe 50+ traços
2. Dê zoom in/out
3. **Verificar**: Renderização continua fluida

**Resultado esperado**: ✅ Performance decente mesmo com muitos elementos

---

## 📱 Testes de Mobile Específicos

### Teste 19: Evitar Scroll Acidental

**Passos**:
1. Em mobile, tente desenhar
2. **Verificar**: Página não deve scrollar durante desenho

**Resultado esperado**: ✅ `touchmove` previne scroll (`preventDefault`)

---

### Teste 20: Rotação de Tela

**Passos**:
1. Desenhe algo em portrait
2. Rode para landscape
3. **Verificar**: Canvas se ajusta e traços permanecem nas mesmas posições

**Resultado esperado**: ✅ Responsividade mantém proporções

---

## ✅ Checklist Final

Antes de considerar pronto para produção:

- [ ] Teste 1: Desktop ↔ Mobile consistente
- [ ] Teste 2: Diferentes resoluções funcionam
- [ ] Teste 3: Zoom não afeta dados
- [ ] Teste 4-7: Zoom/Pan funcionam perfeitamente
- [ ] Teste 8-11: Desenho fluido
- [ ] Teste 12-13: Sincronização + Locked funcionam
- [ ] Teste 14: Download funciona
- [ ] Teste 15-16: Debug mostra valores corretos
- [ ] Teste 17-18: Performance OK
- [ ] Teste 19-20: Mobile sem problemas

---

## 🐛 Problemas Comuns e Soluções

### Problema: Traços deslocados entre dispositivos

**Causa possível**: Canvas não está com resolução base correta

**Solução**: Verificar que `canvas.width === image.naturalWidth`

---

### Problema: Zoom não foca no cursor

**Causa possível**: Cálculo de coordenadas no `zoomAt()` incorreto

**Solução**: Revisar matemática no `useViewport.ts`

---

### Problema: Performance ruim com muitos strokes

**Causa possível**: Re-render desnecessário

**Solução**: Verificar se está usando `useRef` e não `useState` para stroke atual

---

### Problema: Pinch zoom conflita com desenho

**Causa possível**: Eventos de touch não estão prevenindo comportamento padrão

**Solução**: Adicionar `e.preventDefault()` nos handlers de touch

---

## 📊 Métricas de Sucesso

| Métrica | Objetivo |
|---------|----------|
| FPS durante desenho | > 30fps |
| Latência de sincronização | < 1s |
| Precisão de coordenadas | 100% (pixel-perfect) |
| Suporte de dispositivos | Desktop + Tablet + Mobile |
| Limites de zoom | 0.1x - 10x |

---

**🎉 Se todos os testes passarem, o whiteboard está pronto para produção!**
