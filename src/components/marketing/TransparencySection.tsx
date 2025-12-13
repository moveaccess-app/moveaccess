import { landingContent } from "@/data/landingContent";

export function TransparencySection() {
  const { transparency } = landingContent;
  const Icon = transparency.icon;

  return (
    <section className="py-16 relative">
      <div className="container-narrow mx-auto">
        <div className="glass rounded-2xl p-10 md:p-12 text-center border border-primary/10">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            {transparency.title}
          </h3>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            {transparency.description}
          </p>
        </div>
      </div>
    </section>
  );
}
