"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { SearchBar } from "@/components/search-bar"
import { HeroBackground } from "@/components/hero-background"

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const { clientX, clientY } = e
      const { left, top, width, height } = containerRef.current.getBoundingClientRect()

      const x = (clientX - left) / width
      const y = (clientY - top) / height

      containerRef.current.style.setProperty("--mouse-x", `${x}`)
      containerRef.current.style.setProperty("--mouse-y", `${y}`)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1],
      },
    }),
  }

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      style={
        {
          "--mouse-x": "0.5",
          "--mouse-y": "0.5",
        } as React.CSSProperties
      }
    >
      <HeroBackground />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
          >
            <div className="inline-block mb-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-elegant-gold-dark via-elegant-gold to-elegant-gold-light opacity-50 blur-md animate-pulse-gold"></div>
                <div className="relative bg-elegant-blue-dark rounded-full px-6 py-2 border border-elegant-gold/20">
                  <span className="text-sm font-medium">Visualize Data With Elegance</span>
                </div>
              </div>
            </div>

            <motion.h1
              className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight"
              custom={0}
              initial="hidden"
              animate="visible"
              variants={textVariants}
            >
              <span className="block">Unlock the Power of</span>
              <span className="gradient-text">Public Opinion</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-elegant-gray-light mb-8 max-w-3xl mx-auto leading-relaxed"
              custom={1}
              initial="hidden"
              animate="visible"
              variants={textVariants}
            >
              Discover, analyze, and visualize survey data with beautifully crafted interactive charts and deep
              insights.
            </motion.p>

            <motion.div custom={2} initial="hidden" animate="visible" variants={textVariants}>
              <SearchBar />
            </motion.div>
          </motion.div>

          <motion.div
            className="grid grid-cols-3 gap-4 mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {["Instant Visualization", "Real-time Analysis", "Verified Sources"].map((feature, index) => (
              <div key={index} className="glass-panel p-4 text-center">
                <p className="text-sm font-medium">{feature}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-elegant-gold/30 flex justify-center pt-2">
          <div className="w-1 h-2 bg-elegant-gold/50 rounded-full"></div>
        </div>
      </div>
    </section>
  )
}

