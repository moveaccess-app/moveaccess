# CURRENT_USER_CONTRACT (DEV)

## Objetivo

Padronizar um único shape de usuário autenticado para todo o app, independente da origem da sessão (mock ou Supabase), evitando divergência entre `user`, `profile` e campos de autorização/tenant.

---

## Contrato canônico

Arquivo-fonte: `src/lib/auth/currentUserContract.ts`

```ts
interface CurrentUser {
  session: {
    accessToken: string;
    expiresAt: string;
  };
  profile: {
    id: string;
    name: string;
    email: string;
    userType: 'staff' | 'student';
    avatarUrl?: string;
    createdAt: string;
    cpf?: string;
    phone?: string;
    planName?: string;
    planStatus?: string;
    planExpiresAt?: string;
    staffStatus?: string | null;
    studentStatus?: string | null;
  };
  authorization: {
    role: 'admin' | 'manager' | 'receptionist' | 'financial' | 'readonly' | null;
    permissions: string[];
  };
  tenancy: {
    academyIds: string[];
    unitIds: string[];
  };
}
```

---

## Regras de mapeamento

Função de mapeamento única: `mapSessionToCurrentUser(session)` em `src/lib/auth/currentUserContract.ts`.

- `session.accessToken` vem de `AuthSession.access_token`.
- `session.expiresAt` vem de `AuthSession.expires_at`.
- `profile.*` vem de `AuthSession.user` (mock ou Supabase).
- `authorization.role` e `authorization.permissions`:
  - Staff: usa `role`/`permissions` do usuário autenticado.
  - Student: `role = null`, `permissions = []`.
- `tenancy.academyIds` e `tenancy.unitIds`:
  - Se os campos existirem na sessão, são utilizados.
  - Caso contrário, default seguro `[]`.
- Status (`staffStatus`, `studentStatus`):
  - Usa campo da sessão quando existir.
  - Em fallback, aplica default seguro por tipo de usuário.

---

## Uso no app

- Fonte única: `useAuth().currentUser`.
- Guardas continuam por conveniência:
  - `isAuthenticated`
  - `isStaff`
  - `isStudent`
- Rotas ajustadas para o contrato:
  - `src/app/(app)/layout.tsx`
  - `src/app/aluno/page.tsx`

---

## Compatibilidade mock x Supabase

- Mock e Supabase já passam pelo mesmo mapeador do contexto.
- Isso garante shape idêntico no consumo da UI, reduzindo ifs por ambiente.
- O que ainda não vier da origem (ex.: `academyIds/unitIds`) fica explicitamente vazio (`[]`) até a migração completa do backend.

---

## Próximo passo recomendado (antes de PROD)

- Enriquecer o retorno da sessão Supabase com `academy_ids/unit_ids` reais da `my_profile` (ou fonte equivalente), mantendo o mesmo contrato.
