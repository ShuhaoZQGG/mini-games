'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  difficulty: 'easy' | 'medium' | 'hard'
  grid: Cell[][]
  clues: {
    across: Clue[]
    down: Clue[]
  }
}

// Sample puzzles with different themes
const PUZZLES: Puzzle[] = [
  {
    id: 'tech-easy',
    name: 'Technology Basics',
    difficulty: 'easy',
    grid: [],
    clues: {
      across: [
        { id: 1, number: 1, text: 'Computer pointing device', answer: 'MOUSE', direction: 'across', startRow: 0, startCol: 0, cells: [] },
        { id: 2, number: 4, text: 'Send electronic messages', answer: 'EMAIL', direction: 'across', startRow: 2, startCol: 0, cells: [] },
        { id: 3, number: 6, text: 'Global computer network', answer: 'WEB', direction: 'across', startRow: 4, startCol: 1, cells: [] },
        { id: 4, number: 7, text: 'Portable computer', answer: 'LAPTOP', direction: 'across', startRow: 6, startCol: 0, cells: [] },
      ],
      down: [
        { id: 5, number: 1, text: 'Large computer display', answer: 'MONITOR', direction: 'down', startRow: 0, startCol: 0, cells: [] },
        { id: 6, number: 2, text: 'Computer programs', answer: 'SOFTWARE', direction: 'down', startRow: 0, startCol: 2, cells: [] },
        { id: 7, number: 3, text: 'Online identity', answer: 'USER', direction: 'down', startRow: 0, startCol: 4, cells: [] },
        { id: 8, number: 5, text: 'Typing board', answer: 'KEYBOARD', direction: 'down', startRow: 2, startCol: 1, cells: [] },
      ]
    }
  },
  {
    id: 'animals-medium',
    name: 'Animal Kingdom',
    difficulty: 'medium',
    grid: [],
    clues: {
      across: [
        { id: 1, number: 1, text: 'King of the jungle', answer: 'LION', direction: 'across', startRow: 0, startCol: 1, cells: [] },
        { id: 2, number: 3, text: 'Striped horse', answer: 'ZEBRA', direction: 'across', startRow: 2, startCol: 0, cells: [] },
        { id: 3, number: 5, text: 'Large grey mammal with trunk', answer: 'ELEPHANT', direction: 'across', startRow: 4, startCol: 0, cells: [] },
        { id: 4, number: 7, text: 'Bear from China', answer: 'PANDA', direction: 'across', startRow: 6, startCol: 2, cells: [] },
      ],
      down: [
        { id: 5, number: 1, text: 'Slow-moving tree dweller', answer: 'SLOTH', direction: 'down', startRow: 0, startCol: 1, cells: [] },
        { id: 6, number: 2, text: 'Tall African animal', answer: 'GIRAFFE', direction: 'down', startRow: 0, startCol: 3, cells: [] },
        { id: 7, number: 4, text: 'Australian hopper', answer: 'KANGAROO', direction: 'down', startRow: 2, startCol: 1, cells: [] },
        { id: 8, number: 6, text: 'Black and white bird', answer: 'PENGUIN', direction: 'down', startRow: 3, startCol: 5, cells: [] },
      ]
    }
  },
  {
    id: 'science-hard',
    name: 'Science Challenge',
    difficulty: 'hard',
    grid: [],
    clues: {
      across: [
        { id: 1, number: 1, text: 'Smallest unit of matter', answer: 'ATOM', direction: 'across', startRow: 0, startCol: 0, cells: [] },
        { id: 2, number: 3, text: 'Force that attracts objects', answer: 'GRAVITY', direction: 'across', startRow: 2, startCol: 1, cells: [] },
        { id: 3, number: 5, text: 'Theory of evolution author', answer: 'DARWIN', direction: 'across', startRow: 4, startCol: 0, cells: [] },
        { id: 4, number: 7, text: 'Study of living things', answer: 'BIOLOGY', direction: 'across', startRow: 6, startCol: 2, cells: [] },
        { id: 5, number: 8, text: 'Chemical formula for water', answer: 'H2O', direction: 'across', startRow: 8, startCol: 0, cells: [] },
      ],
      down: [
        { id: 6, number: 1, text: 'Scientific procedure', answer: 'ALGORITHM', direction: 'down', startRow: 0, startCol: 0, cells: [] },
        { id: 7, number: 2, text: 'Particle with no charge', answer: 'NEUTRON', direction: 'down', startRow: 0, startCol: 2, cells: [] },
        { id: 8, number: 4, text: 'Speed of light particle', answer: 'PHOTON', direction: 'down', startRow: 2, startCol: 4, cells: [] },
        { id: 9, number: 6, text: 'DNA discoverer', answer: 'WATSON', direction: 'down', startRow: 4, startCol: 1, cells: [] },
      ]
    }
  }
]

export default function CrosswordGame() {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null)
  const [grid, setGrid] = useState<Cell[][]>([])
  const [selectedClue, setSelectedClue] = useState<Clue | null>(null)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'completed'>('menu')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [totalClues, setTotalClues] = useState(0)
  const [showErrors, setShowErrors] = useState(false)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const gridSize = 10

  // Generate grid from puzzle data
  const generateGrid = useCallback((puzzle: Puzzle): Cell[][] => {
    const newGrid: Cell[][] = Array(gridSize).fill(null).map(() => 
      Array(gridSize).fill(null).map(() => ({
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
        if (row < gridSize && col < gridSize) {
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
        if (row < gridSize && col < gridSize) {
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
  }, [])

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
    
    if (nextRow < gridSize && nextCol < gridSize && !grid[nextRow][nextCol].isBlack) {
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
        } else if (showErrors) {
          // Mark cells as incorrect
          clue.cells.forEach(cell => {
            currentGrid[cell.row][cell.col].correct = false
          })
        }
      }
    })
    
    setCorrectAnswers(correct)
    
    // Check if puzzle is complete
    if (correct === allClues.length) {
      setGameState('completed')
    }
  }, [currentPuzzle, showErrors])

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedCell || !grid[selectedCell.row][selectedCell.col]) return
      
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        handleCellInput(selectedCell.row, selectedCell.col, e.key)
      } else if (e.key === 'Backspace') {
        handleCellInput(selectedCell.row, selectedCell.col, '')
        // Move to previous cell
        if (selectedClue) {
          const prevRow = selectedClue.direction === 'down' ? selectedCell.row - 1 : selectedCell.row
          const prevCol = selectedClue.direction === 'across' ? selectedCell.col - 1 : selectedCell.col
          if (prevRow >= 0 && prevCol >= 0 && !grid[prevRow][prevCol].isBlack) {
            setSelectedCell({ row: prevRow, col: prevCol })
          }
        }
      } else if (e.key === 'Tab') {
        e.preventDefault()
        // Switch between across and down
        if (selectedClue && currentPuzzle) {
          const cell = grid[selectedCell.row][selectedCell.col]
          if (selectedClue.direction === 'across' && cell.partOfDown) {
            const downClue = currentPuzzle.clues.down.find(c => c.id === cell.partOfDown)
            if (downClue) handleClueSelect(downClue)
          } else if (selectedClue.direction === 'down' && cell.partOfAcross) {
            const acrossClue = currentPuzzle.clues.across.find(c => c.id === cell.partOfAcross)
            if (acrossClue) handleClueSelect(acrossClue)
          }
        }
      } else if (e.key === 'ArrowUp' && selectedCell.row > 0) {
        const newRow = selectedCell.row - 1
        if (!grid[newRow][selectedCell.col].isBlack) {
          setSelectedCell({ row: newRow, col: selectedCell.col })
        }
      } else if (e.key === 'ArrowDown' && selectedCell.row < gridSize - 1) {
        const newRow = selectedCell.row + 1
        if (!grid[newRow][selectedCell.col].isBlack) {
          setSelectedCell({ row: newRow, col: selectedCell.col })
        }
      } else if (e.key === 'ArrowLeft' && selectedCell.col > 0) {
        const newCol = selectedCell.col - 1
        if (!grid[selectedCell.row][newCol].isBlack) {
          setSelectedCell({ row: selectedCell.row, col: newCol })
        }
      } else if (e.key === 'ArrowRight' && selectedCell.col < gridSize - 1) {
        const newCol = selectedCell.col + 1
        if (!grid[selectedCell.row][newCol].isBlack) {
          setSelectedCell({ row: selectedCell.row, col: newCol })
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedCell, selectedClue, grid, currentPuzzle, handleCellInput, handleClueSelect])

  // Use hint
  const useHint = () => {
    if (!selectedCell || !selectedClue || !currentPuzzle) return
    
    const cell = selectedCell
    const answer = selectedClue.answer
    const index = selectedClue.direction === 'across' 
      ? cell.col - selectedClue.startCol
      : cell.row - selectedClue.startRow
    
    if (index >= 0 && index < answer.length) {
      handleCellInput(cell.row, cell.col, answer[index])
      setHintsUsed(prev => prev + 1)
    }
  }

  // Reveal letter
  const revealLetter = () => {
    if (!selectedCell || !currentPuzzle) return
    
    const cell = grid[selectedCell.row][selectedCell.col]
    let letter = ''
    
    // Find the correct letter from any clue containing this cell
    currentPuzzle.clues.across.forEach(clue => {
      const cellIndex = clue.cells.findIndex(c => c.row === selectedCell.row && c.col === selectedCell.col)
      if (cellIndex >= 0) {
        letter = clue.answer[cellIndex]
      }
    })
    
    if (!letter) {
      currentPuzzle.clues.down.forEach(clue => {
        const cellIndex = clue.cells.findIndex(c => c.row === selectedCell.row && c.col === selectedCell.col)
        if (cellIndex >= 0) {
          letter = clue.answer[cellIndex]
        }
      })
    }
    
    if (letter) {
      handleCellInput(selectedCell.row, selectedCell.col, letter)
      const newGrid = [...grid]
      newGrid[selectedCell.row][selectedCell.col].revealed = true
      setGrid(newGrid)
      setHintsUsed(prev => prev + 1)
    }
  }

  // Check puzzle
  const checkPuzzle = () => {
    setShowErrors(true)
    const newGrid = [...grid]
    checkWordCompletion(newGrid)
    setGrid(newGrid)
  }

  // Start game with selected puzzle
  const startGame = (puzzleId: string) => {
    const puzzle = PUZZLES.find(p => p.id === puzzleId)
    if (!puzzle) return
    
    setCurrentPuzzle(puzzle)
    const newGrid = generateGrid(puzzle)
    setGrid(newGrid)
    setTotalClues(puzzle.clues.across.length + puzzle.clues.down.length)
    setCorrectAnswers(0)
    setHintsUsed(0)
    setShowErrors(false)
    setSelectedClue(null)
    setSelectedCell(null)
    setGameState('playing')
  }

  // Reset game
  const resetGame = () => {
    setGameState('menu')
    setCurrentPuzzle(null)
    setGrid([])
    setSelectedClue(null)
    setSelectedCell(null)
    setHintsUsed(0)
    setCorrectAnswers(0)
    setShowErrors(false)
  }

  // Save progress
  useEffect(() => {
    if (currentPuzzle && gameState === 'playing') {
      const saveData = {
        puzzleId: currentPuzzle.id,
        grid: grid.map(row => row.map(cell => cell.letter)),
        hintsUsed,
        correctAnswers
      }
      localStorage.setItem('crossword-save', JSON.stringify(saveData))
    }
  }, [grid, currentPuzzle, hintsUsed, correctAnswers, gameState])

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <Card className="p-6 max-w-6xl w-full">
        <CardContent className="flex flex-col items-center gap-4 p-0">
          {gameState === 'menu' && (
            <div className="w-full">
              <h2 className="text-2xl font-bold mb-4 text-center">Select a Crossword Puzzle</h2>
              
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <div className="flex gap-2 justify-center">
                  {(['easy', 'medium', 'hard'] as const).map(level => (
                    <Button
                      key={level}
                      size="sm"
                      variant={difficulty === level ? 'default' : 'outline'}
                      onClick={() => setDifficulty(level)}
                      className="capitalize"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-4">
                {PUZZLES.filter(p => p.difficulty === difficulty).map(puzzle => (
                  <Card 
                    key={puzzle.id} 
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => startGame(puzzle.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg">{puzzle.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {puzzle.clues.across.length + puzzle.clues.down.length} clues • {puzzle.difficulty}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Button onClick={() => startGame(PUZZLES[0].id)}>
                  <Play className="w-4 h-4 mr-2" />
                  Quick Start
                </Button>
              </div>
            </div>
          )}

          {gameState === 'playing' && currentPuzzle && (
            <div className="w-full">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold">{currentPuzzle.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {correctAnswers} / {totalClues} complete • {hintsUsed} hints used
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={checkPuzzle} size="sm" variant="outline">
                    <Check className="w-4 h-4 mr-1" />
                    Check
                  </Button>
                  <Button onClick={revealLetter} size="sm" variant="outline">
                    <Lightbulb className="w-4 h-4 mr-1" />
                    Reveal
                  </Button>
                  <Button onClick={useHint} size="sm" variant="outline">
                    <HelpCircle className="w-4 h-4 mr-1" />
                    Hint
                  </Button>
                  <Button onClick={resetGame} size="sm" variant="outline">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Menu
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Grid */}
                <div className="flex justify-center">
                  <div 
                    className="grid gap-0 border-2 border-gray-800 dark:border-gray-200 inline-block"
                    style={{
                      gridTemplateColumns: `repeat(${gridSize}, 30px)`,
                    }}
                  >
                    {grid.map((row, rowIndex) => 
                      row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`
                            relative w-[30px] h-[30px] border border-gray-400 dark:border-gray-600
                            ${cell.isBlack ? 'bg-black' : 'bg-white dark:bg-gray-800'}
                            ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex 
                              ? 'ring-2 ring-blue-500 z-10' 
                              : ''}
                            ${selectedClue?.cells.some(c => c.row === rowIndex && c.col === colIndex)
                              ? 'bg-blue-100 dark:bg-blue-900'
                              : ''}
                            ${!cell.isBlack ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                            ${cell.correct && showErrors ? 'bg-green-100 dark:bg-green-900' : ''}
                            ${cell.letter && !cell.correct && showErrors ? 'bg-red-100 dark:bg-red-900' : ''}
                          `}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                        >
                          {cell.number && (
                            <span className="absolute top-0 left-0.5 text-[8px] font-bold">
                              {cell.number}
                            </span>
                          )}
                          {!cell.isBlack && (
                            <span className={`
                              absolute inset-0 flex items-center justify-center text-sm font-bold
                              ${cell.revealed ? 'text-blue-600' : 'text-gray-900 dark:text-gray-100'}
                            `}>
                              {cell.letter}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Clues */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center">
                      <ChevronRight className="w-4 h-4 mr-1" />
                      Across
                    </h3>
                    <div className="space-y-1">
                      {currentPuzzle.clues.across.map(clue => (
                        <div
                          key={clue.id}
                          className={`
                            p-2 rounded cursor-pointer text-sm
                            ${selectedClue?.id === clue.id 
                              ? 'bg-blue-100 dark:bg-blue-900' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                          `}
                          onClick={() => handleClueSelect(clue)}
                        >
                          <span className="font-semibold mr-2">{clue.number}.</span>
                          {clue.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center">
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Down
                    </h3>
                    <div className="space-y-1">
                      {currentPuzzle.clues.down.map(clue => (
                        <div
                          key={clue.id}
                          className={`
                            p-2 rounded cursor-pointer text-sm
                            ${selectedClue?.id === clue.id 
                              ? 'bg-blue-100 dark:bg-blue-900' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                          `}
                          onClick={() => handleClueSelect(clue)}
                        >
                          <span className="font-semibold mr-2">{clue.number}.</span>
                          {clue.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden input for mobile keyboard */}
              <input
                ref={inputRef}
                type="text"
                className="sr-only"
                value={inputValue}
                onChange={(e) => {
                  if (selectedCell) {
                    handleCellInput(selectedCell.row, selectedCell.col, e.target.value.slice(-1))
                    setInputValue('')
                  }
                }}
              />
            </div>
          )}

          {gameState === 'completed' && (
            <div className="text-center">
              <Award className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-2xl font-bold mb-2">Puzzle Complete!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You solved the puzzle using {hintsUsed} hints
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Puzzle
                </Button>
              </div>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
              Click a cell or clue to start. Type to fill in letters. Tab to switch direction.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}