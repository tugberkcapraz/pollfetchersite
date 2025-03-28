"use client"

import { useState, useEffect } from "react"
import type { PollResult } from "@/app/api/search/route"

export interface SurveyData {
  survey_Title?: string
  survey_XValue: string[]
  survey_YValue: number[]
  survey_XLabel?: string
  survey_YLabel?: string
  survey_Explanation?: string
  survey_SurveySource?: string
  survey_SurveyYear?: string
  survey_ChartType?: 'bar' | 'pie'
  survey_URL?: string
  survey_SourceCountry?: string
  survey_SeenDate?: string
  survey_Id: string
}

// This function simulates fetching data from an API or database
export async function fetchSurveyData(query?: string): Promise<SurveyData[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // In a real application, this would be an API call with the query parameter
  // For now, we'll return mock data
  return [
    {
      survey_Id: "mock1",
      survey_XValue: ["Africa", "Southeast Asia", "South America"],
      survey_XLabel: "Region",
      survey_YValue: [207.0, 0.0, 0.0],
      survey_YLabel: "Export Value (million yuan)",
      survey_Title: "Shuangfeng County Agricultural Machinery Exports",
      survey_Explanation:
        "The growth of agricultural machinery exports from Shuangfeng county, Hunan province, China. The county has seen significant growth in the agricultural machinery sector, driven by innovation and the development of machines suitable for hilly terrain. Exports have increased substantially, particularly to Africa.",
      survey_SurveySource: "Shuangfeng agricultural machinery affairs center",
      survey_SurveyYear: "2023",
      survey_URL: "#"
    },
    {
      survey_Id: "mock2",
      survey_XValue: [
        "Operating Independently from Headquarters",
        "Plan to Increase Investments in China",
        "Primary Motivation for Investment",
        "Chinese Competitors as Innovation Leaders (within 5 years)",
        "Chinese Competitors as Innovation Leaders (already the case)",
      ],
      survey_XLabel: "Aspect",
      survey_YValue: [40.0, 50.0, 87.0, 55.0, 8.0],
      survey_YLabel: "Percentage",
      survey_Title: "German Companies' Localization Strategies and Investment in China",
      survey_Explanation:
        "Survey of German companies operating in China, focusing on localization strategies, investment plans, and views on Chinese competition.",
      survey_SurveySource: "German Chamber of Commerce in China",
      survey_SurveyYear: "2024",
      survey_URL: "#"
    },
    {
      survey_Id: "mock3",
      survey_XValue: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"],
      survey_XLabel: "Satisfaction Level",
      survey_YValue: [35.0, 42.0, 15.0, 5.0, 3.0],
      survey_YLabel: "Percentage of Respondents",
      survey_Title: "Customer Satisfaction Survey Results",
      survey_Explanation:
        "Results from our annual customer satisfaction survey showing overall positive feedback with 77% of customers reporting satisfaction with our services.",
      survey_SurveySource: "Internal Customer Relations Department",
      survey_SurveyYear: "2024",
      survey_URL: "#"
    },
    {
      survey_Id: "mock4",
      survey_XValue: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
      survey_XLabel: "Age Group",
      survey_YValue: [22.0, 38.0, 27.0, 8.0, 3.0, 2.0],
      survey_YLabel: "Percentage of Users",
      survey_Title: "Social Media Platform User Demographics",
      survey_Explanation:
        "Age distribution of users on our platform showing a concentration in the 25-44 age range, which accounts for 65% of our user base.",
      survey_SurveySource: "Platform Analytics Team",
      survey_SurveyYear: "2024",
      survey_URL: "#"
    },
  ].map(item => ({ ...item, survey_ChartType: 'bar' } as SurveyData))
}

export function useSurveyData(query?: string) {
  const [data, setData] = useState<SurveyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!query) {
        setLoading(false)
        setData([])
        return
      }

      try {
        setLoading(true)
        
        // Call our API endpoint
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (!result.polls || !Array.isArray(result.polls)) {
          throw new Error('Invalid response format')
        }
        
        // Transform the data to match our SurveyData interface
        const transformedData: SurveyData[] = result.polls.map((poll: PollResult) => ({
          survey_Id: poll.id,
          survey_Title: poll.chartdata?.Title ?? poll.title ?? "Untitled Poll",
          survey_XValue: poll.chartdata?.XValue ?? [],
          survey_YValue: poll.chartdata?.YValue ?? [],
          survey_XLabel: poll.chartdata?.XLabel ?? "",
          survey_YLabel: poll.chartdata?.YLabel ?? "",
          survey_Explanation: poll.chartdata?.Explanation ?? "",
          survey_SurveySource: poll.chartdata?.SurveySource ?? "",
          survey_SurveyYear: poll.chartdata?.SurveyYear ?? "",
          survey_ChartType: 'bar', // Default to bar, you can determine this based on data
          survey_URL: poll.url,
          survey_SourceCountry: poll.sourcecountry,
          survey_SeenDate: poll.seendate
        }))
        
        setData(transformedData)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err : new Error('Unknown error occurred'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [query])

  return { data, loading, error }
}

