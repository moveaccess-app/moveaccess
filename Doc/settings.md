# Settings Module - Documentação

## Visão Geral

O módulo Settings gerencia configurações de Academy (academia) e Units (unidades).
Segue o mesmo padrão do módulo Auth: switch layer com feature flag.

## Arquitetura

```
src/lib/settings/
├── index.ts                    # Public API
├── featureFlags.ts             # USE_SUPABASE_SETTINGS
├── settingsService.ts          # Switch layer (mock ↔ Supabase)
└── settingsServiceSupabase.ts  # Implementação real com fetch()
```

## Feature Flags

```env
# .env.local
NEXT_PUBLIC_USE_SUPABASE_SETTINGS=true  # Habilita Supabase
NEXT_PUBLIC_DEBUG_SETTINGS=true         # Logs no console
```

## Uso

```typescript
import { 
  getAcademy, 
  updateAcademy, 
  getUnits, 
  createUnit, 
  updateUnit, 
  deleteUnit 
} from '@/lib/settings';

// Carregar academy
const academy = await getAcademy();

// Atualizar academy
const result = await updateAcademy({ tradeName: 'Novo Nome' }, userId);

// Listar unidades
const units = await getUnits();

// CRUD de unidades
const { unit } = await createUnit({ name: 'Nova Unidade', ... }, userId);
await updateUnit(unitId, { name: 'Nome Atualizado' }, userId);
await deleteUnit(unitId);
```

## Tabelas Supabase

### academies
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| trade_name | text | Nome fantasia |
| legal_name | text | Razão social |
| cnpj | text | CNPJ |
| email | text | Email |
| phone | text | Telefone |
| whatsapp | text | WhatsApp |
| logo_url | text | URL do logo |
| address | jsonb | Endereço |
| preferences | jsonb | Preferências |
| status | academy_status | active/inactive/suspended |
| created_at | timestamptz | Data criação |
| updated_at | timestamptz | Data atualização |
| updated_by | uuid | FK → profiles |

### units
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| academy_id | uuid | FK → academies |
| name | text | Nome da unidade |
| code | text | Código único |
| status | unit_status | active/inactive/maintenance |
| address | jsonb | Endereço |
| operating_hours | jsonb | Horário de funcionamento |
| access_config | jsonb | Config de acesso |
| created_at | timestamptz | Data criação |
| updated_at | timestamptz | Data atualização |
| created_by | uuid | FK → profiles |
| updated_by | uuid | FK → profiles |

## RLS Policies

### academies
- **SELECT**: Staff pode ver academies vinculadas via user_academy_links
- **UPDATE**: Staff pode atualizar suas academies

### units
- **SELECT**: Staff pode ver units das suas academies
- **INSERT**: Staff pode criar units nas suas academies
- **UPDATE**: Staff pode atualizar units das suas academies
- **DELETE**: Staff pode deletar units das suas academies

## Dados de Teste (DEV)

### Academies
| ID | Nome | Slug |
|----|------|------|
| 8a7d6e94-... | Move Fitness | move-fitness |
| 953e4e19-... | Gym Elite | gym-elite |

### Units
| Academy | Unidade |
|---------|---------|
| Move Fitness | Unidade Centro |
| Move Fitness | Unidade Jardins |
| Move Fitness | Move Fitness - Centro |
| Move Fitness | Move Fitness - Zona Sul |
| Gym Elite | Gym Elite - Shopping |

### Usuários de Teste
| Email | Senha | Academy |
|-------|-------|---------|
| admin@moveaccess.com | Admin123! | Move Fitness |
| staff.b@gymelite.com | StaffB123! | Gym Elite |

---

## Checklist de Testes

### Teste 1: Listar Unidades
1. Logar como `admin@moveaccess.com`
2. Ir para Settings → Unidades
3. **Esperado**: Ver apenas unidades da Move Fitness (4 unidades)
4. NÃO deve aparecer "Gym Elite - Shopping"

### Teste 2: Criar Unidade
1. Logar como `admin@moveaccess.com`
2. Clicar em "Nova Unidade"
3. Preencher nome e código
4. Salvar
5. **Esperado**: Unidade aparece na lista

### Teste 3: Editar Unidade
1. Clicar em uma unidade existente
2. Alterar nome
3. Salvar
4. **Esperado**: Nome atualizado na lista

### Teste 4: Excluir Unidade
1. Clicar para excluir uma unidade
2. Confirmar
3. **Esperado**: Unidade removida da lista

### Teste 5: Isolamento Multi-tenant
1. Logar como `staff.b@gymelite.com`
2. Ir para Settings → Unidades
3. **Esperado**: Ver apenas "Gym Elite - Shopping"
4. NÃO deve aparecer unidades da Move Fitness

### Teste 6: Editar Academy
1. Ir para Settings → Academia
2. Alterar nome fantasia
3. Salvar
4. **Esperado**: Nome atualizado

---

## Troubleshooting

### "Academy não encontrada"
- Verifique se o usuário tem link em `user_academy_links`
- Execute: `SELECT * FROM my_profile` para confirmar `academy_ids`

### "Erro de permissão"
- Confirme RLS policies estão ativas
- Verifique se `is_staff()` retorna true para o usuário

### Console mostra "null"
- Habilite `NEXT_PUBLIC_DEBUG_SETTINGS=true`
- Verifique response do fetch no Network tab
