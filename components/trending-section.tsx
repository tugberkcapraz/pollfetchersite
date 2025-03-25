"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { DynamicChart } from "@/components/dynamic-chart"

// Fixed typing to match expected type
type SurveyData = {
  survey_Title: string;
  survey_XValue: string[];
  survey_YValue: number[];
  survey_XLabel: string;
  survey_YLabel: string;
  survey_Explanation: string;
  survey_SurveySource: string;
  survey_SurveyYear: string;
  survey_ChartType: "bar" | "pie" | undefined;
  survey_URL: string;
  survey_SourceCountry: string;
  survey_SeenDate: string;
};

// This is for API response type safety
type Poll = {
  title: string;
  url: string;
  seendate: string;
  chartdata: {
    DataAssessment?: string;
    XValue: string[];
    XLabel: string;
    YValue: number[];
    YLabel: string;
    Title: string;
    Explanation?: string;
    SurveySource?: string;
    SurveyCustomer?: string;
    SurveyYear?: string;
  };
  sourcecountry: string;
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
        const transformedData: SurveyData[] = data.polls.map((poll: Poll) => ({
          survey_Title: poll.chartdata.Title || poll.title,
          survey_XValue: poll.chartdata.XValue || [],
          survey_YValue: poll.chartdata.YValue || [],
          survey_XLabel: poll.chartdata.XLabel || "",
          survey_YLabel: poll.chartdata.YLabel || "",
          survey_Explanation: poll.chartdata.Explanation || "",
          survey_SurveySource: poll.chartdata.SurveySource || "",
          survey_SurveyYear: poll.chartdata.SurveyYear || "",
          survey_ChartType: "bar", // Fixed type
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
            <div className="absolute -top-4 right-4 z-10 bg-elegant-blue px-4 py-1 rounded-full text-sm text-elegant-gold-light border border-elegant-gold/20">
              {currentIndex + 1} of {polls.length}
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {/* Pass the currentIndex as the index prop */}
                {polls.length > 0 && (
                  <DynamicChart data={polls[currentIndex]} index={currentIndex} />
                )}
              </motion.div>
            </AnimatePresence>
            
            <button 
              onClick={handlePrev}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-elegant-blue/70 hover:bg-elegant-blue transition-colors rounded-full flex items-center justify-center"
              aria-label="Previous poll"
            >
              <ChevronLeft className="w-6 h-6 text-elegant-gold" />
            </button>
            
            <button 
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-elegant-blue/70 hover:bg-elegant-blue transition-colors rounded-full flex items-center justify-center"
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

