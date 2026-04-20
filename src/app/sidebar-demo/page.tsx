'use client';

/**
 * Página de Demonstração da Nova Sidebar
 * Mostra a Sidebar elegante com perfil de usuário, animações e toggle
 */

import { Sidebar } from '@/components/common/Sidebar';

export default function SidebarDemoPage() {
  // Exemplo de perfil de usuário personalizado
  const usuario = {
    name: 'João Silva',
    email: 'joao.silva@moveaccess.com',
    role: 'Gerente',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  };

  // Handler de logout personalizado (opcional)
  const handleLogout = () => {
    console.log('Logout personalizado');
    // Implemente sua lógica de logout aqui
    alert('Logout realizado com sucesso!');
  };

  return (
    <div className="flex h-screen bg-[var(--background-secondary)]">
      {/* Sidebar com props personalizadas */}
      <Sidebar 
        user={usuario} 
        onLogout={handleLogout}
        defaultExpanded={true}
      />

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-[var(--element-primary)] mb-2">
              Nova Sidebar Elegante 🎨
            </h1>
            <p className="text-lg text-[var(--element-secondary)]">
              Sidebar moderna com animações, expansível/minimizável e perfil de usuário
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-[var(--background-primary)] rounded-lg border border-[var(--divider-primary)]">
              <h2 className="text-xl font-bold text-[var(--element-primary)] mb-3">
                ✨ Recursos Principais
              </h2>
              <ul className="space-y-2 text-[var(--element-secondary)]">
                <li>✅ Expansível e minimizável com animações suaves</li>
                <li>✅ Perfil de usuário com avatar e informações</li>
                <li>✅ Ícones Lucide React em todos os itens</li>
                <li>✅ Indicador visual da rota ativa</li>
                <li>✅ Animações com Framer Motion</li>
                <li>✅ Botão de logout integrado</li>
                <li>✅ Totalmente responsivo</li>
              </ul>
            </div>

            <div className="p-6 bg-[var(--background-primary)] rounded-lg border border-[var(--divider-primary)]">
              <h2 className="text-xl font-bold text-[var(--element-primary)] mb-3">
                🎯 Como Usar
              </h2>
              <div className="space-y-3 text-sm text-[var(--element-secondary)]">
                <div>
                  <strong className="text-[var(--element-primary)]">Básico:</strong>
                  <pre className="mt-1 p-2 bg-[var(--background-secondary)] rounded text-xs overflow-x-auto">
{`<Sidebar />`}
                  </pre>
                </div>
                <div>
                  <strong className="text-[var(--element-primary)]">Com perfil personalizado:</strong>
                  <pre className="mt-1 p-2 bg-[var(--background-secondary)] rounded text-xs overflow-x-auto">
{`<Sidebar 
  user={{
    name: "João Silva",
    email: "joao@email.com",
    role: "Gerente",
    avatarUrl: "..."
  }}
  onLogout={handleLogout}
  defaultExpanded={true}
/>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Interações */}
          <div className="p-6 bg-gradient-to-br from-[var(--status-info)]/10 to-[var(--status-positive)]/10 rounded-lg border border-[var(--status-info)]/20">
            <h2 className="text-xl font-bold text-[var(--element-primary)] mb-3">
              🎮 Interações Disponíveis
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-[var(--element-secondary)]">
              <div>
                <h3 className="font-semibold text-[var(--element-primary)] mb-2">Na Sidebar:</h3>
                <ul className="space-y-1 text-sm">
                  <li>🔘 Clique no botão de toggle para expandir/minimizar</li>
                  <li>🔘 Clique nos itens de navegação para navegar</li>
                  <li>🔘 Hover nos itens mostra o chevron</li>
                  <li>🔘 Clique em &quot;Sair&quot; para fazer logout</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--element-primary)] mb-2">Animações:</h3>
                <ul className="space-y-1 text-sm">
                  <li>⚡ Transição suave ao expandir/minimizar</li>
                  <li>⚡ Fade in/out dos textos</li>
                  <li>⚡ Indicador de rota ativa com layout ID</li>
                  <li>⚡ Stagger children nos itens do menu</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Props */}
          <div className="p-6 bg-[var(--background-primary)] rounded-lg border border-[var(--divider-primary)]">
            <h2 className="text-xl font-bold text-[var(--element-primary)] mb-4">
              📋 Props Disponíveis
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--divider-primary)]">
                    <th className="text-left py-2 px-3 text-[var(--element-primary)]">Prop</th>
                    <th className="text-left py-2 px-3 text-[var(--element-primary)]">Tipo</th>
                    <th className="text-left py-2 px-3 text-[var(--element-primary)]">Padrão</th>
                    <th className="text-left py-2 px-3 text-[var(--element-primary)]">Descrição</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--element-secondary)]">
                  <tr className="border-b border-[var(--divider-primary)]">
                    <td className="py-2 px-3 font-mono text-xs">user</td>
                    <td className="py-2 px-3 font-mono text-xs">UserProfile?</td>
                    <td className="py-2 px-3 font-mono text-xs">Administrador</td>
                    <td className="py-2 px-3">Informações do usuário logado</td>
                  </tr>
                  <tr className="border-b border-[var(--divider-primary)]">
                    <td className="py-2 px-3 font-mono text-xs">onLogout</td>
                    <td className="py-2 px-3 font-mono text-xs">() =&gt; void</td>
                    <td className="py-2 px-3 font-mono text-xs">localStorage</td>
                    <td className="py-2 px-3">Callback ao clicar em logout</td>
                  </tr>
                  <tr className="border-b border-[var(--divider-primary)]">
                    <td className="py-2 px-3 font-mono text-xs">className</td>
                    <td className="py-2 px-3 font-mono text-xs">string?</td>
                    <td className="py-2 px-3 font-mono text-xs">-</td>
                    <td className="py-2 px-3">Classes CSS adicionais</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-xs">defaultExpanded</td>
                    <td className="py-2 px-3 font-mono text-xs">boolean</td>
                    <td className="py-2 px-3 font-mono text-xs">true</td>
                    <td className="py-2 px-3">Inicia expandida ou minimizada</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tecnologias */}
          <div className="p-6 bg-[var(--background-primary)] rounded-lg border border-[var(--divider-primary)]">
            <h2 className="text-xl font-bold text-[var(--element-primary)] mb-3">
              🛠️ Tecnologias Utilizadas
            </h2>
            <div className="flex flex-wrap gap-2">
              {['Next.js 15', 'React 19', 'TypeScript', 'Framer Motion', 'Tailwind CSS', 'Lucide React', 'MoveAccess Design System'].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-[var(--status-info)]/10 text-[var(--status-info)] rounded-full text-sm font-medium border border-[var(--status-info)]/20"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
