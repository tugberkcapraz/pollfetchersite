"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r from-elegant-gold-dark via-elegant-gold to-elegant-gold-light rounded-lg blur ${
          isFocused ? "opacity-70" : "opacity-30"
        } transition-opacity duration-300`}
      ></div>
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Search for polls and surveys..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="elegant-input h-14 pl-5 pr-32 rounded-lg text-lg w-full"
        />
        <button
          type="submit"
          className="absolute right-2 h-10 px-6 bg-gradient-to-r from-elegant-gold-dark to-elegant-gold rounded-md font-medium text-elegant-blue-dark transition-transform duration-300 hover:scale-105"
        >
          <Search className="w-5 h-5 mr-2 inline-block" />
          <span>Search</span>
        </button>
      </div>
    </form>
  )
}

