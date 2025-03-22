"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface SortSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function SortSelector({ value, onChange }: SortSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const options = [
    { value: "relevance", label: "Relevance" },
    { value: "date", label: "Date (Newest First)" },
  ]

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-1 text-elegant-cream bg-elegant-blue-dark/50 px-3 py-2 rounded-md border border-white/10 hover:border-elegant-gold/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Sort by: </span>
        <span className="font-medium text-elegant-gold">
          {options.find(opt => opt.value === value)?.label}
        </span>
        <ChevronDown className="w-4 h-4 text-elegant-gold" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-48 glass-panel-dark z-10">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                className={`w-full text-left px-4 py-2 hover:bg-elegant-blue/30 transition-colors ${
                  value === option.value ? "text-elegant-gold" : "text-elegant-cream"
                }`}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 