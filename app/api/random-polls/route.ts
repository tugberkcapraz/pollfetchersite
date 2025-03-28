import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get yesterday's date in YYYY-MM-DD format
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formattedDate = yesterday.toISOString().split('T')[0];
    
    // Query the database for random charts from yesterday
    const result = await pool.query('SELECT * FROM get_random_charts($1)', [formattedDate]);
    
    // Process the results - data comes in a single chart_data_result column
    const polls = result.rows.map((row: any) => {
      // Extract the chart_data_result
      let chartdata = row.chart_data_result;
      
      // Parse if it's a string
      if (typeof chartdata === 'string') {
        try {
          chartdata = JSON.parse(chartdata);
        } catch (e) {
          chartdata = {}; // Provide a fallback if parsing fails
        }
      }
      
      // Create a standardized poll object matching format from pollsearch2
      return {
        title: chartdata.Title || "Untitled Poll",
        url: row.url || "#", // Use actual URL from database if available
        seendate: row.seendate || new Date().toISOString(),
        chartdata: {
          DataAssessment: chartdata.DataAssessment || "",
          XValue: chartdata.XValue || [],
          XLabel: chartdata.XLabel || "",
          YValue: chartdata.YValue || [],
          YLabel: chartdata.YLabel || "",
          Title: chartdata.Title || "",
          Explanation: chartdata.Explanation || "",
          SurveySource: chartdata.SurveySource || "",
          SurveyCustomer: chartdata.SurveyCustomer || "",
          SurveyYear: chartdata.SurveyYear || ""
        },
        sourcecountry: row.sourcecountry || chartdata.SurveyCustomer || "Unknown"
      };
    });

    return NextResponse.json({ polls });
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random polls' }, 
      { status: 500 }
    );
  }
} 