'use client'

import { useState, useEffect, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, Pause } from 'lucide-react'

interface BlockBlastProps {
  levelConfig: {
    rows: number
    cols: number
    blockTypes: number
    speed: number
    targetLines: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner',
    difficulty: 'easy',
    config: { rows: 20, cols: 10, blockTypes: 4, speed: 1000, targetLines: 10 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Intermediate',
    difficulty: 'medium',
    config: { rows: 20, cols: 10, blockTypes: 5, speed: 800, targetLines: 20 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Advanced',
    difficulty: 'hard',
    config: { rows: 20, cols: 12, blockTypes: 6, speed: 600, targetLines: 30 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert',
    difficulty: 'expert',
    config: { rows: 22, cols: 12, blockTypes: 7, speed: 400, targetLines: 40 },
    requiredStars: 8
  },
  {
    id: 5,
    name: 'Master',
    difficulty: 'master',
    config: { rows: 24, cols: 14, blockTypes: 8, speed: 300, targetLines: 50 },
    requiredStars: 12
  }
]

const BLOCK_SHAPES = [
  // I piece
  [[1, 1, 1, 1]],
  // O piece
  [[1, 1], [1, 1]],
  // T piece
  [[0, 1, 0], [1, 1, 1]],
  // S piece
  [[0, 1, 1], [1, 1, 0]],
  // Z piece
  [[1, 1, 0], [0, 1, 1]],
  // J piece
  [[1, 0, 0], [1, 1, 1]],
  // L piece
  [[0, 0, 1], [1, 1, 1]],
  // Plus piece
  [[0, 1, 0], [1, 1, 1], [0, 1, 0]]
]

const COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-cyan-500'
]

function BlockBlast({ levelConfig, onScore }: BlockBlastProps) {
  const { rows, cols, blockTypes, speed, targetLines } = levelConfig
  const [grid, setGrid] = useState<number[][]>([])
  const [currentPiece, setCurrentPiece] = useState<{ shape: number[][], x: number, y: number, color: number } | null>(null)
  const [score, setScore] = useState(0)
  const [linesCleared, setLinesCleared] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [dropTimer, setDropTimer] = useState<NodeJS.Timeout | null>(null)

  // Initialize empty grid
  const initializeGrid = useCallback(() => {
    return Array(rows).fill(null).map(() => Array(cols).fill(0))
  }, [rows, cols])

  // Generate random piece
  const generatePiece = useCallback(() => {
    const shapeIndex = Math.floor(Math.random() * Math.min(blockTypes, BLOCK_SHAPES.length))
    const shape = BLOCK_SHAPES[shapeIndex]
    const colorIndex = shapeIndex + 1 // 1-indexed for colors
    return {
      shape,
      x: Math.floor((cols - shape[0].length) / 2),
      y: 0,
      color: colorIndex
    }
  }, [cols, blockTypes])

  // Check if piece can be placed at position
  const canPlacePiece = useCallback((piece: typeof currentPiece, grid: number[][], x: number, y: number) => {
    if (!piece) return false
    
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const newX = x + col
          const newY = y + row
          
          if (newX < 0 || newX >= cols || newY >= rows) {
            return false
          }
          
          if (newY >= 0 && grid[newY][newX]) {
            return false
          }
        }
      }
    }
    return true
  }, [cols, rows])

  // Place piece on grid
  const placePiece = useCallback((piece: typeof currentPiece, grid: number[][]) => {
    if (!piece) return grid
    
    const newGrid = grid.map(row => [...row])
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const y = piece.y + row
          const x = piece.x + col
          if (y >= 0 && y < rows && x >= 0 && x < cols) {
            newGrid[y][x] = piece.color
          }
        }
      }
    }
    return newGrid
  }, [rows, cols])

  // Clear completed lines
  const clearLines = useCallback((grid: number[][]) => {
    let newGrid = [...grid]
    let clearedCount = 0
    
    for (let row = rows - 1; row >= 0; row--) {
      if (newGrid[row].every(cell => cell !== 0)) {
        newGrid.splice(row, 1)
        newGrid.unshift(Array(cols).fill(0))
        clearedCount++
        row++ // Check the same row again
      }
    }
    
    if (clearedCount > 0) {
      const points = clearedCount * 100 * clearedCount // Bonus for multiple lines
      setScore(prev => prev + points)
      setLinesCleared(prev => prev + clearedCount)
      onScore(points)
    }
    
    return newGrid
  }, [rows, cols, onScore])

  // Move piece
  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || !gameStarted || gameOver || isPaused) return false
    
    const newX = currentPiece.x + dx
    const newY = currentPiece.y + dy
    
    if (canPlacePiece(currentPiece, grid, newX, newY)) {
      setCurrentPiece({ ...currentPiece, x: newX, y: newY })
      return true
    }
    
    return false
  }, [currentPiece, grid, gameStarted, gameOver, isPaused, canPlacePiece])

  // Rotate piece
  const rotatePiece = useCallback(() => {
    if (!currentPiece || !gameStarted || gameOver || isPaused) return
    
    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    )
    
    const rotatedPiece = { ...currentPiece, shape: rotated }
    
    if (canPlacePiece(rotatedPiece, grid, currentPiece.x, currentPiece.y)) {
      setCurrentPiece(rotatedPiece)
    }
  }, [currentPiece, grid, gameStarted, gameOver, isPaused, canPlacePiece])

  // Drop piece instantly
  const dropPiece = useCallback(() => {
    if (!currentPiece || !gameStarted || gameOver || isPaused) return
    
    let newY = currentPiece.y
    while (canPlacePiece(currentPiece, grid, currentPiece.x, newY + 1)) {
      newY++
    }
    
    setCurrentPiece({ ...currentPiece, y: newY })
  }, [currentPiece, grid, gameStarted, gameOver, isPaused, canPlacePiece])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver || isPaused) return
      
      switch (e.key) {
        case 'ArrowLeft':
          movePiece(-1, 0)
          break
        case 'ArrowRight':
          movePiece(1, 0)
          break
        case 'ArrowDown':
          movePiece(0, 1)
          break
        case 'ArrowUp':
          rotatePiece()
          break
        case ' ':
          e.preventDefault()
          dropPiece()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [movePiece, rotatePiece, dropPiece, gameStarted, gameOver, isPaused])

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) {
      if (dropTimer) {
        clearInterval(dropTimer)
        setDropTimer(null)
      }
      return
    }
    
    const timer = setInterval(() => {
      if (!currentPiece) {
        const newPiece = generatePiece()
        if (canPlacePiece(newPiece, grid, newPiece.x, newPiece.y)) {
          setCurrentPiece(newPiece)
        } else {
          setGameOver(true)
        }
      } else {
        if (!movePiece(0, 1)) {
          // Can't move down, place the piece
          const newGrid = placePiece(currentPiece, grid)
          const clearedGrid = clearLines(newGrid)
          setGrid(clearedGrid)
          setCurrentPiece(null)
        }
      }
    }, speed)
    
    setDropTimer(timer)
    return () => clearInterval(timer)
  }, [gameStarted, gameOver, isPaused, currentPiece, grid, speed, movePiece, generatePiece, canPlacePiece, placePiece, clearLines])

  // Check win condition
  useEffect(() => {
    if (linesCleared >= targetLines && !gameOver) {
      setGameOver(true)
      onScore(score + 1000) // Bonus for completing level
    }
  }, [linesCleared, targetLines, gameOver, score, onScore])

  const startGame = () => {
    setGrid(initializeGrid())
    setCurrentPiece(null)
    setScore(0)
    setLinesCleared(0)
    setGameStarted(true)
    setGameOver(false)
    setIsPaused(false)
  }

  const togglePause = () => {
    if (gameStarted && !gameOver) {
      setIsPaused(!isPaused)
    }
  }

  // Render grid with current piece
  const renderGrid = () => {
    const displayGrid = grid.map(row => [...row])
    
    if (currentPiece && !gameOver) {
      for (let row = 0; row < currentPiece.shape.length; row++) {
        for (let col = 0; col < currentPiece.shape[row].length; col++) {
          if (currentPiece.shape[row][col]) {
            const y = currentPiece.y + row
            const x = currentPiece.x + col
            if (y >= 0 && y < rows && x >= 0 && x < cols) {
              displayGrid[y][x] = currentPiece.color
            }
          }
        }
      }
    }
    
    return displayGrid
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Score: {score}</h3>
            <p className="text-sm text-muted-foreground">
              Lines: {linesCleared} / {targetLines}
            </p>
          </div>
          <div className="flex gap-2">
            {!gameStarted ? (
              <Button onClick={startGame} size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            ) : (
              <>
                <Button onClick={togglePause} variant="outline">
                  <Pause className="w-4 h-4 mr-2" />
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button onClick={startGame} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restart
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <div 
            className="grid gap-[1px] bg-gray-800 p-2 rounded-lg mx-auto"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              width: 'fit-content'
            }}
          >
            {renderGrid().map((row, y) =>
              row.map((cell, x) => (
                <motion.div
                  key={`${y}-${x}`}
                  className={`w-6 h-6 rounded-sm ${
                    cell ? COLORS[cell - 1] : 'bg-gray-700'
                  }`}
                  initial={{ scale: cell ? 0 : 1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.1 }}
                />
              ))
            )}
          </div>

          {(gameOver || isPaused) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center"
              >
                <h2 className="text-2xl font-bold mb-2">
                  {gameOver ? (linesCleared >= targetLines ? 'Level Complete!' : 'Game Over!') : 'Paused'}
                </h2>
                {gameOver && (
                  <>
                    <p className="text-lg mb-4">Final Score: {score}</p>
                    <Button onClick={startGame}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Play Again
                    </Button>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>Use arrow keys to move, Up to rotate, Space to drop</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BlockBlastWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const percentage = (score / (levelConfig.targetLines * 100)) * 100
    if (percentage >= 90) return 3
    if (percentage >= 60) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="block-blast"
      gameName="Block Blast"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <BlockBlast levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}