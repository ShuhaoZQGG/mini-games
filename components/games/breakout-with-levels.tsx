'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw } from 'lucide-react'

interface Ball {
  x: number
  y: number
  dx: number
  dy: number
  radius: number
}

interface Paddle {
  x: number
  y: number
  width: number
  height: number
}

interface Brick {
  x: number
  y: number
  width: number
  height: number
  color: string
  points: number
  hits: number
  destroyed: boolean
}

interface BreakoutGameProps {
  levelConfig: {
    ballSpeed: number
    paddleWidth: number
    rows: number
    cols: number
    multiHitBricks: boolean
    ballCount: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Easy Breakout',
    difficulty: 'easy',
    config: { 
      ballSpeed: 4, 
      paddleWidth: 120, 
      rows: 4, 
      cols: 8,
      multiHitBricks: false,
      ballCount: 1
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Medium Challenge',
    difficulty: 'medium',
    config: { 
      ballSpeed: 5, 
      paddleWidth: 100, 
      rows: 5, 
      cols: 10,
      multiHitBricks: true,
      ballCount: 1
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Hard Mode',
    difficulty: 'hard',
    config: { 
      ballSpeed: 6, 
      paddleWidth: 80, 
      rows: 6, 
      cols: 10,
      multiHitBricks: true,
      ballCount: 1
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Breaker',
    difficulty: 'expert',
    config: { 
      ballSpeed: 7, 
      paddleWidth: 70, 
      rows: 7, 
      cols: 12,
      multiHitBricks: true,
      ballCount: 2
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Master Destruction',
    difficulty: 'master',
    config: { 
      ballSpeed: 8, 
      paddleWidth: 60, 
      rows: 8, 
      cols: 12,
      multiHitBricks: true,
      ballCount: 3
    },
    requiredStars: 12
  }
]

function BreakoutCore({ levelConfig, onScore }: BreakoutGameProps) {
  const { ballSpeed, paddleWidth, rows, cols, multiHitBricks, ballCount } = levelConfig
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'ended' | 'victory'>('waiting')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  
  const ballsRef = useRef<Ball[]>([])
  
  const paddleRef = useRef<Paddle>({
    x: 400 - paddleWidth / 2,
    y: 480,
    width: paddleWidth,
    height: 10
  })
  
  const bricksRef = useRef<Brick[]>([])
  const keysRef = useRef<{ [key: string]: boolean }>({})
  const ballLaunchedRef = useRef(false)

  const initializeBricks = useCallback(() => {
    const bricks: Brick[] = []
    const brickWidth = Math.floor(720 / cols)
    const brickHeight = 20
    const padding = 5
    const offsetTop = 60
    const offsetLeft = 40

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']
        const points = (rows - r) * 10
        const hits = multiHitBricks ? Math.min(Math.floor(r / 2) + 1, 3) : 1
        
        bricks.push({
          x: c * (brickWidth + padding) + offsetLeft,
          y: r * (brickHeight + padding) + offsetTop,
          width: brickWidth,
          height: brickHeight,
          color: colors[r % colors.length],
          points,
          hits,
          destroyed: false
        })
      }
    }
    
    bricksRef.current = bricks
  }, [rows, cols, multiHitBricks])

  const resetBalls = useCallback(() => {
    const balls: Ball[] = []
    for (let i = 0; i < ballCount; i++) {
      balls.push({
        x: paddleRef.current.x + paddleRef.current.width / 2 + (i - Math.floor(ballCount / 2)) * 20,
        y: paddleRef.current.y - 10,
        dx: 0,
        dy: 0,
        radius: 8
      })
    }
    ballsRef.current = balls
    ballLaunchedRef.current = false
  }, [ballCount])

  const launchBalls = useCallback(() => {
    if (!ballLaunchedRef.current) {
      ballsRef.current.forEach((ball, index) => {
        const angle = (index - Math.floor(ballCount / 2)) * 0.3
        ball.dx = ballSpeed * Math.sin(angle)
        ball.dy = -ballSpeed * Math.cos(angle)
      })
      ballLaunchedRef.current = true
    }
  }, [ballSpeed, ballCount])

  const drawBalls = useCallback((ctx: CanvasRenderingContext2D) => {
    ballsRef.current.forEach(ball => {
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.closePath()
    })
  }, [])

  const drawPaddle = useCallback((ctx: CanvasRenderingContext2D) => {
    const paddle = paddleRef.current
    ctx.fillStyle = '#6366F1'
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height)
  }, [])

  const drawBricks = useCallback((ctx: CanvasRenderingContext2D) => {
    bricksRef.current.forEach(brick => {
      if (!brick.destroyed) {
        ctx.fillStyle = brick.color
        if (brick.hits > 1) {
          ctx.globalAlpha = 1 - (0.3 * (brick.hits - 1))
        }
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height)
        ctx.globalAlpha = 1
      }
    })
  }, [])

  const drawScore = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.font = '16px Inter'
    ctx.fillStyle = '#fff'
    ctx.fillText(`Score: ${score}`, 8, 20)
    ctx.fillText(`Lives: ${lives}`, 8, 40)
    ctx.fillText(`Balls: ${ballCount}`, 720, 20)
    
    if (gameState === 'paused') {
      ctx.font = '32px Inter'
      ctx.fillStyle = '#F59E0B'
      ctx.fillText('Paused', 350, 250)
    }
  }, [score, lives, ballCount, gameState])

  const collisionDetection = useCallback(() => {
    const paddle = paddleRef.current
    const bricks = bricksRef.current
    const activeBalls: Ball[] = []

    ballsRef.current.forEach(ball => {
      // Ball and walls
      if (ball.x + ball.radius > 800 || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx
      }
      if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy
      }

      // Ball and paddle
      if (
        ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
      ) {
        ball.dy = -ball.dy
        // Add spin based on where ball hits paddle
        const hitPos = (ball.x - paddle.x) / paddle.width
        ball.dx = 8 * (hitPos - 0.5)
      }

      // Ball and bricks
      bricks.forEach(brick => {
        if (!brick.destroyed) {
          if (
            ball.x > brick.x &&
            ball.x < brick.x + brick.width &&
            ball.y > brick.y &&
            ball.y < brick.y + brick.height
          ) {
            ball.dy = -ball.dy
            brick.hits--
            
            if (brick.hits <= 0) {
              brick.destroyed = true
              setScore(prev => prev + brick.points)
            }
          }
        }
      })

      // Ball out of bounds
      if (ball.y > 500) {
        // Ball is lost, don't add to active balls
      } else {
        activeBalls.push(ball)
      }
    })

    // Update balls array with only active balls
    if (activeBalls.length < ballsRef.current.length) {
      ballsRef.current = activeBalls
      if (activeBalls.length === 0) {
        setLives(prev => prev - 1)
        resetBalls()
      }
    }
  }, [resetBalls])

  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return

    const paddle = paddleRef.current
    
    // Move paddle
    if (keysRef.current['ArrowLeft'] && paddle.x > 0) {
      paddle.x -= 7
    }
    if (keysRef.current['ArrowRight'] && paddle.x < 800 - paddle.width) {
      paddle.x += 7
    }

    // Move balls with paddle if not launched
    if (!ballLaunchedRef.current) {
      ballsRef.current.forEach((ball, index) => {
        ball.x = paddle.x + paddle.width / 2 + (index - Math.floor(ballCount / 2)) * 20
        ball.y = paddle.y - 10
      })
    } else {
      ballsRef.current.forEach(ball => {
        ball.x += ball.dx
        ball.y += ball.dy
      })
    }

    collisionDetection()

    // Check for victory
    const remainingBricks = bricksRef.current.filter(b => !b.destroyed).length
    if (remainingBricks === 0) {
      setGameState('victory')
      endGame(true)
    }

    // Check for game over
    if (lives <= 0) {
      setGameState('ended')
      endGame(false)
    }
  }, [gameState, lives, collisionDetection, ballCount])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw game elements
    drawBricks(ctx)
    drawPaddle(ctx)
    drawBalls(ctx)
    drawScore(ctx)
  }, [drawBricks, drawPaddle, drawBalls, drawScore])

  const gameLoop = useCallback(() => {
    updateGame()
    draw()
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [updateGame, draw])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setLives(3)
    initializeBricks()
    resetBalls()
    paddleRef.current.x = 400 - paddleWidth / 2
    ballLaunchedRef.current = false
    gameLoop()
  }

  const endGame = async (victory: boolean) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    // Calculate final score with bonuses
    const lifeBonus = lives * 100
    const victoryBonus = victory ? 500 : 0
    const finalScore = score + lifeBonus + victoryBonus
    
    onScore(finalScore)
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' && gameState === 'playing' && !ballLaunchedRef.current) {
      launchBalls()
    }
    if (e.key === 'p' && gameState === 'playing') {
      setGameState('paused')
    } else if (e.key === 'p' && gameState === 'paused') {
      setGameState('playing')
    }
    keysRef.current[e.key] = true
  }, [gameState, launchBalls])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key] = false
  }, [])

  // Handle keyboard input
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Handle game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoop()
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [gameState, gameLoop])

  if (gameState === 'waiting') {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Gamepad2 className="w-8 h-8" />
              Breakout
            </h1>
            <p className="text-muted-foreground">Break all the bricks!</p>
          </div>
          
          <div className="space-y-4 text-left max-w-md mx-auto">
            <h3 className="font-semibold">Level Configuration:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Ball Speed: {ballSpeed}</li>
              <li>• Paddle Width: {paddleWidth}px</li>
              <li>• Grid: {rows} x {cols}</li>
              <li>• Number of Balls: {ballCount}</li>
              {multiHitBricks && <li>• Some bricks require multiple hits</li>}
            </ul>
            
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use ← → arrow keys to move the paddle</li>
              <li>• Press Space to launch the ball</li>
              <li>• Break all bricks to win</li>
              <li>• Press P to pause/resume</li>
              <li>• You have 3 lives</li>
            </ul>
          </div>
          
          <Button onClick={startGame} size="lg">
            Start Game
          </Button>
        </div>
      </Card>
    )
  }

  if (gameState === 'ended' || gameState === 'victory') {
    const lifeBonus = lives * 100
    const victoryBonus = gameState === 'victory' ? 500 : 0
    const finalScore = score + lifeBonus + victoryBonus

    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6" data-testid="breakout-game">
          <h2 className="text-3xl font-bold">
            {gameState === 'victory' ? 'Victory!' : 'Game Over!'}
          </h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Score: {score}</p>
            {lives > 0 && <p className="text-lg">Life Bonus: +{lifeBonus}</p>}
            {gameState === 'victory' && <p className="text-lg">Victory Bonus: +{victoryBonus}</p>}
            <p className="text-2xl font-bold text-primary">Final Score: {finalScore}</p>
          </div>
          
          <Button onClick={startGame} size="lg" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-6">
            <span className="text-lg font-semibold">Score: {score}</span>
            <span className="text-lg font-semibold">Lives: {lives}</span>
          </div>
          <span className="text-lg font-semibold">Balls: {ballCount}</span>
        </div>
        
        <canvas
          ref={canvasRef}
          data-testid="game-canvas"
          width={800}
          height={500}
          className="border border-border rounded-lg bg-slate-900"
          style={{ imageRendering: 'pixelated' }}
        />
        
        <div className="text-center text-sm text-muted-foreground">
          Use ← → to move • Space to launch • P to pause
        </div>
      </div>
    </Card>
  )
}

export default function BreakoutWithLevels() {
  const getStars = (score: number, levelConfig: any) => {
    const { rows, cols } = levelConfig
    const maxPossibleScore = rows * cols * 50 + 800 // Approximate max score
    
    if (score >= maxPossibleScore * 0.8) return 3
    if (score >= maxPossibleScore * 0.5) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="breakout"
      gameName="Breakout"
      levels={levels}
      renderGame={(config, onScore) => (
        <BreakoutCore levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}