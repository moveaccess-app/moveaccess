'use client';

import { cn } from '@/lib/utils';
import { OnboardingStepInfo, StepStatus } from '@/lib/users';

// ============================================
// TIPOS
// ============================================

interface StepperProps {
  steps: OnboardingStepInfo[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  orientation?: 'horizontal' | 'vertical';
  compact?: boolean;
}

interface StepItemProps {
  step: OnboardingStepInfo;
  isLast: boolean;
  onStepClick?: (stepId: string) => void;
  orientation: 'horizontal' | 'vertical';
  compact: boolean;
}

// ============================================
// ÍCONES
// ============================================

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ============================================
// STEP ITEM
// ============================================

function StepItem({ step, isLast, onStepClick, orientation, compact }: StepItemProps) {
  const isClickable = step.status === 'completed' && onStepClick;
  
  const getStatusStyles = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return {
          circle: 'bg-[var(--status-positive)] text-white',
          line: 'bg-[var(--status-positive)]',
          title: 'text-[var(--text-primary)]',
        };
      case 'current':
        return {
          circle: 'bg-[var(--element-primary)] text-white ring-4 ring-[var(--element-primary)]/20',
          line: 'bg-[var(--border-subtle)]',
          title: 'text-[var(--text-primary)] font-semibold',
        };
      case 'skipped':
        return {
          circle: 'bg-[var(--background-tertiary)] text-[var(--text-tertiary)]',
          line: 'bg-[var(--border-subtle)]',
          title: 'text-[var(--text-tertiary)]',
        };
      default: // pending
        return {
          circle: 'bg-[var(--background-tertiary)] text-[var(--text-tertiary)]',
          line: 'bg-[var(--border-subtle)]',
          title: 'text-[var(--text-tertiary)]',
        };
    }
  };

  const styles = getStatusStyles(step.status);

  if (orientation === 'vertical') {
    return (
      <div className="flex gap-4">
        {/* Indicator column */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => isClickable && onStepClick(step.id)}
            disabled={!isClickable}
            className={cn(
              'flex items-center justify-center rounded-full transition-all',
              compact ? 'h-8 w-8' : 'h-10 w-10',
              styles.circle,
              isClickable && 'cursor-pointer hover:opacity-80'
            )}
          >
            {step.status === 'completed' ? (
              <CheckIcon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
            ) : (
              <span className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
                {step.order}
              </span>
            )}
          </button>
          
          {/* Vertical line */}
          {!isLast && (
            <div 
              className={cn(
                'w-0.5 flex-1 min-h-8',
                styles.line
              )} 
            />
          )}
        </div>

        {/* Content column */}
        <div className={cn('pb-8', isLast && 'pb-0')}>
          <p className={cn('text-sm leading-tight', styles.title)}>
            {step.title}
          </p>
          {!compact && (
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {step.description}
            </p>
          )}
          {step.status === 'current' && (
            <span className="inline-block mt-2 text-xs text-[var(--element-primary)] font-medium">
              Etapa atual
            </span>
          )}
        </div>
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className={cn('flex items-center', !isLast && 'flex-1')}>
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => isClickable && onStepClick(step.id)}
          disabled={!isClickable}
          className={cn(
            'flex items-center justify-center rounded-full transition-all',
            compact ? 'h-8 w-8' : 'h-10 w-10',
            styles.circle,
            isClickable && 'cursor-pointer hover:opacity-80'
          )}
        >
          {step.status === 'completed' ? (
            <CheckIcon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
          ) : (
            <span className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
              {step.order}
            </span>
          )}
        </button>
        
        {!compact && (
          <div className="mt-2 text-center">
            <p className={cn('text-sm leading-tight', styles.title)}>
              {step.title}
            </p>
            {step.status === 'current' && (
              <span className="text-xs text-[var(--element-primary)] font-medium">
                Atual
              </span>
            )}
          </div>
        )}
      </div>

      {/* Horizontal line */}
      {!isLast && (
        <div 
          className={cn(
            'flex-1 h-0.5 mx-2',
            compact ? 'mx-1' : 'mx-3',
            styles.line
          )} 
        />
      )}
    </div>
  );
}

// ============================================
// STEPPER COMPONENT
// ============================================

export function Stepper({ 
  steps, 
  onStepClick, 
  orientation = 'horizontal',
  compact = false 
}: StepperProps) {
  return (
    <div 
      className={cn(
        'w-full',
        orientation === 'horizontal' ? 'flex items-start' : 'flex flex-col'
      )}
    >
      {steps.map((step, index) => (
        <StepItem
          key={step.id}
          step={step}
          isLast={index === steps.length - 1}
          onStepClick={onStepClick}
          orientation={orientation}
          compact={compact}
        />
      ))}
    </div>
  );
}

// ============================================
// PROGRESS BAR VARIANT
// ============================================

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
}

export function OnboardingProgressBar({ current, total, showLabel = true }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[var(--text-secondary)]">
            Etapa {current} de {total}
          </span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {percentage}%
          </span>
        </div>
      )}
      <div className="h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[var(--element-primary)] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
