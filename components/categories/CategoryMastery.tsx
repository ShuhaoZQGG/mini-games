'use client'

import React, { useState, useEffect } from 'react'
import { GameCategory, getGamesByCategory, gameCategories } from '@/lib/gameCategories'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Star, Lock, CheckCircle, Circle } from 'lucide-react'
import Link from 'next/link'

interface CategoryMasteryData {
  category: GameCategory
  gamesPlayed: number
  totalGames: number
  masteryLevel: number
  masteryTitle: string
  nextMilestone: number
  achievements: Achievement[]
  progress: number
}

interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
  icon: string
}

export function CategoryMastery() {
  const [masteryData, setMasteryData] = useState<CategoryMasteryData[]>([])
  const [expandedCategory, setExpandedCategory] = useState<GameCategory | null>(null)

  const getMasteryTitle = (level: number): string => {
    if (level === 0) return 'Novice'
    if (level <= 25) return 'Beginner'
    if (level <= 50) return 'Adept'
    if (level <= 75) return 'Expert'
    if (level < 100) return 'Master'
    return 'Grand Master'
  }

  const getMasteryColor = (level: number): string => {
    if (level === 0) return 'text-gray-500'
    if (level <= 25) return 'text-green-500'
    if (level <= 50) return 'text-blue-500'
    if (level <= 75) return 'text-purple-500'
    if (level < 100) return 'text-orange-500'
    return 'text-red-500'
  }

  useEffect(() => {
    // Simulate fetching mastery data from localStorage or API
    const categories: GameCategory[] = [
      'puzzle', 'action', 'strategy', 'arcade', 'card', 
      'memory', 'skill', 'casino', 'word'
    ]

    const data = categories.map(category => {
      const categoryGames = getGamesByCategory(category)
      const totalGames = categoryGames.length
      
      // Simulate progress (in production, fetch from user data)
      const gamesPlayed = Math.floor(Math.random() * totalGames)
      const progress = totalGames > 0 ? (gamesPlayed / totalGames) * 100 : 0
      const masteryLevel = Math.floor(progress)

      // Generate achievements
      const achievements: Achievement[] = [
        {
          id: `${category}-first`,
          name: 'First Steps',
          description: 'Play your first game',
          unlocked: gamesPlayed > 0,
          icon: '👣'
        },
        {
          id: `${category}-explorer`,
          name: 'Explorer',
          description: 'Play 5 different games',
          unlocked: gamesPlayed >= 5,
          icon: '🗺️'
        },
        {
          id: `${category}-dedicated`,
          name: 'Dedicated Player',
          description: 'Play 10 different games',
          unlocked: gamesPlayed >= 10,
          icon: '🎯'
        },
        {
          id: `${category}-master`,
          name: 'Category Master',
          description: 'Play all games in category',
          unlocked: gamesPlayed === totalGames,
          icon: '👑'
        }
      ]

      const nextMilestone = 
        progress < 25 ? 25 :
        progress < 50 ? 50 :
        progress < 75 ? 75 :
        progress < 100 ? 100 : 100

      return {
        category,
        gamesPlayed,
        totalGames,
        masteryLevel,
        masteryTitle: getMasteryTitle(masteryLevel),
        nextMilestone,
        achievements,
        progress
      }
    })

    setMasteryData(data.sort((a, b) => b.progress - a.progress))
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Your Category Mastery
          </CardTitle>
          <p className="text-sm text-gray-500">
            Track your progress across all game categories
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {masteryData.map((data) => (
            <div key={data.category} className="space-y-2">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedCategory(
                  expandedCategory === data.category ? null : data.category
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium capitalize">{data.category}</span>
                  <Badge className={getMasteryColor(data.masteryLevel)}>
                    {data.masteryTitle}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {data.gamesPlayed}/{data.totalGames} games
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {data.progress.toFixed(0)}%
                </span>
              </div>
              
              <div className="relative">
                <Progress value={data.progress} className="h-2" />
                {/* Milestone markers */}
                <div className="absolute top-0 left-0 w-full h-2 flex">
                  {[25, 50, 75].map((milestone) => (
                    <div
                      key={milestone}
                      className="absolute h-full w-px bg-gray-300 dark:bg-gray-600"
                      style={{ left: `${milestone}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Expanded achievements section */}
              {expandedCategory === data.category && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium mb-3">Achievements</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {data.achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`flex flex-col items-center text-center p-3 rounded-lg border ${
                          achievement.unlocked
                            ? 'bg-white dark:bg-gray-700 border-green-500'
                            : 'bg-gray-100 dark:bg-gray-900 border-gray-300 opacity-50'
                        }`}
                      >
                        <span className="text-2xl mb-1">{achievement.icon}</span>
                        <span className="text-xs font-medium">{achievement.name}</span>
                        <span className="text-xs text-gray-500 mt-1">
                          {achievement.description}
                        </span>
                        {achievement.unlocked ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mt-2" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400 mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <Link href={`/category/${data.category}`}>
                      <button className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                        Browse {data.category} Games →
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Overall Progress Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-500">
                {masteryData.reduce((sum, d) => sum + d.gamesPlayed, 0)}
              </div>
              <p className="text-sm text-gray-500">Games Played</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-500">
                {masteryData.filter(d => d.progress >= 50).length}
              </div>
              <p className="text-sm text-gray-500">Categories Mastered (50%+)</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-500">
                {masteryData.reduce((sum, d) => 
                  sum + d.achievements.filter(a => a.unlocked).length, 0
                )}
              </div>
              <p className="text-sm text-gray-500">Achievements Unlocked</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center">
        <Link href="/games">
          <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
            Continue Your Journey →
          </button>
        </Link>
      </div>
    </div>
  )
}