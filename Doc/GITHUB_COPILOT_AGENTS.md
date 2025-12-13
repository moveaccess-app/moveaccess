# GitHub Copilot Custom Agents - Guia de Localização

## 📍 Onde Estão os Agents Criados?

Os **Custom Agents do GitHub Copilot** (como o "MoveAccess Feature Executor Agent") **NÃO são armazenados no repositório**. Eles são gerenciados no nível da organização ou conta do GitHub.

## 🔍 Como Encontrar Seus Agents

### Opção 1: Através do GitHub.com

1. **Acesse as configurações da sua organização ou conta:**
   - Para organizações: `https://github.com/organizations/[SUA-ORG]/settings/copilot/agents`
   - Para conta pessoal: `https://github.com/settings/copilot/agents`

2. **Navegue até a seção de Agents:**
   - Settings → Copilot → Custom agents
   - Ou acesse diretamente: `https://github.com/settings/copilot`

### Opção 2: Através do VS Code

1. Abra a paleta de comandos (`Ctrl+Shift+P` ou `Cmd+Shift+P`)
2. Digite: `GitHub Copilot: Manage Custom Agents`
3. Ou clique no ícone do Copilot na barra lateral

### Opção 3: Através do GitHub Copilot Chat

1. Abra o chat do Copilot no VS Code
2. Digite: `@workspace /agents` ou `@me /agents`
3. Isso listará os agents disponíveis

## 📝 Informações Importantes

### Onde os Agents São Armazenados?

- **Nível GitHub:** Os custom agents são armazenados no GitHub, não no repositório
- **Configuração:** Eles fazem parte das configurações da sua conta/organização
- **Acesso:** Disponíveis em todos os repositórios da organização (se configurado assim)

### O Que Está no Repositório?

No repositório, você encontrará apenas:

```
.github/
└── copilot-instructions.md    # Instruções gerais do Copilot para este repo
```

Este arquivo contém instruções gerais para o Copilot, mas **não define custom agents**.

## 🛠️ Como Criar ou Editar Agents

### 1. Via GitHub.com (Recomendado)

```
1. Acesse: https://github.com/settings/copilot/agents
2. Clique em "New custom agent" ou edite um existente
3. Configure:
   - Nome do agent
   - Descrição
   - Instruções/prompt
   - Ferramentas disponíveis
   - Escopo (repositórios com acesso)
4. Salve as alterações
```

### 2. Via API do GitHub

```bash
# Listar agents
gh api /user/copilot/agents

# Criar novo agent
gh api /user/copilot/agents \
  --method POST \
  --field name="MoveAccess Feature Executor" \
  --field description="Agent para executar features do MoveAccess" \
  --field instructions="..."
```

## 🔐 Permissões e Acesso

### Quem Pode Ver os Agents?

- **Agents pessoais:** Apenas você
- **Agents da organização:** Membros com permissões adequadas
- **Agents públicos:** Dependem da configuração de visibilidade

### Requisitos

- ✅ GitHub Copilot ativo na conta/organização
- ✅ Permissões adequadas (Admin/Owner para agents da organização)
- ✅ Acesso ao GitHub Copilot Workspace (para custom agents)

## 📚 Tipos de Configurações do Copilot

| Tipo | Localização | Finalidade |
|------|-------------|------------|
| **Copilot Instructions** | `.github/copilot-instructions.md` | Instruções gerais para este repo |
| **Custom Agents** | GitHub Settings | Agents especializados reutilizáveis |
| **Workspace Context** | Não armazenado | Contexto temporário da sessão |

## 🎯 Próximos Passos

Para encontrar seu "MoveAccess Feature Executor Agent":

1. **Acesse:** https://github.com/settings/copilot/agents
2. **Procure** por "MoveAccess Feature Executor" na lista
3. **Edite** ou visualize as configurações do agent
4. **Verifique** em qual organização ele foi criado (pessoal vs org)

## 🆘 Troubleshooting

### "Não consigo encontrar meus agents"

- ✅ Verifique se você está logado na conta correta
- ✅ Verifique se o Copilot está ativo na sua conta
- ✅ Procure na organização certa (se aplicável)
- ✅ Verifique se você tem permissões adequadas

### "O agent não aparece no VS Code"

- ✅ Recarregue o VS Code (`Developer: Reload Window`)
- ✅ Verifique a extensão do GitHub Copilot está atualizada
- ✅ Faça logout e login novamente no GitHub

### "Preciso compartilhar o agent com o time"

- ✅ Crie o agent no nível da organização (não pessoal)
- ✅ Configure as permissões de acesso apropriadas
- ✅ Documente o uso do agent no README do repositório

## 📖 Recursos Adicionais

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Custom Agents Guide](https://docs.github.com/en/copilot/customizing-copilot/creating-custom-agents)
- [Copilot API Reference](https://docs.github.com/en/rest/copilot)

---

**Nota:** Este documento explica onde encontrar custom agents do GitHub Copilot. Os agents **não são armazenados no código do repositório**, mas sim nas configurações da sua conta/organização GitHub.
