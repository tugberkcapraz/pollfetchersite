"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, Search, ChevronRight } from "lucide-react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMenu = () => setIsOpen(!isOpen)

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Explore", path: "/explore" },
    { name: "Features", path: "/features" },
    { name: "About", path: "/about" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "py-3 bg-elegant-blue-dark/80 backdrop-blur-lg" : "py-5 bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-elegant-gold rounded-full opacity-20"></div>
              <div className="absolute inset-1 bg-gradient-to-br from-elegant-gold to-elegant-gold-light rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-elegant-blue-dark font-bold text-sm">P</span>
              </div>
            </div>
            <span className="text-xl font-display font-bold">
              <span className="text-elegant-cream">Poll</span>
              <span className="text-elegant-gold">Fetcher</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`relative font-medium text-sm tracking-wide transition-colors ${
                  pathname === link.path
                    ? "text-elegant-gold gold-text"
                    : "text-elegant-cream hover:text-elegant-gold-light"
                }`}
              >
                {link.name}
                {pathname === link.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-elegant-gold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 rounded-full bg-elegant-blue hover:bg-elegant-blue-light transition-colors">
              <Search className="w-5 h-5 text-elegant-gold-light" />
            </button>
            <Link href="/search" className="elegant-button text-sm">
              Explore Data
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-elegant-cream"
            onClick={toggleMenu}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 top-[60px] bg-elegant-navy z-40 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex flex-col h-full p-6">
              <nav className="flex flex-col space-y-6 mt-8">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Link
                      href={link.path}
                      className={`flex items-center justify-between text-xl font-display font-medium py-2 ${
                        pathname === link.path ? "text-elegant-gold" : "text-elegant-cream"
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto">
                <Link
                  href="/search"
                  className="elegant-button w-full flex items-center justify-center text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Explore Data
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

