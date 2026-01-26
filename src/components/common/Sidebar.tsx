'use client';

/**
 * Sidebar Elegante e Expansível - MoveAccess
 * Sidebar moderna com animações, expansível/minimizável, perfil de usuário
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Users,
  FileText,
  DollarSign,
  Calendar,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  QrCode,
  Home,
} from 'lucide-react';

// ========================================
// Types & Interfaces
// ========================================

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string | number;
  isSeparator?: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface SidebarProps {
  user?: UserProfile;
  onLogout?: () => void;
  className?: string;
  defaultExpanded?: boolean;
  onExpandChange?: (isExpanded: boolean) => void;
}

// ========================================
// Animation Variants
// ========================================

const sidebarVariants = {
  expanded: {
    width: 260,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
  collapsed: {
    width: 72,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
};

const contentVariants = {
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      staggerChildren: 0.05,
    },
  },
  hidden: {
    opacity: 0,
  },
};

const itemVariants = {
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
  hidden: {
    opacity: 0,
    x: -10,
  },
};

// ========================================
// Navigation Items
// ========================================

const navItems: NavItem[] = [
  {
    label: 'Início',
    href: '/home',
    icon: Home,
  },
  {
    label: 'Acesso',
    href: '/access',
    icon: QrCode,
  },
  {
    label: 'Usuários',
    href: '/users',
    icon: Users,
  },
  {
    label: 'Planos',
    href: '/plans',
    icon: Calendar,
  },
  {
    label: 'Assinaturas',
    href: '/assinaturas',
    icon: FileText,
  },
  {
    label: 'Contratos',
    href: '/contratos',
    icon: FileText,
  },
  {
    label: 'Financeiro',
    href: '/financial',
    icon: DollarSign,
  },
  {
    label: 'Configurações',
    href: '/settings',
    icon: Settings,
    isSeparator: true,
  },
];

// ========================================
// Main Component
// ========================================

export function Sidebar({
  user,
  onLogout,
  className,
  defaultExpanded = true,
  onExpandChange,
}: SidebarProps = {}) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  // Verifica se uma rota está ativa
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Toggle expansão
  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState);
  };

  // Handle logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Logout padrão - limpar todas as sessões
      if (typeof window !== 'undefined') {
        localStorage.removeItem('moveaccess_auth_user');
        localStorage.removeItem('moveaccess_session');
        localStorage.removeItem('moveaccess_user_type');
        window.location.href = '/login';
      }
    }
  };

  // Avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // User padrão se não fornecido
  const currentUser: UserProfile = user || {
    name: 'Administrador',
    email: 'admin@moveaccess.com',
    role: 'Academia',
  };

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 flex h-screen flex-col border-r bg-[var(--background-primary)] shadow-sm z-40',
        'border-[var(--divider-primary)]',
        className
      )}
      initial={isExpanded ? 'expanded' : 'collapsed'}
      animate={isExpanded ? 'expanded' : 'collapsed'}
      variants={sidebarVariants}
      aria-label="Menu Principal"
    >
      {/* ========================================
          Header - Logo e Toggle
          ======================================== */}
      <div className="flex h-14 items-center justify-between border-b border-[var(--divider-primary)] px-3">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="logo-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <QrCode className="h-7 w-7 text-[var(--status-info)]" />
              <span className="text-xl font-bold text-[var(--element-primary)]">
                Move<span className="text-[var(--status-info)]">Access</span>
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <QrCode className="h-7 w-7 text-[var(--status-info)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button */}
        <motion.button
          onClick={toggleSidebar}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            'bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)]',
            'cursor-pointer transition-all duration-200',
            'hover:scale-110 active:scale-95'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isExpanded ? 'Minimizar menu' : 'Expandir menu'}
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4 text-[var(--element-secondary)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--element-secondary)]" />
          )}
        </motion.button>
      </div>

      {/* ========================================
          User Profile Section
          ======================================== */}
      <div className="border-b border-[var(--divider-primary)] p-3">
        <motion.div
          className="flex items-center gap-3"
          animate={isExpanded ? 'visible' : 'hidden'}
          variants={contentVariants}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            {currentUser.avatarUrl ? (
              <Image
                src={currentUser.avatarUrl}
                alt={`Avatar de ${currentUser.name}`}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-[var(--divider-primary)]"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--status-info)] to-[var(--status-positive)] text-sm font-bold text-white">
                {getInitials(currentUser.name)}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--background-primary)] bg-[var(--status-positive)]" />
          </div>

          {/* User Info */}
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-semibold text-[var(--element-primary)]">
                  {currentUser.name}
                </p>
                <p className="truncate text-xs text-[var(--element-secondary)]">
                  {currentUser.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ========================================
          Navigation Links
          ======================================== */}
      <nav className="flex-1 overflow-y-auto p-3" role="navigation">
        <motion.ul
          className="space-y-1"
          animate={isExpanded ? 'visible' : 'hidden'}
          variants={contentVariants}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <React.Fragment key={item.href}>
                {/* Separador */}
                {item.isSeparator && (
                  <motion.li variants={itemVariants} className="h-2" aria-hidden="true" />
                )}

                {/* Nav Item */}
                <motion.li variants={itemVariants} className="relative">
                  <Link
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2',
                      'cursor-pointer transition-all duration-200',
                      'hover:bg-[var(--background-tertiary)]',
                      active && 'bg-gradient-to-r from-[var(--status-info)]/10 to-transparent',
                      !isExpanded && 'justify-center'
                    )}
                    aria-current={active ? 'page' : undefined}
                    title={!isExpanded ? item.label : undefined}
                  >
                    {/* Tooltip quando minimizado */}
                    {!isExpanded && (
                      <div className="pointer-events-none absolute left-full ml-3 invisible whitespace-nowrap rounded-md bg-[var(--element-primary)] px-3 py-1.5 text-xs font-medium text-[var(--background-primary)] opacity-0 shadow-md border border-[var(--divider-primary)] transition-all duration-150 group-hover:visible group-hover:opacity-100 z-50">
                        {item.label}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[var(--element-primary)]" />
                      </div>
                    )}
                    {/* Active Indicator */}
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[var(--status-info)]"
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Icon */}
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-colors duration-200',
                        active
                          ? 'text-[var(--status-info)]'
                          : 'text-[var(--element-secondary)] group-hover:text-[var(--element-primary)]'
                      )}
                    />

                    {/* Label */}
                    <AnimatePresence mode="wait">
                      {isExpanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -5 }}
                          transition={{ duration: 0.15 }}
                          className={cn(
                            'text-sm font-medium transition-colors duration-200',
                            active
                              ? 'text-[var(--element-primary)]'
                              : 'text-[var(--element-secondary)] group-hover:text-[var(--element-primary)]'
                          )}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Chevron Indicator */}
                    <AnimatePresence mode="wait">
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="ml-auto"
                        >
                          <ChevronRight className="h-4 w-4 text-[var(--element-secondary)]" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Badge */}
                    {item.badge && isExpanded && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[var(--status-info)] text-xs font-bold text-white"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </Link>
                </motion.li>
              </React.Fragment>
            );
          })}
        </motion.ul>
      </nav>

      {/* ========================================
          Logout Button
          ======================================== */}
      <div className="border-t border-[var(--divider-primary)] p-3">
        <motion.button
          onClick={handleLogout}
          className={cn(
            'group flex w-full items-center gap-3 rounded-lg px-3 py-2',
            'cursor-pointer transition-all duration-200',
            'text-[var(--status-negative)] hover:bg-[var(--status-negative)]/10',
            !isExpanded && 'justify-center'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Sair"
          title={!isExpanded ? 'Sair' : undefined}
        >
          {/* Tooltip quando minimizado */}
          {!isExpanded && (
            <div className="pointer-events-none absolute left-full ml-3 invisible whitespace-nowrap rounded-md bg-[var(--element-primary)] px-3 py-1.5 text-xs font-medium text-[var(--background-primary)] opacity-0 shadow-md border border-[var(--divider-primary)] transition-all duration-150 group-hover:visible group-hover:opacity-100 z-50">
              Sair
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[var(--element-primary)]" />
            </div>
          )}
          <LogOut className="h-5 w-5 shrink-0" />
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-medium"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ========================================
          Version Footer
          ======================================== */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[var(--divider-primary)] px-4 py-2"
          >
            <p className="text-center text-xs text-[var(--element-secondary)]">
              MoveAccess v1.0.0
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
