import { Users, Calendar, Clock, Bell, BarChart3, RefreshCw } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Gestão de alunos",
    description: "Cadastro completo, histórico e comunicação centralizada.",
  },
  {
    icon: Calendar,
    title: "Planos e vencimentos",
    description: "Controle total de planos, valores e datas de renovação.",
  },
  {
    icon: Clock,
    title: "Check-in e presença",
    description: "Histórico detalhado de frequência e horários de pico.",
  },
  {
    icon: Bell,
    title: "Automação de cobrança",
    description: "Régua completa: D-3, D+1, D+5, D+10 automatizados.",
  },
  {
    icon: BarChart3,
    title: "Painel financeiro",
    description: "MRR, churn, ticket médio e indicadores em tempo real.",
  },
  {
    icon: RefreshCw,
    title: "Reativações",
    description: "Identifique e recupere alunos inativos automaticamente.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="section-padding relative">
      <div className="container-wide mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider mb-4 block">
            Funcionalidades
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Tudo que sua academia precisa
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ferramentas poderosas para automatizar e escalar sua operação
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
