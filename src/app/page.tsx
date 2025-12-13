import {
  Navbar,
  Footer,
  HeroSection,
  PillarsSection,
  FeaturesSection,
  HowItWorksSection,
  AudienceSection,
  TransparencySection,
  CTASection,
} from "@/components/marketing";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <PillarsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AudienceSection />
      <TransparencySection />
      <CTASection />
      <Footer />
    </main>
  );
}
