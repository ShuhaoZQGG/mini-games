'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { GameMetadata } from '../lib/types/categories'

interface GameCardProps {
  game: GameMetadata
  compact?: boolean
  featured?: boolean
  isLoading?: boolean
}

export function GameCard({ game, compact = false, featured = false, isLoading = false }: GameCardProps) {
  // Show skeleton loader
  if (isLoading) {
    return (
      <div data-testid="game-card-skeleton" className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 animate-pulse" />
    )
  }

  // Difficulty color mapping
  const difficultyColors = {
    easy: 'bg-green-500',
    medium: 'bg-yellow-500',
    hard: 'bg-red-500'
  }

  const difficultyText = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard'
  }

  // Player count display
  const playerCountDisplay = {
    '1': '1 Player',
    '2': '2 Players',
    '2+': '2+ Players'
  }

  // Compact mode for grid displays
  if (compact) {
    return (
      <Link href={game.path}>
        <div className={`
          game-card cursor-pointer hover:scale-105 transition-transform
          ${featured ? 'ring-2 ring-primary' : ''}
        `}>
          <div className="relative h-32 mb-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
            {game.thumbnail && (
              <Image
                src={game.thumbnail}
                alt={game.name}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback for missing images
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
          </div>
          <h4 className="font-semibold text-sm">{game.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{game.avgPlayTime}m</span>
            <span className={`text-xs px-1 py-0.5 rounded text-white ${difficultyColors[game.difficulty]}`}>
              {difficultyText[game.difficulty]}
            </span>
          </div>
        </div>
      </Link>
    )
  }

  // Full card display
  return (
    <Link href={game.path}>
      <div className={`
        game-card cursor-pointer hover:scale-105 transition-transform
        ${featured ? 'ring-2 ring-primary' : ''}
      `}>
        {/* Thumbnail */}
        <div className="relative h-48 mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {game.thumbnail && (
            <Image
              src={game.thumbnail}
              alt={game.name}
              fill
              className="object-cover"
              onError={(e) => {
                // Fallback for missing images
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          {featured && (
            <span className="absolute top-2 right-2 px-2 py-1 bg-primary text-white text-xs rounded">
              Featured
            </span>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="text-xl font-semibold">{game.name}</h4>
            {game.rating && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm">{game.rating}</span>
              </div>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {game.description}
          </p>

          {/* Game info badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`
              inline-block px-2 py-1 text-xs rounded text-white
              ${difficultyColors[game.difficulty]}
            `}>
              {difficultyText[game.difficulty]}
            </span>
            <span className="inline-block px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">
              ⏱️ {game.avgPlayTime} min
            </span>
            <span className="inline-block px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">
              👤 {playerCountDisplay[game.playerCount]}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {game.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-gray-500 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Play button */}
          <button 
            className="mt-4 btn-primary w-full"
            aria-label={`Play ${game.name}`}
          >
            Play Now
          </button>
        </div>
      </div>
    </Link>
  )
}