import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8">
      <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">
          Cadastro / Onboarding
        </h1>
        
        <p className="mb-6 text-sm text-zinc-600">
          Processo de cadastro em múltiplas etapas - Placeholder
        </p>

        <div className="mb-8 space-y-4">
          <div className="rounded-lg bg-zinc-100 p-4">
            <h2 className="mb-2 font-semibold text-zinc-900">
              Fluxo de Onboarding (5 etapas):
            </h2>
            <ol className="ml-4 list-decimal space-y-1 text-sm text-zinc-600">
              <li>Dados da Conta (nome, email, senha)</li>
              <li>Dados da Academia (nome, CNPJ, cidade, tamanho)</li>
              <li>Configurações Operacionais (catraca, QR code, biometria)</li>
              <li>Escolha do Plano (seleção de plano de assinatura)</li>
              <li>Conclusão e Próximos Passos</li>
            </ol>
          </div>

          <div className="rounded-lg border border-zinc-200 p-4">
            <p className="text-sm text-zinc-600">
              Este wizard de cadastro será implementado nas próximas tasks,
              seguindo a referência do Lovable e respeitando a arquitetura limpa do projeto.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white opacity-50"
            disabled
          >
            Iniciar Cadastro (Em desenvolvimento)
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-zinc-500">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-zinc-900 hover:underline">
            Faça login
          </Link>
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
