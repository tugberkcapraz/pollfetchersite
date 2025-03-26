"use client"

import { useState, useEffect } from "react"
import { DynamicChart } from "@/components/dynamic-chart"
import { SurveyData } from "@/lib/getData"
import { Loader2 } from "lucide-react"

export default function MetricsPage() {
  const [totalPolls, setTotalPolls] = useState<SurveyData | null>(null)
  const [countriesData, setCountriesData] = useState<SurveyData | null>(null)
  const [domainsData, setDomainsData] = useState<SurveyData | null>(null)
  const [languagesData, setLanguagesData] = useState<SurveyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetricsData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/metrics')
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const data = await response.json()
        
        setTotalPolls(data.totalPolls)
        setCountriesData(data.countriesData)
        setDomainsData(data.domainsData)
        setLanguagesData(data.languagesData)
      } catch (err) {
        console.error('Error fetching metrics:', err)
        setError('Failed to load metrics data')
      } finally {
        setLoading(false)
      }
    }

    fetchMetricsData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading metrics data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-12">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8">Metrics Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-12">
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