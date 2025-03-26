import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { TrendingSection } from "@/components/trending-section"
import { TestimonialSection } from "@/components/testimonial-section"
import { CtaSection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { FileText } from "lucide-react"

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TrendingSection />
      <TestimonialSection />
      <CtaSection />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        <Link href="/report">
          <div className="glass-panel p-6 rounded-xl transition-transform hover:scale-105">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-elegant-gold bg-opacity-10 mb-4">
              <FileText className="h-8 w-8 text-elegant-gold" />
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">Generate Reports</h3>
            <p className="text-starlight-100">
              Ask questions and get comprehensive reports based on our survey database.
            </p>
          </div>
        </Link>
      </div>
      <Footer />
    </>
  )
}

