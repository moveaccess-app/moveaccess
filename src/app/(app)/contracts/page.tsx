import { Header } from '@/components/common/Header';

export default function ContractsPage() {
  return (
    <div>
      <Header title="Contracts" />
      <div className="p-8">
        <div
          className="rounded-lg p-8 text-center"
          style={{
            backgroundColor: 'var(--background-primary)',
            border: '2px dashed var(--divider-primary)',
          }}
        >
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--element-primary)' }}>
            Contracts Module
          </h3>
          <p style={{ color: 'var(--element-secondary)' }}>
            Módulo de gestão de contratos será implementado em breve.
          </p>
        </div>
      </div>
    </div>
  );
}
