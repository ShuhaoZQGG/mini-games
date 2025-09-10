'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Bot, Target, Zap, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type Ball = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  type: 'solid' | 'stripe' | 'cue' | 'eight'
  isPocketed: boolean
}

type Player = {
  type: 'solid' | 'stripe' | null
  score: number
  isAI: boolean
}

type Difficulty = 'Easy' | 'Medium' | 'Hard'

const BALL_RADIUS = 10
const TABLE_WIDTH = 600
const TABLE_HEIGHT = 300
const POCKET_RADIUS = 20
const FRICTION = 0.985
const MAX_POWER = 15

const POCKET_POSITIONS = [
  { x: 20, y: 20 }, // Top-left
  { x: TABLE_WIDTH / 2, y: 10 }, // Top-center
  { x: TABLE_WIDTH - 20, y: 20 }, // Top-right
  { x: 20, y: TABLE_HEIGHT - 20 }, // Bottom-left
  { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT - 10 }, // Bottom-center
  { x: TABLE_WIDTH - 20, y: TABLE_HEIGHT - 20 }, // Bottom-right
]

const initialBalls: Ball[] = [
  { id: 0, x: 150, y: 150, vx: 0, vy: 0, color: 'white', type: 'cue', isPocketed: false },
  // Solids (1-7)
  { id: 1, x: 400, y: 150, vx: 0, vy: 0, color: '#FFD700', type: 'solid', isPocketed: false },
  { id: 2, x: 420, y: 140, vx: 0, vy: 0, color: '#0000FF', type: 'solid', isPocketed: false },
  { id: 3, x: 420, y: 160, vx: 0, vy: 0, color: '#FF0000', type: 'solid', isPocketed: false },
  { id: 4, x: 440, y: 130, vx: 0, vy: 0, color: '#800080', type: 'solid', isPocketed: false },
  { id: 5, x: 440, y: 150, vx: 0, vy: 0, color: '#FFA500', type: 'solid', isPocketed: false },
  { id: 6, x: 440, y: 170, vx: 0, vy: 0, color: '#008000', type: 'solid', isPocketed: false },
  { id: 7, x: 460, y: 120, vx: 0, vy: 0, color: '#8B4513', type: 'solid', isPocketed: false },
  // 8-ball
  { id: 8, x: 460, y: 150, vx: 0, vy: 0, color: '#000000', type: 'eight', isPocketed: false },
  // Stripes (9-15)
  { id: 9, x: 460, y: 140, vx: 0, vy: 0, color: '#FFD700', type: 'stripe', isPocketed: false },
  { id: 10, x: 460, y: 160, vx: 0, vy: 0, color: '#0000FF', type: 'stripe', isPocketed: false },
  { id: 11, x: 460, y: 180, vx: 0, vy: 0, color: '#FF0000', type: 'stripe', isPocketed: false },
  { id: 12, x: 480, y: 110, vx: 0, vy: 0, color: '#800080', type: 'stripe', isPocketed: false },
  { id: 13, x: 480, y: 130, vx: 0, vy: 0, color: '#FFA500', type: 'stripe', isPocketed: false },
  { id: 14, x: 480, y: 150, vx: 0, vy: 0, color: '#008000', type: 'stripe', isPocketed: false },
  { id: 15, x: 480, y: 170, vx: 0, vy: 0, color: '#8B4513', type: 'stripe', isPocketed: false },
]

const Pool: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const [balls, setBalls] = useState<Ball[]>(initialBalls.map(b => ({ ...b })))
  const [currentPlayer, setCurrentPlayer] = useState(0)
  const [players, setPlayers] = useState<Player[]>([
    { type: null, score: 0, isAI: false },
    { type: null, score: 0, isAI: true }
  ])
  const [isAiming, setIsAiming] = useState(false)
  const [aimAngle, setAimAngle] = useState(0)
  const [aimPower, setAimPower] = useState(5)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isShooting, setIsShooting] = useState(false)
  const [foul, setFoul] = useState<string | null>(null)
  const [firstHit, setFirstHit] = useState<'solid' | 'stripe' | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('pool-highscore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  const resetGame = useCallback(() => {
    setBalls(initialBalls.map(b => ({ ...b })))
    setCurrentPlayer(0)
    setPlayers([
      { type: null, score: 0, isAI: false },
      { type: null, score: 0, isAI: true }
    ])
    setGameOver(false)
    setWinner(null)
    setIsAiming(false)
    setIsShooting(false)
    setFoul(null)
    setFirstHit(null)
  }, [])

  const checkCollision = (ball1: Ball, ball2: Ball): boolean => {
    const dx = ball1.x - ball2.x
    const dy = ball1.y - ball2.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < BALL_RADIUS * 2
  }

  const resolveCollision = (ball1: Ball, ball2: Ball) => {
    const dx = ball2.x - ball1.x
    const dy = ball2.y - ball1.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance === 0) return // Prevent division by zero
    
    // Normalize collision vector
    const nx = dx / distance
    const ny = dy / distance
    
    // Relative velocity
    const dvx = ball2.vx - ball1.vx
    const dvy = ball2.vy - ball1.vy
    
    // Relative velocity in collision normal direction
    const dvn = dvx * nx + dvy * ny
    
    // Do not resolve if velocities are separating
    if (dvn > 0) return
    
    // Collision impulse
    const impulse = dvn
    
    // Update velocities
    ball1.vx += impulse * nx
    ball1.vy += impulse * ny
    ball2.vx -= impulse * nx
    ball2.vy -= impulse * ny
    
    // Separate balls to prevent overlap
    const overlap = BALL_RADIUS * 2 - distance
    const separationX = nx * overlap / 2
    const separationY = ny * overlap / 2
    
    ball1.x -= separationX
    ball1.y -= separationY
    ball2.x += separationX
    ball2.y += separationY
  }

  const checkPocket = (ball: Ball): boolean => {
    for (const pocket of POCKET_POSITIONS) {
      const dx = ball.x - pocket.x
      const dy = ball.y - pocket.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < POCKET_RADIUS) {
        return true
      }
    }
    return false
  }

  const updatePhysics = useCallback(() => {
    setBalls(prevBalls => {
      let newBalls = prevBalls.map(ball => {
        if (ball.isPocketed) return ball
        
        let newBall = { ...ball }
        
        // Apply velocity
        newBall.x += newBall.vx
        newBall.y += newBall.vy
        
        // Apply friction
        newBall.vx *= FRICTION
        newBall.vy *= FRICTION
        
        // Stop if velocity is very small
        if (Math.abs(newBall.vx) < 0.01) newBall.vx = 0
        if (Math.abs(newBall.vy) < 0.01) newBall.vy = 0
        
        // Wall collisions
        if (newBall.x <= BALL_RADIUS || newBall.x >= TABLE_WIDTH - BALL_RADIUS) {
          newBall.vx = -newBall.vx * 0.9
          newBall.x = newBall.x <= BALL_RADIUS ? BALL_RADIUS : TABLE_WIDTH - BALL_RADIUS
        }
        if (newBall.y <= BALL_RADIUS || newBall.y >= TABLE_HEIGHT - BALL_RADIUS) {
          newBall.vy = -newBall.vy * 0.9
          newBall.y = newBall.y <= BALL_RADIUS ? BALL_RADIUS : TABLE_HEIGHT - BALL_RADIUS
        }
        
        return newBall
      })
      
      // Check ball-to-ball collisions
      for (let i = 0; i < newBalls.length; i++) {
        for (let j = i + 1; j < newBalls.length; j++) {
          if (!newBalls[i].isPocketed && !newBalls[j].isPocketed) {
            if (checkCollision(newBalls[i], newBalls[j])) {
              resolveCollision(newBalls[i], newBalls[j])
              
              // Track first hit for foul detection
              if (newBalls[i].type === 'cue' || newBalls[j].type === 'cue') {
                const hitBall = newBalls[i].type === 'cue' ? newBalls[j] : newBalls[i]
                if (hitBall.type !== 'cue' && !firstHit) {
                  setFirstHit(hitBall.type === 'eight' ? null : hitBall.type)
                }
              }
            }
          }
        }
      }
      
      // Check pockets
      newBalls = newBalls.map(ball => {
        if (!ball.isPocketed && checkPocket(ball)) {
          const pocketedBall = { ...ball, isPocketed: true, vx: 0, vy: 0 }
          
          // Handle scoring and fouls
          if (ball.type === 'cue') {
            setFoul('Scratched the cue ball!')
            // Reset cue ball position
            return { ...ball, x: 150, y: 150, vx: 0, vy: 0 }
          } else if (ball.type === 'eight') {
            // Check if player has pocketed all their balls
            const playerType = players[currentPlayer].type
            if (playerType) {
              const remainingBalls = newBalls.filter(b => 
                b.type === playerType && !b.isPocketed && b.id !== ball.id
              )
              if (remainingBalls.length === 0) {
                setWinner(currentPlayer)
                setGameOver(true)
              } else {
                setWinner(1 - currentPlayer)
                setGameOver(true)
              }
            }
          } else {
            // Regular ball pocketed
            const playersCopy = [...players]
            if (!playersCopy[currentPlayer].type) {
              // First ball pocketed determines player types
              playersCopy[currentPlayer].type = ball.type as 'solid' | 'stripe'
              playersCopy[1 - currentPlayer].type = ball.type === 'solid' ? 'stripe' : 'solid'
              setPlayers(playersCopy)
            }
            
            if (playersCopy[currentPlayer].type === ball.type) {
              playersCopy[currentPlayer].score++
              setPlayers(playersCopy)
            }
          }
          
          return pocketedBall
        }
        return ball
      })
      
      // Check if all balls stopped
      const allStopped = newBalls.every(b => b.vx === 0 && b.vy === 0)
      if (allStopped && isShooting) {
        setIsShooting(false)
        setFirstHit(null)
        
        // Switch turns
        if (!gameOver) {
          setCurrentPlayer(prev => 1 - prev)
        }
      }
      
      return newBalls
    })
  }, [currentPlayer, players, gameOver, isShooting, firstHit])

  const shoot = useCallback(() => {
    const cueBall = balls.find(b => b.type === 'cue')
    if (!cueBall || cueBall.isPocketed) return
    
    setBalls(prevBalls => prevBalls.map(ball => {
      if (ball.type === 'cue') {
        return {
          ...ball,
          vx: Math.cos(aimAngle) * aimPower,
          vy: Math.sin(aimAngle) * aimPower
        }
      }
      return ball
    }))
    
    setIsAiming(false)
    setIsShooting(true)
    setFoul(null)
  }, [balls, aimAngle, aimPower])

  const handleAITurn = useCallback(() => {
    if (players[currentPlayer].isAI && !isShooting && !gameOver) {
      const cueBall = balls.find(b => b.type === 'cue')
      if (!cueBall) return
      
      // AI targeting logic based on difficulty
      const targetBalls = balls.filter(b => {
        if (b.isPocketed || b.type === 'cue') return false
        if (!players[currentPlayer].type) return b.type !== 'eight'
        if (b.type === 'eight') {
          const remainingBalls = balls.filter(ball => 
            ball.type === players[currentPlayer].type && !ball.isPocketed
          )
          return remainingBalls.length === 0
        }
        return b.type === players[currentPlayer].type
      })
      
      if (targetBalls.length > 0) {
        const target = targetBalls[0]
        const dx = target.x - cueBall.x
        const dy = target.y - cueBall.y
        const angle = Math.atan2(dy, dx)
        
        // Add some randomness based on difficulty
        const errorRange = difficulty === 'Easy' ? 0.3 : difficulty === 'Medium' ? 0.15 : 0.05
        const angleError = (Math.random() - 0.5) * errorRange
        
        setAimAngle(angle + angleError)
        setAimPower(difficulty === 'Easy' ? 5 : difficulty === 'Medium' ? 7 : 10)
        
        setTimeout(() => {
          shoot()
        }, 1000)
      }
    }
  }, [players, currentPlayer, isShooting, gameOver, balls, difficulty, shoot])

  useEffect(() => {
    handleAITurn()
  }, [currentPlayer, handleAITurn])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT)
    
    // Draw table
    ctx.fillStyle = '#0a5f38'
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT)
    
    // Draw table border
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 10
    ctx.strokeRect(5, 5, TABLE_WIDTH - 10, TABLE_HEIGHT - 10)
    
    // Draw pockets
    ctx.fillStyle = '#000'
    POCKET_POSITIONS.forEach(pocket => {
      ctx.beginPath()
      ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    })
    
    // Draw balls
    balls.forEach(ball => {
      if (!ball.isPocketed) {
        // Ball shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.beginPath()
        ctx.arc(ball.x + 2, ball.y + 2, BALL_RADIUS, 0, Math.PI * 2)
        ctx.fill()
        
        // Ball
        ctx.fillStyle = ball.color
        ctx.beginPath()
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
        ctx.fill()
        
        // Stripe pattern
        if (ball.type === 'stripe') {
          ctx.fillStyle = 'white'
          ctx.fillRect(ball.x - BALL_RADIUS + 3, ball.y - 4, BALL_RADIUS * 2 - 6, 8)
        }
        
        // Ball number (simplified)
        if (ball.id > 0) {
          ctx.fillStyle = ball.type === 'stripe' ? 'black' : 'white'
          ctx.font = '10px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(ball.id.toString(), ball.x, ball.y)
        }
      }
    })
    
    // Draw aiming line
    if (isAiming && !players[currentPlayer].isAI) {
      const cueBall = balls.find(b => b.type === 'cue')
      if (cueBall && !cueBall.isPocketed) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(cueBall.x, cueBall.y)
        ctx.lineTo(
          cueBall.x + Math.cos(aimAngle) * 100,
          cueBall.y + Math.sin(aimAngle) * 100
        )
        ctx.stroke()
        ctx.setLineDash([])
        
        // Draw power indicator
        ctx.fillStyle = `hsl(${120 - (aimPower / MAX_POWER) * 120}, 100%, 50%)`
        ctx.fillRect(10, TABLE_HEIGHT - 30, (aimPower / MAX_POWER) * 100, 20)
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 2
        ctx.strokeRect(10, TABLE_HEIGHT - 30, 100, 20)
      }
    }
  }, [balls, isAiming, aimAngle, aimPower, players, currentPlayer])

  useEffect(() => {
    const animate = () => {
      updatePhysics()
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [updatePhysics, draw])

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAiming || players[currentPlayer].isAI) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const cueBall = balls.find(b => b.type === 'cue')
    if (cueBall && !cueBall.isPocketed) {
      const angle = Math.atan2(y - cueBall.y, x - cueBall.x)
      setAimAngle(angle)
      setMousePos({ x, y })
    }
  }

  const handleCanvasClick = () => {
    if (!players[currentPlayer].isAI && !isShooting && !gameOver) {
      if (isAiming) {
        shoot()
      } else {
        setIsAiming(true)
      }
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (isAiming && !players[currentPlayer].isAI) {
      e.preventDefault()
      setAimPower(prev => Math.max(1, Math.min(MAX_POWER, prev - e.deltaY * 0.01)))
    }
  }

  const calculateStars = () => {
    const playerScore = players[0].score
    if (playerScore >= 7) return 3
    if (playerScore >= 5) return 2
    if (playerScore >= 3) return 1
    return 0
  }

  useEffect(() => {
    if (gameOver && winner === 0) {
      const earnedStars = calculateStars()
      setStars(earnedStars)
      
      const newScore = players[0].score * 100 * (difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3)
      if (newScore > highScore) {
        setHighScore(newScore)
        localStorage.setItem('pool-highscore', newScore.toString())
      }
      
      if (earnedStars === 3) {
        setLevel(prev => prev + 1)
      }
    }
  }, [gameOver, winner, players, difficulty, highScore])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6" />
            8-Ball Pool
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              <span>High Score: {highScore}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>Level {level}</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={difficulty === 'Easy' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficulty('Easy')}
            >
              Easy
            </Button>
            <Button
              variant={difficulty === 'Medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficulty('Medium')}
            >
              Medium
            </Button>
            <Button
              variant={difficulty === 'Hard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficulty('Hard')}
            >
              Hard
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetGame}
            className="flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded",
            currentPlayer === 0 ? "bg-primary/10" : ""
          )}>
            <span>Player 1</span>
            {players[0].type && (
              <span className="font-bold">
                ({players[0].type === 'solid' ? 'Solids' : 'Stripes'})
              </span>
            )}
            <span>Score: {players[0].score}</span>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded",
            currentPlayer === 1 ? "bg-primary/10" : ""
          )}>
            <Bot className="w-4 h-4" />
            <span>AI ({difficulty})</span>
            {players[1].type && (
              <span className="font-bold">
                ({players[1].type === 'solid' ? 'Solids' : 'Stripes'})
              </span>
            )}
            <span>Score: {players[1].score}</span>
          </div>
        </div>

        {foul && (
          <div className="text-center text-red-500 font-bold">
            {foul}
          </div>
        )}

        <div className="relative flex justify-center">
          <canvas
            ref={canvasRef}
            width={TABLE_WIDTH}
            height={TABLE_HEIGHT}
            className="border-2 border-gray-800 rounded cursor-pointer"
            onMouseMove={handleCanvasMouseMove}
            onClick={handleCanvasClick}
            onWheel={handleWheel}
          />
        </div>

        {isAiming && !players[currentPlayer].isAI && (
          <div className="text-center text-sm text-muted-foreground">
            Move mouse to aim, scroll to adjust power, click to shoot
          </div>
        )}

        {gameOver && (
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold">
              {winner === 0 ? 'You Win!' : 'AI Wins!'}
            </div>
            {winner === 0 && (
              <div className="flex justify-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-8 h-8",
                      i < stars ? "fill-yellow-500 text-yellow-500" : "text-gray-300"
                    )}
                  />
                ))}
              </div>
            )}
            <Button onClick={resetGame}>Play Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default Pool