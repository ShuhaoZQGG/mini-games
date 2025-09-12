'use client'

import { useState, useEffect, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Timer, Zap, TrendingUp, Award } from 'lucide-react'

interface Score {
  time: number
  timestamp: number
}

interface ReactionTimeGameProps {
  levelConfig: {
    minWait: number
    maxWait: number
    rounds: number
    targetAverage: number
    distractions: boolean
    penaltyMultiplier: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner Reflexes',
    difficulty: 'easy',
    config: { 
      minWait: 2000,
      maxWait: 5000,
      rounds: 5,
      targetAverage: 400,
      distractions: false,
      penaltyMultiplier: 1
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Quick Response',
    difficulty: 'medium',
    config: { 
      minWait: 1500,
      maxWait: 4500,
      rounds: 7,
      targetAverage: 350,
      distractions: false,
      penaltyMultiplier: 1.5
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Fast Reactions',
    difficulty: 'hard',
    config: { 
      minWait: 1000,
      maxWait: 4000,
      rounds: 10,
      targetAverage: 300,
      distractions: true,
      penaltyMultiplier: 2
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Lightning Reflexes',
    difficulty: 'expert',
    config: { 
      minWait: 800,
      maxWait: 3000,
      rounds: 12,
      targetAverage: 250,
      distractions: true,
      penaltyMultiplier: 2.5
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Superhuman Speed',
    difficulty: 'master',
    config: { 
      minWait: 500,
      maxWait: 2500,
      rounds: 15,
      targetAverage: 200,
      distractions: true,
      penaltyMultiplier: 3
    },
    requiredStars: 12
  }
]

function ReactionTimeCore({ levelConfig, onScore }: ReactionTimeGameProps) {
  const { minWait, maxWait, rounds, targetAverage, distractions, penaltyMultiplier } = levelConfig
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'ready' | 'clicked' | 'tooEarly' | 'finished'>('idle')
  const [startTime, setStartTime] = useState<number>(0)
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [scores, setScores] = useState<Score[]>([])
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [currentRound, setCurrentRound] = useState(0)
  const [averageTime, setAverageTime] = useState<number>(0)
  const [showDistraction, setShowDistraction] = useState(false)
  const [distractionTimeoutId, setDistractionTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [earlyClicks, setEarlyClicks] = useState(0)

  const startRound = useCallback(() => {
    setGameState('waiting')
    setReactionTime(null)
    setShowDistraction(false)
    
    // Random delay between min and max wait
    const delay = Math.random() * (maxWait - minWait) + minWait
    
    // Add distractions if enabled
    if (distractions && Math.random() < 0.3) {
      const distractionDelay = Math.random() * (delay - 500)
      const distId = setTimeout(() => {
        setShowDistraction(true)
        setTimeout(() => setShowDistraction(false), 300)
      }, distractionDelay)
      setDistractionTimeoutId(distId)
    }
    
    const id = setTimeout(() => {
      setGameState('ready')
      setStartTime(Date.now())
    }, delay)
    
    setTimeoutId(id)
  }, [minWait, maxWait, distractions])

  const handleClick = useCallback(() => {
    if (gameState === 'waiting') {
      // Clicked too early
      if (timeoutId) {
        clearTimeout(timeoutId)
        setTimeoutId(null)
      }
      if (distractionTimeoutId) {
        clearTimeout(distractionTimeoutId)
        setDistractionTimeoutId(null)
      }
      setGameState('tooEarly')
      setEarlyClicks(prev => prev + 1)
      setReactionTime(null)
      
      // Automatically continue after showing error
      setTimeout(() => {
        if (currentRound < rounds) {
          startRound()
        } else {
          finishGame()
        }
      }, 2000)
    } else if (gameState === 'ready') {
      // Calculate reaction time
      const endTime = Date.now()
      const time = endTime - startTime
      setReactionTime(time)
      setGameState('clicked')
      
      // Save score
      const newScore: Score = { time, timestamp: Date.now() }
      const newScores = [...scores, newScore]
      setScores(newScores)
      setCurrentRound(currentRound + 1)
      
      // Calculate running average
      const avg = newScores.reduce((sum, s) => sum + s.time, 0) / newScores.length
      setAverageTime(Math.round(avg))
      
      // Continue to next round or finish
      setTimeout(() => {
        if (currentRound + 1 < rounds) {
          startRound()
        } else {
          finishGame()
        }
      }, 1500)
    }
  }, [gameState, startTime, scores, timeoutId, distractionTimeoutId, currentRound, rounds, startRound])

  const finishGame = useCallback(() => {
    setGameState('finished')
    
    // Calculate final score
    const validScores = scores.filter(s => s.time > 0)
    if (validScores.length === 0) {
      onScore(0)
      return
    }
    
    const average = validScores.reduce((sum, s) => sum + s.time, 0) / validScores.length
    const bestTime = Math.min(...validScores.map(s => s.time))
    
    // Base score calculation
    let baseScore = Math.max(0, (targetAverage - average) * 10)
    
    // Bonus for completing all rounds
    const completionBonus = (validScores.length / rounds) * 500
    
    // Bonus for best time
    const bestTimeBonus = Math.max(0, (targetAverage - bestTime) * 5)
    
    // Penalty for early clicks
    const earlyClickPenalty = earlyClicks * 100 * penaltyMultiplier
    
    // Calculate final score
    const finalScore = Math.max(0, Math.round(baseScore + completionBonus + bestTimeBonus - earlyClickPenalty))
    
    onScore(finalScore)
  }, [scores, rounds, targetAverage, earlyClicks, penaltyMultiplier, onScore])

  const startGame = useCallback(() => {
    setScores([])
    setCurrentRound(0)
    setEarlyClicks(0)
    setAverageTime(0)
    startRound()
  }, [startRound])

  const resetGame = useCallback(() => {
    setGameState('idle')
    setReactionTime(null)
    setScores([])
    setCurrentRound(0)
    setEarlyClicks(0)
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    if (distractionTimeoutId) {
      clearTimeout(distractionTimeoutId)
      setDistractionTimeoutId(null)
    }
  }, [timeoutId, distractionTimeoutId])

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (distractionTimeoutId) {
        clearTimeout(distractionTimeoutId)
      }
    }
  }, [timeoutId, distractionTimeoutId])

  const getBestScore = () => {
    if (scores.length === 0) return null
    return Math.min(...scores.map(s => s.time))
  }

  const getReactionLevel = (time: number) => {
    if (time < 200) return { level: 'Lightning Fast!', color: 'text-purple-600' }
    if (time < 250) return { level: 'Excellent!', color: 'text-green-600' }
    if (time < 300) return { level: 'Good!', color: 'text-blue-600' }
    if (time < 400) return { level: 'Average', color: 'text-yellow-600' }
    return { level: 'Keep Practicing', color: 'text-orange-600' }
  }

  if (gameState === 'finished') {
    const validScores = scores.filter(s => s.time > 0)
    const average = validScores.length > 0 
      ? Math.round(validScores.reduce((sum, s) => sum + s.time, 0) / validScores.length)
      : 0
    const bestTime = validScores.length > 0 ? Math.min(...validScores.map(s => s.time)) : 0
    
    // Calculate score components for display
    const baseScore = Math.max(0, (targetAverage - average) * 10)
    const completionBonus = (validScores.length / rounds) * 500
    const bestTimeBonus = Math.max(0, (targetAverage - bestTime) * 5)
    const earlyClickPenalty = earlyClicks * 100 * penaltyMultiplier
    const finalScore = Math.max(0, Math.round(baseScore + completionBonus + bestTimeBonus - earlyClickPenalty))

    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-bold">Test Complete!</h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Average: {average}ms</p>
            <p className="text-lg">Best Time: {bestTime}ms</p>
            <p className="text-lg">Rounds: {validScores.length}/{rounds}</p>
            {earlyClicks > 0 && (
              <p className="text-lg text-orange-500">Early Clicks: {earlyClicks}</p>
            )}
            
            <div className="pt-4 border-t space-y-1">
              <p className="text-sm text-muted-foreground">Base Score: {Math.round(baseScore)}</p>
              <p className="text-sm text-muted-foreground">Completion Bonus: +{Math.round(completionBonus)}</p>
              <p className="text-sm text-muted-foreground">Best Time Bonus: +{Math.round(bestTimeBonus)}</p>
              {earlyClickPenalty > 0 && (
                <p className="text-sm text-orange-500">Early Click Penalty: -{Math.round(earlyClickPenalty)}</p>
              )}
              <p className="text-2xl font-bold text-primary pt-2">Final Score: {finalScore}</p>
            </div>
          </div>
          
          <Button onClick={resetGame} size="lg">
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <Zap className="w-4 h-4" />
                Round
              </div>
              <div className="text-2xl font-bold">
                {currentRound + 1}/{rounds}
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <Timer className="w-4 h-4" />
                Current
              </div>
              <div className="text-2xl font-bold">
                {reactionTime !== null ? `${reactionTime}ms` : '--'}
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                Average
              </div>
              <div className="text-2xl font-bold">
                {averageTime > 0 ? `${averageTime}ms` : '--'}
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                <Award className="w-4 h-4" />
                Best
              </div>
              <div className="text-2xl font-bold">
                {getBestScore() !== null ? `${getBestScore()}ms` : '--'}
              </div>
            </div>
          </div>

          {/* Game Area */}
          <div 
            className={`
              relative min-h-[300px] rounded-lg flex items-center justify-center cursor-pointer
              transition-colors duration-100
              ${gameState === 'idle' ? 'bg-blue-100 hover:bg-blue-200' : ''}
              ${gameState === 'waiting' ? 'bg-red-500 hover:bg-red-600' : ''}
              ${gameState === 'ready' ? 'bg-green-500 hover:bg-green-600' : ''}
              ${gameState === 'clicked' ? 'bg-blue-100' : ''}
              ${gameState === 'tooEarly' ? 'bg-orange-500' : ''}
            `}
            onClick={gameState === 'waiting' || gameState === 'ready' ? handleClick : undefined}
          >
            {/* Distraction element */}
            {showDistraction && distractions && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-6xl font-bold text-yellow-300 animate-pulse">
                  WAIT!
                </div>
              </div>
            )}

            {gameState === 'idle' && (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to test your reflexes?</h3>
                <p className="text-lg mb-4">Complete {rounds} rounds • Target: {targetAverage}ms</p>
                <Button onClick={startGame} size="lg">
                  Start Test
                </Button>
              </div>
            )}
            
            {gameState === 'waiting' && (
              <div className="text-center text-white">
                <h3 className="text-3xl font-bold mb-2">Wait for green...</h3>
                <p className="text-lg">Click when the screen turns green!</p>
                <p className="text-sm mt-2 opacity-75">Round {currentRound + 1} of {rounds}</p>
              </div>
            )}
            
            {gameState === 'ready' && (
              <div className="text-center text-white">
                <h3 className="text-4xl font-bold">CLICK NOW!</h3>
              </div>
            )}
            
            {gameState === 'clicked' && reactionTime !== null && (
              <div className="text-center">
                <h3 className="text-5xl font-bold mb-2">{reactionTime}ms</h3>
                <p className={`text-xl font-semibold mb-4 ${getReactionLevel(reactionTime).color}`}>
                  {getReactionLevel(reactionTime).level}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentRound < rounds ? 'Next round starting...' : 'Calculating score...'}
                </p>
              </div>
            )}
            
            {gameState === 'tooEarly' && (
              <div className="text-center text-white">
                <h3 className="text-3xl font-bold mb-2">Too Early!</h3>
                <p className="text-lg mb-2">Wait for the green screen before clicking.</p>
                <p className="text-sm opacity-75">
                  Penalty applied • Continuing...
                </p>
              </div>
            )}
          </div>

          {/* Recent Scores */}
          {scores.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Recent Attempts</h4>
              <div className="flex gap-2 flex-wrap">
                {scores.slice(-5).map((score, index) => (
                  <div 
                    key={score.timestamp}
                    className={`px-3 py-1 rounded-full text-sm font-medium
                      ${score.time < targetAverage ? 'bg-green-100 text-green-700' : 'bg-muted'}
                    `}
                  >
                    {score.time}ms
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level Info */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Level Requirements:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>• {rounds} rounds to complete</div>
              <div>• Target average: {targetAverage}ms</div>
              <div>• Wait time: {minWait/1000}s - {maxWait/1000}s</div>
              {distractions && <div>• Visual distractions enabled</div>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ReactionTimeWithLevels() {
  const getStars = (score: number, levelConfig: any) => {
    const { targetAverage, rounds } = levelConfig
    const maxScore = targetAverage * 10 + rounds * 50 + 500
    
    if (score >= maxScore * 0.7) return 3
    if (score >= maxScore * 0.4) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="reaction-time"
      gameName="Reaction Time"
      levels={levels}
      renderGame={(config, onScore) => (
        <ReactionTimeCore levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}