'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Pause } from 'lucide-react'

interface Position {
  x: number
  y: number
}

type Direction = 'up' | 'down' | 'left' | 'right'

interface SnakeGameProps {
  levelConfig: {
    speed: number
    growthRate: number
    foodToWin: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Slow Snake',
    difficulty: 'easy',
    config: { speed: 100, growthRate: 1, foodToWin: 10 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Quick Slither',
    difficulty: 'medium',
    config: { speed: 80, growthRate: 2, foodToWin: 20 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Fast Hunter',
    difficulty: 'hard',
    config: { speed: 60, growthRate: 2, foodToWin: 30 },
    requiredStars: 4
  },
  {
    id: 4,
    name: 'Speed Demon',
    difficulty: 'expert',
    config: { speed: 40, growthRate: 3, foodToWin: 40 },
    requiredStars: 6
  },
  {
    id: 5,
    name: 'Lightning Snake',
    difficulty: 'master',
    config: { speed: 30, growthRate: 3, foodToWin: 50 },
    requiredStars: 8
  }
]

function SnakeGame({ levelConfig, onScore }: SnakeGameProps) {
  const GRID_SIZE = 20
  const CELL_SIZE = 20
  const CANVAS_SIZE = GRID_SIZE * CELL_SIZE

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Position>({ x: 15, y: 10 })
  const [direction, setDirection] = useState<Direction>('right')
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'gameOver' | 'won'>('waiting')
  const [score, setScore] = useState(0)
  const [foodEaten, setFoodEaten] = useState(0)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const nextDirectionRef = useRef<Direction>('right')

  // Generate random food position
  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [])

  // Draw game on canvas
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw grid lines
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 1
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // Draw food with pulsing effect
    const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8
    ctx.fillStyle = '#ef4444'
    ctx.globalAlpha = pulse
    ctx.fillRect(
      food.x * CELL_SIZE + 2,
      food.y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4
    )
    ctx.globalAlpha = 1

    // Draw snake with gradient
    snake.forEach((segment, index) => {
      if (index === 0) {
        // Head with gradient
        const gradient = ctx.createLinearGradient(
          segment.x * CELL_SIZE,
          segment.y * CELL_SIZE,
          segment.x * CELL_SIZE + CELL_SIZE,
          segment.y * CELL_SIZE + CELL_SIZE
        )
        gradient.addColorStop(0, '#22c55e')
        gradient.addColorStop(1, '#16a34a')
        ctx.fillStyle = gradient
      } else {
        // Body
        ctx.fillStyle = '#16a34a'
      }
      ctx.fillRect(
        segment.x * CELL_SIZE + 2,
        segment.y * CELL_SIZE + 2,
        CELL_SIZE - 4,
        CELL_SIZE - 4
      )
    })
  }, [snake, food, CANVAS_SIZE])

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameState !== 'playing') return

    setSnake(currentSnake => {
      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }

      // Update head position based on direction
      switch (nextDirectionRef.current) {
        case 'up':
          head.y -= 1
          break
        case 'down':
          head.y += 1
          break
        case 'left':
          head.x -= 1
          break
        case 'right':
          head.x += 1
          break
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameState('gameOver')
        onScore(score)
        return currentSnake
      }

      // Check self collision
      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameState('gameOver')
        onScore(score)
        return currentSnake
      }

      // Add new head
      newSnake.unshift(head)

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10
        setScore(newScore)
        const newFoodEaten = foodEaten + 1
        setFoodEaten(newFoodEaten)
        setFood(generateFood(newSnake))
        
        // Check win condition
        if (newFoodEaten >= levelConfig.foodToWin) {
          setGameState('won')
          onScore(newScore + 500) // Bonus for winning
          return newSnake
        }
        
        // Grow snake based on growth rate
        for (let i = 1; i < levelConfig.growthRate; i++) {
          newSnake.push({ ...newSnake[newSnake.length - 1] })
        }
      } else {
        // Remove tail if no food eaten
        newSnake.pop()
      }

      return newSnake
    })

    setDirection(nextDirectionRef.current)
  }, [gameState, food, score, foodEaten, levelConfig, generateFood, onScore])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return

      const newDirection = (() => {
        switch (e.key) {
          case 'ArrowUp':
            return direction !== 'down' ? 'up' : direction
          case 'ArrowDown':
            return direction !== 'up' ? 'down' : direction
          case 'ArrowLeft':
            return direction !== 'right' ? 'left' : direction
          case 'ArrowRight':
            return direction !== 'left' ? 'right' : direction
          default:
            return direction
        }
      })()

      if (newDirection !== direction) {
        nextDirectionRef.current = newDirection as Direction
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, direction])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        moveSnake()
      }, levelConfig.speed)
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState, moveSnake, levelConfig.speed])

  // Draw game on every frame
  useEffect(() => {
    drawGame()
  }, [drawGame])

  // Start game
  const startGame = () => {
    setSnake([{ x: 10, y: 10 }])
    setFood({ x: 15, y: 10 })
    setDirection('right')
    nextDirectionRef.current = 'right'
    setScore(0)
    setFoodEaten(0)
    setGameState('playing')
  }

  // Pause/Resume game
  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused')
    } else if (gameState === 'paused') {
      setGameState('playing')
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <div className="text-lg font-semibold">Score: {score}</div>
            <div className="text-lg font-semibold">Food: {foodEaten}/{levelConfig.foodToWin}</div>
            <div className="text-lg font-semibold">Length: {snake.length}</div>
          </div>
          <div className="flex gap-2">
            {gameState === 'waiting' && (
              <Button onClick={startGame} size="sm">
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
            {gameState === 'playing' && (
              <Button onClick={togglePause} size="sm" variant="outline">
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            )}
            {gameState === 'paused' && (
              <Button onClick={togglePause} size="sm">
                <Play className="w-4 h-4 mr-1" />
                Resume
              </Button>
            )}
            {(gameState === 'gameOver' || gameState === 'won') && (
              <Button onClick={startGame} size="sm">
                <RotateCcw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border border-gray-700 mx-auto"
        />

        {gameState === 'waiting' && (
          <div className="text-center mt-4 text-gray-500">
            Press "Start" to begin. Use arrow keys to control the snake.
          </div>
        )}

        {gameState === 'paused' && (
          <div className="text-center mt-4 text-yellow-600 font-semibold">
            Game Paused
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="text-center mt-4 text-red-600 font-semibold">
            Game Over! Final Score: {score}
          </div>
        )}

        {gameState === 'won' && (
          <div className="text-center mt-4 text-green-600 font-semibold">
            Level Complete! 🎉 Final Score: {score}
          </div>
        )}

        <div className="text-center mt-4 text-sm text-gray-600">
          Speed: {levelConfig.speed}ms | Growth Rate: {levelConfig.growthRate}x
        </div>
      </CardContent>
    </Card>
  )
}

export default function SnakeRealtimeWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    // Scoring based on food eaten and speed
    if (score >= 1500) return 3
    if (score >= 800) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="snake-realtime"
      gameName="Snake"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <SnakeGame levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}