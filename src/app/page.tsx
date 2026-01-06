export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <main className="flex flex-col items-center gap-8 px-8 py-16 text-center">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
            MoveAccess
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl">
            Aplicação web desenvolvida com Next.js e Clean Architecture
          </p>
        </div>

        <div className="flex flex-col gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Arquitetura
            </h2>
            <ul className="flex flex-col gap-1">
              <li>✓ Clean Architecture</li>
              <li>✓ Dependency Injection (tsyringe)</li>
              <li>✓ TypeScript</li>
              <li>✓ API Routes</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
              API Endpoints
            </h2>
            <ul className="flex flex-col gap-1 font-mono text-xs">
              <li>POST /api/auth/login</li>
              <li>GET /api/user/[id]</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-xs text-zinc-500 dark:text-zinc-500">
          <a 
            href="https://github.com/moveaccess-app/moveaccess"
            className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver no GitHub →
          </a>
        </div>
      </main>
    </div>
  );
}
