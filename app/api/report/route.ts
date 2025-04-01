import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// Supported AI models - updated to specific Gemini models
export type AIModel = 'gemini-2.0-flash' | 'gemini-2.0-flash-lite';
const ALLOWED_MODELS: AIModel[] = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
// Model specifically for function calling step (often faster/cheaper is fine)
const FUNCTION_CALL_MODEL = 'gemini-2.0-flash-lite';

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

// --- START: Function Calling Types ---
interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>; // Adjusted for flexibility
    required?: string[];
  };
}

interface Tool {
  functionDeclarations: FunctionDeclaration[];
}

interface FunctionCallArgs {
  query_1: string;
  query_2: string;
  query_3: string;
}

interface FunctionCallPart {
  functionCall: {
    name: string;
    args: FunctionCallArgs;
  };
}

interface GeminiFunctionCallResponse {
  candidates: {
    content: {
      parts: FunctionCallPart[];
    };
    finishReason: string;
    // Add other relevant fields if needed, like safetyRatings
  }[];
  // Add promptFeedback if needed
}
// --- END: Function Calling Types ---

// API response timeout - 2 minutes
const API_TIMEOUT_MS = 120000;
// Function call specific timeout (shorter might be okay)
const FUNCTION_CALL_TIMEOUT_MS = 30000;

// Configuration constants
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Tool definition for generating search queries
const searchQueriesTool: Tool = {
  functionDeclarations: [
    {
      name: "ShortenedVectorQueries",
      description: "Generate optimized search queries for a public opinion poll/survey database. When a user submits a question, analyze their underlying intent and create three distinct vector search queries that will retrieve the most relevant and diverse results. Each query should explore a different dimension of the user's question to ensure comprehensive coverage of the topic. Avoid using raw user input directly as vector search queries, as this reduces result quality. Instead, create concise, focused queries that target different aspects of what the user is truly asking about.",
      parameters: {
        type: "object",
        properties: {
          "query_1": { type: "string", description: "First optimized vector search query." },
          "query_2": { type: "string", description: "Second optimized vector search query, exploring a different angle." },
          "query_3": { type: "string", description: "Third optimized vector search query, exploring another angle." }
        },
        required: ["query_1", "query_2", "query_3"]
      }
    },
  ]
};

/**
 * Uses Gemini Function Calling to generate optimized search queries.
 */
async function getOptimizedSearchQueries(originalQuery: string, apiKey: string): Promise<string[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${FUNCTION_CALL_MODEL}:generateContent?key=${apiKey}`;
  console.log(`Attempting function call with model ${FUNCTION_CALL_MODEL} for query: "${originalQuery}"`);

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: originalQuery }],
      },
    ],
    systemInstruction: {
      parts: [{ text: "Take user query and create optimised shortened queries to the vector database" }],
    },
    tools: [searchQueriesTool],
    // Tool config can force function call if needed, but often implicit with tools present
    // tool_config: {
    //   function_calling_config: {
    //     mode: "ANY", // or "MANDATORY" if you *only* want a function call
    //     allowed_function_names: ["ShortenedVectorQueries"]
    //   }
    // }
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for function call`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FUNCTION_CALL_TIMEOUT_MS);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Function Call API error (${response.status}):`, errorText);
        if (response.status === 429) {
          lastError = new Error(`Rate limit exceeded during function call: ${errorText}`);
          continue;
        }
        throw new Error(`Function Call API returned status ${response.status}: ${errorText}`);
      }

      const responseData = await response.json() as GeminiFunctionCallResponse;

      // Validate the response structure and extract function call arguments
      const functionCall = responseData?.candidates?.[0]?.content?.parts?.[0]?.functionCall;
      if (functionCall?.name === 'ShortenedVectorQueries' && functionCall.args) {
        const { query_1, query_2, query_3 } = functionCall.args;
        if (query_1 && query_2 && query_3) {
          console.log('Successfully received optimized queries:', { query_1, query_2, query_3 });
          return [query_1, query_2, query_3];
        }
      }

      // If function call is not as expected
      console.error('Unexpected Function Call response structure:', JSON.stringify(responseData).substring(0, 500));
      throw new Error('Failed to extract optimized queries from function call response.');

    } catch (error) {
      console.error(`Function call attempt ${attempt + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Function call request timed out after ${FUNCTION_CALL_TIMEOUT_MS / 1000} seconds`);
      }
      if (attempt === MAX_RETRIES) {
           throw lastError || new Error(`Failed to get optimized queries after multiple attempts`);
      }
    }
  }
   // Should not be reachable if loop logic is correct, but satisfies TS
   throw lastError || new Error('Failed to get optimized queries after multiple attempts');
}

/**
 * POST handler for the report endpoint
 * Takes a user query, uses function calling to refine search queries,
 * searches for relevant polls, and generates a comprehensive report using Gemini.
 */
export async function POST(request: NextRequest) {
  // Setup comprehensive logging for production debugging
  console.log('Report API called at:', new Date().toISOString());

  try {
    // Parse the request
    const body = await request.json();
    const requestedModel = body.model;
    const model: AIModel = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : 'gemini-2.0-flash';
    const { query: originalQuery } = body; // Rename to originalQuery for clarity

    // --- Environment and Input Validation ---
    console.log('Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      reportModel: model,
      funcCallModel: FUNCTION_CALL_MODEL,
      hasGeminiKey: !!process.env.GEMINI_API_KEY?.substring(0, 3) + '...',
    });

    if (!ALLOWED_MODELS.includes(model)) {
      return NextResponse.json({ error: `Invalid model parameter. Supported values: ${ALLOWED_MODELS.join(', ')}` }, { status: 400 });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key is missing.');
      return NextResponse.json({ error: 'Server configuration error: Missing Gemini API key.' }, { status: 500 });
    }
    if (!originalQuery || typeof originalQuery !== 'string') {
      return NextResponse.json({ error: 'Query parameter is required and must be a string' }, { status: 400 });
    }
    // --- End Validation ---

    console.log(`Processing original query: "${originalQuery}"`);

    // Step 1: Get optimized search queries using function calling
    let searchQueries: string[];
    try {
      searchQueries = await getOptimizedSearchQueries(originalQuery, apiKey);
    } catch (funcCallError) {
      console.error('Function calling failed:', funcCallError);
      // Optional: Fallback to original query? Or just fail? Let's fail for now.
      return NextResponse.json({ error: `Failed to optimize search query: ${funcCallError instanceof Error ? funcCallError.message : 'Unknown error'}` }, { status: 500 });
    }

    // Step 2: Perform searches concurrently using optimized queries
    console.log('Performing concurrent searches for queries:', searchQueries);
    const searchPromises = searchQueries.map(q => searchForPolls(request.nextUrl.origin, q));
    const searchResultsArrays = await Promise.all(searchPromises);
    const allPolls = searchResultsArrays.flat(); // Combine results from all searches

    // Step 3: Deduplicate poll results based on ID
    const uniquePollsMap = new Map<string | number, PollData>();
    allPolls.forEach(poll => {
        // Ensure poll.id exists and is not already in the map
        if (poll.id !== undefined && poll.id !== null && !uniquePollsMap.has(poll.id)) {
            uniquePollsMap.set(poll.id, poll);
        }
    });
    const polls = Array.from(uniquePollsMap.values()); // Final list of unique polls

    console.log(`Found ${allPolls.length} polls initially, ${polls.length} unique polls after deduplication.`);

    if (polls.length === 0) {
      console.log('No relevant polls found for optimized queries:', searchQueries);
      return NextResponse.json({
        report: "I couldn't find any relevant survey data for your question, even after optimizing the search. Please try a different query."
      });
    }

    // Step 4: Extract URLs from unique polls
    const relevantUrls = extractValidUrls(polls);

    // Step 5: Retrieve article text for the selected URLs
    const articles = relevantUrls.length > 0 ? await retrieveArticleText(relevantUrls) : [];
    if (relevantUrls.length > 0 && articles.length === 0) {
       console.warn(`Found ${relevantUrls.length} relevant URLs but failed to retrieve any article text.`);
       // Proceeding without article text, generateGeminiReport handles this
    } else if (relevantUrls.length === 0) {
        console.log('No valid URLs found in the unique poll results.');
         // Proceeding without article text
    }

    // Step 6: Generate the report using the selected Gemini model and unique polls/articles
    // Pass the *original* user query to the report generator for context
    const report = await generateGeminiReport(originalQuery, articles, polls, apiKey, model);

    // Step 7: Return the final report
    console.log(`Successfully generated report using ${model} for original query: "${originalQuery}"`);
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
      { error: 'Failed to generate report due to an internal error.' },
      { status: 500 }
    );
  }
}

/**
 * Search for polls relevant to the user query
 */
async function searchForPolls(origin: string, query: string): Promise<PollData[]> {
  try {
    console.log(`Performing search for query: "${query}"`); // Log the specific query being searched

    // Use direct database query instead of internal API call
    console.log('Executing direct database query for search');

    try {
      // Connect to the database and execute the vector search directly
      const result = await pool.query('SELECT id, title, url, seendate, chartdata, sourcecountry, score FROM pollsearcher($1, 10)', [query]); // Keep limit reasonable per query

      console.log(`Database returned ${result.rows.length} poll results for query: "${query}"`);

      if (!result.rows || result.rows.length === 0) {
        // Don't log as error, just no results for this specific query
        // console.log(`No poll results found in database for query: "${query}"`);
        return [];
      }

      // Process the results
      const polls = result.rows.map((row: any): PollData => { // Add return type hint
        let chartdata = row.chartdata;
        if (typeof chartdata === 'string') {
          try {
            chartdata = JSON.parse(chartdata);
          } catch (e) {
            console.error(`Error parsing chartdata JSON for poll ID ${row.id}:`, e);
            chartdata = {}; // Fallback
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
      console.error(`Database query error in searchForPolls for query "${query}":`, dbError);
      // Decide if fallback to API is still desired here, or just return [] for this query
      console.warn(`Database search failed for query "${query}", returning empty results for this query.`);
      return []; // Returning empty for this specific failed query
    }
  } catch (error) {
    console.error(`Unexpected error in searchForPolls for query "${query}":`, error);
    return []; // Graceful degradation for this query
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
  originalQuery: string, // Changed parameter name for clarity
  articles: ArticleData[],
  polls: PollData[], // This is now the deduplicated list
  apiKey: string,
  modelName: AIModel
): Promise<string> {
  try {
    // Prepare poll metadata and article content
    const { pollData, articleContent } = prepareReportData(originalQuery, articles, polls); // Pass original query to helper

    // Create a map of poll IDs to titles for easy lookup during post-processing
    const pollTitleMap = new Map<string, string>();
    pollData.forEach(poll => {
      if (poll.id) {
        pollTitleMap.set(String(poll.id), poll.title || "Poll Chart");
      }
    });

    // Create prompt for Gemini - use originalQuery here
    const prompt = `
User question: "${originalQuery}"

You are report generator for Pollfetcher.com, which is an AI powered survey data aggregator.
You are given the user question and the system provied you with some articles as well as polls based on optimized searches derived from the user question.

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
6. Be comprehensive but focused on answering the specific user question: "${originalQuery}".
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
    console.log(`Attempting report generation with ${modelName} for query: "${originalQuery}"`);

    // Use fetch API with retry logic
    let lastError: Error | null = null;
    let responseText = ''; // Variable to hold the raw response text

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} for report generation API call (${modelName})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }

        const controller = new AbortController();
        // Use the main API timeout here
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 1, topK: 40, topP: 0.95, maxOutputTokens: 8192, responseMimeType: "text/plain"
            }
            // No tools needed for report generation itself
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Report Generation API error (${response.status}, Model: ${modelName}):`, errorText);
          if (response.status === 429) {
            lastError = new Error(`Rate limit exceeded during report generation: ${errorText}`);
            continue;
          }
          throw new Error(`Report Generation API returned status ${response.status}: ${errorText}`);
        }

        const responseData = await response.json();

        if (!responseData?.candidates?.[0]?.content?.parts?.[0]?.text) {
           if (responseData?.candidates?.[0]?.finishReason === 'SAFETY') {
             console.error('Report Gen API response blocked due to safety settings:', JSON.stringify(responseData.candidates[0].safetyRatings));
             throw new Error('Report Gen API response blocked due to safety settings.');
           }
           if (!responseData?.candidates?.[0]?.content) {
                console.error('Report Gen API response missing content block:', JSON.stringify(responseData).substring(0, 500));
                throw new Error('Report Gen API response missing content block.');
           }
            if (!responseData?.candidates?.[0]?.content?.parts || responseData.candidates[0].content.parts.length === 0) {
                console.error('Report Gen API response missing "parts" array:', JSON.stringify(responseData.candidates[0].content).substring(0, 500));
                throw new Error('Report Gen API response missing "parts" array.');
            }
          console.error(`Unexpected Report Gen API response structure (Model: ${modelName}):`, JSON.stringify(responseData).substring(0, 500));
          throw new Error('Unexpected response format from Report Gen API');
        }

        responseText = responseData.candidates[0].content.parts[0].text;
        break; // Exit loop on success
      } catch (error) {
        console.error(`Report Gen API call attempt ${attempt + 1} failed (Model: ${modelName}):`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error(`Report Gen API request timed out after ${API_TIMEOUT_MS / 1000} seconds`);
        }
        if (attempt === MAX_RETRIES) {
             throw lastError || new Error(`Failed to call Report Gen API (${modelName}) after multiple attempts`);
        }
      }
    }

    if (!responseText) {
        throw lastError || new Error(`Failed to get valid response from Report Gen API (${modelName}) after multiple attempts`);
    }

    // Post-process the responseText to replace placeholders with iframes
    const processedReport = responseText.replace(
      /\[CHART:([\w-]+)\]/g,
      (match, pollId) => {
        const pollTitle = pollTitleMap.get(String(pollId)) || "Poll Chart";
        console.log(`Replacing placeholder: ${match} with iframe for poll ID: ${pollId}`);
        return `<iframe src="https://pollfetcher.com/embed/${pollId}" width="800" height="600" frameborder="0" scrolling="no" style="border: 1px solid #e2e8f0; border-radius: 8px;" title="${pollTitle}"></iframe>`;
      }
    );

    return processedReport;

  } catch (error) {
    console.error(`Error in Gemini report generation (Model: ${modelName}, Query: "${originalQuery}"):`, error);
    // Return a user-facing error message, potentially masking internal details
     return `I encountered an internal error while generating your report. Please try again later. ${error instanceof Error ? `(Details: ${error.message})` : ''}`;
  }
}

/**
 * Helper function to prepare report data
 * (Pass original query for context if needed, otherwise no changes)
 */
function prepareReportData(originalQuery: string, articles: ArticleData[], polls: PollData[]) {
  // Prepare poll metadata, including the 'id' and 'title'
  const pollData = polls.map(poll => ({
    id: poll.id,
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

  // Prepare article content
  const articleContent = articles.map(article => {
    const text = article.text || "";
    const truncatedText = text.length > 4000 ? text.substring(0, 4000) + "... [truncated]" : text;
    return truncatedText ? `SOURCE: ${article.url}\n\n${truncatedText}\n\n---\n\n` : '';
  }).filter(content => content).join("");

  // Note: originalQuery is available here if needed for context formatting
  return { pollData, articleContent };
}