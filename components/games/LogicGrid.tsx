'use client'

import { useState, useEffect, useCallback } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Play, RotateCcw, Check, X, Lightbulb, Eye } from 'lucide-react'

interface LogicGridProps {
  levelConfig: {
    gridSize: number
    categories: number
    clueCount: number
    difficulty: 'easy' | 'medium' | 'hard'
    timeLimit: number
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Logic Novice',
    difficulty: 'easy',
    config: { gridSize: 3, categories: 2, clueCount: 4, difficulty: 'easy', timeLimit: 300 },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Deduction Student',
    difficulty: 'medium',
    config: { gridSize: 4, categories: 2, clueCount: 6, difficulty: 'medium', timeLimit: 400 },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Puzzle Solver',
    difficulty: 'hard',
    config: { gridSize: 4, categories: 3, clueCount: 8, difficulty: 'hard', timeLimit: 500 },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Logic Expert',
    difficulty: 'expert',
    config: { gridSize: 5, categories: 3, clueCount: 10, difficulty: 'hard', timeLimit: 600 },
    requiredStars: 8
  },
  {
    id: 5,
    name: 'Master Detective',
    difficulty: 'master',
    config: { gridSize: 6, categories: 4, clueCount: 12, difficulty: 'hard', timeLimit: 720 },
    requiredStars: 12
  }
]

type CellState = 'empty' | 'yes' | 'no'

interface Clue {
  text: string
  type: 'direct' | 'indirect' | 'negative'
  category1: number
  item1: number
  category2: number
  item2: number
  relation: 'is' | 'not' | 'before' | 'after' | 'nextTo'
}

const CATEGORY_NAMES = [
  ['People', 'Colors', 'Animals', 'Numbers'],
  ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank'],
  ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'],
  ['Cat', 'Dog', 'Bird', 'Fish', 'Rabbit', 'Turtle'],
  ['One', 'Two', 'Three', 'Four', 'Five', 'Six']
]

function LogicGrid({ levelConfig, onScore }: LogicGridProps) {
  const { gridSize, categories, clueCount, timeLimit } = levelConfig
  const [grid, setGrid] = useState<CellState[][][]>([])
  const [solution, setSolution] = useState<number[][]>([])
  const [clues, setClues] = useState<Clue[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [mistakes, setMistakes] = useState(0)
  const [hints, setHints] = useState(3)
  const [showSolution, setShowSolution] = useState(false)
  const [score, setScore] = useState(0)

  // Generate a valid solution
  const generateSolution = useCallback(() => {
    const newSolution: number[][] = []
    for (let cat = 0; cat < categories; cat++) {
      const items = Array.from({ length: gridSize }, (_, i) => i)
      // Shuffle items for this category
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]]
      }
      newSolution.push(items)
    }
    return newSolution
  }, [gridSize, categories])

  // Generate clues based on solution
  const generateClues = useCallback((solution: number[][]) => {
    const newClues: Clue[] = []
    const usedPairs = new Set<string>()
    
    // Generate direct clues
    for (let i = 0; i < Math.min(clueCount / 2, gridSize); i++) {
      const cat1 = Math.floor(Math.random() * categories)
      let cat2 = Math.floor(Math.random() * categories)
      while (cat2 === cat1) {
        cat2 = Math.floor(Math.random() * categories)
      }
      
      const position = Math.floor(Math.random() * gridSize)
      const item1 = solution[cat1][position]
      const item2 = solution[cat2][position]
      
      const pairKey = `${cat1}-${item1}-${cat2}-${item2}`
      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey)
        newClues.push({
          text: `${CATEGORY_NAMES[cat1 + 1][item1]} is with ${CATEGORY_NAMES[cat2 + 1][item2]}`,
          type: 'direct',
          category1: cat1,
          item1: item1,
          category2: cat2,
          item2: item2,
          relation: 'is'
        })
      }
    }
    
    // Generate negative clues
    for (let i = newClues.length; i < clueCount && i < clueCount; i++) {
      const cat1 = Math.floor(Math.random() * categories)
      let cat2 = Math.floor(Math.random() * categories)
      while (cat2 === cat1) {
        cat2 = Math.floor(Math.random() * categories)
      }
      
      const item1 = Math.floor(Math.random() * gridSize)
      let item2 = Math.floor(Math.random() * gridSize)
      
      // Find an item that's NOT in the same position
      const position1 = solution[cat1].indexOf(item1)
      while (solution[cat2][position1] === item2) {
        item2 = (item2 + 1) % gridSize
      }
      
      const pairKey = `${cat1}-${item1}-${cat2}-${item2}`
      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey)
        newClues.push({
          text: `${CATEGORY_NAMES[cat1 + 1][item1]} is not with ${CATEGORY_NAMES[cat2 + 1][item2]}`,
          type: 'negative',
          category1: cat1,
          item1: item1,
          category2: cat2,
          item2: item2,
          relation: 'not'
        })
      }
    }
    
    return newClues
  }, [categories, gridSize, clueCount])

  // Initialize grid
  const initializeGrid = useCallback(() => {
    const newGrid: CellState[][][] = []
    for (let cat1 = 0; cat1 < categories - 1; cat1++) {
      for (let cat2 = cat1 + 1; cat2 < categories; cat2++) {
        const subGrid: CellState[][] = []
        for (let i = 0; i < gridSize; i++) {
          subGrid.push(Array(gridSize).fill('empty'))
        }
        newGrid.push(subGrid)
      }
    }
    return newGrid
  }, [gridSize, categories])

  // Handle cell click
  const handleCellClick = (gridIndex: number, row: number, col: number) => {
    if (!gameStarted || gameOver) return
    
    const newGrid = [...grid]
    const currentState = newGrid[gridIndex][row][col]
    
    // Cycle through states: empty -> yes -> no -> empty
    if (currentState === 'empty') {
      newGrid[gridIndex][row][col] = 'yes'
      
      // Auto-fill 'no' in same row and column
      for (let i = 0; i < gridSize; i++) {
        if (i !== col && newGrid[gridIndex][row][i] === 'empty') {
          newGrid[gridIndex][row][i] = 'no'
        }
        if (i !== row && newGrid[gridIndex][i][col] === 'empty') {
          newGrid[gridIndex][i][col] = 'no'
        }
      }
    } else if (currentState === 'yes') {
      newGrid[gridIndex][row][col] = 'no'
    } else {
      newGrid[gridIndex][row][col] = 'empty'
    }
    
    setGrid(newGrid)
    checkProgress(newGrid)
  }

  // Check if puzzle is solved
  const checkProgress = (currentGrid: CellState[][][]) => {
    let gridIndex = 0
    let allCorrect = true
    let correctCells = 0
    const totalCells = (categories * (categories - 1) / 2) * gridSize
    
    for (let cat1 = 0; cat1 < categories - 1; cat1++) {
      for (let cat2 = cat1 + 1; cat2 < categories; cat2++) {
        for (let pos = 0; pos < gridSize; pos++) {
          const item1 = solution[cat1][pos]
          const item2 = solution[cat2][pos]
          
          if (currentGrid[gridIndex][item1][item2] === 'yes') {
            correctCells++
          } else if (currentGrid[gridIndex][item1][item2] !== 'empty') {
            allCorrect = false
          }
        }
        gridIndex++
      }
    }
    
    if (correctCells === totalCells && allCorrect) {
      // Puzzle solved!
      setGameOver(true)
      const timeBonus = timeLeft * 2
      const hintPenalty = (3 - hints) * 50
      const mistakePenalty = mistakes * 10
      const finalScore = Math.max(0, 1000 + timeBonus - hintPenalty - mistakePenalty)
      setScore(finalScore)
      onScore(finalScore)
    }
  }

  // Get hint
  const getHint = () => {
    if (hints <= 0 || !gameStarted || gameOver) return
    
    setHints(hints - 1)
    
    // Find an empty correct cell and reveal it
    let gridIndex = 0
    for (let cat1 = 0; cat1 < categories - 1; cat1++) {
      for (let cat2 = cat1 + 1; cat2 < categories; cat2++) {
        for (let pos = 0; pos < gridSize; pos++) {
          const item1 = solution[cat1][pos]
          const item2 = solution[cat2][pos]
          
          if (grid[gridIndex][item1][item2] === 'empty') {
            handleCellClick(gridIndex, item1, item2)
            return
          }
        }
        gridIndex++
      }
    }
  }

  // Timer
  useEffect(() => {
    if (gameStarted && !gameOver && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !gameOver) {
      setGameOver(true)
      setScore(0)
    }
  }, [gameStarted, gameOver, timeLeft])

  const startGame = () => {
    const newSolution = generateSolution()
    setSolution(newSolution)
    setClues(generateClues(newSolution))
    setGrid(initializeGrid())
    setScore(0)
    setMistakes(0)
    setHints(3)
    setTimeLeft(timeLimit)
    setGameStarted(true)
    setGameOver(false)
    setShowSolution(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCellIcon = (state: CellState) => {
    if (state === 'yes') return <Check className="w-4 h-4 text-green-500" />
    if (state === 'no') return <X className="w-4 h-4 text-red-500" />
    return null
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Logic Grid Puzzle</h3>
            <p className="text-sm text-muted-foreground">
              Time: {formatTime(timeLeft)} | Hints: {hints}
            </p>
          </div>
          
          <div className="flex gap-2">
            {gameStarted && (
              <>
                <Button onClick={getHint} variant="outline" disabled={hints === 0}>
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Hint ({hints})
                </Button>
                <Button 
                  onClick={() => setShowSolution(!showSolution)} 
                  variant="outline"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showSolution ? 'Hide' : 'Show'} Solution
                </Button>
              </>
            )}
            {!gameStarted ? (
              <Button onClick={startGame} size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Game
              </Button>
            ) : (
              <Button onClick={startGame} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Puzzle
              </Button>
            )}
          </div>
        </div>

        {gameStarted && (
          <>
            {/* Clues Section */}
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold mb-2">Clues:</h4>
              <ul className="space-y-1 text-sm">
                {clues.map((clue, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">{index + 1}.</span>
                    <span>{clue.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Grid Section */}
            <div className="space-y-6">
              {grid.map((subGrid, gridIndex) => {
                // Calculate which categories this grid represents
                let catCount = 0
                let cat1 = 0, cat2 = 1
                for (let c1 = 0; c1 < categories - 1; c1++) {
                  for (let c2 = c1 + 1; c2 < categories; c2++) {
                    if (catCount === gridIndex) {
                      cat1 = c1
                      cat2 = c2
                    }
                    catCount++
                  }
                }
                
                return (
                  <div key={gridIndex} className="border rounded-lg p-4">
                    <h5 className="text-sm font-semibold mb-2">
                      {CATEGORY_NAMES[0][cat1]} vs {CATEGORY_NAMES[0][cat2]}
                    </h5>
                    <div className="grid gap-[1px] bg-gray-300 dark:bg-gray-700 p-[1px]">
                      {/* Headers */}
                      <div className="grid" style={{ gridTemplateColumns: `100px repeat(${gridSize}, 1fr)` }}>
                        <div className="bg-gray-200 dark:bg-gray-600 p-2 text-xs font-semibold"></div>
                        {Array.from({ length: gridSize }, (_, i) => (
                          <div key={i} className="bg-gray-200 dark:bg-gray-600 p-2 text-xs font-semibold text-center">
                            {CATEGORY_NAMES[cat2 + 1][i]}
                          </div>
                        ))}
                      </div>
                      
                      {/* Grid cells */}
                      {subGrid.map((row, rowIndex) => (
                        <div key={rowIndex} className="grid" style={{ gridTemplateColumns: `100px repeat(${gridSize}, 1fr)` }}>
                          <div className="bg-gray-200 dark:bg-gray-600 p-2 text-xs font-semibold">
                            {CATEGORY_NAMES[cat1 + 1][rowIndex]}
                          </div>
                          {row.map((cell, colIndex) => (
                            <motion.button
                              key={colIndex}
                              className={`bg-white dark:bg-gray-800 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center h-10 ${
                                showSolution && solution[cat1][rowIndex] === rowIndex && solution[cat2][rowIndex] === colIndex
                                  ? 'ring-2 ring-green-500'
                                  : ''
                              }`}
                              onClick={() => handleCellClick(gridIndex, rowIndex, colIndex)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {getCellIcon(cell)}
                            </motion.button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center"
            >
              <h2 className="text-2xl font-bold mb-2">
                {score > 0 ? 'Puzzle Solved!' : 'Time\'s Up!'}
              </h2>
              <p className="text-lg mb-4">
                {score > 0 ? `Score: ${score}` : 'Try again!'}
              </p>
              <Button onClick={startGame}>
                <RotateCcw className="w-4 h-4 mr-2" />
                New Puzzle
              </Button>
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function LogicGridWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    if (score >= 900) return 3
    if (score >= 600) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="logic-grid"
      gameName="Logic Grid"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <LogicGrid levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}