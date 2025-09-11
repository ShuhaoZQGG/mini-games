'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Target } from 'lucide-react'
import { motion } from 'framer-motion'

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface Platform {
  x: number
  y: number
  width: number
  height: number
  type: 'normal' | 'bouncy' | 'sticky' | 'breakable'
  hits?: number
}

interface Coin {
  x: number
  y: number
  radius: number
  collected: boolean
  value: number
}

interface BallBounceGameProps {
  levelConfig: {
    targetScore: number
    gravity: number
    bounceDamping: number
    maxBounces: number
    platformCount: number
    coinCount: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Bounce Beginner',
    difficulty: 'easy',
    config: { 
      targetScore: 500, 
      gravity: 0.3,
      bounceDamping: 0.8,
      maxBounces: 30,
      platformCount: 5,
      coinCount: 10
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Bounce Pro',
    difficulty: 'medium',
    config: { 
      targetScore: 1000, 
      gravity: 0.35,
      bounceDamping: 0.75,
      maxBounces: 25,
      platformCount: 6,
      coinCount: 15
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Bounce Master',
    difficulty: 'hard',
    config: { 
      targetScore: 2000, 
      gravity: 0.4,
      bounceDamping: 0.7,
      maxBounces: 20,
      platformCount: 7,
      coinCount: 20
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Physics Expert',
    difficulty: 'expert',
    config: { 
      targetScore: 3500, 
      gravity: 0.45,
      bounceDamping: 0.65,
      maxBounces: 18,
      platformCount: 8,
      coinCount: 25
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Bounce Legend',
    difficulty: 'master',
    config: { 
      targetScore: 5000, 
      gravity: 0.5,
      bounceDamping: 0.6,
      maxBounces: 15,
      platformCount: 10,
      coinCount: 30
    },
    requiredStars: 14
  }
]

function BallBounceGame({ levelConfig, onScore }: BallBounceGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const [score, setScore] = useState(0)
  const [bounces, setBounces] = useState(0)
  const [gameState, setGameState] = useState<'ready' | 'aiming' | 'playing' | 'gameOver'>('ready')
  const [aimAngle, setAimAngle] = useState(45)
  const [aimPower, setAimPower] = useState(50)
  const [ball, setBall] = useState<Ball>({ x: 50, y: 450, vx: 0, vy: 0, radius: 10 })
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [coins, setCoins] = useState<Coin[]>([])
  const [combo, setCombo] = useState(0)
  const [lastCoinTime, setLastCoinTime] = useState(0)

  const CANVAS_WIDTH = 600
  const CANVAS_HEIGHT = 500

  const initializeLevel = useCallback(() => {
    // Create platforms
    const newPlatforms: Platform[] = []
    const platformTypes: Platform['type'][] = ['normal', 'bouncy', 'sticky', 'breakable']
    
    for (let i = 0; i < levelConfig.platformCount; i++) {
      const type = i === 0 ? 'normal' : platformTypes[Math.floor(Math.random() * platformTypes.length)]
      newPlatforms.push({
        x: Math.random() * (CANVAS_WIDTH - 100) + 50,
        y: 100 + (i * (300 / levelConfig.platformCount)),
        width: 60 + Math.random() * 40,
        height: 10,
        type,
        hits: type === 'breakable' ? 2 : undefined
      })
    }
    
    // Always add ground platform
    newPlatforms.push({
      x: 0,
      y: CANVAS_HEIGHT - 20,
      width: CANVAS_WIDTH,
      height: 20,
      type: 'normal'
    })
    
    setPlatforms(newPlatforms)

    // Create coins
    const newCoins: Coin[] = []
    for (let i = 0; i < levelConfig.coinCount; i++) {
      newCoins.push({
        x: Math.random() * (CANVAS_WIDTH - 40) + 20,
        y: Math.random() * (CANVAS_HEIGHT - 100) + 50,
        radius: 15,
        collected: false,
        value: 10 + Math.floor(Math.random() * 3) * 10
      })
    }
    setCoins(newCoins)
  }, [levelConfig])

  const startGame = () => {
    initializeLevel()
    setGameState('aiming')
    setScore(0)
    setBounces(0)
    setCombo(0)
    setBall({ x: 50, y: 450, vx: 0, vy: 0, radius: 10 })
  }

  const launchBall = () => {
    const angleRad = (aimAngle * Math.PI) / 180
    const power = aimPower / 5
    setBall(prev => ({
      ...prev,
      vx: Math.cos(angleRad) * power,
      vy: -Math.sin(angleRad) * power
    }))
    setGameState('playing')
  }

  const resetGame = () => {
    setGameState('ready')
    setScore(0)
    setBounces(0)
    setCombo(0)
  }

  const checkCollisions = useCallback((ball: Ball, platforms: Platform[], coins: Coin[]) => {
    let newBall = { ...ball }
    let bounced = false
    let coinCollected = false

    // Apply gravity
    newBall.vy += levelConfig.gravity

    // Update position
    newBall.x += newBall.vx
    newBall.y += newBall.vy

    // Check wall collisions
    if (newBall.x - newBall.radius <= 0 || newBall.x + newBall.radius >= CANVAS_WIDTH) {
      newBall.vx = -newBall.vx * levelConfig.bounceDamping
      newBall.x = newBall.x - newBall.radius <= 0 ? newBall.radius : CANVAS_WIDTH - newBall.radius
      bounced = true
    }

    // Check platform collisions
    platforms.forEach((platform, index) => {
      if (platform.type === 'breakable' && platform.hits === 0) return

      const ballBottom = newBall.y + newBall.radius
      const ballTop = newBall.y - newBall.radius
      const ballLeft = newBall.x - newBall.radius
      const ballRight = newBall.x + newBall.radius

      if (
        ballBottom >= platform.y &&
        ballTop <= platform.y + platform.height &&
        ballRight >= platform.x &&
        ballLeft <= platform.x + platform.width &&
        newBall.vy > 0
      ) {
        bounced = true
        
        if (platform.type === 'bouncy') {
          newBall.vy = -Math.abs(newBall.vy) * 1.2
        } else if (platform.type === 'sticky') {
          newBall.vy = -Math.abs(newBall.vy) * 0.5
          newBall.vx *= 0.5
        } else {
          newBall.vy = -newBall.vy * levelConfig.bounceDamping
        }
        
        newBall.y = platform.y - newBall.radius

        if (platform.type === 'breakable' && platform.hits !== undefined) {
          setPlatforms(prev => prev.map((p, i) => 
            i === index ? { ...p, hits: Math.max(0, (p.hits || 0) - 1) } : p
          ))
        }
      }
    })

    // Check coin collisions
    coins.forEach((coin, index) => {
      if (coin.collected) return

      const dx = newBall.x - coin.x
      const dy = newBall.y - coin.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < newBall.radius + coin.radius) {
        coinCollected = true
        const now = Date.now()
        const timeSinceLastCoin = now - lastCoinTime
        
        let multiplier = 1
        if (timeSinceLastCoin < 2000) {
          setCombo(c => c + 1)
          multiplier = 1 + (combo * 0.2)
        } else {
          setCombo(0)
        }

        setLastCoinTime(now)
        setScore(s => s + Math.floor(coin.value * multiplier))
        
        setCoins(prev => prev.map((c, i) => 
          i === index ? { ...c, collected: true } : c
        ))
      }
    })

    if (bounced) {
      setBounces(b => b + 1)
      setScore(s => s + 5)
    }

    // Check if ball is out of bounds
    if (newBall.y > CANVAS_HEIGHT + 50) {
      setGameState('gameOver')
      onScore(score)
    }

    return newBall
  }, [levelConfig, combo, lastCoinTime, score, onScore])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = () => {
      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      gradient.addColorStop(0, '#87CEEB')
      gradient.addColorStop(1, '#E0F6FF')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Update ball
      setBall(prevBall => checkCollisions(prevBall, platforms, coins))

      // Draw platforms
      platforms.forEach(platform => {
        if (platform.type === 'breakable' && platform.hits === 0) return
        
        ctx.fillStyle = 
          platform.type === 'bouncy' ? '#4ADE80' :
          platform.type === 'sticky' ? '#FBBF24' :
          platform.type === 'breakable' ? `rgba(239, 68, 68, ${(platform.hits || 0) * 0.5})` :
          '#6B7280'
        
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
      })

      // Draw coins
      coins.forEach(coin => {
        if (coin.collected) return
        
        ctx.beginPath()
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2)
        ctx.fillStyle = '#FFD700'
        ctx.fill()
        ctx.strokeStyle = '#FFA500'
        ctx.lineWidth = 2
        ctx.stroke()
        
        ctx.fillStyle = '#8B4513'
        ctx.font = '12px bold sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(coin.value.toString(), coin.x, coin.y)
      })

      // Draw ball
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fillStyle = '#EF4444'
      ctx.fill()
      ctx.strokeStyle = '#991B1B'
      ctx.lineWidth = 2
      ctx.stroke()

      // Check max bounces
      if (bounces >= levelConfig.maxBounces) {
        setGameState('gameOver')
        onScore(score)
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
  }, [gameState, ball, platforms, coins, bounces, levelConfig.maxBounces, checkCollisions, score, onScore])

  // Draw aiming state
  useEffect(() => {
    if (gameState !== 'aiming') return

    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    gradient.addColorStop(0, '#87CEEB')
    gradient.addColorStop(1, '#E0F6FF')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw platforms
    platforms.forEach(platform => {
      ctx.fillStyle = 
        platform.type === 'bouncy' ? '#4ADE80' :
        platform.type === 'sticky' ? '#FBBF24' :
        platform.type === 'breakable' ? '#EF4444' :
        '#6B7280'
      
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height)
    })

    // Draw coins
    coins.forEach(coin => {
      ctx.beginPath()
      ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2)
      ctx.fillStyle = '#FFD700'
      ctx.fill()
      ctx.strokeStyle = '#FFA500'
      ctx.lineWidth = 2
      ctx.stroke()
      
      ctx.fillStyle = '#8B4513'
      ctx.font = '12px bold sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(coin.value.toString(), coin.x, coin.y)
    })

    // Draw ball
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
    ctx.fillStyle = '#EF4444'
    ctx.fill()

    // Draw aim line
    const angleRad = (aimAngle * Math.PI) / 180
    const lineLength = aimPower * 2
    ctx.beginPath()
    ctx.moveTo(ball.x, ball.y)
    ctx.lineTo(
      ball.x + Math.cos(angleRad) * lineLength,
      ball.y - Math.sin(angleRad) * lineLength
    )
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.setLineDash([])
  }, [gameState, aimAngle, aimPower, ball, platforms, coins])

  return (
    <Card className="w-full max-w-3xl mx-auto">
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
            <div className="text-lg font-semibold">
              Bounces: {bounces}/{levelConfig.maxBounces}
            </div>
            <div className="text-sm text-muted-foreground">
              Coins: {coins.filter(c => c.collected).length}/{coins.length}
            </div>
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-gray-300 rounded-lg w-full"
            style={{ maxWidth: '600px' }}
          />

          {gameState === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <Button onClick={startGame} size="lg">
                <Play className="w-5 h-5 mr-2" />
                Start Game
              </Button>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
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
        </div>

        {gameState === 'aiming' && (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Angle: {aimAngle}°</label>
              <input
                type="range"
                min="10"
                max="80"
                value={aimAngle}
                onChange={(e) => setAimAngle(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Power: {aimPower}%</label>
              <input
                type="range"
                min="10"
                max="100"
                value={aimPower}
                onChange={(e) => setAimPower(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <Button onClick={launchBall} className="w-full">
              <Target className="w-4 h-4 mr-2" />
              Launch Ball
            </Button>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'aiming') && (
          <div className="mt-4">
            <Button onClick={resetGame} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Game
            </Button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-center">
          <div className="p-2 bg-gray-100 rounded">
            <div className="w-4 h-2 bg-gray-500 mx-auto mb-1"></div>
            Normal
          </div>
          <div className="p-2 bg-green-50 rounded">
            <div className="w-4 h-2 bg-green-500 mx-auto mb-1"></div>
            Bouncy
          </div>
          <div className="p-2 bg-yellow-50 rounded">
            <div className="w-4 h-2 bg-yellow-500 mx-auto mb-1"></div>
            Sticky
          </div>
          <div className="p-2 bg-red-50 rounded">
            <div className="w-4 h-2 bg-red-500 mx-auto mb-1"></div>
            Breakable
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BallBounce() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const percentage = (score / levelConfig.targetScore) * 100
    if (percentage >= 150) return 3
    if (percentage >= 100) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="ball-bounce"
      gameName="Ball Bounce"
      levels={levels}
      renderGame={(config, onScore) => (
        <BallBounceGame levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}