'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, TrendingUp, Clock, Star, Users } from 'lucide-react'
import { gameCategories, GameCategoryMapping } from '@/lib/gameCategories'

interface CategoryRecommendation {
  gameId: string
  score: number
  reasons: string[]
  basedOn: 'playHistory' | 'similar' | 'trending' | 'new'
  thumbnail?: string
  quickPlayEnabled: boolean
}

interface GameMetadata {
  id: string
  name: string
  category: string
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  playerCount: '1' | '2' | '2+'
  estimatedTime: number
  lastPlayed?: Date
  playCount?: number
  rating?: number
}

interface CategoryRecommendationEngineProps {
  currentGameId?: string
  category?: string
  maxRecommendations?: number
}

export function CategoryRecommendationEngine({
  currentGameId,
  category,
  maxRecommendations = 6
}: CategoryRecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<CategoryRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateRecommendations()
  }, [currentGameId, category])

  const generateRecommendations = () => {
    setLoading(true)
    
    // Get play history from localStorage
    const playHistory = JSON.parse(localStorage.getItem('gamePlayHistory') || '{}')
    const userPreferences = JSON.parse(localStorage.getItem('userPreferences') || '{}')
    
    // Get all games from categories
    const allGames: GameMetadata[] = gameCategories.map(game => ({
      id: game.id,
      name: game.name,
      category: game.category,
      tags: game.tags,
      difficulty: game.difficulty,
      playerCount: getPlayerCount(game.id),
      estimatedTime: game.avgPlayTime,
      lastPlayed: playHistory[game.id]?.lastPlayed,
      playCount: playHistory[game.id]?.count || 0,
      rating: playHistory[game.id]?.rating
    }))

    // Filter by category if specified
    let candidateGames = category 
      ? allGames.filter(g => g.category === category)
      : allGames

    // Remove current game from candidates
    if (currentGameId) {
      candidateGames = candidateGames.filter(g => g.id !== currentGameId)
    }

    // Score and rank games
    const scoredGames = candidateGames.map(game => {
      let score = 0
      const reasons: string[] = []
      let basedOn: CategoryRecommendation['basedOn'] = 'similar'

      // Similar games bonus (if current game specified)
      if (currentGameId) {
        const currentGame = allGames.find(g => g.id === currentGameId)
        if (currentGame) {
          // Same category
          if (game.category === currentGame.category) {
            score += 30
            reasons.push(`Same category: ${game.category}`)
          }
          
          // Similar difficulty
          if (game.difficulty === currentGame.difficulty) {
            score += 20
            reasons.push('Similar difficulty level')
          }
          
          // Shared tags
          const sharedTags = game.tags.filter(t => currentGame.tags.includes(t))
          if (sharedTags.length > 0) {
            score += sharedTags.length * 15
            reasons.push(`Similar gameplay: ${sharedTags.join(', ')}`)
            basedOn = 'similar'
          }
        }
      }

      // Play history scoring
      const playCount = game.playCount || 0
      if (playCount > 0) {
        score += Math.min(playCount * 5, 25)
        if (playCount > 5) {
          reasons.push('Frequently played')
          basedOn = 'playHistory'
        }
      }

      // New game bonus
      const isNew = !game.lastPlayed && playCount === 0
      if (isNew) {
        score += 35
        reasons.push('New game to try!')
        basedOn = 'new'
      }

      // Trending simulation (random for demo)
      if (Math.random() > 0.7) {
        score += 40
        reasons.push('Trending now')
        basedOn = 'trending'
      }

      // User preference matching
      if (userPreferences.preferredDifficulty === game.difficulty) {
        score += 15
      }
      if (userPreferences.preferredCategories?.includes(game.category)) {
        score += 20
      }

      return {
        gameId: game.id,
        score,
        reasons: reasons.slice(0, 2), // Limit to 2 reasons for UI
        basedOn,
        thumbnail: `/images/games/${game.id}.png`,
        quickPlayEnabled: true
      } as CategoryRecommendation
    })

    // Sort by score and take top recommendations
    const topRecommendations = scoredGames
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations)

    setRecommendations(topRecommendations)
    setLoading(false)
  }

  const getGameTags = (gameId: string): string[] => {
    const tagMap: Record<string, string[]> = {
      'chess': ['strategy', 'classic', 'board', 'two-player'],
      'sudoku': ['puzzle', 'logic', 'numbers', 'single-player'],
      'snake': ['arcade', 'classic', 'action', 'single-player'],
      'tetris': ['puzzle', 'arcade', 'classic', 'single-player'],
      'pacman': ['arcade', 'classic', 'action', 'single-player'],
      'solitaire': ['card', 'classic', 'single-player', 'relaxing'],
      // Add more as needed
    }
    return tagMap[gameId] || ['casual', 'fun']
  }

  const getGameDifficulty = (gameId: string): GameMetadata['difficulty'] => {
    const difficultyMap: Record<string, GameMetadata['difficulty']> = {
      'tic-tac-toe': 'easy',
      'snake': 'easy',
      'memory-match': 'easy',
      'sudoku': 'hard',
      'chess': 'expert',
      'minesweeper': 'medium',
      // Add more as needed
    }
    return difficultyMap[gameId] || 'medium'
  }

  const getPlayerCount = (gameId: string): GameMetadata['playerCount'] => {
    const multiplayerGames = ['chess', 'checkers', 'connect-four', 'tic-tac-toe', 'pool', 'battleship', 'air-hockey']
    return multiplayerGames.includes(gameId) ? '2' : '1'
  }

  const getEstimatedTime = (gameId: string): number => {
    const timeMap: Record<string, number> = {
      'cps-test': 1,
      'reaction-time': 1,
      'aim-trainer': 2,
      'snake': 5,
      'tetris': 10,
      'chess': 30,
      'sudoku': 20,
      // Add more as needed
    }
    return timeMap[gameId] || 5
  }

  const getBasedOnIcon = (basedOn: CategoryRecommendation['basedOn']) => {
    switch (basedOn) {
      case 'playHistory': return <Clock className="w-4 h-4" />
      case 'trending': return <TrendingUp className="w-4 h-4" />
      case 'new': return <Star className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getBasedOnLabel = (basedOn: CategoryRecommendation['basedOn']) => {
    switch (basedOn) {
      case 'playHistory': return 'Based on your history'
      case 'trending': return 'Trending now'
      case 'new': return 'New for you'
      default: return 'Similar games'
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[...Array(maxRecommendations)].map((_, i) => (
          <Card key={i} className="h-48 bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recommended for You</h2>
        <Button variant="outline" size="sm" onClick={generateRecommendations}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <Card key={rec.gameId} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  {rec.gameId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </CardTitle>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {getBasedOnIcon(rec.basedOn)}
                  <span className="text-xs">{getBasedOnLabel(rec.basedOn)}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rec.reasons.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {rec.reasons.map((reason, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span className="text-xs">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Link href={`/games/${rec.gameId}`} className="flex-1">
                    <Button className="w-full" size="sm">
                      <Play className="w-4 h-4 mr-1" />
                      Play Now
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    Info
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}