# Lovable Reference Project

## 📋 O que é este diretório?

Este diretório contém o **projeto de referência do Lovable** - uma implementação completa da UI/UX do MoveAccess que serve como **guia visual e estrutural** para a migração.

⚠️ **IMPORTANTE**: Este código NÃO faz parte do build do projeto principal. É apenas uma referência.

## 🎯 Propósito

O projeto Lovable serve como:

1. **Referência Visual**: Design completo das telas (landing, login, signup, onboarding, dashboard)
2. **Referência de Componentes**: Exemplos de componentes UI já implementados
3. **Referência de Fluxos**: Navegação e interações entre telas
4. **Referência de Estrutura**: Organização de pastas e arquivos (adaptada para o contexto do projeto)

## 📁 Estrutura do Lovable

```
Doc/Lovable/move-access-main/
├── src/
│   ├── components/
│   │   ├── landing/          # Componentes da landing page
│   │   └── ui/               # Componentes base (shadcn/ui)
│   ├── pages/
│   │   ├── Index.tsx         # Landing page principal
│   │   ├── Login.tsx         # Página de login
│   │   ├── Signup.tsx        # Página de cadastro (onboarding)
│   │   ├── ForgotPassword.tsx # Recuperação de senha
│   │   ├── Plans.tsx         # Planos e precificação
│   │   └── NotFound.tsx      # Página 404
│   ├── hooks/                # Custom hooks
│   └── lib/                  # Utilitários
├── public/                   # Assets estáticos
└── package.json
```

## 🚀 Como Usar Esta Referência

### ✅ O que PODE ser usado:

1. **Inspiração Visual**: Cores, espaçamentos, layouts
2. **Estrutura de Componentes**: Como organizar componentes complexos
3. **Fluxos de Usuário**: Sequência de telas e navegação
4. **Textos e Copy**: Mensagens, labels, descrições
5. **Lógica de Validação**: Regras de formulários
6. **Estados de UI**: Loading, erro, sucesso

### ❌ O que NÃO pode ser copiado diretamente:

1. **Arquitetura do projeto**: O Lovable usa React Router, nosso projeto usa Next.js App Router
2. **Imports diretos**: Os paths são diferentes (`@/components` pode ter significados diferentes)
3. **Componentes sem adaptação**: Precisam ser adaptados para a arquitetura limpa
4. **Estilos hardcoded**: Devemos usar variáveis CSS do Nebraska Design System
5. **Lógica de API**: Deve seguir a camada de serviços definida na Clean Architecture

## 🗺️ Mapeamento para o Projeto Principal

Consulte o arquivo `LOVABLE_MAPPING.md` para entender como cada tela do Lovable corresponde à estrutura do projeto MoveAccess.

## 🔄 Processo de Migração (Próximas Tasks)

1. **Análise**: Entender a tela no Lovable
2. **Adaptação**: Ajustar para a arquitetura do projeto
3. **Implementação**: Criar na estrutura correta
4. **Estilização**: Usar Nebraska Design System
5. **Integração**: Conectar com services/APIs

## 📚 Documentação Relacionada

- `../Projeto/CLEAN_ARCHITECTURE_GUIDE.md` - Arquitetura do projeto
- `../Projeto/DEVELOPMENT_GUIDELINES.md` - Guidelines de desenvolvimento
- `LOVABLE_MAPPING.md` - Mapeamento detalhado Lovable → Projeto

## ⚙️ Configurações de Build

Este diretório está configurado para:

- ❌ **NÃO participar do build** do projeto principal
- ❌ **NÃO ser verificado pelo lint** (configurado em `eslint.config.mjs`)
- ❌ **NÃO ter suas dependências instaladas** automaticamente
- ✅ **Servir apenas como referência** para desenvolvimento

## 🔍 Navegando no Código de Referência

### Para visualizar componentes:
```bash
# Listar todos os componentes
find Doc/Lovable/move-access-main/src/components -name "*.tsx"

# Ver estrutura de um componente específico
cat Doc/Lovable/move-access-main/src/components/landing/HeroSection.tsx
```

### Para entender um fluxo:
1. Comece pela página principal (`src/pages/Index.tsx` ou `Login.tsx`)
2. Veja quais componentes ela usa
3. Navegue pelos componentes para entender a estrutura
4. Identifique validações, estados e lógica de negócio

## 🛡️ Boas Práticas

1. **Sempre consulte** este diretório antes de criar uma nova tela
2. **Não copie e cole** código sem adaptação
3. **Siga a arquitetura** do projeto principal
4. **Use os componentes** já existentes no projeto quando possível
5. **Documente decisões** de adaptação quando necessário

## 📞 Dúvidas?

- Consulte `LOVABLE_MAPPING.md` para mapeamento específico
- Revise `CLEAN_ARCHITECTURE_GUIDE.md` para padrões arquiteturais
- Pergunte ao time quando houver dúvidas sobre adaptações

---

**Última atualização**: Dezembro 2025
