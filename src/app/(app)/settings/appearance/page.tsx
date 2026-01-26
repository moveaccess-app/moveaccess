'use client';

import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { useTheme, type Theme } from '@/lib/theme-provider';

// ============================================================================
// ÍCONES
// ============================================================================

const icons = {
  sun: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  moon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  monitor: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  back: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
};

// ============================================================================
// OPÇÕES DE TEMA
// ============================================================================

const themeOptions: { value: Theme; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'light',
    label: 'Claro',
    description: 'Tema claro para uso diurno',
    icon: icons.sun,
  },
  {
    value: 'dark',
    label: 'Escuro',
    description: 'Tema escuro para reduzir o cansaço visual',
    icon: icons.moon,
  },
  {
    value: 'system',
    label: 'Sistema',
    description: 'Usa a preferência do seu dispositivo',
    icon: icons.monitor,
  },
];

// ============================================================================
// COMPONENTE DE OPÇÃO DE TEMA
// ============================================================================

function ThemeOption({
  option,
  isSelected,
  onSelect,
}: {
  option: typeof themeOptions[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left
        ${isSelected 
          ? 'border-[var(--status-info)] bg-[var(--status-info-background)]' 
          : 'border-[var(--divider-primary)] bg-[var(--background-primary)] hover:border-[var(--element-secondary)]'
        }
      `}
    >
      <div className={`
        p-2 rounded-lg 
        ${isSelected 
          ? 'bg-[var(--status-info)] text-white' 
          : 'bg-[var(--background-tertiary)] text-[var(--element-secondary)]'
        }
      `}>
        {option.icon}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${isSelected ? 'text-[var(--status-info)]' : 'text-[var(--element-primary)]'}`}>
          {option.label}
        </p>
        <p className="text-sm text-[var(--element-secondary)]">
          {option.description}
        </p>
      </div>
      {isSelected && (
        <div className="text-[var(--status-info)]">
          {icons.check}
        </div>
      )}
    </button>
  );
}

// ============================================================================
// PREVIEW DO TEMA
// ============================================================================

function ThemePreview() {
  return (
    <Card className="p-4 border border-[var(--divider-primary)]">
      <p className="text-xs font-medium text-[var(--element-secondary)] uppercase tracking-wide mb-3">
        Preview
      </p>
      
      <div className="space-y-3">
        {/* Mini card */}
        <div className="p-3 rounded-lg bg-[var(--background-secondary)] border border-[var(--divider-primary)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[var(--background-tertiary)]" />
            <div>
              <div className="h-3 w-20 bg-[var(--element-primary)] rounded opacity-80" />
              <div className="h-2 w-14 bg-[var(--element-secondary)] rounded mt-1 opacity-60" />
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--status-positive)] text-white">
              Ativo
            </span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--status-alert)] text-[var(--element-primary)]">
              Alerta
            </span>
          </div>
        </div>
        
        {/* Mini buttons */}
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-medium rounded bg-[var(--element-primary)] text-[var(--base-primary)]">
            Primário
          </button>
          <button className="px-3 py-1.5 text-xs font-medium rounded border border-[var(--divider-primary)] text-[var(--element-primary)] bg-[var(--background-primary)]">
            Secundário
          </button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header 
        title="Aparência" 
        actions={
          <a 
            href="/settings" 
            className="flex items-center gap-1 text-sm text-[var(--element-secondary)] hover:text-[var(--element-primary)]"
          >
            {icons.back}
            Voltar
          </a>
        }
      />

      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Seção Tema */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--element-primary)] mb-1">
              Tema
            </h2>
            <p className="text-sm text-[var(--element-secondary)] mb-4">
              Escolha como o MoveAccess deve aparecer para você.
            </p>
            
            <Card className="p-1 border border-[var(--divider-primary)]">
              <div className="space-y-1">
                {themeOptions.map((option) => (
                  <ThemeOption
                    key={option.value}
                    option={option}
                    isSelected={theme === option.value}
                    onSelect={() => setTheme(option.value)}
                  />
                ))}
              </div>
            </Card>
          </section>
          
          {/* Preview */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--element-primary)] mb-1">
              Visualização
            </h2>
            <p className="text-sm text-[var(--element-secondary)] mb-4">
              Veja como os elementos aparecem com o tema atual.
            </p>
            
            <ThemePreview />
          </section>
          
          {/* Info */}
          <section className="pt-4 border-t border-[var(--divider-primary)]">
            <p className="text-xs text-[var(--element-secondary)]">
              Sua preferência de tema é salva automaticamente e será lembrada em suas próximas visitas.
            </p>
          </section>
          
        </div>
      </div>
    </div>
  );
}
