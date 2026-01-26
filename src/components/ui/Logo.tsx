/**
 * Logo Component - MoveAccess
 * Logo responsivo com variantes
 */

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: { icon: 32, wordmark: 80, full: 120 },
  md: { icon: 48, wordmark: 120, full: 160 },
  lg: { icon: 64, wordmark: 160, full: 200 },
  xl: { icon: 80, wordmark: 200, full: 240 },
};

export function Logo({ variant = 'full', size = 'md', className }: LogoProps) {
  if (variant === 'icon') {
    return (
      <div 
        className={cn('relative', className)}
        style={{ 
          width: sizeMap[size].icon, 
          height: sizeMap[size].icon 
        }}
      >
        <Image
          src="/moveaccess-logo.svg"
          alt="MoveAccess"
          width={sizeMap[size].icon}
          height={sizeMap[size].icon}
          priority
        />
      </div>
    );
  }

  if (variant === 'wordmark') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="relative" style={{ width: 40, height: 40 }}>
          <Image
            src="/moveaccess-logo.svg"
            alt="MoveAccess"
            width={40}
            height={40}
            priority
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--element-primary)' }}>
            Move<span style={{ color: 'var(--status-info)' }}>Access</span>
          </h1>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div 
        className="relative"
        style={{ 
          width: sizeMap[size].icon, 
          height: sizeMap[size].icon 
        }}
      >
        <Image
          src="/moveaccess-logo.svg"
          alt="MoveAccess"
          width={sizeMap[size].icon}
          height={sizeMap[size].icon}
          priority
        />
      </div>
      <h1 
        className={cn(
          'font-bold tracking-tight',
          size === 'sm' && 'text-xl',
          size === 'md' && 'text-2xl',
          size === 'lg' && 'text-3xl',
          size === 'xl' && 'text-4xl'
        )}
        style={{ color: 'var(--element-primary)' }}
      >
        Move<span style={{ color: 'var(--status-info)' }}>Access</span>
      </h1>
    </div>
  );
}
