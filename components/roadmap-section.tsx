"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { CheckCircle, Circle } from "lucide-react"

const roadmapData = [
  {
    quarter: "2025 Q1",
    items: [
      { name: "AI-Powered Poll Search", status: "checked" },
      { name: "Historical Archive (Up to 2023)", status: "checked" },
      { name: "AI Powered Report Generation Grounded with Polls", status: "checked" },
      { name: "Platform Metrics", status: "checked" },
    ],
  },
  {
    quarter: "2025 Q2",
    items: [
      { name: "Historical Archive Expansion (Up to 2017)", status: "upcoming" },
      { name: "Additional Chart Types (Pie, Scatter, Line)", status: "upcoming" },
      { name: "Poll Search API Release", status: "upcoming" },
      { name: "Report Generation API Release", status: "upcoming" },
      { name: "Enhanced Poll Parsing (LLM Upgrade)", status: "upcoming" },
      { name: "Data Quality Pipeline Refinement", status: "upcoming" },
      { name: "Customizable Chart Options for Brands", status: "upcoming" },
    ],
  },
  {
    quarter: "2025 Q3",
    items: [
      { name: "WordPress Integration", status: "upcoming" },
      { name: "Chrome Extension Release", status: "upcoming" },
      { name: "Ghost CMS Integration", status: "upcoming" },
    ],
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export function RoadmapSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section ref={ref} className="py-24 bg-background relative overflow-hidden" id="roadmap">
      {/* Optional subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] grid-bg"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 text-foreground">
            Our Product Roadmap
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            See what we've accomplished and what's coming next on our journey.
          </p>
        </motion.div>

        <motion.div
          className="relative"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Timeline Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-border -translate-x-1/2 hidden md:block"></div>

          {roadmapData.map((phase, index) => (
            <motion.div
              key={phase.quarter}
              className={`mb-12 flex ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } md:items-start`}
              variants={itemVariants}
            >
              {/* Quarter Title */}
              <div className="w-full md:w-1/2 px-4 md:px-8 py-4">
                <div className={`md:${index % 2 === 0 ? "text-right" : "text-left"}`}>
                  <h3 className="text-2xl font-display font-semibold text-primary mb-2">
                    {phase.quarter}
                  </h3>
                </div>
              </div>

              {/* Items Card */}
              <div className="w-full md:w-1/2 px-4 md:px-8 py-4">
                <div className="bg-card p-6 rounded-lg shadow-md border border-border relative">
                  {/* Card Pointer */}
                  <div
                    className={`absolute top-6 ${
                      index % 2 === 0 ? "-left-2.5" : "-right-2.5"
                    } transform ${
                      index % 2 === 0 ? "-translate-y-1/2" : "-translate-y-1/2"
                    } w-5 h-5 bg-card border ${
                      index % 2 === 0 ? "border-r-0 border-b-0" : "border-l-0 border-t-0"
                    } border-border rotate-45 hidden md:block`}
                  ></div>

                  <ul className="space-y-3">
                    {phase.items.map((item) => (
                      <li key={item.name} className="flex items-start space-x-3">
                        {item.status === "checked" ? (
                          <CheckCircle className="w-5 h-5 text-accent-light flex-shrink-0 mt-1" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground/70 flex-shrink-0 mt-1" />
                        )}
                        <span className="text-foreground">{item.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
} 