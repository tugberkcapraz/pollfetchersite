import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { TrendingSection } from "@/components/trending-section"
import { TestimonialSection } from "@/components/testimonial-section"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TrendingSection />
      <TestimonialSection />
      <CtaSection />
      <Footer />
    </>
  )
}

