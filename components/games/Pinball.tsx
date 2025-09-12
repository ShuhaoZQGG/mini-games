'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface Flipper {
  x: number
  y: number
  angle: number
  length: number
  side: 'left' | 'right'
}

interface Bumper {
  x: number
  y: number
  radius: number
  points: number
  color: string
}

export default function Pinball() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const [score, setScore] = useState(0)
  const [balls, setBalls] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [leftFlipperActive, setLeftFlipperActive] = useState(false)
  const [rightFlipperActive, setRightFlipperActive] = useState(false)
  
  const ballRef = useRef<Ball>({
    x: 380,
    y: 450,
    vx: 0,
    vy: 0,
    radius: 8
  })
  
  const leftFlipperRef = useRef<Flipper>({
    x: 120,
    y: 520,
    angle: 30,
    length: 60,
    side: 'left'
  })
  
  const rightFlipperRef = useRef<Flipper>({
    x: 280,
    y: 520,
    angle: -30,
    length: 60,
    side: 'right'
  })
  
  const bumpersRef = useRef<Bumper[]>([
    { x: 150, y: 150, radius: 25, points: 100, color: '#FF6B6B' },
    { x: 250, y: 150, radius: 25, points: 100, color: '#4ECDC4' },
    { x: 200, y: 220, radius: 25, points: 150, color: '#95E77E' },
    { x: 120, y: 280, radius: 20, points: 50, color: '#FFE66D' },
    { x: 280, y: 280, radius: 20, points: 50, color: '#FFE66D' },
    { x: 200, y: 350, radius: 30, points: 200, color: '#A8E6CF' }
  ])
  
  const launchBall = useCallback(() => {
    if (!isPlaying) return
    
    ballRef.current = {
      x: 380,
      y: 450,
      vx: (Math.random() - 0.5) * 2,
      vy: -12,
      radius: 8
    }
  }, [isPlaying])
  
  const drawTable = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, 400, 600)
    
    // Draw table borders
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 4
    ctx.beginPath()
    // Left wall
    ctx.moveTo(20, 20)
    ctx.lineTo(20, 500)
    ctx.lineTo(100, 580)
    // Right wall
    ctx.moveTo(380, 20)
    ctx.lineTo(380, 500)
    ctx.lineTo(300, 580)
    // Top wall
    ctx.moveTo(20, 20)
    ctx.lineTo(380, 20)
    ctx.stroke()
    
    // Draw launch chute
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2
    ctx.strokeRect(370, 440, 20, 140)
  }, [])
  
  const drawBumpers = useCallback((ctx: CanvasRenderingContext2D) => {
    bumpersRef.current.forEach(bumper => {
      // Draw bumper
      ctx.fillStyle = bumper.color
      ctx.beginPath()
      ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2)
      ctx.fill()
      
      // Draw bumper highlight
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Draw points value
      ctx.fillStyle = '#000'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(bumper.points.toString(), bumper.x, bumper.y)
    })
  }, [])
  
  const drawFlippers = useCallback((ctx: CanvasRenderingContext2D) => {
    // Draw left flipper
    ctx.save()
    ctx.translate(leftFlipperRef.current.x, leftFlipperRef.current.y)
    ctx.rotate((leftFlipperActive ? -20 : leftFlipperRef.current.angle) * Math.PI / 180)
    ctx.fillStyle = '#FFD93D'
    ctx.fillRect(0, -5, leftFlipperRef.current.length, 10)
    ctx.restore()
    
    // Draw right flipper
    ctx.save()
    ctx.translate(rightFlipperRef.current.x, rightFlipperRef.current.y)
    ctx.rotate((rightFlipperActive ? 20 : rightFlipperRef.current.angle) * Math.PI / 180)
    ctx.fillStyle = '#FFD93D'
    ctx.fillRect(0, -5, rightFlipperRef.current.length, 10)
    ctx.restore()
  }, [leftFlipperActive, rightFlipperActive])
  
  const drawBall = useCallback((ctx: CanvasRenderingContext2D) => {
    const ball = ballRef.current
    
    // Draw ball
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw ball shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.beginPath()
    ctx.arc(ball.x - 2, ball.y - 2, ball.radius / 2, 0, Math.PI * 2)
    ctx.fill()
  }, [])
  
  const checkBumperCollision = useCallback((ball: Ball, bumper: Bumper) => {
    const dx = ball.x - bumper.x
    const dy = ball.y - bumper.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < ball.radius + bumper.radius) {
      // Normalize collision vector
      const nx = dx / distance
      const ny = dy / distance
      
      // Reflect velocity
      const dotProduct = ball.vx * nx + ball.vy * ny
      ball.vx -= 2 * dotProduct * nx
      ball.vy -= 2 * dotProduct * ny
      
      // Add bounce force
      ball.vx *= 1.5
      ball.vy *= 1.5
      
      // Move ball outside bumper
      ball.x = bumper.x + nx * (bumper.radius + ball.radius + 1)
      ball.y = bumper.y + ny * (bumper.radius + ball.radius + 1)
      
      // Add score
      setScore(prev => prev + bumper.points)
      
      return true
    }
    return false
  }, [])
  
  const checkFlipperCollision = useCallback((ball: Ball, flipper: Flipper, isActive: boolean) => {
    // Simplified flipper collision (treat as rectangle)
    const flipperAngle = (isActive ? (flipper.side === 'left' ? -20 : 20) : flipper.angle) * Math.PI / 180
    
    // Calculate flipper end point
    const endX = flipper.x + Math.cos(flipperAngle) * flipper.length
    const endY = flipper.y + Math.sin(flipperAngle) * flipper.length
    
    // Check if ball is near flipper line
    const dist = Math.abs((endY - flipper.y) * ball.x - (endX - flipper.x) * ball.y + endX * flipper.y - endY * flipper.x) / 
                 Math.sqrt((endY - flipper.y) ** 2 + (endX - flipper.x) ** 2)
    
    if (dist < ball.radius + 5) {
      // Check if ball is within flipper bounds
      const minX = Math.min(flipper.x, endX)
      const maxX = Math.max(flipper.x, endX)
      const minY = Math.min(flipper.y, endY)
      const maxY = Math.max(flipper.y, endY)
      
      if (ball.x >= minX - ball.radius && ball.x <= maxX + ball.radius &&
          ball.y >= minY - ball.radius && ball.y <= maxY + ball.radius) {
        
        // Apply flipper force
        if (isActive) {
          ball.vy = -15 // Strong upward force when flipper is active
          ball.vx = flipper.side === 'left' ? 5 : -5
        } else {
          // Normal bounce
          ball.vy = Math.min(ball.vy * -0.8, -5)
        }
        
        // Move ball above flipper
        ball.y = minY - ball.radius - 1
        
        return true
      }
    }
    return false
  }, [])
  
  const updatePhysics = useCallback(() => {
    const ball = ballRef.current
    
    // Apply gravity
    ball.vy += 0.3
    
    // Apply friction
    ball.vx *= 0.99
    ball.vy *= 0.99
    
    // Update position
    ball.x += ball.vx
    ball.y += ball.vy
    
    // Check wall collisions
    if (ball.x - ball.radius < 20) {
      ball.x = 20 + ball.radius
      ball.vx = Math.abs(ball.vx) * 0.8
    }
    if (ball.x + ball.radius > 380) {
      ball.x = 380 - ball.radius
      ball.vx = -Math.abs(ball.vx) * 0.8
    }
    if (ball.y - ball.radius < 20) {
      ball.y = 20 + ball.radius
      ball.vy = Math.abs(ball.vy) * 0.8
    }
    
    // Check bumper collisions
    bumpersRef.current.forEach(bumper => {
      checkBumperCollision(ball, bumper)
    })
    
    // Check flipper collisions
    checkFlipperCollision(ball, leftFlipperRef.current, leftFlipperActive)
    checkFlipperCollision(ball, rightFlipperRef.current, rightFlipperActive)
    
    // Check if ball fell off the table
    if (ball.y > 600) {
      setBalls(prev => {
        const newBalls = prev - 1
        if (newBalls <= 0) {
          setGameOver(true)
          setIsPlaying(false)
        }
        return newBalls
      })
      
      if (balls > 1) {
        // Reset ball position
        setTimeout(() => launchBall(), 1000)
      }
    }
  }, [balls, checkBumperCollision, checkFlipperCollision, launchBall, leftFlipperActive, rightFlipperActive])
  
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    drawTable(ctx)
    drawBumpers(ctx)
    drawFlippers(ctx)
    
    if (isPlaying) {
      updatePhysics()
      drawBall(ctx)
    }
    
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(gameLoop)
    }
  }, [isPlaying, drawTable, drawBumpers, drawFlippers, drawBall, updatePhysics])
  
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, gameLoop])
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return
      
      if (e.key === 'ArrowLeft') {
        setLeftFlipperActive(true)
      } else if (e.key === 'ArrowRight') {
        setRightFlipperActive(true)
      } else if (e.key === ' ') {
        e.preventDefault()
        launchBall()
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setLeftFlipperActive(false)
      } else if (e.key === 'ArrowRight') {
        setRightFlipperActive(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPlaying, launchBall])
  
  const startGame = () => {
    setScore(0)
    setBalls(3)
    setGameOver(false)
    setIsPlaying(true)
    launchBall()
  }
  
  const resetGame = () => {
    setScore(0)
    setBalls(3)
    setGameOver(false)
    setIsPlaying(false)
    ballRef.current = {
      x: 380,
      y: 450,
      vx: 0,
      vy: 0,
      radius: 8
    }
  }
  
  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    drawTable(ctx)
    drawBumpers(ctx)
    drawFlippers(ctx)
  }, [drawTable, drawBumpers, drawFlippers])
  
  return (
    <Card className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pinball</h2>
          <p className="text-gray-600">Score: {score} | Balls: {balls}</p>
        </div>
        <div className="space-x-2">
          {!isPlaying && !gameOver && (
            <Button onClick={startGame}>Start Game</Button>
          )}
          {isPlaying && (
            <Button onClick={() => setIsPlaying(false)}>Pause</Button>
          )}
          {gameOver && (
            <Button onClick={resetGame}>New Game</Button>
          )}
        </div>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="border-2 border-gray-300 rounded-lg mx-auto bg-gray-900"
        />
        
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="text-center text-white">
              <h3 className="text-3xl font-bold mb-2">Game Over!</h3>
              <p className="text-xl mb-4">Final Score: {score}</p>
              <Button onClick={resetGame} variant="secondary">Play Again</Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Controls: [←][→] Flippers | [Space] Launch Ball</p>
        <p>Hit the bumpers to score points!</p>
      </div>
    </Card>
  )
}