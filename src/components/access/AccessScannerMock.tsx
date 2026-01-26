"use client";

/**
 * AccessScannerMock Component
 * Área visual de scanner de QR Code com estados (idle, success, error)
 * 
 * TODO: Integrar com câmera real para leitura de QR Code
 * TODO: Implementar validação via API
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { CheckCircle, XCircle, Scan, User } from "lucide-react";
import { 
  type MockUserPayload, 
  getUserTypeLabel, 
  formatAccessTime 
} from "@/mocks/accessMock";
import { accessContent } from "@/data/accessContent";

export type ScannerState = "idle" | "success" | "error";

export interface ScanResult {
  state: ScannerState;
  message?: string;
  user?: MockUserPayload;
  timestamp?: Date;
}

interface AccessScannerMockProps {
  result: ScanResult;
  className?: string;
}

export function AccessScannerMock({ result, className }: AccessScannerMockProps) {
  const content = accessContent.myScanner;
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Scanner Area */}
      <div 
        className={cn(
          "relative w-64 h-64 rounded-2xl border-4 transition-all duration-500",
          "flex flex-col items-center justify-center gap-4",
          "bg-gradient-to-b from-card to-background",
          result.state === "idle" && "border-border animate-pulse",
          result.state === "success" && "border-green-500 shadow-lg shadow-green-500/20",
          result.state === "error" && "border-destructive shadow-lg shadow-destructive/20"
        )}
      >
        {/* Corner Markers */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
        
        {/* Scan Line Animation (only on idle) */}
        {result.state === "idle" && (
          <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
        )}
        
        {/* State Content */}
        {result.state === "idle" && (
          <>
            <Scan className="w-16 h-16 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground text-sm">
              {content.scanner.waitingText}
            </p>
          </>
        )}
        
        {result.state === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500" />
            <p className="text-green-500 font-semibold">
              {content.states.success.title}
            </p>
          </>
        )}
        
        {result.state === "error" && (
          <>
            <XCircle className="w-16 h-16 text-destructive" />
            <p className="text-destructive font-semibold">
              {content.states.denied.title}
            </p>
          </>
        )}
      </div>
      
      {/* Result Details */}
      {(result.state === "success" || result.state === "error") && (
        <div 
          className={cn(
            "mt-6 p-4 rounded-lg border w-full max-w-sm",
            result.state === "success" && "border-green-500/30 bg-green-500/5",
            result.state === "error" && "border-destructive/30 bg-destructive/5"
          )}
        >
          {/* Mensagem */}
          <p className={cn(
            "text-center text-sm mb-3",
            result.state === "success" ? "text-green-400" : "text-destructive"
          )}>
            {result.message}
          </p>
          
          {/* Informações do Usuário (se disponível) */}
          {result.user && (
            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {result.user.name}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getUserTypeLabel(result.user.type)}
                  </Badge>
                  {result.user.planName && (
                    <span className="text-xs text-muted-foreground">
                      {result.user.planName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Timestamp */}
          {result.timestamp && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              {formatAccessTime(result.timestamp)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// CSS para a animação de scan (adicionar ao globals.css se necessário)
// Ou usar estilo inline como fallback
