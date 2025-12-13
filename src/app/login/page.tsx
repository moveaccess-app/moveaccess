import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">
          Login
        </h1>
        
        <p className="mb-6 text-sm text-zinc-600">
          Página de autenticação - Placeholder
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
              disabled
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
              disabled
            />
          </div>

          <button
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white opacity-50"
            disabled
          >
            Entrar (Em desenvolvimento)
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2 text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-zinc-600 hover:text-zinc-900"
          >
            Esqueci minha senha
          </Link>
          <div className="text-zinc-500">
            Não tem uma conta?{" "}
            <Link href="/signup" className="text-zinc-900 hover:underline">
              Cadastre-se
            </Link>
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
