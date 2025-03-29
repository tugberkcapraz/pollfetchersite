import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Supported AI models
export type AIModel = 'azure' | 'gemini';

// Type definitions for better type safety
interface PollData {
  id?: number | string;
  title?: string;
  url?: string;
  seendate?: string;
  chartdata?: {
    XValue?: string[];
    XLabel?: string;
    YValue?: number[];
    YLabel?: string;
    Title?: string;
    Explanation?: string;
    SurveySource?: string;
    SurveyYear?: string;
  };
  sourcecountry?: string;
  score?: number;
}

interface ArticleData {
  url: string;
  text: string;
}

// API response timeout - 2 minutes
const API_TIMEOUT_MS = 120000;

// Configuration constants
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * POST handler for the report endpoint
 * Takes a user query, searches for relevant polls, and generates a comprehensive report
 */
export async function POST(request: NextRequest) {
  // Setup comprehensive logging for production debugging
  console.log('Report API called at:', new Date().toISOString());
  
  try {
    // Parse the request
    const body = await request.json();
    const { query, model = 'azure' } = body; // Default to Azure if no model specified
    
    console.log('Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      model: model,
      hasAzureEndpoint: model === 'azure' ? !!process.env.AZURE_INFERENCE_SDK_ENDPOINT : undefined,
      hasAzureKey: model === 'azure' ? !!process.env.AZURE_INFERENCE_SDK_KEY?.substring(0, 3) + '...' : undefined,
      hasGeminiKey: model === 'gemini' ? !!process.env.GEMINI_API_KEY?.substring(0, 3) + '...' : undefined,
    });
    
    // Validate model parameter
    if (!['azure', 'gemini'].includes(model)) {
      return NextResponse.json(
        { error: 'Invalid model parameter. Supported values: azure, gemini' },
        { status: 400 }
      );
    }
    
    // Validate environment variables based on selected model
    if (model === 'azure') {
      const endpoint = process.env.AZURE_INFERENCE_SDK_ENDPOINT;
      const key = process.env.AZURE_INFERENCE_SDK_KEY;
      
      if (!endpoint || !key) {
        console.error('Azure AI Inference environment variables are missing.');
        return NextResponse.json(
          { error: 'Server configuration error: Missing Azure AI credentials.' },
          { status: 500 }
        );
      }
    } else if (model === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.error('Gemini API key is missing.');
        return NextResponse.json(
          { error: 'Server configuration error: Missing Gemini API key.' },
          { status: 500 }
        );
      }
    }
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }
    
    console.log(`Processing query using ${model} model:`, query);
    
    // Step 1: Search for relevant polls
    const polls = await searchForPolls(request.nextUrl.origin, query);
    
    if (polls.length === 0) {
      console.log('No relevant polls found for query:', query);
      return NextResponse.json({
        report: "I couldn't find any relevant survey data for your question. Please try a different query."
      });
    }
    
    // Step 2: Extract URLs from polls and retrieve article content
    const relevantUrls = extractValidUrls(polls);
    
    if (relevantUrls.length === 0) {
      console.log('No valid URLs found in poll results');
      return NextResponse.json({
        report: "I found some survey data, but couldn't retrieve associated articles. Generating a report based on available metadata."
      });
    }
    
    // Step 3: Retrieve article text for the selected URLs
    const articles = await retrieveArticleText(relevantUrls);
    
    // Step 4: Generate the report using selected model
    let report;
    if (model === 'azure') {
      const endpoint = process.env.AZURE_INFERENCE_SDK_ENDPOINT!;
      const key = process.env.AZURE_INFERENCE_SDK_KEY!;
      report = await generateAzureReport(query, articles, polls, endpoint, key);
    } else {
      const apiKey = process.env.GEMINI_API_KEY!;
      report = await generateGeminiReport(query, articles, polls, apiKey);
    }
    
    // Step 5: Return the final report
    console.log(`Successfully generated report using ${model} for query:`, query);
    return NextResponse.json({ report });
    
  } catch (error) {
    // Detailed error logging
    if (error instanceof Error) {
      console.error('Error in report generation:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } else {
      console.error('Unknown error in report generation:', error);
    }
    
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

/**
 * Search for polls relevant to the user query
 */
async function searchForPolls(origin: string, query: string): Promise<PollData[]> {
  try {
    console.log('Performing search for query:', query);
    
    // Use direct database query instead of internal API call
    // This is more reliable in production environments like Azure Web App
    console.log('Executing direct database query instead of internal API call');
    
    try {
      // Connect to the database and execute the vector search directly
      // This is the same query used in the search API
      const result = await pool.query('SELECT id, title, url, seendate, chartdata, sourcecountry, score FROM pollsearcher($1, 100)', [query]);
      
      console.log(`Database returned ${result.rows.length} poll results`);
      
      if (!result.rows || result.rows.length === 0) {
        console.log('No poll results found in database for query:', query);
        return [];
      }
      
      // Process the results exactly as the search API would
      const polls = result.rows.map((row: any) => {
        // Parse the JSON string in chartdata if it's a string
        let chartdata = row.chartdata;
        if (typeof chartdata === 'string') {
          try {
            chartdata = JSON.parse(chartdata);
          } catch (e) {
            console.error('Error parsing chartdata JSON:', e);
            chartdata = {}; // Fallback to empty object
          }
        }
        
        return {
          id: row.id,
          title: row.title,
          url: row.url,
          seendate: row.seendate,
          chartdata: chartdata,
          sourcecountry: row.sourcecountry,
          score: row.score
        };
      });
      
      return polls;
    } catch (dbError) {
      console.error('Database query error in searchForPolls:', dbError);
      
      // If database query fails for any reason, fall back to HTTP API call
      // This is a backup approach in case direct DB access has issues
      console.log('Falling back to API call after database error');
      
      // Original implementation as fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
      
      // Generate the complete URL (sometimes origin might not be fully qualified in production)
      // Use a fully qualified URL if possible
      const apiUrl = origin.includes('://') 
        ? `${origin}/api/search?q=${encodeURIComponent(query)}`
        : `https://${process.env.WEBSITE_HOSTNAME || origin}/api/search?q=${encodeURIComponent(query)}`;
      
      console.log(`Calling search API at ${apiUrl}`);
      
      const searchResponse = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        throw new Error(`Search API returned status ${searchResponse.status}: ${errorText}`);
      }
      
      const searchResults = await searchResponse.json();
      
      if (!searchResults.polls || !Array.isArray(searchResults.polls)) {
        console.warn('Search API returned invalid format:', JSON.stringify(searchResults).substring(0, 200));
        return [];
      }
      
      return searchResults.polls;
    }
  } catch (error) {
    console.error('Error searching for polls:', error);
    // Return empty array instead of throwing to allow graceful degradation
    return [];
  }
}

/**
 * Extract valid URLs from poll data
 */
function extractValidUrls(polls: PollData[]): string[] {
  return polls
    .map(poll => poll.url)
    .filter((url): url is string => 
      typeof url === 'string' && 
      url !== '#' && 
      url.trim() !== '' && 
      (url.startsWith('http://') || url.startsWith('https://'))
    );
}

/**
 * Retrieve article text for the given URLs
 */
async function retrieveArticleText(urls: string[]): Promise<ArticleData[]> {
  if (urls.length === 0) return [];
  
  try {
    // Create placeholders for the SQL query
    const placeholders = urls.map((_, i) => `$${i + 1}`).join(', ');
    
    // Query the database for the article text
    console.log(`Querying database for ${urls.length} articles`);
    const result = await pool.query(
      `SELECT "Url", "ArticleText" FROM polls WHERE "Url" IN (${placeholders})`,
      urls
    );
    
    console.log(`Retrieved ${result.rows.length} articles from database`);
    
    return result.rows.map(row => ({
      url: row.Url,
      text: row.ArticleText || ""
    }));
  } catch (error) {
    console.error('Error retrieving article text:', error);
    // Return empty array to allow graceful degradation
    return [];
  }
}

/**
 * Generate a comprehensive report using Azure AI
 */
async function generateAzureReport(
  query: string,
  articles: ArticleData[],
  polls: PollData[],
  endpoint: string,
  apiKey: string
): Promise<string> {
  try {
    // Prepare poll metadata and article content, ensuring 'id' is included
    const { pollData, articleContent } = prepareReportData(query, articles, polls);
    
    // Define prompts for Azure AI - Updated for HTML and iFrames
    const systemPrompt = "You are an intelligent assistant specialized in analyzing survey data and related articles to generate comprehensive reports in HTML format. Follow the user's instructions precisely regarding source prioritization, formatting, and chart embedding.";
    const userPrompt = `
User question: "${query}"

I need you to generate a report in HTML format that answers this question primarily based on the ARTICLE TEXT below.
The poll metadata is secondary and should only be used to supplement your analysis or embed relevant charts.

${articleContent ? `PRIMARY SOURCE - FULL ARTICLE TEXTS:\n${articleContent}` : 'WARNING: No article text could be retrieved. Using only metadata.'}

SECONDARY SOURCE - POLL METADATA (USE FOR CONTEXT AND CHART EMBEDDING):
${JSON.stringify(pollData, null, 2)} // Note: Each poll object now includes an 'id'.

Your report MUST:
1. Be formatted as a valid HTML document fragment (e.g., use <p>, <h1>, <h2>, <ul>, <li> tags). Do not include <html>, <head>, or <body> tags.
2. PRIMARILY use information from the ARTICLE TEXTS.
3. When referencing specific poll data points or charts from the metadata, embed the chart using an iframe like this:
   <iframe src="https://pollfetcher.com/embed/{poll_id}" width="600" height="400" frameborder="0" scrolling="no" style="border: 1px solid #e2e8f0; border-radius: 8px;" title="{poll_title}"></iframe>
   Replace {poll_id} with the actual 'id' from the metadata and {poll_title} with the poll's title. Embed charts thoughtfully where they support the narrative.
4. Use hyperlinks for citations - when referencing content from articles, link directly to the source URL provided in the article content header (e.g., <a href="SOURCE_URL">[1]</a>).
5. Include a "References" section at the end of the report (e.g., using <h2>References</h2> and an ordered list <ol>) with numbered links to all sources used (article URLs).
6. Be comprehensive but focused on answering the specific question.
7. Clearly state if the provided information is insufficient to fully answer the question.
8. Ensure the final output is clean HTML.

Example citation link in text:
<p>According to a recent survey, 64% of Americans support this policy <a href="https://example.com/article1">[1]</a>.</p>

Example References section:
<h2>References</h2>
<ol>
  <li><a href="https://example.com/article1">Source Title or URL 1</a></li>
  <li><a href="https://example.com/article2">Source Title or URL 2</a></li>
</ol>

Read the articles carefully and prioritize this content. Embed charts from the metadata where relevant using the specified iframe format. Do not generate information not contained in the sources.
`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // Ensure the endpoint includes the "/chat/completions" path.
    const fixedEndpoint = endpoint.endsWith('/chat/completions')
      ? endpoint
      : `${endpoint}/chat/completions`;
    const url = `${fixedEndpoint}?api-version=2024-05-01-preview`;
    console.log(`Attempting to call Azure AI at: ${url}`);

    // Use fetch API with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} for Azure AI call`);
          // Add delay between retries
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
        
        // Set up request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey
          },
          body: JSON.stringify({
            messages: messages,
            max_tokens: 4000,
            model: "DeepSeek-V3"
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Azure AI API error (${response.status}):`, errorText);
          
          // For 429 (rate limit) errors, retry
          if (response.status === 429) {
            lastError = new Error(`Rate limit exceeded: ${errorText}`);
            continue; // Try again
          }
          
          throw new Error(`Azure AI API returned status ${response.status}: ${errorText}`);
        }
        
        const responseData = await response.json();
        
        if (!responseData?.choices?.[0]?.message?.content) {
          console.error('Unexpected Azure AI response structure:', JSON.stringify(responseData).substring(0, 200));
          throw new Error('Unexpected response format from Azure AI');
        }
        
        return responseData.choices[0].message.content;
      } catch (error) {
        console.error(`Azure AI call attempt ${attempt + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry if it's an abort error (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('Azure AI request timed out after ' + (API_TIMEOUT_MS / 1000) + ' seconds');
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('Failed to call Azure AI after multiple attempts');
  } catch (error) {
    console.error('Error in Azure AI report generation:', error);
    return `I encountered an error while analyzing the data and generating your report. ${
      error instanceof Error ? `Details: ${error.message}` : ''
    }`;
  }
}

/**
 * Generate a comprehensive report using Gemini API
 */
async function generateGeminiReport(
  query: string,
  articles: ArticleData[],
  polls: PollData[],
  apiKey: string
): Promise<string> {
  try {
    // Prepare poll metadata and article content, ensuring 'id' is included
    const { pollData, articleContent } = prepareReportData(query, articles, polls);
    
    // Create prompt for Gemini - Updated for HTML and iFrames
    const prompt = `
User question: "${query}"

I need you to generate a report in HTML format that answers this question primarily based on the ARTICLE TEXT below.
The poll metadata is secondary and should only be used to supplement your analysis or embed relevant charts.

${articleContent ? `PRIMARY SOURCE - FULL ARTICLE TEXTS:\n${articleContent}` : 'WARNING: No article text could be retrieved. Using only metadata.'}

SECONDARY SOURCE - POLL METADATA (USE FOR CONTEXT AND CHART EMBEDDING):
${JSON.stringify(pollData, null, 2)} // Note: Each poll object now includes an 'id'.

Your report MUST:
1. Be formatted as a valid HTML document fragment (e.g., use <p>, <h1>, <h2>, <ul>, <li> tags). Do not include <html>, <head>, or <body> tags.
2. PRIMARILY use information from the ARTICLE TEXTS.
3. When referencing specific poll data points or charts from the metadata, embed the chart using an iframe like this:
   <iframe src="https://pollfetcher.com/embed/{poll_id}" width="600" height="400" frameborder="0" scrolling="no" style="border: 1px solid #e2e8f0; border-radius: 8px;" title="{poll_title}"></iframe>
   Replace {poll_id} with the actual 'id' from the metadata and {poll_title} with the poll's title. Embed charts thoughtfully where they support the narrative.
4. Use hyperlinks for citations - when referencing content from articles, link directly to the source URL provided in the article content header (e.g., <a href="SOURCE_URL">[1]</a>).
5. Include a "References" section at the end of the report (e.g., using <h2>References</h2> and an ordered list <ol>) with numbered links to all sources used (article URLs).
6. Be comprehensive but focused on answering the specific question.
7. Clearly state if the provided information is insufficient to fully answer the question.
8. Ensure the final output is clean HTML.

Example citation link in text:
<p>According to a recent survey, 64% of Americans support this policy <a href="https://example.com/article1">[1]</a>.</p>

Example References section:
<h2>References</h2>
<ol>
  <li><a href="https://example.com/article1">Source Title or URL 1</a></li>
  <li><a href="https://example.com/article2">Source Title or URL 2</a></li>
</ol>

Read the articles carefully and prioritize this content. Embed charts from the metadata where relevant using the specified iframe format. Do not generate information not contained in the sources.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    console.log('Attempting to call Gemini API');
    
    // Use fetch API with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} for Gemini API call`);
          // Add delay between retries
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
        
        // Set up request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 1,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
              responseMimeType: "text/plain"
            }
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini API error (${response.status}):`, errorText);
          
          // For 429 (rate limit) errors, retry
          if (response.status === 429) {
            lastError = new Error(`Rate limit exceeded: ${errorText}`);
            continue; // Try again
          }
          
          throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
        }
        
        const responseData = await response.json();
        
        if (!responseData?.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.error('Unexpected Gemini API response structure:', JSON.stringify(responseData).substring(0, 200));
          throw new Error('Unexpected response format from Gemini API');
        }
        
        return responseData.candidates[0].content.parts[0].text;
      } catch (error) {
        console.error(`Gemini API call attempt ${attempt + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry if it's an abort error (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('Gemini API request timed out after ' + (API_TIMEOUT_MS / 1000) + ' seconds');
        }
      }
    }
    
    // If we get here, all retries failed
    throw lastError || new Error('Failed to call Gemini API after multiple attempts');
  } catch (error) {
    console.error('Error in Gemini report generation:', error);
    return `I encountered an error while analyzing the data and generating your report. ${
      error instanceof Error ? `Details: ${error.message}` : ''
    }`;
  }
}

/**
 * Helper function to prepare report data (common for both AI models)
 */
function prepareReportData(query: string, articles: ArticleData[], polls: PollData[]) {
  // Prepare poll metadata, including the 'id'
  const pollData = polls.map(poll => ({
    id: poll.id, // Include the poll id
    title: poll.title || poll.chartdata?.Title || "Untitled Poll",
    url: poll.url || "#",
    chartData: {
      xValues: poll.chartdata?.XValue || [],
      yValues: poll.chartdata?.YValue || [],
      xLabel: poll.chartdata?.XLabel || "",
      yLabel: poll.chartdata?.YLabel || "",
    },
    explanation: poll.chartdata?.Explanation || "",
    source: poll.chartdata?.SurveySource || "",
    year: poll.chartdata?.SurveyYear || "",
    country: poll.sourcecountry || ""
  }));
  
  // Prepare article content (with length limits)
  const articleContent = articles.map(article => {
    const text = article.text || ""; 
    const truncatedText = text.length > 4000 
      ? text.substring(0, 4000) + "... [truncated]" 
      : text;
    
    return truncatedText ? `SOURCE: ${article.url}\n\n${truncatedText}\n\n---\n\n` : '';
  }).filter(content => content).join("");
  
  return { pollData, articleContent };
}