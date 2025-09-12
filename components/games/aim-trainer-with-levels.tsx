'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, RotateCcw, Crosshair } from 'lucide-react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { ShareCard } from '@/components/social/share-card'

interface AimTrainerConfig {
  duration: number // seconds
  targetMinSize: number // pixels
  targetMaxSize: number // pixels
  targetSpeed: number // movement speed (0 = static, higher = faster)
  targetCount: number // simultaneous targets
  requiredHits: number // minimum hits to pass
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Static Targets',
    difficulty: 'easy',
    config: {
      duration: 30,
      targetMinSize: 60,
      targetMaxSize: 80,
      targetSpeed: 0,
      targetCount: 1,
      requiredHits: 15
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Moving Targets',
    difficulty: 'medium',
    config: {
      duration: 30,
      targetMinSize: 50,
      targetMaxSize: 70,
      targetSpeed: 1,
      targetCount: 1,
      requiredHits: 20
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Fast & Small',
    difficulty: 'hard',
    config: {
      duration: 30,
      targetMinSize: 35,
      targetMaxSize: 50,
      targetSpeed: 2,
      targetCount: 1,
      requiredHits: 25
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Multi-Target',
    difficulty: 'expert',
    config: {
      duration: 30,
      targetMinSize: 40,
      targetMaxSize: 60,
      targetSpeed: 1.5,
      targetCount: 2,
      requiredHits: 35
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Precision Master',
    difficulty: 'master',
    config: {
      duration: 30,
      targetMinSize: 25,
      targetMaxSize: 40,
      targetSpeed: 3,
      targetCount: 3,
      requiredHits: 45
    },
    requiredStars: 12
  }
]

interface Target {
  id: number
  x: number
  y: number
  size: number
  velocityX?: number
  velocityY?: number
}

function AimTrainerCore({ config, onScore }: { config: AimTrainerConfig; onScore: (score: number) => void }) {
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'ended'>('waiting')
  const [score, setScore] = useState(0)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [timeLeft, setTimeLeft] = useState(config.duration)
  const [targets, setTargets] = useState<Target[]>([])

  const generateTarget = useCallback((id: number): Target => {
    const size = config.targetMinSize + Math.random() * (config.targetMaxSize - config.targetMinSize)
    const maxX = 100 - (size / 4)
    const maxY = 100 - (size / 4)
    const minX = size / 4
    const minY = size / 4
    
    const target: Target = {
      id,
      x: Math.random() * (maxX - minX) + minX,
      y: Math.random() * (maxY - minY) + minY,
      size
    }
    
    if (config.targetSpeed > 0) {
      const angle = Math.random() * Math.PI * 2
      target.velocityX = Math.cos(angle) * config.targetSpeed
      target.velocityY = Math.sin(angle) * config.targetSpeed
    }
    
    return target
  }, [config])

  const initializeTargets = useCallback(() => {
    const newTargets: Target[] = []
    for (let i = 0; i < config.targetCount; i++) {
      newTargets.push(generateTarget(i))
    }
    setTargets(newTargets)
  }, [config.targetCount, generateTarget])

  const handleTargetClick = (e: React.MouseEvent, targetId: number) => {
    e.stopPropagation()
    if (gameState !== 'playing') return
    
    setScore(prev => prev + Math.round(100 / (targets.find(t => t.id === targetId)?.size || 50)))
    setHits(prev => prev + 1)
    
    // Replace the clicked target with a new one
    setTargets(prev => prev.map(t => 
      t.id === targetId ? generateTarget(targetId) : t
    ))
  }

  const handleMissClick = () => {
    if (gameState !== 'playing') return
    
    setScore(prev => Math.max(0, prev - 50))
    setMisses(prev => prev + 1)
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setHits(0)
    setMisses(0)
    setTimeLeft(config.duration)
    initializeTargets()
  }

  const endGame = () => {
    setGameState('ended')
    const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0
    const finalScore = score * (accuracy / 100)
    onScore(Math.round(finalScore))
  }

  // Move targets
  useEffect(() => {
    if (gameState !== 'playing' || config.targetSpeed === 0) return
    
    const interval = setInterval(() => {
      setTargets(prev => prev.map(target => {
        if (!target.velocityX || !target.velocityY) return target
        
        let newX = target.x + target.velocityX
        let newY = target.y + target.velocityY
        let newVelocityX = target.velocityX
        let newVelocityY = target.velocityY
        
        const maxX = 100 - (target.size / 4)
        const maxY = 100 - (target.size / 4)
        const minX = target.size / 4
        const minY = target.size / 4
        
        if (newX > maxX || newX < minX) {
          newVelocityX = -newVelocityX
          newX = newX > maxX ? maxX : minX
        }
        
        if (newY > maxY || newY < minY) {
          newVelocityY = -newVelocityY
          newY = newY > maxY ? maxY : minY
        }
        
        return {
          ...target,
          x: newX,
          y: newY,
          velocityX: newVelocityX,
          velocityY: newVelocityY
        }
      }))
    }, 50)
    
    return () => clearInterval(interval)
  }, [gameState, config.targetSpeed])

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState])

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0

  if (gameState === 'waiting') {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Target className="w-8 h-8" />
              Aim Trainer
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Click the targets as quickly and accurately as possible!
            </p>
          </div>
          
          <div className="space-y-2 text-left max-w-sm mx-auto">
            <div className="flex justify-between">
              <span>Duration:</span>
              <span className="font-bold">{config.duration}s</span>
            </div>
            <div className="flex justify-between">
              <span>Target Count:</span>
              <span className="font-bold">{config.targetCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Required Hits:</span>
              <span className="font-bold">{config.requiredHits}</span>
            </div>
            <div className="flex justify-between">
              <span>Movement:</span>
              <span className="font-bold">
                {config.targetSpeed === 0 ? 'Static' : `Speed ${config.targetSpeed}`}
              </span>
            </div>
          </div>
          
          <Button onClick={startGame} size="lg">
            Start Training
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Aim Trainer</span>
          <div className="flex items-center gap-6 text-base">
            <span>Time: {timeLeft}s</span>
            <span>Score: {score}</span>
            <span>Accuracy: {accuracy}%</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="relative w-full h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg cursor-crosshair overflow-hidden"
          onClick={handleMissClick}
        >
          {targets.map(target => (
            <div
              key={target.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100"
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: `${target.size}px`,
                height: `${target.size}px`
              }}
              onClick={(e) => handleTargetClick(e, target.id)}
            >
              <div className="w-full h-full rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center">
                <div className="w-3/4 h-3/4 rounded-full bg-white flex items-center justify-center">
                  <div className="w-1/2 h-1/2 rounded-full bg-red-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {gameState === 'ended' && (
          <div className="mt-6 text-center space-y-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">
                {hits >= config.requiredHits ? 'Level Complete! 🎯' : 'Try Again!'}
              </h2>
              <div className="text-gray-600 dark:text-gray-400">
                <p>Hits: {hits} | Misses: {misses}</p>
                <p>Accuracy: {accuracy}%</p>
                <p>Final Score: {Math.round(score * (accuracy / 100))}</p>
              </div>
            </div>
            
            {hits >= config.requiredHits && (
              <ShareCard
                gameTitle="Aim Trainer"
                gameSlug="aim-trainer"
                score={Math.round(score * (accuracy / 100))}
                accuracy={accuracy}
              />
            )}
            
            <Button onClick={startGame} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const getStars = (score: number, config: AimTrainerConfig): 1 | 2 | 3 => {
  const maxPossibleScore = config.requiredHits * 2 * 100 // Assuming perfect accuracy and small targets
  const percentage = (score / maxPossibleScore) * 100
  
  if (percentage >= 60) return 3
  if (percentage >= 30) return 2
  return 1
}

export default function AimTrainerWithLevels() {
  return (
    <GameWithLevels
      gameId="aim-trainer"
      gameName="Aim Trainer"
      levels={levels}
      renderGame={(config, onScore) => (
        <AimTrainerCore config={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}