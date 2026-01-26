"use client";

/**
 * QrCodeMock Component
 * Renderiza um QR Code fake visual usando CSS (sem dependências externas)
 * 
 * TODO: Substituir por lib de QR Code real (ex: qrcode.react) quando necessário
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface QrCodeMockProps {
  token: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function QrCodeMock({ token, size = "md", className }: QrCodeMockProps) {
  // Gera um pattern pseudo-aleatório baseado no token para variar o visual
  const generatePattern = React.useCallback(() => {
    const rows = 11;
    const cols = 11;
    const pattern: boolean[][] = [];
    
    // Usa o token como seed para o pattern
    let seed = 0;
    for (let i = 0; i < token.length; i++) {
      seed += token.charCodeAt(i);
    }
    
    // Gera o pattern
    for (let row = 0; row < rows; row++) {
      pattern[row] = [];
      for (let col = 0; col < cols; col++) {
        // Corner markers (sempre pretos)
        const isCornerMarker = 
          (row < 3 && col < 3) || // top-left
          (row < 3 && col >= cols - 3) || // top-right
          (row >= rows - 3 && col < 3); // bottom-left
        
        if (isCornerMarker) {
          // Padrão de marcador de canto
          const isEdge = row === 0 || row === 2 || col === 0 || col === 2 ||
                        row === cols - 1 || row === cols - 3 || 
                        col === rows - 1 || col === rows - 3;
          const isCenter = (row === 1 && col === 1) ||
                          (row === 1 && col === cols - 2) ||
                          (row === rows - 2 && col === 1);
          pattern[row][col] = isEdge || isCenter;
        } else {
          // Resto é pseudo-aleatório
          const idx = row * cols + col + seed;
          pattern[row][col] = idx % 3 !== 0 && idx % 7 !== 0;
        }
      }
    }
    
    return pattern;
  }, [token]);
  
  const pattern = generatePattern();
  
  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-48 h-48",
    lg: "w-64 h-64",
    xl: "w-80 h-80",
  };
  
  const cellSizeClasses = {
    sm: "w-[9px] h-[9px]",
    md: "w-[14px] h-[14px]",
    lg: "w-[18px] h-[18px]",
    xl: "w-[24px] h-[24px]",
  };
  
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* QR Code Visual */}
      <div 
        className={cn(
          "bg-white p-3 rounded-lg shadow-lg",
          sizeClasses[size]
        )}
      >
        <div className="w-full h-full flex flex-col gap-[1px]">
          {pattern.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-[1px] justify-center">
              {row.map((filled, colIdx) => (
                <div
                  key={colIdx}
                  className={cn(
                    cellSizeClasses[size],
                    "rounded-[1px]",
                    filled ? "bg-gray-900" : "bg-white"
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Exibição do Token */}
      <div className="text-center">
        <span className="text-xs text-muted-foreground">Token: </span>
        <code className="text-sm font-mono text-primary font-semibold">
          {token}
        </code>
      </div>
    </div>
  );
}
