'use client'

import { useState, useEffect } from 'react'
import DailyChallengeCard, { DailyChallenge } from './daily-challenge-card'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Calendar, TrendingUp } from 'lucide-react'

// Sample daily challenges - in production, these would come from a database
const generateDailyChallenges = (): DailyChallenge[] => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  return [
    {
      id: 'daily-1',
      date: today.toISOString().split('T')[0],
      gameId: 'cps-test',
      gameName: 'CPS Test',
      title: 'Speed Clicker Challenge',
      description: 'Achieve 100 clicks in 10 seconds',
      target: 100,
      targetType: 'score',
      reward: { xp: 500, badge: 'Speed Demon' },
      expiresAt: tomorrow.toISOString()
    },
    {
      id: 'daily-2',
      date: today.toISOString().split('T')[0],
      gameId: 'typing-test',
      gameName: 'Typing Test',
      title: 'Typing Master',
      description: 'Type at 80 WPM or higher',
      target: 80,
      targetType: 'score',
      reward: { xp: 750, badge: 'Fast Fingers' },
      expiresAt: tomorrow.toISOString()
    },
    {
      id: 'daily-3',
      date: today.toISOString().split('T')[0],
      gameId: '2048',
      gameName: '2048',
      title: 'Puzzle Expert',
      description: 'Reach the 2048 tile',
      target: 2048,
      targetType: 'score',
      reward: { xp: 1000, badge: 'Puzzle Master' },
      expiresAt: tomorrow.toISOString()
    }
  ]
}

interface ChallengeProgress {
  [challengeId: string]: {
    progress: number
    completed: boolean
  }
}

export default function DailyChallengesManager() {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([])
  const [progress, setProgress] = useState<ChallengeProgress>({})
  const [streak, setStreak] = useState(0)
  const [totalXP, setTotalXP] = useState(0)
  
  useEffect(() => {
    // Load challenges and progress
    const dailyChallenges = generateDailyChallenges()
    setChallenges(dailyChallenges)
    
    // Load progress from localStorage
    const savedProgress = localStorage.getItem('dailyChallengeProgress')
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress)
      setProgress(parsed)
      
      // Calculate total XP from completed challenges
      let xp = 0
      dailyChallenges.forEach(challenge => {
        if (parsed[challenge.id]?.completed) {
          xp += challenge.reward.xp
        }
      })
      setTotalXP(xp)
    }
    
    // Load streak
    const savedStreak = localStorage.getItem('challengeStreak')
    if (savedStreak) {
      setStreak(parseInt(savedStreak))
    }
  }, [])
  
  const updateProgress = (challengeId: string, newProgress: number) => {
    setProgress(prev => {
      const challenge = challenges.find(c => c.id === challengeId)
      if (!challenge) return prev
      
      const completed = newProgress >= challenge.target
      const updated = {
        ...prev,
        [challengeId]: {
          progress: newProgress,
          completed
        }
      }
      
      // Save to localStorage
      localStorage.setItem('dailyChallengeProgress', JSON.stringify(updated))
      
      // Update XP if completed
      if (completed && !prev[challengeId]?.completed) {
        setTotalXP(current => current + challenge.reward.xp)
        
        // Check if all challenges are completed for streak
        const allCompleted = challenges.every(c => 
          c.id === challengeId || updated[c.id]?.completed
        )
        if (allCompleted) {
          const newStreak = streak + 1
          setStreak(newStreak)
          localStorage.setItem('challengeStreak', newStreak.toString())
        }
      }
      
      return updated
    })
  }
  
  const activeChallenges = challenges.filter(c => !progress[c.id]?.completed)
  const completedChallenges = challenges.filter(c => progress[c.id]?.completed)
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Day Streak</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{totalXP.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total XP</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{completedChallenges.length}/{challenges.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Today</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Challenges Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Active ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedChallenges.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {activeChallenges.length === 0 ? (
            <Card className="p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-bold mb-2">All Challenges Complete!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Great job! Come back tomorrow for new challenges.
              </p>
            </Card>
          ) : (
            activeChallenges.map(challenge => (
              <DailyChallengeCard
                key={challenge.id}
                challenge={challenge}
                progress={progress[challenge.id]?.progress || 0}
                completed={progress[challenge.id]?.completed || false}
                onStart={() => {
                  // In a real app, this would navigate to the game with challenge mode
                  console.log(`Starting challenge: ${challenge.id}`)
                }}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {completedChallenges.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold mb-2">No Completed Challenges</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Complete challenges to see them here!
              </p>
            </Card>
          ) : (
            completedChallenges.map(challenge => (
              <DailyChallengeCard
                key={challenge.id}
                challenge={challenge}
                progress={progress[challenge.id]?.progress || 0}
                completed={true}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
      
      {/* Streak Bonus */}
      {streak > 0 && (
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">🔥 {streak} Day Streak!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Keep completing daily challenges to maintain your streak
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-500">+{streak * 100} XP</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Streak Bonus</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}