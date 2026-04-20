'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { capture } from '@/lib/analytics';

const NAV_ITEMS = [
  { label: 'Produto', href: '#pilares' },
  { label: 'Como funciona', href: '#jornada' },
  { label: 'Diferenciais', href: '#destaque' },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  // Close mobile menu on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-gray-950/80 backdrop-blur-xl border-b border-slate-800/50 shadow-lg shadow-black/20'
          : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-sm font-bold text-gray-950">M</span>
            </div>
            <span className="text-lg font-bold tracking-tight">
              Move<span className="text-cyan-400">Access</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollTo(item.href)}
                className="text-sm text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              onClick={() => capture('cta_clicked', { location: 'navbar', button_text: 'Começar agora' })}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5 transition-all"
            >
              Começar agora
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white bg-transparent border-none"
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-slate-800/50 bg-gray-950/95 backdrop-blur-xl">
            <div className="pt-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollTo(item.href)}
                  className="block w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:text-white bg-transparent border-none cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-3 px-3 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="text-sm text-slate-400 hover:text-white py-2"
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  onClick={() => capture('cta_clicked', { location: 'navbar', button_text: 'Começar agora' })}
                  className="block text-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-sm font-semibold text-white"
                >
                  Começar agora
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
