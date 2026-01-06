'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

const navItems: NavItem[] = [
  { label: 'Access', href: '/access' },
  { label: 'Plans', href: '/plans' },
  { label: 'Users', href: '/users' },
  { label: 'Contracts', href: '/contracts' },
  { label: 'Financial', href: '/financial' },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className="w-64 border-r flex flex-col"
      style={{
        backgroundColor: 'var(--background-primary)',
        borderColor: 'var(--divider-primary)',
        minHeight: '100vh',
      }}
    >
      <div className="p-6 border-b" style={{ borderColor: 'var(--divider-primary)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--element-primary)' }}>
          MoveAccess
        </h1>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block px-4 py-3 rounded-lg transition-colors"
                style={{
                  backgroundColor: isActive(item.href) ? 'var(--background-tertiary)' : 'transparent',
                  color: isActive(item.href) ? 'var(--element-primary)' : 'var(--element-secondary)',
                  fontWeight: isActive(item.href) ? '600' : '400',
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t" style={{ borderColor: 'var(--divider-primary)' }}>
        <p className="text-sm" style={{ color: 'var(--element-secondary)' }}>
          v1.0.0
        </p>
      </div>
    </aside>
  );
}
