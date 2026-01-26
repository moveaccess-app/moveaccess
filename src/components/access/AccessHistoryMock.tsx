"use client";

/**
 * AccessHistoryMock Component
 * Lista das últimas leituras de acesso simuladas
 * Atualizado para usar os novos tipos do accessMock refatorado
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { 
  type AccessAttempt,
  getUserTypeLabel, 
  formatAccessTime,
  getAccessStatusLabel,
} from "@/mocks/accessMock";

// Ícones inline para evitar dependência de lucide-react
const CheckIcon = () => (
  <svg className="w-5 h-5 text-[var(--status-positive)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5 text-[var(--status-negative)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface AccessHistoryMockProps {
  items: AccessAttempt[];
  className?: string;
  title?: string;
  emptyText?: string;
}

export function AccessHistoryMock({ 
  items, 
  className,
  title = "Últimos Acessos",
  emptyText = "Nenhum acesso registrado ainda"
}: AccessHistoryMockProps) {
  
  if (items.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="w-12 h-12 mx-auto mb-3 opacity-50 text-[var(--element-disabled)]">
          <ClockIcon />
        </div>
        <p className="text-[var(--element-secondary)] text-sm">
          {emptyText}
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-[var(--element-primary)] flex items-center gap-2">
        <ClockIcon />
        {title}
      </h3>
      
      <div className="space-y-2">
        {items.map((item) => {
          const isAllowed = item.status === "allowed";
          
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                "bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)]",
                isAllowed ? "border-[var(--status-positive)]/20" : "border-[var(--status-negative)]/20"
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {isAllowed ? <CheckIcon /> : <XIcon />}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--element-primary)] truncate">
                  {item.userName || "Usuário desconhecido"}
                </p>
                <p className="text-xs text-[var(--element-secondary)] truncate">
                  {getAccessStatusLabel(item.status)}
                </p>
              </div>
              
              {/* Type Badge */}
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {item.method === 'qr_code' ? 'QR' : 
                 item.method === 'pin' ? 'PIN' : 
                 item.method === 'manual' ? 'Manual' : 'Bio'}
              </Badge>
              
              {/* Time */}
              <span className="text-xs text-[var(--element-disabled)] flex-shrink-0">
                {formatAccessTime(item.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
