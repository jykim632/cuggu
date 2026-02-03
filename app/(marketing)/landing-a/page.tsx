import { HeroElegant } from "@/components/landing-a/HeroElegant";
import { TemplateCarousel } from "@/components/landing-a/TemplateCarousel";
import { FloralDecoration } from "@/components/landing-a/FloralDecoration";

export default function LandingAPage() {
  return (
    <div className="min-h-screen">
      <HeroElegant />
      <TemplateCarousel />
      <FloralDecoration />
    </div>
  );
}
