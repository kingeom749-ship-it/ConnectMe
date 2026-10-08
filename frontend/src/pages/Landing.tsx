import { Hero } from "../components/Hero";
import { Marquee } from "../components/Marquee";
import { InterestsSection } from "../components/InterestsSection";
import { HowItWorks } from "../components/HowItWorks";
import { DepartmentsSection } from "../components/DepartmentsSection";
import { FinalCta, Footer, Manifesto } from "../components/Closing";
import { ScrollConstellation } from "../components/ScrollConstellation";

export default function Landing() {
  return (
    <main data-testid="landing-page" className="relative">
      <ScrollConstellation />
      <div className="relative z-[1]">
        <Hero />
        <Marquee />
        <InterestsSection />
        <HowItWorks />
        <DepartmentsSection />
        <Manifesto />
        <FinalCta />
        <Footer />
      </div>
    </main>
  );
}
