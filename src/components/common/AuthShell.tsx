import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, darkSurfaceInputClassName } from '@/components/ui';

interface AuthPageLayoutProps {
  backHref: string;
  children: ReactNode;
}

export function AuthPageLayout({ backHref, children }: AuthPageLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06162b]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_20%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_22%,transparent_78%,rgba(255,255,255,0.02))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_55%,rgba(2,6,23,0.35)_100%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-[460px]">
          <Link
            href={backHref}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-300 no-underline transition hover:text-white hover:no-underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a landing
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_18px_60px_rgba(2,6,23,0.38)]">
      <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-cyan-400 to-green-400" />
      <div className="p-9 sm:p-10">{children}</div>
    </Card>
  );
}

export function AuthEyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-sky-500">
      {children}
    </div>
  );
}

interface AuthHeadingProps {
  title: string;
  subtitle: string;
}

export function AuthHeading({ title, subtitle }: AuthHeadingProps) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-3 max-w-[32ch] text-lg leading-8 text-slate-600">{subtitle}</p>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="my-7 flex items-center gap-4">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-sm font-medium text-slate-400">ou</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

export function AuthLoadingSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export const authFieldShellClassName = 'flex h-14 items-center rounded-xl border border-slate-800 bg-[#0e1726] px-4 text-white shadow-inner shadow-black/10 transition focus-within:border-cyan-400/70';

export const authInputClassName = `h-full ${darkSurfaceInputClassName}`;

export const authPrimaryButtonClassName = 'inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-green-500 px-5 text-base font-semibold text-white no-underline shadow-[0_10px_30px_rgba(34,211,238,0.22)] transition hover:brightness-105 hover:text-white hover:no-underline active:scale-[0.99]';

export const authSecondaryButtonClassName = 'inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-base font-semibold text-slate-800 no-underline shadow-sm transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-950 hover:no-underline hover:shadow-md active:scale-[0.99]';