"use client";

import { useState, useEffect } from 'react';
import { DynamicChart } from '@/components/dynamic-chart'; // Adjust path if needed
import type { SurveyData } from '@/lib/getData'; // <-- Correct import path
import { useParams } from 'next/navigation';

export default function EmbedPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [pollData, setPollData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No poll ID provided.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/poll/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Poll not found.");
          }
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data: SurveyData = await response.json();
        setPollData(data);
      } catch (err: any) {
        console.error("Error fetching poll data for embed:", err);
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Basic styling to prevent layout shifts and provide feedback
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100vh', // Full viewport height
    padding: '1rem', // Some padding
    boxSizing: 'border-box',
  };

  const chartWrapperStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      maxWidth: '800px', // Optional: Max width for larger screens
      maxHeight: '600px', // Optional: Max height
  };

  if (loading) {
    return <div style={containerStyle}>Loading chart...</div>;
  }

  if (error) {
    return <div style={containerStyle}>Error: {error}</div>;
  }

  if (!pollData) {
    return <div style={containerStyle}>No data available for this poll.</div>;
  }

  // Render only the chart, maybe wrapped for sizing
  return (
    <div style={containerStyle}>
        <div style={chartWrapperStyle}>
             {/* Pass data; index isn't really relevant here */}
            <DynamicChart data={pollData} index={0} />
        </div>
    </div>
  );
}

// Optional: Add basic layout/styling for the embed page if needed
// You might want a minimal layout or none at all depending on requirements.
// Consider adding metadata (title) for the embed page. 