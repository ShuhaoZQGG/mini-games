#!/bin/bash

# Create remaining puzzle games
cat > /Users/shuhaozhang/Project/mini-games/components/games/puzzle/MagicSquare.tsx << 'GAME_EOF'
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Home, RotateCcw, Grid3x3, Star, CheckCircle } from 'lucide-react'

export default function MagicSquare() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'victory'>('menu')
  const [grid, setGrid] = useState<number[][]>([])
  const [targetSum, setTargetSum] = useState(15)
  const [level, setLevel] = useState(1)
  const [moves, setMoves] = useState(0)
  const [selectedCell, setSelectedCell] = useState<{x: number, y: number} | null>(null)
  const [hints, setHints] = useState(3)
  const [gridSize, setGridSize] = useState(3)
  
  const generatePuzzle = useCallback((size: number) => {
    const newGrid = Array(size).fill(null).map(() => Array(size).fill(0))
    const numbers = Array.from({length: size * size}, (_, i) => i + 1)
    
    // Magic sum formula: n(n²+1)/2
    const magicSum = (size * (size * size + 1)) / 2
    setTargetSum(magicSum)
    
    // Randomly place some numbers for the puzzle
    const shuffled = [...numbers].sort(() => Math.random() - 0.5)
    const toPlace = Math.floor(size * size * 0.3) // Pre-fill 30%
    
    for (let i = 0; i < toPlace; i++) {
      let placed = false
      while (!placed) {
        const x = Math.floor(Math.random() * size)
        const y = Math.floor(Math.random() * size)
        if (newGrid[y][x] === 0) {
          newGrid[y][x] = shuffled[i]
          placed = true
        }
      }
    }
    
    setGrid(newGrid)
  }, [])
  
  const startGame = () => {
    const size = 3 + Math.floor((level - 1) / 3)
    setGridSize(size)
    generatePuzzle(size)
    setMoves(0)
    setHints(3)
    setGameState('playing')
  }
  
  const checkWin = useCallback(() => {
    // Check all rows
    for (let row of grid) {
      if (row.includes(0)) return false
      if (row.reduce((a, b) => a + b, 0) !== targetSum) return false
    }
    
    // Check all columns
    for (let col = 0; col < gridSize; col++) {
      let sum = 0
      for (let row = 0; row < gridSize; row++) {
        sum += grid[row][col]
      }
      if (sum !== targetSum) return false
    }
    
    // Check diagonals
    let diag1 = 0, diag2 = 0
    for (let i = 0; i < gridSize; i++) {
      diag1 += grid[i][i]
      diag2 += grid[i][gridSize - 1 - i]
    }
    
    if (diag1 === targetSum && diag2 === targetSum) {
      setGameState('victory')
      return true
    }
    return false
  }, [grid, targetSum, gridSize])
  
  const placeNumber = (x: number, y: number, num: number) => {
    if (grid[y][x] !== 0) return
    
    const newGrid = grid.map(row => [...row])
    newGrid[y][x] = num
    setGrid(newGrid)
    setMoves(moves + 1)
    
    setTimeout(() => checkWin(), 100)
  }
  
  const getRowSum = (row: number) => grid[row].reduce((a, b) => a + b, 0)
  const getColSum = (col: number) => grid.reduce((sum, row) => sum + row[col], 0)
  
  return (
    <Card className="w-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Grid3x3 className="w-8 h-8" />
          Magic Square
        </h2>
        <Button onClick={() => setGameState('menu')} size="sm" variant="outline">
          <Home className="w-4 h-4" />
        </Button>
      </div>

      {gameState === 'menu' && (
        <div className="flex flex-col items-center justify-center h-[400px] gap-4">
          <Grid3x3 className="w-24 h-24 text-primary" />
          <h3 className="text-3xl font-bold">Magic Square</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Place numbers so each row, column, and diagonal sums to {targetSum}!
          </p>
          <Button onClick={startGame} size="lg">Start Game</Button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-lg">Target Sum: {targetSum} | Moves: {moves}</div>
          
          <div className="grid gap-2" style={{gridTemplateColumns: `repeat(${gridSize}, 1fr)`}}>
            {grid.map((row, y) => row.map((cell, x) => (
              <Button
                key={`${x}-${y}`}
                variant={selectedCell?.x === x && selectedCell?.y === y ? "default" : "outline"}
                className="w-16 h-16 text-lg font-bold"
                onClick={() => setSelectedCell({x, y})}
              >
                {cell || ''}
              </Button>
            )))}
          </div>
          
          <div className="flex gap-2">
            {Array.from({length: gridSize * gridSize}, (_, i) => i + 1).map(num => (
              <Button
                key={num}
                size="sm"
                onClick={() => selectedCell && placeNumber(selectedCell.x, selectedCell.y, num)}
                disabled={grid.flat().includes(num)}
              >
                {num}
              </Button>
            ))}
          </div>
          
          <Button onClick={() => generatePuzzle(gridSize)} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      )}

      {gameState === 'victory' && (
        <div className="flex flex-col items-center justify-center h-[400px] gap-4">
          <CheckCircle className="w-24 h-24 text-green-500" />
          <h3 className="text-2xl font-bold">Puzzle Solved!</h3>
          <p>Completed in {moves} moves</p>
          <Button onClick={startGame}>Next Level</Button>
        </div>
      )}
    </Card>
  )
}
GAME_EOF

echo "Created MagicSquare.tsx"
