'use client';

/**
 * Página Inicial
 * Landing page para visitantes, redirect para usuários autenticados
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/components/landing/LandingPage';
import { capture, getDeviceType } from '@/lib/analytics';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isStaff, isStudent, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      if (isStaff) {
        router.push('/home');
      } else if (isStudent) {
        router.push('/aluno');
      }
    } else {
      capture('landing_viewed', {
        path: window.location.pathname,
        referrer: document.referrer,
        device_type: getDeviceType(),
      });
    }
  }, [isAuthenticated, isStaff, isStudent, isLoading, router]);

  // Show spinner while checking auth (prevents flash of landing for authenticated users)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent border-cyan-400 rounded-full" />
      </div>
    );
  }

  // Authenticated user being redirected
  if (isAuthenticated) {
    return null;
  }

  // Show landing page for visitors
  return <LandingPage />;
}
