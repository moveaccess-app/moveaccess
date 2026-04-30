'use client';

import Link from 'next/link';

const FOOTER_LINKS = [
  {
    title: 'Produto',
    links: [
      { label: 'Controle de Acesso', href: '#pilares' },
      { label: 'Financeiro', href: '#destaque' },
      { label: 'Portal do Aluno', href: '#pilares' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre', href: '#' },
      { label: 'Contato', href: '#' },
      { label: 'Termos de Uso', href: '#' },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-800/50 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2.5 text-white no-underline hover:text-white hover:no-underline">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-950">M</span>
              </div>
              <span className="text-lg font-bold tracking-tight">
                Move<span className="text-cyan-400">Access</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              Sistema de gestão para academias. Acesso, cobrança e gestão do aluno conectados em uma operação simples.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-300 mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-500 no-underline transition-colors hover:text-slate-300 hover:no-underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} MoveAccess. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span>Feito com</span>
            <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>para academias brasileiras</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
