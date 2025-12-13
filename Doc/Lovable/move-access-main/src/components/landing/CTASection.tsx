import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";

const CTASection = () => {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute inset-0 bg-gradient-glow" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container-narrow mx-auto relative z-10">
        <div className="glass rounded-3xl p-8 md:p-12 lg:p-16 text-center">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-primary/5 opacity-50" />

          <div className="relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-primary font-medium">Comece agora mesmo</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
              Leve sua academia para o{" "}
              <span className="text-gradient">próximo nível.</span>
            </h2>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Automatize sua gestão e tenha controle total sobre acesso, financeiro e contratos em um único sistema.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg">
                Quero conhecer
                <ArrowRight className="ml-1" />
              </Button>
              <Button variant="hero-outline" size="lg">
                <Calendar className="mr-1" size={18} />
                Agendar demonstração
              </Button>
            </div>

            {/* Trust note */}
            <p className="mt-8 text-sm text-muted-foreground">
              Sem compromisso • Setup gratuito • Suporte dedicado
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
