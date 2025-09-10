'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type CellState = 'empty' | 'filled' | 'marked'

interface Puzzle {
  rows: number[][]
  cols: number[][]
  solution: boolean[][]
  size: number
}

const PUZZLES: Puzzle[] = [
  {
    size: 5,
    rows: [[3], [1, 1], [3], [1], [1]],
    cols: [[2], [1, 1], [3], [1, 1], [2]],
    solution: [
      [true, true, true, false, false],
      [true, false, false, false, true],
      [true, true, true, false, false],
      [false, false, false, true, false],
      [false, false, false, true, false]
    ]
  },
  {
    size: 10,
    rows: [[7], [1, 1, 1], [1, 3, 1], [1, 1], [3, 3], [1, 3, 1], [1, 1, 1], [1, 1, 1], [1, 3, 1], [7]],
    cols: [[5], [1, 1], [1, 1, 1], [1, 3], [7], [7], [1, 3], [1, 1, 1], [1, 1], [5]],
    solution: [
      [false, true, true, true, true, true, true, true, false, false],
      [false, true, false, false, true, false, false, true, false, false],
      [false, true, false, true, true, true, false, true, false, false],
      [false, false, false, true, false, true, false, false, false, false],
      [true, true, true, false, false, false, true, true, true, false],
      [true, false, true, true, true, false, false, false, true, false],
      [true, false, false, true, false, false, false, false, true, false],
      [true, false, false, true, false, false, false, false, true, false],
      [true, false, true, true, true, false, false, false, true, false],
      [false, true, true, true, true, true, true, true, false, false]
    ]
  },
  {
    size: 15,
    rows: [
      [3, 3], [1, 5, 1], [1, 1, 1], [1, 7, 1], [1, 1, 1, 1],
      [1, 9, 1], [1, 1, 1, 1, 1], [1, 11, 1], [1, 1, 1, 1, 1, 1],
      [1, 13, 1], [15], [1, 1], [1, 1], [1, 1], [7]
    ],
    cols: [
      [4, 5], [3, 1, 4], [2, 1, 3], [1, 1, 1, 2], [1, 1, 1, 1],
      [1, 1, 1, 1], [1, 1, 1, 1], [15], [1, 1, 1, 1], [1, 1, 1, 1],
      [1, 1, 1, 1], [1, 1, 1, 2], [2, 1, 3], [3, 1, 4], [4, 5]
    ],
    solution: [
      [false, false, false, true, true, true, false, false, false, true, true, true, false, false, false],
      [false, false, true, false, true, true, true, true, true, false, true, false, false, false, false],
      [false, false, true, false, false, false, true, false, false, false, true, false, false, false, false],
      [false, true, false, true, true, true, true, true, true, true, false, true, false, false, false],
      [false, true, false, false, true, false, false, false, true, false, false, true, false, false, false],
      [true, false, true, true, true, true, true, true, true, true, true, false, true, false, false],
      [true, false, false, true, false, false, true, false, false, true, false, false, true, false, false],
      [true, false, true, true, true, true, true, true, true, true, true, true, true, false, true],
      [true, false, true, false, false, true, false, false, true, false, false, true, false, false, true],
      [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
      [false, false, false, false, false, true, false, false, true, false, false, false, false, false, false],
      [false, false, false, false, false, true, false, false, true, false, false, false, false, false, false],
      [false, false, false, false, false, true, false, false, true, false, false, false, false, false, false],
      [false, false, false, true, true, true, true, true, true, true, false, false, false, false, false]
    ]
  }
]

export default function Nonogram() {
  const [currentPuzzle, setCurrentPuzzle] = useState(0)
  const [grid, setGrid] = useState<CellState[][]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [time, setTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showHint, setShowHint] = useState(false)
  
  const puzzle = PUZZLES[currentPuzzle]
  
  const initializeGrid = useCallback(() => {
    const newGrid: CellState[][] = []
    for (let i = 0; i < puzzle.size; i++) {
      newGrid.push(new Array(puzzle.size).fill('empty'))
    }
    setGrid(newGrid)
    setIsComplete(false)
    setMistakes(0)
    setTime(0)
    setShowHint(false)
  }, [puzzle.size])
  
  useEffect(() => {
    initializeGrid()
  }, [currentPuzzle, initializeGrid])
  
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && !isComplete) {
      interval = setInterval(() => {
        setTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, isComplete])
  
  const handleCellClick = (row: number, col: number, rightClick: boolean = false) => {
    if (isComplete || !isPlaying) return
    
    const newGrid = [...grid]
    const currentState = newGrid[row][col]
    
    if (rightClick) {
      // Right click cycles through marked -> empty
      newGrid[row][col] = currentState === 'marked' ? 'empty' : 'marked'
    } else {
      // Left click toggles filled/empty
      if (currentState === 'filled') {
        newGrid[row][col] = 'empty'
      } else if (currentState === 'empty') {
        newGrid[row][col] = 'filled'
        // Check if this was a mistake
        if (!puzzle.solution[row][col]) {
          setMistakes(prev => prev + 1)
        }
      }
    }
    
    setGrid(newGrid)
    checkCompletion(newGrid)
  }
  
  const checkCompletion = (currentGrid: CellState[][]) => {
    let isCorrect = true
    for (let row = 0; row < puzzle.size; row++) {
      for (let col = 0; col < puzzle.size; col++) {
        const isFilled = currentGrid[row][col] === 'filled'
        const shouldBeFilled = puzzle.solution[row][col]
        if (isFilled !== shouldBeFilled) {
          isCorrect = false
          break
        }
      }
      if (!isCorrect) break
    }
    
    if (isCorrect) {
      setIsComplete(true)
      setIsPlaying(false)
    }
  }
  
  const checkLine = (cells: CellState[], clues: number[]): boolean => {
    const filled = cells
      .map((cell, i) => cell === 'filled' ? i : -1)
      .filter(i => i !== -1)
    
    if (filled.length === 0) return clues.length === 0 || (clues.length === 1 && clues[0] === 0)
    
    const groups: number[] = []
    let currentGroup = 1
    
    for (let i = 1; i < filled.length; i++) {
      if (filled[i] === filled[i - 1] + 1) {
        currentGroup++
      } else {
        groups.push(currentGroup)
        currentGroup = 1
      }
    }
    groups.push(currentGroup)
    
    return groups.length === clues.length && groups.every((g, i) => g === clues[i])
  }
  
  const getLineCompleteness = (cells: CellState[], clues: number[]): 'complete' | 'partial' | 'none' => {
    if (!cells || !clues) return 'none'
    const filledCount = cells.filter(c => c === 'filled').length
    const totalClue = clues.reduce((a, b) => a + b, 0)
    
    if (filledCount === totalClue && checkLine(cells, clues)) {
      return 'complete'
    }
    if (filledCount > 0) {
      return 'partial'
    }
    return 'none'
  }
  
  const revealHint = () => {
    if (isComplete || !isPlaying) return
    
    // Find an empty cell that should be filled
    const emptyCells: [number, number][] = []
    for (let row = 0; row < puzzle.size; row++) {
      for (let col = 0; col < puzzle.size; col++) {
        if (grid[row][col] === 'empty' && puzzle.solution[row][col]) {
          emptyCells.push([row, col])
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      const newGrid = [...grid]
      newGrid[row][col] = 'filled'
      setGrid(newGrid)
      checkCompletion(newGrid)
      setShowHint(true)
      setTimeout(() => setShowHint(false), 1000)
    }
  }
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const startGame = () => {
    initializeGrid()
    setIsPlaying(true)
  }
  
  const resetGame = () => {
    initializeGrid()
    setIsPlaying(false)
  }
  
  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold">Nonogram</h2>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Time: {formatTime(time)}</span>
            <span className="text-gray-600">Mistakes: {mistakes}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              setCurrentPuzzle((currentPuzzle + 1) % PUZZLES.length)
              setIsPlaying(false)
            }}
            size="sm"
          >
            Next Puzzle ({puzzle.size}x{puzzle.size})
          </Button>
          {!isPlaying && !isComplete && (
            <Button onClick={startGame} size="sm">Start</Button>
          )}
          {isPlaying && (
            <>
              <Button onClick={revealHint} size="sm" variant="outline">
                Hint
              </Button>
              <Button onClick={resetGame} size="sm" variant="outline">
                Reset
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="relative inline-block">
        <div className="flex">
          {/* Column clues */}
          <div className="grid" style={{
            gridTemplateColumns: `repeat(${puzzle.size}, 30px)`,
            marginLeft: '100px'
          }}>
            {puzzle.cols.map((clues, col) => (
              <div
                key={col}
                className="flex flex-col justify-end items-center pb-1 text-xs"
                style={{ minHeight: '80px' }}
              >
                {clues.map((clue, i) => (
                  <div
                    key={i}
                    className={`px-1 ${
                      grid.length > 0 && getLineCompleteness(
                        grid.map(row => row ? row[col] : 'empty'),
                        clues
                      ) === 'complete' ? 'text-green-600' : ''
                    }`}
                  >
                    {clue}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex">
          {/* Row clues */}
          <div className="grid" style={{
            gridTemplateRows: `repeat(${puzzle.size}, 30px)`,
            width: '100px'
          }}>
            {puzzle.rows.map((clues, row) => (
              <div
                key={row}
                className="flex justify-end items-center pr-2 text-xs"
              >
                {clues.map((clue, i) => (
                  <span
                    key={i}
                    className={`mx-1 ${
                      grid.length > 0 && grid[row] && getLineCompleteness(grid[row], clues) === 'complete' ? 'text-green-600' : ''
                    }`}
                  >
                    {clue}
                  </span>
                ))}
              </div>
            ))}
          </div>
          
          {/* Game grid */}
          <div
            className="grid border-2 border-gray-800"
            style={{
              gridTemplateColumns: `repeat(${puzzle.size}, 30px)`,
              gridTemplateRows: `repeat(${puzzle.size}, 30px)`
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    border border-gray-400 cursor-pointer hover:bg-gray-100
                    ${cell === 'filled' ? 'bg-gray-800' : ''}
                    ${cell === 'marked' ? 'bg-gray-200' : ''}
                    ${showHint && cell === 'filled' && grid[rowIndex][colIndex] === 'filled' ? 'animate-pulse' : ''}
                    ${(rowIndex + 1) % 5 === 0 ? 'border-b-2 border-b-gray-800' : ''}
                    ${(colIndex + 1) % 5 === 0 ? 'border-r-2 border-r-gray-800' : ''}
                  `}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    handleCellClick(rowIndex, colIndex, true)
                  }}
                >
                  {cell === 'marked' && (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      ×
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {isComplete && (
        <div className="mt-4 p-4 bg-green-100 rounded-lg text-center">
          <h3 className="text-xl font-bold text-green-800">Puzzle Complete!</h3>
          <p className="text-green-700">
            Time: {formatTime(time)} | Mistakes: {mistakes}
          </p>
          <Button onClick={resetGame} className="mt-2" size="sm">
            Play Again
          </Button>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Click to fill, Right-click to mark as empty</p>
        <p>Complete the picture by filling cells according to the number clues</p>
      </div>
    </Card>
  )
}