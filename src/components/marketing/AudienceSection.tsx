import { landingContent } from "@/data/landingContent";

export function AudienceSection() {
  const { audience } = landingContent;

  return (
    <section id="audience" className="section-padding relative">
      <div className="container-narrow mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider mb-4 block">
            {audience.badge}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {audience.title}
          </h2>
        </div>

        {/* Audience Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {audience.items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group relative glass rounded-2xl p-8 hover:bg-card/80 transition-all duration-500 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <p className="text-foreground text-lg leading-relaxed">
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* Scalability Message */}
        <div className="mt-16 text-center glass rounded-2xl p-10">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gradient">
            {audience.scalability.title}
          </h3>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {audience.scalability.description}
          </p>
        </div>
      </div>
    </section>
  );
}
