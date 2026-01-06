# Scope Guards - EP-0001: Repository Deep Cleanup

**Feature:** Repository Deep Cleanup  
**Propósito:** Definir limites rígidos do que pode e não pode ser feito durante a execução desta feature.

**⚠️ ESTE ARQUIVO É LEI ⚠️**

O executor deve consultar este arquivo em caso de qualquer dúvida sobre o que fazer.  
Em caso de conflito entre este arquivo e qualquer outra instrução, **este arquivo prevalece**.

---

## 🚫 PROIBIDO (Não Pode Fazer)

### Funcionalidades e Features

#### ❌ NUNCA Quebrar Funcionalidades Existentes
- **PROIBIDO** modificar código que quebra a landing page (`src/app/page.tsx`)
- **PROIBIDO** modificar código que quebra o layout principal (`src/app/layout.tsx`)
- **PROIBIDO** modificar código que quebra a API de login (`src/app/api/auth/login/route.ts`)
- **PROIBIDO** modificar código que quebra a API de usuário (`src/app/api/user/[id]/route.ts`)
- **PROIBIDO** remover componentes, hooks, ou módulos que são importados por código ativo
- **PROIBIDO** alterar comportamento de qualquer funcionalidade existente

#### ❌ NUNCA Adicionar Novas Funcionalidades
- **PROIBIDO** criar novos componentes
- **PROIBIDO** criar novas páginas
- **PROIBIDO** criar novos endpoints de API
- **PROIBIDO** adicionar novas bibliotecas
- **PROIBIDO** implementar novos recursos
- Esta é uma task de **LIMPEZA**, não de **DESENVOLVIMENTO**

### Arquitetura e Padrões

#### ❌ NUNCA Modificar Arquitetura
- **PROIBIDO** alterar a estrutura de Clean Architecture
- **PROIBIDO** mover camadas (Domain, Application, Interface, Infra)
- **PROIBIDO** alterar padrões de Dependency Injection
- **PROIBIDO** modificar configuração do container DI
- **PROIBIDO** alterar fluxo de requisição (Route → Controller → Use Case → Gateway)
- **PROIBIDO** refatorar patterns estabelecidos (ports, adapters, etc.)

#### ❌ NUNCA Alterar Configurações Críticas
- **PROIBIDO** modificar `tsconfig.json` (exceto se for APENAS para corrigir erro após remoção)
- **PROIBIDO** modificar `next.config.ts`
- **PROIBIDO** modificar `eslint.config.mjs` (exceto desabilitar regras temporariamente para debug)
- **PROIBIDO** modificar `package.json` scripts (build, dev, lint, start)
- **PROIBIDO** alterar configuração do Tailwind
- **PROIBIDO** alterar `.gitignore` sem justificativa forte

### Dependências

#### ❌ NUNCA Remover Dependências Sem Certeza Absoluta
- **PROIBIDO** remover dependências do `package.json` sem provar que não são usadas
- **PROIBIDO** fazer downgrade de versões
- **PROIBIDO** fazer upgrade de versões (fora do escopo de limpeza)
- **PERMITIDO APENAS** remover dependências 100% não utilizadas e validar build depois

### Documentação Essencial

#### ❌ NUNCA Remover Documentação Ativa
- **PROIBIDO** remover `README.md`
- **PROIBIDO** remover `Doc/Projeto/DEVELOPMENT_GUIDELINES.md`
- **PROIBIDO** remover `Doc/Projeto/CLEAN_ARCHITECTURE_GUIDE.md`
- **PROIBIDO** remover `.github/copilot-instructions.md`
- **PROIBIDO** remover `.github/agents/my-agent.PM.md`
- **PROIBIDO** remover `.github/agents/my-agent.agent.md`
- Estes arquivos são **referências ativas** do projeto

### Código em Uso

#### ❌ NUNCA Remover Código Sem Validação
- **PROIBIDO** remover arquivo sem verificar que ninguém o importa
- **PROIBIDO** confiar apenas em análise estática sem validar build
- **PROIBIDO** remover imports que parecem não usados mas são side-effects necessários:
  - `import 'reflect-metadata'` (necessário para tsyringe)
  - Imports de CSS/styles
  - Polyfills
- **PROIBIDO** remover código "apenas porque parece não ser usado" sem verificar

### Segurança

#### ❌ NUNCA Comprometer Segurança
- **PROIBIDO** remover validações de entrada (Zod schemas)
- **PROIBIDO** remover tratamento de erros
- **PROIBIDO** expor dados sensíveis em logs ou código
- **PROIBIDO** remover sanitização de inputs
- **PROIBIDO** alterar headers de segurança
- **PROIBIDO** modificar isolamento de tenants (se aplicável)

### Git e Commits

#### ❌ NUNCA Commitar Lixo
- **PROIBIDO** commitar `node_modules/`
- **PROIBIDO** commitar `.next/`
- **PROIBIDO** commitar arquivos de build
- **PROIBIDO** commitar arquivos temporários
- **PROIBIDO** commitar secrets ou `.env` files
- **PROIBIDO** fazer force push sem autorização explícita

#### ❌ NUNCA Fazer Commits Grandes Demais
- **PROIBIDO** fazer um único commit gigante com todas as mudanças
- **PROIBIDO** commitar código que quebra build
- **OBRIGATÓRIO** commitar incrementalmente após cada validação

---

## ✅ PERMITIDO (Pode Fazer)

### Limpeza de Documentação

#### ✅ Remover Arquivos .md Desnecessários
- **PERMITIDO** remover arquivos `.md` que não são referenciados
- **PERMITIDO** remover arquivos `.md` duplicados (manter apenas um)
- **PERMITIDO** remover arquivos `.md` obsoletos ou desatualizados
- **OBRIGATÓRIO** documentar o motivo da remoção em `05-changelog.md`

#### ✅ Atualizar README.md
- **PERMITIDO** corrigir informações desatualizadas
- **PERMITIDO** melhorar clareza das instruções
- **PERMITIDO** corrigir links quebrados
- **PROIBIDO** remover seções essenciais (Como Começar, Tecnologias, etc.)

### Limpeza de Código

#### ✅ Remover Código Morto
- **PERMITIDO** remover arquivos `.ts`/`.tsx` não importados por ninguém
- **PERMITIDO** remover funções internas nunca chamadas
- **PERMITIDO** remover variáveis declaradas mas nunca lidas
- **PERMITIDO** remover classes não instanciadas
- **OBRIGATÓRIO** validar com `grep -r "nome-do-arquivo"` antes de remover
- **OBRIGATÓRIO** validar build após cada remoção

#### ✅ Limpar Imports
- **PERMITIDO** remover imports não utilizados (detectados por ESLint)
- **PERMITIDO** organizar ordem de imports (se melhora legibilidade)
- **PERMITIDO** remover aliases não usados
- **CUIDADO** com imports side-effect (validar antes de remover)

#### ✅ Simplificar Lógica
- **PERMITIDO** remover condicionais sempre verdadeiras: `if (true)` → remover if
- **PERMITIDO** remover condicionais sempre falsas: `if (false)` → remover bloco
- **PERMITIDO** simplificar lógica redundante
- **PERMITIDO** remover código após `return` (unreachable code)
- **OBRIGATÓRIO** validar comportamento não mudou

#### ✅ Limpar Comentários
- **PERMITIDO** remover código comentado (código morto)
- **PERMITIDO** remover comentários obsoletos ("TODO: isso não é mais necessário")
- **PERMITIDO** remover comentários redundantes (`// incrementa i` acima de `i++`)
- **PROIBIDO** remover JSDoc de funções públicas
- **PROIBIDO** remover comentários que explicam lógica complexa

### Estrutura

#### ✅ Limpar Diretórios
- **PERMITIDO** remover diretórios vazios após remoção de arquivos
- **PERMITIDO** reorganizar arquivos dentro da mesma camada (se melhora clareza)
- **PROIBIDO** mover arquivos entre camadas (Domain, Application, etc.)

#### ✅ Atualizar .gitignore
- **PERMITIDO** adicionar patterns para prevenir commit de arquivos temporários
- **PERMITIDO** adicionar patterns para build artifacts
- **PERMITIDO** melhorar organização do `.gitignore`

### Validação

#### ✅ Executar Testes e Builds
- **PERMITIDO** (e **OBRIGATÓRIO**) rodar `npm run build` após mudanças
- **PERMITIDO** (e **OBRIGATÓRIO**) rodar `npm run lint` após mudanças
- **PERMITIDO** rodar `tsc --noEmit` para validar TypeScript
- **PERMITIDO** fazer testes manuais da landing page
- **PERMITIDO** fazer testes manuais das API routes

---

## ⚠️ ZONA CINZA (Requer Aprovação ou Discussão)

### Casos Ambíguos

#### ⚠️ Arquivo Parece Não Usado, Mas Não Tem Certeza
- **AÇÃO:** Marcar como `[PENDENTE]` em análise
- **AÇÃO:** Perguntar ao usuário antes de remover
- **AÇÃO:** Documentar dúvida em `05-changelog.md`
- **PROIBIDO:** Adivinhar ou assumir

#### ⚠️ Código Parece Obsoleto, Mas Pode Ser Necessário No Futuro
- **AÇÃO:** **NÃO REMOVER** - não é escopo desta task
- Esta task remove apenas código **definitivamente** não usado
- Código "pode ser útil no futuro" não é código morto

#### ⚠️ Dependência Parece Não Usada, Mas Não Tem Certeza
- **AÇÃO:** Fazer busca global (`grep -r "nome-da-lib"`)
- **AÇÃO:** Verificar se é peer dependency de outra lib
- **AÇÃO:** Verificar `package.json` scripts
- **SE DÚVIDA PERSISTIR:** NÃO REMOVER

#### ⚠️ Documentação Muito Grande ou Verbosa
- **AÇÃO:** **NÃO ENCURTAR** - não é escopo desta task
- Esta task remove documentação **desnecessária**, não "otimiza" documentação necessária
- Se a doc é referenciada/usada, manter como está

---

## 🔄 Quando Criar Nova Task/EP

### Situações Que Requerem Novo EP

Se durante a execução surgir necessidade de:

- **Refatorar arquitetura** → criar novo EP
- **Adicionar funcionalidades** → criar novo EP
- **Migrar versões de bibliotecas** → criar novo EP
- **Reorganizar estrutura de pastas entre camadas** → criar novo EP
- **Implementar testes automatizados** → criar novo EP
- **Melhorar performance** → criar novo EP
- **Adicionar documentação nova** → criar novo EP

**Esta task é APENAS limpeza cirúrgica de código/docs não utilizados.**

---

## 🛑 Regra de Parada

### Quando Parar e Pedir Ajuda

**PARE IMEDIATAMENTE** e peça ajuda se:

- Build quebrou e você não sabe por quê
- Removeu algo e agora tem erros que não consegue resolver
- Encontrou código que parece não usado mas tem imports de vários lugares
- Encontrou lógica que não faz sentido mas não tem certeza se pode remover
- Tem dúvida se algo é usado ou não
- Encontrou possível bug no código existente (não tente consertar - não é escopo)

**Melhor um EP incompleto com justificativa do que um EP errado com código quebrado.**

---

## 📋 Checklist de Validação Antes de Cada Commit

Antes de cada commit, validar:

- [ ] `npm run build` passa sem erros
- [ ] `npm run lint` passa sem erros
- [ ] Funcionalidade testada manualmente se aplicável
- [ ] Nenhum arquivo temporário adicionado
- [ ] Mensagem de commit clara
- [ ] Mudança documentada em `05-changelog.md`

Se qualquer item falhar: **NÃO COMMITAR** - corrigir primeiro.

---

## 🎯 Princípio Orientador

**"Quando em dúvida, não remova."**

É melhor deixar um arquivo desnecessário do que remover um arquivo necessário.  
É melhor pedir confirmação do que assumir.  
É melhor um EP parcial com justificativa do que um EP completo com funcionalidades quebradas.

**Limpeza é importante. Estabilidade é crítica.**
