"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { format, parseISO, isValid } from "date-fns"

type Poll = {
  title: string
  url: string
  seendate: string
  chartdata: any
  sourcecountry: string
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

  return (
    <div className="relative py-8">
      <h2 className="text-3xl md:text-4xl font-display font-bold mb-8 text-center">
        Random Polls From <span className="gradient-text">{yesterday}</span>
      </h2>
      
      <div className="relative max-w-4xl mx-auto bg-elegant-blue-dark/50 backdrop-blur rounded-xl p-6 border border-elegant-gold/10">
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
            className="min-h-[300px]"
          >
            <h3 className="text-2xl font-display font-bold mb-4">{currentPoll.title}</h3>
            <div className="mb-4 flex items-center space-x-3">
              <span className="text-elegant-gray-light text-sm">
                {(() => {
                  try {
                    // Safely parse the date and check if it's valid
                    const date = parseISO(currentPoll.seendate);
                    return isValid(date) ? format(date, "MMM d, yyyy") : "Date unavailable";
                  } catch (e) {
                    return "Date unavailable";
                  }
                })()}
              </span>
              <div className="h-4 w-px bg-elegant-gray-light/30"></div>
              <span className="text-elegant-gold-light text-sm">
                {currentPoll.sourcecountry}
              </span>
            </div>
            
            <div className="h-[200px] mb-4">
              {/* This is where you would render the chart using the chartdata */}
              <div className="w-full h-full flex items-center justify-center bg-elegant-blue/30 rounded-lg border border-elegant-blue-light/20">
                <p className="text-elegant-gray-light">Chart visualization goes here</p>
              </div>
            </div>
            
            <Link 
              href={currentPoll.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-elegant-gold hover:text-elegant-gold-light transition-colors inline-flex items-center"
            >
              View original source
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
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
      </div>
      
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