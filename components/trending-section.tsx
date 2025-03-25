"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { DynamicChart } from "@/components/dynamic-chart"

type SurveyData = {
  survey_Title: string;
  survey_XValue: string[];
  survey_YValue: number[];
  survey_XLabel: string;
  survey_YLabel: string;
  survey_Explanation: string;
  survey_SurveySource: string;
  survey_SurveyYear: string;
  survey_ChartType: string;
  survey_URL: string;
  survey_SourceCountry: string;
  survey_SeenDate: string;
};

export function TrendingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  
  const [polls, setPolls] = useState<SurveyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [yesterday, setYesterday] = useState("")

  // Fetch random polls
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/random-polls')
        
        if (!response.ok) {
          throw new Error('Failed to fetch random polls')
        }
        
        const data = await response.json()
        
        // Transform the data to match our SurveyData interface
        const transformedData: SurveyData[] = data.polls.map(poll => ({
          survey_Title: poll.chartdata.Title || poll.title,
          survey_XValue: poll.chartdata.XValue || [],
          survey_YValue: poll.chartdata.YValue || [],
          survey_XLabel: poll.chartdata.XLabel || "",
          survey_YLabel: poll.chartdata.YLabel || "",
          survey_Explanation: poll.chartdata.Explanation || "",
          survey_SurveySource: poll.chartdata.SurveySource || "",
          survey_SurveyYear: poll.chartdata.SurveyYear || "",
          survey_ChartType: 'bar', // Default to bar
          survey_URL: poll.url || "#",
          survey_SourceCountry: poll.sourcecountry || "",
          survey_SeenDate: poll.seendate || new Date().toISOString()
        }))
        
        setPolls(transformedData)
        
        // Set yesterday's date for display
        const yesterdayDate = new Date()
        yesterdayDate.setDate(yesterdayDate.getDate() - 1)
        setYesterday(format(yesterdayDate, "MMMM d, yyyy"))
      } catch (err) {
        setError('Failed to load trending polls')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPolls()
  }, [])

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % polls.length)
  }

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + polls.length) % polls.length)
  }

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
      <div className="absolute inset-0 bg-gradient-to-b from-elegant-navy to-elegant-blue"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Random Polls From <span className="gradient-text">{yesterday}</span>
            </h2>
          </motion.div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-t-elegant-gold border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-t-elegant-accent1 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 border border-red-500/30 bg-red-500/10 rounded-lg max-w-4xl mx-auto">
            <p className="text-red-400">Error loading trending data. Please try again later.</p>
          </div>
        ) : (
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -top-4 right-4 bg-elegant-blue px-4 py-1 rounded-full text-sm text-elegant-gold-light border border-elegant-gold/20">
              {currentIndex + 1} of {polls.length}
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="bg-elegant-blue-dark/50 backdrop-blur rounded-xl p-6 border border-elegant-gold/10"
              >
                {polls.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-2xl font-display font-bold mb-4">
                      {polls[currentIndex].survey_Title}
                    </h3>
                    <div className="mb-4 flex items-center space-x-3">
                      <span className="text-elegant-gray-light text-sm">
                        {polls[currentIndex].survey_SurveyYear || "Unknown Year"}
                      </span>
                      <div className="h-4 w-px bg-elegant-gray-light/30"></div>
                      <span className="text-elegant-gold-light text-sm">
                        {polls[currentIndex].survey_SourceCountry}
                      </span>
                    </div>
                    
                    {/* Chart visualization using the DynamicChart component */}
                    <div className="h-[300px] mb-6">
                      <DynamicChart data={polls[currentIndex]} index={currentIndex} />
                    </div>
                    
                    <p className="text-elegant-gray-light mb-4">
                      {polls[currentIndex].survey_Explanation}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-elegant-gray">
                        Source: {polls[currentIndex].survey_SurveySource}
                      </div>
                      
                      {polls[currentIndex].survey_URL && polls[currentIndex].survey_URL !== "#" && (
                        <Link 
                          href={polls[currentIndex].survey_URL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-elegant-gold hover:text-elegant-gold-light transition-colors inline-flex items-center"
                        >
                          View original source
                          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            
            <button 
              onClick={handlePrev}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-elegant-blue/70 hover:bg-elegant-blue transition-colors rounded-full flex items-center justify-center"
              aria-label="Previous poll"
            >
              <ChevronLeft className="w-6 h-6 text-elegant-gold" />
            </button>
            
            <button 
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-elegant-blue/70 hover:bg-elegant-blue transition-colors rounded-full flex items-center justify-center"
              aria-label="Next poll"
            >
              <ChevronRight className="w-6 h-6 text-elegant-gold" />
            </button>
            
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                {polls.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === currentIndex 
                        ? "bg-elegant-gold w-6" 
                        : "bg-elegant-gray-light/30 hover:bg-elegant-gray-light/50"
                    }`}
                    aria-label={`Go to poll ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

