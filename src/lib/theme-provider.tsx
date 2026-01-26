'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useSyncExternalStore } from 'react';

// ============================================================================
// TIPOS
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

// ============================================================================
// CONTEXTO
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'moveaccess-theme';

// ============================================================================
// HELPERS
// ============================================================================

// Obtém o tema armazenado
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored;
  }
  return 'system';
}

// Obtém a preferência do sistema
function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// ============================================================================
// PROVIDER
// ============================================================================

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Inicializa com o tema armazenado (ou 'system' no SSR)
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [mounted, setMounted] = useState(false);
  
  // Subscribe to system theme changes
  const systemTheme = useSyncExternalStore(
    useCallback((callback) => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', callback);
      return () => mediaQuery.removeEventListener('change', callback);
    }, []),
    () => getSystemPreference(),
    () => 'light' as const
  );

  // Calcula o tema resolvido
  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  // Aplica o tema no documento e marca como montado
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.setAttribute('data-theme', resolvedTheme);
    
    // Marca como montado após a primeira aplicação do tema
    if (!mounted) {
      // Usando setTimeout para evitar warning de setState síncrono
      const timer = setTimeout(() => setMounted(true), 0);
      return () => clearTimeout(timer);
    }
  }, [resolvedTheme, mounted]);

  // Função para alterar o tema
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  // Memoiza o valor do contexto
  const contextValue = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
  }), [theme, resolvedTheme, setTheme]);

  // Previne flash de conteúdo incorreto
  if (!mounted) {
    return (
      <div style={{ visibility: 'hidden' }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}
