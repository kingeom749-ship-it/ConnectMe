import { Hero } from "../components/Hero";
import { Marquee } from "../components/Marquee";
import { InterestsSection } from "../components/InterestsSection";
import { HowItWorks } from "../components/HowItWorks";
import { DepartmentsSection } from "../components/DepartmentsSection";
import { FinalCta, Footer, Manifesto } from "../components/Closing";

export default function Landing() {
  return (
    <main data-testid="landing-page">
      <Hero />
      <Marquee />
      <InterestsSection />
      <HowItWorks />
      <DepartmentsSection />
      <Manifesto />
      <FinalCta />
      <Footer />
    </main>
  );
}
