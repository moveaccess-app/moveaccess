import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8">
      <main className="flex w-full max-w-4xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold text-zinc-900">
          MoveAccess
        </h1>
        <p className="text-lg text-zinc-600">
          Landing Page - Placeholder
        </p>
        <p className="max-w-2xl text-zinc-500">
          Esta é a página inicial pública do MoveAccess. 
          A UI completa será implementada nas próximas tasks seguindo a referência do Lovable.
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-white transition-colors hover:bg-zinc-700"
          >
            Começar Agora
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-zinc-900 transition-colors hover:bg-zinc-100"
          >
            Entrar
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-2 text-sm text-zinc-400">
          <p>Rotas disponíveis:</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/login" className="underline">Login</Link>
            <span>•</span>
            <Link href="/signup" className="underline">Signup</Link>
            <span>•</span>
            <Link href="/forgot-password" className="underline">Recuperar Senha</Link>
            <span>•</span>
            <Link href="/plans" className="underline">Planos</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
