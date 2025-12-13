import { Rocket } from "lucide-react";

const TransparencySection = () => {
  return (
    <section className="py-16 relative">
      <div className="container-narrow mx-auto">
        <div className="glass rounded-2xl p-10 md:p-12 text-center border border-primary/10">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Rocket className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Estamos construindo o futuro da gestão de academias
          </h3>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            O MoveAccess está em expansão e evolui continuamente com base no uso real e na necessidade das academias. Buscamos entregar a experiência mais simples e inteligente da categoria.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TransparencySection;
