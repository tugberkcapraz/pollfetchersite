"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSurveyData } from "@/lib/getData"
import { DynamicChart } from "@/components/dynamic-chart"
import { SearchBar } from "@/components/search-bar"
import { Footer } from "@/components/footer"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const { data, loading, error } = useSurveyData(query)
  const [searchPerformed, setSearchPerformed] = useState(false)

  useEffect(() => {
    if (query) {
      setSearchPerformed(true)
    }
  }, [query])

  return (
    <>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto mb-12">
            <motion.h1
              className="text-3xl md:text-4xl font-display font-bold mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {query ? (
                <>
                  Search Results for <span className="gradient-text">"{query}"</span>
                </>
              ) : (
                <>
                  Explore <span className="gradient-text">Survey Data</span>
                </>
              )}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <SearchBar />
            </motion.div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-t-neon-purple border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-4 border-t-neon-blue border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                </div>
              </div>
              <p className="text-xl font-display">Searching for results...</p>
            </div>
          ) : error ? (
            <div className="glass-panel p-8 text-center">
              <div className="inline-block mb-4 text-red-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-display font-semibold mb-2">Error Loading Data</h2>
              <p className="text-starlight-100 mb-6">
                {error.message || "An unexpected error occurred. Please try again later."}
              </p>
              <button onClick={() => window.location.reload()} className="cyber-button text-sm">
                Try Again
              </button>
            </div>
          ) : !searchPerformed ? (
            <div className="glass-panel p-8 text-center">
              <h2 className="text-xl font-display font-semibold mb-4">
                Enter a search term to find relevant polls and surveys
              </h2>
              <p className="text-starlight-100">
                Try searching for topics like "climate change", "healthcare", or "technology adoption"
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <h2 className="text-xl font-display font-semibold mb-2">No results found for "{query}"</h2>
              <p className="text-starlight-100 mb-6">
                Try adjusting your search terms or explore our trending polls below.
              </p>
              <button onClick={() => window.history.back()} className="cyber-button text-sm">
                View Trending Polls
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-elegant-gray-light">
                  Found {data.length} results for "{query}"
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.map((surveyData, index) => (
                  <DynamicChart key={index} data={surveyData} index={index} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

