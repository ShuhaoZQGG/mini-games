'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Pause } from 'lucide-react'

const GRID_SIZE = 20
const CELL_SIZE = 20

interface Position {
  x: number
  y: number
}

interface SnakeGameProps {
  levelConfig: {
    speed: number
    targetScore: number
    obstacles?: Position[]
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner Snake',
    difficulty: 'easy',
    config: { speed: 150, targetScore: 10 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Normal Speed',
    difficulty: 'medium',
    config: { speed: 100, targetScore: 20 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Fast Snake',
    difficulty: 'hard',
    config: { speed: 75, targetScore: 30 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Speed',
    difficulty: 'expert',
    config: { speed: 50, targetScore: 40, obstacles: [] },
    requiredStars: 8
  },
  {
    id: 5,
    name: 'Master Challenge',
    difficulty: 'master',
    config: { speed: 35, targetScore: 50 },
    requiredStars: 12
  }
]

function SnakeGame({ levelConfig, onScore }: SnakeGameProps) {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [food, setFood] = useState<Position>({ x: 15, y: 15 })
  const [direction, setDirection] = useState<Position>({ x: 1, y: 0 })
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'paused' | 'gameOver'>('waiting')
  const [score, setScore] = useState(0)
  const gameLoopRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const generateFood = useCallback(() => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [snake])

  const moveSnake = useCallback(() => {
    if (gameState !== 'playing') return

    setSnake(currentSnake => {
      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }
      
      head.x += direction.x
      head.y += direction.y

      // Check walls
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

      newSnake.unshift(head)

      // Check food
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 1)
        setFood(generateFood())
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [direction, food, gameState, score, onScore, generateFood])

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(moveSnake, levelConfig.speed)
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
  }, [gameState, moveSnake, levelConfig.speed])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return

      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 })
          break
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 })
          break
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 })
          break
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 })
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [direction, gameState])

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }])
    setFood({ x: 15, y: 15 })
    setDirection({ x: 1, y: 0 })
    setScore(0)
    setGameState('playing')
  }

  const resetGame = () => {
    setGameState('waiting')
    setSnake([{ x: 10, y: 10 }])
    setFood({ x: 15, y: 15 })
    setDirection({ x: 1, y: 0 })
    setScore(0)
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold">
            Score: <span className="text-blue-600">{score}</span>
          </div>
          <div className="text-lg font-semibold">
            Target: <span className="text-green-600">{levelConfig.targetScore}</span>
          </div>
          <div className="text-lg font-semibold">
            Speed: <span className="text-purple-600">{Math.round(1000 / levelConfig.speed)} moves/s</span>
          </div>
        </div>

        <div 
          className="relative mx-auto bg-gray-800 rounded"
          style={{ 
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE
          }}
        >
          {/* Snake */}
          {snake.map((segment, index) => (
            <div
              key={index}
              className={`absolute ${index === 0 ? 'bg-green-500' : 'bg-green-400'}`}
              style={{
                left: segment.x * CELL_SIZE,
                top: segment.y * CELL_SIZE,
                width: CELL_SIZE - 1,
                height: CELL_SIZE - 1
              }}
            />
          ))}

          {/* Food */}
          <div
            className="absolute bg-red-500 rounded-full"
            style={{
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              width: CELL_SIZE - 1,
              height: CELL_SIZE - 1
            }}
          />

          {/* Game Over Overlay */}
          {gameState === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
                <p className="mb-4">Final Score: {score}</p>
                <Button onClick={resetGame} variant="secondary">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-4">
          {gameState === 'waiting' && (
            <Button onClick={startGame} size="lg">
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          )}
          {gameState === 'playing' && (
            <Button onClick={() => setGameState('paused')} size="lg">
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}
          {gameState === 'paused' && (
            <Button onClick={() => setGameState('playing')} size="lg">
              <Play className="w-5 h-5 mr-2" />
              Resume
            </Button>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Use arrow keys to control the snake
        </div>
      </CardContent>
    </Card>
  )
}

export default function SnakeWithLevels() {
  const getStars = (score: number, levelConfig: any) => {
    const percentage = (score / levelConfig.targetScore) * 100
    if (percentage >= 100) return 3
    if (percentage >= 70) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="snake"
      gameName="Snake Game"
      levels={levels}
      renderGame={(config, onScore) => <SnakeGame levelConfig={config} onScore={onScore} />}
      getStars={getStars}
    />
  )
}