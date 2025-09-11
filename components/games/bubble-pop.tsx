'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Pause } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Bubble {
  id: number
  x: number
  y: number
  radius: number
  color: string
  velocity: number
  points: number
}

interface BubblePopGameProps {
  levelConfig: {
    targetScore: number
    bubbleSpeed: number
    spawnRate: number
    maxBubbles: number
    timeLimit: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Bubble Beginner',
    difficulty: 'easy',
    config: { 
      targetScore: 500, 
      bubbleSpeed: 1, 
      spawnRate: 2000,
      maxBubbles: 8,
      timeLimit: 60
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Bubble Popper',
    difficulty: 'medium',
    config: { 
      targetScore: 1000, 
      bubbleSpeed: 1.5, 
      spawnRate: 1500,
      maxBubbles: 10,
      timeLimit: 60
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Bubble Master',
    difficulty: 'hard',
    config: { 
      targetScore: 2000, 
      bubbleSpeed: 2, 
      spawnRate: 1000,
      maxBubbles: 12,
      timeLimit: 60
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Bubble Expert',
    difficulty: 'expert',
    config: { 
      targetScore: 3500, 
      bubbleSpeed: 2.5, 
      spawnRate: 800,
      maxBubbles: 15,
      timeLimit: 60
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Bubble Legend',
    difficulty: 'master',
    config: { 
      targetScore: 5000, 
      bubbleSpeed: 3, 
      spawnRate: 600,
      maxBubbles: 20,
      timeLimit: 60
    },
    requiredStars: 14
  }
]

function BubblePopGame({ levelConfig, onScore }: BubblePopGameProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(levelConfig.timeLimit)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'gameOver'>('ready')
  const [combo, setCombo] = useState(0)
  const [lastPopTime, setLastPopTime] = useState(0)
  
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const spawnTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const countdownTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const nextIdRef = useRef(0)

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']

  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(levelConfig.timeLimit)
    setBubbles([])
    setCombo(0)
    setLastPopTime(Date.now())
    nextIdRef.current = 0
  }, [levelConfig.timeLimit])

  const resetGame = useCallback(() => {
    setGameState('ready')
    setScore(0)
    setTimeLeft(levelConfig.timeLimit)
    setBubbles([])
    setCombo(0)
  }, [levelConfig.timeLimit])

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('playing')
    }
  }, [gameState])

  const spawnBubble = useCallback(() => {
    if (bubbles.length >= levelConfig.maxBubbles) return

    const newBubble: Bubble = {
      id: nextIdRef.current++,
      x: Math.random() * 80 + 10, // 10-90% of width
      y: 110, // Start below the visible area
      radius: Math.random() * 20 + 20, // 20-40px radius
      color: colors[Math.floor(Math.random() * colors.length)],
      velocity: levelConfig.bubbleSpeed * (0.8 + Math.random() * 0.4),
      points: Math.floor((40 - (Math.random() * 20 + 20)) * 2) + 10 // Smaller bubbles worth more
    }

    setBubbles(prev => [...prev, newBubble])
  }, [bubbles.length, levelConfig.maxBubbles, levelConfig.bubbleSpeed, colors])

  const popBubble = useCallback((bubbleId: number) => {
    setBubbles(prev => {
      const bubble = prev.find(b => b.id === bubbleId)
      if (!bubble) return prev

      const now = Date.now()
      const timeSinceLastPop = now - lastPopTime
      
      // Combo system: pop within 1 second for combo
      let multiplier = 1
      if (timeSinceLastPop < 1000) {
        setCombo(c => c + 1)
        multiplier = 1 + (combo * 0.2)
      } else {
        setCombo(0)
      }

      setLastPopTime(now)
      setScore(s => s + Math.floor(bubble.points * multiplier))

      return prev.filter(b => b.id !== bubbleId)
    })
  }, [combo, lastPopTime])

  // Update bubbles positions
  useEffect(() => {
    if (gameState !== 'playing') return

    const updateBubbles = () => {
      setBubbles(prev => prev
        .map(bubble => ({
          ...bubble,
          y: bubble.y - bubble.velocity
        }))
        .filter(bubble => bubble.y > -10) // Remove bubbles that went too high
      )

      animationFrameRef.current = requestAnimationFrame(updateBubbles)
    }

    animationFrameRef.current = requestAnimationFrame(updateBubbles)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState])

  // Spawn bubbles
  useEffect(() => {
    if (gameState !== 'playing') return

    const spawnInterval = () => {
      spawnBubble()
      const nextSpawn = levelConfig.spawnRate * (0.8 + Math.random() * 0.4)
      spawnTimerRef.current = setTimeout(spawnInterval, nextSpawn)
    }

    spawnTimerRef.current = setTimeout(spawnInterval, 1000)

    return () => {
      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current)
      }
    }
  }, [gameState, levelConfig.spawnRate, spawnBubble])

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'playing') return

    countdownTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('gameOver')
          onScore(score)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
    }
  }, [gameState, score, onScore])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold">Score: {score}</div>
            <div className="text-sm text-muted-foreground">
              Target: {levelConfig.targetScore}
            </div>
            {combo > 0 && (
              <div className="text-sm text-yellow-500 font-semibold">
                Combo x{combo + 1}!
              </div>
            )}
          </div>
          <div className="text-right space-y-1">
            <div className="text-xl font-semibold">Time: {timeLeft}s</div>
            <div className="text-sm text-muted-foreground">
              Bubbles: {bubbles.length}/{levelConfig.maxBubbles}
            </div>
          </div>
        </div>

        <div 
          ref={gameAreaRef}
          className="relative h-[500px] bg-gradient-to-b from-blue-100 to-blue-50 rounded-lg overflow-hidden cursor-pointer"
        >
          {gameState === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <Button onClick={startGame} size="lg">
                <Play className="w-5 h-5 mr-2" />
                Start Game
              </Button>
            </div>
          )}

          {gameState === 'paused' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="text-center space-y-4">
                <div className="text-white text-2xl font-bold">Paused</div>
                <Button onClick={togglePause} size="lg">
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
              </div>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="text-center space-y-4 bg-white p-6 rounded-lg">
                <div className="text-2xl font-bold">Game Over!</div>
                <div className="text-xl">Final Score: {score}</div>
                <div className="text-lg">
                  {score >= levelConfig.targetScore ? '⭐ Level Complete!' : 'Try Again!'}
                </div>
                <Button onClick={resetGame} size="lg">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Play Again
                </Button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {bubbles.map(bubble => (
              <motion.div
                key={bubble.id}
                className="absolute cursor-pointer"
                style={{
                  left: `${bubble.x}%`,
                  bottom: `${bubble.y}%`,
                  width: bubble.radius * 2,
                  height: bubble.radius * 2,
                  backgroundColor: bubble.color,
                  borderRadius: '50%',
                  transform: 'translate(-50%, 50%)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: '2px solid rgba(255,255,255,0.5)'
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => popBubble(bubble.id)}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                  {bubble.points}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex gap-2">
          {gameState === 'playing' && (
            <Button onClick={togglePause} variant="outline" className="flex-1">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          <Button onClick={resetGame} variant="outline" className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BubblePop() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const percentage = (score / levelConfig.targetScore) * 100
    if (percentage >= 150) return 3
    if (percentage >= 100) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="bubble-pop"
      gameName="Bubble Pop"
      levels={levels}
      renderGame={(config, onScore) => (
        <BubblePopGame levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}