/**
 * Exemplo de página usando o MoveAccess Design System
 * 
 * Esta página demonstra:
 * - Uso correto de cores (tokens semânticos)
 * - Componentes UI
 * - Layouts responsivos
 * - Animações
 * - Glassmorphism
 * - Tipografia
 */

import { Button, Card, Container, Badge } from "@/components/ui";
import { Check, ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";

export default function DesignSystemExamplePage() {
  const features = [
    {
      id: 1,
      icon: Zap,
      title: "Rápido e Eficiente",
      description: "Sistema otimizado para performance máxima"
    },
    {
      id: 2,
      icon: Shield,
      title: "Seguro e Confiável",
      description: "Proteção de dados de ponta a ponta"
    },
    {
      id: 3,
      icon: TrendingUp,
      title: "Escalável",
      description: "Cresce junto com seu negócio"
    }
  ];

  const plans = [
    {
      id: "basic",
      name: "Básico",
      price: "99",
      popular: false,
      features: [
        "Até 100 alunos",
        "Controle de acesso",
        "Relatórios básicos",
        "Suporte por email"
      ]
    },
    {
      id: "pro",
      name: "Profissional",
      price: "199",
      popular: true,
      features: [
        "Até 500 alunos",
        "Controle de acesso avançado",
        "Relatórios completos",
        "Suporte prioritário",
        "Integração API"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "399",
      popular: false,
      features: [
        "Alunos ilimitados",
        "Recursos personalizados",
        "Relatórios premium",
        "Suporte 24/7",
        "Integração completa",
        "Consultoria dedicada"
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section com Background Decorativo */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background decorativo com gradiente e glow */}
        <div className="absolute inset-0 bg-gradient-glow" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-glow-pulse" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-float" />

        <Container size="xl" className="relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Conteúdo lado esquerdo */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="opacity-0 animate-fade-up">
                <Badge variant="outline" className="mb-4">
                  ✨ Novo: Dashboard v2.0
                </Badge>
              </div>

              {/* Título com gradiente */}
              <h1 
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight opacity-0 animate-fade-up"
                style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
              >
                Gestão Inteligente para{" "}
                <span className="text-gradient">Sua Academia</span>
              </h1>

              {/* Descrição */}
              <p 
                className="text-lg md:text-xl text-muted-foreground max-w-xl opacity-0 animate-fade-up"
                style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
              >
                Controle de acesso, gestão de planos e relatórios completos 
                em uma única plataforma moderna e intuitiva.
              </p>

              {/* CTAs */}
              <div 
                className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-up"
                style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
              >
                <Button size="lg">
                  Começar Agora <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="lg">
                  Ver Demonstração
                </Button>
              </div>

              {/* Social proof */}
              <div 
                className="flex items-center gap-4 text-sm text-muted-foreground opacity-0 animate-fade-up"
                style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i}
                      className="w-8 h-8 rounded-full bg-secondary border-2 border-background"
                    />
                  ))}
                </div>
                <span>+500 academias confiam no MoveAccess</span>
              </div>
            </div>

            {/* Visual lado direito (placeholder) */}
            <div 
              className="relative opacity-0 animate-scale-in"
              style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}
            >
              <Card className="glass p-8 shadow-card">
                <div className="aspect-video bg-gradient-dark rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground text-lg">
                    Prévia do Painel
                  </span>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-card/30">
        <Container size="xl">
          {/* Header da seção */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Por que escolher o MoveAccess?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tecnologia de ponta para impulsionar seu negócio
            </p>
          </div>

          {/* Grid de features com stagger */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={feature.id}
                className="glass p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg opacity-0 animate-fade-up"
                style={{ 
                  animationDelay: `${0.1 + index * 0.1}s`,
                  animationFillMode: "forwards"
                }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing Section */}
      <section className="section-padding">
        <Container size="xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Planos para todo <span className="text-gradient">tamanho</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal para sua academia
            </p>
          </div>

          {/* Grid de planos */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={plan.id}
                className={`glass p-6 relative transition-all duration-300 hover:scale-[1.02] opacity-0 animate-fade-up ${
                  plan.popular ? "border-primary ring-2 ring-primary/20" : ""
                }`}
                style={{ 
                  animationDelay: `${0.1 + index * 0.1}s`,
                  animationFillMode: "forwards"
                }}
              >
                {/* Badge de Popular */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="shadow-lg">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                {/* Nome do plano */}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

                {/* Preço */}
                <div className="mb-6">
                  <span className="text-4xl font-black">R$ {plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                >
                  Escolher {plan.name}
                </Button>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Final */}
      <section className="section-padding bg-gradient-dark relative overflow-hidden">
        {/* Glow decorativo */}
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        
        <Container size="md" className="relative z-10">
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Pronto para começar?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Junte-se a centenas de academias que já transformaram sua gestão
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                Criar Conta Grátis <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg">
                Falar com Vendas
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
