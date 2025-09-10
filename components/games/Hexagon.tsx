'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Target, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type HexCell = {
  row: number
  col: number
  filled: boolean
  color: string
}

type HexPiece = {
  id: number
  cells: { row: number; col: number }[]
  color: string
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD93D', '#6C5CE7']

const PIECE_SHAPES = [
  [{ row: 0, col: 0 }], // Single
  [{ row: 0, col: 0 }, { row: 0, col: 1 }], // Line 2
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }], // Line 3
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }], // L-shape
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }], // Triangle
]

const Hexagon: React.FC = () => {
  const [grid, setGrid] = useState<HexCell[][]>([])
  const [currentPieces, setCurrentPieces] = useState<HexPiece[]>([])
  const [nextPieces, setNextPieces] = useState<HexPiece[]>([])
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState<HexPiece | null>(null)
  const gridSize = 9

  const initializeGrid = useCallback(() => {
    const newGrid: HexCell[][] = []
    for (let row = 0; row < gridSize; row++) {
      newGrid[row] = []
      const cols = gridSize - Math.abs(row - Math.floor(gridSize / 2))
      for (let col = 0; col < cols; col++) {
        newGrid[row].push({
          row,
          col,
          filled: false,
          color: ''
        })
      }
    }
    setGrid(newGrid)
  }, [])

  const generatePiece = useCallback((): HexPiece => {
    const shape = PIECE_SHAPES[Math.floor(Math.random() * PIECE_SHAPES.length)]
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    return {
      id: Date.now() + Math.random(),
      cells: shape,
      color
    }
  }, [])

  const generateNextPieces = useCallback(() => {
    const pieces = []
    for (let i = 0; i < 3; i++) {
      pieces.push(generatePiece())
    }
    setNextPieces(pieces)
  }, [generatePiece])

  const canPlacePiece = useCallback((piece: HexPiece, targetRow: number, targetCol: number): boolean => {
    for (const cell of piece.cells) {
      const row = targetRow + cell.row
      const col = targetCol + cell.col
      
      if (row < 0 || row >= grid.length) return false
      if (col < 0 || col >= grid[row].length) return false
      if (grid[row][col].filled) return false
    }
    return true
  }, [grid])

  const placePiece = useCallback((piece: HexPiece, targetRow: number, targetCol: number) => {
    if (!canPlacePiece(piece, targetRow, targetCol)) return false

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })))
    
    for (const cell of piece.cells) {
      const row = targetRow + cell.row
      const col = targetCol + cell.col
      newGrid[row][col].filled = true
      newGrid[row][col].color = piece.color
    }
    
    setGrid(newGrid)
    setScore(prev => prev + piece.cells.length * 10 * level)
    
    // Remove placed piece from next pieces
    setNextPieces(prev => prev.filter(p => p.id !== piece.id))
    
    // Check for complete lines
    checkLines(newGrid)
    
    return true
  }, [grid, level, canPlacePiece])

  const checkLines = useCallback((currentGrid: HexCell[][]) => {
    let linesCleared = 0
    const newGrid = currentGrid.map(row => row.map(cell => ({ ...cell })))
    
    // Check horizontal lines
    for (let row = 0; row < newGrid.length; row++) {
      if (newGrid[row].every(cell => cell.filled)) {
        linesCleared++
        newGrid[row].forEach(cell => {
          cell.filled = false
          cell.color = ''
        })
      }
    }
    
    if (linesCleared > 0) {
      setGrid(newGrid)
      setLines(prev => prev + linesCleared)
      setScore(prev => prev + linesCleared * 100 * level)
      
      // Level up every 10 lines
      if ((lines + linesCleared) % 10 === 0) {
        setLevel(prev => prev + 1)
      }
    }
    
    // Generate new pieces if all placed
    if (nextPieces.length === 0) {
      generateNextPieces()
    }
    
    // Check game over
    const hasValidMove = nextPieces.some(piece => {
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < (newGrid[row]?.length || 0); col++) {
          if (canPlacePiece(piece, row, col)) return true
        }
      }
      return false
    })
    
    if (!hasValidMove && nextPieces.length > 0) {
      setGameOver(true)
    }
  }, [lines, level, nextPieces, canPlacePiece, generateNextPieces])

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!selectedPiece || gameOver) return
    
    if (placePiece(selectedPiece, row, col)) {
      setSelectedPiece(null)
    }
  }, [selectedPiece, gameOver, placePiece])

  const resetGame = useCallback(() => {
    initializeGrid()
    generateNextPieces()
    setScore(0)
    setLines(0)
    setLevel(1)
    setGameOver(false)
    setSelectedPiece(null)
  }, [initializeGrid, generateNextPieces])

  // Initialize
  useEffect(() => {
    initializeGrid()
    generateNextPieces()
  }, [initializeGrid, generateNextPieces])

  const getHexStyle = (row: number) => {
    const offset = Math.abs(row - Math.floor(gridSize / 2)) * 25
    return { marginLeft: `${offset}px` }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Hexagon - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span>Lines: {lines}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <span>Level {level}</span>
            </div>
          </div>
          <Button onClick={resetGame} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-8">
          {/* Game Grid */}
          <div className="flex-1">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 mb-1" style={getHexStyle(rowIndex)}>
                  {row.map((cell, colIndex) => (
                    <motion.div
                      key={`${rowIndex}-${colIndex}`}
                      className={cn(
                        "w-12 h-12 hexagon flex items-center justify-center cursor-pointer",
                        cell.filled ? "opacity-100" : "opacity-30"
                      )}
                      style={{
                        backgroundColor: cell.filled ? cell.color : '#e0e0e0',
                        clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)'
                      }}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      whileHover={{ scale: !cell.filled ? 1.1 : 1 }}
                      whileTap={{ scale: 0.95 }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          {/* Next Pieces */}
          <div className="w-48">
            <h3 className="font-semibold mb-4">Next Pieces:</h3>
            <div className="space-y-4">
              {nextPieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  className={cn(
                    "p-2 border-2 rounded cursor-pointer",
                    selectedPiece?.id === piece.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" : "border-gray-300"
                  )}
                  onClick={() => setSelectedPiece(piece)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="relative h-16">
                    {piece.cells.map((cell, index) => (
                      <div
                        key={index}
                        className="absolute w-8 h-8"
                        style={{
                          backgroundColor: piece.color,
                          clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
                          left: `${cell.col * 20}px`,
                          top: `${cell.row * 20}px`
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
            >
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg text-center">
                <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
                <p className="text-xl mb-2">Final Score: {score}</p>
                <p className="text-lg mb-4">Lines Cleared: {lines}</p>
                <p className="text-lg mb-4">Level Reached: {level}</p>
                <Button onClick={resetGame} size="lg">
                  Play Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

export default Hexagon