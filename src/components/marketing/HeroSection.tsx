import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui";
import { landingContent } from "@/data/landingContent";

// Chart data for dashboard preview mockup
const CHART_VALUES = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];

export function HeroSection() {
  const { hero } = landingContent;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-glow" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-glow-pulse" />

      <div className="container-wide mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-6 animate-fade-up"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">
                {hero.badge}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight mb-6 opacity-0 animate-fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              {hero.headline}{" "}
              <span className="text-gradient">{hero.headlineHighlight}</span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 opacity-0 animate-fade-up"
              style={{ animationDelay: "0.3s" }}
            >
              {hero.subheadline}
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start opacity-0 animate-fade-up"
              style={{ animationDelay: "0.4s" }}
            >
              <Link href={hero.cta.primary.href}>
                <Button variant="hero" size="lg">
                  {hero.cta.primary.label}
                  <ArrowRight className="ml-1" />
                </Button>
              </Link>
              <Link href={hero.cta.secondary.href}>
                <Button variant="hero-outline" size="lg">
                  <Play className="mr-1" size={18} />
                  {hero.cta.secondary.label}
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div
              className="flex items-center gap-4 mt-10 justify-center lg:justify-start opacity-0 animate-fade-up flex-wrap"
              style={{ animationDelay: "0.5s" }}
            >
              {hero.trustBadges.map((badge, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-card/50 rounded-full border border-border"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      badge.color === "green"
                        ? "bg-green-500"
                        : badge.color === "blue"
                          ? "bg-blue-500"
                          : "bg-primary"
                    }`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup */}
          <div
            className="relative opacity-0 animate-scale-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="relative animate-float">
              {/* Glow behind */}
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-3xl" />

              {/* Main mockup container */}
              <div className="relative glass rounded-2xl p-2 shadow-card">
                <div className="bg-card rounded-xl overflow-hidden">
                  {/* Browser bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-background/50 rounded-md px-3 py-1.5 text-xs text-muted-foreground text-center">
                        {hero.mockup.url}
                      </div>
                    </div>
                  </div>

                  {/* Dashboard preview */}
                  <div className="p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-foreground/10 rounded" />
                        <div className="h-3 w-24 bg-foreground/5 rounded" />
                      </div>
                      <div className="h-8 w-24 bg-primary/20 rounded-lg" />
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-3 gap-3">
                      {hero.mockup.stats.map((stat, i) => (
                        <div
                          key={i}
                          className="bg-secondary/30 rounded-lg p-3"
                        >
                          <div className="text-xs text-muted-foreground mb-1">
                            {stat.label}
                          </div>
                          <div className="text-lg font-bold text-foreground">
                            {stat.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chart placeholder */}
                    <div className="bg-secondary/20 rounded-lg p-4 h-32 flex items-end gap-1">
                      {CHART_VALUES.map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-primary/40 rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating card - mobile */}
              <div
                className="absolute -bottom-6 -left-6 glass rounded-xl p-3 shadow-card animate-float"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {hero.mockup.floatingCard.label}
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {hero.mockup.floatingCard.value}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
