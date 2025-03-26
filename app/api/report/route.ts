import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pool } from '@/lib/db';

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function POST(request: NextRequest) {
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
      .filter((url: string | null | undefined): url is string => url && url !== "#"); // Ensure URLs are valid strings

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
    const report = await generateFullReport(query, articles, polls); 
    
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

// Remove the selectRelevantUrls function entirely
/* 
// Function to select relevant URLs using structured output - REMOVED
async function selectRelevantUrls(query: string, polls: any[]) {
  // ... implementation removed ...
}
*/

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
async function generateFullReport(query: string, articles: { url: string; text: string }[], polls: any[]) {
  try {
    // Prepare poll metadata for context (using the original polls array)
    const pollData = polls.map(poll => ({
      title: poll.title || poll.chartdata?.Title || "Untitled Poll",
      url: poll.url || "#", // Include URL in metadata
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
      // Limit each article's text to avoid overly long prompts
      const truncatedText = article.text.length > 4000 
        ? article.text.substring(0, 4000) + "... [truncated]" 
        : article.text;
      
      // Only include articles with actual text content
      return truncatedText ? `SOURCE: ${article.url}\n\n${truncatedText}\n\n---\n\n` : '';
    }).filter(content => content).join(""); // Filter out empty strings and join
    
    // Create a prompt for the comprehensive report
    const prompt = `
      User question: "${query}"
      
      POLL METADATA (Top ${pollData.length} results):
      ${JSON.stringify(pollData, null, 2)}
      
      ${articleContent ? `ARTICLE CONTENT:\n${articleContent}` : 'No relevant article text found.'}
      
      Based on the poll metadata ${articleContent ? 'and article content' : ''} provided, generate a comprehensive report that answers the user's question.
      
      Your report should:
      1. Start with an executive summary of the key findings related to the question.
      2. Include relevant statistics and insights from the poll metadata.
      ${articleContent ? '3. Incorporate information from the article content where relevant, citing the source URL.' : ''}
      4. Use markdown formatting for better readability (headers, bullet points, etc.).
      5. End with a conclusion that directly addresses the original question.
      
      Make your report informative, data-driven, and focused on answering the specific question using the provided context. If the context is insufficient, state that clearly.
    `;
    
    // Generate the report
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3, // Slightly increased for potentially better synthesis
        maxOutputTokens: 4096
      }
    });
    
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    let errorMessage = "I encountered an error while analyzing the data and generating your report.";
    if (error instanceof Error && error.message.includes('429')) {
        errorMessage += " The service might be temporarily overloaded. Please try again later.";
    } else if (error instanceof Error && error.message.includes('prompt was blocked')) {
        errorMessage += " The content might have triggered safety filters. Please try rephrasing your question.";
    }
     else {
        errorMessage += " Please try again with a more specific question or check the service status.";
    }
    return errorMessage;
  }
} 