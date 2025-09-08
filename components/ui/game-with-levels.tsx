'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Lock, Play } from 'lucide-react'

export interface GameLevel {
  id: number
  name: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master'
  config: any
  requiredStars: number
}

interface GameWithLevelsProps {
  gameId: string
  gameName: string
  levels: GameLevel[]
  renderGame: (levelConfig: any, onScore: (score: number) => void) => React.ReactNode
  getStars: (score: number, levelConfig: any) => 1 | 2 | 3
}

export default function GameWithLevels({
  gameId,
  gameName,
  levels,
  renderGame,
  getStars
}: GameWithLevelsProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)
  const [levelProgress, setLevelProgress] = useState<Record<number, { score: number; stars: number }>>(
    {}
  )
  const [totalStars, setTotalStars] = useState(0)

  useEffect(() => {
    // Load progress from localStorage
    const saved = localStorage.getItem(`${gameId}_levelProgress`)
    if (saved) {
      const progress = JSON.parse(saved)
      setLevelProgress(progress)
      const stars = Object.values(progress).reduce((sum: number, p: any) => sum + (p.stars || 0), 0)
      setTotalStars(stars)
    }
  }, [gameId])

  const isLevelUnlocked = (level: GameLevel) => {
    return totalStars >= level.requiredStars
  }

  const handleScore = (score: number) => {
    if (selectedLevel === null) return

    const level = levels[selectedLevel]
    const stars = getStars(score, level.config)
    
    const currentProgress = levelProgress[selectedLevel] || { score: 0, stars: 0 }
    
    if (score > currentProgress.score) {
      const newProgress = {
        ...levelProgress,
        [selectedLevel]: { score, stars }
      }
      
      setLevelProgress(newProgress)
      localStorage.setItem(`${gameId}_levelProgress`, JSON.stringify(newProgress))
      
      const newTotalStars = Object.values(newProgress).reduce(
        (sum: number, p: any) => sum + (p.stars || 0),
        0
      )
      setTotalStars(newTotalStars)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'bg-green-500',
      medium: 'bg-yellow-500',
      hard: 'bg-orange-500',
      expert: 'bg-red-500',
      master: 'bg-purple-500'
    }
    return colors[difficulty as keyof typeof colors] || 'bg-gray-500'
  }

  if (selectedLevel !== null) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={() => setSelectedLevel(null)} variant="outline">
            ← Back to Levels
          </Button>
          <div className="text-lg font-semibold">
            Level {selectedLevel + 1}: {levels[selectedLevel].name}
          </div>
        </div>
        {renderGame(levels[selectedLevel].config, handleScore)}
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">{gameName}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a difficulty level to play
            </p>
            <div className="mt-2 text-lg">
              Total Stars: <span className="text-yellow-500 font-bold">{totalStars}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {levels.map((level, index) => {
              const unlocked = isLevelUnlocked(level)
              const progress = levelProgress[index]
              
              return (
                <Card
                  key={level.id}
                  className={`relative ${!unlocked ? 'opacity-50' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Level {index + 1}</span>
                      <span className={`px-2 py-1 rounded text-white text-xs ${getDifficultyColor(level.difficulty)}`}>
                        {level.difficulty}
                      </span>
                    </div>
                    
                    <h3 className="font-bold mb-2">{level.name}</h3>
                    
                    <div className="flex items-center gap-1 mb-3">
                      {[1, 2, 3].map(star => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            progress && progress.stars >= star
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {progress && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Best: {progress.score}
                      </div>
                    )}

                    {!unlocked && (
                      <div className="text-sm text-red-600 mb-3 flex items-center gap-1">
                        <Lock className="w-4 h-4" />
                        Need {level.requiredStars} stars
                      </div>
                    )}

                    <Button
                      onClick={() => setSelectedLevel(index)}
                      disabled={!unlocked}
                      className="w-full"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}