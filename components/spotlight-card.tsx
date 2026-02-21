"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Card } from "@/components/ui/card"

interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
}

export function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setMousePosition({ x, y })
    cardRef.current.style.setProperty("--mouse-x", `${x}px`)
    cardRef.current.style.setProperty("--mouse-y", `${y}px`)
  }

  return (
    <Card
      ref={cardRef}
      className={`spotlight-card hover:shadow-lg transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 ${className}`}
      onMouseMove={handleMouseMove}
    >
      {children}
    </Card>
  )
}
