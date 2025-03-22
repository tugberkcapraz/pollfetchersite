"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { useSurveyData } from "@/lib/getData"

export default function EmbedPage({ params }: { params: { chartId: string } }) {
  const searchParams = useSearchParams()
  const title = searchParams.get("title") || ""
  const [chartData, setChartData] = useState<any[]>([])
  
  // This is a simplified version - in a real implementation, 
  // you would fetch the specific chart data using the chartId
  const { data, loading } = useSurveyData(title)
  
  useEffect(() => {
    if (data && data.length > 0) {
      // Use the first matching chart
      const chartItem = data[0];
      if (chartItem) {
        setChartData(
          chartItem.survey_XValue.map((label: string, i: number) => ({
            name: label,
            value: chartItem.survey_YValue[i] || 0,
          }))
        );
      }
    }
  }, [data]);

  // Define chart colors
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ]

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-elegant-blue-dark p-3 border border-elegant-gold rounded-md shadow-lg">
          <p className="text-elegant-cream font-medium mb-1">{label}</p>
          <p className="text-elegant-cream">
            Value: <span className="text-elegant-gold font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="relative">
          <div className="w-8 h-8 rounded-full border-2 border-t-elegant-gold border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px] text-elegant-cream">
        Chart data not found
      </div>
    );
  }

  const isPieChart = data[0].survey_ChartType === "pie" || chartData.length <= 5;

  return (
    <div className="w-full h-full p-4">
      <h2 className="text-lg font-medium text-elegant-cream mb-4">{data[0].survey_Title}</h2>
      
      <div className="h-[300px]">
        <ChartContainer
          config={{
            item1: { label: "Value", color: "hsl(var(--chart-1))" },
            item2: { label: "Value", color: "hsl(var(--chart-2))" },
            item3: { label: "Value", color: "hsl(var(--chart-3))" },
            item4: { label: "Value", color: "hsl(var(--chart-4))" },
            item5: { label: "Value", color: "hsl(var(--chart-5))" },
          }}
          className="aspect-auto h-full [&_.recharts-cartesian-axis-tick_text]:fill-[#F8F5E6] [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-transparent !important"
        >
          {isPieChart ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: "#F8F5E6", fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <YAxis 
                tick={{ fill: "#F8F5E6", fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                content={<CustomTooltip />}
              />
              <Bar dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ChartContainer>
      </div>
      
      <div className="mt-2 text-xs text-elegant-gray-light text-right">
        Powered by <span className="text-elegant-gold">PollFetcher</span>
      </div>
    </div>
  );
} 