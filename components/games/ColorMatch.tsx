'use client'

import { useState, useEffect, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, RotateCcw, Clock, Target } from 'lucide-react'

interface ColorMatchProps {
  levelConfig: {
    gridSize: number
    colors: number
    targetPatterns: number
    timeLimit: number
    minMatchSize: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Simple Match',
    difficulty: 'easy',
    config: { gridSize: 6, colors: 4, targetPatterns: 5, timeLimit: 60, minMatchSize: 3 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Color Challenge',
    difficulty: 'medium',
    config: { gridSize: 8, colors: 5, targetPatterns: 10, timeLimit: 90, minMatchSize: 3 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Pattern Master',
    difficulty: 'hard',
    config: { gridSize: 10, colors: 6, targetPatterns: 15, timeLimit: 120, minMatchSize: 4 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert Matcher',
    difficulty: 'expert',
    config: { gridSize: 12, colors: 7, targetPatterns: 20, timeLimit: 150, minMatchSize: 4 },
    requiredStars: 8
  },
  {
    id: 5,
    name: 'Ultimate Challenge',
    difficulty: 'master',
    config: { gridSize: 14, colors: 8, targetPatterns: 25, timeLimit: 180, minMatchSize: 5 },
    requiredStars: 12
  }
]

const COLOR_CLASSES = [
  'bg-red-500 hover:bg-red-600',
  'bg-blue-500 hover:bg-blue-600',
  'bg-green-500 hover:bg-green-600',
  'bg-yellow-500 hover:bg-yellow-600',
  'bg-purple-500 hover:bg-purple-600',
  'bg-pink-500 hover:bg-pink-600',
  'bg-orange-500 hover:bg-orange-600',
  'bg-cyan-500 hover:bg-cyan-600'
]

interface Cell {
  color: number
  selected: boolean
  matched: boolean
}

function ColorMatch({ levelConfig, onScore }: ColorMatchProps) {
  const { gridSize, colors, targetPatterns, timeLimit, minMatchSize } = levelConfig
  const [grid, setGrid] = useState<Cell[][]>([])
  const [score, setScore] = useState(0)
  const [patternsFound, setPatternsFound] = useState(0)
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [isSelecting, setIsSelecting] = useState(false)
  const [currentColor, setCurrentColor] = useState<number | null>(null)
  const [combo, setCombo] = useState(0)

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const newGrid: Cell[][] = []
    for (let i = 0; i < gridSize; i++) {
      const row: Cell[] = []
      for (let j = 0; j < gridSize; j++) {
        row.push({
          color: Math.floor(Math.random() * colors),
          selected: false,
          matched: false
        })
      }
      newGrid.push(row)
    }
    return newGrid
  }, [gridSize, colors])

  // Check if cells form a valid pattern
  const isValidPattern = useCallback((cells: [number, number][]): boolean => {
    if (cells.length < minMatchSize) return false
    
    // Check if all cells are adjacent (horizontally or vertically)
    const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`))
    
    for (let i = 1; i < cells.length; i++) {
      const [r, c] = cells[i]
      const [prevR, prevC] = cells[i - 1]
      
      // Check if current cell is adjacent to previous
      const isAdjacent = 
        (Math.abs(r - prevR) === 1 && c === prevC) ||
        (Math.abs(c - prevC) === 1 && r === prevR)
      
      if (!isAdjacent) return false
    }
    
    return true
  }, [minMatchSize])

  // Handle cell selection
  const handleCellClick = useCallback((row: number, col: number) => {
    if (!gameStarted || gameOver || grid[row][col].matched) return
    
    const cellColor = grid[row][col].color
    
    if (!isSelecting) {
      // Start new selection
      setIsSelecting(true)
      setCurrentColor(cellColor)
      setSelectedCells([[row, col] as [number, number]])
      
      const newGrid = [...grid]
      newGrid[row][col] = { ...newGrid[row][col], selected: true }
      setGrid(newGrid)
    }
  }, [gameStarted, gameOver, grid, isSelecting])

  // Handle mouse enter for drag selection
  const handleCellEnter = useCallback((row: number, col: number) => {
    if (!isSelecting || !gameStarted || gameOver || grid[row][col].matched) return
    
    const cellColor = grid[row][col].color
    if (cellColor !== currentColor) return
    
    // Check if cell is already selected
    const isSelected = selectedCells.some(([r, c]) => r === row && c === col)
    if (isSelected) return
    
    // Check if cell is adjacent to last selected
    if (selectedCells.length > 0) {
      const [lastRow, lastCol] = selectedCells[selectedCells.length - 1]
      const isAdjacent = 
        (Math.abs(row - lastRow) === 1 && col === lastCol) ||
        (Math.abs(col - lastCol) === 1 && row === lastRow)
      
      if (!isAdjacent) return
    }
    
    const newSelectedCells: [number, number][] = [...selectedCells, [row, col] as [number, number]]
    setSelectedCells(newSelectedCells)
    
    const newGrid = [...grid]
    newGrid[row][col] = { ...newGrid[row][col], selected: true }
    setGrid(newGrid)
  }, [isSelecting, gameStarted, gameOver, grid, currentColor, selectedCells])

  // Complete selection
  const completeSelection = useCallback(() => {
    if (!isSelecting || selectedCells.length === 0) return
    
    if (isValidPattern(selectedCells)) {
      // Valid match!
      const points = selectedCells.length * 10 * (combo + 1)
      setScore(prev => prev + points)
      setPatternsFound(prev => prev + 1)
      setCombo(prev => prev + 1)
      onScore(points)
      
      // Mark cells as matched and remove them
      const newGrid = [...grid]
      selectedCells.forEach(([r, c]) => {
        newGrid[r][c] = { ...newGrid[r][c], matched: true }
      })
      setGrid(newGrid)
      
      // After animation, drop cells and refill
      setTimeout(() => {
        dropAndRefill()
      }, 300)
    } else {
      // Invalid pattern
      setCombo(0)
      
      // Clear selection
      const newGrid = grid.map(row =>
        row.map(cell => ({ ...cell, selected: false }))
      )
      setGrid(newGrid)
    }
    
    setIsSelecting(false)
    setCurrentColor(null)
    setSelectedCells([])
  }, [isSelecting, selectedCells, grid, combo, isValidPattern, onScore])

  // Drop cells and refill grid
  const dropAndRefill = useCallback(() => {
    const newGrid = [...grid]
    
    // Drop cells
    for (let col = 0; col < gridSize; col++) {
      let writePos = gridSize - 1
      for (let row = gridSize - 1; row >= 0; row--) {
        if (!newGrid[row][col].matched) {
          if (row !== writePos) {
            newGrid[writePos][col] = newGrid[row][col]
          }
          writePos--
        }
      }
      
      // Fill empty spaces with new cells
      for (let row = writePos; row >= 0; row--) {
        newGrid[row][col] = {
          color: Math.floor(Math.random() * colors),
          selected: false,
          matched: false
        }
      }
    }
    
    setGrid(newGrid)
  }, [grid, gridSize, colors])

  // Handle mouse up to complete selection
  useEffect(() => {
    const handleMouseUp = () => {
      if (isSelecting) {
        completeSelection()
      }
    }
    
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchend', handleMouseUp)
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isSelecting, completeSelection])

  // Timer
  useEffect(() => {
    if (gameStarted && !gameOver && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !gameOver) {
      setGameOver(true)
    }
  }, [gameStarted, gameOver, timeLeft])

  // Check win condition
  useEffect(() => {
    if (patternsFound >= targetPatterns && !gameOver) {
      setGameOver(true)
      const timeBonus = timeLeft * 10
      const finalScore = score + timeBonus + 500
      onScore(finalScore)
      setScore(finalScore)
    }
  }, [patternsFound, targetPatterns, gameOver, timeLeft, score, onScore])

  const startGame = () => {
    setGrid(initializeGrid())
    setScore(0)
    setPatternsFound(0)
    setTimeLeft(timeLimit)
    setGameStarted(true)
    setGameOver(false)
    setSelectedCells([])
    setIsSelecting(false)
    setCurrentColor(null)
    setCombo(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Score: {score}</h3>
            <p className="text-sm text-muted-foreground">
              Patterns: {patternsFound} / {targetPatterns}
            </p>
            {combo > 0 && (
              <p className="text-sm text-green-500">Combo x{combo}</p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className={`font-mono ${timeLeft < 10 ? 'text-red-500' : ''}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            
            {!gameStarted ? (
              <Button onClick={startGame} size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            ) : (
              <Button onClick={startGame} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            )}
          </div>
        </div>

        <div className="relative select-none">
          <div 
            className="grid gap-1 bg-gray-800 p-2 rounded-lg mx-auto"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              width: 'fit-content'
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <motion.button
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-10 h-10 rounded-md transition-all ${
                    cell.matched
                      ? 'opacity-0 pointer-events-none'
                      : cell.selected
                      ? `${COLOR_CLASSES[cell.color]} ring-2 ring-white scale-110`
                      : COLOR_CLASSES[cell.color]
                  }`}
                  onMouseDown={() => handleCellClick(rowIndex, colIndex)}
                  onMouseEnter={() => handleCellEnter(rowIndex, colIndex)}
                  onTouchStart={() => handleCellClick(rowIndex, colIndex)}
                  onTouchMove={(e) => {
                    const touch = e.touches[0]
                    const element = document.elementFromPoint(touch.clientX, touch.clientY)
                    if (element && element.getAttribute('data-cell')) {
                      const [r, c] = element.getAttribute('data-cell')!.split('-').map(Number)
                      handleCellEnter(r, c)
                    }
                  }}
                  data-cell={`${rowIndex}-${colIndex}`}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: cell.matched ? 0 : 1,
                    rotate: cell.selected ? [0, 5, -5, 0] : 0
                  }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: cell.matched ? 0 : 1.1 }}
                  disabled={!gameStarted || gameOver || cell.matched}
                />
              ))
            )}
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center"
              >
                <h2 className="text-2xl font-bold mb-2">
                  {patternsFound >= targetPatterns ? 'Level Complete!' : 'Time\'s Up!'}
                </h2>
                <p className="text-lg mb-4">Final Score: {score}</p>
                <Button onClick={startGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
              </motion.div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>Click and drag to connect {minMatchSize}+ tiles of the same color</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ColorMatchWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const maxScore = 1000 + (levelConfig.timeLimit * 5)
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 3
    if (percentage >= 50) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="color-match"
      gameName="Color Match"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <ColorMatch levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}