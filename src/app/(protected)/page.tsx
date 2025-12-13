import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      {/* Simple Header */}
      <header className="border-b border-zinc-200 bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900">MoveAccess</h1>
          <div className="text-sm text-zinc-600">Dashboard (Área Protegida)</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 text-2xl font-bold text-zinc-900">
            Dashboard - Placeholder
          </h2>

          <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
            <p className="mb-4 text-zinc-600">
              Esta é a área protegida do aplicativo, acessível apenas após autenticação.
            </p>
            <p className="text-sm text-zinc-500">
              A implementação completa do dashboard e módulos será feita nas próximas tasks.
            </p>
          </div>

          {/* Modules Grid */}
          <h3 className="mb-4 text-lg font-semibold text-zinc-900">
            Módulos Planejados:
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h4 className="mb-2 font-semibold text-zinc-900">Visão Geral</h4>
              <p className="text-sm text-zinc-600">
                Dashboard principal com métricas e KPIs
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h4 className="mb-2 font-semibold text-zinc-900">Alunos</h4>
              <p className="text-sm text-zinc-600">
                Gestão de alunos e membros
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h4 className="mb-2 font-semibold text-zinc-900">Controle de Acesso</h4>
              <p className="text-sm text-zinc-600">
                Catracas, QR codes e biometria
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h4 className="mb-2 font-semibold text-zinc-900">Financeiro</h4>
              <p className="text-sm text-zinc-600">
                Gestão financeira e cobranças
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h4 className="mb-2 font-semibold text-zinc-900">Relatórios</h4>
              <p className="text-sm text-zinc-600">
                Análises e relatórios detalhados
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h4 className="mb-2 font-semibold text-zinc-900">Configurações</h4>
              <p className="text-sm text-zinc-600">
                Configurações da academia e perfil
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-zinc-600"
            >
              ← Voltar para home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
