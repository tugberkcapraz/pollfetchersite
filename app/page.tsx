import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { TrendingSection } from "@/components/trending-section"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { FileText } from "lucide-react"
import { RoadmapSection } from "@/components/roadmap-section"

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TrendingSection />
      <CtaSection />
      <RoadmapSection />
      <Footer />
    </>
  )
}

