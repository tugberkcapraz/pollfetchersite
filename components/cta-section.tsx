"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import Link from "next/link"

export function CtaSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section ref={ref} className="py-24 relative overflow-hidden" id="cta">
      <div className="absolute inset-0 bg-gradient-to-b from-elegant-navy to-elegant-blue-dark"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 md:px-6 relative z-10"
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-elegant-gold-dark to-elegant-gold opacity-50 blur-md animate-pulse-gold"></div>
            <div className="relative bg-elegant-blue-dark rounded-full px-6 py-2 border border-elegant-gold/20">
              <span className="text-sm font-medium">Get Reports</span>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Ready to <span className="gradient-text">Transform</span> Your Data Experience?
          </h2>

          <p className="text-xl text-elegant-gray-light mb-10 max-w-2xl mx-auto">
            Ask questions about survey data and generate comprehensive reports based on our extensive database of polls.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/report" className="elegant-button text-lg px-10 py-4 w-full sm:w-auto">
              Generate Report
            </Link>

            <Link
              href="/about"
              className="text-elegant-cream hover:text-elegant-gold transition-colors w-full sm:w-auto text-center sm:text-left"
            >
              Learn More →
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-elegant-gold/30 to-transparent"></div>
    </section>
  )
}

