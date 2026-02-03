import { HeroSplit } from "@/components/landing-b/HeroSplit";
import { TemplateGrid } from "@/components/landing-b/TemplateGrid";
import { VideoSection } from "@/components/landing-b/VideoSection";

export default function LandingBPage() {
  return (
    <div className="min-h-screen">
      <HeroSplit />
      <TemplateGrid />
      <VideoSection />
    </div>
  );
}
