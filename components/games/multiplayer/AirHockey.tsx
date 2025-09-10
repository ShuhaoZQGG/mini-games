'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Bot, Circle, Zap, Star, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

type Difficulty = 'Easy' | 'Medium' | 'Hard'

interface Puck {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface Paddle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  isAI: boolean
}

const TABLE_WIDTH = 400
const TABLE_HEIGHT = 600
const PUCK_RADIUS = 15
const PADDLE_RADIUS = 30
const GOAL_WIDTH = 120
const FRICTION = 0.99
const MAX_SPEED = 15
const AI_SPEED = { Easy: 3, Medium: 5, Hard: 7 }
const AI_REACTION_TIME = { Easy: 300, Medium: 150, Hard: 50 }

const AirHockey: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef<number>(0)
  
  const [puck, setPuck] = useState<Puck>({
    x: TABLE_WIDTH / 2,
    y: TABLE_HEIGHT / 2,
    vx: 0,
    vy: 0,
    radius: PUCK_RADIUS
  })
  
  const [playerPaddle, setPlayerPaddle] = useState<Paddle>({
    x: TABLE_WIDTH / 2,
    y: TABLE_HEIGHT - 100,
    vx: 0,
    vy: 0,
    radius: PADDLE_RADIUS,
    isAI: false
  })
  
  const [aiPaddle, setAiPaddle] = useState<Paddle>({
    x: TABLE_WIDTH / 2,
    y: 100,
    vx: 0,
    vy: 0,
    radius: PADDLE_RADIUS,
    isAI: true
  })
  
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [lastAIUpdate, setLastAIUpdate] = useState(0)
  const [gameTime, setGameTime] = useState(0)
  const [hits, setHits] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [currentCombo, setCurrentCombo] = useState(0)
  
  const WINNING_SCORE = 7

  useEffect(() => {
    const saved = localStorage.getItem('airhockey-highscore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  const resetGame = useCallback(() => {
    setPuck({
      x: TABLE_WIDTH / 2,
      y: TABLE_HEIGHT / 2,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      radius: PUCK_RADIUS
    })
    setPlayerPaddle({
      x: TABLE_WIDTH / 2,
      y: TABLE_HEIGHT - 100,
      vx: 0,
      vy: 0,
      radius: PADDLE_RADIUS,
      isAI: false
    })
    setAiPaddle({
      x: TABLE_WIDTH / 2,
      y: 100,
      vx: 0,
      vy: 0,
      radius: PADDLE_RADIUS,
      isAI: true
    })
    setPlayerScore(0)
    setAiScore(0)
    setGameOver(false)
    setWinner(null)
    setIsPaused(false)
    setGameTime(0)
    setHits(0)
    setMaxCombo(0)
    setCurrentCombo(0)
  }, [])

  const resetPuck = useCallback((scoredTop: boolean) => {
    setPuck({
      x: TABLE_WIDTH / 2,
      y: TABLE_HEIGHT / 2,
      vx: (Math.random() - 0.5) * 3,
      vy: scoredTop ? 3 : -3,
      radius: PUCK_RADIUS
    })
    setCurrentCombo(0)
  }, [])

  const checkCollision = (obj1: { x: number; y: number; radius: number }, 
                         obj2: { x: number; y: number; radius: number }): boolean => {
    const dx = obj1.x - obj2.x
    const dy = obj1.y - obj2.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance < obj1.radius + obj2.radius
  }

  const resolveCollision = (puck: Puck, paddle: Paddle): Puck => {
    const dx = puck.x - paddle.x
    const dy = puck.y - paddle.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance === 0) return puck
    
    // Normalize collision vector
    const nx = dx / distance
    const ny = dy / distance
    
    // Relative velocity
    const dvx = puck.vx - paddle.vx
    const dvy = puck.vy - paddle.vy
    
    // Relative velocity in collision normal direction
    const dvn = dvx * nx + dvy * ny
    
    // Do not resolve if velocities are separating
    if (dvn > 0) return puck
    
    // Calculate new velocity
    const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy)
    const newSpeed = Math.min(speed * 1.1 + 2, MAX_SPEED)
    
    // Add paddle velocity influence
    const influenceFactor = 0.3
    
    return {
      ...puck,
      vx: nx * newSpeed + paddle.vx * influenceFactor,
      vy: ny * newSpeed + paddle.vy * influenceFactor,
      x: paddle.x + nx * (paddle.radius + puck.radius + 1),
      y: paddle.y + ny * (paddle.radius + puck.radius + 1)
    }
  }

  const updateAI = useCallback((currentTime: number) => {
    if (currentTime - lastAIUpdate < AI_REACTION_TIME[difficulty]) {
      return aiPaddle
    }
    
    setLastAIUpdate(currentTime)
    
    const maxY = TABLE_HEIGHT / 2 - 50
    const targetY = Math.min(puck.y, maxY)
    
    // Predict puck position for harder difficulties
    let targetX = puck.x
    if (difficulty === 'Hard' && puck.vy < 0) {
      const timeToReach = (aiPaddle.y - puck.y) / puck.vy
      targetX = puck.x + puck.vx * timeToReach
    }
    
    const dx = targetX - aiPaddle.x
    const dy = targetY - aiPaddle.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    const speed = AI_SPEED[difficulty]
    
    if (distance > speed) {
      const vx = (dx / distance) * speed
      const vy = (dy / distance) * speed
      
      return {
        ...aiPaddle,
        x: Math.max(PADDLE_RADIUS, Math.min(TABLE_WIDTH - PADDLE_RADIUS, aiPaddle.x + vx)),
        y: Math.max(PADDLE_RADIUS, Math.min(maxY, aiPaddle.y + vy)),
        vx,
        vy
      }
    }
    
    return { ...aiPaddle, vx: 0, vy: 0 }
  }, [aiPaddle, puck, difficulty, lastAIUpdate])

  const updatePhysics = useCallback((deltaTime: number) => {
    if (isPaused || gameOver) return
    
    setGameTime(prev => prev + deltaTime)
    
    // Update AI
    setAiPaddle(prev => updateAI(Date.now()))
    
    // Update puck
    setPuck(prevPuck => {
      let newPuck = { ...prevPuck }
      
      // Apply velocity
      newPuck.x += newPuck.vx
      newPuck.y += newPuck.vy
      
      // Apply friction
      newPuck.vx *= FRICTION
      newPuck.vy *= FRICTION
      
      // Wall collisions (left and right)
      if (newPuck.x <= PUCK_RADIUS || newPuck.x >= TABLE_WIDTH - PUCK_RADIUS) {
        newPuck.vx = -newPuck.vx * 0.9
        newPuck.x = newPuck.x <= PUCK_RADIUS ? PUCK_RADIUS : TABLE_WIDTH - PUCK_RADIUS
      }
      
      // Top and bottom wall collisions (check for goals)
      const goalLeft = TABLE_WIDTH / 2 - GOAL_WIDTH / 2
      const goalRight = TABLE_WIDTH / 2 + GOAL_WIDTH / 2
      
      // Top wall (AI side)
      if (newPuck.y <= PUCK_RADIUS) {
        if (newPuck.x >= goalLeft && newPuck.x <= goalRight) {
          // Player scores!
          setPlayerScore(prev => {
            const newScore = prev + 1
            if (newScore >= WINNING_SCORE) {
              setGameOver(true)
              setWinner('player')
            }
            return newScore
          })
          resetPuck(true)
          return newPuck
        } else {
          newPuck.vy = -newPuck.vy * 0.9
          newPuck.y = PUCK_RADIUS
        }
      }
      
      // Bottom wall (Player side)
      if (newPuck.y >= TABLE_HEIGHT - PUCK_RADIUS) {
        if (newPuck.x >= goalLeft && newPuck.x <= goalRight) {
          // AI scores!
          setAiScore(prev => {
            const newScore = prev + 1
            if (newScore >= WINNING_SCORE) {
              setGameOver(true)
              setWinner('ai')
            }
            return newScore
          })
          resetPuck(false)
          return newPuck
        } else {
          newPuck.vy = -newPuck.vy * 0.9
          newPuck.y = TABLE_HEIGHT - PUCK_RADIUS
        }
      }
      
      return newPuck
    })
    
    // Check paddle-puck collisions
    if (checkCollision(puck, playerPaddle)) {
      setPuck(prev => resolveCollision(prev, playerPaddle))
      setHits(prev => prev + 1)
      setCurrentCombo(prev => {
        const newCombo = prev + 1
        setMaxCombo(max => Math.max(max, newCombo))
        return newCombo
      })
    }
    
    if (checkCollision(puck, aiPaddle)) {
      setPuck(prev => resolveCollision(prev, aiPaddle))
    }
  }, [puck, playerPaddle, aiPaddle, isPaused, gameOver, updateAI, resetPuck])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear canvas
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT)
    
    // Draw table
    const gradient = ctx.createLinearGradient(0, 0, 0, TABLE_HEIGHT)
    gradient.addColorStop(0, '#1e3a8a')
    gradient.addColorStop(0.5, '#3b82f6')
    gradient.addColorStop(1, '#1e3a8a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT)
    
    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.setLineDash([10, 10])
    ctx.beginPath()
    ctx.moveTo(0, TABLE_HEIGHT / 2)
    ctx.lineTo(TABLE_WIDTH, TABLE_HEIGHT / 2)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Draw center circle
    ctx.beginPath()
    ctx.arc(TABLE_WIDTH / 2, TABLE_HEIGHT / 2, 50, 0, Math.PI * 2)
    ctx.stroke()
    
    // Draw goals
    const goalLeft = TABLE_WIDTH / 2 - GOAL_WIDTH / 2
    const goalRight = TABLE_WIDTH / 2 + GOAL_WIDTH / 2
    
    // Top goal
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
    ctx.fillRect(goalLeft, 0, GOAL_WIDTH, 20)
    ctx.strokeStyle = '#ff0000'
    ctx.lineWidth = 3
    ctx.strokeRect(goalLeft, 0, GOAL_WIDTH, 20)
    
    // Bottom goal
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'
    ctx.fillRect(goalLeft, TABLE_HEIGHT - 20, GOAL_WIDTH, 20)
    ctx.strokeStyle = '#00ff00'
    ctx.strokeRect(goalLeft, TABLE_HEIGHT - 20, GOAL_WIDTH, 20)
    
    // Draw puck shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.beginPath()
    ctx.arc(puck.x + 3, puck.y + 3, puck.radius, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw puck
    const puckGradient = ctx.createRadialGradient(puck.x - 5, puck.y - 5, 0, puck.x, puck.y, puck.radius)
    puckGradient.addColorStop(0, '#ffffff')
    puckGradient.addColorStop(1, '#e0e0e0')
    ctx.fillStyle = puckGradient
    ctx.beginPath()
    ctx.arc(puck.x, puck.y, puck.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Draw AI paddle
    const aiGradient = ctx.createRadialGradient(aiPaddle.x - 10, aiPaddle.y - 10, 0, aiPaddle.x, aiPaddle.y, aiPaddle.radius)
    aiGradient.addColorStop(0, '#ff6666')
    aiGradient.addColorStop(1, '#cc0000')
    ctx.fillStyle = aiGradient
    ctx.beginPath()
    ctx.arc(aiPaddle.x, aiPaddle.y, aiPaddle.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#800000'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Draw player paddle
    const playerGradient = ctx.createRadialGradient(playerPaddle.x - 10, playerPaddle.y - 10, 0, playerPaddle.x, playerPaddle.y, playerPaddle.radius)
    playerGradient.addColorStop(0, '#66ff66')
    playerGradient.addColorStop(1, '#00cc00')
    ctx.fillStyle = playerGradient
    ctx.beginPath()
    ctx.arc(playerPaddle.x, playerPaddle.y, playerPaddle.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#008000'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Draw combo indicator
    if (currentCombo > 1) {
      ctx.fillStyle = `hsl(${120 - currentCombo * 10}, 100%, 50%)`
      ctx.font = 'bold 20px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${currentCombo}x COMBO!`, TABLE_WIDTH / 2, TABLE_HEIGHT / 2 + 100)
    }
  }, [puck, playerPaddle, aiPaddle, currentCombo])

  useEffect(() => {
    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime
      
      if (deltaTime < 100) {  // Prevent huge jumps
        updatePhysics(deltaTime / 1000)
      }
      
      draw()
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [updatePhysics, draw])

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver || isPaused) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Limit paddle to player's half
    const maxY = TABLE_HEIGHT - 50
    const minY = TABLE_HEIGHT / 2 + 50
    
    setPlayerPaddle(prev => {
      const newX = Math.max(PADDLE_RADIUS, Math.min(TABLE_WIDTH - PADDLE_RADIUS, x))
      const newY = Math.max(minY, Math.min(maxY, y))
      
      return {
        ...prev,
        x: newX,
        y: newY,
        vx: newX - prev.x,
        vy: newY - prev.y
      }
    })
  }

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameOver || isPaused) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    // Limit paddle to player's half
    const maxY = TABLE_HEIGHT - 50
    const minY = TABLE_HEIGHT / 2 + 50
    
    setPlayerPaddle(prev => {
      const newX = Math.max(PADDLE_RADIUS, Math.min(TABLE_WIDTH - PADDLE_RADIUS, x))
      const newY = Math.max(minY, Math.min(maxY, y))
      
      return {
        ...prev,
        x: newX,
        y: newY,
        vx: newX - prev.x,
        vy: newY - prev.y
      }
    })
  }

  const calculateStars = () => {
    if (winner !== 'player') return 0
    const scoreDiff = playerScore - aiScore
    
    if (scoreDiff >= 5 && maxCombo >= 10) return 3
    if (scoreDiff >= 3 && maxCombo >= 5) return 2
    if (scoreDiff >= 1) return 1
    return 0
  }

  useEffect(() => {
    if (gameOver && winner === 'player') {
      const earnedStars = calculateStars()
      setStars(earnedStars)
      
      const score = (playerScore * 1000 + hits * 10 + maxCombo * 100) * 
                   (difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3)
      
      if (score > highScore) {
        setHighScore(score)
        localStorage.setItem('airhockey-highscore', score.toString())
      }
      
      if (earnedStars === 3) {
        setLevel(prev => prev + 1)
      }
    }
  }, [gameOver, winner, playerScore, aiScore, hits, maxCombo, difficulty, highScore])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Circle className="w-6 h-6" />
            Air Hockey
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
              disabled={!gameOver && (playerScore > 0 || aiScore > 0)}
            >
              Easy
            </Button>
            <Button
              variant={difficulty === 'Medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficulty('Medium')}
              disabled={!gameOver && (playerScore > 0 || aiScore > 0)}
            >
              Medium
            </Button>
            <Button
              variant={difficulty === 'Hard' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficulty('Hard')}
              disabled={!gameOver && (playerScore > 0 || aiScore > 0)}
            >
              Hard
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              disabled={gameOver}
              className="flex items-center gap-1"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetGame}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              New Game
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center text-lg font-bold">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span>AI ({difficulty})</span>
            <span className="text-2xl text-red-500">{aiScore}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            First to {WINNING_SCORE}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl text-green-500">{playerScore}</span>
            <span>You</span>
          </div>
        </div>

        {currentCombo > 1 && (
          <div className="text-center text-lg font-bold text-yellow-500">
            {currentCombo}x Combo!
          </div>
        )}

        <div className="relative flex justify-center">
          <canvas
            ref={canvasRef}
            width={TABLE_WIDTH}
            height={TABLE_HEIGHT}
            className="border-4 border-gray-800 rounded-lg cursor-none touch-none"
            onMouseMove={handleCanvasMouseMove}
            onTouchMove={handleCanvasTouchMove}
          />
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="text-white text-2xl font-bold">PAUSED</div>
            </div>
          )}
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Hits: {hits}</span>
          <span>Max Combo: {maxCombo}x</span>
          <span>Time: {Math.floor(gameTime)}s</span>
        </div>

        {gameOver && (
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold">
              {winner === 'player' ? 'You Win!' : 'AI Wins!'}
            </div>
            <div className="text-lg">
              Final Score: {playerScore} - {aiScore}
            </div>
            {winner === 'player' && (
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

export default AirHockey