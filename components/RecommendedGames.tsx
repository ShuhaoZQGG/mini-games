'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { games } from '@/lib/games'
import { Sparkles, TrendingUp, Clock, Trophy } from 'lucide-react'

interface GameRecommendation {
  gameId: string
  score: number
  reason: string
}

export function RecommendedGames() {
  const [recommendations, setRecommendations] = useState<GameRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations?type=personalized&limit=6')
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data)
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded-lg h-32"></div>
          </div>
        ))}
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-yellow-500" />
        <h2 className="text-2xl font-bold">Recommended for You</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec) => {
          const game = games.find(g => g.id === rec.gameId)
          if (!game) return null

          return (
            <Link key={game.id} href={`/games/${game.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{game.name}</span>
                    <span className="text-3xl">{game.emoji}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {game.description}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    {rec.reason}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function TrendingGames() {
  const [trending, setTrending] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrending()
  }, [])

  const fetchTrending = async () => {
    try {
      const response = await fetch('/api/recommendations?type=trending&limit=5')
      if (response.ok) {
        const data = await response.json()
        setTrending(data)
      }
    } catch (error) {
      console.error('Failed to fetch trending games:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted rounded h-12"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Trending Now
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {trending.map((gameId, index) => {
            const game = games.find(g => g.id === gameId)
            if (!game) return null

            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="flex items-center justify-between p-2 rounded hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <span className="text-2xl">{game.emoji}</span>
                  <span className="font-medium">{game.name}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function RecentlyPlayed() {
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    // Get from user preferences
    import('@/lib/userPreferences').then(({ userPreferences }) => {
      const recentGames = userPreferences.getRecentlyPlayedGames(5)
      setRecent(recentGames)
    })
  }, [])

  if (recent.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          Continue Playing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {recent.map((gameId) => {
            const game = games.find(g => g.id === gameId)
            if (!game) return null

            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-muted transition-colors text-center"
              >
                <span className="text-3xl mb-1">{game.emoji}</span>
                <span className="text-xs font-medium">{game.name}</span>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function DailyChallenges() {
  const [challenges, setChallenges] = useState<Array<{ gameId: string; challenge: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChallenges()
  }, [])

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/recommendations?type=daily')
      if (response.ok) {
        const data = await response.json()
        setChallenges(data)
      }
    } catch (error) {
      console.error('Failed to fetch daily challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || challenges.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Daily Challenges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {challenges.map((challenge, index) => {
            const game = games.find(g => g.id === challenge.gameId)
            if (!game) return null

            return (
              <Link
                key={`${challenge.gameId}-${index}`}
                href={`/games/${game.id}`}
                className="block p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{game.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium">{game.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {challenge.challenge}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}