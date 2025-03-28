"use client"

import { useRef, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import type { SurveyData } from "@/lib/getData"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import Image from 'next/image'
import { ExternalLink, Download, Code, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DynamicChartProps {
  data: SurveyData
  index?: number
}

// Function to get base URL (client-side safe)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for server-side (won't be perfect, use environment variables if needed)
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

export function DynamicChart({ data, index = 0 }: DynamicChartProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const [showEmbed, setShowEmbed] = useState(false)
  const [copied, setCopied] = useState(false)

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

  // Generate iframe code
  const embedCode = `<iframe src="${getBaseUrl()}/embed/${data.survey_Id}" width="600" height="400" frameborder="0" scrolling="no" style="border: 1px solid #e2e8f0; border-radius: 8px;" title="${data.survey_Title || 'Chart'}"></iframe>`;

  // Function to handle copying embed code
  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy embed code:', err);
      // Maybe show an error message to the user
    });
  };

  if (!data.survey_Id) {
    console.warn("DynamicChart missing survey_Id, embed feature disabled.", data);
    // Optionally return null or a placeholder if ID is critical
  }

  return (
    <motion.div
      ref={ref}
      custom={index}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className="bg-muted border border-border rounded-lg overflow-hidden flex flex-col"
    >
      <Card className="border-0 bg-transparent text-card-foreground flex-grow flex flex-col h-full">
        <CardHeader className="items-center">
          <div className="text-center">
            <CardTitle className="text-xl font-display">{data.survey_Title}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {data.survey_SurveySource} • {data.survey_SurveyYear || "N/A"}
              {data.survey_SourceCountry && ` • ${data.survey_SourceCountry}`}
              {data.survey_SeenDate && ` • Seen: ${new Date(data.survey_SeenDate).toLocaleDateString()}`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
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
        {(data.survey_URL || data.survey_Id) && (
          <CardFooter className="border-t border-border pt-4 flex justify-between items-center">
            {/* Left Group: Icons */}
            <div className="flex items-center gap-1">
              <TooltipProvider>
                {/* View Source Icon Button (conditionally rendered) */}
                {data.survey_URL && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* Wrap button in Link for navigation */}
                      <Link href={data.survey_URL} target="_blank" rel="noopener noreferrer" aria-label="View Source">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground h-8 w-8" // Consistent size
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View Source</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Embed Icon Button (conditionally rendered) */}
                {data.survey_Id && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`text-muted-foreground hover:text-foreground ${showEmbed ? 'bg-accent' : ''} h-8 w-8`}
                        onClick={() => setShowEmbed(!showEmbed)}
                        aria-label="Embed chart"
                      >
                        <Code className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Embed Chart</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Download Icon Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground h-8 w-8"
                      onClick={handleDownload}
                      aria-label="Download chart data"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download JSON</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Right Group: Logo */}
            <Link href="/" aria-label="Homepage">
              <Image
                src="/logo.svg"
                alt="Site Logo"
                width={80}
                height={20}
                className="opacity-70 hover:opacity-100 transition-opacity" // Removed ml-2
              />
            </Link>
          </CardFooter>
        )}
      </Card>
      {showEmbed && data.survey_Id && (
        <div className="p-4 bg-background border-t border-border">
          <label htmlFor={`embed-code-${data.survey_Id}`} className="block text-sm font-medium text-muted-foreground mb-1">Embed Code</label>
          <div className="relative">
            <textarea
              id={`embed-code-${data.survey_Id}`}
              readOnly
              className="w-full p-2 border border-input rounded bg-background text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              rows={4}
              value={embedCode}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-1 right-1 h-7 w-7 text-muted-foreground hover:bg-muted"
              onClick={handleCopyEmbed}
              aria-label="Copy embed code"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Copy and paste this code into your website.</p>
        </div>
      )}
    </motion.div>
  )
}

