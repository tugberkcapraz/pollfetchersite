import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import localFont from "next/font/local"
import { NoiseOverlay } from "@/components/noise-overlay"
import { Navbar } from "@/components/navbar"

// Fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = localFont({
  src: [
    {
      path: "../public/fonts/PlayfairDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/PlayfairDisplay-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/PlayfairDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/PlayfairDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Insight Analytics | Visualize Survey Data With Elegance",
  description: "Discover, analyze, and visualize survey data with beautifully crafted interactive charts and insights.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">
        <NoiseOverlay />
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}

