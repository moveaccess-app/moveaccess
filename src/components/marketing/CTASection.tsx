import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui";
import { landingContent } from "@/data/landingContent";

export function CTASection() {
  const { cta } = landingContent;

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
              <span className="text-sm text-primary font-medium">
                {cta.badge}
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
              {cta.title}{" "}
              <span className="text-gradient">{cta.titleHighlight}</span>
            </h2>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {cta.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={cta.buttons.primary.href}>
                <Button variant="hero" size="lg">
                  {cta.buttons.primary.label}
                  <ArrowRight className="ml-1" />
                </Button>
              </Link>
              <Link href={cta.buttons.secondary.href}>
                <Button variant="hero-outline" size="lg">
                  <Calendar className="mr-1" size={18} />
                  {cta.buttons.secondary.label}
                </Button>
              </Link>
            </div>

            {/* Trust note */}
            <p className="mt-8 text-sm text-muted-foreground">
              {cta.trustNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
