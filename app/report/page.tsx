"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react"; // Example loading spinner

// Model types that can be selected
type Model = 'azure' | 'gemini';

export default function ReportPage() {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model>('azure');
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
    <div className="flex flex-col h-screen bg-gray-50 p-4 md:p-8">
      {/* Header Area */}
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Generate Poll Report</h1>
        <p className="text-gray-600 mt-1">Enter your query below to generate a report based on relevant polls and articles.</p>
      </header>

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
                  onValueChange={(value: Model) => setSelectedModel(value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="model-select" className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="azure">Azure</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
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
          // Render the HTML report using dangerouslySetInnerHTML
          // Ensure your LLM prompt sanitizes output or trust the source.
          <div
             className="prose prose-lg max-w-none" // Using Tailwind Typography for basic styling
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
  );
} 