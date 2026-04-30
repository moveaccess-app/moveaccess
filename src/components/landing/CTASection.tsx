'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { capture } from '@/lib/analytics';

export function CTASection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 via-gray-950 to-emerald-950/40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
            Pronto para organizar
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              a operação da sua academia?
            </span>
          </h2>

          <p className="mt-6 text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Crie sua conta, configure em minutos e comece a operar no mesmo dia. Acesso, cobrança e gestão — tudo conectado.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              onClick={() => capture('cta_clicked', { location: 'final', button_text: 'Criar minha academia' })}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-base font-semibold text-white no-underline shadow-xl shadow-cyan-500/25 transition-all hover:-translate-y-0.5 hover:text-white hover:no-underline hover:shadow-2xl hover:shadow-cyan-500/30"
            >
              Criar minha academia
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-4 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 no-underline transition-all hover:border-slate-600 hover:bg-slate-800/50 hover:text-white hover:no-underline"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="mt-6 text-xs text-slate-600">
            Grátis para começar. Sem cartão de crédito. Configure em 5 minutos.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
