import { Sidebar } from '@/components/common/Sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--background-secondary)' }}>
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
