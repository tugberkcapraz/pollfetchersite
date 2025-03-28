import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import type { SurveyData } from '@/lib/getData'; // <-- Correct import path

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Fix: Proper way to await the params object in Next.js 15
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Poll ID is required' }, { status: 400 });
  }

  try {
    // Query using the exact column names from surveyembeddings table
    const result = await pool.query(
      `SELECT 
         id::text, "Title", "Url", "Seendate", "ChartData", "SourceCountry", "Language", "Domain"
       FROM surveyembeddings 
       WHERE id = $1 AND embedding IS NOT NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const row = result.rows[0];

    // Parse ChartData if it's a string
    let chartdata = row.ChartData;
    if (typeof chartdata === 'string') {
      try {
        chartdata = JSON.parse(chartdata);
      } catch (e) {
        console.error(`Failed to parse ChartData for poll id ${id}:`, e);
        chartdata = {}; // Fallback
      }
    } else if (chartdata === null || typeof chartdata !== 'object') {
        chartdata = {}; // Ensure chartdata is an object
    }

    // Create properly formatted survey data
    const pollData: SurveyData = {
      survey_Id: row.id,
      survey_Title: chartdata.Title ?? row.Title ?? "Untitled Poll",
      survey_XValue: chartdata.XValue ?? [],
      survey_YValue: chartdata.YValue ?? [],
      survey_XLabel: chartdata.XLabel ?? "",
      survey_YLabel: chartdata.YLabel ?? "",
      survey_Explanation: chartdata.Explanation ?? "",
      survey_SurveySource: chartdata.SurveySource ?? "Unknown Source",
      survey_SurveyYear: chartdata.SurveyYear ?? "",
      survey_ChartType: 'bar',
      survey_URL: row.Url ?? "#",
      survey_SourceCountry: row.SourceCountry ?? "",
      survey_SeenDate: row.Seendate ? new Date(row.Seendate).toISOString() : new Date().toISOString()
    };

    return NextResponse.json(pollData);
  } catch (error) {
    console.error(`Database query error for poll id ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch poll data' },
      { status: 500 }
    );
  }
} 