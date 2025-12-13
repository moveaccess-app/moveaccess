import { Building2, Zap, Users } from "lucide-react";

const audiences = [
  {
    icon: Building2,
    text: "Para academias que querem modernizar a gestão.",
  },
  {
    icon: Zap,
    text: "Para studios e boxes que precisam automatizar acesso e financeiro.",
  },
  {
    icon: Users,
    text: "Para gestores que buscam simplicidade e eficiência.",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="audience" className="section-padding relative">
      <div className="container-narrow mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider mb-4 block">
            Público
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Para quem é o MoveAccess
          </h2>
        </div>

        {/* Audience Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {audiences.map((item, index) => (
            <div
              key={index}
              className="group relative glass rounded-2xl p-8 hover:bg-card/80 transition-all duration-500 text-center"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <p className="text-foreground text-lg leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        {/* Scalability Message */}
        <div className="mt-16 text-center glass rounded-2xl p-10">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gradient">
            Criado para escalar com qualquer tamanho de academia
          </h3>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Do pequeno studio às grandes unidades — o MoveAccess foi projetado para crescer junto com você.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
