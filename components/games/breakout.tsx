'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Gamepad2, RotateCcw } from 'lucide-react'
import { submitScore } from '@/lib/services/scores'

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

export default function Breakout() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'ended' | 'victory'>('waiting')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  
  const ballRef = useRef<Ball>({
    x: 400,
    y: 450,
    dx: 0,
    dy: 0,
    radius: 8
  })
  
  const paddleRef = useRef<Paddle>({
    x: 350,
    y: 480,
    width: 100,
    height: 10
  })
  
  const bricksRef = useRef<Brick[]>([])
  const keysRef = useRef<{ [key: string]: boolean }>({})
  const ballLaunchedRef = useRef(false)

  const initializeBricks = useCallback(() => {
    const bricks: Brick[] = []
    const rows = 5 + Math.floor(level / 2)
    const cols = 10
    const brickWidth = 70
    const brickHeight = 20
    const padding = 5
    const offsetTop = 60
    const offsetLeft = 35

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']
        const points = (rows - r) * 10
        const hits = Math.floor(r / 2) + 1 // Some bricks need multiple hits
        
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
  }, [level])

  const resetBall = useCallback(() => {
    ballRef.current = {
      x: paddleRef.current.x + paddleRef.current.width / 2,
      y: paddleRef.current.y - 10,
      dx: 0,
      dy: 0,
      radius: 8
    }
    ballLaunchedRef.current = false
  }, [])

  const launchBall = useCallback(() => {
    if (!ballLaunchedRef.current) {
      ballRef.current.dx = 4 + level * 0.5
      ballRef.current.dy = -(4 + level * 0.5)
      ballLaunchedRef.current = true
    }
  }, [level])

  const drawBall = useCallback((ctx: CanvasRenderingContext2D) => {
    const ball = ballRef.current
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.closePath()
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
    ctx.fillText(`Level: ${level}`, 720, 20)
    
    if (gameState === 'paused') {
      ctx.font = '32px Inter'
      ctx.fillStyle = '#F59E0B'
      ctx.fillText('Paused', 350, 250)
    }
  }, [score, lives, level, gameState])

  const collisionDetection = useCallback(() => {
    const ball = ballRef.current
    const paddle = paddleRef.current
    const bricks = bricksRef.current

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
      setLives(prev => prev - 1)
      resetBall()
    }
  }, [resetBall])

  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return

    const ball = ballRef.current
    const paddle = paddleRef.current
    
    // Move paddle
    if (keysRef.current['ArrowLeft'] && paddle.x > 0) {
      paddle.x -= 7
    }
    if (keysRef.current['ArrowRight'] && paddle.x < 700) {
      paddle.x += 7
    }

    // Move ball with paddle if not launched
    if (!ballLaunchedRef.current) {
      ball.x = paddle.x + paddle.width / 2
      ball.y = paddle.y - 10
    } else {
      ball.x += ball.dx
      ball.y += ball.dy
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
  }, [gameState, lives, collisionDetection])

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
    drawBall(ctx)
    drawScore(ctx)
  }, [drawBricks, drawPaddle, drawBall, drawScore])

  const gameLoop = useCallback(() => {
    updateGame()
    draw()
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [updateGame, draw])

  const startGame = () => {
    setGameState('playing')
    setScore(0)
    setLives(3)
    setLevel(1)
    initializeBricks()
    resetBall()
    paddleRef.current.x = 350
    ballLaunchedRef.current = false
    gameLoop()
  }

  const endGame = async (victory: boolean) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    await submitScore({
      gameId: 'breakout',
      score,
      metadata: {
        level,
        victory
      }
    })
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === ' ' && gameState === 'playing' && !ballLaunchedRef.current) {
      launchBall()
    }
    if (e.key === 'p' && gameState === 'playing') {
      setGameState('paused')
    } else if (e.key === 'p' && gameState === 'paused') {
      setGameState('playing')
    }
    keysRef.current[e.key] = true
  }, [gameState, launchBall])

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
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use ← → arrow keys to move the paddle</li>
              <li>• Press Space to launch the ball</li>
              <li>• Break all bricks to advance to the next level</li>
              <li>• Some bricks require multiple hits</li>
              <li>• Press P to pause/resume the game</li>
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
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center space-y-6" data-testid="breakout-game">
          <h2 className="text-3xl font-bold">
            {gameState === 'victory' ? 'Victory!' : 'Game Over!'}
          </h2>
          
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Final Score: {score}</p>
            <p className="text-lg text-muted-foreground">Level Reached: {level}</p>
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
          <span className="text-lg font-semibold">Level: {level}</span>
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