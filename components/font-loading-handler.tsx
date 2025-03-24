"use client"

import { useEffect } from "react"

export function FontLoadingHandler() {
  useEffect(() => {
    // Only run this in the browser, after hydration
    document.documentElement.classList.add('fonts-loading')
    
    if (document.fonts) {
      document.fonts.ready.then(() => {
        document.documentElement.classList.remove('fonts-loading')
        document.documentElement.classList.add('fonts-loaded')
      })
    } else {
      document.documentElement.classList.remove('fonts-loading')
      document.documentElement.classList.add('fonts-loaded')
    }
  }, [])
  
  return null // This component doesn't render anything
} 