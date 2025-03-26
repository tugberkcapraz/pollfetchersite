"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSurveyData } from "@/lib/getData"
import { DynamicChart } from "@/components/dynamic-chart"
import { SearchBar } from "@/components/search-bar"
import { Footer } from "@/components/footer"
import { SortSelector } from "@/components/sort-selector"
import { RandomPollsGallery } from "@/components/random-polls-gallery"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const sortParam = searchParams.get("sort") || "relevance"
  const [sortOption, setSortOption] = useState(sortParam)
  const { data: unsortedData, loading, error } = useSurveyData(query)
  const [searchPerformed, setSearchPerformed] = useState(false)
  
  // Sort the data based on the selected option
  const data = [...unsortedData].sort((a, b) => {
    if (sortOption === "date") {
      // Sort by seendate (newest first)
      const dateA = a.survey_SeenDate ? new Date(a.survey_SeenDate).getTime() : 0
      const dateB = b.survey_SeenDate ? new Date(b.survey_SeenDate).getTime() : 0
      return dateB - dateA
    }
    // If relevance is selected, use the original order
    // which is presumed to be returned by relevance
    return 0
  })

  useEffect(() => {
    if (query) {
      setSearchPerformed(true)
    }
  }, [query])
  
  // Update URL when sort option changes
  useEffect(() => {
    if (sortOption !== sortParam && query) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("sort", sortOption)
      router.push(`/search?${params.toString()}`)
    }
  }, [sortOption, query, router, searchParams, sortParam])

  return (
    <>
      <div className="min-h-screen pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <motion.h1
              className="text-3xl md:text-4xl font-display font-bold mb-6 px-1"
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
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {query ? (
                <SearchBar />
              ) : (
                <RandomPollsGallery />
              )}
            </motion.div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-t-elegant-gold border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-t-elegant-accent1 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="glass-panel p-8 text-center">
              <h2 className="text-xl font-display font-semibold mb-4">Error Loading Data</h2>
              <p className="text-elegant-gray-light mb-4">
                We encountered an issue while searching. Please try again.
              </p>
              <pre className="text-left text-sm text-red-400 p-4 bg-red-950/20 rounded-md overflow-auto">
                {error.message}
              </pre>
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
              <div className="mb-6 flex justify-between items-center">
                <p className="text-elegant-gray-light">
                  Found {data.length} results for "{query}"
                </p>
                <SortSelector value={sortOption} onChange={setSortOption} />
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

