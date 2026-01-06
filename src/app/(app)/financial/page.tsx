import { Header } from '@/components/common/Header';

export default function FinancialPage() {
  return (
    <div>
      <Header title="Financial" />
      <div className="p-8">
        <div
          className="rounded-lg p-8 text-center"
          style={{
            backgroundColor: 'var(--background-primary)',
            border: '2px dashed var(--divider-primary)',
          }}
        >
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--element-primary)' }}>
            Financial Module
          </h3>
          <p style={{ color: 'var(--element-secondary)' }}>
            Módulo financeiro será implementado em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
