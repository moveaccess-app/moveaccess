'use client';

/**
 * Página de Login do Aluno (Student)
 * Portal de acesso individual
 * UI leve e simples, mobile-first
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription, Logo } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, User, Smartphone } from 'lucide-react';

export default function StudentLoginPage() {
  const router = useRouter();
  const { loginAsStudent, isAuthenticated, isStudent, isLoading: authLoading } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirecionar se já estiver autenticado como aluno
  useEffect(() => {
    if (!authLoading && isAuthenticated && isStudent) {
      router.push('/aluno');
    }
  }, [authLoading, isAuthenticated, isStudent, router]);

  // Formatar CPF/Telefone enquanto digita
  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Se parece com CPF (11 dígitos começando com padrão de CPF)
    if (numbers.length <= 11) {
      if (numbers.length <= 3) {
        value = numbers;
      } else if (numbers.length <= 6) {
        value = `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      } else if (numbers.length <= 9) {
        value = `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      } else {
        value = `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
      }
    }
    
    setIdentifier(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await loginAsStudent(identifier, password);

      if (result.success) {
        router.push('/aluno');
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background gradiente suave */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: 'linear-gradient(180deg, var(--status-info) 0%, var(--background-primary) 30%, var(--background-primary) 100%)',
        }}
      />
      
      {/* Padrão decorativo */}
      <div className="absolute top-0 left-0 w-full h-64 -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo/Brand - mais leve */}
        <div className="text-center mb-8 animate-fade-in">
          <Logo variant="full" size="md" className="mb-2" />
          <div className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--status-positive)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--element-primary)' }}>
              Área do Aluno
            </span>
          </div>
        </div>

        {/* Card de Login */}
        <Card className="backdrop-blur-md shadow-2xl border-0 overflow-hidden animate-slide-up" style={{ backgroundColor: 'rgba(255, 255, 255, 0.98)' }}>
          {/* Onda superior */}
          <div className="h-2 bg-gradient-to-r" style={{ backgroundImage: 'linear-gradient(90deg, var(--status-info) 0%, var(--status-positive) 100%)' }} />
          
          <CardHeader className="text-center pt-6 pb-4">
            <div className="mx-auto mb-3 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--status-info-background)' }}>
              <User className="w-8 h-8" style={{ color: 'var(--status-info)' }} />
            </div>
            <CardTitle className="text-xl font-bold">Olá! 👋</CardTitle>
            <CardDescription className="text-sm mt-1">
              Entre para acessar sua área
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo CPF/Telefone */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-sm font-semibold">CPF ou Telefone</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--element-secondary)' }} />
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="000.000.000-00 ou 11999999999"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    required
                    autoComplete="username"
                    disabled={isLoading}
                    inputMode="numeric"
                    className="pl-11 h-11"
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--element-secondary)' }} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pl-11 pr-20 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium hover:underline"
                    style={{ color: 'var(--element-secondary)' }}
                    tabIndex={-1}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              {/* Mensagem de Erro */}
              {error && (
                <div 
                  className="p-3 rounded-lg text-sm font-medium flex items-start gap-2 animate-shake"
                  style={{ 
                    backgroundColor: 'var(--status-negative-background)',
                    color: 'var(--status-negative)',
                    border: '1px solid var(--status-negative)'
                  }}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Botão de Login */}
              <Button
                type="submit"
                className="w-full h-11 font-semibold shadow-lg hover:shadow-xl transition-all mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner />
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* Credenciais de Demo */}
            <div 
              className="mt-6 p-4 rounded-xl text-xs border"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                borderColor: 'var(--divider-primary)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--status-info)' }} />
                <p className="font-semibold" style={{ color: 'var(--element-primary)' }}>
                  Alunos de demonstração
                </p>
              </div>
              <div className="space-y-1.5 ml-3.5">
                <div>
                  <span className="font-medium" style={{ color: 'var(--element-primary)' }}>João:</span>
                  <span style={{ color: 'var(--element-secondary)' }}> CPF 12345678900 / Aluno@123</span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: 'var(--element-primary)' }}>Maria:</span>
                  <span style={{ color: 'var(--element-secondary)' }}> CPF 98765432100 / Maria@123</span>
                </div>
                <div>
                  <span className="font-medium" style={{ color: 'var(--element-primary)' }}>Pedro:</span>
                  <span style={{ color: 'var(--element-secondary)' }}> CPF 11122233344 / Pedro@123 </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--status-alert-background)', color: 'var(--status-alert)' }}>expirado</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link para login da equipe */}
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: 'var(--element-secondary)' }}>
            É funcionário?{' '}
            <a 
              href="/login" 
              className="font-semibold hover:underline transition-all"
              style={{ color: 'var(--status-info)' }}
            >
              Acesse o painel aqui →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente de Loading Spinner
function LoadingSpinner() {
  return (
    <svg 
      className="animate-spin h-4 w-4" 
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
