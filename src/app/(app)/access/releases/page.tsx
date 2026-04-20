'use client';

import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const icons = {
  back: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  construction: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  ),
};

export default function AccessReleasesPage() {
  return (
    <div className="min-h-screen bg-[var(--background-primary)]">
      <Header title="Liberações" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/access"
            className="p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
          >
            {icons.back}
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--element-primary)]">
              Liberações
            </h1>
            <p className="text-sm text-[var(--element-secondary)]">
              Liberação manual e configuração de acesso
            </p>
          </div>
        </div>

        {/* Em Breve Card */}
        <Card className="p-8 sm:p-12">
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="p-4 rounded-full bg-[var(--background-tertiary)] text-[var(--element-secondary)] mb-6">
              {icons.construction}
            </div>

            <h2 className="text-xl font-semibold text-[var(--element-primary)] mb-2">
              Em breve
            </h2>

            <p className="text-[var(--element-secondary)] mb-6">
              A liberação manual avançada e a configuração de QR Code por unidade estão sendo desenvolvidas. 
              Enquanto isso, use o check-in manual para liberar acessos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link href="/acesso/checkin">
                <Button className="w-full sm:w-auto">
                  Ir para Check-in Manual
                </Button>
              </Link>
              <Link href="/access">
                <Button variant="outline" className="w-full sm:w-auto">
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
