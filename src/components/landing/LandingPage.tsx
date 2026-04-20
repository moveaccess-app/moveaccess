'use client';

import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { ProblemSection } from './ProblemSection';
import { PillarsSection } from './PillarsSection';
import { JourneySection } from './JourneySection';
import { HighlightSection } from './HighlightSection';
import { TrustSection } from './TrustSection';
import { CTASection } from './CTASection';
import { LandingFooter } from './LandingFooter';

export function LandingPage() {
  return (
    <>
      <style>{`
        .landing-root a,
        .landing-root a:hover {
          color: inherit;
          text-decoration: none;
        }
      `}</style>
      <div className="landing-root bg-gray-950 text-white min-h-screen antialiased overflow-x-hidden">
        <LandingHeader />
        <main>
          <HeroSection />
          <ProblemSection />
          <PillarsSection />
          <JourneySection />
          <HighlightSection />
          <TrustSection />
          <CTASection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
