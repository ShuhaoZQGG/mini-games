'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { gameCategories } from '@/lib/gameCategories'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Users, RefreshCw } from 'lucide-react'

interface TrendingGame {
  id: string
  name: string
  path: string
  category: string
  currentPlayers: number
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  position: number
  previousPosition: number
}

export function TrendingGames() {
  const [trendingGames, setTrendingGames] = useState<TrendingGame[]>([])
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [loading, setLoading] = useState(true)

  // Simulate fetching trending data
  const fetchTrendingData = () => {
    // In production, this would be an API call to get real-time data
    const popularGameIds = [
      'chess', '2048', 'snake', 'tetris', 'sudoku',
      'wordle', 'pacman', 'online-poker', 'bridge',
      'solitaire', 'memory-match', 'typing-test'
    ]

    const trending = popularGameIds.slice(0, 10).map((gameId, index) => {
      const game = gameCategories.find(g => g.id === gameId)
      if (!game) return null

      const currentPlayers = Math.floor(Math.random() * 2000) + 100
      const previousPosition = index + Math.floor(Math.random() * 3) - 1
      const changePercent = Math.floor(Math.random() * 50) - 10
      
      return {
        id: game.id,
        name: game.name,
        path: game.path,
        category: game.category,
        currentPlayers,
        trend: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable',
        changePercent: Math.abs(changePercent),
        position: index + 1,
        previousPosition: Math.max(1, Math.min(10, previousPosition))
      } as TrendingGame
    }).filter(Boolean) as TrendingGame[]

    setTrendingGames(trending)
    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    fetchTrendingData()

    if (autoRefresh) {
      const interval = setInterval(fetchTrendingData, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getPositionChange = (game: TrendingGame) => {
    const change = game.previousPosition - game.position
    if (change > 0) {
      return (
        <span className="flex items-center text-green-500 text-xs">
          <TrendingUp className="w-3 h-3" />
          {change}
        </span>
      )
    } else if (change < 0) {
      return (
        <span className="flex items-center text-red-500 text-xs">
          <TrendingDown className="w-3 h-3" />
          {Math.abs(change)}
        </span>
      )
    }
    return (
      <span className="flex items-center text-gray-500 text-xs">
        <Minus className="w-3 h-3" />
      </span>
    )
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Trending Now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Trending Now (Live)
          </CardTitle>
          <button
            onClick={fetchTrendingData}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trendingGames.map((game) => (
            <Link key={game.id} href={game.path}>
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg w-6 text-center">
                      {game.position}
                    </span>
                    {getPositionChange(game)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{game.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {game.category}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{game.currentPlayers.toLocaleString()}</span>
                    <span className="text-xs text-gray-500">playing</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {getTrendIcon(game.trend)}
                    {game.trend !== 'stable' && (
                      <span className={`text-xs ${
                        game.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {game.changePercent}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          
          <Link href="/games/trending">
            <button className="text-sm text-blue-500 hover:text-blue-600 font-medium">
              View All Trending →
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}