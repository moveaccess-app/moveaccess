# EP-0001: Repository Deep Cleanup

**Feature ID:** EP-0001  
**Feature Name:** Repository Deep Cleanup  
**Created:** 2026-01-06  
**Status:** Ready for Execution

---

## 🎯 Objetivo

Realizar uma limpeza profunda e cirúrgica no repositório MoveAccess, removendo arquivos de documentação desnecessários, código não utilizado, lógicas obsoletas e condicionais sem sentido, **sem comprometer** as funcionalidades existentes da landing page e do início do módulo Access.

O objetivo é reduzir o tamanho do repositório, melhorar a manutenibilidade e eliminar complexidade desnecessária, mantendo apenas o código e documentação que são efetivamente utilizados ou essenciais para o projeto.

---

## ✅ O Que Faz Parte Desta Feature

### Documentação
- Análise e remoção de arquivos `.md` duplicados ou obsoletos
- Consolidação de documentação essencial
- Manutenção apenas de documentação que:
  - É referenciada pelo código
  - Define padrões ativos do projeto
  - É necessária para desenvolvimento (DEVELOPMENT_GUIDELINES.md, CLEAN_ARCHITECTURE_GUIDE.md)

### Código
- Remoção de código morto (funções, componentes, módulos não referenciados)
- Eliminação de lógicas condicionais sem propósito
- Limpeza de imports não utilizados
- Remoção de comentários obsoletos ou desnecessários
- Consolidação de duplicações

### Estrutura
- Limpeza de diretórios vazios ou desnecessários
- Reorganização mínima se beneficiar manutenibilidade
- Atualização de `.gitignore` se necessário

---

## 🚫 O Que Explicitamente NÃO Faz Parte

### Funcionalidades
- **NÃO** alterar ou quebrar funcionalidades existentes da landing page
- **NÃO** alterar ou quebrar funcionalidades do módulo Access (início)
- **NÃO** remover código que está sendo usado ativamente
- **NÃO** refatorar arquitetura ou padrões estabelecidos

### Código em Uso
- **NÃO** modificar a estrutura Clean Architecture existente
- **NÃO** alterar configurações de build, lint ou deploy
- **NÃO** mexer em dependências do `package.json` (exceto se totalmente não utilizadas)
- **NÃO** alterar rotas API funcionais (`/api/auth/login`, `/api/user/[id]`)

### Documentação Essencial
- **NÃO** remover `DEVELOPMENT_GUIDELINES.md` (referência ativa)
- **NÃO** remover `CLEAN_ARCHITECTURE_GUIDE.md` (referência ativa)
- **NÃO** remover `README.md` principal
- **NÃO** remover arquivos `.github/` necessários para CI/CD ou agentes

### Segurança
- **NÃO** alterar validações de segurança
- **NÃO** expor dados sensíveis
- **NÃO** modificar headers de segurança implementados

---

## 🔗 Dependências Técnicas

### Ferramentas Necessárias
- **Git** - Para reverter mudanças se necessário
- **Node.js + npm** - Para executar builds e testes
- **ESLint** - Para validar código após limpeza
- **TypeScript Compiler** - Para validar tipos

### Conhecimento Requerido
- Estrutura do projeto Next.js 15
- Clean Architecture (conforme implementado no projeto)
- TypeScript e React
- Dependency Injection (tsyringe)

### Validações Obrigatórias
Após cada mudança significativa:
1. `npm run build` - Deve passar sem erros
2. `npm run lint` - Deve passar sem erros
3. Navegação manual da landing page - Deve funcionar
4. Teste manual das rotas API - Devem responder

---

## ✔️ Definição de "Done"

A feature está completa quando:

1. **Build e Lint Passam**
   - `npm run build` executa sem erros
   - `npm run lint` executa sem erros
   - TypeScript compila sem erros

2. **Funcionalidades Preservadas**
   - Landing page (`/`) renderiza corretamente
   - Rota `/api/auth/login` funciona
   - Rota `/api/user/[id]` funciona
   - Todas as funcionalidades existentes estão operacionais

3. **Limpeza Realizada**
   - Arquivos `.md` desnecessários removidos
   - Código não utilizado removido
   - Imports não referenciados removidos
   - Lógicas condicionais sem sentido eliminadas
   - Comentários obsoletos removidos

4. **Documentação Atualizada**
   - `README.md` reflete estado atual do projeto
   - Documentação essencial mantida e atualizada
   - Referências quebradas corrigidas

5. **Repositório Limpo**
   - Sem arquivos temporários commitados
   - `.gitignore` atualizado se necessário
   - Estrutura de pastas coerente
   - Tamanho do repositório reduzido

6. **Validação Final**
   - Code review aprovado
   - Testes manuais realizados
   - Changelog atualizado com todas as mudanças
   - PR description completa com sumário das remoções

---

## 📊 Métricas de Sucesso

- Redução de arquivos `.md` desnecessários (meta: -2 a -4 arquivos)
- Código removido (linhas de código não utilizadas)
- Build time mantido ou melhorado
- Lint sem novos erros
- Zero funcionalidades quebradas
- Repositório mais organizado e compreensível
