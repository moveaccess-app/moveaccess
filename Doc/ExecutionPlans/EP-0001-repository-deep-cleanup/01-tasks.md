# Tasks - EP-0001: Repository Deep Cleanup

**Total de Tasks:** 5  
**Tempo estimado por task:** 15-25 minutos  
**Execução:** Sequencial (cada task depende da validação da anterior)

---

## T1 — Análise e Mapeamento Completo do Repositório

**Objetivo:** Criar um mapa completo de tudo que existe no repositório, identificando o que é usado, o que não é usado, e o que pode ser removido com segurança.

### Entregáveis:
- Inventário completo de todos os arquivos `.md` do repositório
- Lista de todos os arquivos TypeScript/JavaScript e suas dependências
- Mapa de imports/exports mostrando código referenciado vs não referenciado
- Lista de componentes, controllers, use cases efetivamente utilizados
- Identificação de código morto (funções, variáveis, arquivos nunca importados)
- Lista preliminar de arquivos candidatos a remoção

### Critérios de Aceite:
- [ ] Todos os arquivos `.md` catalogados com avaliação de necessidade
- [ ] Grafo de dependências de código gerado (quem importa quem)
- [ ] Código morto identificado com 100% de certeza (nunca importado/referenciado)
- [ ] Funcionalidades ativas claramente documentadas (landing page, API routes)
- [ ] Lista de "safe to remove" vs "keep" criada e justificada
- [ ] Nenhuma suposição sem verificação

### Notas de Execução:
- Use `grep -r "import.*from" src/` para mapear imports
- Use ferramentas como `ts-prune` ou análise manual para código não usado
- Verifique `package.json` scripts para entender o que é executado
- Documente TUDO antes de deletar qualquer coisa
- Se houver dúvida sobre a necessidade de um arquivo, marcá-lo como "PENDENTE - VERIFICAR COM USUÁRIO"

---

## T2 — Limpeza de Documentação (.md files)

**Objetivo:** Remover arquivos Markdown desnecessários mantendo apenas documentação essencial e ativa.

### Entregáveis:
- Remoção de arquivos `.md` duplicados ou obsoletos
- Consolidação de conteúdo relevante se aplicável
- Atualização do `README.md` se necessário
- Manutenção de `DEVELOPMENT_GUIDELINES.md` e `CLEAN_ARCHITECTURE_GUIDE.md`
- Manutenção de arquivos `.github/` necessários para agentes

### Critérios de Aceite:
- [ ] Arquivos `.md` não referenciados pelo projeto removidos
- [ ] `README.md` revisado e atualizado com informações corretas
- [ ] Documentação essencial preservada (guidelines, architecture guide)
- [ ] Nenhuma referência quebrada em documentação mantida
- [ ] `.github/copilot-instructions.md` e `.github/agents/*.md` mantidos intactos (são instruções para agentes)
- [ ] Build e lint continuam passando após mudanças

### Notas de Execução:
- **MANTER:** `README.md`, `DEVELOPMENT_GUIDELINES.md`, `CLEAN_ARCHITECTURE_GUIDE.md`, `.github/copilot-instructions.md`, `.github/agents/*.md`
- **AVALIAR CRITICAMENTE:** Qualquer outro `.md` - só manter se referenciado ou essencial
- Após cada remoção: `npm run build && npm run lint`
- Commitar mudanças incrementalmente
- Se remover algo e gerar erro, reverter imediatamente

---

## T3 — Limpeza de Código Não Utilizado (Arquivos e Módulos)

**Objetivo:** Remover arquivos TypeScript/JavaScript completos que não estão sendo usados em nenhum lugar do projeto.

### Entregáveis:
- Remoção de arquivos de código completamente não referenciados
- Remoção de diretórios vazios resultantes
- Atualização de exports de barril se afetados
- Limpeza de imports órfãos

### Critérios de Aceite:
- [ ] Todos os arquivos .ts/.tsx não importados por nenhum código ativo foram removidos
- [ ] Estrutura de pastas limpa (sem diretórios vazios)
- [ ] Nenhum import quebrado introduzido
- [ ] `npm run build` passa sem erros
- [ ] `npm run lint` passa sem erros
- [ ] TypeScript compila sem erros de módulo não encontrado
- [ ] Funcionalidades preservadas (landing page funciona, API routes funcionam)

### Notas de Execução:
- **NUNCA REMOVER** sem validar que não é importado
- **NUNCA REMOVER:**
  - `src/app/page.tsx` (landing page)
  - `src/app/layout.tsx` (layout principal)
  - `src/app/api/auth/login/route.ts` (API de login)
  - `src/app/api/user/[id]/route.ts` (API de usuário)
  - Qualquer arquivo importado pelos acima
- Usar busca global (`grep -r "nome-do-arquivo"`) antes de deletar
- Remover um arquivo por vez e validar build
- Se Build falhar, reverter e documentar como "em uso - não remover"
- Commitar após cada bloco de remoções validado

---

## T4 — Limpeza de Código Interno (Imports, Comentários, Lógicas)

**Objetivo:** Limpar código dentro de arquivos mantidos - remover imports não usados, comentários obsoletos, e lógicas condicionais sem propósito.

### Entregáveis:
- Remoção de imports não utilizados em todos os arquivos
- Remoção de comentários obsoletos ou desnecessários
- Simplificação de lógicas condicionais sem sentido (if sempre verdadeiro/falso, etc.)
- Remoção de variáveis declaradas mas nunca usadas
- Remoção de funções internas não chamadas

### Critérios de Aceite:
- [ ] Todos os imports não usados removidos (ESLint `no-unused-vars` e `no-unused-imports`)
- [ ] Comentários desnecessários removidos (manter apenas comentários úteis)
- [ ] Condicionais sem lógica simplificadas ou removidas
- [ ] Código mais limpo e legível
- [ ] `npm run lint` passa sem warnings de código não usado
- [ ] `npm run build` passa sem erros
- [ ] Todas as funcionalidades continuam operacionais

### Notas de Execução:
- Use ESLint para identificar imports não usados: `npm run lint`
- Configurar auto-fix onde seguro: revisar cada mudança
- **CUIDADO** com imports que parecem não usados mas são necessários (e.g., `import 'reflect-metadata'`)
- Testar cada arquivo modificado com build incremental
- Manter comentários JSDoc, TODO importantes, ou explicações de lógica complexa
- Remover comentários de código comentado (código morto)
- Atenção especial a:
  - `if (true)` ou `if (false)` → simplificar
  - Variáveis declaradas e nunca lidas
  - Funções definidas e nunca chamadas
- Commitar em blocos lógicos (por arquivo ou grupo de arquivos relacionados)

---

## T5 — Validação Final e Consolidação

**Objetivo:** Validar que todas as limpezas foram bem-sucedidas, funcionalidades preservadas, e documentar todas as mudanças realizadas.

### Entregáveis:
- Build completo sem erros
- Lint completo sem erros
- Teste manual de todas as funcionalidades preservadas
- Atualização do `05-changelog.md` com todas as mudanças
- Sumário de arquivos removidos e linhas de código economizadas
- Atualização do `.gitignore` se necessário
- PR description completa

### Critérios de Aceite:
- [ ] `npm run build` executa com sucesso (100%)
- [ ] `npm run lint` executa sem erros ou warnings
- [ ] TypeScript compila sem erros
- [ ] Landing page (`/`) renderiza corretamente (teste manual)
- [ ] Rota `/api/auth/login` responde corretamente (teste com Postman/curl)
- [ ] Rota `/api/user/[id]` responde corretamente (teste com Postman/curl)
- [ ] Todos os arquivos commitados estão limpos (sem arquivos temporários)
- [ ] `.gitignore` atualizado se necessário
- [ ] `05-changelog.md` completo com lista de todas as remoções
- [ ] PR description lista:
  - Arquivos `.md` removidos (com justificativa)
  - Arquivos de código removidos (com justificativa)
  - Linhas de código economizadas
  - Funcionalidades preservadas
  - Métricas before/after (tamanho repo, número de arquivos)

### Notas de Execução:
- Executar build e lint fresh (limpar cache antes):
  ```bash
  rm -rf .next node_modules/.cache
  npm run build
  npm run lint
  ```
- Testar landing page:
  ```bash
  npm run dev
  # Acessar http://localhost:3000
  # Verificar que renderiza sem erros
  ```
- Testar API routes:
  ```bash
  # Login
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
  
  # User
  curl http://localhost:3000/api/user/123
  ```
- Verificar git status antes de commitar:
  ```bash
  git status
  # Não deve ter arquivos inesperados (node_modules, .next, etc.)
  ```
- Calcular métricas:
  ```bash
  # Before (usar último commit antes da limpeza)
  git diff --stat <commit-antes>
  
  # Linhas removidas
  git diff --stat | tail -1
  
  # Arquivos removidos
  git diff --name-only --diff-filter=D
  ```
- Preencher `05-changelog.md` com formato:
  ```markdown
  ## Arquivos Removidos
  - `path/to/file.md` - Motivo: não referenciado
  
  ## Código Limpo
  - `path/to/file.ts` - Removidos X imports não usados
  
  ## Métricas
  - Arquivos removidos: X
  - Linhas removidas: Y
  - Build time: antes X, depois Y
  ```

---

## 🔄 Ordem de Execução

**Executar tasks nesta ordem exata:**

1. **T1** - Análise completa (não mexe em nada, só mapeia)
2. **T2** - Limpa documentação (menor risco)
3. **T3** - Remove arquivos de código (risco médio)
4. **T4** - Limpa código interno (risco médio)
5. **T5** - Valida tudo (sem mudanças, só verificação)

**Entre cada task:**
- Commitar mudanças
- Validar build e lint
- Se algo quebrar, reverter e documentar o problema

---

## ⚠️ Regras de Segurança

- **NUNCA** deletar sem ter certeza
- **SEMPRE** commitar após validar
- **SEMPRE** rodar build + lint após mudanças
- **SEMPRE** poder reverter (commits pequenos e frequentes)
- **EM CASO DE DÚVIDA:** perguntar ao usuário ou não deletar
