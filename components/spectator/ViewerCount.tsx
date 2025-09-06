/**
 * ViewerCount Component
 * Displays the current viewer count with formatting and animations
 */

import React, { useEffect, useState } from 'react'

interface ViewerCountProps {
  count: number
  peak?: number
  className?: string
}

export function ViewerCount({ count, peak, className = '' }: ViewerCountProps) {
  const [previousCount, setPreviousCount] = useState(count)
  const [isAnimating, setIsAnimating] = useState(false)

  // Format large numbers
  const formatCount = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // Animate on count change
  useEffect(() => {
    if (count !== previousCount) {
      setIsAnimating(true)
      setPreviousCount(count)
      
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [count, previousCount])

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Viewer Icon */}
      <svg
        data-testid="viewer-icon"
        className="w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>

      {/* Count Display */}
      <div className="flex items-baseline gap-1">
        <span
          data-testid="viewer-count"
          className={`text-white font-semibold transition-transform ${
            isAnimating ? 'animate-scale' : ''
          }`}
        >
          {formatCount(count)}
        </span>
        
        <span className="text-gray-400 text-sm">
          {count === 0 ? 'No viewers' : count === 1 ? 'viewer' : 'viewers'}
        </span>
      </div>

      {/* Peak Indicator */}
      {peak !== undefined && peak > count && (
        <div className="text-xs text-gray-500">
          Peak: {formatCount(peak)}
        </div>
      )}

      {/* Live Indicator Dot */}
      {count > 0 && (
        <div className="relative">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
        </div>
      )}
    </div>
  )
}