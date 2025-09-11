'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { GameCategoryMapping, gameCategories } from '@/lib/gameCategories'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, TrendingUp, Clock, Users } from 'lucide-react'

interface GameSession {
  gameId: string
  playedAt: Date
  duration: number
  score?: number
}

interface UserPreferences {
  preferredCategories: string[]
  difficulty: string[]
  avgSessionTime: number
}

interface RecommendationEngineProps {
  userHistory?: GameSession[]
  preferences?: UserPreferences
  algorithm?: 'collaborative' | 'content' | 'hybrid'
  maxRecommendations?: number
}

interface GameRecommendation extends GameCategoryMapping {
  matchScore: number
  reasons: string[]
}

export function CategoryRecommendationEngine({
  userHistory = [],
  preferences,
  algorithm = 'hybrid',
  maxRecommendations = 8
}: RecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<GameRecommendation[]>([])
  const [trending, setTrending] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Calculate game recommendations based on user history and preferences
  const calculateRecommendations = useMemo(() => {
    const recs: GameRecommendation[] = []
    
    // Get frequently played categories from history
    const categoryFrequency = new Map<string, number>()
    const playedGames = new Set<string>()
    
    userHistory.forEach(session => {
      playedGames.add(session.gameId)
      const game = gameCategories.find(g => g.id === session.gameId)
      if (game) {
        categoryFrequency.set(
          game.category,
          (categoryFrequency.get(game.category) || 0) + 1
        )
      }
    })

    // Score each game
    gameCategories.forEach(game => {
      // Skip already played games
      if (playedGames.has(game.id)) return

      let matchScore = 0
      const reasons: string[] = []

      // Content-based filtering
      if (algorithm === 'content' || algorithm === 'hybrid') {
        // Category match
        const categoryScore = categoryFrequency.get(game.category) || 0
        if (categoryScore > 0) {
          matchScore += categoryScore * 20
          reasons.push(`Matches your interest in ${game.category} games`)
        }

        // Multi-category relevance
        if (game.categories) {
          game.categories.forEach(cat => {
            const catScore = categoryFrequency.get(cat.category) || 0
            if (catScore > 0) {
              matchScore += catScore * cat.relevance * 15
            }
          })
        }

        // Difficulty preference
        if (preferences?.difficulty?.includes(game.difficulty)) {
          matchScore += 15
          reasons.push(`${game.difficulty} difficulty as preferred`)
        }

        // Session time match
        if (preferences?.avgSessionTime) {
          const timeDiff = Math.abs(game.avgPlayTime - preferences.avgSessionTime)
          if (timeDiff < 5) {
            matchScore += 10
            reasons.push('Matches your typical play time')
          }
        }

        // Tag similarity
        const playedTags = new Set<string>()
        userHistory.forEach(session => {
          const g = gameCategories.find(game => game.id === session.gameId)
          g?.tags.forEach(tag => playedTags.add(tag))
        })
        
        const commonTags = game.tags.filter(tag => playedTags.has(tag))
        if (commonTags.length > 0) {
          matchScore += commonTags.length * 5
          if (commonTags.length > 2) {
            reasons.push(`Similar to games you enjoy`)
          }
        }
      }

      // Collaborative filtering (simulated with trending)
      if (algorithm === 'collaborative' || algorithm === 'hybrid') {
        if (trending.includes(game.id)) {
          matchScore += 25
          reasons.push('Trending now')
        }
      }

      // Add some randomness for discovery
      matchScore += Math.random() * 10

      if (matchScore > 0) {
        recs.push({
          ...game,
          matchScore,
          reasons
        })
      }
    })

    // Sort by match score and return top recommendations
    return recs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, maxRecommendations)
  }, [userHistory, preferences, algorithm, trending, maxRecommendations])

  // Simulate fetching trending games
  useEffect(() => {
    const trendingGames = [
      'chess', '2048', 'snake', 'tetris', 'sudoku',
      'wordle', 'online-poker', 'bridge', 'tempest'
    ]
    setTrending(trendingGames)
    setRecommendations(calculateRecommendations)
    setLoading(false)
  }, [calculateRecommendations])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(maxRecommendations)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recommended For You</h2>
        <span className="text-sm text-gray-500">
          Based on your play history and preferences
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((game) => (
          <Link key={game.id} href={game.path}>
            <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1">
                    {game.name}
                  </CardTitle>
                  <Badge className="ml-2 text-xs">
                    {Math.round(game.matchScore)}% Match
                  </Badge>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {game.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {game.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {game.description}
                </p>
                
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {game.avgPlayTime}m
                  </span>
                  {game.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {game.rating.toFixed(1)}
                    </span>
                  )}
                  {trending.includes(game.id) && (
                    <span className="flex items-center gap-1 text-orange-500">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </span>
                  )}
                </div>
                
                {game.reasons.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 italic line-clamp-2">
                      {game.reasons[0]}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="text-center">
        <Link href="/games/discover">
          <button className="text-sm text-blue-500 hover:text-blue-600 font-medium">
            View More Recommendations →
          </button>
        </Link>
      </div>
    </div>
  )
}