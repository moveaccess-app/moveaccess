# PR 12.5 - Convite publico endurecido

## O que mudou

- O link continua sendo por token, sem expor dados sensiveis na URL.
- O convite passa a ter claim real: primeira entrada cria a conta/auth, vincula o invite ao usuario e cria um `student_draft` de origem `invite_link`.
- A continuacao do cadastro sai do link e vai para autenticacao real em `/cadastro/continuar`.
- O operador passa a gerar convite com e-mail esperado obrigatorio e pode compartilhar por WhatsApp com mensagem editavel.

## Como o convite ficou protegido

- Novos convites exigem `expected_email`.
- O claim inicial valida o e-mail no backend antes de criar auth/profile.
- Depois do claim, o invite fica vinculado por `claimed_by_user_id`, `claimed_email`, `claimed_at` e `draft_id`.
- O mesmo link nao pode ser usado para criar mais de um aluno.
- Convites expirados, cancelados ou concluidos param o fluxo com feedback explicito.

## Como funciona o claim

1. O convidado acessa `/cadastro/{token}`.
2. Informa o e-mail vinculado ao convite, nome e senha.
3. O backend faz o claim, cria auth/profile minimo e um draft publico persistido.
4. O usuario entra por login real e continua em `/cadastro/continuar`.

## Como a pessoa continua depois

- O progresso fica salvo em `student_drafts`.
- O login do aluno verifica se existe signup pendente claimado e redireciona para `/cadastro/continuar`.
- A dashboard do aluno tambem mostra um atalho para continuar, caso o cadastro ainda nao tenha sido concluido.

## Compartilhamento por WhatsApp

- O `InviteGenerator` agora coleta nome, e-mail esperado e telefone/WhatsApp opcional.
- Depois de gerar o link, o operador pode:
  - copiar o link
  - editar a mensagem
  - copiar a mensagem
  - abrir o WhatsApp com o link real

## Cupom/desconto

Nao entrou neste PR.

Motivo: o billing atual ainda precisa de uma decisao explicita sobre onde o desconto incide:

- apenas na primeira cobranca
- no valor da assinatura local
- ou nos dois

Implementar cupom agora, sem essa decisao, criaria semantica financeira ambigua. O PR 12.5 deixa o fluxo de convite seguro e rastreavel primeiro, sem inventar motor promocional parcial.