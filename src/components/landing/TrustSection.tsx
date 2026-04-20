'use client';

import { motion } from 'framer-motion';
import {
  Shield,
  Zap,
  Database,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';

const TRUST_ITEMS = [
  {
    icon: Database,
    title: 'Multi-tenant real',
    description: 'Cada academia com seus dados completamente isolados. Segurança e privacidade de verdade.',
  },
  {
    icon: Zap,
    title: 'Onboarding em minutos',
    description: 'Aluno cadastrado, com contrato aceito e plano ativo — em uma única sessão.',
  },
  {
    icon: Shield,
    title: 'Integração financeira real',
    description: 'Cobrança real via Asaas. PIX, boleto e cartão. Não é simulação — é dinheiro entrando.',
  },
  {
    icon: RefreshCw,
    title: 'Contratos versionados',
    description: 'Histórico completo de versões. Cada aceite registrado com data, hora e aluno.',
  },
  {
    icon: Eye,
    title: 'Portal com autonomia',
    description: 'O aluno vê plano, pagamentos, contrato e QR Code — sem ligar para a recepção.',
  },
  {
    icon: Lock,
    title: 'Acesso controlado',
    description: 'QR Code + regras do plano + política de inadimplência. Entrada só para quem pode.',
  },
];

export function TrustSection() {
  return (
    <section className="relative py-20 md:py-28">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-3">
            Confiança
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Feito para a operação real
            <br className="hidden sm:block" />
            da academia.
          </h2>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Não é promessa de funcionalidade futura. É o que o sistema já faz — da recepção ao financeiro, tudo no mesmo fluxo.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex gap-4 p-5 rounded-xl border border-slate-800/40 bg-slate-900/30 hover:border-slate-700/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { value: '6', label: 'Módulos integrados' },
            { value: '< 5 min', label: 'Para cadastrar um aluno' },
            { value: '1 dia', label: 'Para começar a operar' },
            { value: '100%', label: 'Web — sem instalar nada' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-xl border border-slate-800/40 bg-slate-900/20">
              <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
