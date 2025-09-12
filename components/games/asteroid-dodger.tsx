'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Play, Star, Rocket, Shield } from 'lucide-react'

interface Asteroid {
  id: number
  x: number
  y: number
  size: number
  speed: number
  rotation: number
}

interface PowerUp {
  id: number
  x: number
  y: number
  type: 'shield' | 'slowmo' | 'points'
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

export default function AsteroidDodger() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameOver'>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [shipX, setShipX] = useState(200)
  const [shipY, setShipY] = useState(400)
  const [asteroids, setAsteroids] = useState<Asteroid[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [hasShield, setHasShield] = useState(false)
  const [slowMotion, setSlowMotion] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 200, y: 400 })
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const asteroidIdRef = useRef(0)
  const powerUpIdRef = useRef(0)
  const particleIdRef = useRef(0)

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('asteroidDodgerHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('asteroidDodgerHighScore', score.toString())
    }
  }, [score, highScore])

  const createExplosion = (x: number, y: number) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20
      const speed = Math.random() * 5 + 2
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1
      })
    }
    setParticles(prev => [...prev, ...newParticles])
  }

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setShipX(200)
    setShipY(400)
    setAsteroids([])
    setPowerUps([])
    setParticles([])
    setHasShield(false)
    setSlowMotion(false)
    asteroidIdRef.current = 0
    powerUpIdRef.current = 0
    particleIdRef.current = 0
  }

  const endGame = () => {
    setGameState('gameOver')
    createExplosion(shipX, shipY)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  // Handle mouse/touch movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== 'playing' || !gameAreaRef.current) return
      const rect = gameAreaRef.current.getBoundingClientRect()
      setMousePos({
        x: Math.max(20, Math.min(380, e.clientX - rect.left)),
        y: Math.max(20, Math.min(480, e.clientY - rect.top))
      })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (gameState !== 'playing' || !gameAreaRef.current) return
      e.preventDefault()
      const rect = gameAreaRef.current.getBoundingClientRect()
      const touch = e.touches[0]
      setMousePos({
        x: Math.max(20, Math.min(380, touch.clientX - rect.left)),
        y: Math.max(20, Math.min(480, touch.clientY - rect.top))
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [gameState])

  // Update ship position smoothly
  useEffect(() => {
    if (gameState !== 'playing') return
    
    const smoothing = 0.15
    setShipX(prev => prev + (mousePos.x - prev) * smoothing)
    setShipY(prev => prev + (mousePos.y - prev) * smoothing)
  }, [mousePos, gameState])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    let frameCount = 0
    const gameLoop = () => {
      frameCount++
      const speedMultiplier = slowMotion ? 0.3 : 1

      // Generate asteroids
      if (frameCount % Math.floor(30 / speedMultiplier) === 0) {
        const difficulty = Math.min(1 + score / 500, 5)
        if (Math.random() < 0.3 * difficulty) {
          setAsteroids(prev => [...prev, {
            id: asteroidIdRef.current++,
            x: Math.random() * 400,
            y: -50,
            size: Math.random() * 30 + 20,
            speed: (Math.random() * 3 + 2) * difficulty * speedMultiplier,
            rotation: Math.random() * 360
          }])
        }
      }

      // Generate power-ups
      if (frameCount % 180 === 0 && Math.random() < 0.3) {
        const types: ('shield' | 'slowmo' | 'points')[] = ['shield', 'slowmo', 'points']
        setPowerUps(prev => [...prev, {
          id: powerUpIdRef.current++,
          x: Math.random() * 360 + 20,
          y: -30,
          type: types[Math.floor(Math.random() * types.length)]
        }])
      }

      // Update asteroids
      setAsteroids(prev => prev
        .filter(a => a.y < 550)
        .map(a => ({
          ...a,
          y: a.y + a.speed,
          rotation: a.rotation + 2
        }))
      )

      // Update power-ups
      setPowerUps(prev => prev
        .filter(p => p.y < 530)
        .map(p => ({
          ...p,
          y: p.y + 2 * speedMultiplier
        }))
      )

      // Update particles
      setParticles(prev => prev
        .filter(p => p.life > 0)
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02
        }))
      )

      // Check asteroid collisions
      asteroids.forEach(asteroid => {
        const distance = Math.sqrt(
          Math.pow(asteroid.x - shipX, 2) +
          Math.pow(asteroid.y - shipY, 2)
        )
        if (distance < asteroid.size / 2 + 15) {
          if (hasShield) {
            setHasShield(false)
            setAsteroids(prev => prev.filter(a => a.id !== asteroid.id))
            createExplosion(asteroid.x, asteroid.y)
          } else {
            endGame()
          }
        }
      })

      // Check power-up collection
      setPowerUps(prev => prev.filter(powerUp => {
        const distance = Math.sqrt(
          Math.pow(powerUp.x - shipX, 2) +
          Math.pow(powerUp.y - shipY, 2)
        )
        if (distance < 25) {
          switch (powerUp.type) {
            case 'shield':
              setHasShield(true)
              break
            case 'slowmo':
              setSlowMotion(true)
              setTimeout(() => setSlowMotion(false), 5000)
              break
            case 'points':
              setScore(s => s + 100)
              break
          }
          return false
        }
        return true
      }))

      // Increment score
      setScore(s => s + 1)

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState, shipX, shipY, asteroids, hasShield, slowMotion])

  const getStarsEarned = () => {
    if (score >= 2000) return 3
    if (score >= 1000) return 2
    if (score >= 500) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-between">
          <span>Asteroid Dodger</span>
          <div className="flex gap-3 text-sm">
            <span>Score: {score}</span>
            <span>Best: {highScore}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status indicators */}
          {gameState === 'playing' && (
            <div className="flex justify-center gap-4">
              {hasShield && (
                <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full flex items-center gap-1">
                  <Shield className="w-4 h-4" /> Shield Active
                </span>
              )}
              {slowMotion && (
                <span className="px-3 py-1 bg-purple-500 text-white text-sm rounded-full">
                  Slow Motion
                </span>
              )}
            </div>
          )}

          <div 
            ref={gameAreaRef}
            className="relative w-[400px] h-[500px] bg-gradient-to-b from-purple-900 via-blue-900 to-black rounded-lg overflow-hidden mx-auto cursor-none"
          >
            {/* Stars background */}
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}

            {/* Ship */}
            {gameState !== 'idle' && (
              <motion.div
                className="absolute w-8 h-8 pointer-events-none"
                style={{
                  left: `${shipX - 16}px`,
                  top: `${shipY - 16}px`,
                }}
              >
                <Rocket className={`w-full h-full ${
                  hasShield ? 'text-blue-400' : 'text-white'
                } transform -rotate-45`} />
                {hasShield && (
                  <div className="absolute inset-0 w-12 h-12 -left-2 -top-2 border-2 border-blue-400 rounded-full animate-pulse" />
                )}
              </motion.div>
            )}

            {/* Asteroids */}
            <AnimatePresence>
              {asteroids.map(asteroid => (
                <motion.div
                  key={asteroid.id}
                  className="absolute bg-gray-600 rounded-full"
                  style={{
                    left: `${asteroid.x - asteroid.size / 2}px`,
                    top: `${asteroid.y - asteroid.size / 2}px`,
                    width: `${asteroid.size}px`,
                    height: `${asteroid.size}px`,
                  }}
                  animate={{ rotate: asteroid.rotation }}
                  initial={{ opacity: 0, scale: 0 }}
                  exit={{ opacity: 0, scale: 0 }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-700 rounded-full" />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Power-ups */}
            <AnimatePresence>
              {powerUps.map(powerUp => (
                <motion.div
                  key={powerUp.id}
                  className="absolute w-8 h-8"
                  style={{
                    left: `${powerUp.x - 16}px`,
                    top: `${powerUp.y - 16}px`,
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <div className={`w-full h-full rounded-full flex items-center justify-center ${
                    powerUp.type === 'shield' ? 'bg-blue-500' :
                    powerUp.type === 'slowmo' ? 'bg-purple-500' : 'bg-yellow-500'
                  }`}>
                    {powerUp.type === 'shield' && <Shield className="w-4 h-4 text-white" />}
                    {powerUp.type === 'slowmo' && <span className="text-white text-xs font-bold">S</span>}
                    {powerUp.type === 'points' && <Star className="w-4 h-4 text-white" />}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Particles */}
            <AnimatePresence>
              {particles.map(particle => (
                <motion.div
                  key={particle.id}
                  className="absolute w-2 h-2 bg-orange-400 rounded-full"
                  style={{
                    left: `${particle.x}px`,
                    top: `${particle.y}px`,
                    opacity: particle.life
                  }}
                />
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
                <h2 className="text-3xl font-bold text-white mb-4">Asteroid Dodger</h2>
                <p className="text-white mb-6 text-center px-4">
                  Move your ship to dodge asteroids!<br/>
                  Collect power-ups for special abilities.<br/>
                  Use mouse or touch to control the ship.
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
              Move your mouse or touch to control the ship
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}