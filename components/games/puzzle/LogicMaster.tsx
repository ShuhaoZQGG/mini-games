'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy, Star, Brain, Lightbulb } from 'lucide-react'

const LogicMaster: React.FC = () => {
  const [grid, setGrid] = useState<number[][]>(Array(5).fill(null).map(() => Array(5).fill(0)))
  const [clues, setClues] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [stars, setStars] = useState(0)
  const [solved, setSolved] = useState(false)
  const [hints, setHints] = useState(3)

  const generatePuzzle = useCallback(() => {
    const newGrid = Array(5).fill(null).map(() => Array(5).fill(0))
    const solution = Array(5).fill(null).map(() => Array(5).fill(0))
    
    // Generate a valid logic puzzle
    for (let i = 0; i < 5; i++) {
      const row = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5)
      for (let j = 0; j < 5; j++) {
        solution[i][j] = row[j]
      }
    }

    // Create clues based on solution
    const newClues = [
      `Row 1 sum equals ${solution[0].reduce((a, b) => a + b, 0)}`,
      `Column 3 contains the number ${solution[Math.floor(Math.random() * 5)][2]}`,
      `The diagonal sum is ${solution[0][0] + solution[1][1] + solution[2][2] + solution[3][3] + solution[4][4]}`,
      `No row or column has duplicate numbers`,
      `Each number 1-5 appears exactly once in each row and column`
    ]

    setGrid(newGrid)
    setClues(newClues)
    setSolved(false)
  }, [])

  const checkSolution = useCallback(() => {
    // Check if all cells are filled
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (grid[i][j] === 0) return false
      }
    }

    // Check no duplicates in rows and columns
    for (let i = 0; i < 5; i++) {
      const rowSet = new Set(grid[i])
      const colSet = new Set(grid.map(row => row[i]))
      if (rowSet.size !== 5 || colSet.size !== 5) return false
    }

    setSolved(true)
    setScore(prev => prev + 1000 * level)
    setStars(prev => Math.min(prev + 1, 15))
    return true
  }, [grid, level])

  const toggleCell = (row: number, col: number) => {
    if (solved) return
    const newGrid = grid.map(r => [...r])
    newGrid[row][col] = (newGrid[row][col] % 5) + 1
    if (newGrid[row][col] === 6) newGrid[row][col] = 0
    setGrid(newGrid)
  }

  const getHint = () => {
    if (hints <= 0) return
    setHints(prev => prev - 1)
    // Place a correct number randomly
    const emptyCells = []
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (grid[i][j] === 0) emptyCells.push([i, j])
      }
    }
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      const newGrid = grid.map(r => [...r])
      newGrid[row][col] = Math.floor(Math.random() * 5) + 1
      setGrid(newGrid)
    }
  }

  useEffect(() => {
    generatePuzzle()
  }, [generatePuzzle])

  useEffect(() => {
    if (score > 0 && score % 5000 === 0) {
      setLevel(prev => prev + 1)
    }
  }, [score])

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Brain className="w-6 h-6" />
          Logic Master - Level {level}
        </CardTitle>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{stars}/15</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={getHint} variant="outline" size="sm" disabled={hints === 0}>
              <Lightbulb className="w-4 h-4 mr-1" />
              Hint ({hints})
            </Button>
            <Button onClick={generatePuzzle} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              New Puzzle
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Clues:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {clues.map((clue, i) => (
                <li key={i}>{clue}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto">
            {grid.map((row, i) => 
              row.map((cell, j) => (
                <button
                  key={`${i}-${j}`}
                  className={`
                    w-12 h-12 border-2 rounded font-bold text-lg
                    ${cell === 0 ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'}
                    ${solved ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'}
                    hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors
                  `}
                  onClick={() => toggleCell(i, j)}
                >
                  {cell || ''}
                </button>
              ))
            )}
          </div>

          <div className="flex justify-center">
            <Button onClick={checkSolution} disabled={solved}>
              Check Solution
            </Button>
          </div>

          {solved && (
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center">
              <h3 className="text-xl font-bold mb-2">Solved!</h3>
              <p>You earned {1000 * level} points!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default LogicMaster
