"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Search, BarChart2, Shield, Zap, Globe, Lock } from "lucide-react"

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  const features = [
    {
      icon: <Search className="w-10 h-10 text-elegant-gold" />,
      title: "Semantic Search",
      description:
        "Our AI-powered search engine understands the intent behind your queries, delivering the most relevant poll results instantly.",
    },
    {
      icon: <BarChart2 className="w-10 h-10 text-elegant-accent1" />,
      title: "Dynamic Visualization",
      description:
        "Transform complex data into stunning interactive charts that reveal patterns and insights at a glance.",
    },
    {
      icon: <Shield className="w-10 h-10 text-elegant-accent2" />,
      title: "Source Verification",
      description:
        "Every poll is verified for authenticity with complete transparency about methodology and data collection.",
    },
    {
      icon: <Zap className="w-10 h-10 text-elegant-accent3" />,
      title: "Real-time Analysis",
      description: "Get instant analysis of trends, correlations, and anomalies as new data becomes available.",
    },
    {
      icon: <Globe className="w-10 h-10 text-elegant-gold-light" />,
      title: "Global Coverage",
      description: "Access polls and surveys from around the world, with data from diverse sources and regions.",
    },
    {
      icon: <Lock className="w-10 h-10 text-elegant-gold-dark" />,
      title: "Data Privacy",
      description:
        "Your search history and preferences are protected with enterprise-grade security and privacy controls.",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.215, 0.61, 0.355, 1],
      },
    },
  }

  return (
    <section className="py-24 relative overflow-hidden" id="features">
      <div className="absolute inset-0 bg-elegant-navy"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-elegant-blue/30 to-transparent"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              <span className="gradient-text">Powerful Features</span>
            </h2>
            <p className="text-xl text-elegant-gray-light max-w-2xl mx-auto">
              Sophisticated tools designed to transform how you discover and analyze public opinion data
            </p>
          </motion.div>
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants} className="elegant-card p-6 h-full flex flex-col">
              <div className="mb-6 relative flex items-center justify-center h-16">
                <div
                  className="absolute -inset-2 rounded-full opacity-10 blur-md"
                  style={{
                    background: `radial-gradient(circle, ${index % 2 === 0 ? "#D4AF37" : "#7D5A50"}, transparent 70%)`,
                  }}
                ></div>
                <div className="relative">{feature.icon}</div>
              </div>
              <h3 className="text-xl font-display font-semibold mb-4 text-center">{feature.title}</h3>
              <p className="text-elegant-gray-light flex-grow text-center">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

