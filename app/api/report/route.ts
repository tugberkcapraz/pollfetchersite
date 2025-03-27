import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  console.log('Environment variables available:', Object.keys(process.env));
  console.log('AZURE_INFERENCE_SDK_ENDPOINT exists:', !!process.env.AZURE_INFERENCE_SDK_ENDPOINT);
  console.log('AZURE_INFERENCE_SDK_KEY exists:', !!process.env.AZURE_INFERENCE_SDK_KEY);

  // Check environment variables
  const endpoint = process.env.AZURE_INFERENCE_SDK_ENDPOINT;
  const key = process.env.AZURE_INFERENCE_SDK_KEY;

  if (!endpoint || !key) {
    console.error('Azure AI Inference environment variables (ENDPOINT or KEY) are not set.');
    return NextResponse.json(
      { error: 'Server configuration error: Missing Azure AI credentials.' },
      { status: 500 }
    );
  }

  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    // Step 2: Feed the question to the search API
    // Assuming search returns top 10 relevant polls by default or we adjust it later
    const searchResponse = await fetch(`${request.nextUrl.origin}/api/search?q=${encodeURIComponent(query)}`);
    
    if (!searchResponse.ok) {
      throw new Error('Failed to perform search');
    }
    
    const searchResults = await searchResponse.json();
    // Get the top polls directly from search results
    const polls = searchResults.polls || []; 
    
    if (polls.length === 0) {
      return NextResponse.json({ 
        report: "I couldn't find any relevant survey data for your question. Please try a different query." 
      });
    }
    
    // Step 3: Extract URLs from the top search results
    const relevantUrls = polls
      .map((poll: { url: string }) => poll.url)
      // Fix linter error: Use a more robust type guard and add explicit type for url
      .filter((url: string | null | undefined): url is string => typeof url === 'string' && url !== "#"); // Ensure URLs are valid strings

    if (relevantUrls.length === 0) {
      // This case might happen if search results have no valid URLs
      return NextResponse.json({ 
        report: "I found some survey data, but couldn't retrieve associated articles. Generating a report based on available metadata."
        // Optionally, call generateFullReport with empty articles array
        // const report = await generateFullReport(query, [], polls); 
        // return NextResponse.json({ report });
      });
    }
    
    // Step 4: Retrieve the article text for the selected URLs
    const articles = await retrieveArticleText(relevantUrls);
    
    // Step 5: Generate a comprehensive report using the article content and poll metadata
    // Pass the original 'polls' array for metadata context
    // Pass the initialized Azure client to the function
    const report = await generateFullReport(query, articles, polls, { endpoint, key });
    
    // Step 6: Return the report
    return NextResponse.json({ report });
    
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' }, 
      { status: 500 }
    );
  }
}

// Function to retrieve article text for the selected URLs
async function retrieveArticleText(urls: string[]) {
  try {
    if (urls.length === 0) return [];
    
    // Create placeholders for the SQL query
    const placeholders = urls.map((_, i) => `$${i + 1}`).join(', ');
    
    // Query the database for the article text
    // Ensure "ArticleText" is the correct, case-sensitive column name in your 'surveyembeddings' table
    const result = await pool.query(
      `SELECT "Url", "ArticleText" FROM polls WHERE "Url" IN (${placeholders})`,
      urls
    );
    
    return result.rows.map(row => ({
      url: row.Url,
      text: row.ArticleText || "" // Use empty string if ArticleText is null
    }));
  } catch (error) {
    console.error('Error retrieving article text:', error);
    // If the error "column "ArticleText" does not exist" persists, 
    // double-check the exact column name in your 'surveyembeddings' table.
    return []; // Return empty array on error
  }
}

// Function to generate a comprehensive report using the article content
async function generateFullReport(
  query: string, 
  articles: { url: string; text: string }[], 
  polls: any[], 
  credentials: { endpoint: string, key: string }
) {
  try {
    // Prepare poll metadata for context (using the original polls array)
    const pollData = polls.map(poll => ({
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
    
    // Prepare the article content (limit length to avoid context limits)
    const articleContent = articles.map(article => {
      const text = article.text || ""; 
      const truncatedText = text.length > 4000 
        ? text.substring(0, 4000) + "... [truncated]" 
        : text;
      
      return truncatedText ? `SOURCE: ${article.url}\n\n${truncatedText}\n\n---\n\n` : '';
    }).filter(content => content).join("");
    
    // Define prompts for Azure Chat Completions API
    const systemPrompt = "You are an intelligent assistant specialized in analyzing survey data and related articles to generate comprehensive reports. Follow the user's instructions precisely regarding source prioritization, formatting, and citation.";
    const userPrompt = `
User question: "${query}"

I need you to generate a report that answers this question primarily based on the ARTICLE TEXT below.
The poll metadata is secondary and should only be used to supplement your analysis.

${articleContent ? `PRIMARY SOURCE - FULL ARTICLE TEXTS:\n${articleContent}` : 'WARNING: No article text could be retrieved. Using only metadata.'}

SECONDARY SOURCE - POLL METADATA (ONLY USE IF NEEDED):
${JSON.stringify(pollData, null, 2)}

Your report MUST:
1. PRIMARILY use information from the ARTICLE TEXTS
2. Only reference the poll metadata when helpful. But when you are using the poll make sure that explain it well and in detail.
3. Format your response in markdown with clear headers and sections
4. Use numbered citation format - when referencing content from articles, add a numbered citation like [1], [2], etc.
5. Include a "References" section at the end of the report with a numbered list of all sources used
6. Be comprehensive but focused on answering the specific question
7. Clearly state if the provided information is insufficient to fully answer the question

Example format for citations:
"According to a recent survey, 64% of Americans support this policy [1]."

Then at the end have:
"## References
1. [Source Title or URL](actual URL)
2. [Another Source](actual URL)"

Read the articles carefully and prioritize this content over the metadata. Do not generate information not contained in the sources.
`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // Instead of fetch, run a curl command (via child_process.exec) to call the Azure AI endpoint.
    // Ensure the endpoint includes the "/chat/completions" path.
    const fixedEndpoint = credentials.endpoint.endsWith('/chat/completions')
      ? credentials.endpoint
      : `${credentials.endpoint}/chat/completions`;
    const url = `${fixedEndpoint}?api-version=2024-05-01-preview`;
    console.log(`Attempting to call Azure AI at: ${url}`);

    // Prepare the body payload for curl
    const requestBody = JSON.stringify({
      messages: messages,
      max_tokens: 4000,
      model: "DeepSeek-V3"
    });

    // Escape any single quotes in the body to safely embed in the shell command
    const escapedRequestBody = requestBody.replace(/'/g, "'\\''");

    // Build the curl command
    const curlCommand = `curl -X POST "${url}" -H "Content-Type: application/json" -H "api-key: ${credentials.key}" -d '${escapedRequestBody}'`;
    console.log(`Executing command: ${curlCommand}`);

    // Execute the curl command
    const { stdout, stderr } = await execAsync(curlCommand);
    if (stderr) {
      console.error('Curl error:', stderr);
    }

    // Attempt to parse the JSON response from stdout
    const responseData = JSON.parse(stdout);
    
    if (responseData && responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message) {
      return responseData.choices[0].message.content || "No content received from AI.";
    } else {
      console.error("Unexpected Azure AI response structure:", responseData);
      throw new Error("Failed to parse response from Azure AI.");
    }

  } catch (error) {
    console.error('Error generating comprehensive report with Azure AI:', error);
    let errorMessage = "I encountered an error while analyzing the data and generating your report.";
    if (error instanceof Error) {
        // Check for specific Azure/HTTP errors
        if (error.message.includes('429') || (error as any).statusCode === 429) {
             errorMessage += " The service might be temporarily overloaded. Please try again later.";
        // Check for content filtering messages (common patterns)
        } else if (error.message.includes('content management policy') || error.message.includes('prompt filtered') || error.message.includes('responsible AI')) {
             errorMessage += " The content might have triggered safety filters. Please try rephrasing your question.";
        } else {
             errorMessage += ` Details: ${error.message}`;
        }
    } else {
         errorMessage += " An unknown error occurred.";
    }
    return errorMessage; // Return the error message string
  }
}