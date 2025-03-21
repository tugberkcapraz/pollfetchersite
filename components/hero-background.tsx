"use client"

import { useRef, useEffect } from "react"

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Create stars
    const stars: {
      x: number
      y: number
      radius: number
      color: string
      velocity: number
    }[] = []

    const colors = ["#D4AF37", "#F0D78C", "#9D7E2A", "#E5C76B"]

    for (let i = 0; i < 100; i++) {
      const radius = Math.random() * 1.2 + 0.3
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: Math.random() * 0.03 + 0.01,
      })
    }

    // Animation
    let animationFrameId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw stars
      stars.forEach((star) => {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = star.color
        ctx.fill()

        // Move stars
        star.y += star.velocity

        // Reset position if star goes off screen
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <>
      <div className="absolute inset-0 radial-gradient"></div>
      <div className="absolute inset-0 grid-bg opacity-30"></div>
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />
    </>
  )
}

