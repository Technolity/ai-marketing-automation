import LandingNav          from "@/components/LandingNav";
import HeroSection          from "@/components/landing/HeroSection";
import FeaturesGrid         from "@/components/landing/FeaturesGrid";
import HowToUseSection      from "@/components/landing/HowToUseSection";
import PricingSection       from "@/components/landing/PricingSection";
import TestimonialsSection  from "@/components/landing/TestimonialsSection";
import CTASection           from "@/components/landing/CTASection";
import FooterSection        from "@/components/landing/FooterSection";

export default function Home() {
  return (
    <>
      {/* Landing-specific nav — replaces AppNavbar on "/" */}
      <LandingNav />

      <main style={{ background: "#00031C" }}>
        {/* 1. Hero — static founder photo + light rays */}
        <HeroSection />

        {/* 2. Features — 2×2 live system cards */}
        <FeaturesGrid />

        {/* 4. How It Works — 3-step cards */}
        <HowToUseSection />

        {/* 5. Pricing — 3-tier monthly/yearly */}
        <PricingSection />

        {/* 6. Testimonials — 3D carousel */}
        <TestimonialsSection />

        {/* 7. CTA — perspective grid floor */}
        <CTASection />

        {/* 8. Footer */}
        <FooterSection />
      </main>
    </>
  );
}
