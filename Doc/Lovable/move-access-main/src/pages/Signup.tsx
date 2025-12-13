import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Eye, EyeOff, Loader2, Check, ChevronRight, ChevronLeft,
  User, Building2, Settings, CreditCard, Sparkles
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STEPS = [
  { id: 1, title: "Conta", icon: User },
  { id: 2, title: "Academia", icon: Building2 },
  { id: 3, title: "Operação", icon: Settings },
  { id: 4, title: "Plano", icon: CreditCard },
  { id: 5, title: "Conclusão", icon: Sparkles },
];

interface FormData {
  // Step 1
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Step 2
  academyName: string;
  cnpj: string;
  city: string;
  units: string;
  students: string;
  // Step 3
  useTurnstile: string;
  useQrCode: string;
  useBiometrics: string;
  // Step 4
  plan: string;
}

const Signup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    academyName: "",
    cnpj: "",
    city: "",
    units: "",
    students: "",
    useTurnstile: "",
    useQrCode: "",
    useBiometrics: "",
    plan: "",
  });

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {};
    
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
      if (!formData.email) {
        newErrors.email = "Email é obrigatório";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email inválido";
      }
      if (!formData.password) {
        newErrors.password = "Senha é obrigatória";
      } else if (formData.password.length < 8) {
        newErrors.password = "Senha deve ter no mínimo 8 caracteres";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Senhas não conferem";
      }
    }
    
    if (step === 2) {
      if (!formData.academyName.trim()) newErrors.academyName = "Nome da academia é obrigatório";
      if (!formData.city.trim()) newErrors.city = "Cidade é obrigatória";
      if (!formData.units) newErrors.units = "Selecione a quantidade de unidades";
      if (!formData.students) newErrors.students = "Selecione a faixa de alunos";
    }
    
    if (step === 3) {
      if (!formData.useTurnstile) newErrors.useTurnstile = "Selecione uma opção";
      if (!formData.useQrCode) newErrors.useQrCode = "Selecione uma opção";
      if (!formData.useBiometrics) newErrors.useBiometrics = "Selecione uma opção";
    }
    
    if (step === 4) {
      if (!formData.plan) newErrors.plan = "Selecione um plano";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    // Navigate to dashboard or success page
    navigate("/login");
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-glow" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 min-h-screen py-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/">
              <span className="text-2xl font-bold">
                Move<span className="text-primary">Access</span>
              </span>
            </Link>
          </div>
          
          {/* Progress bar */}
          <div className="mb-10">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        currentStep > step.id 
                          ? 'bg-primary text-primary-foreground' 
                          : currentStep === step.id 
                            ? 'bg-primary text-primary-foreground shadow-glow' 
                            : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 hidden sm:block ${
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-primary' : 'bg-secondary'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Form card */}
          <div className="glass rounded-2xl p-8 shadow-card max-w-xl mx-auto">
            {/* Step 1: Account */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Crie sua conta</h2>
                  <p className="text-muted-foreground">Comece sua jornada com o MoveAccess</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nome completo</label>
                    <Input
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                      className={`bg-secondary/50 border-border h-12 ${errors.name ? 'border-destructive' : ''}`}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      className={`bg-secondary/50 border-border h-12 ${errors.email ? 'border-destructive' : ''}`}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Senha</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => updateFormData("password", e.target.value)}
                        className={`bg-secondary/50 border-border h-12 pr-12 ${errors.password ? 'border-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirmar senha</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                        className={`bg-secondary/50 border-border h-12 pr-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Academy Profile */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Perfil da academia</h2>
                  <p className="text-muted-foreground">Conte-nos mais sobre seu negócio</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nome da academia</label>
                    <Input
                      type="text"
                      placeholder="Nome da sua academia"
                      value={formData.academyName}
                      onChange={(e) => updateFormData("academyName", e.target.value)}
                      className={`bg-secondary/50 border-border h-12 ${errors.academyName ? 'border-destructive' : ''}`}
                    />
                    {errors.academyName && <p className="text-sm text-destructive">{errors.academyName}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">CNPJ <span className="text-muted-foreground">(opcional)</span></label>
                    <Input
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={(e) => updateFormData("cnpj", formatCNPJ(e.target.value))}
                      className="bg-secondary/50 border-border h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Cidade/UF</label>
                    <Input
                      type="text"
                      placeholder="São Paulo, SP"
                      value={formData.city}
                      onChange={(e) => updateFormData("city", e.target.value)}
                      className={`bg-secondary/50 border-border h-12 ${errors.city ? 'border-destructive' : ''}`}
                    />
                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Quantas unidades?</label>
                    <Select value={formData.units} onValueChange={(v) => updateFormData("units", v)}>
                      <SelectTrigger className={`bg-secondary/50 border-border h-12 ${errors.units ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="1">1 unidade</SelectItem>
                        <SelectItem value="2-3">2 a 3 unidades</SelectItem>
                        <SelectItem value="4-10">4 a 10 unidades</SelectItem>
                        <SelectItem value="10+">Mais de 10 unidades</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.units && <p className="text-sm text-destructive">{errors.units}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Quantos alunos ativos?</label>
                    <Select value={formData.students} onValueChange={(v) => updateFormData("students", v)}>
                      <SelectTrigger className={`bg-secondary/50 border-border h-12 ${errors.students ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="1-100">Até 100 alunos</SelectItem>
                        <SelectItem value="100-300">100 a 300 alunos</SelectItem>
                        <SelectItem value="300-500">300 a 500 alunos</SelectItem>
                        <SelectItem value="500-1000">500 a 1000 alunos</SelectItem>
                        <SelectItem value="1000+">Mais de 1000 alunos</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.students && <p className="text-sm text-destructive">{errors.students}</p>}
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 3: Access & Operation */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Acesso e operação</h2>
                  <p className="text-muted-foreground">Como você controla o acesso na sua academia?</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Você usa catraca?</label>
                    <RadioGroup 
                      value={formData.useTurnstile} 
                      onValueChange={(v) => updateFormData("useTurnstile", v)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="turnstile-yes" className="border-border text-primary" />
                        <Label htmlFor="turnstile-yes" className="text-foreground">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="turnstile-no" className="border-border text-primary" />
                        <Label htmlFor="turnstile-no" className="text-foreground">Não</Label>
                      </div>
                    </RadioGroup>
                    {errors.useTurnstile && <p className="text-sm text-destructive">{errors.useTurnstile}</p>}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Quer check-in por QR code?</label>
                    <RadioGroup 
                      value={formData.useQrCode} 
                      onValueChange={(v) => updateFormData("useQrCode", v)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="qr-yes" className="border-border text-primary" />
                        <Label htmlFor="qr-yes" className="text-foreground">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="qr-no" className="border-border text-primary" />
                        <Label htmlFor="qr-no" className="text-foreground">Não</Label>
                      </div>
                    </RadioGroup>
                    {errors.useQrCode && <p className="text-sm text-destructive">{errors.useQrCode}</p>}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Quer usar biometria?</label>
                    <RadioGroup 
                      value={formData.useBiometrics} 
                      onValueChange={(v) => updateFormData("useBiometrics", v)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="facial" id="bio-facial" className="border-border text-primary" />
                        <Label htmlFor="bio-facial" className="text-foreground">Facial</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="digital" id="bio-digital" className="border-border text-primary" />
                        <Label htmlFor="bio-digital" className="text-foreground">Digital</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="bio-no" className="border-border text-primary" />
                        <Label htmlFor="bio-no" className="text-foreground">Não</Label>
                      </div>
                    </RadioGroup>
                    {errors.useBiometrics && <p className="text-sm text-destructive">{errors.useBiometrics}</p>}
                    <p className="text-xs text-muted-foreground">
                      * Biometria facial e digital estão disponíveis em todos os planos
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 4: Plans */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Escolha seu plano</h2>
                  <p className="text-muted-foreground">Comece com trial gratuito ou escolha o melhor para você</p>
                </div>
                
                <div className="space-y-4">
                  {[
                    { 
                      id: "trial", 
                      name: "Trial 14 dias", 
                      price: "Grátis", 
                      period: "",
                      badge: null,
                      features: ["Acesso completo", "Sem cartão de crédito", "Suporte por email"]
                    },
                    { 
                      id: "monthly", 
                      name: "Plano Mensal", 
                      price: "R$ 199", 
                      period: "/mês",
                      badge: null,
                      features: ["Alunos ilimitados", "Cobrança automática", "Suporte prioritário"]
                    },
                    { 
                      id: "annual", 
                      name: "Plano Anual", 
                      price: "R$ 149", 
                      period: "/mês",
                      badge: "Recomendado",
                      features: ["2 meses grátis", "Alunos ilimitados", "Suporte VIP"]
                    },
                  ].map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => updateFormData("plan", plan.id)}
                      className={`w-full p-5 rounded-xl border text-left transition-all ${
                        formData.plan === plan.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border bg-secondary/30 hover:border-muted-foreground/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{plan.name}</span>
                            {plan.badge && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1 mb-3">
                            <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                            <span className="text-muted-foreground">{plan.period}</span>
                          </div>
                          <ul className="space-y-1.5">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Check className="w-4 h-4 text-primary" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          formData.plan === plan.id 
                            ? 'border-primary bg-primary' 
                            : 'border-muted-foreground/50'
                        }`}>
                          {formData.plan === plan.id && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.plan && <p className="text-sm text-destructive text-center">{errors.plan}</p>}
                
                {formData.plan === "trial" && (
                  <p className="text-center text-sm text-muted-foreground bg-secondary/50 py-3 px-4 rounded-lg">
                    ✨ Nenhum cartão de crédito necessário para o trial
                  </p>
                )}
              </div>
            )}
            
            {/* Step 5: Conclusion */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Tudo pronto!</h2>
                  <p className="text-muted-foreground">Confira o resumo antes de ativar sua conta</p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Conta</h3>
                    <p className="text-foreground">{formData.name}</p>
                    <p className="text-muted-foreground text-sm">{formData.email}</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Academia</h3>
                    <p className="text-foreground">{formData.academyName}</p>
                    <p className="text-muted-foreground text-sm">{formData.city}</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Configurações</h3>
                    <div className="flex flex-wrap gap-2">
                      {formData.useTurnstile === "yes" && (
                        <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded">Catraca</span>
                      )}
                      {formData.useQrCode === "yes" && (
                        <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded">QR Code</span>
                      )}
                      {formData.useBiometrics !== "no" && (
                        <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                          Biometria {formData.useBiometrics}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Plano selecionado</h3>
                    <p className="text-foreground font-semibold">
                      {formData.plan === "trial" && "Trial 14 dias (Grátis)"}
                      {formData.plan === "monthly" && "Plano Mensal (R$ 199/mês)"}
                      {formData.plan === "annual" && "Plano Anual (R$ 149/mês)"}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Voltar
                </Button>
              )}
              
              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-12"
                >
                  Próximo
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Ativando...
                    </>
                  ) : (
                    <>
                      Ativar e acessar o painel
                      <Sparkles className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {currentStep === 1 && (
              <p className="text-center text-muted-foreground mt-6">
                Já tem uma conta?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Fazer login
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
