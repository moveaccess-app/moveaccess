'use client';

import { motion } from 'framer-motion';
import {
  ShieldAlert,
  FileSpreadsheet,
  FileX2,
  AlertTriangle,
  HelpCircle,
  Layers,
} from 'lucide-react';

const PAIN_POINTS = [
  {
    icon: ShieldAlert,
    title: 'Entrada na confiança',
    description: 'Sem saber quem pode entrar, quem está em dia e quem deveria estar bloqueado.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Cobrança em planilha',
    description: 'Boletos soltos, cadernos, "eu pago semana que vem". Sem recorrência, sem rastreio.',
  },
  {
    icon: FileX2,
    title: 'Contrato desatualizado',
    description: 'Risco jurídico real. Sem formalização, sem histórico, sem aceite registrado.',
  },
  {
    icon: AlertTriangle,
    title: 'Inadimplência sem regra',
    description: 'Ninguém sabe quem deve. Ninguém bloqueia. Ninguém cobra de forma consistente.',
  },
  {
    icon: HelpCircle,
    title: 'Aluno sem autonomia',
    description: 'Pergunta tudo na recepção. Não sabe o status do plano, não acessa nada sozinho.',
  },
  {
    icon: Layers,
    title: 'Operação fragmentada',
    description: 'Acesso, cobrança e cadastro em sistemas diferentes. Nada conversa entre si.',
  },
];

export function ProblemSection() {
  return (
    <section id="problema" className="relative py-20 md:py-28">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">
            O problema
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Sua academia ainda opera assim?
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Se alguma dessas dores é familiar, você não está sozinho. A maioria das academias ainda opera com ferramentas soltas e processos manuais.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {PAIN_POINTS.map((point, i) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group rounded-xl border border-slate-800/60 bg-slate-900/50 p-5 lg:p-6 hover:border-slate-700/80 hover:bg-slate-800/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4 group-hover:bg-red-500/15 transition-colors">
                <point.icon className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{point.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{point.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Solution bridge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-cyan-500/20 bg-cyan-500/5">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-sm text-cyan-300 font-medium">
              O MoveAccess conecta tudo isso em uma operação única
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
