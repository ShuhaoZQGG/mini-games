'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, SkipForward, Lightbulb, Trophy, Target, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type Cell = {
  row: number
  col: number
  color: string | null
  isEndpoint: boolean
  connectionId: number | null
}

type Path = {
  color: string
  cells: { row: number; col: number }[]
  complete: boolean
}

type Level = {
  size: number
  endpoints: { row: number; col: number; color: string }[]
}

const COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#FFD93D', // Yellow
  '#6C5CE7', // Purple
  '#A8E6CF', // Light Green
  '#FF8B94', // Pink
  '#C7CEEA', // Lavender
]

const FlowFree: React.FC = () => {
  const [grid, setGrid] = useState<Cell[][]>([])
  const [paths, setPaths] = useState<Path[]>([])
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [currentPath, setCurrentPath] = useState<{ row: number; col: number }[]>([])
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [hints, setHints] = useState(3)
  const [gameComplete, setGameComplete] = useState(false)
  const [gridSize, setGridSize] = useState(5)
  const [completedFlows, setCompletedFlows] = useState(0)
  const [totalFlows, setTotalFlows] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const generateLevel = useCallback((levelNum: number): Level => {
    const size = Math.min(5 + Math.floor(levelNum / 3), 14) // Max size 14x14
    const flowCount = Math.min(Math.floor(size * 0.8), 10) // Max 10 flows
    
    const endpoints: { row: number; col: number; color: string }[] = []
    const usedCells = new Set<string>()
    
    for (let i = 0; i < flowCount; i++) {
      const color = COLORS[i % COLORS.length]
      
      // Generate two endpoints for each color
      let attempts = 0
      while (attempts < 100) {
        const pos1 = {
          row: Math.floor(Math.random() * size),
          col: Math.floor(Math.random() * size)
        }
        const pos2 = {
          row: Math.floor(Math.random() * size),
          col: Math.floor(Math.random() * size)
        }
        
        const key1 = `${pos1.row},${pos1.col}`
        const key2 = `${pos2.row},${pos2.col}`
        
        // Ensure endpoints are not too close and not already used
        const distance = Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col)
        if (!usedCells.has(key1) && !usedCells.has(key2) && 
            key1 !== key2 && distance >= 2) {
          endpoints.push({ ...pos1, color })
          endpoints.push({ ...pos2, color })
          usedCells.add(key1)
          usedCells.add(key2)
          break
        }
        attempts++
      }
    }
    
    return { size, endpoints }
  }, [])

  const initializeGrid = useCallback((level: Level) => {
    const newGrid: Cell[][] = []
    
    for (let row = 0; row < level.size; row++) {
      newGrid[row] = []
      for (let col = 0; col < level.size; col++) {
        const endpoint = level.endpoints.find(e => e.row === row && e.col === col)
        newGrid[row][col] = {
          row,
          col,
          color: endpoint ? endpoint.color : null,
          isEndpoint: !!endpoint,
          connectionId: null
        }
      }
    }
    
    setGrid(newGrid)
    setGridSize(level.size)
    setTotalFlows(level.endpoints.length / 2)
    setPaths([])
    setCompletedFlows(0)
    setCurrentPath([])
    setSelectedColor(null)
  }, [])

  const getCell = useCallback((row: number, col: number): Cell | null => {
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return null
    return grid[row]?.[col] || null
  }, [grid, gridSize])

  const getCellFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent): { row: number; col: number } | null => {
    if (!gridRef.current) return null
    
    const rect = gridRef.current.getBoundingClientRect()
    let clientX: number, clientY: number
    
    if ('touches' in e) {
      if (e.touches.length === 0) return null
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    const x = clientX - rect.left
    const y = clientY - rect.top
    const cellSize = rect.width / gridSize
    
    const col = Math.floor(x / cellSize)
    const row = Math.floor(y / cellSize)
    
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return { row, col }
    }
    
    return null
  }, [gridSize])

  const startPath = useCallback((row: number, col: number) => {
    const cell = getCell(row, col)
    if (!cell || !cell.isEndpoint) return
    
    // Clear existing path of this color
    setPaths(prev => prev.filter(p => p.color !== cell.color))
    
    // Clear grid cells of this color (except endpoints)
    setGrid(prev => prev.map(row => 
      row.map(c => ({
        ...c,
        color: c.isEndpoint ? c.color : (c.color === cell.color ? null : c.color),
        connectionId: c.color === cell.color ? null : c.connectionId
      }))
    ))
    
    setSelectedColor(cell.color)
    setCurrentPath([{ row, col }])
    setIsDragging(true)
  }, [getCell])

  const addToPath = useCallback((row: number, col: number) => {
    if (!isDragging || !selectedColor) return
    
    const cell = getCell(row, col)
    if (!cell) return
    
    // Check if this cell is adjacent to the last cell in path
    const lastCell = currentPath[currentPath.length - 1]
    if (!lastCell) return
    
    const isAdjacent = 
      (Math.abs(lastCell.row - row) === 1 && lastCell.col === col) ||
      (Math.abs(lastCell.col - col) === 1 && lastCell.row === row)
    
    if (!isAdjacent) return
    
    // Check if we're hitting another color's path
    if (cell.color && cell.color !== selectedColor && !cell.isEndpoint) {
      return // Can't cross other paths
    }
    
    // Check if we're backtracking
    const existingIndex = currentPath.findIndex(p => p.row === row && p.col === col)
    if (existingIndex !== -1) {
      // Backtrack to this position
      setCurrentPath(prev => prev.slice(0, existingIndex + 1))
      // Update grid
      setGrid(prev => {
        const newGrid = [...prev]
        for (let i = existingIndex + 1; i < currentPath.length; i++) {
          const p = currentPath[i]
          if (!newGrid[p.row][p.col].isEndpoint) {
            newGrid[p.row][p.col].color = null
          }
        }
        return newGrid
      })
      return
    }
    
    // Add to path
    setCurrentPath(prev => [...prev, { row, col }])
    
    // Update grid
    setGrid(prev => {
      const newGrid = [...prev]
      if (!cell.isEndpoint || cell.color === selectedColor) {
        newGrid[row][col].color = selectedColor
      }
      return newGrid
    })
    
    // Check if we completed a path
    if (cell.isEndpoint && cell.color === selectedColor && currentPath.length > 1) {
      completePath()
    }
  }, [isDragging, selectedColor, currentPath, getCell])

  const completePath = useCallback(() => {
    if (!selectedColor || currentPath.length < 2) return
    
    const newPath: Path = {
      color: selectedColor,
      cells: [...currentPath],
      complete: true
    }
    
    setPaths(prev => [...prev.filter(p => p.color !== selectedColor), newPath])
    setCompletedFlows(prev => prev + 1)
    setScore(prev => prev + 100 * level)
    setMoves(prev => prev + 1)
    
    // Check if all flows are complete
    checkGameComplete()
    
    setIsDragging(false)
    setSelectedColor(null)
    setCurrentPath([])
  }, [selectedColor, currentPath, level])

  const endPath = useCallback(() => {
    if (isDragging) {
      setMoves(prev => prev + 1)
    }
    setIsDragging(false)
    setSelectedColor(null)
    setCurrentPath([])
  }, [isDragging])

  const checkGameComplete = useCallback(() => {
    // Check if all cells are filled and all flows are connected
    const allCellsFilled = grid.every(row => row.every(cell => cell.color !== null))
    
    if (allCellsFilled) {
      // Verify all endpoints are connected
      const colorPairs = new Map<string, number>()
      grid.forEach(row => {
        row.forEach(cell => {
          if (cell.isEndpoint && cell.color) {
            colorPairs.set(cell.color, (colorPairs.get(cell.color) || 0) + 1)
          }
        })
      })
      
      const allConnected = Array.from(colorPairs.values()).every(count => count === 2)
      
      if (allConnected) {
        setGameComplete(true)
        setScore(prev => prev + 500 * level + (hints * 100))
      }
    }
  }, [grid, level, hints])

  const showHintAnimation = useCallback(() => {
    if (hints <= 0) return
    
    setShowHint(true)
    setHints(prev => prev - 1)
    setTimeout(() => setShowHint(false), 2000)
  }, [hints])

  const resetLevel = useCallback(() => {
    const currentLevel = generateLevel(level)
    initializeGrid(currentLevel)
    setMoves(0)
    setGameComplete(false)
  }, [level, generateLevel, initializeGrid])

  const skipLevel = useCallback(() => {
    setLevel(prev => prev + 1)
    setScore(prev => Math.max(0, prev - 200))
  }, [])

  const nextLevel = useCallback(() => {
    setLevel(prev => prev + 1)
    setHints(3)
  }, [])

  // Initialize first level
  useEffect(() => {
    const levelData = generateLevel(level)
    initializeGrid(levelData)
  }, [level, generateLevel, initializeGrid])

  // Check game complete after grid updates
  useEffect(() => {
    if (completedFlows === totalFlows && totalFlows > 0) {
      checkGameComplete()
    }
  }, [completedFlows, totalFlows, checkGameComplete])

  const handleMouseDown = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    startPath(row, col)
  }

  const handleMouseEnter = (row: number, col: number) => {
    if (isDragging) {
      addToPath(row, col)
    }
  }

  const handleMouseUp = () => {
    endPath()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const pos = getCellFromEvent(e)
    if (pos) {
      startPath(pos.row, pos.col)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const pos = getCellFromEvent(e)
    if (pos && isDragging) {
      addToPath(pos.row, pos.col)
    }
  }

  const handleTouchEnd = () => {
    endPath()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Flow Free - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span>{completedFlows}/{totalFlows}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span>{moves}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={showHintAnimation}
              disabled={hints <= 0}
              variant="outline"
              size="sm"
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Hint ({hints})
            </Button>
            <Button onClick={resetLevel} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button onClick={skipLevel} variant="outline" size="sm">
              <SkipForward className="w-4 h-4 mr-1" />
              Skip
            </Button>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-2">
          Grid: {gridSize}×{gridSize} | Connect all matching colors
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={gridRef}
          className="relative aspect-square bg-gray-900 rounded-lg p-1 select-none touch-none"
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="grid gap-1 h-full"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  className={cn(
                    "relative rounded-md border-2 transition-all",
                    cell.color ? "border-gray-700" : "border-gray-800",
                    showHint && cell.isEndpoint && "animate-pulse"
                  )}
                  style={{
                    backgroundColor: cell.color || '#1a1a1a'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, rowIndex, colIndex)}
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                  whileHover={!cell.color ? { scale: 0.95 } : {}}
                  whileTap={{ scale: 0.9 }}
                >
                  {cell.isEndpoint && (
                    <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
                      <div 
                        className="w-3/4 h-3/4 rounded-full"
                        style={{ backgroundColor: cell.color || '#000' }}
                      />
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
          
          {/* Draw paths as SVG overlay */}
          <svg 
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          >
            {paths.map((path, index) => {
              const cellSize = 100 / gridSize
              const points = path.cells.map(cell => ({
                x: (cell.col + 0.5) * cellSize,
                y: (cell.row + 0.5) * cellSize
              }))
              
              return (
                <polyline
                  key={index}
                  points={points.map(p => `${p.x}%,${p.y}%`).join(' ')}
                  fill="none"
                  stroke={path.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.3}
                />
              )
            })}
            
            {/* Current dragging path */}
            {isDragging && currentPath.length > 0 && (
              <polyline
                points={currentPath.map(cell => {
                  const cellSize = 100 / gridSize
                  return `${(cell.col + 0.5) * cellSize}%,${(cell.row + 0.5) * cellSize}%`
                }).join(' ')}
                fill="none"
                stroke={selectedColor || '#fff'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.5}
              />
            )}
          </svg>
        </div>
        
        <AnimatePresence>
          {gameComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg"
            >
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center">
                <h2 className="text-3xl font-bold mb-4">Perfect! 🎉</h2>
                <p className="text-xl mb-2">Level {level} Complete!</p>
                <p className="text-lg mb-4">Score: {score}</p>
                <p className="text-md mb-4">Moves: {moves}</p>
                <Button onClick={nextLevel} size="lg">
                  Next Level
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

export default FlowFree