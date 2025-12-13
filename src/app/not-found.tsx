import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-zinc-900">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-zinc-700">
          Página não encontrada
        </h2>
        <p className="mb-8 text-zinc-600">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-zinc-900 px-6 py-3 text-white transition-colors hover:bg-zinc-700"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  );
}
