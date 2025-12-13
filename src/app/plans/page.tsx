import Link from "next/link";

export default function PlansPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8">
      <div className="w-full max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-zinc-900">
            Planos e Precificação
          </h1>
          <p className="text-zinc-600">
            Escolha o plano ideal para sua academia - Placeholder
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Plan 1 - Basic */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-zinc-900">Básico</h2>
            <p className="mb-4 text-sm text-zinc-600">Para academias iniciantes</p>
            <div className="mb-4">
              <span className="text-3xl font-bold text-zinc-900">R$ 99</span>
              <span className="text-zinc-600">/mês</span>
            </div>
            <ul className="mb-6 space-y-2 text-sm text-zinc-600">
              <li>✓ Até 100 alunos</li>
              <li>✓ Controle de acesso básico</li>
              <li>✓ Financeiro simplificado</li>
              <li>✓ Suporte por email</li>
            </ul>
            <button
              className="w-full rounded-md border border-zinc-300 px-4 py-2 text-zinc-900 opacity-50"
              disabled
            >
              Em desenvolvimento
            </button>
          </div>

          {/* Plan 2 - Pro */}
          <div className="rounded-lg border-2 border-zinc-900 bg-white p-6 shadow-md">
            <div className="mb-2 inline-block rounded bg-zinc-900 px-2 py-1 text-xs text-white">
              Mais Popular
            </div>
            <h2 className="mb-2 text-xl font-bold text-zinc-900">Pro</h2>
            <p className="mb-4 text-sm text-zinc-600">Para academias em crescimento</p>
            <div className="mb-4">
              <span className="text-3xl font-bold text-zinc-900">R$ 249</span>
              <span className="text-zinc-600">/mês</span>
            </div>
            <ul className="mb-6 space-y-2 text-sm text-zinc-600">
              <li>✓ Até 500 alunos</li>
              <li>✓ Controle de acesso avançado</li>
              <li>✓ Financeiro completo</li>
              <li>✓ QR Code e Biometria</li>
              <li>✓ Suporte prioritário</li>
            </ul>
            <button
              className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white opacity-50"
              disabled
            >
              Em desenvolvimento
            </button>
          </div>

          {/* Plan 3 - Enterprise */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-zinc-900">Enterprise</h2>
            <p className="mb-4 text-sm text-zinc-600">Para redes de academias</p>
            <div className="mb-4">
              <span className="text-3xl font-bold text-zinc-900">Customizado</span>
            </div>
            <ul className="mb-6 space-y-2 text-sm text-zinc-600">
              <li>✓ Alunos ilimitados</li>
              <li>✓ Múltiplas unidades</li>
              <li>✓ API e integrações</li>
              <li>✓ Automações customizadas</li>
              <li>✓ Gerente de conta dedicado</li>
            </ul>
            <button
              className="w-full rounded-md border border-zinc-300 px-4 py-2 text-zinc-900 opacity-50"
              disabled
            >
              Em desenvolvimento
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600">
            ← Voltar para home
          </Link>
        </div>
      </div>
    </div>
  );
}
