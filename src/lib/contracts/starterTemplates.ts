/**
 * Starter Templates — Ready-to-use contract templates for academies.
 *
 * These templates use dynamic variables ({{variable}}) that are resolved
 * at acceptance time with real data from the student/academy context.
 */

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  tags: string[];
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'mensal_padrao',
    name: 'Contrato Mensal Padrão',
    description: 'Contrato para planos mensais com cláusulas essenciais. Ideal para começar.',
    tags: ['mensal', 'básico'],
    content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS — PLANO MENSAL

CONTRATADA: {{academia_nome}}
CNPJ: {{academia_cnpj}}
Unidade: {{unidade_nome}}

CONTRATANTE: {{aluno_nome}}
CPF: {{aluno_cpf}}
E-mail: {{aluno_email}}

Plano contratado: {{plano_nome}}
Valor: {{plano_valor}} ({{plano_periodo}})
Data de início: {{data_inicio}}

CLÁUSULA 1ª — DO OBJETO
O presente contrato tem por objeto a prestação de serviços de atividade física pela CONTRATADA ao CONTRATANTE, incluindo acesso às instalações, equipamentos e atividades disponíveis na unidade indicada.

CLÁUSULA 2ª — DO PRAZO
O contrato vigora por prazo indeterminado, com renovação automática mensal, podendo ser cancelado por qualquer das partes mediante aviso prévio de 30 (trinta) dias.

CLÁUSULA 3ª — DO VALOR E PAGAMENTO
3.1. O CONTRATANTE pagará o valor de {{plano_valor}} por mês, conforme o plano contratado.
3.2. O pagamento deverá ser efetuado até a data de vencimento definida no ato da contratação.
3.3. O atraso no pagamento poderá acarretar a suspensão temporária do acesso.

CLÁUSULA 4ª — DAS OBRIGAÇÕES DO CONTRATANTE
4.1. Respeitar as normas internas de uso das instalações.
4.2. Utilizar os equipamentos de forma adequada e responsável.
4.3. Comunicar qualquer alteração em seus dados cadastrais.
4.4. Apresentar atestado médico quando solicitado.

CLÁUSULA 5ª — DAS OBRIGAÇÕES DA CONTRATADA
5.1. Disponibilizar as instalações e equipamentos em condições adequadas de uso.
5.2. Manter profissionais capacitados para orientação.
5.3. Garantir a segurança e higiene das instalações.

CLÁUSULA 6ª — DA RESCISÃO
6.1. O contrato poderá ser rescindido por qualquer das partes com aviso prévio de 30 dias.
6.2. A rescisão não exime o CONTRATANTE do pagamento de valores em aberto.

CLÁUSULA 7ª — DISPOSIÇÕES GERAIS
7.1. O CONTRATANTE declara estar apto à prática de atividades físicas.
7.2. Fica eleito o foro da comarca do estabelecimento da CONTRATADA para dirimir quaisquer questões.

{{academia_nome}}
Data: {{data_aceite}}`,
  },

  {
    id: 'matricula_adesao',
    name: 'Termo de Matrícula e Adesão',
    description: 'Termo simplificado de adesão para matrícula rápida de novos alunos.',
    tags: ['matrícula', 'adesão', 'rápido'],
    content: `TERMO DE MATRÍCULA E ADESÃO

Eu, {{aluno_nome}}, portador(a) do CPF {{aluno_cpf}}, declaro que:

1. Estou me matriculando na {{academia_nome}} (CNPJ: {{academia_cnpj}}), unidade {{unidade_nome}}.

2. Aderi ao plano "{{plano_nome}}" com valor de {{plano_valor}} ({{plano_periodo}}).

3. Início da vigência: {{data_inicio}}.

4. Comprometo-me a:
   a) Respeitar as normas e regulamentos internos da academia;
   b) Efetuar os pagamentos nas datas acordadas;
   c) Comunicar alterações cadastrais;
   d) Utilizar equipamentos de forma adequada.

5. Declaro estar ciente de que:
   a) O atraso no pagamento pode resultar em suspensão do acesso;
   b) O cancelamento deve ser solicitado com 30 dias de antecedência;
   c) É recomendada avaliação médica prévia para prática de atividades físicas.

6. Li e concordo com o regulamento interno disponibilizado pela academia.

{{aluno_nome}}
CPF: {{aluno_cpf}}
Data de aceite: {{data_aceite}}`,
  },

  {
    id: 'anual_fidelidade',
    name: 'Contrato Anual com Fidelidade',
    description: 'Contrato para planos anuais com cláusula de fidelidade e multa rescisória.',
    tags: ['anual', 'fidelidade'],
    content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS — PLANO ANUAL

CONTRATADA: {{academia_nome}}
CNPJ: {{academia_cnpj}}
Unidade: {{unidade_nome}}

CONTRATANTE: {{aluno_nome}}
CPF: {{aluno_cpf}}
E-mail: {{aluno_email}}

Plano: {{plano_nome}}
Valor: {{plano_valor}} ({{plano_periodo}})
Início: {{data_inicio}}

CLÁUSULA 1ª — DO OBJETO
Prestação de serviços de atividade física, com acesso às instalações, equipamentos e atividades oferecidas pela CONTRATADA na unidade indicada.

CLÁUSULA 2ª — DO PRAZO E FIDELIDADE
2.1. O presente contrato tem prazo de 12 (doze) meses a contar da data de início.
2.2. Ao final do período, será renovado automaticamente como mensal, salvo manifestação contrária com 30 dias de antecedência.

CLÁUSULA 3ª — DO VALOR E PAGAMENTO
3.1. O valor do plano é de {{plano_valor}} por mês.
3.2. O pagamento deve ser efetuado até a data de vencimento mensal.
3.3. Atrasos superiores a 15 dias poderão resultar em suspensão do acesso.

CLÁUSULA 4ª — DA MULTA RESCISÓRIA
4.1. Em caso de rescisão antecipada pelo CONTRATANTE antes do término do período de fidelidade, será cobrada multa proporcional aos meses restantes, limitada a 50% do valor remanescente do contrato.
4.2. A multa não se aplica nos casos previstos pelo Código de Defesa do Consumidor.

CLÁUSULA 5ª — DAS OBRIGAÇÕES DO CONTRATANTE
5.1. Cumprir as normas internas da academia.
5.2. Utilizar os equipamentos adequadamente.
5.3. Comunicar alterações cadastrais em até 10 dias úteis.

CLÁUSULA 6ª — DAS OBRIGAÇÕES DA CONTRATADA
6.1. Manter instalações, equipamentos e equipe em condições adequadas.
6.2. Comunicar alterações em horários ou serviços com antecedência mínima de 7 dias.

CLÁUSULA 7ª — DISPOSIÇÕES GERAIS
7.1. O CONTRATANTE declara estar apto à prática de atividades físicas.
7.2. Foro: comarca do estabelecimento da CONTRATADA.

{{academia_nome}}
Data: {{data_aceite}}`,
  },

  {
    id: 'simplificado',
    name: 'Contrato Simplificado',
    description: 'Versão enxuta para academias que querem agilidade sem burocracia.',
    tags: ['simples', 'rápido'],
    content: `CONTRATO SIMPLIFICADO DE PRESTAÇÃO DE SERVIÇOS

{{academia_nome}} (CNPJ: {{academia_cnpj}}) e {{aluno_nome}} (CPF: {{aluno_cpf}}) celebram o presente contrato:

PLANO: {{plano_nome}} — {{plano_valor}}/{{plano_periodo}}
INÍCIO: {{data_inicio}}
UNIDADE: {{unidade_nome}}

CONDIÇÕES:
1. O acesso às instalações é condicionado à adimplência do plano contratado.
2. O pagamento deve ser realizado até a data de vencimento mensal.
3. O cancelamento requer aviso prévio de 30 dias.
4. O CONTRATANTE compromete-se a seguir as normas internas.
5. A CONTRATADA compromete-se a manter instalações em condições adequadas.
6. Eventuais litígios serão resolvidos no foro da comarca local.

Ao aceitar este contrato, o CONTRATANTE declara estar ciente e de acordo com todas as condições acima.

Data: {{data_aceite}}`,
  },
];

/**
 * Get a starter template by ID.
 */
export function getStarterTemplate(id: string): StarterTemplate | undefined {
  return STARTER_TEMPLATES.find((t) => t.id === id);
}
