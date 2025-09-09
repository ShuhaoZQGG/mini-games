'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GameWithLevels, { GameLevel } from '@/components/ui/game-with-levels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, RotateCcw, Check, HelpCircle, Lightbulb, Award, ChevronRight, ChevronDown } from 'lucide-react'

interface Cell {
  letter: string
  isBlack: boolean
  number?: number
  partOfAcross?: number
  partOfDown?: number
  revealed: boolean
  correct: boolean
}

interface Clue {
  id: number
  number: number
  text: string
  answer: string
  direction: 'across' | 'down'
  startRow: number
  startCol: number
  cells: { row: number; col: number }[]
}

interface Puzzle {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master'
  grid: Cell[][]
  clues: {
    across: Clue[]
    down: Clue[]
  }
}

interface CrosswordGameProps {
  levelConfig: {
    gridSize: number
    timeLimit: number
    hintsAllowed: number
    errorCheckEnabled: boolean
    puzzleDifficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'master'
  }
  onScore: (score: number) => void
}

const levels: GameLevel[] = [
  {
    id: 1,
    name: 'Beginner Words',
    difficulty: 'easy',
    config: { gridSize: 5, timeLimit: 600, hintsAllowed: 10, errorCheckEnabled: true, puzzleDifficulty: 'easy' },
    requiredStars: 0
  },
  {
    id: 2,
    name: 'Vocabulary Builder',
    difficulty: 'medium',
    config: { gridSize: 7, timeLimit: 480, hintsAllowed: 5, errorCheckEnabled: true, puzzleDifficulty: 'medium' },
    requiredStars: 2
  },
  {
    id: 3,
    name: 'Word Master',
    difficulty: 'hard',
    config: { gridSize: 10, timeLimit: 360, hintsAllowed: 3, errorCheckEnabled: false, puzzleDifficulty: 'hard' },
    requiredStars: 5
  },
  {
    id: 4,
    name: 'Lexicon Expert',
    difficulty: 'expert',
    config: { gridSize: 12, timeLimit: 300, hintsAllowed: 2, errorCheckEnabled: false, puzzleDifficulty: 'expert' },
    requiredStars: 9
  },
  {
    id: 5,
    name: 'Crossword Champion',
    difficulty: 'master',
    config: { gridSize: 15, timeLimit: 240, hintsAllowed: 1, errorCheckEnabled: false, puzzleDifficulty: 'master' },
    requiredStars: 12
  }
]

// Generate puzzles based on difficulty
const generatePuzzle = (difficulty: string, gridSize: number): Puzzle => {
  // Simplified puzzle generation for demonstration
  const puzzles: { [key: string]: Puzzle } = {
    easy: {
      id: 'easy-1',
      name: 'Simple Words',
      difficulty: 'easy',
      grid: [],
      clues: {
        across: [
          { id: 1, number: 1, text: 'Feline pet', answer: 'CAT', direction: 'across', startRow: 0, startCol: 0, cells: [] },
          { id: 2, number: 3, text: 'Canine pet', answer: 'DOG', direction: 'across', startRow: 2, startCol: 0, cells: [] },
        ],
        down: [
          { id: 3, number: 1, text: 'Vehicle', answer: 'CAR', direction: 'down', startRow: 0, startCol: 0, cells: [] },
          { id: 4, number: 2, text: 'Tall plant', answer: 'TREE', direction: 'down', startRow: 0, startCol: 2, cells: [] },
        ]
      }
    },
    medium: {
      id: 'medium-1',
      name: 'Common Words',
      difficulty: 'medium',
      grid: [],
      clues: {
        across: [
          { id: 1, number: 1, text: 'Computer input', answer: 'MOUSE', direction: 'across', startRow: 0, startCol: 0, cells: [] },
          { id: 2, number: 4, text: 'Electronic mail', answer: 'EMAIL', direction: 'across', startRow: 2, startCol: 0, cells: [] },
        ],
        down: [
          { id: 3, number: 1, text: 'Display screen', answer: 'MONITOR', direction: 'down', startRow: 0, startCol: 0, cells: [] },
          { id: 4, number: 2, text: 'Programs', answer: 'SOFTWARE', direction: 'down', startRow: 0, startCol: 2, cells: [] },
        ]
      }
    },
    hard: {
      id: 'hard-1',
      name: 'Challenge Words',
      difficulty: 'hard',
      grid: [],
      clues: {
        across: [
          { id: 1, number: 1, text: 'Scientific study', answer: 'RESEARCH', direction: 'across', startRow: 0, startCol: 0, cells: [] },
          { id: 2, number: 3, text: 'Mathematical concept', answer: 'ALGORITHM', direction: 'across', startRow: 2, startCol: 0, cells: [] },
        ],
        down: [
          { id: 3, number: 1, text: 'Renaissance artist', answer: 'REMBRANDT', direction: 'down', startRow: 0, startCol: 0, cells: [] },
          { id: 4, number: 2, text: 'Chemical element', answer: 'HYDROGEN', direction: 'down', startRow: 0, startCol: 4, cells: [] },
        ]
      }
    },
    expert: {
      id: 'expert-1',
      name: 'Expert Challenge',
      difficulty: 'expert',
      grid: [],
      clues: {
        across: [
          { id: 1, number: 1, text: 'Quantum physics concept', answer: 'ENTANGLEMENT', direction: 'across', startRow: 0, startCol: 0, cells: [] },
          { id: 2, number: 3, text: 'Literary device', answer: 'METAPHOR', direction: 'across', startRow: 2, startCol: 0, cells: [] },
        ],
        down: [
          { id: 3, number: 1, text: 'Ancient civilization', answer: 'MESOPOTAMIA', direction: 'down', startRow: 0, startCol: 0, cells: [] },
          { id: 4, number: 2, text: 'Philosophical concept', answer: 'EPISTEMOLOGY', direction: 'down', startRow: 0, startCol: 5, cells: [] },
        ]
      }
    },
    master: {
      id: 'master-1',
      name: 'Master Challenge',
      difficulty: 'master',
      grid: [],
      clues: {
        across: [
          { id: 1, number: 1, text: 'Complex mathematics', answer: 'CRYPTOGRAPHY', direction: 'across', startRow: 0, startCol: 0, cells: [] },
          { id: 2, number: 3, text: 'Advanced physics', answer: 'THERMODYNAMICS', direction: 'across', startRow: 2, startCol: 0, cells: [] },
        ],
        down: [
          { id: 3, number: 1, text: 'Biochemical process', answer: 'PHOTOSYNTHESIS', direction: 'down', startRow: 0, startCol: 0, cells: [] },
          { id: 4, number: 2, text: 'Astronomical phenomenon', answer: 'SUPERNOVA', direction: 'down', startRow: 0, startCol: 8, cells: [] },
        ]
      }
    }
  }
  
  return puzzles[difficulty] || puzzles.easy
}

function CrosswordGame({ levelConfig, onScore }: CrosswordGameProps) {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null)
  const [grid, setGrid] = useState<Cell[][]>([])
  const [selectedClue, setSelectedClue] = useState<Clue | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [timeLeft, setTimeLeft] = useState(levelConfig.timeLimit)
  const [score, setScore] = useState(0)
  
  const inputRef = useRef<HTMLInputElement>(null)

  // Generate grid from puzzle data
  const generateGrid = useCallback((puzzle: Puzzle): Cell[][] => {
    const newGrid: Cell[][] = Array(levelConfig.gridSize).fill(null).map(() => 
      Array(levelConfig.gridSize).fill(null).map(() => ({
        letter: '',
        isBlack: true,
        revealed: false,
        correct: false
      }))
    )
    
    // Place across clues
    puzzle.clues.across.forEach(clue => {
      const cells: { row: number; col: number }[] = []
      for (let i = 0; i < clue.answer.length; i++) {
        const row = clue.startRow
        const col = clue.startCol + i
        if (row < levelConfig.gridSize && col < levelConfig.gridSize) {
          newGrid[row][col] = {
            letter: '',
            isBlack: false,
            partOfAcross: clue.id,
            partOfDown: newGrid[row][col]?.partOfDown,
            revealed: false,
            correct: false
          }
          if (i === 0) {
            newGrid[row][col].number = clue.number
          }
          cells.push({ row, col })
        }
      }
      clue.cells = cells
    })
    
    // Place down clues
    puzzle.clues.down.forEach(clue => {
      const cells: { row: number; col: number }[] = []
      for (let i = 0; i < clue.answer.length; i++) {
        const row = clue.startRow + i
        const col = clue.startCol
        if (row < levelConfig.gridSize && col < levelConfig.gridSize) {
          if (!newGrid[row][col] || newGrid[row][col].isBlack) {
            newGrid[row][col] = {
              letter: '',
              isBlack: false,
              partOfDown: clue.id,
              revealed: false,
              correct: false
            }
          } else {
            newGrid[row][col].partOfDown = clue.id
          }
          if (i === 0 && !newGrid[row][col].number) {
            newGrid[row][col].number = clue.number
          }
          cells.push({ row, col })
        }
      }
      clue.cells = cells
    })
    
    return newGrid
  }, [levelConfig.gridSize])

  const startGame = () => {
    const puzzle = generatePuzzle(levelConfig.puzzleDifficulty, levelConfig.gridSize)
    setCurrentPuzzle(puzzle)
    setGrid(generateGrid(puzzle))
    setGameState('playing')
    setHintsUsed(0)
    setCorrectAnswers(0)
    setTimeLeft(levelConfig.timeLimit)
    setScore(0)
  }

  const resetGame = () => {
    setGameState('menu')
    setCurrentPuzzle(null)
    setGrid([])
    setSelectedClue(null)
    setSelectedCell(null)
    setHintsUsed(0)
    setCorrectAnswers(0)
    setTimeLeft(levelConfig.timeLimit)
    setScore(0)
  }

  // Handle cell input
  const handleCellInput = useCallback((row: number, col: number, value: string) => {
    if (!currentPuzzle || grid[row][col].isBlack) return
    
    const newGrid = [...grid]
    newGrid[row][col].letter = value.toUpperCase()
    setGrid(newGrid)
    
    // Check if any words are complete
    checkWordCompletion(newGrid)
    
    // Move to next cell
    if (value && selectedClue) {
      const nextCell = getNextCell(row, col, selectedClue.direction)
      if (nextCell) {
        setSelectedCell(nextCell)
      }
    }
  }, [grid, currentPuzzle, selectedClue])

  // Get next cell in direction
  const getNextCell = (row: number, col: number, direction: 'across' | 'down'): { row: number; col: number } | null => {
    const nextRow = direction === 'down' ? row + 1 : row
    const nextCol = direction === 'across' ? col + 1 : col
    
    if (nextRow < levelConfig.gridSize && nextCol < levelConfig.gridSize && !grid[nextRow][nextCol].isBlack) {
      return { row: nextRow, col: nextCol }
    }
    return null
  }

  // Check if word is complete and correct
  const checkWordCompletion = useCallback((currentGrid: Cell[][]) => {
    if (!currentPuzzle) return
    
    let correct = 0
    const allClues = [...currentPuzzle.clues.across, ...currentPuzzle.clues.down]
    
    allClues.forEach(clue => {
      let word = ''
      let allFilled = true
      
      clue.cells.forEach(cell => {
        const letter = currentGrid[cell.row][cell.col].letter
        if (!letter) {
          allFilled = false
        }
        word += letter
      })
      
      if (allFilled) {
        const isCorrect = word === clue.answer
        if (isCorrect) {
          correct++
          // Mark cells as correct
          clue.cells.forEach(cell => {
            currentGrid[cell.row][cell.col].correct = true
          })
        } else if (levelConfig.errorCheckEnabled) {
          // Mark cells as incorrect
          clue.cells.forEach(cell => {
            currentGrid[cell.row][cell.col].correct = false
          })
        }
      }
    })
    
    setCorrectAnswers(correct)
    
    // Calculate score based on time left and hints used
    const baseScore = correct * 100
    const timeBonus = Math.floor(timeLeft / 10)
    const hintPenalty = hintsUsed * 20
    const calculatedScore = Math.max(0, baseScore + timeBonus - hintPenalty)
    setScore(calculatedScore)
    
    // Check if puzzle is complete
    if (correct === allClues.length) {
      setGameState('completed')
      onScore(calculatedScore)
    }
  }, [currentPuzzle, levelConfig.errorCheckEnabled, timeLeft, hintsUsed, onScore])

  // Use hint
  const useHint = () => {
    if (hintsUsed >= levelConfig.hintsAllowed || !selectedClue || !currentPuzzle) return
    
    const newGrid = [...grid]
    const randomIndex = Math.floor(Math.random() * selectedClue.cells.length)
    const cell = selectedClue.cells[randomIndex]
    const letter = selectedClue.answer[randomIndex]
    
    newGrid[cell.row][cell.col].letter = letter
    newGrid[cell.row][cell.col].revealed = true
    
    setGrid(newGrid)
    setHintsUsed(hintsUsed + 1)
    checkWordCompletion(newGrid)
  }

  // Handle clue selection
  const handleClueSelect = (clue: Clue) => {
    setSelectedClue(clue)
    setSelectedCell({ row: clue.startRow, col: clue.startCol })
    inputRef.current?.focus()
  }

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col].isBlack) return
    
    setSelectedCell({ row, col })
    
    // Find associated clue
    const cell = grid[row][col]
    if (cell.partOfAcross && currentPuzzle) {
      const clue = currentPuzzle.clues.across.find(c => c.id === cell.partOfAcross)
      if (clue) setSelectedClue(clue)
    } else if (cell.partOfDown && currentPuzzle) {
      const clue = currentPuzzle.clues.down.find(c => c.id === cell.partOfDown)
      if (clue) setSelectedClue(clue)
    }
    
    inputRef.current?.focus()
  }

  // Timer
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('completed')
      onScore(score)
    }
  }, [gameState, timeLeft, score, onScore])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedCell || !grid[selectedCell.row][selectedCell.col]) return
      
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        handleCellInput(selectedCell.row, selectedCell.col, e.key)
      } else if (e.key === 'Backspace') {
        handleCellInput(selectedCell.row, selectedCell.col, '')
      } else if (e.key === 'ArrowUp' && selectedCell.row > 0) {
        setSelectedCell({ row: selectedCell.row - 1, col: selectedCell.col })
      } else if (e.key === 'ArrowDown' && selectedCell.row < levelConfig.gridSize - 1) {
        setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col })
      } else if (e.key === 'ArrowLeft' && selectedCell.col > 0) {
        setSelectedCell({ row: selectedCell.row, col: selectedCell.col - 1 })
      } else if (e.key === 'ArrowRight' && selectedCell.col < levelConfig.gridSize - 1) {
        setSelectedCell({ row: selectedCell.row, col: selectedCell.col + 1 })
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedCell, grid, handleCellInput, levelConfig.gridSize])

  if (gameState === 'menu') {
    return (
      <Card className="bg-white/10 backdrop-blur">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Crossword Puzzle</h2>
            <p className="text-gray-300">
              Grid Size: {levelConfig.gridSize}x{levelConfig.gridSize} | Time: {levelConfig.timeLimit}s | Hints: {levelConfig.hintsAllowed}
            </p>
            <Button onClick={startGame} size="lg" className="gap-2">
              <Play className="w-5 h-5" />
              Start Game
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Game Stats */}
      <div className="flex justify-between items-center text-white">
        <div className="flex gap-4">
          <span>Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          <span>Score: {score}</span>
          <span>Complete: {correctAnswers}/{currentPuzzle ? currentPuzzle.clues.across.length + currentPuzzle.clues.down.length : 0}</span>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={useHint} 
            size="sm" 
            variant="outline"
            disabled={hintsUsed >= levelConfig.hintsAllowed}
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Hint ({levelConfig.hintsAllowed - hintsUsed})
          </Button>
          <Button onClick={resetGame} size="sm" variant="outline">
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Game Grid */}
      <Card className="bg-white/10 backdrop-blur">
        <CardContent className="p-4">
          <div className="grid gap-0.5 mx-auto" style={{ 
            gridTemplateColumns: `repeat(${levelConfig.gridSize}, 40px)`,
            width: 'fit-content'
          }}>
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    w-10 h-10 border flex items-center justify-center relative cursor-pointer
                    ${cell.isBlack ? 'bg-gray-800' : 'bg-white/20'}
                    ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 'ring-2 ring-blue-400' : ''}
                    ${cell.correct && levelConfig.errorCheckEnabled ? 'bg-green-500/30' : ''}
                    ${cell.revealed ? 'bg-blue-500/30' : ''}
                  `}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell.number && (
                    <span className="absolute top-0 left-0.5 text-xs text-gray-300">{cell.number}</span>
                  )}
                  {!cell.isBlack && (
                    <span className="text-lg font-bold text-white">{cell.letter}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clues */}
      {currentPuzzle && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-white/10 backdrop-blur">
            <CardContent className="p-4">
              <h3 className="font-bold mb-2 text-white">Across</h3>
              <div className="space-y-1">
                {currentPuzzle.clues.across.map(clue => (
                  <div
                    key={clue.id}
                    className={`p-2 rounded cursor-pointer text-sm ${
                      selectedClue?.id === clue.id ? 'bg-blue-500/30' : 'hover:bg-white/10'
                    }`}
                    onClick={() => handleClueSelect(clue)}
                  >
                    <span className="font-bold mr-2">{clue.number}.</span>
                    <span className="text-gray-200">{clue.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur">
            <CardContent className="p-4">
              <h3 className="font-bold mb-2 text-white">Down</h3>
              <div className="space-y-1">
                {currentPuzzle.clues.down.map(clue => (
                  <div
                    key={clue.id}
                    className={`p-2 rounded cursor-pointer text-sm ${
                      selectedClue?.id === clue.id ? 'bg-blue-500/30' : 'hover:bg-white/10'
                    }`}
                    onClick={() => handleClueSelect(clue)}
                  >
                    <span className="font-bold mr-2">{clue.number}.</span>
                    <span className="text-gray-200">{clue.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hidden input for keyboard focus */}
      <input
        ref={inputRef}
        type="text"
        className="absolute -left-full opacity-0"
        aria-hidden="true"
      />

      {/* Game Over */}
      {gameState === 'completed' && (
        <Card className="bg-white/10 backdrop-blur">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-white">
                {correctAnswers === (currentPuzzle?.clues.across.length || 0) + (currentPuzzle?.clues.down.length || 0) 
                  ? 'Puzzle Complete!' 
                  : 'Time\'s Up!'}
              </h2>
              <div className="text-gray-300">
                <p>Final Score: {score}</p>
                <p>Words Completed: {correctAnswers}/{currentPuzzle ? currentPuzzle.clues.across.length + currentPuzzle.clues.down.length : 0}</p>
                <p>Hints Used: {hintsUsed}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={startGame} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </Button>
                <Button onClick={resetGame} variant="outline">
                  Back to Menu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function CrosswordWithLevels() {
  const getStars = (score: number, levelConfig: any): 1 | 2 | 3 => {
    const maxScore = (levelConfig.gridSize * levelConfig.gridSize) * 100 + levelConfig.timeLimit / 10
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 3
    if (percentage >= 50) return 2
    return 1
  }

  return (
    <GameWithLevels
      gameId="crossword"
      gameName="Crossword Puzzle"
      levels={levels}
      renderGame={(levelConfig, onScore) => (
        <CrosswordGame levelConfig={levelConfig} onScore={onScore} />
      )}
      getStars={getStars}
    />
  )
}