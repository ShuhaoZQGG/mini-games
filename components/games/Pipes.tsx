'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Play, Clock, Trophy, Zap, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type PipeType = 'straight' | 'corner' | 'cross' | 'empty' | 'start' | 'end'
type Direction = 0 | 90 | 180 | 270

type Cell = {
  type: PipeType
  rotation: Direction
  connected: boolean
  flow: boolean
}

type Grid = Cell[][]

const PIPE_SHAPES = {
  straight: { connections: [0, 180], symbol: '═' },
  corner: { connections: [0, 90], symbol: '╔' },
  cross: { connections: [0, 90, 180, 270], symbol: '╬' },
  empty: { connections: [], symbol: ' ' },
  start: { connections: [90], symbol: '▶' },
  end: { connections: [270], symbol: '◀' }
}

const Pipes: React.FC = () => {
  const [grid, setGrid] = useState<Grid>([])
  const [gridSize, setGridSize] = useState(7)
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [flowPercentage, setFlowPercentage] = useState(0)
  const [isChecking, setIsChecking] = useState(false)

  const generateLevel = useCallback((levelNum: number) => {
    const size = Math.min(7 + Math.floor(levelNum / 2), 12)
    const newGrid: Grid = []
    
    // Create empty grid
    for (let row = 0; row < size; row++) {
      newGrid[row] = []
      for (let col = 0; col < size; col++) {
        newGrid[row][col] = {
          type: 'empty',
          rotation: 0,
          connected: false,
          flow: false
        }
      }
    }
    
    // Place start and end
    const startRow = Math.floor(Math.random() * size)
    const endRow = Math.floor(Math.random() * size)
    
    newGrid[startRow][0] = {
      type: 'start',
      rotation: 0,
      connected: false,
      flow: true
    }
    
    newGrid[endRow][size - 1] = {
      type: 'end',
      rotation: 0,
      connected: false,
      flow: false
    }
    
    // Generate a path from start to end
    let currentRow = startRow
    let currentCol = 0
    const path: { row: number; col: number }[] = [{ row: currentRow, col: currentCol }]
    
    while (currentCol < size - 2) {
      // Move towards the end
      const moveRight = Math.random() > 0.3
      if (moveRight) {
        currentCol++
      } else {
        // Move up or down
        if (currentRow === 0) {
          currentRow++
        } else if (currentRow === size - 1) {
          currentRow--
        } else {
          currentRow += Math.random() > 0.5 ? 1 : -1
        }
      }
      
      path.push({ row: currentRow, col: currentCol })
    }
    
    // Connect to end
    while (currentRow !== endRow) {
      currentRow += currentRow < endRow ? 1 : -1
      path.push({ row: currentRow, col: currentCol })
    }
    path.push({ row: endRow, col: size - 1 })
    
    // Place pipes along the path
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1]
      const curr = path[i]
      const next = path[i + 1]
      
      const fromDir = { row: prev.row - curr.row, col: prev.col - curr.col }
      const toDir = { row: next.row - curr.row, col: next.col - curr.col }
      
      let pipeType: PipeType = 'straight'
      let rotation: Direction = 0
      
      if (fromDir.col === -1 && toDir.col === 1) {
        // Horizontal straight
        pipeType = 'straight'
        rotation = 90
      } else if (fromDir.row === -1 && toDir.row === 1) {
        // Vertical straight
        pipeType = 'straight'
        rotation = 0
      } else {
        // Corner
        pipeType = 'corner'
        // Calculate corner rotation based on directions
        if ((fromDir.col === -1 && toDir.row === 1) || (fromDir.row === 1 && toDir.col === -1)) {
          rotation = 0
        } else if ((fromDir.row === -1 && toDir.col === 1) || (fromDir.col === 1 && toDir.row === -1)) {
          rotation = 90
        } else if ((fromDir.col === 1 && toDir.row === -1) || (fromDir.row === -1 && toDir.col === 1)) {
          rotation = 180
        } else {
          rotation = 270
        }
      }
      
      newGrid[curr.row][curr.col] = {
        type: pipeType,
        rotation: Math.random() > 0.5 ? ((rotation + 90) % 360) as Direction : rotation,
        connected: false,
        flow: false
      }
    }
    
    // Add random pipes to other cells
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (newGrid[row][col].type === 'empty' && Math.random() > 0.6) {
          const types: PipeType[] = ['straight', 'corner', 'cross']
          newGrid[row][col] = {
            type: types[Math.floor(Math.random() * types.length)],
            rotation: (Math.floor(Math.random() * 4) * 90) as Direction,
            connected: false,
            flow: false
          }
        }
      }
    }
    
    setGrid(newGrid)
    setGridSize(size)
    setFlowPercentage(0)
    setGameComplete(false)
    setMoves(0)
  }, [])

  const rotatePipe = useCallback((row: number, col: number) => {
    if (gameComplete) return
    
    const cell = grid[row][col]
    if (cell.type === 'empty' || cell.type === 'start' || cell.type === 'end') return
    
    setGrid(prev => {
      const newGrid = [...prev]
      newGrid[row][col] = {
        ...cell,
        rotation: ((cell.rotation + 90) % 360) as Direction
      }
      return newGrid
    })
    
    setMoves(prev => prev + 1)
  }, [grid, gameComplete])

  const checkFlow = useCallback(() => {
    setIsChecking(true)
    
    // Reset flow states
    const newGrid = grid.map(row => 
      row.map(cell => ({ ...cell, connected: false, flow: false }))
    )
    
    // Find start position
    let startRow = -1
    for (let row = 0; row < gridSize; row++) {
      if (newGrid[row][0].type === 'start') {
        startRow = row
        newGrid[row][0].flow = true
        newGrid[row][0].connected = true
        break
      }
    }
    
    if (startRow === -1) {
      setIsChecking(false)
      return
    }
    
    // Trace the flow
    const queue: { row: number; col: number }[] = [{ row: startRow, col: 0 }]
    const visited = new Set<string>()
    let flowCount = 1
    let reachedEnd = false
    
    while (queue.length > 0) {
      const { row, col } = queue.shift()!
      const key = `${row},${col}`
      
      if (visited.has(key)) continue
      visited.add(key)
      
      const cell = newGrid[row][col]
      const connections = getRotatedConnections(cell.type, cell.rotation)
      
      // Check all four directions
      const directions = [
        { row: -1, col: 0, angle: 0 },    // up
        { row: 0, col: 1, angle: 90 },    // right
        { row: 1, col: 0, angle: 180 },   // down
        { row: 0, col: -1, angle: 270 }   // left
      ]
      
      for (const dir of directions) {
        if (!connections.includes(dir.angle)) continue
        
        const newRow = row + dir.row
        const newCol = col + dir.col
        
        if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) continue
        
        const nextCell = newGrid[newRow][newCol]
        const nextConnections = getRotatedConnections(nextCell.type, nextCell.rotation)
        
        // Check if next cell connects back
        const oppositeAngle = (dir.angle + 180) % 360
        if (nextConnections.includes(oppositeAngle)) {
          if (!nextCell.flow) {
            nextCell.flow = true
            nextCell.connected = true
            flowCount++
            queue.push({ row: newRow, col: newCol })
            
            if (nextCell.type === 'end') {
              reachedEnd = true
            }
          }
        }
      }
    }
    
    setGrid(newGrid)
    setFlowPercentage(Math.floor((flowCount / (gridSize * gridSize)) * 100))
    
    if (reachedEnd) {
      setGameComplete(true)
      setScore(prev => prev + 1000 * level + Math.max(0, 500 - moves * 10))
      setTimerActive(false)
    }
    
    setTimeout(() => setIsChecking(false), 500)
  }, [grid, gridSize, level, moves])

  const getRotatedConnections = (type: PipeType, rotation: Direction): number[] => {
    const base = PIPE_SHAPES[type].connections
    return base.map(angle => (angle + rotation) % 360)
  }

  const getPipeSymbol = (cell: Cell): string => {
    const { type, rotation } = cell
    
    if (type === 'straight') {
      return rotation % 180 === 0 ? '║' : '═'
    } else if (type === 'corner') {
      const symbols = ['╔', '╗', '╝', '╚']
      return symbols[rotation / 90]
    } else if (type === 'cross') {
      return '╬'
    } else if (type === 'start') {
      return '▶'
    } else if (type === 'end') {
      return '◀'
    }
    return ' '
  }

  const resetLevel = useCallback(() => {
    generateLevel(level)
    setTimeElapsed(0)
    setTimerActive(true)
  }, [level, generateLevel])

  const nextLevel = useCallback(() => {
    setLevel(prev => prev + 1)
    setTimeElapsed(0)
    setTimerActive(true)
  }, [])

  // Initialize
  useEffect(() => {
    generateLevel(level)
    setTimerActive(true)
  }, [level, generateLevel])

  // Timer
  useEffect(() => {
    if (timerActive && !gameComplete) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timerActive, gameComplete])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Pipes - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <span>Flow: {flowPercentage}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              <span>{formatTime(timeElapsed)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={checkFlow} 
              disabled={isChecking || gameComplete}
              variant="outline" 
              size="sm"
            >
              <Play className="w-4 h-4 mr-1" />
              Check Flow
            </Button>
            <Button onClick={resetLevel} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-2">
          Grid: {gridSize}×{gridSize} | Moves: {moves} | Click pipes to rotate
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div 
            className="grid gap-1 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg"
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
                    "aspect-square flex items-center justify-center text-3xl font-bold rounded cursor-pointer select-none",
                    cell.type === 'empty' && "bg-gray-200 dark:bg-gray-700",
                    cell.type !== 'empty' && !cell.flow && "bg-gray-300 dark:bg-gray-600",
                    cell.flow && "bg-blue-400 dark:bg-blue-600 text-white",
                    cell.type === 'start' && "bg-green-500 dark:bg-green-600 text-white",
                    cell.type === 'end' && "bg-red-500 dark:bg-red-600 text-white",
                    isChecking && cell.flow && "animate-pulse"
                  )}
                  onClick={() => rotatePipe(rowIndex, colIndex)}
                  whileHover={{ scale: cell.type !== 'empty' && cell.type !== 'start' && cell.type !== 'end' ? 1.05 : 1 }}
                  whileTap={{ scale: cell.type !== 'empty' && cell.type !== 'start' && cell.type !== 'end' ? 0.95 : 1 }}
                  animate={{ rotate: cell.rotation }}
                  transition={{ duration: 0.2 }}
                >
                  {getPipeSymbol(cell)}
                </motion.div>
              ))
            )}
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
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-4">Flow Complete! 🎉</h2>
                  <p className="text-xl mb-2">Level {level} Solved!</p>
                  <p className="text-lg mb-4">Score: {score}</p>
                  <p className="text-md mb-4">Time: {formatTime(timeElapsed)}</p>
                  <Button onClick={nextLevel} size="lg">
                    Next Level
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

export default Pipes