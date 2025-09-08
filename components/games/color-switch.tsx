'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

export default function ColorSwitchGame() {
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
  const [difficulty, setDifficulty] = useState(1)
  
  const gameLoopRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const animationFrameRef = useRef(0)
  const shieldTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const slowMotionTimerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Generate obstacle
  const generateObstacle = useCallback((yPosition: number): Obstacle => {
    const types: Obstacle['type'][] = ['circle', 'line', 'square', 'cross']
    const type = types[Math.floor(Math.random() * types.length)]
    const speed = 1 + Math.random() * difficulty
    
    // Ensure each obstacle has all colors
    const colors = [...COLORS]
    
    return {
      y: yPosition,
      type,
      rotation: 0,
      speed,
      colors
    }
  }, [difficulty])

  // Generate power-up
  const generatePowerUp = useCallback((yPosition: number): PowerUp | null => {
    if (Math.random() > 0.1) return null // 10% chance
    
    const types: PowerUp['type'][] = ['shield', 'slowmo', 'colorchange']
    return {
      y: yPosition,
      x: 100 + Math.random() * (CANVAS_WIDTH - 200),
      type: types[Math.floor(Math.random() * types.length)],
      active: true
    }
  }, [])

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
      initialObstacles.push(generateObstacle(CANVAS_HEIGHT - 200 * i))
      
      if (i % 2 === 0) {
        initialColorChangers.push(generateColorChanger(CANVAS_HEIGHT - 200 * i + 100))
      }
      
      const powerUp = generatePowerUp(CANVAS_HEIGHT - 200 * i - 50)
      if (powerUp) initialPowerUps.push(powerUp)
    }
    
    return { initialObstacles, initialPowerUps, initialColorChangers }
  }, [generateObstacle, generatePowerUp, generateColorChanger])

  // Check collision with obstacle
  const checkObstacleCollision = useCallback((ball: Ball, obstacle: Obstacle): boolean => {
    if (ball.shielded) return false
    
    const relativeY = Math.abs(ball.y - obstacle.y)
    if (relativeY > 30) return false // Too far away
    
    // Calculate which segment of the obstacle the ball is hitting
    const angle = (obstacle.rotation % 360) * Math.PI / 180
    
    switch (obstacle.type) {
      case 'circle': {
        // Circle obstacle divided into 4 colored segments
        const ballAngle = Math.atan2(0, 0) + angle
        const segmentAngle = (Math.PI * 2) / 4
        const segmentIndex = Math.floor(((ballAngle + Math.PI * 2) % (Math.PI * 2)) / segmentAngle)
        const segmentColor = obstacle.colors[segmentIndex]
        
        if (relativeY < 20 && ball.color !== segmentColor) {
          return true
        }
        break
      }
      
      case 'line': {
        // Horizontal line with 4 colored segments
        const segmentWidth = CANVAS_WIDTH / 4
        const ballX = CANVAS_WIDTH / 2 // Ball is always in center
        const segmentIndex = Math.floor(ballX / segmentWidth)
        const segmentColor = obstacle.colors[segmentIndex]
        
        if (relativeY < 5 && ball.color !== segmentColor) {
          return true
        }
        break
      }
      
      case 'square': {
        // Square obstacle with 4 colored sides
        const sideIndex = Math.floor(((obstacle.rotation % 360) / 90))
        const sideColor = obstacle.colors[sideIndex % 4]
        
        if (relativeY < 25 && ball.color !== sideColor) {
          return true
        }
        break
      }
      
      case 'cross': {
        // Cross with 4 colored arms
        const armAngle = ((obstacle.rotation % 360) + 45) % 360
        const armIndex = Math.floor(armAngle / 90)
        const armColor = obstacle.colors[armIndex]
        
        if (relativeY < 15 && ball.color !== armColor) {
          return true
        }
        break
      }
    }
    
    return false
  }, [])

  // Update ball physics
  const updateBall = useCallback(() => {
    setBall(current => {
      const newVelocity = current.velocity + GRAVITY * (slowMotion ? 0.3 : 1)
      const newY = current.y + newVelocity * (slowMotion ? 0.3 : 1)
      
      // Check if ball fell off screen
      if (newY > cameraY + CANVAS_HEIGHT) {
        setGameState('gameOver')
        return current
      }
      
      return {
        ...current,
        y: newY,
        velocity: newVelocity
      }
    })
  }, [cameraY, slowMotion])

  // Update obstacles
  const updateObstacles = useCallback(() => {
    setObstacles(current => {
      const updated = current.map(obstacle => ({
        ...obstacle,
        rotation: obstacle.rotation + obstacle.speed * (slowMotion ? 0.3 : 1)
      }))
      
      // Remove obstacles that are too far below
      const filtered = updated.filter(o => o.y < cameraY + CANVAS_HEIGHT + 200)
      
      // Add new obstacles as player progresses
      const highest = Math.min(...filtered.map(o => o.y))
      if (highest > cameraY - 400) {
        filtered.push(generateObstacle(highest - 200))
        
        // Occasionally add color changer
        if (Math.random() < 0.5) {
          setColorChangers(prev => [...prev, generateColorChanger(highest - 100)])
        }
        
        // Occasionally add power-up
        const powerUp = generatePowerUp(highest - 150)
        if (powerUp) {
          setPowerUps(prev => [...prev, powerUp])
        }
      }
      
      return filtered
    })
  }, [cameraY, slowMotion, generateObstacle, generateColorChanger, generatePowerUp])

  // Check collisions
  const checkCollisions = useCallback(() => {
    // Check obstacle collisions
    for (const obstacle of obstacles) {
      if (checkObstacleCollision(ball, obstacle)) {
        if (!ball.shielded) {
          setGameState('gameOver')
          return
        }
      }
      
      // Check if passed obstacle for scoring
      if (ball.y < obstacle.y - 30 && ball.y > obstacle.y - 35) {
        setScore(prev => prev + 1)
        setDifficulty(prev => Math.min(prev + 0.1, 5))
      }
    }
    
    // Check color changer collisions
    setColorChangers(current => {
      return current.map(changer => {
        if (changer.active && Math.abs(ball.y - changer.y) < 20) {
          // Change ball color randomly
          const availableColors = COLORS.filter(c => c !== ball.color)
          setBall(prev => ({
            ...prev,
            color: availableColors[Math.floor(Math.random() * availableColors.length)]
          }))
          return { ...changer, active: false }
        }
        return changer
      })
    })
    
    // Check power-up collisions
    setPowerUps(current => {
      return current.map(powerUp => {
        if (powerUp.active && 
            Math.abs(ball.y - powerUp.y) < 20 &&
            Math.abs(CANVAS_WIDTH / 2 - powerUp.x) < 30) {
          
          switch (powerUp.type) {
            case 'shield':
              setBall(prev => ({ ...prev, shielded: true }))
              if (shieldTimerRef.current) clearTimeout(shieldTimerRef.current)
              shieldTimerRef.current = setTimeout(() => {
                setBall(prev => ({ ...prev, shielded: false }))
              }, 5000)
              break
              
            case 'slowmo':
              setSlowMotion(true)
              if (slowMotionTimerRef.current) clearTimeout(slowMotionTimerRef.current)
              slowMotionTimerRef.current = setTimeout(() => {
                setSlowMotion(false)
              }, 3000)
              break
              
            case 'colorchange':
              // Instantly change to a safe color for next obstacle
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
  }, [ball, obstacles, checkObstacleCollision])

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
    setDifficulty(1)
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
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current)
    }
    if (shieldTimerRef.current) {
      clearTimeout(shieldTimerRef.current)
    }
    if (slowMotionTimerRef.current) {
      clearTimeout(slowMotionTimerRef.current)
    }
  }

  // Save high score
  useEffect(() => {
    if (gameState === 'gameOver') {
      const highScore = localStorage.getItem('color-switch-high-score')
      if (!highScore || score > parseInt(highScore)) {
        localStorage.setItem('color-switch-high-score', score.toString())
      }
    }
  }, [gameState, score])

  const highScore = typeof window !== 'undefined' 
    ? localStorage.getItem('color-switch-high-score') || '0'
    : '0'

  // Render obstacle
  const renderObstacle = (obstacle: Obstacle, index: number) => {
    const y = obstacle.y - cameraY
    if (y < -100 || y > CANVAS_HEIGHT + 100) return null
    
    switch (obstacle.type) {
      case 'circle':
        return (
          <g key={index} transform={`translate(${CANVAS_WIDTH / 2}, ${y}) rotate(${obstacle.rotation})`}>
            {obstacle.colors.map((color, i) => (
              <path
                key={i}
                d={`M 0,0 L ${40 * Math.cos(i * Math.PI / 2)},${40 * Math.sin(i * Math.PI / 2)} A 40,40 0 0,1 ${40 * Math.cos((i + 1) * Math.PI / 2)},${40 * Math.sin((i + 1) * Math.PI / 2)} Z`}
                fill={color}
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </g>
        )
        
      case 'line':
        return (
          <g key={index}>
            {obstacle.colors.map((color, i) => (
              <rect
                key={i}
                x={i * (CANVAS_WIDTH / 4)}
                y={y - 5}
                width={CANVAS_WIDTH / 4}
                height={10}
                fill={color}
                stroke="white"
                strokeWidth="1"
              />
            ))}
          </g>
        )
        
      case 'square':
        return (
          <g key={index} transform={`translate(${CANVAS_WIDTH / 2}, ${y}) rotate(${obstacle.rotation})`}>
            <rect x="-30" y="-30" width="60" height="60" fill="none" stroke="white" strokeWidth="2" />
            {obstacle.colors.map((color, i) => (
              <rect
                key={i}
                x={i < 2 ? -30 : 0}
                y={i % 2 === 0 ? -30 : 0}
                width="30"
                height="30"
                fill={color}
              />
            ))}
          </g>
        )
        
      case 'cross':
        return (
          <g key={index} transform={`translate(${CANVAS_WIDTH / 2}, ${y}) rotate(${obstacle.rotation})`}>
            {obstacle.colors.map((color, i) => (
              <rect
                key={i}
                x="-5"
                y={i < 2 ? -40 : 5}
                width="10"
                height="35"
                fill={color}
                transform={`rotate(${i * 90})`}
              />
            ))}
          </g>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <Card className="p-6">
        <CardContent className="flex flex-col items-center gap-4 p-0">
          <div className="flex justify-between items-center w-full mb-4">
            <div className="text-lg font-semibold">
              Score: {score} | High Score: {highScore}
            </div>
            <div className="flex items-center gap-2">
              {ball.shielded && <Shield className="w-5 h-5 text-blue-500" />}
              {slowMotion && <Zap className="w-5 h-5 text-yellow-500" />}
            </div>
          </div>

          <div 
            className="relative bg-gray-900 border-2 border-gray-600 rounded overflow-hidden cursor-pointer"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            onClick={handleJump}
            onTouchStart={handleJump}
          >
            <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute inset-0">
              {/* Render obstacles */}
              {obstacles.map((obstacle, index) => renderObstacle(obstacle, index))}
              
              {/* Render color changers */}
              {colorChangers.map((changer, index) => {
                const y = changer.y - cameraY
                if (!changer.active || y < -20 || y > CANVAS_HEIGHT + 20) return null
                
                return (
                  <g key={`changer-${index}`}>
                    {COLORS.map((color, i) => (
                      <circle
                        key={i}
                        cx={CANVAS_WIDTH / 2 + (i - 1.5) * 15}
                        cy={y}
                        r="5"
                        fill={color}
                        className="animate-pulse"
                      />
                    ))}
                  </g>
                )
              })}
              
              {/* Render power-ups */}
              {powerUps.map((powerUp, index) => {
                const y = powerUp.y - cameraY
                if (!powerUp.active || y < -20 || y > CANVAS_HEIGHT + 20) return null
                
                return (
                  <g key={`powerup-${index}`} transform={`translate(${powerUp.x}, ${y})`}>
                    <circle r="15" fill="white" opacity="0.3" className="animate-pulse" />
                    {powerUp.type === 'shield' && (
                      <Shield className="w-6 h-6" style={{ transform: 'translate(-12px, -12px)' }} />
                    )}
                    {powerUp.type === 'slowmo' && (
                      <Zap className="w-6 h-6" style={{ transform: 'translate(-12px, -12px)' }} />
                    )}
                    {powerUp.type === 'colorchange' && (
                      <circle r="8" fill="url(#gradient)" />
                    )}
                  </g>
                )
              })}
              
              {/* Gradient definition for color change power-up */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF0000" />
                  <stop offset="33%" stopColor="#0000FF" />
                  <stop offset="66%" stopColor="#FFFF00" />
                  <stop offset="100%" stopColor="#00FF00" />
                </linearGradient>
              </defs>
              
              {/* Render ball */}
              <circle
                cx={CANVAS_WIDTH / 2}
                cy={ball.y - cameraY}
                r={BALL_RADIUS}
                fill={ball.color}
                stroke={ball.shielded ? 'cyan' : 'white'}
                strokeWidth={ball.shielded ? '3' : '2'}
                className={ball.shielded ? 'animate-pulse' : ''}
              />
            </svg>

            {/* Game over overlay */}
            {gameState === 'gameOver' && (
              <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-2xl font-bold mb-2">GAME OVER</div>
                  <div className="text-lg">Score: {score}</div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2 mt-4">
            {gameState === 'waiting' && (
              <Button onClick={startGame} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Start Game
              </Button>
            )}
            {(gameState === 'playing' || gameState === 'paused') && (
              <>
                <Button onClick={togglePause} className="flex items-center gap-2">
                  {gameState === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {gameState === 'paused' ? 'Resume' : 'Pause'}
                </Button>
                <Button onClick={resetGame} variant="outline" className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </>
            )}
            {gameState === 'gameOver' && (
              <Button onClick={startGame} className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Play Again
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
            Tap, click, or press Space/W/↑ to jump. Match your ball color with obstacles!
          </div>
        </CardContent>
      </Card>
    </div>
  )
}