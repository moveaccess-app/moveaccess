# Acceptance Criteria - EP-0001: Repository Deep Cleanup

**Feature:** Repository Deep Cleanup  
**Status:** Pending Validation

Este documento define os critérios de aceitação final da feature. Todos os itens devem ser validados antes de considerar a feature completa.

---

## ✅ 1. Build e Compilação

### Build de Produção
- [ ] `npm run build` executa sem erros
- [ ] `npm run build` executa sem warnings críticos
- [ ] Build completa em tempo razoável (similar ou melhor que antes)
- [ ] Artefatos de build gerados corretamente em `.next/`
- [ ] Sem módulos faltando ou não resolvidos

### Lint
- [ ] `npm run lint` executa sem erros
- [ ] `npm run lint` não reporta código não utilizado
- [ ] `npm run lint` não reporta imports não utilizados
- [ ] Sem warnings de ESLint introduzidos

### TypeScript
- [ ] TypeScript compila sem erros (`tsc --noEmit`)
- [ ] Sem erros de tipos
- [ ] Sem imports de módulos não encontrados
- [ ] Todos os paths `@/*` resolvidos corretamente

---

## ✅ 2. Funcionalidades Preservadas

### Landing Page
- [ ] Página inicial (`/`) carrega sem erros
- [ ] Página renderiza visualmente correta
- [ ] Imagens (Next.js logo, Vercel logo) carregam
- [ ] Links externos funcionam
- [ ] Estilos Tailwind aplicados corretamente
- [ ] Dark mode funciona se implementado
- [ ] Responsividade mantida

### API Routes - Authentication
- [ ] Endpoint `POST /api/auth/login` responde
- [ ] Aceita JSON no body
- [ ] Retorna status 200 para credenciais válidas
- [ ] Retorna status 401 para credenciais inválidas
- [ ] Retorna status 500 para erros internos
- [ ] Response JSON bem formado

### API Routes - User
- [ ] Endpoint `GET /api/user/[id]` responde
- [ ] Aceita parâmetro dinâmico `id`
- [ ] Retorna status 200 para usuário encontrado
- [ ] Retorna status 400 para erro de validação
- [ ] Retorna status 500 para erros internos
- [ ] Response JSON bem formado

### Dependency Injection
- [ ] Container DI configurado corretamente
- [ ] Controllers resolvidos sem erros
- [ ] Use cases injetados corretamente
- [ ] Ports e adapters funcionando
- [ ] Request-scoped containers isolados

---

## ✅ 3. Limpeza Realizada

### Documentação
- [ ] Arquivos `.md` desnecessários removidos
- [ ] Documentação essencial mantida:
  - [ ] `README.md` presente e atualizado
  - [ ] `DEVELOPMENT_GUIDELINES.md` presente
  - [ ] `CLEAN_ARCHITECTURE_GUIDE.md` presente
  - [ ] `.github/copilot-instructions.md` presente
  - [ ] `.github/agents/*.md` presentes
- [ ] Sem referências quebradas em arquivos `.md` mantidos
- [ ] Informações duplicadas consolidadas ou removidas

### Código - Arquivos Completos
- [ ] Arquivos não referenciados removidos
- [ ] Nenhum arquivo `.ts` ou `.tsx` órfão restante
- [ ] Diretórios vazios removidos
- [ ] Estrutura de pastas coerente e limpa

### Código - Imports
- [ ] Imports não utilizados removidos de todos os arquivos
- [ ] Imports órfãos (de arquivos removidos) corrigidos
- [ ] Imports necessários mantidos (incluindo side-effects como `reflect-metadata`)
- [ ] Ordem de imports consistente

### Código - Lógica Interna
- [ ] Condicionais sem sentido removidas (if sempre true/false)
- [ ] Variáveis não utilizadas removidas
- [ ] Funções não chamadas removidas
- [ ] Código comentado (morto) removido
- [ ] Lógica simplificada onde possível

### Comentários
- [ ] Comentários obsoletos removidos
- [ ] Comentários úteis mantidos (JSDoc, explicações de lógica complexa)
- [ ] TODO items relevantes mantidos
- [ ] Código comentado removido (exceto se documentação necessária)

---

## ✅ 4. Arquitetura e Design System

### Clean Architecture
- [ ] Camadas Domain, Application, Interface, Infra mantidas
- [ ] Separação de responsabilidades respeitada
- [ ] Dependency flow correto (não há inversões)
- [ ] Ports e adapters íntegros

### Estrutura de Pastas
- [ ] `src/app/` para pages e API routes
- [ ] `src/server/core/` para backend Clean Architecture
- [ ] `public/` para assets estáticos
- [ ] Estrutura Next.js App Router respeitada

### Configuração
- [ ] `package.json` íntegro (apenas dependências não usadas removidas, se aplicável)
- [ ] `tsconfig.json` não modificado
- [ ] `next.config.ts` não modificado
- [ ] `eslint.config.mjs` não modificado
- [ ] `tailwind.config.ts` não modificado (se existir)
- [ ] `.gitignore` atualizado se necessário

---

## ✅ 5. Git e Repositório

### Commits
- [ ] Commits pequenos e incrementais
- [ ] Mensagens de commit claras e descritivas
- [ ] Histórico de commits linear e compreensível
- [ ] Nenhum commit com build quebrado

### Arquivos Commitados
- [ ] Apenas arquivos de código fonte commitados
- [ ] `node_modules/` não commitado
- [ ] `.next/` não commitado
- [ ] Arquivos temporários não commitados
- [ ] `.gitignore` atualizado para prevenir commits indesejados

### Branch e PR
- [ ] Branch nomeado adequadamente (ex: `feat/ep-0001-cleanup`)
- [ ] PR description completa e detalhada
- [ ] PR lista todos os arquivos removidos com justificativa
- [ ] PR inclui métricas before/after

---

## ✅ 6. Documentação da Mudança

### Changelog (05-changelog.md)
- [ ] Todas as remoções documentadas
- [ ] Arquivos `.md` removidos listados com motivo
- [ ] Arquivos de código removidos listados com motivo
- [ ] Imports limpos documentados
- [ ] Lógicas simplificadas documentadas
- [ ] Métricas incluídas (linhas removidas, arquivos removidos)

### README.md
- [ ] Informações atualizadas e corretas
- [ ] Instruções de setup funcionam
- [ ] Links não quebrados
- [ ] Descrição do projeto coerente com estado atual

### PR Description
- [ ] Sumário executivo da limpeza
- [ ] Lista de arquivos removidos
- [ ] Justificativa para cada remoção significativa
- [ ] Métricas de redução (tamanho, arquivos, linhas)
- [ ] Confirmação de funcionalidades preservadas
- [ ] Screenshots se aplicável

---

## ✅ 7. Testes Manuais

### Servidor de Desenvolvimento
- [ ] `npm run dev` inicia sem erros
- [ ] Console do terminal sem erros críticos
- [ ] Console do browser sem erros JavaScript
- [ ] Hot reload funciona

### Navegação
- [ ] Página inicial carrega
- [ ] Não há erros 404 em assets
- [ ] Não há erros de console do browser
- [ ] Navegação fluida

### API Testing
- [ ] Teste de login com curl/Postman bem-sucedido
- [ ] Teste de get user com curl/Postman bem-sucedido
- [ ] Responses no formato esperado
- [ ] Status codes corretos

---

## ✅ 8. Métricas de Sucesso

### Redução de Tamanho
- [ ] Arquivos `.md` reduzidos: documentar quantidade (meta: -2 a -4)
- [ ] Arquivos de código reduzidos: documentar quantidade
- [ ] Linhas de código reduzidas: documentar quantidade
- [ ] Tamanho do repositório reduzido: documentar em KB/MB

### Performance
- [ ] Build time mantido ou melhorado
- [ ] Lint time mantido ou melhorado
- [ ] Startup time (`npm run dev`) mantido ou melhorado

### Qualidade
- [ ] Complexidade de código reduzida
- [ ] Manutenibilidade melhorada
- [ ] Legibilidade aumentada
- [ ] Navegação no código mais fácil

---

## ✅ 9. Escopo Respeitado

### Proibições Respeitadas
- [ ] Nenhuma funcionalidade quebrada
- [ ] Arquitetura Clean não modificada
- [ ] Configurações não alteradas sem necessidade
- [ ] Segurança não comprometida
- [ ] Documentação essencial mantida

### Permitido e Executado
- [ ] Apenas código não utilizado removido
- [ ] Apenas documentação desnecessária removida
- [ ] Apenas simplificações seguras realizadas
- [ ] Todas as mudanças reversíveis via git

---

## ✅ 10. Code Review

### Review Automatizado
- [ ] ESLint passa
- [ ] TypeScript compila
- [ ] Build passa
- [ ] Sem warnings críticos

### Review Manual
- [ ] Código revisado por humano ou agente de review
- [ ] Mudanças fazem sentido
- [ ] Nenhuma remoção questionável sem justificativa
- [ ] Feedback de review incorporado
- [ ] Aprovação final recebida

---

## 🎯 Conclusão

**A feature está COMPLETA e APROVADA quando:**

✅ **TODAS** as checkboxes acima estão marcadas  
✅ Build, lint e testes manuais passam  
✅ Funcionalidades preservadas validadas  
✅ Documentação completa  
✅ Code review aprovado  

**Se alguma checkbox não pode ser marcada:**
- Documentar o motivo em `05-changelog.md`
- Avaliar se é bloqueante
- Se bloqueante: corrigir antes de aprovar
- Se não bloqueante: documentar e justificar exceção
