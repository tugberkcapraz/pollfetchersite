"use client"

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import type { SurveyData } from "@/lib/getData"

interface DynamicChartProps {
  data: SurveyData
}

export function DynamicChart({ data }: DynamicChartProps) {
  if (
    !data ||
    !data.survey_XValue ||
    !data.survey_YValue ||
    data.survey_XValue.length === 0 ||
    data.survey_YValue.length === 0
  ) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There is no data to display for this chart.</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.survey_XValue.map((x, index) => ({
    name: x,
    value: data.survey_YValue[index] || 0,
  }))

  // Create a config object for ChartContainer
  const chartConfig = chartData.reduce(
    (acc, item, index) => {
      acc[`value${index}`] = {
        label: item.name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      }
      return acc
    },
    {} as Record<string, { label: string; color: string }>,
  )

  // Add a default value entry if the config is empty
  if (Object.keys(chartConfig).length === 0) {
    chartConfig.value = {
      label: "Value",
      color: "hsl(var(--chart-1))",
    }
  }

  const renderChart = () => {
    if (data.survey_XValue.length <= 5) {
      return (
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltipContent />} />
        </PieChart>
      )
    } else {
      return (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
            ))}
          </Bar>
        </BarChart>
      )
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{data.survey_Title || "Untitled Survey"}</CardTitle>
        <CardDescription>
          {data.survey_XLabel || "X Axis"} vs {data.survey_YLabel || "Y Axis"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          {renderChart()}
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start text-sm">
        <p className="font-medium">{data.survey_Explanation || "No explanation provided."}</p>
        <p className="text-muted-foreground mt-2">
          Source: {data.survey_SurveySource || "Unknown"} ({data.survey_SurveyYear || "Year not specified"})
        </p>
      </CardFooter>
    </Card>
  )
}

