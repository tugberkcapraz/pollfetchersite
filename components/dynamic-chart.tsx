"use client"

import { useRef } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import type { SurveyData } from "@/lib/getData"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import { ExternalLink, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.215, 0.61, 0.355, 1],
        delay: index * 0.1,
      },
    },
  }

  // Custom tooltip to ensure text is visible - Updated for light theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        // Use card background (white), border, and foreground text (dark gray)
        <div className="bg-card p-3 border border-border rounded-md shadow-lg">
          <p className="text-card-foreground font-medium mb-1">{label}</p>
          <p className="text-muted-foreground"> {/* Use muted foreground for "Value:" text */}
            Value:{" "}
            {/* Use primary (pink) or secondary (blue) for the actual value */}
            <span className="text-primary font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Function to handle downloading chart data as JSON
  const handleDownload = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2) // Pretty print JSON
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    // Generate a filename based on the chart title, provide a fallback
    const safeTitle = data.survey_Title ?? 'chart'; // Use 'chart' if title is undefined
    const fileName = `${safeTitle.toLowerCase().replace(/\s+/g, '-')}-data.json`;
    link.download = fileName;
    link.click();
  };

  return (
    <motion.div
      ref={ref}
      custom={index}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className="bg-muted border border-border rounded-lg overflow-hidden"
    >
      <Card className="border-0 bg-transparent text-card-foreground">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl font-display">{data.survey_Title}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {data.survey_SurveySource} • {data.survey_SurveyYear || "N/A"}
              {data.survey_SourceCountry && ` • ${data.survey_SourceCountry}`}
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleDownload}
                  aria-label="Download chart data"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download chart data (JSON)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
              className="aspect-auto h-full [&_.recharts-cartesian-axis-tick_text]:fill-[hsl(var(--foreground))] [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-transparent !important"
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
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              ) : (
                <BarChart data={chartData}>
                  {/* Use foreground color with low opacity for grid lines */}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsla(var(--foreground) / 0.2)" />
                  <XAxis
                    dataKey="name"
                    tickLine={true} // Ensure tick lines are visible
                    axisLine={true} // Ensure axis line is visible
                    stroke="hsl(var(--foreground))" // Explicitly set axis/tick color
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={true} // Ensure tick lines are visible
                    axisLine={true} // Ensure axis line is visible
                    stroke="hsl(var(--foreground))" // Explicitly set axis/tick color
                    tickMargin={8}
                  />
                  <RechartsTooltip
                    cursor={false} // Keep cursor invisible for bar chart
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
          <p className="mt-4 text-sm text-muted-foreground">{data.survey_Explanation}</p>
        </CardContent>
        {data.survey_URL && (
          // Update CardFooter link colors
          <CardFooter className="border-t border-border pt-4">
            <Link
              href={data.survey_URL}
              target="_blank"
              rel="noopener noreferrer"
              // Use secondary (blue) for link, hover slightly darker/lighter
              className="text-sm text-secondary hover:text-secondary/80 flex items-center gap-1 transition-colors"
            >
              View Source <ExternalLink size={14} />
            </Link>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}

