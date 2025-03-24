import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import { NoiseOverlay } from "@/components/noise-overlay"
import { Navbar } from "@/components/navbar"
import { FontLoadingHandler } from "@/components/font-loading-handler"

// Fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "PollFetcher | Visualize Survey Data With Elegance",
  description: "Discover, analyze, and visualize survey data with beautifully crafted interactive charts and insights.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} font-sans`}>
      <body className="antialiased">
        <FontLoadingHandler />
        <NoiseOverlay />
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}

