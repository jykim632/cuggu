import { ScrollStory } from "@/components/landing-c/ScrollStory";
import { BeforeAfter } from "@/components/landing-c/BeforeAfter";
import { StepGuide } from "@/components/landing-c/StepGuide";

export default function LandingCPage() {
  return (
    <div className="min-h-screen">
      <ScrollStory />
      <BeforeAfter />
      <StepGuide />
    </div>
  );
}
