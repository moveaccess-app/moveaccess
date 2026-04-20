'use client';

import { motion } from 'framer-motion';

const ACADEMY_STEPS = [
  {
    number: '01',
    title: 'Crie sua conta',
    description: 'Comece em segundos. Configure o nome, identidade e dados da sua academia.',
  },
  {
    number: '02',
    title: 'Configure a operação',
    description: 'Adicione unidades, convide equipe e defina preferências de acesso.',
  },
  {
    number: '03',
    title: 'Crie seus planos',
    description: 'Defina preço, ciclo, regras de acesso e publique para seus alunos.',
  },
  {
    number: '04',
    title: 'Publique o contrato',
    description: 'Use um template pronto ou crie o seu. Versionamento automático incluso.',
  },
  {
    number: '05',
    title: 'Cadastre alunos',
    description: 'Por convite com link, onboarding guiado ou cadastro direto no sistema.',
  },
  {
    number: '06',
    title: 'Comece a operar',
    description: 'Acesso, cobrança e controle funcionando. No mesmo dia.',
  },
];

const STUDENT_STEPS = [
  {
    number: '01',
    title: 'Recebe convite',
    description: 'A academia envia um link ou cadastra diretamente no sistema.',
  },
  {
    number: '02',
    title: 'Completa o cadastro',
    description: 'Fluxo guiado. Dados pessoais, foto e informações básicas.',
  },
  {
    number: '03',
    title: 'Aceita o contrato',
    description: 'Aceite digital registrado. Sem papel, sem burocracia.',
  },
  {
    number: '04',
    title: 'Plano ativado',
    description: 'Plano vinculado, cobrança configurada, acesso liberado.',
  },
  {
    number: '05',
    title: 'Usa QR Code',
    description: 'Chega na academia, abre o QR no portal e passa no check-in.',
  },
  {
    number: '06',
    title: 'Acompanha pelo portal',
    description: 'Status do plano, pagamentos, vencimentos e contrato — tudo acessível.',
  },
];

function StepCard({
  step,
  index,
  accent,
}: {
  step: (typeof ACADEMY_STEPS)[0];
  index: number;
  accent: 'cyan' | 'emerald';
}) {
  const colors = {
    cyan: {
      number: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-500/5',
      line: 'bg-cyan-500/20',
    },
    emerald: {
      number: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
      line: 'bg-emerald-500/20',
    },
  };
  const c = colors[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="relative flex gap-4"
    >
      {/* Step indicator */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-10 h-10 rounded-full ${c.border} ${c.bg} border flex items-center justify-center`}>
          <span className={`text-xs font-bold ${c.number}`}>{step.number}</span>
        </div>
        {index < 5 && (
          <div className={`w-px flex-1 min-h-[24px] ${c.line} mt-2`} />
        )}
      </div>

      {/* Content */}
      <div className="pb-6">
        <h4 className="text-sm font-semibold text-white mb-1">{step.title}</h4>
        <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
      </div>
    </motion.div>
  );
}

export function JourneySection() {
  return (
    <section id="jornada" className="relative py-20 md:py-28">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 via-transparent to-slate-900/20 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">
            Como funciona
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            De zero a operando.
            <span className="text-slate-400"> Em um dia.</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Duas jornadas simples. A academia configura tudo rápido. O aluno começa a usar sem fricção.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Academy journey */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Jornada da Academia</h3>
                <p className="text-xs text-slate-500">Do cadastro à operação completa</p>
              </div>
            </motion.div>

            <div className="space-y-0">
              {ACADEMY_STEPS.map((step, i) => (
                <StepCard key={step.number} step={step} index={i} accent="cyan" />
              ))}
            </div>
          </div>

          {/* Student journey */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Jornada do Aluno</h3>
                <p className="text-xs text-slate-500">Da entrada ao uso autônomo</p>
              </div>
            </motion.div>

            <div className="space-y-0">
              {STUDENT_STEPS.map((step, i) => (
                <StepCard key={step.number} step={step} index={i} accent="emerald" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
