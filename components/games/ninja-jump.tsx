'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Play, Pause, Star } from 'lucide-react'

interface Wall {
  side: 'left' | 'right'
  y: number
  height: number
}

interface Obstacle {
  y: number
  side: 'left' | 'right'
  type: 'spike' | 'blade'
}

export default function NinjaJump() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [ninjaY, setNinjaY] = useState(400)
  const [ninjaX, setNinjaX] = useState(150) // 150 for left wall, 250 for right wall
  const [ninjaSide, setNinjaSide] = useState<'left' | 'right'>('left')
  const [velocity, setVelocity] = useState(0)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [stars, setStars] = useState<{ y: number; collected: boolean }[]>([])
  const [isJumping, setIsJumping] = useState(false)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef<number>(0)

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('ninjaJumpHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('ninjaJumpHighScore', score.toString())
    }
  }, [score, highScore])

  const jump = useCallback(() => {
    if (gameState !== 'playing' || isJumping) return
    
    setIsJumping(true)
    const newSide = ninjaSide === 'left' ? 'right' : 'left'
    setNinjaSide(newSide)
    setNinjaX(newSide === 'left' ? 150 : 250)
    setVelocity(-15) // Jump velocity
    
    setTimeout(() => setIsJumping(false), 300)
  }, [gameState, ninjaSide, isJumping])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setNinjaY(400)
    setNinjaX(150)
    setNinjaSide('left')
    setVelocity(0)
    setObstacles([])
    setStars([])
    setIsJumping(false)
    lastTimeRef.current = 0
  }

  const endGame = () => {
    setGameState('gameOver')
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const deltaTime = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      // Update ninja position
      setVelocity(v => v + 0.8) // Gravity
      setNinjaY(y => {
        const newY = y + velocity
        if (newY > 500) {
          endGame()
          return y
        }
        return Math.max(0, newY)
      })

      // Generate obstacles
      setObstacles(prev => {
        const filtered = prev.filter(o => o.y < 600)
        if (Math.random() < 0.02 && (filtered.length === 0 || filtered[filtered.length - 1].y > 150)) {
          filtered.push({
            y: -50,
            side: Math.random() > 0.5 ? 'left' : 'right',
            type: Math.random() > 0.5 ? 'spike' : 'blade'
          })
        }
        return filtered.map(o => ({ ...o, y: o.y + 3 }))
      })

      // Generate stars
      setStars(prev => {
        const filtered = prev.filter(s => s.y < 600 && !s.collected)
        if (Math.random() < 0.01 && (filtered.length === 0 || filtered[filtered.length - 1].y > 200)) {
          filtered.push({
            y: -30,
            collected: false
          })
        }
        return filtered.map(s => ({ ...s, y: s.y + 3 }))
      })

      // Check collisions with obstacles
      obstacles.forEach(obstacle => {
        if (
          Math.abs(obstacle.y - ninjaY) < 30 &&
          obstacle.side === ninjaSide
        ) {
          endGame()
        }
      })

      // Check star collection
      setStars(prev => prev.map(star => {
        if (
          !star.collected &&
          Math.abs(star.y - ninjaY) < 30 &&
          Math.abs(200 - ninjaX) < 40
        ) {
          setScore(s => s + 10)
          return { ...star, collected: true }
        }
        return star
      }))

      // Increment score for survival
      setScore(s => s + 1)

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, velocity, ninjaY, ninjaX, ninjaSide, obstacles])

  // Handle keyboard and touch controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        jump()
      }
    }

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault()
      jump()
    }

    if (gameState === 'playing') {
      window.addEventListener('keydown', handleKeyPress)
      window.addEventListener('touchstart', handleTouch)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('touchstart', handleTouch)
    }
  }, [gameState, jump])

  const getStarsEarned = () => {
    if (score >= 1000) return 3
    if (score >= 500) return 2
    if (score >= 200) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-between">
          <span>Ninja Jump</span>
          <div className="flex gap-2 text-sm">
            <span>Score: {score}</span>
            <span>Best: {highScore}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div 
            ref={gameAreaRef}
            className="relative w-full h-[500px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg overflow-hidden cursor-pointer"
            onClick={jump}
          >
            {/* Walls */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-stone-700 border-r-4 border-stone-800" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-stone-700 border-l-4 border-stone-800" />

            {/* Ninja */}
            {gameState !== 'idle' && (
              <motion.div
                className="absolute w-8 h-8 bg-slate-900 rounded"
                style={{
                  left: `${ninjaX - 16}px`,
                  top: `${ninjaY - 16}px`,
                }}
                animate={{
                  rotate: isJumping ? (ninjaSide === 'right' ? 360 : -360) : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-800 rounded shadow-lg" />
              </motion.div>
            )}

            {/* Obstacles */}
            <AnimatePresence>
              {obstacles.map((obstacle, index) => (
                <motion.div
                  key={index}
                  className={`absolute w-12 h-6 ${
                    obstacle.type === 'spike' 
                      ? 'bg-red-600 clip-triangle' 
                      : 'bg-gray-400 rounded'
                  }`}
                  style={{
                    [obstacle.side]: '8px',
                    top: `${obstacle.y}px`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              ))}
            </AnimatePresence>

            {/* Stars */}
            <AnimatePresence>
              {stars.filter(s => !s.collected).map((star, index) => (
                <motion.div
                  key={index}
                  className="absolute text-yellow-400"
                  style={{
                    left: '184px',
                    top: `${star.y}px`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="w-8 h-8 fill-current" />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Game Over Overlay */}
            {gameState === 'gameOver' && (
              <motion.div
                className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
                <p className="text-xl text-white mb-2">Score: {score}</p>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 ${
                        star <= getStarsEarned()
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-600 text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <Button onClick={startGame} size="lg">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Play Again
                </Button>
              </motion.div>
            )}

            {/* Start Screen */}
            {gameState === 'idle' && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                <h2 className="text-3xl font-bold text-white mb-4">Ninja Jump</h2>
                <p className="text-white mb-6 text-center px-4">
                  Tap or press Space to jump between walls!<br/>
                  Avoid obstacles and collect stars!
                </p>
                <Button onClick={startGame} size="lg">
                  <Play className="mr-2 h-4 w-4" />
                  Start Game
                </Button>
              </div>
            )}
          </div>

          {gameState === 'playing' && (
            <div className="text-center text-sm text-muted-foreground">
              Tap screen or press Space to jump!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}