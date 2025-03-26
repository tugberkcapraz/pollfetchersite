import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { SurveyData } from '@/lib/getData';

// Cache storage
interface MetricsCache {
  data: {
    totalPolls: SurveyData;
    countriesData: SurveyData;
    domainsData: SurveyData;
    languagesData: SurveyData;
  } | null;
  lastUpdated: Date | null;
}

// Initialize cache
const CACHE: MetricsCache = {
  data: null,
  lastUpdated: null,
};

// Function to check if cache is still valid (less than 24 hours old)
function isCacheValid(): boolean {
  if (!CACHE.lastUpdated || !CACHE.data) return false;
  
  const now = new Date();
  const cacheAge = now.getTime() - CACHE.lastUpdated.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  return cacheAge < oneDayMs;
}

// Function to fetch and cache metrics data
async function fetchMetricsData() {
  // Get total polls count
  const totalPollsResult = await pool.query(
    'SELECT count(*) FROM surveyembeddings WHERE embedding IS NOT NULL'
  );
  
  const totalCount = parseInt(totalPollsResult.rows[0].count, 10);
  
  // Format total polls data for chart display
  const totalPollsData: SurveyData = {
    survey_Title: "Total Number of Polls",
    survey_XValue: ["Total Polls"],
    survey_YValue: [totalCount],
    survey_XLabel: "Metric",
    survey_YLabel: "Count",
    survey_Explanation: "Total number of polls with embeddings in the database",
    survey_SurveySource: "Database Analytics",
    survey_SurveyYear: new Date().getFullYear().toString(),
    survey_ChartType: "bar"
  };
  
  // Get countries data
  const countriesResult = await pool.query(`
    SELECT "SourceCountry", COUNT(*) AS observation_count
    FROM surveyembeddings
    WHERE "SourceCountry" != ''
    GROUP BY "SourceCountry"
    ORDER BY observation_count DESC
    LIMIT 20
  `);
  
  // Format countries data for chart display
  const countriesData: SurveyData = {
    survey_Title: "Top 20 Countries by Poll Count",
    survey_XValue: countriesResult.rows.map(row => row.SourceCountry),
    survey_YValue: countriesResult.rows.map(row => parseInt(row.observation_count, 10)),
    survey_XLabel: "Country",
    survey_YLabel: "Number of Polls",
    survey_Explanation: "Distribution of polls by country of origin, showing the top 20 countries",
    survey_SurveySource: "Database Analytics",
    survey_SurveyYear: new Date().getFullYear().toString(),
    survey_ChartType: "bar"
  };
  
  // Get domain data
  const domainsResult = await pool.query(`
    SELECT "Domain", COUNT(*) AS observation_count
    FROM surveyembeddings
    WHERE "Domain" != ''
    GROUP BY "Domain"
    ORDER BY observation_count DESC
    LIMIT 20
  `);
  
  // Format domains data for chart display
  const domainsData: SurveyData = {
    survey_Title: "Top 20 Domains by Poll Count",
    survey_XValue: domainsResult.rows.map(row => row.Domain),
    survey_YValue: domainsResult.rows.map(row => parseInt(row.observation_count, 10)),
    survey_XLabel: "Domain",
    survey_YLabel: "Number of Polls",
    survey_Explanation: "Distribution of polls by domain, showing the top 20 domains",
    survey_SurveySource: "Database Analytics",
    survey_SurveyYear: new Date().getFullYear().toString(),
    survey_ChartType: "bar"
  };
  
  // Get language data
  const languagesResult = await pool.query(`
    SELECT "Language", COUNT(*) AS observation_count
    FROM surveyembeddings
    WHERE "Language" != ''
    GROUP BY "Language"
    ORDER BY observation_count DESC
    LIMIT 20
  `);
  
  // Format languages data for chart display
  const languagesData: SurveyData = {
    survey_Title: "Top 20 Languages by Poll Count",
    survey_XValue: languagesResult.rows.map(row => row.Language),
    survey_YValue: languagesResult.rows.map(row => parseInt(row.observation_count, 10)),
    survey_XLabel: "Language",
    survey_YLabel: "Number of Polls",
    survey_Explanation: "Distribution of polls by language, showing the top 20 languages",
    survey_SurveySource: "Database Analytics",
    survey_SurveyYear: new Date().getFullYear().toString(),
    survey_ChartType: "bar"
  };

  // Update cache
  CACHE.data = {
    totalPolls: totalPollsData,
    countriesData: countriesData,
    domainsData: domainsData,
    languagesData: languagesData
  };
  CACHE.lastUpdated = new Date();
  
  return CACHE.data;
}

export async function GET(request: NextRequest) {
  try {
    // Check if there's a force refresh parameter
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // Use cached data if available and not forcing refresh
    if (isCacheValid() && !forceRefresh) {
      console.log('Serving metrics from cache, last updated:', CACHE.lastUpdated);
      return NextResponse.json(CACHE.data);
    }
    
    // Otherwise fetch fresh data
    console.log('Fetching fresh metrics data');
    const data = await fetchMetricsData();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching metrics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics data' },
      { status: 500 }
    );
  }
} 