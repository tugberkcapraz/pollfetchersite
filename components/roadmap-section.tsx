"use client"

import { useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import {
  CheckCircle,
  Rocket,
  Target,
  Milestone,
  ChevronDown,
  Clock,
  CheckSquare,
  Calendar,
  ArrowRight,
  Link,
  Shield,
  Code,
  Sparkles,
  BarChart,
  FileSearch,
  Database,
  RefreshCcw,
  Palette,
  Layers
} from "lucide-react"

// Map status to colors and icons
const statusConfig = {
  completed: {
    icon: Rocket,
    colorClasses: {
      border: "border-primary",
      bg: "bg-primary",
      text: "text-primary",
      bgOpacity: "bg-primary/10",
      iconBg: "bg-primary",
      iconText: "text-primary-foreground",
      gradientFrom: "from-primary/20",
      gradientTo: "to-primary/5",
      shadow: "shadow-primary/20",
      dotBg: "bg-primary",
    },
  },
  upcoming: {
    icon: Target,
    colorClasses: {
      border: "border-secondary",
      bg: "bg-secondary",
      text: "text-secondary",
      bgOpacity: "bg-secondary/10",
      iconBg: "bg-secondary",
      iconText: "text-secondary-foreground",
      gradientFrom: "from-secondary/20",
      gradientTo: "to-secondary/5",
      shadow: "shadow-secondary/30",
      dotBg: "bg-secondary",
    },
  },
  future: {
    icon: Milestone,
    colorClasses: {
      border: "border-muted-foreground/50",
      bg: "bg-muted-foreground/50",
      text: "text-muted-foreground",
      bgOpacity: "bg-muted-foreground/10",
      iconBg: "bg-muted-foreground/60",
      iconText: "text-background",
      gradientFrom: "from-muted-foreground/20",
      gradientTo: "to-muted-foreground/5",
      shadow: "shadow-muted-foreground/20",
      dotBg: "bg-muted-foreground/50",
    },
  },
}

// Assign specific icons to different roadmap items for visual variety
const featureIcons = {
  "AI-Powered Poll Search": FileSearch,
  "Historical Archive (Up to 2023)": Database,
  "AI Report Generation": Sparkles,
  "Platform Metrics Dashboard": BarChart,
  "Historical Archive Expansion (Up to 2017)": Database,
  "Additional Chart Types": Layers,
  "Poll Search API Release": Code,
  "Report Generation API Release": Code,
  "Enhanced Poll Parsing (LLM Upgrade)": Sparkles,
  "Data Quality Pipeline Refinement": RefreshCcw,
  "Customizable Chart Options": Palette,
  "WordPress Integration": Link,
  "Chrome Extension Release": Shield,
  "Ghost CMS Integration": Link,
}

const roadmapData = [
  {
    quarter: "2025 Q1",
    title: "Launch & Foundation",
    phaseStatus: "completed",
    items: [
      { name: "AI-Powered Poll Search", status: "checked", details: "Implemented advanced semantic search for polls." },
      { name: "Historical Archive (Up to 2023)", status: "checked", details: "Aggregated and indexed poll data up to end of 2023." },
      { name: "AI Report Generation", status: "checked", details: "Launched initial version of AI-driven report creation grounded in poll data." },
      { name: "Platform Metrics Dashboard", status: "checked", details: "Provided users with key usage and platform performance metrics." },
    ],
  },
  {
    quarter: "2025 Q2",
    title: "Expansion & API",
    phaseStatus: "upcoming",
    items: [
      { name: "Historical Archive Expansion (Up to 2017)", status: "upcoming", details: "Working on extending the poll archive back to 2017." },
      { name: "Additional Chart Types", status: "upcoming", details: "Adding Pie, Scatter, and Line chart options for visualization." },
      { name: "Poll Search API Release", status: "upcoming", details: "Developing a public API for programmatic poll searching." },
      { name: "Report Generation API Release", status: "upcoming", details: "Creating an API endpoint for automated report generation." },
      { name: "Enhanced Poll Parsing (LLM Upgrade)", status: "upcoming", details: "Improving data extraction accuracy with a more capable language model." },
      { name: "Data Quality Pipeline Refinement", status: "upcoming", details: "Implementing stricter validation and cleaning processes for incoming data." },
      { name: "Customizable Chart Options", status: "upcoming", details: "Allowing users to customize chart appearance and branding." },
    ],
  },
  {
    quarter: "2025 Q3",
    title: "Integrations & Reach",
    phaseStatus: "future",
    items: [
      { name: "WordPress Integration", status: "upcoming", details: "Planning a plugin for easy embedding of PollFetcher data in WordPress sites." },
      { name: "Chrome Extension Release", status: "upcoming", details: "Building a browser extension for quick poll lookups and analysis." },
      { name: "Ghost CMS Integration", status: "upcoming", details: "Developing integration for seamless use within the Ghost publishing platform." },
    ],
  },
]

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.3, delayChildren: 0.2 },
  },
}

const phaseCardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: "easeOut" } 
  },
}

const articleBodyVariants = {
  collapsed: { 
    height: 0, 
    opacity: 0, 
    marginTop: 0, 
    paddingBottom: 0, 
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } 
  },
  expanded: {
    height: "auto",
    opacity: 1,
    marginTop: "0.75rem",
    paddingBottom: "1rem",
    transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
  },
}

const shimmerVariants = {
  hidden: { x: '-100%', opacity: 0.1 },
  visible: { 
    x: '100%', 
    opacity: 0.2,
    transition: { 
      repeat: Infinity, 
      duration: 2,
      ease: "easeInOut",
      repeatDelay: 1
    }
  }
}

export function RoadmapSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.1 })
  const [expandedArticles, setExpandedArticles] = useState<{ [key: string]: boolean }>({})

  const toggleArticle = (phaseIndex: number, itemIndex: number) => {
    const key = `${phaseIndex}-${itemIndex}`
    setExpandedArticles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <section ref={ref} className="py-24 md:py-36 bg-gradient-to-b from-background via-muted/40 to-background relative overflow-hidden" id="roadmap">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-[0.02] grid-bg z-0"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-40 -translate-x-1/4 -translate-y-1/4 z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-50 translate-x-1/4 translate-y-1/4 z-0 pointer-events-none"></div>
      
      {/* Subtle animated gradient lines */}
      <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent z-0"></div>
      <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent z-0"></div>

      <div className="container max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20 md:mb-28"
        >
          <div className="inline-block mb-3">
            <span className="inline-block text-sm md:text-base font-medium py-1 px-4 rounded-full bg-primary/10 text-primary">
              Our Progress & Vision
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl xl:text-6xl font-display font-bold mb-6 leading-tight">
            Evolving <span className="gradient-text">Roadmap</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Track our progress and see where we're headed next. Tap any item to discover more details.
          </p>
        </motion.div>

        {/* Cards Container - Modern Card Layout replacing timeline */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {roadmapData.map((phase, phaseIndex) => {
            const config = statusConfig[phase.phaseStatus as keyof typeof statusConfig]
            const PhaseIcon = config.icon

            return (
              <motion.div
                key={phase.quarter}
                variants={phaseCardVariants}
                className={`relative group rounded-xl bg-card border ${config.colorClasses.border} shadow-lg overflow-hidden`}
              >
                {/* Shimmer effect on hover */}
                <motion.div 
                  variants={shimmerVariants}
                  initial="hidden"
                  animate="visible"
                  className={`absolute inset-0 w-full h-full bg-gradient-to-r ${config.colorClasses.gradientFrom} ${config.colorClasses.gradientTo} skew-x-[-20deg] pointer-events-none`}
                />
                
                {/* Phase Header with gradient */}
                <div className={`relative p-6 bg-gradient-to-br ${config.colorClasses.gradientFrom} ${config.colorClasses.gradientTo}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${config.colorClasses.bg} ${config.colorClasses.shadow}`}>
                      <PhaseIcon className={`w-6 h-6 ${config.colorClasses.iconText}`} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.colorClasses.bgOpacity} ${config.colorClasses.text}`}>
                      {phase.phaseStatus === "completed" ? "Completed" : phase.phaseStatus === "upcoming" ? "In Progress" : "Planned"}
                    </span>
                  </div>
                  <h3 className={`text-2xl font-display font-bold ${config.colorClasses.text}`}>{phase.quarter}</h3>
                  <p className="text-foreground/80 font-medium mt-1 text-sm">{phase.title}</p>

                  {/* Mini timeline dots */}
                  <div className="flex items-center mt-4 space-x-1">
                    {phase.items.map((_, i) => (
                      <div 
                        key={`dot-${i}`} 
                        className={`w-1.5 h-1.5 rounded-full ${config.colorClasses.dotBg} opacity-${70 - (i * 10 > 30 ? 30 : i * 10)}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Phase Items */}
                <div className="p-5 space-y-3">
                  {phase.items.map((item, itemIndex) => {
                    const uniqueKey = `${phaseIndex}-${itemIndex}`
                    const isExpanded = expandedArticles[uniqueKey]
                    const ItemIcon = featureIcons[item.name as keyof typeof featureIcons] || (item.status === "checked" ? CheckSquare : Clock)
                    
                    return (
                      <motion.div
                        key={uniqueKey}
                        variants={itemVariants}
                        layout
                        className={`rounded-lg bg-card overflow-hidden border ${
                          isExpanded ? `${config.colorClasses.border}` : 'border-border/50'
                        } ${config.colorClasses.shadow}`}
                      >
                        <button
                          onClick={() => toggleArticle(phaseIndex, itemIndex)}
                          className={`w-full flex items-center justify-between p-3 text-left transition-all duration-200 hover:bg-muted/50 ${
                            isExpanded ? config.colorClasses.bgOpacity : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.colorClasses.iconBg} flex items-center justify-center shadow-sm`}>
                              <ItemIcon
                                className={`w-4 h-4 ${config.colorClasses.iconText}`}
                              />
                            </div>
                            <span className="font-medium text-sm text-foreground">{item.name}</span>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              key="content"
                              variants={articleBodyVariants}
                              initial="collapsed"
                              animate="expanded"
                              exit="collapsed"
                              className="px-4 overflow-hidden"
                            >
                              <div className={`border-t ${config.colorClasses.border} pt-3`}>
                                <p className="text-sm text-muted-foreground">
                                  {item.details || `Details about "${item.name}" coming soon.`}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Card footer with subtle indicator of status */}
                <div className={`px-5 pb-5 pt-2 flex justify-end`}>
                  <div className={`text-xs inline-flex items-center ${config.colorClasses.text} gap-1 font-medium`}>
                    <span>
                      {phase.phaseStatus === "completed" ? "All complete" : 
                       phase.phaseStatus === "upcoming" ? "In development" : "Coming soon"}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}