import { useState, useEffect } from 'react'
import { gameLevels } from '@/lib/game-levels'

export interface LevelProgress {
  level: number
  score: number
  stars: number
}

export function useGameLevels(gameId: string) {
  const [selectedLevel, setSelectedLevel] = useState(0)
  const [progress, setProgress] = useState<Record<number, LevelProgress>>({})
  const [totalStars, setTotalStars] = useState(0)
  
  const levels = gameLevels[gameId as keyof typeof gameLevels] || []
  
  useEffect(() => {
    const saved = localStorage.getItem(`${gameId}_levels`)
    if (saved) {
      const data = JSON.parse(saved)
      setProgress(data.progress || {})
      setTotalStars(data.totalStars || 0)
    }
  }, [gameId])
  
  const updateProgress = (level: number, score: number, stars: number) => {
    const current = progress[level] || { level, score: 0, stars: 0 }
    
    if (score > current.score) {
      const newProgress = {
        ...progress,
        [level]: { level, score, stars }
      }
      
      const newTotalStars = Object.values(newProgress).reduce(
        (sum, p) => sum + p.stars,
        0
      )
      
      setProgress(newProgress)
      setTotalStars(newTotalStars)
      
      localStorage.setItem(`${gameId}_levels`, JSON.stringify({
        progress: newProgress,
        totalStars: newTotalStars
      }))
    }
  }
  
  const isUnlocked = (level: number) => {
    if (!levels[level]) return false
    return totalStars >= levels[level].requiredStars
  }
  
  return {
    levels,
    selectedLevel,
    setSelectedLevel,
    progress,
    totalStars,
    updateProgress,
    isUnlocked
  }
}