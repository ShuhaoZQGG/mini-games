'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Play, Star, Target, Timer } from 'lucide-react'

interface Target {
  id: number
  x: number
  y: number
  size: number
  points: number
  speed: number
  direction: number
  lifetime: number
  type: 'normal' | 'bonus' | 'penalty'
}

interface Shot {
  id: number
  x: number
  y: number
  timestamp: number
}

export default function RapidFire() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [targets, setTargets] = useState<Target[]>([])
  const [shots, setShots] = useState<Shot[]>([])
  const [combo, setCombo] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [totalShots, setTotalShots] = useState(0)
  const [hits, setHits] = useState(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const targetIdRef = useRef(0)
  const shotIdRef = useRef(0)

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('rapidFireHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('rapidFireHighScore', score.toString())
    }
  }, [score, highScore])

  const createTarget = useCallback(() => {
    const types: ('normal' | 'bonus' | 'penalty')[] = ['normal', 'normal', 'normal', 'bonus', 'penalty']
    const type = types[Math.floor(Math.random() * types.length)]
    
    const size = type === 'bonus' ? 30 : type === 'penalty' ? 50 : 40
    const points = type === 'bonus' ? 50 : type === 'penalty' ? -25 : 10
    const speed = type === 'bonus' ? 3 : 1.5
    
    return {
      id: targetIdRef.current++,
      x: Math.random() * 340 + 30,
      y: Math.random() * 440 + 30,
      size,
      points,
      speed,
      direction: Math.random() * Math.PI * 2,
      lifetime: type === 'bonus' ? 2000 : 3000,
      type
    }
  }, [])

  const handleShoot = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return
    
    const rect = gameAreaRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setShots(prev => [...prev, {
      id: shotIdRef.current++,
      x,
      y,
      timestamp: Date.now()
    }])
    
    setTotalShots(prev => prev + 1)
    
    // Check if hit any target
    let hitTarget = false
    setTargets(prev => prev.filter(target => {
      const distance = Math.sqrt(
        Math.pow(target.x - x, 2) +
        Math.pow(target.y - y, 2)
      )
      
      if (distance < target.size / 2) {
        hitTarget = true
        setScore(s => s + target.points * (1 + combo * 0.1))
        setHits(h => h + 1)
        
        if (target.type !== 'penalty') {
          setCombo(c => c + 1)
        } else {
          setCombo(0)
        }
        
        return false // Remove target
      }
      return true
    }))
    
    if (!hitTarget) {
      setCombo(0)
    }
    
    // Update accuracy
    if (totalShots > 0) {
      setAccuracy(Math.round((hits / (totalShots + 1)) * 100))
    }
  }, [gameState, combo, hits, totalShots])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setTimeLeft(60)
    setTargets([])
    setShots([])
    setCombo(0)
    setAccuracy(100)
    setTotalShots(0)
    setHits(0)
    targetIdRef.current = 0
    shotIdRef.current = 0
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

    let lastTime = Date.now()
    let targetSpawnTimer = 0
    
    const gameLoop = () => {
      const currentTime = Date.now()
      const deltaTime = currentTime - lastTime
      lastTime = currentTime
      
      // Spawn targets
      targetSpawnTimer += deltaTime
      const spawnRate = Math.max(500, 2000 - score * 2) // Faster spawn as score increases
      if (targetSpawnTimer > spawnRate) {
        targetSpawnTimer = 0
        if (targets.length < 8) {
          setTargets(prev => [...prev, createTarget()])
        }
      }
      
      // Update targets
      setTargets(prev => prev
        .filter(target => currentTime - target.id * 100 < target.lifetime)
        .map(target => {
          const newX = target.x + Math.cos(target.direction) * target.speed
          const newY = target.y + Math.sin(target.direction) * target.speed
          
          let newDirection = target.direction
          if (newX < 30 || newX > 370) newDirection = Math.PI - target.direction
          if (newY < 30 || newY > 470) newDirection = -target.direction
          
          return {
            ...target,
            x: Math.max(30, Math.min(370, newX)),
            y: Math.max(30, Math.min(470, newY)),
            direction: newDirection
          }
        })
      )
      
      // Clean up old shots
      setShots(prev => prev.filter(shot => currentTime - shot.timestamp < 200))
      
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, targets, createTarget, score])

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

  const getStarsEarned = () => {
    if (score >= 1000) return 3
    if (score >= 500) return 2
    if (score >= 200) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          <div className="flex items-center justify-between">
            <span>Rapid Fire</span>
            <div className="flex gap-3 text-sm">
              <span>Score: {score}</span>
              <span>Best: {highScore}</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats bar */}
          {gameState === 'playing' && (
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                <span>{timeLeft}s</span>
              </div>
              <div className="flex gap-4">
                <span>Combo: x{combo}</span>
                <span>Accuracy: {accuracy}%</span>
              </div>
            </div>
          )}

          <div 
            ref={gameAreaRef}
            className="relative w-[400px] h-[500px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden mx-auto cursor-crosshair select-none"
            onMouseDown={handleShoot}
          >
            {/* Grid background */}
            <div className="absolute inset-0 opacity-10">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={`h-${i}`} className="absolute w-full h-px bg-white" style={{ top: `${i * 50}px` }} />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`v-${i}`} className="absolute h-full w-px bg-white" style={{ left: `${i * 50}px` }} />
              ))}
            </div>

            {/* Targets */}
            <AnimatePresence>
              {targets.map(target => (
                <motion.div
                  key={target.id}
                  className={`absolute rounded-full flex items-center justify-center ${
                    target.type === 'bonus' ? 'bg-yellow-500' :
                    target.type === 'penalty' ? 'bg-red-600' : 'bg-blue-500'
                  }`}
                  style={{
                    left: `${target.x - target.size / 2}px`,
                    top: `${target.y - target.size / 2}px`,
                    width: `${target.size}px`,
                    height: `${target.size}px`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {target.type === 'bonus' && <Star className="w-4 h-4 text-white" />}
                  {target.type === 'penalty' && <span className="text-white font-bold">X</span>}
                  {target.type === 'normal' && (
                    <div className="w-2/3 h-2/3 rounded-full bg-white/30" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Shot effects */}
            <AnimatePresence>
              {shots.map(shot => (
                <motion.div
                  key={shot.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${shot.x}px`,
                    top: `${shot.y}px`,
                  }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 3, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-4 h-4 -ml-2 -mt-2 rounded-full bg-white" />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Combo indicator */}
            {combo > 5 && gameState === 'playing' && (
              <motion.div
                className="absolute top-4 left-1/2 transform -translate-x-1/2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <div className="px-4 py-2 bg-orange-500 text-white rounded-full font-bold">
                  COMBO x{combo}!
                </div>
              </motion.div>
            )}

            {/* Game Over Overlay */}
            {gameState === 'gameOver' && (
              <motion.div
                className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="text-3xl font-bold text-white mb-4">Time's Up!</h2>
                <p className="text-xl text-white mb-2">Score: {score}</p>
                <p className="text-lg text-white mb-2">Accuracy: {accuracy}%</p>
                <p className="text-lg text-white mb-4">Hits: {hits}/{totalShots}</p>
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
                <h2 className="text-3xl font-bold text-white mb-4">Rapid Fire</h2>
                <p className="text-white mb-6 text-center px-4">
                  Click on targets to shoot them!<br/>
                  Yellow targets = Bonus points<br/>
                  Red targets = Penalty<br/>
                  Build combos for higher scores!
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
              Click on targets to shoot!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}