"use client"

import { useState, useEffect } from "react"
import { DynamicChart } from "@/components/dynamic-chart"
import { SurveyData } from "@/lib/getData"
import { Loader2, RefreshCw } from "lucide-react"

export default function MetricsPage() {
  const [totalPolls, setTotalPolls] = useState<SurveyData | null>(null)
  const [countriesData, setCountriesData] = useState<SurveyData | null>(null)
  const [domainsData, setDomainsData] = useState<SurveyData | null>(null)
  const [languagesData, setLanguagesData] = useState<SurveyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMetricsData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      const url = forceRefresh 
        ? '/api/metrics?refresh=true' 
        : '/api/metrics'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      setTotalPolls(data.totalPolls)
      setCountriesData(data.countriesData)
      setDomainsData(data.domainsData)
      setLanguagesData(data.languagesData)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError('Failed to load metrics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetricsData()
  }, [])

  const handleRefresh = () => {
    fetchMetricsData(true)
  }

  if (loading && !totalPolls) {
    return (
      <div className="container mx-auto py-24 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading metrics data...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto pt-24 pb-16 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <h1 className="text-3xl md:text-4xl font-bold">Metrics Dashboard</h1>
        <div className="flex items-center self-end md:self-auto">
          {lastUpdated && (
            <div className="text-sm text-muted-foreground mr-4">
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          )}
          <button 
            onClick={handleRefresh} 
            disabled={loading}
            className="py-2 px-4 rounded-md bg-primary hover:bg-primary/90 text-white flex items-center whitespace-nowrap"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Data
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-12">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-16">
        {totalPolls && (
          <div className="w-full h-[400px]">
            <DynamicChart data={totalPolls} />
          </div>
        )}
        
        {countriesData && (
          <div className="w-full h-[600px]">
            <DynamicChart data={countriesData} />
          </div>
        )}
        
        {domainsData && (
          <div className="w-full h-[600px]">
            <DynamicChart data={domainsData} />
          </div>
        )}
        
        {languagesData && (
          <div className="w-full h-[600px]">
            <DynamicChart data={languagesData} />
          </div>
        )}
      </div>
    </div>
  )
} 