"use client"

import { useRef } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import type { SurveyData } from "@/lib/getData"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

interface DynamicChartProps {
  data: SurveyData
  index?: number
}

export function DynamicChart({ data, index = 0 }: DynamicChartProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })

  // Prepare data for chart
  const chartData = data.survey_XValue.map((label, i) => ({
    name: label,
    value: data.survey_YValue[i] || 0,
  }))

  // Define chart colors
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ]

  // Animation variants
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  }

  // Custom tooltip to ensure text is visible
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

  return (
    <motion.div
      ref={ref}
      custom={index}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className="glass-panel overflow-hidden"
    >
      <Card className="border-0 bg-transparent text-elegant-cream">
        <CardHeader>
          <CardTitle className="text-xl font-display">{data.survey_Title}</CardTitle>
          <CardDescription className="text-elegant-gray-light">
            {data.survey_SurveySource} • {data.survey_SurveyYear || "N/A"}
            {data.survey_SourceCountry && ` • ${data.survey_SourceCountry}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
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
              {data.survey_ChartType === "pie" ? (
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
          <p className="mt-4 text-sm text-elegant-gray-light">{data.survey_Explanation}</p>
        </CardContent>
        {data.survey_URL && (
          <CardFooter className="border-t border-white/10 pt-4">
            <Link 
              href={data.survey_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-elegant-gold hover:text-elegant-gold-light flex items-center gap-1 transition-colors"
            >
              View Source <ExternalLink size={14} />
            </Link>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}

