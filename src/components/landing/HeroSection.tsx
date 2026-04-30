'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { capture } from '@/lib/analytics';

/* ── Dashboard Mockup ────────────────────────────────────── */

const SIDEBAR_ITEMS = [
  { name: 'Visão Geral', active: true },
  { name: 'Alunos', active: false },
  { name: 'Planos', active: false },
  { name: 'Financeiro', active: false },
  { name: 'Acesso', active: false },
  { name: 'Contratos', active: false },
];

const STATS = [
  { label: 'Alunos ativos', value: '127', change: '+12' },
  { label: 'Receita (mês)', value: 'R$ 12.4k', change: '+8%' },
  { label: 'Check-ins hoje', value: '34', change: '' },
];

const CHECKINS = [
  { name: 'João Silva', plan: 'Premium', time: '08:32' },
  { name: 'Maria Santos', plan: 'Mensal', time: '08:45' },
  { name: 'Pedro Lima', plan: 'Premium', time: '09:01' },
  { name: 'Ana Costa', plan: 'Trimestral', time: '09:15' },
];

function DashboardMockup() {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-900/90 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/30 bg-slate-800/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-slate-700/50 rounded-md px-4 py-1 text-[10px] text-slate-500">
            app.moveaccess.com
          </div>
        </div>
      </div>

      <div className="flex min-h-[280px] lg:min-h-[320px]">
        {/* Sidebar */}
        <div className="w-36 lg:w-40 border-r border-slate-700/30 p-3 space-y-1 hidden md:block">
          <div className="flex items-center gap-2 mb-5 px-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
              <span className="text-[7px] font-bold text-gray-950">M</span>
            </div>
            <span className="text-[10px] font-bold text-white">MoveAccess</span>
          </div>
          {SIDEBAR_ITEMS.map((item) => (
            <div
              key={item.name}
              className={`text-[10px] px-2.5 py-1.5 rounded-md transition-colors ${
                item.active
                  ? 'bg-cyan-500/15 text-cyan-400 font-medium'
                  : 'text-slate-500'
              }`}
            >
              {item.name}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-3 lg:p-4 space-y-3">
          <div className="text-[11px] font-semibold text-slate-300">Visão Geral</div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-slate-700/30 bg-slate-800/40 p-2 lg:p-2.5"
              >
                <div className="text-[8px] lg:text-[9px] text-slate-500 truncate">{stat.label}</div>
                <div className="text-xs lg:text-sm font-bold text-white mt-0.5">{stat.value}</div>
                {stat.change && (
                  <div className="text-[8px] lg:text-[9px] text-emerald-400 mt-0.5">{stat.change}</div>
                )}
              </div>
            ))}
          </div>

          {/* Check-ins table */}
          <div className="rounded-lg border border-slate-700/30 bg-slate-800/20 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-700/20">
              <div className="text-[10px] font-medium text-slate-400">Últimos check-ins</div>
            </div>
            {CHECKINS.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between px-3 py-1.5 lg:py-2 border-b border-slate-700/10 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-slate-300">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[8px] text-slate-500 hidden sm:inline">{item.plan}</span>
                  <span className="text-[9px] text-slate-600">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Phone Mockup ────────────────────────────────────────── */

const QR_PATTERN = [
  1,1,1,1,1,0,1,0,1,1,1,1,1,
  1,0,0,0,1,0,0,1,1,0,0,0,1,
  1,0,1,0,1,0,1,0,1,0,1,0,1,
  1,0,0,0,1,0,0,1,1,0,0,0,1,
  1,1,1,1,1,0,1,0,1,1,1,1,1,
  0,0,0,0,0,1,0,1,0,0,0,0,0,
  1,0,1,1,0,0,1,0,1,0,1,0,1,
  0,1,0,0,1,0,0,1,0,1,0,1,0,
  1,1,1,1,1,0,1,0,0,1,0,1,0,
  1,0,0,0,1,0,0,1,1,0,1,0,1,
  1,0,1,0,1,0,1,0,0,1,0,0,1,
  1,0,0,0,1,0,0,1,0,0,1,1,0,
  1,1,1,1,1,0,1,0,1,0,0,1,1,
];

function PhoneMockup() {
  return (
    <div className="w-[200px] lg:w-[220px] rounded-[2.5rem] border-[3px] border-slate-600/80 bg-slate-900 p-2.5 shadow-2xl shadow-cyan-500/10">
      {/* Notch */}
      <div className="mx-auto w-16 h-4 rounded-b-xl bg-slate-800 mb-3" />

      <div className="px-3 space-y-3">
        {/* App header */}
        <div className="text-center">
          <div className="text-[10px] font-bold text-white">MoveAccess</div>
          <div className="text-[8px] text-slate-500">Portal do Aluno</div>
        </div>

        {/* QR Code */}
        <div className="mx-auto w-[100px] h-[100px] rounded-xl bg-white p-2.5 shadow-inner">
          <div className="grid grid-cols-[repeat(13,1fr)] gap-[1px] w-full h-full">
            {QR_PATTERN.map((cell, i) => (
              <div
                key={i}
                className={cell ? 'bg-gray-900 rounded-[0.5px]' : 'bg-transparent'}
              />
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-semibold">Acesso Liberado</span>
          </div>
          <div className="text-[9px] text-slate-400">Plano Premium • Mensal</div>
        </div>

        {/* Payment */}
        <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-700/30">
          <div className="text-[8px] text-slate-500">Próximo vencimento</div>
          <div className="text-[10px] text-slate-200 font-medium mt-0.5">15 de maio, 2026</div>
          <div className="text-[8px] text-emerald-400 mt-0.5">R$ 149,90 • Em dia</div>
        </div>
      </div>

      {/* Home indicator */}
      <div className="mx-auto w-12 h-1 rounded-full bg-slate-600 mt-3 mb-1" />
    </div>
  );
}

/* ── Hero Section ────────────────────────────────────────── */

export function HeroSection() {
  return (
    <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(6,182,212,1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-cyan-500/8 rounded-full blur-[128px]" />
        <div className="absolute top-16 right-1/3 w-[400px] h-[400px] bg-emerald-500/6 rounded-full blur-[128px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-700/50 bg-slate-800/50 backdrop-blur mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400">Sistema para academias</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold tracking-tight leading-[1.08]">
              Quem entra. Quem paga.
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Tudo sob controle.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
              O MoveAccess une controle de acesso por QR Code, cobrança recorrente e gestão completa do aluno em um sistema feito para academias que levam a operação a sério.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                onClick={() => capture('cta_clicked', { location: 'hero', button_text: 'Começar agora' })}
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-sm font-semibold text-white no-underline shadow-lg shadow-cyan-500/25 transition-all hover:-translate-y-0.5 hover:text-white hover:no-underline hover:shadow-xl hover:shadow-cyan-500/30"
              >
                Começar agora
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <button
                onClick={() => document.querySelector('#pilares')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:border-slate-600 transition-all bg-transparent cursor-pointer"
              >
                Ver como funciona
              </button>
            </div>

            {/* Social hint */}
            <div className="mt-8 flex items-center gap-3 text-xs text-slate-500">
              <div className="flex -space-x-2">
                {['bg-cyan-500', 'bg-emerald-500', 'bg-amber-500'].map((bg, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full ${bg} border-2 border-gray-950 flex items-center justify-center text-[9px] font-bold text-white`}
                  >
                    {['J', 'M', 'P'][i]}
                  </div>
                ))}
              </div>
              <span>Grátis para começar · Sem cartão de crédito</span>
            </div>
          </motion.div>

          {/* Mockups */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="mt-12 lg:mt-0 relative"
          >
            {/* Dashboard — hidden on mobile */}
            <div className="hidden sm:block relative z-10">
              <DashboardMockup />
            </div>

            {/* Phone — overlapping on desktop, centered on mobile */}
            <div className="sm:absolute sm:-bottom-8 sm:-right-4 lg:-bottom-12 lg:-right-6 sm:z-20 flex justify-center sm:block">
              <PhoneMockup />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
