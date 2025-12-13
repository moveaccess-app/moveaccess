import { UserPlus, FileSignature, Scan, LineChart } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Cadastre planos e alunos",
    description: "Configure seus planos, valores e cadastre alunos em poucos cliques.",
  },
  {
    icon: FileSignature,
    step: "02",
    title: "Gere contratos e assinaturas",
    description: "Contratos digitais com assinatura eletrônica e validade jurídica.",
  },
  {
    icon: Scan,
    step: "03",
    title: "Libere acesso automaticamente",
    description: "QR Code, biometria ou catraca — entrada sem filas nem burocracia.",
  },
  {
    icon: LineChart,
    step: "04",
    title: "Acompanhe tudo no painel",
    description: "Receba automaticamente e monitore todos os indicadores em tempo real.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="section-padding relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />

      <div className="container-narrow mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider mb-4 block">
            Como funciona
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Como sua academia funciona com o{" "}
            <span className="text-gradient">MoveAccess?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Do cadastro ao recebimento — tudo automatizado em 4 passos
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div key={item.step} className="relative group">
                {/* Card */}
                <div className="text-center">
                  {/* Icon container */}
                  <div className="relative inline-flex mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-glow transition-all duration-500">
                      <item.icon className="w-8 h-8 text-primary" />
                    </div>
                    {/* Step number */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">{item.step}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold mb-2 text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-4 text-border">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
