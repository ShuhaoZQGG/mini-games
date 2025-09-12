'use client'

import { useState, useEffect, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Palette } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ColorFillGameProps {
  levelConfig: {
    targetScore: number
    gridSize: number
    colorCount: number
    maxMoves: number
    bonusMultiplier: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Color Starter',
    difficulty: 'easy',
    config: { 
      targetScore: 500, 
      gridSize: 10,
      colorCount: 4,
      maxMoves: 25,
      bonusMultiplier: 50
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Color Explorer',
    difficulty: 'medium',
    config: { 
      targetScore: 1000, 
      gridSize: 12,
      colorCount: 5,
      maxMoves: 22,
      bonusMultiplier: 75
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Color Master',
    difficulty: 'hard',
    config: { 
      targetScore: 2000, 
      gridSize: 14,
      colorCount: 6,
      maxMoves: 20,
      bonusMultiplier: 100
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Color Expert',
    difficulty: 'expert',
    config: { 
      targetScore: 3500, 
      gridSize: 16,
      colorCount: 6,
      maxMoves: 18,
      bonusMultiplier: 125
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Color Legend',
    difficulty: 'master',
    config: { 
      targetScore: 5000, 
      gridSize: 18,
      colorCount: 7,
      maxMoves: 16,
      bonusMultiplier: 150
    },
    requiredStars: 14
  }
]

function ColorFillGame({ levelConfig, onScore }: ColorFillGameProps) {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Purple
    '#FFA07A'  // Orange
  ].slice(0, levelConfig.colorCount)

  const [grid, setGrid] = useState<string[][]>([])
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameOver' | 'victory'>('ready')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [filledCells, setFilledCells] = useState<Set<string>>(new Set(['0,0']))
  const [animatingCells, setAnimatingCells] = useState<Set<string>>(new Set())
  const [lastFillCount, setLastFillCount] = useState(0)

  const initializeGrid = useCallback(() => {
    const newGrid: string[][] = []
    for (let i = 0; i < levelConfig.gridSize; i++) {
      newGrid[i] = []
      for (let j = 0; j < levelConfig.gridSize; j++) {
        newGrid[i][j] = colors[Math.floor(Math.random() * colors.length)]
      }
    }
    return newGrid
  }, [levelConfig.gridSize, colors])

  const startGame = () => {
    const newGrid = initializeGrid()
    setGrid(newGrid)
    setScore(0)
    setMoves(0)
    setGameState('playing')
    setSelectedColor(newGrid[0][0])
    setFilledCells(new Set(['0,0']))
    findConnectedCells(newGrid, 0, 0, newGrid[0][0])
  }

  const resetGame = () => {
    setGameState('ready')
    setScore(0)
    setMoves(0)
    setFilledCells(new Set(['0,0']))
  }

  const findConnectedCells = (grid: string[][], startRow: number, startCol: number, targetColor: string) => {
    const visited = new Set<string>()
    const connected = new Set<string>()
    const queue: [number, number][] = [[startRow, startCol]]

    while (queue.length > 0) {
      const [row, col] = queue.shift()!
      const key = `${row},${col}`

      if (visited.has(key)) continue
      visited.add(key)

      if (grid[row][col] === targetColor) {
        connected.add(key)

        // Check neighbors
        const neighbors = [
          [row - 1, col],
          [row + 1, col],
          [row, col - 1],
          [row, col + 1]
        ]

        for (const [r, c] of neighbors) {
          if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
            const neighborKey = `${r},${c}`
            if (!visited.has(neighborKey)) {
              queue.push([r, c])
            }
          }
        }
      }
    }

    setFilledCells(connected)
    return connected
  }

  const floodFill = useCallback((newColor: string) => {
    if (gameState !== 'playing') return
    if (newColor === selectedColor) return
    if (moves >= levelConfig.maxMoves) return

    const newGrid = grid.map(row => [...row])
    const cellsToFill = new Set<string>()
    const visited = new Set<string>()
    const queue: [number, number][] = []

    // Start from all currently filled cells
    filledCells.forEach(cell => {
      const [row, col] = cell.split(',').map(Number)
      queue.push([row, col])
    })

    // First, change all filled cells to new color
    filledCells.forEach(cell => {
      const [row, col] = cell.split(',').map(Number)
      newGrid[row][col] = newColor
      cellsToFill.add(cell)
    })

    // Then find all newly connected cells
    const newlyConnected = new Set<string>()
    const checkQueue: [number, number][] = []
    
    filledCells.forEach(cell => {
      const [row, col] = cell.split(',').map(Number)
      checkQueue.push([row, col])
    })

    while (checkQueue.length > 0) {
      const [row, col] = checkQueue.shift()!
      const key = `${row},${col}`

      if (visited.has(key)) continue
      visited.add(key)

      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1]
      ]

      for (const [r, c] of neighbors) {
        if (r >= 0 && r < newGrid.length && c >= 0 && c < newGrid[0].length) {
          const neighborKey = `${r},${c}`
          if (!visited.has(neighborKey) && !cellsToFill.has(neighborKey) && newGrid[r][c] === newColor) {
            newlyConnected.add(neighborKey)
            cellsToFill.add(neighborKey)
            checkQueue.push([r, c])
          }
        }
      }
    }

    // Animate newly connected cells
    setAnimatingCells(newlyConnected)
    setTimeout(() => setAnimatingCells(new Set()), 500)

    // Calculate score based on cells filled this turn
    const cellsFilled = newlyConnected.size
    const moveScore = cellsFilled * 10
    const bonusScore = cellsFilled > 10 ? levelConfig.bonusMultiplier : 0
    
    setScore(prev => prev + moveScore + bonusScore)
    setLastFillCount(cellsFilled)
    
    setGrid(newGrid)
    setSelectedColor(newColor)
    setFilledCells(cellsToFill)
    setMoves(prev => prev + 1)

    // Check victory condition
    if (cellsToFill.size === levelConfig.gridSize * levelConfig.gridSize) {
      const finalScore = score + moveScore + bonusScore + (levelConfig.maxMoves - moves - 1) * 100
      setScore(finalScore)
      setGameState('victory')
      onScore(finalScore)
    } else if (moves + 1 >= levelConfig.maxMoves) {
      setGameState('gameOver')
      onScore(score + moveScore + bonusScore)
    }
  }, [grid, selectedColor, filledCells, moves, score, gameState, levelConfig, onScore])

  const getCompletionPercentage = () => {
    return Math.floor((filledCells.size / (levelConfig.gridSize * levelConfig.gridSize)) * 100)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold">Score: {score}</div>
            <div className="text-sm text-muted-foreground">
              Target: {levelConfig.targetScore}
            </div>
            {lastFillCount > 10 && (
              <div className="text-sm text-yellow-500 font-semibold">
                Bonus! +{levelConfig.bonusMultiplier}
              </div>
            )}
          </div>
          <div className="text-right space-y-1">
            <div className="text-lg font-semibold">
              Moves: {moves}/{levelConfig.maxMoves}
            </div>
            <div className="text-sm text-muted-foreground">
              Filled: {getCompletionPercentage()}%
            </div>
          </div>
        </div>

        <div className="relative">
          {gameState === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-lg">
              <Button onClick={startGame} size="lg">
                <Play className="w-5 h-5 mr-2" />
                Start Game
              </Button>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-lg">
              <div className="text-center space-y-4 bg-white p-6 rounded-lg">
                <div className="text-2xl font-bold">Game Over!</div>
                <div className="text-xl">Final Score: {score}</div>
                <div className="text-lg">Filled: {getCompletionPercentage()}%</div>
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

          {gameState === 'victory' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-lg">
              <div className="text-center space-y-4 bg-white p-6 rounded-lg">
                <div className="text-2xl font-bold">🎉 Victory!</div>
                <div className="text-xl">Perfect Fill!</div>
                <div className="text-lg">Final Score: {score}</div>
                <div className="text-sm text-green-600">
                  Bonus: {levelConfig.maxMoves - moves} moves saved!
                </div>
                <Button onClick={resetGame} size="lg">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Play Again
                </Button>
              </div>
            </div>
          )}

          <div 
            className="grid gap-[1px] p-2 bg-gray-200 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${levelConfig.gridSize}, 1fr)`,
            }}
          >
            <AnimatePresence>
              {grid.map((row, rowIndex) =>
                row.map((color, colIndex) => {
                  const key = `${rowIndex},${colIndex}`
                  const isFilled = filledCells.has(key)
                  const isAnimating = animatingCells.has(key)
                  
                  return (
                    <motion.div
                      key={key}
                      className="aspect-square rounded-sm"
                      style={{
                        backgroundColor: color,
                        border: isFilled ? '2px solid rgba(255,255,255,0.8)' : 'none',
                        boxShadow: isFilled ? 'inset 0 0 10px rgba(0,0,0,0.2)' : 'none'
                      }}
                      initial={isAnimating ? { scale: 0 } : { scale: 1 }}
                      animate={{ 
                        scale: isAnimating ? [0, 1.2, 1] : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {gameState === 'playing' && (
          <div className="mt-6">
            <div className="mb-3 text-center text-sm font-medium">
              Choose a color to fill:
            </div>
            <div className="flex justify-center gap-3">
              {colors.map((color) => (
                <motion.button
                  key={color}
                  className="w-12 h-12 rounded-lg shadow-md"
                  style={{
                    backgroundColor: color,
                    border: selectedColor === color ? '3px solid #000' : '2px solid rgba(0,0,0,0.2)'
                  }}
                  onClick={() => floodFill(color)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={selectedColor === color}
                >
                  {selectedColor === color && (
                    <Palette className="w-6 h-6 text-white mx-auto" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <Button onClick={resetGame} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Game
          </Button>
        </div>

        {gameState === 'playing' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
            <strong>How to play:</strong> Start from the top-left corner. Select colors to fill all connected cells of the same color. Fill the entire grid before running out of moves!
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ColorFill() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const percentage = (score / levelConfig.targetScore) * 100
    if (percentage >= 150) return 3
    if (percentage >= 100) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="color-fill"
      gameName="Color Fill"
      levels={levels}
      renderGame={(config, onScore) => (
        <ColorFillGame levelConfig={config} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}