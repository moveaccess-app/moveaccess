'use client';

import { motion } from 'framer-motion';
import {
  QrCode,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Smartphone,
} from 'lucide-react';

const PILLARS = [
  {
    icon: QrCode,
    title: 'Controle de Acesso',
    description: 'QR Code dinâmico por aluno. Check-in com validação em tempo real. Regras de acesso pelo plano. Bloqueio automático por inadimplência.',
    color: 'from-cyan-500 to-blue-500',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-400',
  },
  {
    icon: Users,
    title: 'Gestão de Alunos',
    description: 'Cadastro completo. Onboarding guiado. Status em tempo real. Documentos e histórico. Convite por link personalizado.',
    color: 'from-violet-500 to-purple-500',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
  },
  {
    icon: CreditCard,
    title: 'Planos e Assinaturas',
    description: 'Planos com preço, ciclo e regras de acesso. Assinatura recorrente integrada. Controle completo da recorrência.',
    color: 'from-emerald-500 to-green-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: FileText,
    title: 'Contratos Inteligentes',
    description: 'Templates reutilizáveis. Versionamento automático. Aceite digital no fluxo de cadastro. Histórico completo por aluno.',
    color: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
  },
  {
    icon: BarChart3,
    title: 'Financeiro Integrado',
    description: 'Cobrança via PIX, boleto e cartão. Integração real com Asaas. Inadimplência detectada e tratada. Extrato por aluno.',
    color: 'from-rose-500 to-pink-500',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
  },
  {
    icon: Smartphone,
    title: 'Portal do Aluno',
    description: 'QR Code para acesso. Status do plano. Pagamentos e vencimentos. Contrato. Tudo sem depender da recepção.',
    color: 'from-sky-500 to-indigo-500',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-400',
  },
];

export function PillarsSection() {
  return (
    <section id="pilares" className="relative py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">
            Produto
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Tudo que sua academia precisa.
            <br className="hidden sm:block" />
            <span className="text-slate-400">Nada que ela não precise.</span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Seis pilares que funcionam juntos — não módulos soltos. Do acesso ao financeiro, tudo conectado na mesma operação.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {PILLARS.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group relative rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 hover:border-slate-700/80 transition-all overflow-hidden"
            >
              {/* Gradient accent on hover */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${pillar.color} opacity-0 group-hover:opacity-100 transition-opacity`} />

              <div className={`w-11 h-11 rounded-xl ${pillar.iconBg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                <pillar.icon className={`w-5 h-5 ${pillar.iconColor}`} />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{pillar.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{pillar.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
