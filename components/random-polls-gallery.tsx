"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { DynamicChart } from "@/components/dynamic-chart"
import type { SurveyData } from "@/lib/getData"

type Poll = {
  title: string
  url: string
  seendate: string
  chartdata: {
    DataAssessment?: string
    XValue: string[]
    XLabel: string
    YValue: number[]
    YLabel: string
    Title: string
    Explanation?: string
    SurveySource?: string
    SurveyCustomer?: string
    SurveyYear?: string
    ChartType?: "bar" | "pie"
  }
  sourcecountry: string
  id?: string
}

// Directly import these from wherever your SurveyData type is defined
interface SurveyData {
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
  survey_Id?: string;
}

export function RandomPollsGallery() {
  const [polls, setPolls] = useState<Poll[]>([])
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
        setPolls(data.polls)
        
        // Set yesterday's date for display
        const yesterdayDate = new Date()
        yesterdayDate.setDate(yesterdayDate.getDate() - 1)
        setYesterday(format(yesterdayDate, "MMMM d, yyyy"))
      } catch (err) {
        setError('Failed to load random polls')
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

  if (loading) {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-elegant-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || polls.length === 0) {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <p className="text-elegant-gray-light text-lg">No polls found for today.</p>
      </div>
    )
  }

  const currentPoll = polls[currentIndex]
  
  // Convert poll data to SurveyData format for DynamicChart
  const surveyData: SurveyData = {
    survey_Id: currentPoll.id,
    survey_Title: currentPoll.title || "Untitled Poll",
    survey_XValue: currentPoll.chartdata.XValue || [],
    survey_YValue: currentPoll.chartdata.YValue || [],
    survey_XLabel: currentPoll.chartdata.XLabel || "",
    survey_YLabel: currentPoll.chartdata.YLabel || "",
    survey_Explanation: currentPoll.chartdata.Explanation || "No explanation provided.",
    survey_SurveySource: currentPoll.chartdata.SurveySource || "Unknown Source",
    survey_SurveyYear: currentPoll.chartdata.SurveyYear || "",
    survey_ChartType: currentPoll.chartdata.ChartType || "bar",
    survey_URL: currentPoll.url || "",
    survey_SourceCountry: currentPoll.sourcecountry || "",
    survey_SeenDate: currentPoll.seendate || new Date().toISOString()
  }

  return (
    <div className="relative py-8">
      <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-center">
        Random Polls From <span className="gradient-text">{yesterday}</span>
      </h2>
      
      <div className="relative max-w-4xl mx-auto">
        {/* This counter pill */}
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
            <DynamicChart data={surveyData} />
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation buttons */}
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
      </div>
      
      {/* Pagination indicators */}
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
  )
} 