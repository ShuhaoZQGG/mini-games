'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Pause, Shield, Zap } from 'lucide-react'

const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 600
const BALL_RADIUS = 10
const GRAVITY = 0.5
const JUMP_FORCE = -10
const COLORS = ['#FF0000', '#0000FF', '#FFFF00', '#00FF00'] // Red, Blue, Yellow, Green

interface Ball {
  y: number
  velocity: number
  color: string
  shielded: boolean
}

interface Obstacle {
  y: number
  type: 'circle' | 'line' | 'square' | 'cross'
  rotation: number
  speed: number
  colors: string[]
  passed?: boolean
}

interface PowerUp {
  y: number
  x: number
  type: 'shield' | 'slowmo' | 'colorchange'
  active: boolean
}

interface ColorChanger {
  y: number
  active: boolean
}

interface ColorSwitchGameProps {
  levelConfig: {
    targetScore: number
    obstacleSpeed: number
    obstacleSpacing: number
    powerUpChance: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Easy Mode',
    difficulty: 'easy',
    config: { targetScore: 5, obstacleSpeed: 1, obstacleSpacing: 300, powerUpChance: 0.2 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Normal Speed',
    difficulty: 'medium',
    config: { targetScore: 10, obstacleSpeed: 1.5, obstacleSpacing: 250, powerUpChance: 0.15 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Fast Obstacles',
    difficulty: 'hard',
    config: { targetScore: 15, obstacleSpeed: 2, obstacleSpacing: 200, powerUpChance: 0.1 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Challenge',
    difficulty: 'expert',
    config: { targetScore: 20, obstacleSpeed: 2.5, obstacleSpacing: 180, powerUpChance: 0.08 },
    requiredStars: 8
  },
  {
    id: 5,
    name: 'Master Mode',
    difficulty: 'master',
    config: { targetScore: 30, obstacleSpeed: 3, obstacleSpacing: 150, powerUpChance: 0.05 },
    requiredStars: 12
  }
]

function ColorSwitchGame({ levelConfig, onScore }: ColorSwitchGameProps) {
  const [ball, setBall] = useState<Ball>({
    y: CANVAS_HEIGHT - 100,
    velocity: 0,
    color: COLORS[0],
    shielded: false
  })
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [powerUps, setPowerUps] = useState<PowerUp[]>([])
  const [colorChangers, setColorChangers] = useState<ColorChanger[]>([])
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'gameOver'>('waiting')
  const [cameraY, setCameraY] = useState(0)
  const [slowMotion, setSlowMotion] = useState(false)
  
  const gameLoopRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const animationFrameRef = useRef(0)
  const shieldTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const slowMotionTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Generate obstacle
  const generateObstacle = useCallback((yPosition: number): Obstacle => {
    const types: Obstacle['type'][] = ['circle', 'line', 'square', 'cross']
    const type = types[Math.floor(Math.random() * types.length)]
    const speed = levelConfig.obstacleSpeed + Math.random()
    
    // Ensure each obstacle has all colors
    const colors = [...COLORS]
    
    return {
      y: yPosition,
      type,
      rotation: 0,
      speed,
      colors
    }
  }, [levelConfig.obstacleSpeed])

  // Generate power-up
  const generatePowerUp = useCallback((yPosition: number): PowerUp | null => {
    if (Math.random() > levelConfig.powerUpChance) return null
    
    const types: PowerUp['type'][] = ['shield', 'slowmo', 'colorchange']
    return {
      y: yPosition,
      x: 100 + Math.random() * (CANVAS_WIDTH - 200),
      type: types[Math.floor(Math.random() * types.length)],
      active: true
    }
  }, [levelConfig.powerUpChance])

  // Generate color changer
  const generateColorChanger = useCallback((yPosition: number): ColorChanger => {
    return {
      y: yPosition,
      active: true
    }
  }, [])

  // Initialize game
  const initializeGame = useCallback(() => {
    const initialObstacles: Obstacle[] = []
    const initialPowerUps: PowerUp[] = []
    const initialColorChangers: ColorChanger[] = []
    
    for (let i = 1; i <= 5; i++) {
      const y = CANVAS_HEIGHT - 100 - (i * levelConfig.obstacleSpacing)
      initialObstacles.push(generateObstacle(y))
      
      if (i % 2 === 0) {
        initialColorChangers.push(generateColorChanger(y + levelConfig.obstacleSpacing / 2))
      }
      
      const powerUp = generatePowerUp(y + levelConfig.obstacleSpacing / 3)
      if (powerUp) {
        initialPowerUps.push(powerUp)
      }
    }
    
    return { initialObstacles, initialPowerUps, initialColorChangers }
  }, [generateObstacle, generatePowerUp, generateColorChanger, levelConfig.obstacleSpacing])

  // Check obstacle collision
  const checkObstacleCollision = useCallback((obstacle: Obstacle): boolean => {
    if (ball.shielded) return false
    
    const ballTop = ball.y - BALL_RADIUS
    const ballBottom = ball.y + BALL_RADIUS
    const obstacleTop = obstacle.y - 10
    const obstacleBottom = obstacle.y + 10
    
    // Check if ball is at obstacle height
    if (ballBottom < obstacleTop || ballTop > obstacleBottom) {
      return false
    }
    
    // Check color match based on obstacle type
    const angle = obstacle.rotation % (Math.PI * 2)
    const segmentAngle = (Math.PI * 2) / 4
    const colorIndex = Math.floor(angle / segmentAngle) % 4
    const currentColor = obstacle.colors[colorIndex]
    
    // For simplicity, check if ball color matches any color in the obstacle
    // In real implementation, this would check the specific segment
    const hasMatchingColor = obstacle.colors.includes(ball.color)
    
    // Collision occurs if colors don't match at the collision point
    return !hasMatchingColor
  }, [ball])

  // Update ball physics
  const updateBall = useCallback(() => {
    setBall(prev => {
      const newVelocity = prev.velocity + GRAVITY * (slowMotion ? 0.5 : 1)
      const newY = prev.y + newVelocity
      
      // Game over if ball falls off screen
      if (newY > CANVAS_HEIGHT + 100) {
        setGameState('gameOver')
        onScore(score)
        return prev
      }
      
      return {
        ...prev,
        y: newY,
        velocity: newVelocity
      }
    })
  }, [slowMotion, score, onScore])

  // Update obstacles
  const updateObstacles = useCallback(() => {
    setObstacles(prevObstacles => {
      const updatedObstacles = prevObstacles.map(obstacle => ({
        ...obstacle,
        rotation: obstacle.rotation + obstacle.speed * 0.02 * (slowMotion ? 0.5 : 1)
      }))
      
      // Add new obstacles as player moves up
      const highestObstacle = Math.min(...updatedObstacles.map(o => o.y))
      if (highestObstacle > cameraY - 200) {
        const newY = highestObstacle - levelConfig.obstacleSpacing
        updatedObstacles.push(generateObstacle(newY))
        
        // Add color changer between obstacles
        if (Math.random() > 0.5) {
          setColorChangers(prev => [...prev, generateColorChanger(newY + levelConfig.obstacleSpacing / 2)])
        }
        
        // Add power-up
        const powerUp = generatePowerUp(newY + levelConfig.obstacleSpacing / 3)
        if (powerUp) {
          setPowerUps(prev => [...prev, powerUp])
        }
      }
      
      // Remove obstacles that are too far below
      return updatedObstacles.filter(obstacle => obstacle.y < cameraY + CANVAS_HEIGHT + 200)
    })
  }, [cameraY, slowMotion, generateObstacle, generateColorChanger, generatePowerUp, levelConfig.obstacleSpacing])

  // Check collisions
  const checkCollisions = useCallback(() => {
    // Check obstacle collisions
    obstacles.forEach((obstacle, index) => {
      if (checkObstacleCollision(obstacle)) {
        setGameState('gameOver')
        onScore(score)
      }
      
      // Score when passing an obstacle
      if (obstacle.y > ball.y + 20 && !obstacle.passed) {
        setScore(prev => prev + 1)
        setObstacles(prev => {
          const updated = [...prev]
          updated[index] = { ...updated[index], passed: true }
          return updated
        })
      }
    })
    
    // Check color changer collisions
    setColorChangers(prevChangers => {
      return prevChangers.map(changer => {
        if (!changer.active) return changer
        
        const distance = Math.abs(ball.y - changer.y)
        if (distance < 20) {
          const newColor = COLORS[Math.floor(Math.random() * COLORS.length)]
          setBall(prev => ({ ...prev, color: newColor }))
          return { ...changer, active: false }
        }
        return changer
      })
    })
    
    // Check power-up collisions
    setPowerUps(prevPowerUps => {
      return prevPowerUps.map(powerUp => {
        if (!powerUp.active) return powerUp
        
        const distanceY = Math.abs(ball.y - powerUp.y)
        const distanceX = Math.abs(CANVAS_WIDTH / 2 - powerUp.x)
        
        if (distanceY < 20 && distanceX < 30) {
          switch (powerUp.type) {
            case 'shield':
              setBall(prev => ({ ...prev, shielded: true }))
              if (shieldTimerRef.current) clearTimeout(shieldTimerRef.current)
              shieldTimerRef.current = setTimeout(() => {
                setBall(prev => ({ ...prev, shielded: false }))
              }, 3000)
              break
            case 'slowmo':
              setSlowMotion(true)
              if (slowMotionTimerRef.current) clearTimeout(slowMotionTimerRef.current)
              slowMotionTimerRef.current = setTimeout(() => {
                setSlowMotion(false)
              }, 3000)
              break
            case 'colorchange':
              // Change to next obstacle's color
              const nextObstacle = obstacles.find(o => o.y < ball.y)
              if (nextObstacle) {
                setBall(prev => ({
                  ...prev,
                  color: nextObstacle.colors[0]
                }))
              }
              break
          }
          
          return { ...powerUp, active: false }
        }
        return powerUp
      })
    })
  }, [ball, obstacles, checkObstacleCollision, score, onScore])

  // Update camera
  const updateCamera = useCallback(() => {
    const targetY = ball.y - CANVAS_HEIGHT / 2
    if (targetY < cameraY) {
      setCameraY(targetY)
    }
  }, [ball.y, cameraY])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        animationFrameRef.current++
        
        updateBall()
        updateObstacles()
        checkCollisions()
        updateCamera()
      }, 1000 / 60) // 60 FPS
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState, updateBall, updateObstacles, checkCollisions, updateCamera])

  // Handle jump
  const handleJump = useCallback(() => {
    if (gameState === 'playing') {
      setBall(prev => ({
        ...prev,
        velocity: JUMP_FORCE * (slowMotion ? 0.7 : 1)
      }))
    }
  }, [gameState, slowMotion])

  // Keyboard and touch controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault()
        handleJump()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleJump])

  const startGame = () => {
    const { initialObstacles, initialPowerUps, initialColorChangers } = initializeGame()
    
    setBall({
      y: CANVAS_HEIGHT - 100,
      velocity: 0,
      color: COLORS[0],
      shielded: false
    })
    setObstacles(initialObstacles)
    setPowerUps(initialPowerUps)
    setColorChangers(initialColorChangers)
    setScore(0)
    setCameraY(0)
    setSlowMotion(false)
    animationFrameRef.current = 0
    setGameState('playing')
  }

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('playing')
    }
  }

  const resetGame = () => {
    setGameState('waiting')
    if (shieldTimerRef.current) clearTimeout(shieldTimerRef.current)
    if (slowMotionTimerRef.current) clearTimeout(slowMotionTimerRef.current)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="text-2xl font-bold">Score: {score}</div>
          <div className="text-lg text-muted-foreground">
            Target: {levelConfig.targetScore}
          </div>
          <div className="flex gap-2">
            {ball.shielded && (
              <div className="flex items-center gap-1 text-blue-500">
                <Shield className="w-4 h-4" />
                Shield
              </div>
            )}
            {slowMotion && (
              <div className="flex items-center gap-1 text-purple-500">
                <Zap className="w-4 h-4" />
                Slow-Mo
              </div>
            )}
          </div>
        </div>

        <div 
          className="relative bg-black mx-auto cursor-pointer overflow-hidden"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          onClick={handleJump}
        >
          {/* Render game elements */}
          <div style={{ transform: `translateY(${-cameraY}px)` }}>
            {/* Ball */}
            <div
              className="absolute rounded-full transition-all"
              style={{
                left: CANVAS_WIDTH / 2 - BALL_RADIUS,
                top: ball.y - BALL_RADIUS,
                width: BALL_RADIUS * 2,
                height: BALL_RADIUS * 2,
                backgroundColor: ball.color,
                border: ball.shielded ? '2px solid #3B82F6' : 'none',
                boxShadow: ball.shielded ? '0 0 10px #3B82F6' : 'none'
              }}
            />
            
            {/* Obstacles */}
            {obstacles.map((obstacle, index) => (
              <div
                key={index}
                className="absolute"
                style={{
                  left: CANVAS_WIDTH / 2 - 50,
                  top: obstacle.y - 50,
                  width: 100,
                  height: 100,
                  transform: `rotate(${obstacle.rotation}rad)`
                }}
              >
                {/* Simplified obstacle rendering */}
                <svg width="100" height="100">
                  {obstacle.colors.map((color, i) => (
                    <rect
                      key={i}
                      x={i * 25}
                      y="40"
                      width="25"
                      height="20"
                      fill={color}
                    />
                  ))}
                </svg>
              </div>
            ))}
            
            {/* Color Changers */}
            {colorChangers.map((changer, index) => (
              changer.active && (
                <div
                  key={index}
                  className="absolute rounded-full"
                  style={{
                    left: CANVAS_WIDTH / 2 - 10,
                    top: changer.y - 10,
                    width: 20,
                    height: 20,
                    background: `conic-gradient(${COLORS.join(', ')})`,
                    animation: 'spin 2s linear infinite'
                  }}
                />
              )
            ))}
            
            {/* Power-ups */}
            {powerUps.map((powerUp, index) => (
              powerUp.active && (
                <div
                  key={index}
                  className="absolute rounded-full flex items-center justify-center"
                  style={{
                    left: powerUp.x - 15,
                    top: powerUp.y - 15,
                    width: 30,
                    height: 30,
                    backgroundColor: powerUp.type === 'shield' ? '#3B82F6' : 
                                   powerUp.type === 'slowmo' ? '#8B5CF6' : '#10B981',
                    animation: 'pulse 1s infinite'
                  }}
                >
                  {powerUp.type === 'shield' && <Shield className="w-4 h-4 text-white" />}
                  {powerUp.type === 'slowmo' && <Zap className="w-4 h-4 text-white" />}
                  {powerUp.type === 'colorchange' && (
                    <div className="w-3 h-3 rounded-full bg-white" />
                  )}
                </div>
              )
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2 justify-center">
          {gameState === 'waiting' && (
            <Button onClick={startGame} className="gap-2">
              <Play className="w-4 h-4" />
              Start Game
            </Button>
          )}
          
          {(gameState === 'playing' || gameState === 'paused') && (
            <>
              <Button onClick={togglePause} variant="outline" className="gap-2">
                <Pause className="w-4 h-4" />
                {gameState === 'paused' ? 'Resume' : 'Pause'}
              </Button>
              <Button onClick={resetGame} variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </>
          )}
          
          {gameState === 'gameOver' && (
            <div className="text-center">
              <p className="text-xl mb-4">Game Over! Final Score: {score}</p>
              <Button onClick={startGame} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Click or press Space/Up/W to jump
        </div>
      </CardContent>
    </Card>
  )
}

export default function ColorSwitchWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const percentage = (score / levelConfig.targetScore) * 100
    if (percentage >= 100) return 3
    if (percentage >= 70) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="color-switch"
      gameName="Color Switch"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <ColorSwitchGame levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}