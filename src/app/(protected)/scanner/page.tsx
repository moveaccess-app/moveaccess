"use client";

/**
 * Scanner de Acesso (Usuário)
 * Página onde usuário ESCANEIA QR Code da academia
 * 
 * FLUXO CORRETO:
 * 1. Usuário abre esta página (logado no app)
 * 2. Aponta câmera para QR Code exibido na academia
 * 3. Sistema valida plano/horário do usuário
 * 4. Envia resultado para tela da academia (Liberado/Negado)
 * 
 * Rota: /(protected)/scanner
 * 
 * TODO: Integrar com câmera real (getUserMedia API)
 * TODO: Usar lib de QR Code scanner (jsQR, @zxing/library)
 * TODO: Integrar com WebSocket para enviar resultado à academia
 * TODO: Implementar validação via API backend
 */

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  Button, 
  Badge, 
  Container 
} from "@/components/ui";
import { AccessScannerMock, type ScanResult } from "@/components/access";
import { 
  mockAcademyQr,
  mockValidateUserAccess,
  type QrValidationResult 
} from "@/mocks/accessMock";
import { getCurrentUser } from "@/mocks/authMock";
import { accessContent } from "@/data/accessContent";
import { 
  Scan, 
  User,
  Camera,
  LogOut
} from "lucide-react";

export default function ScannerPage() {
  const router = useRouter();
  const content = accessContent.myScanner;
  
  // Verifica autenticação e pega usuário logado
  const currentUser = getCurrentUser();
  
  useEffect(() => {
    if (!currentUser || currentUser.role !== "aluno") {
      router.push("/login");
    }
  }, [currentUser, router]);
  
  // Estado do scanner
  const [scanResult, setScanResult] = useState<QrValidationResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Converte QrValidationResult para ScanResult
  const scannerResult: ScanResult = scanResult 
    ? {
        state: scanResult.success ? "success" : "error",
        message: scanResult.message,
        user: scanResult.user,
        timestamp: scanResult.timestamp,
      }
    : {
        state: "idle",
      };
  
  // Simula leitura de QR Code da academia (MOCK - em produção usaria câmera real)
  const handleMockScan = useCallback(() => {
    if (!currentUser) return;
    
    setIsScanning(true);
    setScanResult(null);
    
    // Simula delay de leitura
    setTimeout(() => {
      // Monta payload do usuário atual
      const userPayload = {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        cpf: currentUser.cpf || "",
        type: "aluno" as const,
        planName: currentUser.planName,
        planStatus: currentUser.planStatus,
      };
      
      const result = mockValidateUserAccess(mockAcademyQr.token, userPayload);
      setScanResult(result);
      setIsScanning(false);
      
      // TODO: Enviar resultado para tela da academia via WebSocket
      console.log("Resultado enviado para academia:", result);
      
      // Auto-limpa após 5 segundos
      setTimeout(() => setScanResult(null), 5000);
    }, 1500);
  }, [currentUser]);
  
  // Limpa resultado
  const handleClear = useCallback(() => {
    setScanResult(null);
    setIsScanning(false);
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <Container size="wide" className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-foreground">
                Move<span className="text-primary">Access</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-3">
                <p className="text-sm font-medium text-foreground">{currentUser?.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser?.planName}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem("moveaccess_auth_user");
                  router.push("/login");
                }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="py-12">
        <Container size="narrow">
          {/* Page Title */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Scan className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                {content.title}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {content.subtitle}
            </p>
          </div>

          {/* Scanner Card */}
          <Card className="glass mb-6">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                {content.scanner.title}
              </CardTitle>
              <CardDescription>
                {content.scanner.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Scanner Visual Component */}
              <AccessScannerMock 
                result={isScanning ? { state: "idle" } : scannerResult} 
              />
              
              {/* Estado de scanning */}
              {isScanning && (
                <div className="mt-4 text-center p-4 border border-primary/50 rounded-lg bg-primary/5">
                  <p className="text-sm font-medium text-primary animate-pulse">
                    {content.states.scanning.title}
                  </p>
                </div>
              )}
              
              {/* Resultado */}
              {scanResult && !isScanning && (
                <div className={`mt-4 text-center p-6 border rounded-lg ${
                  scanResult.success 
                    ? "border-green-500/50 bg-green-500/10" 
                    : "border-red-500/50 bg-red-500/10"
                }`}>
                  <p className={`text-2xl font-bold mb-2 ${
                    scanResult.success ? "text-green-500" : "text-red-500"
                  }`}>
                    {scanResult.success 
                      ? content.states.success.title 
                      : content.states.denied.title
                    }
                  </p>
                  <p className="text-sm text-foreground mb-1">
                    {mockAcademyQr.academyName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scanResult.message}
                  </p>
                </div>
              )}
              
              {/* Action Button (MOCK) */}
              <div className="mt-6">
                <Button
                  variant="default"
                  onClick={handleMockScan}
                  disabled={isScanning}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Scan className="w-5 h-5" />
                  {content.scanner.mockButton}
                </Button>
                
                {scanResult && (
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="w-full gap-2 mt-3"
                  >
                    Limpar
                  </Button>
                )}
              </div>
              
              {/* Info sobre câmera real */}
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-400 text-center">
                  💡 Em produção, a câmera do celular será ativada automaticamente
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Info */}
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                {content.profile.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">
                    Nome:
                  </span>
                  <span className="text-foreground text-sm font-medium">
                    {currentUser?.name}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">
                    {content.profile.typeLabel}
                  </span>
                  <Badge variant="default">
                    Aluno
                  </Badge>
                </div>
                
                {currentUser?.planName && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      {content.profile.planLabel}
                    </span>
                    <span className="text-foreground text-sm font-medium">
                      {currentUser.planName}
                    </span>
                  </div>
                )}
                
                {currentUser?.planStatus && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      {content.profile.statusLabel}
                    </span>
                    <Badge 
                      variant={currentUser.planStatus === "active" ? "default" : "outline"}
                      className={currentUser.planStatus === "active" 
                        ? "bg-green-500/10 text-green-500 border-green-500/30" 
                        : "bg-red-500/10 text-red-500 border-red-500/30"
                      }
                    >
                      {currentUser.planStatus === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="glass p-4">
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => {
                localStorage.removeItem("moveaccess_auth_user");
                router.push("/login");
              }}
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </Button>
          </Card>
        </Container>
      </main>
    </div>
  );
}
