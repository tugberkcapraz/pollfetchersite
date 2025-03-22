"use client"

import { useRef, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import type { SurveyData } from "@/lib/getData"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import { ExternalLink, Code, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface DynamicChartProps {
  data: SurveyData
  index: number
}

export function DynamicChart({ data, index }: DynamicChartProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  const [embedOpen, setEmbedOpen] = useState(false)
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

  // Generate embed code
  const generateEmbedCode = () => {
    // Create a unique ID for this chart based on the title
    const chartId = data.survey_Title ? 
      encodeURIComponent(data.survey_Title.toLowerCase().replace(/\s+/g, '-')) : 
      `chart-${Math.random().toString(36).substring(2, 9)}`;
    
    // Base URL of your site
    const baseUrl = typeof window !== 'undefined' ? 
      `${window.location.protocol}//${window.location.host}` : 
      'https://pollfetcher.com';
    
    return `<iframe 
  src="${baseUrl}/embed/${chartId}?title=${encodeURIComponent(data.survey_Title || '')}" 
  width="100%" 
  height="400" 
  style="border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: transparent;" 
  title="${data.survey_Title || 'Poll Chart'}"
  loading="lazy"
  allowtransparency="true"
></iframe>`;
  };

  // Copy to clipboard function
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
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
          <CardFooter className="border-t border-white/10 pt-4 flex justify-between">
            <div className="flex items-center gap-4">
              {data.survey_URL && (
                <Link 
                  href={data.survey_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-elegant-gold hover:text-elegant-gold-light flex items-center gap-1 transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>View Source</span>
                </Link>
              )}
              <button
                onClick={() => setEmbedOpen(true)}
                className="text-sm text-elegant-gold hover:text-elegant-gold-light flex items-center gap-1 transition-colors"
              >
                <Code size={14} />
                <span>Embed</span>
              </button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      <Dialog open={embedOpen} onOpenChange={setEmbedOpen}>
        <DialogContent className="glass-panel border-elegant-gold/20 text-elegant-cream max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Embed This Chart</DialogTitle>
            <DialogDescription className="text-elegant-gray-light">
              Copy the code below to embed this chart on your website.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-elegant-blue-dark/50 p-4 rounded-md border border-white/10 mt-4">
            <pre className="text-elegant-cream text-sm overflow-x-auto whitespace-pre-wrap break-all">
              {generateEmbedCode()}
            </pre>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 bg-elegant-gold/20 hover:bg-elegant-gold/30 text-elegant-gold px-4 py-2 rounded-md transition-colors"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

