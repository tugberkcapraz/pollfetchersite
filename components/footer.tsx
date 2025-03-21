"use client"

import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "/features" },
        { name: "Pricing", href: "/pricing" },
        { name: "API", href: "/api" },
        { name: "Integrations", href: "/integrations" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", href: "/docs" },
        { name: "Guides", href: "/guides" },
        { name: "Blog", href: "/blog" },
        { name: "Support", href: "/support" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Contact", href: "/contact" },
        { name: "Privacy", href: "/privacy" },
      ],
    },
  ]

  const socialLinks = [
    {
      name: "Twitter",
      href: "#",
      icon: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z",
    },
    {
      name: "GitHub",
      href: "#",
      icon: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22",
    },
    {
      name: "LinkedIn",
      href: "#",
      icon: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M2 4a2 2 0 114 0 2 2 0 01-4 0z",
    },
  ]

  return (
    <footer className="bg-elegant-blue-dark border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <div className="flex items-center space-x-2">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 bg-elegant-gold rounded-full opacity-20"></div>
                  <div className="absolute inset-1 bg-gradient-to-br from-elegant-gold to-elegant-gold-light rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-elegant-blue-dark font-bold text-sm">I</span>
                  </div>
                </div>
                <span className="text-xl font-display font-bold">
                  <span className="text-elegant-cream">Insight</span>
                  <span className="text-elegant-gold">Analytics</span>
                </span>
              </div>
            </Link>

            <p className="text-elegant-gray-light mb-6 max-w-md">
              Insight Analytics helps you discover, analyze, and visualize survey data with beautifully crafted
              interactive charts and deep insights.
            </p>

            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-elegant-gray-light hover:text-elegant-gold transition-colors"
                  aria-label={social.name}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-lg font-display font-semibold mb-4">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-elegant-gray-light hover:text-elegant-gold transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center">
          <p className="text-elegant-gray-light/60 text-sm mb-4 md:mb-0">
            &copy; {currentYear} Insight Analytics. All rights reserved.
          </p>

          <div className="flex space-x-6">
            <Link
              href="/terms"
              className="text-elegant-gray-light/60 hover:text-elegant-gold text-sm transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-elegant-gray-light/60 hover:text-elegant-gold text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookies"
              className="text-elegant-gray-light/60 hover:text-elegant-gold text-sm transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

