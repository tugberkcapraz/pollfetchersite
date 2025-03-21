"use client"

import { useRef } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import type { SurveyData } from "@/lib/getData"
import { motion, useInView } from "framer-motion"

interface DynamicChartProps {
  data: SurveyData
  index: number
}

export function DynamicChart({ data, index }: DynamicChartProps) {
  const chartRef = useRef(null)
  const isInView = useInView(chartRef, { once: true, amount: 0.2 })

  if (
    !data ||
    !data.survey_XValue ||
    !data.survey_YValue ||
    data.survey_XValue.length === 0 ||
    data.survey_YValue.length === 0
  ) {
    return (
      <div className="elegant-card p-6">
        <h3 className="text-xl font-display font-semibold mb-3">No Data Available</h3>
        <p className="text-elegant-gray-light">There is no data to display for this chart.</p>
      </div>
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
        <PieChart
          width={300}
          height={300}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          className="glow-effect mx-auto"
        >
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
            labelLine={true}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltipContent />} />
        </PieChart>
      )
    } else {
      return (
        <BarChart data={chartData} className="glow-effect" margin={{ top: 20, right: 30, bottom: 50, left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" tick={{ fill: "#F8F5E6" }} height={60} tickMargin={10} angle={-45} textAnchor="end" />
          <YAxis tick={{ fill: "#F8F5E6" }} width={60} />
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
    <motion.div
      ref={chartRef}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="h-full"
    >
      <div className="elegant-card h-full flex flex-col">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-display font-semibold mb-1">{data.survey_Title || "Untitled Survey"}</h3>
          <p className="text-sm text-elegant-gray-light">
            {data.survey_XLabel || "X Axis"} vs {data.survey_YLabel || "Y Axis"}
          </p>
        </div>
        <div className="p-6 flex-grow">
          <ChartContainer config={chartConfig} className="h-[300px] w-full flex items-center justify-center">
            {renderChart()}
          </ChartContainer>
        </div>
        <div className="p-6 border-t border-white/5 bg-elegant-blue-dark/30">
          <p className="text-sm mb-2">{data.survey_Explanation || "No explanation provided."}</p>
          <div className="flex justify-between items-center text-xs text-elegant-gray-light/70">
            <span>Source: {data.survey_SurveySource || "Unknown"}</span>
            <span>Year: {data.survey_SurveyYear || "N/A"}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

