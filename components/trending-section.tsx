"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { useSurveyData } from "@/lib/getData"
import { DynamicChart } from "@/components/dynamic-chart"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function TrendingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const { data, loading, error } = useSurveyData()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <section className="py-24 relative overflow-hidden" id="trending">
      <div className="absolute inset-0 bg-elegant-blue-dark"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">Trending Insights</h2>
            <p className="text-xl text-elegant-gray-light">
              Discover the latest polls and surveys capturing public opinion
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/search"
              className="group inline-flex items-center text-elegant-gold hover:text-elegant-gold-light transition-colors"
            >
              <span className="mr-2 font-medium">View all insights</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {loading ? (
            <div className="col-span-2 h-64 flex items-center justify-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-t-elegant-gold border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-t-elegant-accent1 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="col-span-2 p-6 border border-red-500/30 bg-red-500/10 rounded-lg">
              <p className="text-red-400">Error loading trending data. Please try again later.</p>
            </div>
          ) : (
            data.slice(0, 4).map((surveyData, index) => <DynamicChart key={index} data={surveyData} index={index} />)
          )}
        </motion.div>
      </div>
    </section>
  )
}

