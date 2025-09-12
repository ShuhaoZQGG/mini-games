'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Play, Star, Zap } from 'lucide-react'

interface Laser {
  id: number
  x: number
  y: number
  width: number
  height: number
  direction: 'horizontal' | 'vertical'
  active: boolean
  pattern: number[] // on/off pattern timing
  currentIndex: number
}

interface Player {
  x: number
  y: number
  size: number
}

export default function LaserMaze() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver' | 'levelComplete'>('idle')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [player, setPlayer] = useState<Player>({ x: 50, y: 450, size: 20 })
  const [lasers, setLasers] = useState<Laser[]>([])
  const [coins, setCoins] = useState<{ x: number; y: number; collected: boolean }[]>([])
  const [timeLeft, setTimeLeft] = useState(30)
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('laserMazeHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('laserMazeHighScore', score.toString())
    }
  }, [score, highScore])

  const generateLevel = (levelNum: number) => {
    const newLasers: Laser[] = []
    const laserCount = Math.min(3 + levelNum, 10)
    
    for (let i = 0; i < laserCount; i++) {
      const isHorizontal = Math.random() > 0.5
      const pattern = [
        Math.floor(Math.random() * 20) + 10, // on time
        Math.floor(Math.random() * 20) + 10  // off time
      ]
      
      if (isHorizontal) {
        newLasers.push({
          id: i,
          x: 0,
          y: 100 + (i * 50),
          width: 400,
          height: 4,
          direction: 'horizontal',
          active: true,
          pattern,
          currentIndex: 0
        })
      } else {
        newLasers.push({
          id: i,
          x: 50 + (i * 60),
          y: 0,
          width: 4,
          height: 500,
          direction: 'vertical',
          active: true,
          pattern,
          currentIndex: 0
        })
      }
    }
    
    setLasers(newLasers)

    // Generate coins
    const newCoins = []
    for (let i = 0; i < 5; i++) {
      newCoins.push({
        x: Math.random() * 360 + 20,
        y: Math.random() * 400 + 50,
        collected: false
      })
    }
    setCoins(newCoins)
  }

  const startGame = () => {
    setGameState('playing')
    setLevel(1)
    setScore(0)
    setPlayer({ x: 50, y: 450, size: 20 })
    setTimeLeft(30)
    generateLevel(1)
  }

  const nextLevel = () => {
    const newLevel = level + 1
    setLevel(newLevel)
    setGameState('playing')
    setPlayer({ x: 50, y: 450, size: 20 })
    setTimeLeft(30 + newLevel * 5)
    generateLevel(newLevel)
    setScore(score + 100 * level)
  }

  const endGame = () => {
    setGameState('gameOver')
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(e.key.toLowerCase()))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev)
        newKeys.delete(e.key.toLowerCase())
        return newKeys
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    let frameCount = 0
    const gameLoop = () => {
      frameCount++

      // Update player position
      setPlayer(prev => {
        let newX = prev.x
        let newY = prev.y
        const speed = 5

        if (keys.has('arrowleft') || keys.has('a')) newX -= speed
        if (keys.has('arrowright') || keys.has('d')) newX += speed
        if (keys.has('arrowup') || keys.has('w')) newY -= speed
        if (keys.has('arrowdown') || keys.has('s')) newY += speed

        // Keep player in bounds
        newX = Math.max(0, Math.min(380, newX))
        newY = Math.max(0, Math.min(480, newY))

        return { ...prev, x: newX, y: newY }
      })

      // Update laser patterns
      if (frameCount % 30 === 0) { // Update every 0.5 seconds
        setLasers(prev => prev.map(laser => {
          const newIndex = (laser.currentIndex + 1) % laser.pattern.length
          return {
            ...laser,
            active: newIndex === 0,
            currentIndex: newIndex
          }
        }))
      }

      // Check laser collisions
      lasers.forEach(laser => {
        if (!laser.active) return
        
        const playerRight = player.x + player.size
        const playerBottom = player.y + player.size
        const laserRight = laser.x + laser.width
        const laserBottom = laser.y + laser.height

        if (
          player.x < laserRight &&
          playerRight > laser.x &&
          player.y < laserBottom &&
          playerBottom > laser.y
        ) {
          endGame()
        }
      })

      // Check coin collection
      setCoins(prev => prev.map(coin => {
        if (!coin.collected) {
          const distance = Math.sqrt(
            Math.pow(coin.x - (player.x + player.size / 2), 2) +
            Math.pow(coin.y - (player.y + player.size / 2), 2)
          )
          if (distance < 20) {
            setScore(s => s + 50)
            return { ...coin, collected: true }
          }
        }
        return coin
      }))

      // Check if reached goal
      if (player.y < 30 && player.x > 330) {
        setGameState('levelComplete')
        return
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, keys, player, lasers, level])

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
    if (score >= 1500) return 3
    if (score >= 800) return 2
    if (score >= 300) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-between">
          <span>Laser Maze</span>
          <div className="flex gap-4 text-sm">
            <span>Level: {level}</span>
            <span>Score: {score}</span>
            <span>Time: {timeLeft}s</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div 
            ref={gameAreaRef}
            className="relative w-[400px] h-[500px] bg-slate-900 rounded-lg overflow-hidden mx-auto"
          >
            {/* Goal */}
            <div className="absolute top-2 right-2 w-12 h-12 bg-green-500 rounded-full animate-pulse flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>

            {/* Player */}
            {gameState !== 'idle' && (
              <motion.div
                className="absolute bg-blue-500 rounded-full"
                style={{
                  left: `${player.x}px`,
                  top: `${player.y}px`,
                  width: `${player.size}px`,
                  height: `${player.size}px`,
                }}
                animate={{
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)'
                }}
              />
            )}

            {/* Lasers */}
            <AnimatePresence>
              {lasers.map(laser => (
                laser.active && (
                  <motion.div
                    key={laser.id}
                    className="absolute bg-red-500"
                    style={{
                      left: `${laser.x}px`,
                      top: `${laser.y}px`,
                      width: `${laser.width}px`,
                      height: `${laser.height}px`,
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: [0.6, 1, 0.6],
                      boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)'
                    }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )
              ))}
            </AnimatePresence>

            {/* Coins */}
            <AnimatePresence>
              {coins.filter(c => !c.collected).map((coin, index) => (
                <motion.div
                  key={index}
                  className="absolute text-yellow-400"
                  style={{
                    left: `${coin.x}px`,
                    top: `${coin.y}px`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Zap className="w-6 h-6 fill-current" />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Level Complete */}
            {gameState === 'levelComplete' && (
              <motion.div
                className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="text-3xl font-bold text-white mb-4">Level Complete!</h2>
                <p className="text-xl text-white mb-4">Level {level} cleared!</p>
                <Button onClick={nextLevel} size="lg">
                  Continue to Level {level + 1}
                </Button>
              </motion.div>
            )}

            {/* Game Over Overlay */}
            {gameState === 'gameOver' && (
              <motion.div
                className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
                <p className="text-xl text-white mb-2">Score: {score}</p>
                <p className="text-lg text-white mb-2">Level Reached: {level}</p>
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
                <h2 className="text-3xl font-bold text-white mb-4">Laser Maze</h2>
                <p className="text-white mb-6 text-center px-4">
                  Navigate through the laser obstacles!<br/>
                  Use arrow keys or WASD to move.<br/>
                  Reach the green goal to complete the level!
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
              Use Arrow Keys or WASD to move
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}