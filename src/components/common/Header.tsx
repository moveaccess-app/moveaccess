'use client';

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  return (
    <header
      className="border-b px-8 py-4 flex items-center justify-between"
      style={{
        backgroundColor: 'var(--background-primary)',
        borderColor: 'var(--divider-primary)',
      }}
    >
      <h2 className="text-2xl font-semibold" style={{ color: 'var(--element-primary)' }}>
        {title}
      </h2>
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </header>
  );
}
