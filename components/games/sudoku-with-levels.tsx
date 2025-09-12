'use client'

import { useState, useEffect } from 'react'
import { SudokuGame } from '@/lib/games/sudoku'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareCard } from '@/components/social/share-card'
import GameWithLevels from '@/components/ui/game-with-levels'
import { cn } from '@/lib/utils'

const levels = [
  {
    id: 1,
    name: 'Beginner',
    difficulty: 'easy' as const,
    config: {
      difficulty: 'easy',
      emptyCells: 35,
      timeLimit: null
    },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Intermediate',
    difficulty: 'medium' as const,
    config: {
      difficulty: 'medium',
      emptyCells: 45,
      timeLimit: 1800000 // 30 minutes
    },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Advanced',
    difficulty: 'hard' as const,
    config: {
      difficulty: 'hard',
      emptyCells: 55,
      timeLimit: 1200000 // 20 minutes
    },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Expert',
    difficulty: 'expert' as const,
    config: {
      difficulty: 'expert',
      emptyCells: 60,
      timeLimit: 900000 // 15 minutes
    },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Master',
    difficulty: 'master' as const,
    config: {
      difficulty: 'expert',
      emptyCells: 65,
      timeLimit: 600000 // 10 minutes
    },
    requiredStars: 12
  }
]

export function SudokuWithLevels() {
  const getStars = (timeUsed: number, levelConfig: any): 1 | 2 | 3 => {
    if (!levelConfig.timeLimit) {
      // For easy level without time limit, base on completion
      return timeUsed > 0 ? 3 : 1
    }
    
    const timeRatio = timeUsed / levelConfig.timeLimit
    if (timeRatio <= 0.5) return 3 // Completed in half the time
    if (timeRatio <= 0.75) return 2 // Completed in 3/4 of the time
    if (timeRatio <= 1) return 1 // Completed within time limit
    return 1
  }

  const renderGame = (levelConfig: any, onScore: (score: number) => void) => {
    return <SudokuLevel levelConfig={levelConfig} onScore={onScore} />
  }

  return (
    <GameWithLevels
      gameId="sudoku"
      gameName="Sudoku"
      levels={levels}
      renderGame={renderGame}
      getStars={getStars}
    />
  )
}

function SudokuLevel({ 
  levelConfig, 
  onScore 
}: { 
  levelConfig: any
  onScore: (score: number) => void 
}) {
  const [game] = useState(() => {
    const g = new SudokuGame()
    g.start(levelConfig.difficulty)
    return g
  })
  const [grid, setGrid] = useState(game.getGrid())
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [hints, setHints] = useState(3)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [startTime] = useState(Date.now())
  const [notes, setNotes] = useState<Record<string, Set<number>>>({})
  const [noteMode, setNoteMode] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isComplete) {
        const elapsed = Date.now() - startTime
        setTimeElapsed(elapsed)
        
        // Check time limit
        if (levelConfig.timeLimit && elapsed >= levelConfig.timeLimit) {
          setIsComplete(true)
          onScore(0) // Failed to complete in time
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isComplete, startTime, levelConfig.timeLimit, onScore])

  const handleCellClick = (row: number, col: number) => {
    const fullGrid = game.getFullGrid()
    if (fullGrid[row][col].isFixed) return
    setSelectedCell([row, col])
  }

  const handleNumberInput = (num: number) => {
    if (!selectedCell || isComplete) return
    const [row, col] = selectedCell

    if (noteMode) {
      const key = `${row},${col}`
      const cellNotes = notes[key] || new Set()
      if (cellNotes.has(num)) {
        cellNotes.delete(num)
      } else {
        cellNotes.add(num)
      }
      setNotes({ ...notes, [key]: cellNotes })
    } else {
      const isValid = game.placeNumber(row, col, num)
      
      if (!isValid) {
        setMistakes(mistakes + 1)
      }
      
      setGrid([...game.getGrid()])
      
      if (game.isComplete()) {
        setIsComplete(true)
        const finalTime = Date.now() - startTime
        onScore(finalTime)
      }
    }
  }

  const handleClear = () => {
    if (!selectedCell || isComplete) return
    const [row, col] = selectedCell
    
    const fullGrid = game.getFullGrid()
    if (fullGrid[row][col].isFixed) return
    
    game.clearCell(row, col)
    setGrid([...game.getGrid()])
    
    // Clear notes for this cell
    const key = `${row},${col}`
    delete notes[key]
    setNotes({ ...notes })
  }

  const handleHint = () => {
    if (hints <= 0 || isComplete) return
    
    const hint = game.getHint()
    if (hint) {
      const { row, col, value } = hint
      game.placeNumber(row, col, value)
      setGrid([...game.getGrid()])
      setHints(hints - 1)
      
      if (game.isComplete()) {
        setIsComplete(true)
        const finalTime = Date.now() - startTime
        onScore(finalTime)
      }
    }
  }

  const handleNewGame = () => {
    game.reset()
    game.start(levelConfig.difficulty)
    setGrid(game.getGrid())
    setSelectedCell(null)
    setIsComplete(false)
    setMistakes(0)
    setHints(3)
    setTimeElapsed(0)
    setNotes({})
    setNoteMode(false)
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const getRemainingTime = () => {
    if (!levelConfig.timeLimit) return null
    const remaining = Math.max(0, levelConfig.timeLimit - timeElapsed)
    return formatTime(remaining)
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sudoku - {levelConfig.difficulty}</span>
            <div className="flex items-center gap-4">
              {levelConfig.timeLimit && (
                <span className="text-lg font-mono">
                  Time: {getRemainingTime()}
                </span>
              )}
              <span className="text-lg">
                Mistakes: {mistakes}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <div className="inline-block">
              <div className="grid grid-cols-9 gap-0 border-2 border-gray-800 dark:border-gray-200">
                {grid.map((row, rowIndex) => (
                  row.map((cell, colIndex) => {
                    const isSelected = selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex
                    const fullGrid = game.getFullGrid()
                    const isInitial = fullGrid[rowIndex][colIndex].isFixed
                    const key = `${rowIndex},${colIndex}`
                    const cellNotes = notes[key]
                    
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={cn(
                          "w-12 h-12 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg font-semibold transition-colors",
                          isSelected && "bg-blue-100 dark:bg-blue-900",
                          isInitial && "bg-gray-100 dark:bg-gray-800 cursor-not-allowed",
                          !isInitial && !isSelected && "hover:bg-gray-50 dark:hover:bg-gray-800",
                          (colIndex + 1) % 3 === 0 && colIndex !== 8 && "border-r-2 border-r-gray-800 dark:border-r-gray-200",
                          (rowIndex + 1) % 3 === 0 && rowIndex !== 8 && "border-b-2 border-b-gray-800 dark:border-b-gray-200"
                        )}
                        disabled={isComplete}
                      >
                        {cell !== 0 ? (
                          <span className={isInitial ? "text-gray-900 dark:text-gray-100" : "text-blue-600 dark:text-blue-400"}>
                            {cell}
                          </span>
                        ) : cellNotes ? (
                          <div className="grid grid-cols-3 gap-0 text-xs text-gray-500 dark:text-gray-400">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                              <span key={n} className="w-3 h-3">
                                {cellNotes.has(n) ? n : ''}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </button>
                    )
                  })
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <Button
                key={num}
                onClick={() => handleNumberInput(num)}
                variant="outline"
                size="lg"
                className="w-12 h-12"
                disabled={isComplete}
              >
                {num}
              </Button>
            ))}
          </div>

          <div className="flex justify-center gap-4">
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={isComplete || !selectedCell}
            >
              Clear
            </Button>
            <Button
              onClick={() => setNoteMode(!noteMode)}
              variant={noteMode ? "default" : "outline"}
              disabled={isComplete}
            >
              Notes {noteMode && "ON"}
            </Button>
            <Button
              onClick={handleHint}
              variant="outline"
              disabled={isComplete || hints <= 0}
            >
              Hint ({hints})
            </Button>
            <Button
              onClick={handleNewGame}
              variant="outline"
            >
              New Game
            </Button>
          </div>

          {isComplete && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">
                    {timeElapsed < (levelConfig.timeLimit || Infinity) ? 'Puzzle Complete!' : 'Time Up!'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Time: {formatTime(timeElapsed)}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Mistakes: {mistakes}
                  </p>
                  <div className="flex gap-4 justify-center mt-4">
                    <Button onClick={handleNewGame}>
                      New Puzzle
                    </Button>
                    <ShareCard
                      score={Math.floor(timeElapsed / 1000)}
                      gameTitle="Sudoku"
                      gameSlug="sudoku"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}