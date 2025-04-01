import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

  // Supported AI models - updated to specific Gemini models
export type AIModel = 'gemini-2.0-flash' | 'gemini-2.0-flash-lite';
const ALLOWED_MODELS: AIModel[] = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

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
 * Takes a user query, searches for relevant polls, and generates a comprehensive report using Gemini
 */
export async function POST(request: NextRequest) {
  // Setup comprehensive logging for production debugging
  console.log('Report API called at:', new Date().toISOString());
  
  try {
    // Parse the request
    const body = await request.json();
    // Default to gemini-1.5-flash if no model specified or invalid model
    const requestedModel = body.model;
    const model: AIModel = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : 'gemini-2.0-flash';
    
    console.log('Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      model: model,
      hasGeminiKey: !!process.env.GEMINI_API_KEY?.substring(0, 3) + '...',
    });
    
    // Validate model parameter (redundant with default but good practice)
    if (!ALLOWED_MODELS.includes(model)) {
      return NextResponse.json(
        { error: `Invalid model parameter. Supported values: ${ALLOWED_MODELS.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Validate Gemini environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key is missing.');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Gemini API key.' },
        { status: 500 }
      );
    }
    
    const { query } = body;
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
    
    // Step 3: Retrieve article text for the selected URLs (handle case where no URLs found)
    const articles = relevantUrls.length > 0 ? await retrieveArticleText(relevantUrls) : [];
    
    // Step 4: Generate the report using the selected Gemini model
    const report = await generateGeminiReport(query, articles, polls, apiKey, model); // Pass the specific model name
    
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
      const result = await pool.query('SELECT id, title, url, seendate, chartdata, sourcecountry, score FROM pollsearcher($1, 10)', [query]);
      
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
 * Generate a comprehensive report using Gemini API
 */
async function generateGeminiReport(
  query: string,
  articles: ArticleData[],
  polls: PollData[],
  apiKey: string,
  modelName: AIModel // Accept the specific model name
): Promise<string> {
  try {
    // Prepare poll metadata and article content, ensuring 'id' is included
    // The pollData includes id and title needed for iframe generation later
    const { pollData, articleContent } = prepareReportData(query, articles, polls);

    // Create a map of poll IDs to titles for easy lookup during post-processing
    const pollTitleMap = new Map<string, string>();
    pollData.forEach(poll => {
      if (poll.id) {
        // Ensure id is treated as string for consistency
        pollTitleMap.set(String(poll.id), poll.title || "Poll Chart");
      }
    });

    // Create prompt for Gemini - Updated instructions for chart placeholders
    const prompt = `
User question: "${query}"

You are report generator for Pollfetcher.com, which is an AI powered survey data aggregator.
You are given the user question and the system provied you with some articles as well as polls.

Your job is to generate a report in HTML format that answers the user question based on the articles and the polls.


${articleContent ? `PRIMARY SOURCE - FULL ARTICLE TEXTS:\n${articleContent}` : 'WARNING: No article text could be retrieved. Using only metadata.'}

SECONDARY SOURCE - POLL METADATA (USE FOR CONTEXT AND CHART EMBEDDING):
${JSON.stringify(pollData, null, 2)} // Note: Each poll object now includes an 'id'.

Your report MUST:
1. Be formatted as a valid HTML document fragment (e.g., use <p>, <h1>, <h2>, <ul>, <li> tags). Do not include <html>, <head>, or <body> tags.
2. You must cover many aspects of the question and enrich it with proper usage of the polls.
3. When you want to reference and display a specific poll chart from the metadata, DO NOT generate an iframe. Instead, insert a placeholder in the format: [CHART:{poll_id}]
   Replace {poll_id} with the actual 'id' from the metadata object corresponding to the chart you want to embed. Embed charts thoughtfully where they support the narrative.
   Example: If you want to show the chart for the poll with id '123', you would write: [CHART:123]
4. Use hyperlinks for citations - when referencing content from articles, link directly to the source URL provided in the article content header (e.g., <a href="SOURCE_URL">[1]</a>).
5. Include a "References" section at the end of the report (e.g., using <h2>References</h2> and an ordered list <ol>) with numbered links to all sources used (article URLs).
6. Be comprehensive but focused on answering the specific question.
7. Clearly state if the provided information is insufficient to fully answer the question.
8. Ensure the final output is clean HTML with the [CHART:{poll_id}] placeholders where appropriate.

Example citation link in text:
<p>According to a recent survey, 64% of Americans support this policy <a href="https://example.com/article1">[1]</a>.</p>

Example of embedding a chart placeholder in text:
<p>The trend over the past year is illustrated below: [CHART:456]</p >

Example References section:
<h2>References</h2>
<ol>
  <li><a href="https://example.com/article1">Source Title or URL 1</a></li>
  <li><a href="https://example.com/article2">Source Title or URL 2</a></li>
</ol>

Read the articles carefully and prioritize this content. Embed charts from the metadata where relevant using the specified [CHART:{poll_id}] format. Do not generate information not contained in the sources.
`;

    // Use the modelName parameter in the URL
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    console.log(`Attempting to call Gemini API (${modelName})`);

    // Use fetch API with retry logic
    let lastError: Error | null = null;
    let responseText = ''; // Variable to hold the raw response text

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} for Gemini API call (${modelName})`);
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
          console.error(`Gemini API error (${response.status}, Model: ${modelName}):`, errorText);

          // For 429 (rate limit) errors, retry
          if (response.status === 429) {
            lastError = new Error(`Rate limit exceeded: ${errorText}`);
            continue; // Try again
          }

          throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
        }

        const responseData = await response.json();

        // Adjusted check for Gemini response structure
        if (!responseData?.candidates?.[0]?.content?.parts?.[0]?.text) {
           // Log potential safety rating issues
           if (responseData?.candidates?.[0]?.finishReason === 'SAFETY') {
             console.error('Gemini API response blocked due to safety settings:', JSON.stringify(responseData.candidates[0].safetyRatings));
             throw new Error('Gemini API response blocked due to safety settings. Check the prompt or content.');
           }
           // Log if content is missing for other reasons
           if (!responseData?.candidates?.[0]?.content) {
                console.error('Gemini API response missing content block:', JSON.stringify(responseData).substring(0, 500));
                throw new Error('Gemini API response missing content block.');
           }
           // Log if parts array is missing or empty
            if (!responseData?.candidates?.[0]?.content?.parts || responseData.candidates[0].content.parts.length === 0) {
                console.error('Gemini API response missing "parts" array:', JSON.stringify(responseData.candidates[0].content).substring(0, 500));
                throw new Error('Gemini API response missing "parts" array.');
            }
          // General structure error
          console.error(`Unexpected Gemini API response structure (Model: ${modelName}):`, JSON.stringify(responseData).substring(0, 500));
          throw new Error('Unexpected response format from Gemini API');
        }

        responseText = responseData.candidates[0].content.parts[0].text;
        break; // Exit loop on success
      } catch (error) {
        console.error(`Gemini API call attempt ${attempt + 1} failed (Model: ${modelName}):`, error);
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if it's an abort error (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error(`Gemini API request timed out after ${API_TIMEOUT_MS / 1000} seconds`);
        }

        // If this was the last attempt, rethrow the error
        if (attempt === MAX_RETRIES) {
             throw lastError || new Error(`Failed to call Gemini API (${modelName}) after multiple attempts`);
        }
      }
    }

    // If responseText is empty after retries, something went wrong
    if (!responseText) {
        throw lastError || new Error(`Failed to get valid response from Gemini API (${modelName}) after multiple attempts`);
    }

    // Post-process the responseText to replace placeholders with iframes
    const processedReport = responseText.replace(
      /\[CHART:([\w-]+)\]/g, // Regex to find [CHART:id] - allows alphanumeric and hyphens in ID
      (match, pollId) => {
        const pollTitle = pollTitleMap.get(String(pollId)) || "Poll Chart"; // Get title from map
        console.log(`Replacing placeholder: ${match} with iframe for poll ID: ${pollId}`);
        // Return the iframe HTML
        return `<iframe src="https://pollfetcher.com/embed/${pollId}" width="800" height="600" frameborder="0" scrolling="no" style="border: 1px solid #e2e8f0; border-radius: 8px;" title="${pollTitle}"></iframe>`;
      }
    );

    return processedReport; // Return the processed report with iframes

  } catch (error) {
    console.error(`Error in Gemini report generation (Model: ${modelName}):`, error);
    return `I encountered an error while analyzing the data and generating your report. ${
      error instanceof Error ? `Details: ${error.message}` : ''
    }`;
  }
}

/**
 * Helper function to prepare report data (common for both AI models)
 */
function prepareReportData(query: string, articles: ArticleData[], polls: PollData[]) {
  // Prepare poll metadata, including the 'id' and 'title'
  const pollData = polls.map(poll => ({
    id: poll.id, // Ensure the poll id is included
    title: poll.title || poll.chartdata?.Title || "Untitled Poll", // Ensure title is included
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