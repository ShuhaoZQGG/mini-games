'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Play, Star, Car, Fuel } from 'lucide-react'

interface Car {
  x: number
  y: number
  lane: number
}

interface Obstacle {
  lane: number
  y: number
  type: 'car' | 'barrier'
}

interface PowerUp {
  lane: number
  y: number
  type: 'fuel' | 'boost' | 'shield'
  collected: boolean
}

export default function SpeedRacer() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [playerLane, setPlayerLane] = useState(1) // 0, 1, 2 (three lanes)
  const [speed, setSpeed] = useState(5)
  const [fuel, setFuel] = useState(100)
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [hasShield, setHasShield] = useState(false)
  const [isBoosting, setIsBoosting] = useState(false)
  const [distance, setDistance] = useState(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  const lanes = [100, 200, 300] // X positions for lanes

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('speedRacerHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('speedRacerHighScore', score.toString())
    }
  }, [score, highScore])

  const changeLane = useCallback((direction: 'left' | 'right') => {
    if (gameState !== 'playing') return
    
    setPlayerLane(prev => {
      if (direction === 'left') {
        return Math.max(0, prev - 1)
      } else {
        return Math.min(2, prev + 1)
      }
    })
  }, [gameState])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setPlayerLane(1)
    setSpeed(5)
    setFuel(100)
    setObstacles([])
    setPowerUps([])
    setHasShield(false)
    setIsBoosting(false)
    setDistance(0)
  }

  const endGame = () => {
    setGameState('gameOver')
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return
      
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        changeLane('left')
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        changeLane('right')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, changeLane])

  // Handle touch controls
  const handleTouch = useCallback((e: React.TouchEvent) => {
    if (gameState !== 'playing') return
    
    const touch = e.touches[0]
    const rect = gameAreaRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = touch.clientX - rect.left
    const centerX = rect.width / 2
    
    if (x < centerX) {
      changeLane('left')
    } else {
      changeLane('right')
    }
  }, [gameState, changeLane])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    let frameCount = 0
    const gameLoop = () => {
      frameCount++
      
      // Update speed based on distance
      const newSpeed = Math.min(5 + Math.floor(distance / 500), 15)
      setSpeed(newSpeed)
      
      // Update distance and score
      setDistance(d => d + 1)
      setScore(s => s + (isBoosting ? 2 : 1))
      
      // Consume fuel
      if (frameCount % 30 === 0) {
        setFuel(f => {
          const newFuel = f - (isBoosting ? 2 : 1)
          if (newFuel <= 0) {
            endGame()
            return 0
          }
          return newFuel
        })
      }
      
      // Generate obstacles
      setObstacles(prev => {
        const filtered = prev.filter(o => o.y < 600)
        if (Math.random() < 0.03 && (filtered.length === 0 || filtered[filtered.length - 1].y > 150)) {
          const lane = Math.floor(Math.random() * 3)
          filtered.push({
            lane,
            y: -60,
            type: Math.random() > 0.7 ? 'barrier' : 'car'
          })
        }
        return filtered.map(o => ({ ...o, y: o.y + speed }))
      })
      
      // Generate power-ups
      setPowerUps(prev => {
        const filtered = prev.filter(p => p.y < 600 && !p.collected)
        if (Math.random() < 0.01 && (filtered.length === 0 || filtered[filtered.length - 1].y > 200)) {
          const lane = Math.floor(Math.random() * 3)
          const types: ('fuel' | 'boost' | 'shield')[] = ['fuel', 'boost', 'shield']
          filtered.push({
            lane,
            y: -30,
            type: types[Math.floor(Math.random() * types.length)],
            collected: false
          })
        }
        return filtered.map(p => ({ ...p, y: p.y + speed }))
      })
      
      // Check collisions
      obstacles.forEach(obstacle => {
        if (
          obstacle.lane === playerLane &&
          obstacle.y > 350 &&
          obstacle.y < 450
        ) {
          if (hasShield) {
            setHasShield(false)
            setObstacles(prev => prev.filter(o => o !== obstacle))
          } else {
            endGame()
          }
        }
      })
      
      // Check power-up collection
      setPowerUps(prev => prev.map(powerUp => {
        if (
          !powerUp.collected &&
          powerUp.lane === playerLane &&
          powerUp.y > 350 &&
          powerUp.y < 450
        ) {
          switch (powerUp.type) {
            case 'fuel':
              setFuel(f => Math.min(100, f + 30))
              break
            case 'boost':
              setIsBoosting(true)
              setTimeout(() => setIsBoosting(false), 3000)
              break
            case 'shield':
              setHasShield(true)
              break
          }
          return { ...powerUp, collected: true }
        }
        return powerUp
      }))
      
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, playerLane, speed, hasShield, isBoosting, distance])

  const getStarsEarned = () => {
    if (score >= 3000) return 3
    if (score >= 1500) return 2
    if (score >= 500) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-between">
          <span>Speed Racer</span>
          <div className="flex gap-3 text-sm">
            <span>Score: {score}</span>
            <span>Best: {highScore}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Bar */}
          {gameState === 'playing' && (
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4" />
                <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      fuel > 30 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${fuel}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {hasShield && (
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">Shield</span>
                )}
                {isBoosting && (
                  <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded">Boost!</span>
                )}
              </div>
            </div>
          )}

          <div 
            ref={gameAreaRef}
            className="relative w-[400px] h-[500px] bg-gray-800 rounded-lg overflow-hidden mx-auto"
            onTouchStart={handleTouch}
          >
            {/* Road lanes */}
            <div className="absolute inset-0">
              <div className="absolute left-[133px] top-0 bottom-0 w-1 bg-white/30" />
              <div className="absolute left-[266px] top-0 bottom-0 w-1 bg-white/30" />
              
              {/* Animated road markings */}
              {[0, 100, 200, 300, 400, 500].map((y, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 -translate-x-1/2 w-4 h-16 bg-white/50"
                  animate={{ y: [y - 100, y + 500] }}
                  transition={{ 
                    duration: 2 / (speed / 5),
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              ))}
            </div>

            {/* Player car */}
            {gameState !== 'idle' && (
              <motion.div
                className={`absolute bottom-20 w-12 h-16 ${
                  hasShield ? 'border-2 border-blue-400' : ''
                }`}
                animate={{ x: lanes[playerLane] - 25 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className={`w-full h-full ${
                  isBoosting ? 'bg-orange-500' : 'bg-blue-500'
                } rounded`}>
                  <Car className="w-full h-full p-2 text-white" />
                </div>
              </motion.div>
            )}

            {/* Obstacles */}
            <AnimatePresence>
              {obstacles.map((obstacle, index) => (
                <motion.div
                  key={index}
                  className={`absolute w-12 h-16 ${
                    obstacle.type === 'car' ? 'bg-red-600' : 'bg-yellow-600'
                  } rounded`}
                  style={{
                    left: `${lanes[obstacle.lane] - 25}px`,
                    top: `${obstacle.y}px`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {obstacle.type === 'car' && <Car className="w-full h-full p-2 text-white" />}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Power-ups */}
            <AnimatePresence>
              {powerUps.filter(p => !p.collected).map((powerUp, index) => (
                <motion.div
                  key={index}
                  className="absolute w-10 h-10"
                  style={{
                    left: `${lanes[powerUp.lane] - 20}px`,
                    top: `${powerUp.y}px`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <div className={`w-full h-full rounded-full flex items-center justify-center ${
                    powerUp.type === 'fuel' ? 'bg-green-500' :
                    powerUp.type === 'boost' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {powerUp.type === 'fuel' && <Fuel className="w-5 h-5 text-white" />}
                    {powerUp.type === 'boost' && <span className="text-white font-bold">B</span>}
                    {powerUp.type === 'shield' && <span className="text-white font-bold">S</span>}
                  </div>
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
                <p className="text-lg text-white mb-2">Distance: {distance}m</p>
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
                <h2 className="text-3xl font-bold text-white mb-4">Speed Racer</h2>
                <p className="text-white mb-6 text-center px-4">
                  Dodge obstacles and collect power-ups!<br/>
                  Use Arrow Keys or A/D to change lanes<br/>
                  Keep an eye on your fuel!
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
              Tap left/right or use Arrow Keys to change lanes
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}