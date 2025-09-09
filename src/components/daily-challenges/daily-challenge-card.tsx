'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Trophy, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export interface DailyChallenge {
  id: string
  date: string
  gameId: string
  gameName: string
  title: string
  description: string
  target: number
  targetType: 'score' | 'time' | 'moves' | 'accuracy'
  reward: {
    xp: number
    badge?: string
  }
  expiresAt: string
}

interface DailyChallengeCardProps {
  challenge: DailyChallenge
  progress?: number
  completed?: boolean
  onStart?: () => void
}

export default function DailyChallengeCard({ 
  challenge, 
  progress = 0, 
  completed = false,
  onStart 
}: DailyChallengeCardProps) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const expires = new Date(challenge.expiresAt)
      const diff = expires.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeLeft('Expired')
        return
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setTimeLeft(`${hours}h ${minutes}m`)
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [challenge.expiresAt])

  const progressPercentage = Math.min((progress / challenge.target) * 100, 100)
  
  const getTargetLabel = () => {
    switch (challenge.targetType) {
      case 'score': return `Score: ${progress}/${challenge.target}`
      case 'time': return `Time: ${progress}s/${challenge.target}s`
      case 'moves': return `Moves: ${progress}/${challenge.target}`
      case 'accuracy': return `Accuracy: ${progress}%/${challenge.target}%`
      default: return `${progress}/${challenge.target}`
    }
  }

  return (
    <Card className={`p-6 ${completed ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-500" />
          <div>
            <h3 className="text-lg font-bold">{challenge.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.gameName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          <span className={timeLeft === 'Expired' ? 'text-red-500' : ''}>
            {timeLeft}
          </span>
        </div>
      </div>
      
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        {challenge.description}
      </p>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{getTargetLabel()}</span>
          <span className="text-sm text-gray-600">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              completed ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">{challenge.reward.xp} XP</span>
          </div>
          {challenge.reward.badge && (
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">{challenge.reward.badge}</span>
            </div>
          )}
        </div>
        
        {completed ? (
          <div className="flex items-center gap-2 text-green-600">
            <Trophy className="w-5 h-5" />
            <span className="font-bold">Completed!</span>
          </div>
        ) : (
          <Link href={`/games/${challenge.gameId}`}>
            <Button size="sm" onClick={onStart}>
              Play Now
            </Button>
          </Link>
        )}
      </div>
    </Card>
  )
}