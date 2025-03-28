import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export interface PollResult {
  id: string;
  title: string;
  url: string;
  seendate: string;
  chartdata: {
    DataAssessment: string;
    XValue: string[];
    XLabel: string;
    YValue: number[];
    YLabel: string;
    Title: string;
    Explanation: string;
    SurveySource: string;
    SurveyCustomer: string;
    SurveyYear: string;
  };
  sourcecountry: string;
  score: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // Connect to the database and execute the vector search
    const result = await pool.query('SELECT * FROM pollsearcher($1, 100)', [query]);
    
    // Process the results
    const polls = result.rows.map((row: any) => {
      // Parse the JSON string in chartdata if it's a string
      let chartdata = row.chartdata;
      if (typeof chartdata === 'string') {
        try {
          chartdata = JSON.parse(chartdata);
        } catch (e) {
          console.error(`Failed to parse chartdata for poll id ${row.id}:`, e);
          chartdata = {};
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

    return NextResponse.json({ polls });
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { error: 'Failed to execute search query' }, 
      { status: 500 }
    );
  }
} 