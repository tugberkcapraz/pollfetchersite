"use client"

import { useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

export function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  const testimonials = [
    {
      quote:
        "Insight Analytics has revolutionized how we analyze public opinion. The visualization tools are elegant and have helped us identify trends we would have missed otherwise.",
      author: "Sarah Johnson",
      title: "Research Director, Global Insights Institute",
    },
    {
      quote:
        "The speed and accuracy of Insight Analytics' search engine is unmatched. We can find relevant polls in seconds and trust the data's integrity.",
      author: "Michael Chen",
      title: "Data Scientist, TechAnalytica",
    },
    {
      quote:
        "As a journalist, I rely on Insight Analytics daily to back my stories with credible data. The source verification feature gives me confidence in the polls I cite.",
      author: "Elena Rodriguez",
      title: "Senior Reporter, World News Network",
    },
  ]

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-24 relative overflow-hidden" id="testimonials">
      <div className="absolute inset-0 bg-elegant-navy"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-elegant-gold/5 via-transparent to-transparent"></div>

      <div ref={ref} className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">What Our Users Say</h2>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -left-10 text-elegant-gold opacity-20">
              <Quote size={80} />
            </div>

            <div className="glass-panel p-8 md:p-12">
              <div className="min-h-[200px] flex flex-col justify-between">
                <motion.p
                  key={activeIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-xl md:text-2xl italic mb-8"
                >
                  "{testimonials[activeIndex].quote}"
                </motion.p>

                <motion.div
                  key={`author-${activeIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <p className="font-display font-semibold text-lg">{testimonials[activeIndex].author}</p>
                  <p className="text-elegant-gray-light">{testimonials[activeIndex].title}</p>
                </motion.div>
              </div>

              <div className="flex justify-between items-center mt-8 pt-8 border-t border-white/10">
                <div className="flex space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === activeIndex ? "bg-elegant-gold" : "bg-white/20 hover:bg-white/40"
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={prevTestimonial}
                    className="p-2 rounded-full border border-white/20 hover:border-elegant-gold/70 hover:bg-elegant-gold/10 transition-colors"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextTestimonial}
                    className="p-2 rounded-full border border-white/20 hover:border-elegant-gold/70 hover:bg-elegant-gold/10 transition-colors"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

