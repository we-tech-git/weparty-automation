# WEPARTY-109 — Página 404 Mobile

---

## Cenário Original

DADO
que o usuario esteha no mobile e caia na pagina 404

QUANDO
interagir com a pagina

ENTAO
deve estar conseguindo usar livremente sem erros de responsividade

---

## Cenário Adaptado

### Contexto
- **Dispositivo:** Mobile (viewport 375×812 — iPhone X)
- **Página alvo:** Qualquer rota inexistente do app (ex: `/public/PaginaInexistente123`)
- **Funcionalidade testada:** Responsividade e usabilidade da página 404 em dispositivo móvel

### Pré-condições
- Usuário não precisa estar autenticado
- Navegador configurado com viewport mobile 375×812

### DADO
que o usuário acessa uma URL inválida do WeParty pelo navegador mobile (viewport 375×812)

### QUANDO
a página 404 é carregada
E o usuário visualiza e interage com os elementos da página

### ENTÃO
- A página 404 deve ser exibida corretamente (status visível na UI)
- Nenhum elemento deve ultrapassar a largura do viewport (sem scroll horizontal)
- Todos os textos devem permanecer legíveis (sem truncamento ou sobreposição)
- O botão/link de "Voltar" ou "Home" deve estar visível e ser clicável
- O layout não deve quebrar ao rotacionar entre portrait (375×812) e landscape (812×375)
- O header e footer (se existirem) devem manter sua estrutura responsiva
- Nenhum erro de console relacionado a layout/CSS deve aparecer

### Critérios de aceitação
- **Responsividade visual:** Nenhum overflow horizontal detectado
- **Usabilidade:** Elementos interativos (botões, links) têm tamanho mínimo de toque de 44×44px
- **Legibilidade:** Fontes ≥ 14px em todos os textos informativos
- **Estabilidade:** Layout consistente entre orientações portrait e landscape