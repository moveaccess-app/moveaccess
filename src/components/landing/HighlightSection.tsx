'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const ACCESS_FEATURES = [
  'QR Code dinâmico e único por aluno',
  'Validação em tempo real no check-in',
  'Regras de acesso definidas pelo plano',
  'Bloqueio automático por inadimplência',
  'Histórico completo de entradas e saídas',
  'Scanner web — sem app ou hardware especial',
];

const BILLING_FEATURES = [
  'Recorrência automática via Asaas',
  'PIX, boleto e cartão de crédito',
  'Detecção automática de inadimplência',
  'Política de bloqueio configurável por academia',
  'Extrato financeiro por aluno',
  'Cobrança avulsa quando necessário',
];

function FeatureCard({
  title,
  subtitle,
  features,
  gradient,
  iconGradient,
  delay,
}: {
  title: string;
  subtitle: string;
  features: string[];
  gradient: string;
  iconGradient: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay }}
      className="relative rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 lg:p-8 overflow-hidden group"
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradient}`} />

      {/* Glow effect */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 ${iconGradient} rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity`} />

      <div className="relative">
        <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{subtitle}</p>

        <div className="space-y-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <div className={`mt-0.5 w-5 h-5 rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center shrink-0`}>
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </div>
              <span className="text-sm text-slate-300 leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function HighlightSection() {
  return (
    <section id="destaque" className="relative py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">
            Diferenciais
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Os dois pilares que fazem
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              a diferença na operação.
            </span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Controle de acesso e cobrança recorrente são os motores do MoveAccess. Quando funcionam juntos, a operação muda de patamar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          <FeatureCard
            title="Controle de Acesso"
            subtitle="Saber quem entra. Sempre."
            features={ACCESS_FEATURES}
            gradient="from-cyan-500 to-blue-500"
            iconGradient="bg-cyan-500"
            delay={0}
          />
          <FeatureCard
            title="Cobrança Recorrente"
            subtitle="Cobrar sem correr atrás."
            features={BILLING_FEATURES}
            gradient="from-emerald-500 to-green-500"
            iconGradient="bg-emerald-500"
            delay={0.1}
          />
        </div>

        {/* Contracts bridge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 lg:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Contratos no fluxo</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                O aluno aceita o contrato durante o cadastro. Templates reutilizáveis, versionamento automático e histórico completo. Sem papel, sem burocracia — e com registro de aceite.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:shrink-0">
              {['Templates', 'Versionamento', 'Aceite digital', 'Histórico'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/15"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
