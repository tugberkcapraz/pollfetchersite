"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react"; // Example loading spinner
import Head from 'next/head'; // Import Head for adding styles
import { PageContainer } from "@/components/page-container";

// Define the specific Gemini models available
type Model = 'gemini-2.0-flash' | 'gemini-2.0-flash-lite';

export default function ReportPage() {
  const [input, setInput] = useState('');
  // Default to gemini-1.5-flash
  const [selectedModel, setSelectedModel] = useState<Model>('gemini-2.0-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportHtml, setReportHtml] = useState<string | null>(null); // State to hold the HTML report

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const userQuery = input.trim();
    if (!userQuery) return;

    setIsLoading(true);
    setError(null);
    setReportHtml(null); // Clear previous report

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userQuery,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate report. Please check server logs.' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Ensure the report content is a string
      if (typeof data.report === 'string') {
        setReportHtml(data.report);
      } else {
         throw new Error("Received invalid report format from server.");
      }
      setInput(''); // Clear input after successful generation

    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message || 'An unknown error occurred while generating your report.');
      setReportHtml(null); // Ensure no stale report is shown on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-8">
         {/* We add a Head component to inject styles more robustly */}
         <Head>
           <style>{`
             /* Specific styles for the rendered report content */
             .report-output-content {
               /* Add text-align center to the container */
               text-align: center; 
             }

             /* Reset text-align for direct children that shouldn't be centered */
             .report-output-content h1,
             .report-output-content h2,
             .report-output-content h3,
             .report-output-content p,
             .report-output-content ul,
             .report-output-content ol {
               text-align: left; /* Align text left for readability */
             }
             
             /* Keep heading centering */
             .report-output-content h1,
             .report-output-content h2,
             .report-output-content h3 {
               text-align: center; /* Center headings specifically */
               margin-top: 1.5em; 
               margin-bottom: 0.75em;
             }

             .report-output-content p {
               margin-bottom: 1em; 
               line-height: 1.6; 
             }

             .report-output-content ul,
             .report-output-content ol {
               margin-left: 1.5em; /* Keep indentation */
               margin-bottom: 1em;
               display: inline-block; /* Allow text-align:left to work correctly on lists */
               text-align: left; /* Ensure list text is left-aligned */
               width: 90%; /* Adjust width as needed, ensures block context */
             }
             
             .report-output-content li {
               margin-bottom: 0.5em; 
             }

             .report-output-content iframe {
               display: block; /* Still best practice */
               margin-left: auto; /* Should work with text-align: center on parent */
               margin-right: auto; /* Should work with text-align: center on parent */
               margin-top: 1.5em; 
               margin-bottom: 1.5em; 
               max-width: 100%; 
             }
             
             .report-output-content a {
              color: #2563eb; 
              text-decoration: underline;
             }
             
             .report-output-content a:hover {
              color: #1d4ed8;
             }
           `}</style>
         </Head>

        {/* Input Form Area */}
        <form onSubmit={handleSendMessage} className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row gap-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about poll data (e.g., 'What is the latest opinion on climate change in Europe?')"
              className="flex-grow resize-none text-base"
              rows={3}
              disabled={isLoading}
            />
            <div className="flex flex-col sm:flex-row sm:items-end gap-2">
               <div className="w-full sm:w-auto">
                  <label htmlFor="model-select" className="text-sm font-medium text-gray-700 mb-1 block">AI Model</label>
                  <Select
                    value={selectedModel}
                    // Ensure the value passed is one of the allowed Model types
                    onValueChange={(value: string) => setSelectedModel(value as Model)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="model-select" className="w-full sm:w-[180px]"> {/* Adjusted width for longer names */}
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Update SelectItems to use specific Gemini model names */}
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                      <SelectItem value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
              <Button type="submit" disabled={isLoading || !input.trim()} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </form>

        {/* Report Output Area */}
        <div className="flex-grow bg-white p-4 md:p-6 rounded-lg shadow overflow-auto">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="ml-3 text-gray-600">Generating your report...</p>
            </div>
          )}
          {error && (
            <div className="text-center text-red-600 bg-red-50 p-4 rounded border border-red-200">
              <h3 className="font-semibold mb-2">Error Generating Report</h3>
              <p>{error}</p>
            </div>
          )}
          {!isLoading && !error && reportHtml && (
            <div
               className="report-output-content prose prose-lg max-w-none" // Class name is already here
               dangerouslySetInnerHTML={{ __html: reportHtml }}
             />
          )}
          {!isLoading && !error && !reportHtml && (
            <div className="text-center text-gray-500 pt-10">
              <p>Your generated report will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
} 