'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PlayCircle, RotateCcw, Zap, Trophy, Timer, Target } from 'lucide-react'

interface WhackAMoleConfig {
  moleTime: number
  spawnRate: number
  gameDuration: number
  targetScore: number
  gridSize: number
  hasGoldenMoles: boolean
  hasDecoyMoles: boolean
  speedMultiplier: number
}

interface WhackAMoleCoreProps {
  levelConfig: WhackAMoleConfig
  onScore: (score: number) => void
}

interface Mole {
  id: number
  isActive: boolean
  isWhacked: boolean
  type: 'normal' | 'golden' | 'decoy'
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Warm Up',
    difficulty: 'easy',
    config: {
      moleTime: 1500,
      spawnRate: 1200,
      gameDuration: 30,
      targetScore: 150,
      gridSize: 9,
      hasGoldenMoles: false,
      hasDecoyMoles: false,
      speedMultiplier: 1
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Getting Faster',
    difficulty: 'medium',
    config: {
      moleTime: 1000,
      spawnRate: 800,
      gameDuration: 45,
      targetScore: 300,
      gridSize: 9,
      hasGoldenMoles: true,
      hasDecoyMoles: false,
      speedMultiplier: 1.2
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Tricky Moles',
    difficulty: 'hard',
    config: {
      moleTime: 800,
      spawnRate: 600,
      gameDuration: 60,
      targetScore: 500,
      gridSize: 12,
      hasGoldenMoles: true,
      hasDecoyMoles: true,
      speedMultiplier: 1.5
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Lightning Fast',
    difficulty: 'expert',
    config: {
      moleTime: 600,
      spawnRate: 400,
      gameDuration: 60,
      targetScore: 750,
      gridSize: 16,
      hasGoldenMoles: true,
      hasDecoyMoles: true,
      speedMultiplier: 2
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Mole Master',
    difficulty: 'master',
    config: {
      moleTime: 500,
      spawnRate: 300,
      gameDuration: 90,
      targetScore: 1000,
      gridSize: 16,
      hasGoldenMoles: true,
      hasDecoyMoles: true,
      speedMultiplier: 2.5
    },
    requiredStars: 12
  }
]

function WhackAMoleCore({ levelConfig, onScore }: WhackAMoleCoreProps) {
  const { 
    moleTime, 
    spawnRate, 
    gameDuration, 
    targetScore, 
    gridSize,
    hasGoldenMoles,
    hasDecoyMoles,
    speedMultiplier
  } = levelConfig

  const [moles, setMoles] = useState<Mole[]>(
    Array.from({ length: gridSize }, (_, i) => ({
      id: i,
      isActive: false,
      isWhacked: false,
      type: 'normal'
    }))
  )
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(gameDuration)
  const [isPlaying, setIsPlaying] = useState(false)
  const [missedMoles, setMissedMoles] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [goldenHits, setGoldenHits] = useState(0)
  const [decoyHits, setDecoyHits] = useState(0)
  const [gameEnded, setGameEnded] = useState(false)
  
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const moleTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map())

  const startGame = () => {
    setScore(0)
    setTimeLeft(gameDuration)
    setIsPlaying(true)
    setMissedMoles(0)
    setCombo(0)
    setMaxCombo(0)
    setGoldenHits(0)
    setDecoyHits(0)
    setGameEnded(false)
    setMoles(moles.map(m => ({ ...m, isActive: false, isWhacked: false, type: 'normal' })))
    
    // Adjust spawn rate based on speed multiplier
    const adjustedSpawnRate = Math.floor(spawnRate / speedMultiplier)
    
    gameIntervalRef.current = setInterval(() => {
      spawnMole()
    }, adjustedSpawnRate)
    
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const spawnMole = () => {
    setMoles(currentMoles => {
      const inactiveMoles = currentMoles.filter(m => !m.isActive)
      if (inactiveMoles.length === 0) return currentMoles
      
      const randomIndex = Math.floor(Math.random() * gridSize)
      const newMoles = [...currentMoles]
      
      if (!newMoles[randomIndex].isActive) {
        // Determine mole type
        let moleType: 'normal' | 'golden' | 'decoy' = 'normal'
        const random = Math.random()
        
        if (hasGoldenMoles && random < 0.1) {
          moleType = 'golden'
        } else if (hasDecoyMoles && random < 0.2) {
          moleType = 'decoy'
        }
        
        newMoles[randomIndex].isActive = true
        newMoles[randomIndex].isWhacked = false
        newMoles[randomIndex].type = moleType
        
        // Adjust mole time based on speed multiplier
        const adjustedMoleTime = Math.floor(moleTime / speedMultiplier)
        
        // Clear any existing timer for this mole
        if (moleTimersRef.current.has(randomIndex)) {
          clearTimeout(moleTimersRef.current.get(randomIndex))
        }
        
        // Set timer to hide mole
        const timer = setTimeout(() => {
          setMoles(current => {
            const updated = [...current]
            if (updated[randomIndex].isActive && !updated[randomIndex].isWhacked) {
              updated[randomIndex].isActive = false
              if (updated[randomIndex].type === 'normal' || updated[randomIndex].type === 'golden') {
                setMissedMoles(m => m + 1)
                setCombo(0)
              }
            }
            return updated
          })
          moleTimersRef.current.delete(randomIndex)
        }, adjustedMoleTime)
        
        moleTimersRef.current.set(randomIndex, timer)
      }
      
      return newMoles
    })
  }

  const whackMole = (id: number) => {
    if (!isPlaying) return
    
    setMoles(prev => {
      const newMoles = [...prev]
      if (newMoles[id].isActive && !newMoles[id].isWhacked) {
        newMoles[id].isWhacked = true
        newMoles[id].isActive = false
        
        // Clear the timer for this mole
        if (moleTimersRef.current.has(id)) {
          clearTimeout(moleTimersRef.current.get(id))
          moleTimersRef.current.delete(id)
        }
        
        // Calculate score based on mole type
        let points = 0
        if (newMoles[id].type === 'golden') {
          points = 50
          setGoldenHits(g => g + 1)
          setCombo(c => {
            const newCombo = c + 2
            setMaxCombo(mc => Math.max(mc, newCombo))
            return newCombo
          })
        } else if (newMoles[id].type === 'decoy') {
          points = -20
          setDecoyHits(d => d + 1)
          setCombo(0)
        } else {
          points = 10
          setCombo(c => {
            const newCombo = c + 1
            setMaxCombo(mc => Math.max(mc, newCombo))
            return newCombo
          })
        }
        
        // Add combo bonus
        const comboBonus = Math.floor(combo / 5) * 5
        const totalPoints = points + comboBonus
        
        setScore(s => Math.max(0, s + totalPoints))
        
        // Reset whacked state after animation
        setTimeout(() => {
          setMoles(current => {
            const updated = [...current]
            updated[id].isWhacked = false
            return updated
          })
        }, 200)
      }
      return newMoles
    })
  }

  const endGame = () => {
    setIsPlaying(false)
    setGameEnded(true)
    
    // Clear all timers
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current)
      gameIntervalRef.current = null
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    
    // Clear all mole timers
    moleTimersRef.current.forEach(timer => clearTimeout(timer))
    moleTimersRef.current.clear()
    
    setMoles(moles.map(m => ({ ...m, isActive: false, isWhacked: false })))
    
    // Calculate final score with bonuses
    let finalScore = score
    
    // Bonus for reaching target
    if (score >= targetScore) {
      finalScore += 500
    }
    
    // Bonus for accuracy (low missed moles)
    if (missedMoles < 5) {
      finalScore += 200
    } else if (missedMoles < 10) {
      finalScore += 100
    }
    
    // Combo bonus
    finalScore += maxCombo * 10
    
    // Golden mole bonus
    finalScore += goldenHits * 25
    
    onScore(finalScore)
  }

  const resetGame = () => {
    // Clear all timers before resetting
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current)
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    moleTimersRef.current.forEach(timer => clearTimeout(timer))
    moleTimersRef.current.clear()
    
    setScore(0)
    setTimeLeft(gameDuration)
    setMissedMoles(0)
    setCombo(0)
    setMaxCombo(0)
    setGoldenHits(0)
    setDecoyHits(0)
    setIsPlaying(false)
    setGameEnded(false)
    setMoles(moles.map(m => ({ ...m, isActive: false, isWhacked: false, type: 'normal' })))
  }

  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      moleTimersRef.current.forEach(timer => clearTimeout(timer))
    }
  }, [])

  const getMoleEmoji = (mole: Mole) => {
    if (mole.isWhacked) return '💥'
    if (mole.type === 'golden') return '✨'
    if (mole.type === 'decoy') return '👻'
    return '🐹'
  }

  const getMoleColor = (mole: Mole) => {
    if (mole.isWhacked) return 'bg-red-500'
    if (!mole.isActive) return 'bg-amber-900'
    if (mole.type === 'golden') return 'bg-yellow-500 animate-pulse'
    if (mole.type === 'decoy') return 'bg-purple-600'
    return 'bg-amber-600 hover:bg-amber-500'
  }

  const gridCols = Math.sqrt(gridSize)

  return (
    <Card className="w-full max-w-3xl mx-auto p-8">
      <div className="text-center mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-left">
            <div className="text-3xl font-bold">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
            <div className="text-sm text-gray-600">Target: {targetScore}</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold flex items-center gap-1">
              <Timer className="w-6 h-6" />
              {timeLeft}s
            </div>
            <div className="text-sm text-gray-600">Time Left</div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold flex items-center gap-1">
              {combo} <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-sm text-gray-600">Combo</div>
            <div className="text-sm text-gray-600">Max: {maxCombo}</div>
          </div>
        </div>

        {hasGoldenMoles && (
          <div className="text-sm text-gray-600 mb-2">
            Golden moles: <span className="text-yellow-600">+50 pts</span>
            {hasDecoyMoles && <span> | Ghosts: <span className="text-purple-600">-20 pts</span></span>}
          </div>
        )}

        <div className="flex justify-center gap-4">
          {!isPlaying && !gameEnded ? (
            <Button onClick={startGame} size="lg">
              <PlayCircle className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          ) : (
            <Button onClick={resetGame} size="lg" variant="outline">
              <RotateCcw className="w-5 h-5 mr-2" />
              {gameEnded ? 'Play Again' : 'Reset'}
            </Button>
          )}
        </div>
      </div>

      <div 
        className="grid gap-3 max-w-xl mx-auto"
        style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
      >
        {moles.map((mole) => (
          <div
            key={mole.id}
            className="relative aspect-square"
          >
            <div className="absolute inset-0 bg-amber-700 rounded-full" />
            <div className="absolute inset-2 bg-amber-900 rounded-full" />
            <button
              className={`
                absolute inset-4 rounded-full transition-all duration-200 cursor-pointer
                ${getMoleColor(mole)}
                ${mole.isActive && !mole.isWhacked ? 'scale-110' : ''}
                ${mole.isWhacked ? 'scale-90' : ''}
              `}
              onClick={() => whackMole(mole.id)}
              disabled={!isPlaying}
            >
              {(mole.isActive || mole.isWhacked) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-3xl">{getMoleEmoji(mole)}</div>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>

      {gameEnded && (
        <div className="text-center mt-6 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <p className="text-lg font-semibold">
              Game Over!
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-2xl font-bold text-blue-600">
              Final Score: {score + (score >= targetScore ? 500 : 0) + (missedMoles < 5 ? 200 : missedMoles < 10 ? 100 : 0) + maxCombo * 10 + goldenHits * 25}
            </p>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>Base Score: {score}</p>
              {score >= targetScore && <p className="text-green-600">Target Reached: +500</p>}
              {missedMoles < 5 && <p className="text-green-600">Excellent Accuracy: +200</p>}
              {missedMoles >= 5 && missedMoles < 10 && <p className="text-yellow-600">Good Accuracy: +100</p>}
              <p>Max Combo Bonus: +{maxCombo * 10}</p>
              {hasGoldenMoles && <p>Golden Moles Bonus: +{goldenHits * 25}</p>}
              {hasDecoyMoles && <p>Decoys Hit: {decoyHits}</p>}
              <p>Missed: {missedMoles}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            {score >= targetScore ? (
              <p className="text-green-600 font-semibold flex items-center gap-1">
                <Target className="w-4 h-4" />
                Target Achieved!
              </p>
            ) : (
              <p className="text-gray-600">
                Needed {targetScore - score} more points
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

export default function WhackAMoleWithLevels() {
  const getStars = (score: number, levelConfig: WhackAMoleConfig): 1 | 2 | 3 => {
    const { targetScore } = levelConfig
    
    // 3 stars: Score at least 150% of target
    // 2 stars: Score at least target
    // 1 star: Score at least 50% of target
    
    if (score >= targetScore * 1.5) return 3
    if (score >= targetScore) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="whack-a-mole"
      gameName="Whack-a-Mole"
      levels={levels}
      renderGame={(config, onScore) => (
        <WhackAMoleCore levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}